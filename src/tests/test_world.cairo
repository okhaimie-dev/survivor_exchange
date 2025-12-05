mod test_auction_system {
    use dojo_snf_test::{set_account_address, set_caller_address};
    use snforge_std::start_mock_call;
    //use survivor_exchange::models::vault::Vault;
    use survivor_exchange::store::{Store, StoreTrait};
    use survivor_exchange::systems::auction::IAuctionMarketplaceDispatcherTrait;
    use survivor_exchange::tests::setup;
    use survivor_exchange::tests::setup::tests::Systems;
    use survivor_exchange::utils::{BEAST_ADDRESS_MAINNET, SURVIVOR_ADDRESS_MAINNET};

    fn setup_active_auction() -> (dojo::world::WorldStorage, Systems, u32) {
        set_account_address(setup::tests::OWNER());
        let (world, systems) = setup::tests::spawn_auction();

        let name: ByteArray = "test_auction";
        let starting_price: u32 = 100;
        let mut items = ArrayTrait::new();
        items.append(1);
        items.append(2);
        let items_span = items.span();
        let duration: Option<u64> = Option::Some(3600);

        let owner = setup::tests::OWNER();
        let beast_addr = BEAST_ADDRESS_MAINNET();
        let survivor_addr = SURVIVOR_ADDRESS_MAINNET();
        start_mock_call(beast_addr, selector!("owner_of"), owner);
        set_caller_address(owner);
        let auction_id = systems
            .auction_systems
            .create_auction(name, starting_price, items_span, beast_addr, duration, survivor_addr);

        (world, systems, auction_id)
    }

    #[test]
    #[available_gas(l2_gas: 300000000000)]
    fn test_create_auction() {
        let (world, _dispatcher, auction_id) = setup_active_auction();

        let mut store: Store = StoreTrait::new(world);
        let auction = store.auction(auction_id);

        let owner = setup::tests::OWNER();
        assert(auction.seller == owner.into(), 'wrong seller');
        assert(auction.name == "test_auction", 'wrong name');
        assert(auction.starting_price == 100, 'wrong price');
        assert(auction.item_count == 2, 'wrong item count');
        assert(auction.status == 2, 'not started');
        assert(auction.end_time > 0, 'no end time');
    }

    #[test]
    #[available_gas(l2_gas: 300000000000)]
    fn test_bid() { //let (world, dispatcher, auction_id) = setup_active_auction();
    //let mut store: Store = StoreTrait::new(world);

    //let real_auction = store.auction(1); // Try key 1
    //println!("Real auction_id: {}", real_auction.auction_id);

    //let vault: Vault = store.vault(auction_id); // Use auction_id
    //let vault_id = vault.vault_id;
    //println!("Vault id: {}", vault_id);

    //let bidder = setup::tests::BIDDER();
    //set_account_address(bidder);

    //let bid_amount: u32 = 200;
    //set_caller_address(bidder);

    //let survivor_addr = SURVIVOR_ADDRESS_MAINNET();
    //start_mock_call(survivor_addr, selector!("transfer_from"), '');

    //// Act
    //dispatcher.auction_systems.bid(auction_id, bid_amount);

    //let auction = store.auction(auction_id);
    //let bidder_bid = store.bid(auction_id, bidder.into());

    //assert(auction.current_bid == bid_amount, 'wrong current_bid');
    //assert(auction.highest_bidder == bidder.into(), 'wrong highest_bidder');
    //assert(bidder_bid.amount == bid_amount, 'wrong bid amount');
    //assert(auction.status == 2, 'status changed');
    }
}
