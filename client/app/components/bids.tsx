import { useCallback, useMemo, useState, useEffect, useRef } from "react";
import { useAccount, useExplorer, useProvider } from "@starknet-react/core";
import Image from "next/image";
import MonsterCollectionCard from "./monster-collection-card";
import Pagination from "./pagination";
import Filters, { FilterState } from "./filters";
import type { AuctionItem } from "../lib/types";
import { AuctionWithNFTs } from "../hooks/use-auctions";
import { uint256 } from "starknet";
import { truncateAddress, formatUSD, formatTokenAmount, truncateAuctionName } from "../lib/utils";
import { applyFiltersToAuctions } from "../lib/filter-utils";
import { normalizeContractAddress } from "../lib/utils/normalization";
import { AUCTION_CONTRACT_ADDRESS, VAULT_CONTRACT_ADDRESS, DEFAULT_PAGE_SIZE, IMAGE_BASE_URL, SUPPORTED_TOKENS, USDC_ADDRESS } from "../lib/constants";
import { getQuotes, quoteToCalls } from "@avnu/avnu-sdk";
import { getTokenPriceInUSDC, shouldRefetchPrice } from "../lib/utils/token-price-cache"; 

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
    sellerFull: string;
    highestBidderFull: string;
};

interface BidsProps {
    auctions: AuctionWithNFTs[];
    loading: boolean;
    error: Error | null;
    currentPage: number;
    totalPages: number;
    setCurrentPage: (page: number) => void;
    getAuctionItems: (auctionId: string) => AuctionItem[];
    token: string | null;
}

