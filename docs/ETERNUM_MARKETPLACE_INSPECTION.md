# Eternum Marketplace Torii Inspection & Aggregation Suggestion

## Endpoints

| Purpose | URL |
|--------|-----|
| GraphQL | `https://api.cartridge.gg/x/eternum-marketplace-mainnet19/torii/graphql` |
| SQL | `https://api.cartridge.gg/x/eternum-marketplace-mainnet19/torii/sql` |

---

## Model Summary

### 1. `marketplaceMarketWhitelistModelModels`

Maps **collection_id** (u32) → **collection_address** (ContractAddress). Use this to resolve Adventurers/Beasts and filter orders by collection.

| Field | Type | Purpose |
|-------|------|--------|
| `collection_id` | u32 | Numeric id (7 = Beasts, 8 = Adventurers on Eternum) |
| `collection_address` | ContractAddress | NFT contract address |

**Observed mapping (Eternum mainnet19):**

- **Adventurers**: `collection_id: 8` → `0x36017e69d21d6d8c13e266eabb73ef1f1d02722d86bdcabe5f168f8e549d3cd` (matches `ADVENTURER_NFT_CONTRACT_ADDRESS`)
- **Beasts**: `collection_id: 7` → `0x46da8955829adf2bda310099a0063451923f02e648cf25a1203aac6335cf0e4` (matches `BEASTS_NFT_CONTRACT_ADDRESS`)

So **adventurers and beasts collections are identified by `collection_id` 8 and 7**; events/orders for those collections use these ids.

---

### 2. `marketplaceMarketOrderModelModels`

**Active listings** (fixed-price orders). One row = one order = one token listed.

| Field | Type | Purpose |
|-------|------|--------|
| `order_id` | u64 (hex string) | Unique order id |
| `order.active` | bool | `true` = still listed |
| `order.expiration` | u32 | Unix timestamp |
| `order.token_id` | u16 | NFT token id |
| `order.collection_id` | u16 | Collection (7 = Beasts, 8 = Adventurers) |
| `order.price` | u128 (hex) | Price in fee token units |
| `order.owner` | ContractAddress | Seller |

**Query for active Adventurer/Beast listings:**

- Filter `order.active: true`, optionally `order.collection_id: 7` or `8`, and `order.expiration` > now for non-expired.

---

### 3. `marketplaceMarketTokenOrderModelModels`

Links **token + collection** to **order_id**. Useful when you want `collection_address` directly (e.g. to match `ADVENTURER_NFT_CONTRACT_ADDRESS` / `BEASTS_NFT_CONTRACT_ADDRESS`).

| Field | Type | Purpose |
|-------|------|--------|
| `token_id` | u16 | NFT token id |
| `collection_address` | ContractAddress | NFT contract |
| `order_id` | u64 (hex) | Order this token belongs to |

You can either join orders → whitelist to get `collection_address`, or join orders → token_order to get `collection_address` per order.

---

### 4. `marketplaceMarketOrderEventModels`

**Events** (Created, Edited, etc.) for each order. Use for history/activity; for “current listings” the source of truth is `marketplaceMarketOrderModelModels` with `order.active: true`.

| Field | Type | Purpose |
|-------|------|--------|
| `order_id` | u64 (hex) | Order id |
| `state` | Enum | e.g. "Created", "Edited" |
| `market_order` | nested | Same shape as order (active, token_id, collection_id, price, owner) |

Retrieve for “listed” / “sold” timelines; optional for aggregation.

---

### 5. `marketplaceMarketFeeModelModels`

Global fee config (for display or fee calculation).

| Field | Type |
|-------|------|
| `id` | u32 |
| `fee_recipient` | ContractAddress |
| `fee_token` | ContractAddress |
| `fee_numerator` | u64 (hex) |
| `fee_denominator` | u64 (hex) |

---

### 6. `marketplaceMarketGlobalModelModels`

Global marketplace state (order_count, collection_count, paused, owner). Optional for aggregation.

---

## How to Retrieve Adventurers and Beasts Listings

1. **Whitelist (once or cached)**  
   Query `marketplaceMarketWhitelistModelModels` and build `collection_id → collection_address`. Keep `7` and `8` for Beasts and Adventurers; optionally normalize addresses to match your `BEASTS_NFT_CONTRACT_ADDRESS` / `ADVENTURER_NFT_CONTRACT_ADDRESS`.

2. **Active orders**  
   Query `marketplaceMarketOrderModelModels` with:
   - `where: { order: { active: true } }`
   - `limit` (e.g. 500)
   - Optionally filter by `order.collection_id` in (7, 8) if the schema supports it, or filter in app after fetch.

3. **Optional: token-order**  
   Query `marketplaceMarketTokenOrderModelModels` and join by `order_id` if you prefer to filter by `collection_address` (e.g. only adventurers) instead of `collection_id`.

