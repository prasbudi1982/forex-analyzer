'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { usePair } from '../../context/PairContext';

export default function RiskPage() {
  const { pair } = usePair();
  const [entry, setEntry] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [balance, setBalance] = useState('1000');
  const [riskPercent, setRiskPercent] = useState('1');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post('/risk/calculate', {
        pair,
        entry: parseFloat(entry),
        stop_loss: parseFloat(stopLoss),
        balance: parseFloat(balance),
        risk_percent: parseFloat(riskPercent)
      });
      setResult(res.data);
    } catch (err) {
      setResult({ error: 'Gagal menghitung. Periksa input Anda.' });
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: 20, background: '#111', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>🧮 Position Size Calculator</h2>
        <Link href="/" style={{ color: '#26a69a', textDecoration: 'none', fontSize: '14px', background: '#2B2B43', padding: '8px 12px', borderRadius: '4px' }}>
          🏠 Home
        </Link>
      </div>

      <form onSubmit={handleCalculate} style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '400px' }}>
        
        <div>
          <label style={{ display: 'block', marginBottom: 5, fontSize: '0.9em', color: '#aaa' }}>Pair</label>
          <input type="text" value={pair} disabled style={{ width: '100%', padding: 10, background: '#2B2B43', color: '#888', border: '1px solid #444', borderRadius: 4 }} />
          <small style={{ color: '#666' }}>Ubah pair di halaman Home</small>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 5, fontSize: '0.9em', color: '#aaa' }}>Entry Price</label>
          <input type="number" step="any" value={entry} onChange={(e) => setEntry(e.target.value)} required style={{ width: '100%', padding: 10, background: '#1e1e2d', color: 'white', border: '1px solid #444', borderRadius: 4 }} />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 5, fontSize: '0.9em', color: '#aaa' }}>Stop Loss (SL)</label>
          <input type="number" step="any" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} required style={{ width: '100%', padding: 10, background: '#1e1e2d', color: 'white', border: '1px solid #444', borderRadius: 4 }} />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: 5, fontSize: '0.9em', color: '#aaa' }}>Balance ($)</label>
            <input type="number" value={balance} onChange={(e) => setBalance(e.target.value)} required style={{ width: '100%', padding: 10, background: '#1e1e2d', color: 'white', border: '1px solid #444', borderRadius: 4 }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: 5, fontSize: '0.9em', color: '#aaa' }}>Risiko (%)</label>
            <input type="number" step="0.1" value={riskPercent} onChange={(e) => setRiskPercent(e.target.value)} required style={{ width: '100%', padding: 10, background: '#1e1e2d', color: 'white', border: '1px solid #444', borderRadius: 4 }} />
          </div>
        </div>

        <button type="submit" disabled={loading} style={{ padding: 12, background: '#26a69a', color: 'white', border: 'none', borderRadius: 4, fontWeight: 'bold', fontSize: '1em', cursor: 'pointer', marginTop: 10 }}>
          {loading ? 'Menghitung...' : 'Hitung Lot Size'}
        </button>
      </form>

      {result && (
        <div style={{ marginTop: 30, padding: 20, background: result.error ? '#3a1b1b' : '#1b3a2a', borderRadius: 8, border: `1px solid ${result.error ? '#ef5350' : '#26a69a'}` }}>
          {result.error ? (
            <p style={{ margin: 0, color: '#ef5350', fontWeight: 'bold' }}>❌ {result.error}</p>
          ) : (
            <>
              <h3 style={{ margin: '0 0 10px 0', color: '#26a69a' }}>Hasil Perhitungan</h3>
              <p style={{ margin: '5px 0', fontSize: '1.2em' }}>
                Lot yang disarankan: <strong>{result.lot_size} Lot</strong>
              </p>
              <p style={{ margin: '5px 0', fontSize: '0.9em', color: '#aaa' }}>
                Risiko ($): ${result.risk_amount} | Jarak SL: {result.pip_distance} pip
              </p>
              <p style={{ margin: '5px 0', fontSize: '0.9em', color: '#aaa' }}>
                Potensi Kerugian Maksimal: ${result.potential_loss}
              </p>
            </>
          )}
        </div>
      )}

      <div style={{ marginTop: 30, paddingTop: 20, borderTop: '1px solid #333', display: 'flex', gap: '15px', justifyContent: 'center' }}>
        <Link href="/" style={{ color: '#26a69a', textDecoration: 'none' }}>🏠 Home</Link>
        <Link href="/scanner" style={{ color: '#26a69a', textDecoration: 'none' }}>📡 Scanner</Link>
        <Link href="/chart" style={{ color: '#26a69a', textDecoration: 'none' }}>📈 Chart</Link>
      </div>
    </div>
  );
}
