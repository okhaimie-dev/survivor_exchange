use beast_marketplace::models::index::SupportedNFTCollection;
use starknet::ContractAddress;

#[starknet::interface]
pub trait IMarketplaceAdmin<TContractState> {
    fn add_supported_collection(
        ref self: TContractState, collection_address: ContractAddress, name: felt252, standard: u8,
    );
    fn remove_supported_collection(ref self: TContractState, collection_address: ContractAddress);
}

#[dojo::contract]
pub mod actions {
    use starknet::get_caller_address;
    use super::{ContractAddress, IMarketplaceAdmin};

    #[abi(embed_v0)]
    impl MarketplaceAdminImpl of IMarketplaceAdmin<ContractState> {
        fn add_supported_collection(
            ref self: ContractState,
            collection_address: ContractAddress,
            name: felt252,
            standard: u8,
        ) {// TODO: Assert admin (e.g., caller == deployer_address)
        // Check if already exists

        // Create and set
        }

        fn remove_supported_collection(
            ref self: ContractState, collection_address: ContractAddress,
        ) { // Similar: Fetch, set is_supported = false, emit event
        // TODO: Assert admin
        }
    }
}
