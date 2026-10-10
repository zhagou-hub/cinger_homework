export const references = {
  H1: ['Computing Machinery and Intelligence', 'Turing · Mind · 1950', 'https://academic.oup.com/mind/article/LIX/236/433/986238'],
  H2: ['达特茅斯人工智能研究项目', 'Dartmouth · 1956 项目 / 1955 提案', 'https://home.dartmouth.edu/about/artificial-intelligence-ai-coined-dartmouth'],
  H3: ['R1: An Expert in the Computer Systems Domain', 'McDermott · AAAI · 1980', 'https://cdn.aaai.org/AAAI/1980/AAAI80-076.pdf'],
  H4: ['Deep Blue', 'IBM · 1997 历史记录', 'https://www.ibm.com/history/deep-blue'],
  H5: ['ImageNet Classification with Deep Convolutional Neural Networks', 'Krizhevsky 等 · NIPS · 2012', 'https://papers.nips.cc/paper/4824-imagenet-classification-with-deep-convolutional-neural-networks'],
  H6: ['AlphaGo', 'Google DeepMind · 2016 比赛', 'https://deepmind.google/research/alphago/'],
  H7: ['Attention Is All You Need', 'Vaswani 等 · 2017', 'https://arxiv.org/abs/1706.03762'],
  H8: ['Introducing ChatGPT', 'OpenAI · 2022-11-30', 'https://openai.com/index/chatgpt/'],
  H9: ['Accurate structure prediction of biomolecular interactions with AlphaFold 3', 'Abramson 等 · Nature · 2024-05-08', 'https://www.nature.com/articles/s41586-024-07487-w'],
  C1: ['人工智能定义', 'Stanford HAI', 'https://hai.stanford.edu/ai-definitions/what-is-artificial-intelligence-ai'],
  C2: ['机器学习定义', 'Stanford HAI', 'https://hai.stanford.edu/ai-definitions/what-is-machine-learning'],
  C3: ['深度学习定义', 'Stanford HAI', 'https://hai.stanford.edu/ai-definitions/what-is-deep-learning'],
  C4: ['生成式 AI 定义', 'Stanford HAI', 'https://hai.stanford.edu/ai-definitions/what-is-generative-ai'],
  C5: ['AI 术语表', 'Stanford HAI', 'https://hai.stanford.edu/ai-definitions'],
  C6: ['Explanatory memorandum on the updated OECD definition of an AI system', 'OECD · 2024', 'https://www.oecd.org/en/publications/explanatory-memorandum-on-the-updated-oecd-definition-of-an-ai-system_623da898-en.html'],
  C7: ['Machine Learning Glossary', 'Google', 'https://developers.google.com/machine-learning/glossary'],
  C8: ['Artificial Intelligence: A Modern Approach · 章节导引', 'Russell 与 Norvig', 'https://aima.cs.berkeley.edu/contents.html'],
  R2: ['Logistic regression · Sigmoid function', 'Google', 'https://developers.google.com/machine-learning/crash-course/logistic-regression/sigmoid-function'],
  R3: ['Logistic regression · Loss and regularization', 'Google', 'https://developers.google.com/machine-learning/crash-course/logistic-regression/loss-regularization'],
  R6: ['A visual introduction to machine learning', 'R2D3 · 交互设计参考', 'https://r2d3.us/visual-intro-to-machine-learning-part-1/'],
  R7: ['TensorFlow Playground', 'TensorFlow · 交互设计参考', 'https://playground.tensorflow.org/'],
  R8: ['CNN Explainer', 'Polo Club · 图像与数值联动参考', 'https://poloclub.github.io/cnn-explainer/'],
  R9: ['Large language models · Transformers', 'Google', 'https://developers.google.com/machine-learning/crash-course/llm/transformers'],
  R10: ['Vocabulary and one-hot encoding', 'Google', 'https://developers.google.com/machine-learning/crash-course/categorical-data/one-hot-encoding'],
  R11: ['CNN Explainer · 论文', 'Wang 等 · IEEE VIS · 2020', 'https://poloclub.github.io/papers/20-vis-cnnexplainer.pdf']
};
export const sourceLinks = ids => ids.map(id => `<a class="ai-source" href="${references[id][2]}" target="_blank" rel="noopener noreferrer">${id} · ${references[id][0]} ↗</a>`).join('');
const event = (id, year, name, method, fact, change, ability, relatedConceptIds, relatedTaskIds, source) => ({id, year, name, method, fact, change, ability, relatedConceptIds, relatedTaskIds, source});
export const events = [
  event('turing', 1950, '图灵提出机器智能的行为检验框架', '领域与检验', '图灵通过“模仿游戏”讨论可观察的机器智能表现，把交流中的行为作为讨论对象。', '将机器智能的问题转为可观察的交互检验，不以内部意识作为图中结论。', '通过通信关系理解检验结构；此图不模拟真实测试。', ['ai','nlp'], ['generation'], 'H1'),
  event('dartmouth', 1956, '达特茅斯项目凝聚人工智能研究议程', '领域与检验', '1955 年的提案提出研究议题，1956 年夏季研究项目凝聚人工智能研究议程，两者日期分别记录。', '语言、推理、学习等主题共同构成研究领域，研究并非始于单一模型。', '组织多个智能任务的研究方向；图中主题关系为教学示意。', ['ai','knowledge','learning'], ['classification','decision'], 'H2'),
  event('r1', 1980, '专家系统将领域知识组织为可执行规则', '知识与搜索', 'R1 系统将计算机配置的领域知识用于具体配置任务，1980 年论文记录其方法。', '领域知识被写入规则，满足条件后触发规则并产生配置结果。', '处理专门领域的知识推理；此处使用简化配置规则。', ['expert','knowledge'], ['decision'], 'H3'),
  event('deepblue', 1997, '搜索与计算支持高水平棋类决策', '知识与搜索', 'Deep Blue 在 1997 年的国际象棋比赛中战胜卡斯帕罗夫。', '探索候选走法并评估后续状态，计算支持从多个分支中选择行动。', '图中两个候选分支呈现搜索结构，不提供虚构评估分数。', ['search','planning'], ['decision'], 'H4'),
  event('alexnet', 2012, '深度卷积网络提升图像分类表现', '学习与网络', 'AlexNet 展示大规模标注图像数据与深度卷积网络结合的视觉研究成果。', '利用训练数据学习层级表征，连接图像输入、特征计算与类别输出。', '图像分类；2012 年并非深度学习诞生，图中层级为简化示意。', ['deep','cnn','vision'], ['classification'], 'H5'),
  event('alphago', 2016, '学习与搜索协同完成复杂围棋决策', '学习与网络', 'AlphaGo 在 2016 年与李世石的比赛中获胜，系统结合神经网络、学习和搜索。', '策略网络与价值网络参与搜索，学习得到的判断与候选探索协同使用。', '复杂围棋决策；此版本使用过人类棋谱，不等同于 AlphaGo Zero。', ['reinforcement','network','search'], ['decision'], 'H6'),
  event('transformer', 2017, 'Transformer 以注意力机制组织序列计算', '学习与网络', '2017 年论文提出 Transformer 架构，并在机器翻译等序列任务上验证。', '注意力组织词元之间的信息交互；点击教学矩阵的行、列观察关联。', '序列建模；矩阵数值为教学示意，不是论文中模型的实际权重。', ['transformer','network','nlp'], ['generation','classification'], 'H7'),
  event('chatgpt', 2022, '对话式生成模型向公众开放研究预览', '生成与预测', 'ChatGPT 于 2022 年 11 月 30 日发布研究预览，向公众展示对话式内容生成。', '语言模型以对话交互形式提供内容生成；图中提示和回复均为静态预设。', '文本生成与对话；2022 年并非生成式 AI 的诞生，也未在此调用模型。', ['generative','llm','nlp'], ['generation'], 'H8'),
  event('alphafold3', 2024, '生成模型扩展生物分子结构预测', '生成与预测', 'AlphaFold 3 论文于 2024 年 5 月 8 日发表，扩展生物分子复合物的结构预测。', '生成模型用于组织分子之间的结构预测，任务扩展到多种生物分子相互作用。', '分子输入与预测结构均为抽象示意，未使用或重标现有结构数据库模型。', ['generative','deep'], ['estimation','generation'], 'H9')
];
const concept = (id, name, group, dimension, definition, example, sources, relations, relatedEventIds, relatedTaskIds) => ({id, name, group, dimension, definition, example, sources, relations: relations.map(([to,label]) => ({id: `${id}-${to}`, to, label})), relatedEventIds, relatedTaskIds, level: id === 'ai' ? 1 : ['learning','deep','network','transformer','llm','generative'].includes(id) ? 2 : 3});
export const concepts = [
  concept('ai','人工智能',0,'研究领域','研究使机器完成智能任务的方法与系统。','棋类决策、图像识别。',['C1'],[['learning','包含方法'],['knowledge','包含方法'],['search','包含方法']],['turing','dartmouth'],['classification','decision']),
  concept('learning','机器学习',0,'技术方法','利用数据构建和改进完成任务的模型。','利用带标签的水果图片学习分类。',['C2'],[['ai','属于'],['deep','包含方法'],['supervised','包含方式']],['alexnet'],['classification','estimation']),
  concept('deep','深度学习',0,'学习方法','利用多层神经网络学习数据表示。','AlexNet 图像分类。',['C3','H5'],[['learning','属于'],['network','使用结构'],['cnn','可使用']],['alexnet','alphafold3'],['classification','generation']),
  concept('knowledge','知识表示',0,'技术方法','以可操作形式描述对象、关系和规则。','计算机配置规则与领域知识。',['C8','H3'],[['expert','用于'],['ai','属于方法']],['r1'],['decision']),
  concept('search','搜索',0,'求解方法','探索候选状态或方案，寻找满足目标的解。','探索棋局候选走法。',['C8','H4'],[['planning','支持'],['ai','属于方法']],['deepblue','alphago'],['decision']),
  concept('expert','专家系统',0,'系统类型','结合领域知识和推理机制处理专门任务。','R1 配置系统。',['H3'],[['knowledge','使用'],['ai','属于系统']],['r1'],['decision']),
  concept('supervised','监督学习',1,'学习方式','利用输入及对应目标训练模型。','利用标注为苹果或香蕉的图片学习分类。',['C7'],[['learning','属于'],['training','用于过程']],['alexnet'],['classification','estimation']),
  concept('unsupervised','无监督学习',1,'学习方式','从没有目标标签的数据中发现结构。','将相似样本聚成组。',['C7'],[['learning','属于']],[],['classification']),
  concept('self','自监督学习',1,'学习方式','从数据本身构造学习目标。','根据上下文恢复被遮挡内容。',['C7'],[['learning','属于'],['llm','可用于训练']],[],['generation']),
  concept('reinforcement','强化学习',1,'学习方式','通过环境交互和奖励学习行动策略。','基于奖励改进行动选择。',['C7'],[['learning','属于'],['planning','可支持']],['alphago'],['decision']),
  concept('training','训练',1,'学习过程','按学习目标调整模型参数。','根据预测误差调整模型参数。',['R3'],[['supervised','常见方式'],['learning','用于方法']],['alexnet'],['classification']),
  concept('inference','推理',1,'使用过程','在本页语境中，利用给定模型处理输入并计算输出。','使用已训练的模型识别一张新水果图片。',['R2'],[['training','使用训练结果']],[],['classification']),
  concept('network','神经网络',2,'模型结构','通过连接的计算单元与参数表示输入输出关系。','多层图像模型。',['C3','H5'],[['deep','多层结构用于'],['cnn','包含结构'],['transformer','包含架构']],['alexnet','alphago'],['classification','generation']),
  concept('cnn','卷积神经网络',2,'模型结构','使用卷积运算处理局部模式的神经网络。','图像局部特征计算。',['R8','R11'],[['network','属于'],['vision','用于']],['alexnet'],['classification']),
  concept('transformer','Transformer',2,'模型架构','以注意力机制组织信息交互的神经网络架构。','2017 年机器翻译研究。',['H7'],[['network','属于'],['nlp','可用于']],['transformer'],['generation','classification']),
  concept('llm','大语言模型',2,'模型类型','经过大规模训练、面向语言建模的模型。','对话、文本分类与摘要。',['R9'],[['transformer','常用结构'],['nlp','用于']],['chatgpt'],['generation','classification']),
  concept('generative','生成式 AI',3,'任务目标','主要用于生成文本、图像等内容的 AI。','根据提示生成文本、图像或代码。',['C4'],[['llm','相关模型'],['ai','属于系统']],['chatgpt','alphafold3'],['generation']),
  concept('vision','计算机视觉',3,'研究领域','从图像或视频中提取和处理信息。','图像分类。',['H5','R8'],[['cnn','常用结构'],['ai','相关领域']],['alexnet'],['classification']),
  concept('nlp','自然语言处理',3,'研究领域','面向人类语言的分析、理解与生成任务。','文本分类与机器翻译。',['C7','H7'],[['llm','可使用'],['ai','相关领域']],['transformer','chatgpt'],['classification','generation']),
  concept('speech','语音识别',3,'任务类型','将语音信号转换为文字。','语音转写。',['C8'],[['nlp','相关领域']],[],['classification']),
  concept('multimodal','多模态',3,'系统特征','处理或关联文本、图像等多种信息形式。','图文联合输入。',['C7'],[['vision','可结合'],['nlp','可结合']],[],['classification','generation']),
  concept('planning','规划',3,'任务类型','在目标与约束下构造行动方案。','从起点到终点的路线规划。',['C8'],[['search','可借助']],['deepblue','alphago'],['decision'])
];
export const tasks = [
  {id:'classification',name:'识别与分类',input:'图像、声音、文本或特征',output:'类别、对象位置、识别标签',goal:'区分输入所属的类别或识别目标。',explanation:'零件缩略图对应“合格 / 缺陷”类别标签，图形展示任务的输入输出结构。',methods:'规则、机器学习、深度学习等',relatedConceptIds:['vision','supervised','speech']},
  {id:'estimation',name:'数值预测与估计',input:'历史记录、当前特征',output:'数值估计或未来趋势',goal:'根据输入估计一个数值或趋势。',explanation:'实心点为已有观测，空心点为预设下一时段估计；数值为固定合成教学序列。',methods:'回归、时序模型等',relatedConceptIds:['learning','supervised']},
  {id:'generation',name:'内容生成',input:'提示、上下文或条件',output:'新的文本、图像或代码',goal:'根据条件产生新的内容。',explanation:'预设提示对应静态说明文字；此处仅说明用途，不运行生成模型。',methods:'语言模型、扩散模型等',relatedConceptIds:['generative','llm','nlp']},
  {id:'decision',name:'决策与控制',input:'当前状态、目标与约束',output:'行动建议、计划或控制指令',goal:'选择行动或构造满足约束的计划。',explanation:'网格标出障碍、目标及候选路线；选定路线为预设任务示意，执行仍需要控制系统。',methods:'搜索、规划、强化学习等',relatedConceptIds:['planning','search','reinforcement']}
];
