# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Survivor Exchange is a fully on-chain NFT auction marketplace for BEAST NFTs from Loot Survivor, built on Starknet with Dojo 1.8.0. It supports bulk auctions (up to 163 NFTs), English-style timed bidding, and secure vault escrow.

## Build & Development Commands

### Smart Contracts (Cairo/Dojo)
```bash
sozo build                           # Compile contracts (generates artifacts in target/)
sozo test                            # Run all Cairo tests via snforge
snforge test --match test_name       # Run specific test by name
scarb check                          # Quick syntax/type validation
sozo clean                           # Remove build artifacts
sozo migrate                         # Deploy world to local/testnet
```

### Frontend (Next.js)
```bash
cd client
npm run dev                          # Start dev server with HTTPS (port 3000)
npm run build                        # Production build
npm run lint                         # ESLint validation
```

### Local Development (Docker)
```bash
docker compose up                    # Starts Katana (5050), Torii (8080), and migrates world
```

## Architecture

### Smart Contract Structure (`src/`)
```
systems/         # Dojo @dojo::contract systems
  auction.cairo  # Auction lifecycle: create → add_items → start → bid → end → settle
  vault.cairo    # Escrow vault for bid custody
  admin.cairo    # Whitelisting, fees, pause controls

models/          # Dojo @dojo::model data structures
  auction.cairo  # Auction entity with status machine
  bid.cairo      # Per-auction bidder tracking
  vault.cairo    # Vault + VaultShare for proportional claims
  offer.cairo    # Direct offer system

components/
  auctionable.cairo  # Core auction logic implementation

store.cairo      # StoreTrait abstracts world.read_model/write_model calls
constants.cairo  # Error messages as felt252 constants
```

### Frontend Structure (`client/app/`)
```
providers/       # Apollo (dual GraphQL endpoints) + Starknet wallet connectors
hooks/           # useAuctions, useMyListings, useMyNFTs - GraphQL polling hooks
lib/             # Constants, utilities, GraphQL queries
components/      # React components (auction, bids, filters, modals)
```

### Data Flow
- **GraphQL Dual Endpoints**: Torii (marketplace models) + Cartridge (BEAST metadata)
- **Wallet Connectors**: Cartridge (session keys), Argent, Braavos
- **Polling**: 30s interval for auction updates

## Key Patterns

### StoreTrait Usage (Cairo)
Always use StoreTrait for model access, not raw world calls:
```cairo
let store = StoreTrait::new(world);
let auction = store.auction(auction_id);    // Read
store.set_auction(@auction);                 // Write
```

### Error Handling (Cairo)
Use constants from `constants::Errors`:
```cairo
assert(auction.status == AuctionStatus::Active, Errors::AUCTION_NOT_ACTIVE);
```

### Auction Status Flow
`Draft(1)` → `Active(2)` → `Ended(3)` → `Settled(4)` (or `Canceled(5)`)

## Code Style

- **Cairo**: 4-space indent, snake_case functions, PascalCase structs, UPPER_SNAKE_CASE constants
- **TypeScript**: Follow existing patterns, use constants from `lib/constants.ts`
- **Imports**: Use absolute paths (`survivor_exchange::models::auction::Auction`)

## Contract Addresses (Mainnet)

- Auction System: `0x02dfedce0383bfd4b5a5dbf2693220841aaa3a1ebf639919a76dbe09a5ff41cb`
- Vault System: `0x02aa15e266a17d519301d5e658562ae8fe5a483be47660be42e67588b9ac29cd`
- BEASTS NFT: `0x046da8955829adf2bda310099a0063451923f02e648cf25a1203aac6335cf0e4`

## Key Constraints

- Max 163 NFTs per auction (contract limit)
- GraphQL query limit: 500 records (performance optimization)
- Supported payment tokens: USDC (6 decimals), ETH/STRK/LORDS/SURVIVOR (18 decimals), WBTC (8 decimals)
- World namespace: `bm_0_1_9`

## Tool Versions

- Dojo: 1.8.0
- Cairo: 2.13.1
- Scarb: 2.13.1
- snforge: 0.51
- Next.js: 16.0.7
- React: 19.2.1

## Browser Automation

Use `agent-browser` for web automation. Run `agent-browser --help` for all commands.

Core workflow:
1. `agent-browser open <url>` - Navigate to page
2. `agent-browser snapshot -i` - Get interactive elements with refs (@e1, @e2)
3. `agent-browser click @e1` / `fill @e2 "text"` - Interact using refs
4. Re-snapshot after page changes
