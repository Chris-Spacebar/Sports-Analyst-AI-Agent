export const metadata = { title: "About | Sports Analyst AI Agent" };

export default function AboutPage() {
  return (
    <div>
      <h1>About</h1>

      <div className="card">
        <h2>What this is</h2>
        <p>
          We publish deep research on sports prediction markets. Every pick comes with a probability,
          published before kickoff, and is graded in public when the market settles. You compare our
          number with the live market price and decide for yourself.
        </p>
      </div>

      <div className="card">
        <h2>Who makes the picks</h2>
        <p>
          Research by the founder with AI analysis support. Every probability is published before
          kickoff and graded in public. No pick is edited after publish.
        </p>
      </div>

      <div className="card">
        <h2>How the probabilities are made</h2>
        <p>
          Each pick comes from factor-based research: form, injuries and suspensions, tactics, venue
          and weather, head-to-head, and market odds. Each report links its sources.
        </p>
      </div>

      <div className="card">
        <h2>What the wallet button does</h2>
        <p>
          Nothing yet. It will be used when on-site trading launches; today it only displays your
          address.
        </p>
      </div>

      <p>On-site trading is coming soon. Until then, trade on Kalshi, Polymarket, or Hyperliquid.</p>
      <p className="muted">
        Research for entertainment. Not financial advice. Prediction markets involve real financial
        risk.
      </p>
    </div>
  );
}
