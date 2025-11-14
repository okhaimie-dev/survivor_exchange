import React from "react";
 
import { sepolia, mainnet } from "@starknet-react/chains";
import { StarknetConfig, jsonRpcProvider, cartridge } from "@starknet-react/core";

import { toSessionPolicies } from "@cartridge/controller";
import { ControllerConnector } from "@cartridge/connector";

const policies = toSessionPolicies({});
 
const controller = new ControllerConnector({
  policies,
});

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