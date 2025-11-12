use beast_marketplace::models::index::SupportedNFTCollection;
use starknet::ContractAddress;

#[starknet::interface]
pub trait IMarketplaceAdmin<TContractState> {
    fn add_supported_collection(
        ref self: TContractState, collection_address: ContractAddress, standard: u8,
    );
    fn remove_supported_collection(ref self: TContractState, collection_address: ContractAddress);
}

#[dojo::contract]
pub mod admin_systems {
    use beast_marketplace::constants::DEFAULT_NS;
    use beast_marketplace::store::StoreTrait;
    use starknet::get_caller_address;
    use super::{ContractAddress, IMarketplaceAdmin};

    #[abi(embed_v0)]
    impl MarketplaceAdminImpl of IMarketplaceAdmin<ContractState> {
        fn add_supported_collection(
            ref self: ContractState, collection_address: ContractAddress, standard: u8,
        ) {
            let mut store = StoreTrait::new(self.world_default());
            // TODO: Assert admin (e.g., caller == deployer_address)
        // Check if already exists

            // Create and set
        }

        fn remove_supported_collection(
            ref self: ContractState, collection_address: ContractAddress,
        ) {
            let mut store = StoreTrait::new(self.world_default());
            // Similar: Fetch, set is_supported = false, emit event
        // TODO: Assert admin
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn world_default(self: @ContractState) -> dojo::world::WorldStorage {
            self.world(@DEFAULT_NS())
        }
    }
}
