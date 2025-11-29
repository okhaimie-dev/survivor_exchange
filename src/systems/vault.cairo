use starknet::ContractAddress;

#[starknet::interface]
pub trait IVault<TContractState> {
    fn create_vault(ref self: TContractState, vault_id: u32);
    fn deposit(ref self: TContractState, vault_id: u32, amount: u256, depositor: ContractAddress);
    fn withdraw(ref self: TContractState, vault_id: u32, to: ContractAddress, amount: u256);
    fn balance_of(self: @TContractState, vault_id: u32) -> u256;
    fn get_owner(self: @TContractState) -> ContractAddress;
}

#[dojo::contract]
pub mod vault_systems {
    use openzeppelin_token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
    use starknet::{get_block_timestamp, get_caller_address};
    use survivor_exchange::constants::DEFAULT_NS;
    use survivor_exchange::models::vault::{Vault, VaultTrait};
    use survivor_exchange::store::StoreTrait;
    use survivor_exchange::utils::{SURVIVOR_ADDRESS_MAINNET, TREASURY_ADDRESS_MAINNET};
    use super::{ContractAddress, IVault};

    fn dojo_init(ref self: ContractState) {}

    #[abi(embed_v0)]
    impl VaultImpl of IVault<ContractState> {
        fn create_vault(ref self: ContractState, vault_id: u32) {
            // Sync with Dojo: Create Vault model entry
            let mut store = StoreTrait::new(self.world_default());
            let mut vault: Vault = VaultTrait::new(
                vault_id, 0, SURVIVOR_ADDRESS_MAINNET().into(), starknet::get_block_timestamp(),
            );
            // TODO: Set vault.vault_address = deployed_vault_contract_address (hardcode or pass as
            // param)
            store.set_vault(@vault);
        }

        fn deposit(
            ref self: ContractState, vault_id: u32, amount: u256, depositor: ContractAddress,
        ) {
            //let caller = get_caller_address();
            let mut store = StoreTrait::new(self.world_default());
            // TODO: Vault assert

            let survivor_dispatcher = IERC20Dispatcher {
                contract_address: SURVIVOR_ADDRESS_MAINNET(),
            };

            // TODO: calculate the diff between depositor balance and bid amount to transfer.
            survivor_dispatcher.transfer_from(depositor, TREASURY_ADDRESS_MAINNET(), amount);

            let mut share = store.vault_share(vault_id, depositor.into());
            let add_amount: u64 = amount.try_into().expect('amount too large'); // TODO: u256 models
            share.deposited_amount += add_amount;
            share.share_amount += add_amount;
            share.claimed = false;
            share.updated_at = get_block_timestamp();
            store.set_vault_share(@share);

            let mut vault = store.vault(vault_id);
            vault.locked_amount += add_amount;
            store.set_vault(@vault);
        }

        fn withdraw(ref self: ContractState, vault_id: u32, to: ContractAddress, amount: u256) {
            let caller = get_caller_address();
            let mut store = StoreTrait::new(self.world_default());
            let mut share = store.vault_share(vault_id, caller.into());
            let deduct: u64 = amount.try_into().expect('amount too large');
            assert(
                share.share_amount >= deduct,
                survivor_exchange::constants::Errors::INSUFFICIENT_SHARES,
            );

            let vault = store.vault(vault_id);
            let token_address: ContractAddress = vault.token_address.try_into().unwrap();
            let token_dispatcher = IERC20Dispatcher { contract_address: token_address };
            token_dispatcher.transfer(to, amount);

            // Burn shares
            share.share_amount -= deduct;
            share.deposited_amount -= deduct;
            share.updated_at = get_block_timestamp();
            if share.share_amount == 0 {
                share.claimed = true;
            }
            store.set_vault_share(@share);

            // Update aggregate
            let mut vault = store.vault(vault_id);
            vault.locked_amount -= deduct;
            store.set_vault(@vault);
        }

        fn balance_of(self: @ContractState, vault_id: u32) -> u256 {
            let store = StoreTrait::new(self.world_default());
            store.vault(vault_id).locked_amount.into()
        }

        fn get_owner(self: @ContractState) -> ContractAddress {
            0x0.try_into().unwrap()
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn world_default(self: @ContractState) -> dojo::world::WorldStorage {
            self.world(@DEFAULT_NS())
        }
    }
}
