import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

// Background style options
type BackgroundStyle = 'gradient' | 'mesh';
const BACKGROUND_STYLE: BackgroundStyle = 'gradient';

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
    const response = await fetch(BEASTS_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    const data = await response.json();
    const allNFTs = data?.data?.tokenBalances?.edges
      ?.map((e: { node: { tokenMetadata: NFTMetadata & { tokenId: string } } }) => e.node.tokenMetadata)
      .filter(Boolean) || [];

    const tokenIdSet = new Set(tokenIds.map(id => normalizeTokenId(id)));
    return allNFTs.filter((nft: NFTMetadata & { tokenId: string }) => tokenIdSet.has(normalizeTokenId(nft.tokenId)));
  } catch {
    return [];
  }
}

function parseValue(value: string | number): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const str = String(value);
  if (str.startsWith('0x') || str.startsWith('0X')) {
    return parseInt(str, 16);
  }
  return parseFloat(str) || 0;
}

function formatPrice(value: number, decimals: number = 6): string {
  if (isNaN(value) || value === 0) return "$0.00";
  const converted = value / Math.pow(10, decimals);
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

    const tokenIds = items.map(item => item.token_id);
    const nfts = await fetchNFTMetadata(auction.seller, tokenIds);

    const currentBid = parseValue(auction.current_bid);
    const startingPrice = parseValue(auction.starting_price);
    const price = currentBid > 0 ? currentBid : startingPrice;
    const priceLabel = currentBid > 0 ? 'CURRENT BID' : 'RESERVE PRICE';

    let mainImage: string | null = null;
    const auctionName = auction.name;
    const additionalCount = parseInt(auction.item_count) - 1;

    if (nfts[0]?.metadata) {
      try {
        const metadata = JSON.parse(nfts[0].metadata);
        if (metadata.image && metadata.image.startsWith('data:image/svg+xml;base64,')) {
          const svgBase64 = metadata.image.replace('data:image/svg+xml;base64,', '');
          const svgContent = atob(svgBase64);
          const pngMatch = svgContent.match(/src='(data:image\/png;base64,[^']+)'/);
          if (pngMatch && pngMatch[1]) {
            mainImage = pngMatch[1];
          }
        }
      } catch {
        // Continue with no image
      }
    }

    const statusText = getStatusText(auction.status);
    const isEnded = auction.status === '3' || formatTimeRemaining(auction.end_time) === 'Ended';
    const timeText = formatTimeRemaining(auction.end_time);

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '1200px',
            height: '630px',
            fontFamily: 'system-ui, sans-serif',
            position: 'relative',
            background: BACKGROUND_STYLE === 'mesh'
              ? 'linear-gradient(135deg, #0a0a0a 0%, #0d1a0d 25%, #1a0a1a 50%, #0a1a1a 75%, #0a0a0a 100%)'
              : 'linear-gradient(135deg, #000000 0%, #0a0a0a 50%, #050505 100%)',
          }}
        >
          {/* Background layers */}
          {BACKGROUND_STYLE === 'gradient' ? (
            <>
              {/* Subtle corner glow - top left */}
              <div style={{
                position: 'absolute',
                top: '-100px',
                left: '-100px',
                width: '500px',
                height: '500px',
                background: 'radial-gradient(circle, rgba(50, 255, 52, 0.15) 0%, rgba(50, 255, 52, 0.05) 30%, transparent 70%)',
                display: 'flex',
              }} />
              {/* Subtle glow - bottom right */}
              <div style={{
                position: 'absolute',
                bottom: '-150px',
                right: '-100px',
                width: '600px',
                height: '600px',
                background: 'radial-gradient(circle, rgba(50, 255, 52, 0.12) 0%, rgba(50, 255, 52, 0.03) 40%, transparent 70%)',
                display: 'flex',
              }} />
              {/* Center subtle glow */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '800px',
                height: '400px',
                transform: 'translate(-50%, -50%)',
                background: 'radial-gradient(ellipse, rgba(50, 255, 52, 0.08) 0%, transparent 60%)',
                display: 'flex',
              }} />
            </>
          ) : (
            <>
              {/* Mesh gradient - multiple overlapping color blobs */}
              {/* Purple blob top right */}
              <div style={{
                position: 'absolute',
                top: '-50px',
                right: '100px',
                width: '500px',
                height: '400px',
                background: 'radial-gradient(circle, rgba(138, 43, 226, 0.25) 0%, rgba(138, 43, 226, 0.1) 30%, transparent 60%)',
                display: 'flex',
              }} />
              {/* Teal blob bottom left */}
              <div style={{
                position: 'absolute',
                bottom: '-100px',
                left: '-50px',
                width: '600px',
                height: '500px',
                background: 'radial-gradient(circle, rgba(0, 200, 150, 0.2) 0%, rgba(0, 150, 100, 0.08) 35%, transparent 65%)',
                display: 'flex',
              }} />
              {/* Green blob center-right */}
              <div style={{
                position: 'absolute',
                top: '200px',
                right: '-100px',
                width: '500px',
                height: '400px',
                background: 'radial-gradient(circle, rgba(50, 255, 52, 0.18) 0%, rgba(50, 255, 52, 0.05) 40%, transparent 70%)',
                display: 'flex',
              }} />
              {/* Deep blue blob top left */}
              <div style={{
                position: 'absolute',
                top: '50px',
                left: '200px',
                width: '400px',
                height: '300px',
                background: 'radial-gradient(circle, rgba(30, 60, 114, 0.3) 0%, rgba(30, 60, 114, 0.1) 40%, transparent 70%)',
                display: 'flex',
              }} />
              {/* Pink accent bottom right */}
              <div style={{
                position: 'absolute',
                bottom: '50px',
                right: '300px',
                width: '350px',
                height: '250px',
                background: 'radial-gradient(circle, rgba(255, 50, 150, 0.12) 0%, transparent 60%)',
                display: 'flex',
              }} />
            </>
          )}

          {/* Content overlay */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              height: '100%',
              padding: '36px 50px',
              position: 'relative',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {/* Logo and brand */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0a2a0b 0%, #001100 100%)',
                  border: '3px solid #32FF34',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 25px rgba(50, 255, 52, 0.6), inset 0 0 15px rgba(50, 255, 52, 0.2)',
                }}>
                  <span style={{ fontSize: '30px', color: '#32FF34', fontWeight: 'bold' }}>S</span>
                </div>
                <span style={{
                  fontSize: '30px',
                  color: '#32FF34',
                  fontWeight: 'bold',
                  letterSpacing: '0.1em',
                  textShadow: '0 0 20px rgba(50, 255, 52, 0.5)',
                }}>
                  SURVIVOR EXCHANGE
                </span>
              </div>

              {/* Status badge */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '14px 32px',
                borderRadius: '30px',
                background: isEnded
                  ? 'linear-gradient(135deg, #2a1a1a 0%, #1a0a0a 100%)'
                  : 'linear-gradient(135deg, #0a2a0b 0%, #001100 100%)',
                border: isEnded ? '3px solid #ff4444' : '3px solid #32FF34',
                boxShadow: isEnded
                  ? '0 0 20px rgba(255, 68, 68, 0.4)'
                  : '0 0 20px rgba(50, 255, 52, 0.5)',
              }}>
                <span style={{
                  fontSize: '18px',
                  color: isEnded ? '#ff4444' : '#32FF34',
                  fontWeight: 'bold',
                  letterSpacing: '0.2em'
                }}>
                  {statusText}
                </span>
              </div>
            </div>

            {/* Main content */}
            <div style={{ display: 'flex', flex: 1, gap: '60px', alignItems: 'center', marginTop: '10px' }}>
              {/* Beast image card */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative',
              }}>
                {/* Outer glow frame */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '5px',
                  borderRadius: '28px',
                  background: 'linear-gradient(135deg, #32FF34 0%, #00cc00 50%, #1a8a1c 100%)',
                  boxShadow: '0 0 60px rgba(50, 255, 52, 0.7), 0 0 100px rgba(50, 255, 52, 0.3), inset 0 0 30px rgba(255,255,255,0.1)',
                }}>
                  {/* Inner dark card */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '360px',
                    height: '360px',
                    borderRadius: '22px',
                    background: 'linear-gradient(180deg, #141414 0%, #000000 100%)',
                    border: '4px solid #0a0a0a',
                    position: 'relative',
                  }}>
                    {mainImage ? (
                      <img
                        src={mainImage}
                        width={320}
                        height={320}
                        style={{
                          display: 'flex',
                        }}
                      />
                    ) : (
                      <div style={{
                        display: 'flex',
                        width: '320px',
                        height: '320px',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(50, 255, 52, 0.03)',
                        borderRadius: '12px',
                      }}>
                        <span style={{ fontSize: '80px', color: '#32FF34' }}>?</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional count badge */}
                {additionalCount > 0 && (
                  <div style={{
                    display: 'flex',
                    marginTop: '-28px',
                    padding: '12px 28px',
                    borderRadius: '24px',
                    background: 'linear-gradient(135deg, #32FF34 0%, #00cc00 100%)',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.5), 0 0 15px rgba(50, 255, 52, 0.4)',
                  }}>
                    <span style={{ fontSize: '20px', color: '#000000', fontWeight: 'bold', letterSpacing: '0.05em' }}>
                      +{additionalCount} more
                    </span>
                  </div>
                )}
              </div>

              {/* Info section */}
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center', gap: '4px' }}>
                {/* Auction type label with underline effect */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '4px' }}>
                  <span style={{
                    fontSize: '18px',
                    color: '#32FF34',
                    letterSpacing: '0.3em',
                    textTransform: 'uppercase',
                    fontWeight: '600',
                    textShadow: '0 0 10px rgba(50, 255, 52, 0.5)',
                  }}>
                    BEAST AUCTION
                  </span>
                  <div style={{
                    display: 'flex',
                    width: '120px',
                    height: '3px',
                    background: 'linear-gradient(90deg, #32FF34 0%, transparent 100%)',
                    borderRadius: '2px',
                  }}></div>
                </div>

                {/* Auction name */}
                <span style={{
                  fontSize: '62px',
                  color: '#ffffff',
                  fontWeight: 'bold',
                  lineHeight: '1.05',
                  textShadow: '0 4px 20px rgba(0,0,0,0.7), 0 0 40px rgba(255,255,255,0.1)',
                  marginBottom: '8px',
                }}>
                  {auctionName.length > 14 ? auctionName.slice(0, 14) + '...' : auctionName}
                </span>

                {/* Price box - THE HERO */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  padding: '24px 36px',
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, rgba(50, 255, 52, 0.2) 0%, rgba(0, 150, 0, 0.15) 50%, rgba(0, 80, 0, 0.25) 100%)',
                  border: '4px solid #32FF34',
                  maxWidth: '480px',
                  boxShadow: '0 0 40px rgba(50, 255, 52, 0.4), inset 0 0 30px rgba(50, 255, 52, 0.1)',
                }}>
                  <span style={{
                    fontSize: '16px',
                    color: '#90EE90',
                    letterSpacing: '0.25em',
                    textTransform: 'uppercase',
                    fontWeight: '700',
                  }}>
                    {priceLabel}
                  </span>
                  <span style={{
                    fontSize: '72px',
                    color: '#32FF34',
                    fontWeight: 'bold',
                    textShadow: '0 0 30px rgba(50, 255, 52, 0.8), 0 0 60px rgba(50, 255, 52, 0.4)',
                    letterSpacing: '-0.02em',
                  }}>
                    {formatPrice(price)}
                  </span>
                </div>

                {/* Time remaining - styled based on status */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginTop: '16px',
                }}>
                  {isEnded ? (
                    <span style={{
                      fontSize: '28px',
                      color: '#ff4444',
                      fontWeight: 'bold',
                      textShadow: '0 0 15px rgba(255, 68, 68, 0.5)',
                      letterSpacing: '0.05em',
                    }}>
                      AUCTION ENDED
                    </span>
                  ) : (
                    <span style={{
                      fontSize: '28px',
                      color: '#ffffff',
                      fontWeight: '600',
                      textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                    }}>
                      {timeText}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: 'auto',
              paddingTop: '12px',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 24px',
                borderRadius: '20px',
                background: 'rgba(50, 255, 52, 0.1)',
                border: '1px solid rgba(50, 255, 52, 0.3)',
              }}>
                <span style={{
                  fontSize: '18px',
                  color: '#32FF34',
                  letterSpacing: '0.15em',
                  fontWeight: '600',
                }}>
                  survivor.exchange
                </span>
              </div>
            </div>
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
