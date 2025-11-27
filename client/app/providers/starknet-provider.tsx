import React from "react";
 
import { sepolia, mainnet } from "@starknet-react/chains";
import { StarknetConfig, jsonRpcProvider, cartridge } from "@starknet-react/core";

import { ControllerConnector } from "@cartridge/connector";

const provider = jsonRpcProvider({
  rpc: (chain) => {
    switch (chain.id) {
      case mainnet.id:
        return { nodeUrl: "https://api.cartridge.gg/x/starknet/mainnet" };
      case sepolia.id:
        return { nodeUrl: "https://api.cartridge.gg/x/starknet/sepolia" };
      default:
        return { nodeUrl: "https://api.cartridge.gg/x/starknet/mainnet" };
    }
  },
});

const policies = {
  contracts: {
    "0x0023886A55d413d1D85881eCb9a6fE14ac9e6c53690628f10de06F64a1CCedc5": {
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