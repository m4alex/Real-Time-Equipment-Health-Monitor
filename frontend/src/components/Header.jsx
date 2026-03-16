import { useState, useEffect } from 'react'
 
export default function Header({ connected }) {
  const [time, setTime] = useState(new Date().toLocaleTimeString())
  useEffect(() => {
    const id = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000)
    return () => clearInterval(id)
  }, [])
 
  return (
    <header className="hdr">
      <div className="hdr-left">
        <div className="hdr-logo" aria-hidden="true">
          <svg viewBox="0 0 16 16" fill="none">
            <rect x="2"   y="8" width="3" height="6" rx="1" fill="white"/>
            <rect x="6.5" y="4" width="3" height="10" rx="1" fill="white"/>
            <rect x="11"  y="2" width="3" height="12" rx="1" fill="white"/>
          </svg>
        </div>
        <div>
          <div className="hdr-title">Equipment Health Monitor</div>
          <div className="hdr-sub">Industrial Sensor Dashboard</div>
        </div>
      </div>
      <div className="hdr-right">
        <span className="mono-sm">{time}</span>
        <div className={`live-pill ${connected ? 'live-pill--on' : 'live-pill--off'}`}>
          <span className={`live-dot ${connected ? 'live-dot--on' : ''}`} />
          {connected ? 'LIVE' : 'OFFLINE'}
        </div>
      </div>
    </header>
  )
}