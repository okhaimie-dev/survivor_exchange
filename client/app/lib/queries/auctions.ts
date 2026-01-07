import { gql } from "@apollo/client";
import type { AuctionsResponse, MyListingsResponse } from "../types";
import { GRAPHQL_QUERY_LIMIT } from "../constants";

// Reduced limits from 1000000 - prevents massive payloads
export const AUCTIONS_QUERY = gql`
  query MyQuery {
    bm013AuctionItemModels(limit: ${GRAPHQL_QUERY_LIMIT}, order: {direction: DESC, field: AUCTION_ID}) {
      edges {
        node {
          auction_id
          contract_address
          item_index
          token_id
          entity {
            executedAt
          }
        }
      }
    }
    bm013AuctionModels(limit: ${GRAPHQL_QUERY_LIMIT}, order: {direction: DESC, field: AUCTION_ID}) {
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
    bm013BidModels(limit: ${GRAPHQL_QUERY_LIMIT}, order: {direction: DESC, field: AUCTION_ID}) {
      edges {
        node {
          auction_id
          bidder
          amount
        }
      }
    }
  }
`;

export async function fetchAuctions(): Promise<AuctionsResponse> {
  throw new Error("Use Apollo Client hooks instead. See useAuctions hook.");
}

export const MY_LISTINGS_QUERY = gql`
  query MyListings($seller: String!) {
    bm013AuctionModels(
      where: { seller: $seller }
      order: { direction: DESC, field: AUCTION_ID }
    ) {
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

export async function fetchMyListings(
  _seller: string,
): Promise<MyListingsResponse> {
  throw new Error("Use Apollo Client hooks instead. See useMyListings hook.");
}

// Optimized consolidated query - reduced limits to 500 (from 1M) and removed 'metadataDescription'.
// The 'metadata' field is included for NFT image display.
export const CONSOLIDATED_QUERY = gql`
  query ConsolidatedQuery($accountAddress: String, $seller: String, $skipNFTs: Boolean = false, $skipListings: Boolean = false) {
    myNFTs: tokenBalances(limit: ${GRAPHQL_QUERY_LIMIT}, accountAddress: $accountAddress) @skip(if: $skipNFTs) {
      edges {
        node {
          tokenMetadata {
            ... on ERC721__Token {
              metadataName
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
    auctionItems: bm013AuctionItemModels(limit: ${GRAPHQL_QUERY_LIMIT}, order: {direction: DESC, field: AUCTION_ID}) {
      edges {
        node {
          auction_id
          contract_address
          item_index
          token_id
          entity {
            executedAt
          }
        }
      }
    }
    auctions: bm013AuctionModels(limit: ${GRAPHQL_QUERY_LIMIT}, order: {direction: DESC, field: AUCTION_ID}) {
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
    myListings: bm013AuctionModels(where: {seller: $seller}, order: {direction: DESC, field: AUCTION_ID}) @skip(if: $skipListings) {
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
