import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import axios from 'axios'
import './App.css'

function App() {
  const [machines, setMachines] = useState([])
  const [alerts, setAlerts] = useState([])
  const [latestReadings, setLatestReadings] = useState({})
  const [selectedMachine, setSelectedMachine] = useState('machine_1')

  // Poll backend every 2 seconds
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [machinesRes, alertsRes] = await Promise.all([
          axios.get('http://127.0.0.1:8000/machines'),
          axios.get('http://127.0.0.1:8000/alerts')
        ])
        setMachines(machinesRes.data)
        setAlerts(alertsRes.data.slice(0, 10)) // Latest 10 alerts
        
        // Get latest readings for each machine
        const readingsRes = await axios.get('http://127.0.0.1:8000/readings')
        const latest = {}
        machinesRes.data.forEach(m => {
          const machineReadings = readingsRes.data.filter(r => r.machine_id === m.machine_id)
          if (machineReadings.length > 0) {
            latest[m.machine_id] = machineReadings[machineReadings.length - 1]
          }
        })
        setLatestReadings(latest)
      } catch (error) {
        console.error('Failed to fetch data:', error)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 2000)
    return () => clearInterval(interval)
  }, [])

  const hasAlert = (machineId) => {
    return alerts.some(alert => alert.machine_id === machineId)
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>🚀 Equipment Health Monitor</h1>
        <div className="dashboard">
          {/* Machines Grid */}
          <div className="machines-grid">
            <h2>Machines ({machines.length})</h2>
            <div className="machines-list">
              {machines.map((machine) => {
                const reading = latestReadings[machine.machine_id]
                const alert = hasAlert(machine.machine_id)
                return (
                  <div 
                    key={machine.machine_id}
                    className={`machine-card ${alert ? 'alert' : reading?.temperature > 85 ? 'warning' : 'normal'}`}
                    onClick={() => setSelectedMachine(machine.machine_id)}
                  >
                    <h3>{machine.machine_id}</h3>
                    {reading ? (
                      <>
                        <div>🌡️ {reading.temperature.toFixed(1)}°C</div>
                        <div>📊 {reading.vibration_rms.toFixed(2)} RMS</div>
                        <div>⏱️ {reading.usage_hours.toFixed(0)}h</div>
                      </>
                    ) : (
                      <div>No data</div>
                    )}
                    {alert && <div className="alert-badge">🚨 ALERT</div>}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Alerts List */}
          <div className="alerts-panel">
            <h2>Recent Alerts ({alerts.length})</h2>
            {alerts.length === 0 ? (
              <p>All systems normal ✅</p>
            ) : (
              alerts.map((alert, index) => (
                <div key={index} className={`alert-item ${alert.level}`}>
                  <strong>{alert.machine_id}</strong>: {alert.message}
                  <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                </div>
              ))
            )}
          </div>

          {/* Chart for selected machine */}
          <div className="chart-panel">
            <h2>{selectedMachine} Live Data</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={[]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="temperature" stroke="#8884d8" name="Temp (°C)" />
                <Line type="monotone" dataKey="vibration_rms" stroke="#82ca9d" name="Vibration" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </header>
    </div>
  )
}

export default App
