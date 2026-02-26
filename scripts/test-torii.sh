#!/usr/bin/env bash
# Test Torii SQL and (optionally) GraphQL for adventurer data.
# Usage: ./scripts/test-torii.sh
# Optional env: TORII_SQL_URL, ADVENTURER_CONTRACT, TEST_ADDRESS, TEST_TOKEN_ID

set -e

TORII_SQL_URL="${TORII_SQL_URL:-https://api.cartridge.gg/x/pg-mainnet-10/torii/sql}"
ADVENTURER_CONTRACT="${ADVENTURER_CONTRACT:-0x036017e69d21d6d8c13e266eabb73ef1f1d02722d86bdcabe5f168f8e549d3cd}"
# Use a known address that may have adventurers, or set TEST_ADDRESS when running
TEST_ADDRESS="${TEST_ADDRESS:-}"
TEST_TOKEN_ID="${TEST_TOKEN_ID:-1}"

BEASTS_GQL="${BEASTS_GQL:-https://api.cartridge.gg/x/pg-mainnet-10/torii/graphql}"

echo "=== Torii debug tests ==="
echo "TORII_SQL_URL=$TORII_SQL_URL"
echo "ADVENTURER_CONTRACT=$ADVENTURER_CONTRACT"
echo "TEST_ADDRESS=${TEST_ADDRESS:-<not set>}"
echo "TEST_TOKEN_ID=$TEST_TOKEN_ID"
echo ""

# 1) Torii SQL: token_attributes for one token (no address needed)
echo "--- 1) Torii SQL: token_attributes for token $TEST_TOKEN_ID ---"
# Token ID in Torii: contract:0x{64-char hex}
if [[ "$TEST_TOKEN_ID" == 0x* ]]; then
  num=$((TEST_TOKEN_ID))
else
  num=$((10#${TEST_TOKEN_ID}))
fi
TOKEN_HEX=$(printf "%064x" "$num")
TOKEN_FULL="${ADVENTURER_CONTRACT}:0x${TOKEN_HEX}"
QUERY_ATTR="SELECT trait_name, trait_value FROM token_attributes WHERE token_id = '${TOKEN_FULL}' LIMIT 20"
if response=$(curl -s -G "$TORII_SQL_URL" --data-urlencode "query=$QUERY_ATTR"); then
  if echo "$response" | head -1 | grep -q '^\['; then
    count=$(echo "$response" | jq -r 'length' 2>/dev/null || echo "?")
    echo "OK (array of attributes, count=$count)"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
  else
    echo "Response (may be error):"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
  fi
else
  echo "FAIL: curl failed"
fi
echo ""

# 2) Torii SQL: token_balances for an address (optional)
if [ -n "$TEST_ADDRESS" ]; then
  echo "--- 2) Torii SQL: token_balances for address ---"
  ADDR_LOWER=$(echo "$TEST_ADDRESS" | tr '[:upper:]' '[:lower:]')
  QUERY_BAL="SELECT token_id, contract_address FROM token_balances WHERE LOWER(account_address) = '${ADDR_LOWER}' AND contract_address = '${ADVENTURER_CONTRACT}' LIMIT 10"
  if response=$(curl -s -G "$TORII_SQL_URL" --data-urlencode "query=$QUERY_BAL"); then
    if echo "$response" | head -1 | grep -q '^\['; then
      count=$(echo "$response" | jq -r 'length' 2>/dev/null || echo "?")
      echo "OK (array of balances, count=$count)"
      echo "$response" | jq '.' 2>/dev/null || echo "$response"
    else
      echo "Response:"
      echo "$response" | jq '.' 2>/dev/null || echo "$response"
    fi
  else
    echo "FAIL: curl failed"
  fi
  echo ""
else
  echo "--- 2) Torii SQL: token_balances --- skipped (set TEST_ADDRESS to test)"
  echo ""
fi

# 3) Local API route: adventurer-attributes (requires Next.js server)
echo "--- 3) Local API: /api/adventurer-attributes/[tokenId] ---"
BASE_URL="${BASE_URL:-http://localhost:3000}"
if response=$(curl -s "${BASE_URL}/api/adventurer-attributes/${TEST_TOKEN_ID}" 2>/dev/null); then
  if echo "$response" | jq -e '.attributes' >/dev/null 2>&1; then
    count=$(echo "$response" | jq -r '.attributes | length')
    echo "OK (attributes count=$count)"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
  else
    echo "Response (server may be down or error):"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
  fi
else
  echo "SKIP: curl failed (is the app running at $BASE_URL?)"
fi
echo ""

# 4) GraphQL: tokenBalances (optional, needs TEST_ADDRESS)
if [ -n "$TEST_ADDRESS" ]; then
  echo "--- 4) Torii GraphQL: tokenBalances (pg-mainnet-10) ---"
  GQL_QUERY='{"query":"query MyNFTS($accountAddress: String!) { tokenBalances(limit: 5, accountAddress: $accountAddress) { edges { node { tokenMetadata { ... on ERC721__Token { metadataName contractAddress tokenId } } } } } }","variables":{"accountAddress":"'"$TEST_ADDRESS"'"}}'
  if response=$(curl -s -X POST "$BEASTS_GQL" -H "Content-Type: application/json" -d "$GQL_QUERY"); then
    if echo "$response" | jq -e '.data.tokenBalances' >/dev/null 2>&1; then
      echo "OK"
      echo "$response" | jq '.' 2>/dev/null || echo "$response"
    else
      echo "Response (may have errors):"
      echo "$response" | jq '.' 2>/dev/null || echo "$response"
    fi
  else
    echo "FAIL: curl failed"
  fi
  echo ""
else
  echo "--- 4) Torii GraphQL: tokenBalances --- skipped (set TEST_ADDRESS to test)"
  echo ""
fi

echo "=== Done. See docs/TORII_DEBUG.md for full reference. ==="
