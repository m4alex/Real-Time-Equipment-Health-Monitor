import { useState, useEffect, useCallback } from "react";
import axios from "axios";
 
const API = "http://127.0.0.1:8000";
const POLL_MS = 2000;
const HISTORY_LEN = 30;
const STALE_MS = 10000; // ignore readings older than 10 seconds
 
// ─── Thresholds — adjust to match limits ────────────────────────
const THRESHOLDS = {
  temp: { warn: 75, crit: 85 },
  vib:  { warn: 3.0, crit: 4.0 },
};
 
function getStatus(temp, vib) {
  if (temp >= THRESHOLDS.temp.crit || vib >= THRESHOLDS.vib.crit) return "crit";
  if (temp >= THRESHOLDS.temp.warn || vib >= THRESHOLDS.vib.warn) return "warn";
  return "ok";
}
 
// Pick the single most-recent reading per machine, ignoring stale ones
function latestPerMachine(readings) {
  const map = {};
  const cutoff = Date.now() - STALE_MS;
 
  for (const r of readings) {
    const id = r.machine_id;
    const ts = new Date(r.timestamp).getTime();
 
    // Skip readings older than STALE_MS
    if (ts < cutoff) continue;
 
    if (!map[id] || ts > new Date(map[id].timestamp).getTime()) {
      map[id] = r;
    }
  }
  return map;
}
 
// ─── Main hook ────────────────────────────────────────────────────────────
export function useMachineData() {
  const [machines,  setMachines]  = useState([]);
  const [alerts,    setAlerts]    = useState([]);
  const [latestReadings, setLatest] = useState({});
  const [history,   setHistory]   = useState({});
  const [connected, setConnected] = useState(true);
 
  const poll = useCallback(async () => {
    try {
      const [mRes, aRes, rRes] = await Promise.all([
        axios.get(`${API}/machines`),
        axios.get(`${API}/alerts`),
        axios.get(`${API}/readings`),
      ]);
      setConnected(true);
 
      const machineList = mRes.data;
      setMachines(machineList);
      setAlerts(aRes.data.slice(0, 12));
 
      const latest = latestPerMachine(rRes.data);
      setLatest(latest);
 
      // Append to rolling history per machine
      setHistory((prev) => {
        const next = { ...prev };
        Object.entries(latest).forEach(([id, r]) => {
          const arr = [
            ...(prev[id] ?? []),
            {
              time: new Date(r.timestamp).toLocaleTimeString([], {
                hour: "2-digit", minute: "2-digit", second: "2-digit",
              }),
              temperature: parseFloat(Number(r.temperature).toFixed(2)),
              vibration:   parseFloat(Number(r.vibration_rms).toFixed(3)),
            },
          ];
          next[id] = arr.slice(-HISTORY_LEN);
        });
        return next;
      });
    } catch (err) {
      console.error("Poll error:", err);
      setConnected(false);
    }
  }, []);
 
  useEffect(() => {
    poll();
    const id = setInterval(poll, POLL_MS);
    return () => clearInterval(id);
  }, [poll]);
 
  // Compute fleet summary from latest readings
  const readings = Object.values(latestReadings);
  const avgTemp = readings.length
    ? (readings.reduce((s, r) => s + r.temperature, 0) / readings.length).toFixed(1)
    : null;
  const avgVib = readings.length
    ? (readings.reduce((s, r) => s + r.vibration_rms, 0) / readings.length).toFixed(3)
    : null;
  const critCount = alerts.filter((a) => a.level === "critical").length;
  const alertIds  = new Set(alerts.map((a) => a.machine_id));
 
  const summary = {
    total:      machines.length,
    avgTemp,
    avgVib,
    alertCount: critCount,
  };
 
  return { machines, alerts, latestReadings, history, summary, alertIds, connected };
}