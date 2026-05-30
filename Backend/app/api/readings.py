from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database.db import get_db
from app.schemas.reading import SensorReading
from app.models.reading import ReadingDB
from app.models.alert import Alert
from app.services.anomaly_detection import detect_anomalies
from app.api.ws import manager

router = APIRouter()


@router.post("/ingest")
async def ingest_reading(reading: SensorReading, db: Session = Depends(get_db)):

    db_reading = ReadingDB(
        id=f"{reading.machine_id}_{int(reading.timestamp.timestamp())}",
        machine_id=reading.machine_id,
        timestamp=reading.timestamp,
        temperature=reading.temperature,
        vibration_rms=reading.vibration_rms,
        usage_hours=reading.usage_hours
    )

    db.add(db_reading)

    anomalies = detect_anomalies(db, reading)
    alert_objects = []

    for anomaly_msg in anomalies:
        level = anomaly_msg.split(":")[0]
        alert = Alert(
            machine_id=reading.machine_id,
            timestamp=reading.timestamp,
            level=level,
            message=anomaly_msg
        )
        db.add(alert)
        alert_objects.append(alert)

    db.commit()

    for alert in alert_objects:
        db.refresh(alert)

    await manager.broadcast({
        "reading": {
            "machine_id": reading.machine_id,
            "timestamp": reading.timestamp.isoformat(),
            "temperature": reading.temperature,
            "vibration_rms": reading.vibration_rms,
            "usage_hours": reading.usage_hours,
        },
        "alerts": [
            {
                "id": a.id,
                "machine_id": a.machine_id,
                "timestamp": a.timestamp.isoformat(),
                "level": a.level,
                "message": a.message,
            }
            for a in alert_objects
        ],
    })

    response = {"message": "reading ingested"}
    if anomalies:
        response["alerts_detected"] = len(anomalies)
    return response


@router.get("/readings")
def get_readings(db: Session = Depends(get_db)):
    return db.query(ReadingDB).order_by(desc(ReadingDB.timestamp)).limit(50).all()