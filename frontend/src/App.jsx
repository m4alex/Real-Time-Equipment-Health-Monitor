import { useState } from 'react'
import './App.css'
import Header from './components/Header'
import SummaryBar from './components/SummaryBar'
import MachineGrid from './components/MachineGrid'
import HistoryChart from './components/HistoryChart'
import AlertPanel from './components/AlertPanel'
import { useMachineData } from './hooks/useMachineData'

const API = 'http://127.0.0.1:8000'

export default function App() {
  const { machines, alerts, setAlerts, latestReadings, history, summary, alertIds, connected } = useMachineData()
  const [selectedId, setSelectedId] = useState(null)
  const activeId = selectedId ?? machines[0]?.machine_id ?? null
  async function handleClearAlerts() {
    try {
      await fetch(`${API}/alerts`, { method: 'DELETE' })
    } catch (e) {
      console.error('Clear alerts failed:', e)
    }
    setAlerts([])
  }

  return (
    <div className="app">
      <Header connected={connected} />
      {!connected && (
        <div className="conn-banner">
          ⚠ Backend unreachable — make sure uvicorn is running on port 8000
        </div>
      )}
      <main className="content">
        <SummaryBar summary={summary} />
        <MachineGrid
          machines={machines}
          latestReadings={latestReadings}
          alertIds={alertIds}
          selectedId={activeId}
          onSelect={setSelectedId}
        />
        <div className="bottom-grid">
          <HistoryChart
            machineId={activeId}
            data={history[activeId] ?? []}
          />
          <AlertPanel alerts={alerts} onClear={handleClearAlerts} /> 
        </div>
      </main>
    </div>
  )
}