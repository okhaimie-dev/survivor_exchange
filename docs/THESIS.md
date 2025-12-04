# BEAST Marketplace: Product Thesis & Report

**Status:** MVP Launching Mainnet (Week of [DATE])  
**Platform:** Starknet L2 + Cairo Smart Contracts  
**Audience:** Loot Survivor DAO, Starknet Community, Developer Ecosystem

---

## Chapter 1: Executive Summary & Problem Statement

### 1.1 Problem Statement

Loot Survivor's early success has demonstrated genuine player-collector interest in Beast NFTs. However, three operational constraints currently inhibit secondary market growth and revenue realization:

**Bulk Sales Friction.** Collectors who accumulate themed Beast collections (e.g., 75 unique Beasts by species, rarity tier, or battle achievement) currently cannot efficiently sell these sets as curated lots. Each Beast requires individual listing and negotiation, creating operational overhead that discourages both sellers and serious buyers. This friction directly suppresses collection-level trading and liquidity.

**Limited Price Discovery Mechanisms.** While the Empire NFT Marketplace supports Beast sales, it suffers from inefficiencies, slow performance, and limited transparency. Secondary trading still relies heavily on ad-hoc OTC deals and Discord negotiations, creating information asymmetries that disadvantage new sellers and suppress optimal pricing. Without transparent, real-time price signals, the market undersells relative to true collector demand.

**Unstructured Time-Based Sales.** Limited-time Beast offerings (rarity drops, achievement-gated collections) have no native mechanism for time-bound auctions. Sellers cannot create scarcity signals or capitalize on event-driven demand spikes, leaving value on the table.

These constraints directly impact **revenue realization for players** (lost sales efficiency) and limit **DAO treasury accumulation** from transaction fees—both critical for sustaining long-term ecosystem development in this early-stage environment.

### 1.2 Proposed Solution

The **BEAST Marketplace** is a specialized trading platform built natively on Starknet that solves these constraints through:

- **Bulk Collection Sales:** Enable sellers to create curated Beast lots, allowing collection-level trading with a single listing and competitive auction process.
- **English Auctions:** Facilitate transparent, real-time bidding on premium or themed collections, improving price discovery and revenue capture.
- **Account Abstraction Integration:** Leverage Starknet's native AA to provide Web2-like UX (session keys, sponsored transactions, multi-call), lowering friction for casual collectors.
- **Provenance Verification:** Anchor Beast authenticity to on-chain game history, creating verifiable provenance records that build collector confidence.
- **Open-Source Architecture:** Build on Cairo + Dojo to enable community contributions and ecosystem alignment with Starknet's transparency ethos.

### 1.3 Technology Stack

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **Smart Contracts** | Cairo + Dojo (snfoundry) | Verifiable, gas-efficient on Starknet; aligns with DAO infrastructure |
| **Frontend** | Next.js | Modern, performant UX for Web3 interactions |
| **Indexing & State** | Torii | Real-time event streaming and marketplace state queries |
| **Deployment** | Starknet Mainnet | Production-ready; aligns with Loot Survivor mainnet deployment |
| **Payment Tokens** | SURVIVOR, STRK | Native ecosystem alignment; potential multi-token support Phase 2 |

### 1.4 Launch Target & Key Metrics

**MVP Launch:** 75 Unique Shiny BEASTs (Mythic-equivalent rarity)  
**Reserve Price:** 50,000 SURVIVOR per lot  
**Platform Fee:** 1% + royalty (community-defined)  
**DAO Revenue Share:** [Specify % allocation]

**Success Metrics (First 30 Days):**
- Active user count (Loot Survivor + Starknet community)
- Total auction volume (SURVIVOR/STRK)
- Average gas cost per transaction
- Price discovery efficiency vs. OTC baseline
- Account Abstraction adoption rate (% of users via AA)

---

## Chapter 2: Product Design & Architecture

### 2.1 Core Features (MVP)

#### 2.1.1 Bulk Collection Sales
- **Feature:** Sellers curate Beast collections and list as single lots
- **Mechanics:** Define collection (e.g., 10 Beasts), set reserve price, launch auction
- **Benefit:** Reduces listing overhead; enables collection-level pricing premiums
- **Implementation:** Cairo contract manages lot creation, metadata validation, ownership verification

#### 2.1.2 English Auctions
- **Mechanism:** Traditional ascending-bid auction with time window
- **Duration:** [Configurable, e.g., 24-72 hours]
- **Bid Increment:** [Specify, e.g., 1% of current bid or fixed SURVIVOR amount]
- **Settlement:** Automatic transfer of Beasts to winner; fees routed to DAO treasury
- **Cancellation:** [Seller/admin cancellation conditions, if any]

