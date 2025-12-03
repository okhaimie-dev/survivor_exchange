mod test_init_market {
    use dojo_snf_test::{set_account_address, set_caller_address};
    use snforge_std::{ContractClassTrait, DeclareResultTrait, declare, start_mock_call};
    //    use snforge_std::{start_mock_call, stop_mock_call};
    use survivor_exchange::systems::auction::IAuctionMarketplaceDispatcherTrait;
    use survivor_exchange::tests::setup;

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

        start_mock_call(mock_collection, selector!("owner_of"), setup::tests::OWNER());

        set_caller_address(setup::tests::OWNER());

        systems
            .auction_systems
            .create_auction(name, starting_price, items, mock_collection, duration);
    }
}
