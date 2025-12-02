import React from "react";
 
import { sepolia, mainnet } from "@starknet-react/chains";
import { StarknetConfig, jsonRpcProvider, cartridge } from "@starknet-react/core";

import { ControllerConnector } from "@cartridge/connector";
import { MAINNET_RPC_URL, SEPOLIA_RPC_URL, AUCTION_CONTRACT_ADDRESS, SURVIVOR_ADDRESS_MAINNET } from "../lib/constants";

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
      description: "A place where you can auction your Loot Survivor game monsters",
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
        }
      ]
    },
    [SURVIVOR_ADDRESS_MAINNET]: {
      namespace: "Survivor",
      description: "The native token of the Survivor game",
      methods: [
        {
          name: "Approve",
          description: "Approve a spender to spend your tokens",
          entrypoint: "approve",
        }
      ]
    }
  }
}

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
      connectors={[controller]}
      explorer={cartridge}
    >
      {children}
    </StarknetConfig>
  );
}