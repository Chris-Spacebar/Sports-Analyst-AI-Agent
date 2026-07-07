import type { Metadata } from "next";
import "./globals.css";
import WalletConnect from "@/components/WalletConnect";
import NavLinks from "@/components/NavLinks";
import { SITE_META, overallScorecard } from "@/lib/reports";
import CommunityCount from "@/components/community/CommunityCount";

export const metadata: Metadata = {
  title: "Sports Analyst AI Agent",
  description:
    "Deep research for sports prediction markets: published probabilities, live market prices, and a graded public track record (Kalshi, Polymarket, Hyperliquid)."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const overall = overallScorecard();
  return (
    <html lang="en">
      <body>
        <div className="statusbar">
          <div className="statusbar-in">
            <span>
              <span className="dot" />
              Research desk · results updated {SITE_META.resultsUpdatedAt}
              <CommunityCount />
            </span>
            <span>
              {overall.totalPicks} picks published · {overall.pending} pending
              {overall.brierScore != null ? ` · Brier ${overall.brierScore}` : ""}
            </span>
          </div>
        </div>
        <nav className="nav">
          <a href="/" className="brand">
            Sports Analyst <span className="amb">AI Agent</span>
          </a>
          <NavLinks />
          <span className="nav-spacer" />
          <WalletConnect />
        </nav>
        <main className="container">{children}</main>
        <footer className="site-footer">
          <p>Research for entertainment. Not financial advice. Prediction markets involve real financial risk.</p>
          <p>
            <a href="/about">About</a> · <a href="/#how-it-works">How it works</a> ·{" "}
            <a href="/track-record">Track record</a>
          </p>
          <p>
            Results updated {SITE_META.resultsUpdatedAt}. {SITE_META.nextReportNote}
          </p>
        </footer>
      </body>
    </html>
  );
}
