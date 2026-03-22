import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'

// Must match the names in useMachineData.js
const MACHINE_NAMES = {
  machine_1: "Coolant Pump A",
  machine_2: "Drive Motor B",
  machine_3: "Compressor C",
  machine_4: "Conveyor Belt D",
  machine_5: "Turbine E",
}

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

function SubChart({ data, dataKey, color, name, yFormatter, warnValue, critValue, unit, domain }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`fill-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.15} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.08)" />
        <XAxis
          dataKey="time"
          tick={{ fontSize: 9, fontFamily: 'IBM Plex Mono', fill: '#888780' }}
          interval={4}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 9, fontFamily: 'IBM Plex Mono', fill: '#888780' }}
          tickFormatter={yFormatter}
          tickLine={false}
          axisLine={false}
          width={38}
          domain={domain}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine
          y={warnValue}
          stroke="#BA7517"
          strokeDasharray="4 3"
          strokeWidth={1}
          label={{ value: `WARN ${warnValue}${unit}`, position: 'insideTopRight', fontSize: 9, fontFamily: 'IBM Plex Mono', fill: '#BA7517' }}
        />
        <ReferenceLine
          y={critValue}
          stroke="#E24B4A"
          strokeDasharray="4 3"
          strokeWidth={1}
          label={{ value: `CRIT ${critValue}${unit}`, position: 'insideTopRight', fontSize: 9, fontFamily: 'IBM Plex Mono', fill: '#E24B4A' }}
        />
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          name={name}
          fill={`url(#fill-${dataKey})`}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

export default function HistoryChart({ machineId, data }) {
  const title = machineId ? (MACHINE_NAMES[machineId] ?? machineId) : null

  return (
    <div className="panel chart-panel">
      <div className="panel-hdr">
        <div className="panel-title">
          {title ? `${title} — Live Readings` : 'Live Readings'}
        </div>
        <div className="panel-sub">last 30 readings · 2s interval</div>
      </div>

      {data.length === 0 ? (
        <div className="chart-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="mono-sm" style={{ opacity: 0.4 }}>Select a machine to view its chart</div>
        </div>
      ) : (
        <div className="chart-body">
          <div className="chart-sub-header">
            <span style={{ color: '#1D9E75' }}>● Temperature</span>
            <span className="mono-sm">°C</span>
          </div>
          <div className="chart-sub-wrap">
            <SubChart
              data={data}
              dataKey="temperature"
              color="#1D9E75"
              name="Temp °C"
              yFormatter={v => `${v}°`}
              warnValue={82}
              critValue={90}
              unit="°"
              domain={[55, 95]}
            />
          </div>

          <div className="chart-divider" />

          <div className="chart-sub-header">
            <span style={{ color: '#534AB7' }}>● Vibration RMS</span>
            <span className="mono-sm">m/s²</span>
          </div>
          <div className="chart-sub-wrap">
            <SubChart
              data={data}
              dataKey="vibration"
              color="#534AB7"
              name="Vibration RMS"
              yFormatter={v => v.toFixed(2)}
              warnValue={3.5}
              critValue={5.0}
              unit=""
              domain={[0, 6]}
            />
          </div>
        </div>
      )}
    </div>
  )
}