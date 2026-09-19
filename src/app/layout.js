import { Inter, Geist_Mono } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import "./globals.css";

// ── Welsh Master Team Fonts ───────────────────────────────────
// Inter: Clean, geometric sans-serif — the modern successor
// to Helvetica, perfect for Swiss Design aesthetic.
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
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-3"
            >
              {/* WMT Logo */}
              <Image
                src="/wmt-logo.png"
                alt="Welsh Master Team"
                width={44}
                height={44}
                className="object-contain"
                priority
              />
              <div className="flex flex-col leading-tight">
                <span className="text-xl font-bold tracking-tight text-white">
                  BID<span className="text-[#c70a1a]">.</span>
                </span>
                <span className="text-[10px] text-white/40 uppercase tracking-widest hidden sm:block">
                  Welsh Master Team
                </span>
              </div>
            </Link>
            <nav className="flex gap-8 text-sm tracking-wide">
              <Link
                href="/"
                className="text-white/70 hover:text-white transition-colors"
              >
                Enchères
              </Link>
              <Link
                href="/admin"
                className="text-white/70 hover:text-white transition-colors"
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
          <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between text-xs text-white/60">
            <div className="flex items-center gap-3">
              <Image
                src="/wmt-logo.png"
                alt="Welsh Master Team"
                width={28}
                height={28}
                className="object-contain opacity-70"
              />
              <span>© {new Date().getFullYear()} Welsh Master Team — BID</span>
            </div>
            <span className="font-mono">Live Auction System</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
