import type { FormattedNFT } from "./types";
import type { FilterState } from "../components/filters/filters";
import type { AuctionWithNFTs } from "../hooks";
import { calculateAdventurerRating } from "./utils/adventurer-rating";

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

function getAttrFromList(attributes: { trait_type?: string; value?: string | number }[], traitType: string): string | undefined {
    const exact = attributes.find((a) => a.trait_type === traitType);
    if (exact) return String(exact.value);
    const lower = traitType.toLowerCase();
    const insensitive = attributes.find((a) => (a.trait_type ?? "").toLowerCase() === lower);
    return insensitive ? String(insensitive.value) : undefined;
}

function getAttributeValue(nft: FormattedNFT, traitType: string): string | undefined {
    const fromAttrs = getAttrFromList(nft.attributes ?? [], traitType);
    if (fromAttrs !== undefined) return fromAttrs;
    const fromMeta = nft.metadata?.attributes ? getAttrFromList(nft.metadata.attributes, traitType) : undefined;
    return fromMeta;
}

/** Min/max for Level, Health, and the six stats across the given NFTs. Used for adventurer filter sliders. */
export interface AdventurerStatBounds {
    levelMin: number;
    levelMax: number;
    healthMin: number;
    healthMax: number;
    strengthMin: number;
    strengthMax: number;
    dexterityMin: number;
    dexterityMax: number;
    vitalityMin: number;
    vitalityMax: number;
    intelligenceMin: number;
    intelligenceMax: number;
    wisdomMin: number;
    wisdomMax: number;
    charismaMin: number;
    charismaMax: number;
}

const DEFAULT_ADVENTURER_BOUNDS: AdventurerStatBounds = {
    levelMin: 1, levelMax: 100, healthMin: 0, healthMax: 100,
    strengthMin: 0, strengthMax: 30, dexterityMin: 0, dexterityMax: 30, vitalityMin: 0, vitalityMax: 30,
    intelligenceMin: 0, intelligenceMax: 30, wisdomMin: 0, wisdomMax: 30, charismaMin: 0, charismaMax: 30,
};

/**
 * Parse a numeric value from filter input or NFT attribute.
 * Handles decimal ("127"), hex ("0x7f"), and numeric type from JSON.
 * Starknet/Torii may return trait values as hex or felt; we normalize to a number for range comparison.
 */
function parseNum(val: string | number | undefined): number {
    if (val === undefined || val === "") return NaN;
    const s = String(val).trim();
    if (!s) return NaN;
    // Hex/felt: try hex first so "0x7f" -> 127 (parseInt(s, 10) would return 0 and break filtering)
    if (s.startsWith("0x") || s.startsWith("0X")) {
        const n = parseInt(s, 16);
        return isNaN(n) ? NaN : n;
    }
    const n = parseInt(s, 10);
    return isNaN(n) ? NaN : n;
}

