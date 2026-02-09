"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import Image from "next/image";
import { useAccount } from "@starknet-react/core";
import { CollectionSelector, Pagination, ReservePriceDisplay } from "./ui";
import { Filters, type FilterState } from "./filters";
import { BidsSkeleton } from "./skeletons";
import { useMarketplaceListings, type MarketplaceListing } from "../hooks/data/use-marketplace-listings";
import { useMarketplaceBuy, type MarketplaceBuyParams } from "../hooks/auction/use-marketplace-buy";
import { useWalletModal } from "../providers/wallet-modal-provider";
import { type CollectionType, GRID_PAGE_SIZE } from "../lib/constants";
import { getReservePriceParts } from "../lib/utils";

const MAX_CART_SELECTION = 20;

const EMPTY_FILTERS: FilterState = {
  id: "", search: "", beast: "", type: "", tier: "",
  levelMin: "", levelMax: "", powerMin: "", powerMax: "", rankMin: "", rankMax: "",
  shiny: "", animated: "", priceSort: "", tokenIdSort: "", levelSort: "", scoreSort: "",
  tierSort: "", powerSort: "", summitTop15: "", timeSort: "",
  healthMin: "", healthMax: "", strengthMin: "", strengthMax: "", dexterityMin: "", dexterityMax: "",
  vitalityMin: "", vitalityMax: "", intelligenceMin: "", intelligenceMax: "", wisdomMin: "", wisdomMax: "",
  charismaMin: "", charismaMax: "", battleFilter: "",
};

/** Extract a trait value from metadata attributes array */
function getAttr(metadata: Record<string, unknown> | null, traitType: string): string | undefined {
  if (!metadata) return undefined;
  const attrs = metadata.attributes;
  if (!Array.isArray(attrs)) return undefined;
  const attr = attrs.find(
    (a: Record<string, unknown>) => String(a.trait_type ?? "").toLowerCase() === traitType.toLowerCase(),
  );
  return attr ? String((attr as Record<string, unknown>).value) : undefined;
}

/** Apply FilterState to a MarketplaceListing using its metadata attributes */
function filterMarketplaceListing(listing: MarketplaceListing, filters: FilterState): boolean {
  // Search
  if (filters.search) {
    const q = filters.search.toLowerCase();
    const name = (listing.name || "").toLowerCase();
    const tokenId = String(listing.tokenId);
    const owner = listing.owner.toLowerCase();
    let matches = name.includes(q) || tokenId.includes(q) || owner.includes(q);
    if (!matches && listing.metadata) {
      const attrs = listing.metadata.attributes;
      if (Array.isArray(attrs)) {
        matches = attrs.some(
          (attr: Record<string, unknown>) => String(attr.value ?? "").toLowerCase().includes(q),
        );
      }
    }
    if (!matches) return false;
  }

  // Beast dropdown
  if (filters.beast) {
    const beast = getAttr(listing.metadata, "Beast");
    if (!beast || beast.toLowerCase() !== filters.beast.toLowerCase()) return false;
  }

  // Type dropdown
  if (filters.type) {
    const type = getAttr(listing.metadata, "Type");
    if (!type || type.toLowerCase() !== filters.type.toLowerCase()) return false;
  }

  // Tier dropdown
  if (filters.tier) {
    const tier = getAttr(listing.metadata, "Tier");
    if (!tier || tier !== filters.tier) return false;
  }

  // Level range
  const level = Number(getAttr(listing.metadata, "Level") ?? 0);
  if (filters.levelMin && level < Number(filters.levelMin)) return false;
  if (filters.levelMax && level > Number(filters.levelMax)) return false;

  // Power range
  const power = Number(getAttr(listing.metadata, "Power") ?? 0);
  if (filters.powerMin && power < Number(filters.powerMin)) return false;
  if (filters.powerMax && power > Number(filters.powerMax)) return false;

  // Rank range
  const rank = Number(getAttr(listing.metadata, "Rank") ?? 0);
  if (filters.rankMin && rank < Number(filters.rankMin)) return false;
  if (filters.rankMax && rank > Number(filters.rankMax)) return false;

  // Shiny
  if (filters.shiny) {
    const shiny = getAttr(listing.metadata, "Shiny");
    const isShiny = shiny === "1" || shiny === "true";
    if (filters.shiny === "true" && !isShiny) return false;
    if (filters.shiny === "false" && isShiny) return false;
  }

  // Animated
  if (filters.animated) {
    const animated = getAttr(listing.metadata, "Animated");
    const isAnimated = animated === "1" || animated === "true";
    if (filters.animated === "true" && !isAnimated) return false;
    if (filters.animated === "false" && isAnimated) return false;
  }

  return true;
}

