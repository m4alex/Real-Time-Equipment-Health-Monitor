function statusFrom(reading) {
  if (!reading) return 'ok'
  if (reading.temperature > 90 || reading.vibration_rms > 5.0) return 'crit'
  if (reading.temperature > 82 || reading.vibration_rms > 3.5) return 'warn'
  return 'ok'
}

function GaugeBar({ value, max, color }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div className="gauge-track">
      <div className="gauge-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

function MachineCard({ machine, reading, selected, onSelect }) {
  const status = statusFrom(reading)
  const statusLabel = { ok: 'NOMINAL', warn: 'WARNING', crit: 'CRITICAL' }

  return (
    <div
      className={`machine-card machine-card--${status} ${selected ? 'machine-card--selected' : ''}`}
      onClick={() => onSelect(machine.machine_id)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onSelect(machine.machine_id)}
    >
      <div className="mc-header">
        <div>
          <div className="mc-name">{machine.name ?? machine.machine_id}</div>
        </div>
        <span className={`tag tag-${status}`}>{statusLabel[status]}</span>
      </div>

      <div className="mc-body">
        {reading ? (
          <>
            <div className="gauge-row">
              <div className="gauge-wrap">
                <div className="gauge-label">TEMP</div>
                <GaugeBar value={reading.temperature} max={100} color={
                  status === 'crit' ? 'var(--red)' : status === 'warn' ? 'var(--amber)' : 'var(--green)'
                  } />
                <div className="gauge-val" style={{
                  color: status === 'crit' ? 'var(--red)' : status === 'warn' ? 'var(--amber)' : 'var(--green)'
                }}>
                  {reading.temperature.toFixed(1)}°C
                </div>
              </div>
              <div className="gauge-wrap">
                <div className="gauge-label">VIB RMS</div>
                <GaugeBar value={reading.vibration_rms} max={6} color={
                  status === 'crit' ? 'var(--red)' : status === 'warn' ? 'var(--amber)' : 'var(--purple)'
                } />
                <div className="gauge-val" style={{
                  color: status === 'crit' ? 'var(--red)' : status === 'warn' ? 'var(--amber)' : 'var(--purple)'
                }}>
                  {reading.vibration_rms.toFixed(3)}
                </div>
              </div>
            </div>
            <div className="mc-hours">
              <span className="mono-sm">Usage</span>
              <span className="mc-hours-val">{Math.round(reading.usage_hours)}h</span>
            </div>
          </>
        ) : (
          <div className="mono-sm" style={{ padding: '8px 0', opacity: 0.5 }}>Awaiting data…</div>
        )}
      </div>

      <div className="mc-footer">
        <span className="mono-sm">{selected ? '● Selected' : 'Click to chart'}</span>
        <span className="mono-sm">
          {reading?.timestamp ? new Date(reading.timestamp).toLocaleTimeString() : '—'}
        </span>
      </div>
    </div>
  )
}

export default function MachineGrid({ machines, latestReadings, alertIds, selectedId, onSelect }) {
  return (
    <div className="machines-grid">
      {machines.map(m => (
        <MachineCard
          key={m.machine_id}
          machine={m}
          reading={latestReadings[m.machine_id]}
          selected={selectedId === m.machine_id}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}