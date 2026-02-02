"use client";

import { useState } from "react";
import Navigation from "./layout/navigation";
import Auction from "./auction";
import Buy from "./buy";
import MyListings from "./my-listings";
import type { FormattedNFT, AuctionItem } from "../lib/types";
import { type AuctionWithNFTs, type FormattedListing } from "../hooks";

interface BidAuctionMyListingsProps {
    nfts?: FormattedNFT[];
    loading?: boolean;
    error?: Error | null;
    auctions: AuctionWithNFTs[];
    allAuctions?: AuctionWithNFTs[];
    auctionsLoading: boolean;
    auctionsError: Error | null;
    currentPage: number;
    totalPages: number;
    setCurrentPage: (page: number) => void;
    getAuctionItems: (auctionId: string) => AuctionItem[];
    refetchAuctions?: () => Promise<unknown>;
    listings: FormattedListing[];
    listingsLoading: boolean;
    listingsError: Error | null;
    refetchListings?: () => Promise<unknown>;
    token: string | null;
    /** When set, Sell tab loads NFTs/listings for this address (e.g. from ?wallet=0x...). */
    walletOverride?: string;
}

export default function BidAuctionMyListingsRent({ 
    nfts, 
    loading, 
    error,
    auctions,
    allAuctions,
    auctionsLoading,
    auctionsError,
    currentPage,
    totalPages,
    setCurrentPage,
    getAuctionItems,
    refetchAuctions,
    listings,
    listingsLoading,
    listingsError,
    refetchListings,
    token,
    walletOverride
}: BidAuctionMyListingsProps) {
    const [activeTab, setActiveTab] = useState<"buy" | "sell" | "my-listings">("buy");
    return (
        <div className="flex flex-1 flex-col w-full max-w-6xl mx-auto px-4 md:px-6 min-w-0">
            <div className="flex flex-col items-center justify-center shrink-0 pt-4 md:pt-6 mb-6">
                <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
            </div>
            {/* Render all tabs so they stay mounted and cached; hide inactive to avoid refetch on navigation */}
            <div className="w-full min-h-[70vh] flex-1 min-w-0 flex flex-col">
                <div className={activeTab !== "buy" ? "hidden" : "contents"} aria-hidden={activeTab !== "buy"}>
                    <Buy
                        key="buy-tab"
                        auctions={allAuctions || auctions}
                        loading={auctionsLoading}
                        error={auctionsError}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        setCurrentPage={setCurrentPage}
                        getAuctionItems={getAuctionItems}
                        onRefresh={refetchAuctions}
                    />
                </div>
                <div className={activeTab !== "sell" ? "hidden" : "contents"} aria-hidden={activeTab !== "sell"}>
                    <Auction key="sell-tab" walletAddress={walletOverride} />
                </div>
                <div className={activeTab !== "my-listings" ? "hidden" : "contents"} aria-hidden={activeTab !== "my-listings"}>
                    <div className="w-full min-w-0 flex flex-col items-start">
                        <MyListings
                            key="my-listings-tab"
                            listings={listings}
                            loading={listingsLoading}
                            error={listingsError}
                            getAuctionItems={getAuctionItems}
                            nfts={nfts}
                            onRefresh={refetchListings}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}