/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@saa/agent", "@saa/markets", "@saa/execution"],
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
