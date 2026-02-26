/**
 * Hook to resolve Starknet addresses to Cartridge usernames
 */

import { useState, useEffect } from 'react';
import { lookupAddressName, getCachedName } from '../../lib/utils/address-name-cache';
import { truncateAddress } from '../../lib/utils/formatters';

interface UseAddressNameOptions {
  /** If true, returns truncated address as fallback instead of full address */
  truncateFallback?: boolean;
}

/**
 * Hook to resolve a single address to a Cartridge username
 * Returns the username if found, otherwise returns the address (truncated or full)
 */
export function useAddressName(
  address: string | undefined | null,
  options: UseAddressNameOptions = { truncateFallback: true }
): { name: string; isLoading: boolean } {
  const [name, setName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!address) {
      setName(null);
      return;
    }

    // Check cache first (synchronous)
    const cached = getCachedName(address);
    if (cached !== null) {
      setName(cached);
      return;
    }

    // Fetch from API
    setIsLoading(true);
    lookupAddressName(address)
      .then((resolvedName) => {
        setName(resolvedName);
      })
      .catch(() => {
        setName(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [address]);

  // Determine display value
  const displayName = name || (
    address
      ? (options.truncateFallback ? truncateAddress(address) : address)
      : ''
  );

  return { name: displayName, isLoading };
}

/**
 * Hook to resolve multiple addresses to Cartridge usernames
 * Returns a map of address -> username (or truncated address if not found)
 */
export function useAddressNames(
  addresses: string[],
  options: UseAddressNameOptions = { truncateFallback: true }
): { names: Map<string, string>; isLoading: boolean } {
  const [names, setNames] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (addresses.length === 0) {
      setNames(new Map());
      return;
    }

    const fetchNames = async () => {
      setIsLoading(true);
      try {
        const { lookupAddressNames } = await import('../../lib/utils/address-name-cache');
        const resolvedNames = await lookupAddressNames(addresses);

        const displayNames = new Map<string, string>();
        for (const address of addresses) {
          const normalized = address.replace(/^0x0+/, "0x").toLowerCase();
          const resolvedName = resolvedNames.get(normalized);
          displayNames.set(
            address,
            resolvedName || (options.truncateFallback ? truncateAddress(address) : address)
          );
        }
        setNames(displayNames);
      } catch (error) {
        console.error('Error resolving address names:', error);
        // Fallback to truncated addresses
        const fallbackNames = new Map<string, string>();
        for (const address of addresses) {
          fallbackNames.set(
            address,
            options.truncateFallback ? truncateAddress(address) : address
          );
        }
        setNames(fallbackNames);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNames();
  }, [addresses.join(','), options.truncateFallback]);

  return { names, isLoading };
}
