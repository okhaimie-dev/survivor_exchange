#[starknet::component]
pub mod AuctionableComponent {
    // Starknet imports

    // Dojo imports


    // Internal imports

    use beast_marketplace::models::auction::{AuctionAssert, AuctionTrait};
    use beast_marketplace::store::StoreTrait;
    use beast_marketplace::types::status::{RentalStatus, Status};
    use dojo::world::WorldStorage;
    use starknet::ContractAddress;

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
    > of InternalTrait<TContractState> {}
}
