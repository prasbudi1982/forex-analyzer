'use client';
import Link from 'next/link';
import { usePair } from '../context/PairContext';

const PAIRS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'XAU/USD'];

export default function Home() {
  const { pair, setPair } = usePair();

  return (
    <main style={{ padding: 24, background: '#111', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <h1>💱 Forex Analyzer</h1>
      
      <div style={{ marginBottom: 30 }}>
        <h3 style={{ color: '#aaa', fontSize: '0.9em', marginBottom: 10 }}>1. Pilih Pair</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {PAIRS.map((p) => (
            <button 
              key={p} 
              onClick={() => setPair(p)} 
              style={{ 
                padding: '10px 20px', 
                background: pair === p ? '#26a69a' : '#2B2B43', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px', 
                fontWeight: 'bold', 
                cursor: 'pointer' 
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 style={{ color: '#aaa', fontSize: '0.9em', marginBottom: 10 }}>2. Pilih Menu</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '350px' }}>
          
          <Link href="/chart" style={{ padding: '15px', background: '#2B2B43', color: 'white', borderRadius: '8px', textDecoration: 'none', textAlign: 'center' }}>
            📈 Chart ({pair})
          </Link>
          
          <Link href="/scanner" style={{ padding: '15px', background: '#2B2B43', color: 'white', borderRadius: '8px', textDecoration: 'none', textAlign: 'center' }}>
            📡 Scanner ({pair})
          </Link>
          
          <Link href="/journal" style={{ padding: '15px', background: '#2B2B43', color: 'white', borderRadius: '8px', textDecoration: 'none', textAlign: 'center' }}>
            📓 Jurnal Trading & Win Rate
          </Link>

          <Link href="/risk" style={{ padding: '15px', background: '#2B2B43', color: 'white', borderRadius: '8px', textDecoration: 'none', textAlign: 'center' }}>
            🧮 Risk & Position Calculator
          </Link>

          <Link href="/correlation" style={{ padding: '15px', background: '#2B2B43', color: 'white', borderRadius: '8px', textDecoration: 'none', textAlign: 'center' }}>
            🔗 Cek Korelasi Pair
          </Link>

          <Link href="/pressure" style={{ padding: '15px', background: '#2B2B43', color: 'white', borderRadius: '8px', textDecoration: 'none', textAlign: 'center' }}>
            ⚖️ Market Pressure
          </Link>

          <Link href="/calendar" style={{ padding: '15px', background: '#2B2B43', color: 'white', borderRadius: '8px', textDecoration: 'none', textAlign: 'center' }}>
            📅 Kalender Ekonomi
          </Link>

        </div>
      </div>
    </main>
  );
}
