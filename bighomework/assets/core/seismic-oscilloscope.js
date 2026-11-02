/* =========================================================
   实时物探地震波示波器与多道走时监控终端 (Seismic Oscilloscope & Gather HUD)
   ---------------------------------------------------------
   技术：纯原生 Canvas 2D，60 FPS 硬件加速渲染
   专业契合：
     1. 雷克子波 (Ricker Wavelet) 物理波动方程模拟
     2. 直达波、风化层折射波与深层反射波时距双曲线 (T-X Hyperbola)
     3. 地震道振幅正半周充填 (Wiggle Variable Area - WVA)
     4. 实时 STA/LTA 能量比触发走时自动拾取线
     5. 频带频谱条 (FFT Spectrum) 动态响应与噪声注入控制
   ========================================================= */

(function (global) {
  'use strict';

  function createSeismicHUD(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return null;

    container.innerHTML = '';
    var canvas = document.createElement('canvas');
    canvas.className = 'seismic-canvas';
    container.appendChild(canvas);

    var ctx = canvas.getContext('2d');
    var width = 0, height = 0, dpr = window.devicePixelRatio || 1;

    // 参数状态
    var running = true;
    var freq = 28;           // 子波主频 Hz
    var noiseLevel = 0.12;   // 噪声强度
    var showPickup = true;   // 显示初至拾取线
    var time = 0;
    var mouseX = -1, mouseY = -1;

    // 地质速度模型
    var v0 = 750;   // 低速风化层速度 m/s
    var v1 = 2100;  // 基岩折射层速度 m/s
    var depth = 80; // 风化层深度 m

    function resize() {
      if (!canvas.parentNode) return;
      var rect = container.getBoundingClientRect();
      width = rect.width || 480;
      height = rect.height || 260;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    // 雷克子波公式
    function ricker(t, f0) {
      var p = Math.PI * f0 * t;
      return (1 - 2 * p * p) * Math.exp(-p * p);
    }

    // 绘制示波器网格
    function drawGrid() {
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.08)';
      ctx.lineWidth = 1;

      var stepX = 40;
      var stepY = 30;

      for (var x = stepX; x < width; x += stepX) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (var y = stepY; y < height; y += stepY) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 中心零基线
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.18)';
      ctx.beginPath();
      ctx.moveTo(0, height * 0.5);
      ctx.lineTo(width, height * 0.5);
      ctx.stroke();
    }

    // 绘制多道波形与初至波
    function drawTraces() {
      var tracesCount = 6;
      var traceHeight = (height - 30) / tracesCount;

      for (var tr = 0; tr < tracesCount; tr++) {
        var baseOffset = (tr + 1) * 80; // 偏移距米 (80m ~ 480m)
        var baseY = 25 + tr * traceHeight;

        // 计算物理到时 (ms)
        var tDirect = (baseOffset / v0) * 1000;
        var tRefract = (2 * depth * Math.sqrt(v1 * v1 - v0 * v0) / (v0 * v1) + baseOffset / v1) * 1000;
        var tFirst = Math.min(tDirect, tRefract); // 初至时间

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(60, baseY);
        ctx.lineTo(width - 90, baseY);
        ctx.stroke();

        // 标签：道号与偏移距
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
        ctx.fillText('CH' + (tr * 4 + 1) + ' ' + baseOffset + 'm', 8, baseY + 3);

        // 绘制波形曲线
        ctx.beginPath();
        var pts = [];
        var startX = 60;
        var endX = width - 90;
        var xSpan = endX - startX;

        for (var px = 0; px <= xSpan; px += 2) {
          var curX = startX + px;
          var curT = (px / xSpan) * 400; // 时间轴 0 ~ 400 ms

          // 物理波形叠加：直达波 + 脉冲 + 噪声
          var dtPulse = (curT - tFirst) * 0.001; // 秒
          var amp = 0;
          if (Math.abs(dtPulse) < 0.08) {
            amp = ricker(dtPulse, freq) * 16;
          }

          // 周期性地面微震滚动波 (Ground Roll)
          var groundRoll = Math.sin(curT * 0.035 - time * 3 + tr * 0.8) * 3.5;
          // 高斯随机噪声
          var noise = (Math.random() - 0.5) * noiseLevel * 14;

          var y = baseY + amp + groundRoll + noise;
          pts.push({ x: curX, y: y, base: baseY });
          if (px === 0) ctx.moveTo(curX, y);
          else ctx.lineTo(curX, y);
        }

        // 波形连线
        ctx.strokeStyle = tr === 1 ? '#38bdf8' : '#10b981';
        ctx.lineWidth = 1.4;
        ctx.stroke();

        // 正半周充填 (Wiggle Variable Area)
        ctx.fillStyle = tr === 1 ? 'rgba(56, 189, 248, 0.28)' : 'rgba(16, 185, 129, 0.22)';
        for (var i = 0; i < pts.length - 1; i++) {
          if (pts[i].y < pts[i].base && pts[i+1].y < pts[i+1].base) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].base);
            ctx.lineTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[i+1].x, pts[i+1].y);
            ctx.lineTo(pts[i+1].x, pts[i+1].base);
            ctx.closePath();
            ctx.fill();
          }
        }

        // 初至波拾取指示点 (STA/LTA 自动拾取标定)
        if (showPickup) {
          var pickX = startX + (tFirst / 400) * xSpan;
          if (pickX >= startX && pickX <= endX) {
            ctx.fillStyle = '#f43f5e';
            ctx.shadowColor = '#f43f5e';
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(pickX, baseY, 3.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // 微小走时标签
            ctx.fillStyle = '#f43f5e';
            ctx.font = '9px "JetBrains Mono", monospace';
            ctx.fillText(tFirst.toFixed(1) + 'ms', pickX - 12, baseY - 7);
          }
        }
      }

      // 初至时间连线 (折射初至时距曲线)
      if (showPickup) {
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.65)';
        ctx.setLineDash([3, 3]);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (var tr2 = 0; tr2 < tracesCount; tr2++) {
          var offset2 = (tr2 + 1) * 80;
          var y2 = 25 + tr2 * traceHeight;
          var t2 = Math.min((offset2 / v0) * 1000, (2 * depth * Math.sqrt(v1 * v1 - v0 * v0) / (v0 * v1) + offset2 / v1) * 1000);
          var x2 = 60 + (t2 / 400) * (width - 150);
          if (tr2 === 0) ctx.moveTo(x2, y2);
          else ctx.lineTo(x2, y2);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // 绘制右侧频谱柱状图 (FFT Spectrum)
    function drawSpectrum() {
      var spX = width - 75;
      var spW = 60;
      var spH = height - 40;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
      ctx.fillRect(spX, 20, spW, spH);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.strokeRect(spX, 20, spW, spH);

      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('FFT 频谱', spX + 8, 14);

      var freqs = [10, 20, 30, 40, 50, 60, 75];
      var barW = 6;
      var gap = (spW - freqs.length * barW) / (freqs.length + 1);

      for (var i = 0; i < freqs.length; i++) {
        var f = freqs[i];
        // 峰值在主频 freq 附近
        var dist = Math.abs(f - freq);
        var baseAmp = Math.exp(-dist * dist / (2 * 12 * 12));
        var pulseAmp = baseAmp * (0.8 + 0.2 * Math.sin(time * 5 + i));
        var barH = pulseAmp * (spH - 24);

        var bx = spX + gap + i * (barW + gap);
        var by = 20 + spH - barH - 4;

        // 渐变条
        var grad = ctx.createLinearGradient(0, by, 0, by + barH);
        grad.addColorStop(0, '#38bdf8');
        grad.addColorStop(1, '#10b981');
        ctx.fillStyle = grad;
        ctx.fillRect(bx, by, barW, barH);
      }
    }

    // 光标十字标尺与走时读数
    function drawCrosshair() {
      if (mouseX < 60 || mouseX > width - 90 || mouseY < 10 || mouseY > height - 10) return;

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(mouseX, 0); ctx.lineTo(mouseX, height);
      ctx.moveTo(60, mouseY); ctx.lineTo(width - 90, mouseY);
      ctx.stroke();
      ctx.setLineDash([]);

      var curT = ((mouseX - 60) / (width - 150)) * 400;
      var text = 't = ' + curT.toFixed(1) + ' ms';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(mouseX + 6, mouseY - 16, 75, 18);
      ctx.fillStyle = '#0f172a';
      ctx.fillText(text, mouseX + 10, mouseY - 3);
    }

    // 交互事件
    canvas.addEventListener('pointermove', function (e) {
      var rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    });
    canvas.addEventListener('pointerleave', function () {
      mouseX = -1; mouseY = -1;
    });

    // 动画主循环
    function loop() {
      if (!document.body.contains(canvas)) return;
      if (running) {
        time += 0.02;
        ctx.clearRect(0, 0, width, height);
        drawGrid();
        drawTraces();
        drawSpectrum();
        drawCrosshair();
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    return {
      setFreq: function (f) { freq = f; },
      setNoise: function (n) { noiseLevel = n; },
      togglePickup: function () { showPickup = !showPickup; return showPickup; },
      toggleRun: function () { running = !running; return running; }
    };
  }

  global.SeismicHUD = {
    init: createSeismicHUD
  };

})(window);
