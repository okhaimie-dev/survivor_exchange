"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FormattedNFT } from "../../lib/types";
import { getAdventurerImageUrl } from "../../lib/utils";
import { normalizeTokenId } from "../../lib/utils/normalization";
import { calculateAdventurerRating } from "../../lib/utils/adventurer-rating";
import { ReservePriceDisplay } from "../ui";
import { useAdventurerAttributesOptional, mergeAttributesForToken } from "../../providers/adventurer-attributes-provider";

type AdventurerCardProps = {
  nft: FormattedNFT;
  selected: boolean;
  onToggle: () => void;
  onInfoClick?: () => void;
  price?: number;
  reserveTokenSymbol?: string;
  auctionName?: string;
  /** When true, show a "Listed" tag (e.g. in sell grid). */
  listed?: boolean;
  /** When true, show a "Battle" tag (adventurer in battle). */
  inBattle?: boolean;
  /** When true, use priority loading for LCP (e.g. first card above the fold). */
  priority?: boolean;
  /** When listed: "Buy" = clickable label that opens buy modal (Buy tab); "Price" = static label (Sell tab, My Listings). */
  priceLabel?: "Buy" | "Price";
};

interface MetadataAttribute {
  trait_type: string;
  value: string | number;
}

// Client-side cache for fetched attributes
const cardAttributesCache = new Map<string, MetadataAttribute[]>();

