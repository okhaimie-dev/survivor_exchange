use beast_marketplace::models::index::Rental;

// define the interface

#[starknet::interface]
pub trait IRentalMarketplace<TContractState> {
    /// Creates a new rental listing for a token.
    /// - `token_id`: The NFT/token ID to rent.
    /// - `rental_price`: Price per time unit (e.g., per day; u8 for small units).
    /// - `duration`: Max rental length in seconds.
    /// - `collateral`: Required deposit (refundable minus fees/damages).
    fn create_rental(
        ref self: TContractState, token_id: u32, rental_price: u8, duration: u64, collateral: u64,
    );

    /// Starts a rental: locks collateral, sets start/end times and renter.
    /// - `token_id`: The rental's token ID.
    /// - `collateral_amount`: Amount to lock (must >= listing collateral).
    fn rent(ref self: TContractState, token_id: u32, collateral_amount: u64);

    /// Ends a rental (early or at term): updates status, releases access.
    /// - `token_id`: The rental's token ID.
    fn return_rental(ref self: TContractState, token_id: u32);

    /// Claims collateral after rental return (owner only; deducts rental fees).
    /// - `token_id`: The rental's token ID.
    fn claim_collateral(ref self: TContractState, token_id: u32);
}

// dojo decorator
#[dojo::contract]
pub mod rental_systems {
    use beast_marketplace::constants::DEFAULT_NS;
    use beast_marketplace::store::StoreTrait;
    use dojo::event::EventStorage;
    use dojo::model::ModelStorage;
    use starknet::{ContractAddress, get_caller_address};
    use super::{IRentalMarketplace, Rental};

    #[abi(embed_v0)]
    impl RentalMarketplaceImpl of IRentalMarketplace<ContractState> {
        fn create_rental(
            ref self: ContractState,
            token_id: u32,
            rental_price: u8,
            duration: u64,
            collateral: u64,
        ) {
            let mut store = StoreTrait::new(self.world_default());
            // TODO: Implement rental creation logic
        // - Validate inputs
        // - Set Rental model with defaults (renter: 0, start_time: 0, end_time: 0, status: 0)
        // - Emit event
        // - Transfer token ownership if needed (e.g., to escrow)
        }

        fn rent(
            ref self: ContractState, token_id: u32, collateral_amount: u64,
        ) { // TODO: Implement rent logic
        // - Fetch existing Rental
        // - Check availability (status == 0), collateral_amount >= required
        // - Lock collateral (transfer to escrow)
        // - Update model: renter = caller, start_time = now, end_time = now + duration, status = 1
        // - Emit event
        }

        fn return_rental(ref self: ContractState, token_id: u32) { // TODO: Implement return logic
        // - Fetch Rental
        // - Check renter == caller or owner
        // - Update status to 2 (returned), release access
        // - Calculate fees and prepare for claim
        // - Emit event
        }

        fn claim_collateral(ref self: ContractState, token_id: u32) { // TODO: Implement claim logic
        // - Fetch Rental
        // - Check owner == caller and status == 2
        // - Deduct rental fees from collateral
        // - Transfer remaining collateral back to owner
        // - Optionally archive or reset model
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
