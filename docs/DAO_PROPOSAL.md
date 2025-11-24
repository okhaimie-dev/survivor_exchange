# DAO Proposal: Funding and Support for BEAST NFT Auction and Rental Marketplace

## Establish On-Chain Auction and Rental Marketplace for BEAST NFTs with Initial Auction of 75 Unique Shiny BEASTs

## Submitter
Okhai Omotuebe - BEAST Marketplace Developer  
(x: @sudo_okhai)  
Date: November 26, 2025
  

## Executive Summary
Loot Survivor has demonstrated exceptional product-market fit since launch in September 2025. Within just two months per LS Data Analytics dune dashboard, the ecosystem has achieved **77,902 total games played, 5.6M+ transactions on Starknet, $368,235 in ticket purchases, and $55,651 in network fees**—signaling strong organic adoption and genuine economic activity. Beast NFT secondary sales have exceeded 1,526,539.8 **LORDS** ~$40,000, validating collector demand. However, the current secondary market infrastructure lacks efficient mechanisms for **bulk sales and collection management**—specifically, the ability for collectors to liquidate curated Beast collections (e.g., 75-unit shiny or tier-specific sets, 30-units of 10 T1s, 19 T2s, and Rank 1 Dragon) at optimal prices without OTC friction. We propose the development of a purpose-built **NFT Auction and Rental Marketplace** that enables efficient bulk trading, reduces transaction friction, and enhances the existing sustainable token economics of Survivor DAO by increasing SURVIVOR utility through marketplace fees and bidding incentives. This marketplace will be architected with modern, scalable infrastructure and delivered in three milestone-based phases, requiring a total funding allocation of **100,000 SURVIVOR tokens** for development, engineering, and community marketing initiatives.

## Problem Statement
Loot Survivor's early success demonstrates genuine player-collector interest in Beast NFTs. However, three operational constraints currently inhibit secondary market growth:
- **Bulk Sales Friction.** Collectors who accumulate themed Beast collections (e.g., 75 unique Beasts by species, rarity tier, or battle achievement) currently cannot efficiently sell these sets as curated lots. Each Beast requires individual listing and negotiation, creating operational overhead that discourages both sellers and serious buyers. This friction directly suppresses collection-level trading and liquidity.
- **Limited Price Discovery Mechanisms.** While the Empire NFT Marketplace (https://empire.realms.world/) supports BEAST sales, it suffers from inefficiencies, slow performance, and frustrating user experiences. Secondary trading still relies heavily on ad-hoc OTC deals and Discord negotiations, creating information asymmetries that disadvantage new sellers and suppress optimal pricing. Without transparent, real-time price signals, the market undersells relative to true collector demand.
- **Unstructured Time-Based Sales.** Limited-time Beast offerings (rarity drops, achievement-gated collections) have no native mechanism for time-bound auctions. Sellers cannot create scarcity signals or capitalize on event-driven demand spikes, leaving value on the table.

These constraints directly impact **revenue realization for players** and limit **DAO treasury accumulation** from transaction fees—both critical for sustaining long-term ecosystem development in this early-stage environment.

## Proposed Solution
Build and deploy the BEAST Marketplace as outlined in PRD.md:
- **English Auctions** facilitate competitive bidding on curated or rare Beast collections (Tier 1–2, animated/shiny variants, Rank 1), maximizing seller value for premium sets., supporting SURVIVOR/STRK payments.
- **Rentals**: Short-term leases with collateral ( $WBTC ).
- **Features**: Whitelisting, admin controls.
- **Tech Stack**: Cairo/Dojo on Starknet; open-source codebase for community contributions.
- **Initial Auction**: Post-launch, auction 75 unique Shiny BEASTs (rarity: Mythic-equivalent, enhanced stats) at 50k SURVIVOR reserve. 20% of proceeds to DAO treasury; winners gain exclusive marketplace perks (e.g., OG badges).

## Benefits to DAO and Community
- **Economic Impact**: Increases SURVIVOR demand through bids/fees; potential 5-10% volume uplift for BEAST trading.
- **Community Engagement**: Rentals democratize access to premium BEASTs, growing player base by 20-30%.
- **Ecosystem Value**: Provable on-chain mechanics align with Loot Survivor's transparency ethos; attracts Starknet developers.
- **Revenue Share**: DAO receives 1-2% platform fees.
- **Long-Term**: Positions DAO as leader in NFT utilities, fostering partnerships (e.g., lending protocols like uncap ).

## Funding and Support Request
- **Grant Amount**: 100000 SURVIVOR (~$19k USD) for:
  - Development (2-3 months full-time).
  - Marketing (Discord/Telegram/X campaigns, bounty).
  - Gas subsidies for initial users.

| **Milestone** | **Duration** | **Deliverables** | **Funding** |
|---|---|---|---|
| **Phase 1: Foundation** | Weeks 1–2 | PoC, design system | 30,000 SURVIVOR |
| **Phase 2: Beta Launch** | Weeks 3–6 | Mainnet deployment, beta frontend/mobile friendly, community testing  | 30,000 SURVIVOR |
| **Phase 3: Production** | Weeks 7–12 | Full launch with Shiny auction | 40,000 SURVIVOR |
| **TOTAL** | **3 Months** | **Production-Grade Bulk Sales Marketplace with Quarterly reports on metrics/adoption** | **100,000 SURVIVOR** |
    
- **Non-Monetary Support**: DAO endorsement for credibility.
  
**Payment Schedule:** SURVIVOR tokens will be disbursed upon delivery and community validation of each phase's deliverables. This ensures accountability, reduces execution risk, and maintains DAO oversight of capital deployment.

## Risks and Mitigations
- **Technical Risks**: Torii indexing.
- **Market Risks**: Low adoption → Seed with Shiny auction; partner with influencers.
- **Regulatory Risks**: NFT trading compliance → Optional KYC for high-value lots; consult legal.
- **Security Risks**: Smart contract vulnerabilities → Full audit; bug bounties via DAO.

## Appendix
- **References**: PRD.md (detailed specs); BEAST Docs (https://docs.provable.games/lootsurvivor/beasts); LS Data Analytics (https://dune.com/pg_team_6083/ls-data); Codebase (src/auction.cairo); Survivor tokenomics (https://docs.provable.games/lootsurvivor/token/tokenomics).
- **Contact**: Discord: `tony.stark` for questions.
- **Version**: 1.0
