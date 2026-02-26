"use client";

import { useMemo } from "react";
import type { FormattedNFT, AuctionItem } from "../../lib/types";
import { formatUSDSmart, truncateAuctionName } from "../../lib/utils";
import { normalizeTokenId } from "../../lib/utils/normalization";
import { ADVENTURER_NFT_CONTRACT_ADDRESS } from "../../lib/constants";
import { CountdownTimer, BidPriceChart } from "../ui";

// Helper to generate static adventurer image URL
const getAdventurerImageUrl = (tokenId: string): string => {
    // Parse token ID to number
    const tokenIdNum = tokenId.startsWith("0x")
        ? parseInt(tokenId, 16)
        : parseInt(tokenId, 10);
    // Pad to 64 hex characters
    const paddedTokenId = "0x" + tokenIdNum.toString(16).padStart(64, '0');
    return `https://api.cartridge.gg/x/arcade-main/torii/static/${ADVENTURER_NFT_CONTRACT_ADDRESS}/${paddedTokenId}/image`;
};

type AdventurerCollectionCardProps = {
    collection: {
        id: string;
        name: string;
        fullName?: string;
        totalMonsters: number;
        startingPrice: number;
        highestBid?: number;
        image: string;
        endTime?: string;
        status?: string;
    };
    isSelected: boolean;
    onSelect: () => void;
    onQuickBid?: () => void;
    nfts?: FormattedNFT[];
    items?: AuctionItem[];
};

// Helper to calculate time remaining
const getSecondsRemaining = (endTime?: string): number | null => {
    if (!endTime) return null;
    try {
        const endTimeNum = endTime.startsWith("0x") || endTime.startsWith("0X")
            ? parseInt(endTime, 16)
            : parseInt(endTime, 10);
        if (isNaN(endTimeNum) || endTimeNum === 0) return null;
        const now = Math.floor(Date.now() / 1000);
        return endTimeNum - now;
    } catch {
        return null;
    }
};

