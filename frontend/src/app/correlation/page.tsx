'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';

const ALL_PAIRS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'XAU/USD', 'USD/CHF', 'AUD/USD'];

export default function CorrelationPage() {
  const [selected, setSelected] = useState<string[]>(['EUR/USD', 'GBP/USD']);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const togglePair = (p: string) => {
    setSelected(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const handleCheck = async () => {
    if (selected.length < 2) {
      alert("Pilih minimal 2 pair.");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await api.get(`/correlation?symbols=${selected.join(',')}&tf=1h`);
      setResult(res.data);
    } catch (err) {
      setResult({ error: 'Gagal mengambil data korelasi.' });
    }
    setLoading(false);
  };

  const getColor = (val: number) => {
    if (val >= 0.8) return '#ef5350'; // Merah (Bahaya Searah)
    if (val <= -0.8) return '#ff9800'; // Oranye (Bahaya Berlawanan)
    if (val > 0.5) return '#26a69a'; // Hijau (Agak Searah)
    if (val < -0.5) return '#26a69a'; 
    return '#aaa'; // Abu (Netral)
  };

  return (
    <div style={{ padding: 20, background: '#111', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>🔗 Korelasi Pair</h2>
        <Link href="/" style={{ color: '#26a69a', textDecoration: 'none', fontSize: '14px', background: '#2B2B43', padding: '8px 12px', borderRadius: '4px' }}>🏠 Home</Link>
      </div>

      <p style={{ fontSize: '0.85em', color: '#aaa', marginBottom: 15 }}>
        Pilih pair yang ingin Anda buka posisinya. Sistem akan mendeteksi jika ada tabrakan risiko.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: 20 }}>
        {ALL_PAIRS.map(p => (
          <button
            key={p}
            onClick={() => togglePair(p)}
            style={{
              padding: '8px 12px',
              background: selected.includes(p) ? '#26a69a' : '#2B2B43',
              color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'
            }}
          >
            {p}
          </button>
        ))}
      </div>

      <button onClick={handleCheck} disabled={loading} style={{ padding: '12px 20px', background: '#9C27B0', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginBottom: 20 }}>
        {loading ? 'Menghitung...' : 'Cek Korelasi'}
      </button>

      {result && result.error && (
        <p style={{ color: '#ef5350' }}>{result.error}</p>
      )}

      {result && !result.error && (
        <>
          {/* PERINGATAN BAHAYA */}
          {result.warnings.length > 0 && (
            <div style={{ padding: 15, background: '#3a1b1b', borderLeft: '4px solid #ef5350', borderRadius: 8, marginBottom: 20 }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#ef5350' }}>⚠️ Peringatan Risiko Ganda!</h4>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: '0.9em' }}>
                {result.warnings.map((w: any, i: number) => (
                  <li key={i} style={{ marginBottom: 5 }}>
                    <strong>{w.pair1}</strong> dan <strong>{w.pair2}</strong> berkorelasi <strong>{w.relation}</strong> ({w.value}). 
                    Membuka posisi searah pada keduanya akan menggandakan risiko Anda!
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* MATRIKS KORELASI */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', fontSize: '0.85em' }}>
              <thead>
                <tr>
                  <th style={{ padding: 8, border: '1px solid #333', background: '#1e1e2d' }}>Pair</th>
                  {selected.map(s => <th key={s} style={{ padding: 8, border: '1px solid #333', background: '#1e1e2d' }}>{s}</th>)}
                </tr>
              </thead>
              <tbody>
                {selected.map(row => (
                  <tr key={row}>
                    <td style={{ padding: 8, border: '1px solid #333', fontWeight: 'bold', background: '#1e1e2d' }}>{row}</td>
                    {selected.map(col => {
                      const val = result.matrix[row]?.[col] || 0;
                      return (
                        <td key={col} style={{ padding: 8, border: '1px solid #333', textAlign: 'center', color: getColor(val), fontWeight: 'bold' }}>
                          {val.toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: '0.75em', color: '#666', marginTop: 10 }}>
            Merah = Searah (Bahaya) | Oranye = Berlawanan (Bahaya) | Hijau = Aman | Abu = Netral
          </p>
        </>
      )}

      <div style={{ marginTop: 30, paddingTop: 20, borderTop: '1px solid #333', display: 'flex', gap: '15px', justifyContent: 'center' }}>
        <Link href="/" style={{ color: '#26a69a', textDecoration: 'none' }}>🏠 Home</Link>
        <Link href="/scanner" style={{ color: '#26a69a', textDecoration: 'none' }}>📡 Scanner</Link>
        <Link href="/risk" style={{ color: '#26a69a', textDecoration: 'none' }}>🧮 Risk Calc</Link>
      </div>
    </div>
  );
}
