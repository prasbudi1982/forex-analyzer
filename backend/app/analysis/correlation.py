import pandas as pd
import numpy as np
from app.data.repository import get_ohlc

def calculate_correlation(symbols: list, tf: str = "1h"):
    """
    Menghitung matriks korelasi antar pair.
    Nilai 1.0 = Searah sempurna. -1.0 = Berlawanan sempurna.
    """
    if len(symbols) < 2:
        return {"error": "Pilih minimal 2 pair untuk melihat korelasi."}

    # 1. Ambil data OHLC untuk semua pair (limit 100 sudah cukup untuk korelasi)
    data_frames = {}
    for sym in symbols:
        df = get_ohlc(sym, tf, limit=100)
        if not df.empty:
            data_frames[sym] = df.set_index('datetime')['close']

    if len(data_frames) < 2:
        return {"error": "Gagal mengambil data untuk pair yang dipilih."}

    # 2. Gabungkan semua data berdasarkan waktu (datetime)
    df_all = pd.DataFrame(data_frames).dropna()

    # 3. Hitung matriks korelasi
    corr_matrix = df_all.corr().round(2)

    # 4. Cari peringatan korelasi tinggi (> 0.8 atau < -0.8)
    warnings = []
    for i in range(len(corr_matrix.columns)):
        for j in range(i + 1, len(corr_matrix.columns)):
            pair1 = corr_matrix.columns[i]
            pair2 = corr_matrix.columns[j]
            val = corr_matrix.iloc[i, j]
            
            if abs(val) >= 0.8:
                relation = "SEARAH" if val > 0 else "BERLAWANAN"
                warnings.append({
                    "pair1": pair1,
                    "pair2": pair2,
                    "value": float(val),
                    "relation": relation
                })

    return {
        "matrix": corr_matrix.to_dict(),
        "warnings": warnings
    }
