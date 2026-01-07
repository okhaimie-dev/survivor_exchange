use survivor_exchange::events::index::OfferEvent;
use survivor_exchange::models::index::Offer;

#[generate_trait]
pub impl OfferEventImpl of OfferEventTrait {
    #[inline]
    fn new(offer: @Offer, timestamp: u64) -> OfferEvent {
        OfferEvent {
            auction_id: *offer.auction_id,
            buyer: *offer.buyer,
            amount: *offer.amount,
            status: *offer.status,
            timestamp,
        }
    }
}
