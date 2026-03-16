import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'
 
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-time">{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} className="chart-tooltip-row" style={{ color: p.color }}>
          <span>{p.name}</span>
          <span>{p.value}</span>
        </div>
      ))}
    </div>
  )
}
 
export default function HistoryChart({ machineId, data }) {
  return (
    <div className="panel">
      <div className="panel-hdr">
        <div className="panel-title">
          {machineId
            ? machineId.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) + ' — Live Readings'
            : 'Live Readings'}
        </div>
        <div className="panel-sub">last 30 readings · 2s interval</div>
      </div>
      <div className="panel-body">
        {data.length === 0 ? (
          <div className="mono-sm" style={{ padding: '40px 0', textAlign: 'center', opacity: 0.4 }}>
            Select a machine to view its chart
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.12)" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono', fill: '#888780' }}
                interval="preserveStartEnd"
                tickLine={false}
              />
              <YAxis
                yAxisId="temp"
                orientation="left"
                tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono', fill: '#1D9E75' }}
                tickFormatter={v => `${v}°`}
                tickLine={false}
                axisLine={false}
                width={36}
              />
              <YAxis
                yAxisId="vib"
                orientation="right"
                tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono', fill: '#185FA5' }}
                tickFormatter={v => v.toFixed(2)}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                yAxisId="temp"
                type="monotone"
                dataKey="temperature"
                stroke="#1D9E75"
                strokeWidth={1.5}
                dot={false}
                name="Temp °C"
              />
              <Line
                yAxisId="vib"
                type="monotone"
                dataKey="vibration"
                stroke="#185FA5"
                strokeWidth={1.5}
                dot={false}
                name="Vibration RMS"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
 