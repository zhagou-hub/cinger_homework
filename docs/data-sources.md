# 数据来源、处理与限制

整理日期：2026-10-10。小型数据来自项目内交接规格的已核对结果表；ILO 作者工作簿重新下载并核验。网页运行仅使用本地静态数值。

## S01：新质生产力的内涵特征和发展重点

- 机构或作者：国家发展和改革委员会
- 版本与日期：2024-03-01
- 观测/预测时期：概念阐释
- 数据性质：概念依据
- 统计对象：新质生产力的内涵与发展重点
- 单位：定性说明
- 定位：正文

处理：据正式文件提炼概念关系；图中连线为编辑性示意，不附加数值。

限制：政策和概念文件不能作为企业效果或宏观生产率的测量。



[原文](https://www.ndrc.gov.cn/wsdwhfz/202403/t20240301_1364322.html)

## S02：关于深入实施“人工智能+”行动的意见

- 机构或作者：国务院 · 国家数据局转载
- 版本与日期：2025-08-21
- 观测/预测时期：政策方向
- 数据性质：政策背景
- 统计对象：人工智能应用与经济社会发展
- 单位：定性说明
- 定位：正式文件

处理：用于解释技术应用、协作与发展条件，未将政策目标转换为效果数据。

限制：规划与目标不是已经观测到的成果。



[正式文件](https://www.nda.gov.cn/sjj/swdt/xwfb/0826/20250826173046592282838_mobile.html)

## S03：生成式人工智能应用发展报告（2025）

- 机构或作者：CNNIC · 中国互联网络信息中心
- 版本与日期：2025-10
- 观测/预测时期：普及率：2024-12、2025-06；用途：2025-06
- 数据性质：调查汇总
- 统计对象：普及率：整体人口；用途：生成式 AI 用户
- 单位：% / 差值为百分点
- 定位：正文第 7、9 页；PDF 第 15、17 页

处理：复制已核对汇总值；两期差值 36.5 − 17.7 = 18.8 个百分点。用途为多选边际比例。

限制：不是企业采用率；用途可以重叠，不支持年龄等未提供的交叉筛选。



[官方 PDF](https://www.cnnic.net.cn/NMediaFile/2025/1021/MAIN1761038973801E6DI0GFPDE.pdf) · [报告介绍](https://www.cnnic.cn/n4/2025/1021/c88-11391.html)

## S04：Generative AI at Work

- 机构或作者：Brynjolfsson, Li & Raymond · QJE
- 版本与日期：2025 · 140(2), 889–942
- 观测/预测时期：论文企业研究样本；使用已发表汇总估计
- 数据性质：回归效果估计
- 统计对象：特定企业的客服岗位
- 单位：每小时数量 / 分钟 / 百分点 / NPS 分
- 定位：Table II 第 3 列、Table III

处理：保留系数与标准误；近似 95% 区间为系数 ± 1.96 × 标准误。解决率的系数、标准误及区间同时乘以 100 转为百分点。

限制：估计系数不是上线前后原始均值。区间跨零时不能声称明确改善；员工微观记录不公开，不能推广为全国平均效果。



[作者 PDF](https://danielle.li/assets/docs/GenerativeAIatWork.pdf) · [DOI](https://doi.org/10.1093/qje/qjae044) · [复现代码目录](https://dataverse.harvard.edu/dataset.xhtml?persistentId=doi:10.7910/DVN/FSV1X7)

## S05：MVTec AD: A Comprehensive Real-World Dataset

- 机构或作者：International Journal of Computer Vision
- 版本与日期：2021 年扩展论文
- 观测/预测时期：论文中的模型比较版本
- 数据性质：算法基准评估
- 统计对象：15 个类别 × 7 个方法，105 个评价分数
- 单位：像素级 PR-AUC，0—1
- 定位：Table 2，PDF 第 9 页

处理：重绘 Table 2；所有类别使用固定 0—1 色标。点击类别后按该行分数排序；不重算检测阈值。

限制：PR-AUC 是精确率—召回率曲线下面积，不是准确率、不良率或生产率。这是 2021 年比较，不能称为最新排行榜。



[论文 DOI](https://doi.org/10.1007/s11263-020-01400-4) · [原文 PDF](https://link.springer.com/content/pdf/10.1007/s11263-020-01400-4.pdf) · [数据集官网](https://www.mvtec.com/research-teaching/datasets/mvtec-ad)

## S06：Smart maintenance using artificial intelligence

- 机构或作者：BMW Group
- 版本与日期：2023-11-27
- 观测/预测时期：企业案例披露时点
- 数据性质：企业披露
- 统计对象：装配停线避免时间与主装配线监测覆盖
- 单位：约 500 分钟 / 年；监测覆盖约 80%
- 定位：新闻稿正文

处理：作为预测维护流程的现实说明，数值保留“约”及原始对象。

限制：企业自述，没有逐月基线、反事实或 ROI 数据；80% 不是检测准确率。



[企业新闻稿](https://www.press.bmwgroup.com/global/article/detail/T0438145EN/smart-maintenance-using-artificial-intelligence)

## S07：AI-integrated radar irrigation and corn water stress

- 机构或作者：Debangshi 等 · Agricultural & Environmental Letters
- 版本与日期：2025-12-14
- 观测/预测时期：2021、2023 年，两季研究
- 数据性质：田间系统比较
- 统计对象：美国堪萨斯州相邻约 11 与 7 公顷的两个玉米田块
- 单位：WDI、NDVI 为无量纲；误差线为 WDI 标准差
- 定位：HTML Table 1

处理：同年同阶段配对。A 为 AI 与探地雷达灌溉系统，B 为地下滴灌。WDI 越低表示水分胁迫越小。选择 NDVI 时使用独立轴且不展示未提供的误差。

限制：2023 年 V8–V11 为 A 0.11、B 0.09，A 更高。完整系统与不同田块比较不能识别 AI 算法的净贡献，也不能推算增产、利润或回收期。



[论文原文](https://acsess.onlinelibrary.wiley.com/doi/10.1002/ael2.70047)

## S08：Generative AI and Jobs: A Refined Global Index

- 机构或作者：ILO · 国际劳工组织，Working Paper 140
- 版本与日期：2025-05-20
- 观测/预测时期：2025 年评分截面
- 数据性质：职业任务暴露评估
- 统计对象：本文件 427 种职业，3,265 条任务
- 单位：职业及任务暴露分 / 职业内任务标准差
- 定位：作者工作簿 Sheet1，21 字段

处理：职业代码存字符串；职业级字段一致性检查后去重。职业代码与 taskID 组合键无重复。保留原始 potential25 等级，不依据舍入分数重算；缺失值保留 null。原文任务不替换为通用描述。

限制：报告涉及 436 个详细职业，本工作簿为 427，差异原因未追溯。暴露分不是失业概率、裁员比例或自动化工时；没有就业人数，不使用点大小表示规模。2023 与 2025 方法不同，未画跨年趋势。



[ILO 官方报告](https://www.ilo.org/publications/generative-ai-and-jobs-refined-global-index-occupational-exposure) · [作者仓库](https://github.com/pgmyrek/2025_GenAI_scores_ISCO08) · [XLSX 原文件](https://raw.githubusercontent.com/pgmyrek/2025_GenAI_scores_ISCO08/main/Final_Scores_ISCO08_Gmyrek_et_al_2025.xlsx)

## S09：Global data centre electricity consumption, 2020–2035

- 机构或作者：IEA · 国际能源署，Energy and AI
- 版本与日期：2025-04-01 图表更新
- 观测/预测时期：2020—2024 历史估计；2025—2035 研究情景
- 数据性质：历史估计与研究情景
- 统计对象：全球全部数据中心电力需求
- 单位：TWh（1 TWh = 10 亿千瓦时）
- 定位：官方图表 data-chart-csv 内嵌数据

处理：使用交接附录完整 16 年序列。null 不绘成 0。2024 年共同起点只连接线段；四个情景分别显示，固定 0—1800 TWh 纵轴。

限制：不是仅 AI 用电。2026 年等数值仍为 2025 年的预测；情景互斥，不相加、不堆叠、不赋概率。情景差距不是置信区间。正文近似值约 415/945 与图表 416/946 不混用。

CC BY 4.0，IEA (2025)，本项目重新绘图与中文标注。

[官方图表](https://www.iea.org/data-and-statistics/charts/global-data-centre-electricity-consumption-by-sensitivity-case-2020-2035) · [报告章节](https://www.iea.org/reports/energy-and-ai/energy-demand-from-ai)

## S10：Global AI Diffusion · Q2 2026 update

- 机构或作者：Microsoft AI Economy Institute（AIEI）
- 版本与日期：Q2 2026 数据更新；本站核对于 2026-10-10
- 观测/预测时期：2025 上半年、2025 下半年、2026 第一季度、2026 第二季度
- 数据性质：人口校正的使用率估计
- 统计对象：147 个国家和地区的生成式 AI 产品使用者
- 单位：% 估计使用率
- 定位：AI_Diffusion_Q22026_Update.csv，147 行

处理：基于聚合匿名遥测，按设备和操作系统份额、互联网普及及人口校正。保留四期原值；各期使用同一固定色标。Natural Earth 1:50m 几何采用 Natural Earth 投影并轻度简化；小地区圆点仅辅助点击。

限制：这是模型估计，不是全国人口抽样调查，也不是产业实力或生产率效果。未公布的地区显示灰色；地图面积不代表用户数量。微软与 CNNIC 使用不同数据和方法，数值不直接比较。

微软数据：MIT；Natural Earth 地理数据：公共领域。图表重绘、中文标注由本项目完成。

[微软数据仓库](https://github.com/microsoft/ai-diffusion-report) · [固定版本 CSV](https://raw.githubusercontent.com/microsoft/ai-diffusion-report/507c31611c2af77abf44de43036f3ea1d599c248/data/AI_Diffusion_Q22026_Update.csv) · [技术方法](https://arxiv.org/abs/2511.02781) · [地图底图](https://www.naturalearthdata.com/about/terms-of-use/)

## S11：Anthropic Economic Index · June 2026 release

- 机构或作者：Anthropic
- 版本与日期：2026-06-26
- 观测/预测时期：2026-05-01 至 2026-06-01（结束日不含）
- 数据性质：平台请求分类汇总
- 统计对象：Claude Chat 与 Cowork（Free、Pro、Max）的全球请求样本
- 单位：% 请求分类比例
- 定位：aei_claude_ai_2026-06-26.csv：GLOBAL / request / hierarchy_level=2 / metric_id=pct

处理：提取 20 个已公布 Major 类别，保留原名称、UUID 与两位小数。类别原值合计 98.67%；矩形面积按这一合计分配，标签仍显示原始百分比。颜色用于区分类别，不表示高低。

限制：单一平台样本，不能推广为全体 AI 用户。未发布、未分类或阈值处理的剩余比例原因未追溯，未虚构类别补到 100%。类别用途不能直接证明生产率提升。中文用途说明为编辑性解释，英文原名保留。

本次发布数据说明标注 CC-BY，署名 Anthropic（2026）。

[数据集](https://huggingface.co/datasets/Anthropic/EconomicIndex/tree/main/release_2026_06_26) · [发布数据说明](https://huggingface.co/datasets/Anthropic/EconomicIndex/blob/main/release_2026_06_26/data_documentation.md)

## S12：AI 产品的用户类型细分与画像分析

- 机构或作者：甲子光年智库
- 版本与日期：2025-06 发布
- 观测/预测时期：2025 年 3—4 月在线问卷
- 数据性质：在线用户问卷的省级样本排名
- 统计对象：了解并使用过 AI 产品的受访者；有效问卷 633，目标用户 608
- 单位：位次，非普及率；人群样本数为人
- 定位：PDF 第 2 页：样本；第 9 页：类型；第 28 页：省份 Top10

处理：人工核对第 28 页四组 Top10 顺序。目标用户 N=608、工具用户 N=231、助手用户 N=288、AI 原生用户 N=73。格子等大，颜色编码第 1—3、4—6、7—10 位；所有其他地区保留未公布。

限制：非全国代表性概率抽样。报告只提供 Top10 的顺序，未公布省级比例、当地人口或其他位次。样本分布不是当地 AI 使用率，也不能判断哪一省居民接触 AI 最多。未公布不能补零。AI 原生用户样本尤其小，排名只作探索性观察。



[原作者报告 PDF（东方财富托管）](https://pdf.dfcfw.com/pdf/H3_AP202507021701439596_1.pdf?1751450653000.pdf=) · [出品机构](https://www.jazzyear.com/)

## S16：Experimental evidence on the productivity effects of generative artificial intelligence

- 机构或作者：Shakked Noy & Whitney Zhang · Science
- 版本与日期：2023-07-14
- 观测/预测时期：2023年实验及发表结果
- 数据性质：预注册随机实验
- 统计对象：453名受过大学教育的专业人员，职业写作任务
- 单位：相对变化%；网页指数以各指标对照组=100
- 定位：Science 381(6654), 187–192，已发表摘要

处理：保留摘要公布的耗时下降40%、作品质量提高18%。分别换算为指数60和118。两指标各有分母，不把质量分数当作合格率。

限制：任务范围为中等复杂度写作，不代表全部岗位或全国生产率；本图没有原始分钟、评分均值或标准误，不补造误差区间。



[发表论文](https://doi.org/10.1126/science.adh2586) · [发表摘要（PubMed）](https://pubmed.ncbi.nlm.nih.gov/37440646/) · [作者早期工作论文（版本有别）](https://economics.mit.edu/sites/default/files/inline-files/Noy_Zhang_1.pdf)

## S17：DeepMind AI Reduces Google Data Centre Cooling Bill by 40%

- 机构或作者：Richard Evans & Jim Gao · Google DeepMind
- 版本与日期：2016-07-20
- 观测/预测时期：新闻稿描述的现场测试
- 数据性质：企业测试披露
- 统计对象：Google现场数据中心冷却控制测试
- 单位：冷却用电相对变化；PUE额外开销相对变化
- 定位：正文测试结果段

处理：使用披露的冷却用电下降最高40%与PUE额外开销下降15%，分别归一为100→60和100→85。PUE=总能耗/IT能耗，额外开销为PUE高于1的部分。

限制：40%不是全部数据中心用电降幅。两指标分母不同，不相加；属于企业自述，未获得原始序列、独立复算或可推广的反事实估计。



[企业原文](https://deepmind.google/blog/deepmind-ai-reduces-google-data-centre-cooling-bill-by-40/)

## S18：Applying and improving AlphaFold at CASP14

- 机构或作者：AlphaFold研究团队 · Proteins
- 版本与日期：论文2021在线发表；CASP14评测2020
- 观测/预测时期：CASP14固定评测版本
- 数据性质：盲评结果汇总
- 统计对象：CASP14中92个结构域，best-of-five评价
- 单位：GDT_TS 0–100；结构域个数
- 定位：正文评测说明：92个结构域、87个>70、58个>90、中位数92.4

处理：从累积阈值计数推导互斥区间：>90为58，70<分数≤90为29，≤70为5；三组相加92。每格代表一个结构域，按汇总区间分组。

限制：结构域不是蛋白质个数；没有逐域得分或原始次序，未画逐域成绩。GDT_TS为结构相似性度量，不能解释为预测正确概率。研究工具的能力不等同于实际药物研发成果。



[作者论文全文（PMC）](https://pmc.ncbi.nlm.nih.gov/articles/PMC9299164/) · [研究团队评测介绍](https://deepmind.google/blog/alphafold-a-solution-to-a-50-year-old-grand-challenge-in-biology/)

## S19：Introducing the Anthropic Economic Index · first release

- 机构或作者：Anthropic
- 版本与日期：2025-02-10
- 观测/预测时期：首期研究对话样本；不是2026年最新比例
- 数据性质：平台对话任务模式分类
- 统计对象：Claude.ai Free与Pro相关对话样本，约100万对话研究
- 单位：% 分类对话
- 定位：Automation versus augmentation，配图替代文本公布五类分项

处理：保留五项比例：共同完善31.3、学习23.3、验证2.8、直接委派27.8、反馈循环14.8。增强协作加总57.4%，任务自动化42.6%；流带高度按比例线性编码。

限制：平台任务分类不是整个职业自动化比例或工时节省；不能确认每条对话都用于工作，用户可能在平台外复核。平台用户不是全体AI用户的代表性样本。



[首期研究与分类说明](https://www.anthropic.com/news/the-anthropic-economic-index) · [论文](https://arxiv.org/abs/2503.04761)

## S13：2025 AI Index Report · Technical Performance highlights

- 机构或作者：Stanford HAI
- 版本与日期：2025 年报告
- 观测/预测时期：摘要描述的 2023→2024 进步
- 数据性质：历史测试成绩增量
- 统计对象：MMMU、GPQA、SWE-bench 三项不同测试
- 单位：百分点（pp）
- 定位：官方报告页面 Top Takeaways 第 1 项

处理：保留摘要披露增量 18.8、48.9、67.3；统一使用 0–80 pp 刻度，只绘成绩变化，不补造原始得分或年度序列。

限制：不同测试的方法和难度不同；增量不表示当前分数或企业生产率，也不是 2026 年最新成绩。



[官方摘要](https://hai.stanford.edu/ai-index/2025-ai-index-report)

## S14：The use of artificial intelligence technologies in the European Union

- 机构或作者：Eurostat · 欧盟统计局
- 版本与日期：2026 年出版，KS-01-26-009-EN-N
- 观测/预测时期：2025 年企业调查；本站展示 Table 7 的 2025 列
- 数据性质：企业未采用原因调查
- 统计对象：欧盟相关行业 10 人及以上企业中，曾考虑采用但尚未使用 AI 的子样本
- 单位：% · 多选原因
- 定位：Table 7，印刷第 36 页 / PDF 第 38 页

处理：人工核对 Table 7：8 项原因 × 全部、小型、中型、大型 4 组，32 个数值。小型 10–49、中型 50–249、大型 250 人及以上。按所选规模排序，固定 0–100% 刻度。

限制：多种原因可以重叠，不加总为 100%。该子样本的比例不是全体企业未采用率，也不是中国企业的结果。旁边的行动建议为本站编辑性解读。



[官方报告 PDF](https://ec.europa.eu/eurostat/documents/7870049/23260410/KS-01-26-009-EN-N.pdf/37d063cb-28cf-3b4e-91f3-c3784c970842) · [数据表 isoc_eb_ai](https://ec.europa.eu/eurostat/databrowser/view/isoc_eb_ai/default/table?lang=en)

## S15：AlphaFold Protein Structure Database · AF-P69905-F1

- 机构或作者：Google DeepMind 与 EMBL-EBI
- 版本与日期：2026-10-10 获取；model_v6.pdb
- 观测/预测时期：固定模型 v6，非跨期比较
- 数据性质：蛋白质结构预测模型
- 统计对象：人血红蛋白 α 亚基，UniProt P69905
- 单位：坐标 Å（埃）；pLDDT 0–100；142 个残基
- 定位：API /prediction/P69905；PDB ATOM 中的 CA 记录

处理：仅提取 142 条 Cα 原子坐标、残基名和温度因子字段的 pLDDT；保存本地静态快照。旋转为围绕中心的正交投影，不改变坐标数据或置信度。颜色分界为 50、70、90，比例来自本模型。

限制：显示预测主链而非完整原子结构。pLDDT 不是正确概率，预测不是实验测定；不运行折叠模拟，也不产生药效或疾病结论。

模型数据按 AlphaFold DB 的 CC BY 4.0 许可署名；本项目绘制 Cα 视图。

[模型页面](https://alphafold.ebi.ac.uk/entry/P69905) · [原始模型 PDB](https://alphafold.ebi.ac.uk/files/AF-P69905-F1-model_v6.pdb) · [数据库与方法](https://alphafold.ebi.ac.uk/about)

## 本项目核对

ILO SHA-256：`c1940b87e7293b1eb95b530b6d3da7cd806b61d217c4bff1e69372b2cff5c90a`。21 字段，3,265 任务行，427 职业；原等级计数分别为 231、84、17、44、38、13。职业级字段一致性与职业代码/taskID 组合键唯一性通过；均值、标准差与任务分数均未发现缺失。

CNNIC 两期差值为 18.8 个百分点；7 类用途可重叠。MVTec 为 15×7=105 个 0—1 分数。农业为 8 行，2023 早期 WDI 为 0.11/0.09。客服 5 对系数/标准误按原表匹配。IEA 为 16 年，历史 5 个非空值，各情景 12 个非空值，null 不绘成零。

译名为本项目编辑性中文翻译；英文原名保留。任务目前保留完整英文原文，不以通用任务描述替代。所有比例与指数不越过其原始统计对象解释。

本站没有使用论文原图或 MVTec 原始样本图，概念图与数据图自行绘制。IEA 数据按 CC BY 4.0 署名，中文标注与重绘由本项目完成。其他研究结果只使用交接核验的小型公开数值，保留论文链接及出处；ILO 采用作者公开工作簿，不宣称拥有微观就业记录。
