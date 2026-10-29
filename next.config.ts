import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: { serverActions: { bodySizeLimit: '2mb' } },
  // `npm run typecheck` is enforced separately; Next 16.4's CLI parser fails
  // to parse TypeScript 5.9 --showConfig output in this environment.
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
