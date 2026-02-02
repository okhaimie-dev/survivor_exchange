# Survivor Exchange Auction Notifier

Auto-post auction events to Discord and Twitter.

## What It Does

- **New Auctions**: Posts when someone lists a new auction
- **New Bids**: Posts when bids are placed (Discord all, Twitter only $50+)
- **Ending Soon**: Posts 1-hour warning for auctions about to end

## Quick Setup

### 1. Discord Webhook (Easy - 2 minutes)

1. Go to your Discord server
2. Server Settings → Integrations → Webhooks → New Webhook
3. Name it "Survivor Exchange" and pick a channel
4. Copy the webhook URL

### 2. Twitter API (Optional - 10 minutes)

1. Go to [developer.twitter.com](https://developer.twitter.com)
2. Create a project and app
3. Get your API keys and Access tokens (with Read and Write permissions)

### 3. Configure & Run

```bash
cd scripts/auction-notifier

# Install dependencies
npm install

# Copy and edit config
cp .env.example .env
# Edit .env with your webhook URL and Twitter keys

# Run
npm start
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DISCORD_WEBHOOK_URL` | Recommended | Discord webhook URL |
| `TWITTER_API_KEY` | Optional | Twitter API key |
| `TWITTER_API_SECRET` | Optional | Twitter API secret |
| `TWITTER_ACCESS_TOKEN` | Optional | Twitter access token |
| `TWITTER_ACCESS_SECRET` | Optional | Twitter access secret |
| `TORII_URL` | Optional | Torii GraphQL endpoint (default: your deployment) |
| `POLL_INTERVAL` | Optional | Milliseconds between checks (default: 300000 = 5min) |
| `SITE_URL` | Optional | Your site URL for links |

## Running in Production

### Option 1: Run on Your Server

```bash
# Using PM2 (recommended)
npm install -g pm2
pm2 start index.js --name "auction-notifier"
pm2 save
pm2 startup  # Follow instructions to auto-start on reboot
```

### Option 2: Free Hosting on Railway/Render

1. Push this folder to a GitHub repo
2. Connect to [Railway](https://railway.app) or [Render](https://render.com)
3. Add environment variables in their dashboard
4. Deploy - they'll keep it running 24/7

### Option 3: Run Locally

Just keep a terminal open with `npm start`. Simple but not always-on.

## Customization

### Change Tweet Threshold

In `index.js`, find this line to change when tweets are sent:

```javascript
if (bidValue >= 50) { // Only tweet bids >= $50
```

### Change Poll Interval

Set `POLL_INTERVAL` in `.env` (in milliseconds):
- 60000 = 1 minute
- 300000 = 5 minutes (default)
- 600000 = 10 minutes

### Add More Notifications

The `poll()` function is where you can add more notification types. Ideas:
- Auction settled notifications
- Price threshold alerts
- Daily summary

## Example Output

### Discord
```
📢 New auction listed!
[Embed with auction details, price, items, time left]
```

### Twitter
```
🆕 New Auction on Survivor Exchange!

"Shiny Bozos"
💰 Reserve: $70.00
🎴 8 beasts
⏰ 1d 2h left

Hunt yours 👇
https://survivor.exchange/?auction=123

#LootSurvivor #Starknet
```

## Troubleshooting

**"Error posting to Twitter"**
- Check your API keys have Read and Write permissions
- Make sure you've completed Twitter's developer verification

**"Error posting to Discord"**
- Verify webhook URL is correct
- Check the webhook hasn't been deleted

**"0 active auctions found"**
- Verify TORII_URL is correct
- Check the Torii service is running

## Cost

- **Discord**: Free
- **Twitter API**: Free tier allows 1,500 tweets/month (plenty for this use case)
- **Hosting**: Free on Railway/Render free tier
