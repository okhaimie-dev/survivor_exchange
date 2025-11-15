use starknet::ContractAddress;
//use survivor_exchange::models::index::SupportedNFTCollection;

#[starknet::interface]
pub trait IMarketplaceAdmin<TContractState> {
    fn add_supported_collection(
        ref self: TContractState, collection_address: ContractAddress, standard: u8,
    );
    fn remove_supported_collection(ref self: TContractState, collection_address: ContractAddress);
}

#[dojo::contract]
pub mod admin_systems {
    use starknet::get_caller_address;
    use survivor_exchange::constants::DEFAULT_NS;
    use survivor_exchange::models::admin::AdminTrait;
    use survivor_exchange::store::StoreTrait;
    use survivor_exchange::utils::SURVIVOR_ADDRESS_MAINNET;
    use super::{ContractAddress, IMarketplaceAdmin};

    fn dojo_init(ref self: ContractState) {
        let mut store = StoreTrait::new(self.world_default());
        let admin_config = AdminTrait::new(
            1, 1, SURVIVOR_ADDRESS_MAINNET().into(), get_caller_address().into(),
        );
        store.set_exchange_settings(@admin_config);
    }

    #[abi(embed_v0)]
    impl MarketplaceAdminImpl of IMarketplaceAdmin<ContractState> {
        fn add_supported_collection(
            ref self: ContractState, collection_address: ContractAddress, standard: u8,
        ) { //let mut store = StoreTrait::new(self.world_default());
        // TODO: Assert admin (e.g., caller == deployer_address)
        // Check if already exists

        // Create and set
        }

        fn remove_supported_collection(
            ref self: ContractState, collection_address: ContractAddress,
        ) { //let mut store = StoreTrait::new(self.world_default());
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
