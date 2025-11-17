use survivor_exchange::events::index::BidPlaced;
use survivor_exchange::models::index::{Auction, Bid};

#[generate_trait]
pub impl AuctionEventImpl of BidPlacedTrait {
    #[inline]
    fn new(auction: @Auction, bid: @Bid, timestamp: u64) -> BidPlaced {
        // [Return] Order
        BidPlaced {
            auction_id: *auction.auction_id, bidder: *bid.bidder, amount: *bid.amount, timestamp,
        }
    }
}
