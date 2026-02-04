/**
 * Decode beast_health from ls009 AdventurerPacked.packed (felt252).
 * Canonical battle inference: in_battle = (beast_health > 0).
 * Layout per Death Mountain: health(10), xp(15), gold(9), beast_health(10), ...
 */

const TWO_POW_10 = BigInt(2) ** BigInt(10);
const TWO_POW_15 = BigInt(2) ** BigInt(15);
const TWO_POW_9 = BigInt(2) ** BigInt(9);

export function decodeBeastHealthFromPacked(packedHex: string | null | undefined): number {
  if (packedHex == null || packedHex === "") return 0;
  let packed: bigint;
  try {
    packed = BigInt(packedHex.trim());
  } catch {
    return 0;
  }
  const divRem = (n: bigint, divisor: bigint): [bigint, bigint] => [n / divisor, n % divisor];
  let rest = packed;
  rest = divRem(rest, TWO_POW_10)[0]; // health
  rest = divRem(rest, TWO_POW_15)[0]; // xp
  rest = divRem(rest, TWO_POW_9)[0];  // gold
  const [_, beast_health] = divRem(rest, TWO_POW_10);
  return Number(beast_health);
}

/** Derive in_battle from attributes array (Beast Health > 0). */
export function getInBattleFromAttributes(
  attributes: Array<{ trait_type: string; value: string }>
): boolean {
  const beast = attributes.find((a) => a.trait_type === "Beast Health");
  return beast ? Number(beast.value) > 0 : false;
}
