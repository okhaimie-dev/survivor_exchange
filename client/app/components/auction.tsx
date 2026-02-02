import { useCallback, useMemo, useState, useEffect, useRef } from "react";
import { useAccount, useExplorer } from "@starknet-react/core";
import { byteArray } from "starknet";
import { MonsterCard, AdventurerCard } from "./cards";
import { CollectionSelector, Pagination, CustomDropdown } from "./ui";
import { Filters, type FilterState } from "./filters";
import { AuctionSkeleton } from "./skeletons";
import { BeastDetailModal, AdventurerDetailModal } from "./modals";
import type { FormattedNFT } from "../lib/types";
import { useToast } from "../providers/toast-provider";
import { useAdventurerAttributesOptional } from "../providers/adventurer-attributes-provider";
import { applyFiltersToNFTs, computeAdventurerStatBounds, getFiltersWithoutStatBounds, type AdventurerStatBounds } from "../lib/filter-utils";
import { AUCTION_CONTRACT_ADDRESS, DEFAULT_PAGE_SIZE, GRID_PAGE_SIZE, STAT_BOUNDS_MAX_TOKENS, DEFAULT_AUCTION_DURATION_MINUTES, SUPPORTED_TOKENS, USDC_ADDRESS, MAX_AUCTION_NFT_SELECTION, COLLECTIONS, CollectionType } from "../lib/constants";
import { fetchTokens } from "@avnu/avnu-sdk";
import { normalizeContractAddress, normalizeTokenId, toDecimalTokenId } from "../lib/utils/normalization";
function isListedToken(listedTokenIds: Set<string>, nftTokenId: string): boolean {
    const normalized = normalizeTokenId(nftTokenId);
    const decimal = toDecimalTokenId(nftTokenId);
    return listedTokenIds.has(normalized) || listedTokenIds.has(decimal);
}
import { useSummitLeaderboard, findMatchingSummitBeast, useMyNFTs, useMyAdventurerNFTs, useMyListings } from "../hooks";
import { useQuery } from "@apollo/client/react";
import { AUCTIONS_QUERY } from "../lib/queries";
import type { AuctionsResponse } from "../lib/types";

interface AuctionProps {
    nfts?: FormattedNFT[];
    loading?: boolean;
    error?: Error | null;
    /** When set (e.g. from ?wallet=0x...), load NFTs/listings for this address instead of connected wallet. */
    walletAddress?: string;
}

