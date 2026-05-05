const getAlgorithm = require('../algorithms/index');
const RoundRobinStrategy = require('../algorithms/roundRobin');
const LeastConnectionsStrategy = require('../algorithms/leastConnections');
const AIPredictiveStrategy = require('../algorithms/aiPredictive');
const Server = require('../server');

function makeServers(n) {
  return Array.from({ length: n }, (_, i) => new Server(`s${i + 1}`));
}

// ── Factory ────────────────────────────────────────────────────────────────

describe('getAlgorithm factory', () => {
  test('returns RoundRobinStrategy for roundRobin', () => {
    expect(getAlgorithm('roundRobin')).toBeInstanceOf(RoundRobinStrategy);
  });

  test('returns LeastConnectionsStrategy for leastConnections', () => {
    expect(getAlgorithm('leastConnections')).toBeInstanceOf(LeastConnectionsStrategy);
  });

  test('returns AIPredictiveStrategy for aiPredictive', () => {
    expect(getAlgorithm('aiPredictive')).toBeInstanceOf(AIPredictiveStrategy);
  });

  test('throws on unknown algorithm name', () => {
    expect(() => getAlgorithm('unknown')).toThrow('Unknown algorithm');
  });

  test('VALID_ALGORITHMS has exactly 3 entries', () => {
    expect(getAlgorithm.VALID_ALGORITHMS).toHaveLength(3);
    expect(getAlgorithm.VALID_ALGORITHMS).toContain('roundRobin');
    expect(getAlgorithm.VALID_ALGORITHMS).toContain('leastConnections');
    expect(getAlgorithm.VALID_ALGORITHMS).toContain('aiPredictive');
  });
});

// ── Round Robin ────────────────────────────────────────────────────────────

describe('RoundRobinStrategy', () => {
  test('throws when server list is empty', () => {
    const rr = new RoundRobinStrategy();
    expect(() => rr.select([])).toThrow('No servers available');
  });

  test('returns the only server when list has one', () => {
    const rr = new RoundRobinStrategy();
    const [s] = makeServers(1);
    expect(rr.select([s])).toBe(s);
  });

  test('rotates across servers in order', () => {
    const rr = new RoundRobinStrategy();
    const servers = makeServers(3);
    expect(rr.select(servers)).toBe(servers[0]);
    expect(rr.select(servers)).toBe(servers[1]);
    expect(rr.select(servers)).toBe(servers[2]);
    expect(rr.select(servers)).toBe(servers[0]);
  });

  test('skips saturated servers (load >= 100)', () => {
    const rr = new RoundRobinStrategy();
    const servers = makeServers(3);
    // Saturate first server
    for (let i = 0; i < 20; i++) servers[0].addConnection();
    expect(servers[0].load).toBe(100);
    // Should skip servers[0] and pick servers[1]
    expect(rr.select(servers)).toBe(servers[1]);
  });

  test('falls back to current index when all servers are saturated', () => {
    const rr = new RoundRobinStrategy();
    const servers = makeServers(2);
    for (const s of servers) for (let i = 0; i < 20; i++) s.addConnection();
    const result = rr.select(servers);
    expect(servers).toContain(result);
  });
});

// ── Least Connections ──────────────────────────────────────────────────────

describe('LeastConnectionsStrategy', () => {
  test('throws when server list is empty', () => {
    const lc = new LeastConnectionsStrategy();
    expect(() => lc.select([])).toThrow('No servers available');
  });

  test('returns server with fewest active connections', () => {
    const lc = new LeastConnectionsStrategy();
    const servers = makeServers(3);
    servers[0].addConnection();
    servers[0].addConnection();
    servers[1].addConnection();
    // servers[2] has 0 connections — should win
    expect(lc.select(servers)).toBe(servers[2]);
  });

  test('distributes randomly among tied servers', () => {
    const lc = new LeastConnectionsStrategy();
    const servers = makeServers(3); // all at 0
    const chosen = new Set();
    for (let i = 0; i < 100; i++) chosen.add(lc.select(servers).id);
    // All three servers should have been chosen at least once
    expect(chosen.size).toBe(3);
  });
});

// ── AI Predictive ──────────────────────────────────────────────────────────

describe('AIPredictiveStrategy', () => {
  test('throws when server list is empty', () => {
    const ai = new AIPredictiveStrategy();
    expect(() => ai.select([])).toThrow('No servers available');
  });

  test('spikeDetected starts as false', () => {
    const ai = new AIPredictiveStrategy();
    expect(ai.spikeDetected).toBe(false);
  });

  test('fewer than 3 samples keeps spikeDetected false', () => {
    const ai = new AIPredictiveStrategy();
    ai.recordThroughput(10);
    ai.recordThroughput(20);
    expect(ai.spikeDetected).toBe(false);
  });

  test('detects a spike when current rate > previous average × 1.5', () => {
    const ai = new AIPredictiveStrategy();
    ai.recordThroughput(10);
    ai.recordThroughput(10);
    ai.recordThroughput(10);
    ai.recordThroughput(100); // way above average of 10
    expect(ai.spikeDetected).toBe(true);
  });

  test('no spike when current rate is within normal range', () => {
    const ai = new AIPredictiveStrategy();
    ai.recordThroughput(10);
    ai.recordThroughput(10);
    ai.recordThroughput(10);
    ai.recordThroughput(12); // only slightly above average
    expect(ai.spikeDetected).toBe(false);
  });

  test('normal mode uses round robin', () => {
    const ai = new AIPredictiveStrategy();
    const servers = makeServers(3);
    // No spike — should rotate
    expect(ai.select(servers)).toBe(servers[0]);
    expect(ai.select(servers)).toBe(servers[1]);
    expect(ai.select(servers)).toBe(servers[2]);
  });

  test('spike mode routes to server with lowest load', () => {
    const ai = new AIPredictiveStrategy();
    const servers = makeServers(3);
    // Load up servers[0] and servers[1]
    for (let i = 0; i < 10; i++) servers[0].addConnection();
    for (let i = 0; i < 5; i++) servers[1].addConnection();
    // Trigger spike
    ai.recordThroughput(10);
    ai.recordThroughput(10);
    ai.recordThroughput(10);
    ai.recordThroughput(100);
    expect(ai.spikeDetected).toBe(true);
    expect(ai.select(servers)).toBe(servers[2]); // lowest load = 0%
  });

  test('history window is capped at 8 samples', () => {
    const ai = new AIPredictiveStrategy();
    for (let i = 0; i < 10; i++) ai.recordThroughput(5);
    expect(ai._history.length).toBe(8);
  });
});
