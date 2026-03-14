from datetime import datetime
from typing import List

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import Integer, create_engine, Column, String, Float, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
import statistics


# Database setup
DATABASE_URL = "sqlite:///./equipment.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database models
class ReadingDB(Base):
    __tablename__ = "readings"
    
    id = Column(String, primary_key=True, index=True)
    machine_id = Column(String, index=True)
    timestamp = Column(DateTime)
    temperature = Column(Float)
    vibration_rms = Column(Float)
    usage_hours = Column(Float)

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Your React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SensorReading(BaseModel):
    machine_id: str
    timestamp: datetime
    temperature: float
    vibration_rms: float
    usage_hours: float

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    machine_id = Column(String, index=True)
    timestamp = Column(DateTime)
    level = Column(String)  # "warning", "critical"
    message = Column(Text, nullable=True)
    resolved = Column(Integer, default=0)
     
Base.metadata.create_all(bind=engine)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
def detect_anomalies(db: Session, reading: SensorReading) -> List[str]:
    """Simple rule-based anomaly detection"""
    anomalies = []
    
    #Get last 20 readings for this machine
    recent = db.query(ReadingDB).filter(
        ReadingDB.machine_id == reading.machine_id
    ).order_by(ReadingDB.timestamp.desc()).limit(20).all()
    
    #Rule 1: Temperature thresholds
    if reading.temperature > 95:
        anomalies.append("critical: Temperature critically high")
    elif reading.temperature > 85:
        anomalies.append("warning: Temperature elevated")
    
    #Rule 2: Vibration thresholds
    if reading.vibration_rms > 5.0:
        anomalies.append("critical: Vibration critically high")
    elif reading.vibration_rms > 3.5:
        anomalies.append("warning: Vibration elevated")
    
    #Rule 3: Vibration spike detection
    if len(recent) > 5:
        recent_vibs = [r.vibration_rms for r in recent[:10]]
        avg_vib = statistics.mean(recent_vibs)
        if reading.vibration_rms > avg_vib * 2:
            anomalies.append("warning: Sudden vibration spike")
    
    return anomalies

@app.get("/")
def health_check():
    return {"status": "ok"}

@app.post("/ingest")
def ingest_reading(reading: SensorReading, db: Session = Depends(get_db)):
     
    db_reading = ReadingDB(
        id=f"{reading.machine_id}_{int(reading.timestamp.timestamp())}",
        machine_id=reading.machine_id,
        timestamp=reading.timestamp,
        temperature=reading.temperature,
        vibration_rms=reading.vibration_rms,
        usage_hours=reading.usage_hours
    )
    db.add(db_reading)
    
    # ADD anomaly detection
    anomalies = detect_anomalies(db, reading)
    
    # ADD alerts if anomalies found
    for anomaly_msg in anomalies:
        level = anomaly_msg.split(":")[0]
        alert = Alert(
            machine_id=reading.machine_id,
            timestamp=reading.timestamp,
            level=level,
            message=anomaly_msg
        )
        db.add(alert)
    
    db.commit()
    db.refresh(db_reading)
    
    response = {"message": "reading ingested"}
    if anomalies:
        response["alerts_detected"] = len(anomalies)
    return response

@app.get("/readings")
def get_readings(db: Session = Depends(get_db)):
    return db.query(ReadingDB).limit(100).all()

@app.get("/machines")
def get_machines(db: Session = Depends(get_db)):
    machines = db.query(ReadingDB.machine_id).distinct().all()
    return [{"machine_id": m[0]} for m in machines]

@app.get("/alerts")
def get_alerts(db: Session = Depends(get_db)):
    return db.query(Alert).order_by(Alert.timestamp.desc()).limit(50).all()