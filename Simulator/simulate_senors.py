import time
import random
from datetime import datetime, timezone

import requests

BACKEND_URL = "http://127.0.0.1:8000/ingest"
MACHINES = [f"machine_{i}" for i in range(1, 6)]

def generate_reading(machine_id: str):
    base_temp = 70.0
    base_vib = 2.0

    temp = random.normalvariate(base_temp, 3.0)
    vib = random.normalvariate(base_vib, 0.4)
    usage = random.uniform(100, 500)

    # occasionally inject anomaly
    if random.random() < 0.05:
        temp += random.uniform(15, 25)
        vib *= random.uniform(1.5, 2.5)

    return {
        "machine_id": machine_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "temperature": temp,
        "vibration_rms": vib,
        "usage_hours": usage,
    }

def main():
    print("Starting sensor simulator...")
    while True:
        for m in MACHINES:
            reading = generate_reading(m)
            try:
                resp = requests.post(BACKEND_URL, json=reading, timeout=2)
                print(m, resp.status_code, round(reading["temperature"], 1), round(reading["vibration_rms"], 2))
            except Exception as e:
                print("Error sending reading:", e)
        time.sleep(2)

if __name__ == "__main__":
    main()
