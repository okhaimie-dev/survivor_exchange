import { NextRequest, NextResponse } from "next/server";
import { BEASTS_GRAPHQL_ENDPOINT } from "../../lib/constants";
import { normalizeContractAddress, normalizeTokenId, toDecimalTokenId } from "../../lib/utils/normalization";
import { formatNFTs } from "../../lib/utils/nft-formatters";
import type { ERC721Token, FormattedNFT } from "../../lib/types";

const BEAST_BY_TOKEN_ID_QUERY = `
  query BeastByTokenId($id: ID!) {
    token(id: $id) {
      tokenMetadata {
        ... on ERC721__Token {
          metadataName
          contractAddress
          imagePath
          metadata
          metadataAttributes
          name
          symbol
          tokenId
        }
      }
    }
  }
`;

interface BeastMetadataItem {
  contractAddress: string;
  tokenId: string;
}

type TokenByIdResponse = { data?: { token?: { tokenMetadata?: ERC721Token } } } | null;

async function fetchTokenById(endpoint: string, id: string): Promise<TokenByIdResponse> {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: BEAST_BY_TOKEN_ID_QUERY,
      variables: { id },
    }),
  });
  if (!res.ok) return null;
  const raw = await res.json();
  if (raw?.errors?.length) return null;
  return raw as TokenByIdResponse;
}

/** POST body: { items: BeastMetadataItem[] } — fetches beast metadata by contract+tokenId for Eternum grid. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const items = Array.isArray(body?.items) ? body.items as BeastMetadataItem[] : [];
    if (items.length === 0) {
      return NextResponse.json({ nfts: [] });
    }
    if (items.length > 100) {
      return NextResponse.json({ error: "Max 100 items per request" }, { status: 400 });
    }

    const results: (FormattedNFT | null)[] = [];

    for (const item of items) {
      const contractAddress = normalizeContractAddress(item.contractAddress);
      const tokenIdNorm = normalizeTokenId(item.tokenId);
      const tokenIdDecimal = toDecimalTokenId(item.tokenId);

      // Try compound id formats: Torii may expect 0x+64 hex or decimal token_id
      const idCandidates = [
        `${contractAddress}:${tokenIdNorm}`,
        `${contractAddress}:${tokenIdNorm.slice(2)}`,
        `${contractAddress}:${tokenIdDecimal}`,
      ];

      let tokenMetadata: ERC721Token | null | undefined;
      let data: TokenByIdResponse = null;

      for (const id of idCandidates) {
        data = await fetchTokenById(BEASTS_GRAPHQL_ENDPOINT, id);
        tokenMetadata = data?.data?.token?.tokenMetadata;
        if (tokenMetadata?.tokenId) break;
      }

      if (!tokenMetadata?.tokenId) {
        results.push(null);
        continue;
      }

      const normalized: ERC721Token = {
        ...tokenMetadata,
        contractAddress: tokenMetadata.contractAddress
          ? normalizeContractAddress(tokenMetadata.contractAddress)
          : tokenMetadata.contractAddress,
      };

      const formatted = formatNFTs([normalized]);
      results.push(formatted.length > 0 ? formatted[0] : null);
    }

    return NextResponse.json({ nfts: results });
  } catch (e) {
    console.error("[beast-metadata]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Beast metadata fetch failed" },
      { status: 500 }
    );
  }
}
