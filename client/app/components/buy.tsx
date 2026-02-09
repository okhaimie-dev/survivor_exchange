"use client";

import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useAccount } from "@starknet-react/core";
import { AdventurerCard, MonsterCard, PackCard } from "./cards";
import { Pagination } from "./ui";
import { Filters, type FilterState } from "./filters";
import { BidsSkeleton } from "./skeletons";
import { BeastDetailModal, AdventurerDetailModal } from "./modals";
import type { FormattedNFT, AuctionItem, Collection } from "../lib/types";
import { AuctionWithNFTs, useBidActions } from "../hooks";
import { DEFAULT_PAGE_SIZE, GRID_PAGE_SIZE, STAT_BOUNDS_MAX_TOKENS, ADVENTURER_NFT_CONTRACT_ADDRESS, BEASTS_NFT_CONTRACT_ADDRESS, SUPPORTED_TOKENS, USDC_ADDRESS, MAX_AUCTION_NFT_SELECTION, getTokenByAddress, LORDS_ADDRESS } from "../lib/constants";
import { normalizeContractAddress, normalizeTokenId, toDecimalTokenId } from "../lib/utils/normalization";
import { formatUSD, parseAmount, parseHexOrDecimal } from "../lib/utils";
import { applyFiltersToNFTs, computeAdventurerStatBounds, getFiltersWithoutStatBounds, type AdventurerStatBounds } from "../lib/filter-utils";
import { isAuctionExpired } from "../lib/utils/auction-status";
import { CollectionSelector, CustomDropdown } from "./ui";
import { CollectionType } from "../lib/constants";
import { useWalletModal } from "../providers/wallet-modal-provider";
import { useToast } from "../providers/toast-provider";
import { useAdventurerAttributesOptional } from "../providers/adventurer-attributes-provider";

interface BuyProps {
  auctions: AuctionWithNFTs[];
  loading: boolean;
  error: Error | null;
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
  getAuctionItems: (auctionId: string) => AuctionItem[];
  onRefresh?: () => Promise<unknown>;
}

interface NFTWithAuction extends FormattedNFT {
  auctionId: string;
  auctionName: string;
  price: number;
  highestBid?: number;
  startingPrice: number;
  endTime?: string;
  status?: string;
  isPack: boolean;
  packSize?: number;
  /** When isPack, all NFTs in this auction for superposition and modal */
  packNfts?: FormattedNFT[];
  reserveTokenSymbol?: string;
  reserveTokenAddress?: string;
  /** Listing source for modal (e.g. eternum → "Buy on Realms") */
  listingSource?: "survivor_exchange" | "eternum";
}

