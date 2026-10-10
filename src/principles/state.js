import {snapshot, update, train} from './model.js';

export function createPrincipleState(data) {
  const samples = data.samples.filter(p => p.split === 'train');
  const defaults = train(samples, data.config);
  let run = 0;
  const state = {
    activeSection: 'representation', representationMode: 'image', selectedPixel: {x: 7, y: 7}, selectedToken: 0, pixelExpansion: false,
    selectedSampleId: samples[0].id, trainingHistory: [], trainingStatus: 'idle', inspectedEpoch: null,
    trainingDetail: 'parameters', showBoundaryHistory: false, showTestSamples: false,
    inferenceSnapshot: defaults.at(-1), inferenceInput: {...data.samples.find(p => p.split === 'test')},
    inferenceDetail: 'output', inferenceSyncStatus: 'ready', defaultInference: true, focusView: null
  };
  const observed = () => state.trainingHistory[state.inspectedEpoch ?? state.trainingHistory.length - 1];
  const resetTraining = () => {
    run++;
    state.trainingHistory = [snapshot(data.config.initial, samples, 0, `run${run}:0`)];
    state.modelSnapshot = state.trainingHistory[0];
    state.trainingStatus = 'idle'; state.inspectedEpoch = null; state.trainingDetail = 'parameters'; state.inferenceSyncStatus = 'needs-sync';
  };
  const step = () => {
    const head = state.trainingHistory.at(-1);
    state.inspectedEpoch = null;
    if (head.epoch >= data.config.maxEpochs) {state.trainingStatus = 'complete'; return false;}
    const next = snapshot(update(head, samples, data.config.learningRate), samples, head.epoch + 1, `run${run}:${head.epoch + 1}`);
    state.trainingHistory.push(next); state.modelSnapshot = next; state.inferenceSyncStatus = 'needs-sync';
    if (next.epoch === data.config.maxEpochs) state.trainingStatus = 'complete';
    return true;
  };
  const inspect = epoch => {
    state.trainingStatus = state.trainingHistory.at(-1).epoch === data.config.maxEpochs ? 'complete' : 'paused';
    state.inspectedEpoch = Math.min(state.trainingHistory.length - 1, Math.max(0, Math.round(epoch)));
    if (state.inspectedEpoch === 0) state.trainingDetail = 'parameters';
  };
  const commit = () => {
    state.trainingStatus = state.trainingHistory.at(-1).epoch === data.config.maxEpochs ? 'complete' : 'paused';
    state.inspectedEpoch = null;
    state.inferenceSnapshot = Object.freeze({...state.trainingHistory.at(-1)});
    state.defaultInference = false; state.inferenceSyncStatus = 'ready';
  };
  const customInput = (x, y) => {state.inferenceInput = {id: 'custom', x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y))};};
  const resetDemo = () => {
    resetTraining(); state.inferenceSnapshot = defaults.at(-1); state.defaultInference = true; state.inferenceSyncStatus = 'ready';
    state.inferenceInput = {...data.samples.find(p => p.split === 'test')}; state.inferenceDetail = 'output';
    state.representationMode = 'image'; state.selectedPixel = {x: 7, y: 7}; state.selectedToken = 0; state.pixelExpansion = false;
    state.showBoundaryHistory = false; state.showTestSamples = false; state.selectedSampleId = samples[0].id;
  };
  resetDemo();
  return {state, observed, step, inspect, commit, customInput, resetTraining, resetDemo};
}
