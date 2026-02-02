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
    use starknet::get_caller_address;
    use survivor_exchange::constants::{DEFAULT_NS, Errors};
    use survivor_exchange::models::admin::AdminTrait;
    use survivor_exchange::models::index::SupportedNFTCollection;
    use survivor_exchange::store::StoreTrait;
    use survivor_exchange::utils::{
        ADVENTURER_ADDRESS_MAINNET, BEAST_ADDRESS_MAINNET, SURVIVOR_ADDRESS_MAINNET,
    };
    use super::{ContractAddress, IMarketplaceAdmin};

    fn dojo_init(ref self: ContractState) {
        let mut store = StoreTrait::new(self.world_default());

        // Initialize exchange settings
        let admin_config = AdminTrait::new(
            1, 1, SURVIVOR_ADDRESS_MAINNET().into(), get_caller_address().into(),
        );
        store.set_exchange_settings(@admin_config);

        // Auto-whitelist BEAST collection
        let beast_collection = SupportedNFTCollection {
            collection_address: BEAST_ADDRESS_MAINNET().into(), standard: 1, // ERC721
        };
        store.set_supported_nft_collection(@beast_collection);

        // Auto-whitelist Adventurer collection
        let adventurer_collection = SupportedNFTCollection {
            collection_address: ADVENTURER_ADDRESS_MAINNET().into(), standard: 1, // ERC721
        };
        store.set_supported_nft_collection(@adventurer_collection);
    }

    #[abi(embed_v0)]
    impl MarketplaceAdminImpl of IMarketplaceAdmin<ContractState> {
        fn add_supported_collection(
            ref self: ContractState, collection_address: ContractAddress, standard: u8,
        ) {
            let mut store = StoreTrait::new(self.world_default());

            // Verify caller is admin
            let settings = store.exchange_settings(1);
            let caller: felt252 = get_caller_address().into();
            assert(caller == settings.admin, Errors::UNAUTHORIZED);

            // Add collection to whitelist
            let collection = SupportedNFTCollection {
                collection_address: collection_address.into(), standard,
            };
            store.set_supported_nft_collection(@collection);
        }

        fn remove_supported_collection(
            ref self: ContractState, collection_address: ContractAddress,
        ) {
            let mut store = StoreTrait::new(self.world_default());

            // Verify caller is admin
            let settings = store.exchange_settings(1);
            let caller: felt252 = get_caller_address().into();
            assert(caller == settings.admin, Errors::UNAUTHORIZED);

            // Remove by setting standard to invalid value (0xFF indicates removed)
            let collection = SupportedNFTCollection {
                collection_address: collection_address.into(),
                standard: 0xFF, // Mark as removed
            };
            store.set_supported_nft_collection(@collection);
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn world_default(self: @ContractState) -> dojo::world::WorldStorage {
            self.world(@DEFAULT_NS())
        }
    }
}
