#!/bin/bash

echo "=== Testing Auction Query with limit: 100 ==="
time curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"query":"query { bm011AuctionModels(limit: 100) { edges { node { auction_id name status } } } }"}' \
  "https://api.cartridge.gg/x/bm/torii/graphql" -o /tmp/auction-100.json

echo "Size: $(wc -c < /tmp/auction-100.json) bytes"
echo ""

echo "=== Testing Auction Query with limit: 1000000 ==="
time curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"query":"query { bm011AuctionModels(limit: 1000000) { edges { node { auction_id name status } } } }"}' \
  "https://api.cartridge.gg/x/bm/torii/graphql" -o /tmp/auction-1m.json

echo "Size: $(wc -c < /tmp/auction-1m.json) bytes"
echo ""

echo "=== Testing NFT Query with limit: 100 ==="
time curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"query":"query { tokenBalances(limit: 100, accountAddress: \"0x03e9d292a330fcff484b77a4cd2e311341cf49536a02928bcd63d643d313c831\") { edges { node { tokenMetadata { ... on ERC721__Token { tokenId contractAddress metadataName } } } } } }"}' \
  "https://api.cartridge.gg/x/pg-beasts/torii/graphql" -o /tmp/nft-100.json

echo "Size: $(wc -c < /tmp/nft-100.json) bytes"
echo ""

echo "=== Testing NFT Query with limit: 1000000 ==="
time curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"query":"query { tokenBalances(limit: 1000000, accountAddress: \"0x03e9d292a330fcff484b77a4cd2e311341cf49536a02928bcd63d643d313c831\") { edges { node { tokenMetadata { ... on ERC721__Token { tokenId contractAddress metadataName } } } } } }"}' \
  "https://api.cartridge.gg/x/pg-beasts/torii/graphql" -o /tmp/nft-1m.json

echo "Size: $(wc -c < /tmp/nft-1m.json) bytes"
echo ""

echo "=== Summary ==="
echo "Auction (100):     $(wc -c < /tmp/auction-100.json) bytes"
echo "Auction (1M):      $(wc -c < /tmp/auction-1m.json) bytes"
echo "NFT (100):         $(wc -c < /tmp/nft-100.json) bytes"
echo "NFT (1M):          $(wc -c < /tmp/nft-1m.json) bytes"
