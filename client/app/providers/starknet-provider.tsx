import React, { useMemo } from "react";
 
import { sepolia, mainnet } from "@starknet-react/chains";
import { StarknetConfig, jsonRpcProvider, braavos, argent, voyager } from "@starknet-react/core";

import { ControllerConnector } from "@cartridge/connector";
import { MAINNET_RPC_URL, SEPOLIA_RPC_URL, AUCTION_CONTRACT_ADDRESS, BEASTS_NFT_CONTRACT_ADDRESS } from "../lib/constants";

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
    }
  }
}

// Initialize controller at module level so it's available immediately for autoConnect
// This allows the controller to probe and auto-connect if there's an active session
let controller: ControllerConnector | null = null;

if (typeof window !== 'undefined') {
  // Permanently filter Cartridge controller probe noise from console
  // Probe logs {} when checking for active session (expected when not logged in or when opening controller)
  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    // Suppress any single non-Error object (controller probe logs {}); real Error instances still get logged
    if (
      args.length === 1 &&
      typeof args[0] === 'object' &&
      args[0] !== null &&
      !Array.isArray(args[0]) &&
      !(args[0] instanceof Error)
    ) {
      return;
    }
    const errorStack = new Error().stack || '';
    const isKeychainTimeout =
      args.length >= 1 &&
      typeof args[0] === 'object' &&
      args[0] !== null &&
      args[0] !== undefined &&
      'message' in args[0] &&
      String((args[0] as Error).message).includes('Timeout waiting for keychain') &&
      errorStack.includes('controller');
    if (isKeychainTimeout) {
      return;
    }
    originalError.apply(console, args);
  };

  try {
    controller = new ControllerConnector({
      policies,
    });
  } catch (error) {
    console.debug("ControllerConnector initialization failed:", error);
    controller = null;
  }
}

export function StarknetProvider({ children }: { children: React.ReactNode }) {

  // Build connectors array - controller should always be included if available
  // This allows autoConnect to work properly when there's an active session
  const connectors = useMemo(() => [
    ...(controller ? [controller] : []),
    argent(),
    braavos()
  ], []);

  return (
    <StarknetConfig
      autoConnect={true}
      defaultChainId={mainnet.id}
      chains={[mainnet, sepolia]}
      provider={provider}
      connectors={connectors}
      explorer={voyager}
    >
      {children}
    </StarknetConfig>
  );
}