"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { FormattedNFT } from "../lib/types";
import type { ShareResult, ShareCardConfig } from "../lib/types/beast-profile";
import { IMAGE_BASE_URL } from "../lib/constants";
import BeastProfileCard from "./beast-profile-card";
import BeastShareCard from "./beast-share-card";
import AddressDisplay from "./address-display";
import { useBeastOwner } from "../hooks/use-beast-owner";
import { shareToTwitter, copyBeastLink, copyAuctionLink } from "../lib/utils/share-utils";
import { extractBeastStats, generateBeastProfile } from "../lib/utils/tagline-generator";
import { formatUSDSmart } from "../lib/utils";
import InfoTooltip from "./info-tooltip";
import CustomDropdown, { type DropdownOption } from "./custom-dropdown";

// Combat Rating Gauge Component
interface CombatRatingGaugeProps {
  power: number | string;
  health: number | string;
  level: number | string;
  tier: number | string;
  type: string;
  rank: number | string;
  isVisible: boolean;
}

function CombatRatingGauge({ power, health, level, tier, type, rank, isVisible }: CombatRatingGaugeProps) {
  const [animatedRating, setAnimatedRating] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredStat, setHoveredStat] = useState<string | null>(null);

  // Parse values
  const powerNum = typeof power === 'string' ? parseInt(power) || 0 : power;
  const healthNum = typeof health === 'string' ? parseInt(health) || 0 : health;
  const levelNum = typeof level === 'string' ? parseInt(level) || 0 : level;
  const tierNum = typeof tier === 'string' ? parseInt(tier) || 5 : tier;
  const rankNum = typeof rank === 'string' ? parseInt(rank) || 0 : rank;

  // Calculate combat power using tier multiplier from Loot Survivor mechanics
  // Formula: (Level × (6 - Tier)) + Power + Health
  const tierMultiplier = 6 - tierNum;
  const levelPower = levelNum * tierMultiplier;
  const combatRating = Math.round(levelPower + powerNum + healthNum);

  // Max rating for the gauge (T1 Level 50 beast with max stats ~250+200+300 = 750)
  const maxRating = 750;

  // Color and label based on ACTUAL TIER (from Loot Survivor game)
  // T1 = Legendary (Orange), T2 = Epic (Purple), T3 = Rare (Blue), T4 = Uncommon (Green), T5 = Common (White)
  const getTierInfo = (tier: number) => {
    switch (tier) {
      case 1:
        return {
          label: 'LEGENDARY',
          color: { main: 'rgb(255, 165, 0)', glow: 'rgba(255, 165, 0, 0.5)' }, // Orange
        };
      case 2:
        return {
          label: 'EPIC',
          color: { main: 'rgb(186, 85, 255)', glow: 'rgba(186, 85, 255, 0.5)' }, // Purple
        };
      case 3:
        return {
          label: 'RARE',
          color: { main: 'rgb(100, 180, 255)', glow: 'rgba(100, 180, 255, 0.5)' }, // Blue
        };
      case 4:
        return {
          label: 'UNCOMMON',
          color: { main: 'rgb(50, 255, 52)', glow: 'rgba(50, 255, 52, 0.5)' }, // Green
        };
      case 5:
      default:
        return {
          label: 'COMMON',
          color: { main: 'rgb(200, 200, 200)', glow: 'rgba(200, 200, 200, 0.5)' }, // White/Gray
        };
    }
  };

  const tierInfo = getTierInfo(tierNum);
  const color = tierInfo.color;
  const label = tierInfo.label;

  // Animate rating on mount
  useEffect(() => {
    if (!isVisible) {
      setAnimatedRating(0);
      return;
    }

    const duration = 1500;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedRating(Math.round(combatRating * eased));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isVisible, combatRating]);

  // SVG arc calculations
  const size = 180;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * Math.PI; // Half circle
  const animatedPercent = (animatedRating / maxRating) * 100;
  const strokeDashoffset = circumference - (circumference * Math.min(animatedPercent, 100)) / 100;

  const stats = [
    { key: 'power', label: 'PWR', value: powerNum, icon: '⚡', color: 'rgb(50, 255, 52)' },
    { key: 'health', label: 'HP', value: healthNum, icon: '❤️', color: 'rgb(255, 100, 100)' },
    { key: 'level', label: 'LVL', value: levelNum, icon: '📊', color: 'rgb(100, 200, 255)' },
  ];

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Main Gauge */}
      <div
        className="relative cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <svg width={size} height={size / 2 + 30} viewBox={`0 0 ${size} ${size / 2 + 30}`}>
          {/* Background arc */}
          <path
            d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
            fill="none"
            stroke="rgba(50, 255, 52, 0.1)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Animated arc */}
          <path
            d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
            fill="none"
            stroke={color.main}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              transition: 'stroke-dashoffset 0.1s ease-out',
              filter: `drop-shadow(0 0 8px ${color.glow})`,
            }}
          />

          {/* Tick marks */}
          {[0, 25, 50, 75, 100].map((tick, i) => {
            const angle = Math.PI - (tick / 100) * Math.PI;
            const x1 = size / 2 + (radius - 20) * Math.cos(angle);
            const y1 = size / 2 - (radius - 20) * Math.sin(angle);
            const x2 = size / 2 + (radius - 12) * Math.cos(angle);
            const y2 = size / 2 - (radius - 12) * Math.sin(angle);
            return (
              <line
                key={i}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="rgba(186, 255, 188, 0.3)"
                strokeWidth={2}
              />
            );
          })}
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ paddingTop: '10px' }}>
          <span
            className="text-4xl font-bold font-orbitron"
            style={{ color: color.main, textShadow: `0 0 20px ${color.glow}` }}
          >
            {animatedRating}
          </span>
          <span className="text-[10px] font-orbitron uppercase tracking-wider text-[rgb(186,255,188)]/70">
            Combat Power
          </span>
          <span
            className="text-xs font-orbitron uppercase tracking-wider mt-1 px-2 py-0.5 rounded"
            style={{
              color: color.main,
              backgroundColor: `${color.main}20`,
              border: `1px solid ${color.main}40`
            }}
          >
            {label}
          </span>
        </div>

        {/* Hover tooltip */}
        {isHovered && (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full bg-black/95 border border-[rgb(50,255,52)]/40 rounded-lg px-3 py-2 text-xs whitespace-nowrap z-50">
            <div className="text-[rgb(186,255,188)]/70 mb-1">Combat Power Formula:</div>
            <div className="text-white">
              Level×(6-Tier) + Power + Health
            </div>
            <div className="text-[rgb(186,255,188)]/50 mt-1">
              {levelNum}×{tierMultiplier} + {powerNum} + {healthNum}
            </div>
            <div className="text-white">
              = {levelPower} + {powerNum} + {healthNum}
            </div>
            <div className="mt-1 font-bold" style={{ color: color.main }}>= {combatRating} CP</div>
            {/* Arrow */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full">
              <div className="border-8 border-transparent border-t-[rgb(50,255,52)]/40" />
            </div>
          </div>
        )}
      </div>

      {/* Stat breakdown */}
      <div className="flex gap-4">
        {stats.map((stat) => (
          <div
            key={stat.key}
            className="flex flex-col items-center cursor-pointer transition-transform hover:scale-110"
            onMouseEnter={() => setHoveredStat(stat.key)}
            onMouseLeave={() => setHoveredStat(null)}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-lg border-2 transition-all"
              style={{
                borderColor: hoveredStat === stat.key ? stat.color : 'rgba(50, 255, 52, 0.3)',
                backgroundColor: hoveredStat === stat.key ? `${stat.color}20` : 'rgba(50, 255, 52, 0.05)',
                boxShadow: hoveredStat === stat.key ? `0 0 15px ${stat.color}50` : 'none',
              }}
            >
              <span className="text-base">{stat.icon}</span>
            </div>
            <span
              className="text-sm font-bold mt-1"
              style={{ color: stat.color }}
            >
              {stat.value}
            </span>
            <span className="text-[9px] text-[rgb(186,255,188)]/50 uppercase">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Tier & Type badges */}
      <div className="flex gap-2 mt-1">
        <span className="px-3 py-1 rounded-full text-xs font-orbitron uppercase tracking-wider bg-[rgb(255,215,0)]/10 text-[rgb(255,215,0)] border border-[rgb(255,215,0)]/30">
          Tier {tierNum}
        </span>
        <span className="px-3 py-1 rounded-full text-xs font-orbitron uppercase tracking-wider bg-[rgb(50,255,52)]/10 text-[rgb(50,255,52)] border border-[rgb(50,255,52)]/30">
          {type}
        </span>
        <span className="px-3 py-1 rounded-full text-xs font-orbitron uppercase tracking-wider bg-[rgb(186,85,255)]/10 text-[rgb(186,85,255)] border border-[rgb(186,85,255)]/30">
          #{rankNum}
        </span>
      </div>
    </div>
  );
}

// Idle animation styles - injected once
const idleAnimationStyles = `
@keyframes beastIdle {
  0%, 100% {
    transform: translateY(0px) scale(1);
    filter: drop-shadow(0 0 8px rgba(50, 255, 52, 0.3));
  }
  50% {
    transform: translateY(-6px) scale(1.01);
    filter: drop-shadow(0 0 15px rgba(50, 255, 52, 0.5));
  }
}

@keyframes glowPulse {
  0%, 100% {
    box-shadow: 0 0 30px rgba(50, 255, 52, 0.3);
  }
  50% {
    box-shadow: 0 0 45px rgba(50, 255, 52, 0.5), 0 0 60px rgba(50, 255, 52, 0.2);
  }
}

.beast-idle-animation {
  animation: beastIdle 3s ease-in-out infinite;
}

.beast-card-glow {
  animation: glowPulse 3s ease-in-out infinite;
}

.flip-card-inner {
  position: relative;
  width: 100%;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;
  -webkit-transform-style: preserve-3d;
}

.flip-card-inner.flipped {
  transform: rotateY(180deg);
  -webkit-transform: rotateY(180deg);
}

.flip-card-front {
  position: relative;
  width: 100%;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  transform: rotateY(0deg);
  -webkit-transform: rotateY(0deg);
}

.flip-card-back {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  transform: rotateY(180deg);
  -webkit-transform: rotateY(180deg);
}

@keyframes scanline {
  0% {
    transform: translateY(-100%);
  }
  100% {
    transform: translateY(100%);
  }
}
`;

// Particle type for click effects
interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
}