/** Sort listings by price (uses priceSort from FilterState) */
function sortListings(items: MarketplaceListing[], priceSort: string): MarketplaceListing[] {
  if (!priceSort) return items;
  const sorted = [...items];
  sorted.sort((a, b) => priceSort === "low-high" ? a.price - b.price : b.price - a.price);
  return sorted;
}

export default function Marketplace() {
  const { address, account } = useAccount();
  const { openWalletModal } = useWalletModal();
  const [selectedCollection, setSelectedCollection] = useState<CollectionType>("beasts");
  const [currentPage, setCurrentPage] = useState(1);

  const { listings, loading, error, refresh } = useMarketplaceListings(selectedCollection);
  const { buyListing, bulkBuyListings, isBuying } = useMarketplaceBuy();

  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(true);

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
    setSelectedKeys([]);
    setFilters(EMPTY_FILTERS);
  }, []);

  const handleFiltersChange = useCallback((updates: FilterState | Partial<FilterState>) => {
    const u = updates as Record<string, unknown>;
    if (u && typeof u === "object" && "search" in u && "beast" in u && "type" in u) {
      // Full state replacement (e.g. clear all)
      setFilters(updates as FilterState);
    } else {
      setFilters((prev) => ({ ...prev, ...updates }));
    }
  }, []);

  // Clear selection when listings change (e.g. after refresh)
  useEffect(() => {
    setSelectedKeys((prev) => {
      if (prev.length === 0) return prev;
      const validIds = new Set(listings.map((l) => String(l.orderId)));
      const filtered = prev.filter((k) => validIds.has(k));
      return filtered.length === prev.length ? prev : filtered;
    });
  }, [listings]);

  const toggleSelection = useCallback((key: string) => {
    setSelectedKeys((prev) =>
      prev.includes(key)
        ? prev.filter((k) => k !== key)
        : prev.length >= MAX_CART_SELECTION
          ? prev
          : [...prev, key],
    );
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedKeys([]);
  }, []);

  // Apply filters + sort
  const filteredListings = useMemo(() => {
    const filtered = listings.filter((l) => filterMarketplaceListing(l, filters));
    return sortListings(filtered, filters.priceSort);
  }, [listings, filters]);

  const selectAll = useCallback(() => {
    const keys = filteredListings.slice(0, MAX_CART_SELECTION).map((l) => String(l.orderId));
    setSelectedKeys(keys);
  }, [filteredListings]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredListings.length / GRID_PAGE_SIZE)),
    [filteredListings.length],
  );

  const visibleListings = useMemo(() => {
    const start = (currentPage - 1) * GRID_PAGE_SIZE;
    return filteredListings.slice(start, start + GRID_PAGE_SIZE);
  }, [filteredListings, currentPage]);

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

  // Compute cart totals grouped by currency symbol
  const cartTotals = useMemo(() => {
    const selectedSet = new Set(selectedKeys);
    const totals = new Map<string, number>();
    for (const listing of listings) {
      if (selectedSet.has(String(listing.orderId))) {
        const prev = totals.get(listing.currencySymbol) ?? 0;
        totals.set(listing.currencySymbol, prev + listing.price);
      }
    }
    return totals;
  }, [selectedKeys, listings]);

  const handleBulkBuy = useCallback(async () => {
    if (!account || !address) {
      openWalletModal();
      return;
    }
    const selectedSet = new Set(selectedKeys);
    const params: MarketplaceBuyParams[] = listings
      .filter((l) => selectedSet.has(String(l.orderId)))
      .map((l) => ({
        orderId: l.orderId,
        rawPrice: l.rawPrice,
        currency: l.currency,
        collection: l.collection,
        tokenId: l.tokenId,
      }));

    if (params.length === 0) return;

    await bulkBuyListings(params);
    setSelectedKeys([]);
    await refresh();
  }, [account, address, selectedKeys, listings, bulkBuyListings, openWalletModal, refresh]);

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

    if (filteredListings.length === 0) {
      return (
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-center gap-4 px-4 py-12">
          <p className="text-[rgb(186,255,188)]/70">No listings match your filters. Try adjusting or clearing filters.</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col flex-1 min-h-0 w-full">
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6 w-full">
            {visibleListings.map((listing) => (
              <ListingCard
                key={listing.orderId}
                listing={listing}
                selected={selectedKeys.includes(String(listing.orderId))}
                onToggle={() => toggleSelection(String(listing.orderId))}
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
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-2 sm:px-4 min-h-[70vh]">
      {/* Mobile: collection selector + filters stacked; Desktop: label + toolbar in row */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-6">
        {/* Mobile collection selector + filters */}
        <div className="md:hidden flex flex-col gap-2">
          <CollectionSelector
            selectedCollection={selectedCollection}
            onCollectionChange={handleCollectionChange}
          />
          <Filters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            collection={selectedCollection}
            compact
          />
        </div>
        {/* Desktop: just the label (selector + filters are in sidebar) */}
        <span className="hidden md:block text-[11px] font-orbitron uppercase tracking-[0.16em] text-[rgb(186,255,188)]/70 shrink-0">
          Collection
        </span>
        {/* Selection toolbar + refresh */}
        {!loading && !error && listings.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center justify-start md:justify-end">
            <button
              type="button"
              onClick={selectAll}
              className="inline-flex items-center justify-center rounded-full border border-[rgb(50,255,52)]/40 bg-[rgb(50,255,52)]/10 px-3 sm:px-4 py-1.5 text-[10px] sm:text-xs font-orbitron uppercase tracking-[0.14em] text-[rgb(50,255,52)] transition hover:bg-[rgb(50,255,52)]/20 hover:cursor-pointer"
            >
              Select All ({MAX_CART_SELECTION} max)
            </button>
            <button
              type="button"
              onClick={clearSelection}
              disabled={selectedKeys.length === 0}
              className={`inline-flex items-center justify-center rounded-full border px-3 sm:px-4 py-1.5 text-[10px] sm:text-xs font-orbitron uppercase tracking-[0.14em] transition ${
                selectedKeys.length > 0
                  ? "border-white/40 text-white hover:border-[rgb(50,255,52)] hover:text-[rgb(50,255,52)] hover:cursor-pointer"
                  : "border-white/20 text-white/30"
              }`}
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading || isRefreshing}
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[rgb(50,255,52)]/40 bg-[rgb(50,255,52)]/10 px-3 sm:px-4 py-1.5 text-[10px] sm:text-xs font-orbitron uppercase tracking-[0.14em] text-[rgb(50,255,52)] transition hover:bg-[rgb(50,255,52)]/20 hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Reload listings"
            >
              {loading || isRefreshing ? (
                <>
                  <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[rgb(50,255,52)] border-t-transparent" />
                  <span className="hidden sm:inline">Refreshing...</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                    <path d="M16 21h5v-5" />
                  </svg>
                  <span className="hidden sm:inline">Refresh</span>
                </>
              )}
            </button>
            {selectedKeys.length > 0 && (
              <span className="text-[10px] sm:text-xs text-[rgb(186,255,188)]/60 font-orbitron">
                {selectedKeys.length} selected
              </span>
            )}
          </div>
        )}
      </div>

      {/* Main content row: Sidebar (desktop) + Cards grid */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-6 min-h-[60vh] min-w-0 md:items-start">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex shrink-0 flex-col gap-2 w-[260px] min-w-[260px] min-h-[200px]">
          <CollectionSelector
            selectedCollection={selectedCollection}
            onCollectionChange={handleCollectionChange}
          />
          <Filters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            collection={selectedCollection}
            isExpanded={filtersOpen}
            onToggleExpanded={setFiltersOpen}
            compact
          />
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

      {/* Fixed buy button — bottom-right */}
      {selectedKeys.length > 0 && (
        <button
          type="button"
          onClick={handleBulkBuy}
          disabled={isBuying}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex flex-col items-center justify-center rounded-xl border border-[rgb(50,255,52)] bg-black/90 backdrop-blur-md px-4 py-3 sm:px-6 sm:py-4 shadow-[0_0_30px_rgba(50,255,52,0.25)] transition hover:bg-[rgb(50,255,52)]/15 hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          title={`Buy ${selectedKeys.length} selected items`}
        >
          {isBuying ? (
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-[rgb(50,255,52)] border-t-transparent" />
          ) : (
            <>
              <span className="text-xs sm:text-sm font-orbitron uppercase tracking-[0.14em] text-[rgb(50,255,52)]">
                Buy
              </span>
              <span className="text-[10px] sm:text-xs font-orbitron text-[rgb(186,255,188)]/70 mt-0.5">
                {selectedKeys.length} item{selectedKeys.length !== 1 ? "s" : ""}
              </span>
              {Array.from(cartTotals.entries()).map(([symbol, total]) => (
                <span key={symbol} className="text-[9px] sm:text-[10px] font-orbitron font-bold text-[rgb(50,255,52)] mt-1">
                  <ReservePriceDisplay
                    value={total}
                    symbol={symbol}
                    symbolClassName="text-[0.9em] opacity-90"
                  />
                </span>
              ))}
            </>
          )}
        </button>
      )}
    </div>
  );
}

function ListingCard({
  listing,
  selected,
  onToggle,
  onBuy,
  isBuying,
}: {
  listing: MarketplaceListing;
  selected: boolean;
  onToggle: () => void;
  onBuy: () => void;
  isBuying: boolean;
}) {
  const [imageError, setImageError] = useState(false);
  const isBeasts = listing.collectionType === "beasts";

  // Resolve display name: prefer beast name from attributes, then metadata name, then tokenId
  const displayName = useMemo(() => {
    if (listing.metadata) {
      const attrs = listing.metadata.attributes;
      if (Array.isArray(attrs)) {
        const beastAttr = attrs.find(
          (a: Record<string, unknown>) =>
            String(a.trait_type ?? "").toLowerCase() === "beast",
        );
        if (beastAttr) return String(beastAttr.value);
      }
    }
    if (listing.name && !listing.name.startsWith("#")) return listing.name;
    if (listing.metadata?.name) return String(listing.metadata.name);
    return `#${listing.tokenId}`;
  }, [listing]);

  return (
    <article
      onClick={onToggle}
      className={`group relative flex h-full w-full flex-col overflow-hidden rounded-xl border bg-black/70 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:cursor-pointer hover:bg-black/80 ${
        selected
          ? "border-[rgb(50,255,52)] shadow-[0_0_20px_rgba(50,255,52,0.3)]"
          : "border-[rgb(50,255,52)]/15 hover:border-[rgb(50,255,52)]/40"
      }`}
    >
      {/* Selection checkbox */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className="absolute top-2 right-2 md:top-3 md:right-3 z-20 w-5 h-5 md:w-7 md:h-7 flex items-center justify-center rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(50,255,52)]/70"
        aria-pressed={selected}
        title={selected ? "Remove from selection" : "Add to selection"}
      >
        {selected ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full text-[rgb(50,255,52)]">
            <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full text-white/30 opacity-0 group-hover:opacity-100 transition-opacity">
            <rect x="3" y="3" width="18" height="18" rx="4" />
          </svg>
        )}
      </button>

      {/* Image */}
      <div className="flex items-center justify-center p-2 sm:p-3 pb-0">
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
              className="w-10 h-10 sm:w-12 sm:h-12 text-[rgb(50,255,52)]/40"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-0.5 sm:gap-1 px-2 sm:px-3 py-1.5 sm:py-2">
        <h3 className="text-[10px] sm:text-xs font-orbitron uppercase tracking-wide leading-tight text-center line-clamp-1 text-white">
          {isBeasts ? displayName : `#${listing.tokenId}`}
        </h3>
        <p className="text-[8px] sm:text-[9px] text-center text-[rgb(186,255,188)]/40">
          {listing.owner.slice(0, 6)}...{listing.owner.slice(-4)}
        </p>
      </div>

      {/* Buy button with price — matches auction card layout */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onBuy();
        }}
        disabled={isBuying}
        className="shrink-0 mt-auto border-t border-[rgb(50,255,52)]/20 h-[60px] flex flex-col items-center justify-center w-full rounded-b-xl text-[rgb(50,255,52)] hover:bg-[rgb(50,255,52)]/10 transition font-orbitron cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed px-2"
        title="Buy this NFT"
      >
        <span className="text-[10px] uppercase text-[rgb(186,255,188)]/70">
          {isBuying ? "Buying..." : "Buy"}
        </span>
        <span className="text-sm sm:text-base font-orbitron font-bold">
          {getReservePriceParts(listing.price, listing.currencySymbol).amount}
        </span>
        <span className="text-[9px] uppercase text-[rgb(186,255,188)]/50">
          {getReservePriceParts(listing.price, listing.currencySymbol).symbol}
        </span>
      </button>
    </article>
  );
}
