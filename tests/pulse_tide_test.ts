import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types
} from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
  name: "Test event creation",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const blockHeight = chain.blockHeight;
    
    let block = chain.mineBlock([
      Tx.contractCall('pulse-tide', 'create-event', [
        types.ascii("Test Event"),
        types.uint(blockHeight + 10),
        types.uint(blockHeight + 20)
      ], deployer.address)
    ]);
    
    assertEquals(block.receipts.length, 1);
    block.receipts[0].result.expectOk().expectUint(1);
  }
});

Clarinet.test({
  name: "Test feedback submission and duplicate prevention",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const user1 = accounts.get('wallet_1')!;
    const blockHeight = chain.blockHeight;
    
    // Create event
    let block = chain.mineBlock([
      Tx.contractCall('pulse-tide', 'create-event', [
        types.ascii("Test Event"),
        types.uint(blockHeight),
        types.uint(blockHeight + 10)
      ], deployer.address)
    ]);
    
    // Submit feedback
    block = chain.mineBlock([
      Tx.contractCall('pulse-tide', 'submit-feedback', [
        types.uint(1),
        types.uint(5)
      ], user1.address)
    ]);
    
    assertEquals(block.receipts.length, 1);
    block.receipts[0].result.expectOk().expectBool(true);
    
    // Try duplicate feedback
    block = chain.mineBlock([
      Tx.contractCall('pulse-tide', 'submit-feedback', [
        types.uint(1),
        types.uint(4)
      ], user1.address)
    ]);
    
    assertEquals(block.receipts.length, 1);
    block.receipts[0].result.expectErr().expectUint(106);
  }
});

Clarinet.test({
  name: "Test time-based restrictions",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const user1 = accounts.get('wallet_1')!;
    const blockHeight = chain.blockHeight;
    
    // Create future event
    let block = chain.mineBlock([
      Tx.contractCall('pulse-tide', 'create-event', [
        types.ascii("Future Event"),
        types.uint(blockHeight + 10),
        types.uint(blockHeight + 20)
      ], deployer.address)
    ]);
    
    // Try feedback before start
    block = chain.mineBlock([
      Tx.contractCall('pulse-tide', 'submit-feedback', [
        types.uint(1),
        types.uint(5)
      ], user1.address)
    ]);
    
    assertEquals(block.receipts.length, 1);
    block.receipts[0].result.expectErr().expectUint(104);
  }
});
