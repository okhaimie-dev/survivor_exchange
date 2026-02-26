"use client";

import { useMemo } from "react";
import type { MarketplaceListing } from "../hooks/data/use-marketplace-listings";
import { normalizeContractAddress } from "../lib/utils/normalization";
import { getReservePriceParts } from "../lib/utils";

interface MarketplaceStatsProps {
  listings: MarketplaceListing[];
  userAddress: string | undefined;
}

export function MarketplaceStats({
  listings,
  userAddress,
}: MarketplaceStatsProps) {
  const stats = useMemo(() => {
    const activeCount = listings.length;

    // Floor price: cheapest listing
    let floorPrice: { amount: string; symbol: string } | null = null;
    if (activeCount > 0) {
      let cheapest = listings[0];
      for (let i = 1; i < listings.length; i++) {
        if (listings[i].price < cheapest.price) cheapest = listings[i];
      }
      floorPrice = getReservePriceParts(cheapest.price, cheapest.currencySymbol);
    }

    // Unique sellers
    const sellers = new Set<string>();
    for (const l of listings) {
      sellers.add(normalizeContractAddress(l.owner).toLowerCase());
    }

    // Your listings
    let yourCount = 0;
    if (userAddress) {
      const normalized = normalizeContractAddress(userAddress).toLowerCase();
      for (const l of listings) {
        if (normalizeContractAddress(l.owner).toLowerCase() === normalized) {
          yourCount++;
        }
      }
    }

    return { activeCount, floorPrice, uniqueSellers: sellers.size, yourCount };
  }, [listings, userAddress]);

  const cards = [
    {
      label: "Floor Price",
      value: stats.floorPrice
        ? `${stats.floorPrice.symbol} ${stats.floorPrice.amount}`
        : "--",
    },
    { label: "Active Listings", value: String(stats.activeCount) },
    { label: "Unique Sellers", value: String(stats.uniqueSellers) },
    { label: "Your Listings", value: String(stats.yourCount) },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-[rgb(50,255,52)]/20 bg-black/40 p-3"
        >
          <p className="text-[9px] font-orbitron uppercase tracking-wider text-[rgb(186,255,188)]/50 mb-1">
            {card.label}
          </p>
          <p className="text-sm sm:text-base font-orbitron font-bold text-white tabular-nums">
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
