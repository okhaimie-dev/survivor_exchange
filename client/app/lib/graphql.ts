import { gql } from '@apollo/client';
import * as starknet from 'starknet';

// Re-export gql for Apollo Client compatibility
export { gql };

// Metadata attribute type
export interface MetadataAttribute {
  trait_type: string;
  value: string | number;
}

// Parsed metadata structure
export interface ParsedMetadata {
  attributes: MetadataAttribute[];
  description: string;
  image: string;
  name: string;
}

// ERC721 Token interface matching the GraphQL response
export interface ERC721Token {
  metadataName?: string | null;
  metadataDescription?: string | null;
  contractAddress?: string | null;
  imagePath?: string | null;
  metadata?: string | null; // JSON string that needs parsing
  metadataAttributes?: string | null; // JSON string that needs parsing
  name?: string | null;
  symbol?: string | null;
  tokenId?: string | null;
}

// Formatted NFT with parsed metadata
export interface FormattedNFT {
  metadataName: string;
  metadataDescription: string;
  contractAddress: string;
  imagePath: string;
  metadata: ParsedMetadata | null;
  attributes: MetadataAttribute[];
  name: string;
  symbol: string;
  tokenId: string;
  // Helper getters for common attributes
  beastName?: string;
  beastType?: string;
  tier?: string;
  level?: string;
  health?: string;
  power?: string;
  rank?: string;
}

export interface TokenBalanceNode {
  tokenMetadata?: ERC721Token | null;
}

export interface TokenBalanceEdge {
  node: TokenBalanceNode;
}

export interface MyNFTsResponse {
  tokenBalances: {
    edges: TokenBalanceEdge[];
  };
}

export const MY_NFTS_QUERY = gql`
  query MyNFTS($accountAddress: String!) {
    tokenBalances(limit: 1000000, accountAddress: $accountAddress) {
      edges {
        node {
          tokenMetadata {
            ... on ERC721__Token {
              metadataName
              metadataDescription
              contractAddress
              imagePath
              metadata
              metadataAttributes
              name
              symbol
              tokenId
            }
          }
        }
      }
    }
  }
`;

// Backward compatibility function - can be removed once hooks are migrated
export async function fetchMyNFTs(accountAddress: string): Promise<MyNFTsResponse> {
  // This is now handled by Apollo Client hooks
  // Keeping for backward compatibility
  throw new Error('Use Apollo Client hooks instead. See useMyNFTs hook.');
}

/**
 * Parses a JSON string safely, returning null if parsing fails
 */
function safeParseJSON<T>(jsonString: string | null | undefined): T | null {
  if (!jsonString) return null;
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    return null;
  }
}

/**
 * Gets a specific attribute value from the metadata attributes
 */
function getAttributeValue(attributes: MetadataAttribute[], traitType: string): string | undefined {
  const attr = attributes.find((a) => a.trait_type === traitType);
  return attr ? String(attr.value) : undefined;
}

/**
 * Cleans up metadataName by removing escaped quotes and backslashes
 * Example: "\\\"Morbid Bite\\\" Mantis" -> "Morbid Bite" Mantis
 */