// Custom hook for click particle effects
function useClickParticles(enabled: boolean = true) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const nextId = useRef(0);

  const createParticles = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!enabled) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const colors = [
        "rgb(50, 255, 52)",    // Green
        "rgb(186, 255, 188)",  // Light green
        "rgb(255, 215, 0)",    // Gold
        "rgb(138, 43, 226)",   // Purple
        "rgb(255, 255, 255)",  // White
      ];

      const newParticles: Particle[] = [];
      for (let i = 0; i < 12; i++) {
        const angle = (Math.PI * 2 * i) / 12 + Math.random() * 0.5;
        const speed = 3 + Math.random() * 4;
        newParticles.push({
          id: nextId.current++,
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 4 + Math.random() * 6,
          life: 1,
        });
      }

      setParticles((prev) => [...prev, ...newParticles]);
    },
    [enabled]
  );

  // Animate particles
  useEffect(() => {
    if (particles.length === 0) return;

    const interval = setInterval(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.15, // gravity
            life: p.life - 0.03,
          }))
          .filter((p) => p.life > 0)
      );
    }, 16);

    return () => clearInterval(interval);
  }, [particles.length]);

  const ParticleLayer = useCallback(
    () => (
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              opacity: p.life,
              transform: "translate(-50%, -50%)",
              boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
            }}
          />
        ))}
      </div>
    ),
    [particles]
  );

  return { createParticles, ParticleLayer };
}

