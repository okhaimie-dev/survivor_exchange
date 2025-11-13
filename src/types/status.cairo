#[derive(Copy, Drop, PartialEq)]
pub enum AuctionStatus {
    None,
    Draft,
    Active,
    Ended,
    Settled,
    Canceled,
}

#[derive(Copy, Drop, PartialEq)]
pub enum RentalStatus {
    None,
    Available,
    Rented,
    Returned,
    Expired,
    Settled,
    Canceled,
}

pub impl IntoAuctionStatusU8 of core::traits::Into<AuctionStatus, u8> {
    #[inline]
    fn into(self: AuctionStatus) -> u8 {
        match self {
            AuctionStatus::None => 0,
            AuctionStatus::Draft => 1,
            AuctionStatus::Active => 2,
            AuctionStatus::Ended => 3,
            AuctionStatus::Settled => 4,
            AuctionStatus::Canceled => 5,
        }
    }
}

pub impl IntoU8AuctionStatus of core::traits::Into<u8, AuctionStatus> {
    #[inline]
    fn into(self: u8) -> AuctionStatus {
        match self {
            0 => AuctionStatus::None,
            1 => AuctionStatus::Draft,
            2 => AuctionStatus::Active,
            3 => AuctionStatus::Ended,
            4 => AuctionStatus::Settled,
            5 => AuctionStatus::Canceled,
            _ => AuctionStatus::None,
        }
    }
}

pub impl IntoRentalStatusU8 of core::traits::Into<RentalStatus, u8> {
    #[inline]
    fn into(self: RentalStatus) -> u8 {
        match self {
            RentalStatus::None => 0,
            RentalStatus::Available => 1,
            RentalStatus::Rented => 2,
            RentalStatus::Returned => 3,
            RentalStatus::Expired => 4,
            RentalStatus::Settled => 5,
            RentalStatus::Canceled => 6,
        }
    }
}

pub impl IntoU8RentalStatus of core::traits::Into<u8, RentalStatus> {
    #[inline]
    fn into(self: u8) -> RentalStatus {
        match self {
            0 => RentalStatus::None,
            1 => RentalStatus::Available,
            2 => RentalStatus::Rented,
            3 => RentalStatus::Returned,
            4 => RentalStatus::Expired,
            5 => RentalStatus::Settled,
            6 => RentalStatus::Canceled,
            _ => RentalStatus::None,
        }
    }
}