#### 2.1.3 Account Abstraction (AA) Features
- **Session Keys:** Users grant marketplace temporary authorization to bid without signing every transaction
- **Sponsored Transactions:** DAO or marketplace can sponsor gas fees for community users
- **Multi-Call:** Batch multiple bids/transactions into single on-chain call, reducing gas overhead
- **Benefit:** Web2-like UX; lowers barrier for casual collectors unfamiliar with wallet signing

#### 2.1.4 Provenance Verification (Phase 1 MVP / Phase 2 Expansion)
- **Approach:** [Specify implementation]
  - Option A: Read Beast mint events directly from Loot Survivor contract
  - Option B: Maintain separate provenance oracle/indexer on Starknet
  - Option C: Cryptographic commitment to Beast history (ZK-proof optional)
- **Data Verified:** Mint timestamp, original adventurer, battle achievement, rarity tier
- **Display:** Show Beast provenance in marketplace UI (build trust, prevent counterfeits)

#### 2.1.5 Whitelisting & Admin Controls
- **Early Access:** Whitelist Loot Survivor high-value collectors for Phase 1
- **Auction Curation:** DAO/admin can feature high-rarity collections on homepage
- **Content Moderation:** Flag/block suspicious activity (sybil, wash trading)

### 2.2 User Flows

#### 2.2.1 Seller Flow (Beast Collection Listing)
```
1. Connect wallet (Starknet AA or standard)
2. Select Beasts from inventory to bundle
3. Define collection metadata (name, description, image)
4. Set reserve price (SURVIVOR or STRK)
5. Set auction duration
6. Approve marketplace contract (if not via AA)
7. Submit collection for listing
8. Monitor bids in real-time
9. Upon auction close, confirm settlement
10. Beasts transferred to winner; seller receives payment minus fees
```

#### 2.2.2 Buyer Flow (Participate in Auction)
```
1. Browse marketplace (collections, rarity filters, duration)
2. Connect wallet (AA or standard)
3. Select collection
4. View provenance details + bidding history
5. Place bid (via session key if AA-enabled)
6. Confirm bid amount
7. Bid submitted on-chain
8. Monitor auction countdown
9. If winning, receive Beast collection upon settlement
```

### 2.3 Smart Contract Architecture

#### 2.3.1 Core Modules (Cairo/Dojo)

**Auction Module** (`auction.cairo`)
- `create_auction()`: Seller initiates collection auction
- `place_bid()`: Buyer submits bid (validates bid > current bid + increment)
- `settle_auction()`: Automatic settlement when time expires (transfer Beasts, route payments)
- `cancel_auction()`: Seller or admin cancellation (refund highest bidder if applicable)

**Collection Management Module** (`collection.cairo`)
- `validate_collection()`: Verify all Beasts exist, belong to seller, are not listed elsewhere
- `finalize_collection()`: Escrow Beasts during auction
- `release_collection()`: Transfer to winner or return to seller

**Fee Distribution Module** (`fees.cairo`)
- `distribute_fees()`: Calculate 1% platform fee, royalty, DAO allocation
- `withdraw_treasury()`: DAO withdraws accumulated fees

**Account Abstraction Integration** (`aa_integration.cairo`)
- `execute_with_session_key()`: Validate session key authorization, execute bid
- `sponsor_transaction()`: DAO sponsors gas for approved community addresses

#### 2.3.2 State Model

**Key Data Structures:**
- `Auction`: ID, seller, collection (list of Beast IDs), reserve price, current bid, bidder, duration, status
- `Collection`: ID, owner, Beasts array, metadata URI, creation timestamp
- `User`: Address, auction history, reputation score (optional)

#### 2.3.3 Deployment Architecture

```
Starknet Mainnet
├── BEAST Marketplace Contracts
│   ├── Auction.cairo (core logic)
│   ├── Collection.cairo (inventory management)
│   ├── Fees.cairo (treasury routing)
│   └── AAIntegration.cairo (session keys, sponsored txs)
├── Loot Survivor Beast Contract (external, read-only)
└── SURVIVOR/STRK Token Contracts (payment)

Indexing Layer
├── Torii (state streaming, event indexing)
└── API Endpoints (marketplace queries, auction data)

Frontend (Next.js)
├── Pages: Browse, Create Auction, Bid, My Collections
├── Wallet Integration (Argent, Braavos, other AA wallets)
└── Real-time UI updates (via Torii subscriptions)
```

