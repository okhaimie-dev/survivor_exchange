use beast_marketplace::constants::Errors;
pub use beast_marketplace::models::index::Rental;

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
            rental_status: 0,
            owner,
        }
    }

    /// Checks if the rental is currently active (i.e., rented out to someone).
    /// Returns true if status == 1 (rented), false otherwise.
    fn is_rental(self: Rental) -> bool {
        self.rental_status == 2
    }
}

#[generate_trait]
pub impl RentalAssert of AssertTrait {
    #[inline]
    fn assert_does_not_exist(self: @Rental) {
        // TODO: FIX to use the right error message
        assert(*self.owner == 0, Errors::AUCTION_ALREADY_EXISTS);
    }

    #[inline]
    fn assert_does_exist(self: @Rental) {
        // TODO: FIX to use the right error message
        assert(*self.owner != 0, Errors::AUCTION_NOT_EXIST);
    }
}
