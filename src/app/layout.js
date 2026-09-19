import { Inter, Geist_Mono } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import "./globals.css";

// ── Welsh Master Team Fonts ───────────────────────────────────
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

// ── Metadata ─────────────────────────────────────────────────
export const metadata = {
  title: "BID — Live Auction",
  description:
    "Système d'enchères en temps réel. Participez sans créer de compte.",
};

// ── Root Layout ──────────────────────────────────────────────
export default function RootLayout({ children }) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#f4f6fb] text-foreground font-sans">
        {/* ── Header ──────────────────────────────────────── */}
        <header className="bg-[#263654]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2 sm:gap-3 min-w-0">
              {/* WMT Logo */}
              <Image
                src="/wmt-logo.png"
                alt="Welsh Master Team"
                width={40}
                height={40}
                className="object-contain shrink-0"
                priority
              />
              <div className="flex flex-col leading-tight min-w-0">
                <span className="text-lg sm:text-xl font-bold tracking-tight text-white">
                  BID<span className="text-[#c70a1a]">.</span>
                </span>
                <span className="text-[9px] sm:text-[10px] text-white/40 uppercase tracking-widest hidden sm:block truncate">
                  Welsh Master Team
                </span>
              </div>
            </Link>
            {/* Nav — always visible, compact on mobile */}
            <nav className="flex gap-4 sm:gap-8 text-sm tracking-wide shrink-0">
              <Link
                href="/"
                className="text-white/70 hover:text-white transition-colors py-1"
              >
                Enchères
              </Link>
              <Link
                href="/admin"
                className="text-white/70 hover:text-white transition-colors py-1"
              >
                Admin
              </Link>
            </nav>
          </div>
        </header>

        {/* ── Main Content ────────────────────────────────── */}
        <main className="flex-1">{children}</main>

        {/* ── Footer ──────────────────────────────────────── */}
        <footer className="bg-[#263654] mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/60">
            <div className="flex items-center gap-2">
              <Image
                src="/wmt-logo.png"
                alt="Welsh Master Team"
                width={24}
                height={24}
                className="object-contain opacity-70"
              />
              <span>© {new Date().getFullYear()} Welsh Master Team — BID</span>
            </div>
            <span className="font-mono hidden sm:block">Live Auction System</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
