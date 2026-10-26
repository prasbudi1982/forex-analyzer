from fastapi import APIRouter
from pydantic import BaseModel
from app.decision.journal import add_trade, check_trades

router = APIRouter()

class TradeRequest(BaseModel):
    pair: str
    tf: str
    dir: str
    setup: str
    entry_price: float
    sl: float
    tp: float

@router.post("/add")
def create_trade(req: TradeRequest):
    return add_trade(req.dict())

@router.get("/list")
def list_trades():
    return check_trades()
