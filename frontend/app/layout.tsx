import './globals.css';
import type { Metadata } from 'next';
import { Sarabun } from 'next/font/google';

const sarabun = Sarabun({ subsets: ['thai', 'latin'], variable: '--font-sarabun', weight: ['300', '400', '600', '700'] });

export const metadata: Metadata = {
  title: 'Worddee - AI English Master',
  description: 'Level up your English with AI',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${sarabun.variable} font-sans antialiased bg-slate-50`}>
        {children}
      </body>
    </html>
  );
}