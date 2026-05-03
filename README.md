# AI-Enhanced Load Balancer

A real-time load balancer simulation with a Node.js backend and a React dashboard. The simulator routes synthetic HTTP requests across three virtual servers using pluggable algorithms (Round Robin and Least Connections). The dashboard visualises server utilisation, response times, and throughput live, and lets you switch algorithms or start/stop the simulation on the fly.

---

## Prerequisites

- Node.js 18+
- npm 9+

---

## Setup & Run

### 1. Start the Simulator

```bash
cd simulator
npm install
node index.js
```

The simulator starts on **http://localhost:3001** and begins generating traffic automatically.

### 2. Start the Dashboard

Open a second terminal:

```bash
cd dashboard
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## Project Structure

```
seproject/
├── simulator/               # Node.js load balancer simulation
│   ├── index.js             # Entry point — Express server + startup
│   └── src/
│       ├── server.js        # Virtual Server class
│       ├── loadBalancer.js  # Routes requests via strategy
│       ├── requestGenerator.js  # Synthetic traffic + spike at t=30s
│       └── algorithms/
│           ├── roundRobin.js
│           ├── leastConnections.js
│           └── index.js     # Factory: getAlgorithm(name)
├── dashboard/               # React + Vite frontend
│   └── src/
│       └── App.jsx          # Charts, controls, polling
└── docs/
    ├── uml/                 # Class & sequence diagrams
    └── SRS-outline.md       # IEEE 830 SRS
```

---

## Architecture

The simulator exposes a REST API on port 3001. Each incoming (synthetic) request is handed to the `LoadBalancer`, which delegates server selection to the active strategy object (`RoundRobinStrategy` or `LeastConnectionsStrategy`). The chosen server tracks its own active connections and response-time statistics. The dashboard polls `/metrics` every second and renders the results with Recharts.

Three design patterns are used:
- **Strategy** — `LoadBalancer` holds an `IAlgorithm` object that can be swapped at runtime.
- **Factory** — `getAlgorithm(name)` in `algorithms/index.js` returns the correct strategy instance by name.
- **Observer** — `LoadBalancer` extends Node.js `EventEmitter` and emits `request`, `overload`, and `algorithm-changed` events; `index.js` subscribes with `lb.on(...)`.

---

## Simulator API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/metrics` | Returns server stats, throughput, algorithm, running state |
| POST | `/algorithm` | Body `{ name }` — switches routing algorithm |
| POST | `/start` | Starts the request generator |
| POST | `/stop` | Stops the request generator |

---

## Dashboard Features

- **Server Utilization** — bar chart showing load % per server
- **Avg Response Time** — line chart per server over last 30 ticks
- **Throughput** — line chart of requests/second over last 30 ticks
- **Algorithm selector** — switch between Round Robin and Least Connections live
- **Start / Stop** — control the simulator from the UI
