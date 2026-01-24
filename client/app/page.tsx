"use client";

import { useMemo } from "react";
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

  // Calculate platform stats for social proof
  const platformStats = useMemo(() => {
    const activeAuctions = allAuctions?.filter(a => {
      const status = parseInt(a.status);
      return status === 2; // Active status
    }).length || 0;

    // Calculate total volume from settled auctions
    const totalVolume = allAuctions?.reduce((sum, auction) => {
      const status = parseInt(auction.status);
      if (status === 4) { // Settled
        const bidStr = auction.current_bid || "0";
        const bid = bidStr.startsWith("0x") || bidStr.startsWith("0X")
          ? parseInt(bidStr, 16)
          : parseFloat(bidStr);
        return sum + (bid / 1e6); // Convert from USDC decimals
      }
      return sum;
    }, 0) || 0;

    // Count total bids across all auctions
    const totalBids = allAuctions?.filter(a => {
      const bidStr = a.current_bid || "0";
      const bid = bidStr.startsWith("0x") || bidStr.startsWith("0X")
        ? parseInt(bidStr, 16)
        : parseFloat(bidStr);
      return bid > 0;
    }).length || 0;

    return { activeAuctions, totalVolume: Math.round(totalVolume), totalBids };
  }, [allAuctions]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center font-sans bg-black overflow-x-hidden">
      {/* Handle ?beast=tokenId URL parameter */}
      <BeastUrlHandler />
      <div className="flex flex-col items-center justify-center gap-4 w-full h-full">
        <Hero
          activeAuctions={platformStats.activeAuctions}
          totalVolume={platformStats.totalVolume}
          totalBids={platformStats.totalBids}
        />
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
