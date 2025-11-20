"use client";

import BidAuctionMyListings from "./components/bid-auction-my-listings";
import Footer from "./components/footer";
import Hero from "./components/hero";
import { useAccount } from "@starknet-react/core";
import { useMyNFTs } from "./hooks/use-my-nfts";

export default function Home() {
  const { address } = useAccount();
  const { nfts, loading, error } = useMyNFTs({ address });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center font-sans dark:bg-black"> 
      <div className="flex flex-col items-center justify-center gap-4 w-full h-full">
        <Hero />
        <BidAuctionMyListings nfts={nfts} loading={loading} error={error} />
        <Footer />
      </div>
    </div>
  );
}
