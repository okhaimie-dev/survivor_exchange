import { FormattedNFT } from "./graphql";
import { FilterState } from "../components/filters";
import { AuctionWithNFTs } from "../hooks/use-auctions";

/**
 * Gets an attribute value from NFT attributes array
 */
function getAttributeValue(nft: FormattedNFT, traitType: string): string | undefined {
    const attr = nft.attributes.find((a) => a.trait_type === traitType);
    return attr ? String(attr.value) : undefined;
}

/**
 * Checks if a string matches a search query (case-insensitive)
 */
function matchesSearch(text: string | undefined, search: string): boolean {
    if (!search) return true;
    if (!text) return false;
    return text.toLowerCase().includes(search.toLowerCase());
}

/**
 * Filters a single NFT based on filter criteria
 */
export function filterNFT(nft: FormattedNFT, filters: FilterState): boolean {
    // Search filter
    if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesName = matchesSearch(nft.metadataName, filters.search);
        const matchesBeast = matchesSearch(nft.beastName, filters.search);
        const tokenIdNum = parseInt(nft.tokenId, 16).toString();
        const matchesTokenId = tokenIdNum.includes(searchLower);
        
        // Check all attributes
        const matchesAttributes = nft.attributes.some(attr => 
            String(attr.value).toLowerCase().includes(searchLower)
        );
        
        if (!matchesName && !matchesBeast && !matchesTokenId && !matchesAttributes) {
            return false;
        }
    }

    // Beast filter
    if (filters.beast) {
        if (nft.beastName !== filters.beast) {
            return false;
        }
    }

    // Type filter
    if (filters.type) {
        const nftType = nft.beastType || getAttributeValue(nft, "Type");
        if (nftType !== filters.type) {
            return false;
        }
    }

    // Tier filter
    if (filters.tier) {
        const nftTier = nft.tier || getAttributeValue(nft, "Tier");
        if (nftTier !== filters.tier) {
            return false;
        }
    }

    // Level range filter
    if (filters.levelMin || filters.levelMax) {
        const nftLevel = parseInt(nft.level || getAttributeValue(nft, "Level") || "0");
        const min = filters.levelMin ? parseInt(filters.levelMin) : 1;
        const max = filters.levelMax ? parseInt(filters.levelMax) : 140;
        if (nftLevel < min || nftLevel > max) {
            return false;
        }
    }

    // Power range filter
    if (filters.powerMin || filters.powerMax) {
        const nftPower = parseFloat(nft.power || getAttributeValue(nft, "Power") || "0");
        const min = filters.powerMin ? parseFloat(filters.powerMin) : 1;
        const max = filters.powerMax ? parseFloat(filters.powerMax) : 550;
        if (nftPower < min || nftPower > max) {
            return false;
        }
    }

    // Rank range filter
    if (filters.rankMin || filters.rankMax) {
        const nftRank = parseInt(nft.rank || getAttributeValue(nft, "Rank") || "0");
        const min = filters.rankMin ? parseInt(filters.rankMin) : 1;
        const max = filters.rankMax ? parseInt(filters.rankMax) : 1165;
        if (nftRank < min || nftRank > max) {
            return false;
        }
    }

    // Shiny filter - check attributes for "Shiny" trait
    if (filters.shiny) {
        const shinyValue = getAttributeValue(nft, "Shiny");
        const isShiny = shinyValue?.toLowerCase() === "true" || shinyValue === "1" || shinyValue?.toLowerCase() === "yes";
        if (filters.shiny === "true" && !isShiny) return false;
        if (filters.shiny === "false" && isShiny) return false;
    }

    // Animated filter - check attributes for "Animated" trait
    if (filters.animated) {
        const animatedValue = getAttributeValue(nft, "Animated");
        const isAnimated = animatedValue?.toLowerCase() === "true" || animatedValue === "1" || animatedValue?.toLowerCase() === "yes";
        if (filters.animated === "true" && !isAnimated) return false;
        if (filters.animated === "false" && isAnimated) return false;
    }

    return true;
}

