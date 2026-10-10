// Published case outcomes. Percentages refer to the named measure in each row.
// These are not simulated scenarios or an estimate of an entire sector's gains.
export const applicationImpacts={
 manufacturing:{
  case:'Beko · AI 工厂应用',source:'APP08',
  title:'减少次品和材料浪费，加快产品开发',
  subtitle:'企业披露的 AI 应用成果 · 不同生产环节分别统计',
  metrics:[
   {label:'缺陷率',changePct:-66,detail:'板材铆接过程：模型识别厚度变化，减少铆接缺陷。'},
   {label:'材料成本',changePct:-12.5,detail:'板材成形过程：机器学习实时调整参数，减少废料与缺陷。'},
   {label:'产品上市周期',changePct:-46,detail:'清洁程序开发：机器学习优化设计，缩短产品上市时间。'}
  ],
  conclusion:'影响：质量损失减少，材料利用改善，新产品更快进入市场。',
  boundary:'Beko 各应用环节的企业披露；未公布完整基线，不能加总为工厂整体收益。'
 },
 agriculture:{
  case:'印度 Saagu Baagu · 7,000 多名辣椒种植户',source:'APP09',
  title:'增加农业产出，同时减少投入',
  subtitle:'AI 与数字农业项目第一阶段披露 · 印度特伦甘纳邦',
  metrics:[
   {label:'每英亩辣椒产量',changePct:21,detail:'项目参与农户每英亩辣椒产量增加 21%。'},
   {label:'单位售价',changePct:8,detail:'项目披露产品质量改善后，单位售价提高 8%。'},
   {label:'农药使用量',changePct:-9,detail:'农药使用量下降 9%，降低投入和环境压力。'},
   {label:'化肥使用量',changePct:-5,detail:'化肥使用量下降 5%，改善投入效率。'}
  ],
  conclusion:'影响：同样耕地获得更多产出，投入减少，农产品售价提高。',
  boundary:'这是 AI、农技服务与市场支持的组合项目结果，不能把全部变化归于 AI 算法。'
 },
 service:{
  case:'Generative AI at Work · 5,172 名客服员工',source:'APP11',
  title:'提高服务产出，让新人更快获得工作经验',
  subtitle:'实际企业中的 AI 辅助客服 · 每小时解决问题数的相对增幅',
  metrics:[
   {label:'全体员工平均',changePct:15,detail:'研究摘要报告每小时解决问题数平均提高约 15%。'},
   {label:'新人及低技能员工',changePct:30,detail:'研究正文报告新人和低技能员工每小时解决问题数提高约 30%。'}
  ],
  conclusion:'影响：资深员工的经验更易传播；新人获益更大，服务供给能力提高。',
  boundary:'单一企业、特定客服工具的研究；资深员工收益较小，部分质量指标下降。'
 },
 science:{
  case:'GNoME · Nature 2023 · 新材料知识创新',source:'APP10',
  title:'扩大新材料知识库，为电池与电子器件研究提供线索',
  subtitle:'已有研究与 AI 研究之后的计算稳定结构／候选数量',
  metrics:[
   {label:'稳定晶体知识库',before:48000,after:421000,detail:'论文报告先前约 48,000 个计算稳定结构，更新稳定性边界后共 421,000 个；其中 381,000 个为 GNoME 新增。'},
   {label:'层状材料候选',before:1000,after:52000,detail:'与电子器件和储能研究相关的层状材料候选从约 1,000 个扩展到约 52,000 个。'},
   {label:'锂／锰氧化物候选',before:9,after:24,detail:'可供可充电电池材料研究的候选在原 9 个基础上新增 15 个，共 24 个。'}
  ],
  conclusion:'影响：拓展可探索的材料空间，为储能与电子器件创新提供新的研究对象。',
  boundary:'这些数量表示计算研究成果；候选的合成、性能与产业应用仍需实验验证。'
 }
};

