use beast_marketplace::models::index::{Auction, Rental};

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
pub mod actions {
    use dojo::event::EventStorage;
    use dojo::model::ModelStorage;
    use starknet::{ContractAddress, get_caller_address};
    use super::{Auction, IRentalMarketplace, Rental};

    #[abi(embed_v0)]
    impl RentalImpl of IRentalMarketplace<ContractState> {
        fn spawn(ref self: ContractState) {
            // Get the default world.
            let mut world = self.world_default();

            // Get the address of the current caller, possibly the player's address.
            let player = get_caller_address();
            // Retrieve the player's current position from the world.
            let position: Position = world.read_model(player);

            // Update the world state with the new data.

            // 1. Move the player's position 10 units in both the x and y direction.
            let new_position = Position {
                player, vec: Vec2 { x: position.vec.x + 10, y: position.vec.y + 10 },
            };

            // Write the new position to the world.
            world.write_model(@new_position);

            // 2. Set the player's remaining moves to 100.
            let moves = Moves {
                player, remaining: 100, last_direction: Option::None, can_move: true,
            };

            // Write the new moves to the world.
            world.write_model(@moves);
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        /// Use the default namespace "dojo_starter". This function is handy since the ByteArray
        /// can't be const.
        fn world_default(self: @ContractState) -> dojo::world::WorldStorage {
            self.world(@"dojo_starter")
        }
    }
}
