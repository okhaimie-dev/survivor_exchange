# Product Requirements Document (PRD): BEAST NFT Auction and Rental Marketplace

## 1. Overview
### Project Summary
This PRD outlines the requirements for a fully on-chain marketplace on Starknet using Dojo engine, enabling auctions and rentals of BEAST NFTs from Loot Survivor. BEASTs are collectible NFTs representing in-game beasts with attributes like rarity (Common to Legendary), types (e.g., Dragon, Wolf), ranks, and stats (e.g., strength, agility). The marketplace builds on the existing codebase (src/systems/auction.cairo, src/systems/rental.cairo, etc.), integrating with BEAST token IDs and metadata for secure, provable trading.

### Target Users
- **Owners**: BEAST holders auctioning/renting NFTs.
- **Buyers/Renters**: Players acquiring BEASTs temporarily (rent) or permanently (auction).
- **Admins**: Platform operators managing whitelists, fees, and disputes.

### Key Goals
- Facilitate liquid trading of BEASTs via timed auctions (English-style bidding).
- Enable short-term rentals for gameplay without full ownership transfer.
- Ensure on-chain provability, low fees, and integration with Starknet wallets.
- Support bundle auctions (e.g., 100 BEASTs with specific rarities) as noted in NOTES.md.
- Achieve 100% on-chain execution for transparency and composability.

### Success Metrics
- 1,000+ auctions/rentals in first month post-launch.
- <1% failed transactions due to gas/reentrancy.
- User feedback: >4/5 on ease of use via Discord/Telegram.

## 2. Background and Research
### Existing Codebase Review
- **Core Structure**: Dojo world with models (Auction, Rental), systems (admin, auction, rental), components (Auctionable, Rentable). Tests in src/tests/test_world.cairo cover basic world setup.
- **Auction System**: Supports creating auctions with start/end times, bids (in ETH or LORDS/SURVIVOR tokens), and settlement. Handles bundles but lacks whitelisting (TODO in NOTES.md).
- **Rental System**: Tracks rentals with duration, fees, and return conditions. Prevents auctioning rented BEASTs.
- **Gaps**: No payment token integration (e.g., LORDS); limited metadata handling; no lending protocol hooks (e.g., for collateralized rentals). Security: Basic ownership checks; needs reentrancy guards.
- **Dependencies**: Dojo 1.8.0, Starknet 2.13.1, OpenZeppelin for tokens.

### BEAST Collectibles Review (from Docs)
- **NFT Standard**: ERC-721-like on Starknet; each BEAST has a unique ID, metadata URI with traits (e.g., species, rarity: Common/ Rare/Epic/Legendary/Mythic, rank 1-10, stats: HP, Attack).
- **Attributes**: Visual (art style), functional (in-game boosts for Loot Survivor). Rarities affect value (e.g., Legendary >10x Common). Bundles possible via multi-token transfers.
- **Mechanics**: Transferable; no native rentals/auctions. Integrates with game via provable calls (e.g., equip rented BEAST).
- **Market Fit**: High demand for rare BEASTs; rentals enable \"try-before-buy\" for gameplay testing. Payments in STRK/ETH or game tokens.

## 3. Functional Requirements
### Core Features
#### 3.1 Auction Marketplace
- **Create Auction**: Owner lists BEAST(s) or bundle with reserve price, duration (1hr flash to 2-week major), min bid increment. Whitelist optional (admin-approved auctioneers).
- **Bidding**: Users bid higher than current; auto-refund losers. Supports bundles (e.g., 100 BEASTs: 10 Shiny, 3 T1, 1 Rank 1).
- **Settlement**: Highest bidder wins at auction end; transfer NFT + payment. Fees: 2-5% to platform.
- **Cancellation**: Owner cancels pre-bids; admin for disputes.
- **Views**: Query active/ended auctions by BEAST ID/rarity.

#### 3.2 Rental Marketplace
- **Create Rental**: Owner sets duration (e.g., 1-30 days), fee (fixed/recurring), collateral (optional via lending protocol). Renter equips in-game during term.
- **Renting**: Pay fee; temporary transfer (non-permanent). Auto-return at end; penalties for damage/non-return.
- **Termination**: Early end with refund proration; prevent auctions on rented BEASTs.
- **Integration**: Hook to game for provable usage (e.g., track equipped BEASTs).

#### 3.3 Admin & Utilities
- **Admin System**: Whitelist users/assets; set global fees; pause marketplace.
- **Payments**: Support LORDS/SURVIVOR (ERC-20); fallback to ETH.
- **Metadata**: Fetch BEAST traits for display/filtering (rarity, stats).
- **Achievements**: Track marketplace milestones (e.g., \"Top Bidder\") for in-game rewards.

### User Flows
1. **Auction Flow**: Connect wallet → Select BEAST(s) → Set params → Approve → List → Bid → Win/Refund.
2. **Rental Flow**: Browse rentals → Pay fee → Equip in Loot Survivor → Return → Refund collateral.
3. **Error Handling**: Validate ownership, sufficient balance, no active rental/auction.

## 4. Non-Functional Requirements
- **Performance**: <10s tx confirmation on Starknet; gas <500k per action.
- **Security**: Ownership via BEAST contract; audit for reentrancy, overflows. Follow OWASP: Input validation, no secrets in code.
- **Scalability**: Handle 10k+ concurrent users via Dojo indexing.
- **UI/UX**: Off-chain frontend (React/Next.js) for listings; on-chain via Sozo/Torii.
- **Compliance**: KYC-optional for high-value auctions; track for tax reporting.

## 5. Technical Specifications
- **Stack**: Cairo/Dojo for contracts; Starknet sequencer. Extend src/models/auction.cairo for bundles; add payment traits.
- **Integrations**: BEAST contract (URI: https://docs.provable.games/lootsurvivor/beasts); lending (e.g., JediSwap).
- **Testing**: Unit (sozo test --filter test_auction); integration with mock BEASTs. Coverage >90%.
- **Deployment**: Local (Katana/Torii); mainnet via Sozo migrate.

## 6. Assumptions & Risks
- **Assumptions**: BEAST contract exposes standard metadata/transfer; users have Starknet wallets.
- **Risks**: Starknet congestion (mitigate: batch txs); token volatility (mitigate: stablecoin options). Regulatory: NFT trading may require licenses.
- **Dependencies**: Dojo updates; BEAST docs accuracy.
- **Timeline**: MVP (basic auction/rental): 4 weeks; Full (bundles/lending): 8 weeks.

## 7. Appendix
- **References**: Codebase (src/auction.cairo); BEAST Docs (rarities, stats); NOTES.md (TODOs like whitelisting).
- **Version**: 1.0 | Date: Nov 12, 2025 | Author: Opencode Agent