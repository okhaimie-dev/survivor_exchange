#[starknet::component]
pub mod VaultableComponent {
    use dojo::world::WorldStorage;
    use starknet::get_block_timestamp;
    use survivor_exchange::models::vault::{Vault, VaultTrait};
    use survivor_exchange::store::StoreTrait;
    use survivor_exchange::utils::SURVIVOR_ADDRESS_MAINNET;

    #[storage]
    pub struct Storage {}

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {}

    #[generate_trait]
    pub impl InternalImpl<
        TContractState, +HasComponent<TContractState>,
    > of InternalTrait<TContractState> {
        fn create(
            self: @ComponentState<TContractState>,
            world: WorldStorage,
            vault_id: u32,
            locked_amount: u64,
        ) {
            let mut store = StoreTrait::new(world);
            let mut vault: Vault = VaultTrait::new(
                vault_id, locked_amount, SURVIVOR_ADDRESS_MAINNET().into(), get_block_timestamp(),
            );
            store.set_vault(@vault);
        }
    }
}
