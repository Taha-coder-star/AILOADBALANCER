import React from 'react'

export default function Controls({ metrics, onAlgorithmChange, onToggleSimulation }) {
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center', flexWrap: 'wrap' }}>
      <label style={{ fontWeight: 'bold' }}>Algorithm:</label>
      <select
        value={metrics?.algorithm || 'roundRobin'}
        onChange={onAlgorithmChange}
        style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #ccc' }}
      >
        <option value="roundRobin">Round Robin</option>
        <option value="leastConnections">Least Connections</option>
      </select>

      <button
        onClick={onToggleSimulation}
        style={{
          padding: '6px 16px', borderRadius: 4, border: 'none',
          background: metrics?.running ? '#e74c3c' : '#27ae60',
          color: 'white', cursor: 'pointer', fontWeight: 'bold',
        }}
      >
        {metrics?.running ? 'Stop Simulation' : 'Start Simulation'}
      </button>

      <span style={{ color: '#666', fontSize: 14 }}>
        Status: {metrics?.running ? '🟢 Running' : '🔴 Stopped'} &nbsp;|&nbsp;
        Algorithm: {metrics?.algorithm || '—'}
      </span>
    </div>
  )
}
