import React from "react";

import { sepolia, mainnet } from "@starknet-react/chains";
import {
  StarknetConfig,
  jsonRpcProvider,
  braavos,
  argent,
  voyager,
} from "@starknet-react/core";

import { ControllerConnector } from "@cartridge/connector";
import {
  MAINNET_RPC_URL,
  SEPOLIA_RPC_URL,
  AUCTION_CONTRACT_ADDRESS,
  BEASTS_NFT_CONTRACT_ADDRESS,
} from "../lib/constants";

const provider = jsonRpcProvider({
  rpc: (chain) => {
    switch (chain.id) {
      case mainnet.id:
        return { nodeUrl: MAINNET_RPC_URL };
      case sepolia.id:
        return { nodeUrl: SEPOLIA_RPC_URL };
      default:
        return { nodeUrl: MAINNET_RPC_URL };
    }
  },
});

const policies = {
  contracts: {
    [AUCTION_CONTRACT_ADDRESS]: {
      namespace: "Survivor Exchange",
      description:
        "A place where you can auction your Loot Survivor game monsters",
      methods: [
        {
          name: "Create Auction",
          description: "Create a new auction with your selected monsters",
          entrypoint: "create_auction",
        },
        {
          name: "Place Bid",
          description: "Place a bid on an active auction",
          entrypoint: "bid",
        },
        {
          name: "End Auction",
          description: "End an active auction",
          entrypoint: "end_auction",
        },
      ],
    },
    [BEASTS_NFT_CONTRACT_ADDRESS]: {
      namespace: "BEAST NFTs",
      description: "BEAST NFT collection",
      methods: [
        {
          name: "Approve",
          description: "Approve a spender for a specific NFT",
          entrypoint: "approve",
        },
        {
          name: "Transfer",
          description: "Transfer a BEAST NFT",
          entrypoint: "transfer",
        },
      ],
    },
  },
};

const controller = new ControllerConnector({
  policies,
});

export function StarknetProvider({ children }: { children: React.ReactNode }) {
  return (
    <StarknetConfig
      autoConnect={true}
      defaultChainId={mainnet.id}
      chains={[mainnet, sepolia]}
      provider={provider}
      connectors={[controller, argent(), braavos()]}
      explorer={voyager}
    >
      {children}
    </StarknetConfig>
  );
}
