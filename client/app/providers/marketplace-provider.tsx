"use client";

import { MarketplaceClientProvider } from "@cartridge/arcade/marketplace/react";
import { constants } from "starknet";

export function MarketplaceProvider({ children }: { children: React.ReactNode }) {
  return (
    <MarketplaceClientProvider
      config={{
        chainId: constants.StarknetChainId.SN_MAIN,
        defaultProject: "arcade-main",
      }}
    >
      {children}
    </MarketplaceClientProvider>
  );
}
