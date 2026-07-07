import path from "node:path";
import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@saa/agent", "@saa/markets", "@saa/execution"],
  // The repo root has its own lockfile; without this Next warns about
  // multiple lockfiles and may trace files from the wrong root.
  outputFileTracingRoot: path.join(path.dirname(fileURLToPath(import.meta.url)), "../.."),
  async redirects() {
    return [
      // Old top-level pages merged into /picks; /research/[slug] still serves
      // individual reports, so both sources match exact paths only.
      { source: "/events", destination: "/picks", permanent: false },
      { source: "/research", destination: "/picks", permanent: false },
      { source: "/analyst", destination: "/picks", permanent: false },
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
