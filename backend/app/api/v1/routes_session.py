from fastapi import APIRouter
from app.fundamentals.sessions import get_current_session

router = APIRouter()

@router.get("")
def session_info():
    return get_current_session()
