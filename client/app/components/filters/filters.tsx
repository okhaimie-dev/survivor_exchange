import { useState, useCallback, useEffect } from "react";
import { BEAST_OPTIONS, TYPE_OPTIONS } from "../../lib/constants/filters";
import { CollectionType } from "../../lib/constants";
import type { AdventurerStatBounds } from "../../lib/filter-utils";
import { CustomDropdown, InfoTooltip } from "../ui";

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
    levelSort: string;
    scoreSort: string;
    tierSort: string;
    powerSort: string;
    summitTop15: string;
    timeSort: string;
    // Adventurer stats (min/max)
    healthMin: string;
    healthMax: string;
    strengthMin: string;
    strengthMax: string;
    dexterityMin: string;
    dexterityMax: string;
    vitalityMin: string;
    vitalityMax: string;
    intelligenceMin: string;
    intelligenceMax: string;
    wisdomMin: string;
    wisdomMax: string;
    charismaMin: string;
    charismaMax: string;
    /** Adventurer: "" = all, "in" = in battle only, "out" = not in battle */
    battleFilter: string;
}

interface FiltersProps {
    token?: string | null;
    filters: FilterState;
    /** Called with partial updates (single key) or full state (e.g. clear). Parent should merge: setFilters(prev => ({ ...prev, ...updates })). */
    onFiltersChange: (filters: FilterState | Partial<FilterState>) => void;
    summitListedCount?: number;
    collection?: CollectionType;
    /** When true, expand state is controlled by parent; trigger button is not rendered (put it in sidebar). */
    isExpanded?: boolean;
    onToggleExpanded?: (value: boolean) => void;
    /** Min/max from displayed NFTs for adventurer sliders; when set, sliders use these instead of fixed defaults. */
    adventurerStatBounds?: AdventurerStatBounds | null;
    /** Compact layout for sidebar: single column, smaller padding and inputs, sliders below Filters button. */
    compact?: boolean;
}

const emptyAdventurerFilters = {
    healthMin: "", healthMax: "", strengthMin: "", strengthMax: "", dexterityMin: "", dexterityMax: "",
    vitalityMin: "", vitalityMax: "", intelligenceMin: "", intelligenceMax: "", wisdomMin: "", wisdomMax: "", charismaMin: "", charismaMax: "",
    battleFilter: "",
};

const DEFAULT_LEVEL_MAX = 100;
const DEFAULT_HEALTH_MAX = 100;
const DEFAULT_STAT_MAX = 30;

