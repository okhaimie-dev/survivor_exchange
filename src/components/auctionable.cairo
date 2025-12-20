#[starknet::component]
pub mod AuctionableComponent {
    use dojo::world::{IWorldDispatcherTrait, WorldStorage, WorldStorageTrait};
    use openzeppelin_token::erc721::interface::{IERC721Dispatcher, IERC721DispatcherTrait};
    use starknet::{ContractAddress, get_block_timestamp, get_caller_address};
    use survivor_exchange::constants::Errors;
    use survivor_exchange::interfaces::ierc2981::{IERC2981Dispatcher, IERC2981DispatcherTrait};
    use survivor_exchange::models::auction::{
        Auction, AuctionAssert, AuctionItemTrait, AuctionTrait,
    };
    use survivor_exchange::models::bid::{AssertTrait, BidAssert, BidTrait};
    use survivor_exchange::models::index::{AuctionItem, ListedToken};
    use survivor_exchange::models::vault::{Vault, VaultTrait};
    use survivor_exchange::store::StoreTrait;
    use survivor_exchange::systems::vault::{IVaultDispatcher, IVaultDispatcherTrait};
    use survivor_exchange::types::status::AuctionStatus;
    use survivor_exchange::utils::USDC_ADDRESS_MAINNET;

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
            starting_price: u64,
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

            self.add_items(world, auction_id, items, collection);

            let auction = store.auction(auction_id);
            store.auction_created(auction, get_block_timestamp());

            if let Option::Some(dur) = duration {
                self.start_auction(world, auction_id, dur);
            }

