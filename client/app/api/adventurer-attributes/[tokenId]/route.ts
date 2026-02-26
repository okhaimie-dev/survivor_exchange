import { NextRequest, NextResponse } from 'next/server';
import { RpcProvider } from 'starknet';
import {
  LS009_ADVENTURER_PACKED_QUERY,
  type Ls009AdventurerPackedResponse,
} from '../../../lib/queries/adventurer';
import { BEASTS_GRAPHQL_ENDPOINT } from '../../../lib/constants';
import { itemIdToName } from '../../../lib/constants/loot';
import { getInBattleFromAttributes } from '../../../lib/utils/packed-adventurer';

// Adventurer attributes: always use Torii first (GraphQL → SQL). RPC is last resort only when Torii returns no data.
const TORII_SQL_ENDPOINT = 'https://api.cartridge.gg/x/pg-mainnet-10/torii/sql';
const ADVENTURER_CONTRACT = '0x036017e69d21d6d8c13e266eabb73ef1f1d02722d86bdcabe5f168f8e549d3cd';
const ADVENTURER_GAME_CONTRACT = '0x03fc7ecd6d577daa1ee855a9fa13a914d01acda06715c9fc74f1ee1a5e346a01';
const RPC_URL = 'https://api.cartridge.gg/x/starknet/mainnet';

// In-memory cache for attributes
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Critical attributes that should be present
const CRITICAL_ATTRIBUTES = ['Health', 'Gold', 'Level', 'XP', 'Score'];

/**
 * Fetch adventurer state from Torii GraphQL (ls009AdventurerPackedModels).
 * Returns attributes decoded from packed field if present; otherwise empty.
 */
async function fetchFromToriiGraphQL(
  tokenId: string
): Promise<Array<{ trait_type: string; value: string }>> {
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
    if (json.errors?.length) {
      console.warn('[Adventurer Attributes] Torii GraphQL errors:', json.errors);
      return [];
    }
    const node = json.data?.ls009AdventurerPackedModels?.edges?.[0]?.node;
    if (!node?.packed) return [];

    const packed = node.packed.trim();
    const attributes = decodePackedToAttributes(packed);
    if (attributes.length > 0) {
      console.log(`[Adventurer Attributes] Token ${tokenId}: Torii GraphQL packed decoded to ${attributes.length} attributes`);
    }
    return attributes;
  } catch (e) {
    console.warn('[Adventurer Attributes] Torii GraphQL fetch failed:', e);
    return [];
  }
}

/** Bit-width constants matching Death Mountain / LootSurvivor Cairo unpack (DivRem div_rem, LSB-first). */
const TWO_POW_10 = BigInt(2) ** BigInt(10);
const TWO_POW_15 = BigInt(2) ** BigInt(15);
const TWO_POW_9 = BigInt(2) ** BigInt(9);
const TWO_POW_4 = BigInt(2) ** BigInt(4);
const TWO_POW_30 = BigInt(2) ** BigInt(30);
const TWO_POW_128 = BigInt(2) ** BigInt(128);
const TWO_POW_16 = BigInt(2) ** BigInt(16);
const TWO_POW_5 = BigInt(32);   // stats: 5 bits per stat (stats.cairo TWO_POW_5_NZ)
const TWO_POW_7 = BigInt(128);  // item id: 7 bits (item.cairo TWO_POW_7_Z)
const TWO_POW_9_ITEM = BigInt(512); // item xp: 9 bits (item.cairo TWO_POW_9_Z)

