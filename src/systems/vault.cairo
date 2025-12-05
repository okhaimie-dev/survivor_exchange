use starknet::ContractAddress;

#[starknet::interface]
pub trait IVault<TContractState> {
    fn deposit(ref self: TContractState, vault_id: u32, amount: u256, depositor: ContractAddress);
    fn withdraw(ref self: TContractState, vault_id: u32, to: ContractAddress, amount: u256);
    fn balance_of(self: @TContractState, vault_id: u32) -> u256;
    fn share_balance(self: @TContractState, vault_id: u32, user: ContractAddress) -> u256;
}

#[dojo::contract]
pub mod vault_systems {
    use openzeppelin_token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
    use starknet::{get_block_timestamp, get_caller_address, get_contract_address};
    use survivor_exchange::constants::{DEFAULT_NS, Errors};
    use survivor_exchange::models::auction::AuctionAssert;
    use survivor_exchange::store::StoreTrait;
    use survivor_exchange::types::status::AuctionStatus;
    use survivor_exchange::utils::USDC_ADDRESS_MAINNET;
    use super::{ContractAddress, IVault};

    fn dojo_init(ref self: ContractState) {}

    #[abi(embed_v0)]
    impl VaultImpl of IVault<ContractState> {
        fn deposit(
            ref self: ContractState, vault_id: u32, amount: u256, depositor: ContractAddress,
        ) {
            let mut store = StoreTrait::new(self.world_default());
            //let vault = store.vault(vault_id);
            //assert(vault.vault_id != 0, Errors::VAULT_NOT_FOUND);

            let survivor_dispatcher = IERC20Dispatcher { contract_address: USDC_ADDRESS_MAINNET() };

            survivor_dispatcher.transfer_from(depositor, get_contract_address(), amount);

            let mut share = store.vault_share(vault_id, depositor.into());
            let add_amount: u256 = amount; // TODO: u256 models
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
            let deduct: u256 = amount;

            assert(share.share_amount >= deduct, Errors::INSUFFICIENT_SHARES);

            let auction = store.auction(vault_id); // vault_id == auction_id
            auction.assert_does_exist();
            let is_highest = caller.into() == auction.highest_bidder;
            let is_active = auction.status == AuctionStatus::Active.into();
            let is_outbid_or_ended = !is_highest
                || !is_active
                || get_block_timestamp() >= auction.end_time;
            assert(is_outbid_or_ended, Errors::CANNOT_WITHDRAW_HIGHEST_ACTIVE);

            let vault = store.vault(vault_id);
            let token_address: ContractAddress = vault.token_address.try_into().unwrap();
            let token_dispatcher = IERC20Dispatcher { contract_address: token_address };
            token_dispatcher.transfer(to, amount); // From vault balance

            share.share_amount -= deduct;
            share.deposited_amount -= deduct;
            share.updated_at = get_block_timestamp();
            if share.share_amount == 0 {
                share.claimed = true;
            }
            store.set_vault_share(@share);

            let mut vault = store.vault(vault_id);
            vault.locked_amount -= deduct;
            store.set_vault(@vault);
        }

        fn balance_of(self: @ContractState, vault_id: u32) -> u256 {
            let store = StoreTrait::new(self.world_default());
            store.vault(vault_id).locked_amount
        }

        fn share_balance(self: @ContractState, vault_id: u32, user: ContractAddress) -> u256 {
            let store = StoreTrait::new(self.world_default());
            store.vault_share(vault_id, user.into()).share_amount
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn world_default(self: @ContractState) -> dojo::world::WorldStorage {
            self.world(@DEFAULT_NS())
        }
    }
}
