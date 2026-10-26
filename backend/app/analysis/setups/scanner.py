from .breakout import detect as breakout
from .pullback import detect as pullback
from .dip_rally import detect as dip_rally
from .divergence import detect as divergence
from .expansion import detect as expansion
from app.indicators.trend import ema
from app.indicators.volatility import atr
import pandas as pd

def get_htf_trend(df):
    if len(df) < 50: return "neutral"
    ema50 = ema(df, 50)
    last_close = df['close'].iloc[-1]
    last_ema = ema50.iloc[-1]
    if last_close > last_ema: return "bull"
    elif last_close < last_ema: return "bear"
    return "neutral"

def scan(df, levels, htf_trend="neutral"):
    results = []
    
    if 'datetime' in df.columns:
        df['time_iso'] = pd.to_datetime(df['datetime']).dt.strftime('%Y-%m-%dT%H:%M:%S')
    else:
        df['time_iso'] = ""

    last_time_iso = df['time_iso'].iloc[-1] if not df.empty else ""
    last_price = df['close'].iloc[-1]
    atr_series = atr(df, 14)
    current_atr = atr_series.iloc[-1] if not atr_series.empty else 0.0010

    def add_confluence_and_targets(setup_data):
        setup_data['htf_trend'] = htf_trend
        setup_data['confluence'] = (setup_data['dir'] == htf_trend)
        setup_data['entry_price'] = round(last_price, 5)
        
        if setup_data['dir'] == 'bull':
            setup_data['sl'] = round(last_price - (current_atr * 1.5), 5)
            setup_data['tp'] = round(last_price + (current_atr * 3.0), 5)
        else:
            setup_data['sl'] = round(last_price + (current_atr * 1.5), 5)
            setup_data['tp'] = round(last_price - (current_atr * 3.0), 5)
        return setup_data

    # 1. Breakout
    for r in levels.get("resistance", []):
        s = breakout(df, r)
        if s: 
            s['time_iso'] = last_time_iso
            results.append(add_confluence_and_targets(s))
    for s_ in levels.get("support", []):
        s = breakout(df, s_)
        if s:
            s['time_iso'] = last_time_iso
            results.append(add_confluence_and_targets(s))
        
    # 2. Pullback
    ema20 = ema(df, 20)
    p = pullback(df, ema20)
    if p: 
        p['time_iso'] = last_time_iso
        results.append(add_confluence_and_targets(p))
    
    # 3. Buy Dip / Sell Rally
    dr = dip_rally(df)
    for d in dr:
        d['time_iso'] = last_time_iso
        results.append(add_confluence_and_targets(d))

    # 4. Divergence
    divs = divergence(df)
    for d in divs:
        d['time_iso'] = last_time_iso
        results.append(add_confluence_and_targets(d))

    # 5. Market Expansion
    exps = expansion(df)
    for e in exps:
        e['time_iso'] = last_time_iso
        results.append(add_confluence_and_targets(e))
    
    return results
