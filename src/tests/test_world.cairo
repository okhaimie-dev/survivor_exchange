mod test_init_market {
    use dojo_snf_test::{set_account_address, set_caller_address};
    use snforge_std::start_mock_call;
    use survivor_exchange::store::{Store, StoreTrait};
    use survivor_exchange::systems::auction::IAuctionMarketplaceDispatcherTrait;
    use survivor_exchange::tests::setup;
    use survivor_exchange::utils::BEAST_ADDRESS_MAINNET;

    #[test]
    #[available_gas(l2_gas: 300000000000)]
    fn test_create_auction() {
        set_account_address(setup::tests::OWNER());
        let (world, systems) = setup::tests::spawn_auction();

        let name: felt252 = 'test_auction';
        let starting_price: u32 = 100;
        let mut items = ArrayTrait::new();
        items.append(1);
        items.append(2);
        let items = items.span();
        let duration: Option<u64> = Option::Some(3600);

        let owner = setup::tests::OWNER();
        let beast_addr = BEAST_ADDRESS_MAINNET();

        start_mock_call(beast_addr, selector!("owner_of"), owner);

        set_caller_address(setup::tests::OWNER());

        systems.auction_systems.create_auction(name, starting_price, items, beast_addr, duration);

        let mut store: Store = StoreTrait::new(world);
        let auction = store.auction(0);

        assert(auction.item_count == 2, 'wrong item count');
        assert(auction.starting_price == starting_price, 'wrong price');
        assert(auction.status == 2, 'not started');
    }
}
