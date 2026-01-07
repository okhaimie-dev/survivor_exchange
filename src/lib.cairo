pub mod systems {
    pub mod admin;
    pub mod auction;
    //pub mod rental;
    pub mod vault;
}

pub mod models {
    pub mod admin;
    pub mod auction;
    pub mod bid;
    pub mod index;
    pub mod offer;
    pub mod rental;
    pub mod vault;
}

pub mod interfaces {
    pub mod ierc2981;
}

pub mod types {
    pub mod status;
}

pub mod components {
    pub mod auctionable;
    //pub mod rentable;
}

pub mod events {
    pub mod auction;
    pub mod bid;
    pub mod index;
    pub mod offer;
}

pub mod constants;

pub mod store;
pub mod utils;

#[cfg(test)]
pub mod tests {
    pub mod mocks {
        pub mod account;
        pub mod erc20;
        pub mod erc721;
    }
    mod setup;
    mod test_world;
}
