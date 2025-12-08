#[cfg(test)]
pub mod tests {
    use dojo::world::{WorldStorage, WorldStorageTrait, world};
    use dojo_snf_test::{
        ContractDef, ContractDefTrait, NamespaceDef, TestResource, WorldStorageTestTrait,
        spawn_test_world,
    };
    use snforge_std::{ContractClassTrait, DeclareResultTrait, declare};
    use starknet::{ContractAddress, SyscallResultTrait};
    use survivor_exchange::constants::DEFAULT_NS;
    use survivor_exchange::systems::auction::IAuctionMarketplaceDispatcher;
    use survivor_exchange::systems::vault::IVaultDispatcher;

    pub fn OWNER() -> starknet::ContractAddress {
        0x127fd5f1fe78a71f8bcd1fec63e3fe2f0486b6ecd5c86a0466c3a21fa5cfcec.try_into().unwrap()
    }

    pub fn BIDDER() -> starknet::ContractAddress {
        0x2.try_into().unwrap()
    }

    pub fn BIDDER2() -> starknet::ContractAddress {
        0x3.try_into().unwrap()
    }

    #[derive(Drop)]
    pub struct Systems {
        pub auction_systems: IAuctionMarketplaceDispatcher,
        pub vault_systems: IVaultDispatcher,
    }

    #[derive(Drop, Copy)]
    pub struct MockContracts {
        pub erc721_address: ContractAddress,
        pub erc20_address: ContractAddress,
    }

    fn namespace_def() -> NamespaceDef {
        let ndef = NamespaceDef {
            namespace: DEFAULT_NS(),
            resources: [
                TestResource::Model("Bid"), TestResource::Model("Auction"),
                TestResource::Model("AuctionItem"), TestResource::Model("Rental"),
                TestResource::Model("ExchangeSettings"), TestResource::Model("Vault"),
                TestResource::Model("VaultShare"), TestResource::Model("SupportedNFTCollection"),
                TestResource::Event("AuctionEvent"), TestResource::Event("BidPlaced"),
                TestResource::Contract("auction_systems"), TestResource::Contract("vault_systems"),
            ]
                .span(),
        };

        ndef
    }

    fn contract_defs() -> Span<ContractDef> {
        [
            ContractDefTrait::new(@DEFAULT_NS(), @"auction_systems")
                .with_writer_of([dojo::utils::bytearray_hash(@DEFAULT_NS())].span()),
            ContractDefTrait::new(@DEFAULT_NS(), @"vault_systems")
                .with_writer_of([dojo::utils::bytearray_hash(@DEFAULT_NS())].span()),
        ]
            .span()
    }

    pub fn deploy_mock_erc721() -> ContractAddress {
        let contract = declare("MockERC721").unwrap_syscall().contract_class();
        let (address, _) = contract.deploy(@array![]).unwrap_syscall();
        address
    }

    pub fn deploy_mock_erc20() -> ContractAddress {
        let contract = declare("MockERC20").unwrap_syscall().contract_class();
        let (address, _) = contract.deploy(@array![]).unwrap_syscall();
        address
    }

    pub fn spawn_auction() -> (WorldStorage, Systems) {
        // [Setup] World
        let namespace_def = namespace_def();
        let world = spawn_test_world([namespace_def].span());
        world.sync_perms_and_inits(contract_defs());
        // [Setup] Systems
        let (auction_address, _) = world.dns(@"auction_systems").unwrap();
        let (vault_address, _) = world.dns(@"vault_systems").unwrap();
        let systems = Systems {
            auction_systems: IAuctionMarketplaceDispatcher { contract_address: auction_address },
            vault_systems: IVaultDispatcher { contract_address: vault_address },
        };

        (world, systems)
    }

    pub fn spawn_auction_with_mocks() -> (WorldStorage, Systems, MockContracts) {
        let (world, systems) = spawn_auction();
        let erc721_address = deploy_mock_erc721();
        let erc20_address = deploy_mock_erc20();
        let mocks = MockContracts { erc721_address, erc20_address };
        (world, systems, mocks)
    }
}
