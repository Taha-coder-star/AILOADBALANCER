class LeastConnectionsStrategy {
  select(servers) {
    if (servers.length === 0) throw new Error('No servers available');
    return servers.reduce((min, s) =>
      s.activeConnections < min.activeConnections ? s : min
    );
  }
}

module.exports = LeastConnectionsStrategy;
