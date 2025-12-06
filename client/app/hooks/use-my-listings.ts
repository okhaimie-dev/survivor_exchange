import { useQuery } from '@apollo/client/react';
import { useMemo } from 'react';
import { MY_LISTINGS_QUERY } from '../lib/queries';
import type { MyListingsResponse, Auction } from '../lib/types';
import { byteArrayToString } from '../lib/utils';
import { DEFAULT_POLL_INTERVAL } from '../lib/constants';

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
  feeToken: string;
}

interface UseMyListingsOptions {
  seller?: string | null;
}

export function useMyListings({ seller }: UseMyListingsOptions) {
  const { data, loading, error } = useQuery<MyListingsResponse>(MY_LISTINGS_QUERY, {
    variables: { seller: seller || '' },
    skip: !seller,
    pollInterval: DEFAULT_POLL_INTERVAL,
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
    notifyOnNetworkStatusChange: false,
  });

  const listings: FormattedListing[] = useMemo(() => {
    if (!data?.bm008AuctionModels?.edges) return [];

    const auctions: Auction[] = data.bm008AuctionModels.edges.map((edge: { node: Auction }) => edge.node);

    return auctions.map((auction) => {
      const decodedName = byteArrayToString(auction.name);
      
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
        feeToken: auction.fee_token,
      };
    });
  }, [data]);

  return { 
    listings, 
    loading, 
    error: error ? new Error(error.message || 'Failed to fetch listings') : null 
  };
}

