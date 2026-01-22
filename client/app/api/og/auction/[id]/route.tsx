import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

const MARKETPLACE_GRAPHQL_ENDPOINT = "https://api.cartridge.gg/x/bm/torii/graphql";
const BEASTS_GRAPHQL_ENDPOINT = "https://api.cartridge.gg/x/pg-beasts/torii/graphql";

interface AuctionData {
  auction_id: string;
  name: string;
  current_bid: string;
  starting_price: string;
  end_time: string;
  status: string;
  item_count: string;
  fee_token: string;
  seller: string;
}

interface AuctionItem {
  token_id: string;
  contract_address: string;
}

interface NFTMetadata {
  imagePath: string;
  metadataName: string;
  metadata: string;
}

async function fetchAuctionData(auctionId: string): Promise<{ auction: AuctionData | null; items: AuctionItem[] }> {
  const auctionIdInt = parseInt(auctionId, 10);

  const query = `
    query GetAuction {
      bm019AuctionModels(where: { auction_id: ${auctionIdInt} }, limit: 1) {
        edges {
          node {
            auction_id
            name
            current_bid
            starting_price
            end_time
            status
            item_count
            fee_token
            seller
          }
        }
      }
      bm019AuctionItemModels(where: { auction_id: ${auctionIdInt} }, limit: 10) {
        edges {
          node {
            token_id
            contract_address
          }
        }
      }
    }
  `;

  const response = await fetch(MARKETPLACE_GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });

  const data = await response.json();

  const auction = data?.data?.bm019AuctionModels?.edges?.[0]?.node || null;
  const items = data?.data?.bm019AuctionItemModels?.edges?.map((e: { node: AuctionItem }) => e.node) || [];

  return { auction, items };
}

// Convert token ID to normalized decimal string for comparison
function normalizeTokenId(tokenId: string | number): string {
  const str = String(tokenId);
  if (str.startsWith('0x') || str.startsWith('0X')) {
    return BigInt(str).toString();
  }
  return str;
}

async function fetchNFTMetadata(sellerAddress: string, tokenIds: string[]): Promise<NFTMetadata[]> {
  if (tokenIds.length === 0 || !sellerAddress) return [];

  const query = `
    query GetSellerNFTs {
      tokenBalances(limit: 500, accountAddress: "${sellerAddress}") {
        edges {
          node {
            tokenMetadata {
              ... on ERC721__Token {
                imagePath
                metadataName
                metadata
                tokenId
              }
            }
          }
        }
      }
    }
  `;

  try {
    // Use Beasts endpoint for NFT metadata (not marketplace endpoint)
    const response = await fetch(BEASTS_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    const data = await response.json();
    const allNFTs = data?.data?.tokenBalances?.edges
      ?.map((e: { node: { tokenMetadata: NFTMetadata & { tokenId: string } } }) => e.node.tokenMetadata)
      .filter(Boolean) || [];

    // Normalize token IDs for comparison (auction items use decimal, beasts use hex)
    const tokenIdSet = new Set(tokenIds.map(id => normalizeTokenId(id)));
    return allNFTs.filter((nft: NFTMetadata & { tokenId: string }) => tokenIdSet.has(normalizeTokenId(nft.tokenId)));
  } catch {
    return [];
  }
}

// Parse value that might be hex or decimal string
function parseValue(value: string | number): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const str = String(value);
  if (str.startsWith('0x') || str.startsWith('0X')) {
    return parseInt(str, 16);
  }
  return parseFloat(str) || 0;
}

function formatPrice(value: string | number, decimals: number = 6): string {
  const numValue = parseValue(value);
  if (isNaN(numValue) || numValue === 0) return "$0.00";

  // Convert from smallest unit (assuming 6 decimals for USDC)
  const converted = numValue / Math.pow(10, decimals);

  if (converted >= 1000000) {
    return `$${(converted / 1000000).toFixed(2)}M`;
  } else if (converted >= 1000) {
    return `$${(converted / 1000).toFixed(2)}K`;
  } else {
    return `$${converted.toFixed(2)}`;
  }
}

