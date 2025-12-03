import { useEffect, useState } from 'react';
import { fetchMyNFTs } from '../lib/queries';
import type { FormattedNFT, ERC721Token } from '../lib/types';
import { formatNFTs } from '../lib/utils';
import { normalizeContractAddress } from '../lib/utils/normalization';
import { BEASTS_NFT_CONTRACT_ADDRESS } from '../lib/constants';

interface UseNFTMetadataOptions {
  sellerAddress: string;
  tokenIds: string[];
  contractAddress?: string;
}

export function useNFTMetadata({ sellerAddress, tokenIds, contractAddress }: UseNFTMetadataOptions) {
  const [nfts, setNfts] = useState<FormattedNFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!sellerAddress || tokenIds.length === 0) {
      setNfts([]);
      setError(null);
      return;
    }

    const fetchNFTs = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchMyNFTs(sellerAddress);
        const rawNFTs: ERC721Token[] = response?.tokenBalances?.edges
          ?.map((edge) => edge.node.tokenMetadata)
          .filter((metadata): metadata is ERC721Token => metadata !== null && metadata !== undefined) || [];
        
        const allNfts = formatNFTs(rawNFTs);
        
        const targetContract = contractAddress || BEASTS_NFT_CONTRACT_ADDRESS;
        const targetContractNormalized = normalizeContractAddress(targetContract).toLowerCase();
        
        const filteredNfts = allNfts.filter((nft) => {
          const matchesTokenId = tokenIds.some(
            (id) => nft.tokenId?.toLowerCase() === id.toLowerCase()
          );
          const nftContractNormalized = normalizeContractAddress(nft.contractAddress).toLowerCase();
          const matchesContract = nftContractNormalized === targetContractNormalized;
          
          return matchesTokenId && matchesContract;
        });

        setNfts(filteredNfts);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch NFT metadata'));
        setNfts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNFTs();
  }, [sellerAddress, tokenIds.join(','), contractAddress]);

  return {
    nfts,
    loading,
    error,
  };
}

