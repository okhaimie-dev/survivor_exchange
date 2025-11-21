import { useEffect, useState } from 'react';
import { fetchMyListings, Auction, felt252ToString } from '../lib/graphql';

export interface FormattedListing {
  id: string;
  name: string;
  tokenCount: number;
  startingPrice: number;
  currentBid: number | null;
  highestBidder: string | null;
  status: string;
  endTime: string;
  seller: string;
  auctionId: string;
}

interface UseMyListingsOptions {
  seller?: string | null;
}

export function useMyListings({ seller }: UseMyListingsOptions) {
  const [listings, setListings] = useState<FormattedListing[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!seller) {
      setListings([]);
      setLoading(false);
      setError(null);
      return;
    }

    const fetchListings = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetchMyListings(seller);
        const auctions: Auction[] = response.bm002AuctionModels.edges.map((edge) => edge.node);

        const formattedListings: FormattedListing[] = auctions.map((auction) => {
          // Decode the name from felt252
          const decodedName = felt252ToString(auction.name);
          
          // Parse numeric values
          const startingPrice = parseFloat(auction.starting_price) || 0;
          const currentBid = auction.current_bid ? parseFloat(auction.current_bid) : null;
          const tokenCount = parseInt(auction.item_count, 10) || 0;

          return {
            id: `#${auction.auction_id}`,
            name: decodedName || `Auction ${auction.auction_id}`,
            tokenCount,
            startingPrice,
            currentBid,
            highestBidder: auction.highest_bidder || null,
            status: auction.status || 'pending',
            endTime: auction.end_time,
            seller: auction.seller,
            auctionId: auction.auction_id,
          };
        });

        setListings(formattedListings);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch listings'));
        setListings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [seller]);

  return { listings, loading, error };
}

