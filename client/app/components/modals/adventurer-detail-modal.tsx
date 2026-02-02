"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import type { FormattedNFT } from "../../lib/types";
import { AddressDisplay, CustomDropdown, InfoTooltip, CountdownTimer, ReservePriceDisplay, type DropdownOption } from "../ui";
import { formatUSDSmart, getAdventurerImageUrl } from "../../lib/utils";
import { copyAuctionLink } from "../../lib/utils/share-utils";
import { normalizeTokenId } from "../../lib/utils/normalization";
import { calculateAdventurerRating } from "../../lib/utils/adventurer-rating";
import { useAdventurerAttributesOptional } from "../../providers/adventurer-attributes-provider";

/** Auction bid data for displaying price info */
interface AuctionBidData {
  startingPrice: number; // Human-readable (already divided by token decimals)
  highestBid?: number;
  status: string;
  endTime: string;
  /** Token the reserve is in (e.g. USDC → $, STRK → symbol) */
  reserveTokenSymbol?: string;
  reserveTokenAddress?: string;
  isUserSeller: boolean;
  /** Seller address for "Owner" display (Buy context) */
  sellerAddress?: string;
  /** Subtitle (e.g. auction name) */
  auctionName?: string;
}

/** Bid state from parent component */
interface BidState {
  bidAmount: string;
  isSubmitting: boolean;
  isSubmittingOffer: boolean;
  hasActiveOffer: boolean;
  account: boolean; // whether user is connected
  paymentToken: string; // currently selected payment token address
  tokenSymbol: string; // symbol of selected token (e.g., "USDC", "ETH")
  insufficientFundsError?: string; // error message when user doesn't have enough funds
}

interface AdventurerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  nfts: FormattedNFT[];
  currentIndex: number;
  onNavigate: (index: number) => void;
  onSelect?: (tokenId: string) => void;
  isSelected?: boolean;
  /** When viewing adventurers in an auction context */
  auctionId?: string;
  /** Auction data for displaying bid info and enabling bid/offer actions */
  auctionBidData?: AuctionBidData;
  /** Current bid state from parent */
  bidState?: BidState;
  /** Token options for payment selector */
  tokenOptions?: DropdownOption[];
  /** Callback when bid amount changes */
  onBidAmountChange?: (amount: string) => void;
  /** Callback when payment token changes */
  onPaymentTokenChange?: (token: string) => void;
  /** Callback to place a bid */
  onPlaceBid?: () => void;
  /** Callback to make an offer */
  onMakeOffer?: () => void;
  /** Callback to open wallet modal */
  onOpenWallet?: () => void;
  /** When provided, renders direct sell form instead of Add/Remove for auction */
  sellFormContent?: React.ReactNode;
  /** When true, use same compact layout as Sell (stats, inventory, Level/XP/Score) but hide sell/bid section (e.g. My Listings view) */
  viewOnly?: boolean;
}

/** Metadata attribute from NFT metadata or Torii SQL */
interface MetadataAttribute {
  trait_type: string;
  value: string | number;
}

/** Adventurer attributes data from Torii SQL */
interface AdventurerAttributes {
  attributes: MetadataAttribute[];
}

// Client-side cache for fetched attributes
const attributesCache = new Map<string, MetadataAttribute[]>();