### 2.4 Comparison with Alternatives

| Feature | BEAST Marketplace | Empire NFT | OTC Discord |
|---------|------------------|-----------|-------------|
| **Bulk Collections** | ✓ (MVP) | ✗ | ✗ |
| **English Auctions** | ✓ | Limited | ✗ |
| **Provenance Verification** | ✓ (Phase 2) | ✗ | ✗ |
| **AA/Sponsored Txs** | ✓ | ✗ | N/A |
| **Gas Efficiency** | ✓ (Starknet L2) | Variable | N/A |
| **Real-time Price Discovery** | ✓ | Limited | ✗ |
| **Transparency** | ✓ (On-chain) | Moderate | ✗ |

**Why Starknet & Cairo Matter:**
- **Scalability:** L2 gas costs enable frequent auctions; high throughput supports concurrent bidding
- **Verifiability:** Cairo contracts ensure auction logic is transparent and auditable
- **Account Abstraction:** Native AA support (unlike EVM L1/L2s) enables Web2-like UX for mainstream adoption
- **Ecosystem Fit:** Aligns with Loot Survivor's Starknet infrastructure; positions marketplace as flagship DAO app

---

## Chapter 3: Implementation Details

### 3.1 Smart Contract Overview

#### 3.1.1 Auction.cairo (Core Logic)

**Key Functions:**

```cairo
#[starknet::contract]
mod BEASTAuction {
    use starknet::{ContractAddress, get_caller_address, get_block_timestamp};
    use openzeppelin::token::erc721::interface::{IERC721Dispatcher, IERC721DispatcherTrait};
    use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};

    #[storage]
    struct Storage {
        auction_counter: u256,
        auctions: LegacyMap<u256, Auction>,
        user_bids: LegacyMap<ContractAddress, u256>,
        beast_contract: ContractAddress,
        survivor_token: ContractAddress,
        platform_fee_bps: u256,  // basis points
        treasury_address: ContractAddress,
    }

    #[derive(Store, Copy, Drop)]
    struct Auction {
        id: u256,
        seller: ContractAddress,
        collection_id: u256,  // Reference to Collection struct
        reserve_price: u256,
        current_bid: u256,
        current_bidder: ContractAddress,
        start_time: u64,
        end_time: u64,
        is_settled: bool,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        AuctionCreated: AuctionCreated,
        BidPlaced: BidPlaced,
        AuctionSettled: AuctionSettled,
    }

    #[derive(Drop, starknet::Event)]
    struct AuctionCreated {
        auction_id: u256,
        seller: ContractAddress,
        reserve_price: u256,
        duration_seconds: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct BidPlaced {
        auction_id: u256,
        bidder: ContractAddress,
        bid_amount: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct AuctionSettled {
        auction_id: u256,
        winner: ContractAddress,
        final_price: u256,
    }

    // Create new auction
    fn create_auction(
        ref self: ContractState,
        collection_id: u256,
        reserve_price: u256,
        duration_seconds: u64,
    ) -> u256 {
        // Validate caller owns collection
        // Validate reserve_price > 0
        // Create auction struct and store
        // Emit AuctionCreated event
        // Return auction_id
    }

    // Place bid
    fn place_bid(
        ref self: ContractState,
        auction_id: u256,
        bid_amount: u256,
    ) {
        // Validate auction exists and is active
        // Validate bid_amount > current_bid + min_increment
        // Transfer SURVIVOR from bidder to escrow
        // Refund previous bidder if applicable
        // Update current_bid and current_bidder
        // Emit BidPlaced event
    }

    // Settle auction when time expires
    fn settle_auction(
        ref self: ContractState,
        auction_id: u256,
    ) {
        // Validate auction time has expired
        // If current_bid >= reserve_price: transfer Beasts to winner, pay seller
        // Else: return Beasts to seller, refund bidders
        // Distribute fees to treasury
        // Emit AuctionSettled event
    }
}
```

**Notes:**
- [Add your actual Cairo code here; adjust syntax based on snfoundry version]
- Replace `LegacyMap` with appropriate Dojo storage if using Dojo ORM
- Include session key validation if Account Abstraction enabled

#### 3.1.2 Collection.cairo (Beast Inventory Management)

**Responsibilities:**
- Validate Beasts exist in Loot Survivor contract
- Manage Beast escrow during auction
- Transfer ownership to winner upon settlement
- [Provide code snippet if available]

