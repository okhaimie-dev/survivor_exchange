import type { ERC721Token, FormattedNFT, MetadataAttribute, ParsedMetadata } from '../types';
import { safeParseJSON } from './json';

function getAttributeValue(attributes: MetadataAttribute[], traitType: string): string | undefined {
  const attr = attributes.find((a) => a.trait_type === traitType);
  return attr ? String(attr.value) : undefined;
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

