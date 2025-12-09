"use client";

import { useState } from "react";
import { clsx } from "../lib/utils";
import Auction from "./auction";
import Bids from "./bids";
import MyListings from "./my-listings";
import type { FormattedNFT, AuctionItem } from "../lib/types";
import { AuctionWithNFTs } from "../hooks/use-auctions";
import { FormattedListing } from "../hooks/use-my-listings";

interface BidAuctionMyListingsProps {
    nfts: FormattedNFT[];
    loading: boolean;
    error: Error | null;
    auctions: AuctionWithNFTs[];
    allAuctions?: AuctionWithNFTs[];
    auctionsLoading: boolean;
    auctionsError: Error | null;
    currentPage: number;
    totalPages: number;
    setCurrentPage: (page: number) => void;
    getAuctionItems: (auctionId: string) => AuctionItem[];
    listings: FormattedListing[];
    listingsLoading: boolean;
    listingsError: Error | null;
    token: string | null;
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
    listings,
    listingsLoading,
    listingsError,
    token
}: BidAuctionMyListingsProps) {
    const [activeTab, setActiveTab] = useState<"bid" | "auction" | "my-listings">("bid");
    return ( 
        <div className="flex flex-col items-center justify-center gap-4 w-full space-y-4 xl:max-w-6xl">
            <div className="flex flex-row items-center justify-between w-fit border border-[rgb(50,255,52)]/20 rounded-xl">
                <div className={clsx("hover:cursor-pointer hover:text-[rgb(50,255,52)] hover:font-bold border-r border-[rgb(50,255,52)]/20 text-center w-[350px] py-2.5", activeTab === "bid" ? "text-[rgb(50,255,52)] bg-[rgb(50,255,52)]/20 rounded-l-xl font-bold" : "")} onClick={() => setActiveTab("bid")}>
                    Bid on a collection of monsters
                </div>
                <div className={clsx("hover:cursor-pointer hover:text-[rgb(50,255,52)] hover:font-bold border-x border-[rgb(50,255,52)]/20 text-center w-[400px] py-2.5", activeTab === "auction" ? "text-[rgb(50,255,52)] bg-[rgb(50,255,52)]/20 font-bold" : "")} onClick={() => setActiveTab("auction")}>
                    Auction your collection of monsters
                </div>
                <div className={clsx("hover:cursor-pointer hover:text-[rgb(50,255,52)] hover:font-bold border-l border-[rgb(50,255,52)]/20 text-center w-[200px] py-2.5", activeTab === "my-listings" ? "text-[rgb(50,255,52)] bg-[rgb(50,255,52)]/20 rounded-r-xl font-bold" : "")} onClick={() => setActiveTab("my-listings")}>
                    My Listings
                </div>
            </div>
            <div className="w-full h-full">
                {activeTab === "bid" && (
                    <Bids 
                        key="bid-tab"
                        auctions={allAuctions || auctions}
                        loading={auctionsLoading}
                        error={auctionsError}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        setCurrentPage={setCurrentPage}
                        getAuctionItems={getAuctionItems}
                        token={token}
                    />
                )}
                {activeTab === "auction" && (
                    <Auction 
                        key="auction-tab"
                        nfts={nfts} 
                        loading={loading} 
                        error={error} 
                    />
                )}
                {activeTab === "my-listings" && (
                    <MyListings 
                        key="my-listings-tab"
                        listings={listings}
                        loading={listingsLoading}
                        error={listingsError}
                    />
                )}
            </div>
        </div>
    )
}