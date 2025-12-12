import { getQuotes } from '@avnu/avnu-sdk';
import { USDC_ADDRESS, SUPPORTED_TOKENS } from '../constants';
import { normalizeContractAddress } from './normalization';

interface CachedPrice {
  price: number; // Price in USDC (e.g., 3000 means 1 ETH = 3000 USDC)
  timestamp: number;
}

// Cache for token prices (10 seconds TTL)
const PRICE_CACHE_TTL = 10000; // 10 seconds in milliseconds
const priceCache = new Map<string, CachedPrice>();

// Track pending requests to prevent concurrent fetches for the same token
const pendingRequests = new Map<string, Promise<number>>();

/**
 * Gets the USDC price of a token
 * @param tokenAddress - Address of the token
 * @returns Price in USDC (e.g., 3000 means 1 token = 3000 USDC)
 */
export async function getTokenPriceInUSDC(tokenAddress: string): Promise<number> {
  // Normalize address
  const normalizedAddress = normalizeContractAddress(tokenAddress).toLowerCase();
  
  // Check cache first
  const cached = priceCache.get(normalizedAddress);
  if (cached) {
    const age = Date.now() - cached.timestamp;
    if (age < PRICE_CACHE_TTL) {
      // Validate cached price before returning - reject Infinity, NaN, etc.
      const cachedPrice = cached.price;
      if (isFinite(cachedPrice) && cachedPrice !== Infinity && cachedPrice !== -Infinity && !isNaN(cachedPrice) && cachedPrice > 0) {
        return cachedPrice;
      } else {
        // Invalid cached price (Infinity, NaN, etc.), remove it and fetch fresh
        console.warn(`Invalid cached price detected: ${cachedPrice}, fetching fresh`);
        priceCache.delete(normalizedAddress);
      }
    }
    // Cache expired, but we'll still use it if there's a pending request
  }

  // Check if there's already a pending request for this token
  const pendingRequest = pendingRequests.get(normalizedAddress);
  if (pendingRequest) {
    return pendingRequest;
  }

  // Create new request
  const requestPromise = (async () => {
    try {
      // Fetch price: 1 token in wei -> USDC
      const tokenInfo = SUPPORTED_TOKENS.find(t => normalizeContractAddress(t.address).toLowerCase() === normalizedAddress);
      const tokenDecimals = tokenInfo?.decimals || 18;
      
      // 1 token in wei
      const oneTokenWei = BigInt(Math.pow(10, tokenDecimals));
      
      const quotes = await getQuotes({
        sellTokenAddress: tokenAddress,
        buyTokenAddress: USDC_ADDRESS,
        sellAmount: oneTokenWei,
        takerAddress: '0x0', // Not needed for price quotes
      });
      
      if (!quotes || quotes.length === 0) {
        throw new Error('No quotes available');
      }
      
      const bestQuote = quotes[0];
      
      // Convert buyAmount from wei to USDC (USDC has 6 decimals)
      const priceInUSDC = Number(bestQuote.buyAmount) / Math.pow(10, 6);
      
      // Validate price before caching - reject Infinity, NaN, negative, or zero values
      if (!isFinite(priceInUSDC) || priceInUSDC === Infinity || priceInUSDC === -Infinity || isNaN(priceInUSDC) || priceInUSDC <= 0) {
        console.warn(`Invalid price received for token ${tokenAddress}: ${priceInUSDC}`);
        // Don't cache invalid prices, throw error to trigger retry
        throw new Error(`Invalid price received: ${priceInUSDC}`);
      }
      
      // Cache the price
      priceCache.set(normalizedAddress, {
        price: priceInUSDC,
        timestamp: Date.now(),
      });
      
      return priceInUSDC;
    } catch (error) {
      console.error(`Error fetching price for token ${tokenAddress}:`, error);
      
      // If we have expired cache, validate it before using as fallback
      const expiredCache = priceCache.get(normalizedAddress);
      if (expiredCache) {
        const expiredPrice = expiredCache.price;
        // Only use expired cache if it's valid (not Infinity, NaN, etc.)
        if (isFinite(expiredPrice) && expiredPrice !== Infinity && expiredPrice !== -Infinity && !isNaN(expiredPrice) && expiredPrice > 0) {
          console.warn('Using expired cache as fallback');
          return expiredPrice;
        } else {
          console.warn(`Expired cache is invalid (${expiredPrice}), not using as fallback`);
          // Remove invalid expired cache
          priceCache.delete(normalizedAddress);
        }
      }
      
      throw error;
    } finally {
      // Remove from pending requests
      pendingRequests.delete(normalizedAddress);
    }
  })();

  // Store pending request
  pendingRequests.set(normalizedAddress, requestPromise);
  
  return requestPromise;
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
 * Checks if a token price needs to be refetched (10 seconds have passed)
 * @param tokenAddress - Address of the token
 * @returns true if price should be refetched
 */
export function shouldRefetchPrice(tokenAddress: string): boolean {
  const normalizedAddress = normalizeContractAddress(tokenAddress).toLowerCase();
  const cached = priceCache.get(normalizedAddress);
  
  if (!cached) {
    return true; // No cache, need to fetch
  }
  
  const age = Date.now() - cached.timestamp;
  return age >= PRICE_CACHE_TTL; // 10 seconds have passed
}

