import { describe, it, expect } from 'vitest';
import {
  formatVND,
  parseVNDInput,
  formatVNDDate,
  calculateFinancialSummary,
  validateRunningBalance,
  canDeleteTransaction,
  canUpdateTransaction,
  CreateTransactionSchema,
  UpdateTransactionSchema,
  CreateTagSchema,
  UpdateTagSchema,
  LedgerTransaction,
} from '../financial';

describe('VND Currency Formatting', () => {
  it('formats zero correctly', () => {
    expect(formatVND(0)).toBe('0 ₫');
  });

  it('formats thousands correctly', () => {
    expect(formatVND(1000)).toBe('1,000 ₫');
    expect(formatVND(50000)).toBe('50,000 ₫');
    expect(formatVND(1000000)).toBe('1,000,000 ₫');
  });

  it('formats large numbers without precision loss', () => {
    expect(formatVND(999999999999)).toBe('999,999,999,999 ₫');
  });
});

describe('VND Input Parser', () => {
  it('accepts clean whole numbers', () => {
    expect(parseVNDInput('1000')).toEqual({ success: true, amount: 1000 });
    expect(parseVNDInput('1000000')).toEqual({
      success: true,
      amount: 1000000,
    });
  });

  it('accepts numbers with comma grouping separators', () => {
    expect(parseVNDInput('1,000')).toEqual({ success: true, amount: 1000 });
    expect(parseVNDInput('1,000,000')).toEqual({
      success: true,
      amount: 1000000,
    });
  });

  it('accepts numbers with dot grouping separators', () => {
    expect(parseVNDInput('1.000.000')).toEqual({
      success: true,
      amount: 1000000,
    });
    expect(parseVNDInput('50.000')).toEqual({ success: true, amount: 50000 });
  });

  it('accepts numbers with spaces', () => {
    expect(parseVNDInput('1 000 000')).toEqual({
      success: true,
      amount: 1000000,
    });
  });

  it('rejects zero and negative numbers', () => {
    expect(parseVNDInput('0').success).toBe(false);
    expect(parseVNDInput('-50000').success).toBe(false);
    expect(parseVNDInput('-1').success).toBe(false);
  });

  it('rejects decimal fractions', () => {
    expect(parseVNDInput('100.5').success).toBe(false);
    expect(parseVNDInput('100.50').success).toBe(false);
    expect(parseVNDInput('100,5').success).toBe(false);
    expect(parseVNDInput('100,75').success).toBe(false);
  });

  it('rejects non-numeric inputs', () => {
    expect(parseVNDInput('abc').success).toBe(false);
    expect(parseVNDInput('100k').success).toBe(false);
    expect(parseVNDInput('$100').success).toBe(false);
    expect(parseVNDInput('').success).toBe(false);
  });
});

describe('Date Formatting in Asia/Ho_Chi_Minh', () => {
  it('formats UTC timestamp in Asia/Ho_Chi_Minh timezone in English', () => {
    // 2026-10-23T03:30:00Z is 10:30 AM in UTC+7 (Ho Chi Minh)
    const date = new Date('2026-10-23T03:30:00Z');
    const formatted = formatVNDDate(date);
    expect(formatted).toContain('2026');
    expect(formatted).toContain('Oct 23');
    expect(formatted).toContain('10:30');
    expect(formatted).toContain('AM');
  });
});

describe('Financial Summary Calculations', () => {
  it('calculates initial balance as 0 ₫', () => {
    const summary = calculateFinancialSummary([]);
    expect(summary.currentBalance).toBe(0);
    expect(summary.totalAdded).toBe(0);
    expect(summary.totalSubtracted).toBe(0);
    expect(summary.transactionCount).toBe(0);
  });

  it('calculates totals correctly from example in prompt', () => {
    // Action 1: Add 1,000,000 -> 1,000,000
    // Action 2: Subtract 200,000 -> 800,000
    // Action 3: Add 500,000 -> 1,300,000
    const txs: Array<{ type: 'ADD' | 'SUBTRACT'; amount: number }> = [
      { type: 'ADD', amount: 1000000 },
      { type: 'SUBTRACT', amount: 200000 },
      { type: 'ADD', amount: 500000 },
    ];
    const summary = calculateFinancialSummary(txs);
    expect(summary.totalAdded).toBe(1500000);
    expect(summary.totalSubtracted).toBe(200000);
    expect(summary.currentBalance).toBe(1300000);
    expect(summary.transactionCount).toBe(3);
  });
});

