#[starknet::component]
pub mod AuctionableComponent {
    use dojo::world::{IWorldDispatcherTrait, WorldStorage};
    use openzeppelin_token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
    use openzeppelin_token::erc721::interface::{IERC721Dispatcher, IERC721DispatcherTrait};
    use starknet::{ContractAddress, get_block_timestamp, get_caller_address};
    use survivor_exchange::constants::{Errors, TEN_POW_18};
    use survivor_exchange::models::auction::{
        Auction, AuctionAssert, AuctionItemTrait, AuctionTrait,
    };
    use survivor_exchange::models::bid::{AssertTrait, BidAssert, BidTrait};
    use survivor_exchange::models::vault::{Vault, VaultTrait};
    use survivor_exchange::store::StoreTrait;
    use survivor_exchange::types::status::AuctionStatus;
    use survivor_exchange::utils::{BEAST_ADDRESS_MAINNET, SURVIVOR_ADDRESS_MAINNET};

    #[storage]
    pub struct Storage {}

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
            name: felt252,
            starting_price: u8,
        ) {
            let mut store = StoreTrait::new(world);
            let seller = get_caller_address();

            let auction_id: u32 = store.world.dispatcher.uuid();
            let mut auction: Auction = AuctionTrait::new(name, starting_price, seller.into());
            auction.auction_id = auction_id;

            store.set_auction(@auction);
            store.auction_created(auction, get_block_timestamp())
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

            //TODO: approve exchange as BEAST spender. I also need to validate

            let item_index = auction.item_count;

            let auction_item = AuctionItemTrait::new_item(
                auction_id, item_index, token_id, collection_address.into(),
            );
            store.set_auction_item(@auction_item);
            auction.item_count += 1;
            store.set_auction(@auction);
        }

        fn start_auction(
            self: @ComponentState<TContractState>,
            world: WorldStorage,
            auction_id: u32,
            duration: u64,
        ) {
            let mut store = StoreTrait::new(world);
            let mut auction = store.auction(auction_id);

            auction.assert_is_seller(get_caller_address().into());
            let current_time = get_block_timestamp();
            auction.activate(duration, current_time);

            let mut vault: Vault = VaultTrait::new(
                auction.auction_id, 0, SURVIVOR_ADDRESS_MAINNET().into(), get_block_timestamp(),
            );
            store.set_vault(@vault);

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

            // Assert auction exists and is active
            auction.assert_does_exist();
            let bidder = get_caller_address();

            // TODO: Check no active rentals on items (query if needed)
            // TODO: Transfer bid_amount to escrow (e.g., via ERC20 dispatcher for real currency)
            //       E.g., eth_dispatcher.transfer(escrow_address, bid_amount.into());

            let survivor_dispatcher = IERC20Dispatcher {
                contract_address: SURVIVOR_ADDRESS_MAINNET(),
            };

            // TODO: calculate the diff between bidder balance and bid amount to transfer.
            let scaled_amount = (bid_amount.into() * TEN_POW_18);
            // Transfer funds to vault.
            survivor_dispatcher
                .transfer_from(
                    get_caller_address(),
                    0x04dc934EAE2fBC336cd4752378c9d2843F2171699Fa2e96500086591A0F543de
                        .try_into()
                        .unwrap(),
                    scaled_amount,
                );

            let mut bid = BidTrait::new(auction_id, bidder.into(), bid_amount);
            store.set_bid(@bid);

            auction.update_bid(bidder.into(), bid_amount, current_time);
            store.bid_placed(@auction, @bid, get_block_timestamp());
            store.set_auction(@auction);
        }

        fn withdraw_bid(
            self: @ComponentState<TContractState>, world: WorldStorage, auction_id: u32,
        ) {
            let bidder = get_caller_address();
            let mut store = StoreTrait::new(world);

            // Fetch entities
            let auction = store.auction(auction_id);
            assert(
                auction.status == AuctionStatus::Active.into()
                    || auction.end_time > get_block_timestamp(),
                'unauthorized',
            );

            let mut bid = store.bid(auction_id, bidder.into());

            bid.assert_bid_amount_not_zero();
            bid.assert_is_bid_owner(bidder.into());
            bid.assert_not_highest_bidder(@auction);

            // Refund from escrow
            // TODO: Transfer bid.amount back to bidder
            // E.g., let escrow_dispatcher = IERC20Dispatcher { contract_address: escrow_address };
            // escrow_dispatcher.transfer(bidder, bid.amount.into());

            // Clear the bid
            let mut cleared_bid = bid;
            cleared_bid.amount = 0;
            store.set_bid(@cleared_bid);
        }

        fn end(self: @ComponentState<TContractState>, world: WorldStorage, auction_id: u32) {
            let mut store = StoreTrait::new(world);
            let current_time = get_block_timestamp();
            let mut auction = store.auction(auction_id);

            // Assert auction exists
            auction.assert_does_exist();
            assert(
                auction.status == AuctionStatus::Active.into(), Errors::AUCTION_NOT_ACTIVE,
            ); // Only end active ones

            let caller = get_caller_address();
            let is_seller = caller.into() == auction.seller;
            let is_expired = current_time >= auction.end_time;

            // Anyone after expiry, or owner anytime
            assert(is_expired || is_seller, Errors::UNAUTHORIZED_TO_END);

            // Owner pays a fine to end auction before expiry.

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

            //let winner = auction.highest_bidder;
            //let seller = auction.seller;
            //let has_winner = winner != 0_felt252; // Assuming 0 means no bids
            //let beast_dispatcher = IERC721Dispatcher { contract_address: BEAST_ADDRESS_MAINNET()
            //};

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
