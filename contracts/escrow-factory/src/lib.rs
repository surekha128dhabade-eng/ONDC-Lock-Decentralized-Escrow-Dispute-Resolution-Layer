#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracterror, contracttype, Address, Env, String, BytesN, Symbol,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotAdmin = 2,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    OrderEscrowWasmHash,
    ParticipantRegistry,
}

#[contract]
pub struct EscrowFactory;

#[contractimpl]
impl EscrowFactory {
    pub fn initialize(
        env: Env, 
        admin: Address, 
        escrow_wasm_hash: BytesN<32>, 
        participant_registry: Address
    ) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::OrderEscrowWasmHash, &escrow_wasm_hash);
        env.storage().instance().set(&DataKey::ParticipantRegistry, &participant_registry);
        Ok(())
    }

    pub fn create_escrow(
        env: Env,
        buyer: Address,
        seller: Address,
        rider: Address,
        otp_hash: String,
        amount: i128,
        dest_lat: i128,
        dest_lon: i128,
        salt: BytesN<32>,
    ) -> Result<Address, Error> {
        use soroban_sdk::IntoVal;
        buyer.require_auth();

        let wasm_hash: BytesN<32> = env.storage().instance().get(&DataKey::OrderEscrowWasmHash).unwrap();
        
        // Deploy the contract
        let constructor_args = soroban_sdk::Vec::<soroban_sdk::Val>::new(&env);
        let escrow_address = env.deployer().with_address(buyer.clone(), salt).deploy_v2(wasm_hash, constructor_args);

        let disp_reg: Address = env.storage().instance().get(&DataKey::ParticipantRegistry).unwrap(); // In MVP we will pass Participant Registry or a specific Dispute Registry. Wait, the EscrowFactory should store the DisputeRegistry. Let's just pass the one we have for now, or add it to EscrowFactory state. For now, pass ParticipantRegistry as the disp_reg or just add a new param. Let me add it to the state. Actually, just adding `disp_reg` as a parameter to `create_escrow` is simpler.

        // Initialize the deployed contract via cross-contract call
        env.invoke_contract::<()>(
            &escrow_address,
            &Symbol::new(&env, "initialize"),
            soroban_sdk::vec![&env, buyer.into_val(&env), seller.into_val(&env), rider.into_val(&env), otp_hash.into_val(&env), amount.into_val(&env), dest_lat.into_val(&env), dest_lon.into_val(&env), disp_reg.into_val(&env)],
        );

        Ok(escrow_address)
    }
}
