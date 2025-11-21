import { useCallback, useMemo, useState, useEffect } from "react";
import Image from "next/image";
import MonsterCollectionCard from "./monster-collection-card";
import Pagination from "./pagination";
import { AuctionItem, felt252ToString, truncateAddress } from "../lib/graphql";
import { AuctionWithNFTs } from "../hooks/use-auctions";

type Collection = {
    id: string;
    name: string;
    totalMonsters: number;
    startingPrice: number;
    highestBid?: number;
    image: string;
    status: string;
    endTime: string;
    seller: string;
    highestBidder: string;
};

interface BidsProps {
    auctions: AuctionWithNFTs[];
    loading: boolean;
    error: Error | null;
    currentPage: number;
    totalPages: number;
    setCurrentPage: (page: number) => void;
    getAuctionItems: (auctionId: string) => AuctionItem[];
}

const formatEth = (value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return `${numValue.toFixed(2)} SURVIVOR`;
};

export default function Bids({ 
    auctions, 
    loading, 
    error,
    currentPage,
    totalPages,
    setCurrentPage}: BidsProps) {
    // Convert auctions to collections format
    const collections: Collection[] = useMemo(() => {
        return auctions.map((auction) => ({
            id: auction.auction_id,
            name: felt252ToString(auction.name),
            totalMonsters: parseInt(auction.item_count) || 0,
            startingPrice: parseFloat(auction.starting_price) || 0,
            highestBid: auction.current_bid ? parseFloat(auction.current_bid) : undefined,
            image: "/logo.png", // Placeholder since image not in data
            status: auction.status,
            endTime: auction.end_time,
            seller: truncateAddress(auction.seller),
            highestBidder: truncateAddress(auction.highest_bidder),
        }));
    }, [auctions]);

    const [selectedCollectionId, setSelectedCollectionId] = useState<string>(collections[0]?.id ?? "");
    const [bidAmount, setBidAmount] = useState<string>("");

    // Update bid amount when collection changes
    useEffect(() => {
        const selected = collections.find((c) => c.id === selectedCollectionId);
        if (selected) {
            const minimum = Math.max(selected.startingPrice, selected.highestBid ?? selected.startingPrice);
            // Set default to 10% higher than minimum or last bid
            const defaultBid = minimum * 1.1;
            setBidAmount(defaultBid.toFixed(2));
        }
    }, [selectedCollectionId, collections]);

    const selectedCollection = useMemo(
        () => collections.find((collection) => collection.id === selectedCollectionId),
        [selectedCollectionId, collections],
    );


    const minimumBid = useMemo(() => {
        if (!selectedCollection) {
            return 0;
        }

        return Math.max(
            selectedCollection.startingPrice,
            selectedCollection.highestBid ?? selectedCollection.startingPrice,
        );
    }, [selectedCollection]);

    const isBidValid = useMemo(() => {
        const numericBid = parseFloat(bidAmount);
        // Bid must be strictly greater than minimum (not equal)
        return !Number.isNaN(numericBid) && numericBid > minimumBid;
    }, [bidAmount, minimumBid]);

    const updateSelection = useCallback((collection: Collection | undefined) => {
        if (!collection) {
            return;
        }

        setSelectedCollectionId(collection.id);
        const nextMinimum = Math.max(collection.startingPrice, collection.highestBid ?? collection.startingPrice);
        setBidAmount(nextMinimum.toFixed(2));
    }, []);

    const handleSelectCollection = useCallback(
        (collection: Collection) => {
            updateSelection(collection);
        },
        [updateSelection],
    );

    const handlePageChange = useCallback(
        (page: number) => {
            const nextPage = Math.min(Math.max(page, 1), totalPages);
            if (nextPage === currentPage) {
                return;
            }

            setCurrentPage(nextPage);
            // Select first collection on new page
            const firstOnPage = collections[0];
            if (firstOnPage) {
            updateSelection(firstOnPage);
            }
        },
        [currentPage, totalPages, updateSelection, collections],
    );

    if (loading) {
        return (
            <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-center gap-4 px-4 py-12">
                <p className="text-[rgb(186,255,188)]/70">Loading auctions...</p>
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

    if (collections.length === 0) {
        return (
            <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-center gap-4 px-4 py-12">
                <p className="text-[rgb(186,255,188)]/70">No auctions available.</p>
            </div>
        );
    }


    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4">
            <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-3">
                {collections.map((collection) => {
                    const auction = auctions.find(a => a.auction_id === collection.id);
                    const nfts = auction?.nfts || [];
                    
                    return (
                        <div key={collection.id} className="flex h-full w-full">
                            <MonsterCollectionCard
                                collection={collection}
                                isSelected={collection.id === selectedCollectionId}
                                onSelect={() => handleSelectCollection(collection)}
                                nfts={nfts}
                            />
                        </div>
                    );
                })}
            </div>

            {selectedCollection && (
                <section className="mx-auto w-full max-w-6xl overflow-hidden rounded-2xl border border-[rgb(50,255,52)]/20 bg-black/55 shadow-[0_16px_40px_rgba(5,20,5,0.35)]">
                    <div className="grid gap-8 p-6 md:grid-cols-[minmax(0,0.4fr)_minmax(0,0.6fr)] md:items-start">
                        <div className="flex flex-col items-center gap-4 text-center md:items-start md:text-left">
                            {(() => {
                                const auction = auctions.find(a => a.auction_id === selectedCollection.id);
                                const nfts = auction?.nfts || [];
                                
                                if (nfts.length === 0) {
                                    return (
                                    <div className="flex h-28 w-28 items-center justify-center rounded-2xl border border-[rgb(50,255,52)]/35 bg-[rgb(50,255,52)]/10">
                                        <Image
                                            src="/logo.png"
                                            alt={selectedCollection.name}
                                            width={112}
                                            height={112}
                                            draggable={false}
                                            className="h-16 w-16 object-contain"
                                        />
                                    </div>
                                    );
                                }
                                
                                return (
                                    <div className="w-full">
                                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                            {nfts.map((nft) => {
                                                const imageSrc = nft.metadata?.image 
                                                    ? nft.metadata.image 
                                                    : nft.imagePath 
                                                    ? `https://api.cartridge.gg/x/bm/torii/${nft.imagePath}`
                                                    : "/logo.png";
                                                const isBase64 = imageSrc.startsWith("data:");
                                                
                                                return (
                                                    <div
                                                        key={`${nft.contractAddress}-${nft.tokenId}`}
                                                        className={`shrink-0 h-28 w-28 rounded-2xl overflow-hidden ${
                                                            !isBase64 ? 'border border-[rgb(50,255,52)]/35 bg-[rgb(50,255,52)]/10' : ''
                                                        }`}
                                                    >
                                                        {isBase64 ? (
                                                            <img
                                                                src={imageSrc}
                                                                alt={nft.metadataName || `NFT ${nft.tokenId}`}
                                                                draggable={false}
                                                                className="h-full w-full object-contain"
                                                            />
                                                        ) : (
                                                            <Image
                                                                src={imageSrc}
                                                                alt={nft.metadataName || `NFT ${nft.tokenId}`}
                                                                width={112}
                                                                height={112}
                                                                draggable={false}
                                                                className="h-full w-full object-contain"
                                                                unoptimized
                                                            />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })()}
                            <h2 className="text-2xl font-orbitron uppercase tracking-[0.12em] text-white">
                                {selectedCollection.name}
                            </h2>
                            <span className="text-[11px] font-orbitron uppercase tracking-[0.16em] text-[rgb(186,255,188)]/70">
                                Status: {selectedCollection.status}
                            </span>
                            <p className="text-xs leading-relaxed text-[rgb(186,255,188)]/70">
                                {selectedCollection.totalMonsters} {selectedCollection.totalMonsters === 1 ? 'NFT' : 'NFTs'} in this collection
                            </p>
                        </div>

                        <div className="flex flex-col gap-6">
                            <div className="grid grid-cols-1 gap-3 text-sm text-white sm:grid-cols-2">
                                <div className="rounded-xl border border-white/12 bg-white/5 px-4 py-3 text-center sm:text-left">
                                    <p className="text-[rgb(186,255,188)]/70 text-[11px] uppercase tracking-[0.16em]">
                                        Starting
                                    </p>
                                    <p className="font-orbitron text-lg tracking-[0.12em]">
                                        {formatEth(selectedCollection.startingPrice)}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-white/12 bg-white/5 px-4 py-3 text-center sm:text-left">
                                    <p className="text-[rgb(186,255,188)]/70 text-[11px] uppercase tracking-[0.16em]">
                                        Current Bid
                                    </p>
                                    <p className="font-orbitron text-lg tracking-[0.12em]">
                                        {selectedCollection.highestBid !== undefined ? formatEth(selectedCollection.highestBid) : "No bids"}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4 sm:items-start w-full">
                                <div className="flex flex-[0.4] flex-col gap-3 w-full">
                                    <label
                                        htmlFor="bid-amount"
                                        className="text-[11px] font-orbitron uppercase tracking-[0.14em] text-[rgb(186,255,188)]/70"
                                    >
                                        Place Your Bid
                                    </label>
                                    <input
                                        id="bid-amount"
                                        type="number"
                                        min={minimumBid * 1.0001}
                                        step="0.01"
                                        value={bidAmount}
                                        onChange={(event) => setBidAmount(event.target.value)}
                                        placeholder={(minimumBid * 1.1).toFixed(2)}
                                        className="w-40 rounded-xl border border-white/12 bg-black/60 px-4 py-2.5 text-sm font-orbitron uppercase tracking-widest text-white outline-none transition focus:border-[rgb(50,255,52)] focus:ring-2 focus:ring-[rgb(50,255,52)]/35 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                    />
                                    <p className="text-xs text-[rgb(186,255,188)]/70">
                                        Minimum bid is{" "}
                                        <span className="font-orbitron tracking-widest">
                                            {formatEth(minimumBid)}
                                        </span>
                                        .
                                    </p>
                                    <div className="flex gap-2 w-full">
                                        <button
                                            type="button"
                                            disabled={!isBidValid}
                                            className={`inline-flex items-center justify-center rounded-full max-w-fit px-6 py-2 text-sm font-orbitron uppercase tracking-[0.18em] transition ${
                                                isBidValid
                                                    ? "border border-[rgb(50,255,52)] bg-[rgb(50,255,52)]/10 text-[rgb(50,255,52)] hover:cursor-pointer hover:bg-[rgb(50,255,52)] hover:text-black"
                                                    : "border border-white/12 text-[rgb(186,255,188)]/45"
                                            }`}
                                        >
                                            Place Bid
                                        </button>
                                    </div>
                                </div>
                                
                                {(() => {
                                    const auction = auctions.find(a => a.auction_id === selectedCollection.id);
                                    const nfts = auction?.nfts || [];
                                    
                                    // Calculate total power and average power
                                    const totalPower = nfts.reduce((sum, nft) => {
                                        const power = parseFloat(nft.power || '0');
                                        return sum + (isNaN(power) ? 0 : power);
                                    }, 0);
                                    
                                    const averagePower = nfts.length > 0 ? totalPower / nfts.length : 0;
                                    
                                    return (
                                        <div className="flex-1 grid grid-cols-1 gap-3 text-sm text-white sm:grid-cols-2 w-full">
                                            <div className="rounded-xl border border-white/12 bg-white/5 px-4 py-3 text-center sm:text-left">
                                                <p className="text-[rgb(186,255,188)]/70 text-[11px] uppercase tracking-[0.16em]">
                                                    Collection Power
                                                </p>
                                                <p className="font-orbitron text-lg tracking-[0.12em]">
                                                    {totalPower.toFixed(1)}
                                                </p>
                                            </div>
                                            <div className="rounded-xl border border-white/12 bg-white/5 px-4 py-3 text-center sm:text-left">
                                                <p className="text-[rgb(186,255,188)]/70 text-[11px] uppercase tracking-[0.16em]">
                                                    Collection Average Power
                                                </p>
                                                <p className="font-orbitron text-lg tracking-[0.12em]">
                                                    {averagePower.toFixed(1)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                </section>
            )}

            <div className="flex justify-center">
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
            </div>
        </div>
    );
}