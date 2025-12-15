import { useQuery } from '@apollo/client/react';
import { useMemo } from 'react';
import { MY_LISTINGS_QUERY } from '../lib/queries';
import type { MyListingsResponse, Auction } from '../lib/types';
import { byteArrayToString } from '../lib/utils';
import { normalizeContractAddress } from '../lib/utils/normalization';
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
  // Normalize seller address before query
  const normalizedSeller = seller ? normalizeContractAddress(seller) : undefined;
  
  const { data, loading, error } = useQuery<MyListingsResponse>(MY_LISTINGS_QUERY, {
    variables: { seller: normalizedSeller || '' },
    skip: !normalizedSeller,
    pollInterval: DEFAULT_POLL_INTERVAL,
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
    notifyOnNetworkStatusChange: false,
  });

  const listings: FormattedListing[] = useMemo(() => {
    if (!data?.bm011AuctionModels?.edges) return [];

    const auctions: Auction[] = data.bm011AuctionModels.edges.map((edge: { node: Auction }) => edge.node);

    return auctions.map((auction) => {
      const decodedName = byteArrayToString(auction.name);
      
      // Parse starting_price - handle both decimal and hex strings
      const startingPriceStr = auction.starting_price || "0";
      const startingPrice = startingPriceStr.startsWith('0x') || startingPriceStr.startsWith('0X') 
        ? parseInt(startingPriceStr, 16) 
        : parseFloat(startingPriceStr);
      
      // Parse current_bid - handle both decimal and hex strings, then divide by 1e6
      const currentBid = auction.current_bid ? (() => {
        const bidStr = auction.current_bid;
        const parsed = bidStr.startsWith('0x') || bidStr.startsWith('0X') 
          ? parseInt(bidStr, 16) 
          : parseFloat(bidStr);
        return parsed / 1e6;
      })() : null;
      const tokenCount = parseInt(auction.item_count, 10) || 0;

      // Normalize addresses from GraphQL response
      const normalizedSeller = auction.seller ? normalizeContractAddress(auction.seller) : '';
      const normalizedHighestBidder = auction.highest_bidder ? normalizeContractAddress(auction.highest_bidder) : null;
      const normalizedFeeToken = auction.fee_token ? normalizeContractAddress(auction.fee_token) : '';

      return {
        id: `#${auction.auction_id}`,
        name: decodedName || `Auction ${auction.auction_id}`,
        tokenCount,
        startingPrice,
        currentBid,
        highestBidder: normalizedHighestBidder,
        status: auction.status || 'pending',
        endTime: auction.end_time,
        seller: normalizedSeller,
        auctionId: auction.auction_id,
        feeToken: normalizedFeeToken,
      };
    });
  }, [data]);

  return { 
    listings, 
    loading, 
    error: error ? new Error(error.message || 'Failed to fetch listings') : null 
  };
}

