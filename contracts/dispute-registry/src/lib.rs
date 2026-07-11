#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, contracterror, Address, Env, String, Vec, symbol_short, Symbol,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyDisputed = 1,
    NotDisputed = 2,
    NotAdmin = 3,
    InvalidValidator = 4,
    AlreadyVoted = 5,
}

#[contracttype]
pub enum DataKey {
    Admin,
    ValidatorRegistry,
    Dispute(u64), // Dispute ID -> DisputeData
    DisputeCounter,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DisputeStatus {
    Open,
    ResolvedBuyer,
    ResolvedSeller,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DisputeData {
    pub escrow_id: Address,
    pub status: DisputeStatus,
    pub evidence_hash: String,
    pub votes_buyer: u32,
    pub votes_seller: u32,
    pub validators_voted: Vec<Address>,
}

#[contract]
pub struct DisputeRegistry;

#[contractimpl]
impl DisputeRegistry {
    pub fn initialize(env: Env, admin: Address, validator_registry: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyDisputed); // Reuse error for already initialized
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::ValidatorRegistry, &validator_registry);
        env.storage().instance().set(&DataKey::DisputeCounter, &0u64);
        Ok(())
    }

    pub fn open_dispute(
        env: Env,
        caller: Address,
        escrow_id: Address,
        evidence_hash: String,
    ) -> Result<u64, Error> {
        caller.require_auth();
        // In reality, verify caller is part of the escrow.

        let mut counter: u64 = env.storage().instance().get(&DataKey::DisputeCounter).unwrap_or(0);
        counter += 1;

        let dispute = DisputeData {
            escrow_id,
            status: DisputeStatus::Open,
            evidence_hash,
            votes_buyer: 0,
            votes_seller: 0,
            validators_voted: Vec::new(&env),
        };

        env.storage().persistent().set(&DataKey::Dispute(counter), &dispute);
        env.storage().instance().set(&DataKey::DisputeCounter, &counter);

        env.events().publish((symbol_short!("dispute"), symbol_short!("opened")), counter);
        Ok(counter)
    }

    pub fn cast_vote(
        env: Env,
        validator: Address,
        dispute_id: u64,
        vote_for_buyer: bool,
    ) -> Result<(), Error> {
        validator.require_auth();

        let val_reg: Address = env.storage().instance().get(&DataKey::ValidatorRegistry).unwrap();
        // Cross-contract call to check if validator is eligible
        let is_eligible: bool = env.invoke_contract(
            &val_reg,
            &Symbol::new(&env, "is_eligible_validator"),
            soroban_sdk::vec![&env, validator.to_val()],
        );

        if !is_eligible {
            return Err(Error::InvalidValidator);
        }

        let key = DataKey::Dispute(dispute_id);
        let mut dispute: DisputeData = env.storage().persistent().get(&key).ok_or(Error::NotDisputed)?;

        if dispute.status != DisputeStatus::Open {
            return Err(Error::AlreadyDisputed); // Already resolved
        }

        if dispute.validators_voted.contains(validator.clone()) {
            return Err(Error::AlreadyVoted);
        }

        if vote_for_buyer {
            dispute.votes_buyer += 1;
        } else {
            dispute.votes_seller += 1;
        }
        
        dispute.validators_voted.push_back(validator.clone());

        // Check for resolution (e.g., 3 votes needed)
        if dispute.votes_buyer >= 3 {
            dispute.status = DisputeStatus::ResolvedBuyer;
            env.events().publish((symbol_short!("dispute"), symbol_short!("resolved")), dispute_id);
            // In a real system, trigger the payout in OrderEscrow via cross-contract call
        } else if dispute.votes_seller >= 3 {
            dispute.status = DisputeStatus::ResolvedSeller;
            env.events().publish((symbol_short!("dispute"), symbol_short!("resolved")), dispute_id);
            // In a real system, trigger the payout in OrderEscrow via cross-contract call
        }

        env.storage().persistent().set(&key, &dispute);
        env.events().publish((symbol_short!("dispute"), symbol_short!("voted")), validator);
        Ok(())
    }
}
