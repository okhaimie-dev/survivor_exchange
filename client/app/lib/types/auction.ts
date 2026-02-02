export interface AuctionItem {
  auction_id: string;
  contract_address: string;
  item_index: string;
  token_id: string;
  entity?: {
    executedAt?: string;
  };
}

export interface AuctionItemNode {
  node: AuctionItem;
}

export interface Auction {
  auction_id: string;
  current_bid: string;
  end_time: string;
  fee_token: string;
  highest_bidder: string;
  item_count: string;
  name: string;
  seller: string;
  starting_price: string;
  status: string;
}

export interface Bid {
  auction_id: string;
  bidder: string;
  amount: string;
}

export interface Offer {
  auction_id: string;
  buyer: string;
  amount: string;
  status: string;
  created_at: string;
  expires_at: string;
}

export interface AuctionNode {
  node: Auction;
}

export interface BidNode {
  node: Bid;
}

export interface OfferNode {
  node: Offer;
}

export interface AuctionsResponse {
  bm021AuctionModels: {
    edges: AuctionNode[];
  };
  bm021AuctionItemModels: {
    edges: AuctionItemNode[];
  };
  bm021BidModels: {
    edges: BidNode[];
  };
  bm021OfferModels?: {
    edges: OfferNode[];
  };
}

export interface MyListingsResponse {
  bm021AuctionModels: {
    edges: AuctionNode[];
  };
  bm021OfferModels?: {
    edges: OfferNode[];
  };
}

export interface ConsolidatedDataResponse {
  myNFTs?: {
    tokenBalances: {
      edges: import("./nft").TokenBalanceEdge[];
    };
  };
  auctionItems?: {
    edges: AuctionItemNode[];
  };
  auctions?: {
    edges: AuctionNode[];
  };
  myListings?: {
    edges: AuctionNode[];
  };
}

/**
 * Collection represents the display format for an auction in the UI
 */
export interface Collection {
  id: string;
  name: string;
  fullName?: string;
  totalMonsters: number;
  startingPrice: number;
  highestBid?: number;
  image: string;
  status: string;
  endTime: string;
  sellerFull: string;
  highestBidderFull: string;
  executedAt?: string;
  /** Token the reserve is denominated in (e.g. USDC, STRK) */
  reserveTokenSymbol?: string;
  reserveTokenAddress?: string;
}

/**
 * User's active offer on an auction
 */
export interface UserOffer {
  buyer: string;
  amount: number;
  status: string;
  createdAt: string;
  expiresAt: string;
}
