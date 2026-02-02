pub use survivor_exchange::models::index::{Auction, Offer};
use survivor_exchange::types::status::OfferStatus;

#[generate_trait]
pub impl OfferImpl of OfferTrait {
    #[inline]
    fn new(auction_id: u32, buyer: felt252, amount: u64, created_at: u64, expires_at: u64) -> Offer {
        Offer {
            auction_id,
            buyer,
            amount,
            status: OfferStatus::Pending.into(),
            created_at,
            expires_at,
        }
    }

    #[inline]
    fn is_pending(self: @Offer) -> bool {
        *self.status == OfferStatus::Pending.into()
    }

    #[inline]
    fn is_expired(self: @Offer, current_time: u64) -> bool {
        *self.expires_at > 0 && current_time >= *self.expires_at
    }
}

#[generate_trait]
pub impl OfferAssert of AssertTrait {
    #[inline]
    fn assert_exists(self: @Offer) {
        assert(*self.status != OfferStatus::None.into(), 'Offer: not found');
    }

    #[inline]
    fn assert_is_pending(self: @Offer) {
        assert(*self.status == OfferStatus::Pending.into(), 'Offer: not pending');
    }

    #[inline]
    fn assert_not_expired(self: @Offer, current_time: u64) {
        assert(*self.expires_at == 0 || current_time < *self.expires_at, 'Offer: expired');
    }

    #[inline]
    fn assert_is_buyer(self: @Offer, caller: felt252) {
        assert(*self.buyer == caller, 'Offer: not buyer');
    }
}
