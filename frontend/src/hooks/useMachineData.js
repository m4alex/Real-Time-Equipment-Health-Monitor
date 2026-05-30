import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";

const API    = "http://127.0.0.1:8000";
const WS_URL = "ws://127.0.0.1:8000/ws";
const HISTORY_LEN = 30;
const STALE_MS    = 10000;

const THRESHOLDS = {
  temp: { warn: 82, crit: 90 },
  vib:  { warn: 3.5, crit: 5.0 },
};
const MACHINE_NAMES = {
  "machine_1": "Coolant Pump A",
  "machine_2": "Drive Motor B",
  "machine_3": "Compressor C",
  "machine_4": "Conveyor Belt D",
  "machine_5": "Turbine E",
};

function latestPerMachine(readings) {
  const map = {};
  const cutoff = Date.now() - STALE_MS;
  for (const r of readings) {
    const id = r.machine_id;
    const ts = new Date(r.timestamp).getTime();
    if (ts < cutoff) continue;
    if (!map[id] || ts > new Date(map[id].timestamp).getTime()) map[id] = r;
  }
  return map;
}

function toChartPoint(r) {
  return {
    time: new Date(r.timestamp).toLocaleTimeString([], {
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    }),
    temperature: parseFloat(Number(r.temperature).toFixed(2)),
    vibration:   parseFloat(Number(r.vibration_rms).toFixed(3)),
  };
}

export function useMachineData() {
  const [machines,       setMachines] = useState([]);
  const [alerts,         setAlerts]   = useState([]);
  const [latestReadings, setLatest]   = useState({});
  const [history,        setHistory]  = useState({});
  const [connected,      setConnected] = useState(false);
  const wsRef = useRef(null);

  const fetchInitial = useCallback(async () => {
    try {
      const [mRes, aRes, rRes] = await Promise.all([
        axios.get(`${API}/machines`),
        axios.get(`${API}/alerts`),
        axios.get(`${API}/readings`),
      ]);

      const machineList = mRes.data
        .filter(m => /^machine_\d+$/.test(m.machine_id))
        .map(m => ({ ...m, name: MACHINE_NAMES[m.machine_id] ?? m.machine_id }));
      setMachines(machineList);
      setAlerts(aRes.data);

      const latest = latestPerMachine(rRes.data);
      setLatest(latest);

      const initHistory = {};
      Object.entries(latest).forEach(([id, r]) => {
        initHistory[id] = [toChartPoint(r)];
      });
      setHistory(initHistory);
    } catch (err) {
      console.error("Initial fetch error:", err);
    }
  }, []);

  useEffect(() => {
    fetchInitial();

    function connect() {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen  = () => setConnected(true);
      ws.onerror = () => ws.close();
      ws.onclose = () => {
        setConnected(false);
        setTimeout(connect, 2000);
      };

      ws.onmessage = (event) => {
        const { reading, alerts: newAlerts } = JSON.parse(event.data);

        setLatest(prev => ({ ...prev, [reading.machine_id]: reading }));

        setHistory(prev => {
          const arr = [...(prev[reading.machine_id] ?? []), toChartPoint(reading)];
          return { ...prev, [reading.machine_id]: arr.slice(-HISTORY_LEN) };
        });

        if (newAlerts?.length) {
          setAlerts(prev => {
            const existingIds = new Set(prev.map(a => a.id).filter(Boolean));
            const fresh = newAlerts.filter(a => !existingIds.has(a.id));
            return [...fresh, ...prev].slice(0, 50);
          });
        }
      };
    }

    connect();
    return () => wsRef.current?.close();
  }, [fetchInitial]);

  const readings  = Object.values(latestReadings);
  const avgTemp   = readings.length
    ? (readings.reduce((s, r) => s + r.temperature, 0) / readings.length).toFixed(1)
    : null;
  const avgVib    = readings.length
    ? (readings.reduce((s, r) => s + r.vibration_rms, 0) / readings.length).toFixed(3)
    : null;
  const critCount = alerts.filter(a => a.level === "critical").length;
  const alertIds  = new Set(alerts.map(a => a.machine_id));

  const summary = { total: machines.length, avgTemp, avgVib, alertCount: critCount };

  return { machines, alerts, setAlerts, latestReadings, history, summary, alertIds, connected };
}
