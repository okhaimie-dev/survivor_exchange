"use client";

import { useMemo } from "react";
import {
  useMarketplaceCollectionListings,
  useMarketplaceCollectionTokens,
} from "@cartridge/arcade/marketplace/react";
import type { CollectionType } from "../../lib/constants";
import {
  BEASTS_NFT_CONTRACT_ADDRESS,
  ADVENTURER_NFT_CONTRACT_ADDRESS,
  SUPPORTED_TOKENS,
} from "../../lib/constants";
import { normalizeContractAddress } from "../../lib/utils/normalization";
import { getAdventurerImageUrl } from "../../lib/utils";
import { addAddressPadding } from "starknet";

const COLLECTION_ADDRESSES: Record<CollectionType, string> = {
  beasts: BEASTS_NFT_CONTRACT_ADDRESS,
  adventurers: ADVENTURER_NFT_CONTRACT_ADDRESS,
};

/** Torii project that hosts beast collection images (NOT lax, which returns 404) */
const BEASTS_TORII_BASE_URL = "https://api.cartridge.gg/x/pg-mainnet-10/torii";

/**
 * ERC20 decimal overrides for the marketplace.
 * SUPPORTED_TOKENS lists LORDS as 6 decimals (auction contract convention),
 * but the actual ERC20 has 18 decimals. Arcade marketplace uses real ERC20 values.
 */
const ERC20_DECIMAL_OVERRIDES: Record<string, number> = {
  LORDS: 18,
};

export interface MarketplaceListing {
  orderId: number;
  tokenId: string;
  /** Human-readable price (already divided by currency decimals) */
  price: number;
  /** Raw price in smallest unit for buy transactions */
  rawPrice: number;
  currency: string;
  currencySymbol: string;
  currencyDecimals: number;
  owner: string;
  collection: string;
  collectionType: CollectionType;
  expiration: number;
  /** Token metadata from the Arcade SDK */
  metadata: Record<string, unknown> | null;
  /** Resolved image URL */
  image: string;
  /** Token name from metadata */
  name: string;
}

function getCurrencyInfo(currencyAddress: string) {
  const normalized = normalizeContractAddress(currencyAddress).toLowerCase();
  const token = SUPPORTED_TOKENS.find(
    (t) => normalizeContractAddress(t.address).toLowerCase() === normalized,
  );
  const symbol = token?.symbol ?? "TOKEN";
  // Use ERC20 override if available (e.g. LORDS is 18 on-chain, not 6 as in auction system)
  const decimals = ERC20_DECIMAL_OVERRIDES[symbol] ?? token?.decimals ?? 18;
  return { symbol, decimals };
}

/** Build the beast image URL from the pg-mainnet-10 Torii project */
function getBeastImageUrl(tokenId: string): string {
  const paddedContract = addAddressPadding(BEASTS_NFT_CONTRACT_ADDRESS);
  const paddedTokenId = addAddressPadding(`0x${BigInt(tokenId).toString(16)}`);
  return `${BEASTS_TORII_BASE_URL}/static/${paddedContract}/${paddedTokenId}/image`;
}

/** Resolve image URL for a listing */
function resolveListingImage(
  collectionType: CollectionType,
  tokenId: string,
  tokenImage: string | undefined,
  metadata: Record<string, unknown> | null,
): string {
  // If the SDK resolved a valid image, use it
  if (tokenImage) return tokenImage;

  // Check metadata for an image field
  if (metadata) {
    const metaImage = metadata.image ?? metadata.image_url;
    if (typeof metaImage === "string" && metaImage.length > 0) return metaImage;
  }

  // Collection-specific fallbacks
  if (collectionType === "adventurers") {
    return getAdventurerImageUrl(parseInt(tokenId, 10));
  }
  return getBeastImageUrl(tokenId);
}

export function useMarketplaceListings(collection: CollectionType) {
  const collectionAddress = COLLECTION_ADDRESSES[collection];

  const {
    data: listings,
    status: listingsStatus,
    error: listingsError,
    isFetching: listingsFetching,
    refresh: refreshListings,
  } = useMarketplaceCollectionListings({
    collection: collectionAddress,
    limit: 100,
  });

  // Extract token IDs from listings for metadata fetch
  const tokenIds = useMemo(() => {
    if (!listings || listings.length === 0) return [] as string[];
    const ids = new Set<string>();
    for (const order of listings) {
      ids.add(String(order.tokenId));
    }
    return Array.from(ids);
  }, [listings]);

  const {
    data: tokensResult,
    status: tokensStatus,
    isFetching: tokensFetching,
  } = useMarketplaceCollectionTokens(
    {
      address: collectionAddress,
      tokenIds,
      limit: tokenIds.length || 1,
      fetchImages: true,
    },
    tokenIds.length > 0,
  );

  // Build a lookup map of token data by tokenId
  const tokenDataMap = useMemo(() => {
    const map = new Map<
      string,
      { metadata: Record<string, unknown> | null; image?: string; name: string }
    >();
    if (!tokensResult?.page?.tokens) return map;
    for (const token of tokensResult.page.tokens) {
      // token_id from Torii is in "contractAddr:tokenIdHex" format
      const rawTokenId = token.token_id ?? "";
      const parts = rawTokenId.split(":");
      const hexId = parts.length > 1 ? parts[1] : rawTokenId;
      // Convert hex to decimal string for matching
      const decimalId = hexId ? String(BigInt(hexId.startsWith("0x") ? hexId : `0x${hexId}`)) : rawTokenId;

      const parsed = token.metadata ?? null;
      const name =
        (parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>).name ?? (parsed as Record<string, unknown>).title : null) ??
        `#${decimalId}`;

      map.set(decimalId, {
        metadata: parsed as Record<string, unknown> | null,
        image: token.image,
        name: String(name),
      });
    }
    return map;
  }, [tokensResult]);

  // Merge listings with token data
  const mergedListings = useMemo((): MarketplaceListing[] => {
    if (!listings || listings.length === 0) return [];
    return listings.map((order) => {
      const tokenIdStr = String(order.tokenId);
      const tokenData = tokenDataMap.get(tokenIdStr);
      const { symbol, decimals } = getCurrencyInfo(order.currency);

      // Convert raw price (smallest unit) to human-readable
      const humanPrice = order.price / Math.pow(10, decimals);

      const metadata = tokenData?.metadata ?? null;
      const image = resolveListingImage(collection, tokenIdStr, tokenData?.image, metadata);

      return {
        orderId: order.id,
        tokenId: tokenIdStr,
        price: humanPrice,
        rawPrice: order.price,
        currency: order.currency,
        currencySymbol: symbol,
        currencyDecimals: decimals,
        owner: order.owner,
        collection: order.collection,
        collectionType: collection,
        expiration: order.expiration,
        metadata,
        image,
        name: tokenData?.name ?? `#${tokenIdStr}`,
      };
    });
  }, [listings, tokenDataMap, collection]);

  const loading =
    listingsStatus === "loading" ||
    listingsStatus === "idle" ||
    (tokenIds.length > 0 && (tokensStatus === "loading" || tokensStatus === "idle"));

  return {
    listings: mergedListings,
    loading,
    error: listingsError,
    isFetching: listingsFetching || tokensFetching,
    refresh: refreshListings,
  };
}
