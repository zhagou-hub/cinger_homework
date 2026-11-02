/* =========================================================
   应用外壳 Shell
   ---------------------------------------------------------
   职责：路由、页面骨架、导航、把案例挂到场景页上。
   不含任何具体案例的业务内容 —— 那些都在 assets/cases/*.js
   ========================================================= */

(function (global) {
  'use strict';

  var A = global.ATLAS;
  var M = A.methods;
  var K = global.K;
  var esc = K.esc, pad = K.pad, rich = K.rich;

  var view = document.getElementById('view');
  var mounted = null;          // 当前挂载中的示范，切页时调用其 unmount
  var mountedKey = '';
  var homeMotionPaused = false;

  /* =========================================================
     一、路由
     ========================================================= */
  function parseHash() {
    var h = location.hash.replace(/^#/, '') || '/';
    var qi = h.indexOf('?'), qs = '';
    if (qi >= 0) { qs = h.slice(qi + 1); h = h.slice(0, qi); }
    var q = {};
    qs.split('&').forEach(function (kv) {
      if (!kv) return;
      var p = kv.split('=');
      q[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || '');
    });
    return { parts: h.split('/').filter(Boolean), q: q };
  }

  function go(hash) { location.hash = hash; }

  /* file:// 协议下部分浏览器会拒绝 replaceState，失败时静默降级 */
  function setHashQuiet(hash) {
    try { history.replaceState(null, '', hash); }
    catch (e) { /* 忽略：地址栏不同步不影响功能 */ }
  }

  /* =========================================================
     二、公共片段
     ========================================================= */
  function header() {
    var r = parseHash();
    var cur = r.parts[0] || 'home';
    function on(k) { return cur === k ? ' on' : ''; }
    return '<header class="hdr"><div class="hdr-in">' +
      '<a class="brand" href="#/">' +
      '<span class="brand-mark">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round">' +
      '<path d="M3 17l5-6 4 3 4-6 5 4"/><circle cx="8" cy="11" r="1.8" fill="#fff" stroke="none"/>' +
      '</svg></span>' +
      '<span class="brand-txt"><b>智能化可能性地图</b><span>Petro × AI Atlas</span></span></a>' +
      '<button class="nav-search-trigger" id="btn-quick-search">' +
      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>' +
      '<span>快速检索场景与算法...</span><span class="kbd">Ctrl K</span></button>' +
      '<nav class="nav">' +
      '<a class="nav-keep' + on('home') + '" href="#/">总览</a>' +
      '<a class="nav-keep' + on('chain') + '" href="#/chain">作业链</a>' +
      '<a class="nav-keep' + on('cases') + '" href="#/cases">案例库</a>' +
      '<a class="nav-keep' + on('guide') + '" href="#/guide">接入指南</a>' +
      '<a class="nav-keep' + on('admin') + '" href="#/admin">' + (Admin.loggedIn() ? '管理后台' : '管理') + '</a>' +
      '<button class="nav-add" data-import>＋ 添加案例</button>' +
      '</nav></div></header>';
  }

  function footer() {
    var s = Cases.stats();
    return '<footer class="ftr"><div class="wrap"><div class="ftr-in">' +
      '<div class="ftr-col" style="max-width:30ch">' +
      '<h5>关于</h5><p>' + esc(A.meta.title) + '</p>' +
      '<p style="margin-top:8px;color:var(--ink-4)">' + esc(A.meta.version) + ' · 更新于 ' + esc(A.meta.updated) + '</p></div>' +
      '<div class="ftr-col"><h5>地图</h5>' +
      '<a href="#/">总览</a><a href="#/chain">作业链</a><a href="#/method/cv">按方法反查</a></div>' +
      '<div class="ftr-col"><h5>系统</h5>' +
      '<a href="#/cases">案例库（' + s.registered + ' 个已接入）</a>' +
      '<a href="#/guide">接入新案例</a></div>' +
      '<div class="ftr-col"><h5>参与</h5>' +
      '<p>发现问题或想补一个场景？</p>' +
      '<a href="mailto:' + esc(A.meta.email) + '">' + esc(A.meta.email) + '</a></div>' +
      '</div>' +
      '<div class="ftr-bot"><span>场景数据：' + A.allScenes.length + ' 个 · 环节：' + A.stages.length + ' 个</span>' +
      '<span>纯静态 · 无后端 · 可离线运行</span></div>' +
      '</div></footer>';
  }

  function crumb(items) {
    return '<nav class="crumb">' + items.map(function (it, i) {
      var last = i === items.length - 1;
      return (i ? '<span class="sep">/</span>' : '') +
        (last ? '<span class="cur">' + esc(it[1]) + '</span>' : '<a href="' + it[0] + '">' + esc(it[1]) + '</a>');
    }).join('') + '</nav>';
  }

  function methodChip(k) {
    var ck = (M[k] && (M[k].colorKey || k)) || 'cv';
    return '<span class="mtag" data-m="' + ck + '"><b>' + M[k].abbr + '</b>' + esc(M[k].name) + '</span>';
  }

  function caseChip(k) {  /* 案例 methods 标签（小号） */
    var m = M[k];
    if (!m) return '';
    var ck = m.colorKey || k;
    return '<span class="mtag sm" data-m="' + ck + '"><b>' + esc(m.abbr) + '</b>' + esc(m.name) + '</span>';
  }

  function stageBar(stageId) {
    var counts = A.countByStageMethod()[stageId];
    var keys = Object.keys(counts).filter(function (k) { return counts[k] > 0; });
    if (!keys.length) return '<div class="step-bar"><i class="empty"></i></div>';
    return '<div class="step-bar">' + keys.map(function (k) {
      var ck = (M[k] && (M[k].colorKey || k)) || 'cv';
      return '<i style="flex:' + counts[k] + ';background:var(--c-' + ck + ')"></i>';
    }).join('') + '</div>';
  }

  /* =========================================================
     三、首页
     ========================================================= */
  function homeTerrainHTML() {
    var lines = '';
    for (var i = 0; i < 23; i++) {
      // Parallel folds: decorative strata, not a representation of measured geology.
      var d = 'M -100 ' + (300 + i * 16) +
        ' C 140 ' + (390 + i * 16) + ', 280 ' + (40 + i * 15) + ', 495 ' + (135 + i * 13) +
        ' S 735 ' + (390 + i * 12) + ', 930 ' + (195 + i * 10) +
        ' S 1240 ' + (-50 + i * 17) + ', 1540 ' + (95 + i * 17);
      lines += '<path d="' + d + '"' + (i % 5 === 0 ? ' class="terrain-index"' : '') + '/>';
    }
    return '<div class="hero-terrain" aria-hidden="true">' +
      '<svg viewBox="0 0 1440 540" preserveAspectRatio="none" focusable="false">' +
      '<defs><linearGradient id="home-terrain-ink" x1="0" y1="0" x2="1" y2="0">' +
      '<stop offset="0" stop-color="var(--jade)" stop-opacity=".06"/>' +
      '<stop offset=".3" stop-color="var(--jade)" stop-opacity=".12"/>' +
      '<stop offset=".55" stop-color="var(--jade)" stop-opacity=".62"/>' +
      '<stop offset=".85" stop-color="var(--clay)" stop-opacity=".5"/>' +
      '<stop offset="1" stop-color="var(--clay)" stop-opacity=".08"/>' +
      '</linearGradient></defs><g>' + lines + '</g></svg></div>' +
      '<div class="hero-geology" aria-hidden="true"><img src="assets/media/rock-cutaway.png" width="1536" height="1024" alt="" fetchpriority="high"></div>';
  }

  function bindHomeMotion() {
    var home = view.querySelector('.home-page');
    var button = home && home.querySelector('[data-home-motion]');
    if (!button) return;
    function syncMotion() {
      home.dataset.motion = homeMotionPaused ? 'paused' : 'running';
      button.textContent = homeMotionPaused ? '播放动效' : '暂停动效';
      button.setAttribute('aria-label', homeMotionPaused ? '播放首页装饰动效' : '暂停首页装饰动效');
    }
    syncMotion();
    button.addEventListener('click', function () {
      homeMotionPaused = !homeMotionPaused;
      syncMotion();
    });
  }

  function homeRingHTML(value, unit, segments, denominator) {
    var offset = 0;
    var arcs = segments.map(function (part) {
      var share = denominator > 0 ? Math.max(0, Math.min(100, part[0] / denominator * 100)) : 0;
      var length = Math.max(0, share - (segments.length > 1 && share > 1 ? 1.1 : 0));
      var arc = length ? '<circle class="ring-arc" cx="60" cy="60" r="48" pathLength="100" stroke="' + part[1] +
        '" stroke-dasharray="' + length.toFixed(3) + ' 100" stroke-dashoffset="' + (-offset).toFixed(3) + '"/>' : '';
      offset += share;
      return arc;
    }).join('');
    return '<span class="stat-ring"><svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">' +
      '<circle class="ring-guide" cx="60" cy="60" r="57"/>' +
      '<circle class="ring-track" cx="60" cy="60" r="48"/>' +
      '<g transform="rotate(-90 60 60)">' + arcs + '</g>' +
      '</svg><span class="ring-value"><b>' + esc(value) + '</b><small>' + esc(unit) + '</small></span></span>';
  }

  function homeHTML() {
    var s = A.stats();
    var cs = Cases.stats();
    var total = A.allScenes.length;
    var keys = Object.keys(M);

    var methodSegments = keys.map(function (k) {
      return [(A.index.byMethod[k] || []).length, 'var(--c-' + (M[k].colorKey || k) + ')'];
    });
    // A scene may have several methods; the composition sums method assignments.
    var methodTotal = methodSegments.reduce(function (sum, part) { return sum + part[0]; }, 0);
    var compLegend = keys.map(function (k) {
      var n = (A.index.byMethod[k] || []).length;
      return '<a href="#/method/' + k + '"><i style="background:var(--c-' + (M[k].colorKey || k) + ')"></i>' + M[k].abbr +
        '<b>' + n + '</b></a>';
    }).join('');

    var coverPct = total ? Math.round(cs.coveredScenes / total * 100) : 0;
    var coveredStages = A.stages.filter(function (st) {
      return st.scenes.some(function (sc) { return !!Cases.byScene(sc.id); });
    }).length;
    var demoPct = cs.registered ? Math.round(cs.withDemo / cs.registered * 100) : 0;
    var stageRing = homeRingHTML(coveredStages, '个环节', [[coveredStages, 'var(--jade)']], A.stages.length);
    var caseRing = homeRingHTML(cs.registered, '个案例', [[cs.coveredScenes, 'var(--clay)']], total);
    var demoRing = homeRingHTML(cs.withDemo, '个示范', [[cs.withDemo, 'var(--jade)']], cs.registered);
    var diffRing = homeRingHTML(total, '个场景', [[s.diff.低, 'var(--ok)'], [s.diff.中, 'var(--warn)'], [s.diff.高, 'var(--bad)']], total);

    var chain = A.stages.map(function (st) {
      return '<a class="step" href="#/stage/' + st.id + '">' +
        '<div class="step-idx">' + pad(st.idx) + '</div>' +
        '<div class="step-name">' + esc(st.name) + '</div>' +
        '<div class="step-n">' + st.scenes.length + '<span>场景</span></div>' +
        stageBar(st.id) + '</a>';
    }).join('');

    var mcards = Object.keys(M).map(function (k) {
      return '<a class="mcard" data-m="' + (M[k].colorKey || k) + '" href="#/method/' + k + '">' +
        '<div class="abbr"><b>' + M[k].abbr + '</b><span>' + esc(M[k].signal) + '</span></div>' +
        '<div class="nm">' + esc(M[k].name) + '</div>' +
        '<div class="ds">' + esc(M[k].desc) + '</div>' +
        '<div class="cnt"><b>' + (A.index.byMethod[k] || []).length + '</b>个场景</div></a>';
    }).join('');

    return '<main class="home-page">' +
      '<section class="hero">' + homeTerrainHTML() + '<div class="wrap"><div class="hero-grid">' +

      '<div class="hero-main">' +
      '<div class="hero-top">' +
      '<span class="hero-badge">' + esc(A.meta.version) + ' · ' + total + ' 个候选场景</span>' +
      '<span class="hero-badge alt">案例系统 · ' + cs.registered + ' 个已接入</span>' +
      '</div>' +
      '<h1>石油勘探开发的<em>智能化</em><br>可能性地图</h1>' +
      '<p class="hero-lead">把整条作业链拆成 ' + total + ' 个候选场景，逐个说明：哪一步能被算法替掉、需要准备什么数据、难在哪里。带「可运行」标记的场景，可以直接在浏览器里跑一遍，看算法在什么条件下失效。</p>' +
      '<div class="hero-note"><div>' +
      '<p><b>这不是一个展示页，而是一个可扩展的系统。</b>场景元数据、案例内容、可运行示范三者分离；新增案例只需写一个插件文件并注册，外壳、导航、检索路径都会自动接上。</p>' +
      '</div></div>' +
      '<div class="hero-acts">' +
      '<a class="btn primary" href="#/chain">浏览完整作业链 <span class="ar">→</span></a>' +
      '<a class="btn" href="#/scene/w1?tab=demo">看一个可运行示范</a>' +
      '</div>' +
      '</div>' +

      '<aside class="spec">' +
      '<div class="spec-h"><span class="mono">AT A GLANCE · 速览</span><span class="mono">' + esc(A.meta.version) + '</span></div>' +
      '<div class="spec-rings">' +
      '<a class="ring-metric" href="#/chain">' + stageRing + '<strong>作业环节覆盖</strong><span class="ring-caption">' + coveredStages + ' / ' + A.stages.length + ' 个环节</span></a>' +
      '<a class="ring-metric" href="#/cases">' + caseRing + '<strong>已接入案例</strong><span class="ring-caption">覆盖 ' + cs.coveredScenes + ' / ' + total + ' 场景 · ' + coverPct + '%</span></a>' +
      '<a class="ring-metric" href="#/cases">' + demoRing + '<strong>可运行示范</strong><span class="ring-caption">' + cs.withDemo + ' / ' + cs.registered + ' 个案例 · ' + demoPct + '%</span></a>' +
      '<div class="ring-metric">' + diffRing + '<strong>候选场景难度</strong><span class="difficulty-key"><i style="--key:var(--ok)">低 ' + s.diff.低 + '</i><i style="--key:var(--warn)">中 ' + s.diff.中 + '</i><i style="--key:var(--bad)">高 ' + s.diff.高 + '</i></span></div>' +
      '</div>' +
      '<div class="spec-methods">' + homeRingHTML(keys.length, '类方法', methodSegments, methodTotal) +
      '<div class="spec-method-copy"><div class="spec-method-title">方法构成 <span>BY METHOD</span></div>' +
      '<div class="comp-legend">' + compLegend + '</div><p>场景可含多种方法</p></div>' +
      '</div>' +
      '<div class="spec-f"><span>数据截至 ' + esc(A.meta.updated) + '</span><span>教学用途</span></div>' +
      '</aside>' +

      '</div></div></section>' +

      /* 按环节找 */
      '<section class="section"><div class="wrap">' +
      '<div class="sec-head">' +
      '<div class="sec-rail"><span class="sec-num">01</span><span class="kicker">BY STAGE</span>' +
      '<span class="r"><a class="btn sm ghost" href="#/chain">完整链条 →</a></span></div>' +
      '<h2>按环节找：我现在站在哪一步</h2>' +
      '<p>沿着作业链从左到右，每个节点下方的色条表示该环节可用的方法构成。点进去是该环节的场景清单。</p>' +
      '</div>' +
      '<div class="chain-wrap"><div class="chain-scroll"><div class="chain">' +
      '<span class="chain-flow" aria-hidden="true"><i class="chain-pulse"></i></span>' + chain + '</div></div>' +
      '<div class="chain-hint"><span>← 横向滚动查看全部 ' + A.stages.length + ' 个环节</span>' +
      '<button class="home-motion-toggle" type="button" data-home-motion aria-label="暂停首页装饰动效">暂停动效</button></div></div>' +
      '</div></section>' +

      /* 按方法找 */
      '<section class="section"><div class="wrap">' +
      '<div class="sec-head">' +
      '<div class="sec-rail"><span class="sec-num">02</span><span class="kicker">BY METHOD</span></div>' +
      '<h2>按方法找：我手上有一套什么技术</h2>' +
      '<p>如果你已经有一支做 CV 或时序的团队，更自然的问法是「这套技术在这行能干什么」。点进去是跨环节的场景清单。</p>' +
      '</div>' +
      '<div class="methods">' + mcards + '</div>' +
      '</div></section>' +

      /* 矩阵 */
      '<section class="section"><div class="wrap">' +
      '<div class="sec-head">' +
      '<div class="sec-rail"><span class="sec-num">03</span><span class="kicker">MATRIX</span></div>' +
      '<h2>方法 × 环节：哪里已经被占满，哪里还是空白</h2>' +
      '<p>行列交点上的数字是该环节里用到该方法的地点数量。点格子直接带筛选条件跳到环节页。</p>' +
      '</div>' +
      matrixHTML() +
      '</div></section>' +

      /* 系统构成 */
      '<section class="section"><div class="wrap">' +
      '<div class="sec-head">' +
      '<div class="sec-rail"><span class="sec-num">04</span><span class="kicker clay">SYSTEM</span>' +
      '<span class="r"><a class="btn primary sm" href="#/guide">接入指南 →</a></span></div>' +
      '<h2>这个系统由三层组成</h2>' +
      '<p>新增一个案例，只动第二层的一个文件，外加 index.html 里一行 script 标签。</p>' +
      '</div>' +
      '<div class="fields">' +
      '<div class="field"><div class="fx">01 · DATA LAYER · assets/data.js</div>' +
      '<h4>场景元数据</h4>' +
      '<p>13 个环节、' + total + ' 个场景的名称、方法标签、难度、数据条件。这一层<b>不含任何案例实现</b>，只是一张可检索的表。</p></div>' +
      '<div class="field"><div class="fx">02 · CASE LAYER · assets/cases/*.js</div>' +
      '<h4>案例插件</h4>' +
      '<p>每个案例一个文件，调用 <b>Cases.register()</b> 声明自己绑定的场景、三块内容与可选的 demo 挂载函数。互不引用、可单独删除。</p></div>' +
      '<div class="field"><div class="fx">03 · SHELL · assets/core/*</div>' +
      '<h4>外壳与组件</h4>' +
      '<p>路由、导航、检索路径、标签/表格/四段式等组件，以及设计令牌。所有案例共用同一套版式，改一次全站生效。</p></div>' +
      '</div>' +
      '<div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap">' +
      '<a class="btn" href="#/cases">查看案例库与校验结果 →</a>' +
      '<a class="btn ghost" href="#/guide">看怎么添加下一个案例</a></div>' +
      '</div></section>' +
      '</main>';
  }

  function matrixHTML() {
    var counts = A.countByStageMethod();
    var keys = Object.keys(M);
    var head = '<tr><th>环节</th>' + keys.map(function (k) {
      return '<th>' + M[k].abbr + '</th>';
    }).join('') + '<th>合计</th></tr>';

    var body = A.stages.map(function (st) {
      var c = counts[st.id];
      var rowTotal = st.scenes.length;
      return '<tr><th><i>' + pad(st.idx) + '</i>' + esc(st.name) + '</th>' +
        keys.map(function (k) {
          var n = c[k] || 0;
          return '<td class="' + (n ? '' : 'zero') + '"><a href="#/stage/' + st.id + '?m=' + k + '">' + (n || '·') + '</a></td>';
        }).join('') +
        '<td><a href="#/stage/' + st.id + '" style="color:var(--ink-3)">' + rowTotal + '</a></td></tr>';
    }).join('');

    var foot = '<tr><th>合计</th>' + keys.map(function (k) {
      return '<td>' + (A.index.byMethod[k] || []).length + '</td>';
    }).join('') + '<td>' + A.allScenes.length + '</td></tr>';

    return '<div class="matrix-wrap"><table class="matrix"><thead>' + head + '</thead><tbody>' + body +
      '</tbody><tfoot>' + foot + '</tfoot></table></div>';
  }

  /* =========================================================
     四、作业链页
     ========================================================= */
  function chainHTML() {
    var rows = A.stages.map(function (st) {
      var top = st.scenes.slice(0, 5).map(function (s) { return s.name; }).join('、');
      return '<a class="scene-row" href="#/stage/' + st.id + '">' +
        '<div class="sr-n" style="padding-top:9px">' + pad(st.idx) + '</div>' +
        '<div><div class="sr-name">' + esc(st.name) +
        '<span class="mono" style="font-size:9.5px;color:var(--ink-4);letter-spacing:.14em">' + esc(st.en).toUpperCase() + '</span>' +
        '<span class="arrow">→</span></div>' +
        '<div class="sr-point">' + esc(st.blurb) + '</div>' +
        '<div class="sr-meta">' + st.scenes.slice(0, 3).map(function (s) { return methodChip(s.methods[0]); }).join('') +
        '<span class="tag" style="margin-left:4px">' + esc(top) + (st.scenes.length > 5 ? '…' : '') + '</span></div></div>' +
        '<div class="sr-right"><span class="mono" style="font-size:19px;color:var(--ink-2)">' + st.scenes.length + '</span>' +
        '<span class="small muted">场景</span></div></a>';
    }).join('');

    return '<main class="wrap chain-page">' +
      crumb([['#/', '总览'], ['#/chain', '作业链']]) +
      '<div class="page-head"><div class="ph-top"><div>' +
      '<div class="ph-idx">CHAIN · ' + A.stages.length + ' 个环节</div>' +
      '<h1>从地质勘察到加工的全链条</h1>' +
      '<p class="blurb">上游到下游按作业顺序排列。每个环节标注可智能化的场景数量与方法构成，点进去看清单。</p>' +
      '</div><div class="ph-stat">' +
      '<div><div class="n">' + A.stages.length + '</div><div class="l">环节</div></div>' +
      '<div><div class="n">' + A.allScenes.length + '</div><div class="l">场景</div></div>' +
      '</div></div></div>' +
      '<div class="scenes">' + rows + '</div></main>';
  }

  /* =========================================================
     五、环节页
     ========================================================= */
  function stageHTML(st, q) {
    var counts = {};
    st.scenes.forEach(function (s) { counts[s.diff] = (counts[s.diff] || 0) + 1; });
    var mFilter = q.m || '';
    var dFilter = q.d || '';

    var methodKeys = Object.keys(M).filter(function (k) {
      return st.scenes.some(function (s) { return s.methods.indexOf(k) >= 0; });
    });
    var methBtns = ['<button class="chip' + (mFilter ? '' : ' on') + '" data-f="m" data-v="">全部方法</button>'].concat(
      methodKeys.map(function (k) {
        return '<button class="chip' + (mFilter === k ? ' on' : '') + '" data-f="m" data-v="' + k + '" data-m="' + k + '">' + M[k].abbr + ' ' + esc(M[k].name) + '</button>';
      })).join('');

    var diffBtns = ['<button class="chip' + (dFilter ? '' : ' on') + '" data-f="d" data-v="">全部难度</button>'].concat(
      ['低', '中', '高'].map(function (d) {
        return '<button class="chip' + (dFilter === d ? ' on' : '') + '" data-f="d" data-v="' + d + '">' + d + '</button>';
      })).join('');

    var list = st.scenes.map(function (sc) {
      var cn = Cases.bySceneAll(sc.id).length;
      return '<a class="scene-row' + (sc.status === 'ext' ? ' is-ext' : '') + '" href="#/scene/' + sc.id + '" data-m="' + sc.methods.join(' ') + '" data-d="' + sc.diff + '">' +
        '<div class="sr-n">' + esc(sc.id.toUpperCase()) + '</div>' +
        '<div><div class="sr-name">' + esc(sc.name) +
        (cn ? '<span class="badge-ready">已接入案例' + (cn > 1 ? ' ×' + cn : '') + '</span>' : '') +
        '<span class="arrow">→</span></div>' +
        '<div class="sr-point">' + esc(sc.point) + '</div>' +
        '<div class="sr-meta">' + sc.methods.map(function (k) {
          var ck = (M[k] && (M[k].colorKey || k)) || 'cv';
          return '<span class="mtag" data-m="' + ck + '"><b>' + M[k].abbr + '</b>' + esc(M[k].name) + '</span>';
        }).join('') + '</div></div>' +
        '<div class="sr-right"><span class="dtag" data-d="' + sc.diff + '">难度 ' + sc.diff + '</span>' +
        (sc.demo ? '<span class="badge-wip" style="border-style:solid;color:var(--jade-d);background:var(--jade-l);border-color:rgba(47,125,107,.2)">可运行</span>' : '') +
        '</div></a>';
    }).join('');

    var idx = A.stages.indexOf(st);
    var prev = A.stages[idx - 1], next = A.stages[idx + 1];

    return '<main class="wrap">' +
      crumb([['#/', '总览'], ['#/chain', '作业链'], ['#/stage/' + st.id, st.name]]) +
      '<div class="page-head"><div class="ph-top"><div>' +
      '<h1>' + esc(st.name) + '环节的可智能化场景</h1></div>' +
      '<div class="ph-stat">' +
      '<div><div class="n">' + st.scenes.length + '</div><div class="l">场景</div></div>' +
      '<div><div class="n">' + (counts.低 || 0) + '</div><div class="l">低难度</div></div>' +
      '<div><div class="n">' + (counts.高 || 0) + '</div><div class="l">高难度</div></div>' +
      '</div></div></div>' +

      '<div class="filters"><span class="lbl">方法</span>' + methBtns +
      '<span class="divider"></span><span class="lbl">难度</span>' + diffBtns +
      '<span class="count" id="f-count">' + st.scenes.length + ' 个场景</span></div>' +
      '<div class="scenes" id="scene-list">' + list + '</div>' +
      '<div class="pager">' +
      (prev ? '<a href="#/stage/' + prev.id + '" class="prev"><span class="dir">← 上一环节</span><span class="nm">' + pad(prev.idx) + ' ' + esc(prev.name) + '</span></a>' : '') +
      (next ? '<a href="#/stage/' + next.id + '" class="next"><span class="dir">下一环节 →</span><span class="nm">' + pad(next.idx) + ' ' + esc(next.name) + '</span></a>' : '') +
      '</div></main>';
  }

  function bindFilters(root) {
    var listEl = root.querySelector('#scene-list');
    if (!listEl) return;
    var st = { m: '', d: '' };
    var chips = root.querySelectorAll('.filters .chip');
    [].forEach.call(chips, function (c) {
      if (c.classList.contains('on')) st[c.dataset.f] = c.dataset.v;
    });

    function apply() {
      var n = 0;
      [].forEach.call(listEl.children, function (row) {
        var ms = (row.dataset.m || '').split(' ');
        var okM = !st.m || ms.indexOf(st.m) >= 0;
        var okD = !st.d || row.dataset.d === st.d;
        var show = okM && okD;
        row.style.display = show ? '' : 'none';
        if (show) n++;
      });
      var cnt = root.querySelector('#f-count');
      if (cnt) cnt.textContent = n + ' 个场景';
      if (!n) {
        if (!listEl.querySelector('.filter-empty')) {
          var d = document.createElement('div');
          d.className = 'empty filter-empty';
          d.innerHTML = '<b>没有符合条件的场景</b>换个筛选条件试试。';
          listEl.appendChild(d);
        }
      } else {
        var e = listEl.querySelector('.filter-empty');
        if (e) e.remove();
      }
    }

    [].forEach.call(chips, function (c) {
      c.addEventListener('click', function () {
        var f = c.dataset.f;
        st[f] = c.dataset.v;
        [].forEach.call(chips, function (x) {
          if (x.dataset.f === f) x.classList.toggle('on', x === c);
        });
        apply();
        var hash = '#/stage/' + parseHash().parts[1] + (st.m ? '?m=' + st.m + (st.d ? '&d=' + st.d : '') : (st.d ? '?d=' + st.d : ''));
        setHashQuiet(hash);
      });
    });
    apply();
  }

  /* =========================================================
     六、方法反查页
     ========================================================= */
  function methodHTML(key) {
    if (!M[key]) return '<main class="wrap"><div class="empty"><b>没有这个方法类别</b></div></main>';
    var all = A.index.byMethod[key] || [];
    var hitStages = A.stages.filter(function (st) {
      return st.scenes.some(function (s) { return s.methods.indexOf(key) >= 0; });
    });
    var groups = hitStages.map(function (st) {
      var rows = st.scenes.filter(function (s) { return s.methods.indexOf(key) >= 0; }).map(function (sc) {
        var c = Cases.byScene(sc.id);
        return '<a class="mrow" href="#/scene/' + sc.id + '">' +
          '<div><div class="nm">' + esc(sc.name) + (c ? '<span class="badge-ready">案例</span>' : '') + '</div>' +
          '<div class="pt">' + esc(sc.point) + '</div></div>' +
          '<div class="rt"><span class="dtag" data-d="' + sc.diff + '">' + sc.diff + '</span><span class="mono" style="font-size:10px;color:var(--ink-4)">→</span></div></a>';
      }).join('');
      return '<div class="method-group"><div class="mg-head">' +
        '<span class="idx">' + pad(st.idx) + '</span><h3>' + esc(st.name) + '</h3>' +
        '<span class="cnt">' + st.scenes.filter(function (s) { return s.methods.indexOf(key) >= 0; }).length + ' 个</span></div>' +
        '<div class="mg-list">' + rows + '</div></div>';
    }).join('');

    return '<main class="wrap">' +
      crumb([['#/', '总览'], ['#/method/' + key, M[key].name]]) +
      '<div class="page-head"><div class="ph-top"><div>' +
      '<h1>' + esc(M[key].name) + '在石油勘探开发中的可应用场景</h1></div>' +
      '<div class="ph-stat"><div><div class="n">' + all.length + '</div><div class="l">场景</div></div>' +
      '<div><div class="n">' + hitStages.length + '</div><div class="l">跨环节</div></div></div>' +
      '</div></div>' +
      '<div style="padding:6px 0 10px">' + groups + '</div>' +
      '<div class="pager"><a href="#/" class="prev"><span class="dir">← 返回</span><span class="nm">总览</span></a></div></main>';
  }

  /* =========================================================
     七、场景详情页（案例自动挂载）
     ========================================================= */
  function sceneHTML(sc, q) {
    var st = A.index.byStage[sc.stageId];
    var allCases = Cases.bySceneAll(sc.id);
    /* 当前展示哪个案例：?case= 指定，默认第一个 */
    var c = allCases.filter(function (x) { return x.id === q.case; })[0] || allCases[0] || null;

    var caseSwitch = '';
    if (allCases.length > 1) {
      caseSwitch = '<div class="case-switch"><span class="cs-lbl">本场景共有 ' + allCases.length +
        ' 个案例，当前展示</span>' + allCases.map(function (x) {
          var on = c && x.id === c.id;
          return '<button class="chip' + (on ? ' on' : '') + '" data-case="' + esc(x.id) + '">' +
            esc(x.title || x.id) + '</button>';
        }).join('') + '</div>';
    }

    var tabs = [];
    if (c) {
      if (c.tabs.background) tabs.push({ key: 'bg', num: '01', name: c.tabs.background.label || '专业背景' });
      if (c.tabs.workflow) tabs.push({ key: 'flow', num: '02', name: c.tabs.workflow.label || '案例流程' });
      if (c.tabs.demo) tabs.push({ key: 'demo', num: '03', name: c.tabs.demo.label || '可运行示范' });
    }

    var tabBtns = tabs.map(function (t, i) {
      var liveBadge = t.key === 'demo' ? '<span class="tab-live-badge"><span class="tab-live-dot"></span>LIVE 演练</span>' : '';
      return '<button class="tab' + (i === 0 ? ' on' : '') + '" data-tab="' + t.key + '">' +
        '<span class="num">' + t.num + '</span><span>' + esc(t.name) + '</span>' + liveBadge + '</button>';
    }).join('');

    var panels = '';
    if (c) {
      if (c.tabs.background) panels += '<div class="panel on" data-panel="bg">' + renderBackground(sc, c) + '</div>';
      if (c.tabs.workflow) panels += '<div class="panel" data-panel="flow">' + renderWorkflow(sc, c) + '</div>';
      if (c.tabs.demo) panels += '<div class="panel" data-panel="demo">' + renderDemoShell(sc, c) + '</div>';
    }

    var cBadge = allCases.length
      ? '<span class="badge-ready">案例 ' + esc(c.id) + ' · v' + esc(c.version || '—') + '</span>' +
        (allCases.length > 1 ? '<span class="tag">共 ' + allCases.length + ' 个案例</span>' : '')
      : '<span class="badge-wip">未接入案例</span>';

    var head = '<div class="detail-head">' +
      '<div class="dh-kicker">' +
      '<a class="tag" href="#/stage/' + st.id + '">环节 ' + pad(st.idx) + ' · ' + esc(st.name) + '</a>' +
      sc.methods.map(function (k) {
        var ck = (M[k] && (M[k].colorKey || k)) || 'cv';
        return '<span class="mtag" data-m="' + ck + '"><b>' + M[k].abbr + '</b>' + esc(M[k].name) + '</span>';
      }).join('') +
      cBadge +
      (c && c.tabs && c.tabs.demo ? '<button class="btn sm primary" id="btn-quick-run-demo" style="margin-left:auto;display:inline-flex;align-items:center;gap:6px">⚡ 立即运行交互示范</button>' : '') +
      '</div>' +
      '<h1 class="dh-title">' + esc(sc.name) + '</h1>' +
      '<div class="dh-tags" style="margin-top:12px">' + K.dtag(sc.diff) +
      (sc.status === 'ext' ? '<span class="badge-wip">待扩展</span>' : '') +
      '<span class="tag"><span class="dot" style="color:var(--ink-4)"></span>' + esc(sc.id.toUpperCase()) + '</span>' +
      '</div></div>';

    var body = c
      ? caseSwitch + '<div class="tabs" id="tabs">' + tabBtns + '</div>' + panels
      : pendingHTML(sc);

    return '<main class="wrap">' +
      crumb([['#/', '总览'], ['#/chain', '作业链'], ['#/stage/' + st.id, st.name], ['#/scene/' + sc.id, sc.name]]) +
      head + body + relatedHTML(sc) + '</main>';
  }

  /* ---- 有案例：三块内容由案例提供，这里只套版式 ---- */
  function renderBackground(sc, c) {
    var b = c.tabs.background;
    var out = '';
    if (b.judge) out += K.judge(b.judge);
    if (b.lede) out += '<div class="lede-block"><span class="kicker plain">专业场景介绍</span><p>' + rich(b.lede) + '</p></div>';
    (b.sections || []).forEach(function (s, i) {
      out += K.sec4(i + 1, s.en || '', s.title, s.html || s.body || '');
    });
    return out;
  }

  function renderWorkflow(sc, c) {
    var w = c.tabs.workflow;
    var out = '<div class="case-lead"><div>' +
      '<span class="kicker clay">CASE WALKTHROUGH</span>' +
      '<h3 style="margin-top:10px">' + esc(w.title || '案例流程') + '</h3>' +
      (w.lead || []).map(function (p) { return '<p>' + rich(p) + '</p>'; }).join('') +
      '</div>' + (w.stats ? K.cells(w.stats) : '') + '</div>';

    out += K.pipeline(w.steps || []);

    if (w.metrics) {
      out += K.sec4(0, 'METRICS', w.metrics.title || '怎么算"做对了"', w.metrics.html || '');
    }
    if (w.fails) {
      out += '<div class="sec4"><div class="sn">FAIL<span>MODES</span></div><div class="sec4-body">' +
        '<h3>这类任务通常死在哪</h3>' +
        '<p>下面这些失败模式在同类项目里反复出现。它们多半不是模型能力问题，而是任务定义与数据规范问题。</p>' +
        K.fails(w.fails) + '</div></div>';
    }
    return out;
  }

  function renderDemoShell(sc, c) {
    return '<div class="demo-workbench-wrap" id="demo-workbench-wrap">' +
      '<div class="demo-workbench-bar">' +
      '<div class="dw-left">' +
      '<span class="dw-badge"><span class="dw-pulse"></span>LIVE 仿真演练沙箱</span>' +
      '<span class="dw-title">' + esc(c.title || sc.name) + '</span>' +
      '</div>' +
      '<div class="dw-right">' +
      '<button class="dw-btn" id="btn-toggle-fullscreen" title="切换沉浸式全屏演练"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg> 沉浸全屏</button>' +
      '</div></div>' +
      '<div id="case-demo-root"></div>' +
      '</div>';
  }

  /* ---- 无案例：展示速览 + 接入引导 ---- */
  function pendingHTML(sc) {
    var dataRows = sc.data.map(function (d) { return [d[0], d[1], d[2]]; });
    return '<div style="padding-top:8px">' +
      '<div class="sec4" style="border-top:0">' +
      '<div class="sn">01<span>PROBLEM</span></div><div class="sec4-body">' +
      '<h3>业务问题</h3><p>' + esc(sc.problem) + '</p></div></div>' +
      '<div class="sec4"><div class="sn">02<span>INTERVENTION</span></div><div class="sec4-body">' +
      '<h3>AI 介入点</h3><p>' + esc(sc.point) + '</p></div></div>' +
      '<div class="sec4"><div class="sn">03<span>DATA</span></div><div class="sec4-body">' +
      '<h3>数据条件</h3>' + K.dtable(['数据类型', '规模 / 规格', '标注要求'], dataRows) + '</div></div>' +
      '<div class="sec4"><div class="sn">04<span>DIFFICULTY</span></div><div class="sec4-body">' +
      '<h3>技术难度与参考方向</h3>' +
      '<div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:4px">' + K.dtag(sc.diff) +
      '<span class="small muted">' + esc(sc.diffWhy) + '</span></div>' + K.meter(sc.diff) +
      K.refs(sc.refs, '#/method/' + sc.methods[0]) +
      '</div></div>' +

      '<div class="pending"><div class="pending-top"><span class="badge-wip">案例待接入</span>' +
      '<h3>这个场景还没有配套案例</h3></div>' +
      '<p>它的元数据（问题、介入点、数据条件、难度）已经在地图里，但还没有写成可讲解、可运行的具体案例。案例是按插件方式接入的：写一个文件声明三块内容，注册后这个页面就会自动出现 tab 与示范。</p>' +
      '<div class="pending-lines"><div class="pending-line"></div><div class="pending-line"></div><div class="pending-line"></div></div>' +
      '<div class="pending-actions">' +
      '<button class="btn primary" data-import data-scene="' + esc(sc.id) + '">＋ 为这个场景添加案例</button>' +
      '<a class="btn" href="#/cases">看已接入的案例</a>' +
      '<a class="btn ghost" href="#/guide">看接入说明</a>' +
      '</div></div></div>';
  }

  function relatedHTML(sc) {
    var sameStage = A.index.byStage[sc.stageId].scenes.filter(function (s) { return s.id !== sc.id; }).slice(0, 4);
    var sameMethod = (A.index.byMethod[sc.methods[0]] || []).filter(function (s) { return s.id !== sc.id; }).slice(0, 4);
    return '<div class="related"><div class="sec-head" style="margin-bottom:0;border-top:0;padding-top:0"><div>' +
      '<span class="kicker">RELATED</span><h2 style="font-size:18px;margin-top:8px">相关场景</h2></div></div>' +
      '<div class="rel-grid">' +
      '<div class="rel-col"><h5>同环节 · ' + esc(A.index.byStage[sc.stageId].name) + '</h5>' +
      sameStage.map(function (s) {
        return '<a class="rel-item" href="#/scene/' + s.id + '"><span class="nm">' + esc(s.name) + '</span><span class="go">→</span></a>';
      }).join('') + '</div>' +
      '<div class="rel-col"><h5>同方法 · ' + esc(M[sc.methods[0]].name) + '</h5>' +
      sameMethod.map(function (s) {
        return '<a class="rel-item" href="#/scene/' + s.id + '"><span class="nm">' + esc(s.name) + '</span><span class="go">' + esc(s.stageName) + ' →</span></a>';
      }).join('') + '</div></div>' +
      '<div style="margin-top:18px;display:flex;gap:9px;flex-wrap:wrap">' +
      '<a class="btn" href="#/stage/' + sc.stageId + '">← 返回' + esc(sc.stageName) + '环节</a>' +
      '<a class="btn ghost" href="#/">返回总览</a></div></div>';
  }

  /* ---- tab 交互与示范挂载 ---- */
  function bindTabs(sc, c) {
    var tabsEl = document.getElementById('tabs');
    if (!tabsEl) return;

    function activate(key, scroll) {
      [].forEach.call(tabsEl.children, function (b) {
        b.classList.toggle('on', b.dataset.tab === key);
      });
      [].forEach.call(document.querySelectorAll('.panel'), function (p) {
        p.classList.toggle('on', p.dataset.panel === key);
      });
      if (key === 'demo') mountDemo(sc, c);
      if (scroll) {
        var y = tabsEl.getBoundingClientRect().top + window.scrollY - 62;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }

    tabsEl.addEventListener('click', function (e) {
      var b = e.target.closest('.tab');
      if (!b) return;
      activate(b.dataset.tab, true);
      setHashQuiet('#/scene/' + sc.id + '?tab=' + b.dataset.tab);
    });

    var fsBtn = document.getElementById('btn-toggle-fullscreen');
    if (fsBtn) {
      fsBtn.addEventListener('click', function () {
        var wrap = document.getElementById('demo-workbench-wrap');
        if (wrap) {
          var expanded = wrap.classList.toggle('fullscreen-mode');
          fsBtn.lastChild.textContent = expanded ? ' 退出全屏' : ' 沉浸全屏';
          fsBtn.setAttribute('aria-pressed', String(expanded));
        }
      });
    }

    var quickRunBtn = document.getElementById('btn-quick-run-demo');
    if (quickRunBtn) {
      quickRunBtn.addEventListener('click', function () {
        activate('demo', true);
        setHashQuiet('#/scene/' + sc.id + '?case=' + c.id + '&tab=demo');
      });
    }

    var want = { 1: 'bg', 2: 'flow', 3: 'demo' }[parseHash().q.tab] || parseHash().q.tab;
    if (want && tabsEl.querySelector('[data-tab="' + want + '"]')) activate(want, false);

    bindChecklist();
  }

  function mountDemo(sc, c) {
    var d = c.tabs.demo;
    if (!d || typeof d.mount !== 'function') return;
    var key = c.id;
    if (mountedKey === key) return;
    var root = document.getElementById('case-demo-root');
    if (!root) return;
    if (mounted && mounted.unmount) { try { mounted.unmount(); } catch (e) { } }
    root.innerHTML = '';
    mounted = d;
    mountedKey = key;
    try {
      d.mount(root, { scene: sc, kase: c, K: K, atlas: A });
    } catch (err) {
      root.innerHTML = '<div class="callout warn"><span class="ci">错误</span><span>示范挂载失败：' +
        esc(err.message) + '。检查 <b>' + esc(c.id) + '</b> 的 tabs.demo.mount。</span></div>';
      console.error('[case:' + c.id + '] demo mount failed', err);
    }
  }

  function bindChecklist() {
    var items = document.querySelectorAll('.cl-item');
    if (!items.length) return;
    var total = items.length;
    var fill = document.getElementById('cl-fill');
    var txt = document.getElementById('cl-txt');

    function sync() {
      var n = document.querySelectorAll('.cl-item.done').length;
      if (fill) fill.style.width = (n / total * 100) + '%';
      if (txt) txt.textContent = n + ' / ' + total;
    }
    [].forEach.call(items, function (it) {
      it.addEventListener('click', function () {
        it.classList.toggle('done');
        sync();
      });
    });
    sync();
  }

  /* =========================================================
     八、案例库控制台
     ========================================================= */
    function casesHTML() {
    var list = Cases.list();
    // Keep the original nine packages first and the six new packages last.
    // The original well-log example and any other imports stay between them.
    var originalIds = ['geo-rs-litho', 'geo-map-extract', 'geo-geochem-anomaly',
      'geo-outcrop-frac', 'eor-frac-opt', 'mudlog-cuttings-cls',
      'seismic-firstbreak-pick', 'prod-dyna-diag', 'drill-hazard-warn'];
    var recentIds = ['cement-bond-eval', 'completion-rank', 'perforation-pareto',
      'workover-retrieval', 'pipeline-leak-balance', 'refining-soft-sensor'];
    function libraryGroup(c) {
      return originalIds.indexOf(c.id) >= 0 ? 0 : recentIds.indexOf(c.id) >= 0 ? 2 : 1;
    }
    list.sort(function (a, b) { return libraryGroup(a) - libraryGroup(b); });
    var checks = Cases.validateAll();
    var s = Cases.stats();
    var pending = A.allScenes.filter(function (sc) { return !Cases.bySceneAll(sc.id).length; });

    var rows = list.map(function (c) {
      var sc = A.index.byScene[c.sceneId];
      var ck = checks[c.id] || [];
      var errs = ck.filter(function (x) { return x.level === 'error'; }).length;
      var warns = ck.filter(function (x) { return x.level === 'warn'; }).length;
      var state = errs ? '<span class="bad-mark">✕ ' + errs + ' 项错误</span>'
        : warns ? '<span class="mono" style="font-size:11px;color:var(--warn)">! ' + warns + ' 项提醒</span>'
          : '<span class="ok-mark">✓ 校验通过</span>';
      var tabFlags = ['background', 'workflow', 'demo'].map(function (k) {
        return '<span class="' + (c.tabs[k] ? 'ok-mark' : 'dim-mark') + '" title="' + k + '">' + (c.tabs[k] ? '●' : '○') + '</span>';
      }).join(' ');
      var mChips = (c.methods || (sc ? sc.methods : [])).map(caseChip).join('') || '<span class="dim-mark">继承场景</span>';
      var methodStr = (c.methods || (sc ? sc.methods : [])).join(' ');

      return '<tr class="case-table-row" data-stage="' + (sc ? esc(sc.stageId) : '') + '" data-m="' + esc(methodStr) + '" data-kw="' + esc((c.id + ' ' + (c.title || '') + ' ' + (sc ? sc.name + ' ' + sc.stageName : '')).toLowerCase()) + '">' +
        '<td class="id">' + esc(c.id) + '</td>' +
        '<td>' +
        (sc ? '<div class="stage-cat-badge"><span class="stage-cat-dot"></span>环节 ' + pad(A.index.byStage[sc.stageId].idx) + ' · ' + esc(sc.stageName) + ' · ' + esc(sc.id.toUpperCase()) + '</div>' : '') +
        '<div class="nm"><a href="#/scene/' + (sc ? sc.id : '') + '?case=' + esc(c.id) + '" style="color:var(--ink);font-weight:700;font-size:13.5px">' + esc(c.title || (sc && sc.name)) + '</a>' +
        (c.imported ? '<span class="badge-local">本地导入</span>' : '') + '</div>' +
        '<div class="sc" style="margin-top:2px;color:var(--ink-3);font-size:11.5px">' + (sc ? '场景痛点: ' + esc(sc.point) : '⚠ sceneId 未匹配') + '</div></td>' +
        '<td>' + mChips + '</td>' +
        '<td class="sc">' + esc(c.version || '—') + '</td>' +
        '<td class="sc">' + esc(c.updated || '—') + '</td>' +
        '<td style="letter-spacing:.16em">' + tabFlags + '</td>' +
        '<td>' + state + '</td>' +
        '<td>' +
        '<div style="display:flex;align-items:center;gap:6px">' +
        (sc ? '<a class="btn sm" href="#/scene/' + sc.id + '?case=' + esc(c.id) + '">详情 →</a>' : '') +
        (sc && c.tabs && c.tabs.demo ? '<a class="btn sm primary" href="#/scene/' + sc.id + '?case=' + esc(c.id) + '&tab=demo" title="直接进入交互示范">⚡ 演练</a>' : '') +
        '<a href="#" class="link-remove" data-remove-case="' + esc(c.id) + '" title="' +
        (c.imported ? '从本机移除这份上传的案例包' : '从站点删除这个插件案例（文件保留，可恢复）') + '">' +
        (c.imported ? '移除' : '删除') + '</a>' +
        '</div>' +
        '</td></tr>';
    }).join('');

    var blocked = (global.CaseImport && global.CaseImport.blockedList ? global.CaseImport.blockedList() : [])
      .filter(function (id) { return !Cases.get(id); });
    var blockedBlock = '';
    if (blocked.length) {
      blockedBlock =
        '<div class="blocked-box">' +
        '<div class="bb-h"><span class="kicker clay">HIDDEN</span>' +
        '<b>已删除的插件案例（' + blocked.length + '）</b>' +
        '<span class="bb-sub">.js 文件仍在磁盘上，恢复后重新加载页面即可回到上表</span></div>' +
        '<div class="bb-list">' + blocked.map(function (id) {
          return '<span class="bb-item"><span class="mono">' + esc(id) + '</span>' +
            '<a href="#" class="link-remove" data-restore-case="' + esc(id) + '">恢复</a></span>';
        }).join('') + '</div></div>';
    }

        var detail = list.map(function (c) {
      var ck = checks[c.id] || [];
      return '<details style="margin-top:10px;border:1px solid var(--line);border-radius:8px;background:var(--card)">' +
        '<summary style="padding:10px 14px;cursor:pointer;font-size:12.5px;font-weight:600">' +
        esc(c.id) + ' 的校验明细 <span class="mono" style="font-weight:400;color:var(--ink-4);font-size:10.5px">' +
        ck.length + ' 条</span></summary>' +
        '<div style="padding:0 14px 12px"><table class="contract"><tbody>' +
        ck.map(function (x) {
          var mark = x.level === 'ok' ? '<span class="ok-mark">✓</span>'
            : x.level === 'warn' ? '<span style="color:var(--warn);font-family:var(--mono);font-size:11px">!</span>'
              : '<span class="bad-mark">✕</span>';
          return '<tr><td style="width:22px">' + mark + '</td>' +
            '<td style="font-family:var(--sans)">' + esc(x.label) + '</td>' +
            '<td style="color:var(--ink-4);font-size:11px">' + esc(x.detail) + '</td></tr>';
        }).join('') + '</tbody></table></div></details>';
    }).join('');

    return '<main class="wrap">' +
      crumb([['#/', '总览'], ['#/cases', '案例库']]) +
      '<div class="page-head"><div class="ph-top"><div>' +
      '<h1>案例库与接入状态</h1>' +
      '</div><div class="ph-stat">' +
      '<div><div class="n">' + s.registered + '</div><div class="l">已注册</div></div>' +
      '<div><div class="n">' + s.withDemo + '</div><div class="l">含示范</div></div>' +
      '<div><div class="n">' + pending.length + '</div><div class="l">待接入</div></div>' +
      '</div></div></div>' +

      /* 控制台汇总条与搜索过滤 */
      '<div class="console-bar" style="flex-wrap:wrap;gap:12px">' +
      '<span class="num">' + s.coveredScenes + '<small>/' + s.totalScenes + '</small></span>' +
      '<span class="lbl">个场景已有案例实现（共 ' + s.registered + ' 个案例，100% 配套可运行示范）</span><span class="sp"></span>' +
      '<button class="btn sm primary" data-import>＋ 添加案例</button>' +
      '<button class="btn sm ghost" id="rerun">重新校验</button>' +
      '</div>' +

      /* 快速技术栈过滤与实时搜索条 */
      '<div class="filters" id="stage-filters" style="margin:12px 0 8px">' +
      '<span class="lbl">业务环节</span>' +
      '<button class="chip on" data-sf="">全部环节 (13)</button>' +
      A.stages.map(function (st) {
        var count = st.scenes.reduce(function (acc, sc) { return acc + Cases.bySceneAll(sc.id).length; }, 0);
        return '<button class="chip' + (count > 0 ? '' : ' dim') + '" data-sf="' + esc(st.id) + '">' +
          pad(st.idx) + ' ' + esc(st.name) + ' (' + count + ')</button>';
      }).join('') +
      '</div>' +
      '<div class="filters" id="case-filters" style="margin:0 0 16px">' +
      '<span class="lbl">算法分类</span>' +
      '<button class="chip on" data-mf="">全部技术栈</button>' +
      '<button class="chip" data-mf="cv">CV 计算机视觉</button>' +
      '<button class="chip" data-mf="ts">TS 时序预测</button>' +
      '<button class="chip" data-mf="opt">OPT 优化算法</button>' +
      '<button class="chip" data-mf="nlp">NLP 自然语言</button>' +
      '<span class="divider"></span>' +
      '<input type="text" id="case-search" placeholder="实时过滤案例名/ID..." style="padding:4px 10px;font-size:12px;border:1px solid var(--line-2);border-radius:6px;background:var(--card);color:var(--ink);width:190px">' +
      '<span class="count" id="case-count">' + list.length + ' 个案例</span>' +
      '</div>' +

      '<div class="matrix-wrap" style="box-shadow:var(--sh-1)">' +
      '<table class="sys-table" id="case-table"><thead><tr>' +
      '<th>案例 id</th><th>绑定场景</th><th>涉及技术</th><th>版本</th><th>更新</th><th>三块内容</th><th>校验</th><th>操作</th>' +
      '</tr></thead><tbody>' + (rows || '<tr><td colspan="8" class="empty">还没有任何案例注册</td></tr>') + '</tbody></table></div>' +
      '<p class="small muted" style="margin-top:9px">三块内容依次为 background / workflow / demo，● 已提供、○ 未提供。技术标签可在导入时勾选，不选则继承场景；同一个场景支持挂多个案例，场景页顶部会出现切换器。删除上传案例会清掉本机存档；删除插件案例只是隐藏，文件不动，可随时恢复。</p>' +

      blockedBlock +

      '<div style="margin-top:26px">' + detail + '</div>' +

      '<div class="section" style="padding:44px 0 56px">' +
      '<div class="sec-head"><div><span class="kicker">BACKLOG</span>' +
      '<h2 style="margin-top:10px">还有 ' + pending.length + ' 个场景等待接入</h2>' +
      '<p>下面这些场景已有元数据，缺的是案例实现。接入一个大约需要「一份专业背景 + 一条流程 + 一个能跑的最小示范」。</p>' +
      '</div></div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:7px">' +
      pending.slice(0, 24).map(function (sc) {
        return '<a class="tag" href="#/scene/' + sc.id + '">' + esc(sc.name) + '</a>';
      }).join('') +
      (pending.length > 24 ? '<span class="tag">… 另有 ' + (pending.length - 24) + ' 个</span>' : '') +
      '</div></div></main>';
  }

  function guideHTML() {
    var fileTree = K.tree([
      '<b>项目根目录</b>',
      '├── index.html                <span class="cm">← 新增案例时加一行 script</span>',
      '├── assets/',
      '│   ├── data.js               <span class="cm">场景元数据（13 环节 / 61 场景）</span>',
      '│   ├── core/                 <span class="cm">外壳，一般不用动</span>',
      '│   │   ├── tokens.css        <span class="cm">颜色 / 字号 / 圆角</span>',
      '│   │   ├── layout.css        <span class="cm">导航 / 页头 / 页脚</span>',
      '│   │   ├── ui.css            <span class="cm">卡片 / 表格 / 四段式 / 示范</span>',
      '│   │   ├── registry.js       <span class="cm">Cases.register 契约与校验</span>',
      '│   │   ├── kit.js            <span class="cm">K.sec4 / K.figure / K.code…</span>',
      '│   │   ├── case-demo-host.js <span class="cm">示范宿主：iframe 整页 / Shadow DOM 模块</span>',
      '│   │   ├── case-upload.js    <span class="cm">案例包导入：校验 / 打包 / 落库</span>',
      '│   │   └── shell.js          <span class="cm">路由与页面</span>',
      '│   └── cases/                <span class="dir">← 案例都放这里</span>',
      '│       ├── welllog-layer.case.js   <span class="new">测井分层（示例）</span>',
      '│       ├── welllog-layer.demo.js   <span class="new">它的可运行示范</span>',
      '│       ├── _template.case.js       <span class="new">插件模板，复制它开始</span>',
      '│       └── _template.case.json     <span class="new">清单模板（完整包请用弹窗里下载的 zip）</span>',
      '└── docs/',
      '    └── 如何添加新案例.md      <span class="cm">本页的离线版</span>'
    ]);

    var sample = [
      "Cases.register({",
      "  id: 'logging-mud-loss',          // 必填，kebab-case，全局唯一",
      "  sceneId: 'd3',                    // 必填，data.js 里已有的场景 id",
      "  title: '钻井液漏失层位识别',",
      "  status: 'ready',                  // ready | draft",
      "  version: '1.0.0',",
      "  updated: '2026-10-22',",
      "",
      "  tabs: {",
      "    // ① 专业背景：四段式，返回 HTML 字符串",
      "    background: {",
      "      label: '专业背景',",
      "      judge: [",
      "        { label: '任务', value: '序列分割' },",
      "        { label: '数据', value: '随钻曲线 + 漏失记录' }",
      "      ],",
      "      lede: '一句话说明这个场景到底在做什么。',",
      "      sections: [",
      "        { no: 1, en: 'PROBLEM', title: '当前做法与问题',",
      "          html: '<p>……</p>' + K.figure(svgManual(), 1, '图注') },",
      "        { no: 2, en: 'INTERVENTION', title: 'AI 能做什么', html: '……' },",
      "        { no: 3, en: 'DATA', title: '你需要准备什么',",
      "          html: K.checklist([['随钻曲线', '1 s 采样'], ['漏失记录', '人工登记']]) },",
      "        { no: 4, en: 'DIFFICULTY', title: '技术难度与参考方向', html: '……' }",
      "      ]",
      "    },",
      "",
      "    // ② 案例流程：一条真实项目走过的路",
      "    workflow: {",
      "      label: '案例流程',",
      "      title: '某某区块 18 口井的漏失识别',",
      "      lead: ['项目目标不是做模型，而是把漏失层位定位时间压到 10 分钟。'],",
      "      stats: [['样本井', '18 口'], ['目标准确率', '85%']],",
      "      steps: [",
      "        { name: '数据对齐', do: '……', role: '工程环节',",
      "          effect: '……', trap: '……' }",
      "      ],",
      "      fails: [{ name: '标签滞后', why: '……' }]",
      "    },",
      "",
      "    // ③ 可运行示范（可选）：给一个 DOM 容器就能跑",
      "    demo: {",
      "      label: '可运行示范',",
      "      mount: function (root, ctx) {",
      "        root.innerHTML = '<div>……</div>';",
      "        // ctx.scene / ctx.kase / ctx.K / ctx.atlas 都可直接用",
      "      },",
      "      unmount: function () { /* 清理定时器、事件监听 */ }",
      "    }",
      "  }",
      "});"
    ].join('\n');

    var fields = [
      ['id', '必填', '全局唯一标识，kebab-case。会显示在场景页头部与控制台里。'],
      ['sceneId', '必填', '绑定到 data.js 中的某个场景 id。校验会检查它是否存在。'],
      ['title', '必填', '案例标题，通常与场景名一致或更具体。'],
      ['status', '建议', 'ready = 可用于教学；draft = 内容未定稿，控制台标黄。'],
      ['version', '建议', '语义化版本，改了内容就升一格。'],
      ['updated', '建议', '最后更新日期，方便判断内容是否过期。'],
      ['tabs.background', '必填', '对象。judge（30 秒判断）/ lede（导语）/ sections（四段式数组）。'],
      ['tabs.background.sections[]', '必填', '每段 { no, en, title, html }。建议恰好四段，与全站一致。'],
      ['tabs.workflow', '建议', '对象。title / lead[] / stats[] / steps[] / fails[] / metrics。'],
      ['tabs.workflow.steps[]', '建议', '每步 { name, do, role, effect, trap }。role 会渲染成小标签。'],
      ['tabs.demo', '可选', '对象。mount(root, ctx) 必填；unmount() 用于清理。'],
      ['tabs.demo.label', '可选', '第三个 tab 的显示名，默认「可运行示范」。']
    ].map(function (r) {
      var req = r[1] === '必填' ? '<span class="req">必填</span>'
        : r[1] === '建议' ? '<span class="opt">建议</span>' : '<span class="opt">可选</span>';
      return '<tr><td>' + esc(r[0]) + '</td><td>' + req + '</td><td>' + rich(r[2]) + '</td></tr>';
    }).join('');

    return '<main class="wrap guide-page">' +
      crumb([['#/', '总览'], ['#/guide', '接入指南']]) +
      '<div class="page-head workspace-hero"><div class="ph-top"><div>' +
      '<div class="workspace-kicker">GET STARTED / 接入指南</div>' +
      '<h1>怎么把这个系统扩成你自己的案例集</h1>' +
      '<p class="workspace-lead">从一份模板开始，把专业背景、案例流程和交互示范接入同一张地图。</p>' +
      '</div><div class="guide-hero-mark" aria-hidden="true"><span>01</span><b>准备模板</b><i>→</i><span>02</span><b>填写内容</b><i>→</i><span>03</span><b>校验接入</b></div></div></div>' +
      '<nav class="guide-nav" aria-label="指南章节"><span>快速定位</span>' +
      '<button type="button" data-guide-target="guide-package">案例包接入 <small>推荐</small></button>' +
      '<button type="button" data-guide-target="guide-plugin">插件接入</button>' +
      '<button type="button" data-guide-target="guide-contract">字段参考</button>' +
      '<button type="button" data-guide-target="guide-example">示例代码</button></nav>' +

      /* ---- 方式 A：上传案例包 ---- */
      '<div class="sec-head guide-section-head" id="guide-package" tabindex="-1">' +
      '<div class="sec-rail"><span class="sec-num">A</span><span class="kicker">UPLOAD PACKAGE · 推荐</span>' +
      '<span class="r"><span class="tag">不需要改任何文件</span></span></div>' +
      '<h2>上传一个案例包，三步接进去</h2>' +
      '<p>下载模板，修改清单和演示内容，再选择案例文件夹或直接导入 ZIP 压缩包。系统保留目录结构、逐项检查，通过后即可添加。</p>' +
      '</div>' +

      '<div class="upcard">' +
      '<div class="upcard-l">' +
      '<h4>案例包是什么</h4>' +
      '<p>是一个<b>文件夹或 ZIP 压缩包</b>：一份 JSON 清单 + 任意演示文件。清单写名称、所属场景和两块正文（专业背景 / 案例流程）；' +
      '示范可以是一个完整的 <b>index.html</b>、配套的 <b>demo.js</b> / <b>demo.css</b>，以及图片、JSON 数据等素材。</p>' +
      '<p>拖进弹窗时会整个读进浏览器——<b>html 自动内联 css 与 js、图片自动转成内嵌资源</b>，所以不需要服务器，双击 index.html 也能跑。</p>' +
      '<p>示范页跑在 <b>sandbox iframe</b> 里，你可以随便写样式和脚本，不会污染主站；只有 demo.js 没有 html 时，脚本会挂进 <b>Shadow DOM</b>，样式同样隔离。</p>' +
      '<div class="upcard-acts">' +
      '<button class="btn primary" data-import>＋ 打开「添加案例」</button>' +
      '<button class="btn" data-dl-template>↓ 下载案例包模板（.zip）</button>' +
      '</div>' +
      '<div class="upcard-note">模板包含清单、示范页、样式和脚本。修改后可以导入整个文件夹，也可以压缩为 ZIP 后直接导入，无需手动解压。解压后的文件总量上限为 6 MB。' +
      '上传的案例保存在本机浏览器（localStorage），换电脑需重新上传；要永久发布给所有人，用下面的方式 B。</div>' +
      '</div>' +
      '<div class="upcard-r">' +
      '<div class="package-preview"><div class="package-preview-head"><span>CASE PACKAGE</span><b>一个文件夹，即可接入</b></div>' +
      '<div class="package-file"><span class="package-file-icon">{ }</span><div><b>case.json</b><small>名称、所属场景、专业背景与案例流程</small></div><span class="package-file-tag">必需</span></div>' +
      '<div class="package-folder"><span>demo /</span>' +
      '<p><b>index.html</b><small>交互示范页面</small></p><p><b>demo.css</b><small>示范样式</small></p><p><b>demo.js</b><small>交互与计算</small></p></div>' +
      '<div class="package-preview-foot"><i></i>下载的模板已包含可运行示范</div></div>' +
      '</div></div>' +
      '<details class="guide-fields"><summary><span>案例包的文件与字段要求</span><small>展开完整参考 · 12 项</small></summary><div class="reference-scroll">' +
      '<table class="contract"><thead><tr><th>文件 / 字段</th><th>级别</th><th>说明</th></tr></thead><tbody>' +
      [
        ['case.json', '必填', '清单。建议就用这个名字，放在包根目录'],
        ['demo/index.html', '可选', '整页示范。自动内联 css/js，图片相对路径自动替换'],
        ['demo/demo.css', '可选', '示范页样式，只在沙箱里生效'],
        ['demo/demo.js', '可选', '示范脚本；无 html 时走模块模式，需导出 mount'],
        ['id', '必填', '小写字母 / 数字 / 连字符，全站唯一'],
        ['sceneId', '必填', '绑定场景，等于选定分类（环节 + 方法自动带出）'],
        ['title', '必填', '案例名称，页头与列表都用它'],
        ['tabs.background.sections[]', '必填', '每段 { title, html }；建议四段'],
        ['tabs.background.judge', '可选', '「30 秒判断」四格 { label, value, desc }'],
        ['tabs.workflow.steps[]', '可选', '每步 { name, do, effect, trap }'],
        ['tabs.demo.mode', '可选', 'auto（默认）/ page / module / builtin，一般不用写'],
        ['tabs.demo.builtin', '可选', '复用某个已有案例的示范（填它的 id）']
      ].map(function (r) {
        var req = r[1] === '必填' ? '<span class="req">必填</span>' : '<span class="opt">可选</span>';
        return '<tr><td>' + esc(r[0]) + '</td><td>' + req + '</td><td>' + rich(r[2]) + '</td></tr>';
      }).join('') +
      '</tbody></table>' +
      '</div></details>' +

      /* ---- 方式 B：插件 ---- */
      '<div class="sec-head guide-section-head" id="guide-plugin" tabindex="-1">' +
      '<div class="sec-rail"><span class="sec-num">B</span><span class="kicker">PLUGIN · 随站点发布</span></div>' +
      '<h2>写一个案例插件</h2>' +
      '<p>需要把案例作为网站的一部分随文件分发时，使用插件方式。两种方式都支持可交互的算法示范。</p>' +
      '</div>' +

      '<div class="gsteps">' +
      '<div class="gstep"><div class="gn">1</div><div>' +
      '<h3>复制模板，改三处</h3>' +
      '<p>把 <b>assets/cases/_template.case.js</b> 复制成 <b>你的案例.case.js</b>，然后只改三处：<b>id</b>、<b>sceneId</b>、以及三个 tab 里的内容。</p>' +
      '<p>id 用 kebab-case，保证唯一；sceneId 必须是 <b>assets/data.js</b> 里已经存在的场景 id（比如 <b>w1</b> 是测井分层）。如果这个场景还不存在，先在 data.js 的对应环节 scenes 数组里加一条元数据。</p>' +
      '</div></div>' +

      '<div class="gstep"><div class="gn">2</div><div>' +
      '<h3>在 index.html 里挂上去</h3>' +
      '<p>找到页面底部的脚本区，在你的案例文件后面加一行：</p>' +
      K.code('<script src="assets/cases/你的案例.case.js"><' + '/script>', { file: 'index.html', note: '加在 shell.js 之前' }) +
      '<p>加载顺序是：data.js → registry.js → kit.js → 案例 → shell.js。案例必须在 shell.js 之前注册完，否则首屏渲染时找不到它。</p>' +
      '</div></div>' +

      '<div class="gstep"><div class="gn">3</div><div>' +
      '<h3>打开控制台看校验结果</h3>' +
      '<p>刷新页面，进 <a href="#/cases" style="color:var(--jade-d);font-weight:600">案例库</a>。系统会自动检查：id 是否规范、sceneId 是否存在、三段内容是否齐全、demo.mount 是否为函数、场景与案例的 demo 标记是否一致。</p>' +
      '<p>全绿就说明接入完成 —— 场景页的 tab、面包屑、相关场景、方法反查页里的条目都会自动出现，不需要改任何其它文件。</p>' +
      '</div></div>' +
      '</div>' +

      '<div class="section tight guide-reference-block">' +
      '<div class="sec-head"><div><span class="kicker">STRUCTURE</span>' +
      '<h2 style="margin-top:8px">文件在哪</h2></div></div>' + fileTree + '</div>' +

      '<div class="section tight guide-reference-block" id="guide-contract" tabindex="-1">' +
      '<div class="sec-head"><div><span class="kicker">CONTRACT</span>' +
      '<h2 style="margin-top:8px">契约字段</h2>' +
      '<p>只有标「必填」的字段缺失会报错，其余缺失只是控制台里的一条提醒。</p></div></div>' +
      '<div class="matrix-wrap"><table class="contract"><thead><tr><th>字段</th><th>级别</th><th>说明</th></tr></thead><tbody>' +
      fields + '</tbody></table></div></div>' +

      '<div class="section tight guide-reference-block" id="guide-example" tabindex="-1">' +
      '<div class="sec-head"><div><span class="kicker">EXAMPLE</span>' +
      '<h2 style="margin-top:8px">一个完整的案例声明</h2>' +
      '<p>这是最小可用的骨架，把省略号换成你的内容即可。</p></div></div>' +
      K.code(sample, { file: 'assets/cases/your-case.case.js' }) +
      '</div>' +

      '<div class="section tight guide-reference-block">' +
      '<div class="sec-head"><div><span class="kicker">KIT</span>' +
      '<h2 style="margin-top:8px">内容怎么写：工具箱</h2>' +
      '<p>不要在案例里写 CSS 类名，用这些函数生成结构，版式改动会全站同步。</p></div></div>' +
      K.dtable(['函数', '用途'], [
        ['K.sec4(no, en, title, html)', '四段式中的一段，带编号与英文小标'],
        ['K.figure(svg, no, caption)', '插图 + 图注，图注支持 **粗体**'],
        ['K.judge([{label,value,desc}])', '页面顶部那排"30 秒判断"格子'],
        ['K.checklist(items)', '可勾选的数据准备清单，items 为 [名称, 规格, 标注要求]'],
        ['K.dtable(head, rows)', '普通数据表格'],
        ['K.pipeline(steps)', '带编号的流程步骤，每步可写效果与坑'],
        ['K.fails([{name, why}])', '失败模式四宫格'],
        ['K.cells([[标签, 值]])', '流程页右侧的指标格'],
        ['K.meter(diff)', '三段式难度条'],
        ['K.refs([...], href)', '参考方向胶囊'],
        ['K.callout(text, "warn")', '提示条'],
        ['K.code(str, {file})', '代码块，带语法着色']
      ]) +
      K.callout('文本里可以直接用 **粗体** 与 `等宽` 两种标记，所有函数都会自动转义 HTML，不需要手动防注入。') +
      '</div>' +

      '<div class="section tight guide-reference-block">' +
      '<div class="sec-head"><div><span class="kicker">PITFALLS</span>' +
      '<h2 style="margin-top:8px">四个常踩的坑</h2></div></div>' +
      '<div class="fails" style="grid-template-columns:1fr 1fr">' +
      '<div class="fail"><div class="fi">PITFALL 01</div><h5>script 顺序放反</h5><p>案例写在 shell.js 后面，页面已经渲染完了才注册，控制台里能看到但场景页没有 tab。案例脚本必须在 shell.js 之前。</p></div>' +
      '<div class="fail"><div class="fi">PITFALL 02</div><h5>sceneId 拼错</h5><p>id 区分大小写。写错不会报 JS 错误，只是这个案例永远不出现。控制台的"绑定场景"列会显示 ⚠。</p></div>' +
      '<div class="fail"><div class="fi">PITFALL 03</div><h5>demo 里没有清理</h5><p>用 setInterval / addEventListener 的示范要在 unmount 里清掉，否则切换场景后老定时器还在跑。</p></div>' +
      '<div class="fail"><div class="fi">PITFALL 04</div><h5>把样式写死在案例里</h5><p>内联颜色会让案例在改配色时掉队。颜色一律用 var(--jade) 这类令牌，或干脆用 K.* 生成。</p></div>' +
      '</div></div>' +

      '<div class="pending" style="margin-top:36px"><div class="pending-top">' +
      '<span class="badge-ready">下一步</span><h3>从最简单的案例开始</h3></div>' +
      '<p>如果还没有想好做什么，先挑一个 <b>数据现成、任务边界清晰</b> 的场景：把四段式写满、流程写三步、示范可以先不做。一个只有 80 行内容的案例，也比一个空着的场景有用。</p>' +
      '<div class="pending-actions">' +
      '<a class="btn primary" href="#/cases">看当前案例库 →</a>' +
      '<a class="btn" href="#/scene/w1">对照测井分层的写法</a></div></div>' +
      '</main>';
  }

  /* =========================================================
     十、调度
     ========================================================= */
  function unmountCurrent() {
    if (mounted && mounted.unmount) {
      try { mounted.unmount(); } catch (e) { }
    }
    mounted = null;
    mountedKey = '';
  }

  function render() {
    var r = parseHash();
    var p = r.parts;
    unmountCurrent();
    window.scrollTo(0, 0);

    var html;
    if (!p.length) html = homeHTML();
    else if (p[0] === 'chain') html = chainHTML();
    else if (p[0] === 'cases') html = casesHTML();
    else if (p[0] === 'guide') html = guideHTML();
    else if (p[0] === 'admin') html = global.Admin ? global.Admin.route(p, r.q) : notFound('管理模块未加载');
    else if (p[0] === 'stage') {
      var st = A.index.byStage[p[1]];
      html = st ? stageHTML(st, r.q) : notFound('没有这个环节');
    } else if (p[0] === 'method') {
      html = methodHTML(p[1]);
    } else if (p[0] === 'scene') {
      var sc = A.index.byScene[p[1]];
      html = sc ? sceneHTML(sc, r.q) : notFound('没有这个场景');
    } else html = notFound('页面不存在');

    view.innerHTML = header() + html + footer();

    // 页面级交互
    if (!p.length) bindHomeMotion();
    if (p[0] === 'guide') {
      [].forEach.call(view.querySelectorAll('[data-guide-target]'), function (button) {
        button.addEventListener('click', function () {
          var target = document.getElementById(button.dataset.guideTarget);
          if (target) {
            target.focus({ preventScroll: true });
            target.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
          }
        });
      });
    }
    if (p[0] === 'stage') bindFilters(view);
    if (p[0] === 'scene') {
      var sc2 = A.index.byScene[p[1]];
      var all2 = sc2 && Cases.bySceneAll(sc2.id);
      var c2 = all2 && all2.filter(function (x) { return x.id === r.q.case; })[0] || (all2 && all2[0]) || null;
      if (c2) bindTabs(sc2, c2);
      /* 多案例切换器 */
      [].forEach.call(view.querySelectorAll('.case-switch [data-case]'), function (b) {
        b.addEventListener('click', function () {
          var tab = parseHash().q.tab;
          go('#/scene/' + sc2.id + '?case=' + b.dataset.case + (tab ? '&tab=' + tab : ''));
        });
      });
    }
        if (p[0] === 'cases') {
      var rb = document.getElementById('rerun');
      if (rb) rb.addEventListener('click', render);

      // 实时搜索、业务环节与技术栈双轴筛选
      var sChips = view.querySelectorAll('#stage-filters .chip');
      var cChips = view.querySelectorAll('#case-filters .chip');
      var cInput = document.getElementById('case-search');
      var cRows = view.querySelectorAll('#case-table .case-table-row');
      var cCount = document.getElementById('case-count');
      var curSf = '';
      var curMf = '';

      function applyCaseFilter() {
        var kw = (cInput && cInput.value || '').trim().toLowerCase();
        var matchCount = 0;
        [].forEach.call(cRows, function(row) {
          var rowStage = row.dataset.stage || '';
          var mList = (row.dataset.m || '').split(' ');
          var rowKw = row.dataset.kw || '';
          var matchStage = !curSf || rowStage === curSf;
          var matchM = !curMf || mList.indexOf(curMf) >= 0;
          var matchK = !kw || rowKw.indexOf(kw) >= 0;
          var show = matchStage && matchM && matchK;
          row.style.display = show ? '' : 'none';
          if (show) matchCount++;
        });
        if (cCount) cCount.textContent = matchCount + ' 个案例';
      }

      [].forEach.call(sChips, function(chip) {
        chip.addEventListener('click', function() {
          curSf = chip.dataset.sf;
          [].forEach.call(sChips, function(c) { c.classList.toggle('on', c === chip); });
          applyCaseFilter();
        });
      });

      [].forEach.call(cChips, function(chip) {
        chip.addEventListener('click', function() {
          curMf = chip.dataset.mf;
          [].forEach.call(cChips, function(c) { c.classList.toggle('on', c === chip); });
          applyCaseFilter();
        });
      });

      if (cInput) {
        cInput.addEventListener('input', applyCaseFilter);
      }
    }
    if (p[0] === 'admin' && global.Admin) global.Admin.bind(view);
    document.title = pageTitle(p) + ' · 智能化可能性地图';
  }

  function pageTitle(p) {
    if (!p.length) return '总览';
    if (p[0] === 'scene') { var s = A.index.byScene[p[1]]; return s ? s.name : '场景'; }
    if (p[0] === 'stage') { var t = A.index.byStage[p[1]]; return t ? t.name : '环节'; }
    if (p[0] === 'method') return M[p[1]] ? M[p[1]].name : '方法';
    if (p[0] === 'admin') return global.Admin && global.Admin.loggedIn() ? '管理后台' : '管理员登录';
    return { chain: '作业链', cases: '案例库', guide: '接入指南' }[p[0]] || '地图';
  }

  function notFound(msg) {
    return '<main class="wrap"><div class="empty" style="padding:120px 0"><b>' + esc(msg) + '</b>' +
      '检查地址，或<a href="#/" style="color:var(--jade-d)">回到总览</a>。</div></main>';
  }

  window.addEventListener('hashchange', render);
  ensureCommandPalette();
  render();

  // 启动自检：把注册阶段的异常打到控制台，便于排查
  var probs = Cases.problems();
  if (probs.length) console.warn('[case registry]', probs);


  /* =========================================================
     全局 Command Palette (Ctrl+K) 快捷搜索与微光探照灯
     ========================================================= */
  function ensureCommandPalette() {
    if (document.getElementById('cmd-palette-backdrop')) return;
    var div = document.createElement('div');
    div.id = 'cmd-palette-backdrop';
    div.className = 'cmd-palette-backdrop';
    div.innerHTML = '<div class="cmd-palette-modal" id="cmd-palette-modal">' +
      '<div class="cmd-input-wrap">' +
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--jade)" stroke-width="2.2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>' +
      '<input type="text" class="cmd-input" id="cmd-search-input" placeholder="输入场景名、算法类型 (如: 测井 / 视觉 / 初至 / 压裂)..." autocomplete="off">' +
      '<span class="kbd" style="font-family:var(--mono);font-size:10px;padding:2px 6px;border-radius:4px;background:var(--paper-2);border:1px solid var(--line-2);color:var(--ink-4)">ESC 退出</span>' +
      '</div>' +
      '<div class="cmd-results" id="cmd-results"></div>' +
      '<div class="cmd-footer">' +
      '<span>按 ↑ ↓ 键选择，Enter 进入</span>' +
      '<span>共 ' + A.allScenes.length + ' 个前沿场景 · ' + Cases.stats().registered + ' 个深度实训案例</span>' +
      '</div></div>';
    document.body.appendChild(div);

    var backdrop = document.getElementById('cmd-palette-backdrop');
    var input = document.getElementById('cmd-search-input');
    var resultsEl = document.getElementById('cmd-results');

    function open() {
      backdrop.classList.add('open');
      input.value = '';
      renderResults('');
      setTimeout(function () { input.focus(); }, 60);
    }
    function close() {
      backdrop.classList.remove('open');
    }

    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) close();
    });

    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        backdrop.classList.contains('open') ? close() : open();
      } else if (e.key === 'Escape' && backdrop.classList.contains('open')) {
        close();
      }
    });

    document.addEventListener('click', function (e) {
      if (e.target.closest('#btn-quick-search')) {
        e.preventDefault();
        open();
      }
    });

    function renderResults(q) {
      var val = (q || '').trim().toLowerCase();
      var list = [];
      A.allScenes.forEach(function (sc) {
        var st = A.index.byStage[sc.stageId];
        var m = sc.methods.map(function (k) { return (M[k] && M[k].name) || k; }).join(' ');
        var text = (sc.name + ' ' + (st ? st.name : '') + ' ' + sc.point + ' ' + m + ' ' + sc.diff).toLowerCase();
        if (!val || text.indexOf(val) >= 0) {
          list.push({ type: 'scene', sc: sc, st: st, title: sc.name, sub: (st ? st.name + ' · ' : '') + sc.point, href: '#/scene/' + sc.id });
        }
      });
      Cases.list().forEach(function (c) {
        var sc = A.index.byScene[c.sceneId];
        var text = ((c.title || '') + ' 案例 ' + (sc ? sc.name : '')).toLowerCase();
        if (!val || text.indexOf(val) >= 0) {
          list.push({ type: 'case', c: c, sc: sc, title: '⚡ 案例实训: ' + (c.title || (sc && sc.name)), sub: '可在浏览器中即时演练', href: '#/scene/' + (sc ? sc.id : '') + '?case=' + c.id + '&tab=demo' });
        }
      });

      if (!list.length) {
        resultsEl.innerHTML = '<div style="padding:24px;text-align:center;color:var(--ink-4);font-size:13px">未找到匹配场景或案例</div>';
        return;
      }

      resultsEl.innerHTML = list.slice(0, 8).map(function (item, idx) {
        return '<div class="cmd-item' + (idx === 0 ? ' selected' : '') + '" data-href="' + item.href + '">' +
          '<div><div class="title">' + esc(item.title) + '</div><div class="meta">' + esc(item.sub) + '</div></div>' +
          '<span style="font-family:var(--mono);font-size:11px;color:var(--jade-d)">跳转 →</span></div>';
      }).join('');

      [].forEach.call(resultsEl.children, function (el) {
        el.addEventListener('click', function () {
          var href = el.dataset.href;
          if (href) { close(); location.hash = href; }
        });
      });
    }

    input.addEventListener('input', function () {
      renderResults(input.value);
    });
  }

  // 全局微光探照灯跟随
  document.addEventListener('pointermove', function (e) {
    document.documentElement.style.setProperty('--mouse-x', e.clientX + 'px');
    document.documentElement.style.setProperty('--mouse-y', e.clientY + 'px');
  });

})(window);
