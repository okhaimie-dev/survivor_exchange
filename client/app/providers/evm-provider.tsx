"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { base, arbitrum, polygon } from 'wagmi/chains';
import { injected, coinbaseWallet, walletConnect } from 'wagmi/connectors';
import { useState, type ReactNode } from 'react';

// WalletConnect project ID from environment
const WALLETCONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

// RPC URLs - use environment variables or fallback to public endpoints
// For production, you should use your own RPC URLs (Alchemy, Infura, etc.)
const RPC_URLS = {
  base: process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://base.llamarpc.com',
  arbitrum: process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL || 'https://arbitrum.llamarpc.com',
  polygon: process.env.NEXT_PUBLIC_POLYGON_RPC_URL || 'https://polygon.llamarpc.com',
};

// Configure wagmi with injected, Coinbase Wallet, and WalletConnect
const config = createConfig({
  chains: [base, arbitrum, polygon],
  connectors: [
    injected(),
    coinbaseWallet({
      appName: 'Survivor Exchange',
    }),
    ...(WALLETCONNECT_PROJECT_ID
      ? [
          walletConnect({
            projectId: WALLETCONNECT_PROJECT_ID,
            metadata: {
              name: 'Survivor Exchange',
              description: 'NFT Auction Marketplace for Loot Survivor Beasts',
              url: 'https://survivor.exchange',
              icons: ['https://survivor.exchange/logo.png'],
            },
          }),
        ]
      : []),
  ],
  transports: {
    [base.id]: http(RPC_URLS.base, { retryCount: 3, retryDelay: 1000 }),
    [arbitrum.id]: http(RPC_URLS.arbitrum, { retryCount: 3, retryDelay: 1000 }),
    [polygon.id]: http(RPC_URLS.polygon, { retryCount: 3, retryDelay: 1000 }),
  },
});

export function EVMProvider({ children }: { children: ReactNode }) {
  // Create QueryClient inside component to avoid SSR issues
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
        // Don't throw errors that crash React
        throwOnError: false,
      },
      mutations: {
        retry: 1,
        throwOnError: false,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        {children}
      </WagmiProvider>
    </QueryClientProvider>
  );
}

// Export config for use in hooks
export { config };