export default function AdventurerCollectionCard({
    collection,
    isSelected,
    onSelect,
    onQuickBid,
    nfts = [],
    items = []
}: AdventurerCollectionCardProps) {
    // Generate image URLs for all items
    const adventurerImages = useMemo(() => {
        // First try to use items (auction items from contract)
        if (items.length > 0) {
            return items.map(item => {
                const tokenId = normalizeTokenId(item.token_id);
                return tokenId ? getAdventurerImageUrl(tokenId) : null;
            }).filter((url): url is string => url !== null);
        }
        // Fall back to nfts if available
        if (nfts.length > 0) {
            return nfts.map(nft => getAdventurerImageUrl(nft.tokenId));
        }
        return [];
    }, [items, nfts]);

    // Check if auction is expired (time ran out but status not updated on-chain)
    const isExpired = useMemo(() => {
        const secondsRemaining = getSecondsRemaining(collection.endTime);
        const isActive = collection.status && parseInt(collection.status) === 2;
        return isActive && secondsRemaining !== null && secondsRemaining <= 0;
    }, [collection.endTime, collection.status]);

    // Calculate urgency level
    const urgencyInfo = useMemo(() => {
        const secondsRemaining = getSecondsRemaining(collection.endTime);
        const hasBids = collection.highestBid && collection.highestBid > 0;
        const isActive = collection.status && parseInt(collection.status) === 2;

        if (!isActive || secondsRemaining === null || secondsRemaining <= 0) {
            return { level: 'none', badge: null };
        }

        if (secondsRemaining <= 3600) {
            return {
                level: 'critical',
                badge: { text: 'Ending Soon!', color: 'bg-red-500', animate: true }
            };
        }
        if (secondsRemaining <= 14400) {
            return {
                level: 'high',
                badge: { text: 'Ending Soon', color: 'bg-orange-500', animate: false }
            };
        }
        if (hasBids) {
            return {
                level: 'active',
                badge: { text: 'Hot', color: 'bg-[rgb(50,255,52)]', animate: false, icon: '🔥' }
            };
        }
        return { level: 'normal', badge: null };
    }, [collection.endTime, collection.highestBid, collection.status]);

    const hasBids = collection.highestBid && collection.highestBid > 0;

    const stats = [
        {
            label: "Reserved Price",
            value: formatUSDSmart(collection.startingPrice / 1e6),
            suffix: undefined,
        },
        {
            label: "Highest Bid",
            value: hasBids
                ? formatUSDSmart(collection.highestBid!)
                : isExpired
                    ? "No bids"
                    : "Be first!",
            suffix: !hasBids && !isExpired ? "Set the price" : undefined,
            highlight: !hasBids && !isExpired,
            muted: isExpired && !hasBids,
        },
    ];

    return (
        <article
            role="button"
            tabIndex={0}
            onClick={onSelect}
            onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect();
                }
            }}
            className={`group relative flex h-full w-full flex-col gap-6 overflow-hidden rounded-3xl border border-[rgb(50,255,52)]/20 bg-black/60 p-7 transition duration-200 hover:-translate-y-1 hover:border-[rgb(50,255,52)]/60 hover:shadow-[0_18px_45px_rgba(10,30,10,0.45)] hover:cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(50,255,52)]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
                isSelected ? "border-[rgb(50,255,52)]/80 shadow-[0_22px_55px_rgba(20,255,80,0.35)]" : ""
            }`}
        >
            {isSelected && (
                <div className="absolute top-4 right-5 z-20" title="Currently viewing this auction">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-[rgb(50,255,52)] transition-all duration-200 group-hover:scale-110"
                    >
                        <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
                        <path d="m9 12 2 2 4-4" />
                    </svg>
                </div>
            )}

            {/* Expired Badge */}
            {isExpired && (
                <div className="absolute top-4 left-4 z-20 px-2.5 py-1 rounded-full text-[10px] font-orbitron uppercase tracking-wider font-bold text-white bg-red-600">
                    Expired
                </div>
            )}
            {/* Urgency Badge */}
            {!isExpired && urgencyInfo.badge && (
                <div className={`absolute top-4 left-4 z-20 px-2.5 py-1 rounded-full text-[10px] font-orbitron uppercase tracking-wider font-bold text-black ${urgencyInfo.badge.color} ${urgencyInfo.badge.animate ? 'animate-urgency-pulse' : ''}`}>
                    <span className="flex items-center gap-1">
                        {urgencyInfo.badge.icon && <span className="animate-fire">{urgencyInfo.badge.icon}</span>}
                        {urgencyInfo.badge.text}
                    </span>
                </div>
            )}

            <header className="flex flex-col gap-1 text-[11px] font-orbitron uppercase tracking-[0.16em] text-[rgb(186,255,188)]/75">
                <span className="text-[10px] tracking-[0.2em] text-[rgb(186,255,188)]/60">
                    {collection.totalMonsters} adventurer{collection.totalMonsters === 1 ? '' : 's'} in this collection
                </span>
            </header>

            <div className="flex flex-col items-center gap-4 text-center">
                {/* Images Grid */}
                <div className="h-24 w-24">
                    {adventurerImages.length === 0 ? (
                        <div className="flex h-full w-full items-center justify-center rounded-2xl">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                className="w-12 h-12 text-[rgb(50,255,52)]/40"
                            >
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="m22 8-4 4" />
                                <path d="m18 8 4 4" />
                            </svg>
                        </div>
                    ) : adventurerImages.length === 1 ? (
                        <div className="h-full w-full overflow-hidden rounded-2xl">
                            <img
                                src={adventurerImages[0]}
                                alt={collection.name}
                                draggable={false}
                                className="h-full w-full object-contain"
                            />
                        </div>
                    ) : adventurerImages.length === 2 ? (
                        <div className="flex h-full w-full gap-1">
                            {adventurerImages.slice(0, 2).map((imageUrl, idx) => (
                                <div key={idx} className="h-full w-1/2 overflow-hidden">
                                    <img
                                        src={imageUrl}
                                        alt={`${collection.name} ${idx + 1}`}
                                        draggable={false}
                                        className="h-full w-full object-contain"
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid h-full w-full grid-cols-2 gap-1">
                            {adventurerImages.slice(0, 3).map((imageUrl, idx) => (
                                <div key={idx} className="aspect-square overflow-hidden">
                                    <img
                                        src={imageUrl}
                                        alt={`${collection.name} ${idx + 1}`}
                                        draggable={false}
                                        className="h-full w-full object-contain"
                                    />
                                </div>
                            ))}
                            {adventurerImages.length > 3 ? (
                                <div className="aspect-square flex items-center justify-center border border-[rgb(50,255,52)]/40 bg-[rgb(50,255,52)]/12 text-[10px] font-orbitron uppercase tracking-widest text-[rgb(50,255,52)]">
                                    +{adventurerImages.length - 3} more
                                </div>
                            ) : null}
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-2 text-white">
                    <h3
                        className="text-xl font-orbitron uppercase tracking-[0.12em]"
                        title={collection.fullName || collection.name}
                    >
                        {truncateAuctionName(collection.name)}
                    </h3>

                    {collection.endTime && (
                        <p className="text-xs text-[rgb(186,255,188)]/70">
                            {collection.status && parseInt(collection.status) === 3 ? (
                                <CountdownTimer endTime={collection.endTime} status={collection.status} className="font-orbitron" showUrgency={false} />
                            ) : (
                                <>Ends in: <CountdownTimer endTime={collection.endTime} status={collection.status} className="font-orbitron" showUrgency={true} /></>
                            )}
                        </p>
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-3 text-white">
                {stats.map((stat) => (
                    <div
                        key={stat.label}
                        className={`flex flex-col gap-1 rounded-2xl border px-5 py-3 text-left ${
                            stat.highlight
                                ? 'border-orange-500/40 bg-orange-500/10'
                                : 'border-white/12 bg-white/5'
                        }`}
                    >
                        <p className="text-[rgb(186,255,188)]/70 text-[10px] font-orbitron uppercase tracking-[0.18em]">
                            {stat.label}
                        </p>
                        <p className={`text-2xl font-orbitron tracking-tight ${
                            stat.highlight ? 'text-orange-400' : stat.muted ? 'text-white/50' : 'text-white'
                        }`}>{stat.value}</p>
                        {stat.suffix ? (
                            <span className={`text-xs font-orbitron uppercase tracking-[0.18em] ${
                                stat.highlight ? 'text-orange-400/80' : 'text-[rgb(186,255,188)]/80'
                            }`}>
                                {stat.suffix}
                            </span>
                        ) : null}
                    </div>
                ))}
                <div className="flex flex-col gap-2 rounded-2xl border border-[rgb(50,255,52)]/20 bg-[rgb(50,255,52)]/5 px-4 py-3">
                    <p className="text-[rgb(186,255,188)]/70 text-[10px] font-orbitron uppercase tracking-[0.18em]">
                        Live Price Chart
                    </p>
                    <BidPriceChart
                        width={200}
                        height={60}
                        startingPrice={collection.startingPrice / 1e6}
                        currentBid={collection.highestBid}
                    />
                </div>

                {/* Quick Bid Button - only show for active auctions that haven't expired */}
                {onQuickBid && collection.status && parseInt(collection.status) === 2 && !isExpired && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onQuickBid();
                        }}
                        className={`w-full mt-2 py-3 px-4 rounded-xl font-orbitron font-bold text-sm uppercase tracking-wider transition-all active:scale-[0.98] ${
                            urgencyInfo.level === 'critical'
                                ? 'bg-orange-500 text-black hover:bg-orange-400 hover:shadow-[0_0_20px_rgba(249,115,22,0.5)] animate-subtle-pulse'
                                : 'bg-[rgb(50,255,52)] text-black hover:bg-[rgb(40,220,42)] hover:shadow-[0_0_20px_rgba(50,255,52,0.4)]'
                        }`}
                    >
                        <span className="flex items-center justify-center gap-2">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                            </svg>
                            {hasBids ? 'Place Bid' : 'Be First to Bid'}
                        </span>
                    </button>
                )}
            </div>
        </article>
    );
}
