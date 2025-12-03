import { gql } from '@apollo/client';
import type { MyNFTsResponse } from '../types';

export const MY_NFTS_QUERY = gql`
  query MyNFTS($accountAddress: String!) {
    tokenBalances(limit: 1000000, accountAddress: $accountAddress) {
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
  }
`;

export async function fetchMyNFTs(_accountAddress: string): Promise<MyNFTsResponse> {
  throw new Error('Use Apollo Client hooks instead. See useMyNFTs hook.');
}

