// Pure calculations shared by every training, testing and inference view.
export const sigmoid = z => z >= 0 ? 1 / (1 + Math.exp(-z)) : Math.exp(z) / (1 + Math.exp(z));
export function predict(theta, input) {
  const contributions = [theta.w1 * input.x, theta.w2 * input.y, theta.b];
  const z = contributions.reduce((sum, value) => sum + value, 0);
  const scoreB = sigmoid(z);
  return {z, contributions, scoreA: 1 - scoreB, scoreB, prediction: scoreB >= .5 ? 1 : 0};
}
export function loss(theta, samples) {
  // Softplus form of cross entropy remains finite even when sigmoid rounds to 0/1.
  return samples.reduce((sum, p) => {
    const z = theta.w1 * p.x + theta.w2 * p.y + theta.b;
    return sum + Math.max(z, 0) - p.label * z + Math.log1p(Math.exp(-Math.abs(z)));
  }, 0) / samples.length;
}
export function update(theta, samples, learningRate) {
  const gradient = samples.reduce((g, p) => {
    const error = predict(theta, p).scoreB - p.label;
    return {w1: g.w1 + error * p.x, w2: g.w2 + error * p.y, b: g.b + error};
  }, {w1: 0, w2: 0, b: 0});
  return Object.fromEntries(['w1', 'w2', 'b'].map(key => [key, theta[key] - learningRate * gradient[key] / samples.length]));
}
export function snapshot(theta, samples, epoch, version) {
  return Object.freeze({...theta, epoch, version, loss: loss(theta, samples)});
}
export function train(samples, config) {
  const history = [snapshot(config.initial, samples, 0, 'default:0')];
  for (let t = 1; t <= config.maxEpochs; t++) history.push(snapshot(update(history[t - 1], samples, config.learningRate), samples, t, `default:${t}`));
  return history;
}
export function lossSlice(before, after, samples) {
  return Array.from({length: 61}, (_, i) => {
    const s = -.5 + 2.5 * i / 60;
    const theta = Object.fromEntries(['w1', 'w2', 'b'].map(k => [k, before[k] + s * (after[k] - before[k])]));
    return {s, loss: loss(theta, samples)};
  });
}
// Clip the exact iso-score equation to the unit square, including vertical lines.
export function boundary(theta, q = .5) {
  const {w1: a, w2: b} = theta, c = Math.log(q / (1 - q)) - theta.b, eps = 1e-10;
  if (Math.abs(a) < eps && Math.abs(b) < eps) return null;
  const hits = [];
  const add = (x, y) => {
    if (x >= -eps && x <= 1 + eps && y >= -eps && y <= 1 + eps && !hits.some(p => Math.hypot(p.x - x, p.y - y) < eps)) hits.push({x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y))});
  };
  if (Math.abs(b) > eps) {add(0, c / b); add(1, (c - a) / b);}
  if (Math.abs(a) > eps) {add(c / a, 0); add((c - b) / a, 1);}
  return hits.length >= 2 ? hits.slice(0, 2) : null;
}
export const correctCount = (theta, samples) => samples.filter(p => predict(theta, p).prediction === p.label).length;
export const oneHot = (index, size) => Array.from({length: size}, (_, i) => Number(i === index));
