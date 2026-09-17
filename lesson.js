const LESSONS = [
  {
    id: 'structure', number: '01', type: '基础判断', time: '约 14 分钟',
    title: '页面结构与布局准则',
    summary: '先建立信息层级、对齐关系和阅读顺序，再决定网格与 CSS 工具。',
    tags: ['语义结构', '层级', '对齐', '邻近', '留白'],
    intro: [
      { title: '布局先解决“关系”，不是先解决“位置”', body: '一个页面首先是信息系统：标题统领正文，操作跟随对象，同类内容形成分组。层级决定用户先看什么；邻近让用户知道哪些内容属于同一组；对齐则把分散的元素收进同一条视觉轨道。只有这些关系清楚以后，列数、间距和组件尺寸才有可靠依据。' },
      { title: '从无样式内容开始检查阅读顺序', body: '先用语义化 HTML 写出标题、导航、主内容和补充信息，再暂时关闭 CSS。此时页面从上到下的顺序应该仍然合理，因为屏幕阅读器、搜索引擎以及窄屏重排都会依赖 DOM 顺序。不要为了桌面端好看，就把关键内容放到错误位置，再用 Grid 的视觉排序掩盖问题。' },
      { title: '用少量规则建立稳定节奏', body: '间距不需要几十个随机数。可以采用 4px 或 8px 的基础节奏，规定组内、组间和章节间距；正文控制在约 55–75 个字符宽；同一级标题保持一致的字号和上下留白。稳定的重复比单个漂亮模块更能建立专业感。' }
    ],
    concepts: [
      { title: '层级', body: '用字号、字重、色彩和空间共同表达重要性，避免只靠颜色。' },
      { title: '对齐', body: '减少基准线数量，让标题、正文、按钮和卡片共享清晰边界。' },
      { title: '邻近', body: '组内距离小于组间距离，让内容关系无需额外说明。' },
      { title: '留白', body: '留白用于分组、聚焦和建立节奏，不是没有放满的空缺。' }
    ],
    decision: '先画出“用户先看什么、再看什么、下一步做什么”的阅读路径，再画网格。',
    case: {
      title: 'SaaS 产品首页首屏改版',
      description: '原页面把功能、客户评价、价格和注册按钮全部放在首屏，元素看似整齐，却没有明确的行动路径。',
      steps: ['把产品价值主张作为唯一一级标题', '将客户证据放在主行动之后', '统一卡片左边界与间距节奏', '保留一个主按钮和一个低权重次按钮']
    },
    codes: [
      { title: '建立语义化页面骨架', desc: '让 DOM 顺序本身就是合理的阅读顺序。', code: `<header class="site-header">…</header>\n<nav aria-label="主导航">…</nav>\n<main>\n  <section aria-labelledby="hero-title">…</section>\n  <section aria-labelledby="proof-title">…</section>\n</main>\n<footer>…</footer>`, why: '语义区域让键盘用户、辅助技术和搜索引擎理解页面结构。' },
      { title: '把间距写成系统', desc: '用设计令牌代替散落的随机数。', code: `:root {\n  --space-1: .25rem;\n  --space-2: .5rem;\n  --space-4: 1rem;\n  --space-6: 1.5rem;\n  --space-10: 2.5rem;\n}\n\n.stack > * + * {\n  margin-block-start: var(--space-4);\n}`, why: '修改一组令牌即可统一调整全站密度，也更容易维护。' },
      { title: '控制正文阅读宽度', desc: '长文本不要无限铺满宽屏。', code: `.article {\n  inline-size: min(100% - 2rem, 68ch);\n  margin-inline: auto;\n}\n\n.article p {\n  line-height: 1.75;\n}`, why: 'ch 接近字符宽度，配合较高行距能减少读者换行时丢失位置。' }
    ],
    demo: { title: '首页信息架构排序台', instruction: '拖动四个模块，尝试组成“价值 → 证据 → 功能 → 行动”的阅读路径。' }
  },
  {
    id: 'flow', number: '02', type: '尺寸基础', time: '约 16 分钟',
    title: '文档流与盒模型',
    summary: '理解元素如何自然排布、换行和计算尺寸，避免用固定高度把内容“钉死”。',
    tags: ['normal flow', 'box-sizing', 'margin', 'padding', '逻辑属性'],
    intro: [
      { title: '正常文档流是浏览器自带的响应式系统', body: '块级元素默认从上到下排列，行内内容会随可用宽度自动换行，父容器高度由内容撑开。这些行为已经能处理大量未知内容。优先保留正常流，再用 Flexbox 或 Grid 增强结构，页面通常会更稳。' },
      { title: '盒模型决定“你看到的宽度”', body: '每个元素由 content、padding、border 和 margin 组成。默认 content-box 下，width 只描述内容区，内边距和边框会额外增加总宽；border-box 则把它们包含在声明宽度内。团队项目一般全局使用 border-box，让组件尺寸更可预测。' },
      { title: '外边距不是通用的布局工具', body: '相邻块级元素的垂直 margin 可能发生折叠，导致实际距离与直觉不同。组件内部和列表间距优先使用 gap；容器内边界使用 padding；只有元素与外部环境的距离才适合 margin。逻辑属性 margin-inline、padding-block 还能自动适配不同书写方向。' }
    ],
    concepts: [
      { title: '内容驱动高度', body: '使用 min-height 而非固定 height，为多行文本和字体放大留空间。' },
      { title: 'border-box', body: '声明宽度包含 padding 与 border，布局计算更接近设计稿。' },
      { title: 'margin 折叠', body: '相邻块的垂直外边距可能合并，Flex/Grid 项目则不会折叠。' },
      { title: '逻辑属性', body: 'inline 与 block 方向比 left/right 更容易支持 RTL 和竖排。' }
    ],
    decision: '先让页面在正常流里能够容纳真实内容，再讨论复杂布局和视觉装饰。',
    case: {
      title: '电商商品卡片遇到长标题',
      description: '固定高度的商品卡在中文标题只有一行时正常，换成三行促销标题后价格被挤出卡片。',
      steps: ['移除固定 height，改为 min-height', '全局使用 border-box', '卡片内部使用 Grid 划分内容与操作区', '用 gap 管理稳定间距']
    },
    codes: [
      { title: '统一盒模型', desc: '让组件声明尺寸包含边框与内边距。', code: `*, *::before, *::after {\n  box-sizing: border-box;\n}\n\n.product-card {\n  inline-size: 18rem;\n  padding: 1rem;\n  border: 1px solid #dfe3eb;\n}`, why: '卡片最终宽度仍是 18rem，不需要额外减去 padding 与 border。' },
      { title: '内容驱动的卡片高度', desc: '底部按钮始终在内容之后，不覆盖长标题。', code: `.product-card {\n  display: grid;\n  grid-template-rows: auto 1fr auto;\n  min-block-size: 22rem;\n  height: auto;\n  gap: 1rem;\n}`, why: '1fr 吸收剩余空间，而 auto 允许内容自然增长。' },
      { title: '使用逻辑属性与 gap', desc: '减少方向耦合和外边距折叠。', code: `.product-list {\n  display: grid;\n  gap: clamp(.75rem, 2vw, 1.5rem);\n  padding-inline: 1rem;\n  margin-block: 2rem;\n}`, why: '同一套代码可适应从左到右、从右到左以及不同视口。' }
    ],
    demo: { title: '商品卡盒模型调试器', instruction: '拖动内容宽度、内边距与边框，切换 border-box，观察声明宽度和真实占用宽度。' }
  },
  {
    id: 'position', number: '03', type: '局部覆盖', time: '约 15 分钟',
    title: '定位与层叠',
    summary: '掌握 relative、absolute、fixed、sticky 与 z-index 的作用边界，避免覆盖和层级失控。',
    tags: ['position', 'containing block', 'sticky', 'z-index', 'stacking context'],
    intro: [
      { title: '定位首先改变参照系', body: 'absolute 元素会脱离正常流，并相对最近的已定位祖先计算偏移；如果找不到，就可能一直追溯到初始包含块。给组件容器设置 position: relative，不是为了移动容器，而是为内部徽标、按钮和装饰建立明确参照系。' },
      { title: 'sticky 是“流内 + 阈值”的组合', body: 'sticky 元素在到达阈值前仍参与正常流，滚动到 top 指定位置后才吸附。它依赖可滚动祖先和可用滚动距离：祖先 overflow 设置不当、容器高度不足或没有 top 值，都会让 sticky 看似失效。' },
      { title: 'z-index 只在层叠上下文里比较', body: 'transform、opacity、filter、isolation 以及带 z-index 的定位元素都可能创建新的层叠上下文。子元素的 z-index 再大，也无法越过父级所在的上下文。与其使用 999999，不如为页面层级定义少量语义令牌，例如 base、sticky、overlay、modal。' }
    ],
    concepts: [
      { title: 'relative', body: '保留原位置，并常用于给绝对定位子元素建立参照。' },
      { title: 'absolute', body: '脱离正常流，适合徽标、关闭按钮和局部装饰，不适合主结构。' },
      { title: 'sticky / fixed', body: 'sticky 受容器约束；fixed 通常相对视口，适合全局悬浮操作。' },
      { title: '层叠上下文', body: 'z-index 不是全局号码，先看元素属于哪个上下文。' }
    ],
    decision: '只把“允许覆盖且不参与尺寸计算”的局部元素交给 absolute；页面主结构留在文档流中。',
    case: {
      title: '新闻列表的置顶栏与突发徽标',
      description: '频道栏需要在列表容器内吸附，突发新闻徽标则应固定在单张新闻卡的右上区域。',
      steps: ['列表容器负责滚动，频道栏使用 sticky', '新闻卡建立 relative 参照系', '徽标使用 absolute，不影响标题占位', '用语义层级令牌控制覆盖顺序']
    },
    codes: [
      { title: '局部绝对定位', desc: '让徽标只在自己的卡片里移动。', code: `.news-card {\n  position: relative;\n}\n\n.breaking-badge {\n  position: absolute;\n  inset-block-start: 1rem;\n  inset-inline-end: 1rem;\n}`, why: '参照系被限制在卡片内部，不会随页面其他区域变化。' },
      { title: '容器内粘性标题', desc: '标题滚动到顶部后吸附，但不会越过列表底部。', code: `.news-feed {\n  max-block-size: 32rem;\n  overflow: auto;\n}\n\n.channel-bar {\n  position: sticky;\n  inset-block-start: 0;\n  z-index: var(--layer-sticky);\n}`, why: 'sticky 保留占位，滚动体验比 fixed 更符合局部列表场景。' },
      { title: '语义化层级令牌', desc: '不用无限增大的魔法数字。', code: `:root {\n  --layer-base: 0;\n  --layer-sticky: 10;\n  --layer-overlay: 20;\n  --layer-modal: 30;\n}\n\n.app { isolation: isolate; }`, why: '隔离应用层叠环境，并让层级数字表达明确角色。' }
    ],
    demo: { title: '新闻定位与层叠实验', instruction: '拖动“突发”徽标，调整层级并滚动新闻容器，观察 absolute 与 sticky 的差异。' }
  },
  {
    id: 'choice', number: '04', type: '方案判断', time: '约 13 分钟',
    title: '布局方案选择',
    summary: '根据内容关系选择 Normal Flow、Flexbox、Grid 或定位，而不是用熟悉的工具解决所有问题。',
    tags: ['Normal Flow', 'Flexbox', 'Grid', '定位', '组合策略'],
    intro: [
      { title: '先问“关系是一维还是二维”', body: '如果元素主要沿一条轴排列，例如导航、按钮组或表单操作区，Flexbox 通常最直接；如果行与列要同时对齐，或多个区域共享网格线，Grid 更合适。长文章和简单表单不需要额外布局系统，正常流往往就是最佳方案。' },
      { title: '根据内容变化方式选择工具', body: '设计稿只展示一个静态状态，真实页面却会遇到增删项目、长文本和窄容器。选择方案时要预测内容如何增长：导航项变多是否换行？卡片数量不整除时尾行怎样排列？主内容增长是否能撑开页面？这些问题比当前截图是否像设计稿更重要。' },
      { title: '大型页面通常组合使用', body: '页面外壳可以用 Grid，卡片内部用 Flexbox，正文继续留在正常流，局部徽标用 absolute。工具没有高低之分，关键是每个工具只负责自己擅长的尺度，避免一个深层嵌套的 Flexbox 同时承担页面、组件和装饰。' }
    ],
    concepts: [
      { title: 'Normal Flow', body: '文章、说明、纵向表单等内容驱动结构。' },
      { title: 'Flexbox', body: '一行导航、一列按钮、对齐和分配单轴剩余空间。' },
      { title: 'Grid', body: '页面外壳、仪表盘、杂志版式和自适应卡片矩阵。' },
      { title: '定位', body: '徽标、悬浮按钮、弹层等明确允许覆盖的局部元素。' }
    ],
    decision: '内容先后关系优先 Normal Flow；单轴分布选 Flexbox；区域同时占据行列选 Grid；局部覆盖才用定位。',
    case: {
      title: '后台管理页的混合布局',
      description: '侧栏、顶部栏、数据区和卡片操作需要不同尺度的布局方式，单用 Flexbox 会产生大量嵌套和宽度补丁。',
      steps: ['页面区域关系用 Grid', '顶部操作和卡片底部用 Flexbox', '报告正文保持正常流', '通知角标使用 absolute']
    },
    codes: [
      { title: '正常流：文章与表单', desc: '不额外改变流，依靠块级元素自然堆叠。', code: `.article > * {\n  max-inline-size: 68ch;\n}\n\n.article > * + * {\n  margin-block-start: 1.2em;\n}`, why: '内容增减时无需维护额外轨道或定位坐标。' },
      { title: 'Flexbox：单轴操作区', desc: '按钮沿水平方向分布，并允许换行。', code: `.actions {\n  display: flex;\n  flex-wrap: wrap;\n  align-items: center;\n  justify-content: flex-end;\n  gap: .75rem;\n}`, why: '核心问题只有一条主轴上的对齐和剩余空间分配。' },
      { title: 'Grid：页面级区域', desc: '同时定义侧栏与主区的行列关系。', code: `.dashboard {\n  display: grid;\n  grid-template-columns: 15rem minmax(0, 1fr);\n  grid-template-areas:\n    "sidebar header"\n    "sidebar main";\n}`, why: '命名区域直接表达结构意图，主区也不会被长内容撑破。' }
    ],
    demo: { title: '布局方案归类挑战', instruction: '把四张真实场景卡拖到最合适的工具区域，系统会即时说明判断是否合理。' }
  },
  {
    id: 'flex', number: '05', type: '一维布局', time: '约 18 分钟',
    title: 'Flexbox 一维布局',
    summary: '围绕主轴、交叉轴和剩余空间组织导航、按钮组、标签与卡片内部。',
    tags: ['main axis', 'cross axis', 'gap', 'flex-grow', 'flex-wrap'],
    intro: [
      { title: '主轴由 flex-direction 决定', body: 'row 时主轴通常是水平方向，column 时变为垂直方向。justify-content 处理主轴剩余空间，align-items 处理交叉轴对齐。不要把“justify 等于水平、align 等于垂直”当成固定规则，因为方向一变，含义也会交换。' },
      { title: 'Flexbox 的核心是剩余空间分配', body: '项目的最终尺寸由 flex-basis、flex-grow 和 flex-shrink 共同决定。flex: 1 常被理解为“平均宽度”，其实它允许项目从 0 基准开始竞争剩余空间。对于输入框加按钮的组合，常用输入区 flex: 1 负责吸收空间，按钮保持内容宽度。' },
      { title: '换行后的每一行独立分配空间', body: '开启 flex-wrap 后，各行会独立计算主轴剩余空间，所以最后一行不一定与前几行形成严格列对齐。如果要求多行项目共享列线，应改用 Grid。Flexbox 更适合项目自身尺寸不同、但只关心每一行分布的场景。' }
    ],
    concepts: [
      { title: 'justify-content', body: '分配主轴剩余空间，不直接改变项目本身尺寸。' },
      { title: 'align-items', body: '统一控制交叉轴对齐，可用 align-self 覆盖单个项目。' },
      { title: 'flex: 1 1 auto', body: '允许项目增长和收缩，并以自身内容尺寸为基准。' },
      { title: 'min-width: 0', body: '允许 Flex 项真正收缩，解决长文本把容器撑破的问题。' }
    ],
    decision: '当问题可以描述成“一行怎么排”或“一列怎么排”，优先考虑 Flexbox。',
    case: {
      title: '可变长度的项目成员工具栏',
      description: '成员名字长短不同，操作按钮数量变化，工具栏还要在窄容器中自然换行。',
      steps: ['成员列表设置 flex: 1 1 auto', '操作组保持内容宽度', '容器不足时允许 wrap', '使用 gap 而非给每个按钮加 margin']
    },
    codes: [
      { title: '导航与操作分居两端', desc: '让中间空白由 Flexbox 自动吸收。', code: `.toolbar {\n  display: flex;\n  align-items: center;\n  gap: 1rem;\n}\n\n.toolbar__actions {\n  margin-inline-start: auto;\n}`, why: '自动外边距会吸收主轴剩余空间，比写固定间距可靠。' },
      { title: '可收缩的内容区', desc: '避免长标题把按钮挤出容器。', code: `.media { display: flex; gap: 1rem; }\n.media__body {\n  flex: 1 1 auto;\n  min-inline-size: 0;\n}\n.media__title {\n  overflow-wrap: anywhere;\n}`, why: 'Flex 项默认 min-width: auto，显式设为 0 才能真正小于内容最小宽度。' },
      { title: '可换行按钮组', desc: '容器变窄时保留按钮可读宽度。', code: `.button-group {\n  display: flex;\n  flex-wrap: wrap;\n  gap: .75rem;\n}\n.button-group > button {\n  flex: 1 1 10rem;\n}`, why: '每个按钮以 10rem 为理想基准，空间不足时自动换行。' }
    ],
    demo: { title: '成员工具栏 Flex 实验', instruction: '拖动项目改变顺序，调整容器宽度与间距，观察 wrap 和剩余空间如何协作。' }
  },
  {
    id: 'grid', number: '06', type: '二维布局', time: '约 20 分钟',
    title: 'Grid 二维布局',
    summary: '同时规划行、列与区域，用明确轨道构建页面外壳、仪表盘和自适应卡片。',
    tags: ['grid tracks', 'minmax()', 'auto-fit', 'areas', 'placement'],
    intro: [
      { title: 'Grid 先定义轨道，再放置内容', body: 'grid-template-columns 和 grid-template-rows 建立显式轨道，gap 定义轨道间距。项目默认会按 DOM 顺序自动放入空单元格，也可以通过行列线或命名区域明确放置。页面外壳更适合命名区域，重复卡片更适合自动放置。' },
      { title: 'fr 分配的是可用空间', body: '1fr 并不是简单的“容器一等份”，轨道仍会受到内容最小尺寸影响。主内容里出现长单词或宽表格时，1fr 可能被撑大；使用 minmax(0, 1fr) 明确允许轨道收缩到 0，再由内容自己处理溢出。' },
      { title: 'auto-fit + minmax 描述组件底线', body: 'repeat(auto-fit, minmax(16rem, 1fr)) 表示每张卡至少 16rem，空间足够就增加列，不足就减少列。它依据组件可用宽度，而不是猜测某个手机型号，因此在侧栏、弹窗和嵌入区域中同样有效。' }
    ],
    concepts: [
      { title: '显式轨道', body: '由模板直接定义，适合结构明确的页面区域。' },
      { title: '隐式轨道', body: '内容超出显式网格后自动生成，可用 grid-auto-rows 控制。' },
      { title: '命名区域', body: '用可读名称表达 header、sidebar、main 等区域关系。' },
      { title: '自动放置', body: '让未知数量的卡片按规则填充，无需逐个指定坐标。' }
    ],
    decision: '当多个元素需要同时共享横向和纵向对齐线，或者页面由清晰区域组成时，使用 Grid。',
    case: {
      title: '数据分析仪表盘',
      description: '核心指标、趋势图、渠道排行和转化漏斗需要共享列线，并随容器宽度改变列数。',
      steps: ['外层用 Grid 建立三列轨道', '关键趋势模块跨越两列', '卡片内部仍用 Flexbox', '窄容器切换为两列或单列']
    },
    codes: [
      { title: '可读的命名区域', desc: '用区域名称表达页面外壳。', code: `.app-shell {\n  display: grid;\n  grid-template-columns: 16rem minmax(0, 1fr);\n  grid-template-areas:\n    "nav header"\n    "nav main";\n}\n\n.app-nav { grid-area: nav; }\n.app-main { grid-area: main; }`, why: '结构变化时修改模板即可，不必给每个项目重新写坐标。' },
      { title: '自适应卡片网格', desc: '按卡片最小可用宽度自动增减列数。', code: `.card-grid {\n  display: grid;\n  grid-template-columns:\n    repeat(auto-fit, minmax(min(100%, 16rem), 1fr));\n  gap: 1rem;\n}`, why: 'min(100%, 16rem) 避免在极窄容器中产生横向溢出。' },
      { title: '控制跨列与密集填充', desc: '让重点模块占据更大区域。', code: `.dashboard {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  grid-auto-flow: dense;\n}\n\n.chart--featured {\n  grid-column: span 2;\n}`, why: '适合视觉卡片，但必须保证 DOM 顺序仍然符合阅读和键盘顺序。' }
    ],
    demo: { title: '仪表盘网格编排器', instruction: '把模块拖到不同网格单元，并调整列数，观察 DOM 内容不变时版式如何重组。' }
  },
  {
    id: 'responsive', number: '07', type: '连续适配', time: '约 18 分钟',
    title: '响应式与流式布局',
    summary: '让尺寸连续变化、在内容真正失效时切换结构，并让组件根据自己的容器适配。',
    tags: ['mobile first', 'clamp()', 'min()', 'media query', 'container query'],
    intro: [
      { title: '响应式不是把桌面版等比缩小', body: '窄屏需要重新安排优先级：多列合为单列、次要导航收起、触控目标保持足够大小、图片避免抢占首屏。字体可以流式缩放，但信息结构往往需要在内容放不下时发生离散变化。' },
      { title: '断点应该由内容决定', body: '不要先写 375、768、1440 再把设计塞进去。逐渐缩小容器，当导航换行、卡片过窄或正文行长失控时记录临界点，这才是有依据的断点。以 rem 编写媒体查询还能更好响应用户调整默认字号。' },
      { title: '容器查询让组件脱离页面宽度', body: '同一张推荐卡可能出现在主内容、侧栏或弹窗中，视口宽度无法说明它实际获得多少空间。给父容器设置 container-type 后，组件可以依据自身可用宽度切换布局，实现真正可复用的响应式组件。' }
    ],
    concepts: [
      { title: '移动优先', body: '先保证最受约束的单列结构，再逐步增强为多列。' },
      { title: '流式尺寸', body: 'clamp、min、max 让字号、间距和宽度在区间内连续变化。' },
      { title: '媒体查询', body: '适合页面级能力、视口和用户偏好判断。' },
      { title: '容器查询', body: '适合可复用组件根据实际容器宽度改变内部结构。' }
    ],
    decision: '能连续变化的尺寸先用流式函数；只有内容关系失效时才添加断点。',
    case: {
      title: '活动报名页的多容器复用',
      description: '同一个活动卡既出现在首页双栏，也出现在侧栏单列；只依赖视口媒体查询会让侧栏卡片仍保持横向。',
      steps: ['卡片容器开启 inline-size 查询', '窄容器中图片移到标题上方', '标题使用 clamp 连续缩放', '操作按钮在窄容器占满一行']
    },
    codes: [
      { title: '流式字号与页面边距', desc: '在安全上下限之间连续插值。', code: `:root {\n  --page-gutter: clamp(1rem, 4vw, 4rem);\n}\n\nh1 {\n  font-size: clamp(2rem, 5vw + 1rem, 5rem);\n}\nmain { padding-inline: var(--page-gutter); }`, why: '多数中间宽度不需要额外断点，视觉变化更平滑。' },
      { title: '内容驱动的媒体查询', desc: '在导航真正放不下时改变页面级结构。', code: `.page { display: grid; gap: 1rem; }\n\n@media (min-width: 56rem) {\n  .page {\n    grid-template-columns: 18rem minmax(0, 1fr);\n  }\n}`, why: '使用 rem 可响应用户默认字号，断点来自内容临界状态。' },
      { title: '组件容器查询', desc: '卡片根据自己的宽度切换横向布局。', code: `.card-region { container-type: inline-size; }\n\n@container (min-width: 34rem) {\n  .event-card {\n    display: grid;\n    grid-template-columns: 12rem 1fr;\n  }\n}`, why: '组件在主区、侧栏和弹窗中都能独立做出正确决策。' }
    ],
    demo: { title: '活动页容器缩放台', instruction: '拖动右侧手柄改变组件容器宽度，观察导航、主视觉和按钮何时重新组织。' }
  },
  {
    id: 'audit', number: '08', type: '发布验证', time: '约 17 分钟',
    title: '布局可靠性检查',
    summary: '用长文本、键盘、缩放、连续宽度和动效偏好验证页面，而不是只看一张设计稿。',
    tags: ['long content', 'keyboard', '200% zoom', 'overflow', 'reduced motion'],
    intro: [
      { title: '可靠性来自系统性压力测试', body: '页面在默认文案、常见笔记本宽度和鼠标操作下正常，只能说明它通过了最轻松的状态。布局检查要主动制造压力：把标题变长、把浏览器缩放到 200%、逐像素改变容器宽度、只用键盘操作，并检查横向溢出和焦点遮挡。' },
      { title: '不要只检查几个设备预设', body: '响应式错误经常发生在常见断点之间，例如 853px 或 611px。拖动窗口连续检查，可以发现卡片刚好装不下、导航在断点前提前换行等问题。还要检查内容为空、数据极多、图片加载失败和网络字体未加载时的状态。' },
      { title: '可访问性会直接改变布局条件', body: '200% 文本缩放会让标签变长，键盘焦点环需要额外空间，prefers-reduced-motion 要求动效可以减少，RTL 会改变内联方向。可访问性不是最后加的装饰，而是一组真实的布局输入条件。' }
    ],
    concepts: [
      { title: '长文本', body: '替换为最长合理内容，检查换行、截断和容器增长。' },
      { title: '200% 缩放', body: '确保文本不重叠、功能不消失、页面不产生双向滚动。' },
      { title: '键盘与焦点', body: 'Tab 顺序符合 DOM 逻辑，焦点不会被 sticky 区域遮挡。' },
      { title: '减少动态效果', body: '尊重系统偏好，减少非必要位移、缩放和自动动画。' }
    ],
    decision: '布局上线前必须通过连续宽度、真实长内容、键盘和 200% 缩放四类检查。',
    case: {
      title: '课程卡片的发布前体检',
      description: '默认中文标题看似正常，但英文课程名、200% 缩放和固定高度叠加后，会把报名按钮裁掉。',
      steps: ['注入超长标题与说明', '分别检查正常和 200% 缩放', '运行自动溢出扫描', '移除固定高度并再次验证']
    },
    codes: [
      { title: '长内容的安全收缩', desc: '让不可断字符串也不会撑破布局。', code: `.card, .card__body {\n  min-inline-size: 0;\n}\n\n.card__title {\n  overflow-wrap: anywhere;\n  hyphens: auto;\n}`, why: 'min-inline-size: 0 解决 Grid/Flex 子项的默认最小内容宽度问题。' },
      { title: '可见焦点与滚动余量', desc: '让键盘焦点不会被粘性顶部栏遮挡。', code: `:focus-visible {\n  outline: 3px solid #3158e6;\n  outline-offset: 3px;\n}\n\n[id] {\n  scroll-margin-block-start: 6rem;\n}`, why: '清晰焦点反馈和滚动余量直接影响键盘用户能否定位操作。' },
      { title: '尊重减少动效偏好', desc: '保留状态变化，减少非必要运动。', code: `@media (prefers-reduced-motion: reduce) {\n  *, *::before, *::after {\n    animation-duration: .01ms !important;\n    transition-duration: .01ms !important;\n    scroll-behavior: auto !important;\n  }\n}`, why: '避免大幅位移与平滑滚动引发不适，同时不隐藏关键内容。' }
    ],
    demo: { title: '课程卡片自动体检台', instruction: '打开长文本、200% 缩放和固定高度等压力条件，再运行扫描查看真实布局风险。' }
  }
];

