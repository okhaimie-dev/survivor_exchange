export interface AuctionItem {
  auction_id: string;
  contract_address: string;
  item_index: string;
  token_id: string;
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

export interface AuctionNode {
  node: Auction;
}

export interface AuctionsResponse {
  bm011AuctionModels: {
    edges: AuctionNode[];
  };
  bm011AuctionItemModels: {
    edges: AuctionItemNode[];
  };
}

export interface MyListingsResponse {
  bm011AuctionModels: {
    edges: AuctionNode[];
  };
}

export interface ConsolidatedDataResponse {
  myNFTs?: {
    tokenBalances: {
      edges: import('./nft').TokenBalanceEdge[];
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

