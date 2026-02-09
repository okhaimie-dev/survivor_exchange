"use client";

import { useCallback, useState } from "react";
import { useAccount } from "@starknet-react/core";
import { uint256 } from "starknet";
import { useToast } from "../../providers/toast-provider";

/**
 * Arcade marketplace world contract on mainnet.
 * The "execute" entrypoint fulfills a listed order.
 *
 * Signature: execute(order_id, collection, token_id, asset_id, quantity, royalties, client_fee, client_receiver)
 */
const ARCADE_MARKETPLACE_CONTRACT =
  "0x6bbf16b6c67b1bef27a187b499b2f3a14af31646c2c90d64f11b9087c3f527c";

export interface MarketplaceBuyParams {
  orderId: number;
  rawPrice: number;
  currency: string;
  collection: string;
  tokenId: string;
}

interface UseMarketplaceBuyReturn {
  buyListing: (params: MarketplaceBuyParams) => Promise<void>;
  isBuying: boolean;
  txnHash: string | undefined;
}

export function useMarketplaceBuy(): UseMarketplaceBuyReturn {
  const { account, address } = useAccount();
  const toast = useToast();
  const [isBuying, setIsBuying] = useState(false);
  const [txnHash, setTxnHash] = useState<string | undefined>();

  const buyListing = useCallback(
    async (params: MarketplaceBuyParams) => {
      if (!account || !address) {
        toast.error("Wallet not connected", "Please connect your wallet to buy.");
        return;
      }

      setIsBuying(true);
      setTxnHash(undefined);

      try {
        const priceAmount = BigInt(params.rawPrice);
        const priceUint256 = uint256.bnToUint256(priceAmount);

        const tokenIdBn = BigInt(params.tokenId);
        const tokenIdUint256 = uint256.bnToUint256(tokenIdBn);

        // asset_id is unused for sell-order execution; pass 0
        const assetIdUint256 = uint256.bnToUint256(0n);

        const calls = [
          // 1. Approve currency spend
          {
            contractAddress: params.currency,
            entrypoint: "approve",
            calldata: [
              ARCADE_MARKETPLACE_CONTRACT,
              priceUint256.low.toString(),
              priceUint256.high.toString(),
            ],
          },
          // 2. Execute the marketplace order
          {
            contractAddress: ARCADE_MARKETPLACE_CONTRACT,
            entrypoint: "execute",
            calldata: [
              params.orderId.toString(),            // order_id: u32
              params.collection,                     // collection: ContractAddress
              tokenIdUint256.low.toString(),          // token_id: u256 (low)
              tokenIdUint256.high.toString(),         // token_id: u256 (high)
              assetIdUint256.low.toString(),          // asset_id: u256 (low)
              assetIdUint256.high.toString(),         // asset_id: u256 (high)
              "0",                                   // quantity: u128 (0 for ERC721)
              "1",                                   // royalties: bool (true)
              "0",                                   // client_fee: u32
              "0",                                   // client_receiver: ContractAddress
            ],
          },
        ];

        const response = await account.execute(calls);
        setTxnHash(response.transaction_hash);
        toast.success(
          "Purchase successful",
          "Your purchase transaction has been submitted.",
        );
      } catch (err) {
        console.error("Marketplace buy error:", err);
        const msg =
          err instanceof Error ? err.message : "Failed to complete purchase";
        toast.error("Purchase failed", msg);
      } finally {
        setIsBuying(false);
      }
    },
    [account, address, toast],
  );

  return { buyListing, isBuying, txnHash };
}
