import { useCallback, useMemo, useState, useEffect } from "react";
import { useAccount, useExplorer } from "@starknet-react/core";
import Image from "next/image";
import MonsterCollectionCard from "./monster-collection-card";
import Pagination from "./pagination";
import Filters, { FilterState } from "./filters";
import type { AuctionItem } from "../lib/types";
import { AuctionWithNFTs } from "../hooks/use-auctions";
import { uint256, num } from "starknet";
import { truncateWithEllipsis, truncateAddress, formatUSD } from "../lib/utils";
import { applyFiltersToAuctions } from "../lib/filter-utils";
import { AUCTION_CONTRACT_ADDRESS, SURVIVOR_ADDRESS_MAINNET, VAULT_CONTRACT_ADDRESS, DEFAULT_PAGE_SIZE, MAX_UINT256, IMAGE_BASE_URL, SUPPORTED_TOKENS, SURVIVOR_ADDRESS, EKUBO_ROUTER_ADDRESS } from "../lib/constants";
import { getSwapQuote, generateSwapCalls, type TokenQuote, type RouterContract } from "../lib/api/ekubo";
import { getTokenAmountForUSD } from "../lib/utils/usd-pricing"; 

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

export default function Bids({ 
    auctions, 
    loading, 
    error,
    currentPage,
    setCurrentPage}: BidsProps) {
    const { account } = useAccount();
    const explorer = useExplorer();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [txnHash, setTxnHash] = useState<string | undefined>();
    const [filters, setFilters] = useState<FilterState>({
        search: "",
        beast: "",
        type: "",
        tier: "",
        levelMin: "",
        levelMax: "",
        powerMin: "",
        powerMax: "",
        rankMin: "",
        rankMax: "",
        shiny: "",
        animated: "",
        priceSort: "",
        tokenIdSort: "",
    });
    
    const [localCurrentPage, setLocalCurrentPage] = useState(currentPage);

    const filteredAuctions = useMemo(() => {
        return applyFiltersToAuctions(auctions, filters);
    }, [auctions, filters]);

    const totalFilteredPages = useMemo(() => {
        return Math.max(1, Math.ceil(filteredAuctions.length / DEFAULT_PAGE_SIZE));
    }, [filteredAuctions.length]);

    const paginatedFilteredAuctions = useMemo(() => {
        const startIndex = (localCurrentPage - 1) * DEFAULT_PAGE_SIZE;
        return filteredAuctions.slice(startIndex, startIndex + DEFAULT_PAGE_SIZE);
    }, [filteredAuctions, localCurrentPage]);

    useEffect(() => {
        setLocalCurrentPage(1);
    }, [filters]);

    useEffect(() => {
        setLocalCurrentPage(currentPage);
    }, [currentPage]);

    const collections: Collection[] = useMemo(() => {
        return paginatedFilteredAuctions.map((auction) => {
            const startingPrice = parseFloat(auction.starting_price) || 0;
            const highestBid = auction.current_bid ? parseFloat(auction.current_bid) : undefined;
            
            return {
                id: auction.auction_id,
                name: truncateWithEllipsis(auction.name),
                totalMonsters: parseInt(auction.item_count) || 0,
                startingPrice,
                highestBid,
                image: "/logo.png",
                status: auction.status,
                endTime: auction.end_time,
                seller: truncateAddress(auction.seller),
                highestBidder: truncateAddress(auction.highest_bidder),
            };
        });
    }, [paginatedFilteredAuctions]);

    const [selectedCollectionId, setSelectedCollectionId] = useState<string>(collections[0]?.id ?? "");
    const [bidAmountUSD, setBidAmountUSD] = useState<string>("");
    const [paymentToken, setPaymentToken] = useState<string>(SURVIVOR_ADDRESS);

    const selectedCollection = useMemo(
        () => collections.find((collection) => collection.id === selectedCollectionId),
        [selectedCollectionId, collections],
    );

    useEffect(() => {
        const selected = collections.find((c) => c.id === selectedCollectionId);
        if (selected) {
            const minimum = Math.max(selected.startingPrice, selected.highestBid ?? selected.startingPrice);
            const defaultBid = minimum + 1;
            setBidAmountUSD(defaultBid.toString());
        }
    }, [selectedCollectionId, collections]);

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
        const numericBid = parseFloat(bidAmountUSD);
        const isValid = !Number.isNaN(numericBid) && numericBid > 0;
        const exceedsMinimum = numericBid > minimumBid;
        return isValid && exceedsMinimum;
    }, [bidAmountUSD, minimumBid]);

    const handlePlaceBid = useCallback(async () => {
        if (!account || selectedCollectionId === "" || selectedCollectionId === null || selectedCollectionId === undefined || !isBidValid) {
            return;
        }

        const calls: Array<{
            contractAddress: string;
            entrypoint: string;
            calldata: string[];
        }> = [];

        try {
            setIsSubmitting(true);

            const auctionId = parseInt(selectedCollectionId, 10);

            if (paymentToken.toLowerCase() === SURVIVOR_ADDRESS.toLowerCase()) {
                const approvalAmount = uint256.bnToUint256(MAX_UINT256);
                calls.push({
                    contractAddress: SURVIVOR_ADDRESS_MAINNET,
                    entrypoint: "approve",
                    calldata: [
                        VAULT_CONTRACT_ADDRESS,
                        approvalAmount.low.toString(),
                        approvalAmount.high.toString()
                    ]
                });
                calls.push({
                    contractAddress: AUCTION_CONTRACT_ADDRESS,
                    entrypoint: "bid",
                    calldata: [
                        auctionId.toString(),
                        bidAmountUSD.toString()
                    ]
                });
            } else {
                const paymentTokenInfo = SUPPORTED_TOKENS.find(t => t.address.toLowerCase() === paymentToken.toLowerCase());
                if (!paymentTokenInfo) {
                    throw new Error('Invalid payment token');
                }

                const usdAmount = parseFloat(bidAmountUSD);
                const paymentTokenAmount = await getTokenAmountForUSD(usdAmount, paymentToken);
                const paymentTokenAmountWei = Math.floor(paymentTokenAmount * Math.pow(10, paymentTokenInfo.decimals));
                
                const swapQuote = await getSwapQuote(paymentTokenAmountWei, paymentToken, SURVIVOR_ADDRESS);

                const routerContract: RouterContract = {
                    address: EKUBO_ROUTER_ADDRESS,
                    populate: (method: string, params: unknown[]) => {
                        const calldata: string[] = [];
                        params.forEach(param => {
                            if (param && typeof param === 'object' && 'contract_address' in param) {
                                const structParam = param as { contract_address: string; amount?: number | bigint };
                                calldata.push(structParam.contract_address);
                                if (structParam.amount !== undefined) {
                                    const amountHex = typeof structParam.amount === 'bigint' 
                                        ? num.toHex(structParam.amount)
                                        : num.toHex(BigInt(Math.floor(Number(structParam.amount))));
                                    calldata.push(amountHex);
                                }
                            } else {
                                const value = typeof param === 'bigint' 
                                    ? num.toHex(param)
                                    : num.toHex(BigInt(Math.floor(Number(param))));
                                calldata.push(value);
                            }
                        });
                        return {
                            contractAddress: EKUBO_ROUTER_ADDRESS,
                            entrypoint: method,
                            calldata
                        };
                    }
                };

                const tokenQuote: TokenQuote = {
                    tokenAddress: SURVIVOR_ADDRESS,
                    minimumAmount: Number(bidAmountUSD) * 0.99,
                    quote: swapQuote
                };

                const swapCalls = generateSwapCalls(routerContract, paymentToken, tokenQuote);

                const paymentTokenApproval = uint256.bnToUint256(MAX_UINT256);
                calls.push({
                    contractAddress: paymentToken,
                    entrypoint: "approve",
                    calldata: [
                        EKUBO_ROUTER_ADDRESS,
                        paymentTokenApproval.low.toString(),
                        paymentTokenApproval.high.toString()
                    ]
                });

                calls.push(...swapCalls);

                const zeroApproval = uint256.bnToUint256(BigInt(0));
                calls.push({
                    contractAddress: SURVIVOR_ADDRESS_MAINNET,
                    entrypoint: "approve",
                    calldata: [
                        VAULT_CONTRACT_ADDRESS,
                        zeroApproval.low.toString(),
                        zeroApproval.high.toString()
                    ]
                });

                const survivorAmountWei = BigInt(bidAmountUSD) * BigInt(10 ** 18);
                const survivorApproval = uint256.bnToUint256(survivorAmountWei);
                calls.push({
                    contractAddress: SURVIVOR_ADDRESS_MAINNET,
                    entrypoint: "approve",
                    calldata: [
                        VAULT_CONTRACT_ADDRESS,
                        survivorApproval.low.toString(),
                        survivorApproval.high.toString()
                    ]
                });

                calls.push({
                    contractAddress: AUCTION_CONTRACT_ADDRESS,
                    entrypoint: "bid",
                    calldata: [
                        auctionId.toString(),
                        bidAmountUSD.toString()
                    ]
                });
            }

            const response = await account.execute(calls);
            setTxnHash(response.transaction_hash);
            setBidAmountUSD("");

        } catch (err) {
            console.error("Error placing bid - multicall failed:", err);
            if (err instanceof Error) {
                console.error("Error message:", err.message);
                console.error("Error stack:", err.stack);
            }
            if (calls && calls.length > 0) {
                calls.forEach((call, idx) => {
                    console.error(`Call ${idx + 1} failed:`, {
                        contract: call.contractAddress,
                        entrypoint: call.entrypoint,
                        calldata: call.calldata
                    });
                });
            }
        } finally {
            setIsSubmitting(false);
        }
    }, [account, selectedCollectionId, bidAmountUSD, isBidValid, paymentToken]);

    const updateSelection = useCallback((collection: Collection | undefined) => {
        if (!collection) {
            return;
        }

        setSelectedCollectionId(collection.id);
        const nextMinimum = Math.max(collection.startingPrice, collection.highestBid ?? collection.startingPrice);
        const defaultBid = nextMinimum + 1;
        setBidAmountUSD(defaultBid.toString());
    }, []);

    const handleSelectCollection = useCallback(
        (collection: Collection) => {
            if (selectedCollectionId === collection.id) {
                setSelectedCollectionId("");
                setBidAmountUSD("");
            } else {
                updateSelection(collection);
            }
        },
        [selectedCollectionId, updateSelection],
    );

    const handlePageChange = useCallback(
        (page: number) => {
            const nextPage = Math.min(Math.max(page, 1), totalFilteredPages);
            if (nextPage === localCurrentPage) {
                return;
            }

            setLocalCurrentPage(nextPage);
            setCurrentPage(nextPage);
            const firstOnPage = collections[0];
            if (firstOnPage) {
                updateSelection(firstOnPage);
            }
        },
        [localCurrentPage, totalFilteredPages, setCurrentPage, updateSelection, collections],
    );

    const renderContent = () => {
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

        if (collections.length === 0 && !loading) {
            return (
                <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-center gap-4 px-4 py-12">
                    <p className="text-[rgb(186,255,188)]/70">
                        {auctions.length === 0 
                            ? "No auctions available." 
                            : "No auctions match your filters. Try adjusting your search criteria."}
                    </p>
                </div>
            );
        }


    const row1 = collections.slice(0, 3);
    const row2 = collections.slice(3, 6);
    const row3 = collections.slice(6, 9);

    const renderRow = (rowCollections: Collection[]) => (
        <div className="flex w-full gap-6">
            {rowCollections.map((collection) => {
                    const auction = paginatedFilteredAuctions.find(a => a.auction_id === collection.id);
                    const nfts = auction?.nfts || [];
                    
                    return (
                    <div key={collection.id} className="flex-1">
                            <MonsterCollectionCard
                                collection={collection}
                                isSelected={collection.id === selectedCollectionId}
                                onSelect={() => handleSelectCollection(collection)}
                                nfts={nfts}
                            />
                        </div>
                    );
                })}
            {Array.from({ length: 3 - rowCollections.length }).map((_, idx) => (
                <div key={`empty-${idx}`} className="flex-1" />
            ))}
            </div>
    );

    const renderSelectedDetails = () => {
        if (!selectedCollection) return null;

        return (
                <section className="mx-auto w-full max-w-6xl overflow-hidden rounded-2xl border border-[rgb(50,255,52)]/80 bg-black/55 shadow-[0_16px_40px_rgba(5,20,5,0.35)]">
                    <div className="grid gap-8 p-6 md:grid-cols-[minmax(0,0.4fr)_minmax(0,0.6fr)] md:items-start">
                        <div className="flex flex-col items-center gap-4 text-center md:items-start md:text-left">
                            {(() => {
                                const auction = paginatedFilteredAuctions.find(a => a.auction_id === selectedCollection.id);
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
                                                    ? `${IMAGE_BASE_URL}/${nft.imagePath}`
                                                    : "/logo.png";
                                                const isBase64 = imageSrc.startsWith("data:");
                                                
                                                return (
                                                    <div
                                                        key={`${nft.contractAddress}-${nft.tokenId}`}
                                                        className={`shrink-0 h-28 w-fit overflow-hidden ${
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
                                        {formatUSD(selectedCollection.startingPrice)}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-white/12 bg-white/5 px-4 py-3 text-center sm:text-left">
                                    <p className="text-[rgb(186,255,188)]/70 text-[11px] uppercase tracking-[0.16em]">
                                        Current Bid
                                    </p>
                                    <p className="font-orbitron text-lg tracking-[0.12em]">
                                        {selectedCollection.highestBid !== undefined ? formatUSD(selectedCollection.highestBid) : "No bids"}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4 sm:items-start w-full">
                                <div className="flex flex-[0.4] flex-col gap-3 w-full">
                                    <label
                                        htmlFor="bid-amount-usd"
                                        className="text-[11px] font-orbitron uppercase tracking-[0.14em] text-[rgb(186,255,188)]/70"
                                    >
                                        Place Your Bid (USD)
                                    </label>
                                    <input
                                        id="bid-amount-usd"
                                        type="number"
                                        min={minimumBid + 1}
                                        step="0.01"
                                        value={bidAmountUSD}
                                        onChange={(event) => {
                                            const value = event.target.value;
                                            if (value === '' || value === '-' || value === '.') {
                                                setBidAmountUSD(value);
                                            } else {
                                                const num = parseFloat(value);
                                                if (!isNaN(num) && num >= 0) {
                                                    setBidAmountUSD(value);
                                                } else if (value === '') {
                                                    setBidAmountUSD('');
                                                }
                                            }
                                        }}
                                        onBlur={(event) => {
                                            const value = event.target.value;
                                            if (value && value !== '') {
                                                const num = parseFloat(value);
                                                if (!isNaN(num) && num >= 0) {
                                                    setBidAmountUSD(num.toFixed(2));
                                                }
                                            }
                                        }}
                                        placeholder={(minimumBid + 1).toFixed(2)}
                                        className="w-40 rounded-xl border border-white/12 bg-black/60 px-4 py-2.5 text-sm font-orbitron uppercase tracking-widest text-white outline-none transition focus:border-[rgb(50,255,52)] focus:ring-2 focus:ring-[rgb(50,255,52)]/35 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                    />
                                    <label
                                        htmlFor="payment-token"
                                        className="text-[11px] font-orbitron uppercase tracking-[0.14em] text-[rgb(186,255,188)]/70"
                                    >
                                        Pay With
                                    </label>
                                    <select
                                        id="payment-token"
                                        value={paymentToken}
                                        onChange={(event) => setPaymentToken(event.target.value)}
                                        className="w-40 rounded-xl border border-white/12 bg-black/60 px-4 py-2.5 text-sm font-orbitron uppercase tracking-widest text-white outline-none transition focus:border-[rgb(50,255,52)] focus:ring-2 focus:ring-[rgb(50,255,52)]/35"
                                    >
                                        {SUPPORTED_TOKENS.map((token) => (
                                            <option key={token.address} value={token.address}>
                                                {token.symbol}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-[rgb(186,255,188)]/70">
                                        Minimum bid is{" "}
                                        <span className="font-orbitron tracking-widest">
                                            {formatUSD(minimumBid)}
                                        </span>
                                        .
                                    </p>
                                    <div className="flex flex-col gap-2 w-full">
                                        <button
                                            type="button"
                                            onClick={handlePlaceBid}
                                            disabled={!isBidValid || !account || isSubmitting}
                                            className={`inline-flex items-center justify-center rounded-full max-w-fit px-6 py-2 text-sm font-orbitron uppercase tracking-[0.18em] transition ${
                                                isBidValid && account && !isSubmitting
                                                    ? "border border-[rgb(50,255,52)] bg-[rgb(50,255,52)]/10 text-[rgb(50,255,52)] hover:cursor-pointer hover:bg-[rgb(50,255,52)] hover:text-black"
                                                    : "border border-white/12 text-[rgb(186,255,188)]/45"
                                            }`}
                                        >
                                            {isSubmitting ? "Submitting..." : "Place Bid"}
                                        </button>
                                    </div>
                                </div>
                                
                                {(() => {
                                    const auction = paginatedFilteredAuctions.find(a => a.auction_id === selectedCollection.id);
                                    const nfts = auction?.nfts || [];
                                    
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

                            {txnHash && (
                                <div className="rounded-xl border border-[rgb(50,255,52)]/40 bg-[rgb(50,255,52)]/10 px-4 py-3 w-full">
                                    <p className="text-[11px] font-orbitron uppercase tracking-[0.16em] text-[rgb(186,255,188)]/70 mb-2">
                                        Transaction Submitted
                                    </p>
                                    <a
                                        href={explorer.transaction(txnHash)}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-sm font-orbitron text-[rgb(50,255,52)] hover:underline break-all w-full"
                                    >
                                        {txnHash}
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
        );
    };

    const selectedRow = row1.some(c => c.id === selectedCollectionId) ? 1 
        : row2.some(c => c.id === selectedCollectionId) ? 2 
        : row3.some(c => c.id === selectedCollectionId) ? 3 
        : null;

        return (
            <>
                {renderRow(row1)}
                
                {selectedCollection && selectedRow === 1 && renderSelectedDetails()}
                
                {renderRow(row2)}
                
                {selectedCollection && selectedRow === 2 && renderSelectedDetails()}
                
                {renderRow(row3)}
                
                {selectedCollection && selectedRow === 3 && renderSelectedDetails()}

                <div className="flex justify-center">
                    <Pagination currentPage={localCurrentPage} totalPages={totalFilteredPages} onPageChange={handlePageChange} />
                </div>
            </>
        );
    };

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4">
            <Filters filters={filters} onFiltersChange={setFilters} />
            {renderContent()}
        </div>
    );
}