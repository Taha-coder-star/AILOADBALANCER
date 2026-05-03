const RoundRobinStrategy = require('./roundRobin');
const LeastConnectionsStrategy = require('./leastConnections');

const VALID_ALGORITHMS = ['roundRobin', 'leastConnections'];

function getAlgorithm(name) {
  switch (name) {
    case 'roundRobin': return new RoundRobinStrategy();
    case 'leastConnections': return new LeastConnectionsStrategy();
    default: throw new Error(`Unknown algorithm: "${name}". Valid options: ${VALID_ALGORITHMS.join(', ')}`);
  }
}

getAlgorithm.VALID_ALGORITHMS = VALID_ALGORITHMS;
module.exports = getAlgorithm;
