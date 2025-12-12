import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { BookOpen, LayoutDashboard, Sparkles } from "lucide-react";

// โหลดฟอนต์ Sarabun
const sarabun = Sarabun({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-sarabun",
});

export const metadata: Metadata = {
  title: "WordDee - ฝึกแต่งประโยค AI",
  description: "เรียนรู้คำศัพท์และฝึกแต่งประโยคด้วย AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={`${sarabun.variable} font-sans antialiased`}>
        {/* Navbar แบบ Modern Glassmorphism */}
        <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
          <div className="container mx-auto px-4 h-16 flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="bg-indigo-600 p-2 rounded-lg text-white transition group-hover:rotate-12">
                <BookOpen size={20} strokeWidth={3} />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
                WordDee
              </span>
            </Link>

            <div className="flex gap-2">
              <Link href="/" className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-slate-600 hover:bg-slate-100 transition">
                <Sparkles size={16} /> ฝึกฝน
              </Link>
              <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-slate-600 hover:bg-slate-100 transition">
                <LayoutDashboard size={16} /> สถิติ
              </Link>
            </div>
          </div>
        </nav>
        
        <main className="container mx-auto px-4 pt-24 pb-12 max-w-6xl">
          {children}
        </main>
      </body>
    </html>
  );
}