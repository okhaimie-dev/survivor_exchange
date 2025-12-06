import { useState, useCallback, useEffect } from "react";
import { BEAST_OPTIONS, TYPE_OPTIONS } from "../lib/constants/filters";

export interface FilterState {
    id: string;
    search: string;
    beast: string;
    type: string;
    tier: string;
    levelMin: string;
    levelMax: string;
    powerMin: string;
    powerMax: string;
    rankMin: string;
    rankMax: string;
    shiny: string;
    animated: string;
    priceSort: string;
    tokenIdSort: string;
}

interface FiltersProps {
    token?: string | null;
    filters: FilterState;
    onFiltersChange: (filters: FilterState) => void;
}

export default function Filters({ token, filters, onFiltersChange }: FiltersProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const updateFilter = useCallback((key: keyof FilterState, value: string) => {
        onFiltersChange({ ...filters, [key]: value });
    }, [filters, onFiltersChange]);

    const clearFilters = useCallback(() => {
        onFiltersChange({
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
    }, [onFiltersChange]);

    const hasActiveFilters = Object.values(filters).some(value => value !== "");

    useEffect(() => {
        if (token) {
            onFiltersChange({...filters, id: token });
        }
    }, [token]);

    return (
        <div className="w-full">
            <div className="mb-4">
                <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => updateFilter("search", e.target.value)}
                    placeholder="Search by name, token ID, or attributes..."
                    className="w-full rounded-xl border border-white/12 bg-black/60 px-4 py-2.5 text-sm font-orbitron uppercase tracking-[0.14em] text-white outline-none transition focus:border-[rgb(50,255,52)] focus:ring-2 focus:ring-[rgb(50,255,52)]/35 placeholder:text-[rgb(186,255,188)]/40"
                />
            </div>

            <div className="mb-4 flex items-center justify-between">
                <button
                    type="button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="inline-flex items-center justify-center rounded-full border border-[rgb(50,255,52)]/40 bg-[rgb(50,255,52)]/10 px-4 py-2 text-sm font-orbitron uppercase tracking-[0.14em] text-[rgb(50,255,52)] transition hover:bg-[rgb(50,255,52)]/20"
                >
                    {isExpanded ? "Hide Filters" : "Show Filters"}
                    {hasActiveFilters && (
                        <span className="ml-2 rounded-full bg-[rgb(50,255,52)] px-2 py-0.5 text-xs text-black">
                            Active
                        </span>
                    )}
                </button>
                {hasActiveFilters && (
                    <button
                        type="button"
                        onClick={clearFilters}
                        className="text-xs font-orbitron uppercase tracking-[0.14em] text-[rgb(186,255,188)]/70 hover:text-[rgb(50,255,52)] transition"
                    >
                        Clear All
                    </button>
                )}
            </div>

            {isExpanded && (
                <div className="rounded-2xl border border-[rgb(50,255,52)]/20 bg-black/55 p-6 shadow-[0_16px_40px_rgba(5,20,5,0.35)]">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <div className="flex flex-col gap-2">
                            <label className="text-[11px] font-orbitron uppercase tracking-[0.16em] text-[rgb(186,255,188)]/70">
                                Beast
                            </label>
                            <select
                                value={filters.beast}
                                onChange={(e) => updateFilter("beast", e.target.value)}
                                className="rounded-xl border border-white/12 bg-black/60 px-4 py-2.5 text-sm font-orbitron uppercase tracking-[0.14em] text-white outline-none transition focus:border-[rgb(50,255,52)] focus:ring-2 focus:ring-[rgb(50,255,52)]/35"
                            >
                                <option value="">All Beasts</option>
                                {BEAST_OPTIONS.map((beast) => (
                                    <option key={beast} value={beast}>
                                        {beast}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[11px] font-orbitron uppercase tracking-[0.16em] text-[rgb(186,255,188)]/70">
                                Type
                            </label>
                            <select
                                value={filters.type}
                                onChange={(e) => updateFilter("type", e.target.value)}
                                className="rounded-xl border border-white/12 bg-black/60 px-4 py-2.5 text-sm font-orbitron uppercase tracking-[0.14em] text-white outline-none transition focus:border-[rgb(50,255,52)] focus:ring-2 focus:ring-[rgb(50,255,52)]/35"
                            >
                                <option value="">All Types</option>
                                {TYPE_OPTIONS.map((type) => (
                                    <option key={type} value={type}>
                                        {type}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[11px] font-orbitron uppercase tracking-[0.16em] text-[rgb(186,255,188)]/70">
                                Tier
                            </label>
                            <select
                                value={filters.tier}
                                onChange={(e) => updateFilter("tier", e.target.value)}
                                className="rounded-xl border border-white/12 bg-black/60 px-4 py-2.5 text-sm font-orbitron uppercase tracking-[0.14em] text-white outline-none transition focus:border-[rgb(50,255,52)] focus:ring-2 focus:ring-[rgb(50,255,52)]/35"
                            >
                                <option value="">All Tiers</option>
                                {[1, 2, 3, 4, 5].map((tier) => (
                                    <option key={tier} value={tier.toString()}>
                                        Tier {tier}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[11px] font-orbitron uppercase tracking-[0.16em] text-[rgb(186,255,188)]/70">
                                Level Range
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    min="1"
                                    max="140"
                                    value={filters.levelMin}
                                    onChange={(e) => updateFilter("levelMin", e.target.value)}
                                    placeholder="Min"
                                    className="flex-1 rounded-xl border border-white/12 bg-black/60 px-3 py-2 text-sm font-orbitron uppercase tracking-widest text-white outline-none transition focus:border-[rgb(50,255,52)] focus:ring-2 focus:ring-[rgb(50,255,52)]/35 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                />
                                <input
                                    type="number"
                                    min="1"
                                    max="140"
                                    value={filters.levelMax}
                                    onChange={(e) => updateFilter("levelMax", e.target.value)}
                                    placeholder="Max"
                                    className="flex-1 rounded-xl border border-white/12 bg-black/60 px-3 py-2 text-sm font-orbitron uppercase tracking-widest text-white outline-none transition focus:border-[rgb(50,255,52)] focus:ring-2 focus:ring-[rgb(50,255,52)]/35 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[11px] font-orbitron uppercase tracking-[0.16em] text-[rgb(186,255,188)]/70">
                                Power Range
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    min="1"
                                    max="550"
                                    step="0.1"
                                    value={filters.powerMin}
                                    onChange={(e) => updateFilter("powerMin", e.target.value)}
                                    placeholder="Min"
                                    className="flex-1 rounded-xl border border-white/12 bg-black/60 px-3 py-2 text-sm font-orbitron uppercase tracking-widest text-white outline-none transition focus:border-[rgb(50,255,52)] focus:ring-2 focus:ring-[rgb(50,255,52)]/35 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                />
                                <input
                                    type="number"
                                    min="1"
                                    max="550"
                                    step="0.1"
                                    value={filters.powerMax}
                                    onChange={(e) => updateFilter("powerMax", e.target.value)}
                                    placeholder="Max"
                                    className="flex-1 rounded-xl border border-white/12 bg-black/60 px-3 py-2 text-sm font-orbitron uppercase tracking-widest text-white outline-none transition focus:border-[rgb(50,255,52)] focus:ring-2 focus:ring-[rgb(50,255,52)]/35 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[11px] font-orbitron uppercase tracking-[0.16em] text-[rgb(186,255,188)]/70">
                                Rank Range
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    min="1"
                                    max="1165"
                                    value={filters.rankMin}
                                    onChange={(e) => updateFilter("rankMin", e.target.value)}
                                    placeholder="Min"
                                    className="flex-1 rounded-xl border border-white/12 bg-black/60 px-3 py-2 text-sm font-orbitron uppercase tracking-widest text-white outline-none transition focus:border-[rgb(50,255,52)] focus:ring-2 focus:ring-[rgb(50,255,52)]/35 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                />
                                <input
                                    type="number"
                                    min="1"
                                    max="1165"
                                    value={filters.rankMax}
                                    onChange={(e) => updateFilter("rankMax", e.target.value)}
                                    placeholder="Max"
                                    className="flex-1 rounded-xl border border-white/12 bg-black/60 px-3 py-2 text-sm font-orbitron uppercase tracking-widest text-white outline-none transition focus:border-[rgb(50,255,52)] focus:ring-2 focus:ring-[rgb(50,255,52)]/35 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[11px] font-orbitron uppercase tracking-[0.16em] text-[rgb(186,255,188)]/70">
                                Shiny
                            </label>
                            <select
                                value={filters.shiny}
                                onChange={(e) => updateFilter("shiny", e.target.value)}
                                className="rounded-xl border border-white/12 bg-black/60 px-4 py-2.5 text-sm font-orbitron uppercase tracking-[0.14em] text-white outline-none transition focus:border-[rgb(50,255,52)] focus:ring-2 focus:ring-[rgb(50,255,52)]/35"
                            >
                                <option value="">All</option>
                                <option value="true">True</option>
                                <option value="false">False</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[11px] font-orbitron uppercase tracking-[0.16em] text-[rgb(186,255,188)]/70">
                                Animated
                            </label>
                            <select
                                value={filters.animated}
                                onChange={(e) => updateFilter("animated", e.target.value)}
                                className="rounded-xl border border-white/12 bg-black/60 px-4 py-2.5 text-sm font-orbitron uppercase tracking-[0.14em] text-white outline-none transition focus:border-[rgb(50,255,52)] focus:ring-2 focus:ring-[rgb(50,255,52)]/35"
                            >
                                <option value="">All</option>
                                <option value="true">True</option>
                                <option value="false">False</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[11px] font-orbitron uppercase tracking-[0.16em] text-[rgb(186,255,188)]/70">
                                Sort by Price
                            </label>
                            <select
                                value={filters.priceSort}
                                onChange={(e) => updateFilter("priceSort", e.target.value)}
                                className="rounded-xl border border-white/12 bg-black/60 px-4 py-2.5 text-sm font-orbitron uppercase tracking-[0.14em] text-white outline-none transition focus:border-[rgb(50,255,52)] focus:ring-2 focus:ring-[rgb(50,255,52)]/35"
                            >
                                <option value="">None</option>
                                <option value="low-high">Low to High</option>
                                <option value="high-low">High to Low</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[11px] font-orbitron uppercase tracking-[0.16em] text-[rgb(186,255,188)]/70">
                                Sort by Token ID
                            </label>
                            <select
                                value={filters.tokenIdSort}
                                onChange={(e) => updateFilter("tokenIdSort", e.target.value)}
                                className="rounded-xl border border-white/12 bg-black/60 px-4 py-2.5 text-sm font-orbitron uppercase tracking-[0.14em] text-white outline-none transition focus:border-[rgb(50,255,52)] focus:ring-2 focus:ring-[rgb(50,255,52)]/35"
                            >
                                <option value="">None</option>
                                <option value="low-high">Low to High</option>
                                <option value="high-low">High to Low</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