function formatTimeRemaining(endTime: string): string {
  const end = parseInt(endTime) * 1000;
  const now = Date.now();
  const diff = end - now;

  if (diff <= 0) return "Ended";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h left`;
  }

  return `${hours}h ${minutes}m left`;
}

function getStatusColor(status: string): string {
  switch (status) {
    case '2': return '#32FF34'; // Active - green
    case '1': return '#FFD700'; // Pending - gold
    case '3': return '#888888'; // Ended - gray
    default: return '#32FF34';
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case '2': return 'ACTIVE';
    case '1': return 'PENDING';
    case '3': return 'ENDED';
    default: return 'ACTIVE';
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: auctionId } = await params;

    const { auction, items } = await fetchAuctionData(auctionId);

    if (!auction) {
      return new Response('Auction not found', { status: 404 });
    }

    // Fetch NFT metadata for items using the seller's address
    const tokenIds = items.map(item => item.token_id);
    const nfts = await fetchNFTMetadata(auction.seller, tokenIds);

    // Get price - use current_bid if available, otherwise starting_price (reserve)
    const currentBid = parseValue(auction.current_bid);
    const startingPrice = parseValue(auction.starting_price);
    const price = currentBid > 0 ? currentBid : startingPrice;
    const priceLabel = currentBid > 0 ? 'Current Bid' : 'Reserve Price';

    // Get main beast image from metadata
    let mainImage: string | null = null;
    const auctionName = auction.name; // Use auction name, not beast name
    const additionalCount = parseInt(auction.item_count) - 1;

    if (nfts[0]?.metadata) {
      try {
        const metadata = JSON.parse(nfts[0].metadata);
        // The image is an SVG with an embedded PNG inside foreignObject
        // Extract the PNG data URL from the SVG
        if (metadata.image && metadata.image.startsWith('data:image/svg+xml;base64,')) {
          const svgBase64 = metadata.image.replace('data:image/svg+xml;base64,', '');
          const svgContent = atob(svgBase64);
          // Extract the PNG data URL from the SVG
          const pngMatch = svgContent.match(/src='(data:image\/png;base64,[^']+)'/);
          if (pngMatch && pngMatch[1]) {
            mainImage = pngMatch[1];
          }
        }
      } catch {
        // Continue with no image
      }
    }

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '1200px',
            height: '630px',
            background: 'linear-gradient(135deg, #000000 0%, #0a1f0a 50%, #000000 100%)',
            padding: '40px',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          {/* Header with branding */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #32FF34, #1a8f1c)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <span style={{ fontSize: '24px', color: '#000' }}>S</span>
              </div>
              <span style={{ fontSize: '28px', color: '#32FF34', fontWeight: 'bold', letterSpacing: '0.1em' }}>
                SURVIVOR EXCHANGE
              </span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 16px',
              borderRadius: '20px',
              background: `${getStatusColor(auction.status)}20`,
              border: `2px solid ${getStatusColor(auction.status)}`,
            }}>
              <span style={{ fontSize: '16px', color: getStatusColor(auction.status), fontWeight: 'bold', letterSpacing: '0.15em' }}>
                {getStatusText(auction.status)}
              </span>
            </div>
          </div>

          {/* Main content */}
          <div style={{ display: 'flex', flex: 1, gap: '40px' }}>
            {/* Beast image section */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '450px',
              height: '400px',
              borderRadius: '24px',
              background: 'rgba(50, 255, 52, 0.05)',
              border: '2px solid rgba(50, 255, 52, 0.2)',
            }}>
              {mainImage ? (
                <img
                  src={mainImage}
                  width={320}
                  height={320}
                  style={{
                    display: 'flex',
                    borderRadius: '16px',
                  }}
                />
              ) : (
                <div style={{
                  display: 'flex',
                  width: '350px',
                  height: '350px',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(50, 255, 52, 0.1)',
                  borderRadius: '16px',
                }}>
                  <span style={{ fontSize: '48px', color: '#32FF34' }}>?</span>
                </div>
              )}
              {additionalCount > 0 && (
                <div style={{
                  display: 'flex',
                  marginTop: '10px',
                  padding: '8px 16px',
                  borderRadius: '12px',
                  background: 'rgba(0, 0, 0, 0.8)',
                  border: '1px solid rgba(50, 255, 52, 0.4)',
                }}>
                  <span style={{ fontSize: '18px', color: '#baFFbc' }}>
                    +{additionalCount} more
                  </span>
                </div>
              )}
            </div>

            {/* Info section */}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center', gap: '24px' }}>
              {/* Beast name */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '18px', color: 'rgba(186, 255, 188, 0.6)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                  {additionalCount > 0 ? `Bundle of ${parseInt(auction.item_count)} Beasts` : 'Beast Auction'}
                </span>
                <span style={{ fontSize: '48px', color: '#ffffff', fontWeight: 'bold', lineHeight: '1.1' }}>
                  {auctionName.length > 25 ? auctionName.slice(0, 25) + '...' : auctionName}
                </span>
              </div>

              {/* Price */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '24px',
                borderRadius: '16px',
                background: 'rgba(50, 255, 52, 0.08)',
                border: '1px solid rgba(50, 255, 52, 0.2)',
              }}>
                <span style={{ fontSize: '14px', color: 'rgba(186, 255, 188, 0.6)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                  {priceLabel}
                </span>
                <span style={{ fontSize: '56px', color: '#32FF34', fontWeight: 'bold' }}>
                  {formatPrice(price)}
                </span>
              </div>

              {/* Time remaining */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px', color: 'rgba(186, 255, 188, 0.8)' }}>
                  {formatTimeRemaining(auction.end_time)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: '20px',
            paddingTop: '20px',
            borderTop: '1px solid rgba(50, 255, 52, 0.15)',
          }}>
            <span style={{ fontSize: '16px', color: 'rgba(186, 255, 188, 0.5)', letterSpacing: '0.1em' }}>
              survivor.exchange
            </span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('OG Image generation error:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
}
