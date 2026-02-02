"use client";

import { useMemo } from "react";
import Image from "next/image";
import type { FormattedNFT } from "../../lib/types";
import { IMAGE_BASE_URL } from "../../lib/constants";
import { getAdventurerImageUrl } from "../../lib/utils";
import { toDecimalTokenId } from "../../lib/utils/normalization";
import { calculateAdventurerRating } from "../../lib/utils/adventurer-rating";
import { ReservePriceDisplay } from "../ui";
import { CollectionType } from "../../lib/constants";

/** Attributes cache keyed by token ID (decimal string) for Level/Health lookup */
type AttributesByTokenId = Record<string, Array<{ trait_type: string; value: string | number }>>;

function getAttr(attrs: Array<{ trait_type: string; value: string | number }> | undefined, name: string): string | undefined {
  if (!attrs?.length) return undefined;
  const a = attrs.find((x) => (x.trait_type ?? "").toLowerCase() === name.toLowerCase());
  return a != null ? String(a.value) : undefined;
}

type PackCardProps = {
  collection: CollectionType;
  packNfts: FormattedNFT[];
  packSize: number;
  price: number;
  reserveTokenSymbol?: string;
  auctionName?: string;
  /** When collection is adventurers, optional attributes for Level/HP per token */
  adventurerAttributesByTokenId?: AttributesByTokenId;
  selected: boolean;
  onToggle: () => void;
  onInfoClick?: () => void;
  /** When listed: "Buy" = clickable label that opens buy modal (Buy tab); "Price" = static label (Sell/My Listings). */
  priceLabel?: "Buy" | "Price";
  /** When true (beast pack auction expired), show "Price" only and red Expired tag below. */
  expired?: boolean;
};

const MAX_STACK = 4;
const STACK_OFFSET = 8;

function getImageSrc(nft: FormattedNFT, collection: CollectionType): string {
  if (collection === "adventurers") {
    const tokenIdNum = nft.tokenId.startsWith("0x")
      ? parseInt(nft.tokenId, 16)
      : parseInt(nft.tokenId, 10);
    return getAdventurerImageUrl(tokenIdNum);
  }
  return nft.metadata?.image
    ? nft.metadata.image
    : nft.imagePath
      ? `${IMAGE_BASE_URL}/${nft.imagePath}`
      : "/logo.png";
}

