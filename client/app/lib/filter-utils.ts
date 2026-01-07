import type { FormattedNFT } from "./types";
import type { FilterState } from "../components/filters";
import type { AuctionWithNFTs } from "../hooks/use-auctions";

function isExpired(auction: AuctionWithNFTs): boolean {
    const endTime = auction.end_time;
    if (!endTime || endTime === "0") return false;

    try {
        let endTimeNum: number;
        if (endTime.startsWith("0x") || endTime.startsWith("0X")) {
            endTimeNum = parseInt(endTime, 16);
        } else {
            endTimeNum = parseInt(endTime, 10);
        }

        if (isNaN(endTimeNum) || endTimeNum === 0) return false;

        const now = Math.floor(Date.now() / 1000);
        const statusNum = parseInt(auction.status);

        // Expired if end time passed or status is Ended (3)
        return endTimeNum <= now || statusNum === 3;
    } catch {
        return false;
    }
}

function getAttributeValue(nft: FormattedNFT, traitType: string): string | undefined {
    const attr = nft.attributes.find((a) => a.trait_type === traitType);
    return attr ? String(attr.value) : undefined;
}

function matchesSearch(text: string | undefined, search: string): boolean {
    if (!search) return true;
    if (!text) return false;
    return text.toLowerCase().includes(search.toLowerCase());
}

export function filterNFT(nft: FormattedNFT, filters: FilterState): boolean {
    if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesName = matchesSearch(nft.metadataName, filters.search);
        const matchesBeast = matchesSearch(nft.beastName, filters.search);
        const tokenIdNum = parseInt(nft.tokenId, 16).toString();
        const matchesTokenId = tokenIdNum.includes(searchLower);
        
        const matchesAttributes = nft.attributes.some(attr => 
            String(attr.value).toLowerCase().includes(searchLower)
        );
        
        if (!matchesName && !matchesBeast && !matchesTokenId && !matchesAttributes) {
            return false;
        }
    }

    if (filters.beast) {
        if (nft.beastName !== filters.beast) {
            return false;
        }
    }

    if (filters.type) {
        const nftType = nft.beastType || getAttributeValue(nft, "Type");
        if (nftType !== filters.type) {
            return false;
        }
    }

    if (filters.tier) {
        const nftTier = nft.tier || getAttributeValue(nft, "Tier");
        if (nftTier !== filters.tier) {
            return false;
        }
    }

    if (filters.levelMin || filters.levelMax) {
        const nftLevel = parseInt(nft.level || getAttributeValue(nft, "Level") || "0");
        const min = filters.levelMin ? parseInt(filters.levelMin) : 1;
        const max = filters.levelMax ? parseInt(filters.levelMax) : 140;
        if (nftLevel < min || nftLevel > max) {
            return false;
        }
    }

    if (filters.powerMin || filters.powerMax) {
        const nftPower = parseFloat(nft.power || getAttributeValue(nft, "Power") || "0");
        const min = filters.powerMin ? parseFloat(filters.powerMin) : 1;
        const max = filters.powerMax ? parseFloat(filters.powerMax) : 550;
        if (nftPower < min || nftPower > max) {
            return false;
        }
    }

    if (filters.rankMin || filters.rankMax) {
        const nftRank = parseInt(nft.rank || getAttributeValue(nft, "Rank") || "0");
        const min = filters.rankMin ? parseInt(filters.rankMin) : 1;
        const max = filters.rankMax ? parseInt(filters.rankMax) : 1165;
        if (nftRank < min || nftRank > max) {
            return false;
        }
    }

    if (filters.shiny) {
        const shinyValue = getAttributeValue(nft, "Shiny");
        const isShiny = shinyValue?.toLowerCase() === "true" || shinyValue === "1" || shinyValue?.toLowerCase() === "yes";
        if (filters.shiny === "true" && !isShiny) return false;
        if (filters.shiny === "false" && isShiny) return false;
    }

    if (filters.animated) {
        const animatedValue = getAttributeValue(nft, "Animated");
        const isAnimated = animatedValue?.toLowerCase() === "true" || animatedValue === "1" || animatedValue?.toLowerCase() === "yes";
        if (filters.animated === "true" && !isAnimated) return false;
        if (filters.animated === "false" && isAnimated) return false;
    }

    return true;
}

