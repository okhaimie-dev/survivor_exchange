(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/app/lib/utils.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "clsx",
    ()=>clsx
]);
const clsx = (...classes)=>{
    return classes.filter(Boolean).join(" ");
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/app/components/monster-card.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>MonsterCard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/image.js [app-client] (ecmascript)");
;
;
function MonsterCard({ monster, selected, onToggle }) {
    const stats = [
        {
            label: "Affinity",
            value: monster.affinity
        },
        {
            label: "Role",
            value: monster.role
        },
        {
            label: "Level",
            value: `Lv. ${monster.level}`
        },
        {
            label: "Power",
            value: `${monster.power.toFixed(1)}k`
        }
    ];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
        role: "button",
        tabIndex: 0,
        onClick: onToggle,
        onKeyDown: (event)=>{
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onToggle();
            }
        },
        className: `group relative flex h-full w-full flex-col gap-6 overflow-hidden rounded-3xl border border-[rgb(50,255,52)]/20 bg-black/60 p-7 transition duration-200 hover:-translate-y-1 hover:border-[rgb(50,255,52)]/60 hover:shadow-[0_18px_45px_rgba(10,30,10,0.45)] hover:cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(50,255,52)]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${selected ? "border-[rgb(50,255,52)]/80 shadow-[0_22px_55px_rgba(20,255,80,0.35)]" : ""}`,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "flex flex-col gap-1 text-[11px] font-orbitron uppercase tracking-[0.16em] text-[rgb(186,255,188)]/75",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: monster.id
                    }, void 0, false, {
                        fileName: "[project]/app/components/monster-card.tsx",
                        lineNumber: 44,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-[10px] tracking-[0.2em] text-[rgb(186,255,188)]/60",
                        children: monster.epithet
                    }, void 0, false, {
                        fileName: "[project]/app/components/monster-card.tsx",
                        lineNumber: 45,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/components/monster-card.tsx",
                lineNumber: 43,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col items-center gap-4 text-center text-white",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex h-24 w-24 items-center justify-center rounded-3xl border border-[rgb(50,255,52)]/40 bg-[rgb(50,255,52)]/12",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                            src: monster.image,
                            alt: monster.name,
                            width: 96,
                            height: 96,
                            draggable: false,
                            className: "h-16 w-16 object-contain"
                        }, void 0, false, {
                            fileName: "[project]/app/components/monster-card.tsx",
                            lineNumber: 50,
                            columnNumber: 21
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/app/components/monster-card.tsx",
                        lineNumber: 49,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "text-xl font-orbitron uppercase tracking-[0.12em]",
                                children: monster.name
                            }, void 0, false, {
                                fileName: "[project]/app/components/monster-card.tsx",
                                lineNumber: 60,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-xs text-[rgb(186,255,188)]/70",
                                children: [
                                    monster.affinity,
                                    " lineage"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/components/monster-card.tsx",
                                lineNumber: 61,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/components/monster-card.tsx",
                        lineNumber: 59,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/components/monster-card.tsx",
                lineNumber: 48,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid grid-cols-2 gap-3 text-white",
                children: stats.map((stat)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col gap-1 rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-left",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-[rgb(186,255,188)]/70 text-[10px] font-orbitron uppercase tracking-[0.18em]",
                                children: stat.label
                            }, void 0, false, {
                                fileName: "[project]/app/components/monster-card.tsx",
                                lineNumber: 71,
                                columnNumber: 25
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-lg font-orbitron tracking-tight text-white",
                                children: stat.value
                            }, void 0, false, {
                                fileName: "[project]/app/components/monster-card.tsx",
                                lineNumber: 74,
                                columnNumber: 25
                            }, this)
                        ]
                    }, stat.label, true, {
                        fileName: "[project]/app/components/monster-card.tsx",
                        lineNumber: 67,
                        columnNumber: 21
                    }, this))
            }, void 0, false, {
                fileName: "[project]/app/components/monster-card.tsx",
                lineNumber: 65,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/components/monster-card.tsx",
        lineNumber: 29,
        columnNumber: 9
    }, this);
}
_c = MonsterCard;
var _c;
__turbopack_context__.k.register(_c, "MonsterCard");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/app/components/pagination.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Pagination
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
;
function Pagination({ currentPage, totalPages, onPageChange }) {
    const pages = Array.from({
        length: totalPages
    }, (_, index)=>index + 1);
    const handlePrevious = ()=>{
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };
    const handleNext = ()=>{
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
        className: "flex items-center gap-3 text-sm font-orbitron uppercase tracking-wide text-white",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                onClick: handlePrevious,
                disabled: currentPage === 1,
                className: `rounded border px-3 py-1 transition ${currentPage === 1 ? "cursor-not-allowed border-white/30 text-white/30" : "border-white hover:cursor-pointer hover:border-[rgb(50,255,52)] hover:text-[rgb(50,255,52)]"}`,
                children: "Previous"
            }, void 0, false, {
                fileName: "[project]/app/components/pagination.tsx",
                lineNumber: 24,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                className: "flex items-center gap-2",
                children: pages.map((page)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            onClick: ()=>onPageChange(page),
                            className: `rounded px-2 py-1 transition ${page === currentPage ? "border border-[rgb(50,255,52)] bg-[rgb(50,255,52)]/10 text-[rgb(50,255,52)]" : "border border-transparent hover:cursor-pointer hover:border-[rgb(50,255,52)] hover:text-[rgb(50,255,52)]"}`,
                            children: page
                        }, void 0, false, {
                            fileName: "[project]/app/components/pagination.tsx",
                            lineNumber: 39,
                            columnNumber: 25
                        }, this)
                    }, page, false, {
                        fileName: "[project]/app/components/pagination.tsx",
                        lineNumber: 38,
                        columnNumber: 21
                    }, this))
            }, void 0, false, {
                fileName: "[project]/app/components/pagination.tsx",
                lineNumber: 36,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                onClick: handleNext,
                disabled: currentPage === totalPages,
                className: `rounded border px-3 py-1 transition ${currentPage === totalPages ? "cursor-not-allowed border-white/30 text-white/30" : "border-white hover:cursor-pointer hover:border-[rgb(50,255,52)] hover:text-[rgb(50,255,52)]"}`,
                children: "Next"
            }, void 0, false, {
                fileName: "[project]/app/components/pagination.tsx",
                lineNumber: 53,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/components/pagination.tsx",
        lineNumber: 23,
        columnNumber: 9
    }, this);
}
_c = Pagination;
var _c;
__turbopack_context__.k.register(_c, "Pagination");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/app/components/auction.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Auction
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$monster$2d$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/components/monster-card.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$pagination$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/components/pagination.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
;
const monsters = [
    {
        id: "#M-1207",
        name: "Abyssal Ravager",
        epithet: "Voidborne Vanguard",
        affinity: "Shadow",
        role: "Assault",
        level: 52,
        power: 4.6,
        image: "/logo.png"
    },
    {
        id: "#M-1042",
        name: "Stormscale Siren",
        epithet: "Tidal Enchanter",
        affinity: "Water",
        role: "Controller",
        level: 47,
        power: 3.8,
        image: "/logo.png"
    },
    {
        id: "#M-0981",
        name: "Solaris Warden",
        epithet: "Radiant Bulwark",
        affinity: "Light",
        role: "Guardian",
        level: 55,
        power: 5.1,
        image: "/logo.png"
    },
    {
        id: "#M-0876",
        name: "Ironroot Stalker",
        epithet: "Grove Sentinel",
        affinity: "Earth",
        role: "Skirmisher",
        level: 43,
        power: 3.2,
        image: "/logo.png"
    },
    {
        id: "#M-1310",
        name: "Emberwing Talon",
        epithet: "Blaze Harrier",
        affinity: "Fire",
        role: "Assault",
        level: 49,
        power: 4.1,
        image: "/logo.png"
    },
    {
        id: "#M-0764",
        name: "Frostvein Oracle",
        epithet: "Crystal Seer",
        affinity: "Ice",
        role: "Support",
        level: 45,
        power: 3.5,
        image: "/logo.png"
    }
];
function Auction() {
    _s();
    const pageSize = 3;
    const [currentPage, setCurrentPage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(1);
    const [selectedMonsterIds, setSelectedMonsterIds] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [collectionName, setCollectionName] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [startingPrice, setStartingPrice] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const toggleCardSelection = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "Auction.useCallback[toggleCardSelection]": (monsterId)=>{
            setSelectedMonsterIds({
                "Auction.useCallback[toggleCardSelection]": (previouslySelected)=>{
                    if (previouslySelected.includes(monsterId)) {
                        return previouslySelected.filter({
                            "Auction.useCallback[toggleCardSelection]": (existingId)=>existingId !== monsterId
                        }["Auction.useCallback[toggleCardSelection]"]);
                    }
                    return [
                        ...previouslySelected,
                        monsterId
                    ];
                }
            }["Auction.useCallback[toggleCardSelection]"]);
        }
    }["Auction.useCallback[toggleCardSelection]"], []);
    const totalPages = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "Auction.useMemo[totalPages]": ()=>Math.max(1, Math.ceil(monsters.length / pageSize))
    }["Auction.useMemo[totalPages]"], [
        pageSize
    ]);
    const visibleMonsters = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "Auction.useMemo[visibleMonsters]": ()=>{
            const startIndex = (currentPage - 1) * pageSize;
            return monsters.slice(startIndex, startIndex + pageSize);
        }
    }["Auction.useMemo[visibleMonsters]"], [
        currentPage,
        pageSize
    ]);
    const selectedMonsters = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "Auction.useMemo[selectedMonsters]": ()=>monsters.filter({
                "Auction.useMemo[selectedMonsters]": (monster)=>selectedMonsterIds.includes(monster.id)
            }["Auction.useMemo[selectedMonsters]"])
    }["Auction.useMemo[selectedMonsters]"], [
        selectedMonsterIds
    ]);
    const hasSelection = selectedMonsters.length > 0;
    const averageLevel = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "Auction.useMemo[averageLevel]": ()=>{
            if (!hasSelection) {
                return null;
            }
            const totalLevels = selectedMonsters.reduce({
                "Auction.useMemo[averageLevel].totalLevels": (sum, monster)=>sum + monster.level
            }["Auction.useMemo[averageLevel].totalLevels"], 0);
            return Math.round(totalLevels / selectedMonsters.length);
        }
    }["Auction.useMemo[averageLevel]"], [
        hasSelection,
        selectedMonsters
    ]);
    const totalPower = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "Auction.useMemo[totalPower]": ()=>{
            if (!hasSelection) {
                return null;
            }
            return selectedMonsters.reduce({
                "Auction.useMemo[totalPower]": (sum, monster)=>sum + monster.power
            }["Auction.useMemo[totalPower]"], 0).toFixed(1);
        }
    }["Auction.useMemo[totalPower]"], [
        hasSelection,
        selectedMonsters
    ]);
    const handlePageChange = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "Auction.useCallback[handlePageChange]": (page)=>{
            const nextPage = Math.min(Math.max(page, 1), totalPages);
            if (nextPage !== currentPage) {
                setCurrentPage(nextPage);
            }
        }
    }["Auction.useCallback[handlePageChange]"], [
        currentPage,
        totalPages
    ]);
    const handleClearSelection = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "Auction.useCallback[handleClearSelection]": ()=>{
            setSelectedMonsterIds([]);
        }
    }["Auction.useCallback[handleClearSelection]"], []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "mx-auto flex w-full max-w-6xl flex-col gap-8 px-4",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid w-full grid-cols-1 gap-6 md:grid-cols-3",
                children: visibleMonsters.map((monster)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex h-full w-full",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$monster$2d$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                            monster: monster,
                            selected: selectedMonsterIds.includes(monster.id),
                            onToggle: ()=>toggleCardSelection(monster.id)
                        }, void 0, false, {
                            fileName: "[project]/app/components/auction.tsx",
                            lineNumber: 135,
                            columnNumber: 25
                        }, this)
                    }, monster.id, false, {
                        fileName: "[project]/app/components/auction.tsx",
                        lineNumber: 134,
                        columnNumber: 21
                    }, this))
            }, void 0, false, {
                fileName: "[project]/app/components/auction.tsx",
                lineNumber: 132,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "mx-auto w-full max-w-6xl overflow-hidden rounded-2xl border border-[rgb(50,255,52)]/20 bg-black/55 shadow-[0_16px_40px_rgba(5,20,5,0.35)]",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "grid gap-8 p-6 md:grid-cols-[minmax(0,0.4fr)_minmax(0,0.6fr)] md:items-start",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex flex-col gap-4",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-[11px] font-orbitron uppercase tracking-[0.16em] text-[rgb(186,255,188)]/70",
                                            children: "Selected Monsters"
                                        }, void 0, false, {
                                            fileName: "[project]/app/components/auction.tsx",
                                            lineNumber: 148,
                                            columnNumber: 29
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-3xl font-orbitron uppercase tracking-[0.18em] text-white",
                                            children: selectedMonsters.length.toString().padStart(2, "0")
                                        }, void 0, false, {
                                            fileName: "[project]/app/components/auction.tsx",
                                            lineNumber: 151,
                                            columnNumber: 29
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/components/auction.tsx",
                                    lineNumber: 147,
                                    columnNumber: 25
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "grid grid-cols-2 gap-3 text-sm text-white",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "rounded-xl border border-white/12 bg-white/5 px-4 py-3",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-[rgb(186,255,188)]/70 text-[11px] uppercase tracking-[0.16em]",
                                                    children: "Avg Level"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/components/auction.tsx",
                                                    lineNumber: 157,
                                                    columnNumber: 33
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "font-orbitron text-lg tracking-[0.12em]",
                                                    children: averageLevel ? `Lv. ${averageLevel}` : "—"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/components/auction.tsx",
                                                    lineNumber: 158,
                                                    columnNumber: 33
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/components/auction.tsx",
                                            lineNumber: 156,
                                            columnNumber: 29
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "rounded-xl border border-white/12 bg-white/5 px-4 py-3",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-[rgb(186,255,188)]/70 text-[11px] uppercase tracking-[0.16em]",
                                                    children: "Total Power"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/components/auction.tsx",
                                                    lineNumber: 163,
                                                    columnNumber: 33
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "font-orbitron text-lg tracking-[0.12em]",
                                                    children: totalPower ? `${totalPower}k` : "—"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/components/auction.tsx",
                                                    lineNumber: 166,
                                                    columnNumber: 33
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/components/auction.tsx",
                                            lineNumber: 162,
                                            columnNumber: 29
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/components/auction.tsx",
                                    lineNumber: 155,
                                    columnNumber: 25
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex flex-col gap-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-[11px] font-orbitron uppercase tracking-[0.16em] text-[rgb(186,255,188)]/70",
                                            children: "Roster Preview"
                                        }, void 0, false, {
                                            fileName: "[project]/app/components/auction.tsx",
                                            lineNumber: 172,
                                            columnNumber: 29
                                        }, this),
                                        hasSelection ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                            className: "flex flex-wrap gap-2",
                                            children: selectedMonsters.map((monster)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                    className: "rounded-full border border-[rgb(50,255,52)]/40 px-3 py-1 text-[10px] font-orbitron uppercase tracking-[0.14em] text-[rgb(186,255,188)]",
                                                    children: monster.name
                                                }, monster.id, false, {
                                                    fileName: "[project]/app/components/auction.tsx",
                                                    lineNumber: 178,
                                                    columnNumber: 41
                                                }, this))
                                        }, void 0, false, {
                                            fileName: "[project]/app/components/auction.tsx",
                                            lineNumber: 176,
                                            columnNumber: 33
                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-xs text-[rgb(186,255,188)]/60",
                                            children: "Select monsters from the grid to assemble a collection for auction."
                                        }, void 0, false, {
                                            fileName: "[project]/app/components/auction.tsx",
                                            lineNumber: 187,
                                            columnNumber: 33
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/components/auction.tsx",
                                    lineNumber: 171,
                                    columnNumber: 25
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/components/auction.tsx",
                            lineNumber: 146,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex flex-col gap-4",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex flex-col gap-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            htmlFor: "collection-name",
                                            className: "text-[11px] font-orbitron uppercase tracking-[0.16em] text-[rgb(186,255,188)]/70",
                                            children: "Collection Name"
                                        }, void 0, false, {
                                            fileName: "[project]/app/components/auction.tsx",
                                            lineNumber: 196,
                                            columnNumber: 29
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            id: "collection-name",
                                            type: "text",
                                            value: collectionName,
                                            onChange: (event)=>setCollectionName(event.target.value),
                                            placeholder: "Enter a name for your collection",
                                            className: "w-full rounded-xl border border-white/12 bg-black/60 px-4 py-2.5 text-sm font-orbitron uppercase tracking-[0.14em] text-white outline-none transition focus:border-[rgb(50,255,52)] focus:ring-2 focus:ring-[rgb(50,255,52)]/35"
                                        }, void 0, false, {
                                            fileName: "[project]/app/components/auction.tsx",
                                            lineNumber: 202,
                                            columnNumber: 29
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/components/auction.tsx",
                                    lineNumber: 195,
                                    columnNumber: 25
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex flex-col gap-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            htmlFor: "starting-price",
                                            className: "text-[11px] font-orbitron uppercase tracking-[0.16em] text-[rgb(186,255,188)]/70",
                                            children: "Starting Price (ETH)"
                                        }, void 0, false, {
                                            fileName: "[project]/app/components/auction.tsx",
                                            lineNumber: 213,
                                            columnNumber: 29
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            id: "starting-price",
                                            type: "number",
                                            min: "0",
                                            step: "0.01",
                                            value: startingPrice,
                                            onChange: (event)=>setStartingPrice(event.target.value),
                                            placeholder: "0.00",
                                            className: "w-full rounded-xl border border-white/12 bg-black/60 px-4 py-2.5 text-sm font-orbitron uppercase tracking-widest text-white outline-none transition focus:border-[rgb(50,255,52)] focus:ring-2 focus:ring-[rgb(50,255,52)]/35 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                        }, void 0, false, {
                                            fileName: "[project]/app/components/auction.tsx",
                                            lineNumber: 219,
                                            columnNumber: 29
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-xs text-[rgb(186,255,188)]/70",
                                            children: [
                                                "Choose a price that reflects rarity and combined power. You currently have",
                                                " ",
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "font-orbitron tracking-[0.18em] text-white",
                                                    children: [
                                                        selectedMonsters.length,
                                                        " ",
                                                        selectedMonsters.length === 1 ? "monster" : "monsters"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/components/auction.tsx",
                                                    lineNumber: 231,
                                                    columnNumber: 33
                                                }, this),
                                                " ",
                                                "selected."
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/components/auction.tsx",
                                            lineNumber: 229,
                                            columnNumber: 29
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/components/auction.tsx",
                                    lineNumber: 212,
                                    columnNumber: 25
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex flex-wrap gap-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            type: "button",
                                            disabled: !hasSelection || !startingPrice || !collectionName.trim(),
                                            className: `inline-flex items-center justify-center rounded-full px-6 py-2 text-sm font-orbitron uppercase tracking-[0.18em] transition ${hasSelection && startingPrice && collectionName.trim() ? "border border-[rgb(50,255,52)] bg-[rgb(50,255,52)]/10 text-[rgb(50,255,52)] hover:cursor-pointer hover:bg-[rgb(50,255,52)] hover:text-black" : "border border-white/12 text-[rgb(186,255,188)]/45"}`,
                                            children: "List Selection"
                                        }, void 0, false, {
                                            fileName: "[project]/app/components/auction.tsx",
                                            lineNumber: 238,
                                            columnNumber: 29
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            type: "button",
                                            onClick: handleClearSelection,
                                            disabled: !hasSelection,
                                            className: `inline-flex items-center justify-center rounded-full border px-6 py-2 text-sm font-orbitron uppercase tracking-[0.18em] transition ${hasSelection ? "border-white text-white hover:cursor-pointer hover:border-[rgb(50,255,52)] hover:text-[rgb(50,255,52)]" : "border-white/20 text-white/30"}`,
                                            children: "Clear Selection"
                                        }, void 0, false, {
                                            fileName: "[project]/app/components/auction.tsx",
                                            lineNumber: 249,
                                            columnNumber: 29
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/components/auction.tsx",
                                    lineNumber: 237,
                                    columnNumber: 25
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-xs text-[rgb(186,255,188)]/70",
                                    children: "Tip: You can list multiple monsters together as a themed bundle. Buyers love cohesive teams with complementary roles."
                                }, void 0, false, {
                                    fileName: "[project]/app/components/auction.tsx",
                                    lineNumber: 262,
                                    columnNumber: 25
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/components/auction.tsx",
                            lineNumber: 194,
                            columnNumber: 21
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/components/auction.tsx",
                    lineNumber: 145,
                    columnNumber: 17
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/components/auction.tsx",
                lineNumber: 144,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex justify-center",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$pagination$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                    currentPage: currentPage,
                    totalPages: totalPages,
                    onPageChange: handlePageChange
                }, void 0, false, {
                    fileName: "[project]/app/components/auction.tsx",
                    lineNumber: 271,
                    columnNumber: 17
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/components/auction.tsx",
                lineNumber: 270,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/components/auction.tsx",
        lineNumber: 131,
        columnNumber: 9
    }, this);
}
_s(Auction, "1jFBanoOcIYJcqw0oyepiahND8g=");
_c = Auction;
var _c;
__turbopack_context__.k.register(_c, "Auction");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/app/components/monster-collection-card.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>MonsterCollectionCard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/image.js [app-client] (ecmascript)");
;
;
function MonsterCollectionCard({ collection, isSelected, onSelect }) {
    const highestBidDisplay = collection.highestBid !== undefined ? `${collection.highestBid.toFixed(2)} ETH` : "No bids yet";
    const stats = [
        {
            label: "Starting",
            value: collection.startingPrice.toFixed(2),
            suffix: "ETH"
        },
        {
            label: "Rent / Day",
            value: collection.rentPrice.toFixed(2),
            suffix: "ETH"
        }
    ];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
        role: "button",
        tabIndex: 0,
        onClick: onSelect,
        onKeyDown: (event)=>{
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect();
            }
        },
        className: `group relative flex h-full w-full flex-col gap-6 overflow-hidden rounded-3xl border border-[rgb(50,255,52)]/20 bg-black/60 p-7 transition duration-200 hover:-translate-y-1 hover:border-[rgb(50,255,52)]/60 hover:shadow-[0_18px_45px_rgba(10,30,10,0.45)] hover:cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(50,255,52)]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${isSelected ? "border-[rgb(50,255,52)]/80 shadow-[0_22px_55px_rgba(20,255,80,0.35)]" : ""}`,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "flex flex-col gap-1 text-[11px] font-orbitron uppercase tracking-[0.16em] text-[rgb(186,255,188)]/75",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: collection.id
                    }, void 0, false, {
                        fileName: "[project]/app/components/monster-collection-card.tsx",
                        lineNumber: 50,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-[10px] tracking-[0.2em] text-[rgb(186,255,188)]/60",
                        children: [
                            collection.totalMonsters,
                            " monsters"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/components/monster-collection-card.tsx",
                        lineNumber: 51,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/components/monster-collection-card.tsx",
                lineNumber: 49,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col items-center gap-4 text-center",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex h-24 w-24 items-center justify-center rounded-3xl border border-[rgb(50,255,52)]/40 bg-[rgb(50,255,52)]/12",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                            src: collection.image,
                            alt: collection.name,
                            width: 96,
                            height: 96,
                            draggable: false,
                            className: "h-16 w-16 object-contain"
                        }, void 0, false, {
                            fileName: "[project]/app/components/monster-collection-card.tsx",
                            lineNumber: 58,
                            columnNumber: 21
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/app/components/monster-collection-card.tsx",
                        lineNumber: 57,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col gap-2 text-white",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "text-xl font-orbitron uppercase tracking-[0.12em]",
                                children: collection.name
                            }, void 0, false, {
                                fileName: "[project]/app/components/monster-collection-card.tsx",
                                lineNumber: 68,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-xs text-[rgb(186,255,188)]/70",
                                children: [
                                    highestBidDisplay,
                                    " top bid"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/components/monster-collection-card.tsx",
                                lineNumber: 69,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/components/monster-collection-card.tsx",
                        lineNumber: 67,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/components/monster-collection-card.tsx",
                lineNumber: 56,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col gap-3 text-white",
                children: stats.map((stat)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col gap-1 rounded-2xl border border-white/12 bg-white/5 px-5 py-3 text-left",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-[rgb(186,255,188)]/70 text-[10px] font-orbitron uppercase tracking-[0.18em]",
                                children: stat.label
                            }, void 0, false, {
                                fileName: "[project]/app/components/monster-collection-card.tsx",
                                lineNumber: 79,
                                columnNumber: 25
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-2xl font-orbitron tracking-tight text-white",
                                children: stat.value
                            }, void 0, false, {
                                fileName: "[project]/app/components/monster-collection-card.tsx",
                                lineNumber: 82,
                                columnNumber: 25
                            }, this),
                            stat.suffix ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-xs font-orbitron uppercase tracking-[0.18em] text-[rgb(186,255,188)]/80",
                                children: stat.suffix
                            }, void 0, false, {
                                fileName: "[project]/app/components/monster-collection-card.tsx",
                                lineNumber: 84,
                                columnNumber: 29
                            }, this) : null
                        ]
                    }, stat.label, true, {
                        fileName: "[project]/app/components/monster-collection-card.tsx",
                        lineNumber: 75,
                        columnNumber: 21
                    }, this))
            }, void 0, false, {
                fileName: "[project]/app/components/monster-collection-card.tsx",
                lineNumber: 73,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/components/monster-collection-card.tsx",
        lineNumber: 35,
        columnNumber: 9
    }, this);
}
_c = MonsterCollectionCard;
var _c;
__turbopack_context__.k.register(_c, "MonsterCollectionCard");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/app/components/bids.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Bids
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/image.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$monster$2d$collection$2d$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/components/monster-collection-card.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$pagination$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/components/pagination.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
;
;
const collections = [
    {
        id: "#1127",
        name: "Abyssal Wraith Collective",
        totalMonsters: 12,
        startingPrice: 3.25,
        highestBid: 4.1,
        rentPrice: 0.65,
        image: "/logo.png",
        description: "A legion of spectral guardians bound to the abyss, coveted for their stealth and ethereal strikes."
    },
    {
        id: "#0982",
        name: "Crystal Spire Sentinels",
        totalMonsters: 8,
        startingPrice: 1.9,
        rentPrice: 0.4,
        image: "/logo.png",
        description: "Shimmering constructs forged from crystal lattices, ideal for defensive lineups and high resilience."
    },
    {
        id: "#0544",
        name: "Voidborne Choir",
        totalMonsters: 16,
        startingPrice: 5.75,
        highestBid: 6.4,
        rentPrice: 1.15,
        image: "/logo.png",
        description: "An ensemble of cosmic sirens whose harmonics destabilize opponents and fortify allied ranks."
    },
    {
        id: "#0458",
        name: "Ironroot Vanguard",
        totalMonsters: 10,
        startingPrice: 2.4,
        highestBid: 2.9,
        rentPrice: 0.55,
        image: "/logo.png",
        description: "Ancient forest guardians specializing in crowd control and regenerative shielding."
    },
    {
        id: "#0721",
        name: "Stormscale Phalanx",
        totalMonsters: 9,
        startingPrice: 2.8,
        highestBid: 3.05,
        rentPrice: 0.6,
        image: "/logo.png",
        description: "Electrified amphibious tacticians whose storms overwhelm adversaries in blitz assaults."
    }
];
const formatEth = (value)=>`${value.toFixed(2)} ETH`;
function Bids() {
    _s();
    const pageSize = 3;
    const [selectedCollectionId, setSelectedCollectionId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(collections[0]?.id ?? "");
    const [bidAmount, setBidAmount] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        "Bids.useState": ()=>{
            const firstCollection = collections[0];
            if (!firstCollection) {
                return "";
            }
            const firstMinimum = Math.max(firstCollection.startingPrice, firstCollection.highestBid ?? firstCollection.startingPrice);
            return firstMinimum.toFixed(2);
        }
    }["Bids.useState"]);
    const [currentPage, setCurrentPage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(1);
    const selectedCollection = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "Bids.useMemo[selectedCollection]": ()=>collections.find({
                "Bids.useMemo[selectedCollection]": (collection)=>collection.id === selectedCollectionId
            }["Bids.useMemo[selectedCollection]"])
    }["Bids.useMemo[selectedCollection]"], [
        selectedCollectionId
    ]);
    const minimumBid = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "Bids.useMemo[minimumBid]": ()=>{
            if (!selectedCollection) {
                return 0;
            }
            return Math.max(selectedCollection.startingPrice, selectedCollection.highestBid ?? selectedCollection.startingPrice);
        }
    }["Bids.useMemo[minimumBid]"], [
        selectedCollection
    ]);
    const isBidValid = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "Bids.useMemo[isBidValid]": ()=>{
            const numericBid = parseFloat(bidAmount);
            return !Number.isNaN(numericBid) && numericBid >= minimumBid;
        }
    }["Bids.useMemo[isBidValid]"], [
        bidAmount,
        minimumBid
    ]);
    const updateSelection = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "Bids.useCallback[updateSelection]": (collection)=>{
            if (!collection) {
                return;
            }
            setSelectedCollectionId(collection.id);
            const nextMinimum = Math.max(collection.startingPrice, collection.highestBid ?? collection.startingPrice);
            setBidAmount(nextMinimum.toFixed(2));
        }
    }["Bids.useCallback[updateSelection]"], []);
    const handleSelectCollection = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "Bids.useCallback[handleSelectCollection]": (collection)=>{
            updateSelection(collection);
        }
    }["Bids.useCallback[handleSelectCollection]"], [
        updateSelection
    ]);
    const totalPages = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "Bids.useMemo[totalPages]": ()=>Math.max(1, Math.ceil(collections.length / pageSize))
    }["Bids.useMemo[totalPages]"], [
        pageSize
    ]);
    const visibleCollections = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "Bids.useMemo[visibleCollections]": ()=>{
            const startIndex = (currentPage - 1) * pageSize;
            return collections.slice(startIndex, startIndex + pageSize);
        }
    }["Bids.useMemo[visibleCollections]"], [
        currentPage,
        pageSize
    ]);
    const handlePageChange = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "Bids.useCallback[handlePageChange]": (page)=>{
            const nextPage = Math.min(Math.max(page, 1), totalPages);
            if (nextPage === currentPage) {
                return;
            }
            setCurrentPage(nextPage);
            const firstOnPage = collections[(nextPage - 1) * pageSize];
            updateSelection(firstOnPage);
        }
    }["Bids.useCallback[handlePageChange]"], [
        currentPage,
        totalPages,
        updateSelection,
        pageSize
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "mx-auto flex w-full max-w-6xl flex-col gap-8 px-4",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid w-full grid-cols-1 gap-6 md:grid-cols-3",
                children: visibleCollections.map((collection)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex h-full w-full",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$monster$2d$collection$2d$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                            collection: collection,
                            isSelected: collection.id === selectedCollectionId,
                            onSelect: ()=>handleSelectCollection(collection)
                        }, void 0, false, {
                            fileName: "[project]/app/components/bids.tsx",
                            lineNumber: 149,
                            columnNumber: 25
                        }, this)
                    }, collection.id, false, {
                        fileName: "[project]/app/components/bids.tsx",
                        lineNumber: 148,
                        columnNumber: 21
                    }, this))
            }, void 0, false, {
                fileName: "[project]/app/components/bids.tsx",
                lineNumber: 146,
                columnNumber: 13
            }, this),
            selectedCollection && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "mx-auto w-full max-w-6xl overflow-hidden rounded-2xl border border-[rgb(50,255,52)]/20 bg-black/55 shadow-[0_16px_40px_rgba(5,20,5,0.35)]",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "grid gap-8 p-6 md:grid-cols-[minmax(0,0.4fr)_minmax(0,0.6fr)] md:items-start",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex flex-col items-center gap-4 text-center md:items-start md:text-left",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex h-28 w-28 items-center justify-center rounded-2xl border border-[rgb(50,255,52)]/35 bg-[rgb(50,255,52)]/10",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                        src: selectedCollection.image,
                                        alt: selectedCollection.name,
                                        width: 112,
                                        height: 112,
                                        draggable: false,
                                        className: "h-16 w-16 object-contain"
                                    }, void 0, false, {
                                        fileName: "[project]/app/components/bids.tsx",
                                        lineNumber: 163,
                                        columnNumber: 33
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/app/components/bids.tsx",
                                    lineNumber: 162,
                                    columnNumber: 29
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-[11px] font-orbitron uppercase tracking-[0.16em] text-[rgb(186,255,188)]/70",
                                    children: selectedCollection.id
                                }, void 0, false, {
                                    fileName: "[project]/app/components/bids.tsx",
                                    lineNumber: 172,
                                    columnNumber: 29
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                    className: "text-2xl font-orbitron uppercase tracking-[0.12em] text-white",
                                    children: selectedCollection.name
                                }, void 0, false, {
                                    fileName: "[project]/app/components/bids.tsx",
                                    lineNumber: 175,
                                    columnNumber: 29
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-xs leading-relaxed text-[rgb(186,255,188)]/70",
                                    children: [
                                        selectedCollection.totalMonsters,
                                        " monsters • ",
                                        selectedCollection.description
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/components/bids.tsx",
                                    lineNumber: 178,
                                    columnNumber: 29
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/components/bids.tsx",
                            lineNumber: 161,
                            columnNumber: 25
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex flex-col gap-6",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "grid grid-cols-1 gap-3 text-sm text-white sm:grid-cols-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "rounded-xl border border-white/12 bg-white/5 px-4 py-3 text-center sm:text-left",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-[rgb(186,255,188)]/70 text-[11px] uppercase tracking-[0.16em]",
                                                    children: "Starting"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/components/bids.tsx",
                                                    lineNumber: 186,
                                                    columnNumber: 37
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "font-orbitron text-lg tracking-[0.12em]",
                                                    children: formatEth(selectedCollection.startingPrice)
                                                }, void 0, false, {
                                                    fileName: "[project]/app/components/bids.tsx",
                                                    lineNumber: 189,
                                                    columnNumber: 37
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/components/bids.tsx",
                                            lineNumber: 185,
                                            columnNumber: 33
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "rounded-xl border border-white/12 bg-white/5 px-4 py-3 text-center sm:text-left",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-[rgb(186,255,188)]/70 text-[11px] uppercase tracking-[0.16em]",
                                                    children: "Rent / Day"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/components/bids.tsx",
                                                    lineNumber: 194,
                                                    columnNumber: 37
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "font-orbitron text-lg tracking-[0.12em]",
                                                    children: formatEth(selectedCollection.rentPrice)
                                                }, void 0, false, {
                                                    fileName: "[project]/app/components/bids.tsx",
                                                    lineNumber: 197,
                                                    columnNumber: 37
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/components/bids.tsx",
                                            lineNumber: 193,
                                            columnNumber: 33
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/components/bids.tsx",
                                    lineNumber: 184,
                                    columnNumber: 29
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "grid gap-4 sm:grid-cols-[minmax(0,1fr)_185px] sm:items-end",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex flex-col gap-3 w-full",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                htmlFor: "bid-amount",
                                                className: "text-[11px] font-orbitron uppercase tracking-[0.14em] text-[rgb(186,255,188)]/70",
                                                children: "Place Your Bid"
                                            }, void 0, false, {
                                                fileName: "[project]/app/components/bids.tsx",
                                                lineNumber: 205,
                                                columnNumber: 37
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                id: "bid-amount",
                                                type: "number",
                                                min: minimumBid,
                                                step: "0.01",
                                                value: bidAmount,
                                                onChange: (event)=>setBidAmount(event.target.value),
                                                className: "w-40 rounded-xl border border-white/12 bg-black/60 px-4 py-2.5 text-sm font-orbitron uppercase tracking-widest text-white outline-none transition focus:border-[rgb(50,255,52)] focus:ring-2 focus:ring-[rgb(50,255,52)]/35 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                            }, void 0, false, {
                                                fileName: "[project]/app/components/bids.tsx",
                                                lineNumber: 211,
                                                columnNumber: 37
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-xs text-[rgb(186,255,188)]/70",
                                                children: [
                                                    "Minimum bid is",
                                                    " ",
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "font-orbitron tracking-widest",
                                                        children: formatEth(minimumBid)
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/components/bids.tsx",
                                                        lineNumber: 222,
                                                        columnNumber: 41
                                                    }, this),
                                                    "."
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/components/bids.tsx",
                                                lineNumber: 220,
                                                columnNumber: 37
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex gap-2 w-full",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        type: "button",
                                                        disabled: !isBidValid,
                                                        className: `inline-flex items-center justify-center rounded-full max-w-fit px-6 py-2 text-sm font-orbitron uppercase tracking-[0.18em] transition ${isBidValid ? "border border-[rgb(50,255,52)] bg-[rgb(50,255,52)]/10 text-[rgb(50,255,52)] hover:cursor-pointer hover:bg-[rgb(50,255,52)] hover:text-black" : "border border-white/12 text-[rgb(186,255,188)]/45"}`,
                                                        children: "Place Bid"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/components/bids.tsx",
                                                        lineNumber: 228,
                                                        columnNumber: 41
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        type: "button",
                                                        className: "inline-flex items-center justify-center rounded-full border border-[rgb(50,255,52)] px-6 py-2 text-sm font-orbitron uppercase tracking-[0.18em] text-[rgb(50,255,52)] transition hover:cursor-pointer hover:bg-[rgb(50,255,52)] hover:text-black",
                                                        children: [
                                                            "Rent for ",
                                                            formatEth(selectedCollection.rentPrice)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/app/components/bids.tsx",
                                                        lineNumber: 239,
                                                        columnNumber: 41
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/components/bids.tsx",
                                                lineNumber: 227,
                                                columnNumber: 37
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/components/bids.tsx",
                                        lineNumber: 204,
                                        columnNumber: 33
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/app/components/bids.tsx",
                                    lineNumber: 203,
                                    columnNumber: 29
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/components/bids.tsx",
                            lineNumber: 183,
                            columnNumber: 25
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/components/bids.tsx",
                    lineNumber: 160,
                    columnNumber: 21
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/components/bids.tsx",
                lineNumber: 159,
                columnNumber: 17
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex justify-center",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$pagination$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                    currentPage: currentPage,
                    totalPages: totalPages,
                    onPageChange: handlePageChange
                }, void 0, false, {
                    fileName: "[project]/app/components/bids.tsx",
                    lineNumber: 254,
                    columnNumber: 17
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/components/bids.tsx",
                lineNumber: 253,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/components/bids.tsx",
        lineNumber: 145,
        columnNumber: 9
    }, this);
}
_s(Bids, "LAdHMMXLAMLk7SKrq9BXvf57hYk=");
_c = Bids;
var _c;
__turbopack_context__.k.register(_c, "Bids");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/app/components/my-listings.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>MyListings
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/image.js [app-client] (ecmascript)");
;
;
const listings = [
    {
        id: "#1127",
        name: "Abyssal Wraith Collective",
        tokenCount: 12,
        startingPrice: "3.25 ETH",
        highestBid: "4.10 ETH",
        status: "active",
        createdAt: "Listed 2h ago"
    },
    {
        id: "#0982",
        name: "Crystal Spire Sentinels",
        tokenCount: 8,
        startingPrice: "1.90 ETH",
        highestBid: "—",
        status: "pending",
        createdAt: "Queued 14h ago"
    },
    {
        id: "#0544",
        name: "Voidborne Choir",
        tokenCount: 16,
        startingPrice: "5.75 ETH",
        highestBid: "6.40 ETH",
        status: "sold",
        createdAt: "Closed yesterday"
    }
];
const statusStyles = {
    active: "bg-[rgb(50,255,52)]/10 text-[rgb(50,255,52)] border border-[rgb(50,255,52)]/40",
    pending: "bg-yellow-400/10 text-yellow-300 border border-yellow-300/30",
    sold: "bg-white/10 text-white border border-white/20"
};
function MyListings() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "flex w-full flex-col gap-6",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "flex flex-col gap-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: "text-2xl font-orbitron uppercase tracking-[0.4em] text-white",
                        children: "My Listings"
                    }, void 0, false, {
                        fileName: "[project]/app/components/my-listings.tsx",
                        lineNumber: 53,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-sm text-[rgb(186,255,188)]/70",
                        children: "Review and manage every collection you have introduced to the Loot Auction habitat."
                    }, void 0, false, {
                        fileName: "[project]/app/components/my-listings.tsx",
                        lineNumber: 54,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/components/my-listings.tsx",
                lineNumber: 52,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col gap-4",
                children: listings.map((listing)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                        className: "flex w-full flex-col gap-4 rounded-2xl border border-[rgb(50,255,52)]/25 bg-black/40 p-5 shadow-[0_0_25px_rgba(50,255,52,0.12)] transition hover:cursor-pointer hover:border-[rgb(50,255,52)]/60 hover:shadow-[0_0_40px_rgba(50,255,52,0.18)] sm:flex-row sm:items-center sm:justify-between",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex w-full flex-1 items-center gap-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "relative h-16 w-16 overflow-hidden rounded-xl border border-[rgb(50,255,52)]/40 bg-[rgb(50,255,52)]/10",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                            src: "/logo.png",
                                            alt: listing.name,
                                            width: 64,
                                            height: 64,
                                            draggable: false,
                                            className: "h-full w-full object-cover p-2"
                                        }, void 0, false, {
                                            fileName: "[project]/app/components/my-listings.tsx",
                                            lineNumber: 67,
                                            columnNumber: 33
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/app/components/my-listings.tsx",
                                        lineNumber: 66,
                                        columnNumber: 29
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex flex-col",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-xs font-orbitron uppercase tracking-[0.25em] text-[rgb(186,255,188)]/70",
                                                children: listing.id
                                            }, void 0, false, {
                                                fileName: "[project]/app/components/my-listings.tsx",
                                                lineNumber: 77,
                                                columnNumber: 33
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                className: "text-lg font-orbitron uppercase tracking-[0.2em] text-white",
                                                children: listing.name
                                            }, void 0, false, {
                                                fileName: "[project]/app/components/my-listings.tsx",
                                                lineNumber: 80,
                                                columnNumber: 33
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-xs text-[rgb(186,255,188)]/70",
                                                children: listing.createdAt
                                            }, void 0, false, {
                                                fileName: "[project]/app/components/my-listings.tsx",
                                                lineNumber: 83,
                                                columnNumber: 33
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/components/my-listings.tsx",
                                        lineNumber: 76,
                                        columnNumber: 29
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/components/my-listings.tsx",
                                lineNumber: 65,
                                columnNumber: 25
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "grid w-full flex-1 grid-cols-2 gap-4 text-sm text-white md:grid-cols-3",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "rounded-lg border border-white/10 bg-white/5 p-3 text-center",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-[rgb(186,255,188)]/70 text-xs uppercase tracking-[0.2em]",
                                                children: "Tokens"
                                            }, void 0, false, {
                                                fileName: "[project]/app/components/my-listings.tsx",
                                                lineNumber: 89,
                                                columnNumber: 33
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "font-orbitron text-xl tracking-[0.3em]",
                                                children: listing.tokenCount
                                            }, void 0, false, {
                                                fileName: "[project]/app/components/my-listings.tsx",
                                                lineNumber: 90,
                                                columnNumber: 33
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/components/my-listings.tsx",
                                        lineNumber: 88,
                                        columnNumber: 29
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "rounded-lg border border-white/10 bg-white/5 p-3 text-center",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-[rgb(186,255,188)]/70 text-xs uppercase tracking-[0.2em]",
                                                children: "Starting"
                                            }, void 0, false, {
                                                fileName: "[project]/app/components/my-listings.tsx",
                                                lineNumber: 93,
                                                columnNumber: 33
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "font-orbitron text-base tracking-[0.3em]",
                                                children: listing.startingPrice
                                            }, void 0, false, {
                                                fileName: "[project]/app/components/my-listings.tsx",
                                                lineNumber: 94,
                                                columnNumber: 33
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/components/my-listings.tsx",
                                        lineNumber: 92,
                                        columnNumber: 29
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "rounded-lg border border-white/10 bg-white/5 p-3 text-center",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-[rgb(186,255,188)]/70 text-xs uppercase tracking-[0.2em]",
                                                children: "Top Bid"
                                            }, void 0, false, {
                                                fileName: "[project]/app/components/my-listings.tsx",
                                                lineNumber: 97,
                                                columnNumber: 33
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "font-orbitron text-base tracking-[0.3em]",
                                                children: listing.highestBid
                                            }, void 0, false, {
                                                fileName: "[project]/app/components/my-listings.tsx",
                                                lineNumber: 98,
                                                columnNumber: 33
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/components/my-listings.tsx",
                                        lineNumber: 96,
                                        columnNumber: 29
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/components/my-listings.tsx",
                                lineNumber: 87,
                                columnNumber: 25
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex w-full flex-col items-stretch gap-3 sm:w-auto sm:items-end",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: `inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-orbitron uppercase tracking-[0.3em] ${statusStyles[listing.status]}`,
                                        children: listing.status
                                    }, void 0, false, {
                                        fileName: "[project]/app/components/my-listings.tsx",
                                        lineNumber: 103,
                                        columnNumber: 29
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        className: "inline-flex items-center justify-center rounded-full border border-red-500/80 px-5 py-2 text-xs font-orbitron uppercase tracking-[0.3em] text-red-400 transition hover:cursor-pointer hover:bg-red-500 hover:text-black",
                                        children: "Remove Collection"
                                    }, void 0, false, {
                                        fileName: "[project]/app/components/my-listings.tsx",
                                        lineNumber: 108,
                                        columnNumber: 29
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/components/my-listings.tsx",
                                lineNumber: 102,
                                columnNumber: 25
                            }, this)
                        ]
                    }, listing.id, true, {
                        fileName: "[project]/app/components/my-listings.tsx",
                        lineNumber: 61,
                        columnNumber: 21
                    }, this))
            }, void 0, false, {
                fileName: "[project]/app/components/my-listings.tsx",
                lineNumber: 59,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/components/my-listings.tsx",
        lineNumber: 51,
        columnNumber: 9
    }, this);
}
_c = MyListings;
var _c;
__turbopack_context__.k.register(_c, "MyListings");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/app/components/bid-auction-my-listings.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>BidAuctionMyListingsRent
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/lib/utils.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$auction$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/components/auction.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$bids$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/components/bids.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$my$2d$listings$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/components/my-listings.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
function BidAuctionMyListingsRent() {
    _s();
    const [activeTab, setActiveTab] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("bid");
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col items-center justify-center gap-4 w-full space-y-4 xl:max-w-2xl 2xl:max-w-6xl",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-row items-center justify-center gap-4 w-full",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clsx"])("hover:cursor-pointer hover:text-[rgb(50,255,52)] hover:font-bold", activeTab === "bid" ? "text-[rgb(50,255,52)] font-bold" : ""),
                        onClick: ()=>setActiveTab("bid"),
                        children: "Bid on a collection of monsters"
                    }, void 0, false, {
                        fileName: "[project]/app/components/bid-auction-my-listings.tsx",
                        lineNumber: 14,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clsx"])("hover:cursor-pointer hover:text-[rgb(50,255,52)] hover:font-bold", activeTab === "auction" ? "text-[rgb(50,255,52)] font-bold" : ""),
                        onClick: ()=>setActiveTab("auction"),
                        children: "Auction your collection of monsters"
                    }, void 0, false, {
                        fileName: "[project]/app/components/bid-auction-my-listings.tsx",
                        lineNumber: 17,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clsx"])("hover:cursor-pointer hover:text-[rgb(50,255,52)] hover:font-bold", activeTab === "my-listings" ? "text-[rgb(50,255,52)] font-bold" : ""),
                        onClick: ()=>setActiveTab("my-listings"),
                        children: "My Listings"
                    }, void 0, false, {
                        fileName: "[project]/app/components/bid-auction-my-listings.tsx",
                        lineNumber: 20,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/components/bid-auction-my-listings.tsx",
                lineNumber: 13,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "w-full h-full",
                children: [
                    activeTab === "bid" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$bids$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                        fileName: "[project]/app/components/bid-auction-my-listings.tsx",
                        lineNumber: 25,
                        columnNumber: 41
                    }, this),
                    activeTab === "auction" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$auction$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                        fileName: "[project]/app/components/bid-auction-my-listings.tsx",
                        lineNumber: 26,
                        columnNumber: 45
                    }, this),
                    activeTab === "my-listings" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$my$2d$listings$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                        fileName: "[project]/app/components/bid-auction-my-listings.tsx",
                        lineNumber: 27,
                        columnNumber: 49
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/components/bid-auction-my-listings.tsx",
                lineNumber: 24,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/components/bid-auction-my-listings.tsx",
        lineNumber: 12,
        columnNumber: 9
    }, this);
}
_s(BidAuctionMyListingsRent, "Fda1g0dpB//gT+u/6UzM6l/9R44=");
_c = BidAuctionMyListingsRent;
var _c;
__turbopack_context__.k.register(_c, "BidAuctionMyListingsRent");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=app_9d0c8ef3._.js.map