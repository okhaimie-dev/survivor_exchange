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
        // Normalize seller address before query
        const normalizedSellerAddress = normalizeContractAddress(sellerAddress);
        const response = await fetchMyNFTs(normalizedSellerAddress);
        const rawNFTs: ERC721Token[] = (response?.tokenBalances?.edges || [])
          .flatMap((edge) => {
            const metadata = edge.node.tokenMetadata;
            if (!metadata || metadata === null || metadata === undefined) return [];
            // Normalize contract addresses from GraphQL
            const normalized: ERC721Token = {
              ...metadata,
              contractAddress: metadata.contractAddress ? normalizeContractAddress(metadata.contractAddress) : metadata.contractAddress,
            };
            return [normalized];
          });
        
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

