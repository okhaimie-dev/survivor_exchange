"use client";

import BidAuctionMyListings from "./components/bid-auction-my-listings";
import Footer from "./components/footer";
import Hero from "./components/hero";
import BeastUrlHandler from "./components/beast-url-handler";
import { useAccount } from "@starknet-react/core";
import { useMyNFTs } from "./hooks/use-my-nfts";
import { useAuctions } from "./hooks/use-auctions";
import { useMyListings } from "./hooks/use-my-listings";
import { useSearchParams } from "next/navigation";

export default function Home() {
  const { address } = useAccount();
  const { nfts, loading, error } = useMyNFTs({ address });
  const { 
    auctions, 
    allAuctions,
    loading: auctionsLoading, 
    error: auctionsError,
    currentPage,
    totalPages,
    setCurrentPage,
    getAuctionItems
  } = useAuctions();
  const { 
    listings, 
    loading: listingsLoading, 
    error: listingsError 
  } = useMyListings({ seller: address || undefined });
  const searchParams = useSearchParams();
  const token = searchParams.get('auction');

  return (
    <div className="flex min-h-screen flex-col items-center justify-center font-sans bg-black overflow-x-hidden">
      {/* Handle ?beast=tokenId URL parameter */}
      <BeastUrlHandler />
      <div className="flex flex-col items-center justify-center gap-4 w-full h-full">
        <Hero />
        <BidAuctionMyListings 
          nfts={nfts} 
          loading={loading} 
          error={error}
          auctions={auctions}
          allAuctions={allAuctions}
          auctionsLoading={auctionsLoading}
          auctionsError={auctionsError || null}
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
          getAuctionItems={getAuctionItems}
          listings={listings}
          listingsLoading={listingsLoading}
          listingsError={listingsError}
          token={token}
        />
        <Footer />
      </div>
    </div>
  );
}
