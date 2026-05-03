# Class Diagram — AI-Enhanced Load Balancer

```
┌──────────────────────────────────┐
│           <<interface>>          │
│           IAlgorithm             │
├──────────────────────────────────┤
│ + select(servers: Server[]): Server│
└──────────────────────────────────┘
              ▲            ▲
              │            │
┌─────────────────┐  ┌──────────────────────┐
│ RoundRobin      │  │ LeastConnections      │
│ Strategy        │  │ Strategy              │
├─────────────────┤  ├──────────────────────┤
│ - index: number │  │                       │
├─────────────────┤  ├──────────────────────┤
│ + select(servers│  │ + select(servers      │
│   ): Server     │  │   ): Server           │
└─────────────────┘  └──────────────────────┘


┌──────────────────────────────────────┐
│            LoadBalancer              │
│         extends EventEmitter         │
├──────────────────────────────────────┤
│ - servers: Server[]                  │
│ - algorithm: IAlgorithm              │
├──────────────────────────────────────┤
│ + route(): Promise<{serverId,        │
│             responseTime}>           │
│   (emits: 'request', 'overload')     │
│ + setAlgorithm(name: string): void   │
│   (emits: 'algorithm-changed')       │
└──────────────────────────────────────┘
        │ uses                  │ owns
        ▼                       ▼
┌───────────────────┐   ┌──────────────────────┐
│     Server        │   │   getAlgorithm()      │
├───────────────────┤   │   <<factory>>         │
│ + id: string      │   ├──────────────────────┤
│ + load: number    │   │ getAlgorithm(name)    │
│ + activeConns: n  │   │  → IAlgorithm         │
│ + totalRequestsH: n│  └──────────────────────┘
│ + totalRespTime:n │
├───────────────────┤
│ + addConnection() │
│ + removeConn(ms)  │
│ + getAvgRespTime()│
│ + toJSON()        │
└───────────────────┘


┌──────────────────────────────────────┐
│          RequestGenerator            │
├──────────────────────────────────────┤
│ - loadBalancer: LoadBalancer         │
│ - running: boolean                   │
│ - startTime: number                  │
│ - currentThroughput: number          │
├──────────────────────────────────────┤
│ + start(): void                      │
│ + stop(): void                       │
│ + getThroughput(): number            │
│ - _scheduleNext(): void              │
└──────────────────────────────────────┘
        │ uses
        ▼
┌──────────────────────────────────────┐
│          LoadBalancer                │
│          (reference above)           │
└──────────────────────────────────────┘
```

## Relationships Summary

| From | To | Type | Description |
|------|----|------|-------------|
| LoadBalancer | EventEmitter | Inheritance | Extends Node.js EventEmitter (Observer pattern) |
| LoadBalancer | Server[] | Aggregation | Holds pool of virtual servers |
| LoadBalancer | IAlgorithm | Dependency | Delegates server selection (Strategy pattern) |
| RoundRobinStrategy | IAlgorithm | Realisation | Implements Strategy interface |
| LeastConnectionsStrategy | IAlgorithm | Realisation | Implements Strategy interface |
| RequestGenerator | LoadBalancer | Association | Calls route() to send requests |
| index.js (factory) | IAlgorithm | Creation | Returns concrete strategy by name (Factory pattern) |

## Design Patterns Applied

| Pattern | Where | How |
|---------|-------|-----|
| **Strategy** | `LoadBalancer` + `IAlgorithm` hierarchy | `LoadBalancer.algorithm` holds a strategy object; swapped at runtime via `setAlgorithm()` |
| **Factory** | `algorithms/index.js` — `getAlgorithm(name)` | Returns the correct concrete strategy instance by name string |
| **Observer** | `LoadBalancer extends EventEmitter` | Emits `'request'`, `'overload'`, and `'algorithm-changed'` events; `index.js` subscribes via `lb.on(...)` |
