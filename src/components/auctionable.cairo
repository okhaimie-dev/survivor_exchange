#[starknet::component]
pub mod AuctionableComponent {
    // Starknet imports

    // Dojo imports

    // Internal imports

    use beast_marketplace::models::auction::{AuctionAssert, AuctionTrait};
    use beast_marketplace::store::StoreTrait;
    use beast_marketplace::types::status::{RentalStatus, Status};
    use dojo::world::WorldStorage;
    use starknet::{ContractAddress, get_block_timestamp, get_caller_address};
    use crate::models::auction::Auction;

    // Storage

    #[storage]
    pub struct Storage {}

    // Events

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {}

    #[generate_trait]
    pub impl InternalImpl<
        TContractState, +HasComponent<TContractState>,
    > of InternalTrait<TContractState> {
        fn create(
            self: @ComponentState<TContractState>,
            world: WorldStorage,
            auction_id: u32,
            starting_price: u8,
            duration: u64,
        ) {
            let mut store = StoreTrait::new(world);
            // TODO: Auction should have a unique ID and contain metadata for auction
            // Check if there are no rentals in auction items.
            let owner = get_caller_address();
            let current_timestamp = get_block_timestamp();
            let mut auction: Auction = AuctionTrait::new(
                auction_id, starting_price, duration, owner.into(), current_timestamp,
            );
            store.set_auction(@auction);
        }

        fn bid(
            self: @ComponentState<TContractState>,
            world: WorldStorage,
            auction_id: u32,
            bid_amount: u8,
        ) {
            let mut store = StoreTrait::new(world);
            // TODO: Auction should have a unique ID and contain metadata for auction
            // Check if there are no rentals in auction items.
            let mut auction = store.auction(auction_id);
            store.set_auction(@auction);
        }

        fn end(self: @ComponentState<TContractState>, world: WorldStorage, auction_id: u32) {
            let mut store = StoreTrait::new(world);
            // TODO: Auction should have a unique ID and contain metadata for auction
            // Check if there are no rentals in auction items.
            let mut auction = store.auction(auction_id);
            store.set_auction(@auction);
        }

        fn settle(self: @ComponentState<TContractState>, world: WorldStorage, auction_id: u32) {
            let mut store = StoreTrait::new(world);
            // TODO: Auction should have a unique ID and contain metadata for auction
            // Check if there are no rentals in auction items.
            let mut auction = store.auction(auction_id);
            store.set_auction(@auction);
        }
    }
}
