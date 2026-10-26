from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any
from app.ai.analyst import get_ai_analysis

router = APIRouter()

class AIRequest(BaseModel):
    pair: str
    tf: str
    price: float
    indicators: Dict[str, Any]
    setups: List[Dict[str, Any]]
    patterns: List[Dict[str, Any]] = []
    levels: Dict[str, Any]

@router.post("/analyze")
async def analyze(req: AIRequest):
    result = await get_ai_analysis(
        req.pair, req.tf, req.price, 
        req.indicators, req.setups, req.patterns, req.levels
    )
    return result
