import * as starknet from 'starknet';
import { byteArray } from 'starknet';

export function truncateWithEllipsis(str: string, maxLength: number = 20): string {
    if (!str) return '';
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength) + '...';
}

export function truncateAuctionName(name: string, maxLength: number = 17): string {
    if (!name) return '';
    const trimmed = name.trim();
    if (trimmed.length <= maxLength) return trimmed;
    return trimmed.slice(0, maxLength) + '...';
}

export function formatPrice(value: number | string | null | undefined): string {
    if (value === null || value === undefined) return "—";
    
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue) || numValue === 0) return "0.00";
    
    const absValue = Math.abs(numValue);
    const sign = numValue < 0 ? "-" : "";
    
    if (absValue >= 1000000000) {
        return `${sign}${(absValue / 1000000000).toFixed(2)}B`;
    } else if (absValue >= 1000000) {
        return `${sign}${(absValue / 1000000).toFixed(2)}m`;
    } else if (absValue >= 1000) {
        return `${sign}${(absValue / 1000).toFixed(2)}k`;
    } else {
        return `${sign}${absValue.toFixed(2)}`;
    }
}

export function felt252ToString(felt252: string): string {
  if (!felt252) return '';
  
  if (!felt252.match(/^0x[0-9a-fA-F]+$/i) && !felt252.match(/^[0-9a-fA-F]+$/i)) {
    return felt252;
  }
  
  try {
    const hexValue = felt252.startsWith('0x') ? felt252 : `0x${felt252}`;
    
    const decoded = starknet.shortString.decodeShortString(hexValue);
    return decoded || felt252;
  } catch {
    return felt252;
  }
}

/**
 * Converts a ByteArray (from GraphQL/Cairo) to a JavaScript string
 * Handles both ByteArray structure and plain string formats
 */
export function byteArrayToString(value: any): string {
  if (!value) return '';
  
  // If it's already a string, return it
  if (typeof value === 'string') {
    // Check if it looks like a ByteArray structure (object with data/pending_word)
    if (value.includes('{') || value.includes('[')) {
      try {
        const parsed = JSON.parse(value);
        if (parsed && (parsed.data !== undefined || parsed.pending_word !== undefined)) {
          return byteArray.stringFromByteArray(parsed);
        }
      } catch {
        // Not JSON, continue
      }
    }
    return value;
  }
  
  // If it's an object with ByteArray structure
  if (typeof value === 'object' && value !== null) {
    try {
      // Check if it has ByteArray structure
      if (value.data !== undefined || value.pending_word !== undefined) {
        return byteArray.stringFromByteArray(value);
      }
    } catch {
      // If decoding fails, try to stringify
      return JSON.stringify(value);
    }
  }
  
  return String(value);
}

export function truncateAddress(address: string, startLength: number = 6, endLength: number = 4): string {
  if (!address) return '';
  
  if (address.length <= startLength + endLength) {
    return address;
  }
  
  const start = address.slice(0, startLength);
  const end = address.slice(-endLength);
  return `${start}...${end}`;
}

export function formatUSD(value: number | string | null | undefined, decimals: number = 2): string {
  if (value === null || value === undefined) return "—";
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return "—";
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numValue);
}

/**
 * Formats USD with smart decimal places:
 * - Shows up to 3 decimal places
 * - If first non-zero digit is at position 1 or 2, show 2 decimal places
 * - If first non-zero digit is at position 3, show 3 decimal places
 * - If first non-zero digit is at position 4+, fallback to 2 decimal places
 */
export function formatUSDSmart(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "—";
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return "—";
  
  // Format to 6 decimal places first to avoid floating point precision issues
  // Then analyze the string to find first non-zero digit
  const valueStr = numValue.toFixed(6);
  const decimalIndex = valueStr.indexOf('.');
  
  if (decimalIndex === -1) {
    // No decimal point, show 2 decimal places
    return formatUSD(numValue, 2);
  }
  
  // Find first non-zero digit after decimal point
  const decimalPart = valueStr.substring(decimalIndex + 1);
  let firstNonZeroIndex = -1;
  
  for (let i = 0; i < decimalPart.length; i++) {
    if (decimalPart[i] !== '0') {
      firstNonZeroIndex = i + 1; // +1 because position 1 is first digit after decimal
      break;
    }
  }
  
  // If no non-zero digits found (e.g., 1.000000), show 2 decimal places
  if (firstNonZeroIndex === -1) {
    return formatUSD(numValue, 2);
  }
  
  // Determine decimal places based on position of first non-zero digit
  let decimals: number;
  if (firstNonZeroIndex === 1 || firstNonZeroIndex === 2) {
    // First or second digit after decimal, show 2 decimal places
    decimals = 2;
  } else if (firstNonZeroIndex === 3) {
    // Third digit after decimal, show 3 decimal places
    decimals = 3;
  } else {
    // Fourth or later digit, fallback to 2 decimal places
    decimals = 2;
  }
  
  return formatUSD(numValue, decimals);
}

export function formatUSDCompact(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "—";
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue) || numValue === 0) return "$0.00";
  
  const absValue = Math.abs(numValue);
  const sign = numValue < 0 ? "-" : "";
  
  if (absValue >= 1000000000000) {
    return `${sign}$${(absValue / 1000000000000).toFixed(2)}T`;
  } else if (absValue >= 1000000000) {
    return `${sign}$${(absValue / 1000000000).toFixed(2)}B`;
  } else if (absValue >= 1000000) {
    return `${sign}$${(absValue / 1000000).toFixed(2)}M`;
  } else if (absValue >= 1000) {
    return `${sign}$${(absValue / 1000).toFixed(2)}K`;
  } else {
    return `${sign}$${absValue.toFixed(2)}`;
  }
}

/**
 * Formats a token amount with appropriate decimal places
 * @param value - The token amount to format
 * @param decimals - Number of decimal places to show (default: 6)
 * @param symbol - Optional token symbol to append
 * @returns Formatted string
 */
export function formatTokenAmount(value: number | string | null | undefined, decimals: number = 6, symbol?: string): string {
  if (value === null || value === undefined) return symbol ? `0.00 ${symbol}` : "0.00";
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return symbol ? `— ${symbol}` : "—";
  
  const absValue = Math.abs(numValue);
  const sign = numValue < 0 ? "-" : "";
  
  let formatted: string;
  
  if (absValue < 1 && absValue > 0) {
    const significantFigures = 4;
    const magnitude = Math.floor(Math.log10(absValue));
    const decimalsNeeded = significantFigures - 1 - magnitude;
    const maxDecimals = Math.min(Math.max(0, decimalsNeeded), 7);
    formatted = absValue.toFixed(maxDecimals);
  } else if (absValue >= 1000000000000) {
    // Trillions
    formatted = `${(absValue / 1000000000000).toFixed(2)}t`;
  } else if (absValue >= 1000000000) {
    // Billions
    formatted = `${(absValue / 1000000000).toFixed(2)}b`;
  } else if (absValue >= 1000000) {
    // Millions
    formatted = `${(absValue / 1000000).toFixed(2)}m`;
  } else if (absValue >= 1000) {
    // Thousands
    formatted = `${(absValue / 1000).toFixed(2)}k`;
  } else {
    const maxDecimals = Math.min(decimals, 7);
    formatted = absValue.toFixed(maxDecimals).replace(/\.?0+$/, '');
  }
  
  return symbol ? `${sign}${formatted} ${symbol}` : `${sign}${formatted}`;
}