export default function AdventurerDetailModal({
  isOpen,
  onClose,
  nfts,
  currentIndex,
  onNavigate,
  onSelect,
  isSelected,
  auctionId,
  auctionBidData,
  bidState,
  tokenOptions,
  onBidAmountChange,
  onPaymentTokenChange,
  onPlaceBid,
  onMakeOffer,
  onOpenWallet,
  sellFormContent,
  viewOnly = false,
}: AdventurerDetailModalProps) {
  const currentNft = nfts[currentIndex];
  const [attributes, setAttributes] = useState<MetadataAttribute[]>([]);
  const [imageError, setImageError] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const attributesByTokenId = useAdventurerAttributesOptional()?.attributesByTokenId ?? {};

  // Parse token ID
  const tokenIdNum = currentNft?.tokenId.startsWith("0x")
    ? parseInt(currentNft.tokenId, 16)
    : parseInt(currentNft?.tokenId || "0", 10);

  // Generate static image URL directly - no API call needed
  const imageSrc = currentNft ? getAdventurerImageUrl(tokenIdNum) : '';

  // Reset image error when NFT changes
  useEffect(() => {
    setImageError(false);
  }, [currentNft?.tokenId]);

  // Use provider cache first (from batch fetch), then local cache, then single-token API only if missing
  useEffect(() => {
    if (!isOpen || !currentNft) {
      setAttributes([]);
      return;
    }

    const decimal = String(tokenIdNum);
    const normalized = decimal ? normalizeTokenId(decimal) : "";
    const providerAttrs =
      attributesByTokenId[decimal] ??
      attributesByTokenId[currentNft.tokenId] ??
      (normalized ? attributesByTokenId[normalized] : undefined);
    if (providerAttrs?.length) {
      setAttributes(providerAttrs as MetadataAttribute[]);
      return;
    }

    const cached = attributesCache.get(currentNft.tokenId);
    if (cached) {
      setAttributes(cached);
      return;
    }

    const fetchAttributes = async () => {
      try {
        const response = await fetch(`/api/adventurer-attributes/${tokenIdNum}`);
        if (response.ok) {
          const data = await response.json();
          if (data.attributes && Array.isArray(data.attributes) && data.attributes.length > 0) {
            attributesCache.set(currentNft.tokenId, data.attributes);
            setAttributes(data.attributes);
          } else {
            setAttributes([]);
          }
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error(`[Adventurer Modal] Failed to fetch attributes for token ${tokenIdNum}:`, response.status, errorData);
          setAttributes([]);
        }
      } catch (error) {
        console.error("Failed to fetch adventurer attributes:", error);
        setAttributes([]);
      }
    };

    fetchAttributes();
  }, [isOpen, currentNft, tokenIdNum, attributesByTokenId]);

  // Helper to get attribute from fetched data or NFT
  const getAttribute = useCallback((traitType: string): string | undefined => {
    // First try attributes from Torii SQL/Contract (most reliable source)
    if (attributes.length > 0) {
      // Try exact match first
      let attr = attributes.find((a) => a.trait_type === traitType);
      if (attr) return String(attr.value);
      
      // Try case-insensitive match
      attr = attributes.find((a) => (a.trait_type?.toLowerCase() ?? "") === traitType.toLowerCase());
      if (attr) return String(attr.value);
    }
    // Fall back to NFT attributes passed from parent
    if (currentNft?.attributes && currentNft.attributes.length > 0) {
      let nftAttr = currentNft.attributes.find((a) => a.trait_type === traitType);
      if (nftAttr) return String(nftAttr.value);
      
      // Try case-insensitive match
      nftAttr = currentNft.attributes.find((a) => (a.trait_type?.toLowerCase() ?? "") === traitType.toLowerCase());
      if (nftAttr) return String(nftAttr.value);
    }
    return undefined;
  }, [attributes, currentNft]);

  // Use useMemo to recalculate when attributes change
  const adventurerData = useMemo(() => {
    const playerName = getAttribute("Player Name") || currentNft?.metadataName || "Unknown";
    const xp = getAttribute("XP") || getAttribute("Score");
    const level = getAttribute("Level");
    const health = getAttribute("Health") || currentNft?.health;
    const gold = getAttribute("Gold") || getAttribute("gold");
    const gameName = getAttribute("Game Name") || "Death Mountain";
    const gameOver = getAttribute("Game Over") === "True" || getAttribute("Game Over") === "true";
    
    // Get additional attributes for details section
    const strength = getAttribute("Strength");
    const dexterity = getAttribute("Dexterity");
    const vitality = getAttribute("Vitality");
    const intelligence = getAttribute("Intelligence");
    const wisdom = getAttribute("Wisdom");
    const charisma = getAttribute("Charisma");
    const luck = getAttribute("Luck");
    const weapon = getAttribute("Weapon");
    const chest = getAttribute("Chest");
    const head = getAttribute("Head");
    const waist = getAttribute("Waist");
    const foot = getAttribute("Foot");
    const hand = getAttribute("Hand");
    const neck = getAttribute("Neck");
    const ring = getAttribute("Ring");
    const weaponXp = getAttribute("Weapon XP");
    const chestXp = getAttribute("Chest XP");
    const headXp = getAttribute("Head XP");
    const waistXp = getAttribute("Waist XP");
    const footXp = getAttribute("Foot XP");
    const handXp = getAttribute("Hand XP");
    const neckXp = getAttribute("Neck XP");
    const ringXp = getAttribute("Ring XP");

    // Debug log - show actual attribute values
    if (attributes.length > 0) {
      const healthAttr = attributes.find(a => a.trait_type === "Health");
      const goldAttr = attributes.find(a => a.trait_type === "Gold");
      const xpAttr = attributes.find(a => a.trait_type === "XP");
      const scoreAttr = attributes.find(a => a.trait_type === "Score");
      const levelAttr = attributes.find(a => a.trait_type === "Level");
      const weaponAttr = attributes.find(a => a.trait_type === "Weapon");
      const chestAttr = attributes.find(a => a.trait_type === "Chest");
      
      console.log(`[Adventurer Modal] Extracted values for token ${tokenIdNum}:`, {
        level,
        xp,
        health,
        gold,
        weapon,
        chest,
        attributesCount: attributes.length,
        rawAttributes: {
          health: healthAttr?.value,
          gold: goldAttr?.value,
          xp: xpAttr?.value,
          score: scoreAttr?.value,
          level: levelAttr?.value,
          weapon: weaponAttr?.value,
          chest: chestAttr?.value,
        }
      });
    }

    const attrsForScore = attributes.length > 0 ? attributes : (currentNft?.attributes ?? []);
    const score = attrsForScore.length > 0 ? calculateAdventurerRating(attrsForScore) : null;

    return {
      playerName,
      xp,
      level,
      health,
      gold,
      gameName,
      gameOver,
      score,
      strength,
      dexterity,
      vitality,
      intelligence,
      wisdom,
      charisma,
      luck,
      weapon,
      chest,
      head,
      waist,
      foot,
      hand,
      neck,
      ring,
      weaponXp,
      chestXp,
      headXp,
      waistXp,
      footXp,
      handXp,
      neckXp,
      ringXp,
    };
  }, [getAttribute, currentNft, attributes, tokenIdNum]);

  const { playerName, xp, level, health, gold, gameName, gameOver, score, strength, dexterity, vitality, intelligence, wisdom, charisma, luck, weapon, chest, head, waist, foot, hand, neck, ring, weaponXp, chestXp, headXp, waistXp, footXp, handXp, neckXp, ringXp } = adventurerData;

  // Reset link copied state when navigating or closing
  useEffect(() => {
    setLinkCopied(false);
  }, [currentIndex, isOpen]);

  // Clear link copied feedback after 3 seconds
  useEffect(() => {
    if (linkCopied) {
      const timer = setTimeout(() => setLinkCopied(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [linkCopied]);

  // Copy Link handler - copies auction link when in auction context
  const handleCopyLink = useCallback(async () => {
    if (!auctionId) return;
    const success = await copyAuctionLink(auctionId);
    setLinkCopied(success);
  }, [auctionId]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft" && currentIndex > 0) {
        onNavigate(currentIndex - 1);
      } else if (e.key === "ArrowRight" && currentIndex < nfts.length - 1) {
        onNavigate(currentIndex + 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentIndex, nfts.length, onClose, onNavigate]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) onNavigate(currentIndex - 1);
  }, [currentIndex, onNavigate]);

  const handleNext = useCallback(() => {
    if (currentIndex < nfts.length - 1) onNavigate(currentIndex + 1);
  }, [currentIndex, nfts.length, onNavigate]);

  // Mobile swipe gesture support
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const minSwipeDistance = 50;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const deltaX = touchEndX - touchStartX.current;
    const deltaY = touchEndY - touchStartY.current;

    // Only trigger swipe if horizontal movement is greater than vertical
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        handlePrev();
      } else {
        handleNext();
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  }, [handlePrev, handleNext]);

  if (!isOpen || !currentNft) return null;

  // Check if we're in an active auction context
  const isActiveAuction = auctionId && auctionBidData && bidState && parseInt(auctionBidData.status) === 2;
  // Use same compact layout as Sell (stats | inventory, Level/XP) when selling, buying (auction), or view-only (e.g. My Listings)
  const useCompactLayout = !!(sellFormContent || auctionBidData || viewOnly);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-h-[90vh] bg-black/95 border-2 border-[rgb(50,255,52)]/60 rounded-2xl shadow-[0_0_40px_rgba(50,255,52,0.2)] my-auto flex flex-col overflow-hidden ${
          useCompactLayout ? "max-w-4xl w-full" : "max-w-lg"
        }`}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {/* Header */}
        <div className={`flex flex-col md:flex-row md:items-center md:justify-between border-b border-[rgb(50,255,52)]/30 gap-2 md:gap-0 ${useCompactLayout ? "px-3 py-2 md:px-4 md:py-2" : "px-4 md:px-6 py-3 md:py-4"}`}>
          {/* Title row - with close button on mobile */}
          <div className="flex items-center justify-between md:justify-start gap-2 min-w-0">
            <div className="flex flex-col gap-0.5 min-w-0">
              <h2 className={`font-orbitron uppercase tracking-wider text-white flex items-center gap-2 flex-wrap ${useCompactLayout ? "text-sm md:text-base" : "text-base md:text-xl"}`}>
                Adventurer <span className="text-[rgb(186,255,188)]/80 font-normal">#{tokenIdNum}</span>
              </h2>
              {gameOver && (
                <p className="text-xs text-[rgb(186,255,188)]/70 font-orbitron truncate flex items-center gap-2 flex-wrap">
                  <span className="rounded bg-red-500/20 border border-red-500/50 px-1.5 py-0.5 text-[10px] font-orbitron uppercase text-red-400">
                    Dead
                  </span>
                </p>
              )}
              {auctionBidData?.auctionName && (
                <p className="text-xs text-[rgb(186,255,188)]/60 font-orbitron truncate">
                  Listing name: {auctionBidData.auctionName}
                </p>
              )}
              {auctionBidData?.sellerAddress != null && (
                <p className="text-xs text-[rgb(186,255,188)]/70 font-orbitron truncate">
                  Owner: <AddressDisplay address={auctionBidData.sellerAddress} className="text-[rgb(186,255,188)]/90" />
                </p>
              )}
            </div>
            {/* Right side on mobile: link + close together */}
            <div className="md:hidden flex items-center gap-2 shrink-0">
              {auctionId && (
                <button
                  onClick={handleCopyLink}
                  aria-label="Copy link to this auction"
                  title={linkCopied ? "Copied!" : "Copy Auction Link"}
                  className={`flex items-center justify-center rounded-lg border transition-all shrink-0 ${useCompactLayout ? "w-6 h-6" : "w-8 h-8"} ${
                    linkCopied
                      ? "border-green-500/60 bg-green-500/20 text-green-400"
                      : "border-[rgb(50,255,52)]/40 bg-[rgb(50,255,52)]/10 text-[rgb(50,255,52)] hover:bg-[rgb(50,255,52)]/20"
                  }`}
                >
                  {linkCopied ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                  )}
                </button>
              )}
              <button
                onClick={onClose}
                className={`flex items-center justify-center rounded-lg border border-[rgb(50,255,52)]/40 text-[rgb(50,255,52)] hover:bg-[rgb(50,255,52)]/20 transition-all shrink-0 ${useCompactLayout ? "w-6 h-6" : "w-8 h-8"}`}
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                  <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>

          {/* Navigation controls (centered on mobile when no nav; on desktop includes link + close on right) */}
          <div className="flex items-center justify-center md:justify-end gap-2 md:gap-4">
            {/* Navigation - only show when more than 1 item */}
            {nfts.length > 1 && (
              <div className="flex items-center gap-2 md:gap-3">
                {/* Prev button */}
                <button
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  title="Previous adventurer (← arrow key)"
                  className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full border-2 border-[rgb(50,255,52)]/60 bg-[rgb(50,255,52)]/10 text-[rgb(50,255,52)] hover:bg-[rgb(50,255,52)]/30 hover:border-[rgb(50,255,52)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 20 20" fill="none">
                    <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {/* Counter with swipe hint on mobile */}
                <div className="flex flex-col items-center">
                  <span className="text-xs md:text-sm text-white font-orbitron bg-[rgb(50,255,52)]/10 px-2 md:px-3 py-1 rounded-full border border-[rgb(50,255,52)]/30 whitespace-nowrap">
                    {currentIndex + 1} OF {nfts.length}
                  </span>
                  {/* Mobile swipe hint */}
                  <span className="text-[8px] text-[rgb(186,255,188)]/40 font-orbitron uppercase tracking-wider md:hidden mt-0.5">
                    Swipe to navigate
                  </span>
                </div>
                {/* Next button */}
                <button
                  onClick={handleNext}
                  disabled={currentIndex === nfts.length - 1}
                  title="Next adventurer (→ arrow key)"
                  className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full border-2 border-[rgb(50,255,52)]/60 bg-[rgb(50,255,52)]/10 text-[rgb(50,255,52)] hover:bg-[rgb(50,255,52)]/30 hover:border-[rgb(50,255,52)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 20 20" fill="none">
                    <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            )}
            {/* Copy Link button - desktop only (on mobile it's in header row next to close) */}
            {auctionId && (
              <button
                onClick={handleCopyLink}
                aria-label="Copy link to this auction"
                title={linkCopied ? "Copied!" : "Copy Auction Link"}
                className={`hidden md:flex w-8 h-8 items-center justify-center rounded-lg border transition-all shrink-0 ${
                  linkCopied
                    ? "border-green-500/60 bg-green-500/20 text-green-400"
                    : "border-[rgb(50,255,52)]/40 bg-[rgb(50,255,52)]/10 text-[rgb(50,255,52)] hover:bg-[rgb(50,255,52)]/20"
                }`}
              >
                {linkCopied ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                )}
              </button>
            )}
            {/* Close button - desktop only position */}
            <button
              onClick={onClose}
              className={`hidden md:flex items-center justify-center rounded-lg border border-[rgb(50,255,52)]/40 text-[rgb(50,255,52)] hover:bg-[rgb(50,255,52)]/20 transition-all shrink-0 ${useCompactLayout ? "w-6 h-6" : "w-8 h-8"}`}
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={`flex-1 min-h-0 overflow-y-auto ${useCompactLayout ? "flex flex-col gap-1 p-2.5 md:p-3" : `p-6 ${isActiveAuction ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "flex flex-col items-center gap-4"}`}`}>
          {useCompactLayout ? (
            /* Sell layout: compact, no image, stats | inventory, Level/XP, sell form - fit no scroll */
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 shrink-0">
                {/* Left: Stats */}
                <div className="flex flex-col gap-1 min-w-0 overflow-hidden">
                  <h4 className="text-[10px] font-orbitron uppercase tracking-wider text-[rgb(50,255,52)] border-b border-[rgb(50,255,52)]/30 pb-0.5 shrink-0">
                    Stats
                  </h4>
                  <div className="grid grid-cols-2 gap-1 overflow-hidden">
                    {[
                      { v: health, l: "HP", c: "text-red-400" },
                      { v: gold, l: "Gold", c: "text-yellow-400" },
                      { v: strength, l: "Str", c: "text-white" },
                      { v: dexterity, l: "Dex", c: "text-white" },
                      { v: vitality, l: "Vit", c: "text-white" },
                      { v: intelligence, l: "Int", c: "text-white" },
                      { v: wisdom, l: "Wis", c: "text-white" },
                      { v: charisma, l: "Cha", c: "text-white" },
                      { v: luck, l: "Luck", c: "text-white" },
                    ].map(({ v, l, c }) => (
                      <div key={l} className="flex items-baseline justify-between px-1.5 py-0.5 rounded bg-white/5 border border-white/10 gap-1">
                        <span className={`text-[10px] font-orbitron font-bold truncate ${c}`}>{v !== undefined && v !== null && v !== "" ? (l === "HP" || l === "Gold" ? parseInt(String(v)).toLocaleString() : String(v)) : "?"}</span>
                        <span className="text-[8px] uppercase text-[rgb(186,255,188)]/50 shrink-0">{l}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Right: Inventory */}
                <div className="flex flex-col gap-1 min-w-0 overflow-hidden">
                  <h4 className="text-[10px] font-orbitron uppercase tracking-wider text-[rgb(50,255,52)] border-b border-[rgb(50,255,52)]/30 pb-0.5 shrink-0">
                    Inventory
                  </h4>
                  <div className="grid grid-cols-2 gap-1 text-[9px] overflow-hidden">
                    {[
                      { label: "Weapon", value: weapon, xp: weaponXp },
                      { label: "Chest", value: chest, xp: chestXp },
                      { label: "Head", value: head, xp: headXp },
                      { label: "Waist", value: waist, xp: waistXp },
                      { label: "Foot", value: foot, xp: footXp },
                      { label: "Hand", value: hand, xp: handXp },
                      { label: "Neck", value: neck, xp: neckXp },
                      { label: "Ring", value: ring, xp: ringXp },
                    ].map(({ label, value, xp }) => (
                      <div key={label} className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 border border-white/10 min-w-0">
                        <span className="text-[rgb(186,255,188)]/50 shrink-0">{label}:</span>
                        <span className="text-white truncate">
                          {value || "—"}
                          {value && xp !== undefined && xp !== "" && (
                            <span className="text-[rgb(186,255,188)]/70"> · XP {xp}</span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Level / XP / Score - compact bar, smaller to avoid scroll */}
              <div className="flex items-center justify-center gap-3 md:gap-4 py-1 px-2.5 rounded-md bg-[rgb(50,255,52)]/10 border border-[rgb(50,255,52)]/30 shrink-0">
                <div className="flex flex-col items-center">
                  <span className="text-base font-orbitron font-bold text-white leading-tight">{level !== undefined ? level : "?"}</span>
                  <span className="text-[8px] uppercase tracking-wider text-[rgb(186,255,188)]/70">Level</span>
                </div>
                <div className="w-px h-5 bg-[rgb(50,255,52)]/40" />
                <div className="flex flex-col items-center">
                  <span className="text-base font-orbitron font-bold text-[rgb(50,255,52)] leading-tight">{xp !== undefined ? parseInt(xp || "0").toLocaleString() : "?"}</span>
                  <span className="text-[8px] uppercase tracking-wider text-[rgb(186,255,188)]/70">XP</span>
                </div>
                <div className="w-px h-5 bg-[rgb(50,255,52)]/40" />
                <div className="flex flex-col items-center">
                  <span className="text-base font-orbitron font-bold text-blue-400 leading-tight">{score != null ? score.toFixed(2) : "?"}</span>
                  <span className="text-[8px] uppercase tracking-wider text-[rgb(186,255,188)]/70">Score</span>
                </div>
              </div>
              {/* Sell form or Buy (bid/offer) at bottom - only show when we have sell or bid UI (hidden in viewOnly) */}
              {(sellFormContent || (auctionBidData && bidState)) && (
              <div className="pt-2 border-t-2 border-[rgb(50,255,52)]/40 rounded-lg bg-[rgb(50,255,52)]/8 px-2.5 py-2 shrink-0">
                {sellFormContent ? (
                  sellFormContent
                ) : auctionBidData && bidState ? (
                  /* Buy element: same structure as Sell but with bid/offer UI */
                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-lg border border-[rgb(50,255,52)]/35 bg-[rgb(50,255,52)]/10 px-3 py-2.5">
                        <p className="text-[10px] font-orbitron uppercase tracking-wider text-[rgb(186,255,188)]/70">Reserve Price (USD)</p>
                        <p className="text-base font-orbitron text-white">
                          <ReservePriceDisplay value={auctionBidData.startingPrice} symbol={auctionBidData.reserveTokenSymbol} symbolClassName="text-[0.9em] opacity-90" />
                        </p>
                      </div>
                      <div className={`rounded-lg border px-3 py-2.5 ${auctionBidData.highestBid && auctionBidData.highestBid > 0 ? "border-[rgb(50,255,52)]/50 bg-[rgb(50,255,52)]/15" : "border-white/30 bg-white/8"}`}>
                        <p className={`text-[10px] font-orbitron uppercase tracking-wider ${auctionBidData.highestBid && auctionBidData.highestBid > 0 ? "text-[rgb(50,255,52)]" : "text-[rgb(186,255,188)]/70"}`}>Highest Bid</p>
                        <p className={`text-base font-orbitron ${auctionBidData.highestBid && auctionBidData.highestBid > 0 ? "text-[rgb(50,255,52)]" : "text-white/60"}`}>
                          {auctionBidData.highestBid && auctionBidData.highestBid > 0 ? (
                            <ReservePriceDisplay value={auctionBidData.highestBid} symbol={auctionBidData.reserveTokenSymbol} symbolClassName="text-[0.9em] opacity-90" />
                          ) : "Be first!"}
                        </p>
                      </div>
                      <div className="rounded-lg border border-orange-500/40 bg-orange-500/15 px-3 py-2.5">
                        <p className="text-[10px] font-orbitron uppercase tracking-wider text-orange-400/90">Ends In</p>
                        <p className="text-base font-orbitron text-orange-400">
                          <CountdownTimer endTime={auctionBidData.endTime} status={auctionBidData.status} />
                        </p>
                      </div>
                    </div>
                    {!auctionBidData.isUserSeller && (
                      <>
                        {tokenOptions && tokenOptions.length > 0 && onPaymentTokenChange && (
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-orbitron uppercase tracking-wider text-[rgb(186,255,188)]/80">Pay With</label>
                            <CustomDropdown
                              id="adventurer-modal-payment-token"
                              value={bidState.paymentToken}
                              onChange={onPaymentTokenChange}
                              options={tokenOptions}
                              variant="green"
                              className="w-full"
                            />
                            {bidState.insufficientFundsError && <p className="text-[9px] text-red-400">{bidState.insufficientFundsError}</p>}
                          </div>
                        )}
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-orbitron uppercase tracking-wider text-[rgb(186,255,188)]/80">Your Bid ({bidState.tokenSymbol})</label>
                          <input
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            min="0"
                            placeholder="Enter amount..."
                            value={bidState.bidAmount}
                            onChange={(e) => onBidAmountChange?.(e.target.value)}
                            className="w-full rounded-lg border border-[rgb(50,255,52)]/50 bg-[rgb(50,255,52)]/8 px-3 py-2.5 text-sm font-orbitron text-white outline-none transition focus:border-[rgb(50,255,52)] focus:ring-1 focus:ring-[rgb(50,255,52)]/35 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={onPlaceBid}
                            disabled={!bidState.account || bidState.isSubmitting || !bidState.bidAmount || parseFloat(bidState.bidAmount) <= 0}
                            className={`flex-1 inline-flex items-center justify-center gap-1 rounded-full px-4 py-2.5 text-[11px] font-orbitron uppercase tracking-wider transition ${
                              bidState.account && !bidState.isSubmitting && bidState.bidAmount && parseFloat(bidState.bidAmount) > 0
                                ? "bg-[rgb(50,255,52)] text-black font-bold hover:cursor-pointer hover:bg-[rgb(40,220,42)]"
                                : "border border-white/12 text-[rgb(186,255,188)]/45 cursor-not-allowed"
                            }`}
                          >
                            {bidState.isSubmitting ? "..." : "Place Bid"}
                          </button>
                          {!bidState.hasActiveOffer && (
                            <button
                              type="button"
                              onClick={onMakeOffer}
                              disabled={!bidState.account || bidState.isSubmittingOffer || !bidState.bidAmount || parseFloat(bidState.bidAmount) <= 0}
                              className={`flex-1 inline-flex items-center justify-center gap-1 rounded-full px-4 py-2.5 text-[11px] font-orbitron uppercase tracking-wider transition ${
                                bidState.account && !bidState.isSubmittingOffer && bidState.bidAmount && parseFloat(bidState.bidAmount) > 0
                                  ? "border border-blue-500 bg-blue-500/10 text-blue-500 hover:cursor-pointer hover:bg-blue-500 hover:text-black"
                                  : "border border-white/12 text-[rgb(186,255,188)]/45 cursor-not-allowed"
                              }`}
                            >
                              {bidState.isSubmittingOffer ? "..." : "Make Offer"}
                            </button>
                          )}
                        </div>
                        {!bidState.account && onOpenWallet && (
                          <button type="button" onClick={onOpenWallet} className="text-[11px] text-center text-[rgb(50,255,52)]/90 font-orbitron hover:text-[rgb(50,255,52)] hover:underline cursor-pointer">
                            Connect wallet to place a bid →
                          </button>
                        )}
                      </>
                    )}
                    {auctionBidData.isUserSeller && (
                      <div className="text-center py-2.5 rounded-lg border border-yellow-500/45 bg-yellow-500/15">
                        <p className="text-[11px] font-orbitron text-yellow-400">You are the seller of this auction</p>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
              )}
            </>
          ) : (
            <>
          {/* Left column - Image and basic info (default / buy layout) */}
          <div className="flex flex-col items-center gap-4">
            {/* Image - Large and centered */}
            <div className="relative w-64 h-64 rounded-xl overflow-hidden flex items-center justify-center">
              {imageSrc && !imageError ? (
                <Image
                  src={imageSrc}
                  alt={playerName}
                  width={256}
                  height={256}
                  className="w-full h-full object-contain"
                  unoptimized
                  onError={() => setImageError(true)}
                />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  className="w-24 h-24 text-[rgb(50,255,52)]/30"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="m22 8-4 4" />
                  <path d="m18 8 4 4" />
                </svg>
              )}
            </div>

            {/* Level & XP & Score */}
            <div className="flex items-center justify-center gap-6 md:gap-8 py-2">
              <div className="flex flex-col items-center">
                <span className="text-3xl font-orbitron font-bold text-white">
                  {level !== undefined ? level : "?"}
                </span>
                <span className="text-sm uppercase tracking-wider text-[rgb(186,255,188)]/50">
                  Level
                </span>
              </div>
              <div className="w-px h-12 bg-[rgb(50,255,52)]/30" />
              <div className="flex flex-col items-center">
                <span className="text-3xl font-orbitron font-bold text-[rgb(50,255,52)]">
                  {xp !== undefined ? parseInt(xp || "0").toLocaleString() : "?"}
                </span>
                <span className="text-sm uppercase tracking-wider text-[rgb(186,255,188)]/50">
                  XP
                </span>
              </div>
              <div className="w-px h-12 bg-[rgb(50,255,52)]/30" />
              <div className="flex flex-col items-center">
                <span className="text-3xl font-orbitron font-bold text-blue-400">
                  {score != null ? score.toFixed(2) : "?"}
                </span>
                <span className="text-sm uppercase tracking-wider text-[rgb(186,255,188)]/50">
                  Score
                </span>
              </div>
            </div>

            {/* Adventurer Details Section */}
            <div className="w-full mt-4 space-y-3">
              <h4 className="text-sm font-orbitron uppercase tracking-wider text-[rgb(50,255,52)] text-center border-b border-[rgb(50,255,52)]/30 pb-2">
                Details
              </h4>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col p-2 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-lg font-orbitron font-bold text-red-400">
                    {health !== undefined ? parseInt(health || "0").toLocaleString() : "?"}
                  </span>
                  <span className="text-[9px] uppercase text-[rgb(186,255,188)]/50">Health</span>
                </div>
                <div className="flex flex-col p-2 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-lg font-orbitron font-bold text-yellow-400">
                    {gold !== undefined ? parseInt(gold || "0").toLocaleString() : "?"}
                  </span>
                  <span className="text-[9px] uppercase text-[rgb(186,255,188)]/50">Gold</span>
                </div>
                {/* Always show all stats, even if 0 */}
                <div className="flex flex-col p-2 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-base font-orbitron font-bold text-white">
                    {strength !== undefined ? strength : "?"}
                  </span>
                  <span className="text-[9px] uppercase text-[rgb(186,255,188)]/50">Strength</span>
                </div>
                <div className="flex flex-col p-2 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-base font-orbitron font-bold text-white">
                    {dexterity !== undefined ? dexterity : "?"}
                  </span>
                  <span className="text-[9px] uppercase text-[rgb(186,255,188)]/50">Dexterity</span>
                </div>
                <div className="flex flex-col p-2 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-base font-orbitron font-bold text-white">
                    {vitality !== undefined ? vitality : "?"}
                  </span>
                  <span className="text-[9px] uppercase text-[rgb(186,255,188)]/50">Vitality</span>
                </div>
                <div className="flex flex-col p-2 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-base font-orbitron font-bold text-white">
                    {intelligence !== undefined ? intelligence : "?"}
                  </span>
                  <span className="text-[9px] uppercase text-[rgb(186,255,188)]/50">Intelligence</span>
                </div>
                <div className="flex flex-col p-2 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-base font-orbitron font-bold text-white">
                    {wisdom !== undefined ? wisdom : "?"}
                  </span>
                  <span className="text-[9px] uppercase text-[rgb(186,255,188)]/50">Wisdom</span>
                </div>
                <div className="flex flex-col p-2 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-base font-orbitron font-bold text-white">
                    {charisma !== undefined ? charisma : "?"}
                  </span>
                  <span className="text-[9px] uppercase text-[rgb(186,255,188)]/50">Charisma</span>
                </div>
                <div className="flex flex-col p-2 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-base font-orbitron font-bold text-white">
                    {luck !== undefined ? luck : "?"}
                  </span>
                  <span className="text-[9px] uppercase text-[rgb(186,255,188)]/50">Luck</span>
                </div>
              </div>

              {/* Inventory Section - Always show if we have any equipment or if attributes are loaded */}
              {(weapon || chest || head || waist || foot || hand || neck || ring || attributes.length > 0) && (
                <div className="mt-4">
                  <h5 className="text-xs font-orbitron uppercase tracking-wider text-[rgb(50,255,52)]/70 mb-2">
                    Inventory
                  </h5>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { label: "Weapon", name: weapon, xp: weaponXp },
                      { label: "Chest", name: chest, xp: chestXp },
                      { label: "Head", name: head, xp: headXp },
                      { label: "Waist", name: waist, xp: waistXp },
                      { label: "Foot", name: foot, xp: footXp },
                      { label: "Hand", name: hand, xp: handXp },
                      { label: "Neck", name: neck, xp: neckXp },
                      { label: "Ring", name: ring, xp: ringXp },
                    ].map(({ label, name, xp }) => (
                      <div key={label} className="p-2 rounded-lg bg-white/5 border border-white/10">
                        <span className="text-[rgb(186,255,188)]/50">{label}:</span>
                        <span className="ml-2 text-white">{name || "None"}</span>
                        {name && xp !== undefined && xp !== "" && (
                          <span className="ml-1.5 text-[rgb(186,255,188)]/70">· XP {xp}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Direct sell form (Sell tab) or Select for Auction (legacy) - only in default layout, slightly more visible */}
            {onSelect && !isActiveAuction ? (
              <button
                type="button"
                onClick={() => onSelect(currentNft.tokenId)}
                className={`w-full inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-orbitron uppercase tracking-[0.14em] transition border-2 ${
                  isSelected
                    ? "border-[rgb(50,255,52)] bg-[rgb(50,255,52)]/25 text-[rgb(50,255,52)]"
                    : "border-[rgb(50,255,52)]/70 bg-[rgb(50,255,52)]/15 text-[rgb(50,255,52)] hover:bg-[rgb(50,255,52)]/25"
                }`}
              >
                {isSelected ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                    Selected
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="4" />
                      <path d="M12 8v8M8 12h8" />
                    </svg>
                    Select for Auction
                  </>
                )}
              </button>
            ) : null}
          </div>

          {/* Right column - Auction bidding UI (only shown in auction context), slightly more visible */}
          {isActiveAuction && (
            <div className="flex flex-col gap-4 rounded-xl border-2 border-[rgb(50,255,52)]/30 bg-[rgb(50,255,52)]/6 p-4">
              {/* Price info */}
              <div className="flex flex-col gap-3">
                <div className="rounded-lg border border-[rgb(50,255,52)]/35 bg-[rgb(50,255,52)]/10 px-4 py-3">
                  <p className="text-xs font-orbitron uppercase tracking-wider text-[rgb(186,255,188)]/70">
                    Reserve Price (USD)
                  </p>
                  <p className="text-xl font-orbitron text-white">
                    <ReservePriceDisplay value={auctionBidData.startingPrice} symbol={auctionBidData.reserveTokenSymbol} symbolClassName="text-[0.9em] opacity-90" />
                  </p>
                </div>
                <div className={`rounded-lg border px-4 py-3 ${
                  auctionBidData.highestBid && auctionBidData.highestBid > 0
                    ? "border-[rgb(50,255,52)]/50 bg-[rgb(50,255,52)]/15"
                    : "border-white/30 bg-white/8"
                }`}>
                  <p className={`text-xs font-orbitron uppercase tracking-wider ${
                    auctionBidData.highestBid && auctionBidData.highestBid > 0
                      ? "text-[rgb(50,255,52)]"
                      : "text-[rgb(186,255,188)]/70"
                  }`}>
                    Highest Bid
                  </p>
                  <p className={`text-xl font-orbitron ${
                    auctionBidData.highestBid && auctionBidData.highestBid > 0
                      ? "text-[rgb(50,255,52)]"
                      : "text-white/60"
                  }`}>
                    {auctionBidData.highestBid && auctionBidData.highestBid > 0 ? (
                      <ReservePriceDisplay value={auctionBidData.highestBid} symbol={auctionBidData.reserveTokenSymbol} symbolClassName="text-[0.9em] opacity-90" />
                    ) : "Be first!"}
                  </p>
                </div>
                {/* Countdown timer */}
                <div className="rounded-lg border border-orange-500/40 bg-orange-500/15 px-4 py-3">
                  <p className="text-xs font-orbitron uppercase tracking-wider text-orange-400/90">
                    Ends In
                  </p>
                  <p className="text-xl font-orbitron text-orange-400">
                    <CountdownTimer
                      endTime={auctionBidData.endTime}
                      status={auctionBidData.status}
                    />
                  </p>
                </div>
              </div>

              {/* Bid input and actions (only for non-sellers) */}
              {!auctionBidData.isUserSeller && (
                <>
                  {/* Token selector */}
                  {tokenOptions && tokenOptions.length > 0 && onPaymentTokenChange && (
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-orbitron uppercase tracking-wider text-[rgb(186,255,188)]/70">
                        Pay With
                      </label>
                      <CustomDropdown
                        id="adventurer-modal-payment-token"
                        value={bidState.paymentToken}
                        onChange={onPaymentTokenChange}
                        options={tokenOptions}
                        variant="green"
                        className="w-full"
                      />
                      {bidState.insufficientFundsError && (
                        <p className="text-xs text-red-400">
                          {bidState.insufficientFundsError}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-orbitron uppercase tracking-wider text-[rgb(186,255,188)]/70">
                      Your Bid (USDC)
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      placeholder="Enter amount..."
                      value={bidState.bidAmount}
                      onChange={(e) => onBidAmountChange?.(e.target.value)}
                      className="w-full rounded-lg border border-[rgb(50,255,52)]/40 bg-[rgb(50,255,52)]/5 px-4 py-3 text-sm font-orbitron text-white outline-none transition focus:border-[rgb(50,255,52)] focus:ring-2 focus:ring-[rgb(50,255,52)]/35 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                  </div>

                  {/* Quick bid buttons */}
                  {(() => {
                    const hasHighestBid = auctionBidData.highestBid !== undefined && auctionBidData.highestBid > 0;
                    const basePrice = hasHighestBid
                      ? auctionBidData.highestBid!
                      : auctionBidData.startingPrice;
                    const minBid = basePrice * 1.02;
                    const midBid = basePrice * 1.5;
                    const highBid = basePrice * 2;

                    return (
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => onBidAmountChange?.(minBid.toFixed(2))}
                          className="px-3 py-1.5 text-[10px] font-orbitron uppercase tracking-wider rounded-md border border-[rgb(50,255,52)]/30 bg-[rgb(50,255,52)]/5 text-[rgb(50,255,52)] hover:bg-[rgb(50,255,52)]/15 transition"
                        >
                          +2%
                        </button>
                        <button
                          type="button"
                          onClick={() => onBidAmountChange?.(midBid.toFixed(2))}
                          className="px-3 py-1.5 text-[10px] font-orbitron uppercase tracking-wider rounded-md border border-[rgb(50,255,52)]/30 bg-[rgb(50,255,52)]/5 text-[rgb(50,255,52)] hover:bg-[rgb(50,255,52)]/15 transition"
                        >
                          1.5x
                        </button>
                        <button
                          type="button"
                          onClick={() => onBidAmountChange?.(highBid.toFixed(2))}
                          className="px-3 py-1.5 text-[10px] font-orbitron uppercase tracking-wider rounded-md border border-[rgb(50,255,52)]/30 bg-[rgb(50,255,52)]/5 text-[rgb(50,255,52)] hover:bg-[rgb(50,255,52)]/15 transition"
                        >
                          2x
                        </button>
                      </div>
                    );
                  })()}

                  {/* Action buttons */}
                  <div className="flex flex-col gap-2 mt-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={onPlaceBid}
                        disabled={
                          !bidState.account ||
                          bidState.isSubmitting ||
                          !bidState.bidAmount ||
                          parseFloat(bidState.bidAmount) <= 0
                        }
                        className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-full px-4 h-11 text-xs font-orbitron uppercase tracking-[0.12em] transition whitespace-nowrap ${
                          bidState.account &&
                          !bidState.isSubmitting &&
                          bidState.bidAmount &&
                          parseFloat(bidState.bidAmount) > 0
                            ? "bg-[rgb(50,255,52)] text-black font-bold hover:cursor-pointer hover:bg-[rgb(40,220,42)] shadow-[0_0_12px_rgba(50,255,52,0.4)]"
                            : "border border-white/12 text-[rgb(186,255,188)]/45 cursor-not-allowed"
                        }`}
                      >
                        <span>{bidState.isSubmitting ? "..." : "Place Bid"}</span>
                        {!bidState.isSubmitting && (
                          <InfoTooltip content="Compete in the auction. Your bid must be higher than the current highest bid." />
                        )}
                      </button>
                      {!bidState.hasActiveOffer && (
                        <button
                          type="button"
                          onClick={onMakeOffer}
                          disabled={
                            !bidState.account ||
                            bidState.isSubmittingOffer ||
                            !bidState.bidAmount ||
                            parseFloat(bidState.bidAmount) <= 0
                          }
                          className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-full px-4 h-11 text-xs font-orbitron uppercase tracking-[0.12em] transition whitespace-nowrap ${
                            bidState.account &&
                            !bidState.isSubmittingOffer &&
                            bidState.bidAmount &&
                            parseFloat(bidState.bidAmount) > 0
                              ? "border border-blue-500 bg-blue-500/10 text-blue-500 hover:cursor-pointer hover:bg-blue-500 hover:text-black"
                              : "border border-white/12 text-[rgb(186,255,188)]/45 cursor-not-allowed"
                          }`}
                        >
                          <span>{bidState.isSubmittingOffer ? "..." : "Make Offer"}</span>
                          {!bidState.isSubmittingOffer && (
                            <InfoTooltip content="Make a direct buyout offer to the seller. If accepted, the auction ends immediately." />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Connect wallet prompt */}
                    {!bidState.account && (
                      <button
                        type="button"
                        onClick={onOpenWallet}
                        className="text-xs text-center text-[rgb(50,255,52)]/80 font-orbitron animate-pulse hover:text-[rgb(50,255,52)] hover:underline cursor-pointer transition-colors"
                      >
                        Connect wallet to place a bid →
                      </button>
                    )}
                  </div>
                </>
              )}

              {/* Seller notice */}
              {auctionBidData.isUserSeller && (
                <div className="text-center py-3 rounded-lg border border-yellow-500/45 bg-yellow-500/15">
                  <p className="text-xs font-orbitron text-yellow-400">
                    You are the seller of this auction
                  </p>
                </div>
              )}
            </div>
          )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
