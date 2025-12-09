import { useCallback, useMemo, useState, useEffect, useRef } from "react";
import { useAccount, useExplorer, useProvider } from "@starknet-react/core";
import Image from "next/image";
import MonsterCollectionCard from "./monster-collection-card";
import Pagination from "./pagination";
import Filters, { FilterState } from "./filters";
import type { AuctionItem } from "../lib/types";
import { AuctionWithNFTs } from "../hooks/use-auctions";
import { uint256, num } from "starknet";
import { truncateWithEllipsis, truncateAddress, formatUSD, formatTokenAmount } from "../lib/utils";
import { applyFiltersToAuctions } from "../lib/filter-utils";
import { normalizeContractAddress } from "../lib/utils/normalization";
import { AUCTION_CONTRACT_ADDRESS, VAULT_CONTRACT_ADDRESS, DEFAULT_PAGE_SIZE, MAX_UINT256, IMAGE_BASE_URL, SUPPORTED_TOKENS, EKUBO_ROUTER_ADDRESS, USDC_ADDRESS } from "../lib/constants";
import { getSwapQuote, generateSwapCalls, type TokenQuote, type RouterContract } from "../lib/api/ekubo";
import { convertUSDCToToken } from "../lib/utils/usd-pricing";
import { getTokenPriceInUSDC, shouldRefetchPrice } from "../lib/utils/token-price-cache"; 

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
    const [isWithdrawing, setIsWithdrawing] = useState(false);
    const [withdrawTxnHash, setWithdrawTxnHash] = useState<string | undefined>();
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
    const [bidAmountToken, setBidAmountToken] = useState<string>("");
    const [paymentToken, setPaymentToken] = useState<string>(USDC_ADDRESS);
    const [convertedStartingPrice, setConvertedStartingPrice] = useState<number>(0);
    const [convertedHighestBid, setConvertedHighestBid] = useState<number | undefined>(undefined);
    const [isConvertingPrices, setIsConvertingPrices] = useState(false);
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
        const convertPrices = async () => {
            if (!selectedCollection) {
                setConvertedStartingPrice(0);
                setConvertedHighestBid(undefined);
                return;
            }

            setIsConvertingPrices(true);
            try {
                if (paymentToken.toLowerCase() === USDC_ADDRESS.toLowerCase()) {
                    setConvertedStartingPrice(selectedCollection.startingPrice / 1e6);
                    setConvertedHighestBid(selectedCollection.highestBid);
                } else if (tokenPrice !== null) {
                    setConvertedStartingPrice((selectedCollection.startingPrice / 1e6) / tokenPrice);
                    
                    if (selectedCollection.highestBid !== undefined) {
                        setConvertedHighestBid(selectedCollection.highestBid / tokenPrice);
                    } else {
                        setConvertedHighestBid(undefined);
                    }
                } else {
                    const convertedStart = await convertUSDCToToken(selectedCollection.startingPrice / 1e6, paymentToken);
                    setConvertedStartingPrice(convertedStart);
                    
                    if (selectedCollection.highestBid !== undefined) {
                        const convertedBid = await convertUSDCToToken(selectedCollection.highestBid, paymentToken);
                        setConvertedHighestBid(convertedBid);
                    } else {
                        setConvertedHighestBid(undefined);
                    }
                }
            } catch (error) {
                console.error('Error converting prices:', error);
                setConvertedStartingPrice(selectedCollection.startingPrice / 1e6);
                setConvertedHighestBid(selectedCollection.highestBid);
            } finally {
                setIsConvertingPrices(false);
            }
        };

        convertPrices();
    }, [selectedCollection, paymentToken, tokenPrice]);



    const bidAmountUSD = useMemo(() => {
        const tokenAmount = parseFloat(bidAmountToken);
        if (Number.isNaN(tokenAmount) || tokenAmount <= 0 || tokenPrice === null || !isValidPrice(tokenPrice)) {
            return 0;
        }
        
        if (paymentToken.toLowerCase() === USDC_ADDRESS.toLowerCase()) {
            return tokenAmount;
        }
        
        const usdAmount = tokenAmount * tokenPrice;
        if (!isFinite(usdAmount) || usdAmount === Infinity || usdAmount === -Infinity) {
            return 0;
        }
        
        return usdAmount;
    }, [bidAmountToken, tokenPrice, paymentToken, isValidPrice]);

    const isBidValid = useMemo(() => {
        const numericBid = parseFloat(bidAmountToken);
        if (Number.isNaN(numericBid) || numericBid <= 0 || tokenPrice === null || !isValidPrice(tokenPrice)) {
            return false;
        }
        return true;
    }, [bidAmountToken, tokenPrice, isValidPrice]);

    const handlePlaceBid = useCallback(async () => {
        if (!account || !address || selectedCollectionId === "" || selectedCollectionId === null || selectedCollectionId === undefined || !isBidValid || tokenPrice === null) {
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

            const paymentTokenInfo = SUPPORTED_TOKENS.find(t => t.address.toLowerCase() === paymentToken.toLowerCase());
            if (!paymentTokenInfo) {
                throw new Error('Invalid payment token');
            }

            const tokenAmount = parseFloat(bidAmountToken);
            if (isNaN(tokenAmount) || tokenAmount <= 0) {
                throw new Error('Invalid bid amount');
            }

            const tokenAmountWei = BigInt(Math.floor(tokenAmount * Math.pow(10, paymentTokenInfo.decimals)));

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

            if (balance < tokenAmountWei) {
                const balanceFormatted = (Number(balance) / Math.pow(10, paymentTokenInfo.decimals)).toFixed(paymentTokenInfo.decimals);
                setInsufficientFundsError(`Insufficient funds. You have ${balanceFormatted} ${paymentTokenInfo.symbol}, but need ${tokenAmount} ${paymentTokenInfo.symbol}.`);
                setIsSubmitting(false);
                return;
            }

            const usdAmount = bidAmountUSD;

            let finalUSDAmount = Math.floor(usdAmount * 1e6);
            if (paymentToken.toLowerCase() !== USDC_ADDRESS.toLowerCase() && shouldRefetchPrice(paymentToken)) {
                const freshPrice = await getTokenPriceInUSDC(paymentToken);
                setTokenPrice(freshPrice);
                finalUSDAmount = Math.floor(tokenAmount * freshPrice * 1e6);
            }

            if (paymentToken.toLowerCase() === USDC_ADDRESS.toLowerCase()) {
                const approvalAmount = uint256.bnToUint256(tokenAmountWei);
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
            } else {
                const swapQuote = await getSwapQuote(Number(tokenAmountWei), paymentToken, USDC_ADDRESS);

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

                const usdcTokenInfo = SUPPORTED_TOKENS.find(t => t.address.toLowerCase() === USDC_ADDRESS.toLowerCase());
                const usdcDecimals = usdcTokenInfo?.decimals || 6;
                
                const tokenQuote: TokenQuote = {
                    tokenAddress: USDC_ADDRESS,
                    minimumAmount: 0, // Will be calculated from quote.total in generateSwapCalls
                    quote: swapQuote,
                    outputTokenDecimals: usdcDecimals
                };

                const swapCalls = generateSwapCalls(routerContract, paymentToken, tokenQuote, tokenAmountWei);

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

                const usdcApproval = uint256.bnToUint256(MAX_UINT256);
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
    }, [account, address, selectedCollectionId, bidAmountToken, bidAmountUSD, isBidValid, paymentToken, tokenPrice, provider]);

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
        if (!account || !address || !selectedCollectionId) {
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
                
                // generateSwapCalls adds a 1% buffer (101/100), so we need to pass 100/101 of the amount
                // to ensure the transfer doesn't exceed the balance after settle_auction
                const swapInputAmount = (usdcAmountWei * 100n) / 101n;

                // Get swap quote using the adjusted amount
                const swapQuote = await getSwapQuote(Number(swapInputAmount), USDC_ADDRESS, auction.fee_token);

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
                    tokenAddress: auction.fee_token,
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
            setSettleTxnHash(response.transaction_hash);
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
    }, [account, address, selectedCollectionId, paginatedFilteredAuctions]);

    const handleWithdrawBid = useCallback(async () => {
        if (!account) {
            return;
        }
        
        if (selectedCollectionId === "" || selectedCollectionId === null || selectedCollectionId === undefined) {
            return;
        }

        try {
            setIsWithdrawing(true);
            setWithdrawTxnHash(undefined);

            const auctionId = parseInt(selectedCollectionId, 10);

            const response = await account.execute([{
                contractAddress: AUCTION_CONTRACT_ADDRESS,
                entrypoint: "withdraw_bid",
                calldata: [auctionId.toString()]
            }]);

            setWithdrawTxnHash(response.transaction_hash);
        } catch (err) {
            console.error("Error withdrawing bid:", err);
        } finally {
            setIsWithdrawing(false);
        }
    }, [account, selectedCollectionId]);

    const updateSelection = useCallback((collection: Collection | undefined) => {
        if (!collection) {
            return;
        }

        setSelectedCollectionId(collection.id);
        setBidAmountToken("");
        setTxnHash(undefined);
        setSettleTxnHash(undefined);
        setWithdrawTxnHash(undefined);
        setInsufficientFundsError(null);
    }, []);

    const handleSelectCollection = useCallback(
        (collection: Collection) => {
            if (selectedCollectionId === collection.id) {
                setSelectedCollectionId("");
                setBidAmountToken("");
                setTxnHash(undefined);
                setSettleTxnHash(undefined);
                setWithdrawTxnHash(undefined);
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

        return (
                <section className="mx-auto w-full max-w-6xl overflow-hidden rounded-2xl border border-[rgb(50,255,52)]/80 bg-black/55 shadow-[0_16px_40px_rgba(5,20,5,0.35)]">
                    <div className="grid gap-8 p-6 grid-cols-[minmax(0,0.35fr)_minmax(0,0.65fr)] md:items-start">
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
                                        Starting
                                    </p>
                                    <p className="font-orbitron text-lg tracking-[0.12em]">
                                        {isConvertingPrices ? (
                                            "Loading..."
                                        ) : (() => {
                                            const tokenInfo = SUPPORTED_TOKENS.find(t => t.address.toLowerCase() === paymentToken.toLowerCase());
                                            const symbol = tokenInfo?.symbol || "";
                                            const decimals = tokenInfo?.decimals || 18;
                                            
                                            if (paymentToken.toLowerCase() === USDC_ADDRESS.toLowerCase()) {
                                                return formatUSD(selectedCollection.startingPrice/1e6);
                                            } else {
                                                return formatTokenAmount(convertedStartingPrice, decimals, symbol);
                                            }
                                        })()}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-white/12 bg-white/5 px-4 py-3 text-center sm:text-left">
                                    <p className="text-[rgb(186,255,188)]/70 text-[11px] uppercase tracking-[0.16em]">
                                        Highest Bid
                                    </p>
                                    <p className="font-orbitron text-lg tracking-[0.12em]">
                                        {isConvertingPrices ? (
                                            "Loading..."
                                        ) : selectedCollection.highestBid !== undefined ? (() => {
                                            const tokenInfo = SUPPORTED_TOKENS.find(t => t.address.toLowerCase() === paymentToken.toLowerCase());
                                            const symbol = tokenInfo?.symbol || "";
                                            const decimals = tokenInfo?.decimals || 18;
                                            
                                            if (paymentToken.toLowerCase() === USDC_ADDRESS.toLowerCase()) {
                                                return formatUSD(selectedCollection.highestBid);
                                            } else {
                                                return formatTokenAmount(convertedHighestBid, decimals, symbol);
                                            }
                                        })() : "No bids"}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4 sm:items-start w-full">
                                <div className="flex w-[200px] flex-col gap-3">
                                    <label
                                        htmlFor="bid-amount-token"
                                        className="text-[11px] font-orbitron uppercase tracking-[0.14em] text-[rgb(186,255,188)]/70"
                                    >
                                        {(() => {
                                            const tokenInfo = SUPPORTED_TOKENS.find(t => t.address.toLowerCase() === paymentToken.toLowerCase());
                                            return `Place Your Bid (${tokenInfo?.symbol || "USDC"})`;
                                        })()}
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
                                        className="w-40 rounded-xl border border-white/12 bg-black/60 px-4 py-2.5 text-sm font-orbitron uppercase tracking-widest text-white outline-none transition focus:border-[rgb(50,255,52)] focus:ring-2 focus:ring-[rgb(50,255,52)]/35 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                    />
                                    {bidAmountUSD > 0 && (
                                        <p className="text-xs text-[rgb(186,255,188)]/50">
                                            ≈ {formatUSD(bidAmountUSD)}
                                        </p>
                                    )}
                                    {insufficientFundsError && (
                                        <p className="text-xs text-red-400">
                                            {insufficientFundsError}
                                        </p>
                                    )}
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
                            <div className="flex flex-row gap-2">
                                <button
                                    type="button"
                                    onClick={handlePlaceBid}
                                    disabled={!isBidValid || !account || isSubmitting}
                                    className={`inline-flex items-center justify-center rounded-full w-full px-6 h-10 text-sm font-orbitron uppercase tracking-[0.18em] transition ${
                                        isBidValid && account && !isSubmitting
                                            ? "border border-[rgb(50,255,52)] bg-[rgb(50,255,52)]/10 text-[rgb(50,255,52)] hover:cursor-pointer hover:bg-[rgb(50,255,52)] hover:text-black"
                                            : "border border-white/12 text-[rgb(186,255,188)]/45"
                                    }`}
                                >
                                    {isSubmitting ? "Submitting..." : "Place Bid"}
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleWithdrawBid();
                                    }}
                                    disabled={!account || isWithdrawing}
                                    className={`inline-flex items-center justify-center rounded-full w-full px-6 h-10 text-sm font-orbitron uppercase tracking-[0.18em] transition ${
                                        account && !isWithdrawing
                                            ? "border border-red-500 bg-red-500/10 text-red-500 hover:cursor-pointer hover:bg-red-500 hover:text-black"
                                            : "border border-white/12 text-[rgb(186,255,188)]/45"
                                    }`}
                                >
                                    {isWithdrawing ? "Removing..." : "Remove Bid"}
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
                                        Settle Transaction Submitted
                                    </p>
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
                            {withdrawTxnHash && (
                                <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 w-full">
                                    <p className="text-[11px] font-orbitron uppercase tracking-[0.16em] text-[rgb(186,255,188)]/70 mb-2">
                                        Withdraw Bid Transaction Submitted
                                    </p>
                                    <a
                                        href={explorer.transaction(withdrawTxnHash)}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-sm font-orbitron text-red-500 hover:underline break-all w-full"
                                    >
                                        {withdrawTxnHash}
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