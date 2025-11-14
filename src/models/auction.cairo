use survivor_exchange::constants::Errors;
pub use survivor_exchange::models::index::{Auction, AuctionItem};
use survivor_exchange::types::status::AuctionStatus;


pub mod errors {}

#[generate_trait]
pub impl AuctionImpl of AuctionTrait {
    #[inline]
    fn new(name: felt252, starting_price: u8, seller: felt252, current_timestamp: u64) -> Auction {
        AuctionAssert::assert_valid_starting_price(starting_price);
        AuctionAssert::assert_valid_seller(seller);
        AuctionAssert::assert_valid_name(name);
        Auction {
            auction_id: 0,
            name,
            starting_price,
            current_bid: 0,
            highest_bidder: 0x0,
            status: AuctionStatus::Draft.into(),
            end_time: 0,
            item_count: 0,
            seller,
        }
    }

    #[inline]
    fn is_active(self: @Auction) -> bool {
        *self.status == AuctionStatus::Active.into()
    }

    #[inline]
    fn switch_status(ref self: Auction, status: u8) {
        self.status = status
    }
}

#[generate_trait]
pub impl AuctionItemImpl of AuctionItemTrait {
    #[inline]
    fn new_item(
        auction_id: u32, item_index: u32, token_id: u32, contract_address: felt252,
    ) -> AuctionItem {
        // Assert valid contract
        AuctionItem { auction_id, item_index, token_id, contract_address }
    }
}

#[generate_trait]
pub impl AuctionAssert of AssertTrait {
    #[inline]
    fn assert_does_not_exist(self: @Auction) {
        assert(*self.status == AuctionStatus::None.into(), Errors::AUCTION_ALREADY_EXISTS);
    }

    #[inline]
    fn assert_does_exist(self: @Auction) {
        assert(*self.status != AuctionStatus::None.into(), Errors::AUCTION_NOT_EXIST);
    }

    #[inline]
    fn assert_is_draft(self: @Auction) {
        assert(*self.status == AuctionStatus::Draft.into(), Errors::AUCTION_NOT_EXIST)
    }

    #[inline]
    fn assert_is_seller(self: @Auction, caller: felt252) {
        assert(*self.seller == caller, Errors::AUCTION_NOT_SELLER);
    }

    #[inline]
    fn assert_auction_not_empty(self: @Auction) {
        assert(*self.item_count != 0, Errors::AUCTION_EMPTY);
    }

    #[inline]
    fn assert_valid_name(name: felt252) {
        assert(name != 0, Errors::INVALID_NAME);
    }

    #[inline]
    fn assert_valid_seller(seller: felt252) {
        assert(seller != 0, Errors::INVALID_SELLER);
    }

    #[inline]
    fn assert_valid_starting_price(starting_price: u8) {
        assert(starting_price != 0, Errors::INVALID_STARTING_PRICE);
    }

    #[inline]
    fn assert_auction_expired(self: @Auction, current_time: u64) {
        assert(current_time < *self.end_time, Errors::AUCTION_EXPIRED);
    }

    #[inline]
    fn assert_bid_not_low(self: @Auction, bid_amount: u8) {
        assert(
            bid_amount > *self.current_bid || bid_amount > *self.starting_price,
            Errors::BID_TOO_LOW,
        )
    }
}
