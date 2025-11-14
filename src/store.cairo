use dojo::model::ModelStorage;
use dojo::world::WorldStorage;
use survivor_exchange::models::index::{Auction, AuctionItem, Bid, Rental};

#[derive(Copy, Drop)]
pub struct Store {
    pub world: WorldStorage,
}

#[generate_trait]
pub impl StoreImpl of StoreTrait {
    #[inline]
    fn new(world: WorldStorage) -> Store {
        Store { world: world }
    }

    #[inline]
    fn auction(self: Store, auction_id: u32) -> Auction {
        self.world.read_model(auction_id)
    }

    #[inline]
    fn set_auction(ref self: Store, auction: @Auction) {
        self.world.write_model(auction);
    }

    #[inline]
    fn auction_item(self: Store, auction_id: u32, item_index: u32) -> AuctionItem {
        self.world.read_model((auction_id, item_index))
    }

    #[inline]
    fn set_auction_item(ref self: Store, auction_item: @AuctionItem) {
        self.world.write_model(auction_item);
    }

    #[inline]
    fn bid(self: Store, auction_id: u32, bidder: felt252) -> Bid {
        self.world.read_model((auction_id, bidder))
    }

    #[inline]
    fn set_bid(ref self: Store, bid: @Bid) {
        self.world.write_model(bid)
    }

    #[inline]
    fn rental(self: Store, token_id: u32) -> Rental {
        self.world.read_model(token_id)
    }

    #[inline]
    fn set_rental(ref self: Store, rental: @Rental) {
        self.world.write_model(rental);
    }
}
