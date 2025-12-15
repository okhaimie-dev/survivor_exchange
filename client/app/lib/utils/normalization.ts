export function normalizeTokenId(tokenId: string | number | null | undefined): string {
  if (tokenId === null || tokenId === undefined) return '';
  
  const tokenIdStr = String(tokenId);
  if (!tokenIdStr) return '';
  
  let hexPart: string;
  if (tokenIdStr.length >= 2 && tokenIdStr[0] === '0' && (tokenIdStr[1] === 'x' || tokenIdStr[1] === 'X')) {
    hexPart = tokenIdStr.slice(2);
  } else {
    hexPart = tokenIdStr;
  }
  
  if (/^\d+$/.test(hexPart)) {
    const num = parseInt(hexPart, 10);
    hexPart = num.toString(16);
  }
  
  const padded = hexPart.toLowerCase().padStart(64, '0');
  return `0x${padded}`;
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

