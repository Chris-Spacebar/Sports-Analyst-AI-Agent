/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@saa/agent", "@saa/markets", "@saa/execution"],
  async redirects() {
    return [
      // The Analyst page became the Research library; the trading-agent
      // Settings UI was removed from the interface (packages stay dormant).
      { source: "/analyst", destination: "/research", permanent: false },
      { source: "/settings", destination: "/", permanent: false }
    ];
  },
  webpack: (config) => {
    // The workspace packages use ESM-style ".js" relative imports that
    // resolve to ".ts" source files; tsc handles this, webpack needs a hint.
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      ".js": [".ts", ".tsx", ".js"]
    };
    return config;
  }
};

export default nextConfig;
