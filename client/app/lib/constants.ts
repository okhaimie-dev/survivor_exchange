export const MARKETPLACE_GRAPHQL_ENDPOINT =
  "https://api.cartridge.gg/x/bm/torii/graphql";
export const BEASTS_GRAPHQL_ENDPOINT =
  "https://api.cartridge.gg/x/pg-beasts/torii/graphql";

export const IMAGE_BASE_URL = "https://api.cartridge.gg/x/bm/torii";

export const MAINNET_RPC_URL = "https://api.cartridge.gg/x/starknet/mainnet";
export const SEPOLIA_RPC_URL = "https://api.cartridge.gg/x/starknet/sepolia";

export const AUCTION_CONTRACT_ADDRESS =
  "0x02dfedce0383bfd4b5a5dbf2693220841aaa3a1ebf639919a76dbe09a5ff41cb";
export const VAULT_CONTRACT_ADDRESS =
  "0x02aa15e266a17d519301d5e658562ae8fe5a483be47660be42e67588b9ac29cd";
export const BEASTS_NFT_CONTRACT_ADDRESS =
  "0x046da8955829adf2bda310099a0063451923f02e648cf25a1203aac6335cf0e4";

export const DEFAULT_PAGE_SIZE = 12;

// Maximum NFTs that can be selected for auction (contract limit)
// TODO: Increase to 200 when contract is upgraded
export const MAX_AUCTION_NFT_SELECTION = 163;

// Reduced from 1000000 - fetching 1M records caused 30+ MB responses taking 80+ seconds
export const GRAPHQL_QUERY_LIMIT = 500;

// Reduced from 1000ms - polling every second with large payloads overwhelms the connection
export const DEFAULT_POLL_INTERVAL = 30000;

export const APOLLO_DEFAULT_FETCH_POLICY = "cache-and-network";
export const APOLLO_QUERY_FETCH_POLICY = "network-only";
export const APOLLO_ERROR_POLICY = "all";

export const MAX_UINT256 = BigInt(
  "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
);

export const DEFAULT_AUCTION_DURATION_MINUTES = 30;

export const USDC_ADDRESS =
  "0x033068F6539f8e6e6b131e6B2B814e6c34A5224bC66947c47DaB9dFeE93b35fb";
export const ETH_ADDRESS =
  "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";
export const STRK_ADDRESS =
  "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";
export const LORDS_ADDRESS =
  "0x0124aeb495b947201f5fac96fd1138e326ad86195b98df6dec9009158a533b49";
export const SURVIVOR_ADDRESS_MAINNET =
  "0x042DD777885AD2C116be96d4D634abC90A26A790ffB5871E037Dd5Ae7d2Ec86B";
export const WBTC_ADDRESS =
  "0x03Fe2b97C1Fd336E750087D68B9b867997Fd64a2661fF3ca5A7C771641e8e7AC";

export const STARKNET_MAINNET_CHAIN_ID = "0x534e5f4d41494e";
export const STARKNET_MAINNET_CHAIN_ID_DECIMAL = "23448594291968334";

// Summit game Torii endpoint for fetching SKULL token data
export const SUMMIT_TORII_URL = "https://api.cartridge.gg/x/pg-mainnet-10/torii";
export const SUMMIT_NAMESPACE = "summit_relayer_6";
export const LOOT_SURVIVOR_NAMESPACE = "ls_0_0_9";

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
}

export const SUPPORTED_TOKENS: TokenInfo[] = [
  {
    address: USDC_ADDRESS,
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
  },
  {
    address: ETH_ADDRESS,
    symbol: "ETH",
    name: "Ethereum",
    decimals: 18,
  },
  {
    address: STRK_ADDRESS,
    symbol: "STRK",
    name: "Starknet",
    decimals: 18,
  },
  {
    address: LORDS_ADDRESS,
    symbol: "LORDS",
    name: "Lords",
    decimals: 18,
  },
  {
    address: SURVIVOR_ADDRESS_MAINNET,
    symbol: "SURVIVOR",
    name: "Survivor",
    decimals: 18,
  },
  {
    address: WBTC_ADDRESS,
    symbol: "WBTC",
    name: "Wrapped Bitcoin",
    decimals: 8,
  },
];

import { normalizeContractAddress } from "./utils/normalization";

export const getTokenByAddress = (address: string): TokenInfo | undefined => {
  // Normalize addresses before comparison
  const normalizedInput = normalizeContractAddress(address).toLowerCase();
  return SUPPORTED_TOKENS.find(
    (token) =>
      normalizeContractAddress(token.address).toLowerCase() === normalizedInput,
  );
};

export const getTokenBySymbol = (symbol: string): TokenInfo | undefined => {
  return SUPPORTED_TOKENS.find(
    (token) => token.symbol.toUpperCase() === symbol.toUpperCase(),
  );
};
