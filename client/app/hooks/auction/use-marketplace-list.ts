"use client";

import { useCallback, useState } from "react";
import { useAccount } from "@starknet-react/core";
import { uint256 } from "starknet";
import { useToast } from "../../providers/toast-provider";
import { ARCADE_MARKETPLACE_CONTRACT } from "./use-marketplace-buy";

export interface MarketplaceListParams {
  collection: string;
  tokenId: string;
  price: string;
  currency: string;
  currencyDecimals: number;
  expirationDays: number;
}

interface UseMarketplaceListReturn {
  listNFT: (params: MarketplaceListParams) => Promise<void>;
  isListing: boolean;
  txnHash: string | undefined;
}

export function useMarketplaceList(): UseMarketplaceListReturn {
  const { account, address } = useAccount();
  const toast = useToast();
  const [isListing, setIsListing] = useState(false);
  const [txnHash, setTxnHash] = useState<string | undefined>();

  const listNFT = useCallback(
    async (params: MarketplaceListParams) => {
      if (!account || !address) {
        toast.error("Wallet not connected", "Please connect your wallet to list.");
        return;
      }

      const priceFloat = parseFloat(params.price);
      if (isNaN(priceFloat) || priceFloat <= 0) {
        toast.error("Invalid price", "Please enter a valid price greater than 0.");
        return;
      }

      setIsListing(true);
      setTxnHash(undefined);

      try {
        const priceAmount = BigInt(
          Math.round(priceFloat * Math.pow(10, params.currencyDecimals)),
        );

        const tokenIdBn = BigInt(params.tokenId);
        const tokenIdUint256 = uint256.bnToUint256(tokenIdBn);

        const expirationUnix =
          Math.floor(Date.now() / 1000) + params.expirationDays * 86400;

        const calls = [
          // 1. Approve marketplace to transfer the NFT (contract checks is_approved_for_all)
          {
            contractAddress: params.collection,
            entrypoint: "set_approval_for_all",
            calldata: [
              ARCADE_MARKETPLACE_CONTRACT,
              "1", // approved: bool (true)
            ],
          },
          // 2. List on marketplace
          // ABI: list(collection: ContractAddress, token_id: u256, quantity: u128, price: u128, currency: ContractAddress, expiration: u64, royalties: bool)
          {
            contractAddress: ARCADE_MARKETPLACE_CONTRACT,
            entrypoint: "list",
            calldata: [
              params.collection,                   // collection: ContractAddress
              tokenIdUint256.low.toString(),        // token_id: u256 (low)
              tokenIdUint256.high.toString(),       // token_id: u256 (high)
              "0",                                  // quantity: u128 (0 for ERC721)
              priceAmount.toString(),              // price: u128
              params.currency,                     // currency: ContractAddress
              expirationUnix.toString(),           // expiration: u64
              "1",                                 // royalties: bool (true)
            ],
          },
        ];

        const response = await account.execute(calls);
        setTxnHash(response.transaction_hash);
        toast.success(
          "Listing successful",
          "Your NFT has been listed on the marketplace.",
        );
      } catch (err) {
        console.error("Marketplace list error:", err);
        const msg =
          err instanceof Error ? err.message : "Failed to create listing";
        toast.error("Listing failed", msg);
      } finally {
        setIsListing(false);
      }
    },
    [account, address, toast],
  );

  return { listNFT, isListing, txnHash };
}
