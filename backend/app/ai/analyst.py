import os
import json
import httpx
from openai import OpenAI
from datetime import datetime, timezone
from app.fundamentals.economic_calendar import fetch_calendar
from app.fundamentals.sessions import get_current_session

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
client = OpenAI(base_url="https://api.groq.com/openai/v1", api_key=GROQ_API_KEY)

async def get_ai_analysis(pair: str, tf: str, price: float, indicators: dict, setups: list, patterns: list, levels: dict):
    if not GROQ_API_KEY:
        return {"error": "API Key Groq belum diatur."}

    try:
        # 1. Kalender & Sesi
        try:
            calendar_events = fetch_calendar(datetime.utcnow(), datetime.utcnow(), impact="high")
            news_texts = [f"- {e.get('title', '')}" for e in calendar_events[:3]] or ["- Tidak ada berita high-impact."]
        except:
            news_texts = ["- Gagal ambil kalender."]
        session_info = get_current_session()

        # 2. Market Pressure
        pressure_text = "Data tekanan pasar tidak tersedia."
        try:
            async with httpx.AsyncClient() as http_client:
                safe_symbol = pair.replace("/", "")
                res = await http_client.get(f"http://localhost:8000/api/v1/pressure/tick?symbol={safe_symbol}", timeout=5.0)
                if res.status_code == 200:
                    p_data = res.json()
                    pressure_text = f"Tick Terbaru: Bid={p_data.get('bid')}, Ask={p_data.get('ask')}"
        except:
            pass

        # 3. FORMAT SETUP DENGAN UMUR SINYAL
        now_utc = datetime.now(timezone.utc)
        setup_texts = []
        for s in setups:
            age_text = "Waktu tidak diketahui"
            if s.get('time_iso'):
                try:
                    # Parse waktu dari backend (asumsi UTC)
                    signal_time = datetime.fromisoformat(s['time_iso']).replace(tzinfo=timezone.utc)
                    diff_seconds = (now_utc - signal_time).total_seconds()
                    
                    if diff_seconds < 60:
                        age_text = "Baru saja"
                    elif diff_seconds < 3600:
                        age_text = f"{int(diff_seconds // 60)} menit lalu"
                    elif diff_seconds < 86400:
                        age_text = f"{int(diff_seconds // 3600)} jam lalu"
                    else:
                        age_text = f"{int(diff_seconds // 86400)} hari lalu"
                except Exception:
                    pass
            
            setup_texts.append(f"- {s.get('setup')} ({s.get('dir')}) muncul {age_text}. Alasan: {s.get('reason', '')}")

        if not setup_texts:
            setup_texts = ["- Tidak ada setup."]

        # 4. Format Pola
        pattern_texts = [f"- {p.get('pattern')} ({p.get('dir')})" for p in patterns] or ["- Tidak ada pola."]
        
        # 5. Indikator
        rsi_val = indicators.get("RSI", [None])[-1] if indicators.get("RSI") else "N/A"
        ema_val = indicators.get("EMA", [None])[-1] if indicators.get("EMA") else "N/A"
        bb_text = f"Upper: {indicators['BB']['upper'][-1]}, Lower: {indicators['BB']['lower'][-1]}" if indicators.get("BB") else "N/A"
        macd_text = f"MACD: {round(indicators['MACD']['macd'][-1], 5)} vs Signal: {round(indicators['MACD']['signal'][-1], 5)}" if indicators.get("MACD") else "N/A"

        prompt = f"""
        Anda adalah trader forex profesional senior.
        Data Teknikal: {pair} {tf}, Harga: {price}
        Indikator: RSI={rsi_val}, EMA={ema_val}, BB={bb_text}, {macd_text}
        Likuiditas: {pressure_text}
        Level: Support={levels.get('support', [])[-2:]}, Resistance={levels.get('resistance', [])[-2:]}
        
        Setup Terdeteksi (Beserta Umurnya):
        {chr(10).join(setup_texts)}
        
        Pola: {chr(10).join(pattern_texts)}
        Sesi: {session_info.get('session')} (Volatilitas: {session_info.get('volatility')})
        Berita: {chr(10).join(news_texts)}

        Instruksi Penting:
        - Evaluasi umur sinyal. Jika sinyal sudah berumur lebih dari 3 jam (atau lebih dari 3 candle di TF 1H), berikan peringatan bahwa sinyal mungkin sudah "basi" (expired) dan harga mungkin sudah bergerak terlalu jauh.
        - Jangan menyarankan ENTRY jika sinyal sudah basi, lebih baik sarankan TUNGGU.
        - Jika sinyal masih "Baru saja" atau beberapa menit lalu, sinyal tersebut valid untuk dieksekusi.

        Balas HANYA dengan format JSON valid (tanpa markdown):
        {{
            "kesimpulan": "BULLISH" | "BEARISH" | "NETRAL",
            "skor_kualitas": 0-100,
            "analisa_singkat": "Penjelasan singkat (sebutkan jika sinyal sudah basi atau masih fresh).",
            "rekomendasi_aksi": "BUY" | "SELL" | "TUNGGU",
            "entry_price": "1.12345" (string) atau null,
            "stop_loss": "1.12000" (string) atau null,
            "take_profit": "1.13000" (string) atau null,
            "peringatan_risiko": "Peringatan singkat."
        }}
        """

        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="openai/gpt-oss-120b",
            temperature=0.1,
            max_tokens=1000,
            response_format={"type": "json_object"}
        )
        
        content = chat_completion.choices[0].message.content
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            return {"error": "AI mengembalikan format yang tidak valid.", "raw": content}

    except Exception as e:
        return {"error": str(e)}
