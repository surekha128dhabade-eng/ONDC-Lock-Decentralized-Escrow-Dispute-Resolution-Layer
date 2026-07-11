#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, contracterror, Address, Env, symbol_short, Symbol,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyRegistered = 1,
    NotRegistered = 2,
    InsufficientStake = 3,
    NotAdmin = 4,
}

#[contracttype]
pub enum DataKey {
    Admin,
    Validator(Address),
    MinStake,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ValidatorInfo {
    pub stake_amount: i128,
    pub reputation_score: u32,
    pub total_disputes_resolved: u32,
    pub is_active: bool,
}

#[contract]
pub struct ValidatorRegistry;

#[contractimpl]
impl ValidatorRegistry {
    pub fn initialize(env: Env, admin: Address, min_stake: i128) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyRegistered);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::MinStake, &min_stake);
        Ok(())
    }

    pub fn register_validator(env: Env, validator: Address, stake_amount: i128) -> Result<(), Error> {
        validator.require_auth();
        
        let min_stake: i128 = env.storage().instance().get(&DataKey::MinStake).unwrap_or(0);
        if stake_amount < min_stake {
            return Err(Error::InsufficientStake);
        }

        let key = DataKey::Validator(validator.clone());
        if env.storage().persistent().has(&key) {
            return Err(Error::AlreadyRegistered);
        }

        // In a real implementation, we would transfer the XLM stake from the validator to the contract here using the token interface.

        let info = ValidatorInfo {
            stake_amount,
            reputation_score: 100, // starting score
            total_disputes_resolved: 0,
            is_active: true,
        };

        env.storage().persistent().set(&key, &info);
        env.events().publish((symbol_short!("validator"), symbol_short!("added")), validator);
        Ok(())
    }

    pub fn is_eligible_validator(env: Env, validator: Address) -> bool {
        let key = DataKey::Validator(validator);
        if let Some(info) = env.storage().persistent().get::<_, ValidatorInfo>(&key) {
            info.is_active && info.reputation_score >= 50
        } else {
            false
        }
    }
    
    pub fn update_reputation(env: Env, validator: Address, score_delta: i32) -> Result<(), Error> {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).ok_or(Error::NotAdmin)?;
        // Only admin or DisputeRegistry can update reputation. For simplicity, we just check admin auth here.
        admin.require_auth();

        let key = DataKey::Validator(validator.clone());
        let mut info: ValidatorInfo = env.storage().persistent().get(&key).ok_or(Error::NotRegistered)?;
        
        let new_score = (info.reputation_score as i32) + score_delta;
        info.reputation_score = new_score.max(0) as u32;
        
        if info.reputation_score < 50 {
            info.is_active = false;
        }

        env.storage().persistent().set(&key, &info);
        Ok(())
    }
}
