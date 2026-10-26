'use client';
import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { usePair } from '../../context/PairContext';

export default function PressurePage() {
  const { pair } = usePair();
  const [bidVol, setBidVol] = useState(0);
  const [askVol, setAskVol] = useState(0);
  const [delta, setDelta] = useState(0);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  
  const lastTickRef = useRef<{ mid: number } | null>(null);
  const pressureWindowRef = useRef<Array<{ dir: 'buy' | 'sell'; ts: number }>>([]);

  useEffect(() => {
    // Fungsi polling tick dari backend
    const fetchTick = async () => {
      try {
        const res = await api.get(`/pressure/tick?symbol=${pair.replace('/', '')}`);
        const data = res.data;
        
        if (!data.mid) return;

        setConnected(true);
        setError('');

        // Hitung arah tick
        let direction: 'buy' | 'sell' | null = null;
        if (lastTickRef.current) {
          if (data.mid > lastTickRef.current.mid) direction = 'buy';
          else if (data.mid < lastTickRef.current.mid) direction = 'sell';
        }
        lastTickRef.current = { mid: data.mid };

        const now = Date.now();
        if (direction) {
          pressureWindowRef.current.push({ dir: direction, ts: now });
        }
        
        // Bersihkan data > 60 detik
        pressureWindowRef.current = pressureWindowRef.current.filter(t => now - t.ts < 60000);

        const buys = pressureWindowRef.current.filter(t => t.dir === 'buy').length;
        const sells = pressureWindowRef.current.filter(t => t.dir === 'sell').length;
        const total = buys + sells;
        
        if (total > 0) {
          setBidVol(sells); 
          setAskVol(buys);  
          setDelta(buys - sells);
        }
      } catch (err) {
        setConnected(false);
        setError('Gagal mengambil data tick.');
      }
    };

    // Panggil pertama kali
    fetchTick();
    
    // Polling setiap 2 detik
    const interval = setInterval(fetchTick, 2000);

    return () => clearInterval(interval);
  }, [pair]);

  const total = bidVol + askVol;
  const buyPercent = total > 0 ? (askVol / total) * 100 : 50;
  const sellPercent = total > 0 ? (bidVol / total) * 100 : 50;

  return (
    <div style={{ padding: 20, background: '#111', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>⚖️ Market Pressure: {pair}</h2>
        <Link href="/" style={{ color: '#26a69a', textDecoration: 'none', fontSize: '14px', background: '#2B2B43', padding: '8px 12px', borderRadius: '4px' }}>
          🏠 Home
        </Link>
      </div>

      <div style={{ marginBottom: 20, fontSize: '0.9em', color: connected ? '#26a69a' : '#ef5350' }}>
        {connected ? '🟢 Terhubung ke stream tick' : '🔴 Terputus'}
        {error && <p style={{ color: '#ef5350' }}>{error}</p>}
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: '0.85em' }}>
          <span style={{ color: '#26a69a' }}>BUY: {buyPercent.toFixed(1)}%</span>
          <span style={{ color: '#ef5350' }}>SELL: {sellPercent.toFixed(1)}%</span>
        </div>
        <div style={{ display: 'flex', height: 30, borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ width: `${buyPercent}%`, background: '#26a69a', transition: 'width 0.3s' }} />
          <div style={{ width: `${sellPercent}%`, background: '#ef5350', transition: 'width 0.3s' }} />
        </div>
      </div>

      <div style={{ padding: 15, background: '#1e1e2d', borderRadius: 8, marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 10px 0' }}>Delta (Buy - Sell)</h3>
        <p style={{ margin: 0, fontSize: '2em', fontWeight: 'bold', color: delta >= 0 ? '#26a69a' : '#ef5350' }}>
          {delta > 0 ? '+' : ''}{delta}
        </p>
        <p style={{ margin: '5px 0 0 0', fontSize: '0.85em', color: '#aaa' }}>
          {delta > 10 ? '🔥 Tekanan beli kuat' : delta < -10 ? '❄️ Tekanan jual kuat' : '⚖️ Seimbang'}
        </p>
      </div>

      <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #333', display: 'flex', gap: '15px', justifyContent: 'center' }}>
        <Link href="/" style={{ color: '#26a69a', textDecoration: 'none' }}>🏠 Home</Link>
        <Link href="/chart" style={{ color: '#26a69a', textDecoration: 'none' }}>📈 Chart</Link>
        <Link href="/scanner" style={{ color: '#26a69a', textDecoration: 'none' }}>📡 Scanner</Link>
      </div>
    </div>
  );
}
