/**
 * Beast Lore - Tagline Templates
 * T007: Predefined tagline templates with conditions for selection
 *
 * Templates are evaluated in priority order (highest first).
 * Total: 17 templates covering all stat combinations.
 */

import type { TaglineTemplate, BeastStats } from "../types/beast-profile";

/**
 * Default tagline templates.
 * Ordered by priority (will be sorted on use).
 */
export const TAGLINE_TEMPLATES: TaglineTemplate[] = [
  // ============================================================================
  // Kill Count - Extreme (Priority 100-90)
  // ============================================================================
  {
    id: "kills_extinction",
    condition: (s: BeastStats) => s.adventurersKilled >= 100,
    template: "{kills} souls claimed. A walking extinction event.",
    priority: 100,
    variables: ["adventurersKilled"],
  },
  {
    id: "kills_massacre",
    condition: (s: BeastStats) => s.adventurersKilled >= 50,
    template: "{kills} adventurers entered. None returned.",
    priority: 90,
    variables: ["adventurersKilled"],
  },

  // ============================================================================
  // Kill Count - Medium (Priority 80-70)
  // ============================================================================
  {
    id: "kills_veteran",
    condition: (s: BeastStats) => s.adventurersKilled >= 25,
    template: "{kills} graves and counting. The hunger never stops.",
    priority: 80,
    variables: ["adventurersKilled"],
  },
  {
    id: "kills_blooded",
    condition: (s: BeastStats) => s.adventurersKilled >= 10,
    template: "{kills} have fallen. You could be next.",
    priority: 75,
    variables: ["adventurersKilled"],
  },
  {
    id: "kills_first_blood",
    condition: (s: BeastStats) => s.adventurersKilled >= 1,
    template: "Blood has been drawn. {kills} learned the hard way.",
    priority: 70,
    variables: ["adventurersKilled"],
  },

  // ============================================================================
  // Combat Style (Priority 60-55)
  // ============================================================================
  {
    id: "style_glass_cannon",
    condition: (s: BeastStats) => s.power / s.health > 1.5,
    template: "Fragile. Deadly. Choose wisely.",
    priority: 60,
    variables: [],
  },
  {
    id: "style_tank",
    condition: (s: BeastStats) => s.health / s.power > 2,
    template: "You'll tire long before I fall.",
    priority: 55,
    variables: [],
  },

  // ============================================================================
  // Level (Priority 50-45)
  // ============================================================================
  {
    id: "level_ancient",
    condition: (s: BeastStats) => s.level >= 50,
    template: "Level {level}. Ancient. Patient. Inevitable.",
    priority: 50,
    variables: ["level"],
  },
  {
    id: "level_veteran",
    condition: (s: BeastStats) => s.level >= 30,
    template: "Level {level}. Experience is the cruelest teacher.",
    priority: 45,
    variables: ["level"],
  },

  // ============================================================================
  // Tier (Priority 40-35)
  // ============================================================================
  {
    id: "tier_legendary",
    condition: (s: BeastStats) => s.tier === 1,
    template: "Legendary. Legends don't die. They wait.",
    priority: 40,
    variables: [],
  },
  {
    id: "tier_epic",
    condition: (s: BeastStats) => s.tier === 2,
    template: "Epic for a reason.",
    priority: 35,
    variables: [],
  },

  // ============================================================================
  // Special Traits (Priority 30-20)
  // ============================================================================
  {
    id: "special_genesis",
    condition: (s: BeastStats) => s.isGenesis,
    template: "Genesis. The first of its kind.",
    priority: 30,
    variables: [],
  },
  {
    id: "special_shiny",
    condition: (s: BeastStats) => s.isShiny,
    template: "Shiny. Radiance hides the danger.",
    priority: 25,
    variables: [],
  },
  {
    id: "special_animated",
    condition: (s: BeastStats) => s.isAnimated,
    template: "Animated. Never still. Always watching.",
    priority: 20,
    variables: [],
  },

  // ============================================================================
  // Zero Kills (Priority 10)
  // ============================================================================
  {
    id: "kills_zero",
    condition: (s: BeastStats) => s.adventurersKilled === 0,
    template: "Waiting. Watching. Your move.",
    priority: 10,
    variables: [],
  },

  // ============================================================================
  // Combat Power Based (Priority 8)
  // ============================================================================
  {
    id: "power_elite",
    condition: (s: BeastStats) => {
      const cp = s.level * (6 - s.tier) + s.power + s.health;
      return cp >= 500;
    },
    template: "Combat Power {combatPower}. Fear is earned.",
    priority: 8,
    variables: ["combatPower"],
  },

  // ============================================================================
  // Fallback (Priority 1)
  // ============================================================================
  {
    id: "fallback_default",
    condition: () => true,
    template: "A {beastType} of the realm. Approach with caution.",
    priority: 1,
    variables: ["beastType"],
  },
];

/**
 * Get templates sorted by priority (highest first).
 */
export function getSortedTemplates(): TaglineTemplate[] {
  return [...TAGLINE_TEMPLATES].sort((a, b) => b.priority - a.priority);
}

/**
 * Total number of unique tagline variations.
 * Used to verify we meet SC-005 (at least 10 variations).
 */
export const TAGLINE_COUNT = TAGLINE_TEMPLATES.length; // 17 templates

/**
 * Total variants per species (constant for all 75 species)
 */
export const TOTAL_VARIANTS_PER_SPECIES = 1243;
