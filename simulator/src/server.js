const MAX_CONNECTIONS = 20;
const RESPONSE_TIME_WINDOW = 20;

class Server {
  constructor(id) {
    this.id = id;
    this.load = 0;
    this.activeConnections = 0;
    this.requestsHandled = 0;
    this._recentResponseTimes = [];
  }

  addConnection() {
    this.activeConnections++;
    this.load = Math.min((this.activeConnections / MAX_CONNECTIONS) * 100, 100);
  }

  removeConnection(responseTime) {
    this.activeConnections = Math.max(0, this.activeConnections - 1);
    this.requestsHandled++;
    this._recentResponseTimes.push(responseTime);
    if (this._recentResponseTimes.length > RESPONSE_TIME_WINDOW) {
      this._recentResponseTimes.shift();
    }
    this.load = Math.min((this.activeConnections / MAX_CONNECTIONS) * 100, 100);
  }

  reset() {
    this.activeConnections = 0;
    this.load = 0;
    this.requestsHandled = 0;
    this._recentResponseTimes = [];
  }

  getAvgResponseTime() {
    if (this._recentResponseTimes.length === 0) return 0;
    const sum = this._recentResponseTimes.reduce((a, b) => a + b, 0);
    return Math.round(sum / this._recentResponseTimes.length);
  }

  toJSON() {
    return {
      id: this.id,
      load: Math.round(this.load),
      activeConnections: this.activeConnections,
      avgResponseTime: this.getAvgResponseTime(),
      requestsHandled: this.requestsHandled,
    };
  }
}

module.exports = Server;
