import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'The Secret Lodge — Lagos Life Mod',
  description: 'Secret society mod and portal for Lagos Life.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0f0e0c] text-[#e8d98c] min-h-screen font-serif antialiased">
        {children}
      </body>
    </html>
  );
}
