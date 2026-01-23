/**
 * Address Name Cache
 * Resolves Starknet addresses to Cartridge usernames with localStorage caching
 */

import { lookupAddresses } from '@cartridge/controller';

const CACHE_KEY = 'addressNameCache';
const MAX_CACHE_SIZE = 10000;

interface AddressNameCache {
  [normalizedAddress: string]: string | null;
}

/**
 * Normalizes an address to ensure consistent cache keys
 */
function normalizeAddress(address: string): string {
  return address.replace(/^0x0+/, "0x").toLowerCase();
}

/**
 * Gets the cache from localStorage
 */
function getCache(): AddressNameCache {
  if (typeof window === 'undefined') return {};
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : {};
  } catch (error) {
    console.error('Error reading address name cache:', error);
    return {};
  }
}

/**
 * Saves the cache to localStorage
 */
function saveCache(cache: AddressNameCache): void {
  if (typeof window === 'undefined') return;
  try {
    const entries = Object.entries(cache);
    if (entries.length > MAX_CACHE_SIZE) {
      const trimmedCache = Object.fromEntries(
        entries.slice(entries.length - MAX_CACHE_SIZE)
      );
      localStorage.setItem(CACHE_KEY, JSON.stringify(trimmedCache));
    } else {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    }
  } catch (error) {
    console.error('Error saving address name cache:', error);
  }
}

/**
 * Looks up a single address name, checking cache first
 */
export async function lookupAddressName(address: string): Promise<string | null> {
  const normalized = normalizeAddress(address);
  const cache = getCache();

  // Check cache first
  if (normalized in cache) {
    return cache[normalized];
  }

  // Not in cache, fetch from API
  try {
    const addressMap = await lookupAddresses([normalized]);
    const name = addressMap.get(normalized) || null;

    // Update cache
    cache[normalized] = name;
    saveCache(cache);

    return name;
  } catch (error) {
    console.error('Error looking up address name:', error);
    return null;
  }
}

/**
 * Batch lookup multiple addresses at once (more efficient)
 */
export async function lookupAddressNames(addresses: string[]): Promise<Map<string, string | null>> {
  const cache = getCache();
  const results = new Map<string, string | null>();
  const uncachedAddresses: string[] = [];

  // Check cache for each address
  for (const address of addresses) {
    const normalized = normalizeAddress(address);
    if (normalized in cache) {
      results.set(normalized, cache[normalized]);
    } else {
      uncachedAddresses.push(normalized);
    }
  }

  // Fetch uncached addresses from API
  if (uncachedAddresses.length > 0) {
    try {
      const addressMap = await lookupAddresses(uncachedAddresses);

      for (const address of uncachedAddresses) {
        const name = addressMap.get(address) || null;
        results.set(address, name);
        cache[address] = name;
      }

      saveCache(cache);
    } catch (error) {
      console.error('Error looking up address names:', error);
      // Set null for failed lookups
      for (const address of uncachedAddresses) {
        results.set(address, null);
      }
    }
  }

  return results;
}

/**
 * Get cached name synchronously (returns null if not cached)
 */
export function getCachedName(address: string): string | null {
  const normalized = normalizeAddress(address);
  const cache = getCache();
  return cache[normalized] ?? null;
}
