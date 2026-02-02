#!/bin/bash

echo "=== Testing OPTIMIZED NFT Query (without metadata/metadataDescription) ==="
echo ""

echo "--- With limit: 500 (new default) ---"
time curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"query":"query MyNFTS($accountAddress: String!) { tokenBalances(limit: 500, accountAddress: $accountAddress) { edges { node { tokenMetadata { ... on ERC721__Token { metadataName contractAddress imagePath metadataAttributes name symbol tokenId } } } } } }", "variables": {"accountAddress": "0x03e9d292a330fcff484b77a4cd2e311341cf49536a02928bcd63d643d313c831"}}' \
  "https://api.cartridge.gg/x/pg-beasts/torii/graphql" -o /tmp/nft-optimized-500.json

echo "Optimized (500): $(wc -c < /tmp/nft-optimized-500.json) bytes"
echo ""

echo "--- Comparison ---"
echo ""
echo "BEFORE optimization (1M limit, all fields):"
echo "  Size: 34,268,920 bytes (32.68 MB)"
echo "  Time: 4 minutes 15 seconds"
echo ""
echo "AFTER optimization (500 limit, essential fields only):"
echo "  Size: $(wc -c < /tmp/nft-optimized-500.json) bytes ($(echo "scale=2; $(wc -c < /tmp/nft-optimized-500.json) / 1048576" | bc) MB)"
echo ""
echo "Reduction: $(echo "scale=1; 100 - ($(wc -c < /tmp/nft-optimized-500.json) * 100 / 34268920)" | bc)%"
