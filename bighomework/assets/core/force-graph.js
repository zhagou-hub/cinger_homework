/* =========================================================
   全流程神经元引力拓扑网 (Neural-Geology Force Graph)
   ---------------------------------------------------------
   技术：纯原生 Canvas 2D，物理弹簧阻尼引力场算法 (Force-Directed)
   特性：
     1. 5 大 AI 算法流派作为引力中心枢纽
     2. 13 个工业作业环节作为环绕星系节点
     3. 61 个候选场景关系弹性弹簧与能量脉冲粒子流
     4. 悬停/点击高亮对应方法流派，平滑吸引收拢
     5. 鼠标自由拖拽节点，弹性物理回弹
   ========================================================= */

(function (global) {
  'use strict';

  function createForceGraph(containerId, options) {
    var container = document.getElementById(containerId);
    if (!container) return null;

    options = options || {};
    container.innerHTML = '';
    var canvas = document.createElement('canvas');
    canvas.className = 'force-graph-canvas';
    container.appendChild(canvas);

    var ctx = canvas.getContext('2d');
    var width = 0, height = 0, dpr = window.devicePixelRatio || 1;

    var atlas = global.ATLAS;
    if (!atlas) return null;

    var methodKeys = Object.keys(atlas.methods);
    var stages = atlas.stages;

    // 构建节点与连线数据
    var nodes = [];
    var links = [];
    var particles = [];

    function resize() {
      if (!canvas.parentNode) return;
      var rect = container.getBoundingClientRect();
      width = rect.width || 800;
      height = rect.height || 440;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    var cx = width * 0.5;
    var cy = height * 0.5;

    // 1. 创建 5 个核心 AI 算法中心节点
    var methodColors = {
      cv: '#10b981',
      ts: '#0ea5e9',
      opt: '#f59e0b',
      nlp: '#8b5cf6',
      kg: '#ec4899'
    };

    methodKeys.forEach(function (k, i) {
      var angle = (i / methodKeys.length) * Math.PI * 2 - Math.PI * 0.5;
      var r = Math.min(width, height) * 0.26;
      nodes.push({
        id: 'm_' + k,
        type: 'method',
        key: k,
        name: atlas.methods[k].name,
        abbr: atlas.methods[k].abbr,
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
        vx: 0,
        vy: 0,
        radius: 25,
        color: methodColors[k] || '#10b981'
      });
    });

    // 2. 创建 13 个环绕工业环节节点
    stages.forEach(function (st, i) {
      var angle = (i / stages.length) * Math.PI * 2 - Math.PI * 0.5;
      var r = Math.min(width, height) * 0.44;
      nodes.push({
        id: 's_' + st.id,
        type: 'stage',
        stage: st,
        idx: st.idx,
        name: st.name,
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
        vx: 0,
        vy: 0,
        radius: 18,
        color: '#334155'
      });
    });

    // 3. 构建连线（环节包含某方法时建立引力连线）
    stages.forEach(function (st) {
      var stNode = nodes.find(function (n) { return n.id === 's_' + st.id; });
      var mCounts = {};
      st.scenes.forEach(function (sc) {
        sc.methods.forEach(function (m) {
          mCounts[m] = (mCounts[m] || 0) + 1;
        });
      });

      Object.keys(mCounts).forEach(function (m) {
        var mNode = nodes.find(function (n) { return n.id === 'm_' + m; });
        if (mNode && stNode) {
          links.push({
            source: mNode,
            target: stNode,
            weight: mCounts[m],
            color: mNode.color
          });

          // 初始化能量脉冲粒子
          for (var p = 0; p < Math.min(3, mCounts[m]); p++) {
            particles.push({
              source: mNode,
              target: stNode,
              t: Math.random(),
              speed: 0.006 + Math.random() * 0.006,
              color: mNode.color
            });
          }
        }
      });
    });

    // 交互状态
    var hoveredNode = null;
    var draggedNode = null;
    var mousePos = { x: -1, y: -1 };

    // 物理力导向模拟更新
    function updatePhysics() {
      cx = width * 0.5;
      cy = height * 0.5;

      var repulsion = 1200;
      var springK = 0.042;
      var restLength = Math.min(width, height) * 0.38;

      // 斥力
      for (var i = 0; i < nodes.length; i++) {
        var n1 = nodes[i];
        for (var j = i + 1; j < nodes.length; j++) {
          var n2 = nodes[j];
          var dx = n2.x - n1.x;
          var dy = n2.y - n1.y;
          var dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < 360) {
            var f = (repulsion / (dist * dist));
            var fx = (dx / dist) * f;
            var fy = (dy / dist) * f;
            n1.vx -= fx;
            n1.vy -= fy;
            n2.vx += fx;
            n2.vy += fy;
          }
        }
      }

      // 弹簧引力
      for (var k = 0; k < links.length; k++) {
        var l = links[k];
        var s = l.source;
        var t = l.target;
        var ldx = t.x - s.x;
        var ldy = t.y - s.y;
        var ldist = Math.sqrt(ldx * ldx + ldy * ldy) || 1;

        // 若高亮某方法，增强该方法的引力
        var isHl = hoveredNode && (hoveredNode === s || hoveredNode === t);
        var targetL = isHl ? restLength * 0.75 : restLength;
        var force = (ldist - targetL) * springK * (l.weight * 0.35 + 0.8);
        var fxx = (ldx / ldist) * force;
        var fyy = (ldy / ldist) * force;

        s.vx += fxx;
        s.vy += fyy;
        t.vx -= fxx;
        t.vy -= fyy;
      }

      // 中心引力与阻尼位移
      for (var m = 0; m < nodes.length; m++) {
        var n = nodes[m];
        if (n === draggedNode) continue;

        var dcx = cx - n.x;
        var dcy = cy - n.y;
        n.vx += dcx * 0.012;
        n.vy += dcy * 0.012;

        n.vx *= 0.82; // 阻尼
        n.vy *= 0.82;

        n.x += n.vx;
        n.y += n.vy;

        // 边界约束
        n.x = Math.max(n.radius + 10, Math.min(width - n.radius - 10, n.x));
        n.y = Math.max(n.radius + 10, Math.min(height - n.radius - 10, n.y));
      }

      // 粒子沿弹簧移动
      particles.forEach(function (p) {
        p.t += p.speed;
        if (p.t > 1) p.t = 0;
      });
    }

    // 绘制
    function render() {
      if (!document.body.contains(canvas)) return;

      updatePhysics();
      ctx.clearRect(0, 0, width, height);

      // 1. 绘制连线
      links.forEach(function (l) {
        var isHl = hoveredNode && (hoveredNode === l.source || hoveredNode === l.target);
        var isDim = hoveredNode && !isHl;

        ctx.strokeStyle = isHl ? l.color : isDim ? 'rgba(226, 232, 240, 0.25)' : 'rgba(203, 213, 225, 0.6)';
        ctx.lineWidth = isHl ? 2.2 : Math.min(3, 0.8 + l.weight * 0.4);
        ctx.beginPath();
        ctx.moveTo(l.source.x, l.source.y);
        ctx.lineTo(l.target.x, l.target.y);
        ctx.stroke();
      });

      // 2. 绘制流动能量脉冲粒子
      particles.forEach(function (p) {
        var isHl = hoveredNode && (hoveredNode === p.source || hoveredNode === p.target);
        var isDim = hoveredNode && !isHl;
        if (isDim) return;

        var px = p.source.x + (p.target.x - p.source.x) * p.t;
        var py = p.source.y + (p.target.y - p.source.y) * p.t;

        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = isHl ? 8 : 4;
        ctx.beginPath();
        ctx.arc(px, py, isHl ? 3 : 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // 3. 绘制节点
      nodes.forEach(function (n) {
        var isHl = hoveredNode && (n === hoveredNode || links.some(function (l) {
          return (l.source === hoveredNode && l.target === n) || (l.target === hoveredNode && l.source === n);
        }));
        var isDim = hoveredNode && !isHl;

        ctx.save();
        ctx.globalAlpha = isDim ? 0.3 : 1;

        // 节点阴影
        if (isHl || n.type === 'method') {
          ctx.shadowColor = n.color;
          ctx.shadowBlur = isHl ? 18 : 10;
        }

        // 节点圆形底座
        ctx.fillStyle = n.type === 'method' ? n.color : '#ffffff';
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.strokeStyle = n.type === 'method' ? '#ffffff' : isHl ? '#059669' : '#cbd5e1';
        ctx.lineWidth = isHl ? 2.5 : 1.5;
        ctx.stroke();

        // 节点文字
        ctx.font = n.type === 'method' ? 'bold 11px sans-serif' : '10px "JetBrains Mono", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = n.type === 'method' ? '#ffffff' : '#0f172a';

        if (n.type === 'method') {
          ctx.fillText(n.abbr, n.x, n.y - 4);
          ctx.font = '9px sans-serif';
          ctx.fillText(n.name.slice(0, 2), n.x, n.y + 7);
        } else {
          ctx.fillText(pad(n.idx), n.x, n.y - 4);
          ctx.font = '8.5px sans-serif';
          ctx.fillStyle = '#64748b';
          ctx.fillText(n.name.slice(0, 2), n.x, n.y + 6);
        }

        ctx.restore();
      });

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    function pad(n) { return (n < 10 ? '0' : '') + n; }

    // 鼠标交互
    function getNodeAt(x, y) {
      for (var i = nodes.length - 1; i >= 0; i--) {
        var n = nodes[i];
        var dx = x - n.x;
        var dy = y - n.y;
        if (dx * dx + dy * dy <= (n.radius + 4) * (n.radius + 4)) return n;
      }
      return null;
    }

    canvas.addEventListener('pointerdown', function (e) {
      var rect = canvas.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      var hit = getNodeAt(x, y);
      if (hit) {
        draggedNode = hit;
        canvas.setPointerCapture(e.pointerId);
      }
    });

    window.addEventListener('pointermove', function (e) {
      var rect = canvas.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      mousePos = { x: x, y: y };

      if (draggedNode) {
        draggedNode.x = x;
        draggedNode.y = y;
        draggedNode.vx = 0;
        draggedNode.vy = 0;
      } else {
        hoveredNode = getNodeAt(x, y);
        canvas.style.cursor = hoveredNode ? 'pointer' : 'default';
      }
    });

    window.addEventListener('pointerup', function (e) {
      if (draggedNode) {
        draggedNode = null;
      }
    });

    canvas.addEventListener('click', function (e) {
      var rect = canvas.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      var hit = getNodeAt(x, y);
      if (hit) {
        if (hit.type === 'stage') {
          location.hash = '#/stage/' + hit.stage.id;
        } else if (hit.type === 'method') {
          location.hash = '#/method/' + hit.key;
        }
      }
    });

    return {
      highlight: function (methodKey) {
        hoveredNode = nodes.find(function (n) { return n.key === methodKey; }) || null;
      },
      reset: function () {
        hoveredNode = null;
      }
    };
  }

  global.ForceGraphEngine = {
    init: createForceGraph
  };

})(window);
