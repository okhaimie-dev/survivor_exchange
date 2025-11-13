#[derive(Copy, Drop, PartialEq)]
pub enum Status {
    None,
    Placed,
    Canceled,
    Executed,
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

pub impl IntoStatusU8 of core::traits::Into<Status, u8> {
    #[inline]
    fn into(self: Status) -> u8 {
        match self {
            Status::None => 0,
            Status::Placed => 1,
            Status::Canceled => 2,
            Status::Executed => 3,
        }
    }
}

pub impl IntoU8Status of core::traits::Into<u8, Status> {
    #[inline]
    fn into(self: u8) -> Status {
        match self {
            0 => Status::None,
            1 => Status::Placed,
            2 => Status::Canceled,
            3 => Status::Executed,
            _ => Status::None,
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
