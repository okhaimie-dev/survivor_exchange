use starknet::ContractAddress;

#[starknet::interface]
pub trait IAuctionMarketplace<TContractState> {
    /// Initializes a draft auction (status=0, beast_count=0). Items must be added before starting.
    /// - `auction_id`: Unique ID for the auction (caller-generated or from counter).
    /// - `starting_price`: Minimum initial bid (u8 for small units; consider u128 if scaling).
    fn create_auction(ref self: TContractState, auction_id: u32, starting_price: u8);

    /// Adds multiple items to a draft auction (status must be 0; owner only).
    /// - `auction_id`: The draft auction ID.
    /// - `token_ids`: Array of BEAST token IDs (e.g., up to 20).
    /// - `collection_addresses`: Parallel array of ERC721/ERC1155 addresses (must be supported).
    fn add_items(
        ref self: TContractState,
        auction_id: u32,
        token_ids: Span<u32>,
        collection_addresses: Span<ContractAddress>,
    );

    /// Adds a single item to a draft auction (convenience; status must be 0; owner only).
    /// - `auction_id`: The draft auction ID.
    /// - `token_id`: The BEAST token ID.
    /// - `collection_address`: The ERC721/ERC1155 address (must be supported).
    fn add_item(
        ref self: TContractState,
        auction_id: u32,
        token_id: u32,
        collection_address: ContractAddress,
    );

    /// Starts an active auction (sets end_time, status=1; requires beast_count > 0; owner only).
    /// - `auction_id`: The draft auction ID.
    /// - `duration`: Auction length in seconds (end_time = block_timestamp + duration).
    fn start_auction(ref self: TContractState, auction_id: u32, duration: u64);

    /// Places a bid in an active English auction (must exceed current_bid).
    /// - `token_id`: The auction's token ID.
    /// - `bid_amount`: The new bid value (transfers ETH/token to escrow).
    fn bid(ref self: TContractState, auction_id: u32, bid_amount: u8);

    /// Ends an auction (manual or if expired; callable by anyone after end_time).
    /// - `token_id`: The auction's token ID.
    fn end_auction(ref self: TContractState, auction_id: u32);

    /// Settles an ended auction: transfers token to highest bidder, funds to owner.
    /// - `token_id`: The auction's token ID.
    fn settle_auction(ref self: TContractState, auction_id: u32);
}

// dojo decorator
#[dojo::contract]
pub mod auction_systems {
    use beast_marketplace::constants::DEFAULT_NS;
    use beast_marketplace::store::StoreTrait;
    use dojo::event::EventStorage;
    use dojo::model::ModelStorage;
    use starknet::{ContractAddress, get_caller_address};
    use super::IAuctionMarketplace;

    #[abi(embed_v0)]
    impl AuctionMarketplaceImpl of IAuctionMarketplace<ContractState> {
        fn create_auction(ref self: ContractState, auction_id: u32, starting_price: u8) {
            let mut store = StoreTrait::new(self.world_default());
            // TODO: Implement auction creation logic
        // - Validate inputs
        // - Set Auction model with defaults (current_bid: 0, highest_bidder: 0, status: 0,
        // end_time: now + duration)
        // - Emit event
        // - Transfer token ownership if needed (e.g., to escrow)
        }

        fn add_items(
            ref self: ContractState,
            auction_id: u32,
            token_ids: Span<u32>,
            collection_addresses: Span<ContractAddress>,
        ) {}

        fn add_item(
            ref self: ContractState,
            auction_id: u32,
            token_id: u32,
            collection_address: ContractAddress,
        ) {}

        fn start_auction(ref self: ContractState, auction_id: u32, duration: u64) {}

        fn bid(ref self: ContractState, auction_id: u32, bid_amount: u8) {
            let mut store = StoreTrait::new(self.world_default());
            // TODO: Implement bid logic
        // - Fetch existing Auction
        // - Check active (status == 0, now < end_time), bid_amount > current_bid
        // - Refund previous bidder if any
        // - Transfer bid_amount to escrow
        // - Update model: current_bid = bid_amount, highest_bidder = caller
        // - Emit event
        }

        fn end_auction(ref self: ContractState, auction_id: u32) { // TODO: Implement end logic
            let mut store = StoreTrait::new(self.world_default());
            // - Fetch Auction
        // - Check expired (now >= end_time) or owner callable
        // - Update status to 1 (ended)
        // - Emit event
        }

        fn settle_auction(
            ref self: ContractState, auction_id: u32,
        ) { // TODO: Implement settle logic
            let mut store = StoreTrait::new(self.world_default());
            // - Fetch Auction
        // - Check ended (status == 1)
        // - Transfer token to highest_bidder (if bid > 0) or back to owner
        // - Transfer funds to owner (current_bid)
        // - Update status to 2 (settled)
        // - Emit event
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn world_default(self: @ContractState) -> dojo::world::WorldStorage {
            self.world(@DEFAULT_NS())
        }
    }
}
