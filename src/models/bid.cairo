//use survivor_exchange::constants::Errors;
pub use survivor_exchange::models::index::Bid;

#[generate_trait]
pub impl BidImpl of BidTrait {
    #[inline]
    fn new(auction_id: u32, bidder: felt252, amount: u8) -> Bid {
        Bid { auction_id, bidder, amount }
    }
}

#[generate_trait]
pub impl BidAssert of AssertTrait { //#[inline]
//fn assert_does_not_exist(self: @Bid) {
//    // TODO: FIX to use the right error message
//    assert(*self.owner == 0, Errors::AUCTION_ALREADY_EXISTS);
//}
}
