"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import type { ActivityItem } from "../hooks/data/use-marketplace-activity";
import type { CollectionType } from "../lib/constants";
import { getBeastImageUrl } from "../hooks/data/use-marketplace-listings";
import { getAdventurerImageUrl } from "../lib/utils/nft-formatters";
import { formatRelativeTime, getReservePriceParts } from "../lib/utils";

type ActivityFilter = "all" | "sale" | "listing";

interface MarketplaceActivityProps {
  activities: ActivityItem[];
  loading: boolean;
  collectionType: CollectionType;
}

function truncateAddr(addr: string): string {
  if (!addr) return "";
  if (addr.length <= 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function TokenImage({
  tokenId,
  collectionType,
}: {
  tokenId: string;
  collectionType: CollectionType;
}) {
  const [error, setError] = useState(false);
  const src =
    collectionType === "beasts"
      ? getBeastImageUrl(tokenId)
      : getAdventurerImageUrl(parseInt(tokenId, 10));

  if (error) {
    return (
      <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center">
        <span className="text-[8px] text-white/30">#</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={`#${tokenId}`}
      width={32}
      height={32}
      className="w-8 h-8 rounded object-contain"
      unoptimized
      onError={() => setError(true)}
    />
  );
}

function SkeletonRows() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="h-12 rounded-lg bg-white/5 animate-pulse"
        />
      ))}
    </div>
  );
}

export function MarketplaceActivity({
  activities,
  loading,
  collectionType,
}: MarketplaceActivityProps) {
  const [filter, setFilter] = useState<ActivityFilter>("all");

  const filtered = useMemo(() => {
    if (filter === "all") return activities;
    return activities.filter((a) => a.type === filter);
  }, [activities, filter]);

  const filters: { label: string; value: ActivityFilter }[] = [
    { label: "All", value: "all" },
    { label: "Sales", value: "sale" },
    { label: "Listings", value: "listing" },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Filter chips */}
      <div className="flex gap-1.5">
        {filters.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-3 py-1.5 text-[10px] font-orbitron uppercase tracking-[0.14em] transition hover:cursor-pointer ${
              filter === f.value
                ? "bg-[rgb(50,255,52)]/20 text-[rgb(50,255,52)] border border-[rgb(50,255,52)]/40"
                : "text-white/50 hover:text-white/70 border border-white/10 hover:border-white/20"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonRows />
      ) : filtered.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-[rgb(186,255,188)]/50 font-orbitron text-xs">
            No activity yet
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="pb-2 text-[9px] font-orbitron uppercase tracking-wider text-[rgb(186,255,188)]/40 font-normal">
                    Type
                  </th>
                  <th className="pb-2 text-[9px] font-orbitron uppercase tracking-wider text-[rgb(186,255,188)]/40 font-normal">
                    Time
                  </th>
                  <th className="pb-2 text-[9px] font-orbitron uppercase tracking-wider text-[rgb(186,255,188)]/40 font-normal">
                    Token
                  </th>
                  <th className="pb-2 text-[9px] font-orbitron uppercase tracking-wider text-[rgb(186,255,188)]/40 font-normal text-right">
                    Price
                  </th>
                  <th className="pb-2 text-[9px] font-orbitron uppercase tracking-wider text-[rgb(186,255,188)]/40 font-normal">
                    From
                  </th>
                  <th className="pb-2 text-[9px] font-orbitron uppercase tracking-wider text-[rgb(186,255,188)]/40 font-normal">
                    To
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, i) => {
                  const priceParts = getReservePriceParts(
                    item.price,
                    item.currencySymbol,
                  );
                  return (
                    <tr
                      key={`${item.orderId}-${item.type}-${i}`}
                      className="border-b border-white/5 hover:bg-white/[0.02] transition"
                    >
                      <td className="py-2.5 pr-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-orbitron uppercase tracking-wider ${
                            item.type === "sale"
                              ? "bg-[rgb(50,255,52)]/15 text-[rgb(50,255,52)]"
                              : "border border-white/20 text-white/60"
                          }`}
                        >
                          {item.type === "sale" ? "Sold" : "Listed"}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 text-[10px] text-[rgb(186,255,188)]/50 font-mono whitespace-nowrap">
                        {formatRelativeTime(item.time)}
                      </td>
                      <td className="py-2.5 pr-3">
                        <div className="flex items-center gap-2">
                          <TokenImage
                            tokenId={item.tokenId}
                            collectionType={collectionType}
                          />
                          <span className="text-xs text-white font-mono">
                            #{item.tokenId}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 pr-3 text-right">
                        <span className="text-xs font-orbitron font-bold text-white tabular-nums">
                          {priceParts.amount}
                        </span>{" "}
                        <span className="text-[9px] font-orbitron text-[rgb(186,255,188)]/50 uppercase">
                          {priceParts.symbol}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 text-[10px] text-[rgb(186,255,188)]/50 font-mono">
                        {truncateAddr(item.seller)}
                      </td>
                      <td className="py-2.5 text-[10px] text-[rgb(186,255,188)]/50 font-mono">
                        {item.buyer ? truncateAddr(item.buyer) : "--"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile stacked cards */}
          <div className="md:hidden flex flex-col gap-2">
            {filtered.map((item, i) => {
              const priceParts = getReservePriceParts(
                item.price,
                item.currencySymbol,
              );
              return (
                <div
                  key={`${item.orderId}-${item.type}-${i}`}
                  className="rounded-lg border border-white/10 bg-black/30 p-3 flex items-center gap-3"
                >
                  <TokenImage
                    tokenId={item.tokenId}
                    collectionType={collectionType}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[8px] font-orbitron uppercase tracking-wider ${
                          item.type === "sale"
                            ? "bg-[rgb(50,255,52)]/15 text-[rgb(50,255,52)]"
                            : "border border-white/20 text-white/60"
                        }`}
                      >
                        {item.type === "sale" ? "Sold" : "Listed"}
                      </span>
                      <span className="text-[10px] text-white font-mono">
                        #{item.tokenId}
                      </span>
                      <span className="text-[9px] text-[rgb(186,255,188)]/40 ml-auto">
                        {formatRelativeTime(item.time)}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-xs font-orbitron font-bold text-white tabular-nums">
                        {priceParts.amount}
                      </span>
                      <span className="text-[9px] font-orbitron text-[rgb(186,255,188)]/50 uppercase">
                        {priceParts.symbol}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
