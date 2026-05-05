class LeastConnectionsStrategy {
  select(servers) {
    if (servers.length === 0) throw new Error('No servers available');
    const minConns = Math.min(...servers.map(s => s.activeConnections));
    const tied = servers.filter(s => s.activeConnections === minConns);
    return tied[Math.floor(Math.random() * tied.length)];
  }
}

module.exports = LeastConnectionsStrategy;
