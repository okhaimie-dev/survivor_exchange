/**
 * Beast Profile Card Component
 * T013-T020: Displays beast profile on the flip side of the card
 *
 * Shows: full name, generated tagline, rank percentile
 */

"use client";

import { useMemo } from "react";
import type { FormattedNFT } from "../../lib/types/nft";
import {
  extractBeastStats,
  generateBeastProfile,
} from "../../lib/utils/tagline-generator";

// Tier color mapping
const TIER_COLORS: Record<
  number,
  { primary: string; secondary: string; glow: string }
> = {
  1: {
    // Legendary - Orange/Gold
    primary: "text-orange-400",
    secondary: "text-orange-300/60",
    glow: "shadow-[0_0_30px_rgba(251,146,60,0.3)]",
  },
  2: {
    // Epic - Purple
    primary: "text-purple-400",
    secondary: "text-purple-300/60",
    glow: "shadow-[0_0_30px_rgba(192,132,252,0.3)]",
  },
  3: {
    // Rare - Blue
    primary: "text-blue-400",
    secondary: "text-blue-300/60",
    glow: "shadow-[0_0_30px_rgba(96,165,250,0.3)]",
  },
  4: {
    // Uncommon - Green
    primary: "text-green-400",
    secondary: "text-green-300/60",
    glow: "shadow-[0_0_30px_rgba(74,222,128,0.3)]",
  },
  5: {
    // Common - White/Gray
    primary: "text-gray-300",
    secondary: "text-gray-400/60",
    glow: "shadow-[0_0_20px_rgba(156,163,175,0.2)]",
  },
};

// Tier labels
const TIER_LABELS: Record<number, string> = {
  1: "LEGENDARY",
  2: "EPIC",
  3: "RARE",
  4: "UNCOMMON",
  5: "COMMON",
};

interface BeastProfileCardProps {
  nft: FormattedNFT;
}

export default function BeastProfileCard({ nft }: BeastProfileCardProps) {
  // T013-T016: Generate profile from NFT (synchronous computation)
  const { profile, stats, error } = useMemo(() => {
    try {
      const extractedStats = extractBeastStats(nft);
      const generatedProfile = generateBeastProfile(extractedStats);
      return { profile: generatedProfile, stats: extractedStats, error: null };
    } catch (err) {
      return {
        profile: null,
        stats: null,
        error: err instanceof Error ? err.message : "Failed to load profile",
      };
    }
  }, [nft]);

  // T17: Get tier-based colors
  const tierColors = stats ? TIER_COLORS[stats.tier] || TIER_COLORS[5] : TIER_COLORS[5];
  const tierLabel = stats ? TIER_LABELS[stats.tier] || "COMMON" : "COMMON";

  // T20: Handle missing/incomplete metadata or errors
  if (error || !profile || !stats) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center">
        <div className="mb-4 text-4xl opacity-50">⚠️</div>
        <h3 className="mb-2 font-orbitron text-lg text-white/80">
          Profile Unavailable
        </h3>
        <p className="text-sm text-white/50">
          {error || "Beast metadata is incomplete"}
        </p>
      </div>
    );
  }

  return (
    <div className="relative z-20 flex h-full w-full flex-col items-center justify-center p-3">
      {/* T17: Tier Badge */}
      <div
        className={`mb-1.5 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${tierColors.primary} border-current/30`}
      >
        {tierLabel}
      </div>

      {/* T14: Full Name Display - more compact */}
      <div className="mb-2 text-center px-2">
        <h2
          className={`font-orbitron text-base md:text-lg font-bold uppercase tracking-wide leading-tight ${tierColors.primary}`}
        >
          {profile.fullName}
        </h2>
      </div>

      {/* Divider */}
      <div
        className={`mb-2 h-px w-2/3 bg-gradient-to-r from-transparent via-current to-transparent ${tierColors.secondary}`}
      />

      {/* T15: Tagline Display */}
      <div className="mb-2 flex items-center justify-center px-3">
        <p className="text-center font-medium italic text-white/90 text-sm leading-snug">
          &ldquo;{profile.tagline}&rdquo;
        </p>
      </div>

      {/* T16: Rank Display - inline with combat power */}
      <div className="mb-2 text-center">
        <p className={`text-xs ${tierColors.secondary}`}>
          {profile.percentileDisplay} · CP {profile.combatPower}
        </p>
      </div>

      {/* T34: Special trait indicators (Shiny/Genesis/Animated) */}
      {(stats.isShiny || stats.isGenesis || stats.isAnimated) && (
        <div className="mb-2 flex gap-1.5">
          {stats.isGenesis && (
            <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[8px] font-bold uppercase text-amber-400">
              Genesis
            </span>
          )}
          {stats.isShiny && (
            <span className="animate-pulse rounded-full bg-cyan-500/20 px-1.5 py-0.5 text-[8px] font-bold uppercase text-cyan-400">
              Shiny
            </span>
          )}
          {stats.isAnimated && (
            <span className="rounded-full bg-violet-500/20 px-1.5 py-0.5 text-[8px] font-bold uppercase text-violet-400">
              Animated
            </span>
          )}
        </div>
      )}

    </div>
  );
}
