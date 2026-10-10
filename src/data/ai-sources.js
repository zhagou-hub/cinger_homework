import {references} from './ai-content.js';
export const aiSources = Object.entries(references).map(([id, [name, organization, url]]) => ({
  id, name, organization, year: /^H/.test(id) ? ({H1:'1950',H2:'1956',H3:'1980',H4:'1997',H5:'2012',H6:'2016',H7:'2017',H8:'2022',H9:'2024'})[id] : '原理参考',
  kind: /^H/.test(id) ? '历史原始来源' : ['R6','R7','R8','R11'].includes(id) ? '交互设计与原理参考' : '概念与计算依据',
  date: id === 'H8' ? '2022-11-30' : id === 'H9' ? '2024-05-08' : '按原文支持的日期精度展示',
  period: /^H/.test(id) ? '精选历史节点 1950—2024' : '原理讲解', location: '原文或官方章节', unit: '定性说明 / 教学计算',
  object: /^H/.test(id) ? '对应事件与技术方法' : '概念关系与小型教学模型',
  method: '据原始来源组织中文解释。事件图、任务例、关联矩阵为教学示意；分类演示采用本地实际计算的双特征逻辑回归。',
  limit: '不是完整历史或最新进展清单。合成样本不是产业研究数据，类别得分不能直接解释为生产率或业务收益。',
  links: [['原始来源', url], ...(id === 'H2' ? [['1955 年提案','https://www-formal.stanford.edu/jmc/history/dartmouth/dartmouth.html']] : [])]
}));
