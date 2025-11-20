import { useEffect, useState } from 'react';
import { useAccount } from '@starknet-react/core';
import { fetchMyNFTs, MyNFTsResponse, ERC721Token, FormattedNFT, formatNFTs } from '../lib/graphql';

interface UseMyNFTsOptions {
  address?: string;
}

export function useMyNFTs(options?: UseMyNFTsOptions) {
  const { address: accountAddress } = useAccount();
  const [data, setData] = useState<MyNFTsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Use the passed address or fall back to the connected account address
  const targetAddress = options?.address || accountAddress;

  useEffect(() => {
    if (!targetAddress) {
      setData(null);
      setError(null);
      return;
    }

    const loadNFTs = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchMyNFTs(targetAddress);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch NFTs'));
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    loadNFTs();
  }, [targetAddress]);

  // Extract and flatten the NFTs from the response, then format them
  const rawNFTs: ERC721Token[] = data?.tokenBalances?.edges
    ?.map((edge) => edge.node.tokenMetadata)
    .filter((metadata): metadata is ERC721Token => metadata !== null && metadata !== undefined) || [];

  const nfts: FormattedNFT[] = formatNFTs(rawNFTs);

  return {
    nfts,
    loading,
    error,
    address: targetAddress,
  };
}

