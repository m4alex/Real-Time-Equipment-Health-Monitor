import statistics
from typing import List
from sqlalchemy.orm import Session

from app.models.reading import ReadingDB
from app.schemas.reading import SensorReading


def detect_anomalies(db: Session, reading: SensorReading) -> List[str]:

    anomalies = []

    recent = (
        db.query(ReadingDB)
        .filter(ReadingDB.machine_id == reading.machine_id)
        .order_by(ReadingDB.timestamp.desc())
        .limit(20)
        .all()
    )

    if reading.temperature > 95:
        anomalies.append("critical: Temperature critically high")
    elif reading.temperature > 85:
        anomalies.append("warning: Temperature elevated")

    if reading.vibration_rms > 5.0:
        anomalies.append("critical: Vibration critically high")
    elif reading.vibration_rms > 3.5:
        anomalies.append("warning: Vibration elevated")

    if len(recent) > 5:
        recent_vibs = [r.vibration_rms for r in recent[:10]]
        avg_vib = statistics.mean(recent_vibs)

        if reading.vibration_rms > avg_vib * 2 and reading.vibration_rms > 3.0:
            anomalies.append("warning: Sudden vibration spike")

    return anomalies