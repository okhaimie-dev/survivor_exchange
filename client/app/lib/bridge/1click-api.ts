/**
 * NEAR Intents 1Click API Client
 * https://docs.near-intents.org/near-intents/integration/distribution-channels/1click-api
 */

const API_BASE = 'https://1click.chaindefuser.com/v0';

// Supported chains for bridging
export const SUPPORTED_CHAINS = {
  ethereum: {
    id: 'eth',
    name: 'Ethereum',
    chainId: 1,
    icon: '/bridge/ethereum.svg',
  },
  base: {
    id: 'base',
    name: 'Base',
    chainId: 8453,
    icon: '/bridge/base.svg',
  },
  arbitrum: {
    id: 'arbitrum',
    name: 'Arbitrum',
    chainId: 42161,
    icon: '/bridge/arbitrum.svg',
  },
  polygon: {
    id: 'polygon',
    name: 'Polygon',
    chainId: 137,
    icon: '/bridge/polygon.svg',
  },
  solana: {
    id: 'solana',
    name: 'Solana',
    chainId: 0, // Solana doesn't use EVM chain IDs
    icon: '/bridge/solana.svg',
  },
} as const;

export type SupportedChainId = keyof typeof SUPPORTED_CHAINS;

// Token definitions per chain
export interface TokenInfo {
  symbol: string;
  name: string;
  address: string; // Contract address or 'native'
  decimals: number;
  defuseAssetId: string; // NEAR Intents token ID
  icon?: string;
}

// Common tokens on different chains (using 1Click API asset ID format)
export const CHAIN_TOKENS: Record<SupportedChainId, TokenInfo[]> = {
  ethereum: [
    {
      symbol: 'ETH',
      name: 'Ethereum',
      address: 'native',
      decimals: 18,
      defuseAssetId: 'nep141:eth.omft.near',
    },
    {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      decimals: 6,
      defuseAssetId: 'nep141:eth-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.omft.near',
    },
    {
      symbol: 'USDT',
      name: 'Tether USD',
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      decimals: 6,
      defuseAssetId: 'nep141:eth-0xdac17f958d2ee523a2206206994597c13d831ec7.omft.near',
    },
  ],
  base: [
    {
      symbol: 'ETH',
      name: 'Ethereum',
      address: 'native',
      decimals: 18,
      defuseAssetId: 'nep141:base.omft.near',
    },
    {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      decimals: 6,
      defuseAssetId: 'nep141:base-0x833589fcd6edb6e08f4c7c32d4f71b54bda02913.omft.near',
    },
  ],
  arbitrum: [
    {
      symbol: 'ETH',
      name: 'Ethereum',
      address: 'native',
      decimals: 18,
      defuseAssetId: 'nep141:arb.omft.near',
    },
    {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
      decimals: 6,
      defuseAssetId: 'nep141:arb-0xaf88d065e77c8cc2239327c5edb3a432268e5831.omft.near',
    },
    {
      symbol: 'USDT',
      name: 'Tether USD',
      address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
      decimals: 6,
      defuseAssetId: 'nep141:arb-0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9.omft.near',
    },
  ],
  polygon: [
    {
      symbol: 'POL',
      name: 'Polygon',
      address: 'native',
      decimals: 18,
      defuseAssetId: 'nep245:v2_1.omni.hot.tg:137_11111111111111111111',
    },
    {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
      decimals: 6,
      defuseAssetId: 'nep245:v2_1.omni.hot.tg:137_qiStmoQJDQPTebaPjgx5VBxZv6L',
    },
    {
      symbol: 'USDT',
      name: 'Tether USD',
      address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
      decimals: 6,
      defuseAssetId: 'nep245:v2_1.omni.hot.tg:137_3hpYoaLtt8MP1Z2GH1U473DMRKgr',
    },
  ],
  solana: [
    {
      symbol: 'SOL',
      name: 'Solana',
      address: 'native',
      decimals: 9,
      defuseAssetId: 'nep141:sol.omft.near',
    },
    {
      symbol: 'USDC',
      name: 'USD Coin',
      address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      decimals: 6,
      defuseAssetId: 'nep141:sol-5ce3bf3a31af18be40ba30f721101b4341690186.omft.near',
    },
  ],
};

