import { gql } from '@apollo/client';
import * as starknet from 'starknet';

export { gql };

export interface MetadataAttribute {
  trait_type: string;
  value: string | number;
}

export interface ParsedMetadata {
  attributes: MetadataAttribute[];
  description: string;
  image: string;
  name: string;
}

export interface ERC721Token {
  metadataName?: string | null;
  metadataDescription?: string | null;
  contractAddress?: string | null;
  imagePath?: string | null;
  metadata?: string | null;
  metadataAttributes?: string | null;
  name?: string | null;
  symbol?: string | null;
  tokenId?: string | null;
}

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

export async function fetchMyNFTs(_accountAddress: string): Promise<MyNFTsResponse> {
  throw new Error('Use Apollo Client hooks instead. See useMyNFTs hook.');
}

function safeParseJSON<T>(jsonString: string | null | undefined): T | null {
  if (!jsonString) return null;
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    return null;
  }
}

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
  bm006AuctionModels: {
    edges: AuctionNode[];
  };
  bm006AuctionItemModels: {
    edges: AuctionItemNode[];
  };
}

export const AUCTIONS_QUERY = gql`
  query MyQuery {
    bm006AuctionItemModels(limit: 1000000, order: {direction: DESC, field: AUCTION_ID}) {
      edges {
        node {
          auction_id
          contract_address
          item_index
          token_id
        }
      }
    }
    bm006AuctionModels(limit: 1000000, order: {direction: DESC, field: AUCTION_ID}) {
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

export async function fetchAuctions(): Promise<AuctionsResponse> {
  throw new Error('Use Apollo Client hooks instead. See useAuctions hook.');
}

export interface MyListingsResponse {
  bm006AuctionModels: {
    edges: AuctionNode[];
  };
}

export const MY_LISTINGS_QUERY = gql`
  query MyListings($seller: String!) {
    bm006AuctionModels(where: {seller: $seller}, order: {direction: DESC, field: AUCTION_ID}) {
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

export async function fetchMyListings(_seller: string): Promise<MyListingsResponse> {
  throw new Error('Use Apollo Client hooks instead. See useMyListings hook.');
}

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
    auctionItems: bm006AuctionItemModels(limit: 1000000, order: {direction: DESC, field: AUCTION_ID}) {
      edges {
        node {
          auction_id
          contract_address
          item_index
          token_id
        }
      }
    }
    auctions: bm006AuctionModels(limit: 1000000, order: {direction: DESC, field: AUCTION_ID}) {
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
    myListings: bm006AuctionModels(where: {seller: $seller}, order: {direction: DESC, field: AUCTION_ID}) @skip(if: $skipListings) {
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
