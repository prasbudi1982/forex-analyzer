'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function JournalPage() {
  const [data, setData] = useState<any>({ trades: [], stats: { total: 0, closed: 0, wins: 0, win_rate: 0 } });
  const [loading, setLoading] = useState(true);

  const fetchJournal = async () => {
    setLoading(true);
    try {
      const res = await api.get('/journal/list');
      setData(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchJournal();
  }, []);

  return (
    <div style={{ padding: 20, background: '#111', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>📓 Jurnal Trading</h2>
        <Link href="/" style={{ color: '#26a69a', textDecoration: 'none', fontSize: '14px', background: '#2B2B43', padding: '8px 12px', borderRadius: '4px' }}>🏠 Home</Link>
      </div>

      {/* Statistik Win Rate */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: 20 }}>
        <div style={{ flex: 1, padding: 15, background: '#1e1e2d', borderRadius: 8, textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '0.8em', color: '#aaa' }}>Total Sinyal</p>
          <h3 style={{ margin: '5px 0 0 0' }}>{data.stats.total}</h3>
        </div>
        <div style={{ flex: 1, padding: 15, background: '#1e1e2d', borderRadius: 8, textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '0.8em', color: '#aaa' }}>Selesai (TP/SL)</p>
          <h3 style={{ margin: '5px 0 0 0' }}>{data.stats.closed}</h3>
        </div>
        <div style={{ flex: 1, padding: 15, background: '#1b3a2a', borderRadius: 8, textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '0.8em', color: '#aaa' }}>Win Rate</p>
          <h3 style={{ margin: '5px 0 0 0', color: '#26a69a' }}>{data.stats.win_rate}%</h3>
        </div>
      </div>

      <button onClick={fetchJournal} disabled={loading} style={{ padding: '8px 16px', background: '#2B2B43', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', marginBottom: 20 }}>
        🔄 Cek Status Terbaru
      </button>

      {loading ? <p>Memuat jurnal...</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {data.trades.length === 0 ? (
            <p>Belum ada sinyal yang disimpan.</p>
          ) : (
            data.trades.map((t: any) => (
              <div key={t.id} style={{ padding: 15, background: '#1e1e2d', borderRadius: 8, borderLeft: `5px solid ${t.status === 'WIN' ? '#26a69a' : t.status === 'LOSS' ? '#ef5350' : '#aaa'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <strong>{t.pair} - {t.setup.replace(/_/g, ' ')}</strong>
                  <span style={{ 
                    padding: '2px 8px', borderRadius: 4, fontSize: '0.75em', fontWeight: 'bold',
                    background: t.status === 'WIN' ? '#26a69a' : t.status === 'LOSS' ? '#ef5350' : '#444',
                    color: 'white'
                  }}>
                    {t.status}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.85em', color: '#aaa' }}>
                  Arah: <span style={{ color: t.dir === 'bull' ? '#26a69a' : '#ef5350', fontWeight: 'bold' }}>{t.dir.toUpperCase()}</span> | 
                  Entry: {t.entry_price} | SL: {t.sl} | TP: {t.tp}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      <div style={{ marginTop: 30, paddingTop: 20, borderTop: '1px solid #333', display: 'flex', gap: '15px', justifyContent: 'center' }}>
        <Link href="/" style={{ color: '#26a69a', textDecoration: 'none' }}>🏠 Home</Link>
        <Link href="/scanner" style={{ color: '#26a69a', textDecoration: 'none' }}>📡 Scanner</Link>
      </div>
    </div>
  );
}
