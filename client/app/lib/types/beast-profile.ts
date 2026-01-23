/**
 * Beast Lore - Type Definitions
 * T002-T005: Type definitions for beast profile feature
 */

// ============================================================================
// Input Types (from existing GraphQL data)
// ============================================================================

/**
 * Raw beast stats extracted from NFT metadata.
 * T002: BeastStats interface
 */
export interface BeastStats {
  tokenId: string;
  beastId: number;
  beastName: string;
  prefix: string | null;
  suffix: string | null;
  tier: number; // 1-5 (1=Legendary, 5=Common)
  level: number; // 19-100
  power: number;
  health: number;
  rank: number; // 1-1243 within species
  adventurersKilled: number;
  isShiny: boolean;
  isAnimated: boolean;
  isGenesis: boolean;
  beastType: "Brute" | "Hunter" | "Magical";
}

// ============================================================================
// Computed Types
// ============================================================================

/**
 * The computed beast profile displayed on the card back.
 * T003: BeastProfile interface
 */
export interface BeastProfile {
  /** Combined name: `"${prefix}" ${beastName}` or with suffix */
  fullName: string;

  /** Generated tagline with variables substituted */
  tagline: string;

  /** Species rank (1-1243) */
  rank: number;

  /** Total variants per species (always 1243) */
  totalVariants: 1243;

  /** Calculated percentile (0-100) */
  percentile: number;

  /** Display string: "Top 6%" or "#612 of 1,243" */
  percentileDisplay: string;

  /** Combat power: (level * (6 - tier)) + power + health */
  combatPower: number;
}

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * A tagline template with condition for selection.
 * T004: TaglineTemplate interface
 */
export interface TaglineTemplate {
  /** Unique identifier */
  id: string;

  /** Condition function - returns true if this tagline applies */
  condition: (stats: BeastStats) => boolean;

  /** Template string with optional {variable} placeholders */
  template: string;

  /** Priority for evaluation (higher = checked first, 1-100) */
  priority: number;

  /** Variables used in template (for validation) */
  variables: Array<keyof BeastStats | "combatPower">;
}

// ============================================================================
// Share Types
// ============================================================================

/**
 * Configuration for the shareable card image.
 * T005: ShareCardConfig type
 */
export interface ShareCardConfig {
  /** URL to beast image (optional - will show placeholder if missing) */
  beastArtUrl?: string;

  /** Beast's full name */
  fullName: string;

  /** Generated tagline */
  tagline: string;

  /** Rank display text */
  percentileDisplay: string;

  /** Tier for badge color (1-5) */
  tier: number;

  /** Beast type */
  beastType: string;

  /** Species name */
  beastName: string;
}

/**
 * Dimensions for the share card image.
 */
export interface ShareCardDimensions {
  width: 1200;
  height: 675;
}

/**
 * Result of a share attempt.
 * T005: ShareResult type
 */
export type ShareResult =
  | { status: "shared" }
  | { status: "copied"; twitterUrl: string }
  | { status: "downloaded" }
  | { status: "cancelled" }
  | { status: "error"; error: Error };
