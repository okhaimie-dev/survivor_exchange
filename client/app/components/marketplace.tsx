"use client";

import { useState, useMemo, useCallback } from "react";
import Image from "next/image";
import { useAccount } from "@starknet-react/core";
import { CollectionSelector, Pagination, ReservePriceDisplay } from "./ui";
import { BidsSkeleton } from "./skeletons";
import { useMarketplaceListings, type MarketplaceListing } from "../hooks/data/use-marketplace-listings";
import { useMarketplaceBuy } from "../hooks/auction/use-marketplace-buy";
import { useWalletModal } from "../providers/wallet-modal-provider";
import { type CollectionType, GRID_PAGE_SIZE } from "../lib/constants";

export default function Marketplace() {
  const { address, account } = useAccount();
  const { openWalletModal } = useWalletModal();
  const [selectedCollection, setSelectedCollection] = useState<CollectionType>("beasts");
  const [currentPage, setCurrentPage] = useState(1);

  const { listings, loading, error, refresh } = useMarketplaceListings(selectedCollection);
  const { buyListing, isBuying } = useMarketplaceBuy();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [refresh]);

  const handleCollectionChange = useCallback((collection: CollectionType) => {
    setSelectedCollection(collection);
    setCurrentPage(1);
  }, []);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(listings.length / GRID_PAGE_SIZE)),
    [listings.length],
  );

  const visibleListings = useMemo(() => {
    const start = (currentPage - 1) * GRID_PAGE_SIZE;
    return listings.slice(start, start + GRID_PAGE_SIZE);
  }, [listings, currentPage]);

  const handleBuy = useCallback(
    async (listing: MarketplaceListing) => {
      if (!account || !address) {
        openWalletModal();
        return;
      }
      await buyListing({
        orderId: listing.orderId,
        rawPrice: listing.rawPrice,
        currency: listing.currency,
        collection: listing.collection,
        tokenId: listing.tokenId,
      });
    },
    [account, address, buyListing, openWalletModal],
  );

  const renderContent = () => {
    if (loading) return <BidsSkeleton />;

    if (error) {
      return (
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-center gap-4 px-4 py-12">
          <p className="text-red-400">Error loading listings: {error.message}</p>
        </div>
      );
    }

    if (listings.length === 0) {
      return (
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-center gap-4 px-4 py-12">
          <p className="text-[rgb(186,255,188)]/70">No marketplace listings found for this collection.</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col flex-1 min-h-0 w-full">
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 w-full">
            {visibleListings.map((listing) => (
              <ListingCard
                key={listing.orderId}
                listing={listing}
                onBuy={() => handleBuy(listing)}
                isBuying={isBuying}
              />
            ))}
          </div>
        </div>
        {totalPages > 1 && (
          <div className="flex justify-center py-4 mt-4 border-t border-white/10 shrink-0">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 min-h-[70vh]">
      <div className="flex gap-6 min-h-[60vh] min-w-0">
        <aside className="flex shrink-0 flex-col gap-2 w-[260px] min-w-[260px] min-h-[200px]">
          <CollectionSelector
            selectedCollection={selectedCollection}
            onCollectionChange={handleCollectionChange}
          />
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading || isRefreshing}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[rgb(50,255,52)]/40 bg-[rgb(50,255,52)]/10 px-4 py-2 text-xs font-orbitron uppercase tracking-[0.14em] text-[rgb(50,255,52)] transition hover:bg-[rgb(50,255,52)]/20 hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="Reload listings"
          >
            {loading || isRefreshing ? (
              <>
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[rgb(50,255,52)] border-t-transparent" />
                Refreshing...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                  <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                  <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                  <path d="M16 21h5v-5" />
                </svg>
                Refresh
              </>
            )}
          </button>
          <div className="mt-2 rounded-md border border-[rgb(50,255,52)]/20 bg-black/40 p-3">
            <p className="text-[10px] font-orbitron uppercase tracking-wider text-[rgb(186,255,188)]/60 mb-1">
              Arcade Orderbook
            </p>
            <p className="text-[10px] text-[rgb(186,255,188)]/40 leading-relaxed">
              Fixed-price listings from the shared Arcade marketplace. Listings here are also visible on Beast Dex and Cartridge Arcade.
            </p>
          </div>
        </aside>
        <div className="min-w-0 flex-1 flex flex-col min-h-0">{renderContent()}</div>
      </div>
    </div>
  );
}

function ListingCard({
  listing,
  onBuy,
  isBuying,
}: {
  listing: MarketplaceListing;
  onBuy: () => void;
  isBuying: boolean;
}) {
  const [imageError, setImageError] = useState(false);
  const isBeasts = listing.collectionType === "beasts";

  const displayName =
    listing.name ||
    (listing.metadata?.name ? String(listing.metadata.name) : `#${listing.tokenId}`);

  return (
    <article
      className="group relative flex h-full w-full flex-col overflow-hidden rounded-xl border border-[rgb(50,255,52)]/15 hover:border-[rgb(50,255,52)]/40 bg-black/70 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:cursor-pointer hover:bg-black/80"
    >
      {/* Image */}
      <div className="flex items-center justify-center p-3 pb-0">
        <div className="relative w-full aspect-square flex items-center justify-center rounded-lg overflow-hidden">
          {!imageError ? (
            <Image
              src={listing.image}
              alt={displayName}
              width={200}
              height={200}
              draggable={false}
              className="h-full w-full object-contain"
              unoptimized
              onError={() => setImageError(true)}
            />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-12 h-12 text-[rgb(50,255,52)]/40"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1 px-3 py-2">
        <h3 className="text-xs font-orbitron uppercase tracking-wide leading-tight text-center line-clamp-1 text-white">
          {isBeasts ? displayName : `#${listing.tokenId}`}
        </h3>
        <p className="text-[9px] text-center text-[rgb(186,255,188)]/40">
          {listing.owner.slice(0, 6)}...{listing.owner.slice(-4)}
        </p>
      </div>

      {/* Buy button with price */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onBuy();
        }}
        disabled={isBuying}
        className="mt-auto flex flex-col items-center justify-center w-full px-3 py-2.5 border-t border-[rgb(50,255,52)]/20 text-[rgb(50,255,52)] hover:bg-[rgb(50,255,52)]/10 transition font-orbitron cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        title="Buy this NFT"
      >
        <span className="text-[10px] uppercase text-[rgb(186,255,188)]/70">
          {isBuying ? "Buying..." : "Buy"}
        </span>
        <span className="text-xs font-orbitron font-bold truncate max-w-full">
          <ReservePriceDisplay
            value={listing.price}
            symbol={listing.currencySymbol}
            symbolClassName="text-[0.9em] opacity-90"
          />
        </span>
      </button>
    </article>
  );
}
