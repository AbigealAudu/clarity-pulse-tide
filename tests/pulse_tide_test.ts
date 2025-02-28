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
    
    let block = chain.mineBlock([
      Tx.contractCall('pulse-tide', 'create-event', [
        types.ascii("Test Event"),
        types.uint(20),
        types.uint(30)
      ], deployer.address)
    ]);
    
    assertEquals(block.receipts.length, 1);
    block.receipts[0].result.expectOk().expectUint(1);
    
    const eventDetails = chain.callReadOnlyFn(
      'pulse-tide',
      'get-event-details',
      [types.uint(1)],
      deployer.address
    );
    
    eventDetails.result.expectOk().expectTuple();
  }
});

Clarinet.test({
  name: "Test feedback submission",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const user1 = accounts.get('wallet_1')!;
    
    // Create event
    let block = chain.mineBlock([
      Tx.contractCall('pulse-tide', 'create-event', [
        types.ascii("Test Event"),
        types.uint(20),
        types.uint(30)
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
    
    // Check metrics
    const metrics = chain.callReadOnlyFn(
      'pulse-tide',
      'get-event-metrics',
      [types.uint(1)],
      deployer.address
    );
    
    const metricsData = metrics.result.expectOk().expectTuple();
    assertEquals(metricsData['total-ratings'], types.uint(1));
    assertEquals(metricsData['average-rating'], types.uint(5));
  }
});

Clarinet.test({
  name: "Test invalid feedback submission",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const user1 = accounts.get('wallet_1')!;
    
    // Try to submit feedback for non-existent event
    let block = chain.mineBlock([
      Tx.contractCall('pulse-tide', 'submit-feedback', [
        types.uint(999),
        types.uint(5)
      ], user1.address)
    ]);
    
    assertEquals(block.receipts.length, 1);
    block.receipts[0].result.expectErr().expectUint(101);
  }
});
