"use client";

import { useState } from "react";
import { clsx } from "../lib/utils";
import Auction from "./auction";
import Bids from "./bids";
import MyListings from "./my-listings";

export default function BidAuctionMyListingsRent() {
    const [activeTab, setActiveTab] = useState<"bid" | "auction" | "my-listings">("bid");
    return ( 
        <div className="flex flex-col items-center justify-center gap-4 w-full space-y-4 xl:max-w-2xl 2xl:max-w-6xl">
            <div className="flex flex-row items-center justify-center gap-4 w-full">
                <div className={clsx("hover:cursor-pointer hover:text-[rgb(50,255,52)] hover:font-bold", activeTab === "bid" ? "text-[rgb(50,255,52)] font-bold" : "")} onClick={() => setActiveTab("bid")}>
                    Bid on a collection of monsters
                </div>
                <div className={clsx("hover:cursor-pointer hover:text-[rgb(50,255,52)] hover:font-bold", activeTab === "auction" ? "text-[rgb(50,255,52)] font-bold" : "")} onClick={() => setActiveTab("auction")}>
                    Auction your collection of monsters
                </div>
                <div className={clsx("hover:cursor-pointer hover:text-[rgb(50,255,52)] hover:font-bold", activeTab === "my-listings" ? "text-[rgb(50,255,52)] font-bold" : "")} onClick={() => setActiveTab("my-listings")}>
                    My Listings
                </div>
            </div>
            <div className="w-full h-full">
                {activeTab === "bid" && <Bids />}
                {activeTab === "auction" && <Auction />}
                {activeTab === "my-listings" && <MyListings />}
            </div>
        </div>
    )
}