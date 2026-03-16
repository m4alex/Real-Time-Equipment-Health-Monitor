export default function SummaryBar({ summary }) {
  const { total, avgTemp, avgVib, alertCount } = summary
  return (
    <div className="summary-bar">
      <div className="sum-card">
        <div className="sum-label">Machines Online</div>
        <div className="sum-value">{total}</div>
        <div className="sum-meta">active sensors</div>
      </div>
      <div className="sum-card">
        <div className="sum-label">Avg Temperature</div>
        <div className="sum-value">{avgTemp ?? '—'}</div>
        <div className="sum-meta">°C fleet-wide</div>
      </div>
      <div className="sum-card">
        <div className="sum-label">Avg Vibration RMS</div>
        <div className="sum-value">{avgVib ?? '—'}</div>
        <div className="sum-meta">RMS</div>
      </div>
      <div className="sum-card">
        <div className="sum-label">Critical Alerts</div>
        <div className="sum-value" style={{ color: alertCount > 0 ? 'var(--red)' : 'inherit' }}>
          {alertCount}
        </div>
        <div className="sum-meta">active right now</div>
      </div>
    </div>
  )
}