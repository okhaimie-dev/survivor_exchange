import { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import MonsterCollectionCard from "./monster-collection-card";
import Pagination from "./pagination";

type Collection = {
    id: string;
    name: string;
    totalMonsters: number;
    startingPrice: number;
    highestBid?: number;
    rentPrice: number;
    image: string;
    description: string;
};

const collections: Collection[] = [
    {
        id: "#1127",
        name: "Abyssal Wraith Collective",
        totalMonsters: 12,
        startingPrice: 3.25,
        highestBid: 4.1,
        rentPrice: 0.65,
        image: "/logo.png",
        description: "A legion of spectral guardians bound to the abyss, coveted for their stealth and ethereal strikes.",
    },
    {
        id: "#0982",
        name: "Crystal Spire Sentinels",
        totalMonsters: 8,
        startingPrice: 1.9,
        rentPrice: 0.4,
        image: "/logo.png",
        description: "Shimmering constructs forged from crystal lattices, ideal for defensive lineups and high resilience.",
    },
    {
        id: "#0544",
        name: "Voidborne Choir",
        totalMonsters: 16,
        startingPrice: 5.75,
        highestBid: 6.4,
        rentPrice: 1.15,
        image: "/logo.png",
        description: "An ensemble of cosmic sirens whose harmonics destabilize opponents and fortify allied ranks.",
    },
    {
        id: "#0458",
        name: "Ironroot Vanguard",
        totalMonsters: 10,
        startingPrice: 2.4,
        highestBid: 2.9,
        rentPrice: 0.55,
        image: "/logo.png",
        description: "Ancient forest guardians specializing in crowd control and regenerative shielding.",
    },
    {
        id: "#0721",
        name: "Stormscale Phalanx",
        totalMonsters: 9,
        startingPrice: 2.8,
        highestBid: 3.05,
        rentPrice: 0.6,
        image: "/logo.png",
        description: "Electrified amphibious tacticians whose storms overwhelm adversaries in blitz assaults.",
    },
];

const formatEth = (value: number) => `${value.toFixed(2)} ETH`;

export default function Bids() {
    const pageSize = 3;
    const [selectedCollectionId, setSelectedCollectionId] = useState<string>(collections[0]?.id ?? "");
    const [bidAmount, setBidAmount] = useState<string>(() => {
        const firstCollection = collections[0];
        if (!firstCollection) {
            return "";
        }

        const firstMinimum = Math.max(firstCollection.startingPrice, firstCollection.highestBid ?? firstCollection.startingPrice);
        return firstMinimum.toFixed(2);
    });
    const [currentPage, setCurrentPage] = useState(1);

    const selectedCollection = useMemo(
        () => collections.find((collection) => collection.id === selectedCollectionId),
        [selectedCollectionId],
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
        return !Number.isNaN(numericBid) && numericBid >= minimumBid;
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

    const totalPages = useMemo(() => Math.max(1, Math.ceil(collections.length / pageSize)), [pageSize]);

    const visibleCollections = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return collections.slice(startIndex, startIndex + pageSize);
    }, [currentPage, pageSize]);

    const handlePageChange = useCallback(
        (page: number) => {
            const nextPage = Math.min(Math.max(page, 1), totalPages);
            if (nextPage === currentPage) {
                return;
            }

            setCurrentPage(nextPage);
            const firstOnPage = collections[(nextPage - 1) * pageSize];
            updateSelection(firstOnPage);
        },
        [currentPage, totalPages, updateSelection, pageSize],
    );

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4">
            <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-3">
                {visibleCollections.map((collection) => (
                    <div key={collection.id} className="flex h-full w-full">
                        <MonsterCollectionCard
                            collection={collection}
                            isSelected={collection.id === selectedCollectionId}
                            onSelect={() => handleSelectCollection(collection)}
                        />
                    </div>
                ))}
            </div>

            {selectedCollection && (
                <section className="mx-auto w-full max-w-6xl overflow-hidden rounded-2xl border border-[rgb(50,255,52)]/20 bg-black/55 shadow-[0_16px_40px_rgba(5,20,5,0.35)]">
                    <div className="grid gap-8 p-6 md:grid-cols-[minmax(0,0.4fr)_minmax(0,0.6fr)] md:items-start">
                        <div className="flex flex-col items-center gap-4 text-center md:items-start md:text-left">
                            <div className="flex h-28 w-28 items-center justify-center rounded-2xl border border-[rgb(50,255,52)]/35 bg-[rgb(50,255,52)]/10">
                                <Image
                                    src={selectedCollection.image}
                                    alt={selectedCollection.name}
                                    width={112}
                                    height={112}
                                    draggable={false}
                                    className="h-16 w-16 object-contain"
                                />
                            </div>
                            <span className="text-[11px] font-orbitron uppercase tracking-[0.16em] text-[rgb(186,255,188)]/70">
                                {selectedCollection.id}
                            </span>
                            <h2 className="text-2xl font-orbitron uppercase tracking-[0.12em] text-white">
                                {selectedCollection.name}
                            </h2>
                            <p className="text-xs leading-relaxed text-[rgb(186,255,188)]/70">
                                {selectedCollection.totalMonsters} monsters • {selectedCollection.description}
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
                                        Rent / Day
                                    </p>
                                    <p className="font-orbitron text-lg tracking-[0.12em]">
                                        {formatEth(selectedCollection.rentPrice)}
                                    </p>
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_185px] sm:items-end">
                                <div className="flex flex-col gap-3 w-full">
                                    <label
                                        htmlFor="bid-amount"
                                        className="text-[11px] font-orbitron uppercase tracking-[0.14em] text-[rgb(186,255,188)]/70"
                                    >
                                        Place Your Bid
                                    </label>
                                    <input
                                        id="bid-amount"
                                        type="number"
                                        min={minimumBid}
                                        step="0.01"
                                        value={bidAmount}
                                        onChange={(event) => setBidAmount(event.target.value)}
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
                                        <button
                                            type="button"
                                            className="inline-flex items-center justify-center rounded-full border border-[rgb(50,255,52)] px-6 py-2 text-sm font-orbitron uppercase tracking-[0.18em] text-[rgb(50,255,52)] transition hover:cursor-pointer hover:bg-[rgb(50,255,52)] hover:text-black"
                                        >
                                            Rent for {formatEth(selectedCollection.rentPrice)}
                                        </button>
                                    </div>
                                </div>
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