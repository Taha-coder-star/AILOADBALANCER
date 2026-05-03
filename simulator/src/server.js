const MAX_CONNECTIONS = 20;

class Server {
  constructor(id) {
    this.id = id;
    this.load = 0;
    this.activeConnections = 0;
    this.totalRequestsHandled = 0;
    this.totalResponseTime = 0;
  }

  addConnection() {
    this.activeConnections++;
    this.load = Math.min((this.activeConnections / MAX_CONNECTIONS) * 100, 100);
  }

  removeConnection(responseTime) {
    this.activeConnections = Math.max(0, this.activeConnections - 1);
    this.totalRequestsHandled++;
    this.totalResponseTime += responseTime;
    this.load = Math.min((this.activeConnections / MAX_CONNECTIONS) * 100, 100);
  }

  getAvgResponseTime() {
    if (this.totalRequestsHandled === 0) return 0;
    return Math.round(this.totalResponseTime / this.totalRequestsHandled);
  }

  toJSON() {
    return {
      id: this.id,
      load: Math.round(this.load),
      activeConnections: this.activeConnections,
      avgResponseTime: this.getAvgResponseTime(),
    };
  }
}

module.exports = Server;
