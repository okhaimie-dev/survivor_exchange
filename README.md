![Survivor Exchange](./assets/cover.png)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/icon.png">
  <img alt="Survivor Exchange" align="right" width="120" src="assets/icon.png">
</picture>

[![Dojo](https://img.shields.io/badge/Dojo-1.8.0-brightgreen?logo=rust)](https://dojoengine.org)
[![Cairo](https://img.shields.io/badge/Cairo-2.13.1-orange?logo=cairo)](https://www.cairo-lang.org/)
[![Discord](https://img.shields.io/badge/Discord-Join%20Dojo-brightgreen?logo=discord&logoColor=white)](https://discord.com/invite/dojoengine)
[![Twitter](https://img.shields.io/twitter/follow/sudo_okhai?style=social)](https://x.com/sudo_okhai)

# Survivor Exchange

**Survivor Exchange** is a fully on-chain auction and rental marketplace for BEAST NFTs from [Loot Survivor](https://docs.provable.games/lootsurvivor/beasts), built on Starknet with [Dojo 1.8.0](https://dojoengine.org). Supports bulk auctions (bundles up to 163 BEASTs), English-style timed bidding with reserves/increments, rentals (WIP), secure vaults for bid custody, and admin controls (whitelisting, fees). Payments via USDC/SURVIVOR/LORDS (configurable). 100% provable, reduces OTC friction, boosts liquidity, captures DAO fees (1-2%).

**Key Features**:
- Bulk auctions: e.g., 220 Shiny BEASTs @50k SURVIVOR reserve.
- Bidding: Auto-refund losers; withdraw non-winning bids.
- Rentals: Short-term leases w/ collateral (WIP).
- Vaults: Escrow bids/NFTs.
- Admin: Supported collections, pauses.

See [Business Summary](docs/BUSINESS-SUMMARY.md) for PRD/THESIS/DAO_PROPOSAL overviews.

## 🛠 Quickstart (Local Dev <5min)

### Prerequisites
- Rust, [Scarb](https://docs.scarb.rs/), Dojo: `cargo install --git https://github.com/dojoengine/dojo sozo`
- [Katana](https://github.com/dojoengine/katana): `cargo install --git https://github.com/dojoengine/katana katana --bin katana`
- Docker (optional)

### 1. Clone & Build
```bash
git clone <repo> && cd survivor_exchange
sozo build  # Compiles contracts (Dojo 1.8.0)
```

### 2. All-in-One (Docker)
```bash
docker compose up  # Katana + Torii + World migration (ns: bm_0_1_1)
```
- World: `http://127.0.0.1:4040/graphql` (Torii)
- RPC: `http://127.0.0.1:5050`

### 3. Manual (Terminal 1: Katana; Terminal 2: Sozo)
```bash
# T1
katana --dev

# T2
sozo migrate  # Note WORLD_ADDRESS
sozo torii start --world <WORLD_ADDRESS>
```

## 📐 Architecture Overview

```mermaid
graph TD
    World[Dojo World<br/>ns: bm_0_1_1] --> Systems[Systems:<br/>admin, auction, rental, vault]
    World --> Models[Models:<br/>Auction, Bid, Rental, Vault<br/>AuctionItem, VaultShare<br/>ExchangeSettings]
    Systems --> Components[AuctionableComponent<br/>(bundles, bid logic)<br/>RentableComponent (WIP)]
    Models --> Store[Store.cairo<br/>(read/write + events)]
    Store --> Events[AuctionEvent<br/>BidPlaced]
    Frontend[React/Torii GQL] -.-> World
    Vaults[USDC/SURVIVOR<br/>Escrow] <--> Systems
    BEASTs[BEAST ERC721] <--> AuctionItem
```

## 🚀 Usage Example: Create/Bid Auction
```cairo
// Create bundle auction (2 BEASTs)
let auction_id = auction.create_auction(
    "Shiny Bundle", 1000, [1u32, 2u32], BEAST_ADDR, Option::Some(3600), USDC_ADDR
);

// Bid (deposits to vault)
auction.bid(auction_id, 1500);  // > starting_price

// Settle (anyone post-end_time)
auction.settle_auction(auction_id);  // NFTs → winner, funds → seller
```

## 🧪 Testing
```bash
sozo test  # 100% coverage: create/bid/withdraw/settle
```
[src/tests/test_world.cairo](src/tests/test_world.cairo).

## 🤝 Contributing
1. `sozo build && sozo test`
2. Follow [AGENTS.md](AGENTS.md): snake_case, 4-space indent, custom errors.
3. PR w/ tests.

## 📄 License
[MIT](LICENSE)

Built by [@sudo_okhai](https://x.com/sudo_okhai). Funded by Survivor DAO. 🦖
