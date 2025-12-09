import Image from "next/image";
import moment from "moment";
import { useAccount, useExplorer } from "@starknet-react/core";
import { useState, useCallback } from "react";
import { FormattedListing } from "../hooks/use-my-listings";
import { AUCTION_CONTRACT_ADDRESS, USDC_ADDRESS, EKUBO_ROUTER_ADDRESS, SUPPORTED_TOKENS, MAX_UINT256 } from "../lib/constants";
import { formatUSDCompact, truncateAuctionName } from "../lib/utils";
import { normalizeContractAddress } from "../lib/utils/normalization";
import { uint256, num } from "starknet";
import { getSwapQuote, generateSwapCalls, type TokenQuote, type RouterContract } from "../lib/api/ekubo";

const formatTimeAgo = (timestamp: string): string => {
    if (!timestamp) return "Unknown";
    
    try {
        let timestampNum: number;
        
        if (timestamp.startsWith('0x') || timestamp.startsWith('0X')) {
            timestampNum = parseInt(timestamp, 16);
        } else {
            timestampNum = parseInt(timestamp, 10);
        }
        
        if (timestampNum === 0) return "";
        
        if (isNaN(timestampNum)) return "Unknown";
        
        const dateObj = new Date(timestampNum * 1000);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        const hours = String(dateObj.getHours()).padStart(2, '0');
        const minutes = String(dateObj.getMinutes()).padStart(2, '0');
        const seconds = String(dateObj.getSeconds()).padStart(2, '0');
        const dateString = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        
        const date = moment(dateString, 'YYYY-MM-DD HH:mm:ss');
        const fromNow = date.fromNow();
        
        return fromNow;
    } catch {
        return "Unknown";
    }
};

const getStatusStyle = (status: string): string => {
    const statusNum = parseInt(status);
    
    if (statusNum === 0) {
        return "bg-white/10 text-white/50 border border-white/20";
    }
    if (statusNum === 1) {
        return "bg-yellow-400/10 text-yellow-300 border border-yellow-300/30";
    }
    if (statusNum === 2) {
        return "bg-[rgb(50,255,52)]/10 text-[rgb(50,255,52)] border border-[rgb(50,255,52)]/40";
    }
    if (statusNum === 3) {
        return "bg-white/10 text-white border border-white/20";
    }
    if (statusNum === 4) {
        return "bg-blue-400/10 text-blue-300 border border-blue-300/30";
    }
    if (statusNum === 5) {
        return "bg-red-400/10 text-red-300 border border-red-300/30";
    }
    
    if (status === "pending" || status === "queued") {
        return "bg-yellow-400/10 text-yellow-300 border border-yellow-300/30";
    }
    return "bg-white/10 text-white border border-white/20";
};

const getStatusLabel = (status: string): string => {
    const statusNum = parseInt(status);
    
    if (statusNum === 0) return "None";
    if (statusNum === 1) return "Draft";
    if (statusNum === 2) return "Active";
    if (statusNum === 3) return "Ended";
    if (statusNum === 4) return "Settled";
    if (statusNum === 5) return "Canceled";
    
    return status;
};

interface MyListingsProps {
    listings: FormattedListing[];
    loading: boolean;
    error: Error | null;
}

