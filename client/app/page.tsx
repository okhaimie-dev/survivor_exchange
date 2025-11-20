"use client";

import BidAuctionMyListings from "./components/bid-auction-my-listings";
import Footer from "./components/footer";
import Hero from "./components/hero";
import { useAccount } from "@starknet-react/core";
import { useMyNFTs } from "./hooks/use-my-nfts";
import { useAuctions } from "./hooks/use-auctions";

export default function Home() {
  const { address } = useAccount();
  const { nfts, loading, error } = useMyNFTs({ address });
  const { 
    auctions, 
    loading: auctionsLoading, 
    error: auctionsError,
    currentPage,
    totalPages,
    setCurrentPage,
    getAuctionItems
  } = useAuctions();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center font-sans dark:bg-black"> 
      <div className="flex flex-col items-center justify-center gap-4 w-full h-full">
        <Hero />
        <BidAuctionMyListings 
          nfts={nfts} 
          loading={loading} 
          error={error}
          auctions={auctions}
          auctionsLoading={auctionsLoading}
          auctionsError={auctionsError}
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
          getAuctionItems={getAuctionItems}
        />
        <Footer />
      </div>
    </div>
  );
}
