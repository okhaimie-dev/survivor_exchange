import { useQuery } from "@apollo/client/react";
import { useMemo } from "react";
import { MY_LISTINGS_QUERY } from "../lib/queries";
import type { MyListingsResponse, Auction, Offer } from "../lib/types";
import { byteArrayToString } from "../lib/utils";
import { normalizeContractAddress } from "../lib/utils/normalization";
import { DEFAULT_POLL_INTERVAL } from "../lib/constants";

export interface FormattedOffer {
  buyer: string;
  amount: number;
  status: string;
  createdAt: string;
  expiresAt: string;
}

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
  offers: FormattedOffer[];
}

interface UseMyListingsOptions {
  seller?: string | null;
}

export function useMyListings({ seller }: UseMyListingsOptions) {
  // Normalize seller address before query
  const normalizedSeller = seller
    ? normalizeContractAddress(seller)
    : undefined;

  const { data, loading, error } = useQuery<MyListingsResponse>(
    MY_LISTINGS_QUERY,
    {
      variables: { seller: normalizedSeller || "" },
      skip: !normalizedSeller,
      pollInterval: DEFAULT_POLL_INTERVAL,
      fetchPolicy: "cache-and-network",
      errorPolicy: "all",
      notifyOnNetworkStatusChange: false,
    },
  );

  // Process offers into a map by auction_id
  const offersByAuction = useMemo(() => {
    const map = new Map<string, FormattedOffer[]>();
    if (!data?.bm011OfferModels?.edges) return map;

    for (const edge of data.bm011OfferModels.edges) {
      const offer = edge.node;

      // Parse status - handle various formats (decimal string, hex string, or number)
      let statusNum: number;
      if (typeof offer.status === "number") {
        statusNum = offer.status;
      } else if (typeof offer.status === "string") {
        statusNum =
          offer.status.startsWith("0x") || offer.status.startsWith("0X")
            ? parseInt(offer.status, 16)
            : parseInt(offer.status, 10);
      } else {
        statusNum = -1;
      }

      // Only include pending offers (status === 1)
      if (statusNum === 1) {
        const auctionId = offer.auction_id;
        const existing = map.get(auctionId) || [];

        // Parse amount
        const amountStr = offer.amount || "0";
        const amount =
          amountStr.startsWith("0x") || amountStr.startsWith("0X")
            ? parseInt(amountStr, 16) / 1e6
            : parseFloat(amountStr) / 1e6;

        existing.push({
          buyer: offer.buyer ? normalizeContractAddress(offer.buyer) : "",
          amount,
          status: offer.status,
          createdAt: offer.created_at,
          expiresAt: offer.expires_at,
        });
        map.set(auctionId, existing);
      }
    }

    return map;
  }, [data]);

  const listings: FormattedListing[] = useMemo(() => {
    if (!data?.bm011AuctionModels?.edges) return [];

    const auctions: Auction[] = data.bm011AuctionModels.edges.map(
      (edge: { node: Auction }) => edge.node,
    );

    return auctions.map((auction) => {
      const decodedName = byteArrayToString(auction.name);

      // Parse starting_price - handle both decimal and hex strings
      const startingPriceStr = auction.starting_price || "0";
      const startingPrice =
        startingPriceStr.startsWith("0x") || startingPriceStr.startsWith("0X")
          ? parseInt(startingPriceStr, 16)
          : parseFloat(startingPriceStr);

      // Parse current_bid - handle both decimal and hex strings, then divide by 1e6
      const currentBid = auction.current_bid
        ? (() => {
            const bidStr = auction.current_bid;
            const parsed =
              bidStr.startsWith("0x") || bidStr.startsWith("0X")
                ? parseInt(bidStr, 16)
                : parseFloat(bidStr);
            return parsed / 1e6;
          })()
        : null;
      const tokenCount = parseInt(auction.item_count, 10) || 0;

      // Normalize addresses from GraphQL response
      const normalizedSeller = auction.seller
        ? normalizeContractAddress(auction.seller)
        : "";
      const normalizedHighestBidder = auction.highest_bidder
        ? normalizeContractAddress(auction.highest_bidder)
        : null;
      const normalizedFeeToken = auction.fee_token
        ? normalizeContractAddress(auction.fee_token)
        : "";

      // Get offers for this auction
      const offers = offersByAuction.get(auction.auction_id) || [];

      return {
        id: `#${auction.auction_id}`,
        name: decodedName || `Auction ${auction.auction_id}`,
        tokenCount,
        startingPrice,
        currentBid,
        highestBidder: normalizedHighestBidder,
        status: auction.status || "pending",
        endTime: auction.end_time,
        seller: normalizedSeller,
        auctionId: auction.auction_id,
        feeToken: normalizedFeeToken,
        offers,
      };
    });
  }, [data, offersByAuction]);

  return {
    listings,
    loading,
    error: error
      ? new Error(error.message || "Failed to fetch listings")
      : null,
  };
}