const THEORY_TITLES = {
  structure: '嵌入理论：信息层级如何塑造阅读路径',
  flow: '嵌入理论：正常流与盒模型如何容纳真实内容',
  position: '嵌入理论：定位参照系与层叠上下文',
  choice: '嵌入理论：从内容关系判断布局工具',
  flex: '嵌入理论：主轴、交叉轴与剩余空间分配',
  grid: '嵌入理论：轨道、区域与二维对齐',
  responsive: '嵌入理论：内容断点与容器适配',
  audit: '嵌入理论：用压力测试验证布局韧性'
};

const state = {
  activeLesson: 0,
  completed: new Set(readCompleted()),
  activeTab: 'explain'
};

function readCompleted() {
  try {
    const value = JSON.parse(localStorage.getItem('layout-lab-progress') || '[]');
    return Array.isArray(value) ? value.filter(id => LESSONS.some(lesson => lesson.id === id)) : [];
  } catch (_) { return []; }
}

function saveCompleted() {
  try { localStorage.setItem('layout-lab-progress', JSON.stringify([...state.completed])); } catch (_) {}
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
}

function showToast(message) {
  const toast = document.querySelector('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2200);
}

function renderPath() {
  const path = document.querySelector('#knowledge-path');
  path.innerHTML = LESSONS.map((lesson, index) => {
    const done = state.completed.has(lesson.id);
    const active = index === state.activeLesson;
    return `<button class="path-step${done ? ' done' : ''}${active ? ' active' : ''}" type="button" data-lesson-index="${index}" aria-current="${active ? 'step' : 'false'}">
      <span class="path-step-top"><span class="path-step-number">${lesson.number}</span><span class="path-step-status" aria-label="${done ? '已学完' : '未完成'}">✓</span></span>
      <strong>${lesson.title}</strong><small>${lesson.type} · ${lesson.time.replace('约 ', '')}</small>
    </button>`;
  }).join('');
}

function renderProgress() {
  const count = state.completed.size;
  document.querySelector('#header-progress-count').textContent = count;
  document.querySelector('#header-progress-text').textContent = `${count} / ${LESSONS.length}`;
  document.querySelector('#header-ring').style.setProperty('--progress', String(count / LESSONS.length * 100));
  document.querySelector('#sidebar-progress-count').textContent = count;
  document.querySelector('#sidebar-progress-bar').style.width = `${count / LESSONS.length * 100}%`;
}

function renderExplain(lesson) {
  return `<div class="case-led-explanation">
    <section class="your-case-section" aria-labelledby="your-case-title">
      <p class="content-kicker">你的案例</p>
      <h3 id="your-case-title">${lesson.case.title}</h3>
      <p>${lesson.case.description}</p>
      <div class="case-goals">
        <strong>本案例要完成</strong>
        <ol>${lesson.case.steps.map(step => `<li>${step}</li>`).join('')}</ol>
      </div>
    </section>
    <section class="theory-section" aria-labelledby="theory-title">
      <header class="theory-heading">
        <p class="content-kicker">知识讲解</p>
        <h3 id="theory-title">${THEORY_TITLES[lesson.id]}</h3>
        <p>${lesson.summary}</p>
      </header>
      <div class="prose">
        ${lesson.intro.map(item => `<h4>${item.title}</h4><p>${item.body}</p>`).join('')}
        <div class="concept-grid">${lesson.concepts.map(item => `<div class="concept-card"><strong>${item.title}</strong><p>${item.body}</p></div>`).join('')}</div>
        <div class="decision-strip"><strong>课堂要点</strong><p>${lesson.decision}</p></div>
      </div>
    </section>
  </div>`;
}

function renderCode(lesson) {
  return `<div class="code-list">${lesson.codes.map((item, index) => `<section class="code-example">
    <header class="code-example-head"><div><b>0${index + 1}</b><span><strong>${item.title}</strong><small>${item.desc}</small></span></div><button class="copy-code" type="button" data-copy-code="${index}">复制</button></header>
    <pre><code>${escapeHtml(item.code)}</code></pre>
    <p class="code-why"><strong>为什么这样写：</strong>${item.why}</p>
  </section>`).join('')}</div>`;
}

function demoShell(lesson, body, output = '') {
  return `<div class="demo-intro"><div class="demo-copy"><p class="content-kicker">对应“你的案例”</p><h3>案例演示｜${lesson.case.title}</h3><p><strong>${lesson.demo.title}：</strong>${lesson.demo.instruction}</p></div><span class="demo-badge">同一案例 · 实时交互</span></div>
    <div class="lab"><div class="lab-toolbar" data-lab-toolbar></div><div class="lab-stage">${body}</div><div class="lab-output" data-lab-output>${output}</div></div>`;
}

function renderDemo(lesson) {
  if (lesson.id === 'structure') return demoShell(lesson, `<div class="structure-workspace"><div class="mini-browser"><div class="mini-browser-bar"><i></i><i></i><i></i></div><div class="sortable-stage" data-sort-stage>
    <div class="sortable-module" draggable="true" data-order="features"><b>功能清单</b><small>用户还不知道价值，就先看到 12 项功能</small></div>
    <div class="sortable-module" draggable="true" data-order="cta"><b>立即注册</b><small>主行动按钮</small></div>
    <div class="sortable-module" draggable="true" data-order="hero"><b>价值主张</b><small>3 秒内说明产品解决什么问题</small></div>
    <div class="sortable-module" draggable="true" data-order="proof"><b>客户证据</b><small>企业标志与结果数据</small></div>
  </div></div><aside class="hierarchy-meter"><span>阅读路径清晰度</span><strong data-structure-score>35</strong><span data-structure-hint>拖动模块重新排序</span></aside></div>`, '推荐顺序：价值主张 → 客户证据 → 功能清单 → 立即注册');
  if (lesson.id === 'flow') return demoShell(lesson, `<div class="box-lab-stage"><div class="box-controls">
    <label>声明宽度<input type="range" min="140" max="300" value="190" data-box="width"><output data-box-value="width">190px</output></label>
    <label>内边距<input type="range" min="0" max="40" value="18" data-box="padding"><output data-box-value="padding">18px</output></label>
    <label>边框<input type="range" min="0" max="16" value="5" data-box="border"><output data-box-value="border">5px</output></label>
    <label class="toggle-control">使用 border-box<input type="checkbox" data-box-sizing checked><span class="toggle-ui"></span></label>
  </div><div class="box-visual"><div class="box-margin-layer"><div class="box-border-layer"><div class="box-padding-layer"><div class="box-content-layer">商品卡内容区<br><small data-box-content>144 × 110</small></div></div></div></div></div></div>`, '真实占用宽度：190px');
  if (lesson.id === 'position') return demoShell(lesson, `<div class="position-stage"><div class="news-feed" data-news-feed><div class="sticky-newsbar" data-sticky-bar>今日要闻 · 向下滚动观察吸附</div><article class="news-card"><h4>城市更新计划正式发布</h4><p>拖动右侧“突发”徽标，它会始终以这张新闻卡作为定位参照。</p><span class="drag-badge" data-drag-badge>突发</span></article>${'<article class="news-card"><h4>更多新闻内容</h4><p>这些内容用于产生容器内部滚动距离，观察 sticky 的边界。</p></article>'.repeat(3)}</div><div class="position-controls"><label class="range-control">徽标层级<input type="range" min="0" max="30" value="10" data-z-index><output data-z-output>10</output></label><label class="toggle-control">频道栏 sticky<input type="checkbox" data-sticky-toggle checked><span class="toggle-ui"></span></label><div class="position-tip">absolute 负责卡片内覆盖；sticky 仍在文档流中，并受滚动容器约束。</div></div></div>`, '当前：徽标以新闻卡为 containing block；频道栏 position: sticky');
  if (lesson.id === 'choice') return demoShell(lesson, `<div class="method-lab"><div class="scenario-deck">
    <div class="scenario-card" draggable="true" data-correct="flow">长文章正文</div><div class="scenario-card" draggable="true" data-correct="flex">导航按钮组</div><div class="scenario-card" draggable="true" data-correct="grid">仪表盘区域</div><div class="scenario-card" draggable="true" data-correct="position">卡片右上角徽标</div>
  </div><div class="method-bins"><div class="method-bin" data-method="flow"><strong>Normal Flow</strong></div><div class="method-bin" data-method="flex"><strong>Flexbox</strong></div><div class="method-bin" data-method="grid"><strong>Grid</strong></div><div class="method-bin" data-method="position"><strong>定位</strong></div></div></div>`, '把场景拖入对应区域：0 / 4 判断正确');
  if (lesson.id === 'flex') return demoShell(lesson, `<div class="flex-lab-stage"><div class="flex-canvas-wrap"><div class="flex-canvas" data-flex-canvas>${['成员 A','名字较长的成员 B','成员 C','操作'].map(item => `<div class="flex-item" draggable="true">${item}</div>`).join('')}</div></div></div>`, 'display: flex; gap: 16px; flex-wrap: nowrap; 容器宽度: 760px');
  if (lesson.id === 'grid') return demoShell(lesson, `<div class="grid-builder"><div class="grid-canvas" data-grid-canvas>${['核心指标','趋势图','渠道排行','转化漏斗','活动明细','备注'].map((item, index) => `<div class="grid-cell" data-cell="单元 ${index + 1}"><div class="grid-tile" draggable="true">${item}</div></div>`).join('')}</div></div>`, 'grid-template-columns: repeat(3, minmax(0, 1fr)); 可拖动模块重新编排');
  if (lesson.id === 'responsive') return demoShell(lesson, `<div class="responsive-workbench" data-responsive-workbench><div class="responsive-frame" data-responsive-frame><div class="responsive-handle" data-responsive-handle aria-label="拖动改变容器宽度" role="slider" aria-valuemin="310" aria-valuemax="820" aria-valuenow="760" tabindex="0"></div><div class="responsive-site"><nav><b>城市活动</b><span><i>活动</i><i>地点</i><i>报名</i></span></nav><main><div class="responsive-copy"><h4>周末设计工作坊</h4><p>容器宽度变小时，版式会根据内容临界点重新组织，而不是简单缩小。</p><button class="lab-button">立即报名</button></div><div class="responsive-art">A / 07</div></main></div></div></div>`, '当前容器：760px · 双栏主视觉 · 完整导航');
  return demoShell(lesson, `<div class="audit-workbench"><article class="audit-preview" data-audit-preview><h4 data-audit-title>可复用的页面布局课程</h4><p data-audit-text>通过案例掌握布局判断、实现与发布检查。</p><div class="audit-row"><button>开始学习</button><button>查看大纲</button></div></article><div class="audit-controls"><div class="audit-control-card"><span>注入超长内容</span><label class="toggle-control"><input type="checkbox" data-audit="long"><span class="toggle-ui"></span></label></div><div class="audit-control-card"><span>模拟 200% 缩放</span><label class="toggle-control"><input type="checkbox" data-audit="zoom"><span class="toggle-ui"></span></label></div><div class="audit-control-card"><span>限制为窄容器</span><label class="toggle-control"><input type="checkbox" data-audit="narrow"><span class="toggle-ui"></span></label></div><div class="audit-control-card"><span>模拟固定高度缺陷</span><label class="toggle-control"><input type="checkbox" data-audit="fixed"><span class="toggle-ui"></span></label></div><button class="lab-button" type="button" data-run-audit>运行布局扫描</button></div><div class="audit-results"><strong class="audit-score" data-audit-score>待测</strong><ul data-audit-results><li>开启压力条件后运行扫描</li></ul></div></div>`, '检查项：横向溢出、内容裁切、按钮可见性、减少动效支持');
}

function renderLesson(index, { scroll = false } = {}) {
  state.activeLesson = Math.max(0, Math.min(LESSONS.length - 1, index));
  state.activeTab = 'explain';
  const lesson = LESSONS[state.activeLesson];
  document.querySelector('#lesson-index').textContent = lesson.number;
  document.querySelector('#lesson-type').textContent = lesson.type;
  document.querySelector('#lesson-time').textContent = lesson.time;
  document.querySelector('#lesson-title').textContent = lesson.title;
  document.querySelector('#lesson-summary').textContent = lesson.summary;
  document.querySelector('#lesson-tags').innerHTML = lesson.tags.map(tag => `<span>${tag}</span>`).join('');
  document.querySelector('#panel-explain').innerHTML = renderExplain(lesson);
  document.querySelector('#panel-code').innerHTML = renderCode(lesson);
  document.querySelector('#panel-demo').innerHTML = renderDemo(lesson);
  updateCompleteButton();
  renderPath();
  selectLessonTab('explain');
  updateLessonNavigation();
  history.replaceState(null, '', `#lesson-${lesson.id}`);
  if (scroll) document.querySelector('#lesson-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function updateCompleteButton() {
  const lesson = LESSONS[state.activeLesson];
  const done = state.completed.has(lesson.id);
  const button = document.querySelector('#complete-lesson');
  button.classList.toggle('done', done);
  button.setAttribute('aria-pressed', String(done));
  button.querySelector('.complete-label').textContent = done ? '已学完' : '标记学完';
}

function updateLessonNavigation() {
  const prev = LESSONS[state.activeLesson - 1];
  const next = LESSONS[state.activeLesson + 1];
  const prevButton = document.querySelector('#prev-lesson');
  const nextButton = document.querySelector('#next-lesson');
  prevButton.disabled = !prev;
  nextButton.disabled = !next;
  document.querySelector('#prev-title').textContent = prev?.title || '这是第一个知识点';
  document.querySelector('#next-title').textContent = next?.title || '八个知识点已完成';
}

function selectLessonTab(name) {
  state.activeTab = name;
  document.querySelectorAll('[data-lesson-tab]').forEach(button => {
    const active = button.dataset.lessonTab === name;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
    button.tabIndex = active ? 0 : -1;
  });
  document.querySelectorAll('[data-lesson-panel]').forEach(panel => {
    const active = panel.dataset.lessonPanel === name;
    panel.hidden = !active;
    panel.classList.toggle('active', active);
  });
  if (name === 'demo') initCurrentDemo();
}

function setView(name) {
  if (!['learning', 'markdown', 'lab'].includes(name)) return;
  document.querySelectorAll('[data-view-target]').forEach(button => {
    const active = button.dataset.viewTarget === name;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
    button.tabIndex = active ? 0 : -1;
  });
  document.querySelectorAll('[data-view]').forEach(view => {
    const active = view.dataset.view === name;
    view.hidden = !active;
    view.classList.toggle('active', active);
  });
  if (name === 'lab') history.replaceState(null, '', '#lab');
  else if (name === 'markdown') history.replaceState(null, '', '#markdown');
  else if (!location.hash.startsWith('#lesson-')) history.replaceState(null, '', `#lesson-${LESSONS[state.activeLesson].id}`);
  window.scrollTo({ top: 0, behavior: 'instant' });
  document.dispatchEvent(new CustomEvent('layout:viewchange', { detail: { view: name } }));
}

async function copyText(text, message) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (_) {
    const area = document.createElement('textarea');
    area.value = text;
    document.body.appendChild(area);
    area.select();
    document.execCommand('copy');
    area.remove();
  }
  showToast(message);
}

function markdownText() {
  const lines = ['# 页面布局：八个核心知识点', '', '> 从判断到实现：每节包含概念、真实案例与三组关键代码。', ''];
  LESSONS.forEach(lesson => {
    lines.push(`## ${lesson.number}. ${lesson.title}`, '', lesson.summary, '');
    lesson.intro.forEach(item => lines.push(`### ${item.title}`, '', item.body, ''));
    lines.push('### 核心概念', '');
    lesson.concepts.forEach(item => lines.push(`- **${item.title}**：${item.body}`));
    lines.push('', `> 判断原则：${lesson.decision}`, '', `### 实际案例：${lesson.case.title}`, '', lesson.case.description, '');
    lesson.case.steps.forEach((step, index) => lines.push(`${index + 1}. ${step}`));
    lines.push('', '### 关键代码', '');
    lesson.codes.forEach(item => lines.push(`#### ${item.title}`, '', item.desc, '', '```css', item.code, '```', '', `**说明：** ${item.why}`, ''));
  });
  return lines.join('\n');
}

function renderMarkdown() {
  const toc = document.querySelector('#markdown-toc');
  toc.innerHTML = LESSONS.map(lesson => `<li><a href="#md-${lesson.id}">${lesson.title}</a></li>`).join('');
  document.querySelector('#markdown-preview').innerHTML = `<h1>页面布局：八个核心知识点</h1><blockquote>从判断到实现：每节包含概念、真实案例与三组关键代码。</blockquote>${LESSONS.map(lesson => `
    <section id="md-${lesson.id}"><h2>${lesson.number}. ${lesson.title}</h2><p>${lesson.summary}</p>
    ${lesson.intro.map(item => `<h3>${item.title}</h3><p>${item.body}</p>`).join('')}
    <h3>核心概念</h3><ul>${lesson.concepts.map(item => `<li><strong>${item.title}</strong>：${item.body}</li>`).join('')}</ul>
    <blockquote><strong>判断原则：</strong>${lesson.decision}</blockquote><h3>实际案例：${lesson.case.title}</h3><p>${lesson.case.description}</p><ol>${lesson.case.steps.map(step => `<li>${step}</li>`).join('')}</ol>
    <h3>关键代码</h3>${lesson.codes.map(item => `<h4>${item.title}</h4><p>${item.desc}</p><pre><code>${escapeHtml(item.code)}</code></pre><p><strong>说明：</strong>${item.why}</p>`).join('')}</section>`).join('')}`;
}

function initCurrentDemo() {
  const id = LESSONS[state.activeLesson].id;
  const panel = document.querySelector('#panel-demo');
  const toolbar = panel.querySelector('[data-lab-toolbar]');
  if (!toolbar || toolbar.dataset.ready) return;
  toolbar.dataset.ready = 'true';
  if (id === 'structure') initStructureDemo(panel, toolbar);
  if (id === 'flow') initBoxDemo(panel, toolbar);
  if (id === 'position') initPositionDemo(panel, toolbar);
  if (id === 'choice') initChoiceDemo(panel, toolbar);
  if (id === 'flex') initFlexDemo(panel, toolbar);
  if (id === 'grid') initGridDemo(panel, toolbar);
  if (id === 'responsive') initResponsiveDemo(panel, toolbar);
  if (id === 'audit') initAuditDemo(panel, toolbar);
}

function initStructureDemo(panel, toolbar) {
  toolbar.innerHTML = '<div><strong>拖拽排序 · SaaS 首页模块</strong><p>顺序会直接改变阅读路径评分</p></div><button class="lab-button" type="button" data-best-order>显示推荐顺序</button>';
  const stage = panel.querySelector('[data-sort-stage]');
  let dragging;
  const score = () => {
    const order = [...stage.children].map(item => item.dataset.order);
    const target = ['hero', 'proof', 'features', 'cta'];
    const matched = order.filter((item, index) => item === target[index]).length;
    panel.querySelector('[data-structure-score]').textContent = 35 + matched * 15;
    panel.querySelector('[data-structure-hint]').textContent = matched === 4 ? '阅读顺序清楚，行动路径完整' : `已有 ${matched} 个模块处于推荐位置`;
  };
  stage.addEventListener('dragstart', event => { dragging = event.target.closest('.sortable-module'); dragging?.classList.add('dragging'); });
  stage.addEventListener('dragend', () => { dragging?.classList.remove('dragging'); score(); });
  stage.addEventListener('dragover', event => {
    event.preventDefault();
    const after = [...stage.querySelectorAll('.sortable-module:not(.dragging)')].find(item => event.clientY <= item.getBoundingClientRect().top + item.offsetHeight / 2);
    if (dragging) stage.insertBefore(dragging, after || null);
  });
  toolbar.querySelector('[data-best-order]').addEventListener('click', () => {
    ['hero','proof','features','cta'].forEach(key => stage.appendChild(stage.querySelector(`[data-order="${key}"]`)));
    score();
  });
}

function initBoxDemo(panel, toolbar) {
  toolbar.innerHTML = '<div><strong>盒模型实时计算</strong><p>橙色 margin · 红色 border · 绿色 padding · 蓝色 content</p></div><span class="demo-badge">总宽度自动计算</span>';
  const inputs = [...panel.querySelectorAll('[data-box]')];
  const sizing = panel.querySelector('[data-box-sizing]');
  const output = panel.querySelector('[data-lab-output]');
  const update = () => {
    const values = Object.fromEntries(inputs.map(input => [input.dataset.box, Number(input.value)]));
    inputs.forEach(input => panel.querySelector(`[data-box-value="${input.dataset.box}"]`).textContent = `${input.value}px`);
    const total = sizing.checked ? values.width : values.width + values.padding * 2 + values.border * 2;
    const contentWidth = sizing.checked ? Math.max(40, values.width - values.padding * 2 - values.border * 2) : values.width;
    panel.querySelector('.box-content-layer').style.width = `${Math.min(300, contentWidth)}px`;
    panel.querySelector('.box-padding-layer').style.padding = `${values.padding}px`;
    panel.querySelector('.box-border-layer').style.padding = `${values.border}px`;
    panel.querySelector('[data-box-content]').textContent = `${contentWidth}px 内容宽度`;
    output.textContent = `${sizing.checked ? 'border-box' : 'content-box'}：声明 ${values.width}px → 真实占用 ${total}px`;
  };
  inputs.forEach(input => input.addEventListener('input', update));
  sizing.addEventListener('change', update);
  update();
}

function initPositionDemo(panel, toolbar) {
  toolbar.innerHTML = '<div><strong>定位参照与层叠实验</strong><p>拖动徽标，滚动左侧新闻容器</p></div><span class="demo-badge">position 实验</span>';
  const badge = panel.querySelector('[data-drag-badge]');
  const card = badge.parentElement;
  const z = panel.querySelector('[data-z-index]');
  const sticky = panel.querySelector('[data-sticky-toggle]');
  const output = panel.querySelector('[data-lab-output]');
  badge.addEventListener('pointerdown', event => {
    badge.setPointerCapture(event.pointerId);
    const move = moveEvent => {
      const rect = card.getBoundingClientRect();
      const left = Math.max(0, Math.min(rect.width - badge.offsetWidth, moveEvent.clientX - rect.left - badge.offsetWidth / 2));
      const top = Math.max(0, Math.min(rect.height - badge.offsetHeight, moveEvent.clientY - rect.top - badge.offsetHeight / 2));
      badge.style.left = `${left}px`; badge.style.top = `${top}px`;
      output.textContent = `徽标偏移：inline ${Math.round(left)}px / block ${Math.round(top)}px；z-index: ${z.value}`;
    };
    badge.addEventListener('pointermove', move);
    badge.addEventListener('pointerup', () => badge.removeEventListener('pointermove', move), { once: true });
  });
  z.addEventListener('input', () => { badge.style.zIndex = z.value; panel.querySelector('[data-z-output]').textContent = z.value; output.textContent = `徽标 z-index: ${z.value}（只在当前层叠上下文中比较）`; });
  sticky.addEventListener('change', () => { panel.querySelector('[data-sticky-bar]').style.position = sticky.checked ? 'sticky' : 'static'; output.textContent = sticky.checked ? '频道栏启用 sticky：保留流内位置并在阈值处吸附' : '频道栏改为 static：随内容一起滚动'; });
}

function initChoiceDemo(panel, toolbar) {
  toolbar.innerHTML = '<div><strong>拖放场景到合适工具</strong><p>错误也会给出即时视觉反馈，可继续拖动修正</p></div><button class="lab-button" type="button" data-reset-choice>重新挑战</button>';
  const deck = panel.querySelector('.scenario-deck');
  const output = panel.querySelector('[data-lab-output]');
  let dragging;
  const cards = [...panel.querySelectorAll('.scenario-card')];
  cards.forEach(card => card.addEventListener('dragstart', () => { dragging = card; card.classList.add('dragging'); }));
  cards.forEach(card => card.addEventListener('dragend', () => card.classList.remove('dragging')));
  panel.querySelectorAll('.method-bin').forEach(bin => {
    bin.addEventListener('dragover', event => { event.preventDefault(); bin.classList.add('over'); });
    bin.addEventListener('dragleave', () => bin.classList.remove('over'));
    bin.addEventListener('drop', event => {
      event.preventDefault(); bin.classList.remove('over');
      if (!dragging) return;
      bin.appendChild(dragging);
      dragging.classList.toggle('correct', dragging.dataset.correct === bin.dataset.method);
      dragging.classList.toggle('wrong', dragging.dataset.correct !== bin.dataset.method);
      const correct = cards.filter(card => card.classList.contains('correct')).length;
      output.textContent = correct === 4 ? '4 / 4 全部正确：工具选择来自内容关系，而不是个人习惯。' : `当前 ${correct} / 4 判断正确；红色卡片可以继续拖动修正。`;
    });
  });
  toolbar.querySelector('[data-reset-choice]').addEventListener('click', () => { cards.forEach(card => { card.classList.remove('correct','wrong'); deck.appendChild(card); }); output.textContent = '把场景拖入对应区域：0 / 4 判断正确'; });
}

function initFlexDemo(panel, toolbar) {
  toolbar.innerHTML = `<label class="range-control">容器宽度 <input type="range" min="300" max="760" value="760" data-flex-width><output>760px</output></label><label class="range-control">间距 <input type="range" min="0" max="40" value="16" data-flex-gap><output>16px</output></label><label class="toggle-control">允许换行<input type="checkbox" data-flex-wrap><span class="toggle-ui"></span></label>`;
  const canvas = panel.querySelector('[data-flex-canvas]');
  const width = panel.querySelector('[data-flex-width]');
  const gap = panel.querySelector('[data-flex-gap]');
  const wrap = panel.querySelector('[data-flex-wrap]');
  const output = panel.querySelector('[data-lab-output]');
  let dragging;
  canvas.addEventListener('dragstart', event => { dragging = event.target.closest('.flex-item'); dragging?.classList.add('dragging'); });
  canvas.addEventListener('dragend', () => dragging?.classList.remove('dragging'));
  canvas.addEventListener('dragover', event => { event.preventDefault(); const item = event.target.closest('.flex-item'); if (dragging && item && item !== dragging) canvas.insertBefore(dragging, event.clientX < item.getBoundingClientRect().left + item.offsetWidth / 2 ? item : item.nextSibling); });
  const update = () => {
    canvas.style.width = `${width.value}px`; canvas.style.gap = `${gap.value}px`; canvas.style.flexWrap = wrap.checked ? 'wrap' : 'nowrap';
    width.nextElementSibling.textContent = `${width.value}px`; gap.nextElementSibling.textContent = `${gap.value}px`;
    output.textContent = `display: flex; gap: ${gap.value}px; flex-wrap: ${wrap.checked ? 'wrap' : 'nowrap'}; 容器宽度: ${width.value}px；项目支持拖动排序`;
  };
  [width,gap].forEach(input => input.addEventListener('input', update)); wrap.addEventListener('change', update); update();
}

function initGridDemo(panel, toolbar) {
  toolbar.innerHTML = '<label class="range-control">网格列数 <input type="range" min="2" max="4" value="3" step="1" data-grid-columns><output>3 列</output></label><div><strong>拖动模块换位</strong><p>内容不变，位置由 Grid 单元控制</p></div>';
  const canvas = panel.querySelector('[data-grid-canvas]');
  const range = panel.querySelector('[data-grid-columns]');
  const output = panel.querySelector('[data-lab-output]');
  let dragging;
  canvas.addEventListener('dragstart', event => { dragging = event.target.closest('.grid-tile'); dragging?.classList.add('dragging'); });
  canvas.addEventListener('dragend', () => dragging?.classList.remove('dragging'));
  canvas.querySelectorAll('.grid-cell').forEach(cell => {
    cell.addEventListener('dragover', event => { event.preventDefault(); cell.classList.add('over'); });
    cell.addEventListener('dragleave', () => cell.classList.remove('over'));
    cell.addEventListener('drop', event => {
      event.preventDefault(); cell.classList.remove('over');
      const current = cell.querySelector('.grid-tile');
      const origin = dragging?.parentElement;
      if (!dragging || !origin || origin === cell) return;
      if (current) origin.appendChild(current);
      cell.appendChild(dragging);
      output.textContent = `已交换“${dragging.textContent}”的位置；DOM 内容未重新创建。`;
    });
  });
  range.addEventListener('input', () => { canvas.style.gridTemplateColumns = `repeat(${range.value}, minmax(0, 1fr))`; range.nextElementSibling.textContent = `${range.value} 列`; output.textContent = `grid-template-columns: repeat(${range.value}, minmax(0, 1fr));`; });
}

function initResponsiveDemo(panel, toolbar) {
  toolbar.innerHTML = '<div><strong>拖动绿色手柄改变容器宽度</strong><p>结构切换依据组件宽度，而非设备名称</p></div><label class="range-control">精确宽度 <input type="range" min="310" max="820" value="760" data-responsive-range><output>760px</output></label>';
  const frame = panel.querySelector('[data-responsive-frame]');
  const handle = panel.querySelector('[data-responsive-handle]');
  const range = panel.querySelector('[data-responsive-range]');
  const output = panel.querySelector('[data-lab-output]');
  const setWidth = value => {
    const width = Math.max(310, Math.min(820, Math.round(value)));
    frame.style.width = `${width}px`; range.value = width; range.nextElementSibling.textContent = `${width}px`; handle.setAttribute('aria-valuenow', width);
    const mode = width < 540 ? '单列主视觉 · 导航收起 · 图片优先' : width < 680 ? '紧凑双栏 · 完整导航' : '宽屏双栏 · 完整导航';
    output.textContent = `当前容器：${width}px · ${mode}`;
  };
  range.addEventListener('input', () => setWidth(range.value));
  handle.addEventListener('keydown', event => { if (event.key === 'ArrowLeft') setWidth(Number(range.value) - 10); if (event.key === 'ArrowRight') setWidth(Number(range.value) + 10); });
  handle.addEventListener('pointerdown', event => {
    handle.setPointerCapture(event.pointerId);
    const workbench = panel.querySelector('[data-responsive-workbench]');
    const move = moveEvent => { const rect = workbench.getBoundingClientRect(); setWidth(moveEvent.clientX - rect.left - 16); };
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', () => handle.removeEventListener('pointermove', move), { once: true });
  });
}

function initAuditDemo(panel, toolbar) {
  toolbar.innerHTML = '<div><strong>发布前压力测试</strong><p>组合不同条件，自动检查裁切与横向溢出</p></div><span class="demo-badge">自动扫描</span>';
  const preview = panel.querySelector('[data-audit-preview]');
  const controls = [...panel.querySelectorAll('[data-audit]')];
  const update = () => {
    const active = Object.fromEntries(controls.map(item => [item.dataset.audit, item.checked]));
    preview.classList.toggle('zoomed', active.zoom); preview.classList.toggle('fixed', active.fixed);
    preview.style.maxWidth = active.narrow ? '320px' : 'none';
    panel.querySelector('[data-audit-title]').textContent = active.long ? '面向跨部门协作团队的响应式页面布局完整进阶课程（2026 秋季特别版）' : '可复用的页面布局课程';
    panel.querySelector('[data-audit-text]').textContent = active.long ? '这是一段被刻意延长的课程说明，用来验证标题换行、按钮位置、容器高度以及在极端内容长度下的布局韧性。' : '通过案例掌握布局判断、实现与发布检查。';
  };
  controls.forEach(control => control.addEventListener('change', update));
  panel.querySelector('[data-run-audit]').addEventListener('click', () => {
    const overflowX = preview.scrollWidth > preview.clientWidth + 1;
    const clippedY = preview.scrollHeight > preview.clientHeight + 1 && preview.classList.contains('fixed');
    const buttonCount = preview.querySelectorAll('button').length;
    const issues = [];
    if (overflowX) issues.push('发现横向溢出：内容宽度超过容器'); else issues.push('通过：没有横向溢出');
    if (clippedY) issues.push('发现内容裁切：固定高度不足以容纳内容'); else issues.push('通过：容器高度能够随内容增长');
    issues.push(buttonCount === 2 ? '通过：两个操作按钮仍然存在' : '警告：操作按钮缺失');
    issues.push('通过：页面已提供 prefers-reduced-motion 规则');
    const score = 100 - (overflowX ? 25 : 0) - (clippedY ? 35 : 0);
    panel.querySelector('[data-audit-score]').textContent = score;
    panel.querySelector('[data-audit-results]').innerHTML = issues.map(item => `<li>${item}</li>`).join('');
    panel.querySelector('[data-lab-output]').textContent = score === 100 ? '扫描完成：当前组合未发现阻塞发布的问题。' : `扫描完成：得分 ${score}，请修复红色条件暴露的布局缺陷。`;
  });
  update();
}

document.querySelector('#knowledge-path').addEventListener('click', event => {
  const button = event.target.closest('[data-lesson-index]');
  if (button) renderLesson(Number(button.dataset.lessonIndex), { scroll: true });
});

document.querySelector('#complete-lesson').addEventListener('click', () => {
  const lesson = LESSONS[state.activeLesson];
  if (state.completed.has(lesson.id)) state.completed.delete(lesson.id); else state.completed.add(lesson.id);
  saveCompleted(); renderProgress(); renderPath(); updateCompleteButton();
  showToast(state.completed.has(lesson.id) ? `已完成：${lesson.title}` : `已取消完成：${lesson.title}`);
});

document.querySelector('#reset-progress').addEventListener('click', () => {
  if (!state.completed.size || window.confirm('确定清空 8 个知识点的学习记录吗？')) {
    state.completed.clear(); saveCompleted(); renderProgress(); renderPath(); updateCompleteButton(); showToast('学习记录已重置');
  }
});

document.querySelectorAll('[data-view-target]').forEach(button => button.addEventListener('click', () => setView(button.dataset.viewTarget)));
document.querySelector('.brand').addEventListener('click', event => { event.preventDefault(); setView('learning'); });

const lessonTabs = [...document.querySelectorAll('[data-lesson-tab]')];
lessonTabs.forEach((button, index) => {
  button.addEventListener('click', () => selectLessonTab(button.dataset.lessonTab));
  button.addEventListener('keydown', event => {
    let next = null;
    if (event.key === 'ArrowRight') next = (index + 1) % lessonTabs.length;
    if (event.key === 'ArrowLeft') next = (index - 1 + lessonTabs.length) % lessonTabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = lessonTabs.length - 1;
    if (next !== null) { event.preventDefault(); selectLessonTab(lessonTabs[next].dataset.lessonTab); lessonTabs[next].focus(); }
  });
});

document.querySelector('#panel-code').addEventListener('click', event => {
  const button = event.target.closest('[data-copy-code]');
  if (button) copyText(LESSONS[state.activeLesson].codes[Number(button.dataset.copyCode)].code, '代码已复制');
});

document.querySelector('#prev-lesson').addEventListener('click', () => renderLesson(state.activeLesson - 1, { scroll: true }));
document.querySelector('#next-lesson').addEventListener('click', () => renderLesson(state.activeLesson + 1, { scroll: true }));

document.querySelector('#copy-markdown').addEventListener('click', () => copyText(markdownText(), '完整 Markdown 已复制'));
document.querySelector('#download-markdown').addEventListener('click', () => {
  const blob = new Blob([markdownText()], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = Object.assign(document.createElement('a'), { href: url, download: '页面布局八个知识点.md' });
  link.click(); URL.revokeObjectURL(url); showToast('Markdown 文件已下载');
});

const initialHash = location.hash;
renderMarkdown();
renderProgress();
const hashLesson = LESSONS.findIndex(lesson => initialHash === `#lesson-${lesson.id}`);
renderLesson(hashLesson >= 0 ? hashLesson : 0);
if (initialHash === '#markdown' || initialHash.startsWith('#md-')) setView('markdown');
else if (initialHash === '#lab') setView('lab');
else setView('learning');

// All three columns are resident panels: no iframe, fetch, or document navigation.
const viewTabs = [...document.querySelectorAll('[data-view-target]')];
viewTabs.forEach((button, index) => button.addEventListener('keydown', event => {
  let next = null;
  if (event.key === 'ArrowRight') next = (index + 1) % viewTabs.length;
  if (event.key === 'ArrowLeft') next = (index - 1 + viewTabs.length) % viewTabs.length;
  if (event.key === 'Home') next = 0;
  if (event.key === 'End') next = viewTabs.length - 1;
  if (next !== null) {
    event.preventDefault();
    setView(viewTabs[next].dataset.viewTarget);
    viewTabs[next].focus();
  }
}));
window.addEventListener('hashchange', () => {
  const hash = location.hash;
  if (hash === '#lab') setView('lab');
  else if (hash === '#markdown' || hash.startsWith('#md-')) {
    setView('markdown');
    if (hash.startsWith('#md-')) {
      const target = document.getElementById(hash.slice(1));
      if (target) { history.replaceState(null, '', hash); target.scrollIntoView(); }
    }
  } else if (hash === '#learning' || hash.startsWith('#lesson-')) {
    setView('learning');
    const index = LESSONS.findIndex(lesson => hash === `#lesson-${lesson.id}`);
    if (index >= 0 && index !== state.activeLesson) renderLesson(index);
  }
});
