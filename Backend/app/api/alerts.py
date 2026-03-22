from fastapi import APIRouter, Depends , Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone

from app.database.db import get_db
from app.models.alert import Alert

router = APIRouter()


@router.get("/alerts")
def get_alerts(
    db: Session = Depends(get_db),
    since_minutes: int = Query(default=60, ge=1, le=1440),
):
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=since_minutes)

    return (
        db.query(Alert)
        .filter(Alert.timestamp >= cutoff)
        .order_by(Alert.timestamp.desc())
        .limit(50)
        .all()
    )


@router.delete("/alerts")
def clear_alerts(db: Session = Depends(get_db)):
    db.query(Alert).delete()
    db.commit()
    return {"cleared": True}