export default function MyListings({ listings, loading, error }: MyListingsProps) {
    const { account, address } = useAccount();
    const explorer = useExplorer();
    const [isEndingAuction, setIsEndingAuction] = useState<string | null>(null);
    const [txnHashes, setTxnHashes] = useState<Record<string, string>>({});
    const [isSettling, setIsSettling] = useState<string | null>(null);
    const [settleTxnHashes, setSettleTxnHashes] = useState<Record<string, string>>({});

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
            console.error("Error ending auction - contract call failed:", err);
            if (err instanceof Error) {
                console.error("Error message:", err.message);
                console.error("Error stack:", err.stack);
            }
            console.error("Failed call details:", {
                contract: AUCTION_CONTRACT_ADDRESS,
                entrypoint: "end_auction",
                auctionId: auctionId
            });
        } finally {
            setIsEndingAuction(null);
        }
    }, [account]);

    const isAuctionExpired = (endTime: string, status: string): boolean => {
        if (!endTime || endTime === "0") return false;
        
        try {
            let endTimeNum: number;
            if (endTime.startsWith('0x') || endTime.startsWith('0x')) {
                endTimeNum = parseInt(endTime, 16);
            } else {
                endTimeNum = parseInt(endTime, 10);
            }

            if (isNaN(endTimeNum) || endTimeNum === 0) return false;

            const now = Math.floor(Date.now() / 1000);
            const statusNum = parseInt(status);
            
            return endTimeNum <= now || statusNum === 3;
        } catch {
            return false;
        }
    };

    const handleSettleAuction = useCallback(async (auctionId: string) => {
        if (!account || !address) {
            return;
        }

        // Find the listing to get seller and feeToken
        const listing = listings.find(l => l.auctionId === auctionId);
        if (!listing) {
            console.error("Listing not found");
            return;
        }

        // If there's no current bid, just settle without swap
        if (!listing.currentBid || listing.currentBid === 0) {
            try {
                setIsSettling(auctionId);

                const response = await account.execute({
                    contractAddress: AUCTION_CONTRACT_ADDRESS,
                    entrypoint: "settle_auction",
                    calldata: [auctionId]
                });

                setSettleTxnHashes(prev => ({ ...prev, [auctionId]: response.transaction_hash }));
            } catch (err) {
                console.error("Error settling auction - contract call failed:", err);
            } finally {
                setIsSettling(null);
            }
            return;
        }

        try {
            setIsSettling(auctionId);

            const calls: Array<{
                contractAddress: string;
                entrypoint: string;
                calldata: string[];
            }> = [];

            // 1. Settle the auction (this transfers USDC from vault to seller)
            calls.push({
                contractAddress: AUCTION_CONTRACT_ADDRESS,
                entrypoint: "settle_auction",
                calldata: [auctionId]
            });

            // 2. Swap USDC to feeToken only if caller is the seller
            // Check if caller is the seller
            const callerAddress = normalizeContractAddress(address).toLowerCase();
            const sellerAddress = normalizeContractAddress(listing.seller).toLowerCase();
            const isSeller = callerAddress === sellerAddress;

            // Only do swap if caller is seller and feeToken is different from USDC
            const feeTokenAddress = normalizeContractAddress(listing.feeToken).toLowerCase();
            const usdcAddress = normalizeContractAddress(USDC_ADDRESS).toLowerCase();

            if (isSeller && feeTokenAddress !== usdcAddress) {
                // Calculate USDC amount in wei (USDC has 6 decimals)
                // currentBid is now divided by 1e6 for display, so we need to multiply back for contract calls
                const usdcAmountWei = BigInt(Math.floor(listing.currentBid * 1e6));
                
                // generateSwapCalls adds a 1% buffer (101/100), so we need to pass 100/101 of the amount
                // to ensure the transfer doesn't exceed the balance after settle_auction
                const swapInputAmount = (usdcAmountWei * 100n) / 101n;

                // Get swap quote using the adjusted amount
                const swapQuote = await getSwapQuote(Number(swapInputAmount), USDC_ADDRESS, listing.feeToken);

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

                const feeTokenInfo = SUPPORTED_TOKENS.find(t => t.address.toLowerCase() === feeTokenAddress);
                const feeTokenDecimals = feeTokenInfo?.decimals || 18;

                const tokenQuote: TokenQuote = {
                    tokenAddress: listing.feeToken,
                    minimumAmount: 0, // Will be calculated from quote.total in generateSwapCalls
                    quote: swapQuote,
                    outputTokenDecimals: feeTokenDecimals
                };

                const swapCalls = generateSwapCalls(routerContract, USDC_ADDRESS, tokenQuote, swapInputAmount);

                // Approve USDC for swap
                const usdcApproval = uint256.bnToUint256(MAX_UINT256);
                calls.push({
                    contractAddress: USDC_ADDRESS,
                    entrypoint: "approve",
                    calldata: [
                        EKUBO_ROUTER_ADDRESS,
                        usdcApproval.low.toString(),
                        usdcApproval.high.toString()
                    ]
                });

                // Add swap calls
                calls.push(...swapCalls);
            }

            const response = await account.execute(calls);
            setSettleTxnHashes(prev => ({ ...prev, [auctionId]: response.transaction_hash }));
        } catch (err) {
            console.error("Error settling auction - contract call failed:", err);
            if (err instanceof Error) {
                console.error("Error message:", err.message);
                console.error("Error stack:", err.stack);
            }
            console.error("Failed call details:", {
                contract: AUCTION_CONTRACT_ADDRESS,
                entrypoint: "settle_auction",
                auctionId: auctionId
            });
        } finally {
            setIsSettling(null);
        }
    }, [account, address, listings]);

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
                                    {truncateAuctionName(listing.name)}
                                </h3>
                                {(() => {
                                    const timeAgo = formatTimeAgo(listing.endTime);
                                    return timeAgo ? (
                                        <p className="text-xs text-[rgb(186,255,188)]/70">{timeAgo}</p>
                                    ) : null;
                                })()}
                            </div>
                        </div>

                        <div className="grid w-full max-w-[450px] grid-cols-2 gap-4 text-sm text-white md:grid-cols-3">
                            <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center min-w-[120px]">
                                <p className="text-[rgb(186,255,188)]/70 text-xs uppercase tracking-[0.2em]">Tokens</p>
                                <p className="font-orbitron text-xl tracking-[0.3em]">{listing.tokenCount}</p>
                            </div>
                            <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center min-w-[120px]">
                                <p className="text-[rgb(186,255,188)]/70 text-xs uppercase tracking-[0.2em]">Reserved Price</p>
                                <p className="font-orbitron text-base tracking-[0.3em]">{formatUSDCompact(listing.startingPrice / 1e6)}</p>
                            </div>
                            <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center min-w-[120px]">
                                <p className="text-[rgb(186,255,188)]/70 text-xs uppercase tracking-[0.2em]">Top Bid</p>
                                <p className="font-orbitron text-base tracking-[0.3em]">{listing.currentBid !== null ? formatUSDCompact(listing.currentBid) : "—"}</p>
                            </div>
                        </div>

                        <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:items-end">
                            <span
                                className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-orbitron uppercase tracking-[0.3em] ${getStatusStyle(listing.status)}`}
                            >
                                {getStatusLabel(listing.status)}
                            </span>
                            <div className="flex flex-row gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleEndAuction(listing.auctionId)}
                                    disabled={!account || isEndingAuction === listing.auctionId || Number(listing.status) !== 2}
                                    className="inline-flex items-center justify-center rounded-full border border-red-500/80 px-5 py-2 text-xs font-orbitron uppercase tracking-[0.3em] text-red-400 transition hover:cursor-pointer hover:bg-red-500 hover:text-black disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isEndingAuction === listing.auctionId ? "Ending..." : "End Auction"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSettleAuction(listing.auctionId)}
                                    disabled={!account || isSettling === listing.auctionId || !isAuctionExpired(listing.endTime, listing.status) || Number(listing.status) === 4}
                                    className="inline-flex items-center justify-center rounded-full border border-orange-500/80 px-5 py-2 text-xs font-orbitron uppercase tracking-[0.3em] text-orange-400 transition hover:cursor-pointer hover:bg-orange-500 hover:text-black disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSettling === listing.auctionId ? "Settling..." : "Settle Bid"}
                                </button>
                            </div>
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
                            {settleTxnHashes[listing.auctionId] && (
                                <a
                                    href={explorer.transaction(settleTxnHashes[listing.auctionId])}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs font-orbitron text-orange-400 hover:underline break-all"
                                >
                                    View Settle Transaction
                                </a>
                            )}
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}