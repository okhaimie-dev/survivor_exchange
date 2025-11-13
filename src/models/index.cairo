#[derive(Copy, Drop, IntrospectPacked, Serde)]
#[dojo::model]
pub struct Auction {
    #[key]
    pub auction_id: u32,
    pub starting_price: u8,
    pub current_bid: u8,
    pub highest_bidder: felt252,
    pub status: u8,
    pub end_time: u64,
    pub owner: felt252,
}

#[derive(Copy, Drop, IntrospectPacked, Serde)]
#[dojo::model]
pub struct AuctionItem {
    #[key]
    pub auction_id: u32,
    #[key]
    pub item_index: u32,
    pub token_id: u32,
    pub contract_address: felt252,
}

#[derive(Copy, Drop, IntrospectPacked, Serde)]
#[dojo::model]
pub struct Rental {
    #[key]
    pub token_id: u32,
    pub rental_price: u8,
    pub duration: u64,
    pub collateral: u64,
    pub renter: felt252,
    pub start_time: u64,
    pub end_time: u64,
    pub rental_status: u8,
    pub owner: felt252,
}

#[derive(Copy, Drop, IntrospectPacked, Serde)]
#[dojo::model]
pub struct SupportedNFTCollection {
    #[key]
    pub collection_address: felt252,
    // 0=ERC721, 1=ERC1155 (for future handling)
    pub standard: u8,
}