export function computeAdventurerStatBounds(nfts: FormattedNFT[]): AdventurerStatBounds {
    if (nfts.length === 0) return DEFAULT_ADVENTURER_BOUNDS;

    const levelVals: number[] = [];
    const healthVals: number[] = [];
    const statVals: Record<string, number[]> = {
        Strength: [], Dexterity: [], Vitality: [], Intelligence: [], Wisdom: [], Charisma: [],
    };

    for (const nft of nfts) {
        const level = parseNum(nft.level || getAttributeValue(nft, "Level"));
        if (!isNaN(level)) levelVals.push(level);

        const healthRaw = nft.health ?? getAttributeValue(nft, "Health") ?? "";
        const health = parseNum(String(healthRaw));
        if (!isNaN(health)) healthVals.push(health);

        for (const attr of ["Strength", "Dexterity", "Vitality", "Intelligence", "Wisdom", "Charisma"] as const) {
            const v = parseNum(getAttributeValue(nft, attr));
            if (!isNaN(v)) statVals[attr].push(v);
        }
    }

    const minMax = (arr: number[], defaultMin: number, defaultMax: number) => ({
        min: arr.length ? Math.min(...arr) : defaultMin,
        max: arr.length ? Math.max(...arr) : defaultMax,
    });

    const level = minMax(levelVals, 1, 100);
    const health = minMax(healthVals, 0, 100);

    return {
        levelMin: level.min,
        levelMax: Math.max(level.max, level.min, 1),
        healthMin: health.min,
        healthMax: Math.max(health.max, health.min, 0),
        strengthMin: statVals.Strength.length ? Math.min(...statVals.Strength) : 0,
        strengthMax: statVals.Strength.length ? Math.max(...statVals.Strength) : 30,
        dexterityMin: statVals.Dexterity.length ? Math.min(...statVals.Dexterity) : 0,
        dexterityMax: statVals.Dexterity.length ? Math.max(...statVals.Dexterity) : 30,
        vitalityMin: statVals.Vitality.length ? Math.min(...statVals.Vitality) : 0,
        vitalityMax: statVals.Vitality.length ? Math.max(...statVals.Vitality) : 30,
        intelligenceMin: statVals.Intelligence.length ? Math.min(...statVals.Intelligence) : 0,
        intelligenceMax: statVals.Intelligence.length ? Math.max(...statVals.Intelligence) : 30,
        wisdomMin: statVals.Wisdom.length ? Math.min(...statVals.Wisdom) : 0,
        wisdomMax: statVals.Wisdom.length ? Math.max(...statVals.Wisdom) : 30,
        charismaMin: statVals.Charisma.length ? Math.min(...statVals.Charisma) : 0,
        charismaMax: statVals.Charisma.length ? Math.max(...statVals.Charisma) : 30,
    };
}

function matchesSearch(text: string | undefined, search: string): boolean {
    if (!search) return true;
    if (!text) return false;
    return text.toLowerCase().includes(search.toLowerCase());
}

