"use client";

import React from "react";
import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  split,
} from "@apollo/client";
import { ApolloProvider } from "@apollo/client/react";
import {
  MARKETPLACE_GRAPHQL_ENDPOINT,
  BEASTS_GRAPHQL_ENDPOINT,
  APOLLO_DEFAULT_FETCH_POLICY,
  APOLLO_QUERY_FETCH_POLICY,
  APOLLO_ERROR_POLICY,
} from "../lib/constants";

const marketplaceLink = createHttpLink({
  uri: MARKETPLACE_GRAPHQL_ENDPOINT,
});

const beastsLink = createHttpLink({
  uri: BEASTS_GRAPHQL_ENDPOINT,
});

const splitLink = split(
  ({ operationName, query }) => {
    const queryString = query?.loc?.source?.body || "";
    const isNFTQuery =
      queryString.includes("tokenBalances") ||
      queryString.includes("tokenMetadata") ||
      queryString.includes("ERC721") ||
      operationName === "MyNFTS" ||
      (operationName === "ConsolidatedQuery" && queryString.includes("myNFTs"));

    return isNFTQuery;
  },
  beastsLink,
  marketplaceLink,
);

const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          tokenBalances: {
            merge(existing, incoming) {
              return incoming;
            },
          },
          bm011AuctionModels: {
            merge(existing, incoming) {
              return incoming;
            },
          },
          bm011AuctionItemModels: {
            merge(existing, incoming) {
              return incoming;
            },
          },
          bm011BidModels: {
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

export function ApolloGraphQLProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
