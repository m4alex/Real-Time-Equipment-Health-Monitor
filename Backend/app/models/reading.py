from sqlalchemy import Column, String, Float, DateTime
from app.database.db import Base

class ReadingDB(Base):
    __tablename__ = "readings"

    id = Column(String, primary_key=True, index=True)
    machine_id = Column(String, index=True)
    timestamp = Column(DateTime)
    temperature = Column(Float)
    vibration_rms = Column(Float)
    usage_hours = Column(Float)