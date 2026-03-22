from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.models.reading import ReadingDB

router = APIRouter()


@router.get("/machines")
def get_machines(db: Session = Depends(get_db)):

    machines = db.query(ReadingDB.machine_id).distinct().all()

    return [{"machine_id": m[0]} for m in machines if m[0].startswith("machine_")]