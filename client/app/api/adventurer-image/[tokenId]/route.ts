import { NextRequest, NextResponse } from 'next/server';
import { RpcProvider } from 'starknet';

const RPC_URL = 'https://api.cartridge.gg/x/starknet/mainnet';
const ADVENTURER_CONTRACT = '0x036017e69d21d6d8c13e266eabb73ef1f1d02722d86bdcabe5f168f8e549d3cd';

// Cache for token metadata (in-memory, resets on server restart)
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function decodeByteArray(result: string[]): string {
  if (result.length === 0) return '';

  const numFullWords = parseInt(result[0], 16);
  let decoded = '';

  // Each full word is 31 bytes
  for (let i = 0; i < numFullWords; i++) {
    const felt = BigInt(result[1 + i]);
    const bytes: number[] = [];
    let val = felt;
    for (let j = 0; j < 31; j++) {
      bytes.unshift(Number(val & 0xffn));
      val >>= 8n;
    }
    decoded += String.fromCharCode(...bytes.filter((b) => b > 0));
  }

  // Pending word (remaining bytes)
  const pendingWordIdx = 1 + numFullWords;
  if (pendingWordIdx < result.length) {
    const pendingWord = BigInt(result[pendingWordIdx]);
    const pendingLen = parseInt(result[pendingWordIdx + 1], 16);

    if (pendingLen > 0) {
      const bytes: number[] = [];
      let val = pendingWord;
      for (let j = 0; j < pendingLen; j++) {
        bytes.unshift(Number(val & 0xffn));
        val >>= 8n;
      }
      decoded += String.fromCharCode(...bytes);
    }
  }

  return decoded;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  const { tokenId } = await params;

  if (!tokenId) {
    return NextResponse.json({ error: 'Token ID required' }, { status: 400 });
  }

  try {
    // Check cache first
    const cached = cache.get(tokenId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({
        tokenId,
        metadata: cached.data,
        cached: true,
      });
    }

    const provider = new RpcProvider({ nodeUrl: RPC_URL });

    // Convert tokenId to hex for calldata (u256 = low, high)
    const tokenIdNum = BigInt(tokenId);
    const tokenIdHex = '0x' + tokenIdNum.toString(16);

    // Call token_uri with u256 (low, high)
    const result = await provider.callContract({
      contractAddress: ADVENTURER_CONTRACT,
      entrypoint: 'token_uri',
      calldata: [tokenIdHex, '0x0'],
    });

    // Decode ByteArray from felts
    const tokenUri = decodeByteArray(result);

    // Parse the data URI
    if (tokenUri.startsWith('data:application/json;base64,')) {
      const base64Data = tokenUri.replace('data:application/json;base64,', '');
      const jsonString = Buffer.from(base64Data, 'base64').toString('utf-8');
      const metadata = JSON.parse(jsonString);

      // Cache the result
      cache.set(tokenId, { data: metadata, timestamp: Date.now() });

      return NextResponse.json({
        tokenId,
        metadata,
        cached: false,
      });
    }

    // If it's a plain URL, return it
    return NextResponse.json({
      tokenId,
      tokenUri,
      cached: false,
    });
  } catch (error) {
    console.error('Error fetching token URI:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
