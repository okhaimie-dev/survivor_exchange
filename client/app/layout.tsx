"use client";
import { Orbitron, Inter } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import Header from "./components/header";
import DisclaimerModal from "./components/disclaimer-modal";
import { StarknetProvider } from "./providers/starknet-provider";
import { ApolloGraphQLProvider } from "./providers/apollo-provider";

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
        <title>Loot Auction</title>
        <meta
          name="description"
          content="Loot Auction is a platform for auctioning and bidding on monsters from the game 'Loot survivor'"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="icon" href="/logo.png" />
      </head>
      <body
        className={`${orbitron.variable} antialiased bg-black`}
      >
        <ApolloGraphQLProvider>
          <StarknetProvider>
            <Suspense>
              <DisclaimerModal />
              <Header />
              {children}
            </Suspense>
          </StarknetProvider>
        </ApolloGraphQLProvider>
      </body>
    </html>
  );
}