"use client";

import React from 'react';
import { ApolloClient, InMemoryCache, createHttpLink, split } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { MARKETPLACE_GRAPHQL_ENDPOINT, BEASTS_GRAPHQL_ENDPOINT, APOLLO_DEFAULT_FETCH_POLICY, APOLLO_QUERY_FETCH_POLICY, APOLLO_ERROR_POLICY } from '../lib/constants';

// Create links for both endpoints
const marketplaceLink = createHttpLink({
  uri: MARKETPLACE_GRAPHQL_ENDPOINT,
});

const beastsLink = createHttpLink({
  uri: BEASTS_GRAPHQL_ENDPOINT,
});

// Split link: route NFT/token queries to beasts endpoint, everything else to marketplace
const splitLink = split(
  ({ operationName, query }) => {
    // Check if the query is related to NFTs/tokens/beasts
    const queryString = query?.loc?.source?.body || '';
    const isNFTQuery = 
      queryString.includes('tokenBalances') ||
      queryString.includes('tokenMetadata') ||
      queryString.includes('ERC721') ||
      operationName === 'MyNFTS' ||
      operationName === 'ConsolidatedQuery' && queryString.includes('myNFTs');
    
    return isNFTQuery;
  },
  beastsLink,    // Use beasts endpoint for NFT/token queries
  marketplaceLink // Use marketplace endpoint for everything else
);

const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          // Merge policies to prevent unnecessary re-renders
          tokenBalances: {
            merge(existing, incoming) {
              return incoming;
            },
          },
          bm006AuctionModels: {
            merge(existing, incoming) {
              return incoming;
            },
          },
          bm006AuctionItemModels: {
            merge(existing, incoming) {
              return incoming;
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: APOLLO_DEFAULT_FETCH_POLICY,
      errorPolicy: APOLLO_ERROR_POLICY,
      notifyOnNetworkStatusChange: false,
    },
    query: {
      fetchPolicy: APOLLO_QUERY_FETCH_POLICY,
      errorPolicy: APOLLO_ERROR_POLICY,
    },
  },
});

export function ApolloGraphQLProvider({ children }: { children: React.ReactNode }) {
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}

