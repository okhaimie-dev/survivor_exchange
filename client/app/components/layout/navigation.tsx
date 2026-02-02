"use client";

import { clsx } from "../../lib/utils";

type NavigationTab = "buy" | "sell" | "my-listings";

interface NavigationProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
}

const tabBase =
  "flex-1 min-w-0 min-h-[44px] flex items-center justify-center py-2 px-2 sm:py-2.5 sm:px-3 text-center text-[10px] sm:text-xs md:text-base font-orbitron uppercase tracking-wide transition-colors hover:cursor-pointer hover:text-[rgb(50,255,52)] md:flex-none md:w-[140px] lg:w-[180px]";

const activeHighlight =
  "text-[rgb(50,255,52)] bg-[rgb(50,255,52)]/20 font-bold shadow-[inset_0_0_0_2px_rgba(50,255,52,0.5)]";

export default function Navigation({ activeTab, onTabChange }: NavigationProps) {
  return (
    <div className="flex flex-row items-stretch w-full max-w-full md:w-[420px] lg:w-[540px] rounded-xl overflow-hidden shrink-0 border-t-2 border-b-2 border-[rgb(50,255,52)]/20">
      <button
        type="button"
        onClick={() => onTabChange("buy")}
        className={clsx(
          tabBase,
          "border-l-2 border-r-2 border-[rgb(50,255,52)]/20 rounded-l-xl",
          activeTab === "buy" ? activeHighlight : "text-white/70 font-normal"
        )}
      >
        Buy
      </button>
      <button
        type="button"
        onClick={() => onTabChange("sell")}
        className={clsx(
          tabBase,
          "border-r-2 border-[rgb(50,255,52)]/20",
          activeTab === "sell" ? activeHighlight : "text-white/70 font-normal"
        )}
      >
        Sell
      </button>
      <button
        type="button"
        onClick={() => onTabChange("my-listings")}
        className={clsx(
          tabBase,
          "border-r-2 border-[rgb(50,255,52)]/20 rounded-r-xl",
          activeTab === "my-listings" ? activeHighlight : "text-white/70 font-normal"
        )}
      >
        My Listings
      </button>
    </div>
  );
}
