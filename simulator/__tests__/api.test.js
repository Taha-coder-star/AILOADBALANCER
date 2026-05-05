const request = require('supertest');
const { app } = require('../index');

describe('API Integration', () => {
  // Reset algorithm to default before each test
  beforeEach(async () => {
    await request(app)
      .post('/algorithm')
      .send({ name: 'roundRobin' });
  });

  // ── GET /metrics ──────────────────────────────────────────────────────────

  describe('GET /metrics', () => {
    test('returns 200 with correct response shape', async () => {
      const res = await request(app).get('/metrics');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('servers');
      expect(res.body).toHaveProperty('throughput');
      expect(res.body).toHaveProperty('algorithm');
      expect(res.body).toHaveProperty('running');
      expect(res.body).toHaveProperty('spikeDetected');
      expect(res.body).toHaveProperty('timestamp');
    });

    test('servers array has 3 entries with correct shape', async () => {
      const res = await request(app).get('/metrics');
      expect(res.body.servers).toHaveLength(3);
      for (const s of res.body.servers) {
        expect(s).toHaveProperty('id');
        expect(s).toHaveProperty('load');
        expect(s).toHaveProperty('activeConnections');
        expect(s).toHaveProperty('avgResponseTime');
      }
    });
  });

  // ── POST /algorithm ───────────────────────────────────────────────────────

  describe('POST /algorithm', () => {
    test('switches to leastConnections and returns success', async () => {
      const res = await request(app)
        .post('/algorithm')
        .send({ name: 'leastConnections' });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, algorithm: 'leastConnections' });
    });

    test('switches to aiPredictive and returns success', async () => {
      const res = await request(app)
        .post('/algorithm')
        .send({ name: 'aiPredictive' });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, algorithm: 'aiPredictive' });
    });

    test('returns 400 when name is missing', async () => {
      const res = await request(app)
        .post('/algorithm')
        .send({});
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'name required');
    });

    test('returns 400 for an invalid algorithm name', async () => {
      const res = await request(app)
        .post('/algorithm')
        .send({ name: 'fakeAlgo' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Invalid algorithm/);
    });

    test('algorithm change is reflected in /metrics', async () => {
      await request(app).post('/algorithm').send({ name: 'aiPredictive' });
      const res = await request(app).get('/metrics');
      expect(res.body.algorithm).toBe('aiPredictive');
    });
  });

  // ── POST /start & /stop ───────────────────────────────────────────────────

  describe('POST /start and /stop', () => {
    test('POST /start returns success', async () => {
      const res = await request(app).post('/start');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true });
    });

    test('POST /stop returns success', async () => {
      const res = await request(app).post('/stop');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true });
    });

    test('running flag is false after stop', async () => {
      await request(app).post('/stop');
      const res = await request(app).get('/metrics');
      expect(res.body.running).toBe(false);
    });

    test('running flag is true after start', async () => {
      await request(app).post('/stop');
      await request(app).post('/start');
      const res = await request(app).get('/metrics');
      expect(res.body.running).toBe(true);
    });
  });
});
