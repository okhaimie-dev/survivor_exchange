import { gql } from '@apollo/client';
import type { MyNFTsResponse } from '../types';
import { GRAPHQL_QUERY_LIMIT } from '../constants';

// Optimized query: removed 'metadata' field (15KB+ per NFT!) and 'metadataDescription'
// which were causing 30MB+ responses. These fields weren't used in the UI anyway.
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

