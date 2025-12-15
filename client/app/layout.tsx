"use client";
import { Orbitron, Inter } from "next/font/google";
import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
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
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 1024);
    };

    checkScreenSize();

    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  return (
    <html lang="en">
      <head>
        <title>Loot Auction</title>
        <meta
          name="description"
          content="Loot Auction is a platform for auctioning and bidding on monsters from the game 'Loot survivor'"
        />
        <link rel="icon" href="/logo.png" />
      </head>
      <body
        className={`${orbitron.variable} antialiased bg-black`}
      >
        {isSmallScreen ? (
          <div className="flex min-h-screen w-full flex-col items-center justify-center bg-black p-8">
            <div className="w-fit h-full flex items-center justify-center border-2 border-[rgb(50,255,52)]/20 rounded-2xl p-2">
                <Image src="/logo.png" alt="logo" width={500} height={500} draggable={false} className="w-[250px] h-[250px]" />
            </div>
            <p className="mt-8 text-center text-lg text-white">
              This app is not yet optimized for this screen size
            </p>
          </div>
        ) : (
          <ApolloGraphQLProvider>
            <StarknetProvider>
              <Suspense>
                <DisclaimerModal />
                <Header />
                {children}
              </Suspense>
            </StarknetProvider>
          </ApolloGraphQLProvider>
        )}
      </body>
    </html>
  );
}