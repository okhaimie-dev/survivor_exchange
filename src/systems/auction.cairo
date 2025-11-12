#[starknet::interface]
pub trait IAuctionMarketplace<TContractState> {
    /// Creates a new English auction for a token.
    /// - `token_id`: The NFT/token ID to auction.
    /// - `starting_price`: Minimum initial bid (u8 for small units; consider u128 if scaling).
    /// - `duration`: Auction length in seconds (end_time = block_timestamp + duration).
    fn create_auction(ref self: TContractState, token_id: u32, starting_price: u8, duration: u64);

    /// Places a bid in an active English auction (must exceed current_bid).
    /// - `token_id`: The auction's token ID.
    /// - `bid_amount`: The new bid value (transfers ETH/token to escrow).
    fn place_bid(ref self: TContractState, token_id: u32, bid_amount: u8);

    /// Ends an auction (manual or if expired; callable by anyone after end_time).
    /// - `token_id`: The auction's token ID.
    fn end_auction(ref self: TContractState, token_id: u32);

    /// Settles an ended auction: transfers token to highest bidder, funds to owner.
    /// - `token_id`: The auction's token ID.
    fn settle_auction(ref self: TContractState, token_id: u32);
}
