import { useEffect, useRef } from 'react'

const MACHINE_NAMES = {
  machine_1: 'Coolant Pump A',
  machine_2: 'Drive Motor B',
  machine_3: 'Compressor C',
  machine_4: 'Conveyor Belt D',
  machine_5: 'Turbine E',
}

export default function AlertPanel({ alerts, onClear }) {
  const listRef = useRef(null)

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = 0
  }, [alerts.length])

  return (
    <div className="panel">
      <div className="panel-hdr">
        <div>
          <div className="panel-title">Alerts</div>
          <div className="panel-sub">{alerts.length} event{alerts.length !== 1 ? 's' : ''}</div>
        </div>
        {alerts.length > 0 && (
          <button className="clear-btn" onClick={onClear}>Clear all</button>
        )}
      </div>
      <div className="panel-body" ref={listRef}>
        {alerts.length === 0 ? (
          <div className="alert-empty">
            <span className="alert-empty-dot" />
            All systems nominal
          </div>
        ) : (
          <div className="alert-list">
            {alerts.map((alert, i) => {
              const type = alert.level === 'critical' ? 'crit'
                         : alert.level === 'warning'  ? 'warn'
                         : 'info'
              return (
                <div key={alert.id ?? i} className={`alert-item alert-item--${type}`}>
                  <div className={`alert-icon alert-icon--${type}`}>
                    {type === 'crit' ? '!' : type === 'warn' ? '▲' : 'i'}
                  </div>
                  <div className="alert-body">
                    <div className="alert-machine">{MACHINE_NAMES[alert.machine_id] ?? alert.machine_id}</div>
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