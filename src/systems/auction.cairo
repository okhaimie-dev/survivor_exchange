use starknet::ContractAddress;
use survivor_exchange::models::auction::Auction;

#[starknet::interface]
pub trait IAuctionMarketplace<TContractState> {
    /// Initializes a draft auction (status=0, beast_count=0). Items must be added before starting.
    /// - `auction_id`: Unique ID for the auction (caller-generated or from counter).
    /// - `starting_price`: Minimum initial bid (u8 for small units; consider u128 if scaling).
    fn create_auction(
        ref self: TContractState,
        name: felt252,
        starting_price: u32,
        items: Span<u32>,
        collection: ContractAddress,
        duration: Option<u64>,
        fee_token: ContractAddress,
    ) -> u32;

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

    /// Adds multiple items to a draft auction (status must be 0; owner only).
    /// - `auction_id`: The draft auction ID.
    /// - `token_ids`: Array of BEAST token IDs (e.g., up to 20).
    /// - `collection_addresses`: Parallel array of ERC721/ERC1155 addresses (must be supported).
    fn add_items(
        ref self: TContractState,
        auction_id: u32,
        token_ids: Span<u32>,
        collection_address: ContractAddress,
    );

    /// Starts an active auction (sets end_time, status=1; requires beast_count > 0; owner only).
    /// - `auction_id`: The draft auction ID.
    /// - `duration`: Auction length in seconds (end_time = block_timestamp + duration).
    fn start_auction(ref self: TContractState, auction_id: u32, duration: u64);

    /// Places a bid in an active English auction (must exceed current_bid).
    /// - `token_id`: The auction's token ID.
    /// - `bid_amount`: The new bid value (transfers ETH/token to escrow).
    fn bid(ref self: TContractState, auction_id: u32, bid_amount: u32);

    /// Withdraws a non-winning bid from an active auction (refunds from escrow; caller only).
    /// - `auction_id`: The active auction ID.
    fn withdraw_bid(ref self: TContractState, auction_id: u32);

    /// Ends an auction (manual or if expired; callable by anyone after end_time).
    /// - `token_id`: The auction's token ID.
    fn end_auction(ref self: TContractState, auction_id: u32);

    /// Settles an ended auction: transfers token to highest bidder, funds to owner.
    /// - `token_id`: The auction's token ID.
    fn settle_auction(ref self: TContractState, auction_id: u32);

    fn get_auction(self: @TContractState, auction_id: u32) -> Auction;
}

// dojo decorator
#[dojo::contract]
pub mod auction_systems {
    use starknet::ContractAddress;
    use survivor_exchange::components::auctionable::AuctionableComponent;
    use survivor_exchange::constants::DEFAULT_NS;
    use survivor_exchange::store::StoreTrait;
    use super::{Auction, IAuctionMarketplace};

    component!(path: AuctionableComponent, storage: auctionable, event: AuctionableEvent);
    impl AuctionableImpl = AuctionableComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        auctionable: AuctionableComponent::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        AuctionableEvent: AuctionableComponent::Event,
    }

    #[abi(embed_v0)]
    impl AuctionMarketplaceImpl of IAuctionMarketplace<ContractState> {
        fn create_auction(
            ref self: ContractState,
            name: felt252,
            starting_price: u32,
            items: Span<u32>,
            collection: ContractAddress,
            duration: Option<u64>,
            fee_token: ContractAddress,
        ) -> u32 {
            self
                .auctionable
                .create(
                    self.world_default(),
                    name,
                    starting_price,
                    items,
                    collection,
                    duration,
                    fee_token,
                )
        }

        fn add_item(
            ref self: ContractState,
            auction_id: u32,
            token_id: u32,
            collection_address: ContractAddress,
        ) {
            self
                .auctionable
                .add_item(self.world_default(), auction_id, token_id, collection_address);
        }

        fn add_items(
            ref self: ContractState,
            auction_id: u32,
            token_ids: Span<u32>,
            collection_address: ContractAddress,
        ) {}

        fn start_auction(ref self: ContractState, auction_id: u32, duration: u64) {
            self.auctionable.start_auction(self.world_default(), auction_id, duration);
        }

        fn bid(ref self: ContractState, auction_id: u32, bid_amount: u32) {
            self.auctionable.bid(self.world_default(), auction_id, bid_amount);
        }

        fn withdraw_bid(ref self: ContractState, auction_id: u32) {
            self.auctionable.withdraw_bid(self.world_default(), auction_id);
        }

        fn end_auction(ref self: ContractState, auction_id: u32) {
            self.auctionable.end(self.world_default(), auction_id);
            // TODO: Implement end logic
        //let mut store = StoreTrait::new(self.world_default());
        // - Fetch Auction
        // - Check expired (now >= end_time) or owner callable
        // - Update status to 1 (ended)
        // - Emit event
        }

        fn settle_auction(ref self: ContractState, auction_id: u32) {
            self.auctionable.settle(self.world_default(), auction_id);
            // TODO: Implement settle logic
        //let mut store = StoreTrait::new(self.world_default());
        // - Fetch Auction
        // - Check ended (status == 1)
        // - Transfer token to highest_bidder (if bid > 0) or back to owner
        // - Transfer funds to owner (current_bid)
        // - Update status to 2 (settled)
        // - Emit event
        }

        fn get_auction(self: @ContractState, auction_id: u32) -> Auction {
            let store = StoreTrait::new(self.world_default());
            store.auction(auction_id)
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn world_default(self: @ContractState) -> dojo::world::WorldStorage {
            self.world(@DEFAULT_NS())
        }
    }
}