export default function Filters({ token, filters, onFiltersChange, summitListedCount = 0, collection = "beasts", isExpanded: controlledExpanded, onToggleExpanded, adventurerStatBounds, compact = false }: FiltersProps) {
    const isBeastsCollection = collection === "beasts";
    const [internalExpanded, setInternalExpanded] = useState(false);
    const isControlled = controlledExpanded !== undefined && onToggleExpanded !== undefined;
    const isExpanded = isControlled ? controlledExpanded : internalExpanded;
    const setIsExpanded = isControlled ? onToggleExpanded : setInternalExpanded;

    // Pass only the changed key so parent merges from its own state (avoids stale filters in Sell grid)
    const updateFilter = useCallback((key: keyof FilterState, value: string) => {
        onFiltersChange({ [key]: value });
    }, [onFiltersChange]);

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
            priceSort: "high-low",
            tokenIdSort: "",
            levelSort: "",
            scoreSort: "",
            tierSort: "",
            powerSort: "",
            summitTop15: "",
            timeSort: "",
            battleFilter: "",
            ...emptyAdventurerFilters,
        });
    }, [onFiltersChange]);

    const hasActiveFilters = Object.values(filters).some(value => value !== "");
    const activeFilterCount = Object.values(filters).filter(value => value !== "").length;
    const labelClass = compact ? "text-[10px] font-orbitron uppercase tracking-wider text-[rgb(186,255,188)]/70" : "text-[11px] font-orbitron uppercase tracking-[0.16em] text-[rgb(186,255,188)]/70";

    useEffect(() => {
        if (token) {
            onFiltersChange({ id: token });
        }
    }, [token, onFiltersChange]);

    return (
        <div className={compact ? "w-full overflow-hidden" : "w-full overflow-hidden"}>
            <div className={compact ? "flex flex-col gap-2" : "mb-4 flex flex-col gap-3"}>
                <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => updateFilter("search", e.target.value)}
                    placeholder={compact ? "Search..." : "Search by name, token ID, or attributes..."}
                    className={compact ? "w-full rounded-lg border border-white/12 bg-black/60 px-2.5 py-1.5 text-[11px] font-orbitron uppercase tracking-wider text-white outline-none transition focus:border-[rgb(50,255,52)] placeholder:text-[rgb(186,255,188)]/40" : "w-full rounded-xl border border-white/12 bg-black/60 px-4 py-2.5 text-sm font-orbitron uppercase tracking-[0.14em] text-white outline-none transition focus:border-[rgb(50,255,52)] focus:ring-2 focus:ring-[rgb(50,255,52)]/35 placeholder:text-[rgb(186,255,188)]/40"}
                />
                <div className={compact ? "flex flex-wrap items-center gap-1.5" : "flex flex-wrap items-center gap-2 sm:gap-3"}>
                    {/* Summit filter button - hidden if API fails (summitListedCount = 0) */}
                    {summitListedCount > 0 && (
                        <button
                            type="button"
                            onClick={() => {
                                if (filters.summitTop15) {
                                    onFiltersChange({ summitTop15: "" });
                                } else {
                                    onFiltersChange({ summitTop15: "true" });
                                }
                            }}
                            className={`inline-flex items-center justify-center gap-1 rounded-full px-2 py-1.5 text-[10px] font-orbitron uppercase tracking-[0.1em] transition whitespace-nowrap ${
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
                    {!isControlled && (
                        <button
                            type="button"
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="inline-flex items-center justify-center rounded-full border border-[rgb(50,255,52)]/40 bg-[rgb(50,255,52)]/10 px-3 py-1.5 text-xs font-orbitron uppercase tracking-[0.12em] text-[rgb(50,255,52)] transition hover:bg-[rgb(50,255,52)]/20 whitespace-nowrap"
                        >
                            {isExpanded ? "Hide" : "Filters"}
                            {hasActiveFilters && (
                                <span className="ml-1.5 rounded-full bg-[rgb(50,255,52)] min-w-[18px] px-1 py-0.5 text-[10px] text-black font-bold">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>
                    )}
                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={clearFilters}
                            className={compact ? "text-[10px] font-orbitron uppercase tracking-wider text-[rgb(186,255,188)]/70 hover:text-[rgb(50,255,52)] transition whitespace-nowrap" : "text-xs font-orbitron uppercase tracking-[0.14em] text-[rgb(186,255,188)]/70 hover:text-[rgb(50,255,52)] transition whitespace-nowrap"}
                        >
                            Clear All
                        </button>
                    )}
                </div>
            </div>

            {isExpanded && (
                <div className={compact ? "rounded-xl border border-[rgb(50,255,52)]/20 bg-black/55 p-3 shadow-[0_8px_24px_rgba(5,20,5,0.3)] max-h-[70vh] overflow-y-auto" : "rounded-2xl border border-[rgb(50,255,52)]/20 bg-black/55 p-6 shadow-[0_16px_40px_rgba(5,20,5,0.35)]"}>
                    <div className={compact ? "grid grid-cols-1 gap-2" : "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"}>
                        {/* Beast-specific filters */}
                        {isBeastsCollection && (
                            <>
                                <div className={compact ? "flex flex-col gap-1" : "flex flex-col gap-2"}>
                                    <label className={labelClass}>Beast</label>
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
                                        variant={compact ? "compact" : "default"}
                                    />
                                </div>

                                <div className={compact ? "flex flex-col gap-1" : "flex flex-col gap-2"}>
                                    <label className={`${labelClass} flex items-center gap-1.5`}>
                                        Type
                                        <InfoTooltip content="Beast combat type: Brute (high health), Hunter (balanced), or Magic (high damage). Type advantages apply in Loot Survivor combat." />
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
                                        variant={compact ? "compact" : "default"}
                                    />
                                </div>

                                <div className={compact ? "flex flex-col gap-1" : "flex flex-col gap-2"}>
                                    <label className={`${labelClass} flex items-center gap-1.5`}>
                                        Tier
                                        <InfoTooltip content="Beast rarity tier from 1 (rarest/strongest) to 5 (common). Lower tier beasts are more powerful and valuable. Tier 1 beasts are the most sought after." />
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
                                        variant={compact ? "compact" : "default"}
                                    />
                                </div>
                            </>
                        )}

                        <div className={compact ? "flex flex-col gap-1" : "flex flex-col gap-2"}>
                            <label className={`${labelClass} flex items-center gap-1.5`}>
                                Level Range
                                <InfoTooltip content="Beast level 1-140. Adventurer: min input + slider for max." />
                            </label>
                            {isBeastsCollection ? (
                                <div className="flex gap-2">
                                    <input type="number" min="1" max="140" value={filters.levelMin} onChange={(e) => updateFilter("levelMin", e.target.value)} placeholder="Min" className={compact ? "flex-1 rounded-lg border border-[rgb(50,255,52)]/40 bg-black/60 px-2 py-1.5 text-[11px] font-orbitron uppercase tracking-wider text-white outline-none focus:border-[rgb(50,255,52)] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" : "flex-1 rounded-xl border border-[rgb(50,255,52)]/40 bg-black/60 px-3 py-2 text-sm font-orbitron uppercase tracking-widest text-white outline-none transition focus:border-[rgb(50,255,52)] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"} />
                                    <input type="number" min="1" max="140" value={filters.levelMax} onChange={(e) => updateFilter("levelMax", e.target.value)} placeholder="Max" className={compact ? "flex-1 rounded-lg border border-[rgb(50,255,52)]/40 bg-black/60 px-2 py-1.5 text-[11px] font-orbitron uppercase tracking-wider text-white outline-none focus:border-[rgb(50,255,52)] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" : "flex-1 rounded-xl border border-[rgb(50,255,52)]/40 bg-black/60 px-3 py-2 text-sm font-orbitron uppercase tracking-widest text-white outline-none transition focus:border-[rgb(50,255,52)] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"} />
                                </div>
                            ) : (
                                (() => {
                                    const levelMax = adventurerStatBounds?.levelMax ?? DEFAULT_LEVEL_MAX;
                                    const levelDisplay = filters.levelMax || String(levelMax);
                                    return (
                                        <div className="flex gap-2 items-center">
                                            <input type="number" min="1" max={levelMax} value={filters.levelMin} onChange={(e) => updateFilter("levelMin", String(e.target.value))} placeholder="Min" className={compact ? "w-12 rounded-lg border border-[rgb(50,255,52)]/40 bg-black/60 px-1.5 py-1 text-[10px] font-orbitron uppercase text-white outline-none focus:border-[rgb(50,255,52)] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" : "w-14 rounded-lg border border-[rgb(50,255,52)]/40 bg-black/60 px-2 py-1.5 text-xs font-orbitron uppercase text-white outline-none focus:border-[rgb(50,255,52)] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"} />
                                            <input type="range" min="1" max={levelMax} value={filters.levelMax !== "" ? filters.levelMax : String(levelMax)} onChange={(e) => updateFilter("levelMax", String(e.target.value))} className="flex-1 h-2 rounded-full appearance-none bg-[rgb(50,255,52)]/20 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[rgb(50,255,52)]" />
                                            <span className={compact ? "w-6 text-right text-[9px] font-mono text-[rgb(186,255,188)]/70" : "w-7 text-right text-[10px] font-mono text-[rgb(186,255,188)]/70"}>{levelDisplay}</span>
                                        </div>
                                    );
                                })()
                            )}
                        </div>

                        {/* Beast-specific: Power Range */}
                        {isBeastsCollection && (
                            <div className={compact ? "flex flex-col gap-1" : "flex flex-col gap-2"}>
                                <label className={`${labelClass} flex items-center gap-1.5`}>
                                    Power Range
                                    <InfoTooltip content="Overall beast combat power (1-550). Combines attack, defense, and special abilities. Higher power = more valuable and effective in battles." />
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
                                        className={compact ? "flex-1 rounded-lg border border-[rgb(50,255,52)]/40 bg-black/60 px-2 py-1.5 text-[11px] font-orbitron uppercase tracking-wider text-white outline-none focus:border-[rgb(50,255,52)] placeholder:text-[rgb(186,255,188)]/40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" : "flex-1 rounded-xl border border-[rgb(50,255,52)]/40 bg-black/60 px-3 py-2 text-sm font-orbitron uppercase tracking-widest text-white outline-none transition focus:border-[rgb(50,255,52)] focus:ring-2 focus:ring-[rgb(50,255,52)]/35 hover:border-[rgb(50,255,52)]/60 placeholder:text-[rgb(186,255,188)]/40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"}
                                    />
                                    <input
                                        type="number"
                                        min="1"
                                        max="550"
                                        step="0.1"
                                        value={filters.powerMax}
                                        onChange={(e) => updateFilter("powerMax", e.target.value)}
                                        placeholder="Max"
                                        className={compact ? "flex-1 rounded-lg border border-[rgb(50,255,52)]/40 bg-black/60 px-2 py-1.5 text-[11px] font-orbitron uppercase tracking-wider text-white outline-none focus:border-[rgb(50,255,52)] placeholder:text-[rgb(186,255,188)]/40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" : "flex-1 rounded-xl border border-[rgb(50,255,52)]/40 bg-black/60 px-3 py-2 text-sm font-orbitron uppercase tracking-widest text-white outline-none transition focus:border-[rgb(50,255,52)] focus:ring-2 focus:ring-[rgb(50,255,52)]/35 hover:border-[rgb(50,255,52)]/60 placeholder:text-[rgb(186,255,188)]/40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Beast-specific: Rank Range */}
                        {isBeastsCollection && (
                            <div className={compact ? "flex flex-col gap-1" : "flex flex-col gap-2"}>
                                <label className={`${labelClass} flex items-center gap-1.5`}>
                                    Rank Range
                                    <InfoTooltip content="Beast leaderboard ranking (1-1165). Lower rank = more prestigious. Rank 1 is the top beast. Affects Summit rewards eligibility." />
                                </label>
                                <div className="flex gap-2">
                                    <input type="number" min="1" max="1165" value={filters.rankMin} onChange={(e) => updateFilter("rankMin", e.target.value)} placeholder="Min" className={compact ? "flex-1 rounded-lg border border-[rgb(50,255,52)]/40 bg-black/60 px-2 py-1.5 text-[11px] font-orbitron uppercase tracking-wider text-white outline-none focus:border-[rgb(50,255,52)] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" : "flex-1 rounded-xl border border-[rgb(50,255,52)]/40 bg-black/60 px-3 py-2 text-sm font-orbitron uppercase tracking-widest text-white outline-none transition focus:border-[rgb(50,255,52)] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"} />
                                    <input type="number" min="1" max="1165" value={filters.rankMax} onChange={(e) => updateFilter("rankMax", e.target.value)} placeholder="Max" className={compact ? "flex-1 rounded-lg border border-[rgb(50,255,52)]/40 bg-black/60 px-2 py-1.5 text-[11px] font-orbitron uppercase tracking-wider text-white outline-none focus:border-[rgb(50,255,52)] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" : "flex-1 rounded-xl border border-[rgb(50,255,52)]/40 bg-black/60 px-3 py-2 text-sm font-orbitron uppercase tracking-widest text-white outline-none transition focus:border-[rgb(50,255,52)] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"} />
                                </div>
                            </div>
                        )}

                        {/* Adventurer: Health + stats (min input + max slider; max from displayed NFTs) */}
                        {!isBeastsCollection && (
                            <>
                                <div className={compact ? "flex flex-col gap-1" : "flex flex-col gap-2"}>
                                    <label className={labelClass}>Health</label>
                                    <div className="flex gap-2 items-center">
                                        {(() => {
                                            const healthMax = adventurerStatBounds?.healthMax ?? DEFAULT_HEALTH_MAX;
                                            return (
                                                <>
                                                    <input type="number" min="0" max={healthMax} value={filters.healthMin} onChange={(e) => updateFilter("healthMin", String(e.target.value))} placeholder="Min" className={compact ? "w-12 rounded-lg border border-[rgb(50,255,52)]/40 bg-black/60 px-1.5 py-1 text-[10px] font-orbitron text-white outline-none focus:border-[rgb(50,255,52)] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" : "w-14 rounded-lg border border-[rgb(50,255,52)]/40 bg-black/60 px-2 py-1.5 text-xs font-orbitron text-white outline-none focus:border-[rgb(50,255,52)] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"} />
                                                    <input type="range" min="0" max={healthMax} value={filters.healthMax !== "" ? filters.healthMax : String(healthMax)} onChange={(e) => updateFilter("healthMax", String(e.target.value))} className="flex-1 h-2 rounded-full appearance-none bg-[rgb(50,255,52)]/20 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[rgb(50,255,52)]" />
                                                    <span className={compact ? "w-6 text-right text-[9px] font-mono text-[rgb(186,255,188)]/70" : "w-7 text-right text-[10px] font-mono text-[rgb(186,255,188)]/70"}>{filters.healthMax !== "" ? filters.healthMax : healthMax}</span>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>
                                {(["Strength", "Dexterity", "Vitality", "Intelligence", "Wisdom", "Charisma"] as const).map((label) => {
                                    const key = label.toLowerCase() as "strength" | "dexterity" | "vitality" | "intelligence" | "wisdom" | "charisma";
                                    const minKey = `${key}Min` as keyof FilterState;
                                    const maxKey = `${key}Max` as keyof FilterState;
                                    const statMax = adventurerStatBounds ? (adventurerStatBounds[`${key}Max` as keyof AdventurerStatBounds] as number) : DEFAULT_STAT_MAX;
                                    return (
                                        <div key={label} className={compact ? "flex flex-col gap-1" : "flex flex-col gap-2"}>
                                            <label className={labelClass}>{label}</label>
                                            <div className="flex gap-2 items-center">
                                                <input type="number" min="0" max={statMax} value={(filters[minKey] as string) || ""} onChange={(e) => updateFilter(minKey, String(e.target.value))} placeholder="Min" className={compact ? "w-12 rounded-lg border border-[rgb(50,255,52)]/40 bg-black/60 px-1.5 py-1 text-[10px] font-orbitron text-white outline-none focus:border-[rgb(50,255,52)] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" : "w-14 rounded-lg border border-[rgb(50,255,52)]/40 bg-black/60 px-2 py-1.5 text-xs font-orbitron text-white outline-none focus:border-[rgb(50,255,52)] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"} />
                                                <input type="range" min="0" max={statMax} value={(filters[maxKey] as string) !== "" ? (filters[maxKey] as string) : String(statMax)} onChange={(e) => updateFilter(maxKey, String(e.target.value))} className="flex-1 h-2 rounded-full appearance-none bg-[rgb(50,255,52)]/20 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[rgb(50,255,52)]" />
                                                <span className={compact ? "w-6 text-right text-[9px] font-mono text-[rgb(186,255,188)]/70" : "w-7 text-right text-[10px] font-mono text-[rgb(186,255,188)]/70"}>{(filters[maxKey] as string) !== "" ? (filters[maxKey] as string) : statMax}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </>
                        )}

                        {/* Beast-specific: Shiny */}
                        {isBeastsCollection && (
                            <div className={compact ? "flex flex-col gap-1" : "flex flex-col gap-2"}>
                                <label className={labelClass}>Shiny</label>
                                <CustomDropdown
                                    id="filter-shiny"
                                    value={filters.shiny}
                                    onChange={(value) => updateFilter("shiny", value)}
                                    options={[
                                        { value: "", label: "All" },
                                        { value: "true", label: "True" },
                                        { value: "false", label: "False" },
                                    ]}
                                    variant={compact ? "compact" : "default"}
                                />
                            </div>
                        )}

                        {/* Beast-specific: Animated */}
                        {isBeastsCollection && (
                            <div className={compact ? "flex flex-col gap-1" : "flex flex-col gap-2"}>
                                <label className={labelClass}>Animated</label>
                                <CustomDropdown
                                    id="filter-animated"
                                    value={filters.animated}
                                    onChange={(value) => updateFilter("animated", value)}
                                    options={[
                                        { value: "", label: "All" },
                                        { value: "true", label: "True" },
                                        { value: "false", label: "False" },
                                    ]}
                                    variant={compact ? "compact" : "default"}
                                />
                            </div>
                        )}

                    </div>
                </div>
            )}
        </div>
    );
}

