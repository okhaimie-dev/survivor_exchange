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

