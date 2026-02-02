use starknet::ContractAddress;
use survivor_exchange::models::auction::Auction;
use survivor_exchange::models::index::Offer;

#[starknet::interface]
pub trait IAuctionMarketplace<TContractState> {
    /// Initializes a draft auction (status=0, beast_count=0). Items must be added before starting.
    /// - `auction_id`: Unique ID for the auction (caller-generated or from counter).
    /// - `starting_price`: Minimum initial bid (u8 for small units; consider u128 if scaling).
    fn create_auction(
        ref self: TContractState,
        name: ByteArray,
        starting_price: u64,
        items: Span<u32>,
        collection: ContractAddress,
        duration: Option<u64>,
        fee_token: ContractAddress,
    ) -> u32;

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
    fn bid(ref self: TContractState, auction_id: u32, bid_amount: u64);

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

    fn can_settle(self: @TContractState, auction_id: u32) -> bool;

    /// Buyer sends an offer on an active auction.
    fn make_offer(
        ref self: TContractState,
        auction_id: u32,
        offer_amount: u64,
        expires_in: Option<u64>,
    );

    /// Seller accepts a specific buyer's offer, settling the auction immediately.
    fn accept_offer(ref self: TContractState, auction_id: u32, buyer: ContractAddress);

    /// Seller rejects an offer, refunding the buyer.
    fn reject_offer(ref self: TContractState, auction_id: u32, buyer: ContractAddress);

    /// Buyer withdraws their own pending offer.
    fn withdraw_offer(ref self: TContractState, auction_id: u32);

    /// Get an offer by auction_id and buyer address.
    fn get_offer(self: @TContractState, auction_id: u32, buyer: ContractAddress) -> Offer;
}

// dojo decorator
#[dojo::contract]
pub mod auction_systems {
    use starknet::ContractAddress;
    use survivor_exchange::components::auctionable::AuctionableComponent;
    use survivor_exchange::constants::DEFAULT_NS;
    use survivor_exchange::store::StoreTrait;
    use super::{Auction, IAuctionMarketplace, Offer};

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
            name: ByteArray,
            starting_price: u64,
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

        fn add_items(
            ref self: ContractState,
            auction_id: u32,
            token_ids: Span<u32>,
            collection_address: ContractAddress,
        ) {
            self
                .auctionable
                .add_items(self.world_default(), auction_id, token_ids, collection_address);
        }

        fn start_auction(ref self: ContractState, auction_id: u32, duration: u64) {
            self.auctionable.start_auction(self.world_default(), auction_id, duration);
        }

        fn bid(ref self: ContractState, auction_id: u32, bid_amount: u64) {
            self.auctionable.bid(self.world_default(), auction_id, bid_amount);
        }

        fn withdraw_bid(ref self: ContractState, auction_id: u32) {
            self.auctionable.withdraw_bid(self.world_default(), auction_id);
        }

        fn end_auction(ref self: ContractState, auction_id: u32) {
            self.auctionable.end(self.world_default(), auction_id);
        }

        fn settle_auction(ref self: ContractState, auction_id: u32) {
            self.auctionable.settle(self.world_default(), auction_id);
        }

        fn get_auction(self: @ContractState, auction_id: u32) -> Auction {
            let store = StoreTrait::new(self.world_default());
            store.auction(auction_id)
        }

        fn can_settle(self: @ContractState, auction_id: u32) -> bool {
            self.auctionable.can_settle(self.world_default(), auction_id)
        }

        fn make_offer(
            ref self: ContractState,
            auction_id: u32,
            offer_amount: u64,
            expires_in: Option<u64>,
        ) {
            self.auctionable.make_offer(self.world_default(), auction_id, offer_amount, expires_in);
        }

        fn accept_offer(ref self: ContractState, auction_id: u32, buyer: ContractAddress) {
            self.auctionable.accept_offer(self.world_default(), auction_id, buyer);
        }

        fn reject_offer(ref self: ContractState, auction_id: u32, buyer: ContractAddress) {
            self.auctionable.reject_offer(self.world_default(), auction_id, buyer);
        }

        fn withdraw_offer(ref self: ContractState, auction_id: u32) {
            self.auctionable.withdraw_offer(self.world_default(), auction_id);
        }

        fn get_offer(self: @ContractState, auction_id: u32, buyer: ContractAddress) -> Offer {
            let store = StoreTrait::new(self.world_default());
            store.offer(auction_id, buyer.into())
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn world_default(self: @ContractState) -> dojo::world::WorldStorage {
            self.world(@DEFAULT_NS())
        }
    }
}
