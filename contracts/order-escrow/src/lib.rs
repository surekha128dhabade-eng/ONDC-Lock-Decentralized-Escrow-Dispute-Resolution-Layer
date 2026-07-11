#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, contracterror, Address, Env, String, symbol_short, Symbol,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    InvalidOtp = 3,
    AlreadySettled = 4,
    InvalidAuth = 5,
    GpsOutOftolerance = 6,
    Disputed = 7,
}

#[contracttype]
pub enum DataKey {
    EscrowState,
    DisputeRegistry,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EscrowState {
    pub buyer: Address,
    pub seller: Address,
    pub rider: Address,
    pub otp_hash: String,
    pub amount: i128,
    pub is_settled: bool,
    pub is_disputed: bool,
    pub dest_lat: i128, // multiplied by 10^7
    pub dest_lon: i128, // multiplied by 10^7
}

#[contract]
pub struct OrderEscrow;

#[contractimpl]
impl OrderEscrow {
    /// Initialize the escrow with the participants and the OTP hash.
    pub fn initialize(
        env: Env,
        buyer: Address,
        seller: Address,
        rider: Address,
        otp_hash: String,
        amount: i128,
        dest_lat: i128,
        dest_lon: i128,
        dispute_registry: Address,
    ) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::EscrowState) {
            return Err(Error::AlreadyInitialized);
        }

        let state = EscrowState {
            buyer,
            seller,
            rider,
            otp_hash,
            amount,
            is_settled: false,
            is_disputed: false,
            dest_lat,
            dest_lon,
        };

        env.storage().instance().set(&DataKey::EscrowState, &state);
        env.storage().instance().set(&DataKey::DisputeRegistry, &dispute_registry);

        env.events().publish((symbol_short!("escrow"), symbol_short!("created")), state);

        Ok(())
    }

    /// Submit the delivery proof (OTP) to release the payout.
    pub fn submit_proof(env: Env, rider: Address, otp: String, current_lat: i128, current_lon: i128) -> Result<(), Error> {
        let mut state: EscrowState = env
            .storage()
            .instance()
            .get(&DataKey::EscrowState)
            .ok_or(Error::NotInitialized)?;

        if state.is_settled {
            return Err(Error::AlreadySettled);
        }
        if state.is_disputed {
            return Err(Error::Disputed);
        }

        rider.require_auth();
        
        if state.rider != rider {
            return Err(Error::InvalidAuth);
        }

        if state.otp_hash != otp {
            return Err(Error::InvalidOtp);
        }

        // Fixed-point GPS Check (Tolerance: ~100 meters)
        // 1 degree ~ 111,320m. So 10^7 units = 111,320m -> 1 unit = 0.0111m
        // 100 meters / 0.0111 ~ 9009 units. We'll use 10000 units (~111 meters) for tolerance.
        let tolerance = 10000i128;
        
        // Simple Pythagorean theorem on equirectangular projection for MVP
        // dx = (lon2 - lon1) * cos(lat) -- ignoring cos for small distances near equator for simplicity in this MVP
        let dx = (state.dest_lon - current_lon).abs();
        let dy = (state.dest_lat - current_lat).abs();
        
        let dist_sq = dx * dx + dy * dy;
        let tolerance_sq = tolerance * tolerance;

        if dist_sq > tolerance_sq {
            return Err(Error::GpsOutOftolerance);
        }

        state.is_settled = true;
        env.storage().instance().set(&DataKey::EscrowState, &state);

        env.events().publish(
            (symbol_short!("escrow"), symbol_short!("delivered")),
            state.amount,
        );

        Ok(())
    }

    pub fn mark_disputed(env: Env) -> Result<(), Error> {
        let disp_reg: Address = env.storage().instance().get(&DataKey::DisputeRegistry).unwrap();
        disp_reg.require_auth();

        let mut state: EscrowState = env
            .storage()
            .instance()
            .get(&DataKey::EscrowState)
            .ok_or(Error::NotInitialized)?;

        state.is_disputed = true;
        env.storage().instance().set(&DataKey::EscrowState, &state);
        Ok(())
    }

    pub fn get_state(env: Env) -> Result<EscrowState, Error> {
        env.storage()
            .instance()
            .get(&DataKey::EscrowState)
            .ok_or(Error::NotInitialized)
    }
}
