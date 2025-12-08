use starknet::ContractAddress;

#[starknet::interface]
pub trait IMockERC721<TContractState> {
    fn owner_of(self: @TContractState, token_id: u256) -> ContractAddress;
}

#[starknet::interface]
pub trait IMockERC20<TContractState> {
    fn transfer_from(
        ref self: TContractState, sender: ContractAddress, recipient: ContractAddress, amount: u256,
    ) -> bool;
    fn transfer(ref self: TContractState, recipient: ContractAddress, amount: u256) -> bool;
    fn balance_of(self: @TContractState, account: ContractAddress) -> u256;
}

/// Mock ERC721 - returns 0x1 (OWNER) as owner of all tokens
#[starknet::contract]
pub mod MockERC721 {
    use starknet::ContractAddress;

    #[storage]
    struct Storage {}

    #[abi(embed_v0)]
    impl MockERC721Impl of super::IMockERC721<ContractState> {
        fn owner_of(self: @ContractState, token_id: u256) -> ContractAddress {
            survivor_exchange::tests::setup::tests::OWNER()
        }
    }
}

/// Mock ERC20 - always succeeds transfers
#[starknet::contract]
pub mod MockERC20 {
    use starknet::ContractAddress;

    #[storage]
    struct Storage {}

    #[abi(embed_v0)]
    impl MockERC20Impl of super::IMockERC20<ContractState> {
        fn transfer_from(
            ref self: ContractState,
            sender: ContractAddress,
            recipient: ContractAddress,
            amount: u256,
        ) -> bool {
            true
        }

        fn transfer(ref self: ContractState, recipient: ContractAddress, amount: u256) -> bool {
            true
        }

        fn balance_of(self: @ContractState, account: ContractAddress) -> u256 {
            1000000000_u256
        }
    }
}
