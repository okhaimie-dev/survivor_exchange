/**
 * Survivor Exchange Auction Notifier
 *
 * Monitors Torii for auction events and posts to Discord/Twitter
 *
 * Events tracked:
 * - New auctions created
 * - New bids placed
 * - Auctions ending soon (1 hour warning)
 * - Auctions ended
 */

import fetch from "node-fetch";
import { TwitterApi } from "twitter-api-v2";
import "dotenv/config";

// Configuration
const CONFIG = {
  toriiUrl:
    process.env.TORII_URL ||
    "https://api.cartridge.gg/x/survivor-exchange/torii/graphql",
  discordWebhook: process.env.DISCORD_WEBHOOK_URL,
  pollInterval: parseInt(process.env.POLL_INTERVAL) || 300000, // 5 minutes
  siteUrl: process.env.SITE_URL || "https://survivor.exchange",
  enableTwitter: !!(
    process.env.TWITTER_API_KEY && process.env.TWITTER_ACCESS_TOKEN
  ),
  enableDiscord: !!process.env.DISCORD_WEBHOOK_URL,
};

// Twitter client (optional)
let twitterClient = null;
if (CONFIG.enableTwitter) {
  twitterClient = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY,
    appSecret: process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_SECRET,
  });
}

// Track what we've already notified about
const notifiedAuctions = new Set();
const notifiedBids = new Map(); // auctionId -> lastBidCount
const notifiedEndingSoon = new Set();

// GraphQL query to fetch active auctions
const AUCTIONS_QUERY = `
  query GetAuctions {
    bmZeroOneNineAuctionModels(
      where: { status: 2 }
      order: { direction: DESC, field: AUCTION_ID }
      limit: 50
    ) {
      edges {
        node {
          entity {
            keys
            models {
              ... on bm_0_2_1_Auction {
                auction_id
                name
                starting_price
                highest_bid
                highest_bidder
                seller
                end_time
                status
                item_count
              }
            }
          }
        }
      }
    }
  }
`;

/**
 * Fetch auctions from Torii
 */
async function fetchAuctions() {
  try {
    const response = await fetch(CONFIG.toriiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: AUCTIONS_QUERY }),
    });

    const data = await response.json();

    if (data.errors) {
      console.error("GraphQL errors:", data.errors);
      return [];
    }

    const edges = data?.data?.bmZeroOneNineAuctionModels?.edges || [];
    return edges
      .map((edge) => {
        const models = edge.node?.entity?.models || [];
        const auction = models.find((m) => m.auction_id !== undefined);
        return auction;
      })
      .filter(Boolean);
  } catch (error) {
    console.error("Error fetching auctions:", error);
    return [];
  }
}

/**
 * Format price from raw value to USD string
 */
function formatPrice(rawPrice) {
  if (!rawPrice) return "$0.00";
  const price = parseInt(rawPrice) / 1e6; // Assuming USDC with 6 decimals
  return `$${price.toFixed(2)}`;
}

/**
 * Get time remaining string
 */
function getTimeRemaining(endTime) {
  const now = Math.floor(Date.now() / 1000);
  const end = parseInt(endTime);
  const diff = end - now;

  if (diff <= 0) return "Ended";

  const hours = Math.floor(diff / 3600);
  const minutes = Math.floor((diff % 3600) / 60);

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  return `${hours}h ${minutes}m`;
}

/**
 * Check if auction is ending soon (within 1 hour)
 */
function isEndingSoon(endTime) {
  const now = Math.floor(Date.now() / 1000);
  const end = parseInt(endTime);
  const diff = end - now;
  return diff > 0 && diff <= 3600; // Within 1 hour
}

/**
 * Post to Discord webhook
 */
