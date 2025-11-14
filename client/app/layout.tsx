"use client";
import { Orbitron } from "next/font/google";
import "./globals.css";
import Header from "./components/header";
import { StarknetProvider } from "./providers/starknet-provider";

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
          content="Loot Auction is a platform for buying and selling monsters from the game 'Loot survivor'"
        />
        <link rel="icon" href="/logo.png" />
      </head>
      <body
        className={`${orbitron.variable} antialiased`}
      >
        <StarknetProvider>
          <>
            <Header />
            {children}
          </>
        </StarknetProvider>
      </body>
    </html>
  );
}