// Starknet destination token (STRK) - verified from 1Click API
export const STARKNET_STRK: TokenInfo = {
  symbol: 'STRK',
  name: 'Starknet',
  address: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
  decimals: 18,
  defuseAssetId: 'nep141:starknet.omft.near', // Correct format from API
};

// Quote request interface (matching 1Click API v0 schema)
export interface QuoteRequest {
  originAsset: string;          // Source token asset ID
  destinationAsset: string;     // Destination token asset ID
  amount: string;               // Amount in smallest unit
  recipient: string;            // Destination address (Starknet)
  refundTo: string;             // Refund address (source chain)
  dry?: boolean;                // true for display only, false to generate tx
  swapType?: 'EXACT_INPUT' | 'EXACT_OUTPUT' | 'FLEX_INPUT' | 'ANY_INPUT';
  depositType?: 'ORIGIN_CHAIN' | 'INTENTS';
  refundType?: 'ORIGIN_CHAIN' | 'INTENTS';
  recipientType?: 'DESTINATION_CHAIN' | 'INTENTS';
  slippageTolerance?: number;   // Basis points (100 = 1%)
  deadline?: string;            // ISO 8601 timestamp
}

// Quote response interface (matching 1Click API v0 response)
export interface QuoteResponse {
  quoteId: string;
  amountIn: string;
  amountInUsd: string;
  amountOut: string;
  amountOutUsd: string;
  // Pre-formatted amounts from API (for display)
  amountOutFormatted?: string;
  amountInFormatted?: string;
  depositAddress: string;   // Where to send funds on source chain (only for non-dry quotes)
  depositNetwork: string;
  expiresAt: number;        // Unix timestamp
  timeEstimate?: number;    // Estimated time in seconds
  fees?: {
    bridgeFee: string;
    networkFee: string;
  };
}

// Raw API response structure from 1Click API
interface RawQuoteResponse {
  // Nested quote object containing the actual quote data AND deposit info
  quote?: {
    amountIn?: string;
    amountInFormatted?: string;
    amountInUsd?: string;
    minAmountIn?: string;
    amountOut?: string;
    amountOutFormatted?: string;
    amountOutUsd?: string;
    minAmountOut?: string;
    timeEstimate?: number;
    // Deposit address is INSIDE the quote object (per OpenAPI spec)
    depositAddress?: string;
    depositMemo?: string;
    deadline?: string;
    timeWhenInactive?: string;
  };
  // Quote request echo
  quoteRequest?: {
    dry?: boolean;
    depositMode?: string;
    originAsset?: string;
    destinationAsset?: string;
    amount?: string;
    recipient?: string;
    refundTo?: string;
  };
  // Signature and metadata
  signature?: string;
  timestamp?: string;
  correlationId?: string;
}

// Normalize API response to our interface
function normalizeQuoteResponse(raw: RawQuoteResponse): QuoteResponse {
  // Extract from nested quote object if present
  const quote = raw.quote || {};

  // depositAddress is inside the quote object (per 1Click API OpenAPI spec)
  const depositAddress = quote.depositAddress || '';

  return {
    quoteId: raw.correlationId || '',
    amountIn: quote.amountIn || '0',
    amountInUsd: quote.amountInUsd || '0',
    amountOut: quote.amountOut || '0',
    amountOutUsd: quote.amountOutUsd || '0',
    // For display, we can use the pre-formatted values
    amountOutFormatted: quote.amountOutFormatted,
    amountInFormatted: quote.amountInFormatted,
    depositAddress,
    depositNetwork: '', // Not provided in API response
    expiresAt: 0, // Could parse from quote.deadline if needed
    timeEstimate: quote.timeEstimate,
  };
}

// Status response interface (matching 1Click API v0)
// Possible statuses: KNOWN_DEPOSIT_TX, PENDING_DEPOSIT, INCOMPLETE_DEPOSIT, PROCESSING, SUCCESS, REFUNDED, FAILED
export type BridgeStatus =
  | 'KNOWN_DEPOSIT_TX'
  | 'PENDING_DEPOSIT'
  | 'INCOMPLETE_DEPOSIT'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'REFUNDED'
  | 'FAILED';

