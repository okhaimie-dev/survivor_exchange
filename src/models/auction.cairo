use beast_marketplace::constants::Errors;
pub use beast_marketplace::models::index::{Auction, AuctionItem};
use beast_marketplace::types::status::Status;

pub mod errors {}

#[generate_trait]
pub impl AuctionImpl of AuctionTrait {
    #[inline]
    fn new(
        auction_id: u32, starting_price: u8, duration: u64, owner: felt252, current_timestamp: u64,
    ) -> Auction {
        assert(starting_price > 0, 'Invalid starting price');
        assert(duration > 0, 'Invalid duration');
        assert(owner != 0, 'Invalid owner');

        let current_time = current_timestamp; // get_block_timestamp()
        let end_time = current_time + duration;

        Auction {
            auction_id,
            starting_price,
            current_bid: 0,
            highest_bidder: 0x0,
            status: 0,
            end_time,
            owner,
        }
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
        assert(*self.status == Status::None.into(), Errors::AUCTION_ALREADY_EXISTS);
    }

    #[inline]
    fn assert_does_exist(self: @Auction) {
        assert(*self.status != Status::None.into(), Errors::AUCTION_NOT_EXIST);
    }
}
