import { useQuery } from '@apollo/client/react';
import { useAccount } from '@starknet-react/core';
import { MY_NFTS_QUERY, MyNFTsResponse, ERC721Token, FormattedNFT, formatNFTs } from '../lib/graphql';

interface UseMyNFTsOptions {
  address?: string;
}

export function useMyNFTs(options?: UseMyNFTsOptions) {
  const { address: accountAddress } = useAccount();
  const targetAddress = options?.address || accountAddress;

  const { data, loading, error } = useQuery<MyNFTsResponse>(MY_NFTS_QUERY, {
    variables: { accountAddress: targetAddress },
    skip: !targetAddress,
    pollInterval: 1000, // Poll every second
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
    notifyOnNetworkStatusChange: false, // Prevent re-renders on network status changes
  });

  // Extract and flatten the NFTs from the response, then format them
  const rawNFTs: ERC721Token[] = data?.tokenBalances?.edges
    ?.map((edge) => edge.node.tokenMetadata)
    .filter((metadata): metadata is ERC721Token => metadata !== null && metadata !== undefined) || [];

  const nfts: FormattedNFT[] = formatNFTs(rawNFTs);

  return {
    nfts,
    loading,
    error: error ? new Error(error.message) : null,
    address: targetAddress,
  };
}

