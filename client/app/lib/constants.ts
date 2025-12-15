export const MARKETPLACE_GRAPHQL_ENDPOINT = 'https://api.cartridge.gg/x/la/torii/graphql';
export const BEASTS_GRAPHQL_ENDPOINT = 'https://api.cartridge.gg/x/pg-beasts/torii/graphql';

export const IMAGE_BASE_URL = 'https://api.cartridge.gg/x/la/torii';

export const MAINNET_RPC_URL = 'https://api.cartridge.gg/x/starknet/mainnet';
export const SEPOLIA_RPC_URL = 'https://api.cartridge.gg/x/starknet/sepolia';

export const AUCTION_CONTRACT_ADDRESS = '0x018a38b74f5d8ee2bcf43cb8af067d013a8f0464f5eb1a2e52c7b55b1ca60091';
export const VAULT_CONTRACT_ADDRESS = '0x00b2988b6ee3b052c1cf4dd41940f9372245ce960aec6407918ef5c4b3c399d1';
export const BEASTS_NFT_CONTRACT_ADDRESS = '0x046da8955829adf2bda310099a0063451923f02e648cf25a1203aac6335cf0e4';

export const DEFAULT_PAGE_SIZE = 9;

export const GRAPHQL_QUERY_LIMIT = 1000000;

export const DEFAULT_POLL_INTERVAL = 1000;

export const APOLLO_DEFAULT_FETCH_POLICY = 'cache-and-network';
export const APOLLO_QUERY_FETCH_POLICY = 'network-only';
export const APOLLO_ERROR_POLICY = 'all';

export const MAX_UINT256 = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF');

export const DEFAULT_AUCTION_DURATION_MINUTES = 30;

export const USDC_ADDRESS = '0x033068F6539f8e6e6b131e6B2B814e6c34A5224bC66947c47DaB9dFeE93b35fb';
export const ETH_ADDRESS = '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';
export const STRK_ADDRESS = '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d';
export const LORDS_ADDRESS = '0x0124aeb495b947201f5fac96fd1138e326ad86195b98df6dec9009158a533b49';
export const SURVIVOR_ADDRESS_MAINNET = '0x042DD777885AD2C116be96d4D634abC90A26A790ffB5871E037Dd5Ae7d2Ec86B';
export const WBTC_ADDRESS = '0x03Fe2b97C1Fd336E750087D68B9b867997Fd64a2661fF3ca5A7C771641e8e7AC';

export const STARKNET_MAINNET_CHAIN_ID = '0x534e5f4d41494e';
export const STARKNET_MAINNET_CHAIN_ID_DECIMAL = '23448594291968334';

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
}

export const SUPPORTED_TOKENS: TokenInfo[] = [
  {
    address: USDC_ADDRESS,
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
  },
  {
    address: ETH_ADDRESS,
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
  },
  {
    address: STRK_ADDRESS,
    symbol: 'STRK',
    name: 'Starknet',
    decimals: 18,
  },
  {
    address: LORDS_ADDRESS,
    symbol: 'LORDS',
    name: 'Lords',
    decimals: 18,
  },
  {
    address: SURVIVOR_ADDRESS_MAINNET,
    symbol: 'SURVIVOR',
    name: 'Survivor',
    decimals: 18,
  },
  {
    address: WBTC_ADDRESS,
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    decimals: 8,
  },
];

import { normalizeContractAddress } from './utils/normalization';

export const getTokenByAddress = (address: string): TokenInfo | undefined => {
  // Normalize addresses before comparison
  const normalizedInput = normalizeContractAddress(address).toLowerCase();
  return SUPPORTED_TOKENS.find(token => normalizeContractAddress(token.address).toLowerCase() === normalizedInput);
};

export const getTokenBySymbol = (symbol: string): TokenInfo | undefined => {
  return SUPPORTED_TOKENS.find(token => token.symbol.toUpperCase() === symbol.toUpperCase());
};

