'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function TestNotifPage() {
  const [permission, setPermission] = useState<string>('default');
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    } else {
      setStatus('Browser ini tidak mendukung notifikasi.');
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      setStatus('Browser tidak mendukung notifikasi.');
      return;
    }
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      setStatus(`Status izin: ${result}`);
    } catch (e) {
      setStatus(`Gagal meminta izin: ${e}`);
    }
  };

  const showNotif = () => {
    if (Notification.permission === 'granted') {
      try {
        new Notification('Tes Berhasil!', {
          body: 'Notifikasi dari Forex Analyzer berfungsi.',
          icon: '/favicon.ico',
        });
        setStatus('Notifikasi berhasil dipanggil!');
      } catch (e) {
        setStatus(`Error saat memanggil notifikasi: ${e}`);
      }
    } else {
      setStatus('Izin belum diberikan. Klik "Minta Izin" dulu.');
    }
  };

  return (
    <div style={{ padding: 20, background: '#111', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <h2>🔔 Tes Notifikasi</h2>
      
      <div style={{ marginBottom: 20, padding: 15, background: '#1e1e2d', borderRadius: 8 }}>
        <p style={{ margin: '0 0 10px 0' }}>Status Izin Saat Ini: <strong style={{ color: permission === 'granted' ? '#26a69a' : '#ef5350' }}>{permission.toUpperCase()}</strong></p>
        {status && <p style={{ margin: 0, color: '#ff9800', fontSize: '0.9em' }}>{status}</p>}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button onClick={requestPermission} style={{ padding: 15, background: '#9C27B0', color: 'white', border: 'none', borderRadius: 8, fontWeight: 'bold' }}>
          1. Minta Izin Notifikasi
        </button>
        <button onClick={showNotif} style={{ padding: 15, background: '#26a69a', color: 'white', border: 'none', borderRadius: 8, fontWeight: 'bold' }}>
          2. Tampilkan Notifikasi
        </button>
      </div>

      <div style={{ marginTop: 30, paddingTop: 20, borderTop: '1px solid #333' }}>
        <Link href="/" style={{ color: '#26a69a' }}>← Kembali ke Home</Link>
      </div>
    </div>
  );
}
