import { useEffect, useState, useMemo } from "react";
import type { Auction, AuctionItem, AuctionWithNFTs } from "../../lib/types";
import { normalizeContractAddress } from "../../lib/utils/normalization";
import { USDC_ADDRESS } from "../../lib/constants";

/** Use same-origin API proxy to avoid CORS when fetching Eternum from the browser. */
const ETERNUM_GRAPHQL_URL =
  typeof window !== "undefined" ? "/api/eternum-graphql" : "https://api.cartridge.gg/x/eternum-marketplace-mainnet19/torii/graphql";

const ETERNUM_QUERY_LIMIT = 500;

/** Eternum whitelist: collection_id (7 = Beasts, 8 = Adventurers) -> collection_address */
interface EternumWhitelistNode {
  collection_id: number;
  collection_address: string;
}

interface EternumOrderNode {
  order_id: string;
  order: {
    active: boolean;
    expiration: number;
    token_id: number;
    collection_id: number;
    price: string;
    owner: string;
  };
}

const WHITELIST_QUERY = `
  query EternumWhitelist {
    marketplaceMarketWhitelistModelModels(limit: ${ETERNUM_QUERY_LIMIT}) {
      edges { node { collection_id collection_address } }
    }
  }
`;

/** First batch: request enough to cover all active listings (beasts + adventurers) in one call when the API allows. */
const ORDERS_FIRST_LIMIT = 5000;
const ORDERS_PAGE_SIZE = 100;
const ORDERS_MAX_PAGES = 30;
const ORDERS_QUERY_FIRST = `
  query EternumOrdersFirst {
    marketplaceMarketOrderModelModels(limit: ${ORDERS_FIRST_LIMIT}, where: { order: { active: true } }) {
      edges {
        node {
          order_id
          order { active expiration token_id collection_id price owner }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;
const ORDERS_QUERY_NEXT = `
  query EternumOrdersNext($limit: Int!, $after: Cursor) {
    marketplaceMarketOrderModelModels(limit: $limit, after: $after, where: { order: { active: true } }) {
      edges {
        node {
          order_id
          order { active expiration token_id collection_id price owner }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

const FEE_QUERY = `
  query EternumFee {
    marketplaceMarketFeeModelModels(limit: 1) {
      edges { node { fee_token } }
    }
  }
`;

/** Parse u128 hex price to decimal string. Realms/Eternum may use ETH (18 decimals) or other; we use 18 by default and display as "Amount". */
function parseEternumPrice(hex: string, decimals: number = 18): string {
  try {
    const raw = BigInt(hex);
    const divisor = BigInt(10 ** decimals);
    const value = Number(raw) / Number(divisor);
    return value < 1e-6 ? "0" : value.toFixed(Math.min(6, decimals));
  } catch {
    return "0";
  }
}

export function useEternumListings(): {
  eternumAuctions: AuctionWithNFTs[];
  eternumItemsByAuction: Map<string, AuctionItem[]>;
  loading: boolean;
  error: Error | null;
} {
  const [whitelist, setWhitelist] = useState<Map<number, string>>(new Map());
  const [orders, setOrders] = useState<EternumOrderNode[]>([]);
  const [feeToken, setFeeToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      setLoading(true);
      setError(null);
      try {
        const [wlRes, feeRes] = await Promise.all([
          fetch(ETERNUM_GRAPHQL_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: WHITELIST_QUERY }),
          }),
          fetch(ETERNUM_GRAPHQL_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: FEE_QUERY }),
          }),
        ]);

        if (!wlRes.ok) {
          throw new Error("Eternum fetch failed");
        }

        const wlData = await wlRes.json();
        const feeData = feeRes.ok ? await feeRes.json() : null;

        if (wlData.errors?.length) {
          throw new Error(wlData.errors?.[0]?.message || "Eternum GraphQL error");
        }

        const wlMap = new Map<number, string>();
        for (const edge of wlData?.data?.marketplaceMarketWhitelistModelModels?.edges ?? []) {
          const node = edge.node as EternumWhitelistNode;
          wlMap.set(node.collection_id, normalizeContractAddress(node.collection_address));
        }

        const orderNodes: EternumOrderNode[] = [];
        const seenOrderIds = new Set<string>();
        let after: string | null = null;
        let usePagination = false;
        for (let page = 0; page < ORDERS_MAX_PAGES && !cancelled; page++) {
          const isFirst = page === 0;
          const ordRes = await fetch(ETERNUM_GRAPHQL_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: isFirst
              ? JSON.stringify({ query: ORDERS_QUERY_FIRST })
              : JSON.stringify({
                  query: ORDERS_QUERY_NEXT,
                  variables: { limit: ORDERS_PAGE_SIZE, after },
                }),
          });
          if (!ordRes.ok) break;
          const ordData = await ordRes.json();
          if (ordData.errors?.length) {
            throw new Error(ordData.errors?.[0]?.message || "Eternum orders error");
          }
          const conn = ordData?.data?.marketplaceMarketOrderModelModels;
          const edges = conn?.edges ?? [];
          const pageInfo = conn?.pageInfo;
          for (const e of edges) {
            const node = e.node as EternumOrderNode;
            const id = String(node.order_id ?? "");
            if (!seenOrderIds.has(id)) {
              seenOrderIds.add(id);
              orderNodes.push(node);
            }
          }
          if (isFirst && pageInfo?.hasNextPage === true && !!pageInfo?.endCursor) {
            usePagination = true;
            after = pageInfo.endCursor;
          } else if (usePagination && pageInfo?.hasNextPage === true && !!pageInfo?.endCursor) {
            after = pageInfo.endCursor;
          } else {
            break;
          }
        }

        let resolvedFeeToken: string | null = null;
        const feeEdge = feeData?.data?.marketplaceMarketFeeModelModels?.edges?.[0];
        if (feeEdge?.node?.fee_token) {
          resolvedFeeToken = normalizeContractAddress(feeEdge.node.fee_token);
        }

        if (!cancelled) {
          setWhitelist(wlMap);
          setOrders(orderNodes);
          setFeeToken(resolvedFeeToken);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e : new Error(String(e)));
          setWhitelist(new Map());
          setOrders([]);
          setFeeToken(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAll();
    return () => {
      cancelled = true;
    };
  }, []);

  const { eternumAuctions, eternumItemsByAuction } = useMemo(() => {
    const auctions: AuctionWithNFTs[] = [];
    const itemsByAuction = new Map<string, AuctionItem[]>();
    const eternumFeeToken = feeToken ?? USDC_ADDRESS;

    const now = Math.floor(Date.now() / 1000);
    for (const row of orders) {
      const { order_id, order } = row;
      const orderIdStr = typeof order_id === "string" && order_id.startsWith("0x")
        ? String(parseInt(order_id, 16))
        : String(order_id);

      // Exclude inactive and expired listings by default
      if (!order.active || order.expiration < now) continue;

      const collectionAddress = whitelist.get(order.collection_id);
      if (!collectionAddress) continue;

      const auction: Auction = {
        auction_id: orderIdStr,
        current_bid: order.price,
        end_time: String(order.expiration),
        fee_token: eternumFeeToken,
        highest_bidder: "",
        item_count: "1",
        name: "",
        seller: normalizeContractAddress(order.owner),
        starting_price: order.price,
        status: "2",
        source: "eternum",
      };

      const item: AuctionItem = {
        auction_id: orderIdStr,
        contract_address: collectionAddress,
        item_index: "0",
        token_id: String(order.token_id),
      };

      auctions.push({
        ...auction,
        nfts: [],
        bids: [],
        offers: [],
      });
      itemsByAuction.set(orderIdStr, [item]);
    }

    return {
      eternumAuctions: auctions,
      eternumItemsByAuction: itemsByAuction,
    };
  }, [whitelist, orders, feeToken]);

  return {
    eternumAuctions,
    eternumItemsByAuction,
    loading,
    error,
  };
}
