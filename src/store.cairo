use dojo::event::EventStorage;
use dojo::model::ModelStorage;
use dojo::world::WorldStorage;
use survivor_exchange::events::auction::AuctionEventTrait;
use survivor_exchange::events::bid::BidPlacedTrait;
use survivor_exchange::events::offer::OfferEventTrait;
use survivor_exchange::models::index::{
    Auction, AuctionItem, AuctionOfferCount, AuctionOfferIndex, Bid, ExchangeSettings, ListedToken,
    Offer, SupportedNFTCollection, Vault, VaultShare,
};


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
    fn exchange_settings(self: Store, settings_id: u8) -> ExchangeSettings {
        self.world.read_model(settings_id)
    }

    #[inline]
    fn set_exchange_settings(ref self: Store, exchange_settings: @ExchangeSettings) {
        self.world.write_model(exchange_settings);
    }

    #[inline]
    fn supported_nft_collection(self: Store, address: felt252) -> SupportedNFTCollection {
        self.world.read_model(address)
    }

    #[inline]
    fn set_supported_nft_collection(
        ref self: Store, support_nft_collection: @SupportedNFTCollection,
    ) {
        self.world.write_model(support_nft_collection)
    }

    #[inline]
    fn vault(self: Store, vault_id: u32) -> Vault {
        self.world.read_model(vault_id)
    }

    #[inline]
    fn set_vault(ref self: Store, vault: @Vault) {
        self.world.write_model(vault)
    }

    #[inline]
    fn vault_share(self: Store, vault_id: u32, user: felt252) -> VaultShare {
        self.world.read_model((vault_id, user))
    }

    #[inline]
    fn set_vault_share(ref self: Store, vault_share: @VaultShare) {
        self.world.write_model(vault_share)
    }

    #[inline]
    fn listed_token(self: Store, contract_address: felt252, token_id: u32) -> ListedToken {
        self.world.read_model((contract_address, token_id))
    }

    #[inline]
    fn set_listed_token(ref self: Store, listed_token: @ListedToken) {
        self.world.write_model(listed_token)
    }

    #[inline]
    fn auction_created(ref self: Store, auction: Auction, timestamp: u64) {
        let event = AuctionEventTrait::new(auction, timestamp);
        self.world.emit_event(@event)
    }

    #[inline]
    fn bid_placed(ref self: Store, auction: @Auction, bid: @Bid, timestamp: u64) {
        let event = BidPlacedTrait::new(auction, bid, timestamp);
        self.world.emit_event(@event)
    }

    #[inline]
    fn offer(self: Store, auction_id: u32, buyer: felt252) -> Offer {
        self.world.read_model((auction_id, buyer))
    }

    #[inline]
    fn set_offer(ref self: Store, offer: @Offer) {
        self.world.write_model(offer)
    }

    #[inline]
    fn offer_event(ref self: Store, offer: @Offer, timestamp: u64) {
        let event = OfferEventTrait::new(offer, timestamp);
        self.world.emit_event(@event)
    }

    #[inline]
    fn auction_offer_count(self: Store, auction_id: u32) -> AuctionOfferCount {
        self.world.read_model(auction_id)
    }

    #[inline]
    fn set_auction_offer_count(ref self: Store, offer_count: @AuctionOfferCount) {
        self.world.write_model(offer_count)
    }

    #[inline]
    fn auction_offer_index(self: Store, auction_id: u32, offer_index: u32) -> AuctionOfferIndex {
        self.world.read_model((auction_id, offer_index))
    }

    #[inline]
    fn set_auction_offer_index(ref self: Store, offer_index: @AuctionOfferIndex) {
        self.world.write_model(offer_index)
    }
}
