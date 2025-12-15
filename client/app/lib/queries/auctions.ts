import { gql } from '@apollo/client';
import type { AuctionsResponse, MyListingsResponse } from '../types';

export const AUCTIONS_QUERY = gql`
  query MyQuery {
    bm010AuctionItemModels(limit: 1000000, order: {direction: DESC, field: AUCTION_ID}) {
      edges {
        node {
          auction_id
          contract_address
          item_index
          token_id
        }
      }
    }
    bm010AuctionModels(limit: 1000000, order: {direction: DESC, field: AUCTION_ID}) {
      edges {
        node {
          auction_id
          current_bid
          end_time
          fee_token
          highest_bidder
          item_count
          name
          seller
          starting_price
          status
        }
      }
    }
  }
`;

export async function fetchAuctions(): Promise<AuctionsResponse> {
  throw new Error('Use Apollo Client hooks instead. See useAuctions hook.');
}

export const MY_LISTINGS_QUERY = gql`
  query MyListings($seller: String!) {
    bm010AuctionModels(where: {seller: $seller}, order: {direction: DESC, field: AUCTION_ID}) {
      edges {
        node {
          auction_id
          current_bid
          end_time
          fee_token
          highest_bidder
          item_count
          seller
          name
          starting_price
          status
        }
      }
    }
  }
`;

export async function fetchMyListings(_seller: string): Promise<MyListingsResponse> {
  throw new Error('Use Apollo Client hooks instead. See useMyListings hook.');
}

export const CONSOLIDATED_QUERY = gql`
  query ConsolidatedQuery($accountAddress: String, $seller: String) {
    myNFTs: tokenBalances(limit: 1000000, accountAddress: $accountAddress) @skip(if: $skipNFTs) {
      edges {
        node {
          tokenMetadata {
            ... on ERC721__Token {
              metadataName
              metadataDescription
              contractAddress
              imagePath
              metadata
              metadataAttributes
              name
              symbol
              tokenId
            }
          }
        }
      }
    }
    auctionItems: bm010AuctionItemModels(limit: 1000000, order: {direction: DESC, field: AUCTION_ID}) {
      edges {
        node {
          auction_id
          contract_address
          item_index
          token_id
        }
      }
    }
    auctions: bm010AuctionModels(limit: 1000000, order: {direction: DESC, field: AUCTION_ID}) {
      edges {
        node {
          auction_id
          current_bid
          end_time
          fee_token
          highest_bidder
          item_count
          name
          seller
          starting_price
          status
        }
      }
    }
    myListings: bm010AuctionModels(where: {seller: $seller}, order: {direction: DESC, field: AUCTION_ID}) @skip(if: $skipListings) {
      edges {
        node {
          auction_id
          current_bid
          end_time
          fee_token
          highest_bidder
          item_count
          seller
          name
          starting_price
          status
        }
      }
    }
  }
`;

