/**
 * Adventurer overall rating (Score) from spreadsheet logic.
 * Formula: (attrScore * 0.40) + (weapon * 0.25) + (armorScore * 0.25) + (jewelry * 0.10) + luckBonus.
 * Stats from attributes (Strength, Dexterity, etc.); gear from equipment XP scaled to 0–100.
 */
const ATTR_MAX = 12;
const LUCK_BONUS_PER_POINT = 2;
const LUCK_BONUS_CAP = 10;

/** Attribute weights (Meta Preset) */
const WEIGHTS = {
  str: 0.11,
  dex: 0.3,
  vit: 0.26,
  int: 0.05,
  wis: 0.03,
  cha: 0.24,
} as const;

/** Overall category weights */
const CATEGORY_WEIGHTS = {
  attr: 0.4,
  weapon: 0.25,
  armor: 0.25,
  jewelry: 0.1,
} as const;

function getAttr(
  attrs: Array<{ trait_type: string; value: string | number }>,
  name: string
): number {
  const exact = attrs.find((a) => a.trait_type === name);
  if (exact != null) {
    const v = typeof exact.value === "string" ? parseInt(exact.value, 10) : exact.value;
    return Number.isFinite(v) ? v : 0;
  }
  const lower = name.toLowerCase();
  const ins = attrs.find((a) => (a.trait_type ?? "").toLowerCase() === lower);
  if (ins != null) {
    const v = typeof ins.value === "string" ? parseInt(ins.value, 10) : ins.value;
    return Number.isFinite(v) ? v : 0;
  }
  return 0;
}

/**
 * Calculates the Adventurer Rating (Score) from attributes.
 * Stats: Strength, Dexterity, Vitality, Intelligence, Wisdom, Charisma, Luck.
 * Gear: Weapon XP, Chest XP, Head XP, Waist XP, Hand XP, Foot XP for armor; Neck + Ring XP for jewelry.
 */
/**
 * Calculates the Adventurer Rating (Score) from attributes.
 * Matches spreadsheet: attrScore (0–100), weapon/armor/jewelry (0–100), luckBonus (capped 10).
 */
export function calculateAdventurerRating(
  attrs: Array<{ trait_type: string; value: string | number }>
): number | null {
  const str = getAttr(attrs, "Strength");
  const dex = getAttr(attrs, "Dexterity");
  const vit = getAttr(attrs, "Vitality");
  const int = getAttr(attrs, "Intelligence");
  const wis = getAttr(attrs, "Wisdom");
  const cha = getAttr(attrs, "Charisma");
  const luck = getAttr(attrs, "Luck");

  // 1. Attribute score
  const weightedAttrSum =
    str * WEIGHTS.str +
    dex * WEIGHTS.dex +
    vit * WEIGHTS.vit +
    int * WEIGHTS.int +
    wis * WEIGHTS.wis +
    cha * WEIGHTS.cha;
  const attrScore = (weightedAttrSum / ATTR_MAX) * 100;

  // 2. Gear: Use the XP value directly (assuming 0-100 range). Only scale if raw metadata XP goes up to 512.
  const weapon = getAttr(attrs, "Weapon XP");
  const chest = getAttr(attrs, "Chest XP");
  const head = getAttr(attrs, "Head XP");
  const waist = getAttr(attrs, "Waist XP");
  const hand = getAttr(attrs, "Hand XP");
  const foot = getAttr(attrs, "Foot XP");
  const neck = getAttr(attrs, "Neck XP");
  const ring = getAttr(attrs, "Ring XP");

  // 3. Armor score: average of 5 slots
  const armorScore = (chest + head + waist + hand + foot) / 5;
  const jewelryScore = (neck + ring) / 2;

  // 4. Luck bonus
  const luckBonus = Math.min(luck * LUCK_BONUS_PER_POINT, LUCK_BONUS_CAP);

  // 5. Final Calculation
  const finalRating =
    attrScore * CATEGORY_WEIGHTS.attr +
    weapon * CATEGORY_WEIGHTS.weapon +
    armorScore * CATEGORY_WEIGHTS.armor +
    jewelryScore * CATEGORY_WEIGHTS.jewelry +
    luckBonus;

  return Math.round(finalRating * 100) / 100;
}
