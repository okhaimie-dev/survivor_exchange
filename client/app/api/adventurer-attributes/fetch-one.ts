/**
 * Shared logic for fetching adventurer attributes (Torii GraphQL → SQL → RPC).
 * Used by single-token and batch API routes; shared cache reduces duplicate calls.
 */
import { RpcProvider } from 'starknet';
import {
  LS009_ADVENTURER_PACKED_QUERY,
  type Ls009AdventurerPackedResponse,
} from '../../lib/queries/adventurer';
import { BEASTS_GRAPHQL_ENDPOINT } from '../../lib/constants';
import { itemIdToName } from '../../lib/constants/loot';

const TORII_SQL_ENDPOINT = 'https://api.cartridge.gg/x/pg-mainnet-10/torii/sql';
const ADVENTURER_CONTRACT = '0x036017e69d21d6d8c13e266eabb73ef1f1d02722d86bdcabe5f168f8e549d3cd';
const ADVENTURER_GAME_CONTRACT = '0x03fc7ecd6d577daa1ee855a9fa13a914d01acda06715c9fc74f1ee1a5e346a01';
const RPC_URL = 'https://api.cartridge.gg/x/starknet/mainnet';

const cache = new Map<string, { data: { attributes: Array<{ trait_type: string; value: string }>; source: string }; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export type AdventurerAttributesResult = {
  attributes: Array<{ trait_type: string; value: string }>;
  source: string;
};

async function fetchFromToriiGraphQL(tokenId: string): Promise<Array<{ trait_type: string; value: string }>> {
  try {
    const num = tokenId.startsWith('0x') ? BigInt(tokenId) : BigInt(tokenId);
    const adventurerId = num.toString(10);
    const res = await fetch(BEASTS_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: LS009_ADVENTURER_PACKED_QUERY,
        variables: { adventurerId },
      }),
    });
    const json = (await res.json()) as Ls009AdventurerPackedResponse;
    if (json.errors?.length) return [];
    const node = json.data?.ls009AdventurerPackedModels?.edges?.[0]?.node;
    if (!node?.packed) return [];
    const packed = node.packed.trim();
    return decodePackedToAttributes(packed);
  } catch {
    return [];
  }
}

const TWO_POW_10 = BigInt(2) ** BigInt(10);
const TWO_POW_15 = BigInt(2) ** BigInt(15);
const TWO_POW_9 = BigInt(2) ** BigInt(9);
const TWO_POW_4 = BigInt(2) ** BigInt(4);
const TWO_POW_30 = BigInt(2) ** BigInt(30);
const TWO_POW_128 = BigInt(2) ** BigInt(128);
const TWO_POW_16 = BigInt(2) ** BigInt(16);
const TWO_POW_5 = BigInt(32);
const TWO_POW_7 = BigInt(128);
const TWO_POW_9_ITEM = BigInt(512);

function decodePackedToAttributes(packedHex: string): Array<{ trait_type: string; value: string }> {
  const attributes: Array<{ trait_type: string; value: string }> = [];
  let packed: bigint;
  try {
    packed = BigInt(packedHex);
  } catch {
    return [];
  }
  const divRem = (n: bigint, divisor: bigint): [bigint, bigint] => [n / divisor, n % divisor];
  let rest: bigint;
  let health: bigint, xp: bigint, gold: bigint, beast_health: bigint, stat_upgrades_available: bigint;
  let statsPacked: bigint, equipmentPacked: bigint, item_specials_seed: bigint, action_count: bigint;
  [rest, health] = divRem(packed, TWO_POW_10);
  [rest, xp] = divRem(rest, TWO_POW_15);
  [rest, gold] = divRem(rest, TWO_POW_9);
  [rest, beast_health] = divRem(rest, TWO_POW_10);
  [rest, stat_upgrades_available] = divRem(rest, TWO_POW_4);
  [rest, statsPacked] = divRem(rest, TWO_POW_30);
  [rest, equipmentPacked] = divRem(rest, TWO_POW_128);
  [rest, item_specials_seed] = divRem(rest, TWO_POW_16);
  [, action_count] = divRem(rest, TWO_POW_16);
  const healthNum = Number(health);
  attributes.push({ trait_type: 'Health', value: String(healthNum) });
  attributes.push({ trait_type: 'Game Over', value: healthNum === 0 ? 'True' : 'False' });
  attributes.push({ trait_type: 'XP', value: String(xp) });
  attributes.push({ trait_type: 'Score', value: String(xp) });
  attributes.push({ trait_type: 'Gold', value: String(gold) });
  attributes.push({ trait_type: 'Beast Health', value: String(beast_health) });
  attributes.push({ trait_type: 'Stat Upgrades Available', value: String(stat_upgrades_available) });
  const statNames = ['Strength', 'Dexterity', 'Vitality', 'Intelligence', 'Wisdom', 'Charisma'];
  let statsRest = statsPacked;
  for (let i = 0; i < 6; i++) {
    const [next, r] = divRem(statsRest, TWO_POW_5);
    statsRest = next;
    attributes.push({ trait_type: statNames[i], value: String(r) });
  }
  attributes.push({ trait_type: 'Luck', value: '0' });
  const equipmentSlots = ['Weapon', 'Chest', 'Head', 'Waist', 'Foot', 'Hand', 'Neck', 'Ring'];
  for (let i = 0; i < 8; i++) {
    const slotPacked = (equipmentPacked >> BigInt(i * 16)) & BigInt(0xffff);
    const id = Number(divRem(slotPacked, TWO_POW_7)[1]);
    const xpVal = Number(divRem(divRem(slotPacked, TWO_POW_7)[0], TWO_POW_9_ITEM)[1]);
    if (id !== 0) {
      attributes.push({ trait_type: equipmentSlots[i], value: itemIdToName(id) });
      attributes.push({ trait_type: `${equipmentSlots[i]} XP`, value: String(xpVal) });
    }
  }
  attributes.push({ trait_type: 'Item Specials Seed', value: String(item_specials_seed) });
  attributes.push({ trait_type: 'Action Count', value: String(action_count) });
  const xpNum = Number(xp);
  attributes.push({ trait_type: 'Level', value: String(Math.max(1, Math.floor(Math.sqrt(xpNum)) + 1)) });
  return attributes;
}