export default function Bids({ 
    auctions, 
    loading, 
    error,
    currentPage,
    setCurrentPage,
    token
}: BidsProps) {
    const { account, address } = useAccount();
    const explorer = useExplorer();
    const provider = useProvider();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [txnHash, setTxnHash] = useState<string | undefined>();
    const [insufficientFundsError, setInsufficientFundsError] = useState<string | null>(null);
    const [isSettling, setIsSettling] = useState(false);
    const [settleTxnHash, setSettleTxnHash] = useState<string | undefined>();
    const [isRefunded, setIsRefunded] = useState(false);
    const [filters, setFilters] = useState<FilterState>({
        id: "",
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
            // Parse starting_price - handle both decimal and hex strings
            const startingPriceStr = auction.starting_price || "0";
            const startingPrice = startingPriceStr.startsWith('0x') || startingPriceStr.startsWith('0X') 
                ? parseInt(startingPriceStr, 16) 
                : parseFloat(startingPriceStr);
            
            // Parse current_bid - handle both decimal and hex strings, then divide by 1e6
            const highestBid = auction.current_bid ? (() => {
                const bidStr = auction.current_bid;
                const parsed = bidStr.startsWith('0x') || bidStr.startsWith('0X') 
                    ? parseInt(bidStr, 16) 
                    : parseFloat(bidStr);
                return parsed / 1e6;
            })() : undefined;
            
                return {
                id: auction.auction_id,
                name: truncateAuctionName(auction.name),
                totalMonsters: parseInt(auction.item_count) || 0,
                startingPrice,
                highestBid,
                image: "/logo.png",
                status: auction.status,
                endTime: auction.end_time,
                seller: truncateAddress(auction.seller),
                highestBidder: truncateAddress(auction.highest_bidder),
                sellerFull: auction.seller,
                highestBidderFull: auction.highest_bidder,
            };
        });
    }, [paginatedFilteredAuctions]);

    const [selectedCollectionId, setSelectedCollectionId] = useState<string>(collections[0]?.id ?? "");
    const [bidAmountToken, setBidAmountToken] = useState<string>("");
    const [paymentToken, setPaymentToken] = useState<string>(USDC_ADDRESS);
    const [, setConvertedStartingPrice] = useState<number>(0);
    const [, setConvertedHighestBid] = useState<number | undefined>(undefined);
    const [, setIsConvertingPrices] = useState(false);
    const [tokenPrice, setTokenPrice] = useState<number | null>(null);
    const [copied, setCopied] = useState(false);
    const [, setCopiedTimeout] = useState<NodeJS.Timeout | null>(null);

    const priceRetryIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const selectedCollection = useMemo(
        () => collections.find((collection) => collection.id === selectedCollectionId),
        [selectedCollectionId, collections],
    );

    const isValidPrice = useCallback((price: number | null): boolean => {
        if (price === null) return false;
        return isFinite(price) && price !== Infinity && price !== -Infinity && !isNaN(price) && price > 0;
    }, []);

    useEffect(() => {
        const intervalRef = priceRetryIntervalRef;
        
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        const fetchTokenPrice = async (isRetry: boolean = false): Promise<boolean> => {
            if (paymentToken.toLowerCase() === USDC_ADDRESS.toLowerCase()) {
                setTokenPrice(1);
                setIsConvertingPrices(false);
                return true;
            }

            if (!isRetry && !shouldRefetchPrice(paymentToken)) {
                try {
                    const cachedPrice = await getTokenPriceInUSDC(paymentToken);
                    if (isValidPrice(cachedPrice)) {
                        setTokenPrice(cachedPrice);
                        setIsConvertingPrices(false);
                        return true;
                    } else {
                        console.warn('Invalid cached price, fetching fresh:', cachedPrice);
                        setIsConvertingPrices(true);
                    }
                } catch (error) {
                    console.error('Error getting cached price:', error);
                    setIsConvertingPrices(true);
                }
            } else {
                setIsConvertingPrices(true);
            }

            try {
                const price = await getTokenPriceInUSDC(paymentToken);
                if (isValidPrice(price)) {
                    setTokenPrice(price);
                    setIsConvertingPrices(false);
                    return true;
                } else {
                    console.warn('Invalid price received:', price);
                    setTokenPrice(null);
                    setIsConvertingPrices(true);
                    return false;
                }
            } catch (error) {
                console.error('Error fetching token price:', error);
                setTokenPrice(null);
                setIsConvertingPrices(true);
                return false;
            }
        };

        fetchTokenPrice().then((success) => {
            if (!success) {
                const interval = setInterval(async () => {
                    const retrySuccess = await fetchTokenPrice(true);
                    if (retrySuccess) {
                        if (intervalRef.current) {
                            clearInterval(intervalRef.current);
                            intervalRef.current = null;
                        }
                    }
                }, 5000);
                intervalRef.current = interval;
            }
        });

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [paymentToken, isValidPrice]);

    useEffect(() => {
        // Always display prices in USDC, regardless of payment token selection
        if (!selectedCollection) {
            setConvertedStartingPrice(0);
            setConvertedHighestBid(undefined);
            return;
        }

        setConvertedStartingPrice(selectedCollection.startingPrice / 1e6);
        setConvertedHighestBid(selectedCollection.highestBid);
    }, [selectedCollection]);



    // bidAmountToken now always represents USDC amount
    const bidAmountUSD = useMemo(() => {
        const usdcAmount = parseFloat(bidAmountToken);
        if (Number.isNaN(usdcAmount) || usdcAmount <= 0) {
            return 0;
        }
        return usdcAmount;
    }, [bidAmountToken]);

    // Calculate equivalent amount in selected payment token
    const bidAmountInPaymentToken = useMemo(() => {
        const usdcAmount = parseFloat(bidAmountToken);
        if (Number.isNaN(usdcAmount) || usdcAmount <= 0) {
            return 0;
        }
        
        if (paymentToken.toLowerCase() === USDC_ADDRESS.toLowerCase()) {
            return usdcAmount;
        }
        
        if (tokenPrice === null || !isValidPrice(tokenPrice)) {
            return 0;
        }
        
        const tokenAmount = usdcAmount / tokenPrice;
        if (!isFinite(tokenAmount) || tokenAmount === Infinity || tokenAmount === -Infinity) {
            return 0;
        }
        
        return tokenAmount;
    }, [bidAmountToken, tokenPrice, paymentToken, isValidPrice]);

    const isBidValid = useMemo(() => {
        const numericBid = parseFloat(bidAmountToken);
        if (Number.isNaN(numericBid) || numericBid <= 0) {
            return false;
        }
        return true;
    }, [bidAmountToken]);

    const handlePlaceBid = useCallback(async () => {
        if (!account || !address || selectedCollectionId === "" || selectedCollectionId === null || selectedCollectionId === undefined || !isBidValid) {
            return;
        }
        
        // If paying with non-USDC token, we need token price
        if (paymentToken.toLowerCase() !== USDC_ADDRESS.toLowerCase() && (tokenPrice === null || !isValidPrice(tokenPrice))) {
            return;
        }

        setInsufficientFundsError(null);

        const calls: Array<{
            contractAddress: string;
            entrypoint: string;
            calldata: string[];
        }> = [];

        try {
            setIsSubmitting(true);

            const auctionId = parseInt(selectedCollectionId, 10);

            // bidAmountToken is now always in USDC
            const usdcAmount = parseFloat(bidAmountToken);
            if (isNaN(usdcAmount) || usdcAmount <= 0) {
                throw new Error('Invalid bid amount');
            }

            const finalUSDAmount = Math.floor(usdcAmount * 1e6);

            // If paying with a token other than USDC, we need to swap
            if (paymentToken.toLowerCase() !== USDC_ADDRESS.toLowerCase()) {
                const paymentTokenInfo = SUPPORTED_TOKENS.find(t => t.address.toLowerCase() === paymentToken.toLowerCase());
                if (!paymentTokenInfo) {
                    throw new Error('Invalid payment token');
                }

                // Get fresh price if needed
                let currentTokenPrice = tokenPrice;
                if (shouldRefetchPrice(paymentToken)) {
                    currentTokenPrice = await getTokenPriceInUSDC(paymentToken);
                    setTokenPrice(currentTokenPrice);
                }

                if (currentTokenPrice === null || !isValidPrice(currentTokenPrice)) {
                    throw new Error('Unable to get token price');
                }

                // Calculate how much of the payment token we need
                const tokenAmountNeeded = usdcAmount / currentTokenPrice;
                const tokenAmountWei = BigInt(Math.floor(tokenAmountNeeded * Math.pow(10, paymentTokenInfo.decimals)));

                // Check balance of payment token
                const balanceResult = await provider.provider.callContract({
                    contractAddress: paymentToken,
                    entrypoint: "balanceOf",
                    calldata: [address]
                });
                
                if (!balanceResult || balanceResult.length < 2) {
                    throw new Error('Invalid balance response');
                }
                
                const low = balanceResult[0];
                const high = balanceResult[1];
                const balance = BigInt(low) + (BigInt(high) << BigInt(128));

                // Check balance with a 2% buffer to account for swap needs
                const balanceWithBuffer = (tokenAmountWei * 102n) / 100n;
                if (balance < balanceWithBuffer) {
                    setInsufficientFundsError(`Insufficient funds to place bid.`);
                    setIsSubmitting(false);
                    return;
                }

                // Calculate token amount needed for swap
                const tokenAmountNeededForSwap = usdcAmount / currentTokenPrice;
                const tokenAmountWeiForSwap = BigInt(Math.floor(tokenAmountNeededForSwap * Math.pow(10, paymentTokenInfo.decimals)));

                // Get Avnu swap quotes
                const quotes = await getQuotes({
                    sellTokenAddress: paymentToken,
                    buyTokenAddress: USDC_ADDRESS,
                    sellAmount: tokenAmountWeiForSwap,
                    takerAddress: address,
                });

                if (!quotes || quotes.length === 0) {
                    throw new Error('No swap quotes available');
                }

                const bestQuote = quotes[0];

                // Build the execute transaction calls from the quote
                const swapCallsResult = await quoteToCalls({
                    quoteId: bestQuote.quoteId,
                    slippage: 0.01, // 1% slippage
                });

                // Avnu SDK returns an object with a 'calls' array
                const allSwapCalls = swapCallsResult.calls || (Array.isArray(swapCallsResult) ? swapCallsResult : [swapCallsResult]);
                
                // Filter out approve calls (we'll add our own)
                const swapCalls = allSwapCalls.filter(call => {
                    return call.entrypoint !== 'approve';
                });

                if (swapCalls.length === 0) {
                    console.error('No swap calls found after filtering. All calls:', allSwapCalls);
                    throw new Error('No swap calls available from quote');
                }

                // Use the actual sellAmount from the quote, and add 2% buffer for safety
                // This ensures we have enough approved even if the swap needs slightly more
                const actualSellAmount = bestQuote.sellAmount;
                const paymentTokenApprovalAmount = (actualSellAmount * 102n) / 100n; // Add 2% buffer
                const paymentTokenApproval = uint256.bnToUint256(paymentTokenApprovalAmount);
                
                // Get the router address from the first swap call (the multi_route_swap call)
                const routerAddress = swapCalls[0]?.contractAddress;
                if (!routerAddress) {
                    console.error('Swap calls structure:', swapCalls);
                    throw new Error(`Unable to determine router address from swap calls. First call: ${JSON.stringify(swapCalls[0])}`);
                }
                
                calls.push({
                    contractAddress: paymentToken,
                    entrypoint: "approve",
                    calldata: [
                        routerAddress,
                        paymentTokenApproval.low.toString(),
                        paymentTokenApproval.high.toString()
                    ]
                });

                // Add the swap transaction calls
                swapCalls.forEach(call => {
                    // Convert calldata to string array (Avnu SDK may return numbers)
                    const calldataArray = Array.isArray(call.calldata) 
                        ? call.calldata.map(arg => typeof arg === 'string' ? arg : String(arg))
                        : [];
                    
                    calls.push({
                        contractAddress: call.contractAddress,
                        entrypoint: call.entrypoint,
                        calldata: calldataArray
                    });
                });

                // Approve the exact USDC amount needed for the bid
                const usdcApprovalAmount = BigInt(finalUSDAmount);
                const usdcApproval = uint256.bnToUint256(usdcApprovalAmount);
                calls.push({
                    contractAddress: USDC_ADDRESS,
                    entrypoint: "approve",
                    calldata: [
                        VAULT_CONTRACT_ADDRESS,
                        usdcApproval.low.toString(),
                        usdcApproval.high.toString()
                    ]
                });

                calls.push({
                    contractAddress: AUCTION_CONTRACT_ADDRESS,
                    entrypoint: "bid",
                    calldata: [
                        auctionId.toString(),
                        finalUSDAmount.toString()
                    ]
                });
            } else {
                // Paying with USDC directly - check USDC balance
                const usdcBalanceResult = await provider.provider.callContract({
                    contractAddress: USDC_ADDRESS,
                    entrypoint: "balanceOf",
                    calldata: [address]
                });
                
                if (!usdcBalanceResult || usdcBalanceResult.length < 2) {
                    throw new Error('Invalid balance response');
                }
                
                const usdcLow = usdcBalanceResult[0];
                const usdcHigh = usdcBalanceResult[1];
                const usdcBalance = BigInt(usdcLow) + (BigInt(usdcHigh) << BigInt(128));

                if (usdcBalance < BigInt(finalUSDAmount)) {
                    setInsufficientFundsError(`Insufficient funds to place bid.`);
                    setIsSubmitting(false);
                    return;
                }

                // Approve 2% more than the USDC amount needed for the bid
                const approvalAmountValue = (BigInt(finalUSDAmount) * 102n) / 100n;
                const approvalAmount = uint256.bnToUint256(approvalAmountValue);
                calls.push({
                    contractAddress: USDC_ADDRESS,
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
                        finalUSDAmount.toString()
                    ]
                });
            }

            const response = await account.execute(calls);
            setTxnHash(response.transaction_hash);
            setBidAmountToken("");

        } catch (err) {
            console.error("Error placing bid:", err);
            if (err instanceof Error && err.message.includes("balance")) {
                setInsufficientFundsError("Insufficient funds");
            }
        } finally {
            setIsSubmitting(false);
        }
    }, [account, address, selectedCollectionId, bidAmountToken, bidAmountUSD, isBidValid, paymentToken, tokenPrice, provider, isValidPrice]);

    const isAuctionExpired = useCallback((endTime: string, status: string): boolean => {
        if (!endTime || endTime === "0") return false;
        
        try {
            let endTimeNum: number;
            if (endTime.startsWith('0x') || endTime.startsWith('0X')) {
                endTimeNum = parseInt(endTime, 16);
            } else {
                endTimeNum = parseInt(endTime, 10);
            }

            if (isNaN(endTimeNum) || endTimeNum === 0) return false;

            const now = Math.floor(Date.now() / 1000);
            const statusNum = parseInt(status);
            
            // Expired if end time passed or status is Ended (3)
            return endTimeNum <= now || statusNum === 3;
        } catch {
            return false;
        }
    }, []);

    const handleSettleAuction = useCallback(async () => {
        if (!account || !address || selectedCollectionId === "" || selectedCollectionId === null || selectedCollectionId === undefined) {
            return;
        }

        // Find the auction to get feeToken and currentBid
        const auction = paginatedFilteredAuctions.find(a => a.auction_id === selectedCollectionId);
        if (!auction) {
            console.error("Auction not found");
            return;
        }

        // If there's no current bid, just settle without swap
        // current_bid is in u64 format (needs to be divided by 1e6 for display, but we need raw value for contract)
        const currentBidRaw = auction.current_bid ? (() => {
            const bidStr = auction.current_bid;
            return bidStr.startsWith('0x') || bidStr.startsWith('0X') 
                ? parseInt(bidStr, 16) 
                : parseFloat(bidStr);
        })() : 0;
        if (!currentBidRaw || currentBidRaw === 0) {
            try {
                setIsSettling(true);
                setSettleTxnHash(undefined);

                const auctionId = parseInt(selectedCollectionId, 10);

                const response = await account.execute({
                    contractAddress: AUCTION_CONTRACT_ADDRESS,
                    entrypoint: "settle_auction",
                    calldata: [auctionId.toString()]
                });

                setSettleTxnHash(response.transaction_hash);
                
                try {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    const canSettleResult = await provider.provider.callContract({
                        contractAddress: AUCTION_CONTRACT_ADDRESS,
                        entrypoint: "can_settle",
                        calldata: [auctionId.toString()]
                    });
                    
                    if (canSettleResult && canSettleResult.length > 0) {
                        const canSettle = parseInt(canSettleResult[0], 16);
                        setIsRefunded(canSettle === 0);
                    }
                } catch (checkError) {
                    console.error("Error checking can_settle:", checkError);
                }
            } catch (err) {
                console.error("Error settling auction:", err);
            } finally {
                setIsSettling(false);
            }
            return;
        }

        try {
            setIsSettling(true);
            setSettleTxnHash(undefined);

            const auctionId = parseInt(selectedCollectionId, 10);

            const calls: Array<{
                contractAddress: string;
                entrypoint: string;
                calldata: string[];
            }> = [];

            // 1. Settle the auction (this transfers USDC from vault to seller)
            calls.push({
                contractAddress: AUCTION_CONTRACT_ADDRESS,
                entrypoint: "settle_auction",
                calldata: [auctionId.toString()]
            });

            // 2. Swap USDC to feeToken only if caller is the seller
            // Check if caller is the seller
            const callerAddress = normalizeContractAddress(address).toLowerCase();
            const sellerAddress = normalizeContractAddress(auction.seller).toLowerCase();
            const isSeller = callerAddress === sellerAddress;

            // Only do swap if caller is seller and feeToken is different from USDC
            const feeTokenAddress = normalizeContractAddress(auction.fee_token).toLowerCase();
            const usdcAddress = normalizeContractAddress(USDC_ADDRESS).toLowerCase();

            if (isSeller && feeTokenAddress !== usdcAddress) {
                // Calculate USDC amount in wei (USDC has 6 decimals)
                // current_bid is already in USDC wei (6 decimals) from the contract (u64 format)
                const usdcAmountWei = BigInt(Math.floor(currentBidRaw));
                
                // Use exact amount for swap
                const swapInputAmount = usdcAmountWei;

                // Get Avnu swap quotes
                const quotes = await getQuotes({
                    sellTokenAddress: USDC_ADDRESS,
                    buyTokenAddress: auction.fee_token,
                    sellAmount: swapInputAmount,
                    takerAddress: address,
                });

                if (!quotes || quotes.length === 0) {
                    throw new Error('No swap quotes available');
                }

                const bestQuote = quotes[0];

                // Build the execute transaction calls from the quote
                const swapCallsResult = await quoteToCalls({
                    quoteId: bestQuote.quoteId,
                    slippage: 0.01, // 1% slippage
                });

                // Avnu SDK returns an object with a 'calls' array
                const allSwapCalls = swapCallsResult.calls || (Array.isArray(swapCallsResult) ? swapCallsResult : [swapCallsResult]);
                
                // Filter out approve calls (we'll add our own)
                const swapCalls = allSwapCalls.filter(call => {
                    return call.entrypoint !== 'approve';
                });

                if (swapCalls.length === 0) {
                    console.error('No swap calls found after filtering. All calls:', allSwapCalls);
                    throw new Error('No swap calls available from quote');
                }

                // Approve the exact USDC amount needed for the swap
                const usdcApprovalAmount = swapInputAmount;
                const usdcApproval = uint256.bnToUint256(usdcApprovalAmount);

                // Get the router address from the first swap call (the multi_route_swap call)
                const routerAddress = swapCalls[0]?.contractAddress;
                if (!routerAddress) {
                    console.error('Swap calls structure:', swapCalls);
                    throw new Error(`Unable to determine router address from swap calls. First call: ${JSON.stringify(swapCalls[0])}`);
                }

                calls.push({
                    contractAddress: USDC_ADDRESS,
                    entrypoint: "approve",
                    calldata: [
                        routerAddress,
                        usdcApproval.low.toString(),
                        usdcApproval.high.toString()
                    ]
                });

                // Add the swap transaction calls
                swapCalls.forEach(call => {
                    // Convert calldata to string array (Avnu SDK may return numbers)
                    const calldataArray = Array.isArray(call.calldata) 
                        ? call.calldata.map(arg => typeof arg === 'string' ? arg : String(arg))
                        : [];
                    
                    calls.push({
                        contractAddress: call.contractAddress,
                        entrypoint: call.entrypoint,
                        calldata: calldataArray
                    });
                });
            }

            const response = await account.execute(calls);
            setSettleTxnHash(response.transaction_hash);
            
            try {
                await new Promise(resolve => setTimeout(resolve, 2000));
                const canSettleResult = await provider.provider.callContract({
                    contractAddress: AUCTION_CONTRACT_ADDRESS,
                    entrypoint: "can_settle",
                    calldata: [auctionId.toString()]
                });
                
                if (canSettleResult && canSettleResult.length > 0) {
                    const canSettle = parseInt(canSettleResult[0], 16);
                    setIsRefunded(canSettle === 0);
                }
            } catch (checkError) {
                console.error("Error checking can_settle:", checkError);
            }
        } catch (err) {
            console.error("Error settling auction - contract call failed:", err);
            if (err instanceof Error) {
                console.error("Error message:", err.message);
                console.error("Error stack:", err.stack);
            }
            console.error("Failed call details:", {
                contract: AUCTION_CONTRACT_ADDRESS,
                entrypoint: "settle_auction",
                auctionId: selectedCollectionId
            });
        } finally {
            setIsSettling(false);
        }
    }, [account, address, selectedCollectionId, paginatedFilteredAuctions, provider]);


    const updateSelection = useCallback((collection: Collection | undefined) => {
        if (!collection) {
            return;
        }

        setSelectedCollectionId(collection.id);
        setBidAmountToken("");
        setTxnHash(undefined);
        setSettleTxnHash(undefined);
        setInsufficientFundsError(null);
        setIsRefunded(false);
    }, []);

    const handleSelectCollection = useCallback(
        (collection: Collection) => {
            if (selectedCollectionId === collection.id) {
                setSelectedCollectionId("");
                setBidAmountToken("");
                setTxnHash(undefined);
                setSettleTxnHash(undefined);
                setInsufficientFundsError(null);
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

        if (collections.length === 0) {
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

        const auction = paginatedFilteredAuctions.find(a => a.auction_id === selectedCollection.id);
        const isUserSeller = address && auction?.seller ? (() => {
            const userAddress = normalizeContractAddress(address).toLowerCase();
            const sellerAddress = normalizeContractAddress(auction.seller).toLowerCase();
            return userAddress == sellerAddress;
        })() : false;

        return (
                <section className="mx-auto w-full max-w-6xl overflow-hidden rounded-2xl border border-[rgb(50,255,52)]/80 bg-black/55 shadow-[0_16px_40px_rgba(5,20,5,0.35)]">
                    <div className="grid gap-8 p-6 grid-cols-[minmax(0,0.35fr)_minmax(0,0.65fr)] md:items-start">
                        <div className="flex flex-col items-center gap-4 text-center md:items-start md:text-left">
                            {(() => {
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
                                {truncateAuctionName(selectedCollection.name)}
                            </h2>
                            <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-[11px] font-orbitron uppercase tracking-[0.16em] ${getStatusStyle(selectedCollection.status)}`}>
                                {getStatusLabel(selectedCollection.status)}
                            </span>
                            <p className="text-xs leading-relaxed text-[rgb(186,255,188)]/70">
                                {selectedCollection.totalMonsters} {selectedCollection.totalMonsters === 1 ? 'NFT' : 'NFTs'} in this collection
                            </p>
                            <p className="text-xs leading-relaxed text-[rgb(186,255,188)]/70">
                                Seller: <a 
                                    href={`https://voyager.online/contract/${selectedCollection.sellerFull}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-[rgb(50,255,52)] hover:underline"
                                >
                                    {selectedCollection.seller}
                                </a>
                            </p>
                            <p className="text-xs leading-relaxed text-[rgb(186,255,188)]/70">
                                Highest Bidder: {(() => {
                                    const isZeroAddress = !selectedCollection.highestBidderFull || 
                                        selectedCollection.highestBidderFull === '0x0' || 
                                        selectedCollection.highestBidderFull === '0' ||
                                        selectedCollection.highestBidderFull.toLowerCase().startsWith('0x0000') ||
                                        selectedCollection.highestBidderFull === '0x0000000000000000000000000000000000000000000000000000000000000000';
                                    
                                    if (isZeroAddress) {
                                        return '-';
                                    }
                                    
                                    const isUserBidder = address && selectedCollection.highestBidderFull ? (() => {
                                        const userAddress = normalizeContractAddress(address).toLowerCase();
                                        const bidderAddress = normalizeContractAddress(selectedCollection.highestBidderFull).toLowerCase();
                                        return userAddress === bidderAddress;
                                    })() : false;
                                    
                                    return (
                                        <a 
                                            href={`https://voyager.online/contract/${selectedCollection.highestBidderFull}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="hover:text-[rgb(50,255,52)] hover:underline"
                                        >
                                            {selectedCollection.highestBidder}{isUserBidder ? ' (you)' : ''}
                                        </a>
                                    );
                                })()}
                            </p>
                            <p className="text-xs leading-relaxed text-[rgb(186,255,188)]/70 hover:cursor-pointer hover:text-[rgb(50,255,52)]" onClick={() => {
                                const collectionLink = `${window.location.origin}/?token=${selectedCollection.id}`;
                                navigator.clipboard.writeText(collectionLink);
                                setCopied(true);
                                setCopiedTimeout(setTimeout(() => {
                                    setCopied(false);
                                }, 2000));
                            }}>{copied ? "Copied!" : "🔗 Copy Collection Link"}</p>
                        </div>

                        <div className="flex flex-col gap-6">
                            <div className="grid grid-cols-1 gap-3 text-sm text-white sm:grid-cols-2">
                                <div className="rounded-xl border border-white/12 bg-white/5 px-4 py-3 text-center sm:text-left">
                                    <p className="text-[rgb(186,255,188)]/70 text-[11px] uppercase tracking-[0.16em]">
                                        Reserved Price
                                    </p>
                                    <p className="font-orbitron text-lg tracking-[0.12em]">
                                        {formatUSD(selectedCollection.startingPrice / 1e6)}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-white/12 bg-white/5 px-4 py-3 text-center sm:text-left">
                                    <p className="text-[rgb(186,255,188)]/70 text-[11px] uppercase tracking-[0.16em]">
                                        Highest Bid
                                    </p>
                                    <p className="font-orbitron text-lg tracking-[0.12em]">
                                        {selectedCollection.highestBid !== undefined ? formatUSD(selectedCollection.highestBid) : "No bids"}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4 sm:items-start w-full">
                                <div className="flex flex-col gap-3">
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
                                        className="w-40 rounded-xl border border-[rgb(50,255,52)]/40 bg-[rgb(50,255,52)]/5 px-4 py-2.5 text-sm font-orbitron uppercase tracking-widest text-white outline-none transition focus:border-[rgb(50,255,52)] focus:ring-2 focus:ring-[rgb(50,255,52)]/35"
                                    >
                                        {SUPPORTED_TOKENS.map((token) => (
                                            <option key={token.address} value={token.address}>
                                                {token.symbol}
                                            </option>
                                        ))}
                                    </select>
                                    {bidAmountUSD > 0 && paymentToken.toLowerCase() !== USDC_ADDRESS.toLowerCase() && (
                                        <p className="text-xs text-[rgb(186,255,188)]/50">
                                            ≈ {(() => {
                                                const tokenInfo = SUPPORTED_TOKENS.find(t => t.address.toLowerCase() === paymentToken.toLowerCase());
                                                const symbol = tokenInfo?.symbol || "";
                                                const decimals = tokenInfo?.decimals || 18;
                                                return formatTokenAmount(bidAmountInPaymentToken, decimals, symbol);
                                            })()}
                                        </p>
                                    )}
                                    {insufficientFundsError && (
                                        <p className="text-xs text-red-400">
                                            {insufficientFundsError}
                                        </p>
                                    )}
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
                                        <div className="flex-1 grid grid-cols-1 gap-6 text-sm text-white sm:grid-cols-2 w-full">
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

                            <div className="w-full flex gap-4 items-start">
                                <div className="flex w-[200px] flex-col gap-3">
                                    <label
                                        htmlFor="bid-amount-token"
                                        className="text-[11px] font-orbitron uppercase tracking-[0.14em] text-[rgb(186,255,188)]/70"
                                    >
                                        Place Your Bid (USDC)
                                    </label>
                                    <input
                                        id="bid-amount-token"
                                        type="text"
                                        value={bidAmountToken}
                                        placeholder="0.00"
                                        onChange={(event) => {
                                            const value = event.target.value;
                                            setBidAmountToken(value);
                                            
                                            if (paymentToken.toLowerCase() !== USDC_ADDRESS.toLowerCase() && shouldRefetchPrice(paymentToken)) {
                                                getTokenPriceInUSDC(paymentToken).then(price => {
                                                    setTokenPrice(price);
                                                }).catch(err => {
                                                    console.error('Error refetching price:', err);
                                                });
                                            }
                                        }}
                                        className="w-40 rounded-xl border border-[rgb(50,255,52)]/40 bg-[rgb(50,255,52)]/5 px-4 py-2.5 text-sm font-orbitron uppercase tracking-widest text-white outline-none transition focus:border-[rgb(50,255,52)] focus:ring-2 focus:ring-[rgb(50,255,52)]/35 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                    />
                                </div> 
                                {(() => {
                                    const auction = paginatedFilteredAuctions.find(a => a.auction_id === selectedCollection.id);
                                    const nfts = auction?.nfts || [];
                                    
                                    // Calculate power distribution by type
                                    const powerDistribution = nfts.reduce((acc, nft) => {
                                        const type = nft.beastType || 'Unknown';
                                        const power = parseFloat(nft.power || '0');
                                        const validPower = isNaN(power) ? 0 : power;
                                        
                                        if (type === 'Magic' || type === 'Brute' || type === 'Hunter') {
                                            acc[type] = (acc[type] || 0) + validPower;
                                        }
                                        return acc;
                                    }, {} as Record<string, number>);
                                    
                                    const magicPower = powerDistribution['Magic'] || 0;
                                    const brutePower = powerDistribution['Brute'] || 0;
                                    const hunterPower = powerDistribution['Hunter'] || 0;
                                    
                                    return (
                                        <div className="flex flex-col gap-3 flex-1">
                                            <label className="text-[11px] font-orbitron uppercase tracking-[0.14em] text-[rgb(186,255,188)]/70">
                                                Power Distribution
                                            </label>
                                            <div className="grid grid-cols-3 gap-3">
                                                <div className="rounded-xl border border-white/12 bg-white/5 px-4 py-3 text-center sm:text-left">
                                                    <p className="text-[rgb(186,255,188)]/70 text-[11px] uppercase tracking-[0.16em]">
                                                        Magic
                                                    </p>
                                                    <p className="font-orbitron text-lg tracking-[0.12em]">
                                                        {magicPower.toFixed(1)}
                                                    </p>
                                                </div>
                                                <div className="rounded-xl border border-white/12 bg-white/5 px-4 py-3 text-center sm:text-left">
                                                    <p className="text-[rgb(186,255,188)]/70 text-[11px] uppercase tracking-[0.16em]">
                                                        Brute
                                                    </p>
                                                    <p className="font-orbitron text-lg tracking-[0.12em]">
                                                        {brutePower.toFixed(1)}
                                                    </p>
                                                </div>
                                                <div className="rounded-xl border border-white/12 bg-white/5 px-4 py-3 text-center sm:text-left">
                                                    <p className="text-[rgb(186,255,188)]/70 text-[11px] uppercase tracking-[0.16em]">
                                                        Hunter
                                                    </p>
                                                    <p className="font-orbitron text-lg tracking-[0.12em]">
                                                        {hunterPower.toFixed(1)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                            
                            <div className="flex flex-row gap-5 max-w-[500px]">
                                <button
                                    type="button"
                                    onClick={handlePlaceBid}
                                    disabled={!isBidValid || !account || isSubmitting || isUserSeller}
                                    className={`inline-flex items-center justify-center rounded-full w-full px-6 h-10 text-sm font-orbitron uppercase tracking-[0.18em] transition ${
                                        isBidValid && account && !isSubmitting && !isUserSeller
                                            ? "border border-[rgb(50,255,52)] bg-[rgb(50,255,52)]/10 text-[rgb(50,255,52)] hover:cursor-pointer hover:bg-[rgb(50,255,52)] hover:text-black"
                                            : "border border-white/12 text-[rgb(186,255,188)]/45"
                                    }`}
                                >
                                    {isSubmitting ? "Submitting..." : "Place Bid"}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSettleAuction}
                                    disabled={!account || isSettling || !isAuctionExpired(selectedCollection.endTime, selectedCollection.status)}
                                    className={`inline-flex items-center justify-center rounded-full w-full px-2 h-10 text-sm font-orbitron uppercase tracking-[0.18em] transition ${
                                        account && !isSettling && isAuctionExpired(selectedCollection.endTime, selectedCollection.status)
                                            ? "border border-orange-500 bg-orange-500/10 text-orange-500 hover:cursor-pointer hover:bg-orange-500 hover:text-black"
                                            : "border border-white/12 text-[rgb(186,255,188)]/45"
                                    }`}
                                >
                                    {isSettling ? "Settling..." : "Settle Auction"}
                                </button>
                            </div>

                            {txnHash && (
                                <div className="rounded-xl border border-[rgb(50,255,52)]/40 bg-[rgb(50,255,52)]/10 px-4 py-3 w-full">
                                    <p className="text-[11px] font-orbitron uppercase tracking-[0.16em] text-[rgb(186,255,188)]/70 mb-2">
                                        Bid Transaction Submitted
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
                            {settleTxnHash && (
                                <div className="rounded-xl border border-orange-500/40 bg-orange-500/10 px-4 py-3 w-full">
                                    <p className="text-[11px] font-orbitron uppercase tracking-[0.16em] text-[rgb(186,255,188)]/70 mb-2">
                                        {isRefunded ? "Auction Refunded" : "Settle Transaction Submitted"}
                                    </p>
                                    {isRefunded && (
                                        <p className="text-xs text-[rgb(186,255,188)]/70 mb-2">
                                            All parties have been refunded
                                        </p>
                                    )}
                                    <a
                                        href={explorer.transaction(settleTxnHash)}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-sm font-orbitron text-orange-500 hover:underline break-all w-full"
                                    >
                                        {settleTxnHash}
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
            <Filters token={token} filters={filters} onFiltersChange={setFilters} />
            {renderContent()}
        </div>
    );
}