export interface StatusResponse {
  correlationId: string;
  status: BridgeStatus;
  updatedAt?: string;
  quoteResponse?: {
    quote?: {
      amountIn?: string;
      amountOut?: string;
    };
  };
  swapDetails?: {
    depositTxHash?: string;
    withdrawTxHash?: string;
    refundTxHash?: string;
  };
  error?: string;
}

// API Error
export class OneClickApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'OneClickApiError';
  }
}

/**
 * Get a quote for a cross-chain swap
 */
export async function getQuote(params: QuoteRequest): Promise<QuoteResponse> {
  // Calculate deadline (10 minutes from now)
  const deadline = params.deadline || new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const requestBody = {
    dry: params.dry ?? true,
    swapType: params.swapType || 'EXACT_INPUT',
    slippageTolerance: params.slippageTolerance ?? 100, // 1% in basis points
    originAsset: params.originAsset,
    depositType: params.depositType || 'ORIGIN_CHAIN',
    destinationAsset: params.destinationAsset,
    amount: params.amount,
    refundTo: params.refundTo,
    refundType: params.refundType || 'ORIGIN_CHAIN',
    recipient: params.recipient,
    recipientType: params.recipientType || 'DESTINATION_CHAIN',
    deadline,
  };

  const response = await fetch(`${API_BASE}/quote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new OneClickApiError(
      error.message || `Quote request failed: ${response.status}`,
      response.status,
      error.code
    );
  }

  const rawResponse = await response.json();

  // Log the raw response for debugging
  console.log('1Click API raw response:', JSON.stringify(rawResponse, null, 2));

  // Normalize the response to handle different field naming conventions
  return normalizeQuoteResponse(rawResponse);
}

/**
 * Submit deposit transaction hash to speed up processing
 */
export async function submitDeposit(quoteId: string, txHash: string): Promise<void> {
  const response = await fetch(`${API_BASE}/deposit/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      quoteId,
      txHash,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new OneClickApiError(
      error.message || `Deposit submit failed: ${response.status}`,
      response.status,
      error.code
    );
  }
}

/**
 * Check the status of a bridge transaction
 * @param depositAddress - The deposit address from the quote response
 */
export async function getStatus(depositAddress: string): Promise<StatusResponse> {
  const response = await fetch(`${API_BASE}/status?depositAddress=${encodeURIComponent(depositAddress)}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new OneClickApiError(
      error.message || `Status request failed: ${response.status}`,
      response.status,
      error.code
    );
  }

  const rawResponse = await response.json();
  console.log('Status API response:', rawResponse);
  return rawResponse;
}

/**
 * Get list of supported tokens from API
 */
export async function getTokens(): Promise<TokenInfo[]> {
  const response = await fetch(`${API_BASE}/tokens`);

  if (!response.ok) {
    throw new OneClickApiError(
      `Failed to fetch tokens: ${response.status}`,
      response.status
    );
  }

  return response.json();
}

/**
 * Format amount for display (convert from smallest unit)
 * Handles undefined/null values safely
 */
export function formatAmount(amount: string | undefined | null, decimals: number): string {
  // Handle undefined/null/empty values
  if (!amount || amount === '0') {
    return '0';
  }

  try {
    const num = BigInt(amount);
    const divisor = BigInt(10 ** decimals);
    const whole = num / divisor;
    const fraction = num % divisor;

    if (fraction === BigInt(0)) {
      return whole.toString();
    }

    const fractionStr = fraction.toString().padStart(decimals, '0').replace(/0+$/, '');
    return `${whole}.${fractionStr}`;
  } catch (error) {
    console.error('formatAmount error:', error, 'amount:', amount);
    return '0';
  }
}

/**
 * Parse amount to smallest unit
 */
export function parseAmount(amount: string, decimals: number): string {
  const [whole, fraction = ''] = amount.split('.');
  const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
  const combined = whole + paddedFraction;
  return BigInt(combined).toString();
}

/**
 * Validate Starknet address format
 */
export function isValidStarknetAddress(address: string): boolean {
  // Starknet addresses are 64-character hex strings with 0x prefix
  return /^0x[a-fA-F0-9]{63,64}$/.test(address);
}
