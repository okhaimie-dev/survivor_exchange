use starknet::ContractAddress;

#[starknet::interface]
pub trait IMockERC721<TContractState> {
    fn owner_of(self: @TContractState, token_id: u256) -> ContractAddress;
}

/// Mock ERC721 - returns (OWNER) as owner of all tokens
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