export default function Auction({ nfts: externalNfts, loading: externalLoading, error: externalError, walletAddress }: AuctionProps) {
    const [selectedCollection, setSelectedCollection] = useState<CollectionType>("adventurers");
    const collectionConfig = COLLECTIONS[selectedCollection];
    const { account, address } = useAccount();
    const dataAddress = walletAddress ?? address;
    const canCreateAuction = !walletAddress || (!!address && normalizeContractAddress(address) === normalizeContractAddress(walletAddress));

    // Fetch BEASTS NFTs via GraphQL (no auto-refresh; use Refresh button)
    const { nfts: beastsNfts, loading: beastsLoading, error: beastsError, refetch: refetchBeasts } = useMyNFTs({
        collectionAddress: collectionConfig.contractAddress,
        address: dataAddress,
    });

    // Fetch Adventurer NFTs via SQL (no auto-refresh; use Refresh button)
    const { nfts: adventurerNfts, loading: adventurerLoading, error: adventurerError, refetch: refetchAdventurers } = useMyAdventurerNFTs({ address: dataAddress });

    // Use appropriate NFTs based on selected collection
    const nfts = selectedCollection === "beasts" ? beastsNfts : adventurerNfts;
    const loading = selectedCollection === "beasts" ? beastsLoading : adventurerLoading;
    const error = selectedCollection === "beasts" ? beastsError : adventurerError;
    const explorer = useExplorer();
    const toast = useToast();
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedNFTIds, setSelectedNFTIds] = useState<string[]>([]);
    const [collectionName, setCollectionName] = useState<string>("");
    const [startingPriceUSD, setStartingPriceUSD] = useState<string>("");
    const [sellerToken, setSellerToken] = useState<string>(USDC_ADDRESS);
    const [tokenLogos, setTokenLogos] = useState<Record<string, string>>({});

    // Beast detail modal state
    const [isBeastModalOpen, setIsBeastModalOpen] = useState(false);
    const [selectedBeastIndex, setSelectedBeastIndex] = useState<number>(0);
    // Bulk auction modal (when multiple NFTs selected)
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    // Only alive filter (adventurers) - fetch Game Over from API
    const [showOnlyAlive, setShowOnlyAlive] = useState(true);
    // Exclude listed adventurers (Sell tab left filters)
    const [excludeListed, setExcludeListed] = useState(false);
    const [gameOverByTokenId, setGameOverByTokenId] = useState<Record<string, boolean>>({});
    const [isLoadingGameOver, setIsLoadingGameOver] = useState(false);
    const [attributeLoadProgress, setAttributeLoadProgress] = useState(0);
    const gameOverFetchRef = useRef(0);
    // Battle status (adventurers) - fetch in_battle from Torii GameSettings
    const [inBattleByTokenId, setInBattleByTokenId] = useState<Record<string, boolean>>({});
    // Shared adventurer attributes (batch + card fetches) so grid filtering (Level, Health, stats) works. Fallback to local state when provider is missing (e.g. SSR).
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

    const dateToLocalDateTimeString = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };
    
    const getDefaultDateTime = () => {
        const now = new Date();
        const defaultTime = new Date(now.getTime() + 40 * 60 * 1000);
        return dateToLocalDateTimeString(defaultTime);
    };
    const [endDateTime, setEndDateTime] = useState<string>(getDefaultDateTime());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [txnHash, setTxnHash] = useState<string | undefined>();
    const [durationError, setDurationError] = useState<string | null>(null);
    const [filters, setFilters] = useState<FilterState>({
        id: "", search: "", beast: "", type: "", tier: "",
        levelMin: "", levelMax: "", powerMin: "", powerMax: "", rankMin: "", rankMax: "",
        shiny: "", animated: "", priceSort: "", tokenIdSort: "low-high", levelSort: "", scoreSort: "", tierSort: "", powerSort: "", summitTop15: "", timeSort: "",
        healthMin: "", healthMax: "", strengthMin: "", strengthMax: "", dexterityMin: "", dexterityMax: "",
        vitalityMin: "", vitalityMax: "", intelligenceMin: "", intelligenceMax: "", wisdomMin: "", wisdomMax: "", charismaMin: "", charismaMax: "",
        battleFilter: "",
    });
    const [filtersOpen, setFiltersOpen] = useState(false);

    const sortDropdownValue = filters.timeSort === "ending-soon" ? "time-ending-soon" : filters.timeSort === "newest" ? "time-newest" : filters.levelSort === "low-high" ? "level-low-high" : filters.levelSort === "high-low" ? "level-high-low" : filters.scoreSort === "low-high" ? "score-low-high" : filters.scoreSort === "high-low" ? "score-high-low" : filters.tokenIdSort === "low-high" ? "tokenId-low-high" : filters.tokenIdSort === "high-low" ? "tokenId-high-low" : "tokenId-low-high";
    const setSortFromDropdown = useCallback((value: string) => {
        setFilters((prev) => ({
            ...prev,
            timeSort: value === "time-ending-soon" ? "ending-soon" : value === "time-newest" ? "newest" : "",
            priceSort: value === "price-low-high" ? "low-high" : value === "price-high-low" ? "high-low" : "",
            levelSort: value === "level-low-high" ? "low-high" : value === "level-high-low" ? "high-low" : "",
            scoreSort: value === "score-low-high" ? "low-high" : value === "score-high-low" ? "high-low" : "",
            tokenIdSort: value === "tokenId-low-high" ? "low-high" : value === "tokenId-high-low" ? "high-low" : "",
        }));
    }, []);

    // Fetch top 15 summit beasts
    const { topBeasts: summitTopBeasts, error: summitError } = useSummitLeaderboard(15);

    // Helper to check if an NFT matches any summit top 15 beast (by prefix+suffix or token ID)
    const nftMatchesSummitBeast = useCallback((nft: FormattedNFT) => {
        if (!summitTopBeasts.length) return false;

        // Get NFT attributes for name matching
        const prefixAttr = nft.attributes?.find(a => a.trait_type === "Prefix")?.value;
        const suffixAttr = nft.attributes?.find(a => a.trait_type === "Suffix")?.value;
        const nftPrefix = prefixAttr !== undefined ? String(prefixAttr) : undefined;
        const nftSuffix = suffixAttr !== undefined ? String(suffixAttr) : undefined;
        const nftBeastName = nft.beastName;
        const nftTokenId = nft.tokenId.startsWith("0x") || nft.tokenId.startsWith("0X")
            ? parseInt(nft.tokenId, 16)
            : parseInt(nft.tokenId);

        // Use the findMatchingSummitBeast function which checks token ID and prefix+suffix
        return findMatchingSummitBeast(nftPrefix, nftSuffix, nftBeastName, nftTokenId, summitTopBeasts) !== null;
    }, [summitTopBeasts]);

    const { listings } = useMyListings({ seller: dataAddress });
    const { data: auctionsData } = useQuery<AuctionsResponse>(AUCTIONS_QUERY, {
        fetchPolicy: "cache-and-network",
        errorPolicy: "all",
    });
    const listedTokenIds = useMemo(() => {
        if (!dataAddress || !listings?.length) return new Set<string>();
        const myAuctionIds = new Set(listings.map((l) => String(l.auctionId)));
        const items = auctionsData?.bm021AuctionItemModels?.edges?.map((e) => e.node) ?? [];
        const collectionContract = normalizeContractAddress(collectionConfig.contractAddress);
        const listed = new Set<string>();
        for (const item of items) {
            if (!myAuctionIds.has(String(item.auction_id))) continue;
            if (normalizeContractAddress(item.contract_address) !== collectionContract) continue;
            listed.add(normalizeTokenId(item.token_id));
            listed.add(toDecimalTokenId(item.token_id));
        }
        return listed;
    }, [dataAddress, listings, auctionsData, collectionConfig.contractAddress]);

    // Map tokenId -> reserve (starting price + symbol) and endTime for listed NFTs (Sell grid reserve display + Ending soon sort)
    const reserveByTokenId = useMemo(() => {
        const map: Record<string, { price: number; symbol?: string }> = {};
        if (!listings?.length || !auctionsData?.bm021AuctionItemModels?.edges) return map;
        const listingByAuctionId = new Map(listings.map((l) => [String(l.auctionId), l]));
        const items = auctionsData.bm021AuctionItemModels.edges.map((e) => e.node);
        const collectionContract = normalizeContractAddress(collectionConfig.contractAddress);
        for (const item of items) {
            const listing = listingByAuctionId.get(String(item.auction_id));
            if (!listing || normalizeContractAddress(item.contract_address) !== collectionContract) continue;
            const norm = normalizeTokenId(item.token_id);
            const dec = toDecimalTokenId(item.token_id);
            map[norm] = { price: listing.startingPrice, symbol: listing.reserveTokenSymbol };
            map[dec] = { price: listing.startingPrice, symbol: listing.reserveTokenSymbol };
        }
        return map;
    }, [listings, auctionsData, collectionConfig.contractAddress]);

    const endTimeByTokenId = useMemo(() => {
        const map: Record<string, string> = {};
        if (!listings?.length || !auctionsData?.bm021AuctionItemModels?.edges) return map;
        const listingByAuctionId = new Map(listings.map((l) => [String(l.auctionId), l]));
        const items = auctionsData.bm021AuctionItemModels.edges.map((e) => e.node);
        const collectionContract = normalizeContractAddress(collectionConfig.contractAddress);
        for (const item of items) {
            const listing = listingByAuctionId.get(String(item.auction_id));
            if (!listing || normalizeContractAddress(item.contract_address) !== collectionContract) continue;
            const raw = item.token_id != null ? String(item.token_id).trim() : "";
            if (!raw) continue;
            const norm = normalizeTokenId(raw);
            const dec = toDecimalTokenId(raw);
            map[raw] = listing.endTime;
            if (norm) map[norm] = listing.endTime;
            if (dec) map[dec] = listing.endTime;
        }
        return map;
    }, [listings, auctionsData, collectionConfig.contractAddress]);

    const toggleCardSelection = useCallback((nftId: string) => {
        setSelectedNFTIds((previouslySelected) => {
            if (previouslySelected.includes(nftId)) {
                return previouslySelected.filter((existingId) => existingId !== nftId);
            }

            if (previouslySelected.length >= MAX_AUCTION_NFT_SELECTION) {
                return previouslySelected;
            }

            return [...previouslySelected, nftId];
        });
    }, []);

    // Merge attributes for filterNFT (Level, Health, stats). Sell grid uses Torii: list from useMyAdventurerNFTs is Torii SQL (adventurer-nfts); prefer per-token Torii (attributes API) when loaded, else use list attributes (Torii token_attributes).
    const nftsWithAttributes = useMemo(() => {
        if (selectedCollection !== "adventurers") return nfts;
        return nfts.map((nft) => {
            const decimal = toDecimalTokenId(nft.tokenId);
            const normalized = decimal ? normalizeTokenId(decimal) : "";
            const fetched =
                (decimal && attributesByTokenId[decimal]) ??
                attributesByTokenId[nft.tokenId] ??
                (normalized && attributesByTokenId[normalized]);
            const merged = fetched?.length ? fetched : (nft.attributes ?? []);
            return { ...nft, attributes: merged };
        });
    }, [selectedCollection, nfts, attributesByTokenId]);

    // Token IDs that pass the current filter (using list/Torii attributes only). We only fetch /api/adventurer-attributes for these, so the grid shows the filtered set and we don't call the API for everyone.
    const tokenIdsToFetchForAttributes = useMemo(() => {
        if (selectedCollection !== "adventurers" || nfts.length === 0) return [];
        const nftsWithListAttrs = nfts.map((nft) => ({ ...nft, attributes: nft.attributes ?? [] }));
        let result = applyFiltersToNFTs(nftsWithListAttrs, filters);
        if (filters.summitTop15 && summitTopBeasts.length > 0) {
            result = result.filter((nft) => nftMatchesSummitBeast(nft));
        }
        if (showOnlyAlive) {
            result = result.filter((nft) => {
                const gameOverAttr = nft.attributes?.find(
                    (a) => (a.trait_type?.toLowerCase() ?? "") === "game over"
                );
                const value = gameOverAttr?.value;
                if (value === undefined || value === null) return true;
                const dead =
                    value === "True" || value === "true" || value === "1" || value === true;
                return !dead;
            });
        }
        const ids = Array.from(
            new Set(result.map((nft) => toDecimalTokenId(nft.tokenId)).filter(Boolean))
        );
        return ids;
    }, [
        selectedCollection,
        nfts,
        filters,
        filters.id,
        filters.search,
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
        filters.summitTop15,
        summitTopBeasts,
        nftMatchesSummitBeast,
        showOnlyAlive,
    ]);

    // Enrich NFTs with listing endTime so "Ending soon" / "Newest" sort works in Sell tab
    const nftsWithListData = useMemo(() => {
        return nftsWithAttributes.map((nft) => ({
            ...nft,
            endTime: endTimeByTokenId[nft.tokenId] ?? endTimeByTokenId[normalizeTokenId(nft.tokenId)] ?? endTimeByTokenId[toDecimalTokenId(nft.tokenId)] ?? "",
        }));
    }, [nftsWithAttributes, endTimeByTokenId]);

    const filteredNFTs = useMemo(() => {
        let result = applyFiltersToNFTs(nftsWithListData, filters);

        // Apply summit top 15 filter - matches by name (prefix + suffix + beast) or token ID
        if (filters.summitTop15) {
            if (summitTopBeasts.length === 0) {
                return [];
            }
            result = result.filter(nft => nftMatchesSummitBeast(nft));
        }

        // Only alive adventurers (when enabled): use API Game Over when present, else fall back to nft.attributes (we only fetch for filtered IDs so dead NFTs may not be in gameOverByTokenId).
        if (selectedCollection === "adventurers" && showOnlyAlive) {
            result = result.filter((nft) => {
                const tokenIdNum = nft.tokenId.startsWith("0x")
                    ? parseInt(nft.tokenId, 16).toString()
                    : nft.tokenId;
                let dead = gameOverByTokenId[tokenIdNum] ?? gameOverByTokenId[nft.tokenId];
                if (dead === undefined) {
                    const gameOverAttr = nft.attributes?.find(
                        (a) => (a.trait_type?.toLowerCase() ?? "") === "game over"
                    );
                    const value = gameOverAttr?.value;
                    if (value === undefined || value === null) return true;
                    dead = value === "True" || value === "true" || value === "1" || value === true;
                }
                return !dead;
            });
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

        // Exclude listed adventurers (Sell left filters)
        if (selectedCollection === "adventurers" && excludeListed && listedTokenIds.size > 0) {
            result = result.filter((nft) => {
                const dec = toDecimalTokenId(nft.tokenId);
                const norm = normalizeTokenId(nft.tokenId);
                return !listedTokenIds.has(dec) && !listedTokenIds.has(norm) && !listedTokenIds.has(nft.tokenId);
            });
        }

        return result;
    }, [
        nftsWithListData,
        filters,
        filters.id,
        filters.search,
        filters.timeSort,
        filters.tokenIdSort,
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
        summitTopBeasts,
        nftMatchesSummitBeast,
        selectedCollection,
        showOnlyAlive,
        excludeListed,
        listedTokenIds,
        isLoadingGameOver,
        gameOverByTokenId,
        inBattleByTokenId,
    ]);

    const [apiAdventurerBounds, setApiAdventurerBounds] = useState<AdventurerStatBounds | null>(null);

    // List with all filters EXCEPT numeric stat bounds. Uses nftsWithAttributes so bounds reflect API attributes.
    const filteredForBounds = useMemo(() => {
        const filtersNoStat = getFiltersWithoutStatBounds(filters);
        let result = applyFiltersToNFTs(nftsWithAttributes, filtersNoStat);
        if (filters.summitTop15 && summitTopBeasts.length > 0) {
            result = result.filter(nft => nftMatchesSummitBeast(nft));
        }
        if (selectedCollection === "adventurers" && showOnlyAlive) {
            result = result.filter((nft) => {
                const tokenIdNum = nft.tokenId.startsWith("0x") ? parseInt(nft.tokenId, 16).toString() : nft.tokenId;
                let dead = gameOverByTokenId[tokenIdNum] ?? gameOverByTokenId[nft.tokenId];
                if (dead === undefined) {
                    const gameOverAttr = nft.attributes?.find((a) => (a.trait_type?.toLowerCase() ?? "") === "game over");
                    const value = gameOverAttr?.value;
                    if (value === undefined || value === null) return true;
                    dead = value === "True" || value === "true" || value === "1" || value === true;
                }
                return !dead;
            });
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
        if (selectedCollection === "adventurers" && excludeListed && listedTokenIds.size > 0) {
            result = result.filter((nft) => {
                const dec = toDecimalTokenId(nft.tokenId);
                const norm = normalizeTokenId(nft.tokenId);
                return !listedTokenIds.has(dec) && !listedTokenIds.has(norm) && !listedTokenIds.has(nft.tokenId);
            });
        }
        return result;
    }, [nftsWithAttributes, filters.search, filters.beast, filters.type, filters.tier, filters.summitTop15, filters.battleFilter, summitTopBeasts, nftMatchesSummitBeast, selectedCollection, showOnlyAlive, excludeListed, listedTokenIds, gameOverByTokenId, inBattleByTokenId]);

    // Bounds from metadata for the list *before* stat filters (so bounds don't change when user types min/max)
    const computedAdventurerBounds = useMemo(
        () => (selectedCollection === "adventurers" ? computeAdventurerStatBounds(filteredForBounds) : null),
        [selectedCollection, filteredForBounds]
    );

    const selectAll = useCallback(() => {
        const ids = filteredNFTs.slice(0, MAX_AUCTION_NFT_SELECTION).map(nft => nft.tokenId);
        setSelectedNFTIds(ids);
    }, [filteredNFTs]);

    useEffect(() => {
        setCurrentPage(1);
    }, [filters, showOnlyAlive, excludeListed]);

    // Token IDs to fetch: prefer filtered set (list/Torii); when that's empty but we have NFTs and filters, fetch all so we get attributes and can filter the grid.
    const tokenIdsToActuallyFetch = useMemo(() => {
        if (selectedCollection !== "adventurers" || nfts.length === 0) return [];
        if (tokenIdsToFetchForAttributes.length > 0) return tokenIdsToFetchForAttributes;
        return Array.from(new Set(nfts.map((nft) => toDecimalTokenId(nft.tokenId)).filter(Boolean)));
    }, [selectedCollection, nfts, tokenIdsToFetchForAttributes]);

    // Only request IDs not already in provider (minimizes API calls when switching tabs or re-running effect).
    const tokenIdsToRequest = useMemo(() => {
        return tokenIdsToActuallyFetch.filter((id) => !attributesByTokenId[String(id)]?.length);
    }, [tokenIdsToActuallyFetch, attributesByTokenId]);

    // Debounce so we don't trigger a fetch on every filter keystroke — wait until filters have been stable for 400ms.
    const tokenIdsToRequestRef = useRef(tokenIdsToRequest);
    tokenIdsToRequestRef.current = tokenIdsToRequest;
    const requestKey = useMemo(() => tokenIdsToRequest.slice().sort().join(","), [tokenIdsToRequest]);
    const [debouncedIdsToRequest, setDebouncedIdsToRequest] = useState<string[]>(() => tokenIdsToRequest);
    useEffect(() => {
        const t = setTimeout(() => setDebouncedIdsToRequest(tokenIdsToRequestRef.current), 400);
        return () => clearTimeout(t);
    }, [requestKey]);

    // Fetch adventurer attributes via batch API (one request per chunk); skip IDs already cached in provider.
    const BATCH_CHUNK = 50;
    useEffect(() => {
        if (selectedCollection !== "adventurers" || tokenIdsToActuallyFetch.length === 0) {
            setGameOverByTokenId({});
            setIsLoadingGameOver(false);
            setAttributeLoadProgress(0);
            return;
        }

        const fetchId = ++gameOverFetchRef.current;

        const buildGameOverFromAttrs = (attrsMap: Record<string, Array<{ trait_type: string; value: string }>>) => {
            const gameOverMap: Record<string, boolean> = {};
            for (const id of tokenIdsToActuallyFetch) {
                const dec = String(id);
                const attrs = attrsMap[dec] ?? attributesByTokenId[dec];
                const attr = attrs?.find((a) => (a.trait_type?.toLowerCase() ?? "") === "game over");
                const value = attr?.value;
                const dead = value === "True" || value === "true" || value === "1" || value === true;
                const hexShort = "0x" + BigInt(dec).toString(16).toLowerCase();
                const hexNormalized = normalizeTokenId(dec);
                gameOverMap[dec] = dead;
                gameOverMap[hexShort] = dead;
                gameOverMap[hexNormalized] = dead;
            }
            return gameOverMap;
        };

        if (debouncedIdsToRequest.length === 0) {
            setGameOverByTokenId(buildGameOverFromAttrs(attributesByTokenId));
            setIsLoadingGameOver(false);
            setAttributeLoadProgress(0);
            return;
        }

        setIsLoadingGameOver(true);
        setAttributeLoadProgress(0);
        const chunks: string[][] = [];
        for (let i = 0; i < debouncedIdsToRequest.length; i += BATCH_CHUNK) {
            chunks.push(debouncedIdsToRequest.slice(i, i + BATCH_CHUNK));
        }
        const totalChunks = chunks.length;
        const fetchChunk = async (chunk: string[]): Promise<Array<{ tokenId: string; dead: boolean; attributes: Array<{ trait_type: string; value: string }> }>> => {
            try {
                const res = await fetch(`/api/adventurer-attributes?tokenIds=${chunk.map((id) => encodeURIComponent(id)).join(",")}`, { cache: "no-store" });
                if (!res.ok) return [];
                const data = await res.json();
                const results = Array.isArray(data.results) ? data.results : [];
                return results.map((r: { tokenId: string; attributes?: Array<{ trait_type?: string; value?: string }> }) => {
                    const attributes = Array.isArray(r.attributes) ? r.attributes : [];
                    const attr = attributes.find((a: { trait_type?: string }) => (a.trait_type?.toLowerCase() ?? "") === "game over");
                    const value = attr?.value;
                    const dead = value === "True" || value === "true" || value === "1" || value === true;
                    return { tokenId: r.tokenId, dead, attributes };
                });
            } catch {
                return [];
            }
        };
        let completedChunks = 0;
        Promise.all(
            chunks.map((chunk) =>
                fetchChunk(chunk).then((result) => {
                    completedChunks += 1;
                    if (fetchId === gameOverFetchRef.current) {
                        const pct = Math.min(100, Math.round((completedChunks / totalChunks) * 100));
                        setAttributeLoadProgress(pct);
                    }
                    return result;
                })
            )
        ).then((chunkResults) => {
            if (fetchId !== gameOverFetchRef.current) return;
            setAttributeLoadProgress(100);
            const results = chunkResults.flat();
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
                for (const id of tokenIdsToActuallyFetch) {
                    const dec = String(id);
                    const hexShort = "0x" + BigInt(dec).toString(16).toLowerCase();
                    const hexNormalized = normalizeTokenId(dec);
                    if (fetchedByDec.has(dec)) {
                        const r = results.find((x) => String(x.tokenId) === dec);
                        if (r) {
                            next[dec] = r.dead;
                            next[hexShort] = r.dead;
                            next[hexNormalized] = r.dead;
                        }
                    } else {
                        const attrs = attrsMap[dec] ?? attributesByTokenId[dec];
                        const attr = attrs?.find((a) => (a.trait_type?.toLowerCase() ?? "") === "game over");
                        const value = attr?.value;
                        const dead = value === "True" || value === "true" || value === "1" || value === true;
                        next[dec] = dead;
                        next[hexShort] = dead;
                        next[hexNormalized] = dead;
                    }
                }
                return next;
            });
            const hideAfterMinTime = 350;
            window.setTimeout(() => {
                if (fetchId === gameOverFetchRef.current) {
                    setIsLoadingGameOver(false);
                }
            }, hideAfterMinTime);
        }).catch(() => {
            if (fetchId === gameOverFetchRef.current) {
                setIsLoadingGameOver(false);
                setAttributeLoadProgress(0);
            }
        });
        // Intentionally omit attributesByTokenId: re-running when it changes would refetch after every merge (same IDs) and cause duplicate API calls.
    }, [selectedCollection, tokenIdsToActuallyFetch, debouncedIdsToRequest, mergeAttributes]);

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

    // Clear selection when collection changes
    useEffect(() => {
        setSelectedNFTIds([]);
        setCurrentPage(1);
    }, [selectedCollection]);

    useEffect(() => {
        const loadLogos = async () => {
            try {
                const page = await fetchTokens({ page: 0, size: 100 });
                const logos: Record<string, string> = {};
                SUPPORTED_TOKENS.forEach((token) => {
                    const normalizedSupported = normalizeContractAddress(token.address);
                    const match = page.content.find(
                        (t) => normalizeContractAddress(t.address) === normalizedSupported,
                    );
                    if (match && match.logoUri) {
                        logos[token.address] = match.logoUri;
                    }
                });
                setTokenLogos(logos);
            } catch (error) {
                console.error("Failed to fetch token logos:", error);
            }
        };
        loadLogos();
    }, []);

    // Count how many of user's NFTs are top 15 summit beasts (by name or token ID)
    // Returns 0 if summit API failed to hide the feature gracefully
    const summitListedCount = useMemo(() => {
        if (summitError || summitTopBeasts.length === 0) return 0;
        return nfts.filter(nft => nftMatchesSummitBeast(nft)).length;
    }, [nfts, summitTopBeasts, nftMatchesSummitBeast, summitError]);

    const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredNFTs.length / GRID_PAGE_SIZE)), [filteredNFTs.length]);

    // Show loading bar as soon as we're loading adventurers (initial load, refresh, or attribute batches)
    const showAdventurerLoadingBar = selectedCollection === "adventurers" && (loading || isLoadingGameOver);

    // Reset progress when initial load/refresh starts so the bar appears at 0% immediately
    useEffect(() => {
        if (selectedCollection === "adventurers" && loading) setAttributeLoadProgress(0);
    }, [selectedCollection, loading]);

    const visibleNFTs = useMemo(() => {
        const startIndex = (currentPage - 1) * GRID_PAGE_SIZE;
        return filteredNFTs.slice(startIndex, startIndex + GRID_PAGE_SIZE);
    }, [currentPage, filteredNFTs]);

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

    const selectedNFTs = useMemo(
        () => nfts.filter((nft) => selectedNFTIds.includes(nft.tokenId)),
        [selectedNFTIds, nfts],
    );

    const hasSelection = selectedNFTs.length > 0;

    const handlePageChange = useCallback(
        (page: number) => {
            const nextPage = Math.min(Math.max(page, 1), totalPages);
            if (nextPage !== currentPage) {
                setCurrentPage(nextPage);
            }
        },
        [currentPage, totalPages],
    );

    const handleClearSelection = useCallback(() => {
        setSelectedNFTIds([]);
        setIsBulkModalOpen(false);
    }, []);

    const openBulkModal = useCallback(() => {
        if (hasSelection) setIsBulkModalOpen(true);
    }, [hasSelection]);

    const doCreateAuction = useCallback(async (nftsToList: FormattedNFT[]) => {
        if (!account || nftsToList.length === 0 || !startingPriceUSD || !collectionName.trim() || !endDateTime) return;

        const selectedDate = new Date(endDateTime);
        const now = new Date();
        const durationSeconds = Math.floor((selectedDate.getTime() - now.getTime()) / 1000);

        const minimumDurationSeconds = DEFAULT_AUCTION_DURATION_MINUTES * 60;
        if (durationSeconds < minimumDurationSeconds) {
            setDurationError(`End date must be at least ${DEFAULT_AUCTION_DURATION_MINUTES} minutes from now`);
            return;
        }

        setDurationError(null);
        try {
            setIsSubmitting(true);

            const endDateTimestamp = Math.floor(new Date(endDateTime).getTime() / 1000);
            const currentTimestamp = Math.floor(Date.now() / 1000);
            const duration_seconds = endDateTimestamp - currentTimestamp;
            const token_ids = nftsToList.map((nft) => Number(parseInt(nft.tokenId, 16)));

            const usdAmount = parseFloat(startingPriceUSD);
            const startingPriceWhole = Math.floor(usdAmount * 1e6);

            const collectionNameByteArray = byteArray.byteArrayFromString(collectionName.trim());

            const byteArrayCalldata = [
                collectionNameByteArray.data.length.toString(),
                ...collectionNameByteArray.data.map((item) => item.toString()),
                collectionNameByteArray.pending_word.toString(),
                collectionNameByteArray.pending_word_len.toString(),
            ];

            const calls: Array<{
                contractAddress: string;
                entrypoint: string;
                calldata: (string | number)[];
            }> = [];

            for (const tokenId of token_ids) {
                calls.push({
                    contractAddress: collectionConfig.contractAddress,
                    entrypoint: "approve",
                    calldata: [AUCTION_CONTRACT_ADDRESS, tokenId.toString(), "0"],
                });
            }

            calls.push({
                contractAddress: AUCTION_CONTRACT_ADDRESS,
                entrypoint: "create_auction",
                calldata: [
                    ...byteArrayCalldata,
                    startingPriceWhole.toString(),
                    token_ids.length.toString(),
                    ...token_ids.map((id) => id.toString()),
                    collectionConfig.contractAddress,
                    "0",
                    duration_seconds.toString(),
                    sellerToken,
                ],
            });

            const response = await account.execute(calls);

            setTxnHash(response.transaction_hash);
            toast.success("Auction created", "Your NFTs have been listed for auction");
        } catch (err) {
            console.error("Error creating auction - contract call failed:", err);
            const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
            toast.error("Failed to create auction", errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    }, [account, startingPriceUSD, collectionName, endDateTime, sellerToken, collectionConfig.contractAddress, toast]);

    const handleListSelection = useCallback(() => {
        if (!hasSelection) return;
        doCreateAuction(selectedNFTs);
    }, [hasSelection, selectedNFTs, doCreateAuction]);

    const createAuctionForTokenIds = useCallback(
        (tokenIds: string[]) => {
            const nftsToList = nfts.filter((n) => tokenIds.includes(n.tokenId));
            if (nftsToList.length === 0) return;
            doCreateAuction(nftsToList);
        },
        [nfts, doCreateAuction]
    );

    const openDetailModal = useCallback((nft: FormattedNFT) => {
        const index = filteredNFTs.findIndex((n) => n.tokenId === nft.tokenId);
        if (index >= 0) {
            setSelectedBeastIndex(index);
            setIsBeastModalOpen(true);
        }
    }, [filteredNFTs]);

    const [isRefreshing, setIsRefreshing] = useState(false);
    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        try {
            if (selectedCollection === "beasts") {
                await refetchBeasts();
            } else {
                await refetchAdventurers();
            }
        } finally {
            setIsRefreshing(false);
        }
    }, [selectedCollection, refetchBeasts, refetchAdventurers]);

    const renderSelectedSummary = () => {
        if (!hasSelection) return null;

        return (
            <section className="mx-auto w-full max-w-6xl overflow-hidden rounded-2xl border border-[rgb(50,255,52)]/80 bg-black/55 shadow-[0_16px_40px_rgba(5,20,5,0.35)] mt-6">
                <div className="grid gap-8 p-4 md:p-6 grid-cols-1 md:grid-cols-[minmax(0,0.4fr)_minmax(0,0.6fr)] md:items-start">
                    <div className="flex flex-col gap-4 h-full">
                        <div>
                            <p className="text-[11px] font-orbitron uppercase tracking-[0.16em] text-[rgb(186,255,188)]/70">
                                Selected NFTs
                            </p>
                            <p className="text-3xl font-orbitron uppercase tracking-[0.18em] text-white">
                                {selectedNFTs.length.toString().padStart(2, "0")}
                            </p>
                        </div>
                        <div className="flex flex-col gap-2">
                            <p className="text-[11px] font-orbitron uppercase tracking-[0.16em] text-[rgb(186,255,188)]/70">
                                Adventurers
                            </p>
                            {hasSelection ? (
                                <ul className="flex flex-col gap-1.5 max-h-[240px] overflow-y-auto pr-1">
                                    {selectedNFTs.map((nft) => {
                                        const dec = toDecimalTokenId(nft.tokenId);
                                        const attrs = (dec && attributesByTokenId[dec]) ?? attributesByTokenId[nft.tokenId] ?? nft.attributes ?? [];
                                        const getAttr = (t: string) => attrs.find((a) => (a.trait_type?.toLowerCase() ?? "") === t.toLowerCase())?.value;
                                        const level = getAttr("Level") ?? nft.level;
                                        const health = getAttr("Health") ?? nft.health;
                                        const idDisplay = nft.tokenId.startsWith("0x") ? parseInt(nft.tokenId, 16).toString() : nft.tokenId;
                                        return (
                                            <li
                                                key={nft.tokenId}
                                                className="flex items-center justify-between rounded-lg border border-[rgb(50,255,52)]/40 px-3 py-2 text-xs font-orbitron text-[rgb(186,255,188)] bg-black/30"
                                            >
                                                <span className="uppercase tracking-[0.12em]">#{idDisplay}</span>
                                                <span>Lv.{level ?? "—"}</span>
                                                <span>HP {health ?? "—"}</span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : (
                                <p className="text-xs text-[rgb(186,255,188)]/60">
                                    Select NFTs from the grid to assemble a collection for auction.
                                </p>
                            )}
                        </div>
                        <div className="mt-auto">
                            <div className="rounded-lg border border-white/12 bg-white/5 px-3 py-2">
                                <p className="text-[10px] font-orbitron uppercase tracking-wider text-[rgb(186,255,188)]/70 mb-0.5">
                                    Fees
                                </p>
                                <p className="text-[10px] text-[rgb(186,255,188)]/70">
                                    5% to Survivor DAO royalty, <span className="line-through">2.5% platform fee</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-1.5">
                            <label
                                htmlFor="bulk-collection-name"
                                className="text-[10px] font-orbitron uppercase tracking-wider text-[rgb(186,255,188)]/70"
                            >
                                Listing Name
                            </label>
                            <input
                                id="bulk-collection-name"
                                type="text"
                                value={collectionName}
                                onChange={(event) => setCollectionName(event.target.value)}
                                placeholder="Enter a name for your listing"
                                className="w-full rounded-lg border border-white/12 bg-black/60 px-3 py-2 text-xs font-orbitron uppercase tracking-[0.12em] text-white outline-none transition focus:border-[rgb(50,255,52)] focus:ring-1 focus:ring-[rgb(50,255,52)]/35"
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label
                                htmlFor="bulk-starting-price-usd"
                                className="text-[10px] font-orbitron uppercase tracking-wider text-[rgb(186,255,188)]/70"
                            >
                                Reserved Price(USD)
                            </label>
                            <input
                                id="bulk-starting-price-usd"
                                type="text"
                                value={startingPriceUSD}
                                onChange={(event) => setStartingPriceUSD(event.target.value)}
                                placeholder="0.00"
                                className="w-full rounded-lg border border-white/12 bg-black/60 px-3 py-2 text-xs font-orbitron uppercase tracking-widest text-white outline-none transition focus:border-[rgb(50,255,52)] focus:ring-1 focus:ring-[rgb(50,255,52)]/35 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label
                                className="text-[10px] font-orbitron uppercase tracking-wider text-[rgb(186,255,188)]/70"
                            >
                                Receive Payment In
                            </label>
                            <CustomDropdown
                                id="bulk-seller-token"
                                value={sellerToken}
                                onChange={setSellerToken}
                                options={SUPPORTED_TOKENS.map((token) => ({
                                    value: token.address,
                                    label: token.symbol,
                                    logo: tokenLogos[token.address]
                                }))}
                                variant="default"
                                className="[&_button]:py-1.5 [&_button]:text-xs [&_button]:min-h-0"
                            />
                            <p className="text-[10px] text-[rgb(186,255,188)]/70">
                                Buyers can pay with any token. Their payment will be swapped to {SUPPORTED_TOKENS.find(t => t.address === sellerToken)?.symbol || 'your selected token'} (if you settle this auction, else you will receive USDC).
                            </p>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label
                                htmlFor="bulk-end-datetime"
                                className="text-[10px] font-orbitron uppercase tracking-wider text-[rgb(186,255,188)]/70"
                            >
                                End Date & Time
                            </label>
                            <input
                                id="bulk-end-datetime"
                                type="datetime-local"
                                value={endDateTime}
                                onChange={(event) => {
                                    setEndDateTime(event.target.value);
                                    setDurationError(null);
                                }}
                                min={dateToLocalDateTimeString(new Date())}
                                className={`w-full rounded-lg border px-3 py-2 text-xs font-orbitron uppercase tracking-widest text-white outline-none transition focus:ring-1 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-70 [&::-webkit-calendar-picker-indicator]:hover:opacity-100 ${
                                    durationError
                                        ? "border-red-500 bg-black/60 focus:border-red-500 focus:ring-red-500/35"
                                        : "border-white/12 bg-black/60 focus:border-[rgb(50,255,52)] focus:ring-[rgb(50,255,52)]/35"
                                }`}
                            />
                            {durationError ? (
                                <p className="text-[10px] text-red-400">
                                    {durationError}
                                </p>
                            ) : (
                                <p className="text-[10px] text-[rgb(186,255,188)]/70">
                                    Minimum duration is {DEFAULT_AUCTION_DURATION_MINUTES} minutes from now.
                                </p>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            <button
                                type="button"
                                onClick={handleListSelection}
                                disabled={!hasSelection || !startingPriceUSD || !collectionName.trim() || !canCreateAuction || !endDateTime || isSubmitting}
                                className={`inline-flex items-center justify-center rounded-full px-4 py-1.5 text-xs font-orbitron uppercase tracking-wider transition ${
                                    hasSelection && startingPriceUSD && collectionName.trim() && canCreateAuction && endDateTime && !isSubmitting
                                        ? "border border-[rgb(50,255,52)] bg-[rgb(50,255,52)]/10 text-[rgb(50,255,52)] hover:cursor-pointer hover:bg-[rgb(50,255,52)] hover:text-black"
                                        : "border border-white/12 text-[rgb(186,255,188)]/45"
                                }`}
                            >
                                {isSubmitting ? "Submitting..." : "List Selection"}
                            </button>
                            <button
                                type="button"
                                onClick={handleClearSelection}
                                disabled={!hasSelection}
                                className={`inline-flex items-center justify-center rounded-full border px-4 py-1.5 text-xs font-orbitron uppercase tracking-wider transition ${
                                    hasSelection
                                        ? "border-white text-white hover:cursor-pointer hover:border-[rgb(50,255,52)] hover:text-[rgb(50,255,52)]"
                                        : "border-white/20 text-white/30"
                                }`}
                            >
                                Clear Selection
                            </button>
                        </div>
                        {txnHash && (
                            <div className="rounded-xl border border-[rgb(50,255,52)]/40 bg-[rgb(50,255,52)]/10 px-4 py-3">
                                <p className="text-[11px] font-orbitron uppercase tracking-[0.16em] text-[rgb(186,255,188)]/70 mb-2">
                                    Transaction Submitted
                                </p>
                                <a
                                    href={explorer.transaction(txnHash)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-sm font-orbitron text-[rgb(50,255,52)] hover:underline break-all"
                                >
                                    {txnHash}
                                </a>
                            </div>
                        )}
                        <p className="text-xs text-[rgb(186,255,188)]/70">
                            Tip: You can list multiple NFTs together as a themed bundle. Buyers love cohesive collections with
                            complementary traits.
                        </p>
                    </div>
                </div>
            </section>
        );
    };

    const renderContent = () => {
    if (loading) {
        return (
            <>
                {selectedCollection === "adventurers" && (
                    <div className="w-full mb-4" role="progressbar" aria-valuenow={attributeLoadProgress} aria-valuemin={0} aria-valuemax={100} aria-label="Loading adventurer attributes">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                            <div
                                className="h-full rounded-full bg-[rgb(50,255,52)] transition-[width] duration-150 ease-out"
                                style={{ width: `${Math.max(0, Math.min(100, attributeLoadProgress))}%` }}
                            />
                        </div>
                        <p className="mt-1.5 text-xs text-[rgb(186,255,188)]/70 font-orbitron uppercase tracking-wider">
                            Loading adventurers…
                        </p>
                    </div>
                )}
                <AuctionSkeleton />
            </>
        );
    }

    if (error) {
        return (
            <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-center gap-4 px-4 py-12">
                <p className="text-red-400">Error loading NFTs: {error.message}</p>
            </div>
        );
    }

    if (nfts.length === 0) {
        const emptyStateMessage = selectedCollection === "beasts"
            ? {
                title: "No BEAST NFTs found in your wallet",
                description: "Connect your wallet to see your Loot Survivor beast collection, or play",
                linkText: "Loot Survivor",
                linkHref: "https://lootsurvivor.io/",
                suffix: "to acquire beasts!"
            }
            : {
                title: "No Adventurer NFTs found in your wallet",
                description: "Connect your wallet to see your Death Mountain adventurers, or play",
                linkText: "Death Mountain",
                linkHref: "https://deathmountain.gg/",
                suffix: "to start an adventure!"
            };

        return (
            <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-center gap-6 px-4 py-12">
                <div className="w-20 h-20 rounded-full bg-[rgb(50,255,52)]/10 flex items-center justify-center">
                    <svg className="w-10 h-10 text-[rgb(50,255,52)]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
                    </svg>
                </div>
                <div className="text-center">
                    <p className="text-lg text-[rgb(186,255,188)]/70 mb-2">
{emptyStateMessage.title}
                    </p>
                    <p className="text-sm text-[rgb(186,255,188)]/50 max-w-md">
                        {emptyStateMessage.description}{" "}
                        <a href={emptyStateMessage.linkHref} target="_blank" rel="noopener noreferrer" className="text-[rgb(50,255,52)] hover:underline">
                            {emptyStateMessage.linkText}
                        </a>{" "}
                        {emptyStateMessage.suffix}
                    </p>
                </div>
            </div>
        );
        }

    const renderBulkSelectButtons = () => (
        <div className="flex flex-wrap gap-2 mb-4 items-center">
            <button
                type="button"
                onClick={selectAll}
                className="inline-flex items-center justify-center rounded-full border border-[rgb(50,255,52)]/40 bg-[rgb(50,255,52)]/10 px-4 py-1.5 text-xs font-orbitron uppercase tracking-[0.14em] text-[rgb(50,255,52)] transition hover:bg-[rgb(50,255,52)]/20 hover:cursor-pointer"
            >
                Select All ({filteredNFTs.length}{filteredNFTs.length > MAX_AUCTION_NFT_SELECTION ? `, max ${MAX_AUCTION_NFT_SELECTION} per listing` : ""})
            </button>
            <button
                type="button"
                onClick={handleClearSelection}
                disabled={!hasSelection}
                className={`inline-flex items-center justify-center rounded-full border px-4 py-1.5 text-xs font-orbitron uppercase tracking-[0.14em] transition ${
                    hasSelection
                        ? "border-white/40 text-white hover:border-[rgb(50,255,52)] hover:text-[rgb(50,255,52)] hover:cursor-pointer"
                        : "border-white/20 text-white/30"
                }`}
            >
                Clear
            </button>
            <CustomDropdown
                id="sort-sell"
                value={sortDropdownValue}
                onChange={setSortFromDropdown}
                options={[
                    { value: "time-ending-soon", label: "Ending soon" },
                    { value: "time-newest", label: "Newest" },
                    { value: "level-low-high", label: "Level ↑" },
                    { value: "level-high-low", label: "Level ↓" },
                    { value: "score-low-high", label: "Score ↑" },
                    { value: "score-high-low", label: "Score ↓" },
                    { value: "tokenId-low-high", label: "Token ID ↑" },
                    { value: "tokenId-high-low", label: "Token ID ↓" },
                ]}
                variant="bar"
            />
            {hasSelection && (
                <button
                    type="button"
                    onClick={openBulkModal}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-[rgb(50,255,52)] bg-[rgb(50,255,52)]/20 px-5 py-2.5 text-sm font-orbitron uppercase tracking-[0.14em] text-[rgb(50,255,52)] transition hover:bg-[rgb(50,255,52)]/30 hover:cursor-pointer"
                >
                    Sell/Auction {selectedNFTIds.length}
                </button>
            )}
        </div>
    );

    const gridKey = `${filteredNFTs.length}-${currentPage}-${filters.levelMin}-${filters.levelMax}-${filters.healthMin}-${filters.healthMax}`;
    const renderGrid = () => (
        <div key={gridKey} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 w-full">
            {visibleNFTs.map((nft, index) => {
                const CardComponent = selectedCollection === "beasts" ? MonsterCard : AdventurerCard;
                const listed = isListedToken(listedTokenIds, nft.tokenId);
                const reserve = listed
                    ? reserveByTokenId[nft.tokenId] ?? reserveByTokenId[normalizeTokenId(nft.tokenId)] ?? reserveByTokenId[toDecimalTokenId(nft.tokenId)]
                    : undefined;
                return (
                    <CardComponent
                        key={nft.tokenId}
                        nft={nft}
                        selected={selectedNFTIds.includes(nft.tokenId)}
                        onToggle={() => toggleCardSelection(nft.tokenId)}
                        onInfoClick={() => openDetailModal(nft)}
                        listed={listed}
                        inBattle={inBattleByTokenId[toDecimalTokenId(nft.tokenId)] === true || inBattleByTokenId[normalizeTokenId(nft.tokenId)] === true}
                        priority={selectedCollection === "adventurers" && index === 0}
                        price={reserve?.price}
                        reserveTokenSymbol={reserve?.symbol}
                        {...(selectedCollection === "adventurers" ? { priceLabel: "Price" as const } : {})}
                    />
                );
            })}
        </div>
    );

        return (
            <>
                {showAdventurerLoadingBar && (
                    <div className="w-full mb-4" role="progressbar" aria-valuenow={attributeLoadProgress} aria-valuemin={0} aria-valuemax={100} aria-label="Loading adventurer attributes">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                            <div
                                className="h-full rounded-full bg-[rgb(50,255,52)] transition-[width] duration-150 ease-out"
                                style={{ width: `${Math.max(0, Math.min(100, attributeLoadProgress))}%` }}
                            />
                        </div>
                        <p className="mt-1.5 text-xs text-[rgb(186,255,188)]/70 font-orbitron uppercase tracking-wider">
                            {loading && nfts.length === 0 ? "Loading adventurers…" : `Loading attributes for ${nfts.length} adventurers… ${attributeLoadProgress}%`}
                        </p>
                    </div>
                )}
                {filteredNFTs.length === 0 && nfts.length > 0 && !showAdventurerLoadingBar && (
                    <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-center gap-4 px-4 py-12">
                        <p className="text-[rgb(186,255,188)]/70">No NFTs match your filters. Try adjusting your search criteria.</p>
                    </div>
                )}

                {filteredNFTs.length > 0 && (
                    <>
                        {walletAddress && !canCreateAuction && (
                            <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-200/90">
                                Viewing wallet {walletAddress.slice(0, 10)}…{walletAddress.slice(-8)}. Connect as this wallet to create listings.
                            </div>
                        )}
                        {renderBulkSelectButtons()}
                        {renderGrid()}
                    </>
            )}

            {filteredNFTs.length > 0 && (
                <div className="flex justify-center mt-6">
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
                </div>
            )}
            </>
        );
    };

    const modalListingTokenIds = useMemo(() => {
        const current = filteredNFTs[selectedBeastIndex]?.tokenId;
        if (!current) return [];
        return Array.from(new Set([current, ...selectedNFTIds]));
    }, [filteredNFTs, selectedBeastIndex, selectedNFTIds]);

    const sellFormContent = (
        <div className="flex flex-col gap-1">
            <h4 className="text-[10px] font-orbitron uppercase tracking-wider text-[rgb(50,255,52)] border-b border-[rgb(50,255,52)]/30 pb-0.5 shrink-0">
                List for auction {modalListingTokenIds.length > 1 ? `(${modalListingTokenIds.length} NFTs)` : ""}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                <div className="flex flex-col gap-0.5">
                    <label className="text-[8px] font-orbitron uppercase tracking-wider text-[rgb(186,255,188)]/80">Listing name</label>
                    <input
                        type="text"
                        value={collectionName}
                        onChange={(e) => setCollectionName(e.target.value)}
                        placeholder="Name"
                        className="w-full rounded bg-white/5 border border-white/10 px-1.5 py-0.5 text-[10px] font-orbitron uppercase tracking-wider text-white outline-none transition focus:border-[rgb(50,255,52)] focus:ring-1 focus:ring-[rgb(50,255,52)]/35"
                    />
                </div>
                <div className="flex flex-col gap-0.5">
                    <label className="text-[8px] font-orbitron uppercase tracking-wider text-[rgb(186,255,188)]/80">Reserve price (USD)</label>
                    <input
                        type="text"
                        value={startingPriceUSD}
                        onChange={(e) => setStartingPriceUSD(e.target.value)}
                        placeholder="0.00"
                        className="w-full rounded bg-white/5 border border-white/10 px-1.5 py-0.5 text-[10px] font-orbitron uppercase tracking-widest text-white outline-none transition focus:border-[rgb(50,255,52)] focus:ring-1 focus:ring-[rgb(50,255,52)]/35 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                    />
                </div>
                <div className="flex flex-col gap-0.5">
                    <label className="text-[8px] font-orbitron uppercase tracking-wider text-[rgb(186,255,188)]/80">Receive In</label>
                    <CustomDropdown
                        id="seller-token-modal"
                        value={sellerToken}
                        onChange={setSellerToken}
                        options={SUPPORTED_TOKENS.map((token) => ({
                            value: token.address,
                            label: token.symbol,
                            logo: tokenLogos[token.address],
                        }))}
                        variant="default"
                        className="[&_button]:py-1 [&_button]:px-2 [&_button]:text-[10px] [&_button]:rounded [&_button]:min-h-0 [&_button_svg]:h-3 [&_button_svg]:w-3"
                    />
                </div>
                <div className="flex flex-col gap-0.5">
                    <label className="text-[8px] font-orbitron uppercase tracking-wider text-[rgb(186,255,188)]/80">End Date & Time</label>
                    <input
                        type="datetime-local"
                        value={endDateTime}
                        onChange={(e) => {
                            setEndDateTime(e.target.value);
                            setDurationError(null);
                        }}
                        min={dateToLocalDateTimeString(new Date())}
                        className={`w-full rounded bg-white/5 border px-1.5 py-0.5 text-[10px] font-orbitron uppercase tracking-widest text-white outline-none transition focus:ring-1 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 ${
                            durationError ? "border-red-500 focus:border-red-500 focus:ring-red-500/35" : "border-white/10 focus:border-[rgb(50,255,52)] focus:ring-[rgb(50,255,52)]/35"
                        }`}
                    />
                    {durationError && <p className="text-[8px] text-red-400">{durationError}</p>}
                </div>
            </div>
            <div className="flex flex-col items-center gap-1.5 mt-0.5 w-full">
                <button
                    type="button"
                    onClick={() => createAuctionForTokenIds(modalListingTokenIds)}
                    disabled={!collectionName.trim() || !startingPriceUSD || !canCreateAuction || !endDateTime || isSubmitting}
                    className={`inline-flex items-center justify-center rounded-full px-6 py-2.5 text-xs font-orbitron uppercase tracking-wider transition shrink-0 ${
                        collectionName.trim() && startingPriceUSD && canCreateAuction && endDateTime && !isSubmitting
                            ? "border-2 border-[rgb(50,255,52)] bg-[rgb(50,255,52)]/15 text-[rgb(50,255,52)] hover:cursor-pointer hover:bg-[rgb(50,255,52)] hover:text-black"
                            : "border-2 border-[rgb(50,255,52)]/50 bg-[rgb(50,255,52)]/10 text-[rgb(186,255,188)]/80"
                    }`}
                >
                    {isSubmitting ? "..." : "Sell/List for Auction"}
                </button>
                {txnHash && (
                    <a
                        href={explorer.transaction(txnHash)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-orbitron text-[rgb(50,255,52)] hover:underline break-all text-center"
                    >
                        View txn
                    </a>
                )}
            </div>
        </div>
    );

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 min-h-[70vh]">
            <div className="flex gap-6 min-h-[60vh] min-w-0">
                <aside className="flex shrink-0 flex-col gap-2 w-[260px] min-w-[260px] min-h-[200px]">
                    <CollectionSelector
                        selectedCollection={selectedCollection}
                        onCollectionChange={setSelectedCollection}
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
                            <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={excludeListed}
                                    onChange={(e) => setExcludeListed(e.target.checked)}
                                    className="w-3.5 h-3.5 rounded border-[rgb(50,255,52)]/40 bg-black/60 text-[rgb(50,255,52)] focus:ring-[rgb(50,255,52)]/50 accent-[rgb(50,255,52)]"
                                    aria-label="Exclude listed"
                                />
                                <span className="text-[10px] font-orbitron uppercase tracking-wide text-[rgb(186,255,188)]/80">
                                    Exclude listed
                                </span>
                            </label>
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={handleRefresh}
                        disabled={loading || isRefreshing}
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-[rgb(50,255,52)]/40 bg-[rgb(50,255,52)]/10 px-4 py-2 text-xs font-orbitron uppercase tracking-[0.14em] text-[rgb(50,255,52)] transition hover:bg-[rgb(50,255,52)]/20 hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Reload NFTs from wallet"
                    >
                        {(loading || isRefreshing) ? (
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
                            setFilters((prev) => ({ ...prev, ...(updates as Partial<FilterState>) }));
                        }}
                        summitListedCount={selectedCollection === "beasts" ? summitListedCount : 0}
                        collection={selectedCollection}
                        isExpanded={filtersOpen}
                        onToggleExpanded={setFiltersOpen}
                        adventurerStatBounds={adventurerStatBounds}
                        compact
                    />
                </aside>
                <div className="min-w-0 flex-1">{renderContent()}</div>
            </div>

            {selectedCollection === "beasts" ? (
                <BeastDetailModal
                    isOpen={isBeastModalOpen}
                    onClose={() => setIsBeastModalOpen(false)}
                    nfts={filteredNFTs}
                    currentIndex={selectedBeastIndex}
                    onNavigate={(index) => setSelectedBeastIndex(index)}
                    onSelect={toggleCardSelection}
                    isSelected={filteredNFTs[selectedBeastIndex] ? selectedNFTIds.includes(filteredNFTs[selectedBeastIndex].tokenId) : false}
                    sellFormContent={sellFormContent}
                />
            ) : (
                <AdventurerDetailModal
                    isOpen={isBeastModalOpen}
                    onClose={() => setIsBeastModalOpen(false)}
                    nfts={filteredNFTs}
                    currentIndex={selectedBeastIndex}
                    onNavigate={(index) => setSelectedBeastIndex(index)}
                    onSelect={toggleCardSelection}
                    isSelected={filteredNFTs[selectedBeastIndex] ? selectedNFTIds.includes(filteredNFTs[selectedBeastIndex].tokenId) : false}
                    sellFormContent={sellFormContent}
                />
            )}

            {/* Bulk auction modal: list multiple selected NFTs in one auction */}
            {isBulkModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
                    onClick={() => setIsBulkModalOpen(false)}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="bulk-auction-modal-title"
                >
                    <div
                        className="relative w-full max-w-3xl my-auto rounded-2xl border border-[rgb(50,255,52)]/80 bg-black/90 shadow-[0_16px_40px_rgba(5,20,5,0.5)] overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-3 py-2.5 border-b border-[rgb(50,255,52)]/30">
                            <h2 id="bulk-auction-modal-title" className="text-sm font-orbitron uppercase tracking-[0.14em] text-white">
                                Sell/List for Auction ({selectedNFTIds.length} NFTs)
                            </h2>
                            <button
                                type="button"
                                onClick={() => setIsBulkModalOpen(false)}
                                className="rounded-full p-2 text-[rgb(186,255,188)]/70 hover:text-white hover:bg-white/10 transition"
                                aria-label="Close"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                                    <path d="M18 6 6 18" />
                                    <path d="m6 6 12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-3 md:p-4 overflow-y-auto max-h-[calc(100vh-8rem)]">
                            {renderSelectedSummary()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
