import * as starknet from 'starknet';

export function truncateWithEllipsis(str: string, maxLength: number = 20): string {
    if (!str) return '';
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength) + '...';
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

export function truncateAddress(address: string, startLength: number = 6, endLength: number = 4): string {
  if (!address) return '';
  
  if (address.length <= startLength + endLength) {
    return address;
  }
  
  const start = address.slice(0, startLength);
  const end = address.slice(-endLength);
  return `${start}...${end}`;
}

