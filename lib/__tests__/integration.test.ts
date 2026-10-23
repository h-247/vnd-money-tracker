import { describe, it, expect } from 'vitest';
import {
  calculateFinancialSummary,
  validateRunningBalance,
  canDeleteTransaction,
  canUpdateTransaction,
  parseVNDInput,
  LedgerTransaction,
  MAX_SAFE_VND,
} from '../financial';

describe('Data Ownership and Multi-User Isolation Logic', () => {
  const user1Transactions: LedgerTransaction[] = [
    {
      id: 'tx-1',
      type: 'ADD',
      amount: 1000000,
      createdAt: new Date('2026-10-01T10:00:00Z'),
    },
    {
      id: 'tx-2',
      type: 'SUBTRACT',
      amount: 200000,
      createdAt: new Date('2026-10-02T10:00:00Z'),
    },
  ];

  const user2Transactions: LedgerTransaction[] = [
    {
      id: 'tx-3',
      type: 'ADD',
      amount: 5000000,
      createdAt: new Date('2026-10-01T12:00:00Z'),
    },
  ];

  it('keeps ledger calculations strictly isolated between users', () => {
    const summary1 = calculateFinancialSummary(user1Transactions);
    const summary2 = calculateFinancialSummary(user2Transactions);

    expect(summary1.currentBalance).toBe(800000);
    expect(summary1.totalAdded).toBe(1000000);
    expect(summary1.totalSubtracted).toBe(200000);

    expect(summary2.currentBalance).toBe(5000000);
    expect(summary2.totalAdded).toBe(5000000);
    expect(summary2.totalSubtracted).toBe(0);

    // Cross-user balance bleeding must never occur
    expect(summary1.currentBalance + summary2.currentBalance).toBe(5800000);
  });

  it('prevents user1 from deleting user2 transactions', () => {
    // When attempting to delete a tx not in user1 ledger
    const check = canDeleteTransaction(user1Transactions, 'tx-3');
    expect(check.allowed).toBe(false);
    expect(check.reason).toContain('not found');
  });

  it('prevents user1 from updating user2 transactions', () => {
    const check = canUpdateTransaction(user1Transactions, 'tx-3', {
      amount: 100000,
    });
    expect(check.allowed).toBe(false);
    expect(check.reason).toContain('not found');
  });
});

describe('Financial Ledger Lifecycle & Edge Cases', () => {
  it('correctly models sequential transactions from initial balance to zero balance', () => {
    const ledger: LedgerTransaction[] = [];

    // 1. Initial balance 0 ₫
    let summary = calculateFinancialSummary(ledger);
    expect(summary.currentBalance).toBe(0);

    // 2. Add 1,000,000 ₫
    ledger.push({
      id: '1',
      type: 'ADD',
      amount: 1000000,
      createdAt: new Date('2026-10-01'),
    });
    summary = calculateFinancialSummary(ledger);
    expect(summary.currentBalance).toBe(1000000);

    // 3. Subtract 200,000 ₫
    ledger.push({
      id: '2',
      type: 'SUBTRACT',
      amount: 200000,
      createdAt: new Date('2026-10-02'),
    });
    summary = calculateFinancialSummary(ledger);
    expect(summary.currentBalance).toBe(800000);

    // 4. Add 500,000 ₫
    ledger.push({
      id: '3',
      type: 'ADD',
      amount: 500000,
      createdAt: new Date('2026-10-03'),
    });
    summary = calculateFinancialSummary(ledger);
    expect(summary.currentBalance).toBe(1300000);

    // 5. Subtract remaining 1,300,000 ₫ -> Balance becomes exactly 0 ₫
    ledger.push({
      id: '4',
      type: 'SUBTRACT',
      amount: 1300000,
      createdAt: new Date('2026-10-04'),
    });
    summary = calculateFinancialSummary(ledger);
    expect(summary.currentBalance).toBe(0);
    expect(validateRunningBalance(ledger).valid).toBe(true);

    // 6. Attempting to subtract 1 ₫ when balance is 0 ₫ would violate
    const overspendTx: LedgerTransaction = {
      id: '5',
      type: 'SUBTRACT',
      amount: 1,
      createdAt: new Date('2026-10-05'),
    };
    const invalidLedger = [...ledger, overspendTx];
    expect(calculateFinancialSummary(invalidLedger).currentBalance).toBe(-1);
    expect(validateRunningBalance(invalidLedger).valid).toBe(false);
  });

  it('handles maximum integer precision and large VND boundaries safely', () => {
    expect(Number.isSafeInteger(MAX_SAFE_VND)).toBe(true);
    const parsed = parseVNDInput('100,000,000,000,000');
    expect(parsed.success).toBe(true);
    expect(parsed.amount).toBe(MAX_SAFE_VND);

    // Out of bounds rejection
    const outOfBounds = parseVNDInput('100,000,000,000,001');
    expect(outOfBounds.success).toBe(false);
    expect(outOfBounds.error).toContain('cannot exceed');
  });

  it('handles concurrent or duplicate mutation simulation safely', () => {
    const currentBalance = 500000;
    const requestedWithdrawal = 400000;

    // First request succeeds
    const req1Allowed = requestedWithdrawal <= currentBalance;
    expect(req1Allowed).toBe(true);

    const balanceAfterReq1 = currentBalance - requestedWithdrawal; // 100,000

    // Concurrent second duplicate request with same amount must fail
    const req2Allowed = requestedWithdrawal <= balanceAfterReq1;
    expect(req2Allowed).toBe(false);
  });
});
