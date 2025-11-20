import { useEffect, useState, useMemo } from 'react';
import { fetchAuctions, AuctionsResponse, Auction, AuctionItem } from '../lib/graphql';

const PAGE_SIZE = 3;

export function useAuctions() {
  const [data, setData] = useState<AuctionsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const loadAuctions = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchAuctions();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch auctions'));
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    loadAuctions();
  }, []);

  // Extract auctions and items from response
  const allAuctions: Auction[] = useMemo(() => {
    return data?.bm002AuctionModels?.edges?.map((edge) => edge.node) || [];
  }, [data]);

  const allAuctionItems: AuctionItem[] = useMemo(() => {
    return data?.bm002AuctionItemModels?.edges?.map((edge) => edge.node) || [];
  }, [data]);

  // Paginate auctions
  const paginatedAuctions = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return allAuctions.slice(startIndex, startIndex + PAGE_SIZE);
  }, [allAuctions, currentPage]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(allAuctions.length / PAGE_SIZE));
  }, [allAuctions.length]);

  // Helper function to get items for a specific auction
  const getAuctionItems = (auctionId: string): AuctionItem[] => {
    return allAuctionItems.filter((item) => item.auction_id === auctionId);
  };

  return {
    auctions: paginatedAuctions,
    allAuctions,
    allAuctionItems,
    loading,
    error,
    currentPage,
    totalPages,
    setCurrentPage,
    getAuctionItems,
  };
}

