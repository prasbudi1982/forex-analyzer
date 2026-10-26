from fastapi import APIRouter
from datetime import datetime
from app.fundamentals.economic_calendar import fetch_calendar

router = APIRouter()

@router.get("/calendar")
def calendar(impact: str = "high"):
    return fetch_calendar(datetime.utcnow(), datetime.utcnow(), impact)
