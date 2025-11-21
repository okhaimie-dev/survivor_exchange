"use client";

import React from 'react';
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';

const GRAPHQL_ENDPOINT = 'https://api.cartridge.gg/x/bm/torii/graphql';

const httpLink = createHttpLink({
  uri: GRAPHQL_ENDPOINT,
});

const client = new ApolloClient({
  link: httpLink,
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
          bm002AuctionModels: {
            merge(existing, incoming) {
              return incoming;
            },
          },
          bm002AuctionItemModels: {
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
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
      notifyOnNetworkStatusChange: false,
    },
    query: {
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
      notifyOnNetworkStatusChange: false,
    },
  },
});

export function ApolloGraphQLProvider({ children }: { children: React.ReactNode }) {
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}

