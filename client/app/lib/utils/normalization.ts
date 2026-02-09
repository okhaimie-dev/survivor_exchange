/**
 * Canonical decimal string for a token ID. Use for consistent storage/lookup (e.g. attributes by tokenId).
 * Handles number, short hex, long 0x-padded hex; uses BigInt so large IDs don't lose precision.
 */
export function toDecimalTokenId(tokenId: string | number | null | undefined): string {
  if (tokenId === null || tokenId === undefined) return '';
  if (typeof tokenId === 'number') return String(tokenId);
  const s = String(tokenId).trim();
  if (!s) return '';
  if (s.length >= 2 && (s[0] === '0' && (s[1] === 'x' || s[1] === 'X'))) {
    try {
      return BigInt(s).toString(10);
    } catch {
      return s;
    }
  }
  return s;
}

export function normalizeTokenId(tokenId: string | number | null | undefined): string {
  if (tokenId === null || tokenId === undefined) return '';
  
  const tokenIdStr = String(tokenId).trim();
  if (!tokenIdStr) return '';
  
  const hasHexPrefix = tokenIdStr.length >= 2 && tokenIdStr[0] === '0' && (tokenIdStr[1] === 'x' || tokenIdStr[1] === 'X');
  let hexPart: string;

  if (hasHexPrefix) {
    // Already hex: use as-is (don't treat "0x3039" as decimal 3039)
    hexPart = tokenIdStr.slice(2);
    try {
      hexPart = BigInt(tokenIdStr).toString(16);
    } catch {
      hexPart = tokenIdStr.slice(2);
    }
  } else {
    hexPart = tokenIdStr;
    if (/^\d+$/.test(hexPart)) {
      const num = parseInt(hexPart, 10);
      hexPart = num.toString(16);
    }
  }
  
  const padded = hexPart.toLowerCase().replace(/^0+/, '') || '0';
  const padded64 = padded.padStart(64, '0');
  return `0x${padded64}`;
}

export function normalizeContractAddress(address: string | null | undefined): string {
  if (!address) return '';
  
  const addrStr = String(address);
  if (!addrStr) return '';
  
  let hexPart: string;
  if (addrStr.length >= 2 && addrStr[0] === '0' && (addrStr[1] === 'x' || addrStr[1] === 'X')) {
    hexPart = addrStr.slice(2);
  } else {
    hexPart = addrStr;
  }
  
  // Remove leading zeros first (but keep at least one zero if the whole thing is zeros)
  hexPart = hexPart.toLowerCase().replace(/^0+/, '') || '0';
  
  // Then pad to 64 characters (32 bytes) with leading zeros
  const padded = hexPart.padStart(64, '0');
  return `0x${padded}`;
}

