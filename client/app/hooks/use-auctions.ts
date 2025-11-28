import { useEffect, useState, useMemo } from 'react';
import { useQuery, useApolloClient } from '@apollo/client/react';
import { AUCTIONS_QUERY, AuctionsResponse, Auction, AuctionItem, MY_NFTS_QUERY, MyNFTsResponse, formatNFTs, FormattedNFT, ERC721Token, felt252ToString } from '../lib/graphql';

const PAGE_SIZE = 3;

/**
 * Normalizes token ID to padded hex format (0x + 64 hex chars)
 * Handles decimal numbers, hex strings, and already padded hex strings
 */
function normalizeTokenId(tokenId: string | number | null | undefined): string {
  if (tokenId === null || tokenId === undefined) return '';
  
  // Convert to string
  const tokenIdStr = String(tokenId);
  if (!tokenIdStr) return '';
  
  // Check if it starts with 0x or 0X (check first two characters)
  let hexPart: string;
  if (tokenIdStr.length >= 2 && tokenIdStr[0] === '0' && (tokenIdStr[1] === 'x' || tokenIdStr[1] === 'X')) {
    hexPart = tokenIdStr.slice(2);
  } else {
    hexPart = tokenIdStr;
  }
  
  // If it's a decimal number, convert to hex
  if (/^\d+$/.test(hexPart)) {
    const num = parseInt(hexPart, 10);
    hexPart = num.toString(16);
  }
  
  // Pad to 64 hex characters and add 0x prefix
  const padded = hexPart.toLowerCase().padStart(64, '0');
  return `0x${padded}`;
}

/**
 * Normalizes contract address to padded hex format (0x + 64 hex chars)
 */
function normalizeContractAddress(address: string | null | undefined): string {
  if (!address) return '';
  
  const addrStr = String(address);
  if (!addrStr) return '';
  
  // Remove 0x prefix if present
  let hexPart: string;
  if (addrStr.length >= 2 && addrStr[0] === '0' && (addrStr[1] === 'x' || addrStr[1] === 'X')) {
    hexPart = addrStr.slice(2);
  } else {
    hexPart = addrStr;
  }
  
  // Pad to 64 hex characters and add 0x prefix
  const padded = hexPart.toLowerCase().padStart(64, '0');
  return `0x${padded}`;
}

// Extended Auction type with NFT metadata
export interface AuctionWithNFTs extends Auction {
  nfts: FormattedNFT[];
}

