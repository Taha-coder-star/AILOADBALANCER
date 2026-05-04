const express = require('express');
const cors = require('cors');
const Server = require('./src/server');
const LoadBalancer = require('./src/loadBalancer');
const RequestGenerator = require('./src/requestGenerator');
const getAlgorithm = require('./src/algorithms/index');

const app = express();
app.use(cors());
app.use(express.json());

const servers = [
  new Server('server-1'),
  new Server('server-2'),
  new Server('server-3'),
];

let currentAlgorithm = 'roundRobin';
const lb = new LoadBalancer(servers, currentAlgorithm);
const generator = new RequestGenerator(lb);

// Observer: react to load balancer events
lb.on('overload', ({ serverId }) => {
  console.warn(`[OVERLOAD] ${serverId} is at 100% load`);
});

lb.on('algorithm-changed', ({ algorithm }) => {
  console.log(`[ALGO] Switched to: ${algorithm}`);
});

app.get('/metrics', (req, res) => {
  const throughput = generator.getThroughput();
  lb.recordThroughput(throughput);
  res.json({
    servers: servers.map(s => s.toJSON()),
    throughput,
    algorithm: currentAlgorithm,
    running: generator.running,
    spikeDetected: lb.getSpikeDetected(),
    timestamp: Date.now(),
  });
});

app.post('/algorithm', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  if (!getAlgorithm.VALID_ALGORITHMS.includes(name)) {
    return res.status(400).json({
      error: `Invalid algorithm. Valid options: ${getAlgorithm.VALID_ALGORITHMS.join(', ')}`,
    });
  }
  lb.setAlgorithm(name);
  currentAlgorithm = name;
  res.json({ success: true, algorithm: name });
});

app.post('/start', (req, res) => {
  generator.start();
  res.json({ success: true });
});

app.post('/stop', (req, res) => {
  generator.stop();
  res.json({ success: true });
});

if (require.main === module) {
  generator.start();
  setInterval(() => {
    const loads = servers.map(s => `${s.id}: ${Math.round(s.load)}%`).join(' | ');
    console.log(`[${new Date().toISOString()}] ${loads} | throughput: ${generator.getThroughput()} req/s | algo: ${currentAlgorithm}`);
  }, 2000);
  app.listen(3001, () => {
    console.log('Simulator running on http://localhost:3001');
  });
}

module.exports = { app };
