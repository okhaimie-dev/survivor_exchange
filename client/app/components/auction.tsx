import { useCallback, useMemo, useState } from "react";
import MonsterCard from "./monster-card";
import Pagination from "./pagination";
import { FormattedNFT } from "../lib/graphql";

interface AuctionProps {
    nfts: FormattedNFT[];
    loading: boolean;
    error: Error | null;
}

export default function Auction({ nfts, loading, error }: AuctionProps) {
    const pageSize = 3;
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedNFTIds, setSelectedNFTIds] = useState<string[]>([]);
    const [collectionName, setCollectionName] = useState<string>("");
    const [startingPrice, setStartingPrice] = useState<string>("");

    const toggleCardSelection = useCallback((nftId: string) => {
        setSelectedNFTIds((previouslySelected) => {
            if (previouslySelected.includes(nftId)) {
                return previouslySelected.filter((existingId) => existingId !== nftId);
            }

            return [...previouslySelected, nftId];
        });
    }, []);

    const totalPages = useMemo(() => Math.max(1, Math.ceil(nfts.length / pageSize)), [nfts.length, pageSize]);

    const visibleNFTs = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return nfts.slice(startIndex, startIndex + pageSize);
    }, [currentPage, pageSize, nfts]);

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

    if (loading) {
        return (
            <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-center gap-4 px-4 py-12">
                <p className="text-[rgb(186,255,188)]/70">Loading your NFTs...</p>
            </div>
        );
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

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4">
            <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-3">
                {visibleNFTs.map((nft) => (
                    <div key={nft.tokenId} className="flex h-full w-full">
                        <MonsterCard
                            nft={nft}
                            selected={selectedNFTIds.includes(nft.tokenId)}
                            onToggle={() => toggleCardSelection(nft.tokenId)}
                        />
                    </div>
                ))}
            </div>

            <section className="mx-auto w-full max-w-6xl overflow-hidden rounded-2xl border border-[rgb(50,255,52)]/20 bg-black/55 shadow-[0_16px_40px_rgba(5,20,5,0.35)]">
                <div className="grid gap-8 p-6 md:grid-cols-[minmax(0,0.4fr)_minmax(0,0.6fr)] md:items-start">
                    <div className="flex flex-col gap-4">
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
                                    {selectedNFTs.map((nft) => (
                                        <li
                                            key={nft.tokenId}
                                            className="rounded-full border border-[rgb(50,255,52)]/40 px-3 py-1 text-[10px] font-orbitron uppercase tracking-[0.14em] text-[rgb(186,255,188)]"
                                        >
                                            {nft.metadataName}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-xs text-[rgb(186,255,188)]/60">
                                    Select NFTs from the grid to assemble a collection for auction.
                                </p>
                            )}
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
                                htmlFor="starting-price"
                                className="text-[11px] font-orbitron uppercase tracking-[0.16em] text-[rgb(186,255,188)]/70"
                            >
                                Starting Price (ETH)
                            </label>
                            <input
                                id="starting-price"
                                type="number"
                                min="0"
                                step="0.01"
                                value={startingPrice}
                                onChange={(event) => setStartingPrice(event.target.value)}
                                placeholder="0.00"
                                className="w-full rounded-xl border border-white/12 bg-black/60 px-4 py-2.5 text-sm font-orbitron uppercase tracking-widest text-white outline-none transition focus:border-[rgb(50,255,52)] focus:ring-2 focus:ring-[rgb(50,255,52)]/35 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            />
                            <p className="text-xs text-[rgb(186,255,188)]/70">
                                Choose a price that reflects rarity and combined power. You currently have{" "}
                                <span className="font-orbitron tracking-[0.18em] text-white">
                                    {selectedNFTs.length} {selectedNFTs.length === 1 ? "NFT" : "NFTs"}
                                </span>{" "}
                                selected.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                disabled={!hasSelection || !startingPrice || !collectionName.trim()}
                                className={`inline-flex items-center justify-center rounded-full px-6 py-2 text-sm font-orbitron uppercase tracking-[0.18em] transition ${
                                    hasSelection && startingPrice && collectionName.trim()
                                        ? "border border-[rgb(50,255,52)] bg-[rgb(50,255,52)]/10 text-[rgb(50,255,52)] hover:cursor-pointer hover:bg-[rgb(50,255,52)] hover:text-black"
                                        : "border border-white/12 text-[rgb(186,255,188)]/45"
                                }`}
                            >
                                List Selection
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
                        <p className="text-xs text-[rgb(186,255,188)]/70">
                            Tip: You can list multiple NFTs together as a themed bundle. Buyers love cohesive collections with
                            complementary traits.
                        </p>
                    </div>
                </div>
            </section>

            <div className="flex justify-center">
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
            </div>
        </div>
    );
}
