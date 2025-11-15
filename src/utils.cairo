use starknet::ContractAddress;

pub fn BEAST_ADDRESS_MAINNET() -> ContractAddress {
    0x046dA8955829ADF2bDa310099A0063451923f02E648cF25A1203aac6335CF0e4.try_into().unwrap()
}

pub fn SURVIVOR_ADDRESS_MAINNET() -> ContractAddress {
    0x042DD777885AD2C116be96d4D634abC90A26A790ffB5871E037Dd5Ae7d2Ec86B.try_into().unwrap()
}
