import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sports Analyst AI Agent",
  description: "Factor-based sports analysis vs prediction market prices (Kalshi, Polymarket, Hyperliquid)"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="nav">
          <span className="brand">Sports Analyst AI Agent</span>
          <a href="/">Markets</a>
          <a href="/settings">Settings</a>
          <span className="mode">Phase 1: Soccer · NFL · NBA · MLB</span>
        </nav>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
