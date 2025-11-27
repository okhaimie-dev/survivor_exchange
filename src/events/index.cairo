#[derive(Introspect, Copy, Drop, Serde)]
#[dojo::event]
pub struct AuctionEvent {
    #[key]
    pub auction_id: u32,
    pub status: u8,
    pub seller: felt252,
    pub end_time: u64,
    pub timestamp: u64,
}

#[derive(Introspect, Copy, Drop, Serde)]
#[dojo::event]
pub struct BidPlaced {
    #[key]
    pub auction_id: u32,
    pub bidder: felt252,
    pub amount: u32,
    pub timestamp: u64,
}
