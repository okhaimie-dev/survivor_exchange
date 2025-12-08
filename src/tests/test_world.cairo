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
        let starting_price: u64 = 100;
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
    fn test_bid_initial() {
        let (world, systems, auction_id) = setup_active_auction();
        let mut store: Store = StoreTrait::new(world);

        let bidder = setup::tests::BIDDER();
        set_caller_address(bidder);

        let initial_bid: u64 = 100;
        let usdc_addr = survivor_exchange::utils::USDC_ADDRESS_MAINNET();
        start_mock_call(usdc_addr, selector!("transfer_from"), 0);

        // Act: Place initial bid
        systems.auction_systems.bid(auction_id, initial_bid);

        // Assert
        let auction = store.auction(auction_id);
        let bidder_bid = store.bid(auction_id, bidder.into());
        assert(auction.current_bid == initial_bid, 'wrong current_bid');
        assert(auction.highest_bidder == bidder.into(), 'wrong highest_bidder');
        assert(bidder_bid.amount == initial_bid, 'wrong bid amount');

        // Check vault deposit
        let vault = store.vault(auction_id);
        assert(vault.locked_amount == initial_bid.into(), 'wrong vault amount');
        let share = store.vault_share(auction_id, bidder.into());
        assert(share.deposited_amount == initial_bid.into(), 'wrong share deposited');
        assert(share.share_amount == initial_bid.into(), 'wrong share amount');
    }

    #[test]
    #[available_gas(l2_gas: 300000000000)]
    fn test_increase_bid() {
        let (world, systems, auction_id) = setup_active_auction();
        let mut store: Store = StoreTrait::new(world);

        let bidder = setup::tests::BIDDER();
        set_caller_address(bidder);

        let initial_bid: u64 = 20;
        let increased_bid: u64 = 70;
        let diff: u64 = increased_bid - initial_bid;
        let usdc_addr = survivor_exchange::utils::USDC_ADDRESS_MAINNET();

        // Initial bid
        start_mock_call(usdc_addr, selector!("transfer_from"), 0);
        systems.auction_systems.bid(auction_id, initial_bid);

        // Increase bid
        start_mock_call(usdc_addr, selector!("transfer_from"), 0);
        systems.auction_systems.bid(auction_id, increased_bid);

        // Assert
        let auction = store.auction(auction_id);
        let bidder_bid = store.bid(auction_id, bidder.into());
        assert(auction.current_bid == increased_bid, 'wrong current_bid');
        assert(auction.highest_bidder == bidder.into(), 'wrong highest_bidder');
        assert(bidder_bid.amount == increased_bid, 'wrong bid amount');

        // Check vault: total deposited should be full increased_bid
        let vault = store.vault(auction_id);
        assert(vault.locked_amount == increased_bid.into(), 'wrong vault amount');
        let share = store.vault_share(auction_id, bidder.into());
        assert(share.deposited_amount == increased_bid.into(), 'wrong share deposited');
        assert(share.share_amount == increased_bid.into(), 'wrong share amount');
    }

    #[test]
    #[available_gas(l2_gas: 300000000000)]
    fn test_withdraw_after_outbid() {
        let (world, systems, auction_id) = setup_active_auction();
        let mut store: Store = StoreTrait::new(world);

        let bidder1 = setup::tests::BIDDER();
        let bidder2 = 0x02.try_into().unwrap(); // Another bidder
        set_caller_address(bidder1);

        let bid1: u64 = 20;
        let higher_bid: u64 = 50;
        let usdc_addr = survivor_exchange::utils::USDC_ADDRESS_MAINNET();

        // Bidder1 places initial bid
        start_mock_call(usdc_addr, selector!("transfer_from"), 0);
        systems.auction_systems.bid(auction_id, bid1);

        // Bidder2 outbids
        set_caller_address(bidder2);
        start_mock_call(usdc_addr, selector!("transfer_from"), 0);
        systems.auction_systems.bid(auction_id, higher_bid);

        // Bidder1 withdraws (now outbid)
        set_caller_address(bidder1);
        systems.auction_systems.withdraw_bid(auction_id);

        // Assert: Full refund to bidder1
        let bidder1_bid = store.bid(auction_id, bidder1.into());
        assert(bidder1_bid.amount == 0, 'bid not cleared');

        let vault = store.vault(auction_id);
        assert(vault.locked_amount == higher_bid.into(), 'wrong vault after withdraw'); // Only bidder2's bid remains

        let share1 = store.vault_share(auction_id, bidder1.into());
        assert(share1.share_amount == 0, 'share not zero');
        assert(share1.claimed == true, 'share not claimed');
    }

    #[test]
    #[available_gas(l2_gas: 300000000000)]
    fn test_increase_then_withdraw_full_refund() {
        let (world, systems, auction_id) = setup_active_auction();
        let mut store: Store = StoreTrait::new(world);

        let bidder = setup::tests::BIDDER();
        set_caller_address(bidder);

        let initial_bid: u64 = 20;
        let increased_bid: u64 = 70;
        let usdc_addr = survivor_exchange::utils::USDC_ADDRESS_MAINNET();

        // Initial bid
        start_mock_call(usdc_addr, selector!("transfer_from"), 0);
        systems.auction_systems.bid(auction_id, initial_bid);

        // Increase bid (deposits diff=50)
        start_mock_call(usdc_addr, selector!("transfer_from"), 0);
        systems.auction_systems.bid(auction_id, increased_bid);

        // Simulate outbid (or end auction) to allow withdraw
        // For simplicity, assume outbid by another, but to test withdraw, we can end auction if needed
        // But withdraw checks !highest or !active or expired
        // To test, let's mock time or outbid

        let bidder2 = 0x02.try_into().unwrap();
        set_caller_address(bidder2);
        let higher_bid: u64 = 100;
        start_mock_call(usdc_addr, selector!("transfer_from"), 0);
        systems.auction_systems.bid(auction_id, higher_bid);

        // Now bidder withdraws full 70
        set_caller_address(bidder);
        systems.auction_systems.withdraw_bid(auction_id);

        // Assert full cleared
        let bidder_bid = store.bid(auction_id, bidder.into());
        assert(bidder_bid.amount == 0, 'bid not cleared');

        let share = store.vault_share(auction_id, bidder.into());
        assert(share.share_amount == 0, 'share not zero');
        assert(share.deposited_amount == 0, 'deposited not zero');

        let vault = store.vault(auction_id);
        assert(vault.locked_amount == higher_bid.into(), 'wrong vault final');
    }
}
