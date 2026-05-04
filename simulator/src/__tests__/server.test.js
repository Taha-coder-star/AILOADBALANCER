const Server = require('../server');

describe('Server', () => {
  let server;

  beforeEach(() => {
    server = new Server('server-1');
  });

  test('initializes with correct defaults', () => {
    expect(server.id).toBe('server-1');
    expect(server.load).toBe(0);
    expect(server.activeConnections).toBe(0);
    expect(server._recentResponseTimes).toEqual([]);
  });

  test('addConnection increments activeConnections and load', () => {
    server.addConnection();
    expect(server.activeConnections).toBe(1);
    expect(server.load).toBe(5); // 1/20 * 100
  });

  test('load caps at 100 when activeConnections reaches 20', () => {
    for (let i = 0; i < 20; i++) server.addConnection();
    expect(server.load).toBe(100);
    server.addConnection();
    expect(server.load).toBe(100);
  });

  test('removeConnection decrements activeConnections and records response time', () => {
    server.addConnection();
    server.removeConnection(200);
    expect(server.activeConnections).toBe(0);
    expect(server._recentResponseTimes).toEqual([200]);
  });

  test('removeConnection does not go below 0', () => {
    server.removeConnection(100);
    expect(server.activeConnections).toBe(0);
  });

  test('getAvgResponseTime returns 0 with no data', () => {
    expect(server.getAvgResponseTime()).toBe(0);
  });

  test('getAvgResponseTime returns correct average', () => {
    server.removeConnection(100);
    server.removeConnection(200);
    server.removeConnection(300);
    expect(server.getAvgResponseTime()).toBe(200);
  });

  test('rolling window keeps only last 20 samples', () => {
    for (let i = 1; i <= 21; i++) server.removeConnection(i * 10);
    expect(server._recentResponseTimes.length).toBe(20);
    expect(server._recentResponseTimes[0]).toBe(20); // oldest dropped is 10
  });

  test('reset clears all state', () => {
    server.addConnection();
    server.removeConnection(150);
    server.reset();
    expect(server.activeConnections).toBe(0);
    expect(server.load).toBe(0);
    expect(server._recentResponseTimes).toEqual([]);
  });

  test('toJSON returns correct shape', () => {
    server.addConnection();
    server.removeConnection(300);
    const json = server.toJSON();
    expect(json).toEqual({
      id: 'server-1',
      load: 0,
      activeConnections: 0,
      avgResponseTime: 300,
      requestsHandled: 1,
    });
  });
});
