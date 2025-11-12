pub use beast_marketplace::models::index::Auction;

pub mod errors {}

#[generate_trait]
pub impl AuctionImpl of AuctionTrait {
    #[inline]
    fn new(
        token_id: u32, starting_price: u8, duration: u64, owner: felt252, current_timestamp: u64,
    ) -> Auction {
        assert(starting_price > 0, 'Invalid starting price');
        assert(duration > 0, 'Invalid duration');
        assert(owner != 0, 'Invalid owner');

        let current_time = current_timestamp; // get_block_timestamp()
        let end_time = current_time + duration;

        Auction {
            token_id,
            starting_price,
            current_bid: 0,
            highest_bidder: 0x0,
            status: 0,
            end_time,
            owner,
        }
    }
}
