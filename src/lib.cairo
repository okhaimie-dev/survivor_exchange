pub mod systems {
    pub mod admin;
    pub mod auction;
    pub mod rental;
}

pub mod models {
    pub mod auction;
    pub mod index;
    pub mod rental;
}

pub mod types {
    pub mod status;
}

pub mod components {
    pub mod auctionable;
    pub mod rentable;
}

pub mod constants;

pub mod store;
pub mod utils;

pub mod tests {
    //mod test_world;
}
