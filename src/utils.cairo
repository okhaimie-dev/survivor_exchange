use starknet::ContractAddress;

pub fn BEAST_ADDRESS_MAINNET() -> ContractAddress {
    0x0158160018d590d93528995b340260e65aedd76d28a686e9daa5c4e8fad0c5dd.try_into().unwrap()
}
