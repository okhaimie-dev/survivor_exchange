mod test_init_market {
    use dojo_snf_test::{set_account_address, set_caller_address};
    use snforge_std::{ContractClassTrait, DeclareResultTrait, declare, start_mock_call};
    //    use snforge_std::{start_mock_call, stop_mock_call};
    use survivor_exchange::systems::auction::IAuctionMarketplaceDispatcherTrait;
    use survivor_exchange::tests::setup;
    use survivor_exchange::utils::BEAST_ADDRESS_MAINNET;

    #[starknet::contract]
    mod contract_test {
        #[storage]
        struct Storage {}
    }

    #[test]
    #[available_gas(l2_gas: 300000000000)]
    fn test_create_auction() {
        //set_caller_address(setup::tests::OWNER());
        set_account_address(setup::tests::OWNER());
        let (_world, systems) = setup::tests::spawn_auction();

        let name: felt252 = 'test_auction';
        let starting_price: u32 = 100;
        let mut items = ArrayTrait::new();
        items.append(1);
        items.append(2);
        let items = items.span();
        let duration: Option<u64> = Option::Some(3600);

        let contract = declare("contract_test").unwrap().contract_class();
        let (mock_collection, _) = contract.deploy(@array![]).unwrap();

        let owner = setup::tests::OWNER();
        let beast_addr = BEAST_ADDRESS_MAINNET();

        start_mock_call(mock_collection, selector!("owner_of"), owner);
        start_mock_call(beast_addr, selector!("owner_of"), owner);
        start_mock_call(mock_collection, selector!("owner_of"), owner);
        start_mock_call(beast_addr, selector!("owner_of"), owner);

        set_caller_address(setup::tests::OWNER());

        systems
            .auction_systems
            .create_auction(name, starting_price, items, mock_collection, duration);
    }
}
