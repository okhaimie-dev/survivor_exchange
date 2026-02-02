import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exclude problematic packages from server-side bundling for WalletConnect compatibility
  serverExternalPackages: ['pino', 'pino-pretty', 'thread-stream'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