export default function AdventurerCard({
  nft,
  selected,
  onToggle,
  onInfoClick,
  price,
  reserveTokenSymbol,
  auctionName,
  listed,
  inBattle,
  priority,
  priceLabel = "Buy",
}: AdventurerCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [fetchedAttributes, setFetchedAttributes] = useState<MetadataAttribute[]>([]);
  const cardRef = useRef<HTMLElement>(null);
  const adventurerAttrs = useAdventurerAttributesOptional();
  const mergeAttributesFromContext = adventurerAttrs?.mergeAttributes;
  const attributesByTokenId = adventurerAttrs?.attributesByTokenId ?? {};

  // Parse token ID
  const tokenIdNum = nft.tokenId.startsWith("0x")
    ? parseInt(nft.tokenId, 16)
    : parseInt(nft.tokenId, 10);

  // Token-specific provider attrs so effect only re-runs when THIS token's data changes (avoids max update depth)
  const providerAttrsForToken =
    attributesByTokenId[String(tokenIdNum)] ??
    attributesByTokenId[nft.tokenId] ??
    (tokenIdNum ? attributesByTokenId[normalizeTokenId(String(tokenIdNum))] : undefined);

  // Use provider cache first (from batch fetch), then card cache, then single-token API only if missing
  useEffect(() => {
    const decimal = String(tokenIdNum);
    const normalized = decimal ? normalizeTokenId(decimal) : "";
    const providerAttrs =
      attributesByTokenId[decimal] ??
      attributesByTokenId[nft.tokenId] ??
      (normalized ? attributesByTokenId[normalized] : undefined);
    if (providerAttrs?.length) {
      setFetchedAttributes(providerAttrs as MetadataAttribute[]);
      return;
    }

    const cached = cardAttributesCache.get(nft.tokenId);
    if (cached) {
      const hasValidCached = cached.some(attr => {
        const isCritical = ['Health', 'Gold', 'Level', 'XP', 'Score'].includes(attr.trait_type);
        if (!isCritical) return false;
        const value = String(attr.value);
        return value && value !== "0" && value !== "0x0" && value !== "";
      });
      if (hasValidCached) {
        setFetchedAttributes(cached);
        return;
      }
      cardAttributesCache.delete(nft.tokenId);
    }

    const fetchAttributes = async () => {
      try {
        const response = await fetch(`/api/adventurer-attributes/${tokenIdNum}`);
        if (response.ok) {
          const data = await response.json();
          if (data.attributes && Array.isArray(data.attributes) && data.attributes.length > 0) {
            const attrs = data.attributes.map((a: { trait_type: string; value: string | number }) => ({
              trait_type: a.trait_type,
              value: String(a.value ?? ""),
            }));
            cardAttributesCache.set(nft.tokenId, data.attributes);
            setFetchedAttributes(data.attributes);
            mergeAttributesFromContext?.(mergeAttributesForToken(attrs, tokenIdNum));
          }
        }
      } catch {
        // Use NFT fallback; no need to log for expected failures
      }
    };

    fetchAttributes();
    // Depend only on token-specific provider data so we don't re-run on every provider update (avoids max update depth)
  }, [nft.tokenId, tokenIdNum, providerAttrsForToken, mergeAttributesFromContext]);

  // Use useMemo to recalculate when fetchedAttributes change
  const adventurerData = useMemo(() => {
    const getAttribute = (traitType: string) => {
      // First try fetched attributes
      if (fetchedAttributes.length > 0) {
        let attr = fetchedAttributes.find((a) => a.trait_type === traitType);
        if (attr) return String(attr.value);
        // Try case-insensitive
        attr = fetchedAttributes.find((a) => (a.trait_type?.toLowerCase() ?? "") === traitType.toLowerCase());
        if (attr) return String(attr.value);
      }
      // Fall back to NFT attributes
      if (nft.attributes && nft.attributes.length > 0) {
        let attr = nft.attributes.find((a) => a.trait_type === traitType);
        if (attr) {
          const value = String(attr.value);
          // Don't use "0" values from NFT - prefer to fetch
          if (value === "0" || value === "0x0" || value === "") {
            return undefined;
          }
          return value;
        }
        // Try case-insensitive
        attr = nft.attributes.find((a) => (a.trait_type?.toLowerCase() ?? "") === traitType.toLowerCase());
        if (attr) {
          const value = String(attr.value);
          // Don't use "0" values from NFT - prefer to fetch
          if (value === "0" || value === "0x0" || value === "") {
            return undefined;
          }
          return value;
        }
      }
      return undefined;
    };

    const playerName = getAttribute("Player Name") || nft.metadataName || "Unknown";
    const xp = getAttribute("XP") || getAttribute("Score");
    const level = getAttribute("Level");
    // Don't use nft.health if it's "0" - prefer fetched attributes
    const health = getAttribute("Health") || (nft.health && nft.health !== "0" ? nft.health : undefined);
    const gold = getAttribute("Gold") || getAttribute("gold");
    const gameName = getAttribute("Game Name") || "Death Mountain";
    const gameOver = getAttribute("Game Over") === "True" || getAttribute("Game Over") === "true";

    // Calculate level from XP if not provided
    const displayLevel = level || (xp ? Math.floor(Math.sqrt(parseInt(xp || "0") || 0)).toString() : undefined);

    // Score (adventurer rating) from stats + gear; use fetched or NFT attributes
    const attrsForScore = fetchedAttributes.length > 0 ? fetchedAttributes : (nft.attributes ?? []);
    const score = attrsForScore.length > 0 ? calculateAdventurerRating(attrsForScore) : null;

    return {
      playerName,
      xp,
      level,
      displayLevel,
      health,
      gold,
      gameName,
      gameOver,
      score,
    };
  }, [fetchedAttributes, nft, tokenIdNum]);

  const { playerName, xp, level, displayLevel, health, gold, gameName, gameOver, score } = adventurerData;
  const tokenIdDisplay = `${tokenIdNum}`;

  // Generate static image URL directly - no API call needed
  const imageSrc = getAdventurerImageUrl(tokenIdNum);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: "100px", threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleCardClick = () => {
    if (onInfoClick) onInfoClick();
    else onToggle();
  };

  return (
    <article
      ref={cardRef}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={handleCardClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleCardClick();
        }
      }}
      className={`group relative flex h-full w-full min-h-[320px] flex-col gap-2 md:gap-4 overflow-hidden rounded-xl md:rounded-2xl border bg-black/70 backdrop-blur-sm p-3 md:p-4 transition-all duration-200 hover:-translate-y-0.5 hover:cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(50,255,52)]/70 ${
        selected
          ? "border-[rgb(50,255,52)] shadow-[0_0_20px_rgba(50,255,52,0.3)]"
          : "border-[rgb(50,255,52)]/15 hover:border-[rgb(50,255,52)]/40 hover:bg-black/80"
      }`}
    >
      {(listed || gameOver || inBattle) && (
        <div className="absolute top-2 left-2 z-20 flex flex-col gap-1">
          {listed && (
            <span className="rounded border border-[rgb(50,255,52)]/60 bg-black/80 px-2 py-0.5 text-[9px] font-orbitron uppercase tracking-wider text-[rgb(50,255,52)]">
              Listed
            </span>
          )}
          {gameOver && (
            <span className="rounded-full bg-red-500/20 border border-red-500/50 px-2 py-0.5 text-[8px] font-orbitron uppercase text-red-400">
              Dead
            </span>
          )}
          {inBattle && (
            <span className="rounded border border-amber-500/60 bg-black/80 px-2 py-0.5 text-[9px] font-orbitron uppercase tracking-wider text-amber-400">
              Battle
            </span>
          )}
        </div>
      )}
      {/* Small select checkbox top-right: click toggles selection only */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className="absolute top-2 right-2 z-20 w-5 h-5 flex items-center justify-center rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(50,255,52)]/70"
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

      {/* Main content: Image (no header / adventurer number in grid) */}
      <div className="flex flex-col items-center gap-2 text-white flex-1">
        {/* Image container */}
        <div className="relative flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-lg overflow-hidden">
          {isVisible && !imageError ? (
            <Image
              src={imageSrc}
              alt={playerName}
              width={96}
              height={96}
              draggable={false}
              className="h-full w-full object-contain"
              unoptimized
              priority={priority}
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
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="m22 8-4 4" />
              <path d="m18 8 4 4" />
            </svg>
          )}
          {/* Info button */}
          {onInfoClick && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onInfoClick();
              }}
              className="absolute bottom-0 right-0 z-20 w-5 h-5 rounded-full bg-black/70 border border-white/30 flex items-center justify-center text-white/80 hover:text-white hover:bg-black/90 hover:border-white/50 transition-all"
              title="View details"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-3 h-3"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
            </button>
          )}
        </div>

        {/* Adventurer number below image */}
        <h3 className="text-sm font-orbitron uppercase tracking-wide leading-tight text-center line-clamp-1 text-white">
          {tokenIdDisplay}
        </h3>
      </div>

      {/* Stats Grid: Level, Health, Gold, Score - fixed min-height so all cards align */}
      <div className="grid grid-cols-2 gap-1.5 mt-auto flex-1 min-h-[72px] min-w-0">
        <div className="flex flex-col items-center justify-center p-1.5 rounded-md bg-white/5 border border-white/10">
          <span className="text-base font-orbitron font-bold text-white">
            {displayLevel !== undefined ? displayLevel : "—"}
          </span>
          <span className="text-[8px] uppercase text-[rgb(186,255,188)]/50">Level</span>
        </div>
        <div className="flex flex-col items-center justify-center p-1.5 rounded-md bg-white/5 border border-white/10">
          <span className="text-base font-orbitron font-bold text-red-400">
            {health !== undefined ? parseInt(health || "0").toLocaleString() : "—"}
          </span>
          <span className="text-[8px] uppercase text-[rgb(186,255,188)]/50">Health</span>
        </div>
        <div className="flex flex-col items-center justify-center p-1.5 rounded-md bg-white/5 border border-white/10">
          <span className="text-base font-orbitron font-bold text-yellow-400">
            {gold !== undefined ? parseInt(gold || "0").toLocaleString() : "—"}
          </span>
          <span className="text-[8px] uppercase text-[rgb(186,255,188)]/50">Gold</span>
        </div>
        <div className="flex flex-col items-center justify-center p-1.5 rounded-md bg-white/5 border border-white/10">
          <span className="text-base font-orbitron font-bold text-blue-400">
            {score != null ? score.toFixed(2) : "—"}
          </span>
          <span className="text-[8px] uppercase text-[rgb(186,255,188)]/50">Score</span>
        </div>
      </div>

      {/* Footer: Buy (price) when listed in Buy tab, Price (static) in Sell/My Listings; Sell button when not listed */}
      <div className="shrink-0 mt-auto border-t border-[rgb(50,255,52)]/20 h-[60px] flex flex-col justify-center">
        {price !== undefined ? (
          priceLabel === "Price" ? (
            <div className="flex flex-col items-center justify-center">
              <span className="text-[10px] uppercase text-[rgb(186,255,188)]/70">Price</span>
              <span className="text-sm font-orbitron font-bold text-[rgb(50,255,52)] whitespace-nowrap">
                <ReservePriceDisplay value={price} symbol={reserveTokenSymbol} symbolClassName="text-[0.9em] opacity-90" />
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onInfoClick) onInfoClick();
              }}
              className="flex flex-col items-center justify-center w-full h-full rounded-b-xl md:rounded-b-2xl text-[rgb(50,255,52)] hover:bg-[rgb(50,255,52)]/10 transition font-orbitron cursor-pointer"
              title="Open buy modal"
            >
              <span className="text-[10px] uppercase text-[rgb(186,255,188)]/70">Buy</span>
              <span className="text-sm font-orbitron font-bold whitespace-nowrap">
                <ReservePriceDisplay value={price} symbol={reserveTokenSymbol} symbolClassName="text-[0.9em] opacity-90" />
              </span>
            </button>
          )
        ) : onInfoClick ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onInfoClick();
            }}
            className="flex flex-col items-center justify-center w-full h-full rounded-b-xl md:rounded-b-2xl text-[rgb(50,255,52)] hover:bg-[rgb(50,255,52)]/10 transition font-orbitron uppercase text-xs tracking-wider"
            title="List for auction"
          >
            Sell
          </button>
        ) : null}
      </div>
    </article>
  );
}
