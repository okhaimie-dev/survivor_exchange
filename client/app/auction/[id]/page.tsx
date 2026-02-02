import { Metadata } from "next";
import { redirect } from "next/navigation";

const MARKETPLACE_GRAPHQL_ENDPOINT =
  "https://api.cartridge.gg/x/lax/torii/graphql";

interface AuctionData {
  auction_id: string;
  name: string;
  current_bid: string;
  starting_price: string;
  status: string;
  item_count: string;
}

async function fetchAuctionData(
  auctionId: string,
): Promise<AuctionData | null> {
  const auctionIdInt = parseInt(auctionId, 10);
  if (isNaN(auctionIdInt)) return null;

  const query = `
    query GetAuction {
      bm021AuctionModels(where: { auction_id: ${auctionIdInt} }, limit: 1) {
        edges {
          node {
            auction_id
            name
            current_bid
            starting_price
            status
            item_count
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(MARKETPLACE_GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
      next: { revalidate: 60 }, // Cache for 60 seconds
    });

    const data = await response.json();
    return data?.data?.bm021AuctionModels?.edges?.[0]?.node || null;
  } catch {
    return null;
  }
}

function formatPrice(value: string | number, decimals: number = 6): string {
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(numValue) || numValue === 0) return "$0.00";
  const converted = numValue / Math.pow(10, decimals);
  if (converted >= 1000000) {
    return `$${(converted / 1000000).toFixed(2)}M`;
  } else if (converted >= 1000) {
    return `$${(converted / 1000).toFixed(2)}K`;
  } else {
    return `$${converted.toFixed(2)}`;
  }
}

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const auction = await fetchAuctionData(id);

  if (!auction) {
    return {
      title: "Auction Not Found - Survivor Exchange",
      description: "This auction could not be found.",
    };
  }

  const currentBid = parseFloat(auction.current_bid);
  const price = currentBid > 0 ? auction.current_bid : auction.starting_price;
  const priceLabel = currentBid > 0 ? "Current Bid" : "Starting Price";
  const itemCount = parseInt(auction.item_count);
  const bundleText =
    itemCount > 1 ? `Bundle of ${itemCount} Beasts` : "Beast Auction";

  const title = `${auction.name} - Survivor Exchange`;
  const description = `${bundleText} | ${priceLabel}: ${formatPrice(price)}`;
  const ogImageUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "https://survivor.exchange"}/api/og/auction/${id}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "Survivor Exchange",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: auction.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function AuctionPage({ params }: Props) {
  const { id } = await params;

  // Redirect to home page with auction ID as query param
  // The main app will handle selecting the auction
  redirect(`/?auction=${id}`);
}