4. **Events (optional)**  
   Query `marketplaceMarketOrderEventModels` when you need “listed at”, “edited”, “sold” history; not required for the Buy grid.

---

## Aggregation Suggestion: Eternum + Survivor Exchange in Buy Section

### Goal

Show both **Survivor Exchange** (bm021 auctions) and **Eternum** (marketplace orders) in the same Buy section, with Adventurers and Beasts tabs filtering correctly.

### Data Shape Mapping (Eternum → “synthetic auction”)

Your app expects `Auction` + `AuctionItem[]` and `AuctionWithNFTs`. Map each Eternum **order** to one synthetic “auction”:

| Survivor Exchange (Auction) | Eternum source |
|-----------------------------|----------------|
| `auction_id` | `order_id` (stringify hex, e.g. `parseInt(order_id, 16)`) |
| `seller` | `order.owner` (normalize address) |
| `starting_price` | `order.price` (hex u128 → decimal string for your display) |
| `current_bid` | `order.price` (fixed-price, no bid; or "0") |
| `end_time` | `order.expiration` (already Unix) |
| `status` | e.g. `"2"` (active) if `order.active && expiration > now` |
| `fee_token` | From `marketplaceMarketFeeModelModels` (e.g. first row) or constant |
| `item_count` | `"1"` (one token per order) |
| `name` | Optional: e.g. `"Eternum listing"` or leave empty |

| Survivor Exchange (AuctionItem) | Eternum source |
|----------------------------------|----------------|
| `auction_id` | same `order_id` |
| `contract_address` | From whitelist by `order.collection_id` (7 or 8) → `collection_address` |
| `token_id` | `order.token_id` (string) |
| `item_index` | `"0"` |

- **Bids / offers**: Eternum is fixed-price, no auction bids. Use empty arrays `bids: []`, `offers: []`.
- **nfts**: Either leave `nfts: []` and rely on `contract_address` + `token_id` for card display (your grid can build synthetic NFT from that), or call your existing NFT metadata path (e.g. Beasts/Adventurer metadata by contract + token_id) to fill `nfts` for Eternum rows.

### Tagging source

Add a field on each “auction” so the UI and bid logic know the source:

- `source: "survivor_exchange"` for data from `useAuctions()` (current Torii).
- `source: "eternum"` for data from Eternum GraphQL.

Then:

- **Buy section**: Merge `survivorExchangeAuctions` and `eternumSyntheticAuctions` into one list; sort/filter by collection (adventurers vs beasts) as today.
- **Bidding**: For `source === "survivor_exchange"` use existing `AUCTION_CONTRACT_ADDRESS` and `placeBidForAuction`. For `source === "eternum"` either:
  - **Option A**: Hide bid button and show “Buy on Eternum” (link to Eternum app), or  
  - **Option B**: Integrate Eternum’s buy flow (their contract + ABI) and call it when user clicks buy on an Eternum row.

### Implementation Outline

1. **Constants**  
   - `ETERNUM_MARKETPLACE_GRAPHQL = "https://api.cartridge.gg/x/eternum-marketplace-mainnet19/torii/graphql"`  
   - Optionally `ETERNUM_MARKETPLACE_CONTRACT` if you implement buy on Eternum.

2. **Queries**  
   - **Whitelist**: `marketplaceMarketWhitelistModelModels(limit: 50)` → build `collectionIdToAddress`.  
   - **Orders**: `marketplaceMarketOrderModelModels(limit: N, where: { order: { active: true } })` with `order { order_id, order { active, expiration, token_id, collection_id, price, owner } }`.  
   - **Fees (optional)**: `marketplaceMarketFeeModelModels(limit: 1)` for `fee_token` / display.

3. **Fetch layer**  
   - New hook or function, e.g. `useEternumListings()`, that:
     - Fetches whitelist once (or cached).
     - Fetches active orders (and optionally fee).
     - Maps orders to synthetic `Auction` + `AuctionItem[]` using the table above, and sets `source: "eternum"`.
     - Returns the list keyed by collection (adventurers = collection_id 8, beasts = collection_id 7).

4. **Merge in Buy**  
   - In the page or hook that feeds the Buy section (e.g. where you use `useAuctions()`):
     - `allAuctions = [ ...survivorExchangeAuctions.map(a => ({ ...a, source: "survivor_exchange" })), ...eternumListings ]`.
     - `getAuctionItems(auctionId)` must support both: for Survivor Exchange use current lookup; for Eternum use the single-item array you built per order.
   - Filter “Adventurers” / “Beasts” by `contract_address` (from items) or by Eternum `collection_id` (7/8) so both sources show in the right tab.

5. **Events**  
   - Use `marketplaceMarketOrderEventModels` only if you add a “History” or “Activity” view; not required for the aggregated Buy grid.

This keeps Adventurers and Beasts from both Survivor Exchange and Eternum in one list, with a clear aggregation and a path to either link-out or full buy integration for Eternum.
