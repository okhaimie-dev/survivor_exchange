import { normalizeContractAddress } from './normalization';

/**
 * Normalizes an address for consistent comparison and storage.
 * This ensures addresses from different sources (wallets, GraphQL) are in the same format.
 * 
 * Address normalization:
 * - Converts to lowercase
 * - Ensures 0x prefix
 * - Pads to 64 hex characters (32 bytes)
 * 
 * This is critical because:
 * - Argent/Braavos may return addresses in different formats
 * - Cartridge may use normalized addresses
 * - GraphQL responses may vary in format
 * 
 * Always normalize addresses before:
 * - Comparing addresses (e.g., checking if user is seller)
 * - Storing addresses
 * - Sending addresses to GraphQL queries (normalize before query)
 */
export function normalizeAddressForComparison(address: string | null | undefined): string {
  return normalizeContractAddress(address).toLowerCase();
}

/**
 * Normalizes an address for GraphQL queries.
 * Some GraphQL endpoints expect addresses in a specific format.
 */
export function normalizeAddressForQuery(address: string | null | undefined): string {
  const normalized = normalizeContractAddress(address);
  // GraphQL typically expects addresses as strings, so we return the normalized form
  // Some endpoints may prefer lowercase, but the normalization function already handles this
  return normalized;
}

