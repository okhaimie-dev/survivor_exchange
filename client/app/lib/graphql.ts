import { GraphQLClient, gql } from 'graphql-request';

const GRAPHQL_ENDPOINT = 'https://api.cartridge.gg/x/bm/torii/graphql';

const client = new GraphQLClient(GRAPHQL_ENDPOINT);

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

const MY_NFTS_QUERY = gql`
  query MyNFTS($accountAddress: String!) {
    tokenBalances(accountAddress: $accountAddress) {
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

export async function fetchMyNFTs(accountAddress: string): Promise<MyNFTsResponse> {
  const variables = {
    accountAddress,
  };

  const data = await client.request<MyNFTsResponse>(MY_NFTS_QUERY, variables);
  return data;
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
 * Converts felt252 (hex string) to readable string
 * Removes '0x' prefix and converts hex to ASCII
 */
export function felt252ToString(felt252: string): string {
  if (!felt252) return '';
  
  // If it's already a readable string (no hex pattern), return as is
  if (!felt252.match(/^0x[0-9a-fA-F]+$/i) && !felt252.match(/^[0-9a-fA-F]+$/i)) {
    return felt252;
  }
  
  // Remove '0x' prefix if present
  const hex = felt252.startsWith('0x') ? felt252.slice(2) : felt252;
  
  // Convert hex to string
  try {
    let result = '';
    for (let i = 0; i < hex.length; i += 2) {
      const byte = hex.substr(i, 2);
      if (byte.length < 2) break;
      const charCode = parseInt(byte, 16);
      if (charCode === 0) break; // Stop at null terminator
      result += String.fromCharCode(charCode);
    }
    return result.trim() || felt252; // Return original if conversion results in empty string
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

const AUCTIONS_QUERY = gql`
  query MyQuery {
    bm002AuctionModels {
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
    bm002AuctionItemModels {
      edges {
        node {
          auction_id
          contract_address
          item_index
          token_id
        }
      }
    }
  }
`;

export async function fetchAuctions(): Promise<AuctionsResponse> {
  const data = await client.request<AuctionsResponse>(AUCTIONS_QUERY);
  return data;
}

