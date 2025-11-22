pub use survivor_exchange::models::index::{Vault, VaultShare};

#[generate_trait]
pub impl VaultImpl of VaultTrait {
    #[inline]
    fn new(vault_id: u32, locked_amount: u64, token_address: felt252, created_at: u64) -> Vault {
        Vault { vault_id, locked_amount, token_address, created_at }
    }
}

#[generate_trait]
pub impl VaultShareImpl of VaultShareTrait {
    #[inline]
    fn new(
        vault_id: u32,
        user: felt252,
        deposited_amount: u64,
        share_amount: u64,
        claimed: bool,
        updated_at: u64,
    ) -> VaultShare {
        VaultShare { vault_id, user, share_amount, deposited_amount, claimed, updated_at }
    }
}
