from fastapi import APIRouter
from pydantic import BaseModel
from app.decision.risk_manager import calculate_position_size

router = APIRouter()

class RiskRequest(BaseModel):
    pair: str
    entry: float
    stop_loss: float
    balance: float
    risk_percent: float

@router.post("/calculate")
def calculate(req: RiskRequest):
    result = calculate_position_size(
        req.pair, req.entry, req.stop_loss, req.balance, req.risk_percent
    )
    return result
