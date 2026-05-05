const Server = require('../server');
const LoadBalancer = require('../loadBalancer');

function makeServers(n) {
  return Array.from({ length: n }, (_, i) => new Server(`s${i + 1}`));
}

describe('LoadBalancer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('route() resolves with serverId and responseTime', async () => {
    const servers = makeServers(1);
    const lb = new LoadBalancer(servers);
    const promise = lb.route();
    jest.runAllTimers();
    const result = await promise;
    expect(result).toHaveProperty('serverId', 's1');
    expect(result.responseTime).toBeGreaterThanOrEqual(50);
    expect(result.responseTime).toBeLessThanOrEqual(500);
  });

  test('route() calls addConnection before resolving', async () => {
    const servers = makeServers(1);
    const lb = new LoadBalancer(servers);
    const promise = lb.route();
    // Before timer fires, connection should be added
    expect(servers[0].activeConnections).toBe(1);
    jest.runAllTimers();
    await promise;
  });

  test('route() calls removeConnection after resolving', async () => {
    const servers = makeServers(1);
    const lb = new LoadBalancer(servers);
    const promise = lb.route();
    jest.runAllTimers();
    await promise;
    expect(servers[0].activeConnections).toBe(0);
  });

  test('route() emits request event', async () => {
    const servers = makeServers(1);
    const lb = new LoadBalancer(servers);
    const handler = jest.fn();
    lb.on('request', handler);
    const promise = lb.route();
    jest.runAllTimers();
    await promise;
    expect(handler).toHaveBeenCalledWith({ serverId: 's1' });
  });

  test('route() emits overload when server load hits 100%', async () => {
    const servers = makeServers(1);
    const lb = new LoadBalancer(servers);
    // Fill server to max (20 connections = 100%)
    for (let i = 0; i < 19; i++) servers[0].addConnection();
    const handler = jest.fn();
    lb.on('overload', handler);
    const promise = lb.route();
    jest.runAllTimers();
    await promise;
    expect(handler).toHaveBeenCalledWith({ serverId: 's1' });
  });

  test('setAlgorithm switches algorithm and emits algorithm-changed', () => {
    const servers = makeServers(2);
    const lb = new LoadBalancer(servers);
    const handler = jest.fn();
    lb.on('algorithm-changed', handler);
    lb.setAlgorithm('leastConnections');
    expect(handler).toHaveBeenCalledWith({ algorithm: 'leastConnections' });
  });

  test('setAlgorithm throws on invalid name', () => {
    const lb = new LoadBalancer(makeServers(1));
    expect(() => lb.setAlgorithm('invalid')).toThrow();
  });

  test('recordThroughput delegates to AI algorithm', () => {
    const lb = new LoadBalancer(makeServers(1), 'aiPredictive');
    lb.recordThroughput(50);
    expect(lb.algorithm._history).toContain(50);
  });

  test('recordThroughput is a no-op for Round Robin', () => {
    const lb = new LoadBalancer(makeServers(1), 'roundRobin');
    expect(() => lb.recordThroughput(50)).not.toThrow();
  });

  test('getSpikeDetected returns false by default', () => {
    const lb = new LoadBalancer(makeServers(1));
    expect(lb.getSpikeDetected()).toBe(false);
  });

  test('getSpikeDetected returns true after AI detects a spike', () => {
    const lb = new LoadBalancer(makeServers(1), 'aiPredictive');
    lb.recordThroughput(10);
    lb.recordThroughput(10);
    lb.recordThroughput(10);
    lb.recordThroughput(100);
    expect(lb.getSpikeDetected()).toBe(true);
  });
});
