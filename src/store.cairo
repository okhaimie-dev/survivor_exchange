use beast_marketplace::models::index::{Auction, Rental};
use dojo::model::ModelStorage;
use dojo::world::WorldStorage;

#[derive(Copy, Drop)]
pub struct Store {
    world: WorldStorage,
}

#[generate_trait]
pub impl StoreImpl of StoreTrait {
    #[inline]
    fn new(world: WorldStorage) -> Store {
        Store { world: world }
    }

    #[inline]
    fn auction(self: Store, token_id: u32) -> Auction {
        self.world.read_model(token_id)
    }

    #[inline]
    fn set_auction(ref self: Store, auction: @Auction) {
        self.world.write_model(auction);
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