/**
 * Decode packed adventurer (felt252) per Death Mountain contracts.
 * Adventurer: health(10), xp(15), gold(9), beast_health(10), stat_upgrades(4), stats(30), equipment(128), item_specials_seed(16), action_count(16).
 * Stats (stats.cairo): 6 × 5-bit div_rem → strength, dexterity, vitality, intelligence, wisdom, charisma; luck = 0.
 * Equipment (item.cairo): 8 × 16-bit; per slot div_rem(_, 2^7)→id, div_rem(_, 2^9)→xp.
 */
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

  // Stats (stats.cairo): 6 × 5-bit div_rem → strength, dexterity, vitality, intelligence, wisdom, charisma; luck = 0 from storage
  const statNames = ['Strength', 'Dexterity', 'Vitality', 'Intelligence', 'Wisdom', 'Charisma'];
  let statsRest = statsPacked;
  for (let i = 0; i < 6; i++) {
    let r: bigint;
    [statsRest, r] = divRem(statsRest, TWO_POW_5);
    attributes.push({ trait_type: statNames[i], value: String(r) });
  }
  attributes.push({ trait_type: 'Luck', value: '0' });

  // Equipment (item.cairo): each slot = id (7 bits) + xp * 2^7 (9 bits). 8 slots × 16 bits in equipmentPacked (LSB first).
  // Item IDs translated to names via death-mountain loot.cairo (ItemId → ItemString).
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
  const level = Math.max(1, Math.floor(Math.sqrt(xpNum)) + 1);
  attributes.push({ trait_type: 'Level', value: String(level) });

  return attributes;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  const { tokenId } = await params;
  const toriiOnly = request.nextUrl.searchParams.get('toriiOnly') === 'true' || request.nextUrl.searchParams.get('noRpc') === 'true';
  const toriiSource = request.nextUrl.searchParams.get('source') ?? 'sql'; // 'sql' | 'graphql'

  if (!tokenId) {
    return NextResponse.json({ error: 'Token ID required' }, { status: 400 });
  }

  try {
    // Torii-only mode: return only Torii data (no RPC, no cache)
    if (toriiOnly) {
      if (toriiSource === 'graphql') {
        const attributes = await fetchFromToriiGraphQL(tokenId);
        return NextResponse.json({
          tokenId,
          attributes,
          in_battle: getInBattleFromAttributes(attributes),
          source: 'torii_graphql',
        });
      }
      const tokenIdHex = BigInt(tokenId).toString(16).padStart(64, '0');
      const fullTokenId = `${ADVENTURER_CONTRACT}:0x${tokenIdHex}`;
      const attributesQuery = `SELECT trait_name, trait_value FROM token_attributes WHERE token_id = '${fullTokenId}'`;
      const attributesResponse = await fetch(
        `${TORII_SQL_ENDPOINT}?query=${encodeURIComponent(attributesQuery)}`
      );
      let attributes: Array<{ trait_type: string; value: string }> = [];
      if (attributesResponse.ok) {
        const rawAttributes = await attributesResponse.json();
        attributes = Array.isArray(rawAttributes)
          ? rawAttributes.map((attr: { trait_name: string; trait_value: string }) => ({
              trait_type: attr.trait_name,
              value: attr.trait_value,
            }))
          : [];
      }
      return NextResponse.json({
        tokenId,
        attributes,
        in_battle: getInBattleFromAttributes(attributes),
        source: 'torii_sql',
        toriiStatus: attributesResponse.status,
      });
    }

    // Check cache first - valid if we have any attributes (supports old format: array, or new: { attributes, source })
    const cached = cache.get(tokenId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      const payload = cached.data as
        | Array<{ trait_type: string; value: string }>
        | { attributes: Array<{ trait_type: string; value: string }>; source: string };
      const cachedAttributes = Array.isArray(payload) ? payload : payload?.attributes;
      const cachedSource = Array.isArray(payload) ? 'torii' : (payload?.source ?? 'torii');
      if (cachedAttributes?.length > 0) {
        return NextResponse.json({
          tokenId,
          attributes: cachedAttributes,
          in_battle: getInBattleFromAttributes(cachedAttributes),
          source: cachedSource,
          cached: true,
        });
      }
      cache.delete(tokenId);
    }

    // Adventurers: always use Torii first (GraphQL then SQL). RPC is last resort only when Torii returns no data.
    let attributes: Array<{ trait_type: string; value: string }> = await fetchFromToriiGraphQL(tokenId);
    if (attributes.length === 0) {
      const tokenIdHex = BigInt(tokenId).toString(16).padStart(64, '0');
      const fullTokenId = `${ADVENTURER_CONTRACT}:0x${tokenIdHex}`;
      const attributesQuery = `SELECT trait_name, trait_value FROM token_attributes WHERE token_id = '${fullTokenId}'`;
      const attributesResponse = await fetch(
        `${TORII_SQL_ENDPOINT}?query=${encodeURIComponent(attributesQuery)}`
      );
      if (attributesResponse.ok) {
        const rawAttributes = await attributesResponse.json();
        attributes = Array.isArray(rawAttributes)
          ? rawAttributes.map((attr: { trait_name: string; trait_value: string }) => ({
              trait_type: attr.trait_name,
              value: attr.trait_value,
            }))
          : [];
      } else {
        console.warn(`[Adventurer Attributes] Token ${tokenId}: Torii SQL returned ${attributesResponse.status}`);
      }
    }

    let source: 'torii' | 'rpc' = 'torii';
    if (attributes.length > 0) {
      // We have Torii data — use it. No RPC.
      cache.set(tokenId, { data: { attributes, source }, timestamp: Date.now() });
      return NextResponse.json({
        tokenId,
        attributes,
        in_battle: getInBattleFromAttributes(attributes),
        source,
        cached: false,
      });
    }

    // Last resort: Torii returned no data — fetch from contract and log
    console.log(`[Adventurer Attributes] Token ${tokenId}: Using RPC as last resort (Torii returned no data)`);
    try {
      attributes = await fetchFromContract(tokenId);
      source = 'rpc';
    } catch (contractError) {
      console.warn(`[Adventurer Attributes] Token ${tokenId}: RPC fetch failed:`, contractError);
    }

    cache.set(tokenId, { data: { attributes, source }, timestamp: Date.now() });
    return NextResponse.json({
      tokenId,
      attributes,
      in_battle: getInBattleFromAttributes(attributes),
      source,
      cached: false,
    });
  } catch (error) {
    console.warn('[Adventurer Attributes] Error fetching attributes, returning empty:', error);
    return NextResponse.json({
      tokenId,
      attributes: [],
      in_battle: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Fetch adventurer data directly from the contract using get_adventurer
 * @param tokenId - The token ID (can be decimal string or hex)
 * @returns Array of attributes from the contract
 */
async function fetchFromContract(tokenId: string): Promise<Array<{ trait_type: string; value: string }>> {
  const provider = new RpcProvider({ nodeUrl: RPC_URL });
  
  // Convert tokenId to felt252 (single value, not u256)
  // Handle both decimal and hex inputs
  const tokenIdNum = tokenId.startsWith('0x') 
    ? BigInt(tokenId) 
    : BigInt(tokenId);
  const tokenIdHex = '0x' + tokenIdNum.toString(16);
  
  // Call get_adventurer with tokenId as felt252 (single parameter)
  const result = await provider.callContract({
    contractAddress: ADVENTURER_GAME_CONTRACT,
    entrypoint: 'get_adventurer',
    calldata: [tokenIdHex], // felt252: single value
  });

  // Parse the result - the contract returns 30 fields with this structure:
  // [0] = health
  // [1] = xp
  // [2] = gold
  // [3] = beast_health
  // [4] = stat_upgrades_available
  // [5-11] = stats: strength, dexterity, vitality, intelligence, wisdom, charisma, luck
  // [12-13] = weapon (id, xp)
  // [14-15] = chest (id, xp)
  // [16-17] = head (id, xp)
  // [18-19] = waist (id, xp)
  // [20-21] = foot (id, xp)
  // [22-23] = hand (id, xp)
  // [24-25] = neck (id, xp)
  // [26-27] = ring (id, xp)
  // [28] = item_specials_seed
  // [29] = action_count
  const attributes: Array<{ trait_type: string; value: string }> = [];
  
  if (result && result.length >= 30) {
    // Health - always add, even if 0 (0 is a valid value)
    const health = BigInt(result[0] || '0x0').toString();
    attributes.push({ trait_type: 'Health', value: health });
    
    // Game Over - determined by health being 0 (dead) or > 0 (alive)
    const healthNum = parseInt(health) || 0;
    attributes.push({ trait_type: 'Game Over', value: healthNum === 0 ? 'True' : 'False' });
    
    // XP/Score - always add, even if 0
    const xp = BigInt(result[1] || '0x0').toString();
    attributes.push({ trait_type: 'XP', value: xp });
    attributes.push({ trait_type: 'Score', value: xp });
    
    // Gold - always add, even if 0
    attributes.push({ trait_type: 'Gold', value: BigInt(result[2] || '0x0').toString() });
    
    // Beast Health - always add, even if 0
    attributes.push({ trait_type: 'Beast Health', value: BigInt(result[3] || '0x0').toString() });
    
    // Stat Upgrades Available - always add, even if 0
    attributes.push({ trait_type: 'Stat Upgrades Available', value: BigInt(result[4] || '0x0').toString() });
    
    // Stats: Strength, Dexterity, Vitality, Intelligence, Wisdom, Charisma, Luck
    // Always add all stats, even if zero (0 is a valid stat value)
    const statNames = ['Strength', 'Dexterity', 'Vitality', 'Intelligence', 'Wisdom', 'Charisma', 'Luck'];
    for (let i = 0; i < statNames.length; i++) {
      const statIndex = 5 + i;
      const statValue = BigInt(result[statIndex] || '0x0').toString();
      attributes.push({ trait_type: statNames[i], value: statValue });
    }
    
    // Equipment slots (each has id and xp)
    const equipmentSlots = [
      { name: 'Weapon', idIndex: 12, xpIndex: 13 },
      { name: 'Chest', idIndex: 14, xpIndex: 15 },
      { name: 'Head', idIndex: 16, xpIndex: 17 },
      { name: 'Waist', idIndex: 18, xpIndex: 19 },
      { name: 'Foot', idIndex: 20, xpIndex: 21 },
      { name: 'Hand', idIndex: 22, xpIndex: 23 },
      { name: 'Neck', idIndex: 24, xpIndex: 25 },
      { name: 'Ring', idIndex: 26, xpIndex: 27 },
    ];
    
    for (const slot of equipmentSlots) {
      const id = result[slot.idIndex] ? BigInt(result[slot.idIndex]).toString() : '0';
      const xp = result[slot.xpIndex] ? BigInt(result[slot.xpIndex]).toString() : '0';
      // Only add equipment if it has an ID (non-zero). Value = human-readable name from loot.cairo.
      if (id !== '0') {
        attributes.push({ trait_type: slot.name, value: itemIdToName(id) });
        // Always add XP if equipment exists (even if 0, though it shouldn't be 0 for equipped items)
        attributes.push({ trait_type: `${slot.name} XP`, value: xp });
      }
    }
    
    // Item Specials Seed - always add, even if 0
    attributes.push({ trait_type: 'Item Specials Seed', value: BigInt(result[28] || '0x0').toString() });
    
    // Action Count - always add, even if 0
    attributes.push({ trait_type: 'Action Count', value: BigInt(result[29] || '0x0').toString() });
    
    // Calculate Level from XP
    // Always add Level attribute (minimum level 1)
    const xpValue = result[1] ? BigInt(result[1]).toString() : '0';
    const xpNum = parseInt(xpValue) || 0;
    // Level calculation: level = floor(sqrt(xp)) + 1, minimum 1
    const level = Math.max(1, Math.floor(Math.sqrt(xpNum)) + 1);
    attributes.push({ trait_type: 'Level', value: level.toString() });
    
    console.log(`[Contract Fetch] Token ${tokenId}: Parsed ${attributes.length} attributes from contract response`);
  } else if (result && result.length > 0) {
    console.warn(`[Contract Fetch] Token ${tokenId}: Unexpected response length ${result.length}, expected 30`);
  }
  
  return attributes;
}
