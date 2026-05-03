import React, { useState, useEffect, useRef } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import ServerChart from './components/ServerChart'
import ResponseChart from './components/ResponseChart'
import Controls from './components/Controls'

const SIMULATOR_URL = 'http://localhost:3001'
const HISTORY_SIZE = 30

export default function App() {
  const [metrics, setMetrics] = useState(null)
  const [connected, setConnected] = useState(false)
  const [history, setHistory] = useState([])
  const tickRef = useRef(0)

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`${SIMULATOR_URL}/metrics`)
        const data = await res.json()
        setMetrics(data)
        setConnected(true)
        setHistory(prev => {
          const entry = {
            tick: tickRef.current++,
            throughput: data.throughput,
            ...data.servers.reduce((acc, s) => {
              acc[`${s.id}_rt`] = s.avgResponseTime
              return acc
            }, {}),
          }
          return [...prev.slice(-HISTORY_SIZE + 1), entry]
        })
      } catch {
        setConnected(false)
      }
    }
    poll()
    const id = setInterval(poll, 1000)
    return () => clearInterval(id)
  }, [])

  const switchAlgorithm = async (e) => {
    const name = e.target.value
    await fetch(`${SIMULATOR_URL}/algorithm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
  }

  const toggleSimulation = async () => {
    const endpoint = metrics?.running ? '/stop' : '/start'
    await fetch(`${SIMULATOR_URL}${endpoint}`, { method: 'POST' })
  }

  const serverIds = metrics?.servers.map(s => s.id) || []

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px', background: '#f5f5f5', minHeight: '100vh' }}>
      <h1 style={{ marginBottom: 8 }}>AI Load Balancer Dashboard</h1>

      {!connected && (
        <div style={{
          background: '#e74c3c', color: 'white', padding: '10px 16px',
          borderRadius: 6, marginBottom: 16,
        }}>
          Disconnected from simulator (localhost:3001) — start the simulator first
        </div>
      )}

      <Controls
        metrics={metrics}
        onAlgorithmChange={switchAlgorithm}
        onToggleSimulation={toggleSimulation}
      />

      <div style={{ display: 'grid', gap: 20 }}>
        <ServerChart servers={metrics?.servers} />

        <ResponseChart history={history} serverIds={serverIds} />

        <div style={{ background: 'white', borderRadius: 8, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
          <h2 style={{ marginTop: 0 }}>Throughput (req/s)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="tick" label={{ value: 'Tick', position: 'insideBottom', offset: -4 }} />
              <YAxis unit=" req/s" />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="throughput"
                stroke="#ffc658"
                name="Throughput"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
