import json
import os
from datetime import datetime
from app.data.repository import get_ohlc

JOURNAL_FILE = os.path.join(os.path.dirname(__file__), "..", "..", "journal.json")

def load_journal():
    if not os.path.exists(JOURNAL_FILE):
        return []
    with open(JOURNAL_FILE, "r") as f:
        return json.load(f)

def save_journal(data):
    with open(JOURNAL_FILE, "w") as f:
        json.dump(data, f, indent=2)

def add_trade(trade_data: dict):
    journal = load_journal()
    trade_data['id'] = str(datetime.utcnow().timestamp())
    trade_data['status'] = 'OPEN'
    trade_data['created_at'] = datetime.utcnow().isoformat()
    journal.insert(0, trade_data) # Taruh paling atas
    save_journal(journal)
    return {"message": "Sinyal disimpan ke jurnal.", "trade": trade_data}

def check_trades():
    """Fungsi untuk mengecek apakah TP/SL sudah tersentuh"""
    journal = load_journal()
    updated = False

    for trade in journal:
        if trade['status'] != 'OPEN':
            continue
            
        pair = trade['pair']
        tf = trade['tf']
        
        try:
            # Ambil data terbaru (limit 50 cukup untuk cek pergerakan terakhir)
            df = get_ohlc(pair, tf, limit=50)
            if df.empty:
                continue

            # Cek dari waktu trade dibuat
            trade_time = datetime.fromisoformat(trade['created_at'])
            df['datetime'] = pd.to_datetime(df['datetime'])
            df_after = df[df['datetime'] >= trade_time]

            if df_after.empty:
                continue

            # Cek sentuhan SL/TP
            for _, row in df_after.iterrows():
                if trade['dir'] == 'bull':
                    if row['low'] <= trade['sl']:
                        trade['status'] = 'LOSS'
                        trade['closed_at'] = row['datetime'].isoformat()
                        updated = True
                        break
                    if row['high'] >= trade['tp']:
                        trade['status'] = 'WIN'
                        trade['closed_at'] = row['datetime'].isoformat()
                        updated = True
                        break
                else: # Bear
                    if row['high'] >= trade['sl']:
                        trade['status'] = 'LOSS'
                        trade['closed_at'] = row['datetime'].isoformat()
                        updated = True
                        break
                    if row['low'] <= trade['tp']:
                        trade['status'] = 'WIN'
                        trade['closed_at'] = row['datetime'].isoformat()
                        updated = True
                        break
        except Exception as e:
            print(f"Error cek trade {trade['id']}: {e}")

    if updated:
        save_journal(journal)
    
    # Hitung Win Rate
    total_closed = sum(1 for t in journal if t['status'] in ['WIN', 'LOSS'])
    wins = sum(1 for t in journal if t['status'] == 'WIN')
    win_rate = (wins / total_closed * 100) if total_closed > 0 else 0

    return {
        "trades": journal,
        "stats": {
            "total": len(journal),
            "closed": total_closed,
            "wins": wins,
            "win_rate": round(win_rate, 1)
        }
    }
