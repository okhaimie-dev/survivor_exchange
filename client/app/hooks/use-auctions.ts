import { useEffect, useState, useMemo } from 'react';
import { useQuery, useApolloClient } from '@apollo/client/react';
import { AUCTIONS_QUERY, AuctionsResponse, Auction, AuctionItem, MY_NFTS_QUERY, MyNFTsResponse, formatNFTs, FormattedNFT, ERC721Token, felt252ToString } from '../lib/graphql';
import { DEFAULT_PAGE_SIZE, DEFAULT_POLL_INTERVAL, BEASTS_NFT_CONTRACT_ADDRESS } from '../lib/constants';

function normalizeTokenId(tokenId: string | number | null | undefined): string {
  if (tokenId === null || tokenId === undefined) return '';
  
  const tokenIdStr = String(tokenId);
  if (!tokenIdStr) return '';
  
  let hexPart: string;
  if (tokenIdStr.length >= 2 && tokenIdStr[0] === '0' && (tokenIdStr[1] === 'x' || tokenIdStr[1] === 'X')) {
    hexPart = tokenIdStr.slice(2);
  } else {
    hexPart = tokenIdStr;
  }
  
  if (/^\d+$/.test(hexPart)) {
    const num = parseInt(hexPart, 10);
    hexPart = num.toString(16);
  }
  
  const padded = hexPart.toLowerCase().padStart(64, '0');
  return `0x${padded}`;
}

function normalizeContractAddress(address: string | null | undefined): string {
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
}

export interface AuctionWithNFTs extends Auction {
  nfts: FormattedNFT[];
}

export function useAuctions() {
  const [currentPage, setCurrentPage] = useState(1);
  const [auctionsWithNFTs, setAuctionsWithNFTs] = useState<AuctionWithNFTs[]>([]);
  const apolloClient = useApolloClient();

  const { data, loading, error } = useQuery<AuctionsResponse>(AUCTIONS_QUERY, {
    pollInterval: DEFAULT_POLL_INTERVAL,
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
    notifyOnNetworkStatusChange: false,
  });

  const allAuctions: Auction[] = useMemo(() => {
    const auctions = data?.bm006AuctionModels?.edges?.map((edge) => {
      const auction = edge.node;
      return {
        ...auction,
        name: felt252ToString(auction.name) || auction.name,
      };
    }) || [];
    const sorted = [...auctions].sort((a, b) => {
      const aId = parseInt(a.auction_id) || 0;
      const bId = parseInt(b.auction_id) || 0;
      return bId - aId;
    });
    return sorted;
  }, [data]);

  const allAuctionItems: AuctionItem[] = useMemo(() => {
    return data?.bm006AuctionItemModels?.edges?.map((edge) => edge.node) || [];
  }, [data]);

  const paginatedAuctions = useMemo(() => {
    const startIndex = (currentPage - 1) * DEFAULT_PAGE_SIZE;
    return auctionsWithNFTs.slice(startIndex, startIndex + DEFAULT_PAGE_SIZE);
  }, [auctionsWithNFTs, currentPage]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(auctionsWithNFTs.length / DEFAULT_PAGE_SIZE));
  }, [auctionsWithNFTs.length]);

  const getAuctionItems = useMemo(() => {
    return (auctionId: string): AuctionItem[] => {
      return allAuctionItems.filter((item) => item.auction_id === auctionId);
    };
  }, [allAuctionItems]);

  useEffect(() => {
    if (!allAuctions.length || !allAuctionItems.length) return;

    const fetchAllAuctionNFTs = async () => {
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

      const auctionsWithNFTsData: AuctionWithNFTs[] = [];
      
      for (const [seller, auctionsWithItems] of auctionsBySeller) {
        try {
          const { data: response } = await apolloClient.query<MyNFTsResponse>({
            query: MY_NFTS_QUERY,
            variables: { accountAddress: seller },
            fetchPolicy: 'network-only',
          });
          
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
          
          const targetContractNormalized = normalizeContractAddress(BEASTS_NFT_CONTRACT_ADDRESS).toLowerCase();
          const filteredEdges = response?.tokenBalances?.edges?.filter((edge) => {
            const tokenMetadata = edge.node.tokenMetadata;
            if (!tokenMetadata || !('tokenId' in tokenMetadata)) return false;
            
            const nftContractAddress = tokenMetadata.contractAddress;
            if (!nftContractAddress) return false;
            const nftContractNormalized = normalizeContractAddress(nftContractAddress).toLowerCase();
            if (nftContractNormalized !== targetContractNormalized) return false;
            
            const nftTokenId = tokenMetadata.tokenId;
            const normalizedNftTokenId = normalizeTokenId(nftTokenId).toLowerCase();
            return normalizedNftTokenId && allAuctionTokenIds.has(normalizedNftTokenId);
          }) || [];
          
          const rawNFTs: ERC721Token[] = filteredEdges
            .map((edge) => edge.node.tokenMetadata)
            .filter((metadata): metadata is ERC721Token => metadata !== null && metadata !== undefined);
          
          const sellerNFTs = formatNFTs(rawNFTs);

          for (const { auction, items } of auctionsWithItems) {
            const auctionTokenIds = new Set(
              items.map((item) => normalizeTokenId(item.token_id).toLowerCase()).filter(Boolean)
            );
            const auctionContractAddresses = new Set(
              items.map((item) => normalizeContractAddress(item.contract_address).toLowerCase()).filter(Boolean)
            );

            const matchedNFTs = sellerNFTs.filter((nft) => {
              const nftTokenIdNormalized = normalizeTokenId(nft.tokenId).toLowerCase();
              const nftContractNormalized = normalizeContractAddress(nft.contractAddress).toLowerCase();
              
              const matchesTokenId = nftTokenIdNormalized && auctionTokenIds.has(nftTokenIdNormalized);
              const matchesContract = nftContractNormalized && auctionContractAddresses.has(nftContractNormalized);
              
              return matchesTokenId && matchesContract;
            });

            auctionsWithNFTsData.push({
              ...auction,
              nfts: matchedNFTs,
            });
          }
        } catch (_err) {
          for (const { auction } of auctionsWithItems) {
            auctionsWithNFTsData.push({
              ...auction,
              nfts: [],
            });
          }
        }
      }

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

