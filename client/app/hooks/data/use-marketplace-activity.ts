"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Marketplace,
  ListingEvent,
  SaleEvent,
  type MarketplaceModel,
} from "@cartridge/arcade";
import { constants } from "starknet";
import { normalizeContractAddress } from "../../lib/utils/normalization";
import { getCurrencyInfo } from "./use-marketplace-listings";

export interface ActivityItem {
  type: "listing" | "sale";
  orderId: number;
  tokenId: string;
  /** Human-readable price (already divided by currency decimals) */
  price: number;
  currencySymbol: string;
  collection: string;
  seller: string;
  buyer: string | null;
  time: number;
}

const ACTIVITY_LIMIT = 100;

export function useMarketplaceActivity(collectionAddress: string) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const fetchedRef = useRef(false);
  const prevCollectionRef = useRef(collectionAddress);

  // Reset when collection changes
  if (prevCollectionRef.current !== collectionAddress) {
    prevCollectionRef.current = collectionAddress;
    fetchedRef.current = false;
    // Don't call setters here — will be handled in effect
  }

  const fetchActivity = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Init SDK if not already done
      if (!Marketplace.sdk) {
        await Marketplace.init(constants.StarknetChainId.SN_MAIN);
      }

      const normalizedCollection =
        normalizeContractAddress(collectionAddress).toLowerCase();

      await Marketplace.fetchEvents(
        (models: MarketplaceModel[]) => {
          const items: ActivityItem[] = [];

          for (const model of models) {
            if (ListingEvent.isType(model)) {
              const event = model as ListingEvent;
              const eventCollection = normalizeContractAddress(
                event.order.collection,
              ).toLowerCase();
              if (eventCollection !== normalizedCollection) continue;
              const { symbol, decimals } = getCurrencyInfo(
                event.order.currency,
              );
              items.push({
                type: "listing",
                orderId: event.order.id,
                tokenId: String(event.order.tokenId),
                price: event.order.price / Math.pow(10, decimals),
                currencySymbol: symbol,
                collection: event.order.collection,
                seller: event.order.owner,
                buyer: null,
                time: event.time,
              });
            } else if (SaleEvent.isType(model)) {
              const event = model as SaleEvent;
              const eventCollection = normalizeContractAddress(
                event.order.collection,
              ).toLowerCase();
              if (eventCollection !== normalizedCollection) continue;
              const { symbol, decimals } = getCurrencyInfo(
                event.order.currency,
              );
              items.push({
                type: "sale",
                orderId: event.order.id,
                tokenId: String(event.order.tokenId),
                price: event.order.price / Math.pow(10, decimals),
                currencySymbol: symbol,
                collection: event.order.collection,
                seller: event.from,
                buyer: event.to,
                time: event.time,
              });
            }
          }

          // Sort by time descending, cap at limit
          items.sort((a, b) => b.time - a.time);
          setActivities(items.slice(0, ACTIVITY_LIMIT));
          setLoading(false);
        },
        { listing: true, sale: true },
      );
    } catch (err) {
      console.error("Failed to fetch marketplace activity:", err);
      setError(
        err instanceof Error ? err : new Error("Failed to fetch activity"),
      );
      setActivities([]);
      setLoading(false);
    }
  }, [collectionAddress]);

  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      fetchActivity();
    }
  }, [fetchActivity]);

  // Reset and refetch when collection changes
  useEffect(() => {
    fetchedRef.current = false;
    setActivities([]);
    setLoading(true);
    fetchActivity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionAddress]);

  return { activities, loading, error, refresh: fetchActivity };
}
