pub fn DEFAULT_NS() -> ByteArray {
    "bm_0_0_1"
}

pub mod Errors {
    pub const AUCTION_NOT_ACTIVE: felt252 = 'Auction not active';
    pub const AUCTION_NOT_EXIST: felt252 = 'Auction: does not exist';
    pub const AUCTION_NOT_DRAFT: felt252 = 'Auction not in draft status';
    pub const AUCTION_ALREADY_EXISTS: felt252 = 'Auction: already exist';
    pub const AUCTION_NOT_SELLER: felt252 = 'Auction: not seller';
    pub const AUCTION_EMPTY: felt252 = 'Auction: empty auction';
    pub const BID_TOO_LOW: felt252 = 'Auction: bid too low';
    pub const AUCTION_EXPIRED: felt252 = 'Auction: has expired';
    pub const UNAUTHORIZED_TO_END: felt252 = 'Auction: cannot end';
    pub const NOT_BEAST_OWNER: felt252 = 'Beast: not owner';
    pub const INVALID_BID: felt252 = 'Invalid bid amount';
    pub const AUCTION_NOT_ENDED: felt252 = 'Auction not ended';
    pub const UNAUTHORIZED: felt252 = 'Unauthorized access';
    pub const RENTAL_NOT_AVAILABLE: felt252 = 'Rental not available';
    pub const INVALID_COLLATERAL: felt252 = 'Invalid collateral amount';
    pub const INVALID_NAME: felt252 = 'Invalid name';
    pub const INVALID_SELLER: felt252 = 'Auction: invalid seller';
    pub const INVALID_STARTING_PRICE: felt252 = 'Auction: invalid starting price';
    pub const INVALID_STATUS: felt252 = 'Auction: invalid status';
    pub const INVALID_CONTRACT: felt252 = 'Invalid contract address';
    pub const INVALID_TOKEN_ID: felt252 = 'Auction: invalid token ID';
}
