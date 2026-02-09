"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { useAccount } from "@starknet-react/core";
import { Pagination, ReservePriceDisplay } from "./ui";
import { Filters, type FilterState } from "./filters";
import { BidsSkeleton } from "./skeletons";
import { useMarketplaceListings, type MarketplaceListing } from "../hooks/data/use-marketplace-listings";
import { useMarketplaceBuy, type MarketplaceBuyParams } from "../hooks/auction/use-marketplace-buy";
import { useWalletModal } from "../providers/wallet-modal-provider";
import { type CollectionType, GRID_PAGE_SIZE } from "../lib/constants";
import { getReservePriceParts } from "../lib/utils";

const MAX_SWEEP = 30;

const EMPTY_FILTERS: FilterState = {
  id: "", search: "", beast: "", type: "", tier: "",
  levelMin: "", levelMax: "", powerMin: "", powerMax: "", rankMin: "", rankMax: "",
  shiny: "", animated: "", priceSort: "low-high", tokenIdSort: "", levelSort: "", scoreSort: "",
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
  if (filters.beast) {
    const beast = getAttr(listing.metadata, "Beast");
    if (!beast || beast.toLowerCase() !== filters.beast.toLowerCase()) return false;
  }
  if (filters.type) {
    const type = getAttr(listing.metadata, "Type");
    if (!type || type.toLowerCase() !== filters.type.toLowerCase()) return false;
  }
  if (filters.tier) {
    const tier = getAttr(listing.metadata, "Tier");
    if (!tier || tier !== filters.tier) return false;
  }
  const level = Number(getAttr(listing.metadata, "Level") ?? 0);
  if (filters.levelMin && level < Number(filters.levelMin)) return false;
  if (filters.levelMax && level > Number(filters.levelMax)) return false;
  const power = Number(getAttr(listing.metadata, "Power") ?? 0);
  if (filters.powerMin && power < Number(filters.powerMin)) return false;
  if (filters.powerMax && power > Number(filters.powerMax)) return false;
  const rank = Number(getAttr(listing.metadata, "Rank") ?? 0);
  if (filters.rankMin && rank < Number(filters.rankMin)) return false;
  if (filters.rankMax && rank > Number(filters.rankMax)) return false;
  if (filters.shiny) {
    const shiny = getAttr(listing.metadata, "Shiny");
    const isShiny = shiny === "1" || shiny === "true";
    if (filters.shiny === "true" && !isShiny) return false;
    if (filters.shiny === "false" && isShiny) return false;
  }
  if (filters.animated) {
    const animated = getAttr(listing.metadata, "Animated");
    const isAnimated = animated === "1" || animated === "true";
    if (filters.animated === "true" && !isAnimated) return false;
    if (filters.animated === "false" && isAnimated) return false;
  }
  return true;
}

