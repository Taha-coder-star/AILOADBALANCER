const { EventEmitter } = require('events');
const getAlgorithm = require('./algorithms/index');

class LoadBalancer extends EventEmitter {
  constructor(servers, algorithmName = 'roundRobin') {
    super();
    this.servers = servers;
    this.algorithm = getAlgorithm(algorithmName);
  }

  route() {
    const server = this.algorithm.select(this.servers);
    if (!server) throw new Error('No server selected by algorithm');
    server.addConnection();
    this.emit('request', { serverId: server.id });
    if (server.load >= 100) this.emit('overload', { serverId: server.id });
    return new Promise((resolve) => {
      const responseTime = Math.floor(Math.random() * 450) + 50; // 50–500ms
      setTimeout(() => {
        server.removeConnection(responseTime);
        resolve({ serverId: server.id, responseTime });
      }, responseTime);
    });
  }

  setAlgorithm(name) {
    this.algorithm = getAlgorithm(name);
    this.emit('algorithm-changed', { algorithm: name });
  }

  recordThroughput(rate) {
    if (typeof this.algorithm.recordThroughput === 'function') {
      this.algorithm.recordThroughput(rate);
    }
  }

  getSpikeDetected() {
    return this.algorithm.spikeDetected === true;
  }
}

module.exports = LoadBalancer;
