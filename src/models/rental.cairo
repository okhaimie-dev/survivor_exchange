pub use beast_marketplace::models::index::Rental;

pub mod errors {}

#[generate_trait]
pub impl RentalImpl of RentalTrait {
    #[inline]
    fn new(
        token_id: u32,
        rental_price: u8,
        duration: u64,
        collateral: u64,
        owner: felt252,
        current_timestamp: u64 // Optional; can be used if setting immediate start_time
    ) -> Rental {
        assert(rental_price > 0, 'Invalid rental price');
        assert(duration > 0, 'Invalid duration');
        assert(collateral > 0, 'Invalid collateral');
        assert(owner != 0, 'Invalid owner');

        // For a new listing: times are 0 until rented; renter is zero address
        // If immediate availability: uncomment below and set start_time = current_timestamp,
        // end_time = current_timestamp + duration let start_time = current_timestamp;
        // let end_time = current_timestamp + duration;
        Rental {
            token_id,
            rental_price,
            duration,
            collateral,
            renter: 0,
            start_time: 0,
            end_time: 0,
            status: 0,
            owner,
        }
    }
}