/**
 * Sorts NFTs based on sort criteria
 */
export function sortNFTs(nfts: FormattedNFT[], filters: FilterState): FormattedNFT[] {
    let sorted = [...nfts];

    // Price sort (for auctions, this would be starting price - handled in auction component)
    // Token ID sort
    if (filters.tokenIdSort) {
        sorted.sort((a, b) => {
            const aId = parseInt(a.tokenId, 16);
            const bId = parseInt(b.tokenId, 16);
            return filters.tokenIdSort === "low-high" ? aId - bId : bId - aId;
        });
    }

    return sorted;
}

/**
 * Filters and sorts NFTs
 */
export function applyFiltersToNFTs(nfts: FormattedNFT[], filters: FilterState): FormattedNFT[] {
    const filtered = nfts.filter(nft => filterNFT(nft, filters));
    return sortNFTs(filtered, filters);
}

/**
 * Filters auctions based on their NFT properties
 * For bids: searches collection names and filters by any NFT in the collection
 */
export function filterAuctions(auctions: AuctionWithNFTs[], filters: FilterState): AuctionWithNFTs[] {
    // Check if any filters are active
    const hasFilters = filters.search || filters.beast || filters.type || filters.tier || 
        filters.levelMin || filters.levelMax || filters.powerMin || filters.powerMax ||
        filters.rankMin || filters.rankMax || filters.shiny || filters.animated;
    
    if (!hasFilters) {
        return auctions;
    }

    return auctions.filter(auction => {
        // Search: Primary focus on collection name (auction.name)
        let matchesCollectionSearch = true;
        if (filters.search) {
            matchesCollectionSearch = matchesSearch(auction.name, filters.search);
        }

        // If auction has no NFTs
        if (auction.nfts.length === 0) {
            // If only search is active, return based on collection name match
            if (filters.search && !filters.beast && !filters.type && !filters.tier && 
                !filters.levelMin && !filters.levelMax && !filters.powerMin && !filters.powerMax &&
                !filters.rankMin && !filters.rankMax && !filters.shiny && !filters.animated) {
                return matchesCollectionSearch;
            }
            // If other filters are active, exclude auctions without NFTs
            return false;
        }

        // Filters: Check if ANY NFT in the collection matches the filter criteria
        // Create filter state without search (search is handled separately for collection names)
        const nftFilters: FilterState = {
            ...filters,
            search: "", // Search is for collection names only
        };
        const matchesNFTFilters = auction.nfts.some(nft => filterNFT(nft, nftFilters));

        // Collection matches if: collection name matches search AND any NFT matches filters
        return matchesCollectionSearch && matchesNFTFilters;
    });
}

/**
 * Sorts auctions based on price
 */
export function sortAuctions(auctions: AuctionWithNFTs[], filters: FilterState): AuctionWithNFTs[] {
    let sorted = [...auctions];

    if (filters.priceSort) {
        sorted.sort((a, b) => {
            const aPrice = parseFloat(a.current_bid || a.starting_price || "0");
            const bPrice = parseFloat(b.current_bid || b.starting_price || "0");
            return filters.priceSort === "low-high" ? aPrice - bPrice : bPrice - aPrice;
        });
    }

    // Token ID sort (sort by first NFT's token ID in auction)
    if (filters.tokenIdSort && !filters.priceSort) {
        sorted.sort((a, b) => {
            const aFirstNft = a.nfts[0];
            const bFirstNft = b.nfts[0];
            if (!aFirstNft || !bFirstNft) return 0;
            const aId = parseInt(aFirstNft.tokenId, 16);
            const bId = parseInt(bFirstNft.tokenId, 16);
            return filters.tokenIdSort === "low-high" ? aId - bId : bId - aId;
        });
    }

    return sorted;
}

/**
 * Applies filters and sorting to auctions
 */
export function applyFiltersToAuctions(auctions: AuctionWithNFTs[], filters: FilterState): AuctionWithNFTs[] {
    const filtered = filterAuctions(auctions, filters);
    return sortAuctions(filtered, filters);
}