            auction_id
        }

        /// Adds multiple items to an auction in batch.
        /// Validates ownership and rentals for all items upfront.
        /// Assumes all items are from the same collection for simplicity; extend if needed.
        fn add_items(
            self: @ComponentState<TContractState>,
            world: WorldStorage,
            auction_id: u32,
            token_ids: Span<u32>,
            collection: ContractAddress,
        ) {
            let mut store = StoreTrait::new(world);
            let mut auction = store.auction(auction_id);
            auction.assert_is_draft();

            let caller = get_caller_address();
            let collection_dispatcher = IERC721Dispatcher { contract_address: collection };

            // Batch ownership checks
            let mut item_index = auction.item_count;
            let mut i: usize = 0;
            while i < token_ids.len() {
                let token_id = *token_ids[i];
                assert(
                    caller == collection_dispatcher.owner_of(token_id.into()),
                    Errors::NOT_BEAST_OWNER,
                );

                let listed_token = store.listed_token(collection.into(), token_id);
                assert(listed_token.auction_id == 0, Errors::TOKEN_ALREADY_LISTED);

                // TODO: Rentals check
                // TODO: Approve exchange as spender for each beast (call set_approval_for_all if
                // not already)
                // let exchange_address = get_contract_address();  // Or fetch from config
                // collection_dispatcher.set_approval_for_all(exchange_address, true);  // But this
                // is per-collection, not per-token

                i += 1;
            }

            // Add all items
            i = 0;
            while i < token_ids.len() {
                let token_id = *token_ids[i];
                let auction_item: AuctionItem = AuctionItemTrait::new_item(
                    auction_id, item_index, token_id, collection.into(),
                );
                store.set_auction_item(@auction_item);
                item_index += 1;
                i += 1;
            }

            // List tokens
            let mut i: usize = 0;
            while i < token_ids.len() {
                let token_id = *token_ids[i];
                let listed_token = ListedToken {
                    contract_address: collection.into(), token_id, auction_id,
                };
                store.set_listed_token(@listed_token);
                i += 1;
            }
            auction.item_count = item_index;
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
            bid_amount: u64,
        ) {
            let mut store = StoreTrait::new(world);
            let current_time = get_block_timestamp();
            let mut auction = store.auction(auction_id);

            auction.assert_does_exist();
            let bidder = get_caller_address();
            let bidder_felt = bidder.into();
            auction.assert_bidder_not_seller(bidder_felt);

            // Early checks independent of bid amount
            let auction_ref: @Auction = @auction;
            assert(auction_ref.is_active(), Errors::AUCTION_NOT_ACTIVE);
            auction_ref.assert_not_expired(current_time);

            // Get bidder's previous bid
            let bidder_prev_bid = store.bid(auction_id, bidder_felt);
            let prev_amount = bidder_prev_bid.amount;

            // Compute new total bid and deposit diff based on highest bidder status
            let is_highest_bidder = auction.highest_bidder == bidder_felt;
            let mut new_total_bid: u64 = 0;
            let mut deposit_diff: u64 = 0;
            if is_highest_bidder {
                new_total_bid = auction.current_bid + bid_amount;
                deposit_diff = bid_amount;
            } else {
                assert(bid_amount > prev_amount, Errors::BID_TOO_LOW);
                new_total_bid = bid_amount;
                deposit_diff = bid_amount - prev_amount;
            }
            assert(deposit_diff > 0_u64, Errors::BID_TOO_LOW);

            // Final bid validation
            auction_ref.assert_bid_not_low(new_total_bid);

            // Capture previous highest bidder **before** changes
            let prev_highest_felt = auction.highest_bidder;

            // Deposit the diff to vault **first**
            let diff = deposit_diff.into();
            let (vault_token_address, _) = world.dns(@"vault_systems").unwrap();
            let vault_dispatcher = IVaultDispatcher { contract_address: vault_token_address };
            vault_dispatcher.deposit(auction.auction_id, diff, bidder);

            // Update bidder's bid model
            let mut bid = BidTrait::new(auction_id, bidder_felt, new_total_bid);
            store.set_bid(@bid);

            // Update auction (now reflects new highest bidder/current_bid)
            auction.update_bid(bidder_felt, new_total_bid, current_time);
            store.bid_placed(@auction, @bid, get_block_timestamp());
            store.set_auction(@auction);

            // **Now** refund previous highest bidder (vault will see updated auction)
            if prev_highest_felt != 0 && !is_highest_bidder {
                let prev_highest = prev_highest_felt.try_into().unwrap();
                let prev_share_balance = vault_dispatcher
                    .share_balance(auction.auction_id, prev_highest);
                if prev_share_balance > 0_u256 {
                    vault_dispatcher
                        .withdraw(
                            auction.auction_id, prev_highest, prev_highest, prev_share_balance,
                        );
                    let mut cleared_bid = BidTrait::new(auction_id, prev_highest_felt, 0_u64);
                    store.set_bid(@cleared_bid);
                }
            }
        }

        fn withdraw_bid(
            self: @ComponentState<TContractState>, world: WorldStorage, auction_id: u32,
        ) {
            let bidder = get_caller_address();
            let mut store = StoreTrait::new(world);

            let auction = store.auction(auction_id);
            auction.assert_does_exist();

            // Get bidder's bid for ownership/consistency checks
            let bid = store.bid(auction_id, bidder.into());
            bid.assert_bid_amount_not_zero();
            bid.assert_is_bid_owner(bidder.into());
            bid.assert_not_highest_bidder(@auction);

            // Use *actual* vault shares to avoid mismatch (bid.amount may desync)
            let (vault_token_address, _) = world.dns(@"vault_systems").unwrap();
            let vault_dispatcher = IVaultDispatcher { contract_address: vault_token_address };
            let amount = vault_dispatcher.share_balance(auction_id, bidder);
            assert(amount > 0.into(), Errors::INSUFFICIENT_SHARES); // Reuse error; prevents noop

            // Vault handles auction status/conditions (active/outbid/expired)
            vault_dispatcher.withdraw(auction_id, bidder, bidder, amount); // owner, to

            // Clear bid record
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
            assert(is_seller || is_expired, Errors::UNAUTHORIZED_TO_END);

            let (vault_system_address, _) = world.dns(@"vault_systems").unwrap();
            let vault_dispatcher = IVaultDispatcher { contract_address: vault_system_address };
            let has_winner = auction.highest_bidder != 0;

            if is_seller && !is_expired {
                if has_winner {
                    let winner: ContractAddress = auction.highest_bidder.try_into().unwrap();
                    let shares = vault_dispatcher.share_balance(auction.auction_id, winner);
                    if shares > 0_u256 {
                        vault_dispatcher.withdraw(auction.auction_id, winner, winner, shares);
                    }

                    let mut cleared_bid = BidTrait::new(auction.auction_id, winner.into(), 0_u64);
                    store.set_bid(@cleared_bid);
                }

                // TODO: Check no active rentals on items before ending

                auction.status = AuctionStatus::Canceled.into();
                store.set_auction(@auction);
            } else {
                auction.status = AuctionStatus::Ended.into();
                store.set_auction(@auction);
            }
        }

        fn settle(self: @ComponentState<TContractState>, world: WorldStorage, auction_id: u32) {
            let mut store = StoreTrait::new(world);
            let current_time = get_block_timestamp();
            let mut auction = store.auction(auction_id);
            let status = auction.status;

            // Assert auction exists and is not already settled
            auction.assert_does_exist();
            assert(status != AuctionStatus::Settled.into(), Errors::AUCTION_ALREADY_SETTLED);
            assert(status != AuctionStatus::Canceled.into(), Errors::AUCTION_ALREADY_CANCELED);

            // Auto-end if active and expired (mimics end() logic for post-expiry)
            if status == AuctionStatus::Active.into() {
                assert(current_time >= auction.end_time, Errors::AUCTION_NOT_ENDED);

                auction.status = AuctionStatus::Ended.into();
                store.set_auction(@auction);
            } else {
                // If not Active, must already be Ended
                assert(status == AuctionStatus::Ended.into(), Errors::AUCTION_NOT_ENDED);
            }

            // Reload auction after potential update
            auction = store.auction(auction_id);

            let winner: ContractAddress = auction.highest_bidder.try_into().unwrap();
            let seller: ContractAddress = auction.seller.try_into().unwrap();
            let auction_contract: ContractAddress = starknet::get_contract_address();
            let zero_address: ContractAddress = 0.try_into().unwrap();
            let has_winner = winner != zero_address;
            let (vault_system_address, _) = world.dns(@"vault_systems").unwrap();
            let vault_dispatcher = IVaultDispatcher { contract_address: vault_system_address };

            let mut can_settle: bool = true;
            if has_winner {
                // Pre-flight: check all items transferable
                let mut i: u32 = 0;
                while i < auction.item_count {
                    let item = store.auction_item(auction.auction_id, i);
                    let nft_dispatcher = IERC721Dispatcher {
                        contract_address: item.contract_address.try_into().unwrap(),
                    };
                    let owner = nft_dispatcher.owner_of(item.token_id.into());
                    if owner != seller {
                        can_settle = false;
                        break;
                    }
                    let approved = nft_dispatcher.get_approved(item.token_id.into());
                    let approved_for_all = nft_dispatcher
                        .is_approved_for_all(seller, auction_contract);
                    if !(approved == auction_contract || approved_for_all) {
                        can_settle = false;
                        break;
                    }
                    i += 1;
                }

                if can_settle {
                    // Withdraw funds to seller via disbursement
                    let amount = auction.current_bid.into();

                    // Calculate royalty using sample item from the auction
                    let sample_item = store.auction_item(auction.auction_id, 0);
                    let royalty_dispatcher = IERC2981Dispatcher {
                        contract_address: sample_item.contract_address.try_into().unwrap(),
                    };
                    let (royalty_receiver, royalty_amount) = royalty_dispatcher
                        .royalty_info(sample_item.token_id.into(), amount);
                    let net_amount = if royalty_amount != 0 {
                        // Pay royalty via vault
                        // Pay royalty via vault (vault_id: auction.auction_id, to:
                        // royalty_receiver, amount: royalty_amount)
                        vault_dispatcher
                            .pay_royalty(auction.auction_id, royalty_receiver, royalty_amount);
                        amount - royalty_amount
                    } else {
                        amount
                    };

                    // TODO: Check no active rentals on items (cross-check rentable)

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

                    vault_dispatcher.disburse_to_seller(auction.auction_id, seller, net_amount);
                } else {
                    // Refund highest bidder (auction_systems authorized)
                    let shares = vault_dispatcher.share_balance(auction.auction_id, winner);
                    if shares > 0_u256 {
                        vault_dispatcher.withdraw(auction.auction_id, winner, winner, shares);
                    }
                }
            }
            // If no winner, items stay with seller; no fund transfer (vault should be empty or
            // withdrawable)

            // Delist all items
            let mut i: u32 = 0;
            while i < auction.item_count {
                let item = store.auction_item(auction.auction_id, i);
                let mut listed_token = store.listed_token(item.contract_address, item.token_id);
                listed_token.auction_id = 0_u32;
                store.set_listed_token(@listed_token);
                i += 1;
            }

            // Update to Settled or Canceled
            auction
                .status =
                    if can_settle {
                        AuctionStatus::Settled.into()
                    } else {
                        AuctionStatus::Canceled.into()
                    };
            store.set_auction(@auction);
        }

        /// View: Whether `settle` would succeed now (items transferable + expired).
        /// Simulates auto-end: `true` for expired Active + checks pass.
        fn can_settle(
            self: @ComponentState<TContractState>, world: WorldStorage, auction_id: u32,
        ) -> bool {
            let store = StoreTrait::new(world);
            let current_time = get_block_timestamp();
            let auction = store.auction(auction_id);
            let status = auction.status;

            // Mimic settle asserts (exists + !Settled/!Canceled)
            if status == AuctionStatus::None.into()
                || status == AuctionStatus::Settled.into()
                || status == AuctionStatus::Canceled.into() {
                return false;
            }

            // Auto-end sim (settle prefix)
            let is_ended = if status == AuctionStatus::Active.into() {
                current_time >= auction.end_time
            } else {
                status == AuctionStatus::Ended.into()
            };
            if !is_ended {
                return false;
            }

            let seller: ContractAddress = auction.seller.try_into().unwrap();
            let auction_contract: ContractAddress = starknet::get_contract_address();
            let has_winner = auction.highest_bidder != 0; // felt252 zero-check
            if !has_winner {
                return true; // Settle noop (no transfer)
            }

            // Full pre-flight: owner + approvals (fails on rug/revoke)
            let mut i: u32 = 0;
            while i < auction.item_count {
                let item = store.auction_item(auction_id, i);
                let nft_dispatcher = IERC721Dispatcher {
                    contract_address: item.contract_address.try_into().unwrap(),
                };
                let owner = nft_dispatcher.owner_of(item.token_id.into());
                if owner != seller { // Rug: transferred away
                    return false;
                }
                let approved = nft_dispatcher.get_approved(item.token_id.into());
                let approved_for_all = nft_dispatcher.is_approved_for_all(seller, auction_contract);
                if !(approved == auction_contract || approved_for_all) {
                    return false;
                }
                i += 1;
            }
            true
        }
    }
}
