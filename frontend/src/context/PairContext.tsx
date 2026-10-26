'use client';
import { createContext, useContext, useState, ReactNode } from 'react';

// Tipe data untuk Pair
type PairContextType = {
  pair: string;
  setPair: (pair: string) => void;
};

const PairContext = createContext<PairContextType | undefined>(undefined);

export function PairProvider({ children }: { children: ReactNode }) {
  const [pair, setPair] = useState('EUR/USD');

  return (
    <PairContext.Provider value={{ pair, setPair }}>
      {children}
    </PairContext.Provider>
  );
}

export function usePair() {
  const context = useContext(PairContext);
  if (!context) throw new Error('usePair must be used within PairProvider');
  return context;
}
