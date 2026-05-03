# Sequence Diagram — Single Request Flow

```
RequestGenerator    LoadBalancer    IAlgorithm      Server        Express API    Dashboard
      │                  │               │              │               │              │
      │  route()          │               │              │               │              │
      │─────────────────>│               │              │               │              │
      │                  │ select(servers)│              │               │              │
      │                  │──────────────>│              │               │              │
      │                  │               │  (evaluate)  │               │              │
      │                  │               │──────────────│               │              │
      │                  │     server    │              │               │              │
      │                  │<─────────────│               │               │              │
      │                  │                addConnection()               │              │
      │                  │─────────────────────────────>│               │              │
      │                  │                              │ load++        │              │
      │                  │                              │───────        │              │
      │                  │   Promise (pending)          │               │              │
      │<─────────────────│                              │               │              │
      │                  │                              │               │              │
      │  ... wait responseTime ms (50–500) ...          │               │              │
      │                  │                              │               │              │
      │                  │          removeConnection(responseTime)       │              │
      │                  │─────────────────────────────>│               │              │
      │                  │                              │ load--        │              │
      │                  │                              │ totalRequestsHandled++        │
      │                  │                              │───────        │              │
      │  resolve({serverId, responseTime})              │               │              │
      │<─────────────────│                              │               │              │
      │                  │                              │               │              │
      │  _scheduleNext() │                              │               │              │
      │◄─ ─ ─ ─ ─ ─ ─ ─ (self — loop continues)       │               │              │
      │                  │                              │               │              │
      │                  │                              │               │  GET /metrics│
      │                  │                              │               │<─────────────│
      │                  │                              │  toJSON()     │              │
      │                  │                              │<──────────────│              │
      │                  │                              │ {id,load,...} │              │
      │                  │                              │──────────────>│              │
      │   getThroughput()│                              │               │              │
      │<─────────────────────────────────────────────────────────────────│              │
      │                  │                              │ JSON response │              │
      │                  │                              │               │─────────────>│
      │                  │                              │               │              │ setMetrics()
      │                  │                              │               │              │ setHistory()
      │                  │                              │               │              │ re-render charts
```

## Algorithm Switch Flow (User Action)

```
Dashboard           Express API       LoadBalancer      IAlgorithm
    │                    │                 │                 │
    │  POST /algorithm   │                 │                 │
    │  {name:'leastConn'}│                 │                 │
    │───────────────────>│                 │                 │
    │                    │ setAlgorithm(n) │                 │
    │                    │────────────────>│                 │
    │                    │                 │ getAlgorithm(n) │
    │                    │                 │ (factory call)  │
    │                    │                 │────────────────>│
    │                    │                 │ new LeastConns  │
    │                    │                 │<────────────────│
    │                    │                 │ this.algorithm  │
    │                    │                 │   = new inst    │
    │                    │                 │ emit('algorithm │
    │                    │                 │  -changed')     │
    │                    │ {success:true}  │                 │
    │<───────────────────│                 │                 │
    │ update select value│                 │                 │
```

## Traffic Spike Flow (t = 30s)

```
RequestGenerator
      │
      │  elapsed >= 30s && elapsed <= 40s?
      │──── YES ──── delay = 20ms (burst mode, ~50 req/s)
      │──── NO  ──── delay = rand(50–199)ms (normal mode, ~8 req/s)
      │
      │  setTimeout(delay, _scheduleNext)
```
