#[starknet::interface]
pub trait IBeastAuctionMarketplace<TContractState> {
    /// Creates a new English auction for a token.
    /// - `token_id`: The NFT/token ID to auction.
    /// - `starting_price`: Minimum initial bid (u8 for small units; consider u128 if scaling).
    /// - `duration`: Auction length in seconds (end_time = block_timestamp + duration).
    fn create_auction(ref self: TContractState, token_id: u32, starting_price: u8, duration: u64);

    /// Places a bid in an active English auction (must exceed current_bid).
    /// - `token_id`: The auction's token ID.
    /// - `bid_amount`: The new bid value (transfers ETH/token to escrow).
    fn place_bid(ref self: TContractState, token_id: u32, bid_amount: u8);

    /// Ends an auction (manual or if expired; callable by anyone after end_time).
    /// - `token_id`: The auction's token ID.
    fn end_auction(ref self: TContractState, token_id: u32);

    /// Settles an ended auction: transfers token to highest bidder, funds to owner.
    /// - `token_id`: The auction's token ID.
    fn settle_auction(ref self: TContractState, token_id: u32);
}

pub mod errors {
    pub const AUCTION_NOT_ACTIVE: felt252 = 'Auction not active';
    pub const INVALID_BID: felt252 = 'Invalid bid amount';
    pub const AUCTION_NOT_ENDED: felt252 = 'Auction not ended';
    pub const UNAUTHORIZED: felt252 = 'Unauthorized access';
    // Add more error constants as needed
}

// dojo decorator
#[dojo::contract]
pub mod actions {
    use dojo::event::EventStorage;
    use dojo::model::ModelStorage;
    use starknet::{ContractAddress, get_caller_address};
    use super::IBeastAuctionMarketplace;

    #[abi(embed_v0)]
    impl AuctionMarketplaceImpl of IBeastAuctionMarketplace<ContractState> {
        fn create_auction(
            ref self: ContractState, token_id: u32, starting_price: u8, duration: u64,
        ) { // TODO: Implement auction creation logic
        // - Validate inputs
        // - Set Auction model with defaults (current_bid: 0, highest_bidder: 0, status: 0,
        // end_time: now + duration)
        // - Emit event
        // - Transfer token ownership if needed (e.g., to escrow)
        }

        fn place_bid(
            ref self: ContractState, token_id: u32, bid_amount: u8,
        ) { // TODO: Implement bid logic
        // - Fetch existing Auction
        // - Check active (status == 0, now < end_time), bid_amount > current_bid
        // - Refund previous bidder if any
        // - Transfer bid_amount to escrow
        // - Update model: current_bid = bid_amount, highest_bidder = caller
        // - Emit event
        }

        fn end_auction(ref self: ContractState, token_id: u32) { // TODO: Implement end logic
        // - Fetch Auction
        // - Check expired (now >= end_time) or owner callable
        // - Update status to 1 (ended)
        // - Emit event
        }

        fn settle_auction(ref self: ContractState, token_id: u32) { // TODO: Implement settle logic
        // - Fetch Auction
        // - Check ended (status == 1)
        // - Transfer token to highest_bidder (if bid > 0) or back to owner
        // - Transfer funds to owner (current_bid)
        // - Update status to 2 (settled)
        // - Emit event
        }
    }
}
