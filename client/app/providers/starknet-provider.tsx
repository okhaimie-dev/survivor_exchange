import React from "react";
 
import { sepolia, mainnet } from "@starknet-react/chains";
import { StarknetConfig, jsonRpcProvider, cartridge } from "@starknet-react/core";

import { ControllerConnector } from "@cartridge/connector";
import { MAINNET_RPC_URL, SEPOLIA_RPC_URL, AUCTION_CONTRACT_ADDRESS, EKUBO_ROUTER_ADDRESS, USDC_ADDRESS, ETH_ADDRESS, STRK_ADDRESS, LORDS_ADDRESS, SURVIVOR_ADDRESS_MAINNET } from "../lib/constants";

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
    [EKUBO_ROUTER_ADDRESS]: {
      namespace: "Ekubo Router",
      description: "DEX router for token swaps",
      methods: [
        {
          name: "Clear",
          description: "Clear liquidity position",
          entrypoint: "clear",
        },
        {
          name: "Clear Minimum",
          description: "Clear liquidity position with minimum amount",
          entrypoint: "clear_minimum",
        },
        {
          name: "Multihop Swap",
          description: "Execute a multihop token swap",
          entrypoint: "multihop_swap",
        },
        {
          name: "Multi Multihop Swap",
          description: "Execute multiple multihop token swaps",
          entrypoint: "multi_multihop_swap",
        }
      ]
    },
    [USDC_ADDRESS]: {
      namespace: "USDC",
      description: "USD Coin token",
      methods: [
        {
          name: "Approve",
          description: "Approve a spender to spend your USDC tokens",
          entrypoint: "approve",
        },
        {
          name: "Transfer",
          description: "Transfer USDC tokens",
          entrypoint: "transfer",
        }
      ]
    },
    [ETH_ADDRESS]: {
      namespace: "ETH",
      description: "Ethereum token",
      methods: [
        {
          name: "Approve",
          description: "Approve a spender to spend your ETH tokens",
          entrypoint: "approve",
        },
        {
          name: "Transfer",
          description: "Transfer ETH tokens",
          entrypoint: "transfer",
        }
      ]
    },
    [STRK_ADDRESS]: {
      namespace: "STRK",
      description: "Starknet token",
      methods: [
        {
          name: "Approve",
          description: "Approve a spender to spend your STRK tokens",
          entrypoint: "approve",
        },
        {
          name: "Transfer",
          description: "Transfer STRK tokens",
          entrypoint: "transfer",
        }
      ]
    },
    [LORDS_ADDRESS]: {
      namespace: "LORDS",
      description: "Lords token",
      methods: [
        {
          name: "Approve",
          description: "Approve a spender to spend your LORDS tokens",
          entrypoint: "approve",
        },
        {
          name: "Transfer",
          description: "Transfer LORDS tokens",
          entrypoint: "transfer",
        }
      ]
    },
    [SURVIVOR_ADDRESS_MAINNET]: {
      namespace: "Survivor",
      description: "The native token of the Survivor game",
      methods: [
        {
          name: "Approve",
          description: "Approve a spender to spend your SURVIVOR tokens",
          entrypoint: "approve",
        },
        {
          name: "Transfer",
          description: "Transfer SURVIVOR tokens",
          entrypoint: "transfer",
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