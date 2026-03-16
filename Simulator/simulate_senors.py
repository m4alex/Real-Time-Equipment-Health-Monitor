import time
import random
from datetime import datetime, timezone

import requests

BACKEND_URL = "http://127.0.0.1:8000/ingest"

MACHINES = {
    "machine_1": {"type": "pump", "temp": 70.0, "vib": 2.5},
    "machine_2": {"type": "pump", "temp": 71.0, "vib": 2.3},
    "machine_3": {"type": "motor", "temp": 75.0, "vib": 1.8},
    "machine_4": {"type": "compressor", "temp": 72.0, "vib": 2.1},
    "machine_5": {"type": "turbine", "temp": 78.0, "vib": 1.6},
}

SEND_INTERVAL = 1  # seconds between each machine update


def generate_reading(machine_id: str):
    state = MACHINES[machine_id]

    # gradual drift (more realistic sensor behavior)
    state["temp"] += random.normalvariate(0, 0.3)
    state["vib"] += random.normalvariate(0, 0.05)

    # clamp realistic ranges
    state["temp"] = max(50, min(state["temp"], 120))
    state["vib"] = max(0.5, min(state["vib"], 8))

    # usage hours slowly increase
    usage = random.uniform(100, 500)

    # occasional anomaly injection
    if random.random() < 0.03:
        print(f"⚠ Injecting anomaly on {machine_id}")

        state["temp"] += random.uniform(10, 20)
        state["vib"] *= random.uniform(1.5, 2.2)

    return {
        "machine_id": machine_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "temperature": round(state["temp"], 2),
        "vibration_rms": round(state["vib"], 2),
        "usage_hours": round(usage, 2),
    }


def main():
    print("Starting sensor simulator...")
    print(f"Machines: {len(MACHINES)}")
    print(f"Send interval: {SEND_INTERVAL}s")
    print(f"Endpoint: {BACKEND_URL}")
    print("Press CTRL+C to stop\n")

    machine_ids = list(MACHINES.keys())
    index = 0

    while True:
        machine_id = machine_ids[index]

        reading = generate_reading(machine_id)

        try:
            resp = requests.post(BACKEND_URL, json=reading, timeout=2)

            print(
                f"{machine_id} | "
                f"T={reading['temperature']}°C | "
                f"V={reading['vibration_rms']} | "
                f"status={resp.status_code}"
            )

        except Exception as e:
            print("Error sending reading:", e)

        # move to next machine
        index = (index + 1) % len(machine_ids)

        time.sleep(SEND_INTERVAL)


if __name__ == "__main__":
    main()