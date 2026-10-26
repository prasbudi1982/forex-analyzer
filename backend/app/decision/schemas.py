from pydantic import BaseModel

class Recommendation(BaseModel):
    direction: str
    confidence: float
    blocked: bool
    reasons: list[str]