export default function Buy({
  auctions,
  loading,
  error,
  currentPage,
  setCurrentPage,
  getAuctionItems,
  onRefresh,
}: BuyProps) {
  const { address, account } = useAccount();
  const { openWalletModal } = useWalletModal();
  const toast = useToast();
  const [selectedCollection, setSelectedCollection] = useState<CollectionType>("adventurers");
  const [selectedNFTIndex, setSelectedNFTIndex] = useState<number>(0);
  const [selectedPackItemIndex, setSelectedPackItemIndex] = useState<number>(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [isBulkBuyModalOpen, setIsBulkBuyModalOpen] = useState(false);
  const [bulkBidAmount, setBulkBidAmount] = useState("");
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);
  const [showOnlyAlive, setShowOnlyAlive] = useState(true);
  const [excludeExpired, setExcludeExpired] = useState(true);
  const [gameOverByTokenId, setGameOverByTokenId] = useState<Record<string, boolean>>({});
  const [isLoadingGameOver, setIsLoadingGameOver] = useState(false);
  const gameOverFetchRef = useRef(0);
  const [inBattleByTokenId, setInBattleByTokenId] = useState<Record<string, boolean>>({});
  // Eternum beasts: fetch metadata by contract+tokenId so grid shows attributes/image
  const [beastMetadataByKey, setBeastMetadataByKey] = useState<Record<string, FormattedNFT | null>>({});
  // Shared adventurer attributes (batch + card fetches) so grid filtering sees Level, Health, stats. Fallback to local state when provider is missing (e.g. SSR).
  const adventurerAttrs = useAdventurerAttributesOptional();
  const [localAttributesByTokenId, setLocalAttributesByTokenId] = useState<Record<string, Array<{ trait_type: string; value: string }>>>({});
  const attributesByTokenId = adventurerAttrs?.attributesByTokenId ?? localAttributesByTokenId;
  const mergeAttributes = adventurerAttrs?.mergeAttributes ?? ((updates: Record<string, Array<{ trait_type: string; value: string }>>) => {
    setLocalAttributesByTokenId((prev) => {
      const next = { ...prev };
      for (const [key, attrs] of Object.entries(updates)) {
        if (attrs?.length) next[key] = attrs;
      }
      return next;
    });
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh]);

  // Smooth loading bar progress (simulated 0 → ~90% while loading, then 100% on done) and Loot Survivor flavor text
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingFlavorIndex, setLoadingFlavorIndex] = useState(0);
  const loadingProgressRef = useRef(0);
  const loadingStartRef = useRef<number | null>(null);

  const LOADING_FLAVOR_TEXTS = [
    "Exploring Dungeon Data..",
    "Recovering dead adventurers..",
    "Hunting Beasts..",
    "Scanning the marketplace..",
    "Decrypting auction ledgers..",
    "Consulting the Loot Survivor oracles..",
    "Gathering loot from the depths..",
    "Summoning Listings",
  ];

  const [bidAmountToken, setBidAmountToken] = useState("");
  const [paymentToken, setPaymentToken] = useState(USDC_ADDRESS);
  const [tokenPrice, setTokenPrice] = useState<number | null>(null);
  const [userOffer, setUserOffer] = useState<{ buyer: string; amount: number; status: string; createdAt: string; expiresAt: string } | null>(null);
  const [tokenBalances, setTokenBalances] = useState<Record<string, { amount: string; usdValue: string | null }>>({});
  const [filters, setFilters] = useState<FilterState>({
    id: "", search: "", beast: "", type: "", tier: "",
    levelMin: "", levelMax: "", powerMin: "", powerMax: "", rankMin: "", rankMax: "",
    shiny: "", animated: "", priceSort: "high-low", tokenIdSort: "", levelSort: "", scoreSort: "", tierSort: "", powerSort: "", summitTop15: "", timeSort: "",
    healthMin: "", healthMax: "", strengthMin: "", strengthMax: "", dexterityMin: "", dexterityMax: "",
    vitalityMin: "", vitalityMax: "", intelligenceMin: "", intelligenceMax: "", wisdomMin: "", wisdomMax: "", charismaMin: "", charismaMax: "",
    battleFilter: "",
  });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [gridCurrentPage, setGridCurrentPage] = useState(1);

  const sortDropdownValue =
    filters.timeSort === "ending-soon" ? "time-ending-soon" : filters.timeSort === "newest" ? "time-newest"
    : filters.priceSort === "low-high" ? "price-low-high" : filters.priceSort === "high-low" ? "price-high-low"
    : filters.levelSort === "low-high" ? "level-low-high" : filters.levelSort === "high-low" ? "level-high-low"
    : filters.scoreSort === "low-high" ? "score-low-high" : filters.scoreSort === "high-low" ? "score-high-low"
    : filters.tierSort === "low-high" ? "tier-low-high" : filters.tierSort === "high-low" ? "tier-high-low"
    : filters.powerSort === "low-high" ? "power-low-high" : filters.powerSort === "high-low" ? "power-high-low"
    : filters.tokenIdSort === "low-high" ? "tokenId-low-high" : filters.tokenIdSort === "high-low" ? "tokenId-high-low"
    : "price-high-low";
  const setSortFromDropdown = useCallback((value: string) => {
    setFilters((prev) => ({
      ...prev,
      timeSort: value === "time-ending-soon" ? "ending-soon" : value === "time-newest" ? "newest" : "",
      priceSort: value === "price-low-high" ? "low-high" : value === "price-high-low" ? "high-low" : "",
      levelSort: value === "level-low-high" ? "low-high" : value === "level-high-low" ? "high-low" : "",
      scoreSort: value === "score-low-high" ? "low-high" : value === "score-high-low" ? "high-low" : "",
      tierSort: value === "tier-low-high" ? "low-high" : value === "tier-high-low" ? "high-low" : "",
      powerSort: value === "power-low-high" ? "low-high" : value === "power-high-low" ? "high-low" : "",
      tokenIdSort: value === "tokenId-low-high" ? "low-high" : value === "tokenId-high-low" ? "high-low" : "",
    }));
  }, []);

  // Extract all individual NFTs from auctions
  const allNFTsWithAuction: NFTWithAuction[] = useMemo(() => {
    const nfts: NFTWithAuction[] = [];
    
    for (const auction of auctions) {
      const auctionIdStr = String(auction.auction_id);
      const items = getAuctionItems(auctionIdStr);
      
      // Check if this is an adventurer auction or a beast auction (exclude Golden token, Realm cosmetics, etc.)
      const isAdventurerAuction = items.length > 0 && items.some(item => {
        const contractAddr = normalizeContractAddress(item.contract_address || '').toLowerCase();
        const adventurerAddr = normalizeContractAddress(ADVENTURER_NFT_CONTRACT_ADDRESS).toLowerCase();
        return contractAddr === adventurerAddr;
      });
      const isBeastAuction = items.length > 0 && items.some(item => {
        const contractAddr = normalizeContractAddress(item.contract_address || '').toLowerCase();
        const beastsAddr = normalizeContractAddress(BEASTS_NFT_CONTRACT_ADDRESS).toLowerCase();
        return contractAddr === beastsAddr;
      });

      // Only process if matches selected collection (beasts tab = beasts contract only; adventurers = adventurer contract)
      if (selectedCollection === "adventurers" && !isAdventurerAuction) continue;
      if (selectedCollection === "beasts" && !isBeastAuction) continue;

      const isEternum = auction.source === "eternum";
      const feeTokenRaw = (auction as { fee_token?: string }).fee_token;
      const feeToken = feeTokenRaw ? normalizeContractAddress(feeTokenRaw) : undefined;
      let reserveToken = feeToken ? getTokenByAddress(feeToken) : undefined;
      // Eternum returns LORDS prices in 18-decimal raw; override to 18 so display is correct (app constants use 6 for other contexts)
      if (isEternum && feeToken && normalizeContractAddress(LORDS_ADDRESS).toLowerCase() === feeToken.toLowerCase()) {
        reserveToken = { ...(reserveToken ?? { address: LORDS_ADDRESS, symbol: "LORDS", name: "Lords", decimals: 18 }), decimals: 18 };
      }
      const decimals = isEternum ? (reserveToken?.decimals ?? 18) : (reserveToken?.decimals ?? 6);
      const startingPriceRaw = auction.starting_price ?? (auction as { startingPrice?: string }).startingPrice;
      const startingPrice = parseAmount(startingPriceRaw, decimals);
      const rawBid = auction.current_bid ? parseAmount(auction.current_bid, decimals) : undefined;
      const highestBid = rawBid != null && rawBid > 0 ? rawBid : undefined;
      const price = (highestBid != null && highestBid > 0) ? highestBid : startingPrice;
      const reserveTokenSymbol = isEternum ? (reserveToken?.symbol ?? "Amount") : "USDC";
      const reserveTokenAddress = reserveToken?.address;
      const listingSource = (auction as { source?: "survivor_exchange" | "eternum" }).source ?? "survivor_exchange";

      // If pack (multiple items), show one card per auction with superposition
      if (items.length > 1) {
        const packNftsList: FormattedNFT[] = [];
        for (const item of items) {
          const nft = auction.nfts?.find(n =>
            normalizeTokenId(n.tokenId) === normalizeTokenId(item.token_id)
          );
          if (nft) packNftsList.push(nft);
        }
        if (packNftsList.length > 0) {
          const representative = packNftsList[0];
          nfts.push({
            ...representative,
            auctionId: auctionIdStr,
            auctionName: auction.name,
            price,
            highestBid,
            startingPrice,
            endTime: auction.end_time,
            status: auction.status,
            isPack: true,
            packSize: packNftsList.length,
            packNfts: packNftsList,
            reserveTokenSymbol,
            reserveTokenAddress,
            listingSource,
          });
        }
      } else if (items.length === 1) {
        // Single item auction
        const item = items[0];
        const nft = auction.nfts?.find(n =>
          normalizeTokenId(n.tokenId) === normalizeTokenId(item.token_id)
        );
        // Eternum listings have auction.nfts = []; build synthetic NFT from item so the card shows
        const syntheticNft: FormattedNFT | null =
          auction.source === "eternum" && !nft
            ? {
                metadataName: "",
                metadataDescription: "",
                contractAddress: normalizeContractAddress(item.contract_address || ""),
                imagePath: "",
                metadata: null,
                attributes: [],
                name: "",
                symbol: "",
                tokenId: normalizeTokenId(item.token_id),
              }
            : null;
        const displayNft = nft ?? syntheticNft;
        if (displayNft) {
          nfts.push({
            ...displayNft,
            auctionId: auctionIdStr,
            auctionName: auction.name,
            price,
            highestBid,
            startingPrice,
            endTime: auction.end_time,
            status: auction.status,
            isPack: false,
            reserveTokenSymbol,
            reserveTokenAddress,
            listingSource,
          });
        }
      }
    }

    return nfts;
  }, [auctions, getAuctionItems, selectedCollection]);

  // Eternum beasts: items that need metadata (empty attributes = synthetic from Eternum)
  const beastMetadataItemsToFetch = useMemo(() => {
    if (selectedCollection !== "beasts") return [];
    const items: Array<{ contractAddress: string; tokenId: string }> = [];
    for (const nft of allNFTsWithAuction) {
      const hasNoMetadata = !nft.attributes?.length && nft.contractAddress && nft.tokenId;
      if (hasNoMetadata) {
        items.push({
          contractAddress: normalizeContractAddress(nft.contractAddress),
          tokenId: nft.tokenId,
        });
      }
    }
    return items;
  }, [selectedCollection, allNFTsWithAuction]);

  useEffect(() => {
    if (beastMetadataItemsToFetch.length === 0) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/beast-metadata", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: beastMetadataItemsToFetch }),
        });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const nfts = Array.isArray(data?.nfts) ? data.nfts : [];
        const keys = beastMetadataItemsToFetch.map(
          (i) => `${normalizeContractAddress(i.contractAddress)}:${normalizeTokenId(i.tokenId)}`
        );
        setBeastMetadataByKey((prev) => {
          const next = { ...prev };
          keys.forEach((key, idx) => {
            if (nfts[idx] != null) next[key] = nfts[idx] as FormattedNFT;
          });
          return next;
        });
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [beastMetadataItemsToFetch]);

  const adventurerTokenIds = useMemo(() => {
    if (selectedCollection !== "adventurers" || allNFTsWithAuction.length === 0) return [];
    const ids: string[] = [];
    for (const nft of allNFTsWithAuction) {
      if (nft.isPack && nft.packNfts?.length) {
        for (const p of nft.packNfts) {
          const id = toDecimalTokenId(p.tokenId);
          if (id) ids.push(id);
        }
      } else {
        const id = toDecimalTokenId(nft.tokenId);
        if (id) ids.push(id);
      }
    }
    return Array.from(new Set(ids)).filter(Boolean);
  }, [selectedCollection, allNFTsWithAuction]);

  const tokenIdsToRequest = useMemo(() => {
    return adventurerTokenIds.filter((id) => !attributesByTokenId[String(id)]?.length);
  }, [adventurerTokenIds, attributesByTokenId]);

  useEffect(() => {
    if (selectedCollection !== "adventurers" || adventurerTokenIds.length === 0) {
      setGameOverByTokenId({});
      setIsLoadingGameOver(false);
      return;
    }

    const fetchId = ++gameOverFetchRef.current;

    const buildGameOverFromAttrs = (attrsByToken: Record<string, Array<{ trait_type: string; value: string }>>) => {
      const gameOverMap: Record<string, boolean> = {};
      for (const id of adventurerTokenIds) {
        const dec = String(id);
        const attrs = attrsByToken[dec];
        const attr = attrs?.find((a) => (a.trait_type?.toLowerCase() ?? "") === "game over");
        const value = attr?.value;
        const dead =
          value === "True" ||
          value === "true" ||
          value === "1" ||
          (value as string | undefined | boolean) === true;
        const hexShort = "0x" + BigInt(dec).toString(16).toLowerCase();
        const hexNormalized = normalizeTokenId(dec);
        gameOverMap[dec] = dead;
        gameOverMap[hexShort] = dead;
        gameOverMap[hexNormalized] = dead;
      }
      return gameOverMap;
    };

    if (tokenIdsToRequest.length === 0) {
      setIsLoadingGameOver(true);
      setGameOverByTokenId(buildGameOverFromAttrs(attributesByTokenId));
      setIsLoadingGameOver(false);
      return;
    }

    setIsLoadingGameOver(true);
    (async () => {
      try {
        const res = await fetch("/api/adventurer-attributes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tokenIds: tokenIdsToRequest }),
          cache: "no-store",
        });
        if (fetchId !== gameOverFetchRef.current) return;
        if (!res.ok) {
          setIsLoadingGameOver(false);
          return;
        }
        const data = await res.json();
        const rawResults = Array.isArray(data.results) ? data.results : [];
        const results = rawResults.map((r: { tokenId: string; attributes?: Array<{ trait_type?: string; value?: string }> }) => {
          const attributes = Array.isArray(r.attributes) ? r.attributes : [];
          const attr = attributes.find((a: { trait_type?: string }) => (a.trait_type?.toLowerCase() ?? "") === "game over");
          const value = attr?.value;
          const dead =
            value === "True" ||
            value === "true" ||
            value === "1" ||
            (value as string | undefined | boolean) === true;
          return { tokenId: String(r.tokenId), dead, attributes };
        });
        if (fetchId !== gameOverFetchRef.current) return;
        const attrsMap: Record<string, Array<{ trait_type: string; value: string }>> = {};
        const fetchedByDec = new Set<string>();
        for (const { tokenId, dead, attributes } of results) {
          const decimal = String(tokenId);
          const hexShort = "0x" + BigInt(tokenId).toString(16).toLowerCase();
          const hexNormalized = normalizeTokenId(tokenId);
          fetchedByDec.add(decimal);
          if (attributes.length > 0) {
            attrsMap[decimal] = attributes;
            attrsMap[hexShort] = attributes;
            attrsMap[hexNormalized] = attributes;
          }
        }
        mergeAttributes(attrsMap);
        setGameOverByTokenId((prev) => {
          const next = { ...prev };
          for (const id of adventurerTokenIds) {
            const dec = String(id);
            const hexShort = "0x" + BigInt(dec).toString(16).toLowerCase();
            const hexNormalized = normalizeTokenId(dec);
            if (fetchedByDec.has(dec)) {
              const r = results.find((x: { tokenId: string; dead: boolean }) => String(x.tokenId) === dec);
              if (r) {
                next[dec] = r.dead;
                next[hexShort] = r.dead;
                next[hexNormalized] = r.dead;
              }
            } else {
              const attrs = attrsMap[dec] ?? attributesByTokenId[dec];
              const attr = attrs?.find((a) => (a.trait_type?.toLowerCase() ?? "") === "game over");
              const value = attr?.value;
              const dead =
                value === "True" ||
                value === "true" ||
                value === "1" ||
                (value as string | undefined | boolean) === true;
              next[dec] = dead;
              next[hexShort] = dead;
              next[hexNormalized] = dead;
            }
          }
          return next;
        });
        setIsLoadingGameOver(false);
      } catch {
        if (fetchId === gameOverFetchRef.current) setIsLoadingGameOver(false);
      }
    })();
  }, [selectedCollection, adventurerTokenIds, tokenIdsToRequest, attributesByTokenId, mergeAttributes]);

  // Fetch battle status (in_battle) for adventurers from Torii GameSettings
  useEffect(() => {
    if (selectedCollection !== "adventurers") {
      setInBattleByTokenId({});
      return;
    }
    let cancelled = false;
    fetch("/api/adventurer-attributes", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : {}))
      .then((data: Record<string, boolean>) => {
        if (!cancelled) setInBattleByTokenId(data ?? {});
      })
      .catch(() => { if (!cancelled) setInBattleByTokenId({}); });
    return () => { cancelled = true; };
  }, [selectedCollection]);

  // Merge fetched attributes into NFT list so filterNFT (Level, Health, stats) sees them.
  // Adventurers: API-fetched attributes. Beasts: Eternum listings get metadata from beast-metadata API (contract+tokenId).
  const nftsWithAttributes = useMemo(() => {
    if (selectedCollection === "adventurers") {
      return allNFTsWithAuction.map((nft) => {
        const decimal = toDecimalTokenId(nft.tokenId);
        const normalized = decimal ? normalizeTokenId(decimal) : "";
        const fetched =
          (decimal && attributesByTokenId[decimal]) ??
          attributesByTokenId[nft.tokenId] ??
          (normalized && attributesByTokenId[normalized]);
        const merged = fetched && fetched.length > 0 ? fetched : (nft.attributes ?? []);
        return { ...nft, attributes: merged };
      });
    }
    if (selectedCollection === "beasts") {
      return allNFTsWithAuction.map((nft) => {
        const key = `${normalizeContractAddress(nft.contractAddress)}:${normalizeTokenId(nft.tokenId)}`;
        const meta = beastMetadataByKey[key];
        if (meta) return { ...nft, ...meta };
        return nft;
      });
    }
    return allNFTsWithAuction;
  }, [selectedCollection, allNFTsWithAuction, attributesByTokenId, beastMetadataByKey]);

  // Filter NFTs - uses nftsWithAttributes so Level/Health/stats filters work (attributes from API)
  const filteredNFTs = useMemo((): NFTWithAuction[] => {
    let result = applyFiltersToNFTs(nftsWithAttributes, filters);

    // Filter: only alive adventurers (if enabled) using API-fetched Game Over when available
    if (selectedCollection === "adventurers" && showOnlyAlive) {
      if (!isLoadingGameOver && Object.keys(gameOverByTokenId).length > 0) {
        result = result.filter((nft) => {
          const tokenIdNum = nft.tokenId.startsWith("0x")
            ? parseInt(nft.tokenId, 16).toString()
            : nft.tokenId;
          const dead = gameOverByTokenId[tokenIdNum] ?? gameOverByTokenId[nft.tokenId];
          return !dead;
        });
      } else {
        // Fallback: use NFT attributes if present (e.g. from GraphQL)
        result = result.filter((nft) => {
          const gameOverAttr = nft.attributes?.find(
            (a) => (a.trait_type?.toLowerCase() ?? "") === "game over"
          );
          const value = gameOverAttr?.value;
          if (value === undefined || value === null) return true;
          const dead =
            value === "True" ||
            value === "true" ||
            value === "1" ||
            (value as string | undefined | boolean) === true;
          return !dead;
        });
      }
    }

    // Battle filter: in = only in battle, out = only not in battle
    if (selectedCollection === "adventurers" && filters.battleFilter) {
      if (filters.battleFilter === "in") {
        result = result.filter((nft) => {
          const dec = toDecimalTokenId(nft.tokenId);
          const norm = normalizeTokenId(nft.tokenId);
          return inBattleByTokenId[dec] === true || inBattleByTokenId[norm] === true;
        });
      } else if (filters.battleFilter === "out") {
        result = result.filter((nft) => {
          const dec = toDecimalTokenId(nft.tokenId);
          const norm = normalizeTokenId(nft.tokenId);
          return inBattleByTokenId[dec] !== true && inBattleByTokenId[norm] !== true;
        });
      }
    }

    // Filter: exclude expired auctions (beasts)
    if (selectedCollection === "beasts" && excludeExpired) {
      result = result.filter((nft) => {
        const nftWithAuction = nft as NFTWithAuction;
        const endTime = nftWithAuction.endTime ?? "";
        const status = nftWithAuction.status ?? "";
        return !isAuctionExpired(endTime, status);
      });
    }

    return result as NFTWithAuction[];
  }, [
    nftsWithAttributes,
    filters,
    filters.id,
    filters.search,
    filters.beast,
    filters.type,
    filters.tier,
    filters.summitTop15,
    filters.priceSort,
    filters.timeSort,
    filters.tokenIdSort,
    filters.tierSort,
    filters.powerSort,
    filters.levelMin,
    filters.levelMax,
    filters.healthMin,
    filters.healthMax,
    filters.strengthMin,
    filters.strengthMax,
    filters.dexterityMin,
    filters.dexterityMax,
    filters.vitalityMin,
    filters.vitalityMax,
    filters.intelligenceMin,
    filters.intelligenceMax,
    filters.wisdomMin,
    filters.wisdomMax,
    filters.charismaMin,
    filters.charismaMax,
    filters.battleFilter,
    selectedCollection,
    showOnlyAlive,
    excludeExpired,
    isLoadingGameOver,
    gameOverByTokenId,
    inBattleByTokenId,
  ]);

  // List with all filters EXCEPT numeric stat bounds. Uses nftsWithAttributes so bounds reflect API attributes.
  const filteredForBounds = useMemo(() => {
    const filtersNoStat = getFiltersWithoutStatBounds(filters);
    let result = applyFiltersToNFTs(nftsWithAttributes, filtersNoStat);
    if (selectedCollection === "adventurers" && showOnlyAlive) {
      if (!isLoadingGameOver && Object.keys(gameOverByTokenId).length > 0) {
        result = result.filter((nft) => {
          const tokenIdNum = nft.tokenId.startsWith("0x") ? parseInt(nft.tokenId, 16).toString() : nft.tokenId;
          const dead = gameOverByTokenId[tokenIdNum] ?? gameOverByTokenId[nft.tokenId];
          return !dead;
        });
      } else {
        result = result.filter((nft) => {
          const gameOverAttr = nft.attributes?.find((a) => (a.trait_type?.toLowerCase() ?? "") === "game over");
          const value = gameOverAttr?.value;
          if (value === undefined || value === null) return true;
          const dead =
          value === "True" ||
          value === "true" ||
          value === "1" ||
          (value as string | undefined | boolean) === true;
          return !dead;
        });
      }
    }
    if (selectedCollection === "adventurers" && filters.battleFilter) {
      if (filters.battleFilter === "in") {
        result = result.filter((nft) => {
          const dec = toDecimalTokenId(nft.tokenId);
          const norm = normalizeTokenId(nft.tokenId);
          return inBattleByTokenId[dec] === true || inBattleByTokenId[norm] === true;
        });
      } else if (filters.battleFilter === "out") {
        result = result.filter((nft) => {
          const dec = toDecimalTokenId(nft.tokenId);
          const norm = normalizeTokenId(nft.tokenId);
          return inBattleByTokenId[dec] !== true && inBattleByTokenId[norm] !== true;
        });
      }
    }
    if (selectedCollection === "beasts" && excludeExpired) {
      result = result.filter((nft) => {
        const nftWithAuction = nft as NFTWithAuction;
        const endTime = nftWithAuction.endTime ?? "";
        const status = nftWithAuction.status ?? "";
        return !isAuctionExpired(endTime, status);
      });
    }
    return result;
  }, [nftsWithAttributes, filters.search, filters.id, filters.beast, filters.type, filters.tier, filters.summitTop15, filters.battleFilter, selectedCollection, showOnlyAlive, excludeExpired, isLoadingGameOver, gameOverByTokenId, inBattleByTokenId]);

  // Bounds from list *before* stat filters (so bounds don't change when user types min/max)
  const computedAdventurerBounds = useMemo(
    () => (selectedCollection === "adventurers" ? computeAdventurerStatBounds(filteredForBounds) : null),
    [selectedCollection, filteredForBounds]
  );

  const [apiAdventurerBounds, setApiAdventurerBounds] = useState<AdventurerStatBounds | null>(null);

  // Pagination: only GRID_PAGE_SIZE cards render at a time; filters apply to full list
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredNFTs.length / GRID_PAGE_SIZE));
  }, [filteredNFTs.length]);

  const visibleNFTs = useMemo(() => {
    const startIndex = (gridCurrentPage - 1) * GRID_PAGE_SIZE;
    return filteredNFTs.slice(startIndex, startIndex + GRID_PAGE_SIZE);
  }, [gridCurrentPage, filteredNFTs]);

  // Stable key: only refetch stat-bounds API when the set of token IDs changes (not when user moves sliders)
  const boundsTokenIdKey = useMemo(() => {
    if (selectedCollection !== "adventurers" || filteredForBounds.length === 0) return "";
    const ids = Array.from(
      new Set(
        filteredForBounds.map((n) =>
          n.tokenId.startsWith("0x") || n.tokenId.startsWith("0X")
            ? parseInt(n.tokenId, 16).toString()
            : n.tokenId
        )
      )
    )
      .sort()
      .slice(0, STAT_BOUNDS_MAX_TOKENS);
    return ids.join(",");
  }, [selectedCollection, filteredForBounds]);

  useEffect(() => {
    if (!boundsTokenIdKey) {
      setApiAdventurerBounds(null);
      return;
    }
    const tokenIds = boundsTokenIdKey.split(",");
    const q = tokenIds.map((id) => encodeURIComponent(id)).join(",");
    fetch(`/api/adventurer-stat-bounds?tokenIds=${q}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setApiAdventurerBounds(data ?? null))
      .catch(() => setApiAdventurerBounds(null));
  }, [boundsTokenIdKey]);

  const adventurerStatBounds = selectedCollection === "adventurers" ? (apiAdventurerBounds ?? computedAdventurerBounds) : null;

  // Reset grid page when filters, collection, or only-alive toggle changes
  useEffect(() => {
    setGridCurrentPage(1);
  }, [filters, selectedCollection, showOnlyAlive, excludeExpired]);

  useEffect(() => {
    setSelectedKeys([]);
  }, [selectedCollection]);

  // When modal is open, the "current auction" is the clicked NFT's auction
  const modalAuctionId = isModalOpen && filteredNFTs[selectedNFTIndex] ? String(filteredNFTs[selectedNFTIndex].auctionId) : "";
  const currentModalNft = isModalOpen && filteredNFTs[selectedNFTIndex] ? filteredNFTs[selectedNFTIndex] : null;

  // For pack: modal shows pack items to swipe; for single: one item
  const modalNfts = useMemo(() => {
    if (!currentModalNft) return [];
    return currentModalNft.isPack ? (currentModalNft.packNfts ?? []) : [currentModalNft];
  }, [currentModalNft]);
  const modalCurrentIndex = currentModalNft?.isPack ? selectedPackItemIndex : 0;
  const modalOnNavigate = useCallback((index: number) => {
    if (currentModalNft?.isPack) setSelectedPackItemIndex(index);
    else setSelectedNFTIndex(index);
  }, [currentModalNft?.isPack]);

  const selectedCollectionForModal = useMemo((): Collection | undefined => {
    if (!modalAuctionId) return undefined;
    const auction = auctions.find((a) => String(a.auction_id) === modalAuctionId);
    if (!auction) return undefined;
    const isEternum = auction.source === "eternum";
    const feeTokenRaw = (auction as { fee_token?: string }).fee_token;
    const feeToken = feeTokenRaw ? normalizeContractAddress(feeTokenRaw) : undefined;
    let reserveToken = feeToken ? getTokenByAddress(feeToken) : undefined;
    if (isEternum && feeToken && normalizeContractAddress(LORDS_ADDRESS).toLowerCase() === feeToken.toLowerCase()) {
      reserveToken = { ...(reserveToken ?? { address: LORDS_ADDRESS, symbol: "LORDS", name: "Lords", decimals: 18 }), decimals: 18 };
    }
    const decimals = isEternum ? (reserveToken?.decimals ?? 18) : (reserveToken?.decimals ?? 6);
    const startingPriceRaw = auction.starting_price ?? (auction as { startingPrice?: string }).startingPrice;
    const startingPrice = parseAmount(startingPriceRaw, decimals);
    const rawBid = auction.current_bid ? parseAmount(auction.current_bid, decimals) : undefined;
    const highestBid = rawBid != null && rawBid > 0 ? rawBid : undefined;
    return {
      id: String(auction.auction_id),
      name: auction.name || `Auction ${auction.auction_id}`,
      totalMonsters: parseInt(auction.item_count) || 0,
      startingPrice,
      highestBid,
      image: "/logo.png",
      status: auction.status,
      endTime: auction.end_time,
      sellerFull: auction.seller || "",
      highestBidderFull: auction.highest_bidder || "",
      reserveTokenSymbol: reserveToken?.symbol,
      reserveTokenAddress: reserveToken?.address,
    };
  }, [modalAuctionId, auctions]);

  const paginatedFilteredAuctionsForModal = useMemo(() => {
    if (!selectedCollectionForModal) return [];
    const auction = auctions.find((a) => String(a.auction_id) === selectedCollectionForModal.id);
    return auction ? [auction] : [];
  }, [selectedCollectionForModal, auctions]);

  const {
    handlePlaceBid,
    placeBidForAuction,
    handleMakeOffer,
    isSubmitting,
    isSubmittingOffer,
    insufficientFundsError,
  } = useBidActions({
    selectedCollectionId: modalAuctionId,
    selectedCollection: selectedCollectionForModal,
    paymentToken,
    tokenPrice,
    bidAmountToken,
    paginatedFilteredAuctions: paginatedFilteredAuctionsForModal,
    onTokenPriceUpdate: setTokenPrice,
  });

  // Sync local bid amount with hook (modal uses controlled input)
  const onBidAmountChange = useCallback((amount: string) => {
    setBidAmountToken(amount);
  }, []);

  // Fetch user's pending offer for the modal's auction
  useEffect(() => {
    if (!modalAuctionId || !address) {
      setUserOffer(null);
      return;
    }
    const auction = auctions.find((a) => String(a.auction_id) === modalAuctionId);
    if (!auction?.offers?.length) {
      setUserOffer(null);
      return;
    }
    const normalizedUser = normalizeContractAddress(address).toLowerCase();
    const pending = auction.offers.find((o) => normalizeContractAddress(o.buyer).toLowerCase() === normalizedUser);
    if (pending) {
      const amountValue = String(pending.amount).startsWith("0x") ? parseInt(pending.amount, 16) / 1e6 : parseFloat(pending.amount) / 1e6;
      setUserOffer({
        buyer: pending.buyer,
        amount: amountValue,
        status: pending.status,
        createdAt: pending.created_at || "",
        expiresAt: pending.expires_at || "",
      });
    } else {
      setUserOffer(null);
    }
  }, [modalAuctionId, address, auctions]);

  // Reset bid amount when modal opens for a new auction
  useEffect(() => {
    if (modalAuctionId) setBidAmountToken("");
  }, [modalAuctionId]);

  // Token options for payment dropdown (balance can load async)
  const tokenOptions = useMemo(() => {
    return SUPPORTED_TOKENS.map((token) => {
      const balanceInfo = address && tokenBalances[token.address];
      let balanceDisplay = "—";
      if (address && balanceInfo) {
        balanceDisplay = balanceInfo.usdValue ?? formatUSD(0);
      }
      return {
        value: token.address,
        label: token.symbol,
        balance: balanceDisplay,
        logo: undefined,
      };
    });
  }, [address, tokenBalances]);

  const itemKey = useCallback((nft: NFTWithAuction) =>
    nft.isPack ? `${nft.auctionId}-pack` : `${nft.auctionId}-${nft.tokenId}`, []);

  const toggleSelection = useCallback((key: string) => {
    setSelectedKeys((prev) =>
      prev.includes(key)
        ? prev.filter((k) => k !== key)
        : prev.length >= MAX_AUCTION_NFT_SELECTION
          ? prev
          : [...prev, key]
    );
  }, []);

  const selectAll = useCallback(() => {
    const keys = filteredNFTs
      .slice(0, MAX_AUCTION_NFT_SELECTION)
      .map((nft) => itemKey(nft));
    setSelectedKeys(keys);
  }, [filteredNFTs, itemKey]);

  const clearSelection = useCallback(() => {
    setSelectedKeys([]);
    setIsBulkBuyModalOpen(false);
  }, []);

  const openBulkBuyModal = useCallback(() => {
    if (selectedKeys.length > 0) setIsBulkBuyModalOpen(true);
  }, [selectedKeys.length]);

  const selectedNFTsForBulk = useMemo(
    () => filteredNFTs.filter((nft) => selectedKeys.includes(itemKey(nft))),
    [filteredNFTs, selectedKeys, itemKey]
  );

  const uniqueAuctionIdsForBulk = useMemo(() => {
    const ids = new Set(selectedNFTsForBulk.map((nft) => nft.auctionId));
    return Array.from(ids);
  }, [selectedNFTsForBulk]);

  const handleBulkPlaceBid = useCallback(async () => {
    const amount = parseFloat(bulkBidAmount);
    if (!account || !address || isNaN(amount) || amount <= 0 || uniqueAuctionIdsForBulk.length === 0) return;
    setIsBulkSubmitting(true);
    try {
      for (const auctionId of uniqueAuctionIdsForBulk) {
        const auction = auctions.find((a) => String(a.auction_id) === auctionId);
        if (!auction) continue;
        const feeTokenRaw = (auction as { fee_token?: string }).fee_token;
        const feeToken = feeTokenRaw ? normalizeContractAddress(feeTokenRaw) : undefined;
        const reserveToken = feeToken ? getTokenByAddress(feeToken) : undefined;
        const decimals = reserveToken?.decimals ?? 6;
        const startingPrice = parseAmount(auction.starting_price, decimals);
        const minimumBid = startingPrice * 1.02;
        await placeBidForAuction(auctionId, amount, minimumBid);
      }
      setBulkBidAmount("");
      setIsBulkBuyModalOpen(false);
      setSelectedKeys([]);
      toast.success("Bids placed", `Your bids have been submitted for ${uniqueAuctionIdsForBulk.length} auction(s).`);
    } catch (err) {
      console.error("Bulk bid error:", err);
      const msg = err instanceof Error ? err.message : "Failed to place bids";
      toast.error("Bulk bid failed", msg);
    } finally {
      setIsBulkSubmitting(false);
    }
  }, [account, address, bulkBidAmount, uniqueAuctionIdsForBulk, auctions, placeBidForAuction, toast]);

  const handleCardClick = useCallback((nft: NFTWithAuction, index: number) => {
    const key = nft.isPack ? `${nft.auctionId}-pack` : `${nft.auctionId}-${nft.tokenId}`;
    const globalIndex = filteredNFTs.findIndex(f => (f.isPack ? `${f.auctionId}-pack` : `${f.auctionId}-${f.tokenId}`) === key);
    setSelectedNFTIndex(globalIndex >= 0 ? globalIndex : 0);
    setSelectedPackItemIndex(0);
    setIsModalOpen(true);
  }, [filteredNFTs]);

  const attributesLoading =
    selectedCollection === "adventurers" &&
    (tokenIdsToRequest.length > 0 || isLoadingGameOver);
  const effectiveLoading = loading || attributesLoading;

  useEffect(() => {
    if (!effectiveLoading) {
      loadingStartRef.current = null;
      setLoadingProgress(100);
      const t = setTimeout(() => setLoadingProgress(0), 400);
      return () => clearTimeout(t);
    }
    loadingStartRef.current = Date.now();
    loadingProgressRef.current = 0;
    setLoadingProgress(0);
    setLoadingFlavorIndex(0);

    const progressInterval = setInterval(() => {
      const start = loadingStartRef.current ?? Date.now();
      const elapsed = Date.now() - start;
      const target = 92 * (1 - Math.exp(-elapsed / 2200));
      const current = loadingProgressRef.current;
      const next = Math.min(92, current + (target - current) * 0.12);
      loadingProgressRef.current = next;
      setLoadingProgress(Math.round(next));
    }, 80);

    const flavorInterval = setInterval(() => {
      setLoadingFlavorIndex((i) =>
        i < LOADING_FLAVOR_TEXTS.length - 1 ? i + 1 : i
      );
    }, 2200);

    return () => {
      clearInterval(progressInterval);
      clearInterval(flavorInterval);
    };
  }, [effectiveLoading]);

  const renderContent = () => {
    if (effectiveLoading) {
      const flavorText = LOADING_FLAVOR_TEXTS[loadingFlavorIndex % LOADING_FLAVOR_TEXTS.length];
      return (
        <div className="flex flex-col flex-1 min-h-0 w-full">
          <div className="shrink-0 mb-3 flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2 text-[10px] font-orbitron uppercase tracking-wide text-[rgb(186,255,188)]/90">
              <span>{flavorText}</span>
              <span className="tabular-nums text-[rgb(50,255,52)]">{loadingProgress}%</span>
            </div>
            <div className="w-full h-1.5 bg-[rgb(50,255,52)]/20 rounded-full overflow-hidden" role="progressbar" aria-valuenow={loadingProgress} aria-valuemin={0} aria-valuemax={100} aria-valuetext={`${loadingProgress}%`}>
              <div
                className="h-full bg-[rgb(50,255,52)]/70 rounded-full transition-[width] duration-150 ease-out"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
          </div>
          <BidsSkeleton />
        </div>
      );
    }

    if (error) {
      return (
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-center gap-4 px-4 py-12">
          <p className="text-red-400">Error loading auctions: {error.message}</p>
        </div>
      );
    }

    if (filteredNFTs.length === 0) {
      return (
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-center gap-4 px-4 py-12">
          <p className="text-[rgb(186,255,188)]/70">No items found matching your filters.</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col flex-1 min-h-0 w-full">
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div key={`${filteredNFTs.length}-${gridCurrentPage}-${filters.levelMin}-${filters.levelMax}-${filters.healthMin}-${filters.healthMax}`} className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6 w-full">
            {visibleNFTs.map((nft, index) => {
              const key = itemKey(nft);
              if (nft.isPack && nft.packNfts?.length) {
                const packExpired = selectedCollection === "beasts" && isAuctionExpired(nft.endTime ?? "", nft.status ?? "");
                return (
                  <div key={`${nft.auctionId}-pack-${index}`} className="h-full min-h-0 flex flex-col">
                    <PackCard
                      collection={selectedCollection}
                      packNfts={nft.packNfts}
                      packSize={nft.packSize ?? nft.packNfts.length}
                      price={nft.price}
                      reserveTokenSymbol={nft.reserveTokenSymbol}
                      auctionName={nft.auctionName}
                      adventurerAttributesByTokenId={selectedCollection === "adventurers" ? attributesByTokenId : undefined}
                      selected={selectedKeys.includes(key)}
                      onToggle={() => toggleSelection(key)}
                      onInfoClick={() => handleCardClick(nft, index)}
                      priceLabel={packExpired ? "Price" : undefined}
                      expired={packExpired}
                    />
                  </div>
                );
              }
              const CardComponent = selectedCollection === "beasts" ? MonsterCard : AdventurerCard;
              const inBattle = selectedCollection === "adventurers" && (inBattleByTokenId[toDecimalTokenId(nft.tokenId)] === true || inBattleByTokenId[normalizeTokenId(nft.tokenId)] === true);
              const beastExpired = selectedCollection === "beasts" && isAuctionExpired(nft.endTime ?? "", nft.status ?? "");
              return (
                <div key={`${nft.auctionId}-${nft.tokenId}-${index}`} className="h-full min-h-0 flex flex-col">
                  <CardComponent
                    nft={nft}
                    selected={selectedKeys.includes(key)}
                    onToggle={() => toggleSelection(key)}
                    onInfoClick={() => handleCardClick(nft, index)}
                    price={nft.price}
                    reserveTokenSymbol={nft.reserveTokenSymbol}
                    auctionName={nft.auctionName}
                    inBattle={selectedCollection === "adventurers" ? inBattle : undefined}
                    priority={selectedCollection === "adventurers" && index === 0}
                    {...(selectedCollection === "beasts" ? { priceLabel: beastExpired ? "Price" : "Buy", expired: beastExpired } : {})}
                  />
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex justify-center py-4 mt-4 border-t border-white/10 shrink-0">
          <Pagination
            currentPage={gridCurrentPage}
            totalPages={totalPages}
            onPageChange={setGridCurrentPage}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-2 sm:px-4 min-h-[70vh]">
      {/* Mobile: Collection selector + action bar stacked; Desktop: COLLECTION label + action bar in row */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-6">
        {/* Mobile collection selector */}
        <div className="md:hidden">
          <CollectionSelector
            selectedCollection={selectedCollection}
            onCollectionChange={setSelectedCollection}
          />
        </div>
        {/* Desktop: just the label (selector is in sidebar) */}
        <span className="hidden md:block text-[11px] font-orbitron uppercase tracking-[0.16em] text-[rgb(186,255,188)]/70 shrink-0">
          Collection
        </span>
        {!effectiveLoading && !error && filteredNFTs.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center justify-start md:justify-end">
            <button
              type="button"
              onClick={selectAll}
              className="inline-flex items-center justify-center rounded-full border border-[rgb(50,255,52)]/40 bg-[rgb(50,255,52)]/10 px-4 py-1.5 text-xs font-orbitron uppercase tracking-[0.14em] text-[rgb(50,255,52)] transition hover:bg-[rgb(50,255,52)]/20 hover:cursor-pointer"
            >
              Select All ({Math.min(filteredNFTs.length, MAX_AUCTION_NFT_SELECTION)} max)
            </button>
            <button
              type="button"
              onClick={clearSelection}
              disabled={selectedKeys.length === 0}
              className={`inline-flex items-center justify-center rounded-full border px-4 py-1.5 text-xs font-orbitron uppercase tracking-[0.14em] transition ${
                selectedKeys.length > 0
                  ? "border-white/40 text-white hover:border-[rgb(50,255,52)] hover:text-[rgb(50,255,52)] hover:cursor-pointer"
                  : "border-white/20 text-white/30"
              }`}
            >
              Clear
            </button>
            <CustomDropdown
              id="sort-buy"
              value={sortDropdownValue}
              onChange={setSortFromDropdown}
              options={
                selectedCollection === "beasts"
                  ? [
                      { value: "price-high-low", label: "Price ↓" },
                      { value: "price-low-high", label: "Price ↑" },
                      { value: "time-ending-soon", label: "Ending soon" },
                      { value: "time-newest", label: "Newest" },
                      { value: "level-low-high", label: "Level ↑" },
                      { value: "level-high-low", label: "Level ↓" },
                      { value: "tier-low-high", label: "Tier ↑" },
                      { value: "tier-high-low", label: "Tier ↓" },
                      { value: "power-low-high", label: "Power ↑" },
                      { value: "power-high-low", label: "Power ↓" },
                      { value: "tokenId-low-high", label: "Token ID ↑" },
                      { value: "tokenId-high-low", label: "Token ID ↓" },
                    ]
                  : [
                      { value: "price-high-low", label: "Price ↓" },
                      { value: "price-low-high", label: "Price ↑" },
                      { value: "time-ending-soon", label: "Ending soon" },
                      { value: "time-newest", label: "Newest" },
                      { value: "level-low-high", label: "Level ↑" },
                      { value: "level-high-low", label: "Level ↓" },
                      { value: "score-low-high", label: "Score ↑" },
                      { value: "score-high-low", label: "Score ↓" },
                      { value: "tokenId-low-high", label: "Token ID ↑" },
                      { value: "tokenId-high-low", label: "Token ID ↓" },
                    ]
              }
              variant="bar"
            />
            {selectedKeys.length > 0 && (
              <button
                type="button"
                onClick={openBulkBuyModal}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[rgb(50,255,52)] bg-[rgb(50,255,52)]/20 px-5 py-2.5 text-sm font-orbitron uppercase tracking-[0.14em] text-[rgb(50,255,52)] transition hover:bg-[rgb(50,255,52)]/30 hover:cursor-pointer"
              >
                Buy {selectedKeys.length} {selectedCollection === "adventurers" ? "Adventurers" : "Beasts"}
              </button>
            )}
          </div>
        )}
      </div>
      {/* Main content row: Sidebar filters (desktop) + Cards grid */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-6 min-h-[60vh] min-w-0 md:items-start">
        {/* Mobile: quick filters inline */}
        <div className="flex md:hidden flex-wrap gap-2 items-center">
          {selectedCollection === "adventurers" && (
            <>
              <label className="flex items-center gap-1.5 cursor-pointer rounded-full border border-[rgb(50,255,52)]/30 bg-black/40 px-3 py-1.5">
                <input
                  type="checkbox"
                  checked={showOnlyAlive}
                  onChange={(e) => setShowOnlyAlive(e.target.checked)}
                  className="w-3 h-3 rounded border-[rgb(50,255,52)]/40 bg-black/60 text-[rgb(50,255,52)] accent-[rgb(50,255,52)]"
                />
                <span className="text-[10px] font-orbitron uppercase tracking-wide text-[rgb(186,255,188)]/80">
                  Alive only
                </span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer rounded-full border border-[rgb(50,255,52)]/30 bg-black/40 px-3 py-1.5">
                <input
                  type="checkbox"
                  checked={filters.battleFilter === "out"}
                  onChange={(e) => setFilters((prev) => ({ ...prev, battleFilter: e.target.checked ? "out" : "" }))}
                  className="w-3 h-3 rounded border-[rgb(50,255,52)]/40 bg-black/60 text-[rgb(50,255,52)] accent-[rgb(50,255,52)]"
                />
                <span className="text-[10px] font-orbitron uppercase tracking-wide text-[rgb(186,255,188)]/80">
                  Not in battle
                </span>
              </label>
            </>
          )}
          {selectedCollection === "beasts" && (
            <label className="flex items-center gap-1.5 cursor-pointer rounded-full border border-[rgb(50,255,52)]/30 bg-black/40 px-3 py-1.5">
              <input
                type="checkbox"
                checked={excludeExpired}
                onChange={(e) => setExcludeExpired(e.target.checked)}
                className="w-3 h-3 rounded border-[rgb(50,255,52)]/40 bg-black/60 text-[rgb(50,255,52)] accent-[rgb(50,255,52)]"
              />
              <span className="text-[10px] font-orbitron uppercase tracking-wide text-[rgb(186,255,188)]/80">
                Exclude expired
              </span>
            </label>
          )}
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[rgb(50,255,52)]/40 bg-[rgb(50,255,52)]/10 px-3 py-1.5 text-[10px] font-orbitron uppercase tracking-[0.12em] text-[rgb(50,255,52)]"
          >
            Filters
            {Object.values(filters).filter((v) => v !== "").length > 0 && (
              <span className="rounded-full bg-[rgb(50,255,52)] min-w-[14px] px-1 py-0.5 text-[9px] text-black font-bold">
                {Object.values(filters).filter((v) => v !== "").length}
              </span>
            )}
          </button>
        </div>
        {/* Desktop sidebar */}
        <aside className="hidden md:flex shrink-0 flex-col gap-2 w-[260px] min-w-[260px] min-h-[200px]">
          <CollectionSelector
            selectedCollection={selectedCollection}
            onCollectionChange={setSelectedCollection}
            hideLabel
          />
          {selectedCollection === "adventurers" && (
            <div className="flex flex-col gap-2 rounded-md border border-[rgb(50,255,52)]/20 bg-black/40 p-2" role="group" aria-label="Adventurer filters">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOnlyAlive}
                  onChange={(e) => setShowOnlyAlive(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-[rgb(50,255,52)]/40 bg-black/60 text-[rgb(50,255,52)] focus:ring-[rgb(50,255,52)]/50 accent-[rgb(50,255,52)]"
                  aria-label="Exclude dead"
                />
                <span className="text-[10px] font-orbitron uppercase tracking-wide text-[rgb(186,255,188)]/80">
                  Exclude dead
                </span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.battleFilter === "out"}
                  onChange={(e) => setFilters((prev) => ({ ...prev, battleFilter: e.target.checked ? "out" : "" }))}
                  className="w-3.5 h-3.5 rounded border-[rgb(50,255,52)]/40 bg-black/60 text-[rgb(50,255,52)] focus:ring-[rgb(50,255,52)]/50 accent-[rgb(50,255,52)]"
                  aria-label="Exclude in battle"
                />
                <span className="text-[10px] font-orbitron uppercase tracking-wide text-[rgb(186,255,188)]/80">
                  Exclude in battle
                </span>
              </label>
            </div>
          )}
          {selectedCollection === "beasts" && (
            <div className="flex flex-col gap-2 rounded-md border border-[rgb(50,255,52)]/20 bg-black/40 p-2" role="group" aria-label="Beast filters">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={excludeExpired}
                  onChange={(e) => setExcludeExpired(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-[rgb(50,255,52)]/40 bg-black/60 text-[rgb(50,255,52)] focus:ring-[rgb(50,255,52)]/50 accent-[rgb(50,255,52)]"
                  aria-label="Exclude expired"
                />
                <span className="text-[10px] font-orbitron uppercase tracking-wide text-[rgb(186,255,188)]/80">
                  Exclude expired
                </span>
              </label>
            </div>
          )}
          {onRefresh && (
            <button
              type="button"
              onClick={handleRefresh}
              disabled={effectiveLoading || isRefreshing}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[rgb(50,255,52)]/40 bg-[rgb(50,255,52)]/10 px-4 py-2 text-xs font-orbitron uppercase tracking-[0.14em] text-[rgb(50,255,52)] transition hover:bg-[rgb(50,255,52)]/20 hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Reload auctions"
            >
              {(effectiveLoading || isRefreshing) ? (
                <>
                  <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[rgb(50,255,52)] border-t-transparent" />
                  Refreshing...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                    <path d="M16 21h5v-5" />
                  </svg>
                  Refresh
                </>
              )}
            </button>
          )}
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[rgb(50,255,52)]/40 bg-[rgb(50,255,52)]/10 px-3 py-1.5 text-[11px] font-orbitron uppercase tracking-[0.12em] text-[rgb(50,255,52)] transition hover:bg-[rgb(50,255,52)]/20"
            title="Show filters"
          >
            Filters
            {Object.values(filters).filter((v) => v !== "").length > 0 && (
              <span className="rounded-full bg-[rgb(50,255,52)] min-w-[16px] px-1 py-0.5 text-[10px] text-black font-bold">
                {Object.values(filters).filter((v) => v !== "").length}
              </span>
            )}
          </button>
          <Filters
            filters={filters}
            onFiltersChange={(updates) => {
              const u = updates as Record<string, unknown>;
              if (u && typeof u === "object" && "levelMin" in u && "levelMax" in u && "search" in u) {
                setFilters(updates as FilterState);
              } else {
                setFilters((prev) => ({ ...prev, ...updates }));
              }
            }}
            summitListedCount={0}
            collection={selectedCollection}
            isExpanded={filtersOpen}
            onToggleExpanded={setFiltersOpen}
            adventurerStatBounds={adventurerStatBounds}
            compact
          />
        </aside>
        <div className="min-w-0 flex-1 flex flex-col min-h-0">
          {renderContent()}
        </div>
      </div>

      {selectedCollection === "beasts" ? (
        <BeastDetailModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          nfts={modalNfts}
          currentIndex={modalCurrentIndex}
          onNavigate={modalOnNavigate}
          auctionId={modalAuctionId || undefined}
          listingSource={currentModalNft?.listingSource ?? (modalAuctionId ? (auctions.find((a) => String(a.auction_id) === modalAuctionId)?.source ?? "survivor_exchange") : undefined)}
          auctionBidData={currentModalNft ? {
            startingPrice: currentModalNft.startingPrice,
            highestBid: currentModalNft.highestBid,
            status: currentModalNft.status || "",
            endTime: currentModalNft.endTime || "",
            reserveTokenSymbol: currentModalNft.reserveTokenSymbol,
            reserveTokenAddress: currentModalNft.reserveTokenAddress,
            isUserSeller: !!(address && (() => {
              const auction = auctions.find((a) => String(a.auction_id) === currentModalNft.auctionId);
              return auction && normalizeContractAddress(address).toLowerCase() === normalizeContractAddress(auction.seller || "").toLowerCase();
            })()),
          } : undefined}
          bidState={{
            bidAmount: bidAmountToken,
            isSubmitting,
            isSubmittingOffer,
            hasActiveOffer: !!userOffer,
            account: !!account,
            paymentToken,
            tokenSymbol: SUPPORTED_TOKENS.find((t) => t.address.toLowerCase() === paymentToken.toLowerCase())?.symbol || "USDC",
            insufficientFundsError: insufficientFundsError || undefined,
          }}
          tokenOptions={tokenOptions}
          onBidAmountChange={onBidAmountChange}
          onPaymentTokenChange={setPaymentToken}
          onPlaceBid={handlePlaceBid}
          onMakeOffer={handleMakeOffer}
          onOpenWallet={openWalletModal}
          summitBeasts={[]}
        />
      ) : (
        <AdventurerDetailModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          nfts={modalNfts}
          currentIndex={modalCurrentIndex}
          onNavigate={modalOnNavigate}
          auctionId={modalAuctionId || undefined}
          listingSource={currentModalNft?.listingSource ?? (modalAuctionId ? (auctions.find((a) => String(a.auction_id) === modalAuctionId)?.source ?? "survivor_exchange") : undefined)}
          auctionBidData={currentModalNft ? (() => {
            const auction = auctions.find((a) => String(a.auction_id) === currentModalNft.auctionId);
            return {
              startingPrice: currentModalNft.startingPrice,
              highestBid: currentModalNft.highestBid,
              status: currentModalNft.status || "",
              endTime: currentModalNft.endTime || "",
              reserveTokenSymbol: currentModalNft.reserveTokenSymbol,
              reserveTokenAddress: currentModalNft.reserveTokenAddress,
              isUserSeller: !!(address && auction && normalizeContractAddress(address).toLowerCase() === normalizeContractAddress(auction.seller || "").toLowerCase()),
              sellerAddress: auction?.seller || undefined,
              auctionName: currentModalNft.auctionName,
            };
          })() : undefined}
          bidState={{
            bidAmount: bidAmountToken,
            isSubmitting,
            isSubmittingOffer,
            hasActiveOffer: !!userOffer,
            account: !!account,
            paymentToken,
            tokenSymbol: SUPPORTED_TOKENS.find((t) => t.address.toLowerCase() === paymentToken.toLowerCase())?.symbol || "USDC",
            insufficientFundsError: insufficientFundsError || undefined,
          }}
          tokenOptions={tokenOptions}
          onBidAmountChange={onBidAmountChange}
          onPaymentTokenChange={setPaymentToken}
          onPlaceBid={handlePlaceBid}
          onMakeOffer={handleMakeOffer}
          onOpenWallet={openWalletModal}
        />
      )}

      {/* Bulk buy modal */}
      {isBulkBuyModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={() => setIsBulkBuyModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="bulk-buy-modal-title"
        >
          <div
            className="relative w-full max-w-md rounded-2xl border border-[rgb(50,255,52)]/80 bg-black/90 shadow-[0_16px_40px_rgba(5,20,5,0.5)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[rgb(50,255,52)]/30">
              <h2 id="bulk-buy-modal-title" className="text-sm font-orbitron uppercase tracking-[0.14em] text-white">
                Buy {selectedKeys.length} {selectedCollection === "adventurers" ? "Adventurers" : "Beasts"} ({uniqueAuctionIdsForBulk.length} auction{uniqueAuctionIdsForBulk.length !== 1 ? "s" : ""})
              </h2>
              <button
                type="button"
                onClick={() => setIsBulkBuyModalOpen(false)}
                className="rounded-full p-2 text-[rgb(186,255,188)]/70 hover:text-white hover:bg-white/10 transition"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 flex flex-col gap-4">
              <p className="text-xs text-[rgb(186,255,188)]/70">
                Enter your bid amount (USDC). This amount will be placed on each of the {uniqueAuctionIdsForBulk.length} selected auction{uniqueAuctionIdsForBulk.length !== 1 ? "s" : ""}.
              </p>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-orbitron uppercase tracking-wider text-[rgb(186,255,188)]/70">
                  Bid amount (USDC) per auction
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={bulkBidAmount}
                  onChange={(e) => setBulkBidAmount(e.target.value)}
                  className="w-full rounded-xl border border-white/12 bg-black/60 px-4 py-2.5 text-sm font-orbitron text-white outline-none transition focus:border-[rgb(50,255,52)] focus:ring-2 focus:ring-[rgb(50,255,52)]/35 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleBulkPlaceBid}
                  disabled={!bulkBidAmount || parseFloat(bulkBidAmount) <= 0 || isBulkSubmitting || !address}
                  className={`inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-orbitron uppercase tracking-[0.14em] transition ${
                    bulkBidAmount && parseFloat(bulkBidAmount) > 0 && !isBulkSubmitting && address
                      ? "border border-[rgb(50,255,52)] bg-[rgb(50,255,52)]/10 text-[rgb(50,255,52)] hover:cursor-pointer hover:bg-[rgb(50,255,52)] hover:text-black"
                      : "border border-white/12 text-[rgb(186,255,188)]/45 cursor-not-allowed"
                  }`}
                >
                  {isBulkSubmitting ? "Placing bids..." : `Place bid on ${uniqueAuctionIdsForBulk.length} auction${uniqueAuctionIdsForBulk.length !== 1 ? "s" : ""}`}
                </button>
                <button
                  type="button"
                  onClick={() => setIsBulkBuyModalOpen(false)}
                  className="inline-flex items-center justify-center rounded-full border border-white/40 px-5 py-2.5 text-sm font-orbitron uppercase tracking-[0.14em] text-white hover:border-[rgb(50,255,52)] hover:text-[rgb(50,255,52)] transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
