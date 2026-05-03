# Software Requirements Specification
## AI-Enhanced Load Balancer Simulation
### IEEE 830 Format

---

## 1. Introduction

### 1.1 Purpose
This document specifies the software requirements for the AI-Enhanced Load Balancer Simulation system, a prototype demonstrating intelligent request distribution across virtual servers with real-time monitoring. The intended audience is the course instructor and project evaluators.

### 1.2 Scope
The system, named **AI Load Balancer**, consists of two components:
- A **Simulator** (Node.js): generates synthetic HTTP traffic, applies configurable routing algorithms, and exposes live metrics via a REST API.
- A **Dashboard** (React + Vite): consumes the simulator's API and displays server health, response times, and throughput in real time.

The system does not handle real network traffic or production infrastructure. It is a simulation for educational demonstration of load balancing concepts.

### 1.3 Definitions, Acronyms, and Abbreviations

| Term | Definition |
|------|------------|
| Load Balancer | Software component that distributes incoming requests across multiple servers |
| Round Robin | Algorithm that routes requests to servers in cyclic order |
| Least Connections | Algorithm that routes to the server with the fewest active connections |
| Strategy Pattern | OOP design pattern where a family of algorithms is encapsulated and made interchangeable |
| Observer Pattern | OOP design pattern where an object emits events and other objects subscribe to react |
| Factory Pattern | OOP design pattern where a function/method creates and returns the correct object type by name |
| Throughput | Number of requests processed per second |
| Virtual Server | In-memory object simulating a real backend server |
| REST API | Representational State Transfer Application Programming Interface |
| SRS | Software Requirements Specification |

### 1.4 References
- IEEE Std 830-1998: IEEE Recommended Practice for Software Requirements Specifications
- Express.js documentation: https://expressjs.com
- React documentation: https://react.dev
- Recharts documentation: https://recharts.org

### 1.5 Overview
Section 2 describes the overall system. Section 3 details functional and non-functional requirements. Section 4 covers external interface requirements.

---

## 2. Overall Description

### 2.1 Product Perspective
The AI Load Balancer is a self-contained prototype. It does not integrate with external systems. The simulator and dashboard communicate over localhost HTTP. Future versions could replace virtual servers with real backend services and add ML-based routing.

```
[Request Generator] ──► [Load Balancer] ──► [Virtual Servers]
                               │
                         [REST API :3001]
                               │
                         [Dashboard :5173]
```

### 2.2 Product Functions
- Generate synthetic HTTP request traffic with configurable intensity
- Route requests to virtual servers using selectable algorithms (Strategy pattern)
- Simulate response latency (50–500ms) and track server load
- Expose live metrics over HTTP (server load, response time, throughput)
- Visualise metrics in a browser dashboard with auto-refresh
- Allow runtime algorithm switching without restarting the simulator (Factory pattern)
- Emit internal events (`request`, `overload`, `algorithm-changed`) via the Observer pattern
- Simulate traffic spikes at t=30s to demonstrate load distribution differences

### 2.3 User Characteristics
Primary users: university students and instructors evaluating load balancing concepts. Users are assumed to have basic familiarity with Node.js, a terminal, and a web browser. No database or cloud knowledge is required.

### 2.4 Constraints
- **Platform**: Node.js 18+ on any OS; modern browser for dashboard
- **Language**: JavaScript only (no TypeScript)
- **Scope**: prototype only — not production-ready, no authentication, no persistence
- **Time**: 2-day development sprint
- **Port allocation**: simulator on 3001, dashboard dev server on 5173

### 2.5 Assumptions and Dependencies
- Node.js and npm are installed on the developer's machine
- The simulator is started before the dashboard attempts to connect
- No firewall blocks localhost:3001 or localhost:5173
- The browser supports ES modules and the Fetch API

---

## 3. Specific Requirements

### 3.1 Functional Requirements

#### 3.1.1 Simulator — Server Simulation
| ID | Requirement |
|----|-------------|
| FR-S01 | The system shall maintain three virtual server instances (server-1, server-2, server-3) |
| FR-S02 | Each server shall track: active connections, total requests handled, cumulative response time |
| FR-S03 | Server load shall be calculated as (activeConnections / 20) × 100, capped at 100% |
| FR-S04 | Each server shall expose its state as JSON via `toJSON()` |

#### 3.1.2 Simulator — Routing Algorithms
| ID | Requirement |
|----|-------------|
| FR-A01 | The system shall implement Round Robin routing using the Strategy pattern |
| FR-A02 | The system shall implement Least Connections routing using the Strategy pattern |
| FR-A03 | A factory function `getAlgorithm(name)` shall return the correct strategy instance |
| FR-A04 | The active algorithm shall be switchable at runtime without restarting |
| FR-A05 | Round Robin shall skip servers at 100% load; if all servers are saturated it shall still route (rotating through the pool) rather than dropping the request |

