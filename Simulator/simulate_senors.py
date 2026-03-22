import time
import random
from datetime import datetime, timezone

import requests

BACKEND_URL = "http://127.0.0.1:8000/ingest"

# Base values each machine returns toward after an anomaly
MACHINES = {
    "machine_1": {"type": "pump",       "temp": 65.0, "vib": 1.8, "base_temp": 65.0, "base_vib": 1.8},
    "machine_2": {"type": "pump",       "temp": 67.0, "vib": 2.0, "base_temp": 67.0, "base_vib": 2.0},
    "machine_3": {"type": "motor",      "temp": 70.0, "vib": 1.6, "base_temp": 70.0, "base_vib": 1.6},
    "machine_4": {"type": "compressor", "temp": 66.0, "vib": 1.9, "base_temp": 66.0, "base_vib": 1.9},
    "machine_5": {"type": "turbine",    "temp": 72.0, "vib": 1.5, "base_temp": 72.0, "base_vib": 1.5},
}

SEND_INTERVAL    = 1      # seconds between readings
ANOMALY_CHANCE   = 0.01   # 1% chance per reading (down from 3%)
RECOVERY_RATE    = 0.15   # how fast values drift back to base (0-1)
MAX_TEMP         = 88.0   # hard ceiling — won't go critical unless anomaly
MAX_VIB          = 4.5


def generate_reading(machine_id: str):
    state = MACHINES[machine_id]

    # --- Anomaly injection (rare, 1%) ---
    if random.random() < ANOMALY_CHANCE:
        spike_temp = random.uniform(8, 15)
        spike_vib  = random.uniform(0.8, 1.5)
        state["temp"] += spike_temp
        state["vib"]  += spike_vib
        print(f"  ⚠  Anomaly on {machine_id} | +{spike_temp:.1f}°C +{spike_vib:.2f} vib")

    # --- Small random walk (gentle noise) ---
    state["temp"] += random.normalvariate(0, 0.15)   # was 0.3
    state["vib"]  += random.normalvariate(0, 0.02)   # was 0.05

    # --- Recovery: pull values back toward base ---
    state["temp"] += (state["base_temp"] - state["temp"]) * RECOVERY_RATE
    state["vib"]  += (state["base_vib"]  - state["vib"])  * RECOVERY_RATE

    # --- Hard clamps ---
    state["temp"] = max(55.0, min(state["temp"], MAX_TEMP))
    state["vib"]  = max(0.3,  min(state["vib"],  MAX_VIB))

    # Usage hours — realistic slow increment per machine type
    usage_base = {"pump": 150, "motor": 200, "compressor": 250, "turbine": 300}
    usage = usage_base.get(state["type"], 150) + random.uniform(0, 50)

    return {
        "machine_id":    machine_id,
        "timestamp":     datetime.now(timezone.utc).isoformat(),
        "temperature":   round(state["temp"], 2),
        "vibration_rms": round(state["vib"],  2),
        "usage_hours":   round(usage,          1),
    }


def main():
    print("Starting sensor simulator...")
    print(f"  Machines : {len(MACHINES)}")
    print(f"  Interval : {SEND_INTERVAL}s")
    print(f"  Endpoint : {BACKEND_URL}")
    print(f"  Anomaly  : {ANOMALY_CHANCE*100:.0f}% chance per reading")
    print("Press CTRL+C to stop\n")

    machine_ids = list(MACHINES.keys())
    index = 0

    while True:
        machine_id = machine_ids[index]
        reading    = generate_reading(machine_id)

        try:
            resp = requests.post(BACKEND_URL, json=reading, timeout=2)
            print(
                f"{machine_id} | "
                f"T={reading['temperature']:>6}°C | "
                f"V={reading['vibration_rms']:>5} | "
                f"{resp.status_code}"
            )
        except Exception as e:
            print(f"Error sending reading: {e}")

        index = (index + 1) % len(machine_ids)
        time.sleep(SEND_INTERVAL)


if __name__ == "__main__":
    main()