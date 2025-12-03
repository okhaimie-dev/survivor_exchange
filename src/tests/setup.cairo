#[cfg(test)]
pub mod tests {
    use dojo::world::{WorldStorage, WorldStorageTrait, world};
    use dojo_snf_test::{
        ContractDef, ContractDefTrait, NamespaceDef, TestResource, WorldStorageTestTrait,
        spawn_test_world,
    };
    use survivor_exchange::constants::DEFAULT_NS;
    use survivor_exchange::systems::auction::IAuctionMarketplaceDispatcher;

    pub fn OWNER() -> starknet::ContractAddress {
        0x127fd5f1fe78a71f8bcd1fec63e3fe2f0486b6ecd5c86a0466c3a21fa5cfcec.try_into().unwrap()
    }

    #[derive(Drop)]
    struct Systems {
        pub auction_systems: IAuctionMarketplaceDispatcher,
    }

    fn namespace_def() -> NamespaceDef {
        let ndef = NamespaceDef {
            namespace: DEFAULT_NS(),
            resources: [
                TestResource::Model("Bid"), TestResource::Model("Auction"),
                TestResource::Model("AuctionItem"), TestResource::Model("Rental"),
                TestResource::Model("ExchangeSettings"),
                TestResource::Model("SupportedNFTCollection"), TestResource::Event("AuctionEvent"),
                TestResource::Event("BidPlaced"), TestResource::Contract("auction_systems"),
            ]
                .span(),
        };

        ndef
    }

    fn contract_defs() -> Span<ContractDef> {
        [
            ContractDefTrait::new(@DEFAULT_NS(), @"auction_systems")
                .with_writer_of([dojo::utils::bytearray_hash(@DEFAULT_NS())].span())
        ]
            .span()
    }

    pub fn spawn_auction() -> (WorldStorage, Systems) {
        // [Setup] World
        let namespace_def = namespace_def();
        let world = spawn_test_world([namespace_def].span());
        world.sync_perms_and_inits(contract_defs());
        // [Setup] Systems
        let (auction_address, _) = world.dns(@"auction_systems").unwrap();
        let systems = Systems {
            auction_systems: IAuctionMarketplaceDispatcher { contract_address: auction_address },
        };

        (world, systems)
    }
}
