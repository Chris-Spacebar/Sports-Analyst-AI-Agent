/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@saa/agent", "@saa/markets", "@saa/execution"]
};

export default nextConfig;
