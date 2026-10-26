'use client';
import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { usePair } from '../../context/PairContext';

const TIMEFRAMES = ['15min', '1h', '4h', '1day'];

export default function ScannerPage() {
  const { pair } = usePair();
  const [setups, setSetups] = useState<any[]>([]);
  const [patterns, setPatterns] = useState<any[]>([]);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tf, setTf] = useState('1h');
  
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [news, setNews] = useState<any[]>([]);

  const [autoAiActive, setAutoAiActive] = useState(true);
  const lastProcessedSignal = useRef<string>('');
  const wakeLockRef = useRef<any>(null);

  const formatPrice = (val: any) => {
    if (!val) return '-';
    const num = Number(val);
    if (isNaN(num)) return '-';
    return num > 500 ? num.toFixed(2) : num.toFixed(5);
  };

  // Fungsi untuk menentukan Disclaimer Risiko berdasarkan setup
  const getRiskDisclaimer = (setupName: string) => {
    switch(setupName) {
      case 'market_expansion':
        return { text: "Harga mungkin sudah bergerak terlalu jauh (FOMO). Hindari entry jika candle sudah terlalu panjang, tunggu pullback.", color: "#ff9800" };
      case 'breakout':
        return { text: "Waspada Fakeout. Pastikan ada konfirmasi volume atau candle penutup sebelum entry.", color: "#ff9800" };
      case 'buy_on_dip':
      case 'sell_on_rally':
        return { text: "Sinyal melawan momentum jangka pendek. Gunakan Stop Loss ketat dan target realistis.", color: "#ef5350" };
      case 'bullish_divergence':
      case 'bearish_divergence':
        return { text: "Divergence bisa memberikan sinyal palsu jika tren sangat kuat. Tunggu konfirmasi pola candle reversal.", color: "#ef5350" };
      default:
        return { text: "Pastikan analisa teknikal mendukung dan gunakan manajemen risiko (maksimal 1-2% per trade).", color: "#aaa" };
    }
  };

  const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try { wakeLockRef.current = await (navigator as any).wakeLock.request('screen'); } catch (err) {}
    }
  };
  const releaseWakeLock = async () => {
    if (wakeLockRef.current !== null) {
      try { await wakeLockRef.current.release(); wakeLockRef.current = null; } catch (err) {}
    }
  };

  useEffect(() => {
    if (autoAiActive) requestWakeLock(); else releaseWakeLock();
    const handleVisibilityChange = () => { if (document.visibilityState === 'visible' && autoAiActive) requestWakeLock(); };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => { document.removeEventListener('visibilitychange', handleVisibilityChange); releaseWakeLock(); };
  }, [autoAiActive]);

  const fetchData = async (isInitial = false) => {
    try {
        const [setupRes, recRes, calRes, patRes, sesRes] = await Promise.all([
          api.get(`/analysis/setups?symbol=${pair}&tf=${tf}`),
          api.get(`/decision/recommendation?symbol=${pair}&tf=${tf}`),
          api.get(`/fundamental/calendar?impact=high`),
          api.get(`/analysis/candles?symbol=${pair}&tf=${tf}`),
          api.get(`/session`)
        ]);
        
        const fetchedSetups = setupRes.data;
        const fetchedPatterns = patRes.data.slice(-3);
        
        setSetups(fetchedSetups);
        setRecommendation(recRes.data);
        setNews(calRes.data.slice(0, 3));
        setPatterns(fetchedPatterns);
        setSessionInfo(sesRes.data);
        setLoading(false);

        // LOGIKA AUTO-AI BARU: Terpicu pada setup APAPUN, asalkan itu baru
        if (autoAiActive && fetchedSetups.length > 0 && !aiLoading) {
            // Ambil sinyal terbaru (index 0)
            const latestSignal = fetchedSetups[0]; 
            const signalKey = `${latestSignal.setup}-${latestSignal.dir}-${latestSignal.time_iso}`;
            
            if (lastProcessedSignal.current !== signalKey) {
                lastProcessedSignal.current = signalKey;
                triggerAI(fetchedSetups, fetchedPatterns);
            }
        }
    } catch (err) {
        console.error(err);
        setLoading(false);
    }
  };

  const triggerAI = async (currentSetups: any[], currentPatterns: any[]) => {
    if (aiLoading) return;
    setAiLoading(true);
    setAiResult(null);
    try {
      const [ohlcRes, indRes, levelsRes] = await Promise.all([
        api.get(`/market/ohlc?symbol=${pair}&tf=${tf}&limit=1`),
        api.get(`/indicators?symbol=${pair}&tf=${tf}&names=EMA,RSI,BB,MACD`),
        api.get(`/analysis/levels?symbol=${pair}&tf=${tf}`)
      ]);
      const payload = {
        pair, tf, price: ohlcRes.data[0].close,
        indicators: indRes.data, setups: currentSetups, patterns: currentPatterns, levels: levelsRes.data
      };
      const res = await api.post('/ai/analyze', payload);
      setAiResult(res.data);
    } catch (err) {
      setAiResult({ error: "Gagal memanggil AI." });
    }
    setAiLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    setAiResult(null);
    lastProcessedSignal.current = '';
    fetchData(true);
    const interval = setInterval(() => { fetchData(false); }, 60000);
    return () => clearInterval(interval);
  }, [tf, pair, autoAiActive]);

  const handleManualAI = () => {
    triggerAI(setups, patterns);
  };

  const handleSaveTrade = async (s: any) => {
    try {
      await api.post('/journal/add', {
        pair: pair, tf: tf, dir: s.dir, setup: s.setup,
        entry_price: s.entry_price, sl: s.sl, tp: s.tp
      });
      alert("✅ Sinyal disimpan ke Jurnal!");
    } catch (err) { alert("Gagal menyimpan sinyal."); }
  };

  const timeAgo = (isoString: string) => {
    if (!isoString) return '-';
    const t = new Date(isoString.endsWith('Z') ? isoString : isoString + 'Z').getTime();
    const diff = Math.floor((Date.now() - t) / 1000);
    if (diff < 60) return 'Baru';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}j`;
    return `${Math.floor(diff / 86400)}h`;
  };

  return (
    <div style={{ padding: 15, background: '#111', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
        <h2 style={{ margin: 0, fontSize: '1.2em' }}>📡 Scanner: {pair}</h2>
        <div style={{ display: 'flex', gap: 5 }}>
          <Link href="/journal" style={{ color: '#26a69a', textDecoration: 'none', fontSize: '12px', background: '#2B2B43', padding: '6px 10px', borderRadius: '4px' }}>📓 Jurnal</Link>
          <Link href="/" style={{ color: '#26a69a', textDecoration: 'none', fontSize: '12px', background: '#2B2B43', padding: '6px 10px', borderRadius: '4px' }}>🏠</Link>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 10, background: '#1e1e2d', borderRadius: 8, marginBottom: 15, border: '1px solid #333' }}>
        <div>
          <strong style={{ fontSize: '0.9em' }}>Auto-Analisa AI</strong>
          <p style={{ margin: 0, fontSize: '0.75em', color: '#aaa' }}>Panggil AI otomatis pada setiap sinyal baru.</p>
        </div>
        <label style={{ position: 'relative', display: 'inline-block', width: 46, height: 24 }}>
          <input type="checkbox" checked={autoAiActive} onChange={(e) => setAutoAiActive(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
          <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: autoAiActive ? '#26a69a' : '#555', borderRadius: 24, transition: '.4s' }}>
            <span style={{ position: 'absolute', content: '""', height: 18, width: 18, left: autoAiActive ? 24 : 4, bottom: 3, backgroundColor: 'white', borderRadius: '50%', transition: '.4s' }} />
          </span>
        </label>
      </div>

      {sessionInfo && (
        <div style={{ padding: 10, borderRadius: 8, marginBottom: 15, background: sessionInfo.volatility === 'Tinggi' ? '#1b3a2a' : '#2B2B43', borderLeft: `4px solid ${sessionInfo.volatility === 'Tinggi' ? '#26a69a' : '#ff9800'}`, fontSize: '0.85em' }}>
          <strong>🌐 {sessionInfo.session}</strong> | Volatilitas: {sessionInfo.volatility}
        </div>
      )}

      <div style={{ display: 'flex', gap: '5px', marginBottom: 15 }}>
        {TIMEFRAMES.map((time) => (
          <button key={time} onClick={() => setTf(time)} style={{ flex: 1, padding: '6px 0', background: tf === time ? '#26a69a' : '#2B2B43', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8em', fontWeight: 'bold' }}>
            {time.toUpperCase()}
          </button>
        ))}
      </div>

      <button onClick={handleManualAI} disabled={aiLoading} style={{ width: '100%', padding: '10px', marginBottom: 15, background: '#9C27B0', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.9em', cursor: aiLoading ? 'wait' : 'pointer' }}>
        {aiLoading ? '🧠 Menganalisa...' : '🧠 Minta Saran Trader AI (Manual)'}
      </button>

      {aiLoading && (
        <div style={{ padding: 15, borderRadius: 8, marginBottom: 15, background: '#1e1e2d', border: '1px solid #9C27B0', textAlign: 'center' }}>
          <p style={{ margin: 0, color: '#ce93d8', fontWeight: 'bold' }}>🧠 AI Sedang Menganalisa...</p>
        </div>
      )}

      {aiResult && !aiLoading && (
        <div style={{ padding: 15, borderRadius: 8, marginBottom: 15, background: '#1e1e2d', border: '1px solid #9C27B0', position: 'relative' }}>
          <button onClick={() => setAiResult(null)} style={{ position: 'absolute', top: 8, right: 8, background: 'transparent', border: 'none', color: '#ce93d8', cursor: 'pointer' }}>✖</button>
          
          {aiResult.error ? (
            <p style={{ color: '#ef5350' }}>Error: {aiResult.error}</p>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h4 style={{ margin: 0, color: '#ce93d8', fontSize: '1em' }}>🤖 AI Verdict</h4>
                <span style={{ padding: '2px 8px', borderRadius: 4, fontWeight: 'bold', fontSize: '0.8em', background: aiResult.kesimpulan === 'BULLISH' ? '#26a69a' : aiResult.kesimpulan === 'BEARISH' ? '#ef5350' : '#555', color: 'white' }}>
                  {aiResult.kesimpulan}
                </span>
              </div>

              <p style={{ fontSize: '0.85em', lineHeight: '1.5', color: '#ddd', marginBottom: 15 }}>{aiResult.analisa_singkat}</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 15 }}>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ flex: 1, background: '#111', padding: 10, borderRadius: 6, border: '1px solid #444' }}>
                    <span style={{ fontSize: '0.7em', color: '#aaa' }}>Aksi</span>
                    <p style={{ margin: '4px 0 0 0', fontWeight: 'bold', fontSize: '1.1em', color: aiResult.rekomendasi_aksi === 'BUY' ? '#26a69a' : aiResult.rekomendasi_aksi === 'SELL' ? '#ef5350' : '#fff' }}>{aiResult.rekomendasi_aksi}</p>
                  </div>
                  <div style={{ flex: 1, background: '#111', padding: 10, borderRadius: 6, border: '1px solid #444' }}>
                    <span style={{ fontSize: '0.7em', color: '#aaa' }}>Entry</span>
                    <p style={{ margin: '4px 0 0 0', fontWeight: 'bold', fontSize: '1em' }}>{formatPrice(aiResult.entry_price)}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ flex: 1, background: '#111', padding: 10, borderRadius: 6, border: '1px solid #444' }}>
                    <span style={{ fontSize: '0.7em', color: '#ef5350' }}>Stop Loss (SL)</span>
                    <p style={{ margin: '4px 0 0 0', fontWeight: 'bold', fontSize: '1em', color: '#ef5350' }}>{formatPrice(aiResult.stop_loss)}</p>
                  </div>
                  <div style={{ flex: 1, background: '#111', padding: 10, borderRadius: 6, border: '1px solid #444' }}>
                    <span style={{ fontSize: '0.7em', color: '#26a69a' }}>Take Profit (TP)</span>
                    <p style={{ margin: '4px 0 0 0', fontWeight: 'bold', fontSize: '1em', color: '#26a69a' }}>{formatPrice(aiResult.take_profit)}</p>
                  </div>
                </div>
              </div>

              <div style={{ padding: 10, background: '#332222', borderRadius: 6, fontSize: '0.8em', color: '#ffccbc' }}>
                <strong>⚠️ Peringatan:</strong> {aiResult.peringatan_risiko}
              </div>
            </>
          )}
        </div>
      )}

      <h3 style={{ fontSize: '1em', marginBottom: 10 }}>Setup & Pola ({tf})</h3>
      {loading ? <p>Memindai...</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {setups.map((s: any, i: number) => {
            const risk = getRiskDisclaimer(s.setup);
            return (
              <div key={`setup-${i}`} style={{ padding: 10, background: '#1e1e2d', borderRadius: 6, borderLeft: `4px solid ${s.dir === 'bull' ? '#26a69a' : '#ef5350'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ padding: '2px 6px', borderRadius: 4, fontSize: '0.7em', fontWeight: 'bold', background: s.dir === 'bull' ? '#26a69a' : '#ef5350', color: 'white' }}>
                        {s.dir === 'bull' ? 'BUY' : 'SELL'}
                      </span>
                      <span style={{ fontSize: '0.9em', fontWeight: 'bold', color: '#ffeb3b', textTransform: 'capitalize' }}>
                        {s.setup.replace(/_/g, ' ')}
                      </span>
                      {s.confluence && <span style={{ padding: '1px 4px', background: '#4CAF50', color: 'white', borderRadius: '3px', fontSize: '0.65em' }}>HTF MATCH</span>}
                    </div>
                    <div style={{ fontSize: '0.75em', color: '#aaa', marginBottom: 8 }}>
                      <span style={{ color: '#fff' }}>E:</span> {formatPrice(s.entry_price)} | <span style={{ color: '#ef5350' }}>SL:</span> {formatPrice(s.sl)} | <span style={{ color: '#26a69a' }}>TP:</span> {formatPrice(s.tp)}
                    </div>
                    {/* DISCLAIMER RISIKO */}
                    <div style={{ fontSize: '0.7em', color: risk.color, borderTop: '1px solid #333', paddingTop: 6, marginTop: 4 }}>
                      ⚠️ {risk.text}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, marginLeft: 10 }}>
                    <span style={{ fontSize: '0.7em', color: '#aaa' }}>{timeAgo(s.time_iso)}</span>
                    <button onClick={() => handleSaveTrade(s)} style={{ padding: '4px 8px', background: '#26a69a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75em', fontWeight: 'bold' }}>💾 Simpan</button>
                  </div>
                </div>
              </div>
            );
          })}
          {patterns.map((p: any, i: number) => (
            <div key={`pattern-${i}`} style={{ padding: 10, background: '#1e1e2d', borderRadius: 6, borderLeft: `4px solid #9C27B0` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.9em', fontWeight: 'bold', color: '#ce93d8', textTransform: 'capitalize' }}>🕯️ {p.pattern.replace(/_/g, ' ')}</div>
                <span style={{ fontSize: '0.7em', color: '#aaa' }}>{timeAgo(p.time_iso)}</span>
              </div>
            </div>
          ))}
          {setups.length === 0 && patterns.length === 0 && (<p style={{ textAlign: 'center', color: '#666', fontSize: '0.9em' }}>Tidak ada setup atau pola terdeteksi.</p>)}
        </div>
      )}

      <div style={{ marginTop: 20, paddingTop: 15, borderTop: '1px solid #333', display: 'flex', gap: '10px', justifyContent: 'center', fontSize: '0.85em' }}>
        <Link href="/" style={{ color: '#26a69a', textDecoration: 'none' }}>🏠 Home</Link>
        <Link href="/chart" style={{ color: '#26a69a', textDecoration: 'none' }}>📈 Chart</Link>
        <Link href="/calendar" style={{ color: '#26a69a', textDecoration: 'none' }}>📅 Kalender</Link>
      </div>
    </div>
  );
}
