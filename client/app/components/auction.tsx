import { useCallback, useMemo, useState, useEffect } from "react";
import { useAccount, useExplorer } from "@starknet-react/core";
import { byteArray } from "starknet";
import MonsterCard from "./monster-card";
import Pagination from "./pagination";
import Filters, { FilterState } from "./filters";
import AuctionSkeleton from "./auction-skeleton";
import CustomDropdown from "./custom-dropdown";
import type { FormattedNFT } from "../lib/types";
import { applyFiltersToNFTs } from "../lib/filter-utils";
import { AUCTION_CONTRACT_ADDRESS, DEFAULT_PAGE_SIZE, DEFAULT_AUCTION_DURATION_MINUTES, SUPPORTED_TOKENS, USDC_ADDRESS, BEASTS_NFT_CONTRACT_ADDRESS, MAX_AUCTION_NFT_SELECTION } from "../lib/constants";
import { fetchTokens } from "@avnu/avnu-sdk";
import { normalizeContractAddress } from "../lib/utils/normalization";

interface AuctionProps {
    nfts: FormattedNFT[];
    loading: boolean;
    error: Error | null;
}

export default function Auction({ nfts, loading, error }: AuctionProps) {
    const { account, address } = useAccount();
    const explorer = useExplorer();
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedNFTIds, setSelectedNFTIds] = useState<string[]>([]);
    const [collectionName, setCollectionName] = useState<string>("");
    const [startingPriceUSD, setStartingPriceUSD] = useState<string>("");
    const [sellerToken, setSellerToken] = useState<string>(USDC_ADDRESS);
    const [tokenLogos, setTokenLogos] = useState<Record<string, string>>({});

    const dateToLocalDateTimeString = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };
    
    const getDefaultDateTime = () => {
        const now = new Date();
        const defaultTime = new Date(now.getTime() + 40 * 60 * 1000);
        return dateToLocalDateTimeString(defaultTime);
    };
    const [endDateTime, setEndDateTime] = useState<string>(getDefaultDateTime());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [txnHash, setTxnHash] = useState<string | undefined>();
    const [durationError, setDurationError] = useState<string | null>(null);
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

    const toggleCardSelection = useCallback((nftId: string) => {
        setSelectedNFTIds((previouslySelected) => {
            if (previouslySelected.includes(nftId)) {
                return previouslySelected.filter((existingId) => existingId !== nftId);
            }

            if (previouslySelected.length >= MAX_AUCTION_NFT_SELECTION) {
                return previouslySelected;
            }

            return [...previouslySelected, nftId];
        });
    }, []);

    const filteredNFTs = useMemo(() => {
        return applyFiltersToNFTs(nfts, filters);
    }, [nfts, filters]);

    const selectAll = useCallback(() => {
        const ids = filteredNFTs.slice(0, MAX_AUCTION_NFT_SELECTION).map(nft => nft.tokenId);
        setSelectedNFTIds(ids);
    }, [filteredNFTs]);

    const selectHalf = useCallback(() => {
        const count = Math.min(Math.ceil(filteredNFTs.length / 2), MAX_AUCTION_NFT_SELECTION);
        setSelectedNFTIds(filteredNFTs.slice(0, count).map(nft => nft.tokenId));
    }, [filteredNFTs]);

    const selectQuarter = useCallback(() => {
        const count = Math.min(Math.ceil(filteredNFTs.length / 4), MAX_AUCTION_NFT_SELECTION);
        setSelectedNFTIds(filteredNFTs.slice(0, count).map(nft => nft.tokenId));
    }, [filteredNFTs]);

    useEffect(() => {
        setCurrentPage(1);
    }, [filters]);

    useEffect(() => {
        const loadLogos = async () => {
            try {
                const page = await fetchTokens({ page: 0, size: 100 });
                const logos: Record<string, string> = {};
                SUPPORTED_TOKENS.forEach((token) => {
                    const normalizedSupported = normalizeContractAddress(token.address);
                    const match = page.content.find(
                        (t) => normalizeContractAddress(t.address) === normalizedSupported,
                    );
                    if (match && match.logoUri) {
                        logos[token.address] = match.logoUri;
                    }
                });
                setTokenLogos(logos);
            } catch (error) {
                console.error("Failed to fetch token logos:", error);
            }
        };
        loadLogos();
    }, []);

    const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredNFTs.length / DEFAULT_PAGE_SIZE)), [filteredNFTs.length]);

    const visibleNFTs = useMemo(() => {
        const startIndex = (currentPage - 1) * DEFAULT_PAGE_SIZE;
        return filteredNFTs.slice(startIndex, startIndex + DEFAULT_PAGE_SIZE);
    }, [currentPage, filteredNFTs]);

    const selectedNFTs = useMemo(
        () => nfts.filter((nft) => selectedNFTIds.includes(nft.tokenId)),
        [selectedNFTIds, nfts],
    );

    const hasSelection = selectedNFTs.length > 0;

    const averageLevel = useMemo(() => {
        if (!hasSelection) {
            return null;
        }

        const totalLevels = selectedNFTs.reduce((sum, nft) => {
            const level = nft.level ? parseInt(nft.level) : 0;
            return sum + level;
        }, 0);
        return Math.round(totalLevels / selectedNFTs.length);
    }, [hasSelection, selectedNFTs]);

    const totalPower = useMemo(() => {
        if (!hasSelection) {
            return null;
        }

        const total = selectedNFTs.reduce((sum, nft) => {
            const power = nft.power ? parseFloat(nft.power) : 0;
            return sum + power;
        }, 0);
        return total.toFixed(1);
    }, [hasSelection, selectedNFTs]);

    const handlePageChange = useCallback(
        (page: number) => {
            const nextPage = Math.min(Math.max(page, 1), totalPages);
            if (nextPage !== currentPage) {
                setCurrentPage(nextPage);
            }
        },
        [currentPage, totalPages],
    );

    const handleClearSelection = useCallback(() => {
        setSelectedNFTIds([]);
    }, []);

    const handleListSelection = useCallback(async () => {
        if (!account || !hasSelection || !startingPriceUSD || !collectionName.trim() || !endDateTime) return;
    
        const selectedDate = new Date(endDateTime);
        const now = new Date();
        const durationSeconds = Math.floor((selectedDate.getTime() - now.getTime()) / 1000);
    
        const minimumDurationSeconds = DEFAULT_AUCTION_DURATION_MINUTES * 60;
        if (durationSeconds < minimumDurationSeconds) {
            setDurationError(`End date must be at least ${DEFAULT_AUCTION_DURATION_MINUTES} minutes from now`);
            return;
        }
    
        setDurationError(null);
        try {
            setIsSubmitting(true);
        
            const endDateTimestamp = Math.floor(new Date(endDateTime).getTime() / 1000);
            const currentTimestamp = Math.floor(Date.now() / 1000);
            const duration_seconds = endDateTimestamp - currentTimestamp;
            const token_ids = selectedNFTs.map(nft => Number(parseInt(nft.tokenId, 16)));
            
            const usdAmount = parseFloat(startingPriceUSD);
            const startingPriceWhole = Math.floor(usdAmount * 1e6);
        
            const collectionNameByteArray = byteArray.byteArrayFromString(collectionName.trim());
            
            const byteArrayCalldata = [
                collectionNameByteArray.data.length.toString(),
                ...collectionNameByteArray.data.map(item => item.toString()),
                collectionNameByteArray.pending_word.toString(),
                collectionNameByteArray.pending_word_len.toString()
            ];
            
            const calls: Array<{
                contractAddress: string;
                entrypoint: string;
                calldata: (string | number)[];
            }> = [];

            for (const tokenId of token_ids) {
                calls.push({
                    contractAddress: BEASTS_NFT_CONTRACT_ADDRESS,
                    entrypoint: "approve",
                    calldata: [
                        AUCTION_CONTRACT_ADDRESS,
                        tokenId.toString(),
                        "0"
                    ]
                });
            }

            calls.push({
                contractAddress: AUCTION_CONTRACT_ADDRESS,
                entrypoint: "create_auction",
                calldata: [
                    ...byteArrayCalldata,
                    startingPriceWhole.toString(),
                    token_ids.length.toString(),
                    ...token_ids.map(id => id.toString()),
                    BEASTS_NFT_CONTRACT_ADDRESS,
                    "0",
                    duration_seconds.toString(),
                    sellerToken
                ]
            });

            const response = await account.execute(calls);
        
            setTxnHash(response.transaction_hash);
        } catch (err) {
            console.error("Error creating auction - contract call failed:", err);
            if (err instanceof Error) {
                console.error("Error message:", err.message);
                console.error("Error stack:", err.stack);
            }
            console.error("Failed call details:", {
                contract: AUCTION_CONTRACT_ADDRESS,
                entrypoint: "create_auction"
            });
        } finally {
            setIsSubmitting(false);
        }

    }, [account, hasSelection, startingPriceUSD, collectionName, endDateTime, selectedNFTs, sellerToken]);

    const renderContent = () => {
    if (loading) {
        return <AuctionSkeleton />;
    }

    if (error) {
        return (
            <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-center gap-4 px-4 py-12">
                <p className="text-red-400">Error loading NFTs: {error.message}</p>
            </div>
        );
    }

    if (nfts.length === 0) {
        return (
            <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-center gap-4 px-4 py-12">
                <p className="text-[rgb(186,255,188)]/70">No NFTs found. Connect your wallet to see your collection.</p>
            </div>
        );
        }

    const renderBulkSelectButtons = () => (
        <div className="flex flex-wrap gap-2 mb-4">
            <button
                type="button"
                onClick={selectAll}
                className="inline-flex items-center justify-center rounded-full border border-[rgb(50,255,52)]/40 bg-[rgb(50,255,52)]/10 px-4 py-1.5 text-xs font-orbitron uppercase tracking-[0.14em] text-[rgb(50,255,52)] transition hover:bg-[rgb(50,255,52)]/20 hover:cursor-pointer"
            >
                Select All ({Math.min(filteredNFTs.length, MAX_AUCTION_NFT_SELECTION)} max)
            </button>
            <button
                type="button"
                onClick={selectHalf}
                className="inline-flex items-center justify-center rounded-full border border-[rgb(50,255,52)]/40 bg-[rgb(50,255,52)]/10 px-4 py-1.5 text-xs font-orbitron uppercase tracking-[0.14em] text-[rgb(50,255,52)] transition hover:bg-[rgb(50,255,52)]/20 hover:cursor-pointer"
            >
                Select 50% ({Math.min(Math.ceil(filteredNFTs.length / 2), MAX_AUCTION_NFT_SELECTION)})
            </button>
            <button
                type="button"
                onClick={selectQuarter}
                className="inline-flex items-center justify-center rounded-full border border-[rgb(50,255,52)]/40 bg-[rgb(50,255,52)]/10 px-4 py-1.5 text-xs font-orbitron uppercase tracking-[0.14em] text-[rgb(50,255,52)] transition hover:bg-[rgb(50,255,52)]/20 hover:cursor-pointer"
            >
                Select 25% ({Math.min(Math.ceil(filteredNFTs.length / 4), MAX_AUCTION_NFT_SELECTION)})
            </button>
            <button
                type="button"
                onClick={handleClearSelection}
                disabled={!hasSelection}
                className={`inline-flex items-center justify-center rounded-full border px-4 py-1.5 text-xs font-orbitron uppercase tracking-[0.14em] transition ${
                    hasSelection
                        ? "border-white/40 text-white hover:border-[rgb(50,255,52)] hover:text-[rgb(50,255,52)] hover:cursor-pointer"
                        : "border-white/20 text-white/30"
                }`}
            >
                Clear
            </button>
            {selectedNFTIds.length > 0 && (
                <span className="flex items-center text-xs font-orbitron uppercase tracking-[0.14em] text-[rgb(186,255,188)]/70 ml-2">
                    {selectedNFTIds.length} selected
                </span>
            )}
        </div>
    );

    const renderGrid = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 w-full">
            {visibleNFTs.map((nft) => (
                <MonsterCard
                    key={nft.tokenId}
                    nft={nft}
                    selected={selectedNFTIds.includes(nft.tokenId)}
                    onToggle={() => toggleCardSelection(nft.tokenId)}
                />
            ))}
        </div>
    );

    const renderSelectedSummary = () => {
        if (!hasSelection) return null;

        return (
                <section className="mx-auto w-full max-w-6xl overflow-hidden rounded-2xl border border-[rgb(50,255,52)]/80 bg-black/55 shadow-[0_16px_40px_rgba(5,20,5,0.35)] mt-6">
                <div className="grid gap-8 p-4 md:p-6 grid-cols-1 md:grid-cols-[minmax(0,0.4fr)_minmax(0,0.6fr)] md:items-start">
                    <div className="flex flex-col gap-4 h-full">
                        <div>
                            <p className="text-[11px] font-orbitron uppercase tracking-[0.16em] text-[rgb(186,255,188)]/70">
                                Selected NFTs
                            </p>
                            <p className="text-3xl font-orbitron uppercase tracking-[0.18em] text-white">
                                {selectedNFTs.length.toString().padStart(2, "0")}
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm text-white">
                            <div className="rounded-xl border border-white/12 bg-white/5 px-4 py-3">
                                <p className="text-[rgb(186,255,188)]/70 text-[11px] uppercase tracking-[0.16em]">Avg Level</p>
                                <p className="font-orbitron text-lg tracking-[0.12em]">
                                    {averageLevel ? `Lv. ${averageLevel}` : "—"}
                                </p>
                            </div>
                            <div className="rounded-xl border border-white/12 bg-white/5 px-4 py-3">
                                <p className="text-[rgb(186,255,188)]/70 text-[11px] uppercase tracking-[0.16em]">
                                    Total Power
                                </p>
                                <p className="font-orbitron text-lg tracking-[0.12em]">
                                    {totalPower ? `${totalPower}` : "—"}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <p className="text-[11px] font-orbitron uppercase tracking-[0.16em] text-[rgb(186,255,188)]/70">
                                Roster Preview
                            </p>
                            {hasSelection ? (
                                <ul className="flex flex-wrap gap-2">
                                    {selectedNFTs.slice(0, 16).map((nft) => (
                                        <li
                                            key={nft.tokenId}
                                            className="rounded-full border border-[rgb(50,255,52)]/40 px-3 py-1 text-[10px] font-orbitron uppercase tracking-[0.14em] text-[rgb(186,255,188)]"
                                        >
                                            {nft.metadataName}
                                        </li>
                                    ))}
                                    {selectedNFTs.length > 16 && (
                                        <li className="rounded-full border border-[rgb(50,255,52)]/40 px-3 py-1 text-[10px] font-orbitron uppercase tracking-[0.14em] text-[rgb(186,255,188)]">
                                            and {selectedNFTs.length - 16} more...
                                        </li>
                                    )}
                                </ul>
                            ) : (
                                <p className="text-xs text-[rgb(186,255,188)]/60">
                                    Select NFTs from the grid to assemble a collection for auction.
                                </p>
                            )}
                        </div>
                        <div className="mt-auto">
                            <div className="rounded-xl border border-white/12 bg-white/5 px-4 py-3">
                            <p className="text-[11px] font-orbitron uppercase tracking-[0.16em] text-[rgb(186,255,188)]/70 mb-1">
                                Fees
                            </p>
                            <p className="text-xs text-[rgb(186,255,188)]/70">
                                5% to Survivor DAO royalty, <span className="line-through">2.5% platform fee</span>
                            </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <label
                                htmlFor="collection-name"
                                className="text-[11px] font-orbitron uppercase tracking-[0.16em] text-[rgb(186,255,188)]/70"
                            >
                                Collection Name
                            </label>
                            <input
                                id="collection-name"
                                type="text"
                                value={collectionName}
                                onChange={(event) => setCollectionName(event.target.value)}
                                placeholder="Enter a name for your collection"
                                className="w-full rounded-xl border border-white/12 bg-black/60 px-4 py-2.5 text-sm font-orbitron uppercase tracking-[0.14em] text-white outline-none transition focus:border-[rgb(50,255,52)] focus:ring-2 focus:ring-[rgb(50,255,52)]/35"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label
                                htmlFor="starting-price-usd"
                                className="text-[11px] font-orbitron uppercase tracking-[0.16em] text-[rgb(186,255,188)]/70"
                            >
                                Reserved Price(USD)
                            </label>
                            <input
                                id="starting-price-usd"
                                type="text"
                                value={startingPriceUSD}
                                onChange={(event) => {
                                    setStartingPriceUSD(event.target.value);
                                }}
                                placeholder="0.00"
                                className="w-full rounded-xl border border-white/12 bg-black/60 px-4 py-2.5 text-sm font-orbitron uppercase tracking-widest text-white outline-none transition focus:border-[rgb(50,255,52)] focus:ring-2 focus:ring-[rgb(50,255,52)]/35 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label
                                className="text-[11px] font-orbitron uppercase tracking-[0.16em] text-[rgb(186,255,188)]/70"
                            >
                                Receive Payment In
                            </label>
                            <CustomDropdown
                                id="seller-token"
                                value={sellerToken}
                                onChange={setSellerToken}
                                options={SUPPORTED_TOKENS.map((token) => ({
                                    value: token.address,
                                    label: token.symbol,
                                    logo: tokenLogos[token.address]
                                }))}
                                variant="default"
                            />
                            <p className="text-xs text-[rgb(186,255,188)]/70">
                                Buyers can pay with any token. Their payment will be swapped to {SUPPORTED_TOKENS.find(t => t.address === sellerToken)?.symbol || 'your selected token'} (if you settle this auction, else you will receive USDC).
                            </p>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label
                                htmlFor="end-datetime"
                                className="text-[11px] font-orbitron uppercase tracking-[0.16em] text-[rgb(186,255,188)]/70"
                            >
                                End Date & Time
                            </label>
                            <input
                                id="end-datetime"
                                type="datetime-local"
                                value={endDateTime}
                                onChange={(event) => {
                                    setEndDateTime(event.target.value);
                                    setDurationError(null);
                                }}
                                min={dateToLocalDateTimeString(new Date())}
                                className={`w-full rounded-xl border px-4 py-2.5 text-sm font-orbitron uppercase tracking-widest text-white outline-none transition focus:ring-2 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-70 [&::-webkit-calendar-picker-indicator]:hover:opacity-100 ${
                                    durationError 
                                        ? "border-red-500 bg-black/60 focus:border-red-500 focus:ring-red-500/35" 
                                        : "border-white/12 bg-black/60 focus:border-[rgb(50,255,52)] focus:ring-[rgb(50,255,52)]/35"
                                }`}
                            />
                            {durationError ? (
                                <p className="text-xs text-red-400">
                                    {durationError}
                                </p>
                            ) : (
                                <p className="text-xs text-[rgb(186,255,188)]/70">
                                    Minimum duration is {DEFAULT_AUCTION_DURATION_MINUTES} minutes from now.
                                </p>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={handleListSelection}
                                disabled={!hasSelection || !startingPriceUSD || !collectionName.trim() || !address || !endDateTime || isSubmitting}
                                className={`inline-flex items-center justify-center rounded-full px-6 py-2 text-sm font-orbitron uppercase tracking-[0.18em] transition ${
                                    hasSelection && startingPriceUSD && collectionName.trim() && address && endDateTime && !isSubmitting
                                        ? "border border-[rgb(50,255,52)] bg-[rgb(50,255,52)]/10 text-[rgb(50,255,52)] hover:cursor-pointer hover:bg-[rgb(50,255,52)] hover:text-black"
                                        : "border border-white/12 text-[rgb(186,255,188)]/45"
                                }`}
                            >
                                {isSubmitting ? "Submitting..." : "List Selection"}
                            </button>
                            <button
                                type="button"
                                onClick={handleClearSelection}
                                disabled={!hasSelection}
                                className={`inline-flex items-center justify-center rounded-full border px-6 py-2 text-sm font-orbitron uppercase tracking-[0.18em] transition ${
                                    hasSelection
                                        ? "border-white text-white hover:cursor-pointer hover:border-[rgb(50,255,52)] hover:text-[rgb(50,255,52)]"
                                        : "border-white/20 text-white/30"
                                }`}
                            >
                                Clear Selection
                            </button>
                        </div>
                        {txnHash && (
                            <div className="rounded-xl border border-[rgb(50,255,52)]/40 bg-[rgb(50,255,52)]/10 px-4 py-3">
                                <p className="text-[11px] font-orbitron uppercase tracking-[0.16em] text-[rgb(186,255,188)]/70 mb-2">
                                    Transaction Submitted
                                </p>
                                <a
                                    href={explorer.transaction(txnHash)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-sm font-orbitron text-[rgb(50,255,52)] hover:underline break-all"
                                >
                                    {txnHash}
                                </a>
                            </div>
                        )}
                        <p className="text-xs text-[rgb(186,255,188)]/70">
                            Tip: You can list multiple NFTs together as a themed bundle. Buyers love cohesive collections with
                            complementary traits.
                        </p>
                    </div>
                </div>
            </section>
        );
    };

        return (
            <>
                {filteredNFTs.length === 0 && nfts.length > 0 && (
                    <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-center gap-4 px-4 py-12">
                        <p className="text-[rgb(186,255,188)]/70">No NFTs match your filters. Try adjusting your search criteria.</p>
                    </div>
                )}

                {filteredNFTs.length > 0 && (
                    <>
                        {renderBulkSelectButtons()}
                        {renderGrid()}

                        {hasSelection && renderSelectedSummary()}
                    </>
            )}

            {filteredNFTs.length > 0 && (
                <div className="flex justify-center mt-6">
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
                </div>
            )}
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
