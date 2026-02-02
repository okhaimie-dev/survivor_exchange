use starknet::ContractAddress;

#[starknet::interface]
pub trait IERC2981<TContractState> {
    fn royalty_info(
        ref self: TContractState, token_id: u256, sale_price: u256,
    ) -> (ContractAddress, u256);
}
