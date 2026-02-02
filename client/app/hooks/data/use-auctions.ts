import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useQuery, useApolloClient } from "@apollo/client/react";
import { AUCTIONS_QUERY, MY_NFTS_QUERY } from "../../lib/queries";
import type {
  AuctionsResponse,
  Auction,
  AuctionItem,
  Bid,
  Offer,
  MyNFTsResponse,
  FormattedNFT,
  ERC721Token,
} from "../../lib/types";
import { formatNFTs, byteArrayToString, parseStatus } from "../../lib/utils";
import {
  normalizeTokenId,
  normalizeContractAddress,
} from "../../lib/utils/normalization";
import { DEFAULT_PAGE_SIZE } from "../../lib/constants";

export interface AuctionWithNFTs extends Auction {
  nfts: FormattedNFT[];
  bids?: Bid[];
  offers?: Offer[];
  executedAt?: string;
}

// Module-level cache so seller NFTs persist across hook re-instantiations
const sellerNFTCache = new Map<string, FormattedNFT[]>();

export function useAuctions() {
  const [currentPage, setCurrentPage] = useState(1);
  const [auctionsWithNFTs, setAuctionsWithNFTs] = useState<AuctionWithNFTs[]>(
    [],
  );
  const [isProcessingNFTs, setIsProcessingNFTs] = useState(false);
  const hasInitialData = useRef(false);
  const isFetchingNFTs = useRef(false);
  const apolloClient = useApolloClient();

  const { data, loading, error, refetch } = useQuery<AuctionsResponse>(AUCTIONS_QUERY, {
    fetchPolicy: "cache-first",
    errorPolicy: "all",
    notifyOnNetworkStatusChange: false,
  });

  const allAuctions: Auction[] = useMemo(() => {
    const auctions =
      data?.bm021AuctionModels?.edges?.map((edge) => {
        const auction = edge.node;
        // Normalize addresses from GraphQL response
        return {
          ...auction,
          name: byteArrayToString(auction.name) || auction.name,
          seller: auction.seller
            ? normalizeContractAddress(auction.seller)
            : auction.seller,
          highest_bidder: auction.highest_bidder
            ? normalizeContractAddress(auction.highest_bidder)
            : auction.highest_bidder,
          fee_token: auction.fee_token
            ? normalizeContractAddress(auction.fee_token)
            : auction.fee_token,
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
    return data?.bm021AuctionItemModels?.edges?.map((edge) => edge.node) || [];
  }, [data]);

  const allBids: Bid[] = useMemo(() => {
    return (
      data?.bm021BidModels?.edges?.map((edge) => {
        const bid = edge.node;
        return {
          ...bid,
          bidder: bid.bidder
            ? normalizeContractAddress(bid.bidder)
            : bid.bidder,
        };
      }) || []
    );
  }, [data]);

  const allOffers: Offer[] = useMemo(() => {
    return (
      data?.bm021OfferModels?.edges?.map((edge) => {
        const offer = edge.node;
        return {
          ...offer,
          buyer: offer.buyer
            ? normalizeContractAddress(offer.buyer)
            : offer.buyer,
        };
      }) || []
    );
  }, [data]);

  const itemsByAuction = useMemo(() => {
    const map = new Map<string, AuctionItem[]>();
    for (const item of allAuctionItems) {
      const auctionIdStr = String(item.auction_id);
      const existing = map.get(auctionIdStr) || [];
      existing.push(item);
      map.set(auctionIdStr, existing);
    }
    return map;
  }, [allAuctionItems]);

  const bidsByAuction = useMemo(() => {
    const map = new Map<string, Bid[]>();
    for (const bid of allBids) {
      const auctionIdStr = String(bid.auction_id);
      const existing = map.get(auctionIdStr) || [];
      existing.push(bid);
      map.set(auctionIdStr, existing);
    }
    return map;
  }, [allBids]);

  const offersByAuction = useMemo(() => {
    const map = new Map<string, Offer[]>();
    for (const offer of allOffers) {
      const statusNum = parseStatus(offer.status);

      // Only include pending offers (status === 1)
      if (statusNum === 1) {
        const auctionIdStr = String(offer.auction_id);
        const existing = map.get(auctionIdStr) || [];
        existing.push(offer);
        map.set(auctionIdStr, existing);
      }
    }
    return map;
  }, [allOffers]);

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

  // Fetch all NFTs for a single seller (beasts + adventurers) - cache per seller, used for both collections
  const fetchSellerNFTs = useCallback(
    async (seller: string): Promise<FormattedNFT[]> => {
      const cached = sellerNFTCache.get(seller);
      if (cached) return cached;

      const { data: response } = await apolloClient.query<MyNFTsResponse>({
        query: MY_NFTS_QUERY,
        variables: { accountAddress: seller },
        fetchPolicy: "cache-first",
      });

      const rawNFTs: ERC721Token[] = (
        response?.tokenBalances?.edges || []
      ).flatMap((edge) => {
        const metadata = edge.node.tokenMetadata;
        if (!metadata || !("tokenId" in metadata)) return [];
        return [
          {
            ...metadata,
            contractAddress: metadata.contractAddress
              ? normalizeContractAddress(metadata.contractAddress)
              : metadata.contractAddress,
          },
        ];
      });

      const formattedNFTs = formatNFTs(rawNFTs);
      sellerNFTCache.set(seller, formattedNFTs);
      return formattedNFTs;
    },
    [apolloClient],
  );

  // Assemble auctions with NFTs, bids, and offers
  // NFT fetching happens once per seller (cached), while bids/offers update on each poll
  useEffect(() => {
    const assembleAuctions = async () => {
      if (!allAuctions.length) {
        setAuctionsWithNFTs([]);
        setIsProcessingNFTs(false);
        hasInitialData.current = false;
        return;
      }

      // Prevent concurrent fetches
      if (isFetchingNFTs.current) return;
      isFetchingNFTs.current = true;

      // Only show loading state on initial load, not on updates
      if (!hasInitialData.current) {
        setIsProcessingNFTs(true);
      }

      // Group auctions by seller
      const auctionsBySeller = new Map<string, Auction[]>();
      for (const auction of allAuctions) {
        const items = itemsByAuction.get(String(auction.auction_id));
        if (items && items.length > 0) {
          const existing = auctionsBySeller.get(auction.seller) || [];
          existing.push(auction);
          auctionsBySeller.set(auction.seller, existing);
        }
      }

      const auctionsWithNFTsData: AuctionWithNFTs[] = [];

      for (const [seller, sellerAuctions] of auctionsBySeller) {
        let allSellerNFTs: FormattedNFT[] = [];

        try {
          allSellerNFTs = await fetchSellerNFTs(seller);
        } catch {
          // On error, use empty NFTs array - don't block auction display
        }

        for (const auction of sellerAuctions) {
          const auctionIdStr = String(auction.auction_id);
          const items = itemsByAuction.get(auctionIdStr) || [];
          // Match by contract (beasts vs adventurers) and token_id
          const itemContract =
            items.length > 0 && items[0].contract_address
              ? normalizeContractAddress(items[0].contract_address).toLowerCase()
              : "";
          const nftsForContract = itemContract
            ? allSellerNFTs.filter(
                (nft) =>
                  normalizeContractAddress(nft.contractAddress || "").toLowerCase() === itemContract,
              )
            : allSellerNFTs;
          const matchedNFTs = nftsForContract.filter((nft) =>
            items.some(
              (item) => nft.tokenId === normalizeTokenId(item.token_id),
            ),
          );
          const bids = bidsByAuction.get(auctionIdStr) || [];
          const offers = offersByAuction.get(auctionIdStr) || [];
          const executedAt =
            items.length > 0 && items[0].entity?.executedAt
              ? items[0].entity.executedAt
              : undefined;

          auctionsWithNFTsData.push({
            ...auction,
            nfts: matchedNFTs,
            bids,
            offers,
            executedAt,
          });
        }
      }

      // Also add auctions without items
      for (const auction of allAuctions) {
        const auctionIdStr = String(auction.auction_id);
        if (!itemsByAuction.has(auctionIdStr)) {
          const bids = bidsByAuction.get(auctionIdStr) || [];
          const offers = offersByAuction.get(auctionIdStr) || [];
          auctionsWithNFTsData.push({
            ...auction,
            nfts: [],
            bids,
            offers,
            executedAt: undefined,
          });
        }
      }

      setAuctionsWithNFTs(auctionsWithNFTsData);
      setIsProcessingNFTs(false);
      hasInitialData.current = true;
      isFetchingNFTs.current = false;
    };

    assembleAuctions();
  }, [
    allAuctions,
    itemsByAuction,
    bidsByAuction,
    offersByAuction,
    fetchSellerNFTs,
  ]);

  // Only show loading on initial load, not when updating existing data
  const isLoading = !hasInitialData.current && (loading || isProcessingNFTs);

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
    refetch,
  };
}
