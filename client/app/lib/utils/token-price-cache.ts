import { getQuotes } from '@avnu/avnu-sdk';
import { USDC_ADDRESS, SUPPORTED_TOKENS, LORDS_ADDRESS } from '../constants';
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
  price: number; // Price in USDC (e.g., 3000 means 1 ETH = 3000 USDC)
  timestamp: number;
}

// Cache for token prices (10 seconds TTL)
const PRICE_CACHE_TTL = 40000; // 40 seconds in milliseconds
const priceCache = new Map<string, CachedPrice>();

// Track pending requests to prevent concurrent fetches for the same token
const pendingRequests = new Map<string, Promise<number>>();

/**
 * Gets the USDC price of a token
 * @param tokenAddress - Address of the token
 * @param takerAddress - Optional taker address for better routing
 * @returns Price in USDC (e.g., 3000 means 1 token = 3000 USDC)
 */
export async function getTokenPriceInUSDC(tokenAddress: string, takerAddress?: string): Promise<number> {
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
      
      // Try multiple amounts to handle tokens with low liquidity
      const amountsToTry = [
        BigInt(Math.pow(10, tokenDecimals)), // 1 token
        BigInt(Math.pow(10, tokenDecimals) / 100), // 0.01 token
        BigInt(Math.pow(10, tokenDecimals) / 1000), // 0.001 token
        BigInt(Math.pow(10, tokenDecimals) / 10000), // 0.0001 token
      ];
      
      let quotes: any[] | undefined;
      let usedAmount: bigint | undefined;
      
      for (const amount of amountsToTry) {
        try {
          quotes = await getQuotes({
            sellTokenAddress: tokenAddress,
            buyTokenAddress: USDC_ADDRESS,
            sellAmount: amount,
            takerAddress: takerAddress || '0x0', // Use takerAddress if provided for better routing
          });
          
          if (quotes && quotes.length > 0) {
            usedAmount = amount;
            break;
          }
        } catch (e) {
          // Continue to next amount if this one fails
          console.debug(`Quote failed for amount ${amount}, trying smaller amount...`);
        }
      }
      
      if (!quotes || quotes.length === 0) {
        // Try Ekubo API as fallback for LORDS
        if (normalizedAddress === normalizeContractAddress(LORDS_ADDRESS).toLowerCase()) {
          console.log('Avnu failed, trying Ekubo API for LORDS...');
          for (const amount of amountsToTry) {
            try {
              const ekuboPrice = await getEkuboQuote(amount, tokenAddress, USDC_ADDRESS);
              if (ekuboPrice !== null && ekuboPrice > 0) {
                const scaledPrice = amount < amountsToTry[0] ? ekuboPrice * (Number(amountsToTry[0]) / Number(amount)) : ekuboPrice;

                if (isFinite(scaledPrice) && scaledPrice > 0) {
                  console.log('Successfully fetched LORDS price from Ekubo:', scaledPrice);
                  priceCache.set(normalizedAddress, {
                    price: scaledPrice,
                    timestamp: Date.now(),
                  });
                  return scaledPrice;
                }
              }
            } catch (e) {
              console.debug(`Ekubo quote failed for amount ${amount}, trying smaller amount...`);
            }
          }
        }

        // If we have expired cache, use it as fallback instead of throwing
        const expiredCache = priceCache.get(normalizedAddress);
        if (expiredCache) {
          const expiredPrice = expiredCache.price;
          // Only use expired cache if it's valid (not Infinity, NaN, etc.)
          if (isFinite(expiredPrice) && expiredPrice !== Infinity && expiredPrice !== -Infinity && !isNaN(expiredPrice) && expiredPrice > 0) {
            console.warn('No quotes available, using expired cache as fallback');
            return expiredPrice;
          }
        }
        throw new Error('No quotes available');
      }
      
      const bestQuote = quotes[0];
      
      // Convert buyAmount from wei to USDC (USDC has 6 decimals)
      const priceInUSDC = Number(bestQuote.buyAmount) / Math.pow(10, 6);
      
      // If we used a fraction of a token, scale the price accordingly
      if (usedAmount && usedAmount < amountsToTry[0]) {
        const scaleFactor = Number(amountsToTry[0]) / Number(usedAmount);
        const scaledPrice = priceInUSDC * scaleFactor;
        
        // Validate price before caching - reject Infinity, NaN, negative, or zero values
        if (!isFinite(scaledPrice) || scaledPrice === Infinity || scaledPrice === -Infinity || isNaN(scaledPrice) || scaledPrice <= 0) {
          console.warn(`Invalid scaled price received for token ${tokenAddress}: ${scaledPrice}`);
          throw new Error(`Invalid price received: ${scaledPrice}`);
        }
        
        // Cache the scaled price
        priceCache.set(normalizedAddress, {
          price: scaledPrice,
          timestamp: Date.now(),
        });
        
        return scaledPrice;
      }
      
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

      // Try Ekubo API as fallback for LORDS when Avnu fails
      if (normalizedAddress === normalizeContractAddress(LORDS_ADDRESS).toLowerCase()) {
        console.log('Avnu threw error, trying Ekubo API for LORDS...');
        const tokenInfo = SUPPORTED_TOKENS.find(t => normalizeContractAddress(t.address).toLowerCase() === normalizedAddress);
        const tokenDecimals = tokenInfo?.decimals || 18;

        const amountsToTry = [
          BigInt(Math.pow(10, tokenDecimals)),
          BigInt(Math.pow(10, tokenDecimals) / 100),
          BigInt(Math.pow(10, tokenDecimals) / 1000),
          BigInt(Math.pow(10, tokenDecimals) / 10000),
        ];

        for (const amount of amountsToTry) {
          try {
            const ekuboPrice = await getEkuboQuote(amount, tokenAddress, USDC_ADDRESS);
            if (ekuboPrice !== null && ekuboPrice > 0) {
              const scaledPrice = amount < amountsToTry[0] ? ekuboPrice * (Number(amountsToTry[0]) / Number(amount)) : ekuboPrice;

              if (isFinite(scaledPrice) && scaledPrice > 0) {
                console.log('Successfully fetched LORDS price from Ekubo:', scaledPrice);
                priceCache.set(normalizedAddress, {
                  price: scaledPrice,
                  timestamp: Date.now(),
                });
                return scaledPrice;
              }
            }
          } catch (e) {
            console.debug(`Ekubo quote failed for amount ${amount}...`);
          }
        }
      }

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
  return age >= PRICE_CACHE_TTL; // 40 seconds have passed
}

