'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function CalendarPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/fundamental/calendar?impact=all')
      .then(res => {
        const sorted = res.data.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setEvents(sorted);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const getImpactColor = (impact: string) => {
    if (impact === 'High') return '#ef5350';
    if (impact === 'Medium') return '#ff9800';
    return '#ffeb3b';
  };

  return (
    <div style={{ padding: 20, background: '#111', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>📅 Kalender Ekonomi</h2>
        <Link href="/" style={{ color: '#26a69a', textDecoration: 'none', fontSize: '14px', background: '#2B2B43', padding: '8px 12px', borderRadius: '4px' }}>
          🏠 Home
        </Link>
      </div>
      
      {loading ? (
        <p>Memuat berita ekonomi...</p>
      ) : events.length === 0 ? (
        <p>Tidak ada berita minggu ini.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {events.map((e, i) => (
            <div key={i} style={{ padding: 15, background: '#2B2B43', borderRadius: 8, borderLeft: `4px solid ${getImpactColor(e.impact)}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <p style={{ margin: 0, fontSize: '0.8em', color: '#aaa' }}>
                  {new Date(e.date).toLocaleString('id-ID')}
                </p>
                <span style={{ fontSize: '0.8em', fontWeight: 'bold', color: getImpactColor(e.impact) }}>
                  {e.country} | {e.impact}
                </span>
              </div>
              <h4 style={{ margin: '5px 0', fontSize: '1.1em' }}>{e.title}</h4>
              <p style={{ margin: 0, fontSize: '0.9em', color: '#ccc' }}>
                Forecast: <b>{e.forecast || '-'}</b> | Previous: {e.previous || '-'}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Menu Navigasi Bawah */}
      <div style={{ marginTop: 30, paddingTop: 20, borderTop: '1px solid #333', display: 'flex', gap: '15px', justifyContent: 'center' }}>
        <Link href="/" style={{ color: '#26a69a', textDecoration: 'none' }}>🏠 Home</Link>
        <Link href="/chart" style={{ color: '#26a69a', textDecoration: 'none' }}>📈 Chart</Link>
        <Link href="/scanner" style={{ color: '#26a69a', textDecoration: 'none' }}>📡 Scanner</Link>
      </div>
    </div>
  );
}
