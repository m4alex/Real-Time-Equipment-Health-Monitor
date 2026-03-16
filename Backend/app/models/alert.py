from sqlalchemy import Column, Integer, String, DateTime, Text
from app.database.db import Base

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    machine_id = Column(String, index=True)
    timestamp = Column(DateTime)
    level = Column(String)
    message = Column(Text, nullable=True)
    resolved = Column(Integer, default=0)