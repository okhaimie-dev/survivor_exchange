"use client";

import { useCallback, useEffect } from "react";
import Image from "next/image";
import type { FormattedNFT } from "../lib/types";
import { IMAGE_BASE_URL } from "../lib/constants";

interface BeastDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  nfts: FormattedNFT[];
  currentIndex: number;
  onNavigate: (index: number) => void;
  onSelect?: (tokenId: string) => void;
  isSelected?: boolean;
}

// Helper to format Unix timestamps to readable dates
const formatTimestamp = (value: string | number): string => {
  const timestamp = typeof value === "string" ? parseInt(value, 10) : value;
  if (isNaN(timestamp) || timestamp === 0) return "Never";
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function BeastDetailModal({
  isOpen,
  onClose,
  nfts,
  currentIndex,
  onNavigate,
  onSelect,
  isSelected,
}: BeastDetailModalProps) {
  const currentNft = nfts[currentIndex];

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        if (currentIndex > 0) {
          onNavigate(currentIndex - 1);
        }
      } else if (e.key === "ArrowRight") {
        if (currentIndex < nfts.length - 1) {
          onNavigate(currentIndex + 1);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentIndex, nfts.length, onClose, onNavigate]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      onNavigate(currentIndex - 1);
    }
  }, [currentIndex, onNavigate]);

  const handleNext = useCallback(() => {
    if (currentIndex < nfts.length - 1) {
      onNavigate(currentIndex + 1);
    }
  }, [currentIndex, nfts.length, onNavigate]);

  if (!isOpen || !currentNft) return null;

  const imageSrc = currentNft.metadata?.image
    ? currentNft.metadata.image
    : currentNft.imagePath
      ? `${IMAGE_BASE_URL}/${currentNft.imagePath}`
      : "/logo.png";
  const isBase64 = imageSrc.startsWith("data:");

  // Extract stats from attributes or formatted fields
  const tier = currentNft.tier || "-";
  const level = currentNft.level || "-";
  const beastType = currentNft.beastType || "-";
  const power = currentNft.power || "-";
  const health = currentNft.health || "-";
  const rank = currentNft.rank || "-";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl mx-4 bg-black/95 border-2 border-[rgb(50,255,52)]/60 rounded-2xl shadow-[0_0_40px_rgba(50,255,52,0.2)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgb(50,255,52)]/30">
          <h2 className="text-xl font-orbitron uppercase tracking-wider text-white">
            {currentNft.metadataName || `Beast #${currentNft.tokenId}`}
          </h2>
          <div className="flex items-center gap-4">
            {/* Navigation - only show when more than 1 item */}
            {nfts.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-[rgb(186,255,188)]/70 font-orbitron">
                  {currentIndex + 1} OF {nfts.length}
                </span>
                <button
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-[rgb(50,255,52)]/40 text-[rgb(50,255,52)] hover:bg-[rgb(50,255,52)]/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M12.5 15L7.5 10L12.5 5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <button
                  onClick={handleNext}
                  disabled={currentIndex === nfts.length - 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-[rgb(50,255,52)]/40 text-[rgb(50,255,52)] hover:bg-[rgb(50,255,52)]/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M7.5 15L12.5 10L7.5 5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            )}
            {/* Close button */}
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-[rgb(50,255,52)]/40 text-[rgb(50,255,52)] hover:bg-[rgb(50,255,52)]/20 transition-all"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                <path
                  d="M15 5L5 15M5 5L15 15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col md:flex-row gap-6 p-6">
          {/* Beast Image */}
          <div className="flex-shrink-0 flex items-center justify-center">
            <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-xl overflow-hidden">
              {isBase64 ? (
                <img
                  src={imageSrc}
                  alt={currentNft.metadataName || `NFT ${currentNft.tokenId}`}
                  className="w-full h-full object-contain"
                />
              ) : (
                <Image
                  src={imageSrc}
                  alt={currentNft.metadataName || `NFT ${currentNft.tokenId}`}
                  fill
                  className="object-contain"
                  unoptimized
                />
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex-1 min-w-0 flex flex-col gap-4 overflow-hidden">
            {/* Beast Name & Type */}
            <div className="text-center md:text-left">
              <p className="text-2xl font-orbitron text-[rgb(50,255,52)]">
                {currentNft.beastName || "Unknown Beast"}
              </p>
              <p className="text-sm text-[rgb(186,255,188)]/70">
                Token ID: {(() => {
                  const tokenId = currentNft.tokenId;
                  if (tokenId.startsWith("0x") || tokenId.startsWith("0X")) {
                    return parseInt(tokenId, 16);
                  }
                  return tokenId;
                })()}
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col items-center p-2 rounded-xl border border-[rgb(50,255,52)]/30 bg-[rgb(50,255,52)]/5 min-w-0">
                <span className="text-[10px] font-orbitron uppercase tracking-wider text-[rgb(186,255,188)]/50">
                  Tier
                </span>
                <span className="text-xl font-bold text-white">{tier}</span>
              </div>
              <div className="flex flex-col items-center p-2 rounded-xl border border-[rgb(50,255,52)]/30 bg-[rgb(50,255,52)]/5 min-w-0">
                <span className="text-[10px] font-orbitron uppercase tracking-wider text-[rgb(186,255,188)]/50">
                  Level
                </span>
                <span className="text-xl font-bold text-white">{level}</span>
              </div>
              <div className="flex flex-col items-center p-2 rounded-xl border border-[rgb(50,255,52)]/30 bg-[rgb(50,255,52)]/5 min-w-0">
                <span className="text-[10px] font-orbitron uppercase tracking-wider text-[rgb(186,255,188)]/50">
                  Type
                </span>
                <span className="text-base font-bold text-white truncate max-w-full">{beastType}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col items-center p-2 rounded-xl border border-[rgb(50,255,52)]/30 bg-[rgb(50,255,52)]/5 min-w-0">
                <span className="text-[10px] font-orbitron uppercase tracking-wider text-[rgb(186,255,188)]/50">
                  Power
                </span>
                <span className="text-xl font-bold text-[rgb(50,255,52)]">{power}</span>
              </div>
              <div className="flex flex-col items-center p-2 rounded-xl border border-[rgb(50,255,52)]/30 bg-[rgb(50,255,52)]/5 min-w-0">
                <span className="text-[10px] font-orbitron uppercase tracking-wider text-[rgb(186,255,188)]/50">
                  Health
                </span>
                <span className="text-xl font-bold text-[rgb(255,100,100)]">{health}</span>
              </div>
              <div className="flex flex-col items-center p-2 rounded-xl border border-[rgb(50,255,52)]/30 bg-[rgb(50,255,52)]/5 min-w-0">
                <span className="text-[10px] font-orbitron uppercase tracking-wider text-[rgb(186,255,188)]/50">
                  Rank
                </span>
                <span className="text-xl font-bold text-[rgb(255,215,0)]">{rank}</span>
              </div>
            </div>

            {/* Special Badges - Shiny, Animated, Genesis */}
            {currentNft.attributes && currentNft.attributes.length > 0 && (() => {
              const specialAttrs = ["Shiny", "Animated", "Genesis"];
              const activeBadges = currentNft.attributes.filter(
                (attr) =>
                  specialAttrs.includes(attr.trait_type) &&
                  (attr.value === "true" || attr.value === 1 || Number(attr.value) > 0)
              );

              if (activeBadges.length === 0) return null;

              return (
                <div className="flex flex-wrap gap-2">
                  {activeBadges.map((attr) => (
                    <span
                      key={attr.trait_type}
                      className={`px-3 py-1 rounded-full text-xs font-orbitron uppercase tracking-wider ${
                        attr.trait_type === "Shiny"
                          ? "bg-[rgb(255,215,0)]/20 text-[rgb(255,215,0)] border border-[rgb(255,215,0)]/40"
                          : attr.trait_type === "Animated"
                          ? "bg-[rgb(138,43,226)]/20 text-[rgb(186,85,255)] border border-[rgb(138,43,226)]/40"
                          : "bg-[rgb(50,255,52)]/20 text-[rgb(50,255,52)] border border-[rgb(50,255,52)]/40"
                      }`}
                    >
                      {attr.trait_type}
                    </span>
                  ))}
                </div>
              );
            })()}

            {/* Additional Attributes */}
            {currentNft.attributes && currentNft.attributes.length > 0 && (
              <div className="mt-2">
                <p className="text-[10px] font-orbitron uppercase tracking-wider text-[rgb(186,255,188)]/50 mb-2">
                  Attributes
                </p>
                <div className="flex flex-wrap gap-2">
                  {currentNft.attributes
                    .filter((attr) => {
                      // Exclude stats already shown, special badges, and false boolean values
                      const excludedTypes = [
                        "Tier", "Level", "Type", "Power", "Health", "Rank",
                        "Beast", "Token ID", "Beast ID", "Prefix", "Suffix",
                        "Shiny", "Animated", "Genesis"
                      ];
                      if (excludedTypes.includes(attr.trait_type)) return false;
                      // Hide boolean false values
                      if (attr.value === "false" || attr.value === 0 || attr.value === "0") {
                        return false;
                      }
                      return true;
                    })
                    .slice(0, 6)
                    .map((attr) => {
                      // Format timestamp attributes
                      const isTimestamp = attr.trait_type.toLowerCase().includes("timestamp") ||
                                         attr.trait_type.toLowerCase().includes("date") ||
                                         attr.trait_type.toLowerCase().includes("time");
                      const displayValue = isTimestamp ? formatTimestamp(attr.value) : attr.value;

                      return (
                        <div
                          key={attr.trait_type}
                          className="px-3 py-1.5 rounded-lg border border-[rgb(50,255,52)]/20 bg-[rgb(50,255,52)]/5 text-xs"
                        >
                          <span className="text-[rgb(186,255,188)]/50">{attr.trait_type}:</span>{" "}
                          <span className="text-white">{displayValue}</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Select for Auction Button */}
            {onSelect && (
              <div className="mt-4 pt-4 border-t border-[rgb(50,255,52)]/20">
                <button
                  type="button"
                  onClick={() => onSelect(currentNft.tokenId)}
                  className={`w-full inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-orbitron uppercase tracking-[0.14em] transition ${
                    isSelected
                      ? "border-2 border-[rgb(50,255,52)] bg-[rgb(50,255,52)]/20 text-[rgb(50,255,52)]"
                      : "border border-[rgb(50,255,52)]/60 bg-[rgb(50,255,52)]/10 text-[rgb(50,255,52)] hover:bg-[rgb(50,255,52)]/20"
                  }`}
                >
                  {isSelected ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
                        <path d="m9 12 2 2 4-4" />
                      </svg>
                      Selected for Auction
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="4" />
                        <path d="M12 8v8M8 12h8" />
                      </svg>
                      Select for Auction
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
