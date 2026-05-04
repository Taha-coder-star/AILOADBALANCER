const WINDOW_SIZE = 8;
const SPIKE_THRESHOLD = 1.5; // current rate 50% above window average = spike

class AIPredictiveStrategy {
  constructor() {
    this._history = [];
    this._rrIndex = 0;
    this.spikeDetected = false;
  }

  // Called every second with the latest throughput sample
  recordThroughput(rate) {
    this._history.push(rate);
    if (this._history.length > WINDOW_SIZE) this._history.shift();

    if (this._history.length < 3) {
      this.spikeDetected = false;
      return;
    }

    // Average of all samples except the most recent
    const previous = this._history.slice(0, -1);
    const avg = previous.reduce((a, b) => a + b, 0) / previous.length;
    const current = this._history[this._history.length - 1];

    this.spikeDetected = avg > 0 && current > avg * SPIKE_THRESHOLD;
  }

  select(servers) {
    if (servers.length === 0) throw new Error('No servers available');

    if (this.spikeDetected) {
      // Spike predicted: send to the server with the most free capacity
      return servers.reduce((best, s) => s.load < best.load ? s : best);
    }

    // Normal traffic: round robin
    const server = servers[this._rrIndex % servers.length];
    this._rrIndex++;
    return server;
  }
}

module.exports = AIPredictiveStrategy;
