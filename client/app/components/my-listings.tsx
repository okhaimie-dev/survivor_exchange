import Image from "next/image";
import moment from "moment";
import { useAccount, useExplorer } from "@starknet-react/core";
import { useState, useCallback } from "react";
import { FormattedListing } from "../hooks/use-my-listings";

const AUCTION_CONTRACT_ADDRESS = "0x058568FF97b6F409F69183b091af8f476eEcb4Db71e270E25c7b145ADBb2FdE6";

const formatEth = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return "—";
    return `${value.toFixed(2)}`;
};

const formatTimeAgo = (timestamp: string): string => {
    if (!timestamp) return "Unknown";
    
    try {
        // Handle hex format (e.g., "0x691e5dc5") or decimal string
        let timestampNum: number;
        
        // Check if it's a hex string (starts with 0x)
        if (timestamp.startsWith('0x') || timestamp.startsWith('0X')) {
            timestampNum = parseInt(timestamp, 16);
        } else {
            // Try parsing as decimal first
            timestampNum = parseInt(timestamp, 10);
        }
        
        // If timestamp is 0x0 or 0, return empty string to render nothing
        if (timestampNum === 0) return "";
        
        if (isNaN(timestampNum)) return "Unknown";
        
        // Convert Unix timestamp to date string format: "2025-11-20 01:16:05"
        const dateObj = new Date(timestampNum * 1000); // Convert seconds to milliseconds
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        const hours = String(dateObj.getHours()).padStart(2, '0');
        const minutes = String(dateObj.getMinutes()).padStart(2, '0');
        const seconds = String(dateObj.getSeconds()).padStart(2, '0');
        const dateString = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        
        // Use moment on the formatted date string
        const date = moment(dateString, 'YYYY-MM-DD HH:mm:ss');
        const fromNow = date.fromNow();
        
        return fromNow;
    } catch {
        return "Unknown";
    }
};

const getStatusStyle = (status: string): string => {
    // Handle numeric status codes
    if (status == "1") {
        return "bg-[rgb(50,255,52)]/10 text-[rgb(50,255,52)] border border-[rgb(50,255,52)]/40";
    }
    if (status == "2") {
        return "bg-white/10 text-white border border-white/20";
    }
    if (status === "pending" || status === "queued") {
        return "bg-yellow-400/10 text-yellow-300 border border-yellow-300/30";
    }
    return "bg-white/10 text-white border border-white/20";
};

const getStatusLabel = (status: string): string => {
    if (status == "1") return "ongoing";
    if (status == "2") return "expired";
    return status;
};

interface MyListingsProps {
    listings: FormattedListing[];
    loading: boolean;
    error: Error | null;
}

