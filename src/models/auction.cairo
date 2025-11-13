use survivor_exchange::constants::Errors;
pub use survivor_exchange::models::index::{Auction, AuctionItem};
use survivor_exchange::types::status::AuctionStatus;

pub mod errors {}

#[generate_trait]
pub impl AuctionImpl of AuctionTrait {
    #[inline]
    fn new(
        auction_id: u32, name: felt252, starting_price: u8, seller: felt252, current_timestamp: u64,
    ) -> Auction {
        assert(starting_price > 0, 'Invalid starting price');
        //assert(duration > 0, 'Invalid duration');
        assert(seller != 0, 'Invalid owner');

        //let current_time = current_timestamp; // get_block_timestamp()
        //let end_time = current_time + duration;

        Auction {
            auction_id,
            name,
            starting_price,
            current_bid: 0,
            highest_bidder: 0x0,
            status: 1,
            end_time: 0,
            item_count: 0,
            seller,
        }
    }

    #[inline]
    fn is_active(self: @Auction) -> bool {
        *self.status == 2
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
}
