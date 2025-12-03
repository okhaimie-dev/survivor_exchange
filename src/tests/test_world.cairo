mod test_init_market {
    use dojo_snf_test::set_caller_address;
    use starknet::ContractAddress;
    use survivor_exchange::systems::auction::IAuctionMarketplaceDispatcherTrait;
    use survivor_exchange::tests::setup;
    use survivor_exchange::utils::SURVIVOR_ADDRESS_MAINNET;

    #[test]
    #[available_gas(l2_gas: 300000000000)]
    fn test_create_auction() {
        set_caller_address(setup::tests::OWNER());
        let (_world, systems) = setup::tests::spawn_auction();

        let name: felt252 = 'test_auction';
        let starting_price: u32 = 100;
        let mut items = ArrayTrait::new();
        items.append(1);
        items.append(2);
        let items = items.span();
        let collection: ContractAddress = SURVIVOR_ADDRESS_MAINNET();
        let duration: Option<u64> = Option::Some(3600);

        systems.auction_systems.create_auction(name, starting_price, items, collection, duration);
    }
}
