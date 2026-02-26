pub fn DEFAULT_NS() -> ByteArray {
    "bm_0_2_1"
}

pub const TEN_POW_18: u256 = 1000000000000000000;

pub mod Errors {
    pub const AUCTION_NOT_ACTIVE: felt252 = 'Auction not active';
    pub const AUCTION_NOT_EXIST: felt252 = 'Auction: does not exist';
    pub const AUCTION_NOT_DRAFT: felt252 = 'Auction not in draft status';
    pub const AUCTION_ALREADY_EXISTS: felt252 = 'Auction: already exist';
    pub const AUCTION_NOT_SELLER: felt252 = 'Auction: not seller';
    pub const AUCTION_EMPTY: felt252 = 'Auction: empty auction';
    pub const AUCTION_IS_SELLER: felt252 = 'Auction: seller cannot bid';
    pub const BID_TOO_LOW: felt252 = 'Auction: bid too low';
    pub const AUCTION_EXPIRED: felt252 = 'Auction: has expired';
    pub const UNAUTHORIZED_TO_END: felt252 = 'Auction: cannot end';
    pub const NOT_NFT_OWNER: felt252 = 'NFT: not owner';
    pub const COLLECTION_NOT_SUPPORTED: felt252 = 'Collection not supported';
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
    pub const NO_ITEMS: felt252 = 'Auction: no items';
    pub const INVALID_ITEMS_COUNT: felt252 = 'Invalid item count';
    pub const INSUFFICIENT_SHARES: felt252 = 'Vault: insufficient shares';
    pub const VAULT_NOT_FOUND: felt252 = 'Vault: not found';
    pub const CANNOT_WITHDRAW_HIGHEST_ACTIVE: felt252 = 'Vault: highest bidder';
    pub const AUCTION_NOT_DISBURSED: felt252 = 'Auction: funds not disbursed';
    pub const INSUFFICIENT_VAULT_FUNDS: felt252 = 'Vault: insufficient funds';
    pub const AUCTION_ALREADY_SETTLED: felt252 = 'Auction: already settled';
    pub const AUCTION_ALREADY_CANCELED: felt252 = 'Auction: already canceled';
    pub const TOKEN_ALREADY_LISTED: felt252 = 'Token already listed';
    pub const OFFER_NOT_FOUND: felt252 = 'Offer: not found';
    pub const OFFER_NOT_PENDING: felt252 = 'Offer: not pending';
    pub const OFFER_INVALID_AMOUNT: felt252 = 'Offer: invalid amount';
    pub const OFFER_ALREADY_EXISTS: felt252 = 'Offer: already exists';
    pub const OFFER_EXPIRED: felt252 = 'Offer: expired';
}
