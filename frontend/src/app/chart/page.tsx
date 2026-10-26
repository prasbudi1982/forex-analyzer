'use client';
import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import CandleChart from '@/components/chart/CandleChart';
import Link from 'next/link';
import { usePair } from '../../context/PairContext';

const TIMEFRAMES = ['15min', '1h', '4h', '1day'];
const AVAILABLE_INDICATORS = ['EMA', 'RSI', 'BB', 'MACD'];

export default function ChartPage() {
  const { pair } = usePair();
  const [data, setData] = useState<any[]>([]);
  const [levels, setLevels] = useState<any>(null);
  const [patterns, setPatterns] = useState<any[]>([]);
  const [indicators, setIndicators] = useState<any>(null);
  const [error, setError] = useState('');
  const [tf, setTf] = useState('1h');
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [tzOffset, setTzOffset] = useState<number>(0);

  const [showSR, setShowSR] = useState(false);
  const [showPatterns, setShowPatterns] = useState(false);
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>(['EMA']);

  // Ref untuk Wake Lock
  const wakeLockRef = useRef<any>(null);

  // Fungsi untuk meminta izin layar tetap menyala
  const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        console.log('Wake Lock aktif di Chart.');
      } catch (err: any) {
        console.error(`Gagal mengaktifkan Wake Lock: ${err.name}, ${err.message}`);
      }
    }
  };

  // Efek untuk mengaktifkan Wake Lock saat halaman dibuka
  useEffect(() => {
    requestWakeLock();

    // Tangani jika pengguna pindah tab (browser otomatis melepas lock)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockRef.current !== null) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, []);

  const fetchCandles = async (isInitial = false) => {
    try {
      const indQuery = selectedIndicators.join(',');
      const [ohlcRes, levelsRes, patsRes, indRes] = await Promise.all([
        api.get(`/market/ohlc?symbol=${pair}&tf=${tf}&limit=300`),
        api.get(`/analysis/levels?symbol=${pair}&tf=${tf}`),
        api.get(`/analysis/candles?symbol=${pair}&tf=${tf}`),
        indQuery ? api.get(`/indicators?symbol=${pair}&tf=${tf}&names=${indQuery}`) : Promise.resolve({ data: null })
      ]);

      const formatted = ohlcRes.data.map((d: any) => ({
        time: Math.floor(new Date(d.datetime).getTime() / 1000) + (tzOffset * 3600),
        open: d.open, high: d.high, low: d.low, close: d.close
      })).sort((a: any, b: any) => a.time - b.time);

      setData(formatted);
      setLevels(levelsRes.data);
      setPatterns(patsRes.data);
      setIndicators(indQuery ? indRes.data : null);
      setError('');
    } catch (err: any) {
      if (isInitial) setError('Gagal ambil data: ' + err.message);
    }
  };

  const fetchTickAndPatch = async () => {
    try {
      const tickRes = await api.get(`/pressure/tick?symbol=${pair.replace('/', '')}`);
      const tick = tickRes.data;
      
      if (tick && tick.mid) {
        setData(prevData => {
          if (prevData.length === 0) return prevData;
          
          const newData = [...prevData];
          const lastCandle = { ...newData[newData.length - 1] };
          
          lastCandle.close = tick.mid;
          if (tick.mid > lastCandle.high) lastCandle.high = tick.mid;
          if (tick.mid < lastCandle.low) lastCandle.low = tick.mid;
          
          newData[newData.length - 1] = lastCandle;
          return newData;
        });
        setLastUpdate(new Date().toLocaleTimeString('id-ID'));
      }
    } catch (err) {
      // Abaikan error
    }
  };

  useEffect(() => {
    setData([]);
    fetchCandles(true);
    
    const candleInterval = setInterval(() => { fetchCandles(false); }, 60000);
    const tickInterval = setInterval(() => { fetchTickAndPatch(); }, 5000);
    
    return () => { clearInterval(candleInterval); clearInterval(tickInterval); };
  }, [tf, pair, selectedIndicators, tzOffset]);

  const toggleIndicator = (ind: string) => {
    setSelectedIndicators(prev => prev.includes(ind) ? prev.filter(i => i !== ind) : [...prev, ind]);
  };

  return (
    <div style={{ padding: 20, background: '#111', color: '#fff', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ marginBottom: 10 }}>{pair} - {tf} Chart</h2>
        <Link href="/" style={{ color: '#26a69a', textDecoration: 'none', fontSize: '14px', background: '#2B2B43', padding: '8px 12px', borderRadius: '4px' }}>🏠 Home</Link>
      </div>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: 15, marginTop: 10, overflowX: 'auto' }}>
        {TIMEFRAMES.map((time) => (
          <button key={time} onClick={() => setTf(time)} style={{ padding: '8px 16px', background: tf === time ? '#26a69a' : '#2B2B43', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            {time.toUpperCase()}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: 15, alignItems: 'center', fontSize: '0.9em' }}>
        <span style={{ color: '#aaa' }}>Zona Waktu:</span>
        <select value={tzOffset} onChange={(e) => setTzOffset(Number(e.target.value))} style={{ padding: '6px', background: '#2B2B43', color: 'white', border: '1px solid #444', borderRadius: '4px' }}>
          <option value={0}>UTC</option>
          <option value={2}>GMT+2</option>
          <option value={3}>GMT+3</option>
          <option value={8}>GMT+8</option>
        </select>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'center', marginBottom: 20, background: '#1e1e2d', padding: '10px 15px', borderRadius: '8px', fontSize: '0.9em' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}><input type="checkbox" checked={showSR} onChange={(e) => setShowSR(e.target.checked)} /> S/R</label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}><input type="checkbox" checked={showPatterns} onChange={(e) => setShowPatterns(e.target.checked)} /> Pola</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ color: '#aaa' }}>Indikator:</span>
          {AVAILABLE_INDICATORS.map(ind => (
            <button key={ind} onClick={() => toggleIndicator(ind)} style={{ padding: '4px 10px', background: selectedIndicators.includes(ind) ? '#26a69a' : '#2B2B43', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85em', fontWeight: 'bold' }}>{ind}</button>
          ))}
        </div>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      {data.length > 0 ? (
        <CandleChart data={data} levels={showSR ? levels : null} patterns={showPatterns ? patterns : []} indicators={indicators} />
      ) : (<p>Memuat data...</p>)}

      <p style={{ fontSize: '0.75em', color: '#666', marginTop: 15, textAlign: 'center' }}>
        🔄 Candle baru tiap 60s. Tick realtime tiap 5s. Terakhir: {lastUpdate || '-'}
      </p>

      <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #333', display: 'flex', gap: '15px', justifyContent: 'center' }}>
        <Link href="/" style={{ color: '#26a69a', textDecoration: 'none' }}>🏠 Home</Link>
        <Link href="/scanner" style={{ color: '#26a69a', textDecoration: 'none' }}>📡 Scanner</Link>
        <Link href="/calendar" style={{ color: '#26a69a', textDecoration: 'none' }}>📅 Kalender</Link>
      </div>
    </div>
  );
}
