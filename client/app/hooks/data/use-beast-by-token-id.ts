import { useQuery } from '@apollo/client/react';
import { useMemo } from 'react';
import { BEAST_BY_TOKEN_ID_QUERY } from '../../lib/queries';
import type { ERC721Token, FormattedNFT } from '../../lib/types';
import { formatNFTs } from '../../lib/utils';
import { normalizeContractAddress } from '../../lib/utils/normalization';
import { BEASTS_NFT_CONTRACT_ADDRESS } from '../../lib/constants';

interface BeastByTokenIdResponse {
  token: {
    tokenMetadata: ERC721Token | null;
  } | null;
}

interface UseBeastByTokenIdOptions {
  tokenId: string | null;
  skip?: boolean;
}

/**
 * Hook to fetch a single beast by its token ID.
 * This allows viewing any beast without needing the owner's wallet address.
 */
export function useBeastByTokenId({ tokenId, skip = false }: UseBeastByTokenIdOptions) {
  // Build the compound ID: contractAddress:tokenId
  const id = useMemo(() => {
    if (!tokenId) return null;

    // Normalize the contract address
    const contractAddress = normalizeContractAddress(BEASTS_NFT_CONTRACT_ADDRESS);

    // Token ID needs to be in hex format with proper padding (64 chars after 0x)
    let normalizedTokenId = tokenId;
    if (!tokenId.startsWith('0x')) {
      // Convert decimal to hex if needed
      normalizedTokenId = '0x' + BigInt(tokenId).toString(16).padStart(64, '0');
    } else if (tokenId.length < 66) {
      // Pad hex string to 66 chars (0x + 64 hex chars)
      normalizedTokenId = '0x' + tokenId.slice(2).padStart(64, '0');
    }

    return `${contractAddress}:${normalizedTokenId}`;
  }, [tokenId]);

  const { data, loading, error } = useQuery<BeastByTokenIdResponse>(BEAST_BY_TOKEN_ID_QUERY, {
    variables: { id },
    skip: skip || !id,
    fetchPolicy: 'cache-first',
    errorPolicy: 'all',
  });

  const nft: FormattedNFT | null = useMemo(() => {
    const tokenMetadata = data?.token?.tokenMetadata;
    if (!tokenMetadata) return null;

    // Normalize contract address
    const normalizedMetadata: ERC721Token = {
      ...tokenMetadata,
      contractAddress: tokenMetadata.contractAddress
        ? normalizeContractAddress(tokenMetadata.contractAddress)
        : tokenMetadata.contractAddress,
    };

    const formatted = formatNFTs([normalizedMetadata]);
    return formatted.length > 0 ? formatted[0] : null;
  }, [data]);

  return {
    nft,
    loading,
    error: error ? new Error(error.message) : null,
  };
}