#### 3.1.3 AccountAbstraction.cairo (Session Keys & Sponsored Txs)

**Features:**
- Session key generation and validation
- Gas sponsorship logic
- [Provide code snippet if available]

### 3.2 Frontend Architecture (Next.js)

**Key Pages/Components:**

| Page | Purpose | AA Integration |
|------|---------|-----------------|
| `/browse` | Browse auctions, filter by rarity/duration | None (read-only) |
| `/create` | Seller launches new auction | Session key for approval if needed |
| `/auction/[id]` | View auction details, place bid | Session key for bid submission |
| `/my-collections` | View user's listed/owned collections | None (read-only) |
| `/account` | User settings, bid history | Manage session keys here |

**Data Flow:**
```
Next.js (Frontend)
    ↓
Torii Indexer (State queries)
    ↓
Starknet RPC
    ↓
BEAST Marketplace Contracts
```

**Real-time Updates:**
- Torii subscriptions push new bids, auction closures to frontend
- WebSocket updates trigger UI refresh without page reload

### 3.3 Mainnet Deployment Plan

**Phase 1: Pre-Launch (Week of [DATE])**
- [ ] Final smart contract audit (if applicable)
- [ ] Load testing on mainnet testnet clone
- [ ] Frontend security review
- [ ] Whitelist management setup

**Phase 2: Launch (Week of [DATE])**
- [ ] Deploy contracts to Starknet mainnet
- [ ] Initialize Torii indexer
- [ ] Launch frontend at `[domain]`
- [ ] Announce to Loot Survivor + Starknet communities
- [ ] Begin 75 Shiny Beast auction

**Phase 3: Post-Launch (Week 2+)**
- [ ] Monitor gas costs, throughput
- [ ] Gather user feedback
- [ ] Plan Phase 2 features (provenance expansion, rentals, etc.)

---

## Chapter 4: Launch Results & Initial Metrics

### 4.1 Instrumentation & Data Collection

**On-Chain Metrics (from Starknet):**
- Gas cost per transaction (auction creation, bid, settlement)
- Transaction finality time (block inclusion)
- Concurrent auctions and bid throughput

**Application Metrics (from Torii + Frontend):**
- Daily active users (DAU)
- Auction volume (number of auctions, total SURVIVOR/STRK traded)
- Bid frequency and distribution
- Collection composition (Beast rarity breakdown)

**Account Abstraction Metrics:**
- % of bids via session key vs. standard wallet approval
- Gas savings from AA (if sponsored transactions enabled)

**Business Metrics:**
- DAO treasury revenue (1% fees, royalties)
- Average auction duration and settlement time
- User retention (Week 1 → Week 2 → Week 4)

### 4.2 Phase 1 Launch Results (To Be Populated Week 1)

[Insert after launch data is available]

