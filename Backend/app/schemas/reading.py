from pydantic import BaseModel
from datetime import datetime

class SensorReading(BaseModel):
    machine_id: str
    timestamp: datetime
    temperature: float
    vibration_rms: float
    usage_hours: float