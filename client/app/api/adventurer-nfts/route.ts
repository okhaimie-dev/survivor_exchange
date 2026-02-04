import { NextRequest, NextResponse } from 'next/server';

const TORII_SQL_ENDPOINT = 'https://api.cartridge.gg/x/pg-mainnet-10/torii/sql';
const ADVENTURER_CONTRACT = '0x036017e69d21d6d8c13e266eabb73ef1f1d02722d86bdcabe5f168f8e549d3cd';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json({ error: 'Address required' }, { status: 400 });
  }

  try {
    const normalizedAddress = address.toLowerCase();

    // Fetch token balances (limit to 2500 to support users with many adventurers)
    const balancesQuery = `SELECT token_id, contract_address FROM token_balances WHERE LOWER(account_address) = '${normalizedAddress}' AND contract_address = '${ADVENTURER_CONTRACT}' LIMIT 2500`;

    const balancesResponse = await fetch(
      `${TORII_SQL_ENDPOINT}?query=${encodeURIComponent(balancesQuery)}`
    );

    if (!balancesResponse.ok) {
      throw new Error(`Balances fetch failed: ${balancesResponse.status}`);
    }

    const balances = await balancesResponse.json();

    if (balances.length === 0) {
      return NextResponse.json({ nfts: [] });
    }

    // Fetch attributes in batches (to avoid 413 Request Too Large)
    const BATCH_SIZE = 50;
    const allAttributes: Array<{ token_id: string; trait_name: string; trait_value: string }> = [];

    for (let i = 0; i < balances.length; i += BATCH_SIZE) {
      const batch = balances.slice(i, i + BATCH_SIZE);
      const tokenIds = batch.map((b: { token_id: string }) => `'${b.token_id}'`).join(',');
      const attributesQuery = `SELECT token_id, trait_name, trait_value FROM token_attributes WHERE token_id IN (${tokenIds})`;

      const attributesResponse = await fetch(
        `${TORII_SQL_ENDPOINT}?query=${encodeURIComponent(attributesQuery)}`
      );

      if (!attributesResponse.ok) {
        console.error(`Attributes batch ${i / BATCH_SIZE} failed:`, attributesResponse.status);
        continue; // Skip failed batches instead of failing entirely
      }

      const batchAttributes = await attributesResponse.json();
      allAttributes.push(...batchAttributes);
    }

    const attributes = allAttributes;

    // Group attributes by token_id (normalize key so casing/format mismatches still match)
    const normalizeTokenIdKey = (id: string) => id.trim().toLowerCase();
    const attributesByToken = new Map<string, Array<{ trait_type: string; value: string }>>();
    for (const attr of attributes) {
      const key = normalizeTokenIdKey(attr.token_id);
      if (!attributesByToken.has(key)) {
        attributesByToken.set(key, []);
      }
      attributesByToken.get(key)!.push({
        trait_type: attr.trait_name,
        value: String(attr.trait_value),
      });
    }

    // Format NFTs
    const nfts = balances
      .map((balance: { token_id: string; contract_address: string }) => {
        const tokenAttributes = attributesByToken.get(normalizeTokenIdKey(balance.token_id)) || [];

        const getAttribute = (name: string) => {
          const exact = tokenAttributes.find((a) => a.trait_type === name);
          if (exact) return exact.value;
          const lower = name.toLowerCase();
          const insensitive = tokenAttributes.find((a) => (a.trait_type ?? '').toLowerCase() === lower);
          return insensitive?.value;
        };

        // Skip soulbound NFTs
        if (getAttribute('Soulbound') === 'True') {
          return null;
        }

        const tokenIdParts = balance.token_id.split(':');
        const rawTokenId = tokenIdParts[1] || balance.token_id;
        const playerName = getAttribute('Player Name') || 'Adventurer';
        const level = getAttribute('Level') || '1';
        const xp = getAttribute('XP') || getAttribute('Score') || '0';

        return {
          metadataName: playerName,
          metadataDescription: `Death Mountain Adventurer - Level ${level}`,
          contractAddress: balance.contract_address,
          imagePath: '',
          metadata: null,
          attributes: tokenAttributes,
          name: 'Games',
          symbol: 'GAME',
          tokenId: rawTokenId,
          level,
          health: getAttribute('Health') ?? getAttribute('health'),
          power: xp,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ nfts });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
