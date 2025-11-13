#[starknet::component]
pub mod AuctionableComponent {
    // Starknet imports

    // Dojo imports

    // Internal imports

    use dojo::world::WorldStorage;
    use openzeppelin_token::erc721::interface::{IERC721Dispatcher, IERC721DispatcherTrait};
    use starknet::{ContractAddress, get_block_timestamp, get_caller_address};
    use survivor_exchange::constants::Errors;
    use survivor_exchange::models::auction::{
        Auction, AuctionAssert, AuctionItemTrait, AuctionTrait,
    };
    use survivor_exchange::store::StoreTrait;
    use survivor_exchange::types::status::AuctionStatus;
    use survivor_exchange::utils::BEAST_ADDRESS_MAINNET;


    // Storage

    #[storage]
    pub struct Storage {}

    // Events

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {}

    #[generate_trait]
    pub impl InternalImpl<
        TContractState, +HasComponent<TContractState>,
    > of InternalTrait<TContractState> {
        fn create(
            self: @ComponentState<TContractState>,
            world: WorldStorage,
            auction_id: u32,
            name: felt252,
            starting_price: u8,
        ) {
            let mut store = StoreTrait::new(world);
            // Check if there are no rentals in auction items.
            let owner = get_caller_address();
            let current_timestamp = get_block_timestamp();
            let mut auction: Auction = AuctionTrait::new(
                auction_id, name, starting_price, owner.into(), current_timestamp,
            );

            store.set_auction(@auction);
        }

        fn add_item(
            self: @ComponentState<TContractState>,
            world: WorldStorage,
            auction_id: u32,
            token_id: u32,
            collection_address: ContractAddress,
        ) {
            let mut store = StoreTrait::new(world);
            // TODO: Check if there are no rentals in auction items.
            let mut auction = store.auction(auction_id);
            auction.assert_is_draft();
            let beast_dispatcher = IERC721Dispatcher { contract_address: BEAST_ADDRESS_MAINNET() };
            let beast_owner = beast_dispatcher.owner_of(token_id.into());
            assert(get_caller_address() == beast_owner, Errors::NOT_BEAST_OWNER);

            let item_index = auction.item_count;

            let auction_item = AuctionItemTrait::new_item(
                auction_id, item_index, token_id, collection_address.into(),
            );
            store.set_auction_item(@auction_item);
            auction.item_count += 1;
            store.set_auction(@auction);
        }

        fn bid(
            self: @ComponentState<TContractState>,
            world: WorldStorage,
            auction_id: u32,
            bid_amount: u8,
        ) {
            let mut store = StoreTrait::new(world);
            let current_time = get_block_timestamp();
            let mut auction = store.auction(auction_id);
            let status = auction.status.into();

            // Assert auction exists and is active
            auction.assert_does_exist();
            assert(status == AuctionStatus::Active, Errors::AUCTION_NOT_ACTIVE);
            assert(current_time < auction.end_time, Errors::AUCTION_EXPIRED);
            assert(bid_amount > auction.current_bid, Errors::BID_TOO_LOW);

            // For first bid, ensure >= starting_price (though >0 covers if current_bid=0)
            let caller = get_caller_address();

            // TODO: Check no active rentals on items (query if needed)
            // TODO: Transfer bid_amount to escrow (e.g., via ERC20 dispatcher for real currency)
            //       E.g., eth_dispatcher.transfer(escrow_address, bid_amount.into());
            // TODO: Refund previous highest_bidder if exists (transfer back current_bid)

            // Update auction state
            auction.current_bid = bid_amount;
            auction.highest_bidder = caller.into();
            store.set_auction(@auction);
            // TODO: Emit BidPlaced event (auction_id, caller, bid_amount)
        }

        fn end(self: @ComponentState<TContractState>, world: WorldStorage, auction_id: u32) {
            let mut store = StoreTrait::new(world);
            let current_time = get_block_timestamp();
            let mut auction = store.auction(auction_id);
            let status = auction.status;

            // Assert auction exists
            auction.assert_does_exist();
            assert(
                status == AuctionStatus::Active.into(), Errors::AUCTION_NOT_ACTIVE,
            ); // Only end active ones

            let caller = get_caller_address();
            let is_owner = caller.into() == auction.owner;
            let is_expired = current_time >= auction.end_time;

            // Anyone after expiry, or owner anytime
            assert(is_expired || is_owner, Errors::UNAUTHORIZED_TO_END);

            // TODO: Check no active rentals on items before ending

            // Update to Ended
            auction.status = AuctionStatus::Ended.into();
            store.set_auction(@auction);
            // TODO: Emit AuctionEnded event (auction_id, end_time)
        }

        fn settle(self: @ComponentState<TContractState>, world: WorldStorage, auction_id: u32) {
            let mut store = StoreTrait::new(world);
            let mut auction = store.auction(auction_id);
            let status = auction.status;

            // Assert auction exists and is ended (not active or settled)
            auction.assert_does_exist();
            assert(status == AuctionStatus::Ended.into(), Errors::AUCTION_NOT_ENDED);

            let winner = auction.highest_bidder;
            let owner = auction.owner;
            let has_winner = winner != 0_felt252; // Assuming 0 means no bids
            let beast_dispatcher = IERC721Dispatcher { contract_address: BEAST_ADDRESS_MAINNET() };

            // Transfer items (loop over auction items; assumes you can fetch via
            // store.auction_items(auction_id))
            // TODO: Implement item iteration (e.g., for i in 0..auction.item_count { let item =
            // store.auction_item(auction_id, i); ... })
            // For each item:
            // if has_winner {
            //     beast_dispatcher.transfer_from(self.marketplace_address(), winner,
            //     item.token_id.into());  // Escrow -> winner
            // } else {
            //     beast_dispatcher.transfer_from(self.marketplace_address(), owner,
            //     item.token_id.into());  // Back to owner
            // }

            // Transfer funds to owner (stub: current_bid as u8; real: ERC20 transfer)
            // TODO: E.g., eth_dispatcher.transfer(owner, auction.current_bid.into());
            // If no winner, refund last bidder if needed (but usually not)

            // Update to Settled
            auction.status = AuctionStatus::Settled.into();
            store.set_auction(@auction);
            // TODO: Emit AuctionSettled event (auction_id, winner, final_price)
        }
    }
}
