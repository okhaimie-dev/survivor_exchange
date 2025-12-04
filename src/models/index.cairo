#[derive(Copy, Drop, IntrospectPacked, Serde)]
#[dojo::model]
pub struct Auction {
    #[key]
    pub auction_id: u32,
    pub status: u8,
    pub starting_price: u32,
    pub current_bid: u32,
    pub item_count: u32,
    pub end_time: u64,
    pub name: felt252,
    pub highest_bidder: felt252,
    pub seller: felt252,
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
pub struct Bid {
    #[key]
    pub auction_id: u32,
    #[key]
    pub bidder: felt252,
    pub amount: u32,
}

#[derive(Copy, Drop, IntrospectPacked, Serde)]
#[dojo::model]
pub struct Rental {
    #[key]
    pub token_id: u32,
    pub rental_status: u8,
    pub rental_price: u8,
    pub duration: u64,
    pub collateral: u64,
    pub start_time: u64,
    pub end_time: u64,
    pub renter: felt252,
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

#[derive(Introspect, Copy, Drop, Serde)]
#[dojo::model]
pub struct ExchangeSettings {
    #[key]
    pub settings_id: u8,
    pub platform_fee: u16,
    pub fee_token: felt252,
    pub admin: felt252,
}

#[derive(Introspect, Copy, Drop, Serde)]
#[dojo::model]
pub struct Vault {
    #[key]
    pub vault_id: u32,
    pub locked_amount: u256,
    pub created_at: u64,
    pub token_address: felt252,
}

#[derive(Copy, Drop, IntrospectPacked, Serde)]
#[dojo::model]
pub struct VaultShare {
    #[key]
    pub vault_id: u32,
    // Locker (bidder/renter) who gets shares
    #[key]
    pub user: felt252,
    // Proportional shares (e.g., total_shares / total_locked * deposit)
    pub share_amount: u256,
    // Original lock amount (for claim calculation)
    pub deposited_amount: u256,
    pub claimed: bool,
    pub updated_at: u64,
}
