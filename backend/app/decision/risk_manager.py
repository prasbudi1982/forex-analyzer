def calculate_position_size(pair: str, entry: float, stop_loss: float, balance: float, risk_percent: float):
    """
    Menghitung ukuran Lot berdasarkan risiko.
    """
    if balance <= 0 or risk_percent <= 0 or entry == stop_loss:
        return {"error": "Input tidak valid."}

    # 1. Hitung Risiko dalam Dolar
    risk_amount = balance * (risk_percent / 100)

    # 2. Hitung Jarak SL dalam Pip
    if "XAU" in pair:
        # Emas: 1 pip = 0.1 (biasanya trader emas pakai 0.1 atau 1.0, kita pakai 0.1)
        # Contoh: Entry 2000.00, SL 1995.00 -> Jarak 5.0 -> 50 pip
        pip_distance = abs(entry - stop_loss) / 0.1
        pip_value_per_lot = 1.0 # $1 per 0.1 perak/emas per 1 lot (100 oz)
    else:
        # Forex Standar (EUR/USD, GBP/USD, dll)
        # 1 pip = 0.0001
        pip_distance = abs(entry - stop_loss) / 0.0001
        pip_value_per_lot = 10.0 # $10 per pip per 1 standard lot

    if pip_distance == 0:
        return {"error": "Entry dan SL tidak boleh sama."}

    # 3. Hitung Lot
    # Rumus: Risiko ($) / (Jarak Pip * Nilai Pip per Lot)
    lot_size = risk_amount / (pip_distance * pip_value_per_lot)

    # Bulatkan ke 2 desimal (0.01 lot = micro)
    lot_size = round(lot_size, 2)

    # Cek jika lot terlalu kecil
    if lot_size < 0.01:
        return {
            "error": "Risiko terlalu kecil untuk ukuran Lot minimum (0.01).",
            "risk_amount": round(risk_amount, 2),
            "pip_distance": round(pip_distance, 1)
        }

    return {
        "pair": pair,
        "risk_amount": round(risk_amount, 2),
        "pip_distance": round(pip_distance, 1),
        "lot_size": lot_size,
        "potential_loss": round(lot_size * pip_distance * pip_value_per_lot, 2)
    }
