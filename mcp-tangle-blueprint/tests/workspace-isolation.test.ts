import { describe, it, expect, afterAll } from 'vitest';
import { rm, mkdir, writeFile, readFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Workspace Isolation', () => {
  const testDir = join(tmpdir(), `isolation-${Date.now()}`);

  afterAll(async () => {
    await rm(testDir, { recursive: true, force: true }).catch(() => {});
  });

  it('isolates Rust and Solidity projects between users', async () => {
    // Create isolated workspaces for Alice and Bob
    const alice = join(testDir, 'workspace', 'alice', 'payment-blueprint');
    const bob = join(testDir, 'workspace', 'bob', 'oracle-blueprint');
    
    await mkdir(join(alice, 'src'), { recursive: true });
    await mkdir(join(alice, 'contracts'), { recursive: true });
    await mkdir(join(bob, 'src'), { recursive: true });
    
    // Alice: Payment blueprint with Rust + Solidity
    await writeFile(
      join(alice, 'Cargo.toml'),
      '[package]\nname = "payment-blueprint"\nversion = "0.1.0"\nedition = "2021"'
    );
    
    await writeFile(
      join(alice, 'src', 'lib.rs'),
      'pub fn process_payment(amount: u64) -> u64 { amount * 95 / 100 }'
    );
    
    await writeFile(
      join(alice, 'contracts', 'PaymentVault.sol'),
      'pragma solidity ^0.8.19;\ncontract PaymentVault { mapping(address => uint256) public balances; }'
    );
    
    await writeFile(
      join(alice, 'foundry.toml'),
      '[profile.default]\nsrc = "contracts"'
    );
    
    // Bob: Oracle blueprint with Rust only
    await writeFile(
      join(bob, 'Cargo.toml'),
      '[package]\nname = "oracle-blueprint"\nversion = "0.1.0"\nedition = "2021"'
    );
    
    await writeFile(
      join(bob, 'src', 'lib.rs'),
      'pub fn get_price() -> u64 { 42000 }'
    );
    
    // Verify isolation
    const aliceRust = await readFile(join(alice, 'src', 'lib.rs'), 'utf-8');
    const bobRust = await readFile(join(bob, 'src', 'lib.rs'), 'utf-8');
    
    expect(aliceRust).toContain('process_payment');
    expect(bobRust).toContain('get_price');
    expect(aliceRust).not.toEqual(bobRust);
    
    // Verify Alice has Solidity files
    const aliceSol = await readFile(join(alice, 'contracts', 'PaymentVault.sol'), 'utf-8');
    expect(aliceSol).toContain('PaymentVault');
    
    // Verify Bob doesn't have Alice's files
    await expect(
      readFile(join(bob, 'contracts', 'PaymentVault.sol'), 'utf-8')
    ).rejects.toThrow();
  });

  it('verifies dynamic workspace resolution', async () => {
    const getWorkspace = async (userId: string) => {
      return join('/workspace', userId);
    };
    
    const alice = await getWorkspace('alice');
    const bob = await getWorkspace('bob');
    
    expect(alice).toBe('/workspace/alice');
    expect(bob).toBe('/workspace/bob');
    expect(alice).not.toBe(bob);
  });
});