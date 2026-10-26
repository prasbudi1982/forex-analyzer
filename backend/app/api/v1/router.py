from fastapi import APIRouter
from .routes_market import router as market_router
from .routes_indicators import router as ind_router
from .routes_analysis import router as ana_router
from .routes_fundamental import router as fund_router
from .routes_decision import router as dec_router
from .routes_ai import router as ai_router
from .routes_risk import router as risk_router
from .routes_correlation import router as corr_router
from .routes_journal import router as journal_router
from .routes_session import router as session_router
from .routes_pressure import router as pressure_router

api_router = APIRouter()
api_router.include_router(market_router, prefix="/market", tags=["market"])
api_router.include_router(ind_router, prefix="/indicators", tags=["indicators"])
api_router.include_router(ana_router, prefix="/analysis", tags=["analysis"])
api_router.include_router(fund_router, prefix="/fundamental", tags=["fundamental"])
api_router.include_router(dec_router, prefix="/decision", tags=["decision"])
api_router.include_router(ai_router, prefix="/ai", tags=["ai"])
api_router.include_router(risk_router, prefix="/risk", tags=["risk"])
api_router.include_router(corr_router, prefix="/correlation", tags=["correlation"])
api_router.include_router(journal_router, prefix="/journal", tags=["journal"])
api_router.include_router(session_router, prefix="/session", tags=["session"])
api_router.include_router(pressure_router, prefix="/pressure", tags=["pressure"])