async function fetchFromContract(tokenId: string): Promise<Array<{ trait_type: string; value: string }>> {
  const provider = new RpcProvider({ nodeUrl: RPC_URL });
  const tokenIdNum = tokenId.startsWith('0x') ? BigInt(tokenId) : BigInt(tokenId);
  const tokenIdHex = '0x' + tokenIdNum.toString(16);
  const result = await provider.callContract({
    contractAddress: ADVENTURER_GAME_CONTRACT,
    entrypoint: 'get_adventurer',
    calldata: [tokenIdHex],
  });
  const attributes: Array<{ trait_type: string; value: string }> = [];
  if (!result || result.length < 30) return attributes;
  const health = BigInt(result[0] || '0x0').toString();
  const healthNum = parseInt(health) || 0;
  attributes.push({ trait_type: 'Health', value: health });
  attributes.push({ trait_type: 'Game Over', value: healthNum === 0 ? 'True' : 'False' });
  const xp = BigInt(result[1] || '0x0').toString();
  attributes.push({ trait_type: 'XP', value: xp });
  attributes.push({ trait_type: 'Score', value: xp });
  attributes.push({ trait_type: 'Gold', value: BigInt(result[2] || '0x0').toString() });
  attributes.push({ trait_type: 'Beast Health', value: BigInt(result[3] || '0x0').toString() });
  attributes.push({ trait_type: 'Stat Upgrades Available', value: BigInt(result[4] || '0x0').toString() });
  const statNames = ['Strength', 'Dexterity', 'Vitality', 'Intelligence', 'Wisdom', 'Charisma', 'Luck'];
  for (let i = 0; i < statNames.length; i++) {
    attributes.push({ trait_type: statNames[i], value: BigInt(result[5 + i] || '0x0').toString() });
  }
  const equipmentSlots = [
    { name: 'Weapon', idIndex: 12, xpIndex: 13 }, { name: 'Chest', idIndex: 14, xpIndex: 15 },
    { name: 'Head', idIndex: 16, xpIndex: 17 }, { name: 'Waist', idIndex: 18, xpIndex: 19 },
    { name: 'Foot', idIndex: 20, xpIndex: 21 }, { name: 'Hand', idIndex: 22, xpIndex: 23 },
    { name: 'Neck', idIndex: 24, xpIndex: 25 }, { name: 'Ring', idIndex: 26, xpIndex: 27 },
  ];
  for (const slot of equipmentSlots) {
    const id = result[slot.idIndex] ? BigInt(result[slot.idIndex]).toString() : '0';
    if (id !== '0') {
      attributes.push({ trait_type: slot.name, value: itemIdToName(id) });
      attributes.push({ trait_type: `${slot.name} XP`, value: result[slot.xpIndex] ? BigInt(result[slot.xpIndex]).toString() : '0' });
    }
  }
  attributes.push({ trait_type: 'Item Specials Seed', value: BigInt(result[28] || '0x0').toString() });
  attributes.push({ trait_type: 'Action Count', value: BigInt(result[29] || '0x0').toString() });
  const level = Math.max(1, Math.floor(Math.sqrt(parseInt(xp) || 0)) + 1);
  attributes.push({ trait_type: 'Level', value: String(level) });
  return attributes;
}

/** Fetch attributes for one token; uses shared cache. */
export async function fetchAttributesForToken(tokenId: string): Promise<AdventurerAttributesResult> {
  const normalizedId = tokenId.startsWith('0x') ? BigInt(tokenId).toString(10) : tokenId.trim();
  const cached = cache.get(normalizedId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL && cached.data.attributes.length > 0) {
    return { attributes: cached.data.attributes, source: cached.data.source };
  }
  let attributes = await fetchFromToriiGraphQL(normalizedId);
  if (attributes.length === 0) {
    const tokenIdHex = BigInt(normalizedId).toString(16).padStart(64, '0');
    const fullTokenId = `${ADVENTURER_CONTRACT}:0x${tokenIdHex}`;
    const attributesResponse = await fetch(
      `${TORII_SQL_ENDPOINT}?query=${encodeURIComponent(`SELECT trait_name, trait_value FROM token_attributes WHERE token_id = '${fullTokenId}'`)}`
    );
    if (attributesResponse.ok) {
      const rawAttributes = await attributesResponse.json();
      attributes = Array.isArray(rawAttributes)
        ? rawAttributes.map((attr: { trait_name: string; trait_value: string }) => ({
            trait_type: attr.trait_name,
            value: attr.trait_value,
          }))
        : [];
    }
  }
  let source: 'torii' | 'rpc' = 'torii';
  if (attributes.length > 0) {
    cache.set(normalizedId, { data: { attributes, source }, timestamp: Date.now() });
    return { attributes, source };
  }
  try {
    attributes = await fetchFromContract(normalizedId);
    source = 'rpc';
  } catch {
    // return empty
  }
  cache.set(normalizedId, { data: { attributes, source }, timestamp: Date.now() });
  return { attributes, source };
}

/** Run async tasks with limited concurrency. */
export async function runWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  let index = 0;
  async function worker(): Promise<void> {
    while (index < items.length) {
      const i = index++;
      const item = items[i];
      results[i] = await fn(item);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
  return results;
}
