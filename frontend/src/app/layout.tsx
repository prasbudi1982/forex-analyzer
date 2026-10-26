import { PairProvider } from '../context/PairContext';

export const metadata = { title: "Forex Analyzer" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body style={{ margin: 0, background: '#111' }}>
        <PairProvider>
          {children}
        </PairProvider>
      </body>
    </html>
  );
}
