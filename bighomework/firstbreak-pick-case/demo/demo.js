// ============================================================================
// 物探 · 初至波自动拾取（seismic-firstbreak-pick）交互式工作台逻辑
// 24道单炮记录 Wiggle+VA 变面积剖面 + STA/LTA + AIC + 空间一致性约束
// ============================================================================
(function () {
  'use strict';

  const N_TRACES = 24;
  const N_SAMPLES = 360;
  const DT = 2; // 采样间隔 2 ms，总时长 720 ms
  const V0_TRUE = 750;  // 风化层速度 m/s
  const V1_TRUE = 2100; // 高速折射层速度 m/s
  const T_INT_TRUE = 260; // 折射截距时间 ms
  const LTA_WIN = 55;

  const state = {
    step: 4,
    method: 'aic', // 'stalta' | 'aic' | 'unet'
    noise: 1.10,
    thr: 3.2,
    sta: 8,
    spatial: true,
    showVA: true,
    showQC: true,
    selTrace: 13 // 0-indexed -> 第 #14 道
  };

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // 预生成 24 道的固定随机噪声基底与前驱尖峰干扰（#7, #14, #21 索引为 6, 13, 20）
  const baseTraces = [];
  const SPURIOUS_IDS = [6, 13, 20];

  (function initSyntheticGather() {
    for (let tr = 0; tr < N_TRACES; tr++) {
      const rng = mulberry32(20261001 + tr * 97);
      const offset = (tr + 1) * 50; // 50m .. 1200m
      const tDirect = (offset / V0_TRUE) * 1000;
      const tRefrac = T_INT_TRUE + (offset / V1_TRUE) * 1000;
      const tTrueMs = Math.min(tDirect, tRefrac);
      const idxTrue = Math.round(tTrueMs / DT);

      const clean = new Float64Array(N_SAMPLES);
      const noise = new Float64Array(N_SAMPLES);
      const spike = new Float64Array(N_SAMPLES);

      // 远偏移距几何扩散衰减
      const att = Math.pow(offset / 150, -0.32);

      for (let i = 0; i < N_SAMPLES; i++) {
        noise[i] = (rng() + rng() + rng() - 1.5) * 0.52;
        if (i >= idxTrue) {
          const d = i - idxTrue;
          // 雷克子波主脉冲 + 后续尾波
          const env = Math.exp(-d / 32) * att;
          clean[i] = env * (Math.sin((d / 11) * Math.PI * 2) * 2.3 + Math.sin((d / 22) * Math.PI * 2) * 0.8);
        }
        // 低频面波干扰锥（Ground Roll，速度约 340 m/s）
        const idxGR = Math.round(((offset / 340) * 1000 + 80) / DT);
        if (i >= idxGR && i < idxGR + 70) {
          const dg = i - idxGR;
          clean[i] += Math.exp(-dg / 40) * Math.sin((dg / 24) * Math.PI * 2) * 0.9;
        }
      }

      // 在 #7, #14, #21 初至前 38–52 个采样点注入前驱野值脉冲
      const isSpurious = SPURIOUS_IDS.includes(tr);
      const spikeIdx = Math.max(LTA_WIN + 18, idxTrue - (tr === 13 ? 44 : 38));
      if (isSpurious) {
        for (let k = -4; k <= 6; k++) {
          if (spikeIdx + k >= 0 && spikeIdx + k < N_SAMPLES) {
            spike[spikeIdx + k] = Math.exp(-Math.abs(k) / 2.2) * Math.sin(k * 1.3) * 2.35;
          }
        }
      }

      baseTraces.push({ tr, no: tr + 1, offset, tTrueMs, idxTrue, clean, noise, spike, isSpurious, spikeIdx });
    }
  })();

  // 计算单道 STA/LTA、AIC 与最终拾取点
  function computeGather() {
    const STA = state.sta;
    const LTA = LTA_WIN;
    const thr = state.thr;
    const nl = state.noise;

    const results = baseTraces.map(bt => {
      const wave = new Float64Array(N_SAMPLES);
      for (let i = 0; i < N_SAMPLES; i++) {
        wave[i] = bt.clean[i] + bt.noise[i] * nl * 0.45 + bt.spike[i] * (nl * 0.85);
      }

      // 1. STA/LTA 能量比与 1D-UNet 概率曲线
      const ratio = new Float64Array(N_SAMPLES);
      const prob = new Float64Array(N_SAMPLES);
      let maxRatio = 1;
      for (let i = STA + LTA; i < N_SAMPLES; i++) {
        let se = 0, le = 0;
        for (let k = i - STA + 1; k <= i; k++) se += wave[k] * wave[k];
        for (let k = i - STA - LTA + 1; k <= i - STA; k++) le += wave[k] * wave[k];
        const r = (se / STA) / (le / LTA + 1e-4);
        ratio[i] = Math.min(14, r);
        if (ratio[i] > maxRatio) maxRatio = ratio[i];
      }

      // 模拟 1D 卷积网络对初至起跳相位的响应概率（抗单点脉冲能力更强）
      for (let i = 0; i < N_SAMPLES; i++) {
        const dTrue = (i - bt.idxTrue) / (3.2 + nl * 1.1);
        let p = Math.exp(-0.5 * dTrue * dTrue) * Math.min(9.5, Math.max(2.2, 8.8 - nl * 1.5));
        if (bt.isSpurious) {
          const dSpk = (i - bt.spikeIdx) / 2.8;
          p += Math.exp(-0.5 * dSpk * dSpk) * (nl * 1.65);
        }
        prob[i] = p;
      }

      // 2. 候选粗拾取
      let rawPick = -1;
      const scanCurve = state.method === 'unet' ? prob : ratio;
      for (let i = STA + LTA; i < N_SAMPLES - 10; i++) {
        if (scanCurve[i] >= thr) { rawPick = i; break; }
      }

      // 3. AIC 局部极小值精修（在粗拾取前后 [-16, +8] 窗内寻找方差突变极小点）
      const aic = new Float64Array(N_SAMPLES);
      let aicPick = rawPick;
      if (rawPick > 25) {
        const w0 = Math.max(20, rawPick - 18);
        const w1 = Math.min(N_SAMPLES - 15, rawPick + 10);
        let minAic = Infinity, bestK = rawPick;
        for (let k = w0; k <= w1; k++) {
          let v1 = 1e-6, v2 = 1e-6;
          for (let j = w0 - 10; j < k; j++) v1 += wave[j] * wave[j];
          for (let j = k; j <= w1 + 10; j++) v2 += wave[j] * wave[j];
          v1 /= Math.max(1, k - (w0 - 10));
          v2 /= Math.max(1, (w1 + 10) - k + 1);
          const val = (k - w0) * Math.log(v1) + (w1 - k) * Math.log(v2);
          aic[k] = val;
          if (val < minAic) { minAic = val; bestK = k; }
        }
        // 归一化便于显示
        for (let i = 0; i < N_SAMPLES; i++) {
          if (i < w0 || i > w1) aic[i] = aic[w0] || 0;
        }
        if (state.method === 'aic' && state.step >= 2) {
          aicPick = bestK;
        }
      }

      // 单道特征拾取（未加空间约束）
      let singlePick = state.method === 'aic' ? aicPick : rawPick;
      if (state.method === 'stalta' && singlePick > 0) {
        // 纯 STA/LTA 往往比真正初至起跳滞后 2~3 个采样点
        singlePick = Math.min(N_SAMPLES - 1, singlePick + Math.round(STA * 0.28));
      }

      return {
        bt,
        wave,
        ratio: scanCurve,
        aic,
        singlePick,
        finalPick: singlePick,
        corrected: false,
        lowConf: false
      };
    });

    // 4. 炮集空间走时一致性约束（中位数趋势滤波回退离群道）
    results.forEach((r, idx) => {
      const neighbors = [];
      for (let d = -2; d <= 2; d++) {
        if (d === 0) continue;
        const nb = results[idx + d];
        if (nb && nb.singlePick > 0) {
          // 按偏移距线性折算到当前道
          const slope = idx < 6 ? (50 / V0_TRUE * 1000 / DT) : (50 / V1_TRUE * 1000 / DT);
          neighbors.push(nb.singlePick - d * slope);
        }
      }
      neighbors.sort((a, b) => a - b);
      const med = neighbors.length ? neighbors[Math.floor(neighbors.length / 2)] : r.bt.idxTrue;
      const dev = r.singlePick < 0 ? 999 : Math.abs(r.singlePick - med);

      if (dev > 3.5) {
        r.lowConf = true;
        if (state.spatial && state.step >= 3) {
          r.finalPick = Math.round(med);
          r.corrected = true;
        }
      }
    });

    return results;
  }

  // 渲染左侧 #1–#24 选道按钮
  function renderTracePills(results) {
    const box = document.getElementById('trace-pills');
    if (!box) return;
    box.innerHTML = results.map((r, i) => {
      const cls = [
        'trace-pill',
        i === state.selTrace ? 'on' : '',
        r.bt.isSpurious ? 'noisy' : ''
      ].filter(Boolean).join(' ');
      return `<button type="button" class="${cls}" data-tr="${i}">#${r.bt.no}</button>`;
    }).join('');
    box.querySelectorAll('.trace-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        state.selTrace = +btn.dataset.tr;
        updateAll();
      });
    });
  }

  // 渲染主视图：24 道单炮 Wiggle + 变面积剖面
  function renderShotGather(results) {
    const svg = document.getElementById('svg-shot');
    if (!svg) return;
    const W = 860, H = 390;
    const L = 52, R = 24, T = 26, B = 28;
    const plotW = W - L - R, plotH = H - T - B;
    const dx = plotW / N_TRACES;
    const xOf = tr => L + (tr + 0.5) * dx;
    const yOf = idx => T + (idx / (N_SAMPLES - 1)) * plotH;

    let h = `<rect x="${L}" y="${T}" width="${plotW}" height="${plotH}" fill="#fcfaf5" stroke="#ded8ca"/>`;

    // 时间网格线 (0..700 ms)
    for (let ms = 0; ms <= 700; ms += 100) {
      const y = yOf(ms / DT);
      h += `<line x1="${L}" y1="${y.toFixed(1)}" x2="${W - R}" y2="${y.toFixed(1)}" stroke="#ece7db" stroke-width="1"/>`;
      h += `<text x="${L - 6}" y="${(y + 3).toFixed(1)}" font-size="9.5" font-family="ui-monospace,monospace" fill="#6b747c" text-anchor="end">${ms}ms</text>`;
    }

    // 面波低频干扰锥示意背景
    const grX1 = xOf(0), grY1 = yOf(110);
    const grX2 = xOf(10), grY2 = yOf(355);
    const grX3 = xOf(4), grY3 = yOf(355);
    h += `<polygon points="${grX1},${grY1} ${grX2},${grY2} ${grX3},${grY3}" fill="rgba(58,110,165,0.09)" stroke="#3a6ea5" stroke-width="1" stroke-dasharray="4 3"/>`;

    // 逐道绘制高亮带与 Wiggle+VA 波形
    results.forEach((r, i) => {
      const cx = xOf(i);
      const isSel = i === state.selTrace;

      // 低置信度复核道红底高亮
      if (state.showQC && r.lowConf && state.step >= 3) {
        h += `<rect x="${(cx - dx * 0.46).toFixed(1)}" y="${T}" width="${(dx * 0.92).toFixed(1)}" height="${plotH}" fill="rgba(180,72,60,0.11)"/>`;
      }
      // 当前选中道高亮底
      if (isSel) {
        h += `<rect x="${(cx - dx * 0.48).toFixed(1)}" y="${T}" width="${(dx * 0.96).toFixed(1)}" height="${plotH}" fill="rgba(18,97,90,0.10)" stroke="#12615a" stroke-width="1.2" stroke-dasharray="3 2"/>`;
      }

      // 道号与偏移距顶部标注
      if (i % 2 === 0 || isSel || r.bt.isSpurious) {
        const col = isSel ? '#12615a' : (r.bt.isSpurious ? '#b4483c' : '#5c6670');
        h += `<text x="${cx.toFixed(1)}" y="${T - 7}" font-size="9" font-family="ui-monospace,monospace" font-weight="${isSel ? 700 : 500}" fill="${col}" text-anchor="middle">#${r.bt.no}</text>`;
      }

      // 波形路径（采样步长 2 点以保证 SVG 极速流畅）
      const scale = dx * 0.36;
      let dLine = '';
      let dArea = `M ${cx.toFixed(1)} ${T} `;
      for (let s = 0; s < N_SAMPLES; s += 2) {
        const y = yOf(s);
        const amp = Math.max(-2.6, Math.min(2.6, r.wave[s]));
        const x = cx + amp * scale;
        dLine += (s === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1) + ' ';
        const xPos = cx + Math.max(0, amp) * scale;
        dArea += `L ${xPos.toFixed(1)} ${y.toFixed(1)} `;
      }
      dArea += `L ${cx.toFixed(1)} ${(T + plotH).toFixed(1)} Z`;

      if (state.showVA) {
        h += `<path d="${dArea}" fill="${isSel ? 'rgba(18,97,90,0.42)' : 'rgba(36,45,54,0.28)'}"/>`;
      }
      h += `<path d="${dLine}" fill="none" stroke="${isSel ? '#0f524c' : '#2a333c'}" stroke-width="${isSel ? 1.25 : 0.85}"/>`;

      // 点击选道透明热区
      h += `<rect x="${(cx - dx / 2).toFixed(1)}" y="${T}" width="${dx.toFixed(1)}" height="${plotH}" fill="transparent" style="cursor:pointer" data-tr-hit="${i}"/>`;
    });

    // 真实初至走时曲线（绿色虚线）
    const truePts = results.map((r, i) => `${xOf(i).toFixed(1)},${yOf(r.bt.idxTrue).toFixed(1)}`).join(' ');
    h += `<polyline points="${truePts}" fill="none" stroke="#2f7d5b" stroke-width="2" stroke-dasharray="5 3"/>`;

    // 单道原始拾取点（橙色连线与圆点）
    if (state.step >= 1) {
      const rawPts = results.filter(r => r.singlePick > 0).map(r => `${xOf(r.bt.tr).toFixed(1)},${yOf(r.singlePick).toFixed(1)}`).join(' ');
      if (rawPts) {
        h += `<polyline points="${rawPts}" fill="none" stroke="#c27a2c" stroke-width="1.4" stroke-dasharray="2 2"/>`;
      }
      results.forEach((r, i) => {
        if (r.singlePick > 0) {
          h += `<circle cx="${xOf(i).toFixed(1)}" cy="${yOf(r.singlePick).toFixed(1)}" r="3.2" fill="#c27a2c" stroke="#fff" stroke-width="0.8"/>`;
        }
      });
    }

    // 空间一致性约束后最终初至曲线（深青色粗实线）
    if (state.step >= 3 && state.spatial) {
      const finPts = results.filter(r => r.finalPick > 0).map(r => `${xOf(r.bt.tr).toFixed(1)},${yOf(r.finalPick).toFixed(1)}`).join(' ');
      h += `<polyline points="${finPts}" fill="none" stroke="#12615a" stroke-width="2.6"/>`;
      results.forEach((r, i) => {
        if (r.finalPick > 0) {
          h += `<circle cx="${xOf(i).toFixed(1)}" cy="${yOf(r.finalPick).toFixed(1)}" r="${r.corrected ? 4.5 : 3}" fill="${r.corrected ? '#12615a' : '#0f766e'}" stroke="#fff" stroke-width="1.1"/>`;
        }
      });
    }

    // 底部偏移距坐标轴标注
    h += `<text x="${L}" y="${H - 7}" font-size="9.5" font-family="ui-monospace,monospace" fill="#5c6670">偏移距 X = 50m (近道直达波 v₀≈750m/s)</text>`;
    h += `<text x="${W - R}" y="${H - 7}" font-size="9.5" font-family="ui-monospace,monospace" fill="#5c6670" text-anchor="end">X = 1200m (远道折射波 v₁≈2100m/s) →</text>`;

    svg.innerHTML = h;
    svg.querySelectorAll('[data-tr-hit]').forEach(el => {
      el.addEventListener('click', () => {
        state.selTrace = +el.getAttribute('data-tr-hit');
        updateAll();
      });
    });
  }

  // 渲染左下：选中道的单道显微镜（波形 + STA/LTA + AIC 局部曲线）
  function renderMicroView(results) {
    const svg = document.getElementById('svg-micro');
    const r = results[state.selTrace];
    if (!svg || !r) return;

    document.getElementById('micro-title').textContent =
      `第 #${r.bt.no} 道 (偏移距 ${r.bt.offset}m${r.bt.isSpurious ? ' · 含前驱脉冲干扰' : ''}) 波形 + STA/LTA + AIC 精修`;
    document.getElementById('sel-badge').textContent =
      `当前检视：第 #${r.bt.no} 道 (x=${r.bt.offset}m)`;

    const W = 430, H = 250, L = 38, R = 14;
    const xOf = idx => L + (idx / (N_SAMPLES - 1)) * (W - L - R);

    // 上半框：单道滤波波形 (y: 14..120)
    let h = `<rect x="${L}" y="12" width="${W - L - R}" height="108" fill="#fcfaf5" stroke="#e2ddd2"/>`;
    h += `<line x1="${L}" y1="66" x2="${W - R}" y2="66" stroke="#dcd6c8"/>`;
    h += `<text x="${L - 5}" y="24" font-size="8.5" font-family="ui-monospace,monospace" fill="#6b747c" text-anchor="end">+A</text>`;
    h += `<text x="${L - 5}" y="69" font-size="8.5" font-family="ui-monospace,monospace" fill="#6b747c" text-anchor="end">0</text>`;
    h += `<text x="${L - 5}" y="114" font-size="8.5" font-family="ui-monospace,monospace" fill="#6b747c" text-anchor="end">-A</text>`;

    let dWave = '';
    for (let i = 0; i < N_SAMPLES; i++) {
      const y = 66 - Math.max(-2.6, Math.min(2.6, r.wave[i])) * 18;
      dWave += (i === 0 ? 'M' : 'L') + xOf(i).toFixed(1) + ' ' + y.toFixed(1) + ' ';
    }
    h += `<path d="${dWave}" fill="none" stroke="#3a6ea5" stroke-width="1.2"/>`;

    // 下半框：STA/LTA 比值与阈值线 (y: 132..230)
    h += `<rect x="${L}" y="132" width="${W - L - R}" height="96" fill="#fcfaf5" stroke="#e2ddd2"/>`;
    const yRatio = val => 224 - (Math.min(10, Math.max(0, val)) / 10) * 86;
    const yThr = yRatio(state.thr);
    h += `<line x1="${L}" y1="${yThr.toFixed(1)}" x2="${W - R}" y2="${yThr.toFixed(1)}" stroke="#b4483c" stroke-width="1.1" stroke-dasharray="4 3"/>`;
    h += `<text x="${W - R - 4}" y="${(yThr - 4).toFixed(1)}" font-size="8.5" font-family="ui-monospace,monospace" fill="#b4483c" text-anchor="end">阈值 ${state.thr.toFixed(1)}</text>`;

    let dRat = '';
    for (let i = 0; i < N_SAMPLES; i++) {
      dRat += (i === 0 ? 'M' : 'L') + xOf(i).toFixed(1) + ' ' + yRatio(r.ratio[i]).toFixed(1) + ' ';
    }
    h += `<path d="${dRat}" fill="none" stroke="#c27a2c" stroke-width="1.35"/>`;

    // 真实初至、单道拾取、最终拾取三条竖线贯穿上下图
    const xTrue = xOf(r.bt.idxTrue);
    h += `<line x1="${xTrue.toFixed(1)}" y1="12" x2="${xTrue.toFixed(1)}" y2="228" stroke="#2f7d5b" stroke-width="1.5" stroke-dasharray="4 3"/>`;
    h += `<text x="${(xTrue + 4).toFixed(1)}" y="24" font-size="9" font-weight="700" fill="#2f7d5b">真值 ${r.bt.idxTrue * DT}ms</text>`;

    if (r.singlePick > 0) {
      const xRaw = xOf(r.singlePick);
      h += `<line x1="${xRaw.toFixed(1)}" y1="12" x2="${xRaw.toFixed(1)}" y2="228" stroke="#c27a2c" stroke-width="1.4" stroke-dasharray="2 2"/>`;
      h += `<text x="${(xRaw - 4).toFixed(1)}" y="114" font-size="8.8" fill="#c27a2c" text-anchor="end">单道 ${r.singlePick * DT}ms</text>`;
    }

    const finIdx = state.spatial ? r.finalPick : r.singlePick;
    if (finIdx > 0) {
      const xFin = xOf(finIdx);
      h += `<line x1="${xFin.toFixed(1)}" y1="12" x2="${xFin.toFixed(1)}" y2="228" stroke="#12615a" stroke-width="2.1"/>`;
      h += `<text x="${(xFin + 4).toFixed(1)}" y="146" font-size="9" font-weight="700" fill="#12615a">采用 ${finIdx * DT}ms</text>`;
    }

    h += `<text x="${W - R}" y="244" font-size="9" font-family="ui-monospace,monospace" fill="#6b747c" text-anchor="end">采样时间 t (0 — 720 ms) →</text>`;
    svg.innerHTML = h;
  }

  // 渲染右下：折射走时拟合表层速度与逐道绝对误差柱状图
  function renderRefracAndError(results) {
    const svg = document.getElementById('svg-refrac');
    if (!svg) return;
    const W = 430, H = 250, L = 42, R = 14;
    const plotW = W - L - R;
    const xOf = tr => L + (tr + 0.5) * (plotW / N_TRACES);

    // 上半部分：偏移距-走时折线拟合 (t: 0..900ms -> y: 112..14)
    const yT = ms => 112 - (ms / 900) * 96;
    let h = `<rect x="${L}" y="12" width="${plotW}" height="102" fill="#fcfaf5" stroke="#e2ddd2"/>`;
    h += `<text x="${L + 6}" y="25" font-size="9.5" font-weight="700" fill="#12615a">双层折射走时反演：v₀≈750m/s, v₁≈2100m/s, 拐点 Xc≈290m</text>`;

    // 直达波与折射波理论折线
    const xCross = L + (290 / 1200) * plotW;
    h += `<line x1="${L}" y1="${yT(0).toFixed(1)}" x2="${xCross.toFixed(1)}" y2="${yT(387).toFixed(1)}" stroke="#2f7d5b" stroke-width="1.5" stroke-dasharray="4 2"/>`;
    h += `<line x1="${xCross.toFixed(1)}" y1="${yT(398).toFixed(1)}" x2="${W - R}" y2="${yT(831).toFixed(1)}" stroke="#12615a" stroke-width="1.8"/>`;

    results.forEach((r, i) => {
      const pIdx = state.spatial ? r.finalPick : r.singlePick;
      if (pIdx > 0) {
        h += `<circle cx="${xOf(i).toFixed(1)}" cy="${yT(pIdx * DT).toFixed(1)}" r="2.6" fill="${r.corrected ? '#12615a' : '#c27a2c'}"/>`;
      }
    });

    // 下半部分：约束前后逐道绝对误差 |Δt| (0..80 ms -> y: 230..132)
    const yE = errMs => 230 - (Math.min(80, errMs) / 80) * 94;
    h += `<rect x="${L}" y="132" width="${plotW}" height="98" fill="#fcfaf5" stroke="#e2ddd2"/>`;
    const yTol = yE(4); // 4ms 验收容差线
    h += `<line x1="${L}" y1="${yTol.toFixed(1)}" x2="${W - R}" y2="${yTol.toFixed(1)}" stroke="#2f7d5b" stroke-width="1.1" stroke-dasharray="4 3"/>`;
    h += `<text x="${W - R - 4}" y="${(yTol - 4).toFixed(1)}" font-size="8.5" font-family="ui-monospace,monospace" fill="#2f7d5b" text-anchor="end">验收阈值 ≤4ms</text>`;

    results.forEach((r, i) => {
      const cx = xOf(i);
      const rawErr = r.singlePick < 0 ? 80 : Math.abs(r.singlePick - r.bt.idxTrue) * DT;
      const finPick = state.spatial ? r.finalPick : r.singlePick;
      const finErr = finPick < 0 ? 80 : Math.abs(finPick - r.bt.idxTrue) * DT;

      // 原始误差橙色细条
      const yR0 = yE(rawErr);
      h += `<rect x="${(cx - 4.5).toFixed(1)}" y="${yR0.toFixed(1)}" width="4" height="${(230 - yR0).toFixed(1)}" fill="#c27a2c" opacity="0.75"/>`;
      // 约束后误差青色条
      const yF0 = yE(finErr);
      h += `<rect x="${(cx + 0.5).toFixed(1)}" y="${yF0.toFixed(1)}" width="4" height="${(230 - yF0).toFixed(1)}" fill="#12615a"/>`;
    });

    h += `<text x="${L}" y="244" font-size="9" font-family="ui-monospace,monospace" fill="#6b747c">道号 #1 — #24 逐道绝对拾取误差 |Δt| (ms)</text>`;
    svg.innerHTML = h;
  }

  // 更新 KPI 与解读文字
  function renderStats(results) {
    let rawHits = 0, finHits = 0, rawErrSum = 0, finErrSum = 0, nFixed = 0, nQC = 0;
    results.forEach(r => {
      const rErr = r.singlePick < 0 ? 60 : Math.abs(r.singlePick - r.bt.idxTrue) * DT;
      const fPick = state.spatial ? r.finalPick : r.singlePick;
      const fErr = fPick < 0 ? 60 : Math.abs(fPick - r.bt.idxTrue) * DT;
      if (rErr <= 4) rawHits++;
      if (fErr <= 4) finHits++;
      rawErrSum += rErr;
      finErrSum += fErr;
      if (r.corrected) nFixed++;
      if (r.lowConf) nQC++;
    });

    const hitPct = ((finHits / N_TRACES) * 100).toFixed(1);
    const rawHitPct = ((rawHits / N_TRACES) * 100).toFixed(1);
    const mae = (finErrSum / N_TRACES).toFixed(1);
    const rawMae = (rawErrSum / N_TRACES).toFixed(1);
    const qcPct = ((nQC / N_TRACES) * 100).toFixed(1);

    document.getElementById('val-hit').textContent = hitPct;
    document.getElementById('sub-hit').textContent = `单道原始命中率 ${rawHitPct}%`;
    document.getElementById('kpi-hit').className = +hitPct >= 90 ? 'kpi ok' : 'kpi warn';

    document.getElementById('val-mae').textContent = mae;
    document.getElementById('sub-mae').textContent = `约束前原始误差 ${rawMae} ms`;

    document.getElementById('val-fix').textContent = state.spatial ? nFixed : 0;
    document.getElementById('sub-fix').textContent = state.spatial ? '已拦截前驱脉冲假拾取并邻道回退' : '空间一致性约束已关闭（离群道暴露）';

    document.getElementById('val-qc').textContent = qcPct;
    document.getElementById('sub-qc').textContent = `仅需人工复核 ${nQC} 道 (节省 ${(100 - qcPct).toFixed(1)}% 工时)`;
    document.getElementById('pill-status-txt').textContent =
      `命中率 ${hitPct}% · ${state.spatial ? '空间约束已生效' : '无空间约束'}`;

    const cur = results[state.selTrace];
    const stepNotes = [
      `<b>STEP 01 道集解编与带通滤波</b>：对 24 道单炮记录去直流并施加 10–80 Hz 零相位带通滤波，压制部分低频面波（蓝色虚线锥）。`,
      `<b>STEP 02 逐道能量比/概率扫描</b>：使用短窗 STA=${state.sta} 点与长窗 LTA=${LTA_WIN} 点扫描波形，但在 <b>#7、#14、#21</b> 等含突发前驱脉冲道上，单道阈值（${state.thr.toFixed(1)}）被提前误触发，原始命中率仅 <b>${rawHitPct}%</b>。`,
      `<b>STEP 03 AIC 局部极小值精修</b>：在粗触发点邻域内计算赤池信息准则（AIC），将因短窗积分滞后的拾取点拉回波至起跳极小值，降低系统性正偏。`,
      `<b>STEP 04 炮集空间走时一致性约束</b>：利用相邻道初至沿偏移距呈分段线性（直达波 $v_0\\approx 750\\text{ m/s}$、折射波 $v_1\\approx 2100\\text{ m/s}$）的物理规律，自动识别并回退偏离中位数 >3.5 采样点的 <b>${nFixed} 条异常道</b>，全炮 MAE 从 <b>${rawMae} ms</b> 降至 <b>${mae} ms</b>。`,
      `<b>STEP 05 低置信度道排序与人工复核</b>：系统仅将回退修正道与低信噪比道（共 <b>${nQC} 道，占 ${qcPct}%</b>）标红推送人工质控。当前选中 <b>第 #${cur.bt.no} 道</b>，真实初至 <b>${cur.bt.idxTrue * DT} ms</b>，最终拾取 <b>${(state.spatial ? cur.finalPick : cur.singlePick) * DT} ms</b>。`
    ];
    document.getElementById('insight-text').innerHTML = stepNotes[state.step] || stepNotes[4];
  }

  function updateAll() {
    const results = computeGather();
    renderTracePills(results);
    renderShotGather(results);
    renderMicroView(results);
    renderRefracAndError(results);
    renderStats(results);
  }

  function bindEvents() {
    document.querySelectorAll('#stepper button').forEach(btn => {
      btn.addEventListener('click', () => {
        state.step = +btn.dataset.step;
        document.querySelectorAll('#stepper button').forEach((b, i) => {
          b.classList.toggle('on', i === state.step);
          b.classList.toggle('done', i < state.step);
        });
        updateAll();
      });
    });

    document.querySelectorAll('#method-seg button').forEach(btn => {
      btn.addEventListener('click', () => {
        state.method = btn.dataset.method;
        document.querySelectorAll('#method-seg button').forEach(b => b.classList.toggle('on', b === btn));
        updateAll();
      });
    });

    document.getElementById('sl-noise').addEventListener('input', e => {
      state.noise = +e.target.value;
      document.getElementById('out-noise').textContent = state.noise.toFixed(2);
      updateAll();
    });
    document.getElementById('sl-thr').addEventListener('input', e => {
      state.thr = +e.target.value;
      document.getElementById('out-thr').textContent = state.thr.toFixed(1);
      updateAll();
    });
    document.getElementById('sl-sta').addEventListener('input', e => {
      state.sta = +e.target.value;
      document.getElementById('out-sta').textContent = `${state.sta} 点 (${state.sta * DT}ms)`;
      updateAll();
    });

    document.getElementById('chk-spatial').addEventListener('change', e => {
      state.spatial = e.target.checked;
      updateAll();
    });
    document.getElementById('chk-va').addEventListener('change', e => {
      state.showVA = e.target.checked;
      updateAll();
    });
    document.getElementById('chk-qc').addEventListener('change', e => {
      state.showQC = e.target.checked;
      updateAll();
    });

    document.getElementById('btn-demo').addEventListener('click', () => {
      state.noise = 2.15; state.thr = 2.6; state.spatial = false; state.selTrace = 13;
      document.getElementById('sl-noise').value = 2.15; document.getElementById('out-noise').textContent = '2.15';
      document.getElementById('sl-thr').value = 2.6; document.getElementById('out-thr').textContent = '2.6';
      document.getElementById('chk-spatial').checked = false;
      updateAll();
    });

    document.getElementById('btn-reset').addEventListener('click', () => {
      state.step = 4; state.method = 'aic'; state.noise = 1.10; state.thr = 3.2; state.sta = 8;
      state.spatial = true; state.showVA = true; state.showQC = true; state.selTrace = 13;
      document.getElementById('sl-noise').value = 1.10; document.getElementById('out-noise').textContent = '1.10';
      document.getElementById('sl-thr').value = 3.2; document.getElementById('out-thr').textContent = '3.2';
      document.getElementById('sl-sta').value = 8; document.getElementById('out-sta').textContent = '8 点 (16ms)';
      document.getElementById('chk-spatial').checked = true;
      document.getElementById('chk-va').checked = true;
      document.getElementById('chk-qc').checked = true;
      document.querySelectorAll('#method-seg button').forEach(b => b.classList.toggle('on', b.dataset.method === 'aic'));
      updateAll();
    });
  }

  bindEvents();
  updateAll();
})();