export default function PackCard({
  collection,
  packNfts,
  packSize,
  price,
  reserveTokenSymbol,
  auctionName,
  adventurerAttributesByTokenId,
  selected,
  onToggle,
  onInfoClick,
  priceLabel = "Buy",
  expired,
}: PackCardProps) {
  const toShow = packNfts.slice(0, MAX_STACK);

  const parseNum = (val: string | number | undefined): number => {
    if (val === undefined || val === "") return NaN;
    const s = String(val).trim();
    if (!s) return NaN;
    if (s.startsWith("0x") || s.startsWith("0X")) {
      const n = parseInt(s, 16);
      return isNaN(n) ? NaN : n;
    }
    const n = parseInt(s, 10);
    return isNaN(n) ? NaN : n;
  };

  const adventurerAverages = useMemo(() => {
    if (collection !== "adventurers" || packNfts.length === 0) return null;
    const levels: number[] = [];
    const healths: number[] = [];
    const golds: number[] = [];
    const scores: number[] = [];
    for (const nft of packNfts) {
      const decKey = toDecimalTokenId(nft.tokenId);
      const attrs = (adventurerAttributesByTokenId?.[decKey] ?? adventurerAttributesByTokenId?.[nft.tokenId] ?? nft.attributes ?? []) as Array<{ trait_type: string; value: string | number }>;
      const level = parseNum(getAttr(attrs, "Level") ?? nft.level);
      if (!isNaN(level)) levels.push(level);
      const health = parseNum(getAttr(attrs, "Health"));
      if (!isNaN(health)) healths.push(health);
      const gold = parseNum(getAttr(attrs, "Gold"));
      if (!isNaN(gold)) golds.push(gold);
      if (attrs.length > 0) {
        const score = calculateAdventurerRating(attrs);
        if (score != null && Number.isFinite(score)) scores.push(score);
      }
    }
    const avg = (arr: number[]) =>
      arr.length === 0 ? null : Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 100) / 100;
    const avgLevel = levels.length ? Math.round(levels.reduce((a, b) => a + b, 0) / levels.length) : null;
    const avgHealth = healths.length ? Math.round(healths.reduce((a, b) => a + b, 0) / healths.length) : null;
    const avgGold = golds.length ? Math.round(golds.reduce((a, b) => a + b, 0) / golds.length) : null;
    const avgScore = scores.length ? avg(scores) : null;
    return { avgLevel, avgHealth, avgGold, avgScore };
  }, [collection, packNfts, adventurerAttributesByTokenId]);

  const beastAverages = useMemo(() => {
    if (collection !== "beasts" || packNfts.length === 0) return null;
    const levels: number[] = [];
    const healths: number[] = [];
    const powers: number[] = [];
    const tiers: number[] = [];
    for (const nft of packNfts) {
      const attrs = (nft.attributes ?? []) as Array<{ trait_type: string; value: string | number }>;
      const level = parseNum(getAttr(attrs, "Level") ?? (nft as { level?: string }).level);
      if (!isNaN(level)) levels.push(level);
      const health = parseNum(getAttr(attrs, "Health"));
      if (!isNaN(health)) healths.push(health);
      const power = parseNum(getAttr(attrs, "Power") ?? (nft as { power?: string }).power);
      if (!isNaN(power)) powers.push(power);
      const tier = parseNum(getAttr(attrs, "Tier") ?? (nft as { tier?: string }).tier);
      if (!isNaN(tier)) tiers.push(tier);
    }
    const avgLevel = levels.length ? Math.round(levels.reduce((a, b) => a + b, 0) / levels.length) : null;
    const avgHealth = healths.length ? Math.round(healths.reduce((a, b) => a + b, 0) / healths.length) : null;
    const avgPower = powers.length ? Math.round(powers.reduce((a, b) => a + b, 0) / powers.length) : null;
    const avgTier = tiers.length ? Math.ceil(tiers.reduce((a, b) => a + b, 0) / tiers.length) : null;
    return { avgLevel, avgHealth, avgPower, avgTier };
  }, [collection, packNfts]);

  const handleCardClick = () => {
    if (onInfoClick) onInfoClick();
    else onToggle();
  };

  return (
    <article
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
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className="absolute top-2 right-2 z-10 w-6 h-6 rounded border border-[rgb(50,255,52)]/50 flex items-center justify-center bg-black/60 hover:bg-[rgb(50,255,52)]/20 transition"
        aria-pressed={selected}
      >
        {selected ? (
          <svg className="w-3.5 h-3.5 text-[rgb(50,255,52)]" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        ) : (
          <span className="w-3 h-3 rounded-sm border border-white/50" />
        )}
      </button>

      <div className="flex-1 min-h-0 flex flex-col">
        {/* Image: same size and position as individual adventurer card (h-24 w-24) */}
        <div className="flex flex-col items-center gap-2 flex-shrink-0">
          <div className="relative flex h-24 w-24 flex-shrink-0 items-center justify-center">
            {toShow.map((nft, i) => (
              <div
                key={`${nft.tokenId}-${i}`}
                className="absolute rounded-lg overflow-hidden border border-[rgb(50,255,52)]/30 bg-black/80 shadow-lg"
                style={{
                  width: "70%",
                  aspectRatio: "1",
                  left: "50%",
                  top: "50%",
                  transform: `translate(calc(-50% + ${(i - (toShow.length - 1) / 2) * STACK_OFFSET}px), calc(-50% + ${(i - (toShow.length - 1) / 2) * STACK_OFFSET}px))`,
                  zIndex: i,
                }}
              >
                <Image
                  src={getImageSrc(nft, collection)}
                  alt=""
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                  unoptimized={getImageSrc(nft, collection).startsWith("data:") || getImageSrc(nft, collection).includes("torii")}
                />
              </div>
            ))}
            <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 rounded bg-black/80 border border-[rgb(50,255,52)]/40 px-1.5 py-0.5 text-[8px] font-orbitron uppercase text-[rgb(50,255,52)] z-10 whitespace-nowrap">
              Pack of {packSize}
            </span>
          </div>
          {/* Listing name: same position and formatting as adventurer ID */}
          <h3 className="text-sm font-orbitron uppercase tracking-wide leading-tight text-center line-clamp-1 text-white w-full min-w-0" title={auctionName}>
            {auctionName || "—"}
          </h3>
        </div>
        {(collection === "adventurers" || collection === "beasts") && (
          <p className="text-[8px] font-orbitron uppercase tracking-wider text-[rgb(186,255,188)]/50 truncate flex-shrink-0 mt-0.5 whitespace-nowrap">
            average
          </p>
        )}

        {/* Beast pack: average power, level, health, tier (rounded up, no decimals) */}
        {collection === "beasts" && beastAverages && (
          <div className="grid grid-cols-2 gap-1.5 mt-auto flex-1 min-h-[72px] min-w-0 shrink-0">
            <div className="flex flex-col items-center justify-center p-1.5 rounded-md bg-white/5 border border-white/10">
              <span className="text-base font-orbitron font-bold text-white">
                {beastAverages.avgLevel != null ? beastAverages.avgLevel : "—"}
              </span>
              <span className="text-[8px] uppercase text-[rgb(186,255,188)]/50">Level</span>
            </div>
            <div className="flex flex-col items-center justify-center p-1.5 rounded-md bg-white/5 border border-white/10">
              <span className="text-base font-orbitron font-bold text-red-400">
                {beastAverages.avgHealth != null ? beastAverages.avgHealth : "—"}
              </span>
              <span className="text-[8px] uppercase text-[rgb(186,255,188)]/50">Health</span>
            </div>
            <div className="flex flex-col items-center justify-center p-1.5 rounded-md bg-white/5 border border-white/10">
              <span className="text-base font-orbitron font-bold text-[rgb(50,255,52)]">
                {beastAverages.avgPower != null ? beastAverages.avgPower : "—"}
              </span>
              <span className="text-[8px] uppercase text-[rgb(186,255,188)]/50">Power</span>
            </div>
            <div className="flex flex-col items-center justify-center p-1.5 rounded-md bg-white/5 border border-white/10">
              <span className="text-base font-orbitron font-bold text-yellow-400">
                {beastAverages.avgTier != null ? beastAverages.avgTier : "—"}
              </span>
              <span className="text-[8px] uppercase text-[rgb(186,255,188)]/50">Tier</span>
            </div>
          </div>
        )}

        {/* Adventurer pack: same 2x2 layout as individual card, averages */}
        {collection === "adventurers" && adventurerAverages && (
          <div className="grid grid-cols-2 gap-1.5 mt-auto flex-1 min-h-[72px] min-w-0 shrink-0">
            <div className="flex flex-col items-center justify-center p-1.5 rounded-md bg-white/5 border border-white/10">
              <span className="text-base font-orbitron font-bold text-white">
                {adventurerAverages.avgLevel != null ? adventurerAverages.avgLevel : "—"}
              </span>
              <span className="text-[8px] uppercase text-[rgb(186,255,188)]/50">Level</span>
            </div>
            <div className="flex flex-col items-center justify-center p-1.5 rounded-md bg-white/5 border border-white/10">
              <span className="text-base font-orbitron font-bold text-red-400">
                {adventurerAverages.avgHealth != null ? adventurerAverages.avgHealth.toLocaleString() : "—"}
              </span>
              <span className="text-[8px] uppercase text-[rgb(186,255,188)]/50">Health</span>
            </div>
            <div className="flex flex-col items-center justify-center p-1.5 rounded-md bg-white/5 border border-white/10">
              <span className="text-base font-orbitron font-bold text-yellow-400">
                {adventurerAverages.avgGold != null ? adventurerAverages.avgGold.toLocaleString() : "—"}
              </span>
              <span className="text-[8px] uppercase text-[rgb(186,255,188)]/50">Gold</span>
            </div>
            <div className="flex flex-col items-center justify-center p-1.5 rounded-md bg-white/5 border border-white/10">
              <span className="text-base font-orbitron font-bold text-blue-400">
                {adventurerAverages.avgScore != null ? adventurerAverages.avgScore.toFixed(2) : "—"}
              </span>
              <span className="text-[8px] uppercase text-[rgb(186,255,188)]/50">Score</span>
            </div>
          </div>
        )}
      </div>

      {/* Expired tag - red, below card content (beast packs) */}
      {expired && (
        <div className="flex justify-center shrink-0">
          <span className="rounded border border-red-500/60 bg-red-500/20 px-2 py-0.5 text-[9px] font-orbitron uppercase tracking-wider text-red-400">
            Expired
          </span>
        </div>
      )}

      {/* Buy (price) in Buy tab; Price (static) in Sell/My Listings; when expired show Price only */}
      <div className="shrink-0 mt-auto border-t border-[rgb(50,255,52)]/20 h-[60px] flex flex-col justify-center">
        {priceLabel === "Price" || expired ? (
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
        )}
      </div>
    </article>
  );
}
