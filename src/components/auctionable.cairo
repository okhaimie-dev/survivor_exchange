#[starknet::component]
pub mod AuctionableComponent {
    use dojo::world::{IWorldDispatcherTrait, WorldStorage, WorldStorageTrait};
    use openzeppelin_token::erc721::interface::{IERC721Dispatcher, IERC721DispatcherTrait};
    use starknet::{ContractAddress, get_block_timestamp, get_caller_address};
    use survivor_exchange::constants::Errors;
    use survivor_exchange::models::auction::{
        Auction, AuctionAssert, AuctionItemTrait, AuctionTrait,
    };
    use survivor_exchange::models::bid::{AssertTrait, BidAssert, BidTrait};
    use survivor_exchange::models::vault::{Vault, VaultTrait};
    use survivor_exchange::store::StoreTrait;
    use survivor_exchange::systems::vault::{IVaultDispatcher, IVaultDispatcherTrait};
    use survivor_exchange::types::status::AuctionStatus;
    use survivor_exchange::utils::{BEAST_ADDRESS_MAINNET, USDC_ADDRESS_MAINNET};

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
            name: ByteArray,
            starting_price: u32,
            items: Span<u32>,
            collection: ContractAddress,
            duration: Option<u64>,
            fee_token: ContractAddress,
        ) -> u32 {
            assert(items.len() >= 1 && items.len() <= 75, Errors::INVALID_ITEMS_COUNT);

            let mut store = StoreTrait::new(world);
            let seller = get_caller_address();
            let auction_id: u32 = store.world.dispatcher.uuid();

            let mut auction: Auction = AuctionTrait::new(
                name, starting_price, seller.into(), fee_token.into(),
            );
            auction.auction_id = auction_id;
            store.set_auction(@auction);

            let mut item_index = 0;
            let collection_dispatcher = IERC721Dispatcher { contract_address: collection };
            for token_id in items {
                assert(
                    seller == collection_dispatcher.owner_of((*token_id).into()),
                    Errors::NOT_BEAST_OWNER,
                );

                // TODO: Rentals check: let rental = store.rental(*token_id);
                // rental.assert_not_active();

                self.add_item(world, auction_id, *token_id, collection);
                item_index += 1;
            }

            //store.auction_items_added(auction_id, item_index); // Post-items event
            store.auction_created(auction, get_block_timestamp()); // Now with items

            if let Option::Some(dur) = duration {
                self.start_auction(world, auction_id, dur);
            }

            auction_id
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
                auction_id, 0, USDC_ADDRESS_MAINNET().into(), get_block_timestamp(),
            );
            store.set_vault(@vault);

            store.set_auction(@auction);
        }

        fn bid(
            self: @ComponentState<TContractState>,
            world: WorldStorage,
            auction_id: u32,
            bid_amount: u32,
        ) {
            let mut store = StoreTrait::new(world);
            let current_time = get_block_timestamp();
            let mut auction = store.auction(auction_id);

            auction.assert_does_exist();
            let bidder = get_caller_address();

            auction.assert_bidder_not_seller(bidder.into());

            let mut prev_bid = store.bid(auction_id, bidder.into());
            let prev_amount = prev_bid.amount;
            let new_amount = bid_amount;
            if new_amount > prev_amount {
                let diff = (new_amount - prev_amount).into();
                let (vault_token_address, _) = world.dns(@"vault_systems").unwrap();
                let vault_dispatcher = IVaultDispatcher { contract_address: vault_token_address };
                vault_dispatcher.deposit(auction.auction_id, diff, bidder);
            }

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

            let auction = store.auction(auction_id);
            assert(
                auction.status == AuctionStatus::Active.into()
                    || get_block_timestamp() < auction.end_time,
                Errors::AUCTION_NOT_ACTIVE,
            );

            let mut bid = store.bid(auction_id, bidder.into());
            bid.assert_bid_amount_not_zero();
            bid.assert_is_bid_owner(bidder.into());
            bid.assert_not_highest_bidder(@auction);

            // Refund via vault (raw bid amount)
            let amount = bid.amount.into();
            let (vault_token_address, _) = world.dns(@"vault_systems").unwrap();
            let vault_dispatcher = IVaultDispatcher { contract_address: vault_token_address };
            vault_dispatcher.withdraw(auction_id, bidder, amount); // to=bidder (default)

            // Clear bid
            let mut cleared_bid = BidTrait::new(auction_id, bidder.into(), 0);
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
            let current_time = get_block_timestamp();
            let mut auction = store.auction(auction_id);
            let status = auction.status;

            // Assert auction exists and is not already settled
            auction.assert_does_exist();
            assert(status != AuctionStatus::Settled.into(), Errors::AUCTION_ALREADY_SETTLED);

            // Auto-end if active and expired (mimics end() logic for post-expiry)
            if status == AuctionStatus::Active.into() {
                assert(
                    current_time >= auction.end_time, Errors::AUCTION_NOT_ENDED,
                ); // Revert if not expired
                // TODO: Check no active rentals on items before ending/settling

                auction.status = AuctionStatus::Ended.into();
                store.set_auction(@auction); // Persist the Ended status
                // TODO: Emit AuctionEnded event (auction_id, end_time)
            // world.emit_event(AuctionEnded { auction_id, end_time: auction.end_time });
            } else {
                // If not Active, must already be Ended
                assert(status == AuctionStatus::Ended.into(), Errors::AUCTION_NOT_ENDED);
            }

            // Reload auction after potential update (in case of external changes, but unlikely)
            auction = store.auction(auction_id);

            let winner: ContractAddress = auction.highest_bidder.try_into().unwrap();
            let seller: ContractAddress = auction.seller.try_into().unwrap();
            let zero_address: ContractAddress = 0.try_into().unwrap();
            let has_winner = winner != zero_address;
            let (vault_system_address, _) = world.dns(@"vault_systems").unwrap();
            let vault_dispatcher = IVaultDispatcher { contract_address: vault_system_address };

            if has_winner {
                // Withdraw funds to seller via disbursement
                let amount = auction.current_bid.into();

                // Check no active rentals on items before transferring (if not already checked
                // above)
                // Note: If rentals checked in auto-end, skip here to avoid double-check; otherwise,
                // add it

                // Transfer items to winner
                let mut i: u32 = 0;
                while i < auction.item_count {
                    let item = store.auction_item(auction.auction_id, i);
                    let item_dispatcher = IERC721Dispatcher {
                        contract_address: item.contract_address.try_into().unwrap(),
                    };
                    item_dispatcher.transfer_from(seller, winner, item.token_id.into());
                    i += 1;
                }

                vault_dispatcher.disburse_to_seller(auction.auction_id, seller, amount);
            }
            // If no winner, items stay with seller; no fund transfer (vault should be empty or
            // withdrawable separately)

            // Update to Settled
            auction.status = AuctionStatus::Settled.into();
            store.set_auction(@auction);
        }
    }
}
