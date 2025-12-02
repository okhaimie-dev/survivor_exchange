use survivor_exchange::constants::Errors;
pub use survivor_exchange::models::index::{Auction, AuctionItem};
use survivor_exchange::types::status::AuctionStatus;

pub mod errors {}

#[generate_trait]
pub impl AuctionImpl of AuctionTrait {
    #[inline]
    fn new(name: felt252, starting_price: u32, seller: felt252) -> Auction {
        AuctionAssert::assert_valid_starting_price(starting_price);
        AuctionAssert::assert_valid_seller(seller);
        AuctionAssert::assert_valid_name(name);
        Auction {
            auction_id: 0,
            status: AuctionStatus::Draft.into(),
            starting_price,
            current_bid: 0,
            end_time: 0,
            item_count: 0,
            name,
            highest_bidder: 0x0,
            seller,
        }
    }

    #[inline]
    fn is_active(self: @Auction) -> bool {
        *self.status == AuctionStatus::Active.into()
    }

    #[inline]
    fn is_expired(self: @Auction, current_time: u64) -> bool {
        *self.end_time > 0 && current_time >= *self.end_time
    }

    #[inline]
    fn set_auction_id(ref self: Auction, id: u32) {
        self.auction_id = id;
    }

    #[inline]
    fn switch_status(ref self: Auction, status: u8) {
        assert(status <= 4_u8, Errors::INVALID_STATUS);
        self.status = status
    }

    #[inline]
    fn update_bid(ref self: Auction, bidder: felt252, amount: u32, current_time: u64) {
        assert(self.is_active(), Errors::AUCTION_NOT_ACTIVE);
        self.assert_not_expired(current_time);
        self.assert_bid_not_low(amount);

        self.current_bid = amount;
        self.highest_bidder = bidder;
    }

    #[inline]
    fn activate(ref self: Auction, duration: u64, current_time: u64) {
        self.assert_is_draft();
        self.assert_auction_not_empty();
        self.end_time = current_time + duration;
        self.switch_status(AuctionStatus::Active.into());
    }
}

#[generate_trait]
pub impl AuctionItemImpl of AuctionItemTrait {
    #[inline]
    fn new_item(
        auction_id: u32, item_index: u32, token_id: u32, contract_address: felt252,
    ) -> AuctionItem {
        assert(contract_address != 0, Errors::INVALID_CONTRACT); // Define in constants if missing
        assert(token_id != 0, Errors::INVALID_TOKEN_ID);
        AuctionItem { auction_id, item_index, token_id, contract_address }
    }
}

#[generate_trait]
pub impl AuctionAssert of AssertTrait {
    #[inline]
    fn assert_does_not_exist(self: @Auction) {
        assert(*self.status == AuctionStatus::None.into(), Errors::AUCTION_ALREADY_EXISTS);
    }

    #[inline]
    fn assert_does_exist(self: @Auction) {
        assert(*self.status != AuctionStatus::None.into(), Errors::AUCTION_NOT_EXIST);
    }

    #[inline]
    fn assert_is_draft(self: @Auction) {
        assert(*self.status == AuctionStatus::Draft.into(), Errors::AUCTION_NOT_DRAFT)
    }

    #[inline]
    fn assert_is_seller(self: @Auction, caller: felt252) {
        assert(*self.seller == caller, Errors::AUCTION_NOT_SELLER);
    }

    #[inline]
    fn assert_auction_not_empty(self: @Auction) {
        assert(*self.item_count != 0, Errors::AUCTION_EMPTY);
    }

    #[inline]
    fn assert_valid_name(name: felt252) {
        assert(name != 0, Errors::INVALID_NAME);
    }

    #[inline]
    fn assert_valid_seller(seller: felt252) {
        assert(seller != 0, Errors::INVALID_SELLER);
    }

    #[inline]
    fn assert_valid_starting_price(starting_price: u32) {
        assert(starting_price != 0, Errors::INVALID_STARTING_PRICE);
    }

    #[inline]
    fn assert_not_expired(self: @Auction, current_time: u64) {
        assert(*self.end_time > 0 && current_time < *self.end_time, Errors::AUCTION_EXPIRED);
    }

    #[inline]
    fn assert_bid_not_low(self: @Auction, bid_amount: u32) {
        assert(
            bid_amount > *self.current_bid && bid_amount >= *self.starting_price,
            Errors::BID_TOO_LOW,
        );
    }

    #[inline]
    fn assert_bidder_not_seller(self: @Auction, bidder: felt252) {
        assert(*self.seller != bidder, Errors::AUCTION_IS_SELLER);
    }
}

#[cfg(test)]
mod tests {
    // Local imports
    use super::{Auction, AuctionAssert, AuctionItemImpl, AuctionStatus, AuctionTrait};

