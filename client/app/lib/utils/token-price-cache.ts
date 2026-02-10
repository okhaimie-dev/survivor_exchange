import { getPrices } from '@avnu/avnu-sdk';
import { USDC_ADDRESS, SUPPORTED_TOKENS, getOnChainDecimals } from '../constants';
import { normalizeContractAddress } from './normalization';

const STARKNET_MAINNET_CHAIN_ID = '23448594291968334';

async function getEkuboQuote(
  amount: bigint,
  tokenAddress: string,
  otherTokenAddress: string
): Promise<number | null> {
  try {
    const amountParam = amount.toString();
    const response = await fetch(
      `https://prod-api-quoter.ekubo.org/${STARKNET_MAINNET_CHAIN_ID}/${amountParam}/${tokenAddress}/${otherTokenAddress}`
    );

    if (!response.ok) {
      throw new Error(`Ekubo API returned ${response.status}`);
    }

    const data = await response.json();

    if (data.total_calculated !== undefined) {
      const totalCalculated = BigInt(data.total_calculated);
      return Number(totalCalculated) / Math.pow(10, 6);
    }

    return null;
  } catch (error) {
    console.error('Error fetching Ekubo quote:', error);
    return null;
  }
}

interface CachedPrice {
  price: number; // Price in USD (e.g., 3000 means 1 ETH = $3000)
  timestamp: number;
}

const PRICE_CACHE_TTL = 40000; // 40 seconds
const priceCache = new Map<string, CachedPrice>();

// Deduplication for the batch fetch
let pendingBatchRequest: Promise<void> | null = null;

function isValidCachedPrice(price: number): boolean {
  return isFinite(price) && !isNaN(price) && price > 0;
}

/**
 * Fetches USD prices for all supported tokens in a single batch call via Avnu getPrices.
 * Falls back to Ekubo for any token that getPrices doesn't return data for.
 */
async function fetchAllPrices(): Promise<void> {
  const tokenAddresses = SUPPORTED_TOKENS
    .filter(t => normalizeContractAddress(t.address).toLowerCase() !== normalizeContractAddress(USDC_ADDRESS).toLowerCase())
    .map(t => t.address);

  try {
    const prices = await getPrices(tokenAddresses);

    if (prices && Array.isArray(prices)) {
      for (const tp of prices) {
        const normalizedAddr = normalizeContractAddress(tp.address).toLowerCase();
        const usdPrice = tp.starknetMarket?.usd ?? tp.globalMarket?.usd ?? null;
        if (usdPrice !== null && isValidCachedPrice(usdPrice)) {
          priceCache.set(normalizedAddr, {
            price: usdPrice,
            timestamp: Date.now(),
          });
        }
      }
    }
  } catch (error) {
    console.error('getPrices batch call failed:', error);
  }

  // Ekubo fallback for any token still missing a fresh price
  const now = Date.now();
  for (const token of SUPPORTED_TOKENS) {
    const normalizedAddr = normalizeContractAddress(token.address).toLowerCase();
    if (normalizedAddr === normalizeContractAddress(USDC_ADDRESS).toLowerCase()) continue;

    const cached = priceCache.get(normalizedAddr);
    if (cached && (now - cached.timestamp) < PRICE_CACHE_TTL && isValidCachedPrice(cached.price)) continue;

    // Try Ekubo for this missing token
    const onChainDec = getOnChainDecimals(token);
    const amountsToTry = [
      BigInt(Math.pow(10, onChainDec)),
      BigInt(Math.pow(10, onChainDec) / 100),
      BigInt(Math.pow(10, onChainDec) / 1000),
    ];

    for (const amount of amountsToTry) {
      try {
        const ekuboPrice = await getEkuboQuote(amount, token.address, USDC_ADDRESS);
        if (ekuboPrice !== null && ekuboPrice > 0) {
          const scaledPrice = amount < amountsToTry[0]
            ? ekuboPrice * (Number(amountsToTry[0]) / Number(amount))
            : ekuboPrice;

          if (isValidCachedPrice(scaledPrice)) {
            priceCache.set(normalizedAddr, {
              price: scaledPrice,
              timestamp: Date.now(),
            });
            break;
          }
        }
      } catch {
        // try next amount
      }
    }
  }
}

/**
 * Ensures a batch fetch is in flight (deduplication).
 * Multiple callers within the same TTL window share one request.
 */
function ensureBatchFetch(): Promise<void> {
  if (!pendingBatchRequest) {
    pendingBatchRequest = fetchAllPrices().finally(() => {
      pendingBatchRequest = null;
    });
  }
  return pendingBatchRequest;
}

/**
 * Gets the USD price of a token.
 * @param tokenAddress - Address of the token
 * @param _takerAddress - Unused, kept for backward compatibility
 * @returns Price in USD (e.g., 3000 means 1 token = $3000)
 */
export async function getTokenPriceInUSDC(tokenAddress: string, _takerAddress?: string): Promise<number> {
  const normalizedAddress = normalizeContractAddress(tokenAddress).toLowerCase();

  // USDC is always 1:1
  if (normalizedAddress === normalizeContractAddress(USDC_ADDRESS).toLowerCase()) {
    return 1;
  }

  // Check cache first
  const cached = priceCache.get(normalizedAddress);
  if (cached) {
    const age = Date.now() - cached.timestamp;
    if (age < PRICE_CACHE_TTL && isValidCachedPrice(cached.price)) {
      return cached.price;
    }
  }

  // Trigger batch fetch (deduplicated)
  await ensureBatchFetch();

  // Check cache again after batch fetch
  const freshCached = priceCache.get(normalizedAddress);
  if (freshCached && isValidCachedPrice(freshCached.price)) {
    return freshCached.price;
  }

  // Use expired cache as last resort
  if (cached && isValidCachedPrice(cached.price)) {
    console.warn(`Using expired cache for ${tokenAddress}`);
    return cached.price;
  }

  throw new Error(`No price available for ${tokenAddress}`);
}

/**
 * Converts a token amount to its USDC equivalent
 * @param tokenAmount - Amount in the token (e.g., 0.1 ETH)
 * @param tokenAddress - Address of the token
 * @returns USDC equivalent (e.g., 300 for 0.1 ETH at $3000/ETH)
 */
export async function convertTokenAmountToUSDC(tokenAmount: number, tokenAddress: string): Promise<number> {
  const price = await getTokenPriceInUSDC(tokenAddress);
  return tokenAmount * price;
}

/**
 * Checks if a token price needs to be refetched (TTL has passed)
 * @param tokenAddress - Address of the token
 * @returns true if price should be refetched
 */
export function shouldRefetchPrice(tokenAddress: string): boolean {
  const normalizedAddress = normalizeContractAddress(tokenAddress).toLowerCase();
  const cached = priceCache.get(normalizedAddress);

  if (!cached) {
    return true;
  }

  const age = Date.now() - cached.timestamp;
  return age >= PRICE_CACHE_TTL;
}
