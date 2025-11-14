#[cfg(test)]
mod tests {
    use dojo::world::{WorldStorage, WorldStorageTrait, world};
    use dojo_cairo_test::{
        ContractDef, ContractDefTrait, NamespaceDef, TestResource, spawn_test_world,
    };
    use survivor_exchange::constants::DEFAULT_NS;
    use survivor_exchange::models::index::{m_Auction, m_AuctionItem, m_Bid, m_Rental};
    use survivor_exchange::systems::auction::{IAuctionMarketplaceDispatcher, auction_systems};

    #[derive(Drop)]
    struct Systems {
        auction_systems: IAuctionMarketplaceDispatcher,
    }

    fn namespace_def() -> NamespaceDef {
        let ndef = NamespaceDef {
            namespace: DEFAULT_NS(),
            resources: [
                TestResource::Model(m_Bid::TEST_CLASS_HASH),
                TestResource::Model(m_Auction::TEST_CLASS_HASH),
                TestResource::Model(m_AuctionItem::TEST_CLASS_HASH),
                TestResource::Model(m_Rental::TEST_CLASS_HASH),
                TestResource::Contract(auction_systems::TEST_CLASS_HASH),
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

    fn spawn_game() -> (WorldStorage, Systems) {
        // [Setup] World
        let namespace_def = namespace_def();
        let world = spawn_test_world(world::TEST_CLASS_HASH, [namespace_def].span());
        //world.sync_perms_and_inits(setup_contracts());
        // [Setup] Systems
        let (auction_address, _) = world.dns(@"auction_systems").unwrap();
        let systems = Systems {
            auction_systems: IAuctionMarketplaceDispatcher { contract_address: auction_address },
        };

        (world, systems)
    }
}
