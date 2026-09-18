import { Inter, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

// ── Swiss Design Fonts ───────────────────────────────────────
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
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        {/* ── Header ──────────────────────────────────────── */}
        <header className="border-b border-border">
          <div className="max-w-7xl mx-auto px-6 py-6 flex items-baseline justify-between">
            <Link href="/" className="text-2xl font-bold tracking-tight">
              BID<span className="text-muted">.</span>
            </Link>
            <nav className="flex gap-8 text-sm tracking-wide">
              <Link
                href="/"
                className="text-muted hover:text-foreground transition-colors"
              >
                Enchères
              </Link>
              <Link
                href="/admin"
                className="text-muted hover:text-foreground transition-colors"
              >
                Admin
              </Link>
            </nav>
          </div>
        </header>

        {/* ── Main Content ────────────────────────────────── */}
        <main className="flex-1">{children}</main>

        {/* ── Footer ──────────────────────────────────────── */}
        <footer className="border-t border-border mt-auto">
          <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between text-xs text-muted">
            <span>© {new Date().getFullYear()} BID</span>
            <span className="font-mono">Live Auction System</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
