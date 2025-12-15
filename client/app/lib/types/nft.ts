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

