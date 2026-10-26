import asyncio
import json
import websockets
from fastapi import WebSocket, WebSocketDisconnect

BIQUOTE_WS = "wss://biquote.io/hubs/tick"

async def stream_ticks(websocket: WebSocket, symbol: str):
    """
    Teruskan tick dari Biquote SignalR ke frontend.
    Catatan: SignalR bukan WebSocket murni, tapi kita bisa menggunakan
    endpoint alternatif atau polling REST untuk sementara.
    """
    await websocket.accept()
    
    # Karena SignalR butuh handshake khusus, kita gunakan polling REST sederhana
    # untuk mendapatkan tick terbaru setiap 500ms (sementara)
    import httpx
    
    try:
        while True:
            try:
                async with httpx.AsyncClient(timeout=5.0) as client:
                    # Biquote REST untuk tick terbaru
                    safe_symbol = symbol.replace("/", "")
                    r = await client.get(f"https://biquote.io/api/{safe_symbol}")
                    if r.status_code == 200:
                        tick = r.json()
                        await websocket.send_text(json.dumps({
                            "symbol": symbol,
                            "bid": tick.get("bid"),
                            "ask": tick.get("ask"),
                            "mid": tick.get("mid"),
                            "timestamp": tick.get("timestamp")
                        }))
            except Exception as e:
                await websocket.send_text(json.dumps({"error": str(e)}))
            
            await asyncio.sleep(0.5)  # Polling 500ms
    except WebSocketDisconnect:
        print(f"Client disconnected from {symbol} tick stream")