export const impactSources=[
 {id:'APP08',name:'How AI is transforming the factory floor · Beko 案例',organization:'World Economic Forum · Beko 首席生产与技术官 Nihat Bayiz',year:'2024 / 2025 更新',kind:'企业应用成果披露',date:'2024-10-22 发布；2025-06-03 更新',period:'案例所述 AI 应用成果，未公布基线起止日期',location:'Nihat Bayiz / Beko 段落',unit:'各指标相对减少百分比',object:'铆接缺陷率、板材成形材料成本、清洁程序产品上市周期',method:'分别保留缺陷率下降66%、材料成本节约12.5%、上市周期下降46%。每条代表不同应用环节，不能相加；不补造改善前后的绝对值。',limit:'企业管理者披露，未公布原始序列、独立反事实或总利润。不能推广为全部制造业或认为是AI算法单独的净效应。',links:[['WEF 原文与企业署名','https://www.weforum.org/stories/all/ai-transforming-factory-floor-artificial-intelligence/']]},
 {id:'APP09',name:'AI for agriculture · Saagu Baagu 项目成效',organization:'World Economic Forum · C4IR India · Telangana government · Digital Green',year:'2024 / 2026 页面更新',kind:'农业项目成果披露',date:'2024-01-11 发布；页面2026-04-02更新',period:'Saagu Baagu 第一阶段；2023-10扩大项目范围之前的试点成果',location:'The impact of Artificial Intelligence on agriculture in India',unit:'各指标相对变化百分比',object:'印度特伦甘纳邦 Khammam 区7,000多名辣椒种植户',method:'保留每英亩产量+21%、农药-9%、化肥-5%、单位售价+8%；图表从0画各指标变化，未将100设成虚构产量。',limit:'项目融合AI与数字农技、农户服务、市场支持。公开网页没有完整对照设计及误差区间，不能将所有增益单独归因于AI，也不能推广为全国农业增幅。',links:[['项目原文','https://www.weforum.org/impact/ai-for-agriculture-in-india/']]},
 {id:'APP10',name:'Scaling deep learning for materials discovery · 科研知识扩展',organization:'Merchant et al. · Nature · Google DeepMind',year:'2023',kind:'AI辅助材料研究结果',date:'2023-11-29',period:'论文固定研究版本',location:'Main；Composition families of interest；Fig.1 / Fig.2',unit:'计算稳定结构／候选个数；图表为对数数量轴',object:'稳定晶体总库、层状材料候选、Li/Mn氧化物候选',method:'主文保留48,000→421,000（381,000新增；其余旧结构经稳定边界重算）；层状约1,000→52,000；Li/Mn原9新增15→24。数字来自计算筛选，不计为上市材料。三组有重叠，不加总；不把736个独立实验匹配误称为由本项目实验合成。',limit:'稳定性以计算为依据，候选还需实验合成、性能测试和产业评估。数量扩展不能直接推出电池能量密度或芯片性能提升。',license:'论文 CC BY 4.0；本项目重新绘图和中文说明。',links:[['论文全文','https://www.nature.com/articles/s41586-023-06735-9'],['DOI','https://doi.org/10.1038/s41586-023-06735-9']]},
 {id:'APP11',name:'Generative AI at Work · 服务生产率与经验传播',organization:'Brynjolfsson, Li & Raymond · The Quarterly Journal of Economics',year:'2025',kind:'真实工作场景的准实验研究',date:'2025-02-04 在线发表',period:'论文中的5,172名客服员工研究样本',location:'Abstract；Introduction；V.B；VI.B',unit:'每小时解决问题数相对提高百分比',object:'全体员工平均；新人及低技能员工；两者有重叠',method:'使用已发表摘要及正文的约15%和约30%汇总，不与早期版本14%/34%混用；不是原始均值，不补造两组标准误。图中两个人群不能加总。原S04的系数及标准误数据继续保留。',limit:'单一企业与特定工具。资深/高技能员工收益较小，部分质量下降；整体生产率提高不能直接当成就业或工资增长。',links:[['已发表论文','https://academic.oup.com/qje/article/140/2/889/7990658'],['DOI','https://doi.org/10.1093/qje/qjae044']]}
];
