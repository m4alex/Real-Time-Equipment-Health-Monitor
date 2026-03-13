from datetime import datetime
from typing import List

from fastapi import FastAPI, Depends
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, String, Float, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

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

class SensorReading(BaseModel):
    machine_id: str
    timestamp: datetime
    temperature: float
    vibration_rms: float
    usage_hours: float

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

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
    db.commit()
    db.refresh(db_reading)
    return {"message": "reading ingested"}

@app.get("/readings")
def get_readings(db: Session = Depends(get_db)):
    return db.query(ReadingDB).limit(100).all()

@app.get("/machines")
def get_machines(db: Session = Depends(get_db)):
    machines = db.query(ReadingDB.machine_id).distinct().all()
    return [{"machine_id": m[0]} for m in machines]
