export default function AlertPanel({ alerts }) {
  return (
    <div className="panel">
      <div className="panel-hdr">
        <div className="panel-title">Alerts</div>
        <div className="panel-sub">{alerts.length} event{alerts.length !== 1 ? 's' : ''}</div>
      </div>
      <div className="panel-body">
        {alerts.length === 0 ? (
          <div className="alert-empty">
            <span className="alert-empty-dot" />
            All systems nominal
          </div>
        ) : (
          <div className="alert-list">
            {alerts.map((alert, i) => {
              // level can be: "critical", "warning", "info" — map to our 3 styles
              const type = alert.level === 'critical' ? 'crit'
                         : alert.level === 'warning'  ? 'warn'
                         : 'info'
              return (
                <div key={i} className={`alert-item alert-item--${type}`}>
                  <div className={`alert-icon alert-icon--${type}`}>
                    {type === 'crit' ? '!' : type === 'warn' ? '▲' : 'i'}
                  </div>
                  <div className="alert-body">
                    <div className="alert-machine">{alert.machine_id}</div>
                    <div className="alert-msg">{alert.message}</div>
                    <div className="alert-time">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}