import { useState, useCallback, useEffect } from "react";
import { BEAST_OPTIONS, TYPE_OPTIONS } from "../lib/constants/filters";
import CustomDropdown from "./custom-dropdown";

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
    summitTop15: string;
}

interface FiltersProps {
    token?: string | null;
    filters: FilterState;
    onFiltersChange: (filters: FilterState) => void;
    summitListedCount?: number;
}

export default function Filters({ token, filters, onFiltersChange, summitListedCount = 0 }: FiltersProps) {
    // Default to expanded on desktop (md breakpoint = 768px)
    const [isExpanded, setIsExpanded] = useState(false);

    // Expand by default on desktop
    useEffect(() => {
        const mediaQuery = window.matchMedia("(min-width: 768px)");
        setIsExpanded(mediaQuery.matches);

        const handler = (e: MediaQueryListEvent) => setIsExpanded(e.matches);
        mediaQuery.addEventListener("change", handler);
        return () => mediaQuery.removeEventListener("change", handler);
    }, []);

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
            summitTop15: "",
        });
    }, [onFiltersChange]);

    const hasActiveFilters = Object.values(filters).some(value => value !== "");
    const activeFilterCount = Object.values(filters).filter(value => value !== "").length;

    useEffect(() => {
        if (token) {
            onFiltersChange({...filters, id: token });
        }
    }, [token]);

    return (
        <div className="w-full overflow-hidden">
            <div className="mb-4 flex flex-col gap-3">
                <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => updateFilter("search", e.target.value)}
                    placeholder="Search by name, token ID, or attributes..."
                    className="w-full rounded-xl border border-white/12 bg-black/60 px-4 py-2.5 text-sm font-orbitron uppercase tracking-[0.14em] text-white outline-none transition focus:border-[rgb(50,255,52)] focus:ring-2 focus:ring-[rgb(50,255,52)]/35 placeholder:text-[rgb(186,255,188)]/40"
                />
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    {/* Summit filter button - hidden if API fails (summitListedCount = 0) */}
                    {summitListedCount > 0 && (
                        <button
                            type="button"
                            onClick={() => {
                                if (filters.summitTop15) {
                                    onFiltersChange({ ...filters, summitTop15: "" });
                                } else {
                                    onFiltersChange({ ...filters, summitTop15: "true" });
                                }
                            }}
                            className={`inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-orbitron uppercase tracking-[0.12em] transition whitespace-nowrap ${
                                filters.summitTop15
                                    ? "border border-[rgb(255,215,0)] bg-[rgb(255,215,0)]/20 text-[rgb(255,215,0)]"
                                    : "border border-[rgb(255,215,0)]/40 bg-[rgb(255,215,0)]/10 text-[rgb(255,215,0)]/80 hover:bg-[rgb(255,215,0)]/20 hover:text-[rgb(255,215,0)]"
                            }`}
                            title="Show auctions containing Summit Top 15 beasts"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5M19 19C19 19.6 18.6 20 18 20H6C5.4 20 5 19.6 5 19V18H19V19Z" />
                            </svg>
                            <span>Summit</span>
                            <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                                filters.summitTop15
                                    ? "bg-[rgb(255,215,0)] text-black"
                                    : "bg-[rgb(255,215,0)]/30 text-[rgb(255,215,0)]"
                            }`}>
                                {summitListedCount}
                            </span>
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="inline-flex items-center justify-center rounded-full border border-[rgb(50,255,52)]/40 bg-[rgb(50,255,52)]/10 px-4 py-2.5 text-sm font-orbitron uppercase tracking-[0.14em] text-[rgb(50,255,52)] transition hover:bg-[rgb(50,255,52)]/20 whitespace-nowrap"
                    >
                        {isExpanded ? "Hide Filters" : "Show Filters"}
                        {hasActiveFilters && (
                            <span className="ml-2 rounded-full bg-[rgb(50,255,52)] min-w-[20px] px-1.5 py-0.5 text-xs text-black font-bold">
                                {activeFilterCount}
                            </span>
                        )}
                    </button>
                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="text-xs font-orbitron uppercase tracking-[0.14em] text-[rgb(186,255,188)]/70 hover:text-[rgb(50,255,52)] transition whitespace-nowrap"
                        >
                            Clear All
                        </button>
                    )}
                </div>
            </div>

            {isExpanded && (
                <div className="rounded-2xl border border-[rgb(50,255,52)]/20 bg-black/55 p-6 shadow-[0_16px_40px_rgba(5,20,5,0.35)]">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <div className="flex flex-col gap-2">
                            <label className="text-[11px] font-orbitron uppercase tracking-[0.16em] text-[rgb(186,255,188)]/70">
                                Beast
                            </label>
                            <CustomDropdown
                                id="filter-beast"
                                value={filters.beast}
                                onChange={(value) => updateFilter("beast", value)}
                                options={[
                                    { value: "", label: "All Beasts" },
                                    ...BEAST_OPTIONS.map((beast) => ({
                                        value: beast,
                                        label: beast,
                                    })),
                                ]}
                                variant="default"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[11px] font-orbitron uppercase tracking-[0.16em] text-[rgb(186,255,188)]/70">
                                Type
                            </label>
                            <CustomDropdown
                                id="filter-type"
                                value={filters.type}
                                onChange={(value) => updateFilter("type", value)}
                                options={[
                                    { value: "", label: "All Types" },
                                    ...TYPE_OPTIONS.map((type) => ({
                                        value: type,
                                        label: type,
                                    })),
                                ]}
                                variant="default"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[11px] font-orbitron uppercase tracking-[0.16em] text-[rgb(186,255,188)]/70">
                                Tier
                            </label>
                            <CustomDropdown
                                id="filter-tier"
                                value={filters.tier}
                                onChange={(value) => updateFilter("tier", value)}
                                options={[
                                    { value: "", label: "All Tiers" },
                                    ...[1, 2, 3, 4, 5].map((tier) => ({
                                        value: tier.toString(),
                                        label: `Tier ${tier}`,
                                    })),
                                ]}
                                variant="default"
                            />
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
                                    className="flex-1 rounded-xl border border-[rgb(50,255,52)]/40 bg-black/60 px-3 py-2 text-sm font-orbitron uppercase tracking-widest text-white outline-none transition focus:border-[rgb(50,255,52)] focus:ring-2 focus:ring-[rgb(50,255,52)]/35 hover:border-[rgb(50,255,52)]/60 placeholder:text-[rgb(186,255,188)]/40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                />
                                <input
                                    type="number"
                                    min="1"
                                    max="140"
                                    value={filters.levelMax}
                                    onChange={(e) => updateFilter("levelMax", e.target.value)}
                                    placeholder="Max"
                                    className="flex-1 rounded-xl border border-[rgb(50,255,52)]/40 bg-black/60 px-3 py-2 text-sm font-orbitron uppercase tracking-widest text-white outline-none transition focus:border-[rgb(50,255,52)] focus:ring-2 focus:ring-[rgb(50,255,52)]/35 hover:border-[rgb(50,255,52)]/60 placeholder:text-[rgb(186,255,188)]/40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
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
                                    className="flex-1 rounded-xl border border-[rgb(50,255,52)]/40 bg-black/60 px-3 py-2 text-sm font-orbitron uppercase tracking-widest text-white outline-none transition focus:border-[rgb(50,255,52)] focus:ring-2 focus:ring-[rgb(50,255,52)]/35 hover:border-[rgb(50,255,52)]/60 placeholder:text-[rgb(186,255,188)]/40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                />
                                <input
                                    type="number"
                                    min="1"
                                    max="550"
                                    step="0.1"
                                    value={filters.powerMax}
                                    onChange={(e) => updateFilter("powerMax", e.target.value)}
                                    placeholder="Max"
                                    className="flex-1 rounded-xl border border-[rgb(50,255,52)]/40 bg-black/60 px-3 py-2 text-sm font-orbitron uppercase tracking-widest text-white outline-none transition focus:border-[rgb(50,255,52)] focus:ring-2 focus:ring-[rgb(50,255,52)]/35 hover:border-[rgb(50,255,52)]/60 placeholder:text-[rgb(186,255,188)]/40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
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
                                    className="flex-1 rounded-xl border border-[rgb(50,255,52)]/40 bg-black/60 px-3 py-2 text-sm font-orbitron uppercase tracking-widest text-white outline-none transition focus:border-[rgb(50,255,52)] focus:ring-2 focus:ring-[rgb(50,255,52)]/35 hover:border-[rgb(50,255,52)]/60 placeholder:text-[rgb(186,255,188)]/40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                />
                                <input
                                    type="number"
                                    min="1"
                                    max="1165"
                                    value={filters.rankMax}
                                    onChange={(e) => updateFilter("rankMax", e.target.value)}
                                    placeholder="Max"
                                    className="flex-1 rounded-xl border border-[rgb(50,255,52)]/40 bg-black/60 px-3 py-2 text-sm font-orbitron uppercase tracking-widest text-white outline-none transition focus:border-[rgb(50,255,52)] focus:ring-2 focus:ring-[rgb(50,255,52)]/35 hover:border-[rgb(50,255,52)]/60 placeholder:text-[rgb(186,255,188)]/40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[11px] font-orbitron uppercase tracking-[0.16em] text-[rgb(186,255,188)]/70">
                                Shiny
                            </label>
                            <CustomDropdown
                                id="filter-shiny"
                                value={filters.shiny}
                                onChange={(value) => updateFilter("shiny", value)}
                                options={[
                                    { value: "", label: "All" },
                                    { value: "true", label: "True" },
                                    { value: "false", label: "False" },
                                ]}
                                variant="default"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[11px] font-orbitron uppercase tracking-[0.16em] text-[rgb(186,255,188)]/70">
                                Animated
                            </label>
                            <CustomDropdown
                                id="filter-animated"
                                value={filters.animated}
                                onChange={(value) => updateFilter("animated", value)}
                                options={[
                                    { value: "", label: "All" },
                                    { value: "true", label: "True" },
                                    { value: "false", label: "False" },
                                ]}
                                variant="default"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[11px] font-orbitron uppercase tracking-[0.16em] text-[rgb(186,255,188)]/70">
                                Sort by Price
                            </label>
                            <CustomDropdown
                                id="filter-price-sort"
                                value={filters.priceSort}
                                onChange={(value) => updateFilter("priceSort", value)}
                                options={[
                                    { value: "", label: "None" },
                                    { value: "low-high", label: "Low to High" },
                                    { value: "high-low", label: "High to Low" },
                                ]}
                                variant="default"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[11px] font-orbitron uppercase tracking-[0.16em] text-[rgb(186,255,188)]/70">
                                Sort by Token ID
                            </label>
                            <CustomDropdown
                                id="filter-token-id-sort"
                                value={filters.tokenIdSort}
                                onChange={(value) => updateFilter("tokenIdSort", value)}
                                options={[
                                    { value: "", label: "None" },
                                    { value: "low-high", label: "Low to High" },
                                    { value: "high-low", label: "High to Low" },
                                ]}
                                variant="default"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