export default function MyListings({ listings, loading, error }: MyListingsProps) {
    const { account } = useAccount();
    const explorer = useExplorer();
    const [isEndingAuction, setIsEndingAuction] = useState<string | null>(null);
    const [txnHashes, setTxnHashes] = useState<Record<string, string>>({});

    const handleEndAuction = useCallback(async (auctionId: string) => {
        if (!account) {
            return;
        }

        try {
            setIsEndingAuction(auctionId);

            const response = await account.execute({
                contractAddress: AUCTION_CONTRACT_ADDRESS,
                entrypoint: "end_auction",
                calldata: [auctionId]
            });

            setTxnHashes(prev => ({ ...prev, [auctionId]: response.transaction_hash }));
        } catch (err) {
            console.error("Error ending auction:", err);
        } finally {
            setIsEndingAuction(null);
        }
    }, [account]);
    if (loading) {
        return (
            <section className="flex w-full flex-col gap-6">
                <header className="flex flex-col gap-2">
                    <h2 className="text-2xl font-orbitron uppercase tracking-[0.4em] text-white">My Listings</h2>
                    <p className="text-sm text-[rgb(186,255,188)]/70">
                        Review and manage every collection you have introduced to the Loot Auction habitat.
                    </p>
                </header>
                <div className="flex items-center justify-center py-12">
                    <p className="text-[rgb(186,255,188)]/70">Loading listings...</p>
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className="flex w-full flex-col gap-6">
                <header className="flex flex-col gap-2">
                    <h2 className="text-2xl font-orbitron uppercase tracking-[0.4em] text-white">My Listings</h2>
                    <p className="text-sm text-[rgb(186,255,188)]/70">
                        Review and manage every collection you have introduced to the Loot Auction habitat.
                    </p>
                </header>
                <div className="flex items-center justify-center py-12">
                    <p className="text-red-400">Error loading listings: {error.message}</p>
                </div>
            </section>
        );
    }

    if (listings.length === 0) {
        return (
            <section className="flex w-full flex-col gap-6">
                <header className="flex flex-col gap-2">
                    <h2 className="text-2xl font-orbitron uppercase tracking-[0.4em] text-white">My Listings</h2>
                    <p className="text-sm text-[rgb(186,255,188)]/70">
                        Review and manage every collection you have introduced to the Loot Auction habitat.
                    </p>
                </header>
                <div className="flex items-center justify-center py-12">
                    <p className="text-[rgb(186,255,188)]/70">No listings found. Create your first auction to get started!</p>
                </div>
            </section>
        );
    }

    return (
        <section className="flex w-full flex-col gap-6">
            <header className="flex flex-col gap-2">
                <h2 className="text-2xl font-orbitron uppercase tracking-[0.4em] text-white">My Listings</h2>
                <p className="text-sm text-[rgb(186,255,188)]/70">
                    Review and manage every collection you have introduced to the Loot Auction habitat.
                </p>
            </header>

            <div className="flex flex-col gap-4">
                {listings.map((listing) => (
                    <article
                        key={listing.id}
                        className="flex w-full flex-col gap-4 rounded-2xl border border-[rgb(50,255,52)]/25 bg-black/40 p-5 shadow-[0_0_25px_rgba(50,255,52,0.12)] transition hover:cursor-pointer hover:border-[rgb(50,255,52)]/60 hover:shadow-[0_0_40px_rgba(50,255,52,0.18)] sm:flex-row sm:items-center sm:justify-between"
                    >
                        <div className="flex w-full flex-1 items-center gap-4">
                            <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-[rgb(50,255,52)]/40 bg-[rgb(50,255,52)]/10">
                                <Image
                                    src="/logo.png"
                                    alt={listing.name}
                                    width={64}
                                    height={64}
                                    draggable={false}
                                    className="h-full w-full object-cover p-2"
                                />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-orbitron uppercase tracking-[0.25em] text-[rgb(186,255,188)]/70">
                                    {listing.id}
                                </span>
                                <h3 className="text-lg font-orbitron uppercase tracking-[0.2em] text-white">
                                    {listing.name}
                                </h3>
                                {(() => {
                                    const timeAgo = formatTimeAgo(listing.endTime);
                                    return timeAgo ? (
                                        <p className="text-xs text-[rgb(186,255,188)]/70">{timeAgo}</p>
                                    ) : null;
                                })()}
                            </div>
                        </div>

                        <div className="grid w-full flex-1 grid-cols-2 gap-4 text-sm text-white md:grid-cols-3">
                            <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
                                <p className="text-[rgb(186,255,188)]/70 text-xs uppercase tracking-[0.2em]">Tokens</p>
                                <p className="font-orbitron text-xl tracking-[0.3em]">{listing.tokenCount}</p>
                            </div>
                            <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
                                <p className="text-[rgb(186,255,188)]/70 text-xs uppercase tracking-[0.2em]">Starting</p>
                                <p className="font-orbitron text-base tracking-[0.3em]">{formatEth(listing.startingPrice)}</p>
                                <p className="font-orbitron text-xs tracking-[0.3em]">SURVIVOR</p>
                            </div>
                            <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
                                <p className="text-[rgb(186,255,188)]/70 text-xs uppercase tracking-[0.2em]">Top Bid</p>
                                <p className="font-orbitron text-base tracking-[0.3em]">{formatEth(listing.currentBid)}</p>
                                <p className="font-orbitron text-xs tracking-[0.3em]">SURVIVOR</p>
                            </div>
                        </div>

                        <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:items-end">
                            <span
                                className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-orbitron uppercase tracking-[0.3em] ${getStatusStyle(listing.status)}`}
                            >
                                {getStatusLabel(listing.status)}
                            </span>
                            <button
                                type="button"
                                onClick={() => handleEndAuction(listing.auctionId)}
                                disabled={!account || isEndingAuction === listing.auctionId}
                                className="inline-flex items-center justify-center rounded-full border border-red-500/80 px-5 py-2 text-xs font-orbitron uppercase tracking-[0.3em] text-red-400 transition hover:cursor-pointer hover:bg-red-500 hover:text-black disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isEndingAuction === listing.id ? "Ending..." : "Remove Collection"}
                            </button>
                            {txnHashes[listing.auctionId] && (
                                <a
                                    href={explorer.transaction(txnHashes[listing.auctionId])}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs font-orbitron text-[rgb(50,255,52)] hover:underline break-all"
                                >
                                    View Transaction
                                </a>
                            )}
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}