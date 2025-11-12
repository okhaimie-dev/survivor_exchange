use beast_marketplace::models::index::SupportedNFTCollection;
use starknet::ContractAddress;

#[starknet::interface]
pub trait IMarketplaceAdmin<TContractState> {
    fn add_supported_collection(
        ref self: TContractState, collection_address: ContractAddress, name: felt252, standard: u8,
    );
    fn remove_supported_collection(ref self: TContractState, collection_address: ContractAddress);
}

#[dojo::system]
impl MarketplaceAdminImpl of IMarketplaceAdmin<ContractState> {
    fn add_supported_collection(
        ref self: ContractState, collection_address: ContractAddress, name: felt252, standard: u8,
    ) {
        let world = self.world.read();
        let caller = get_caller_address();
        // TODO: Assert admin (e.g., caller == deployer_address)
        assert(collection_address.is_non_zero(), 'Invalid address');

        // Check if already exists
        let existing: SupportedNFTCollection = get!(world, (
            collection_address.into(),
        ), into SupportedNFTCollection);
        assert!(!existing.is_supported, 'Already supported');

        // Create and set
        let collection = SupportedNFTCollection {
            collection_address, is_supported: true, name, standard,
        };
        set!(world, (collection));
    }

    fn remove_supported_collection(
        ref self: ContractState, collection_address: ContractAddress,
    ) { // Similar: Fetch, set is_supported = false, emit event
    // TODO: Assert admin
    }
}
