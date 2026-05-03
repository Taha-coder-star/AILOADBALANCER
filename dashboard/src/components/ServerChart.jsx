import React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

export default function ServerChart({ servers }) {
  return (
    <div style={{ background: 'white', borderRadius: 8, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
      <h2 style={{ marginTop: 0 }}>Server Utilization (%)</h2>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={servers || []}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="id" />
          <YAxis domain={[0, 100]} unit="%" />
          <Tooltip />
          <Legend />
          <Bar dataKey="load" fill="#8884d8" name="Load %" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
