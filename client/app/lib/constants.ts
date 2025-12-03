export const MARKETPLACE_GRAPHQL_ENDPOINT = 'https://api.cartridge.gg/x/bm/torii/graphql';
export const BEASTS_GRAPHQL_ENDPOINT = 'https://api.cartridge.gg/x/pg-beasts/torii/graphql';

export const IMAGE_BASE_URL = 'https://api.cartridge.gg/x/bm/torii';

export const MAINNET_RPC_URL = 'https://api.cartridge.gg/x/starknet/mainnet';
export const SEPOLIA_RPC_URL = 'https://api.cartridge.gg/x/starknet/sepolia';

export const AUCTION_CONTRACT_ADDRESS = '0x058568FF97b6F409F69183b091af8f476eEcb4Db71e270E25c7b145ADBb2FdE6';
export const SURVIVOR_ADDRESS_MAINNET = '0x042DD777885AD2C116be96d4D634abC90A26A790ffB5871E037Dd5Ae7d2Ec86B';
export const VAULT_CONTRACT_ADDRESS = '0x04615c6e9eab6efe299cb2a07107e0b712a6b3bab73bc8cb4886e15f1e6356d5';
export const BEASTS_NFT_CONTRACT_ADDRESS = '0x46da8955829adf2bda310099a0063451923f02e648cf25a1203aac6335cf0e4';

export const DEFAULT_PAGE_SIZE = 9;

export const GRAPHQL_QUERY_LIMIT = 1000000;

export const DEFAULT_POLL_INTERVAL = 1000;

export const APOLLO_DEFAULT_FETCH_POLICY = 'cache-and-network';
export const APOLLO_QUERY_FETCH_POLICY = 'network-only';
export const APOLLO_ERROR_POLICY = 'all';

export const MAX_UINT256 = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF');

export const DEFAULT_AUCTION_DURATION_MINUTES = 30;

export const USDC_ADDRESS = '0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8';
export const ETH_ADDRESS = '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';
export const STRK_ADDRESS = '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d';
export const LORDS_ADDRESS = '0x0124aeb495b947201f5fac96fd1138e326ad86195b98df6dec9009158a533b49';
export const SURVIVOR_ADDRESS = SURVIVOR_ADDRESS_MAINNET;
export const EKUBO_ROUTER_ADDRESS = '0x0199741822c2dc722f6f605204f35e56dbc23bceed54818168c4c49e4fb8737e';

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
    address: SURVIVOR_ADDRESS,
    symbol: 'SURVIVOR',
    name: 'Survivor',
    decimals: 18,
  },
];

export const getTokenByAddress = (address: string): TokenInfo | undefined => {
  return SUPPORTED_TOKENS.find(token => token.address.toLowerCase() === address.toLowerCase());
};

export const getTokenBySymbol = (symbol: string): TokenInfo | undefined => {
  return SUPPORTED_TOKENS.find(token => token.symbol.toUpperCase() === symbol.toUpperCase());
};