#### 3.1.3 Simulator — Request Generation
| ID | Requirement |
|----|-------------|
| FR-G01 | The request generator shall send requests at random intervals of 50–199ms under normal load |
| FR-G02 | Between t=30s and t=40s, the generator shall enter spike mode with 20ms intervals |
| FR-G03 | The generator shall support start() and stop() at runtime |
| FR-G04 | The generator shall calculate and expose throughput (requests per second) on a 1-second rolling window |

#### 3.1.4 Simulator — REST API
| ID | Requirement |
|----|-------------|
| FR-API01 | `GET /metrics` shall return servers array, throughput, algorithm name, running state, and timestamp |
| FR-API02 | `POST /algorithm` with body `{ name }` shall switch the active routing algorithm |
| FR-API03 | `POST /start` shall start the request generator if not already running |
| FR-API04 | `POST /stop` shall stop the request generator |
| FR-API05 | All API responses shall be JSON with appropriate HTTP status codes |
| FR-API06 | The API shall include CORS headers allowing requests from any origin |

#### 3.1.5 Dashboard — Data Display
| ID | Requirement |
|----|-------------|
| FR-D01 | The dashboard shall poll `/metrics` every 1000ms |
| FR-D02 | The dashboard shall display a bar chart of server load (%) for all three servers |
| FR-D03 | The dashboard shall display a line chart of average response time per server over the last 30 ticks |
| FR-D04 | The dashboard shall display a line chart of throughput (req/s) over the last 30 ticks |
| FR-D05 | A disconnection banner shall appear when the simulator is unreachable |

#### 3.1.6 Dashboard — Controls
| ID | Requirement |
|----|-------------|
| FR-C01 | A dropdown shall allow selecting Round Robin or Least Connections |
| FR-C02 | Selecting an algorithm shall POST to `/algorithm` immediately |
| FR-C03 | A Start/Stop button shall toggle simulation state via `/start` and `/stop` |
| FR-C04 | The button label and colour shall reflect the current running state |

### 3.2 Non-Functional Requirements

#### 3.2.1 Performance
| ID | Requirement |
|----|-------------|
| NFR-P01 | The simulator REST API shall respond to `/metrics` within 50ms under normal load |
| NFR-P02 | The dashboard shall render chart updates within 100ms of receiving new data |
| NFR-P03 | The system shall handle at least 50 concurrent simulated requests without crashing |

#### 3.2.2 Reliability
| ID | Requirement |
|----|-------------|
| NFR-R01 | The simulator shall not crash if the algorithm is switched during a traffic spike |
| NFR-R02 | The dashboard shall degrade gracefully (show banner) when the simulator is offline |
| NFR-R03 | Active connection counts shall never go below 0 |

#### 3.2.3 Usability
| ID | Requirement |
|----|-------------|
| NFR-U01 | A developer shall be able to run the full system in under 5 minutes following the README |
| NFR-U02 | The dashboard shall be usable without any configuration or login |

#### 3.2.4 Maintainability
| ID | Requirement |
|----|-------------|
| NFR-M01 | Adding a new routing algorithm shall require creating one new file and registering it in the factory |
| NFR-M02 | All source files shall be plain JavaScript (no build step for simulator) |

---

## 4. External Interface Requirements

### 4.1 Simulator REST API Interface

**Base URL**: `http://localhost:3001`

| Endpoint | Method | Request Body | Response |
|----------|--------|--------------|----------|
| `/metrics` | GET | — | `{ servers[], throughput, algorithm, running, timestamp }` |
| `/algorithm` | POST | `{ "name": "roundRobin" \| "leastConnections" }` | `{ "success": true, "algorithm": string }` |
| `/start` | POST | — | `{ "success": true }` |
| `/stop` | POST | — | `{ "success": true }` |

**Metrics response schema:**
```json
{
  "servers": [
    {
      "id": "server-1",
      "load": 45,
      "activeConnections": 9,
      "avgResponseTime": 213
    }
  ],
  "throughput": 12,
  "algorithm": "roundRobin",
  "running": true,
  "timestamp": 1714000000000
}
```

### 4.2 Dashboard UI Interface

| Element | Type | Behaviour |
|---------|------|-----------|
| Algorithm dropdown | `<select>` | POSTs new algorithm on change; syncs with metrics.algorithm |
| Start/Stop button | `<button>` | Toggles green/red; POSTs to /start or /stop |
| Disconnected banner | `<div>` | Shown when fetch throws; hidden when connected |
| Server Utilization chart | BarChart | X-axis: server id; Y-axis: load 0–100% |
| Response Time chart | LineChart | One line per server; 30-tick rolling window |
| Throughput chart | LineChart | Single line; 30-tick rolling window |

### 4.3 Hardware Interface Requirements
No special hardware required. Standard PC with a modern browser and Node.js runtime is sufficient.

### 4.4 Software Interface Requirements
- Node.js ≥ 18.0.0
- npm ≥ 9.0.0
- Modern browser (Chrome 90+, Firefox 88+, Edge 90+)
- OS: Windows 10+, macOS 12+, or Ubuntu 20.04+
