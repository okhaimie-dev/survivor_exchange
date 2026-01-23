/**
 * Beast Lore - Tagline Generation Utilities
 * T008-T012: Core functions for generating beast profiles and taglines
 */

import type {
  BeastStats,
  BeastProfile,
  TaglineTemplate,
} from "../types/beast-profile";
import type { FormattedNFT } from "../types/nft";
import {
  getSortedTemplates,
  TOTAL_VARIANTS_PER_SPECIES,
} from "../constants/taglines";

/**
 * T012: Extract BeastStats from FormattedNFT
 * Converts the existing NFT format to the BeastStats interface needed for profile generation.
 */
export function extractBeastStats(nft: FormattedNFT): BeastStats {
  const getAttribute = (traitType: string): string | undefined => {
    const attr = nft.attributes.find(
      (a) => a.trait_type.toLowerCase() === traitType.toLowerCase()
    );
    return attr ? String(attr.value) : undefined;
  };

  // Parse numeric values with fallbacks
  const tier = parseInt(nft.tier || getAttribute("Tier") || "5", 10);
  const level = parseInt(nft.level || getAttribute("Level") || "19", 10);
  const power = parseInt(nft.power || getAttribute("Power") || "0", 10);
  const health = parseInt(nft.health || getAttribute("Health") || "0", 10);
  const rank = parseInt(nft.rank || getAttribute("Rank") || "1", 10);

  // Parse kill count
  const adventurersKilledStr = getAttribute("Adventurers Killed") || "0";
  const adventurersKilled = parseInt(adventurersKilledStr, 10) || 0;

  // Parse special traits
  const isShiny =
    getAttribute("Shiny")?.toLowerCase() === "yes" ||
    getAttribute("Shiny")?.toLowerCase() === "true";
  const isAnimated =
    getAttribute("Animated")?.toLowerCase() === "yes" ||
    getAttribute("Animated")?.toLowerCase() === "true";
  const isGenesis =
    getAttribute("Genesis")?.toLowerCase() === "yes" ||
    getAttribute("Genesis")?.toLowerCase() === "true";

  // Parse beast type
  const beastTypeRaw = nft.beastType || getAttribute("Type") || "Brute";
  const beastType = (
    ["Brute", "Hunter", "Magical"].includes(beastTypeRaw)
      ? beastTypeRaw
      : "Brute"
  ) as "Brute" | "Hunter" | "Magical";

  // Parse prefix and suffix from metadata or name
  const prefix = getAttribute("Prefix") || null;
  const suffix = getAttribute("Suffix") || null;

  return {
    tokenId: nft.tokenId,
    beastId: parseInt(getAttribute("Beast ID") || "1", 10),
    beastName: nft.beastName || getAttribute("Beast") || "Unknown Beast",
    prefix,
    suffix,
    tier,
    level,
    power,
    health,
    rank,
    adventurersKilled,
    isShiny,
    isAnimated,
    isGenesis,
    beastType,
  };
}

/**
 * T011: Calculate percentile display string
 * Shows "Top X%" for top 50%, otherwise shows "#X of 1,243"
 */
export function calculatePercentileDisplay(rank: number): {
  percentile: number;
  percentileDisplay: string;
} {
  const percentile = Math.round((rank / TOTAL_VARIANTS_PER_SPECIES) * 100);

  // For top 50%, show "Top X%"
  // For bottom 50%, just show the rank
  let percentileDisplay: string;
  if (percentile <= 50) {
    percentileDisplay = `#${rank.toLocaleString()} of ${TOTAL_VARIANTS_PER_SPECIES.toLocaleString()} • Top ${percentile}%`;
  } else {
    percentileDisplay = `#${rank.toLocaleString()} of ${TOTAL_VARIANTS_PER_SPECIES.toLocaleString()}`;
  }

  return { percentile, percentileDisplay };
}

/**
 * T009: Substitute variables in a tagline template
 * Replaces {variable} placeholders with actual values from stats.
 */
export function substituteVariables(
  template: string,
  stats: BeastStats,
  combatPower: number
): string {
  const variables: Record<string, string | number> = {
    kills: stats.adventurersKilled,
    power: stats.power,
    health: stats.health,
    level: stats.level,
    tier: stats.tier,
    combatPower: combatPower,
    rank: stats.rank,
    beastName: stats.beastName,
    beastType: stats.beastType,
  };

  return template.replace(/\{(\w+)\}/g, (match, variable) => {
    const value = variables[variable];
    return value !== undefined ? String(value) : match;
  });
}

/**
 * T008: Select the best matching tagline for given stats
 * Evaluates templates in priority order, returns first match.
 */
export function selectTagline(
  stats: BeastStats,
  templates?: TaglineTemplate[]
): { template: TaglineTemplate; rawTemplate: string } {
  const sortedTemplates = templates || getSortedTemplates();

  for (const template of sortedTemplates) {
    try {
      if (template.condition(stats)) {
        return { template, rawTemplate: template.template };
      }
    } catch {
      // Skip templates with evaluation errors
      continue;
    }
  }

  // Fallback should always match, but just in case
  const fallback = sortedTemplates[sortedTemplates.length - 1];
  return { template: fallback, rawTemplate: fallback.template };
}

/**
 * T010: Generate a complete beast profile from raw stats
 * Main function that combines all utilities to produce the profile.
 */
export function generateBeastProfile(stats: BeastStats): BeastProfile {
  // Build full name from prefix + beast name + suffix
  let fullName = "";
  if (stats.prefix) {
    fullName += `"${stats.prefix}" `;
  }
  fullName += stats.beastName;
  if (stats.suffix) {
    fullName += ` "${stats.suffix}"`;
  }

  // Calculate combat power
  const combatPower =
    stats.level * (6 - stats.tier) + stats.power + stats.health;

  // Calculate percentile
  const { percentile, percentileDisplay } = calculatePercentileDisplay(
    stats.rank
  );

  // Select and generate tagline
  const { rawTemplate } = selectTagline(stats);
  const tagline = substituteVariables(rawTemplate, stats, combatPower);

  return {
    fullName,
    tagline,
    rank: stats.rank,
    totalVariants: 1243,
    percentile,
    percentileDisplay,
    combatPower,
  };
}

/**
 * Convenience function to generate profile directly from FormattedNFT
 */
export function generateBeastProfileFromNFT(nft: FormattedNFT): BeastProfile {
  const stats = extractBeastStats(nft);
  return generateBeastProfile(stats);
}
