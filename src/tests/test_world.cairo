mod test_auction_system {
    use dojo_snf_test::set_caller_address;
    use survivor_exchange::store::{Store, StoreTrait};
    use survivor_exchange::systems::auction::IAuctionMarketplaceDispatcherTrait;
    use survivor_exchange::tests::mocks::erc721::{
        IMockERC721Dispatcher, IMockERC721DispatcherTrait,
    };
    use survivor_exchange::tests::setup;
    use survivor_exchange::tests::setup::tests::{Context, MockContracts, Systems};

    fn setup_active_auction() -> (dojo::world::WorldStorage, Systems, Context, MockContracts, u32) {
        let (world, systems, context, mocks) = setup::tests::spawn_auction_with_mocks();

        let name: ByteArray = "test_auction";
        let starting_price: u64 = 100;
        let mut items = ArrayTrait::new();
        items.append(1);
        items.append(2);
        let items_span = items.span();
        let duration: Option<u64> = Option::Some(3600);

        let beast_addr = mocks.erc721_address;
        let fee_token = mocks.erc20_address;

        let auction_id = systems
            .auction_systems
            .create_auction(name, starting_price, items_span, beast_addr, duration, fee_token);

        (world, systems, context, mocks, auction_id)
    }

    #[test]
    #[available_gas(l2_gas: 300000000000)]
    fn test_mock_erc721_works() {
        let erc721_addr = setup::tests::deploy_mock_erc721();
        let dispatcher = IMockERC721Dispatcher { contract_address: erc721_addr };
        let owner = dispatcher.owner_of(1_u256);
        assert(owner == setup::tests::OWNER(), 'mock owner wrong');
    }

    #[test]
    #[available_gas(l2_gas: 300000000000)]
    fn test_create_auction() {
        let (world, _dispatcher, context, _mocks, auction_id) = setup_active_auction();

        let owner = context.owner;

        let mut store: Store = StoreTrait::new(world);
        let auction = store.auction(auction_id);

        assert(auction.seller == owner.into(), 'wrong seller');
        assert(auction.name == "test_auction", 'wrong name');
        assert(auction.starting_price == 100, 'wrong price');
        assert(auction.item_count == 2, 'wrong item count');
        assert(auction.status == 2, 'not started');
        assert(auction.end_time > 0, 'no end time');
    }
    //#[test]
//#[available_gas(l2_gas: 300000000000)]
////#[fork("MAINNET_LATEST")]
//fn test_bid_initial() {
//    let (world, systems, _context, _mocks, auction_id) = setup_active_auction();
//    let mut store: Store = StoreTrait::new(world);

    //    let bidder = setup::tests::BIDDER();
//    set_caller_address(bidder);

    //    let initial_bid: u64 = 100;
//    // Mock ERC20 is already deployed and always returns true for transfer_from

    //    // Act: Place initial bid
//    systems.auction_systems.bid(auction_id, initial_bid);

    //    // Assert
//    let auction = store.auction(auction_id);
//    let bidder_bid = store.bid(auction_id, bidder.into());
//    assert(auction.current_bid == initial_bid, 'wrong current_bid');
//    assert(auction.highest_bidder == bidder.into(), 'wrong highest_bidder');
//    assert(bidder_bid.amount == initial_bid, 'wrong bid amount');

    //    // Check vault deposit
//    let vault = store.vault(auction_id);
//    assert(vault.locked_amount == initial_bid.into(), 'wrong vault amount');
//    let share = store.vault_share(auction_id, bidder.into());
//    assert(share.deposited_amount == initial_bid.into(), 'wrong share deposited');
//    assert(share.share_amount == initial_bid.into(), 'wrong share amount');
//}

    //#[test]
//#[available_gas(l2_gas: 300000000000)]
//fn test_increase_bid() {
//    let (world, systems, _context, _mocks, auction_id) = setup_active_auction();
//    let mut store: Store = StoreTrait::new(world);

    //    let bidder = setup::tests::BIDDER();
//    set_caller_address(bidder);

    //    let initial_bid: u64 = 20;
//    let increased_bid: u64 = 70;

    //    // Initial bid
//    systems.auction_systems.bid(auction_id, initial_bid);

    //    // Increase bid
//    systems.auction_systems.bid(auction_id, increased_bid);

    //    // Assert
//    let auction = store.auction(auction_id);
//    let bidder_bid = store.bid(auction_id, bidder.into());
//    assert(auction.current_bid == increased_bid, 'wrong current_bid');
//    assert(auction.highest_bidder == bidder.into(), 'wrong highest_bidder');
//    assert(bidder_bid.amount == increased_bid, 'wrong bid amount');

    //    // Check vault: total deposited should be full increased_bid
//    let vault = store.vault(auction_id);
//    assert(vault.locked_amount == increased_bid.into(), 'wrong vault amount');
//    let share = store.vault_share(auction_id, bidder.into());
//    assert(share.deposited_amount == increased_bid.into(), 'wrong share deposited');
//    assert(share.share_amount == increased_bid.into(), 'wrong share amount');
//}

    //#[test]
//#[available_gas(l2_gas: 300000000000)]
//fn test_withdraw_after_outbid() {
//    let (world, systems, _context, _mocks, auction_id) = setup_active_auction();
//    let mut store: Store = StoreTrait::new(world);

    //    let bidder1 = setup::tests::BIDDER();
//    let bidder2 = setup::tests::BIDDER2();
//    set_caller_address(bidder1);

    //    let bid1: u64 = 20;
//    let higher_bid: u64 = 50;

    //    // Bidder1 places initial bid
//    systems.auction_systems.bid(auction_id, bid1);

    //    // Bidder2 outbids
//    set_caller_address(bidder2);
//    systems.auction_systems.bid(auction_id, higher_bid);

    //    // Bidder1 withdraws (now outbid)
//    set_caller_address(bidder1);
//    systems.auction_systems.withdraw_bid(auction_id);

    //    // Assert: Full refund to bidder1
//    let bidder1_bid = store.bid(auction_id, bidder1.into());
//    assert(bidder1_bid.amount == 0, 'bid not cleared');

    //    let vault = store.vault(auction_id);
//    assert(
//        vault.locked_amount == higher_bid.into(), 'wrong vault after withdraw',
//    ); // Only bidder2's bid remains

    //    let share1 = store.vault_share(auction_id, bidder1.into());
//    assert(share1.share_amount == 0, 'share not zero');
//    assert(share1.claimed == true, 'share not claimed');
//}

    //#[test]
//#[available_gas(l2_gas: 300000000000)]
//fn test_increase_then_withdraw_full_refund() {
//    let (world, systems, _context, _mocks, auction_id) = setup_active_auction();
//    let mut store: Store = StoreTrait::new(world);

    //    let bidder = setup::tests::BIDDER();
//    set_caller_address(bidder);

    //    let initial_bid: u64 = 20;
//    let increased_bid: u64 = 70;

    //    // Initial bid
//    systems.auction_systems.bid(auction_id, initial_bid);

    //    // Increase bid (deposits diff=50)
//    systems.auction_systems.bid(auction_id, increased_bid);

    //    // Simulate outbid to allow withdraw
//    let bidder2 = setup::tests::BIDDER2();
//    set_caller_address(bidder2);
//    let higher_bid: u64 = 100;
//    systems.auction_systems.bid(auction_id, higher_bid);

    //    // Now bidder withdraws full 70
//    set_caller_address(bidder);
//    systems.auction_systems.withdraw_bid(auction_id);

    //    // Assert full cleared
//    let bidder_bid = store.bid(auction_id, bidder.into());
//    assert(bidder_bid.amount == 0, 'bid not cleared');

    //    let share = store.vault_share(auction_id, bidder.into());
//    assert(share.share_amount == 0, 'share not zero');
//    assert(share.deposited_amount == 0, 'deposited not zero');

    //    let vault = store.vault(auction_id);
//    assert(vault.locked_amount == higher_bid.into(), 'wrong vault final');
//}
}
