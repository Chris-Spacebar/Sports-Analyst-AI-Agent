"use client";

import { useState } from "react";

interface EthereumProvider {
  request: (args: { method: string }) => Promise<string[]>;
}

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

/**
 * Minimal injected-wallet connect (MetaMask & friends). Trading is not live
 * yet, so the connected address is display-only for now.
 */
export default function WalletConnect() {
  const [address, setAddress] = useState<string | null>(null);
  const [label, setLabel] = useState("Connect wallet");

  const connect = async () => {
    const eth = (window as unknown as { ethereum?: EthereumProvider }).ethereum;
    if (!eth) {
      setLabel("No wallet detected");
      setTimeout(() => setLabel("Connect wallet"), 2500);
      return;
    }
    try {
      setLabel("Connecting…");
      const accounts = await eth.request({ method: "eth_requestAccounts" });
      if (accounts?.[0]) setAddress(accounts[0]);
      setLabel("Connect wallet");
    } catch {
      setLabel("Connection rejected");
      setTimeout(() => setLabel("Connect wallet"), 2500);
    }
  };

  if (address) {
    return (
      <button type="button" className="wallet-btn connected" title="Click to disconnect" onClick={() => setAddress(null)}>
        ● {short(address)}
      </button>
    );
  }
  return (
    <button type="button" className="wallet-btn" onClick={connect}>
      {label}
    </button>
  );
}
