import type { Metadata } from "next";
import "./globals.css";
import WalletConnect from "@/components/WalletConnect";

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
          <a href="/events">Events</a>
          <a href="/markets">Markets</a>
          <a href="/research">Research</a>
          <span className="mode">Phase 1: Soccer · NFL · NBA · MLB</span>
          <WalletConnect />
        </nav>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
