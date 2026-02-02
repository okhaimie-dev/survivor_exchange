import { gql } from '@apollo/client';
import type { MyNFTsResponse } from '../types';
import { GRAPHQL_QUERY_LIMIT } from '../constants';

export const MY_NFTS_QUERY = gql`
  query MyNFTS($accountAddress: String!) {
    tokenBalances(limit: ${GRAPHQL_QUERY_LIMIT}, accountAddress: $accountAddress) {
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
  }
`;

export async function fetchMyNFTs(_accountAddress: string): Promise<MyNFTsResponse> {
  throw new Error('Use Apollo Client hooks instead. See useMyNFTs hook.');
}

// Query to fetch a single beast by token ID
// The id format is: contractAddress:tokenId (e.g., "0x046da...e4:0x0000...1234")
export const BEAST_BY_TOKEN_ID_QUERY = gql`
  query BeastByTokenId($id: ID!) {
    token(id: $id) {
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
`;

