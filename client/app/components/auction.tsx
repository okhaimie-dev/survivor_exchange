import { useCallback, useMemo, useState } from "react";
import MonsterCard, { type Monster } from "./monster-card";
import Pagination from "./pagination";

const monsters: Monster[] = [
    {
        id: "#M-1207",
        name: "Abyssal Ravager",
        epithet: "Voidborne Vanguard",
        affinity: "Shadow",
        role: "Assault",
        level: 52,
        power: 4.6,
        image: "/logo.png",
    },
    {
        id: "#M-1042",
        name: "Stormscale Siren",
        epithet: "Tidal Enchanter",
        affinity: "Water",
        role: "Controller",
        level: 47,
        power: 3.8,
        image: "/logo.png",
    },
    {
        id: "#M-0981",
        name: "Solaris Warden",
        epithet: "Radiant Bulwark",
        affinity: "Light",
        role: "Guardian",
        level: 55,
        power: 5.1,
        image: "/logo.png",
    },
    {
        id: "#M-0876",
        name: "Ironroot Stalker",
        epithet: "Grove Sentinel",
        affinity: "Earth",
        role: "Skirmisher",
        level: 43,
        power: 3.2,
        image: "/logo.png",
    },
    {
        id: "#M-1310",
        name: "Emberwing Talon",
        epithet: "Blaze Harrier",
        affinity: "Fire",
        role: "Assault",
        level: 49,
        power: 4.1,
        image: "/logo.png",
    },
    {
        id: "#M-0764",
        name: "Frostvein Oracle",
        epithet: "Crystal Seer",
        affinity: "Ice",
        role: "Support",
        level: 45,
        power: 3.5,
        image: "/logo.png",
    },
];

export default function Auction() {
    const pageSize = 3;
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedMonsterIds, setSelectedMonsterIds] = useState<string[]>([]);
    const [collectionName, setCollectionName] = useState<string>("");
    const [startingPrice, setStartingPrice] = useState<string>("");

    const toggleCardSelection = useCallback((monsterId: string) => {
        setSelectedMonsterIds((previouslySelected) => {
            if (previouslySelected.includes(monsterId)) {
                return previouslySelected.filter((existingId) => existingId !== monsterId);
            }

            return [...previouslySelected, monsterId];
        });
    }, []);

    const totalPages = useMemo(() => Math.max(1, Math.ceil(monsters.length / pageSize)), [pageSize]);

    const visibleMonsters = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return monsters.slice(startIndex, startIndex + pageSize);
    }, [currentPage, pageSize]);

    const selectedMonsters = useMemo(
        () => monsters.filter((monster) => selectedMonsterIds.includes(monster.id)),
        [selectedMonsterIds],
    );

    const hasSelection = selectedMonsters.length > 0;

    const averageLevel = useMemo(() => {
        if (!hasSelection) {
            return null;
        }

        const totalLevels = selectedMonsters.reduce((sum, monster) => sum + monster.level, 0);
        return Math.round(totalLevels / selectedMonsters.length);
    }, [hasSelection, selectedMonsters]);

    const totalPower = useMemo(() => {
        if (!hasSelection) {
            return null;
        }

        return selectedMonsters.reduce((sum, monster) => sum + monster.power, 0).toFixed(1);
    }, [hasSelection, selectedMonsters]);

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
        setSelectedMonsterIds([]);
    }, []);

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4">
            <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-3">
                {visibleMonsters.map((monster) => (
                    <div key={monster.id} className="flex h-full w-full">
                        <MonsterCard
                            monster={monster}
                            selected={selectedMonsterIds.includes(monster.id)}
                            onToggle={() => toggleCardSelection(monster.id)}
                        />
                    </div>
                ))}
            </div>

            <section className="mx-auto w-full max-w-6xl overflow-hidden rounded-2xl border border-[rgb(50,255,52)]/20 bg-black/55 shadow-[0_16px_40px_rgba(5,20,5,0.35)]">
                <div className="grid gap-8 p-6 md:grid-cols-[minmax(0,0.4fr)_minmax(0,0.6fr)] md:items-start">
                    <div className="flex flex-col gap-4">
                        <div>
                            <p className="text-[11px] font-orbitron uppercase tracking-[0.16em] text-[rgb(186,255,188)]/70">
                                Selected Monsters
                            </p>
                            <p className="text-3xl font-orbitron uppercase tracking-[0.18em] text-white">
                                {selectedMonsters.length.toString().padStart(2, "0")}
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
                                    {totalPower ? `${totalPower}k` : "—"}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <p className="text-[11px] font-orbitron uppercase tracking-[0.16em] text-[rgb(186,255,188)]/70">
                                Roster Preview
                            </p>
                            {hasSelection ? (
                                <ul className="flex flex-wrap gap-2">
                                    {selectedMonsters.map((monster) => (
                                        <li
                                            key={monster.id}
                                            className="rounded-full border border-[rgb(50,255,52)]/40 px-3 py-1 text-[10px] font-orbitron uppercase tracking-[0.14em] text-[rgb(186,255,188)]"
                                        >
                                            {monster.name}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-xs text-[rgb(186,255,188)]/60">
                                    Select monsters from the grid to assemble a collection for auction.
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
                                    {selectedMonsters.length} {selectedMonsters.length === 1 ? "monster" : "monsters"}
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
                            Tip: You can list multiple monsters together as a themed bundle. Buyers love cohesive teams with
                            complementary roles.
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
