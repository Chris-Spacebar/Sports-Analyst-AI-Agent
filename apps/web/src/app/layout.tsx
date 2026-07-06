import type { Metadata } from "next";
import "./globals.css";
import WalletConnect from "@/components/WalletConnect";
import NavLinks from "@/components/NavLinks";

export const metadata: Metadata = {
  title: "Sports Analyst AI Agent",
  description: "Factor-based sports analysis vs prediction market prices (Kalshi, Polymarket, Hyperliquid)"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="nav">
          <a href="/" className="brand">Sports Analyst AI Agent</a>
          <NavLinks />
          <span className="nav-spacer" />
          <WalletConnect />
        </nav>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