describe('Running Balance and Non-negative Rule', () => {
  const baseTxs: LedgerTransaction[] = [
    {
      id: '1',
      type: 'ADD',
      amount: 1000000,
      createdAt: new Date('2026-10-01T00:00:00Z'),
    },
    {
      id: '2',
      type: 'SUBTRACT',
      amount: 300000,
      createdAt: new Date('2026-10-02T00:00:00Z'),
    },
    {
      id: '3',
      type: 'ADD',
      amount: 500000,
      createdAt: new Date('2026-10-03T00:00:00Z'),
    },
  ];

  it('validates a valid ledger', () => {
    const check = validateRunningBalance(baseTxs);
    expect(check.valid).toBe(true);
  });

  it('detects negative running balance', () => {
    const invalidTxs: LedgerTransaction[] = [
      {
        id: '1',
        type: 'SUBTRACT',
        amount: 500000,
        createdAt: new Date('2026-10-01T00:00:00Z'),
      },
    ];
    const check = validateRunningBalance(invalidTxs);
    expect(check.valid).toBe(false);
    expect(check.minBalance).toBe(-500000);
  });

  it('allows safe deletion of an addition when remaining balance stays >= 0', () => {
    // Current balance: 1,200,000. Deleting tx 3 (500,000) leaves 700,000 -> Allowed
    const res = canDeleteTransaction(baseTxs, '3');
    expect(res.allowed).toBe(true);
  });

  it('prevents deletion of an addition when remaining balance would become negative', () => {
    // Current balance: 1,200,000. Deleting tx 1 (1,000,000) leaves 200,000,
    // BUT historically on Day 2: -300,000 without Day 1! -> Disallowed
    const res = canDeleteTransaction(baseTxs, '1');
    expect(res.allowed).toBe(false);
  });

  it('allows deleting any subtraction', () => {
    // Deleting a subtraction increases balance -> always safe
    const res = canDeleteTransaction(baseTxs, '2');
    expect(res.allowed).toBe(true);
  });

  it('prevents updating an addition to an amount that causes negative balance', () => {
    // Changing tx 1 from 1,000,000 down to 100,000 -> on Day 2: 100k - 300k = -200k -> Disallowed
    const res = canUpdateTransaction(baseTxs, '1', { amount: 100000 });
    expect(res.allowed).toBe(false);
  });

  it('prevents increasing a subtraction beyond available funds', () => {
    // Changing tx 2 from 300,000 up to 2,000,000 -> balance becomes negative -> Disallowed
    const res = canUpdateTransaction(baseTxs, '2', { amount: 2000000 });
    expect(res.allowed).toBe(false);
  });
});

describe('Zod Schema Validation', () => {
  it('validates valid creation payload', () => {
    const valid = CreateTransactionSchema.safeParse({
      type: 'ADD',
      amount: 1000000,
      note: 'Salary payment',
    });
    expect(valid.success).toBe(true);
  });

  it('rejects non-integer amounts', () => {
    const invalid = CreateTransactionSchema.safeParse({
      type: 'ADD',
      amount: 1000000.5,
    });
    expect(invalid.success).toBe(false);
  });

  it('rejects negative or zero amounts', () => {
    expect(
      CreateTransactionSchema.safeParse({ type: 'ADD', amount: 0 }).success,
    ).toBe(false);
    expect(
      CreateTransactionSchema.safeParse({ type: 'ADD', amount: -100 }).success,
    ).toBe(false);
  });

  it('validates valid creation payload with tag', () => {
    const valid = CreateTransactionSchema.safeParse({
      type: 'ADD',
      amount: 1000000,
      note: 'Salary payment',
      tag: 'Salary',
    });
    expect(valid.success).toBe(true);
    if (valid.success) {
      expect(valid.data.tag).toBe('Salary');
    }
  });

  it('validates updating transaction tag', () => {
    const valid = UpdateTransactionSchema.safeParse({
      tag: 'Food & Dining',
    });
    expect(valid.success).toBe(true);
    if (valid.success) {
      expect(valid.data.tag).toBe('Food & Dining');
    }
  });

  it('rejects invalid transaction type', () => {
    expect(
      CreateTransactionSchema.safeParse({ type: 'TRANSFER', amount: 1000 })
        .success,
    ).toBe(false);
  });
});

describe('Tag Validation Schemas', () => {
  it('validates a valid tag creation payload', () => {
    const res = CreateTagSchema.safeParse({
      name: 'Freelance',
      type: 'INCOME',
      color: '#22C55E',
    });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.name).toBe('Freelance');
      expect(res.data.type).toBe('INCOME');
    }
  });

  it('rejects empty or whitespace-only tag name', () => {
    const res = CreateTagSchema.safeParse({
      name: '   ',
      type: 'EXPENSE',
    });
    expect(res.success).toBe(false);
  });

  it('rejects invalid tag type', () => {
    const res = CreateTagSchema.safeParse({
      name: 'Bonus',
      type: 'TRANSFER',
    });
    expect(res.success).toBe(false);
  });

  it('validates tag update payload', () => {
    const res = UpdateTagSchema.safeParse({
      name: 'Investments',
      type: 'ALL',
      color: '#3B82F6',
    });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.name).toBe('Investments');
      expect(res.data.type).toBe('ALL');
    }
  });
});