// Custom hook for 3D tilt effect
function useTilt(intensity: number = 15, enabled: boolean = true) {
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const [style, setStyle] = useState({
    transform: "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
    transition: "transform 0.1s ease-out",
  });
  const [glareStyle, setGlareStyle] = useState({
    background: "transparent",
    opacity: 0,
  });

  // Use callback ref to track when element is attached
  const ref = useCallback((node: HTMLDivElement | null) => {
    setElement(node);
  }, []);

  useEffect(() => {
    if (!element || !enabled) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -intensity;
      const rotateY = ((x - centerX) / centerX) * intensity;

      // Calculate glare position
      const glareX = (x / rect.width) * 100;
      const glareY = (y / rect.height) * 100;

      setStyle({
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`,
        transition: "transform 0.1s ease-out",
      });

      setGlareStyle({
        background: `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 30%, transparent 60%)`,
        opacity: 1,
      });
    };

    const handleMouseLeave = () => {
      setStyle({
        transform: "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
        transition: "transform 0.3s ease-out",
      });
      setGlareStyle({
        background: "transparent",
        opacity: 0,
      });
    };

    element.addEventListener("mousemove", handleMouseMove);
    element.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      element.removeEventListener("mousemove", handleMouseMove);
      element.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [element, enabled, intensity]);

  return { ref, style, glareStyle };
}

/** Auction data for bid/offer functionality */
interface AuctionBidData {
  startingPrice: number; // In USDC (already divided by 1e6)
  highestBid?: number; // In USDC (already divided by 1e6)
  status: string;
  endTime: string;
  isUserSeller: boolean;
}

/** Bid state from parent component */
interface BidState {
  bidAmount: string;
  isSubmitting: boolean;
  isSubmittingOffer: boolean;
  hasActiveOffer: boolean;
  account: boolean; // whether user is connected
  paymentToken: string; // currently selected payment token address
  tokenSymbol: string; // symbol of selected token (e.g., "USDC", "ETH")
  insufficientFundsError?: string; // error message when user doesn't have enough funds
}

interface BeastDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  nfts: FormattedNFT[];
  currentIndex: number;
  onNavigate: (index: number) => void;
  onSelect?: (tokenId: string) => void;
  isSelected?: boolean;
  /** When viewing beasts in an auction context, copy the auction link instead of beast link */
  auctionId?: string;
  /** Auction data for displaying bid info and enabling bid/offer actions */
  auctionBidData?: AuctionBidData;
  /** Current bid state from parent */
  bidState?: BidState;
  /** Token options for payment selector */
  tokenOptions?: DropdownOption[];
  /** Callback when bid amount changes */
  onBidAmountChange?: (amount: string) => void;
  /** Callback when payment token changes */
  onPaymentTokenChange?: (token: string) => void;
  /** Callback to place a bid */
  onPlaceBid?: () => void;
  /** Callback to make an offer */
  onMakeOffer?: () => void;
  /** Callback to open wallet modal */
  onOpenWallet?: () => void;
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
  auctionId,
  auctionBidData,
  bidState,
  tokenOptions,
  onBidAmountChange,
  onPaymentTokenChange,
  onPlaceBid,
  onMakeOffer,
  onOpenWallet,
}: BeastDetailModalProps) {
  const currentNft = nfts[currentIndex];

  // Fetch the owner of the current beast
  const { owner: beastOwner, isLoading: isOwnerLoading } = useBeastOwner({
    tokenId: currentNft?.tokenId || null,
    skip: !isOpen || !currentNft,
  });

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

  // Inject idle animation styles
  useEffect(() => {
    const styleId = "beast-idle-animation-styles";
    if (!document.getElementById(styleId)) {
      const styleElement = document.createElement("style");
      styleElement.id = styleId;
      styleElement.textContent = idleAnimationStyles;
      document.head.appendChild(styleElement);
    }
  }, []);

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

  // Mobile swipe gesture support
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const minSwipeDistance = 50; // Minimum distance for a swipe

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const deltaX = touchEndX - touchStartX.current;
    const deltaY = touchEndY - touchStartY.current;

    // Only trigger swipe if horizontal movement is greater than vertical
    // This prevents swipe from triggering during scroll
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        // Swipe right -> go to previous
        handlePrev();
      } else {
        // Swipe left -> go to next
        handleNext();
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  }, [handlePrev, handleNext]);

  // 3D Tilt effect for the beast card - must be called before any early returns
  const { ref: tiltRef, style: tiltStyle, glareStyle } = useTilt(20, isOpen);

  // Click particles effect - must be called before any early returns
  const { createParticles, ParticleLayer } = useClickParticles(isOpen);

  // Flip card state - must be called before any early returns
  const [isFlipped, setIsFlipped] = useState(false);

  // Share functionality state (T026-T028)
  const [isSharing, setIsSharing] = useState(false);
  const [shareResult, setShareResult] = useState<ShareResult | null>(null);
  const shareCardRef = useRef<HTMLDivElement>(null);

  // Copy Link state
  const [linkCopied, setLinkCopied] = useState(false);

  // Reset flip state, share result, and link copied when navigating or closing
  useEffect(() => {
    setIsFlipped(false);
    setShareResult(null);
    setLinkCopied(false);
  }, [currentIndex, isOpen]);

  // Clear link copied feedback after 3 seconds
  useEffect(() => {
    if (linkCopied) {
      const timer = setTimeout(() => setLinkCopied(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [linkCopied]);

  // Copy Link handler - copies auction link when in auction context, otherwise beast link
  const handleCopyLink = useCallback(async () => {
    if (!currentNft) return;
    // If viewing in auction context, copy the auction link so recipient sees all beasts
    const success = auctionId
      ? await copyAuctionLink(auctionId)
      : await copyBeastLink(currentNft.tokenId);
    setLinkCopied(success);
  }, [currentNft, auctionId]);

  // Clear share result feedback after 4 seconds
  useEffect(() => {
    if (shareResult) {
      const timer = setTimeout(() => setShareResult(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [shareResult]);

  // T027: Share button click handler with fallback chain
  const handleShare = useCallback(async () => {
    if (!currentNft || !shareCardRef.current) return;

    setIsSharing(true);
    setShareResult(null);

    try {
      // Generate share card config from NFT
      const stats = extractBeastStats(currentNft);
      const profile = generateBeastProfile(stats);

      const config: ShareCardConfig = {
        beastName: stats.beastName,
        fullName: profile.fullName,
        tagline: profile.tagline,
        tier: stats.tier,
        percentileDisplay: profile.percentileDisplay,
        beastType: stats.beastType,
        beastArtUrl: currentNft.metadata?.image ||
          (currentNft.imagePath ? `${IMAGE_BASE_URL}/${currentNft.imagePath}` : undefined),
      };

      const result = await shareToTwitter(shareCardRef.current, config);
      setShareResult(result);
    } catch (error) {
      console.error("Share failed:", error);
      setShareResult({
        status: "error",
        error: error instanceof Error ? error : new Error("Share failed"),
      });
    } finally {
      setIsSharing(false);
    }
  }, [currentNft]);

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-black/95 border-2 border-[rgb(50,255,52)]/60 rounded-2xl shadow-[0_0_40px_rgba(50,255,52,0.2)] my-auto"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between px-4 md:px-6 py-3 md:py-4 border-b border-[rgb(50,255,52)]/30 gap-2 md:gap-0">
          {/* Title row - with close button on mobile */}
          <div className="flex items-center justify-between md:justify-start">
            <h2 className="text-base md:text-xl font-orbitron uppercase tracking-wider text-white truncate max-w-[200px] md:max-w-none">
              {currentNft.metadataName || `Beast #${currentNft.tokenId}`}
            </h2>
            {/* Close button - mobile only position */}
            <button
              onClick={onClose}
              className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg border border-[rgb(50,255,52)]/40 text-[rgb(50,255,52)] hover:bg-[rgb(50,255,52)]/20 transition-all"
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

          {/* Navigation controls */}
          <div className="flex items-center justify-center md:justify-end gap-2 md:gap-4">
            {/* Navigation - only show when more than 1 item */}
            {nfts.length > 1 && (
              <div className="flex items-center gap-2 md:gap-3">
                {/* Prev button */}
                <button
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  title="Previous beast (← arrow key)"
                  className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full border-2 border-[rgb(50,255,52)]/60 bg-[rgb(50,255,52)]/10 text-[rgb(50,255,52)] hover:bg-[rgb(50,255,52)]/30 hover:border-[rgb(50,255,52)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M12.5 15L7.5 10L12.5 5"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                {/* Counter with swipe hint on mobile */}
                <div className="flex flex-col items-center">
                  <span className="text-xs md:text-sm text-white font-orbitron bg-[rgb(50,255,52)]/10 px-2 md:px-3 py-1 rounded-full border border-[rgb(50,255,52)]/30 whitespace-nowrap">
                    {currentIndex + 1} OF {nfts.length}
                  </span>
                  {/* Mobile swipe hint */}
                  <span className="text-[8px] text-[rgb(186,255,188)]/40 font-orbitron uppercase tracking-wider md:hidden mt-0.5">
                    Swipe to navigate
                  </span>
                </div>
                {/* Next button */}
                <button
                  onClick={handleNext}
                  disabled={currentIndex === nfts.length - 1}
                  title="Next beast (→ arrow key)"
                  className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full border-2 border-[rgb(50,255,52)]/60 bg-[rgb(50,255,52)]/10 text-[rgb(50,255,52)] hover:bg-[rgb(50,255,52)]/30 hover:border-[rgb(50,255,52)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M7.5 15L12.5 10L7.5 5"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            )}
            {/* Close button - desktop only position */}
            <button
              onClick={onClose}
              className="hidden md:flex w-8 h-8 items-center justify-center rounded-lg border border-[rgb(50,255,52)]/40 text-[rgb(50,255,52)] hover:bg-[rgb(50,255,52)]/20 transition-all"
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
          {/* Beast Image with 3D Tilt Effect and Flip */}
          <div className="flex-shrink-0 flex flex-col items-center justify-start gap-2">
            <div
              ref={tiltRef}
              className="relative rounded-xl cursor-pointer border-2 border-[rgb(50,255,52)]/40 beast-card-glow"
              style={{
                ...tiltStyle,
                transformStyle: "preserve-3d",
                WebkitTransformStyle: "preserve-3d",
                perspective: "1000px",
                WebkitPerspective: "1000px",
                width: "280px",
              }}
              onClick={createParticles}
              onDoubleClick={() => setIsFlipped(!isFlipped)}
            >
              {/* Flip card inner container */}
              <div className={`flip-card-inner ${isFlipped ? "flipped" : ""}`}>
                {/* Front face - Beast Image */}
                <div className="flip-card-front rounded-xl overflow-hidden">
                  {/* Click particles layer */}
                  <ParticleLayer />
                  {/* Holographic glare overlay */}
                  <div
                    className="absolute inset-0 z-10 pointer-events-none rounded-xl transition-opacity duration-200"
                    style={{
                      ...glareStyle,
                      mixBlendMode: "overlay",
                    }}
                  />
                  {/* Shine effect on edges */}
                  <div
                    className="absolute inset-0 z-10 pointer-events-none rounded-xl"
                    style={{
                      background: "linear-gradient(135deg, rgba(50,255,52,0.1) 0%, transparent 50%, rgba(50,255,52,0.05) 100%)",
                    }}
                  />
                  {isBase64 ? (
                    <img
                      src={imageSrc}
                      alt={currentNft.metadataName || `NFT ${currentNft.tokenId}`}
                      className="w-full h-auto beast-idle-animation"
                    />
                  ) : (
                    <Image
                      src={imageSrc}
                      alt={currentNft.metadataName || `NFT ${currentNft.tokenId}`}
                      width={280}
                      height={400}
                      className="w-full h-auto beast-idle-animation"
                      unoptimized
                    />
                  )}
                </div>

                {/* Back face - Beast Profile */}
                <div className="flip-card-back rounded-xl overflow-hidden bg-gradient-to-br from-black via-[rgb(10,30,10)] to-black border-2 border-[rgb(50,255,52)]/40">
                  {/* Decorative corner elements */}
                  <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-[rgb(50,255,52)]/50 z-10" />
                  <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-[rgb(50,255,52)]/50 z-10" />
                  <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-[rgb(50,255,52)]/50 z-10" />
                  <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-[rgb(50,255,52)]/50 z-10" />

                  {/* Beast Profile Card Content */}
                  <BeastProfileCard nft={currentNft} />

                  {/* Animated scan line */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: "linear-gradient(transparent 0%, rgba(50,255,52,0.03) 50%, transparent 100%)",
                      animation: "scanline 3s linear infinite",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Flip button and icon actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFlipped(!isFlipped)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[rgb(50,255,52)]/40 bg-[rgb(50,255,52)]/10 text-[rgb(50,255,52)] hover:bg-[rgb(50,255,52)]/20 transition-all text-xs font-orbitron uppercase tracking-wider"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                  <path d="M21 3v5h-5" />
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                  <path d="M3 21v-5h5" />
                </svg>
                {isFlipped ? "View Beast" : "View Lore"}
              </button>

              {/* Icon-only action buttons */}
              <div className="flex items-center gap-1">
                {/* Copy Link button (icon only) */}
                <button
                  onClick={handleCopyLink}
                  aria-label={auctionId ? "Copy link to this auction" : "Copy link to this beast"}
                  title={linkCopied ? "Copied!" : (auctionId ? "Copy Auction Link" : "Copy Link")}
                  className={`flex items-center justify-center w-8 h-8 rounded-lg border transition-all ${
                    linkCopied
                      ? "border-green-500/60 bg-green-500/20 text-green-400"
                      : "border-[rgb(50,255,52)]/40 bg-[rgb(50,255,52)]/10 text-[rgb(50,255,52)] hover:bg-[rgb(50,255,52)]/20"
                  }`}
                >
                  {linkCopied ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                  )}
                </button>

                {/* Share button (icon only) - only visible when flipped to profile */}
                {isFlipped && (
                  <button
                    onClick={handleShare}
                    disabled={isSharing}
                    aria-label="Share beast profile to Twitter"
                    title="Share to Twitter"
                    className={`flex items-center justify-center w-8 h-8 rounded-lg border transition-all ${
                      isSharing
                        ? "cursor-wait border-white/20 bg-white/5 text-white/50"
                        : "border-[rgb(50,255,52)]/40 bg-[rgb(50,255,52)]/10 text-[rgb(50,255,52)] hover:bg-[rgb(50,255,52)]/20"
                    }`}
                  >
                    {isSharing ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Share result feedback */}
            {shareResult && (
              <div
                className={`rounded-md px-3 py-1.5 text-xs ${
                  shareResult.status === "shared"
                    ? "bg-green-500/20 text-green-400"
                    : shareResult.status === "copied"
                      ? "bg-green-500/20 text-green-400"
                      : shareResult.status === "downloaded"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : shareResult.status === "error"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-gray-500/20 text-gray-400"
                }`}
              >
                {shareResult.status === "shared" && "Shared successfully!"}
                {shareResult.status === "copied" && "Image copied! Paste (Ctrl+V) in Twitter"}
                {shareResult.status === "downloaded" && "Image downloaded! Upload to Twitter"}
                {shareResult.status === "cancelled" && "Share cancelled"}
                {shareResult.status === "error" && "Share failed. Try again."}
              </div>
            )}

            <span className="text-[10px] text-[rgb(186,255,188)]/40">or double-click card</span>
          </div>

          {/* Stats */}
          <div className="flex-1 min-w-0 flex flex-col gap-4">
            {/* Beast Name & Owner */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
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
              {/* Owner display */}
              <div className="flex justify-center md:justify-end">
                <span className="text-xs font-orbitron uppercase tracking-wider text-[rgb(186,255,188)]/70 px-3 py-1.5 rounded-lg border border-[rgb(50,255,52)]/30 bg-[rgb(50,255,52)]/5">
                  Owned by{" "}
                  <a
                    href={beastOwner ? `https://voyager.online/contract/${beastOwner}` : "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-[rgb(50,255,52)] hover:underline ${isOwnerLoading ? "animate-pulse" : ""}`}
                    onClick={(e) => !beastOwner && e.preventDefault()}
                  >
                    {isOwnerLoading ? (
                      "..."
                    ) : beastOwner ? (
                      <AddressDisplay address={beastOwner} showFullOnHover={true} />
                    ) : (
                      "Unknown"
                    )}
                  </a>
                </span>
              </div>
            </div>

            {/* Combat Rating Gauge */}
            <CombatRatingGauge
              power={power}
              health={health}
              level={level}
              tier={tier}
              type={beastType}
              rank={rank}
              isVisible={isOpen}
            />

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

            {/* Bid/Offer Section - Only show in auction context with active auction */}
            {auctionId && auctionBidData && bidState && parseInt(auctionBidData.status) === 2 && (
              <div className="mt-4 pt-4 border-t border-[rgb(50,255,52)]/20">
                {/* Price info */}
                <div className="flex flex-wrap gap-3 mb-4">
                  <div className="flex-1 min-w-[100px] rounded-lg border border-[rgb(50,255,52)]/20 bg-[rgb(50,255,52)]/5 px-3 py-2">
                    <p className="text-[10px] font-orbitron uppercase tracking-wider text-[rgb(186,255,188)]/50">
                      Reserve
                    </p>
                    <p className="text-sm font-orbitron text-white">
                      {formatUSDSmart(auctionBidData.startingPrice)}
                    </p>
                  </div>
                  <div className={`flex-1 min-w-[100px] rounded-lg border px-3 py-2 ${
                    auctionBidData.highestBid && auctionBidData.highestBid > 0
                      ? "border-[rgb(50,255,52)]/40 bg-[rgb(50,255,52)]/10"
                      : "border-white/20 bg-white/5"
                  }`}>
                    <p className={`text-[10px] font-orbitron uppercase tracking-wider ${
                      auctionBidData.highestBid && auctionBidData.highestBid > 0
                        ? "text-[rgb(50,255,52)]"
                        : "text-[rgb(186,255,188)]/50"
                    }`}>
                      Highest Bid
                    </p>
                    <p className={`text-sm font-orbitron ${
                      auctionBidData.highestBid && auctionBidData.highestBid > 0
                        ? "text-[rgb(50,255,52)]"
                        : "text-white/50"
                    }`}>
                      {auctionBidData.highestBid && auctionBidData.highestBid > 0
                        ? formatUSDSmart(auctionBidData.highestBid)
                        : "Be first!"}
                    </p>
                  </div>
                </div>

                {/* Bid input and quick bid buttons */}
                {!auctionBidData.isUserSeller && (
                  <>
                    {/* Token selector */}
                    {tokenOptions && tokenOptions.length > 0 && onPaymentTokenChange && (
                      <div className="flex flex-col gap-2 mb-3">
                        <label className="text-[10px] font-orbitron uppercase tracking-wider text-[rgb(186,255,188)]/70">
                          Pay With
                        </label>
                        <CustomDropdown
                          id="modal-payment-token"
                          value={bidState.paymentToken}
                          onChange={onPaymentTokenChange}
                          options={tokenOptions}
                          variant="green"
                          className="w-full"
                        />
                        {bidState.insufficientFundsError && (
                          <p className="text-xs text-red-400">
                            {bidState.insufficientFundsError}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="flex flex-col gap-2 mb-3">
                      <label className="text-[10px] font-orbitron uppercase tracking-wider text-[rgb(186,255,188)]/70">
                        Your Bid ({bidState.tokenSymbol || "USDC"})
                      </label>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min="0"
                        placeholder="Enter amount..."
                        value={bidState.bidAmount}
                        onChange={(e) => onBidAmountChange?.(e.target.value)}
                        className="w-full rounded-lg border border-[rgb(50,255,52)]/40 bg-[rgb(50,255,52)]/5 px-3 py-2 text-sm font-orbitron text-white outline-none transition focus:border-[rgb(50,255,52)] focus:ring-2 focus:ring-[rgb(50,255,52)]/35 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                    </div>

                    {/* Quick bid buttons */}
                    {(() => {
                      const hasHighestBid = auctionBidData.highestBid !== undefined && auctionBidData.highestBid > 0;
                      const basePrice = hasHighestBid
                        ? auctionBidData.highestBid!
                        : auctionBidData.startingPrice;
                      const minBid = basePrice * 1.02;
                      const midBid = basePrice * 1.5;
                      const highBid = basePrice * 2;

                      return (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          <button
                            type="button"
                            onClick={() => onBidAmountChange?.(minBid.toFixed(2))}
                            className="px-2 py-1 text-[9px] font-orbitron uppercase tracking-wider rounded-md border border-[rgb(50,255,52)]/30 bg-[rgb(50,255,52)]/5 text-[rgb(50,255,52)] hover:bg-[rgb(50,255,52)]/15 transition"
                          >
                            +2%
                          </button>
                          <button
                            type="button"
                            onClick={() => onBidAmountChange?.(midBid.toFixed(2))}
                            className="px-2 py-1 text-[9px] font-orbitron uppercase tracking-wider rounded-md border border-[rgb(50,255,52)]/30 bg-[rgb(50,255,52)]/5 text-[rgb(50,255,52)] hover:bg-[rgb(50,255,52)]/15 transition"
                          >
                            1.5x
                          </button>
                          <button
                            type="button"
                            onClick={() => onBidAmountChange?.(highBid.toFixed(2))}
                            className="px-2 py-1 text-[9px] font-orbitron uppercase tracking-wider rounded-md border border-[rgb(50,255,52)]/30 bg-[rgb(50,255,52)]/5 text-[rgb(50,255,52)] hover:bg-[rgb(50,255,52)]/15 transition"
                          >
                            2x
                          </button>
                        </div>
                      );
                    })()}

                    {/* Action buttons */}
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={onPlaceBid}
                          disabled={
                            !bidState.account ||
                            bidState.isSubmitting ||
                            !bidState.bidAmount ||
                            parseFloat(bidState.bidAmount) <= 0
                          }
                          className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-full px-4 h-10 text-xs font-orbitron uppercase tracking-[0.12em] transition whitespace-nowrap ${
                            bidState.account &&
                            !bidState.isSubmitting &&
                            bidState.bidAmount &&
                            parseFloat(bidState.bidAmount) > 0
                              ? "bg-[rgb(50,255,52)] text-black font-bold hover:cursor-pointer hover:bg-[rgb(40,220,42)] shadow-[0_0_12px_rgba(50,255,52,0.4)]"
                              : "border border-white/12 text-[rgb(186,255,188)]/45 cursor-not-allowed"
                          }`}
                        >
                          <span>{bidState.isSubmitting ? "..." : "Place Bid"}</span>
                          {!bidState.isSubmitting && (
                            <InfoTooltip content="Compete in the auction. Your bid must be higher than the current highest bid." />
                          )}
                        </button>
                        {!bidState.hasActiveOffer && (
                          <button
                            type="button"
                            onClick={onMakeOffer}
                            disabled={
                              !bidState.account ||
                              bidState.isSubmittingOffer ||
                              !bidState.bidAmount ||
                              parseFloat(bidState.bidAmount) <= 0
                            }
                            className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-full px-4 h-10 text-xs font-orbitron uppercase tracking-[0.12em] transition whitespace-nowrap ${
                              bidState.account &&
                              !bidState.isSubmittingOffer &&
                              bidState.bidAmount &&
                              parseFloat(bidState.bidAmount) > 0
                                ? "border border-blue-500 bg-blue-500/10 text-blue-500 hover:cursor-pointer hover:bg-blue-500 hover:text-black"
                                : "border border-white/12 text-[rgb(186,255,188)]/45 cursor-not-allowed"
                            }`}
                          >
                            <span>{bidState.isSubmittingOffer ? "..." : "Make Offer"}</span>
                            {!bidState.isSubmittingOffer && (
                              <InfoTooltip content="Make a direct buyout offer to the seller. If accepted, the auction ends immediately." />
                            )}
                          </button>
                        )}
                      </div>

                      {/* Connect wallet prompt */}
                      {!bidState.account && (
                        <button
                          type="button"
                          onClick={onOpenWallet}
                          className="text-xs text-center text-[rgb(50,255,52)]/80 font-orbitron animate-pulse hover:text-[rgb(50,255,52)] hover:underline cursor-pointer transition-colors"
                        >
                          Connect wallet to place a bid →
                        </button>
                      )}
                    </div>
                  </>
                )}

                {/* Seller notice */}
                {auctionBidData.isUserSeller && (
                  <div className="text-center py-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10">
                    <p className="text-xs font-orbitron text-yellow-400">
                      You are the seller of this auction
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Hidden Share Card for image generation (T024-T025) */}
        {currentNft && (() => {
          try {
            const stats = extractBeastStats(currentNft);
            const profile = generateBeastProfile(stats);
            const config: ShareCardConfig = {
              beastName: stats.beastName,
              fullName: profile.fullName,
              tagline: profile.tagline,
              tier: stats.tier,
              percentileDisplay: profile.percentileDisplay,
              beastType: stats.beastType,
              beastArtUrl: currentNft.metadata?.image ||
                (currentNft.imagePath ? `${IMAGE_BASE_URL}/${currentNft.imagePath}` : undefined),
            };
            return (
              <div
                className="fixed pointer-events-none"
                style={{ left: "-9999px", top: "-9999px" }}
                aria-hidden="true"
              >
                <BeastShareCard ref={shareCardRef} config={config} />
              </div>
            );
          } catch {
            return null;
          }
        })()}
      </div>
    </div>
  );
}
