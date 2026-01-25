"use client";
import { Orbitron } from "next/font/google";
import { GeistMono } from "geist/font/mono";
import { Suspense } from "react";
import "./globals.css";
import Header from "./components/header";
import DisclaimerModal from "./components/disclaimer-modal";
import { StarknetProvider } from "./providers/starknet-provider";
import { ApolloGraphQLProvider } from "./providers/apollo-provider";
import { WalletModalProvider } from "./providers/wallet-modal-provider";
import { EVMProvider } from "./providers/evm-provider";

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <title>Survivor Exchange - Find Your Next Champion</title>
        <meta
          name="description"
          content="Find your next champion. Buy, sell, and auction Loot Survivor beasts on Survivor Exchange."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="icon" href="/logo.png" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Survivor Exchange" />
        <meta property="og:title" content="Survivor Exchange - Find Your Next Champion" />
        <meta property="og:description" content="Find your next champion. Buy, sell, and auction Loot Survivor beasts." />
        <meta property="og:image" content="/og-default.png" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Survivor Exchange - Find Your Next Champion" />
        <meta name="twitter:description" content="Find your next champion. Buy, sell, and auction Loot Survivor beasts." />
        <meta name="twitter:image" content="/og-default.png" />
      </head>
      <body
        className={`${orbitron.variable} ${GeistMono.variable} antialiased bg-black`}
      >
        <EVMProvider>
          <ApolloGraphQLProvider>
            <StarknetProvider>
              <WalletModalProvider>
                <Suspense>
                  <DisclaimerModal />
                  <Header />
                  {children}
                </Suspense>
              </WalletModalProvider>
            </StarknetProvider>
          </ApolloGraphQLProvider>
        </EVMProvider>
      </body>
    </html>
  );
}