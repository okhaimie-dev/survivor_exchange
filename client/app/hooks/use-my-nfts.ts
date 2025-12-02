import { useQuery } from '@apollo/client/react';
import { useAccount } from '@starknet-react/core';
import { useMemo } from 'react';
import { MY_NFTS_QUERY, MyNFTsResponse, ERC721Token, FormattedNFT, formatNFTs } from '../lib/graphql';
import { DEFAULT_POLL_INTERVAL, BEASTS_NFT_CONTRACT_ADDRESS } from '../lib/constants';

interface UseMyNFTsOptions {
  address?: string;
}

export function useMyNFTs(options?: UseMyNFTsOptions) {
  const { address: accountAddress } = useAccount();
  const targetAddress = options?.address || accountAddress;

  const { data, loading, error } = useQuery<MyNFTsResponse>(MY_NFTS_QUERY, {
    variables: { accountAddress: targetAddress },
    skip: !targetAddress,
    pollInterval: DEFAULT_POLL_INTERVAL,
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
    notifyOnNetworkStatusChange: false,
  });

  const normalizeContractAddress = (address: string | null | undefined): string => {
    if (!address) return '';
    const addrStr = String(address);
    if (!addrStr) return '';
    let hexPart: string;
    if (addrStr.length >= 2 && addrStr[0] === '0' && (addrStr[1] === 'x' || addrStr[1] === 'X')) {
      hexPart = addrStr.slice(2);
    } else {
      hexPart = addrStr;
    }
    const padded = hexPart.toLowerCase().padStart(64, '0');
    return `0x${padded}`;
  };

  const rawNFTs: ERC721Token[] = useMemo(() => {
    const allNFTs = data?.tokenBalances?.edges
      ?.map((edge) => edge.node.tokenMetadata)
      .filter((metadata): metadata is ERC721Token => metadata !== null && metadata !== undefined) || [];
    
    const targetContractNormalized = normalizeContractAddress(BEASTS_NFT_CONTRACT_ADDRESS).toLowerCase();
    return allNFTs.filter((nft) => {
      if (!nft.contractAddress) return false;
      const nftContractNormalized = normalizeContractAddress(nft.contractAddress).toLowerCase();
      return nftContractNormalized === targetContractNormalized;
    });
  }, [data]);

  const nfts: FormattedNFT[] = useMemo(() => formatNFTs(rawNFTs), [rawNFTs]);

  return {
    nfts,
    loading,
    error: error ? new Error(error.message) : null,
    address: targetAddress,
  };
}

