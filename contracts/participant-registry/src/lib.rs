#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, contracterror, Address, Env, String, symbol_short, Symbol,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyRegistered = 1,
    NotRegistered = 2,
    NotAdmin = 3,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum Role {
    Buyer,
    Seller,
    Logistics,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Participant {
    pub role: Role,
    pub kyc_verified: bool,
    pub name: String,
    // Split percentage (e.g., Seller gets 90%, Logistics gets 10%)
    // Since Soroban doesn't have native decimals, we can represent percentages in basis points (10000 = 100%)
    pub split_bips: u32, 
}

#[contracttype]
pub enum DataKey {
    Admin,
    Participant(Address),
}

#[contract]
pub struct ParticipantRegistry;

#[contractimpl]
impl ParticipantRegistry {
    pub fn initialize(env: Env, admin: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyRegistered); // Reuse error code for simplicity
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        Ok(())
    }

    pub fn register(
        env: Env,
        account: Address,
        role: Role,
        name: String,
        split_bips: u32,
    ) -> Result<(), Error> {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).ok_or(Error::NotAdmin)?;
        admin.require_auth();

        let key = DataKey::Participant(account.clone());
        if env.storage().persistent().has(&key) {
            return Err(Error::AlreadyRegistered);
        }

        let participant = Participant {
            role,
            kyc_verified: true, // Simulation of KYC
            name,
            split_bips,
        };

        env.storage().persistent().set(&key, &participant);
        env.events().publish((symbol_short!("registry"), symbol_short!("added")), account);
        
        Ok(())
    }

    pub fn get_participant(env: Env, account: Address) -> Result<Participant, Error> {
        let key = DataKey::Participant(account);
        env.storage().persistent().get(&key).ok_or(Error::NotRegistered)
    }
}
