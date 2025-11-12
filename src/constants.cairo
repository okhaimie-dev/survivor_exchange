pub fn DEFAULT_NS() -> ByteArray {
    "bm_0_0_1"
}

pub mod Errors {
    pub const AUCTION_NOT_ACTIVE: felt252 = 'Auction not active';
    pub const INVALID_BID: felt252 = 'Invalid bid amount';
    pub const AUCTION_NOT_ENDED: felt252 = 'Auction not ended';
    pub const UNAUTHORIZED: felt252 = 'Unauthorized access';
    pub const RENTAL_NOT_AVAILABLE: felt252 = 'Rental not available';
    pub const INVALID_COLLATERAL: felt252 = 'Invalid collateral amount';
}