export function useAuctions() {
  const [currentPage, setCurrentPage] = useState(1);
  const [auctionsWithNFTs, setAuctionsWithNFTs] = useState<AuctionWithNFTs[]>([]);
  const apolloClient = useApolloClient();

  const { data, loading, error } = useQuery<AuctionsResponse>(AUCTIONS_QUERY, {
    pollInterval: 1000, // Poll every second
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
    notifyOnNetworkStatusChange: false, // Prevent re-renders on network status changes
  });

  // Extract auctions and items from response
  const allAuctions: Auction[] = useMemo(() => {
    const auctions = data?.bm006AuctionModels?.edges?.map((edge) => {
      const auction = edge.node;
      // Convert name from felt252 to string
      return {
        ...auction,
        name: felt252ToString(auction.name) || auction.name,
      };
    }) || [];
    // Sort by auction_id numerically descending (latest first) as fallback
    // This ensures proper numeric ordering even if GraphQL returns string-ordered results
    const sorted = [...auctions].sort((a, b) => {
      const aId = parseInt(a.auction_id) || 0;
      const bId = parseInt(b.auction_id) || 0;
      return bId - aId; // DESC order
    });
    return sorted;
  }, [data]);

  const allAuctionItems: AuctionItem[] = useMemo(() => {
    return data?.bm006AuctionItemModels?.edges?.map((edge) => edge.node) || [];
  }, [data]);

  // Paginate auctions with NFTs
  const paginatedAuctions = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return auctionsWithNFTs.slice(startIndex, startIndex + PAGE_SIZE);
  }, [auctionsWithNFTs, currentPage]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(auctionsWithNFTs.length / PAGE_SIZE));
  }, [auctionsWithNFTs.length]);

  // Helper function to get items for a specific auction
  const getAuctionItems = useMemo(() => {
    return (auctionId: string): AuctionItem[] => {
      return allAuctionItems.filter((item) => item.auction_id === auctionId);
    };
  }, [allAuctionItems]);

  // Fetch NFT metadata for each auction's items using GraphQL
  useEffect(() => {
    if (!allAuctions.length || !allAuctionItems.length) return;

    const fetchAllAuctionNFTs = async () => {
      // Group auctions by seller to batch GraphQL queries
      const auctionsBySeller = new Map<string, { auction: Auction; items: AuctionItem[] }[]>();
      
      for (const auction of allAuctions) {
        const items = getAuctionItems(auction.auction_id);
        if (items.length === 0) continue;
        
        const seller = auction.seller;
        if (!auctionsBySeller.has(seller)) {
          auctionsBySeller.set(seller, []);
        }
        auctionsBySeller.get(seller)!.push({ auction, items });
      }

      // Fetch NFTs for each unique seller using GraphQL
      const auctionsWithNFTsData: AuctionWithNFTs[] = [];
      
      for (const [seller, auctionsWithItems] of auctionsBySeller) {
        try {
          // Make GraphQL call to fetch all NFTs for this seller using Apollo Client
          const { data: response } = await apolloClient.query<MyNFTsResponse>({
            query: MY_NFTS_QUERY,
            variables: { accountAddress: seller },
            fetchPolicy: 'network-only',
          });
          
          // Get all token IDs for all auctions from this seller and normalize them
          const allAuctionTokenIds = new Set<string>();
          const tokenIdToContract = new Map<string, string>();
          
          for (const { items } of auctionsWithItems) {
            items.forEach((item) => {
              if (item.token_id) {
                const normalized = normalizeTokenId(item.token_id).toLowerCase();
                allAuctionTokenIds.add(normalized);
                if (item.contract_address) {
                  tokenIdToContract.set(normalized, item.contract_address);
                }
              }
            });
          }
          
          // Filter tokenBalances directly by tokenId (normalized)
          const filteredEdges = response?.tokenBalances?.edges?.filter((edge) => {
            const tokenMetadata = edge.node.tokenMetadata;
            if (!tokenMetadata || !('tokenId' in tokenMetadata)) return false;
            
            const nftTokenId = tokenMetadata.tokenId;
            const normalizedNftTokenId = normalizeTokenId(nftTokenId).toLowerCase();
            return normalizedNftTokenId && allAuctionTokenIds.has(normalizedNftTokenId);
          }) || [];
          
          const rawNFTs: ERC721Token[] = filteredEdges
            .map((edge) => edge.node.tokenMetadata)
            .filter((metadata): metadata is ERC721Token => metadata !== null && metadata !== undefined);
          
          const sellerNFTs = formatNFTs(rawNFTs);

          // Group NFTs by auction based on token IDs
          for (const { auction, items } of auctionsWithItems) {
            // Normalize auction token IDs and contract addresses for comparison
            const auctionTokenIds = new Set(
              items.map((item) => normalizeTokenId(item.token_id).toLowerCase()).filter(Boolean)
            );
            const auctionContractAddresses = new Set(
              items.map((item) => normalizeContractAddress(item.contract_address).toLowerCase()).filter(Boolean)
            );

            // Filter seller's NFTs by this auction's token IDs (normalize NFT token IDs and contract addresses too)
            const matchedNFTs = sellerNFTs.filter((nft) => {
              const nftTokenIdNormalized = normalizeTokenId(nft.tokenId).toLowerCase();
              const nftContractNormalized = normalizeContractAddress(nft.contractAddress).toLowerCase();
              
              const matchesTokenId = nftTokenIdNormalized && auctionTokenIds.has(nftTokenIdNormalized);
              const matchesContract = nftContractNormalized && auctionContractAddresses.has(nftContractNormalized);
              
              return matchesTokenId && matchesContract;
            });

            // Add NFT metadata to auction data (name already converted in allAuctions)
            auctionsWithNFTsData.push({
              ...auction,
              nfts: matchedNFTs,
            });
          }
        } catch (err) {
          // Still add auctions without NFTs if fetch fails
          for (const { auction } of auctionsWithItems) {
            auctionsWithNFTsData.push({
              ...auction,
              nfts: [],
            });
          }
        }
      }

      // Add auctions that don't have items (no NFTs to fetch) (name already converted in allAuctions)
      for (const auction of allAuctions) {
        const items = getAuctionItems(auction.auction_id);
        if (items.length === 0) {
          auctionsWithNFTsData.push({
            ...auction,
            nfts: [],
          });
        }
      }

      setAuctionsWithNFTs(auctionsWithNFTsData);
    };

    fetchAllAuctionNFTs();
  }, [allAuctions, allAuctionItems, getAuctionItems, apolloClient]);

  return {
    auctions: paginatedAuctions,
    allAuctions: auctionsWithNFTs,
    allAuctionItems,
    loading,
    error,
    currentPage,
    totalPages,
    setCurrentPage,
    getAuctionItems,
  };
}

