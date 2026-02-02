/**
 * Beast Share Card Component
 * T024: Twitter-optimized card layout (1200x675)
 *
 * This component is rendered off-screen and captured as an image for sharing.
 */

"use client";

import { forwardRef } from "react";
import type { ShareCardConfig } from "../../lib/types/beast-profile";

// Tier color mapping for share card
const TIER_COLORS: Record<number, { bg: string; text: string; border: string }> =
  {
    1: {
      bg: "bg-orange-500/20",
      text: "text-orange-400",
      border: "border-orange-500/50",
    },
    2: {
      bg: "bg-purple-500/20",
      text: "text-purple-400",
      border: "border-purple-500/50",
    },
    3: {
      bg: "bg-blue-500/20",
      text: "text-blue-400",
      border: "border-blue-500/50",
    },
    4: {
      bg: "bg-green-500/20",
      text: "text-green-400",
      border: "border-green-500/50",
    },
    5: {
      bg: "bg-gray-500/20",
      text: "text-gray-300",
      border: "border-gray-500/50",
    },
  };

const TIER_LABELS: Record<number, string> = {
  1: "LEGENDARY",
  2: "EPIC",
  3: "RARE",
  4: "UNCOMMON",
  5: "COMMON",
};

interface BeastShareCardProps {
  config: ShareCardConfig;
}

/**
 * BeastShareCard - Optimized for Twitter card dimensions (1200x675)
 * Uses forwardRef to allow parent to capture this component as an image
 */
const BeastShareCard = forwardRef<HTMLDivElement, BeastShareCardProps>(
  function BeastShareCard({ config }, ref) {
    const tierColors = TIER_COLORS[config.tier] || TIER_COLORS[5];
    const tierLabel = TIER_LABELS[config.tier] || "COMMON";

    return (
      <div
        ref={ref}
        className="relative flex items-center justify-between p-12"
        style={{
          width: "1200px",
          height: "675px",
          background:
            "linear-gradient(135deg, #0a0a0a 0%, #0f1f0f 50%, #0a0a0a 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Border frame */}
        <div
          className="absolute inset-4 border-2 rounded-xl pointer-events-none"
          style={{ borderColor: "rgba(50, 255, 52, 0.3)" }}
        />

        {/* Corner decorations */}
        <div
          className="absolute top-6 left-6 w-12 h-12 border-t-2 border-l-2"
          style={{ borderColor: "rgba(50, 255, 52, 0.5)" }}
        />
        <div
          className="absolute top-6 right-6 w-12 h-12 border-t-2 border-r-2"
          style={{ borderColor: "rgba(50, 255, 52, 0.5)" }}
        />
        <div
          className="absolute bottom-6 left-6 w-12 h-12 border-b-2 border-l-2"
          style={{ borderColor: "rgba(50, 255, 52, 0.5)" }}
        />
        <div
          className="absolute bottom-6 right-6 w-12 h-12 border-b-2 border-r-2"
          style={{ borderColor: "rgba(50, 255, 52, 0.5)" }}
        />

        {/* Left side - Beast Image */}
        <div className="flex-shrink-0 relative">
          <div
            className="w-[320px] h-[450px] rounded-xl overflow-hidden border-2"
            style={{ borderColor: "rgba(50, 255, 52, 0.4)" }}
          >
            {config.beastArtUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- Using <img> intentionally for html-to-image capture
              <img
                src={config.beastArtUrl}
                alt={config.beastName}
                className="w-full h-full object-contain bg-black/50"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-black/50">
                <span className="text-6xl opacity-30">🐉</span>
              </div>
            )}
          </div>
        </div>

        {/* Right side - Profile Info */}
        <div className="flex-1 flex flex-col items-center justify-center px-12 text-center">
          {/* Tier Badge */}
          <div
            className={`mb-6 rounded-full border-2 px-6 py-2 text-sm font-bold uppercase tracking-widest ${tierColors.text} ${tierColors.bg} ${tierColors.border}`}
          >
            {tierLabel}
          </div>

          {/* Beast Name */}
          <h1
            className={`text-5xl font-bold uppercase tracking-wide mb-8 ${tierColors.text}`}
            style={{
              textShadow: "0 0 30px rgba(50, 255, 52, 0.3)",
            }}
          >
            {config.fullName}
          </h1>

          {/* Divider */}
          <div
            className="w-64 h-px mb-8"
            style={{
              background:
                "linear-gradient(to right, transparent, rgba(50, 255, 52, 0.5), transparent)",
            }}
          />

          {/* Tagline */}
          <p
            className="text-2xl italic text-white/90 max-w-lg leading-relaxed mb-8"
            style={{
              textShadow: "0 2px 4px rgba(0, 0, 0, 0.5)",
            }}
          >
            &ldquo;{config.tagline}&rdquo;
          </p>

          {/* Rank Display */}
          <div className="text-xl text-white/60">{config.percentileDisplay}</div>

          {/* Beast Type Badge */}
          <div
            className="mt-6 rounded-full px-4 py-1 text-sm uppercase tracking-wider"
            style={{
              backgroundColor: "rgba(50, 255, 52, 0.1)",
              color: "rgb(50, 255, 52)",
              border: "1px solid rgba(50, 255, 52, 0.3)",
            }}
          >
            {config.beastType}
          </div>
        </div>

        {/* Survivor Exchange Branding */}
        <div
          className="absolute bottom-8 right-12 flex items-center gap-3 text-white/40"
          style={{ fontSize: "14px" }}
        >
          <span>survivorexchange.com</span>
          <div
            className="w-6 h-6 rounded"
            style={{ backgroundColor: "rgba(50, 255, 52, 0.3)" }}
          />
        </div>

        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-5"
          style={{
            backgroundImage: `linear-gradient(rgba(50, 255, 52, 0.5) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(50, 255, 52, 0.5) 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
          }}
        />
      </div>
    );
  }
);

export default BeastShareCard;
