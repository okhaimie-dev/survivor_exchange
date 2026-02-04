import { useQuery } from '@apollo/client/react';
import { useAccount } from '@starknet-react/core';
import { useMemo } from 'react';
import { MY_NFTS_QUERY } from '../../lib/queries';
import type { MyNFTsResponse, ERC721Token, FormattedNFT } from '../../lib/types';
import { formatNFTs } from '../../lib/utils';
import { normalizeContractAddress } from '../../lib/utils/normalization';
import { BEASTS_NFT_CONTRACT_ADDRESS } from '../../lib/constants';

interface UseMyNFTsOptions {
  address?: string;
  collectionAddress?: string;
}

export function useMyNFTs(options?: UseMyNFTsOptions) {
  const { address: accountAddress } = useAccount();
  const rawTargetAddress = options?.address || accountAddress;
  // Normalize address before using in query
  const targetAddress = rawTargetAddress ? normalizeContractAddress(rawTargetAddress) : undefined;

  // Use provided collection address or default to BEASTS
  const collectionAddress = options?.collectionAddress || BEASTS_NFT_CONTRACT_ADDRESS;

  const { data, loading, error, refetch } = useQuery<MyNFTsResponse>(MY_NFTS_QUERY, {
    variables: { accountAddress: targetAddress },
    skip: !targetAddress,
    // No polling - user NFTs don't change frequently, and each response is ~16MB
    // Users can refresh the page to see new NFTs
    fetchPolicy: 'cache-first',
    errorPolicy: 'all',
    notifyOnNetworkStatusChange: false,
  });

  const rawNFTs: ERC721Token[] = useMemo(() => {
    const allNFTs = data?.tokenBalances?.edges
      ?.map((edge) => edge.node.tokenMetadata)
      .filter((metadata): metadata is ERC721Token => metadata !== null && metadata !== undefined)
      .map((nft) => ({
        ...nft,
        // Normalize contract addresses from GraphQL
        contractAddress: nft.contractAddress ? normalizeContractAddress(nft.contractAddress) : nft.contractAddress,
      })) || [];

    const targetContractNormalized = normalizeContractAddress(collectionAddress).toLowerCase();
    return allNFTs.filter((nft) => {
      if (!nft.contractAddress) return false;
      const nftContractNormalized = normalizeContractAddress(nft.contractAddress).toLowerCase();
      return nftContractNormalized === targetContractNormalized;
    });
  }, [data, collectionAddress]);

  const nfts: FormattedNFT[] = useMemo(() => formatNFTs(rawNFTs), [rawNFTs]);

  return {
    nfts,
    loading,
    error: error ? new Error(error.message) : null,
    address: targetAddress,
    refetch,
  };
}

