#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

#[test]
fn test_escrow_flow() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, OrderEscrow);
    let client = OrderEscrowClient::new(&env, &contract_id);

    let buyer = Address::generate(&env);
    let seller = Address::generate(&env);
    let rider = Address::generate(&env);
    let dispute_reg = Address::generate(&env);
    let otp_hash = String::from_str(&env, "secret123");
    let amount = 1000;
    
    // GPS coords for destination (12.3456789, 98.7654321)
    let dest_lat = 123456789i128;
    let dest_lon = 987654321i128;

    // Test initialize
    client.initialize(&buyer, &seller, &rider, &otp_hash, &amount, &dest_lat, &dest_lon, &dispute_reg);

    let state = client.get_state();
    assert_eq!(state.buyer, buyer);
    assert_eq!(state.amount, amount);
    assert_eq!(state.is_settled, false);

    // Test submit_proof (success)
    let otp = String::from_str(&env, "secret123");
    // Rider is at exactly the same location
    client.submit_proof(&rider, &otp, &dest_lat, &dest_lon);

    let state_after = client.get_state();
    assert_eq!(state_after.is_settled, true);
}

#[test]
#[should_panic(expected = "Error(Contract, 6)")]
fn test_gps_out_of_tolerance() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, OrderEscrow);
    let client = OrderEscrowClient::new(&env, &contract_id);

    let buyer = Address::generate(&env);
    let seller = Address::generate(&env);
    let rider = Address::generate(&env);
    let dispute_reg = Address::generate(&env);
    let otp_hash = String::from_str(&env, "secret123");
    let amount = 1000;
    
    let dest_lat = 123456789i128;
    let dest_lon = 987654321i128;

    client.initialize(&buyer, &seller, &rider, &otp_hash, &amount, &dest_lat, &dest_lon, &dispute_reg);

    let otp = String::from_str(&env, "secret123");
    // Rider is 20000 units away, which is outside the 10000 unit tolerance
    client.submit_proof(&rider, &otp, &(dest_lat + 20000), &dest_lon);
}
