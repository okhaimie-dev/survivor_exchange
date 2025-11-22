use survivor_exchange::models::index::{ExchangeSettings, SupportedNFTCollection};

#[generate_trait]
pub impl AdminImpl of AdminTrait {
    fn new(
        settings_id: u8, platform_fee: u16, fee_token: felt252, admin: felt252,
    ) -> ExchangeSettings {
        ExchangeSettings { settings_id, platform_fee, fee_token, admin }
    }
}

#[generate_trait]
pub impl SupportedNFTImpl of SupportedNFTTrait {
    fn new(address: felt252, standard: u8) -> SupportedNFTCollection {
        SupportedNFTCollection { collection_address: address, standard }
    }
}
