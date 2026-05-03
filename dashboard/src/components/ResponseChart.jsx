import React from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

const COLORS = ['#8884d8', '#82ca9d', '#ffc658']

export default function ResponseChart({ history, serverIds }) {
  return (
    <div style={{ background: 'white', borderRadius: 8, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
      <h2 style={{ marginTop: 0 }}>Avg Response Time (ms)</h2>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={history}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="tick" label={{ value: 'Tick', position: 'insideBottom', offset: -4 }} />
          <YAxis unit="ms" />
          <Tooltip />
          <Legend />
          {(serverIds || []).map((id, i) => (
            <Line
              key={id}
              type="monotone"
              dataKey={`${id}_rt`}
              stroke={COLORS[i % COLORS.length]}
              name={id}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
