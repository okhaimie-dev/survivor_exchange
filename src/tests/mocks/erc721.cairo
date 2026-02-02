use starknet::ContractAddress;

#[starknet::interface]
pub trait IMockERC721<TContractState> {
    fn owner_of(self: @TContractState, token_id: u256) -> ContractAddress;
    fn transfer_from(
        ref self: TContractState, from: ContractAddress, to: ContractAddress, token_id: u256,
    );
    fn get_approved(self: @TContractState, token_id: u256) -> ContractAddress;
    fn is_approved_for_all(
        self: @TContractState, owner: ContractAddress, operator: ContractAddress,
    ) -> bool;
    fn set_approval_for_all(ref self: TContractState, operator: ContractAddress, approved: bool);
}

/// Mock ERC721 - returns OWNER() as owner of all tokens, approves all transfers
#[starknet::contract]
pub mod MockERC721 {
    use core::num::traits::Zero;
    use starknet::ContractAddress;
    use starknet::storage::{Map, StorageMapReadAccess, StorageMapWriteAccess};

    #[storage]
    struct Storage {
        // Track ownership transfers for testing
        owners: Map<u256, ContractAddress>,
        // Track approvals
        approved_for_all: Map<(ContractAddress, ContractAddress), bool>,
    }

    #[abi(embed_v0)]
    impl MockERC721Impl of super::IMockERC721<ContractState> {
        fn owner_of(self: @ContractState, token_id: u256) -> ContractAddress {
            let stored_owner = self.owners.read(token_id);
            if stored_owner.is_zero() {
                // Default owner is OWNER() if not transferred
                survivor_exchange::tests::setup::tests::OWNER()
            } else {
                stored_owner
            }
        }

        fn transfer_from(
            ref self: ContractState, from: ContractAddress, to: ContractAddress, token_id: u256,
        ) {
            // Just update ownership - no validation in mock
            self.owners.write(token_id, to);
        }

        fn get_approved(self: @ContractState, token_id: u256) -> ContractAddress {
            // Return zero address (no specific approval) - rely on is_approved_for_all
            Zero::zero()
        }

        fn is_approved_for_all(
            self: @ContractState, owner: ContractAddress, operator: ContractAddress,
        ) -> bool {
            // Always return true for testing - auction contract is always approved
            true
        }

        fn set_approval_for_all(
            ref self: ContractState, operator: ContractAddress, approved: bool,
        ) {
            let caller = starknet::get_caller_address();
            self.approved_for_all.write((caller, operator), approved);
        }
    }
}
