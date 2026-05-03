class RoundRobinStrategy {
  constructor() {
    this.index = 0;
  }

  select(servers) {
    if (servers.length === 0) throw new Error('No servers available');
    const start = this.index;
    for (let i = 0; i < servers.length; i++) {
      const candidate = servers[(start + i) % servers.length];
      if (candidate.load < 100) {
        this.index = (start + i + 1) % servers.length;
        return candidate;
      }
    }
    // All saturated — still rotate through full list rather than hammering servers[0]
    const server = servers[this.index % servers.length];
    this.index = (this.index + 1) % servers.length;
    return server;
  }
}

module.exports = RoundRobinStrategy;
