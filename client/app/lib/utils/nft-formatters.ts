import type { ERC721Token, FormattedNFT, MetadataAttribute, ParsedMetadata } from '../types';
import { safeParseJSON } from './json';
import { ADVENTURER_NFT_CONTRACT_ADDRESS } from '../constants';

// Torii static API base URL for adventurer images
const TORII_STATIC_BASE_URL = 'https://api.cartridge.gg/x/arcade-main/torii/static';

/**
 * Generate static image URL for an adventurer NFT
 * Uses the Torii static API which returns the SVG directly - no RPC calls needed
 * @param tokenId - Token ID (can be hex or decimal string, or number)
 * @returns Static image URL
 */
export function getAdventurerImageUrl(tokenId: string | number): string {
  // Convert to number first
  const tokenIdNum = typeof tokenId === 'string'
    ? (tokenId.startsWith('0x') ? parseInt(tokenId, 16) : parseInt(tokenId, 10))
    : tokenId;

  // Pad token ID to 64 hex characters (without 0x prefix, then add 0x)
  const paddedTokenId = '0x' + tokenIdNum.toString(16).padStart(64, '0');

  return `${TORII_STATIC_BASE_URL}/${ADVENTURER_NFT_CONTRACT_ADDRESS}/${paddedTokenId}/image`;
}

function getAttributeValue(attributes: MetadataAttribute[], traitType: string): string | undefined {
  const exact = attributes.find((a) => a.trait_type === traitType);
  if (exact) return String(exact.value);
  const lower = traitType.toLowerCase();
  const insensitive = attributes.find((a) => (a.trait_type ?? '').toLowerCase() === lower);
  return insensitive ? String(insensitive.value) : undefined;
}

function cleanupMetadataName(name: string | null | undefined): string {
  if (!name) return '';
  
  return name
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '')
    .replace(/\\/g, '')
    .trim();
}

export function formatNFT(token: ERC721Token): FormattedNFT | null {
  if (!token.tokenId || !token.contractAddress) {
    return null;
  }

  const parsedMetadata = safeParseJSON<ParsedMetadata>(token.metadata);
  const parsedAttributes = safeParseJSON<MetadataAttribute[]>(token.metadataAttributes) || [];

  const finalAttributes = parsedMetadata?.attributes || parsedAttributes;

  const cleanedMetadataName = cleanupMetadataName(token.metadataName) || token.name || 'Unnamed NFT';

  const formatted: FormattedNFT = {
    metadataName: cleanedMetadataName,
    metadataDescription: token.metadataDescription || parsedMetadata?.description || '',
    contractAddress: token.contractAddress,
    imagePath: token.imagePath || parsedMetadata?.image || '',
    metadata: parsedMetadata,
    attributes: finalAttributes,
    name: token.name || 'Unknown',
    symbol: token.symbol || 'UNKNOWN',
    tokenId: token.tokenId,
    beastName: getAttributeValue(finalAttributes, 'Beast'),
    beastType: getAttributeValue(finalAttributes, 'Type'),
    tier: getAttributeValue(finalAttributes, 'Tier'),
    level: getAttributeValue(finalAttributes, 'Level'),
    health: getAttributeValue(finalAttributes, 'Health'),
    power: getAttributeValue(finalAttributes, 'Power'),
    rank: getAttributeValue(finalAttributes, 'Rank'),
  };

  return formatted;
}

export function formatNFTs(tokens: ERC721Token[]): FormattedNFT[] {
  return tokens.map(formatNFT).filter((nft): nft is FormattedNFT => nft !== null);
}

