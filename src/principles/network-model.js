const sigmoid=z=>z>=0?1/(1+Math.exp(-z)):Math.exp(z)/(1+Math.exp(z));
export const learningBatch=[
  {input:[.1,.2,.1],target:0},{input:[.2,.4,.15],target:0},
  {input:[.35,.15,.3],target:0},{input:[.4,.3,.2],target:0},
  {input:[.8,.7,.9],target:1},{input:[.7,.6,.8],target:1},
  {input:[.65,.9,.65],target:1},{input:[.9,.5,.8],target:1}
];
export const newInputs=[[.84,.67,.73],[.12,.27,.19],[.72,.81,.69],[.24,.18,.33]];
export const initialNetwork=()=>({
  weights:[[-.5,.2,.4],[.35,-.3,.1],[.1,.4,-.2],[-.25,.15,.3]],
  biases:[0,0,0,0],outputWeights:[.5,-.4,.3,-.2],outputBias:0
});
export function forwardNetwork(model,input){
  const hidden=model.weights.map((row,j)=>sigmoid(row.reduce((z,w,i)=>z+w*input[i],model.biases[j])));
  const output=sigmoid(hidden.reduce((z,h,j)=>z+h*model.outputWeights[j],model.outputBias));
  return {input,hidden,output};
}
export function networkMetrics(model){
  let loss=0,error=0;
  for(const sample of learningBatch){const y=forwardNetwork(model,sample.input).output,p=Math.max(1e-15,Math.min(1-1e-15,y));loss-=sample.target*Math.log(p)+(1-sample.target)*Math.log(1-p);error+=Math.abs(y-sample.target);}
  return {loss:loss/learningBatch.length,error:error/learningBatch.length};
}
export function networkGradient(model){
  const gradient={weights:Array.from({length:4},()=>[0,0,0]),biases:[0,0,0,0],outputWeights:[0,0,0,0],outputBias:0},n=learningBatch.length;
  for(const sample of learningBatch){
    const {hidden,output}=forwardNetwork(model,sample.input),delta=output-sample.target;
    gradient.outputBias+=delta/n;
    for(let j=0;j<4;j++){
      gradient.outputWeights[j]+=delta*hidden[j]/n;
      const back=delta*model.outputWeights[j]*hidden[j]*(1-hidden[j]);
      gradient.biases[j]+=back/n;
      for(let i=0;i<3;i++)gradient.weights[j][i]+=back*sample.input[i]/n;
    }
  }
  return gradient;
}
export function updateNetwork(model,rate=.8){
  const g=networkGradient(model);
  return {weights:model.weights.map((row,j)=>row.map((w,i)=>w-rate*g.weights[j][i])),biases:model.biases.map((b,j)=>b-rate*g.biases[j]),outputWeights:model.outputWeights.map((w,j)=>w-rate*g.outputWeights[j]),outputBias:model.outputBias-rate*g.outputBias};
}
export function networkHistory(rounds=10,updatesPerRound=35){
  let model=initialNetwork();const rows=[{model,epoch:0,...networkMetrics(model)}];
  for(let round=1;round<=rounds;round++){
    for(let i=0;i<updatesPerRound;i++)model=updateNetwork(model);
    rows.push({model,epoch:round*updatesPerRound,...networkMetrics(model)});
  }
  return rows;
}