export function sortNFTs(nfts: FormattedNFT[], filters: FilterState): FormattedNFT[] {
    const sorted = [...nfts];

    if (filters.tokenIdSort) {
        sorted.sort((a, b) => {
            const aId = parseInt(a.tokenId, 16);
            const bId = parseInt(b.tokenId, 16);
            return filters.tokenIdSort === "low-high" ? aId - bId : bId - aId;
        });
    }

    return sorted;
}

export function applyFiltersToNFTs(nfts: FormattedNFT[], filters: FilterState): FormattedNFT[] {
    const filtered = nfts.filter(nft => filterNFT(nft, filters));
    return sortNFTs(filtered, filters);
}

export function filterAuctions(auctions: AuctionWithNFTs[], filters: FilterState): AuctionWithNFTs[] {
    const hasFilters = filters.search || filters.beast || filters.type || filters.tier || 
        filters.levelMin || filters.levelMax || filters.powerMin || filters.powerMax ||
        filters.rankMin || filters.rankMax || filters.shiny || filters.animated || filters.id;
    
    if (!hasFilters) {
        return auctions;
    }

    return auctions.filter(auction => {
        let matchesCollectionSearch = true;

        if (filters.id) {
            matchesCollectionSearch = Number(auction.auction_id) === Number(filters.id);
        }

        if (filters.search) {
            matchesCollectionSearch = matchesSearch(auction.name, filters.search);
        }

        if (auction.nfts.length === 0) {
            if (filters.search && !filters.beast && !filters.type && !filters.tier && 
                !filters.levelMin && !filters.levelMax && !filters.powerMin && !filters.powerMax &&
                !filters.rankMin && !filters.rankMax && !filters.shiny && !filters.animated && !filters.id) {
                return matchesCollectionSearch;
            }
            return false;
        }

        const nftFilters: FilterState = {
            ...filters,
            search: "",
        };
        const matchesNFTFilters = auction.nfts.some(nft => filterNFT(nft, nftFilters));

        return matchesCollectionSearch && matchesNFTFilters;
    });
}

export function sortAuctions(auctions: AuctionWithNFTs[], filters: FilterState): AuctionWithNFTs[] {
    const sorted = [...auctions];

    // PRIMARY SORT: Active auctions first, expired auctions last
    sorted.sort((a, b) => {
        const aExpired = isExpired(a);
        const bExpired = isExpired(b);

        // If one is expired and the other isn't, non-expired comes first
        if (aExpired && !bExpired) return 1;  // a goes after b
        if (!aExpired && bExpired) return -1; // a goes before b

        // If both same expiration status, maintain current order (stable sort)
        return 0;
    });

    // SECONDARY SORT: Price (if specified)
    if (filters.priceSort) {
        // Sort within each group (active/expired) separately
        const active = sorted.filter(a => !isExpired(a));
        const expired = sorted.filter(a => isExpired(a));

        const sortByPrice = (auctions: AuctionWithNFTs[]) => {
            return auctions.sort((a, b) => {
                const parseValue = (value: string | undefined): number => {
                    if (!value) return 0;
                    return value.startsWith('0x') || value.startsWith('0X')
                        ? parseInt(value, 16)
                        : parseFloat(value);
                };

                const aPrice = a.current_bid ? parseValue(a.current_bid) / 1e6 : parseValue(a.starting_price);
                const bPrice = b.current_bid ? parseValue(b.current_bid) / 1e6 : parseValue(b.starting_price);
                return filters.priceSort === "low-high" ? aPrice - bPrice : bPrice - aPrice;
            });
        };

        return [...sortByPrice(active), ...sortByPrice(expired)];
    }

    // SECONDARY SORT: Token ID (if specified and no price sort)
    if (filters.tokenIdSort && !filters.priceSort) {
        const active = sorted.filter(a => !isExpired(a));
        const expired = sorted.filter(a => isExpired(a));

        const sortByTokenId = (auctions: AuctionWithNFTs[]) => {
            return auctions.sort((a, b) => {
                const aFirstNft = a.nfts[0];
                const bFirstNft = b.nfts[0];
                if (!aFirstNft || !bFirstNft) return 0;
                const aId = parseInt(aFirstNft.tokenId, 16);
                const bId = parseInt(bFirstNft.tokenId, 16);
                return filters.tokenIdSort === "low-high" ? aId - bId : bId - aId;
            });
        };

        return [...sortByTokenId(active), ...sortByTokenId(expired)];
    }

    return sorted;
}

export function applyFiltersToAuctions(auctions: AuctionWithNFTs[], filters: FilterState): AuctionWithNFTs[] {
    const filtered = filterAuctions(auctions, filters);
    return sortAuctions(filtered, filters);
}

