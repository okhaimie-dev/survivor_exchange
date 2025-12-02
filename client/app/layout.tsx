"use client";
import { Orbitron } from "next/font/google";
import { useState, useEffect } from "react";
import Image from "next/image";
import "./globals.css";
import Header from "./components/header";
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
          content="Loot Auction is a platform for buying and selling monsters from the game 'Loot survivor'"
        />
        <link rel="icon" href="/logo.png" />
      </head>
      <body
        className={`${orbitron.variable} antialiased`}
      >
        {isSmallScreen ? (
          <div className="flex min-h-screen w-full flex-col items-center justify-center bg-black p-8">
            <Image 
              src="/logo.png" 
              alt="logo" 
              width={500} 
              height={400} 
              draggable={false} 
              className="w-[500px] h-[500px]" 
            />
            <p className="mt-8 text-center text-lg text-white">
              This app is not yet optimized for this screen size
            </p>
          </div>
        ) : (
          <ApolloGraphQLProvider>
            <StarknetProvider>
              <>
                <Header />
                {children}
              </>
            </StarknetProvider>
          </ApolloGraphQLProvider>
        )}
      </body>
    </html>
  );
}