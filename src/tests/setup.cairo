#[cfg(test)]
pub mod tests {
    use dojo::world::{WorldStorage, WorldStorageTrait, world};
    use dojo_snf_test::{
        ContractDef, ContractDefTrait, NamespaceDef, TestResource, WorldStorageTestTrait,
        set_account_address, set_caller_address, spawn_test_world,
    };
    use snforge_std::{ContractClassTrait, DeclareResultTrait, declare};
    use starknet::syscalls::deploy_syscall;
    use starknet::{ContractAddress, SyscallResultTrait};
    use survivor_exchange::constants::DEFAULT_NS;
    use survivor_exchange::systems::auction::IAuctionMarketplaceDispatcher;
    use survivor_exchange::systems::vault::IVaultDispatcher;
    use survivor_exchange::tests::mocks::account::Account;

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

    #[derive(Copy, Drop)]
    pub struct Context {
        pub owner: starknet::ContractAddress,
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

    fn setup_account(public_key: felt252) -> ContractAddress {
        let (account_address, _) = deploy_syscall(
            class_hash: Account::TEST_CLASS_HASH,
            contract_address_salt: public_key,
            calldata: [public_key].span(),
            deploy_from_zero: false,
        )
            .unwrap_syscall();
        account_address
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

    pub fn spawn_auction() -> (WorldStorage, Systems, Context) {
        // [Setup] World
        let namespace_def = namespace_def();
        let world = spawn_test_world([namespace_def].span());
        world.sync_perms_and_inits(contract_defs());
        // [Setup] Systems
        let (auction_address, _) = world.dns(@"auction_systems").unwrap();
        let (vault_address, _) = world.dns(@"vault_systems").unwrap();
        let owner: ContractAddress = OWNER();
        let context = Context { owner };
        let systems = Systems {
            auction_systems: IAuctionMarketplaceDispatcher { contract_address: auction_address },
            vault_systems: IVaultDispatcher { contract_address: vault_address },
        };
        //set_account_address(owner);
        println!("This fails here");
        setup_account(owner.into());
        println!("True");
        set_caller_address(owner);
        (world, systems, context)
    }

    pub fn spawn_auction_with_mocks() -> (WorldStorage, Systems, Context, MockContracts) {
        let (world, systems, context) = spawn_auction();
        let erc721_address = deploy_mock_erc721();
        let erc20_address = deploy_mock_erc20();
        let mocks = MockContracts { erc721_address, erc20_address };
        (world, systems, context, mocks)
    }
}
