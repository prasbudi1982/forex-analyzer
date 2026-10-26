from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.router import api_router
from app.core.settings import settings
from app.websocket.tick_stream import stream_ticks

app = FastAPI(title="Forex Analyzer API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

@app.websocket("/ws/ticks/{symbol}")
async def websocket_ticks(websocket: WebSocket, symbol: str):
    await stream_ticks(websocket, symbol)

@app.get("/health")
def health():
    return {"status": "ok"}
