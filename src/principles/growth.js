import {computeGenerations,trainingDataScale} from '../data/mechanism-evidence.js';

export function renderCompute(doc){
  const rows=computeGenerations;
  doc.getElementById('compute-visual').innerHTML=`<div class="ai-toolbar"><strong>同样一秒，计算能力不断跃升</strong><button class="ai-link ai-focus-trigger" data-focus="compute" aria-label="放大查看算力变化">放大查看 ⤢</button></div><figure class="compute-chip-chart" aria-label="单卡稠密FP16 Tensor Core峰值：V100为125，A100为312，H100为989.5 TFLOPS。每格表示10 TFLOPS，不表示物理核心数量。"><div class="chip-generations">${rows.map(r=>`<div class="chip-generation"><div class="chip-year">${r.year}</div><div class="capacity-chip"><div class="capacity-grid">${Array.from({length:100},(_,i)=>{const share=Math.max(0,Math.min(1,r.tflops/10-i));return `<i><b style="width:${share*100}%"></b></i>`;}).join('')}</div><strong>${r.name}</strong></div><div class="chip-capacity"><strong>${r.name==='H100'?'≈ ':''}${Math.round(r.tflops)}</strong><span>万亿次 / 秒</span></div></div>`).join('')}</div><div class="chip-progression"><span>V100</span><div><i></i><strong>${(rows.at(-1).tflops/rows[0].tflops).toFixed(1)} 倍</strong><i></i></div><span>H100</span></div></figure>`;
}

export function renderDataGrowth(doc){
  const rows=trainingDataScale;
  doc.getElementById('data-growth-visual').innerHTML=`<div class="ai-toolbar"><strong>图 01 / 学习材料，从千亿走向万亿</strong><span class="bubble-unit">预训练词元量</span></div><figure class="data-bubble-chart" aria-label="圆面积与预训练词元量成正比：2020年GPT-3为0.3万亿，2023年Llama 2为2万亿，2024年Llama 3超过15万亿。最大圆按15万亿下限绘制。"><div class="data-bubbles">${rows.map((r,i)=>`<div class="bubble-generation"><div class="bubble-stage"><div class="data-bubble" style="--diameter:${Math.sqrt(r.trillionTokens/15)*100}%;--bubble-color:${['#bac9e1','#829cc8','#486ca5'][i]}" data-tokens="${r.trillionTokens}">${i===2?'<strong>50 倍以上</strong>':''}</div></div><div class="bubble-amount">${r.label}</div><div class="bubble-model">${r.name}</div><div class="bubble-year">${r.year}</div></div>`).join('')}</div></figure>`;
}
