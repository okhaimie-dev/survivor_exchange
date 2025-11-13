#[starknet::component]
pub mod RentableComponent {
    // Starknet imports

    // Dojo imports

    // Internal imports

    use dojo::world::WorldStorage;
    use starknet::{ContractAddress, get_block_timestamp, get_caller_address};
    use survivor_exchange::models::rental::{Rental, RentalAssert, RentalTrait};
    use survivor_exchange::store::StoreTrait;
    use survivor_exchange::types::status::{AuctionStatus, RentalStatus};
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
            token_id: u32,
            rental_price: u8,
            duration: u64,
            collateral: u64,
        ) {
            let mut store = StoreTrait::new(world);
            // TODO: Auction should have a unique ID and contain metadata for auction
            // Check if there are no rentals in auction items.
            let owner = get_caller_address();
            let current_timestamp = get_block_timestamp();
            let mut rental: Rental = RentalTrait::new(
                token_id, rental_price, duration, collateral, owner.into(), current_timestamp,
            );
            store.set_rental(@rental);
        }

        fn rent(
            self: @ComponentState<TContractState>,
            world: WorldStorage,
            token_id: u32,
            bid_amount: u8,
        ) {
            let mut store = StoreTrait::new(world);
            // TODO: Auction should have a unique ID and contain metadata for auction
            // Check if there are no rentals in auction items.
            let mut rental = store.rental(token_id);
            store.set_rental(@rental);
        }

        fn return_rental(
            self: @ComponentState<TContractState>, world: WorldStorage, token_id: u32,
        ) {
            let mut store = StoreTrait::new(world);
            // TODO: Auction should have a unique ID and contain metadata for auction
            // Check if there are no rentals in auction items.
            let mut rental = store.rental(token_id);
            store.set_rental(@rental);
        }

        fn claim_collateral(
            self: @ComponentState<TContractState>, world: WorldStorage, token_id: u32,
        ) {
            let mut store = StoreTrait::new(world);
            // TODO: Auction should have a unique ID and contain metadata for auction
            // Check if there are no rentals in auction items.
            let mut rental = store.rental(token_id);
            store.set_rental(@rental);
        }
    }
}