    // Constants
    const NAME: felt252 = 7265849240828751573555476048407354681602097;
    const STARTING_PRICE: u32 = 100;
    const CONTRACT_ADDR: felt252 = 0x1234_felt252;
    const CURRENT_TIMESTAMP: u64 = 0x0;

    fn setup_draft_auction() -> Auction {
        AuctionTrait::new(NAME, STARTING_PRICE, CONTRACT_ADDR)
    }

    fn setup_active_auction(duration: u64, current_time: u64) -> Auction {
        let mut auction = setup_draft_auction();
        auction.item_count = 1;
        auction.activate(duration, current_time);
        auction
    }

    #[test]
    fn test_auction_new() {
        let auction: Auction = AuctionTrait::new(NAME, STARTING_PRICE, CONTRACT_ADDR);
        assert_eq!(auction.auction_id, 0);
        assert_eq!(auction.name, NAME);
        assert_eq!(auction.starting_price, STARTING_PRICE);
        assert_eq!(auction.current_bid, 0);
        assert_eq!(auction.highest_bidder, 0);
        assert_eq!(auction.status, 1);
        assert_eq!(auction.end_time, 0);
        assert_eq!(auction.item_count, 0);
        assert_eq!(auction.seller, CONTRACT_ADDR);
    }

    #[test]
    fn test_auction_is_active() {
        let mut auction = setup_draft_auction();
        assert(!auction.is_active(), 'should be inactive in draft');

        auction.switch_status(AuctionStatus::Active.into());
        assert(auction.is_active(), 'should be active after switch');

        auction.switch_status(AuctionStatus::Ended.into());
        assert(!auction.is_active(), 'should be inactive after end');
    }

    #[test]
    #[should_panic(expected: 'Invalid name')]
    fn test_auction_new_invalid_name() {
        let _auction = AuctionTrait::new(0, STARTING_PRICE, CONTRACT_ADDR);
    }

    #[test]
    fn test_auction_item_new() {
        let item = AuctionItemImpl::new_item(1, 0, 123, CONTRACT_ADDR);
        assert_eq!(item.auction_id, 1);
        assert_eq!(item.item_index, 0);
        assert_eq!(item.token_id, 123);
        assert_eq!(item.contract_address, CONTRACT_ADDR);
    }

    #[test]
    fn test_activate_valid() {
        let mut auction = setup_draft_auction();
        assert_eq!(auction.status, AuctionStatus::Draft.into(), "must start as draft");

        let duration = 3600_u64;
        let current_time = 100_u64;
        let auction = setup_active_auction(duration, current_time);

        assert(auction.is_active(), 'should activate');
        assert_eq!(auction.end_time, current_time + duration, "end time calc wrong");
        assert_eq!(auction.status, AuctionStatus::Active.into(), "status not active");
    }

    #[test]
    #[should_panic(expected: 'Auction not in draft status')]
    fn test_activate_not_draft() {
        let mut auction = setup_draft_auction();
        auction.switch_status(AuctionStatus::Ended.into());
        auction.activate(3600, 100);
    }

    #[test]
    fn test_update_bid_valid() {
        let mut auction = setup_active_auction(3600, 100);
        let amount = 150;
        auction.update_bid(CONTRACT_ADDR, amount, 200);
        assert_eq!(auction.current_bid, amount);
        assert_eq!(auction.highest_bidder, CONTRACT_ADDR);
    }

    #[test]
    #[should_panic(expected: 'Auction: bid too low')]
    fn test_update_bid_low() {
        let mut auction = setup_active_auction(3600, 100);
        auction.update_bid(CONTRACT_ADDR, 50, 200);
    }

    #[test]
    #[should_panic(expected: 'Auction: has expired')]
    fn test_update_bid_expired() {
        let mut auction = setup_active_auction(10, 100);
        auction.update_bid(CONTRACT_ADDR, 150, 120);
    }

    #[test]
    fn test_is_expired() {
        let mut auction = setup_draft_auction();
        assert(!auction.is_expired(50), 'draft should not expire');

        let auction = setup_active_auction(3600, 100);
        assert(!auction.is_expired(200), 'not expired yet');
        assert(auction.is_expired(5000), 'expired after end_time');
    }

    #[test]
    #[should_panic(expected: 'Auction: invalid starting price')]
    fn test_auction_new_invalid_price() {
        let _auction = AuctionTrait::new(NAME, 0, CONTRACT_ADDR);
    }

    #[test]
    #[should_panic(expected: 'Auction: invalid seller')]
    fn test_auction_new_invalid_seller() {
        let _auction = AuctionTrait::new(NAME, STARTING_PRICE, 0);
    }

    #[test]
    #[should_panic(expected: 'Auction: empty auction')]
    fn test_activate_empty() {
        let mut auction = setup_draft_auction();
        auction.activate(3600, 100);
    }
}
