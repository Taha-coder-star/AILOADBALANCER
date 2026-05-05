const RoundRobinStrategy = require('./roundRobin');
const LeastConnectionsStrategy = require('./leastConnections');
const AIPredictiveStrategy = require('./aiPredictive');

const VALID_ALGORITHMS = ['roundRobin', 'leastConnections', 'aiPredictive'];

function getAlgorithm(name) {
  switch (name) {
    case 'roundRobin': return new RoundRobinStrategy();
    case 'leastConnections': return new LeastConnectionsStrategy();
    case 'aiPredictive': return new AIPredictiveStrategy();
    default: throw new Error(`Unknown algorithm: "${name}". Valid options: ${VALID_ALGORITHMS.join(', ')}`);
  }
}

getAlgorithm.VALID_ALGORITHMS = VALID_ALGORITHMS;
module.exports = getAlgorithm;
