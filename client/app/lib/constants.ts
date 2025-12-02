// GraphQL Endpoints
export const MARKETPLACE_GRAPHQL_ENDPOINT = 'https://api.cartridge.gg/x/bm/torii/graphql';
export const BEASTS_GRAPHQL_ENDPOINT = 'https://api.cartridge.gg/x/pg-beasts/torii/graphql';

// Image Base URLs
export const IMAGE_BASE_URL = 'https://api.cartridge.gg/x/bm/torii';

// RPC URLs
export const MAINNET_RPC_URL = 'https://api.cartridge.gg/x/starknet/mainnet';
export const SEPOLIA_RPC_URL = 'https://api.cartridge.gg/x/starknet/sepolia';

// Contract Addresses
export const AUCTION_CONTRACT_ADDRESS = '0x058568FF97b6F409F69183b091af8f476eEcb4Db71e270E25c7b145ADBb2FdE6';
export const SURVIVOR_ADDRESS_MAINNET = '0x042DD777885AD2C116be96d4D634abC90A26A790ffB5871E037Dd5Ae7d2Ec86B';
export const VAULT_CONTRACT_ADDRESS = '0x04615c6e9eab6efe299cb2a07107e0b712a6b3bab73bc8cb4886e15f1e6356d5';
export const BEASTS_NFT_CONTRACT_ADDRESS = '0x46da8955829adf2bda310099a0063451923f02e648cf25a1203aac6335cf0e4';

// Pagination
export const DEFAULT_PAGE_SIZE = 9;

// GraphQL Query Limits
export const GRAPHQL_QUERY_LIMIT = 1000000;

// Poll Intervals (in milliseconds)
export const DEFAULT_POLL_INTERVAL = 1000; // 1 second

// Apollo Client Default Options
export const APOLLO_DEFAULT_FETCH_POLICY = 'cache-and-network';
export const APOLLO_QUERY_FETCH_POLICY = 'network-only';
export const APOLLO_ERROR_POLICY = 'all';

// Constants
export const MAX_UINT256 = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF');

// Default Auction Duration (minutes)
export const DEFAULT_AUCTION_DURATION_MINUTES = 30;

