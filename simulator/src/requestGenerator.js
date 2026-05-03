class RequestGenerator {
  constructor(loadBalancer) {
    this.loadBalancer = loadBalancer;
    this.running = false;
    this.startTime = null;
    this.requestsInWindow = 0;
    this.windowStart = Date.now();
    this.currentThroughput = 0;
    this._throughputInterval = null;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.startTime = Date.now();
    this._scheduleNext();
    this._throughputInterval = setInterval(() => {
      const elapsed = (Date.now() - this.windowStart) / 1000;
      this.currentThroughput = elapsed > 0
        ? Math.round(this.requestsInWindow / elapsed)
        : 0;
      this.requestsInWindow = 0;
      this.windowStart = Date.now();
    }, 1000);
  }

  stop() {
    this.running = false;
    if (this._throughputInterval) {
      clearInterval(this._throughputInterval);
      this._throughputInterval = null;
    }
  }

  _scheduleNext() {
    if (!this.running) return;
    const elapsed = (Date.now() - this.startTime) / 1000;
    // Traffic spike between t=30s and t=40s
    const isSpiking = elapsed >= 30 && elapsed <= 40;
    const delay = isSpiking ? 20 : Math.floor(Math.random() * 150) + 50;

    setTimeout(() => {
      if (!this.running) return;
      this.requestsInWindow++;
      this.loadBalancer.route().catch(() => {});
      this._scheduleNext();
    }, delay);
  }

  getThroughput() {
    return this.currentThroughput;
  }
}

module.exports = RequestGenerator;
