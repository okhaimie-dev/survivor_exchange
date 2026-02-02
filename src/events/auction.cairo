use survivor_exchange::events::index::AuctionEvent;
use survivor_exchange::models::index::Auction;

#[generate_trait]
pub impl AuctionEventImpl of AuctionEventTrait {
    #[inline]
    fn new(auction: Auction, timestamp: u64) -> AuctionEvent {
        // [Return] Order
        AuctionEvent {
            auction_id: auction.auction_id,
            status: auction.status,
            seller: auction.seller,
            end_time: auction.end_time,
            timestamp,
        }
    }
}
