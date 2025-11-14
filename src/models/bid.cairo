//use survivor_exchange::constants::Errors;
pub use survivor_exchange::models::index::{Auction, Bid};

#[generate_trait]
pub impl BidImpl of BidTrait {
    #[inline]
    fn new(auction_id: u32, bidder: felt252, amount: u8) -> Bid {
        Bid { auction_id, bidder, amount }
    }
}

#[generate_trait]
pub impl BidAssert of AssertTrait { //#[inline]
    #[inline]
    fn assert_bid_amount_not_zero(self: @Bid) {
        assert(*self.amount > 0, 'Bid: no balance to withdraw');
    }

    #[inline]
    fn assert_is_bid_owner(self: @Bid, caller: felt252) {
        assert(*self.bidder == caller, 'Bid: not owner');
    }

    #[inline]
    fn assert_not_highest_bidder(self: @Bid, auction: @Auction) {
        assert(*self.bidder != *auction.highest_bidder, 'Auction: highest bidder');
    }
}