/** Sort listings by price */
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
  const [sweepOpen, setSweepOpen] = useState(false);
  const [sweepCount, setSweepCount] = useState(0);
  const [sweepCurrency, setSweepCurrency] = useState<string | null>(null);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try { await refresh(); } finally { setIsRefreshing(false); }
  }, [refresh]);

  const resetAll = useCallback(() => {
    setCurrentPage(1);
    setSelectedKeys([]);
    setFilters(EMPTY_FILTERS);
    setSweepOpen(false);
    setSweepCount(0);
    setSweepCurrency(null);
  }, []);

  const handleFiltersChange = useCallback((updates: FilterState | Partial<FilterState>) => {
    const u = updates as Record<string, unknown>;
    if (u && typeof u === "object" && "search" in u && "beast" in u && "type" in u) {
      setFilters(updates as FilterState);
    } else {
      setFilters((prev) => ({ ...prev, ...updates }));
    }
  }, []);

  // Clear selection when listings change
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
        : prev.length >= MAX_SWEEP ? prev : [...prev, key],
    );
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedKeys([]);
    setSweepCount(0);
  }, []);

  // Base filtered listings (before sort / currency scope)
  const baseFilteredListings = useMemo(() => {
    return listings.filter((l) => filterMarketplaceListing(l, filters));
  }, [listings, filters]);

  // Available currencies from filtered listings (for sweep currency picker)
  const currencyGroups = useMemo(() => {
    const groups = new Map<string, { count: number; floor: number }>();
    for (const l of baseFilteredListings) {
      const prev = groups.get(l.currencySymbol);
      if (!prev) {
        groups.set(l.currencySymbol, { count: 1, floor: l.price });
      } else {
        groups.set(l.currencySymbol, {
          count: prev.count + 1,
          floor: Math.min(prev.floor, l.price),
        });
      }
    }
    return groups;
  }, [baseFilteredListings]);

  // Apply sort — when sweep is active, show sweep-currency items first by price
  const filteredListings = useMemo(() => {
    if (sweepOpen && sweepCurrency) {
      return [...baseFilteredListings].sort((a, b) => {
        const aCurr = a.currencySymbol === sweepCurrency ? 0 : 1;
        const bCurr = b.currencySymbol === sweepCurrency ? 0 : 1;
        if (aCurr !== bCurr) return aCurr - bCurr;
        return a.price - b.price;
      });
    }
    return sortListings(baseFilteredListings, filters.priceSort);
  }, [baseFilteredListings, filters.priceSort, sweepOpen, sweepCurrency]);

  // Cheapest-first for sweep — scoped to selected currency
  const cheapestListings = useMemo(() => {
    const scoped = sweepCurrency
      ? baseFilteredListings.filter((l) => l.currencySymbol === sweepCurrency)
      : baseFilteredListings;
    return [...scoped].sort((a, b) => a.price - b.price);
  }, [baseFilteredListings, sweepCurrency]);

  // Floor price = cheapest filtered listing
  const floorPrice = useMemo(() => {
    if (cheapestListings.length === 0) return null;
    const cheapest = cheapestListings[0];
    return { price: cheapest.price, symbol: cheapest.currencySymbol };
  }, [cheapestListings]);

  const sweepMax = Math.min(MAX_SWEEP, cheapestListings.length);

  // When sweep count changes, auto-select the N cheapest
  useEffect(() => {
    if (sweepCount > 0) {
      const keys = cheapestListings.slice(0, sweepCount).map((l) => String(l.orderId));
      setSelectedKeys(keys);
    } else if (sweepOpen) {
      setSelectedKeys([]);
    }
  }, [sweepCount, cheapestListings, sweepOpen]);

  // Compute sweep total cost grouped by currency
  const sweepTotals = useMemo(() => {
    const totals = new Map<string, number>();
    for (const listing of cheapestListings.slice(0, sweepCount)) {
      const prev = totals.get(listing.currencySymbol) ?? 0;
      totals.set(listing.currencySymbol, prev + listing.price);
    }
    return totals;
  }, [cheapestListings, sweepCount]);

  // Auto-correct sweepCurrency if it becomes unavailable after filter change
  useEffect(() => {
    if (sweepOpen && sweepCurrency && !currencyGroups.has(sweepCurrency)) {
      let maxSym = "";
      let maxCount = 0;
      for (const [sym, { count }] of currencyGroups) {
        if (count > maxCount) { maxSym = sym; maxCount = count; }
      }
      setSweepCurrency(maxSym || null);
      setSweepCount(0);
    }
  }, [sweepOpen, sweepCurrency, currencyGroups]);

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
      if (!account || !address) { openWalletModal(); return; }
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
    if (!account || !address) { openWalletModal(); return; }
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
    setSweepCount(0);
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
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-2 sm:px-4 min-h-[70vh]">
      {/* Top toolbar row */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-6">
        {/* Mobile: filters */}
        <div className="md:hidden flex flex-col gap-2">
          <Filters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            collection={selectedCollection}
            compact
          />
        </div>
        {/* Collection toggle */}
        <div className="flex gap-1 rounded-full border border-[rgb(50,255,52)]/20 bg-black/50 p-0.5">
          {(["beasts", "adventurers"] as const).map((col) => (
            <button
              key={col}
              type="button"
              onClick={() => {
                if (col !== selectedCollection) {
                  setSelectedCollection(col);
                  resetAll();
                }
              }}
              className={`rounded-full px-3 sm:px-4 py-1.5 text-[10px] sm:text-xs font-orbitron uppercase tracking-[0.14em] transition hover:cursor-pointer ${
                selectedCollection === col
                  ? "bg-[rgb(50,255,52)]/20 text-[rgb(50,255,52)] border border-[rgb(50,255,52)]/40"
                  : "text-white/50 hover:text-white/70 border border-transparent"
              }`}
            >
              {col}
            </button>
          ))}
        </div>
        {/* Sweep + Clear + Refresh */}
        {!loading && !error && listings.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center justify-start md:justify-end md:ml-auto">
            {/* Price sort toggle */}
            <button
              type="button"
              onClick={() => {
                const next = filters.priceSort === "low-high" ? "high-low" : "low-high";
                handleFiltersChange({ priceSort: next });
              }}
              className="inline-flex items-center justify-center gap-1 rounded-full border border-[rgb(50,255,52)]/40 bg-[rgb(50,255,52)]/10 px-3 sm:px-4 py-1.5 text-[10px] sm:text-xs font-orbitron uppercase tracking-[0.14em] text-[rgb(50,255,52)] transition hover:bg-[rgb(50,255,52)]/20 hover:cursor-pointer"
            >
              <span>Price</span>
              <span className="text-sm leading-none">{filters.priceSort === "high-low" ? "↑" : "↓"}</span>
            </button>
            {/* Sweep toggle */}
            <button
              type="button"
              onClick={() => {
                if (sweepOpen) {
                  setSweepOpen(false);
                  setSweepCount(0);
                  setSelectedKeys([]);
                  setSweepCurrency(null);
                } else {
                  // Default to the currency with the most listings
                  let maxSym = "";
                  let maxCount = 0;
                  for (const [sym, { count }] of currencyGroups) {
                    if (count > maxCount) { maxSym = sym; maxCount = count; }
                  }
                  setSweepCurrency(maxSym || null);
                  setSweepOpen(true);
                }
              }}
              className={`inline-flex items-center justify-center gap-1.5 rounded-full border px-3 sm:px-4 py-1.5 text-[10px] sm:text-xs font-orbitron uppercase tracking-[0.14em] transition hover:cursor-pointer ${
                sweepOpen
                  ? "border-[rgb(50,255,52)] bg-[rgb(50,255,52)]/20 text-[rgb(50,255,52)]"
                  : "border-[rgb(50,255,52)]/40 bg-[rgb(50,255,52)]/10 text-[rgb(50,255,52)] hover:bg-[rgb(50,255,52)]/20"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              <span>Sweep</span>
              {floorPrice && (
                <span className="text-[rgb(186,255,188)]/60 font-normal ml-0.5">
                  from {floorPrice.price.toFixed(0)} {floorPrice.symbol}
                </span>
              )}
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
            {selectedKeys.length > 0 && !sweepOpen && (
              <span className="text-[10px] sm:text-xs text-[rgb(186,255,188)]/60 font-orbitron">
                {selectedKeys.length} selected
              </span>
            )}
          </div>
        )}
      </div>

      {/* Sweep panel — inline collapsible bar */}
      {sweepOpen && sweepMax > 0 && (
        <SweepPanel
          sweepCount={sweepCount}
          sweepMax={sweepMax}
          onSweepCountChange={setSweepCount}
          totals={sweepTotals}
          onSweep={handleBulkBuy}
          isBuying={isBuying}
          currencies={currencyGroups}
          selectedCurrency={sweepCurrency}
          onCurrencyChange={(currency: string) => {
            setSweepCurrency(currency);
            setSweepCount(0);
            setSelectedKeys([]);
          }}
        />
      )}

      {/* Main content row: Sidebar (desktop) + Cards grid */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-6 min-h-[60vh] min-w-0 md:items-start">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex shrink-0 flex-col gap-2 w-[260px] min-w-[260px] min-h-[200px]">
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

      {/* Fixed buy button — bottom-right (only when manually selecting, not during sweep) */}
      {selectedKeys.length > 0 && !sweepOpen && (
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
                  <ReservePriceDisplay value={total} symbol={symbol} symbolClassName="text-[0.9em] opacity-90" />
                </span>
              ))}
            </>
          )}
        </button>
      )}
    </div>
  );
}

/* ─── Sweep Panel ─────────────────────────────────────────────── */

function SweepPanel({
  sweepCount,
  sweepMax,
  onSweepCountChange,
  totals,
  onSweep,
  isBuying,
  currencies,
  selectedCurrency,
  onCurrencyChange,
}: {
  sweepCount: number;
  sweepMax: number;
  onSweepCountChange: (n: number) => void;
  totals: Map<string, number>;
  onSweep: () => void;
  isBuying: boolean;
  currencies: Map<string, { count: number; floor: number }>;
  selectedCurrency: string | null;
  onCurrencyChange: (currency: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseInt(e.target.value, 10);
      if (isNaN(val) || val < 0) { onSweepCountChange(0); return; }
      onSweepCountChange(Math.min(val, sweepMax));
    },
    [onSweepCountChange, sweepMax],
  );

  // Slider fill percentage for custom track
  const fillPct = sweepMax > 0 ? (sweepCount / sweepMax) * 100 : 0;

  return (
    <div className="rounded-xl border border-[rgb(50,255,52)]/30 bg-black/70 backdrop-blur-sm p-4 sm:p-5">
      {/* Currency selector chips */}
      {currencies.size > 1 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {Array.from(currencies.entries()).map(([symbol, { count }]) => (
            <button
              key={symbol}
              type="button"
              onClick={() => onCurrencyChange(symbol)}
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-orbitron uppercase tracking-wider transition hover:cursor-pointer ${
                selectedCurrency === symbol
                  ? "border-[rgb(50,255,52)] bg-[rgb(50,255,52)]/20 text-[rgb(50,255,52)]"
                  : "border-white/20 text-white/50 hover:border-white/40 hover:text-white/70"
              }`}
            >
              {symbol}
              <span className="text-[9px] opacity-60">({count})</span>
            </button>
          ))}
        </div>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
        {/* Slider + count */}
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-orbitron uppercase tracking-[0.14em] text-[rgb(186,255,188)]/70">
              Items to sweep
            </span>
            <div className="flex items-center gap-1.5">
              <input
                ref={inputRef}
                type="number"
                min={0}
                max={sweepMax}
                value={sweepCount}
                onChange={handleInputChange}
                className="w-12 sm:w-14 rounded-lg border border-[rgb(50,255,52)]/30 bg-black/80 px-2 py-1 text-center text-xs sm:text-sm font-orbitron text-white outline-none focus:border-[rgb(50,255,52)] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <span className="text-[10px] sm:text-xs text-[rgb(186,255,188)]/50 font-orbitron">
                / {sweepMax}
              </span>
            </div>
          </div>
          <div className="relative h-8 flex items-center">
            {/* Custom track background */}
            <div className="absolute inset-x-0 h-2 rounded-full bg-white/10" />
            {/* Filled portion */}
            <div
              className="absolute left-0 h-2 rounded-full bg-gradient-to-r from-[rgb(50,255,52)] to-[rgb(30,200,40)] transition-all duration-100"
              style={{ width: `${fillPct}%` }}
            />
            {/* Native range input */}
            <input
              type="range"
              min={0}
              max={sweepMax}
              value={sweepCount}
              onChange={(e) => onSweepCountChange(parseInt(e.target.value, 10))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            {/* Custom thumb */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-[rgb(50,255,52)] bg-black shadow-[0_0_10px_rgba(50,255,52,0.5)] pointer-events-none transition-all duration-100"
              style={{ left: `calc(${fillPct}% - 10px)` }}
            />
          </div>
        </div>

        {/* Total + Sweep button */}
        <div className="flex items-center gap-3 sm:gap-4 sm:min-w-[220px]">
          <div className="flex flex-col items-start min-w-0">
            {sweepCount > 0 ? (
              Array.from(totals.entries()).map(([symbol, total]) => (
                <div key={symbol} className="flex items-baseline gap-1.5">
                  <span className="text-lg sm:text-xl font-orbitron font-bold text-white tabular-nums">
                    {getReservePriceParts(total, symbol).amount}
                  </span>
                  <span className="text-[10px] sm:text-xs font-orbitron uppercase text-[rgb(186,255,188)]/50">
                    {symbol}
                  </span>
                </div>
              ))
            ) : (
              <span className="text-lg sm:text-xl font-orbitron font-bold text-white/30 tabular-nums">0.00</span>
            )}
            <span className="text-[9px] text-[rgb(186,255,188)]/40 font-orbitron uppercase tracking-wider">
              Total
            </span>
          </div>

          <button
            type="button"
            onClick={onSweep}
            disabled={isBuying || sweepCount === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[rgb(50,255,52)] bg-[rgb(50,255,52)]/15 px-4 sm:px-6 py-2.5 sm:py-3 font-orbitron text-xs sm:text-sm uppercase tracking-[0.14em] text-[rgb(50,255,52)] transition hover:bg-[rgb(50,255,52)]/25 hover:shadow-[0_0_20px_rgba(50,255,52,0.3)] hover:cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isBuying ? (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[rgb(50,255,52)] border-t-transparent" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            )}
            Sweep {sweepCount > 0 ? sweepCount : ""}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Listing Card ────────────────────────────────────────────── */

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
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
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
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 sm:w-12 sm:h-12 text-[rgb(50,255,52)]/40">
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

      {/* Buy button with price */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onBuy(); }}
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