async function postToDiscord(content, embed = null) {
  if (!CONFIG.enableDiscord) return;

  try {
    const body = { content };
    if (embed) {
      body.embeds = [embed];
    }

    await fetch(CONFIG.discordWebhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    console.log("Posted to Discord:", content.substring(0, 50) + "...");
  } catch (error) {
    console.error("Error posting to Discord:", error);
  }
}

/**
 * Post to Twitter
 */
async function postToTwitter(text) {
  if (!CONFIG.enableTwitter || !twitterClient) return;

  try {
    await twitterClient.v2.tweet(text);
    console.log("Posted to Twitter:", text.substring(0, 50) + "...");
  } catch (error) {
    console.error("Error posting to Twitter:", error);
  }
}

/**
 * Notify about a new auction
 */
async function notifyNewAuction(auction) {
  const auctionId = auction.auction_id;
  if (notifiedAuctions.has(auctionId)) return;

  notifiedAuctions.add(auctionId);

  const name = auction.name || `Auction #${auctionId}`;
  const price = formatPrice(auction.starting_price);
  const itemCount = auction.item_count || 1;
  const timeLeft = getTimeRemaining(auction.end_time);

  // Discord message
  const discordEmbed = {
    title: `🆕 New Auction: ${name}`,
    color: 0x32ff34, // Green
    fields: [
      { name: "Reserve Price", value: price, inline: true },
      {
        name: "Items",
        value: `${itemCount} beast${itemCount > 1 ? "s" : ""}`,
        inline: true,
      },
      { name: "Ends In", value: timeLeft, inline: true },
    ],
    url: `${CONFIG.siteUrl}/?auction=${auctionId}`,
    timestamp: new Date().toISOString(),
  };

  await postToDiscord(`📢 New auction listed!`, discordEmbed);

  // Twitter message
  const tweet = `🆕 New Auction on Survivor Exchange!

"${name}"
💰 Reserve: ${price}
🎴 ${itemCount} beast${itemCount > 1 ? "s" : ""}
⏰ ${timeLeft} left

Hunt yours 👇
${CONFIG.siteUrl}/?auction=${auctionId}

#LootSurvivor #Starknet`;

  await postToTwitter(tweet);
}

/**
 * Notify about a new bid
 */
async function notifyNewBid(auction) {
  const auctionId = auction.auction_id;
  const currentBid = auction.highest_bid;

  // Skip if no bid or same bid we already notified about
  if (!currentBid || currentBid === "0" || currentBid === "0x0") return;

  const lastBid = notifiedBids.get(auctionId);
  if (lastBid === currentBid) return;

  notifiedBids.set(auctionId, currentBid);

  // Skip first time we see this auction (don't notify on startup)
  if (lastBid === undefined) return;

  const name = auction.name || `Auction #${auctionId}`;
  const bidAmount = formatPrice(currentBid);
  const timeLeft = getTimeRemaining(auction.end_time);

  // Discord message
  const discordEmbed = {
    title: `🔥 New Bid: ${name}`,
    color: 0xff6b35, // Orange
    fields: [
      { name: "Bid Amount", value: bidAmount, inline: true },
      { name: "Time Left", value: timeLeft, inline: true },
    ],
    url: `${CONFIG.siteUrl}/?auction=${auctionId}`,
    timestamp: new Date().toISOString(),
  };

  await postToDiscord(`🔥 Bid placed!`, discordEmbed);

  // Twitter message (less frequent - only for significant bids)
  const bidValue = parseInt(currentBid) / 1e6;
  if (bidValue >= 50) {
    // Only tweet bids >= $50
    const tweet = `🔥 Bid Alert!

"${name}" just got a ${bidAmount} bid!
⏰ ${timeLeft} left

Will you outbid?
${CONFIG.siteUrl}/?auction=${auctionId}

#LootSurvivor #Starknet`;

    await postToTwitter(tweet);
  }
}

/**
 * Notify about auction ending soon
 */
async function notifyEndingSoon(auction) {
  const auctionId = auction.auction_id;
  if (notifiedEndingSoon.has(auctionId)) return;
  if (!isEndingSoon(auction.end_time)) return;

  notifiedEndingSoon.add(auctionId);

  const name = auction.name || `Auction #${auctionId}`;
  const currentBid =
    auction.highest_bid && auction.highest_bid !== "0"
      ? formatPrice(auction.highest_bid)
      : "No bids yet!";
  const timeLeft = getTimeRemaining(auction.end_time);

  // Discord message
  const discordEmbed = {
    title: `⏰ Ending Soon: ${name}`,
    color: 0xffd700, // Gold
    fields: [
      { name: "Current Bid", value: currentBid, inline: true },
      { name: "Time Left", value: timeLeft, inline: true },
    ],
    url: `${CONFIG.siteUrl}/?auction=${auctionId}`,
    timestamp: new Date().toISOString(),
  };

  await postToDiscord(`⏰ Auction ending soon!`, discordEmbed);

  // Twitter message
  const tweet = `⏰ ENDING SOON!

"${name}"
💰 Current: ${currentBid}
⏰ Only ${timeLeft} left!

Last chance 👇
${CONFIG.siteUrl}/?auction=${auctionId}

#LootSurvivor #Starknet`;

  await postToTwitter(tweet);
}

/**
 * Main polling loop
 */
async function poll() {
  console.log(`[${new Date().toISOString()}] Polling for updates...`);

  const auctions = await fetchAuctions();
  console.log(`Found ${auctions.length} active auctions`);

  for (const auction of auctions) {
    await notifyNewAuction(auction);
    await notifyNewBid(auction);
    await notifyEndingSoon(auction);
  }
}

/**
 * Start the notifier
 */
async function main() {
  console.log("🚀 Survivor Exchange Notifier Starting...");
  console.log(`Discord: ${CONFIG.enableDiscord ? "Enabled" : "Disabled"}`);
  console.log(`Twitter: ${CONFIG.enableTwitter ? "Enabled" : "Disabled"}`);
  console.log(`Poll Interval: ${CONFIG.pollInterval / 1000}s`);
  console.log("");

  // Initial poll
  await poll();

  // Set up recurring poll
  setInterval(poll, CONFIG.pollInterval);

  console.log("✅ Notifier running. Press Ctrl+C to stop.");
}

main().catch(console.error);