export function filterNFT(nft: FormattedNFT, filters: FilterState): boolean {
    // Auction ID filter (e.g. from URL ?auction=): when set, only show NFTs from that auction
    const idTrimmed = filters.id != null ? String(filters.id).trim() : "";
    if (idTrimmed !== "") {
        const nftAuctionId = (nft as { auctionId?: string }).auctionId;
        if (nftAuctionId == null || String(nftAuctionId) !== idTrimmed) return false;
    }

    if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesName = matchesSearch(nft.metadataName, filters.search);
        const matchesBeast = matchesSearch(nft.beastName, filters.search);
        const tokenIdStr = String(nft.tokenId ?? "");
        const tokenIdNum = tokenIdStr.startsWith("0x") || tokenIdStr.startsWith("0X")
            ? (typeof BigInt !== "undefined" ? BigInt(tokenIdStr).toString(10) : parseInt(tokenIdStr, 16).toString())
            : tokenIdStr;
        const matchesTokenId = tokenIdNum.includes(searchLower);
        
        const matchesAttributes = (nft.attributes ?? []).some(attr => 
            String(attr.value ?? "").toLowerCase().includes(searchLower)
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

    // Level: when filter is set, require Level data and that it's in range. Prefer attributes (API-merged) over top-level nft.level so Sell grid uses fresh data.
    const levelMinSet = filters.levelMin != null && String(filters.levelMin).trim() !== "";
    const levelMaxSet = filters.levelMax != null && String(filters.levelMax).trim() !== "";
    if (levelMinSet || levelMaxSet) {
        const rawLevel = getAttributeValue(nft, "Level") ?? nft.level ?? "";
        const nftLevel = parseNum(String(rawLevel).trim());
        if (isNaN(nftLevel)) return false;
        const parsedLevelMin = parseNum(String(filters.levelMin ?? "").trim());
        const parsedLevelMax = parseNum(String(filters.levelMax ?? "").trim());
        let min = levelMinSet ? (isNaN(parsedLevelMin) ? 1 : parsedLevelMin) : 1;
        let max = levelMaxSet ? (isNaN(parsedLevelMax) ? 140 : parsedLevelMax) : 140;
        if (min > max) [min, max] = [max, min];
        if (nftLevel < min || nftLevel > max) return false;
    }

    // Adventurer: Health – when filter is set, require Health data and that it's in range. Prefer attributes (API-merged) over top-level nft.health so Sell grid uses fresh data.
    const healthMinSet = filters.healthMin != null && String(filters.healthMin).trim() !== "";
    const healthMaxSet = filters.healthMax != null && String(filters.healthMax).trim() !== "";
    if (healthMinSet || healthMaxSet) {
        const rawHealth = getAttributeValue(nft, "Health") ?? nft.health ?? "";
        const nftHealth = parseNum(String(rawHealth).trim());
        if (isNaN(nftHealth)) return false;
        const parsedHealthMin = parseNum(String(filters.healthMin ?? "").trim());
        const parsedHealthMax = parseNum(String(filters.healthMax ?? "").trim());
        const defaultHealthMax = 1000;
        let min = healthMinSet ? (isNaN(parsedHealthMin) ? 0 : parsedHealthMin) : 0;
        let max = healthMaxSet ? (isNaN(parsedHealthMax) ? defaultHealthMax : parsedHealthMax) : defaultHealthMax;
        if (min > max) [min, max] = [max, min];
        if (nftHealth < min || nftHealth > max) return false;
    }
    // Adventurer: Strength, Dexterity, etc. – when filter is set, require stat data and that it's in range. Exclude when no data.
    const statKeys: { min: keyof FilterState; max: keyof FilterState; attr: string; defaultMax: number }[] = [
        { min: "strengthMin", max: "strengthMax", attr: "Strength", defaultMax: 30 },
        { min: "dexterityMin", max: "dexterityMax", attr: "Dexterity", defaultMax: 30 },
        { min: "vitalityMin", max: "vitalityMax", attr: "Vitality", defaultMax: 30 },
        { min: "intelligenceMin", max: "intelligenceMax", attr: "Intelligence", defaultMax: 30 },
        { min: "wisdomMin", max: "wisdomMax", attr: "Wisdom", defaultMax: 30 },
        { min: "charismaMin", max: "charismaMax", attr: "Charisma", defaultMax: 30 },
    ];
    for (const { min: minKey, max: maxKey, attr, defaultMax } of statKeys) {
        const minVal = filters[minKey] != null ? String(filters[minKey]).trim() : "";
        const maxVal = filters[maxKey] != null ? String(filters[maxKey]).trim() : "";
        if (minVal === "" && maxVal === "") continue;
        const rawStat = getAttributeValue(nft, attr) || "";
        const nftVal = parseNum(String(rawStat).trim());
        if (isNaN(nftVal)) return false;
        const parsedMin = parseNum(minVal);
        const parsedMax = parseNum(maxVal);
        let min = minVal !== "" ? (isNaN(parsedMin) ? 0 : parsedMin) : 0;
        let max = maxVal !== "" ? (isNaN(parsedMax) ? defaultMax : parsedMax) : defaultMax;
        if (min > max) [min, max] = [max, min];
        if (nftVal < min || nftVal > max) return false;
    }

    const powerMinSet = filters.powerMin != null && String(filters.powerMin).trim() !== "";
    const powerMaxSet = filters.powerMax != null && String(filters.powerMax).trim() !== "";
    if (powerMinSet || powerMaxSet) {
        const nftPower = parseFloat(String(nft.power ?? getAttributeValue(nft, "Power") ?? "0")) || 0;
        const parsedPowerMin = parseFloat(String(filters.powerMin ?? ""));
        const parsedPowerMax = parseFloat(String(filters.powerMax ?? ""));
        const min = powerMinSet ? (isNaN(parsedPowerMin) ? 1 : parsedPowerMin) : 1;
        const max = powerMaxSet ? (isNaN(parsedPowerMax) ? 550 : parsedPowerMax) : 550;
        if (nftPower < min || nftPower > max) {
            return false;
        }
    }

    const rankMinSet = filters.rankMin != null && String(filters.rankMin).trim() !== "";
    const rankMaxSet = filters.rankMax != null && String(filters.rankMax).trim() !== "";
    if (rankMinSet || rankMaxSet) {
        const nftRank = parseNum(String(nft.rank ?? getAttributeValue(nft, "Rank") ?? "0"));
        const parsedRankMin = parseNum(String(filters.rankMin ?? ""));
        const parsedRankMax = parseNum(String(filters.rankMax ?? ""));
        const min = rankMinSet ? (isNaN(parsedRankMin) ? 1 : parsedRankMin) : 1;
        const max = rankMaxSet ? (isNaN(parsedRankMax) ? 1165 : parsedRankMax) : 1165;
        if (isNaN(nftRank) || nftRank < min || nftRank > max) {
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

    // Single primary sort: time (for Buy / Sell listed) > price > tokenId. Unlisted (no endTime → 0) sort last.
    if (filters.timeSort) {
        sorted.sort((a, b) => {
            const aEnd = (a as { endTime?: string }).endTime ?? "";
            const bEnd = (b as { endTime?: string }).endTime ?? "";
            const aNum = aEnd ? (aEnd.startsWith("0x") ? parseInt(aEnd, 16) : parseInt(aEnd, 10)) : 0;
            const bNum = bEnd ? (bEnd.startsWith("0x") ? parseInt(bEnd, 16) : parseInt(bEnd, 10)) : 0;
            const noEnd = (x: number) => !Number.isFinite(x) || x <= 0;
            if (noEnd(aNum) && noEnd(bNum)) return 0;
            if (noEnd(aNum)) return 1;
            if (noEnd(bNum)) return -1;
            if (filters.timeSort === "ending-soon") return aNum - bNum;
            if (filters.timeSort === "newest") return bNum - aNum;
            return 0;
        });
    } else if (filters.priceSort) {
        sorted.sort((a, b) => {
            const aPrice = (a as { price?: number }).price ?? 0;
            const bPrice = (b as { price?: number }).price ?? 0;
            return filters.priceSort === "low-high" ? aPrice - bPrice : bPrice - aPrice;
        });
    } else if (filters.tokenIdSort) {
        sorted.sort((a, b) => {
            const aId = parseInt(a.tokenId, 16);
            const bId = parseInt(b.tokenId, 16);
            return filters.tokenIdSort === "low-high" ? aId - bId : bId - aId;
        });
    } else if (filters.levelSort) {
        sorted.sort((a, b) => {
            const rawA = getAttributeValue(a, "Level") ?? (a as { level?: string }).level ?? "";
            const rawB = getAttributeValue(b, "Level") ?? (b as { level?: string }).level ?? "";
            const aNum = parseNum(rawA);
            const bNum = parseNum(rawB);
            const aVal = Number.isFinite(aNum) ? aNum : 0;
            const bVal = Number.isFinite(bNum) ? bNum : 0;
            return filters.levelSort === "low-high" ? aVal - bVal : bVal - aVal;
        });
    } else if (filters.scoreSort) {
        sorted.sort((a, b) => {
            const attrsA = (a.attributes ?? []) as Array<{ trait_type: string; value: string | number }>;
            const attrsB = (b.attributes ?? []) as Array<{ trait_type: string; value: string | number }>;
            const scoreA = attrsA.length > 0 ? calculateAdventurerRating(attrsA) : 0;
            const scoreB = attrsB.length > 0 ? calculateAdventurerRating(attrsB) : 0;
            return filters.scoreSort === "low-high" ? scoreA - scoreB : scoreB - scoreA;
        });
    } else if (filters.tierSort) {
        sorted.sort((a, b) => {
            const rawA = getAttributeValue(a, "Tier") ?? (a as { tier?: string }).tier ?? "";
            const rawB = getAttributeValue(b, "Tier") ?? (b as { tier?: string }).tier ?? "";
            const aNum = parseNum(rawA);
            const bNum = parseNum(rawB);
            const aVal = Number.isFinite(aNum) ? aNum : 0;
            const bVal = Number.isFinite(bNum) ? bNum : 0;
            return filters.tierSort === "low-high" ? aVal - bVal : bVal - aVal;
        });
    } else if (filters.powerSort) {
        sorted.sort((a, b) => {
            const rawA = getAttributeValue(a, "Power") ?? (a as { power?: string }).power ?? "";
            const rawB = getAttributeValue(b, "Power") ?? (b as { power?: string }).power ?? "";
            const aNum = parseNum(rawA);
            const bNum = parseNum(rawB);
            const aVal = Number.isFinite(aNum) ? aNum : 0;
            const bVal = Number.isFinite(bNum) ? bNum : 0;
            return filters.powerSort === "low-high" ? aVal - bVal : bVal - aVal;
        });
    }

    return sorted;
}

/** Returns a copy of filters with all numeric stat min/max cleared. Use this to compute stat bounds from the list *before* stat filters, so bounds stay fixed when the user changes level/health/etc. */
export function getFiltersWithoutStatBounds(filters: FilterState): FilterState {
    return {
        ...filters,
        levelMin: "",
        levelMax: "",
        healthMin: "",
        healthMax: "",
        strengthMin: "",
        strengthMax: "",
        dexterityMin: "",
        dexterityMax: "",
        vitalityMin: "",
        vitalityMax: "",
        intelligenceMin: "",
        intelligenceMax: "",
        wisdomMin: "",
        wisdomMax: "",
        charismaMin: "",
        charismaMax: "",
    };
}

export function applyFiltersToNFTs(nfts: FormattedNFT[], filters: FilterState): FormattedNFT[] {
    const filtered = nfts.filter(nft => filterNFT(nft, filters));
    return sortNFTs(filtered, filters);
}

export function filterAuctions(auctions: AuctionWithNFTs[], filters: FilterState): AuctionWithNFTs[] {
    const hasFilters = filters.search || filters.beast || filters.type || filters.tier ||
        filters.levelMin || filters.levelMax || filters.powerMin || filters.powerMax ||
        filters.rankMin || filters.rankMax || filters.shiny || filters.animated || filters.id ||
        filters.healthMin || filters.healthMax || filters.strengthMin || filters.strengthMax ||
        filters.dexterityMin || filters.dexterityMax || filters.vitalityMin || filters.vitalityMax ||
        filters.intelligenceMin || filters.intelligenceMax || filters.wisdomMin || filters.wisdomMax ||
        filters.charismaMin || filters.charismaMax;
    
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
            const noNftFilters = !filters.beast && !filters.type && !filters.tier &&
                !filters.levelMin && !filters.levelMax && !filters.powerMin && !filters.powerMax &&
                !filters.rankMin && !filters.rankMax && !filters.shiny && !filters.animated && !filters.id &&
                !filters.healthMin && !filters.healthMax && !filters.strengthMin && !filters.strengthMax &&
                !filters.dexterityMin && !filters.dexterityMax && !filters.vitalityMin && !filters.vitalityMax &&
                !filters.intelligenceMin && !filters.intelligenceMax && !filters.wisdomMin && !filters.wisdomMax &&
                !filters.charismaMin && !filters.charismaMax;
            if (filters.search && noNftFilters) {
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

                const aPrice = (a.current_bid ? parseValue(a.current_bid) : parseValue(a.starting_price)) / 1e6;
                const bPrice = (b.current_bid ? parseValue(b.current_bid) : parseValue(b.starting_price)) / 1e6;
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