**User Adoption:**
- Total sign-ups: [#]
- Active bidders: [#]
- Collections listed: [#]

**Volume & Revenue:**
- Total SURVIVOR traded: [#]
- Total STRK traded: [#]
- DAO treasury collected: [#]

**Performance:**
- Average gas cost per auction: [# wei / gwei]
- Average bid finality time: [# seconds]
- 95th percentile latency (UI responsiveness): [# ms]

**User Experience:**
- AA adoption rate: [%]
- Feedback score (if survey conducted): [#/10]
- Top user requests / feature gaps: [List]

### 4.3 Comparison with Baseline (OTC / Empire)

[To be completed after launch; compare against stated goals from Chapter 1]

| Metric | BEAST Marketplace | OTC / Empire | Improvement |
|--------|------------------|--------------|-------------|
| Bulk collection listing | ✓ | ✗ | N/A |
| Real-time price discovery | ✓ | ✗ | N/A |
| Avg. time to sale | [hrs] | [days] | X% faster |
| Avg. gas cost per transaction | [gwei] | [gwei] | X% cheaper |

---

## Chapter 5: Impact, Roadmap & Conclusion

### 5.1 Ecosystem Impact

#### 5.1.1 Loot Survivor DAO
- **Treasury Revenue:** [Project: # SURVIVOR/STRK in fees over 3 months]
- **Player Engagement:** [Project: # new active players from marketplace UX]
- **Secondary Market Efficiency:** Reduced Beast holding time; increased velocity

#### 5.1.2 Starknet Ecosystem
- **DApp Showcase:** Demonstrates Starknet's viability for specialized marketplaces
- **Account Abstraction Real-World Use:** AA features improve mainstream Web3 UX
- **Developer Precedent:** Open-source codebase enables other DAO projects to fork/adapt

### 5.2 Planned Phase 2 Features (Roadmap)

#### 5.2.1 Provenance Verification (Enhanced)
- **Goal:** Display verifiable Beast history (mint event, original adventurer, battle achievements)
- **Implementation:** ZK proof of Beast authenticity; seller can prove rare drops without revealing sensitive in-game data
- **Timeline:** [Month #]

#### 5.2.2 Beast Rentals
- **Goal:** Enable temporary Beast leasing with collateral (e.g., WBTC)
- **Use Case:** Casual players test premium Beasts before purchase; lenders earn yield
- **Implementation:** Escrow rental contracts; configurable rental duration
- **Timeline:** [Month #]

#### 5.2.3 DAO Governance Integration
- **Goal:** Allow SURVIVOR DAO to vote on auction parameters (fee %, reserve prices, featured collections)
- **Implementation:** Governance proposal → snapshot vote → smart contract update
- **Timeline:** [Month #]

#### 5.2.4 Cross-Game Beast Trading (Appchain Vision)
- **Goal:** Enable Beast trading across multiple Starknet games (future Loot Survivor-compatible games)
- **Implementation:** Standardized Beast metadata format; inter-game bridge contracts
- **Timeline:** [Long-term; pending Starknet Stack maturity]

### 5.3 Limitations & Challenges

**MVP Limitations:**
- Provenance verification in Phase 2 (current MVP trusts Beast contract directly)
- No rental system in Phase 1 (engineering complexity; market demand validation first)
- Limited community governance in Phase 1 (centralized admin controls; decentralize over time)

**Technical Challenges:**
- Starknet mainnet stability and RPC performance (mitigation: redundant RPC providers)
- User AA adoption (mitigation: provide session key setup guide; consider gas sponsorship)
- Cold start problem (mitigation: feature 75 Shiny Beasts prominently; DAO incentivizes early listings)

### 5.4 Broader Implications

**Specialized Marketplaces in NFT Gaming:**
This marketplace demonstrates that game-native, asset-specific trading platforms outperform generic marketplaces (OpenSea, LooksRare) for niche communities. The combination of **Starknet's L2 scalability**, **Cairo's verifiability**, and **native Account Abstraction** creates a template that other blockchain games can replicate.

**The Role of Starknet in Web3 UX:**
By enabling Web2-like features (session keys, sponsored transactions, batch operations) without sacrificing decentralization, Starknet enables mainstream adoption of blockchain gaming. This marketplace is an early proof-of-concept.

### 5.5 Conclusion

The BEAST Marketplace addresses real operational friction in Loot Survivor's secondary market. By leveraging Starknet's unique technical capabilities—low-cost transactions, verifiable smart contracts, and native Account Abstraction—we've built a specialized trading platform that improves both **player revenue** and **DAO sustainability**.

The MVP launches with bulk collection sales, English auctions, and AA-enabled bidding. Early metrics will validate market demand and guide Phase 2 feature prioritization (provenance, rentals, governance).

This capstone demonstrates that **blockchain infrastructure maturity (Starknet) + product design rigor + community alignment** can create valuable Web3 applications that serve real user needs.

---

## Appendices

### A. Smart Contract Code Repository
- **Repository:** [Link to GitHub]
- **License:** [Open-source license]
- **Documentation:** [Link to code comments / architecture docs]

### B. Frontend Repository
- **Repository:** [Link to GitHub]
- **Deployment:** [Live URL]
- **Architecture Diagram:** [Link or embedded image]

### C. Deployment Configuration
- **Testnet Deployment:** [Testnet contract addresses]
- **Mainnet Deployment:** [Mainnet contract addresses]
- **Indexer Endpoint:** [Torii API URL]

### D. Fee & Revenue Model
- **Platform Fee:** 1%
- **Royalty:** [Specify %; community-determined]
- **DAO Treasury Allocation:** [Specify %]
- **Projected 3-Month Revenue:** [Estimate based on volume forecast]

### E. Community Feedback & User Testing (Phase 1 Post-Launch)
[To be populated after launch]
- Survey results
- Feature requests
- User testimonials
- Sentiment analysis from Discord/Twitter

---

**Document Version:** 1.0 (MVP Launch)  
**Last Updated:** 12/04/2025 
**Author:** Okhai Omotuebe 
**DAO:** Loot Survivor  
**Network:** Starknet Mainnet
