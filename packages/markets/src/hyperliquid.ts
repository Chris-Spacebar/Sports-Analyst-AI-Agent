import type { MarketListing, ScanOptions, VenueAdapter } from "./types.js";

/**
 * Hyperliquid HIP-4 adapter — STUB, pending verification.
 *
 * HIP-4 (builder-deployed event/prediction markets) is newer than this
 * scaffold's reference knowledge. Before wiring this up:
 *   1. Read the current HIP-4 spec: https://hyperliquid.gitbook.io/hyperliquid-docs
 *   2. Confirm how event markets are listed via the public info endpoint
 *      (POST https://api.hyperliquid.xyz/info) and what `type` payload
 *      returns them (perps use {"type":"meta"}; event markets may differ)
 *   3. Normalize prices to 0..1 to match the other venues
 *
 * The adapter interface is final — only this file's internals need filling in.
 */
const INFO_URL = "https://api.hyperliquid.xyz/info";

export const hyperliquid: VenueAdapter = {
  venue: "hyperliquid",
  async fetchMarkets(_opts: ScanOptions = {}): Promise<MarketListing[]> {
    // TODO(HIP-4): replace with the verified event-markets payload.
    // Example of the call shape (currently returns perp metadata, not events):
    // const res = await fetch(INFO_URL, {
    //   method: "POST",
    //   headers: { "content-type": "application/json" },
    //   body: JSON.stringify({ type: "meta" })
    // });
    void INFO_URL;
    return [];
  }
};