function cleanupMetadataName(name: string | null | undefined): string {
  if (!name) return '';
  
  // Remove escaped quotes and backslashes
  return name
    .replace(/\\"/g, '"')      // Replace \" with "
    .replace(/\\\\/g, '')      // Remove escaped backslashes \\
    .replace(/\\/g, '')        // Remove any remaining backslashes
    .trim();
}

/**
 * Formats and parses an ERC721Token into a FormattedNFT
 */
export function formatNFT(token: ERC721Token): FormattedNFT | null {
  if (!token.tokenId || !token.contractAddress) {
    return null;
  }

  // Parse metadata and attributes
  const parsedMetadata = safeParseJSON<ParsedMetadata>(token.metadata);
  const parsedAttributes = safeParseJSON<MetadataAttribute[]>(token.metadataAttributes) || [];

  // If metadata parsing failed but we have metadataAttributes, use those
  const finalAttributes = parsedMetadata?.attributes || parsedAttributes;

  // Clean up metadataName
  const cleanedMetadataName = cleanupMetadataName(token.metadataName) || token.name || 'Unnamed NFT';

  // Create formatted NFT
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
    // Extract common attributes
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

/**
 * Formats an array of ERC721Tokens into FormattedNFTs
 */
export function formatNFTs(tokens: ERC721Token[]): FormattedNFT[] {
  return tokens.map(formatNFT).filter((nft): nft is FormattedNFT => nft !== null);
}

/**
 * Converts felt252 to readable string using Starknet library
 */
export function felt252ToString(felt252: string): string {
  if (!felt252) return '';
  
  // If it's already a readable string (no hex pattern), return as is
  if (!felt252.match(/^0x[0-9a-fA-F]+$/i) && !felt252.match(/^[0-9a-fA-F]+$/i)) {
    return felt252;
  }
  
  try {
    // Ensure the value has '0x' prefix for Starknet library
    const hexValue = felt252.startsWith('0x') ? felt252 : `0x${felt252}`;
    
    // Use Starknet's shortString utilities to decode felt252 to string
    // In Starknet.js, short strings are decoded using the shortString helper
    const decoded = starknet.shortString.decodeShortString(hexValue);
    return decoded || felt252; // Return original if decoding fails or is empty
  } catch {
    return felt252; // Return original if conversion fails
  }
}

/**
 * Truncates wallet address to show first 6 and last 4 characters
 * Example: "0x1234567890abcdef..." -> "0x1234...cdef"
 */
export function truncateAddress(address: string, startLength: number = 6, endLength: number = 4): string {
  if (!address) return '';
  
  if (address.length <= startLength + endLength) {
    return address;
  }
  
  const start = address.slice(0, startLength);
  const end = address.slice(-endLength);
  return `${start}...${end}`;
}

// Auction types
export interface AuctionItem {
  auction_id: string;
  contract_address: string;
  item_index: string;
  token_id: string;
}

export interface AuctionItemNode {
  node: AuctionItem;
}

export interface Auction {
  auction_id: string;
  current_bid: string;
  end_time: string;
  highest_bidder: string;
  item_count: string;
  name: string;
  seller: string;
  starting_price: string;
  status: string;
}

export interface AuctionNode {
  node: Auction;
}

export interface AuctionsResponse {
  bm002AuctionModels: {
    edges: AuctionNode[];
  };
  bm002AuctionItemModels: {
    edges: AuctionItemNode[];
  };
}

export const AUCTIONS_QUERY = gql`
  query MyQuery {
    bm002AuctionItemModels(limit: 1000000, order: {direction: DESC, field: AUCTION_ID}) {
      edges {
        node {
          auction_id
          contract_address
          item_index
          token_id
        }
      }
    }
    bm002AuctionModels(limit: 1000000, order: {direction: DESC, field: AUCTION_ID}) {
      edges {
        node {
          auction_id
          current_bid
          end_time
          highest_bidder
          item_count
          name
          seller
          starting_price
          status
        }
      }
    }
  }
`;

// Backward compatibility function - can be removed once hooks are migrated
export async function fetchAuctions(): Promise<AuctionsResponse> {
  // This is now handled by Apollo Client hooks
  // Keeping for backward compatibility
  throw new Error('Use Apollo Client hooks instead. See useAuctions hook.');
}

// My Listings types
export interface MyListingsResponse {
  bm002AuctionModels: {
    edges: AuctionNode[];
  };
}

export const MY_LISTINGS_QUERY = gql`
  query MyListings($seller: String!) {
    bm002AuctionModels(where: {seller: $seller}, order: {direction: DESC, field: AUCTION_ID}) {
      edges {
        node {
          auction_id
          current_bid
          end_time
          highest_bidder
          item_count
          seller
          name
          starting_price
          status
        }
      }
    }
  }
`;

// Backward compatibility function - can be removed once hooks are migrated
export async function fetchMyListings(seller: string): Promise<MyListingsResponse> {
  // This is now handled by Apollo Client hooks
  // Keeping for backward compatibility
  throw new Error('Use Apollo Client hooks instead. See useMyListings hook.');
}

// Consolidated query that fetches all data at once
export const CONSOLIDATED_QUERY = gql`
  query ConsolidatedQuery($accountAddress: String, $seller: String) {
    myNFTs: tokenBalances(limit: 1000000, accountAddress: $accountAddress) @skip(if: $skipNFTs) {
      edges {
        node {
          tokenMetadata {
            ... on ERC721__Token {
              metadataName
              metadataDescription
              contractAddress
              imagePath
              metadata
              metadataAttributes
              name
              symbol
              tokenId
            }
          }
        }
      }
    }
    auctionItems: bm002AuctionItemModels(limit: 1000000, order: {direction: DESC, field: AUCTION_ID}) {
      edges {
        node {
          auction_id
          contract_address
          item_index
          token_id
        }
      }
    }
    auctions: bm002AuctionModels(limit: 1000000, order: {direction: DESC, field: AUCTION_ID}) {
      edges {
        node {
          auction_id
          current_bid
          end_time
          highest_bidder
          item_count
          name
          seller
          starting_price
          status
        }
      }
    }
    myListings: bm002AuctionModels(where: {seller: $seller}, order: {direction: DESC, field: AUCTION_ID}) @skip(if: $skipListings) {
      edges {
        node {
          auction_id
          current_bid
          end_time
          highest_bidder
          item_count
          seller
          name
          starting_price
          status
        }
      }
    }
  }
`;

// Consolidated query response interface
export interface ConsolidatedDataResponse {
  myNFTs?: {
    tokenBalances: {
      edges: TokenBalanceEdge[];
    };
  };
  auctionItems?: {
    edges: AuctionItemNode[];
  };
  auctions?: {
    edges: AuctionNode[];
  };
  myListings?: {
    edges: AuctionNode[];
  };
}
