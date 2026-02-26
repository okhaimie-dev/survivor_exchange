"use client";

import BidAuctionMyListings from "./components/bid-auction-my-listings";
import { Footer } from "./components/layout";
import BeastUrlHandler from "./components/beast-url-handler";
import { useAccount } from "@starknet-react/core";
import { useMyNFTs, useAuctions, useMyListings } from "./hooks";
import { useSearchParams } from "next/navigation";

export default function Home() {
  const { address } = useAccount();
  const searchParams = useSearchParams();
  const walletParam = searchParams.get('wallet');
  const effectiveAddress = walletParam ?? address ?? undefined;
  const { nfts, loading, error } = useMyNFTs({ address: effectiveAddress });
  const {
    auctions,
    allAuctions,
    loading: auctionsLoading,
    error: auctionsError,
    currentPage,
    totalPages,
    setCurrentPage,
    getAuctionItems,
    refetch: refetchAuctions,
  } = useAuctions();
  const {
    listings,
    loading: listingsLoading,
    error: listingsError,
    refetch: refetchListings,
  } = useMyListings({ seller: effectiveAddress ?? undefined });
  const token = searchParams.get('auction');

  return (
    <div className="flex min-h-screen flex-col items-center justify-center font-sans bg-black overflow-x-hidden">
      {/* Handle ?beast=tokenId URL parameter */}
      <BeastUrlHandler />
      <div className="flex flex-1 flex-col items-center w-full gap-2">
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
          refetchAuctions={refetchAuctions}
          listings={listings}
          listingsLoading={listingsLoading}
          listingsError={listingsError}
          refetchListings={refetchListings}
          token={token}
          walletOverride={walletParam ?? undefined}
        />
        <Footer />
      </div>
    </div>
  );
}
