import { useEffect, useState, useMemo, useRef } from 'react';
import { useQuery, useApolloClient } from '@apollo/client/react';
import { AUCTIONS_QUERY, MY_NFTS_QUERY } from '../lib/queries';
import type { AuctionsResponse, Auction, AuctionItem, MyNFTsResponse, FormattedNFT, ERC721Token } from '../lib/types';
import { formatNFTs, byteArrayToString } from '../lib/utils';
import { normalizeTokenId, normalizeContractAddress } from '../lib/utils/normalization';
import { DEFAULT_PAGE_SIZE, DEFAULT_POLL_INTERVAL, BEASTS_NFT_CONTRACT_ADDRESS } from '../lib/constants';

export interface AuctionWithNFTs extends Auction {
  nfts: FormattedNFT[];
}

export function useAuctions() {
  const [currentPage, setCurrentPage] = useState(1);
  const [auctionsWithNFTs, setAuctionsWithNFTs] = useState<AuctionWithNFTs[]>([]);
  const [isProcessingNFTs, setIsProcessingNFTs] = useState(false);
  const hasInitialData = useRef(false);
  const apolloClient = useApolloClient();

  const { data, loading, error } = useQuery<AuctionsResponse>(AUCTIONS_QUERY, {
    pollInterval: DEFAULT_POLL_INTERVAL,
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
    notifyOnNetworkStatusChange: false,
  });

  const allAuctions: Auction[] = useMemo(() => {
    const auctions = data?.bm011AuctionModels?.edges?.map((edge) => {
      const auction = edge.node;
      // Normalize addresses from GraphQL response
      return {
        ...auction,
        name: byteArrayToString(auction.name) || auction.name,
        seller: auction.seller ? normalizeContractAddress(auction.seller) : auction.seller,
        highest_bidder: auction.highest_bidder ? normalizeContractAddress(auction.highest_bidder) : auction.highest_bidder,
        fee_token: auction.fee_token ? normalizeContractAddress(auction.fee_token) : auction.fee_token,
      };
    }) || [];
    const filtered = auctions.filter((auction) => {
      const statusNum = parseInt(auction.status);
      return statusNum === 2 || statusNum === 3; // Active (2) and Ended (3)
    });
    return [...filtered].sort((a, b) => {
      const aId = parseInt(a.auction_id) || 0;
      const bId = parseInt(b.auction_id) || 0;
      return bId - aId;
    });
  }, [data]);

  const allAuctionItems: AuctionItem[] = useMemo(() => {
    return data?.bm011AuctionItemModels?.edges?.map((edge) => edge.node) || [];
  }, [data]);

  const itemsByAuction = useMemo(() => {
    const map = new Map<string, AuctionItem[]>();
    for (const item of allAuctionItems) {
      const existing = map.get(item.auction_id) || [];
      existing.push(item);
      map.set(item.auction_id, existing);
    }
    return map;
  }, [allAuctionItems]);

  const paginatedAuctions = useMemo(() => {
    const startIndex = (currentPage - 1) * DEFAULT_PAGE_SIZE;
    return auctionsWithNFTs.slice(startIndex, startIndex + DEFAULT_PAGE_SIZE);
  }, [auctionsWithNFTs, currentPage]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(auctionsWithNFTs.length / DEFAULT_PAGE_SIZE));
  }, [auctionsWithNFTs.length]);

  const getAuctionItems = useMemo(() => {
    return (auctionId: string): AuctionItem[] => {
      return itemsByAuction.get(auctionId) || [];
    };
  }, [itemsByAuction]);

  useEffect(() => {
    const fetchAllAuctionNFTs = async () => {
      if (!allAuctions.length) {
        setAuctionsWithNFTs([]);
        setIsProcessingNFTs(false);
        hasInitialData.current = false;
        return;
      }

      // Only show loading state on initial load, not on updates
      if (!hasInitialData.current) {
        setIsProcessingNFTs(true);
      }

      const auctionsBySeller = new Map<string, Auction[]>();
      for (const auction of allAuctions) {
        const items = itemsByAuction.get(auction.auction_id);
        if (items && items.length > 0) {
          const existing = auctionsBySeller.get(auction.seller) || [];
          existing.push(auction);
          auctionsBySeller.set(auction.seller, existing);
        }
      }

      const auctionsWithNFTsData: AuctionWithNFTs[] = [];
      const targetContractNormalized = normalizeContractAddress(BEASTS_NFT_CONTRACT_ADDRESS).toLowerCase();

      for (const [seller, sellerAuctions] of auctionsBySeller) {
        try {
          // seller is already normalized from allAuctions useMemo
          const { data: response } = await apolloClient.query<MyNFTsResponse>({
            query: MY_NFTS_QUERY,
            variables: { accountAddress: seller },
            fetchPolicy: 'network-only',
          });

          const rawNFTs: ERC721Token[] = (response?.tokenBalances?.edges || [])
            .flatMap((edge) => {
              const metadata = edge.node.tokenMetadata;
              if (!metadata || !('tokenId' in metadata)) return [];
              // Normalize contract addresses from GraphQL
              const normalized: ERC721Token = {
                ...metadata,
                contractAddress: metadata.contractAddress ? normalizeContractAddress(metadata.contractAddress) : metadata.contractAddress,
              };
              const nftContract = normalizeContractAddress(normalized.contractAddress).toLowerCase();
              return nftContract === targetContractNormalized ? [normalized] : [];
            });

          const formattedNFTs = formatNFTs(rawNFTs);

          for (const auction of sellerAuctions) {
            const items = itemsByAuction.get(auction.auction_id) || [];
            const matchedNFTs = formattedNFTs.filter((nft) => items.some(item => nft.tokenId === normalizeTokenId(item.token_id)));

            auctionsWithNFTsData.push({
              ...auction,
              nfts: matchedNFTs,
            });
          }
        } catch {
          for (const auction of sellerAuctions) {
            auctionsWithNFTsData.push({
              ...auction,
              nfts: [],
            });
          }
        }
      }

      for (const auction of allAuctions) {
        if (!itemsByAuction.has(auction.auction_id)) {
          auctionsWithNFTsData.push({
            ...auction,
            nfts: [],
          });
        }
      }

      setAuctionsWithNFTs(auctionsWithNFTsData);
      setIsProcessingNFTs(false);
      hasInitialData.current = true;
    };

    fetchAllAuctionNFTs();
  }, [allAuctions, itemsByAuction, apolloClient]);

  // Only show loading on initial load, not when updating existing data
  const isLoading = (!hasInitialData.current && (loading || isProcessingNFTs));

  return {
    auctions: paginatedAuctions,
    allAuctions: auctionsWithNFTs,
    allAuctionItems,
    loading: isLoading,
    error,
    currentPage,
    totalPages,
    setCurrentPage,
    getAuctionItems,
  };
}

