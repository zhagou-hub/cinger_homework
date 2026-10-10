// The chart compares dense FP16 Tensor Core peak throughput per GPU, in TFLOPS.
// H100's published sparse value (1,979) is divided by two; the chart rounds to 990.
export const computeGenerations = [
  {year:2017, name:'V100', variant:'SXM2', tflops:125},
  {year:2020, name:'A100', variant:'SXM4', tflops:312},
  {year:2022, name:'H100', variant:'SXM', tflops:1979 / 2}
];

// Tokens processed during pretraining, not parameter counts or unique documents.
// Llama 3's disclosed value is a lower bound, retained explicitly in the chart.
export const trainingDataScale = [
  {year:2020, name:'GPT-3', trillionTokens:0.3, label:'3,000 亿', lowerBound:false},
  {year:2023, name:'Llama 2', trillionTokens:2, label:'2 万亿', lowerBound:false},
  {year:2024, name:'Llama 3', trillionTokens:15, label:'超过 15 万亿', lowerBound:true}
];

export const mechanismSources = {
  compute:[
    ['NVIDIA · V100 / A100 规格对比（Table 2）','https://developer.nvidia.com/blog/nvidia-ampere-architecture-in-depth/'],
    ['NVIDIA · H100 SXM 规格与稀疏说明','https://www.nvidia.com/en-us/data-center/h100/']
  ],
  data:[
    ['GPT-3 论文 · Table 2.1','https://arxiv.org/pdf/2005.14165'],
    ['Meta · Llama 2 模型卡','https://github.com/meta-llama/llama/blob/main/MODEL_CARD.md'],
    ['Meta · Llama 3 训练数据说明','https://ai.meta.com/blog/meta-llama-3/']
  ]
};
