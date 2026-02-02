"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import { normalizeTokenId, toDecimalTokenId } from "../lib/utils/normalization";

export type AdventurerAttribute = { trait_type: string; value: string };
export type AttributesByTokenId = Record<string, AdventurerAttribute[]>;

interface AdventurerAttributesContextValue {
  /** Attributes keyed by token ID (decimal, short hex, normalized long hex). Used for filtering and cards. */
  attributesByTokenId: AttributesByTokenId;
  /** Merge new attributes into the store. Keys can be any tokenId form; callers should pass decimal, short hex, and normalized for reliable lookup. */
  mergeAttributes: (updates: AttributesByTokenId) => void;
}

const AdventurerAttributesContext = createContext<AdventurerAttributesContextValue | null>(null);

export function useAdventurerAttributes(): AdventurerAttributesContextValue {
  const ctx = useContext(AdventurerAttributesContext);
  if (!ctx) {
    throw new Error("useAdventurerAttributes must be used within AdventurerAttributesProvider");
  }
  return ctx;
}

/** Optional hook: returns undefined if provider is not mounted (e.g. outside Buy/Auction flow). */
export function useAdventurerAttributesOptional(): AdventurerAttributesContextValue | null {
  return useContext(AdventurerAttributesContext);
}

/**
 * Merges attributes for a single token under decimal, short hex, and normalized keys so
 * lookup in nftsWithAttributes (by decimal, nft.tokenId, or normalized) finds them.
 */
export function mergeAttributesForToken(
  attributes: AdventurerAttribute[],
  tokenId: string | number
): AttributesByTokenId {
  const decimal = toDecimalTokenId(typeof tokenId === "number" ? String(tokenId) : tokenId);
  if (!decimal || attributes.length === 0) return {};
  const hexShort = "0x" + BigInt(decimal).toString(16).toLowerCase();
  const hexNormalized = normalizeTokenId(decimal);
  const slice: AdventurerAttribute[] = attributes.map((a) => ({
    trait_type: a.trait_type,
    value: String(a.value ?? ""),
  }));
  return {
    [decimal]: slice,
    [hexShort]: slice,
    [hexNormalized]: slice,
  };
}

export function AdventurerAttributesProvider({ children }: { children: React.ReactNode }) {
  const [attributesByTokenId, setAttributesByTokenId] = useState<AttributesByTokenId>({});

  const mergeAttributes = useCallback((updates: AttributesByTokenId) => {
    setAttributesByTokenId((prev) => {
      const next = { ...prev };
      for (const [key, attrs] of Object.entries(updates)) {
        if (attrs && attrs.length > 0) next[key] = attrs;
      }
      return next;
    });
  }, []);

  const value: AdventurerAttributesContextValue = {
    attributesByTokenId,
    mergeAttributes,
  };

  return (
    <AdventurerAttributesContext.Provider value={value}>
      {children}
    </AdventurerAttributesContext.Provider>
  );
}
