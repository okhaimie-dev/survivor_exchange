import { NextRequest, NextResponse } from 'next/server';
import { RpcProvider } from 'starknet';

const ADVENTURER_GAME_CONTRACT = '0x03fc7ecd6d577daa1ee855a9fa13a914d01acda06715c9fc74f1ee1a5e346a01';
const RPC_URL = 'https://api.cartridge.gg/x/starknet/mainnet';

/** Fetch one adventurer from contract (on-chain source of truth). */
async function fetchAdventurerFromContract(
  provider: RpcProvider,
  tokenId: string
): Promise<{ level: number; health: number; strength: number; dexterity: number; vitality: number; intelligence: number; wisdom: number; charisma: number } | null> {
  try {
    const trimmed = tokenId.trim();
    const num = trimmed.startsWith('0x') || trimmed.startsWith('0X') ? BigInt(trimmed) : BigInt(trimmed);
    const tokenIdHex = '0x' + num.toString(16);

    const result = await provider.callContract({
      contractAddress: ADVENTURER_GAME_CONTRACT,
      entrypoint: 'get_adventurer',
      calldata: [tokenIdHex],
    });

    if (!result || result.length < 12) return null;

    const health = Number(BigInt(result[0] || '0x0'));
    const xp = Number(BigInt(result[1] || '0x0'));
    const level = Math.max(1, Math.floor(Math.sqrt(xp)) + 1);

    const strength = Number(BigInt(result[5] || '0x0'));
    const dexterity = Number(BigInt(result[6] || '0x0'));
    const vitality = Number(BigInt(result[7] || '0x0'));
    const intelligence = Number(BigInt(result[8] || '0x0'));
    const wisdom = Number(BigInt(result[9] || '0x0'));
    const charisma = Number(BigInt(result[10] || '0x0'));

    return { level, health, strength, dexterity, vitality, intelligence, wisdom, charisma };
  } catch {
    return null;
  }
}

/** Run promises with limited concurrency. */
async function runWithConcurrency<T, R>(
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
      const result = await fn(item);
      results[i] = result;
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

const DEFAULT_BOUNDS = {
  levelMin: 1,
  levelMax: 100,
  healthMin: 0,
  healthMax: 100,
  strengthMin: 0,
  strengthMax: 30,
  dexterityMin: 0,
  dexterityMax: 30,
  vitalityMin: 0,
  vitalityMax: 30,
  intelligenceMin: 0,
  intelligenceMax: 30,
  wisdomMin: 0,
  wisdomMax: 30,
  charismaMin: 0,
  charismaMax: 30,
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const tokenIdsParam = searchParams.get('tokenIds');

  if (!tokenIdsParam) {
    return NextResponse.json({ error: 'tokenIds required (comma-separated)' }, { status: 400 });
  }

  const tokenIds = tokenIdsParam
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const uniqueIds = Array.from(new Set(tokenIds));
  const MAX_TOKENS = 50;
  const limitedIds = uniqueIds.slice(0, MAX_TOKENS);

  if (limitedIds.length === 0) {
    return NextResponse.json(DEFAULT_BOUNDS);
  }

  try {
    const provider = new RpcProvider({ nodeUrl: RPC_URL });
    const CONCURRENCY = 6;
    const results = await runWithConcurrency(limitedIds, CONCURRENCY, (id) =>
      fetchAdventurerFromContract(provider, id)
    );

    const valid = results.filter((r): r is NonNullable<typeof r> => r !== null);

    if (valid.length === 0) {
      return NextResponse.json(DEFAULT_BOUNDS);
    }

    const levelVals = valid.map((r) => r.level);
    const healthVals = valid.map((r) => r.health);
    const strengthVals = valid.map((r) => r.strength);
    const dexterityVals = valid.map((r) => r.dexterity);
    const vitalityVals = valid.map((r) => r.vitality);
    const intelligenceVals = valid.map((r) => r.intelligence);
    const wisdomVals = valid.map((r) => r.wisdom);
    const charismaVals = valid.map((r) => r.charisma);

    const minMax = (arr: number[], dMin: number, dMax: number) => ({
      min: arr.length ? Math.min(...arr) : dMin,
      max: arr.length ? Math.max(...arr) : dMax,
    });

    const level = minMax(levelVals, 1, 100);
    const health = minMax(healthVals, 0, 100);
    const strength = minMax(strengthVals, 0, 30);
    const dexterity = minMax(dexterityVals, 0, 30);
    const vitality = minMax(vitalityVals, 0, 30);
    const intelligence = minMax(intelligenceVals, 0, 30);
    const wisdom = minMax(wisdomVals, 0, 30);
    const charisma = minMax(charismaVals, 0, 30);

    return NextResponse.json({
      levelMin: level.min,
      levelMax: Math.max(level.max, level.min, 1),
      healthMin: health.min,
      healthMax: Math.max(health.max, health.min, 0),
      strengthMin: strength.min,
      strengthMax: strength.max,
      dexterityMin: dexterity.min,
      dexterityMax: dexterity.max,
      vitalityMin: vitality.min,
      vitalityMax: vitality.max,
      intelligenceMin: intelligence.min,
      intelligenceMax: intelligence.max,
      wisdomMin: wisdom.min,
      wisdomMax: wisdom.max,
      charismaMin: charisma.min,
      charismaMax: charisma.max,
    });
  } catch (error) {
    console.error('adventurer-stat-bounds API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
