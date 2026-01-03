#!/bin/bash

echo "=== Testing FULL NFT Query (exact app query) with limit: 1000000 ==="
echo "This matches the MyNFTS query from the codebase..."
echo ""

time curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"query":"query MyNFTS($accountAddress: String!) { tokenBalances(limit: 1000000, accountAddress: $accountAddress) { edges { node { tokenMetadata { ... on ERC721__Token { metadataName metadataDescription contractAddress imagePath metadata metadataAttributes name symbol tokenId } } } } } }", "variables": {"accountAddress": "0x03e9d292a330fcff484b77a4cd2e311341cf49536a02928bcd63d643d313c831"}}' \
  "https://api.cartridge.gg/x/pg-beasts/torii/graphql" -o /tmp/nft-full.json

echo ""
echo "Full query size: $(wc -c < /tmp/nft-full.json) bytes"
echo "Full query size: $(echo "scale=2; $(wc -c < /tmp/nft-full.json) / 1048576" | bc) MB"
echo ""

echo "=== First 2000 chars of response ==="
head -c 2000 /tmp/nft-full.json
echo ""
echo ""

echo "=== Counting how many NFTs returned ==="
grep -o '"tokenId"' /tmp/nft-full.json | wc -l
