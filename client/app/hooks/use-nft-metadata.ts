import { useEffect, useState } from 'react';
import { fetchMyNFTs, formatNFTs, FormattedNFT, ERC721Token } from '../lib/graphql';

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
        
        // Filter NFTs by token IDs (and optionally contract address)
        const filteredNfts = allNfts.filter((nft) => {
          const matchesTokenId = tokenIds.some(
            (id) => nft.tokenId?.toLowerCase() === id.toLowerCase()
          );
          const matchesContract = contractAddress 
            ? nft.contractAddress?.toLowerCase() === contractAddress.toLowerCase()
            : true;
          
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

