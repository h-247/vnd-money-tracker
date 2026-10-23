import { z } from 'zod';

export interface FinancialSummary {
  currentBalance: number;
  totalAdded: number;
  totalSubtracted: number;
  transactionCount: number;
}

export interface LedgerTransaction {
  id: string;
  type: 'ADD' | 'SUBTRACT';
  amount: number;
  createdAt: Date | number;
  note?: string | null;
  tag?: string | null;
}

export const DEFAULT_INCOME_TAGS = [
  'Salary',
  'Bonus',
  'Investment',
  'Gift',
  'Side Hustle',
  'Refund',
  'Other',
];

export const DEFAULT_EXPENSE_TAGS = [
  'Food & Dining',
  'Groceries',
  'Transport',
  'Housing & Rent',
  'Bills & Utilities',
  'Shopping',
  'Entertainment',
  'Healthcare',
  'Education',
  'Family',
  'Other',
];

export const TagTypeSchema = z.enum(['INCOME', 'EXPENSE', 'ALL']);

export const CreateTagSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Tag name cannot be empty')
    .max(40, 'Tag name cannot exceed 40 characters'),
  type: TagTypeSchema.default('ALL'),
  color: z.string().trim().max(30).optional().nullable(),
});

export const UpdateTagSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Tag name cannot be empty')
    .max(40, 'Tag name cannot exceed 40 characters')
    .optional(),
  type: TagTypeSchema.optional(),
  color: z.string().trim().max(30).optional().nullable(),
});

export const MAX_SAFE_VND = 100_000_000_000_000; // 100 trillion VND limit for safety

export const TransactionTypeSchema = z.enum(['ADD', 'SUBTRACT']);

export const CreateTransactionSchema = z.object({
  type: TransactionTypeSchema,
  amount: z
    .number()
    .int('Amount must be a whole number (Vietnamese Dong has no fractions)')
    .positive('Amount must be greater than 0')
    .max(MAX_SAFE_VND, `Amount cannot exceed ${formatVND(MAX_SAFE_VND)}`),
  note: z
    .string()
    .trim()
    .max(500, 'Note cannot exceed 500 characters')
    .optional()
    .nullable(),
  tag: z
    .string()
    .trim()
    .max(100, 'Tag cannot exceed 100 characters')
    .optional()
    .nullable(),
});

export const UpdateTransactionSchema = z.object({
  type: TransactionTypeSchema.optional(),
  amount: z
    .number()
    .int('Amount must be a whole number (Vietnamese Dong has no fractions)')
    .positive('Amount must be greater than 0')
    .max(MAX_SAFE_VND, `Amount cannot exceed ${formatVND(MAX_SAFE_VND)}`)
    .optional(),
  note: z
    .string()
    .trim()
    .max(500, 'Note cannot exceed 500 characters')
    .optional()
    .nullable(),
  tag: z
    .string()
    .trim()
    .max(100, 'Tag cannot exceed 100 characters')
    .optional()
    .nullable(),
});

/**
 * Formats a whole-number VND integer into an English string with Vietnamese Dong symbol.
 * Example: 1000000 -> "1,000,000 ₫"
 */
export function formatVND(amount: number | bigint): string {
  const num = typeof amount === 'bigint' ? Number(amount) : Math.round(amount);
  const formatted = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
    useGrouping: true,
  }).format(num);
  return `${formatted} ₫`;
}

/**
 * Parses user input into a valid whole-number VND integer.
 * Accepts numbers with or without thousand grouping separators (commas, dots, or spaces).
 * Strictly rejects fractional decimals, negative numbers, zero, and out-of-range values.
 */
export function parseVNDInput(input: string): {
  success: boolean;
  amount?: number;
  error?: string;
} {
  if (!input || typeof input !== 'string') {
    return { success: false, error: 'Please enter an amount' };
  }

  const raw = input.trim();
  if (raw === '') {
    return { success: false, error: 'Please enter an amount' };
  }

  // Check for negative numbers
  if (raw.startsWith('-') || raw.includes('-')) {
    return {
      success: false,
      error: 'Amount must be positive. Negative numbers are not allowed.',
    };
  }

  // Check for explicit decimal points like 100.5 or 100,50
  // In VND there are no fractional currencies.
  // Grouping separators:
  // "1,000,000" (en-US standard) -> commas followed by 3 digits
  // "1.000.000" (vi standard) -> dots followed by 3 digits
  // If dot or comma has 1 or 2 digits at the end (e.g. 100.5 or 100,5), it's a decimal fraction!
  if (/[,.]\d{1,2}$/.test(raw)) {
    return {
      success: false,
      error:
        'Vietnamese Dong does not use decimal fractions. Please enter a whole number.',
    };
  }

  // Remove commas, dots (used as thousand separators), and spaces
  const cleaned = raw.replace(/[.,\s_]/g, '');

  if (!/^\d+$/.test(cleaned)) {
    return {
      success: false,
      error: 'Please enter valid digits only.',
    };
  }

  const parsed = Number(cleaned);

  if (!Number.isSafeInteger(parsed)) {
    return {
      success: false,
      error: 'Amount exceeds supported numeric limit.',
    };
  }

  if (parsed <= 0) {
    return {
      success: false,
      error: 'Amount must be greater than 0 ₫.',
    };
  }

  if (parsed > MAX_SAFE_VND) {
    return {
      success: false,
      error: `Amount cannot exceed ${formatVND(MAX_SAFE_VND)}.`,
    };
  }

  return { success: true, amount: parsed };
}

/**
 * Formats a date in Asia/Ho_Chi_Minh timezone using readable English format.
 * Example: "Oct 23, 2026, 10:30 AM"
 */
export function formatVNDDate(date: Date | string | number): string {
  const d =
    typeof date === 'string' || typeof date === 'number'
      ? new Date(date)
      : date;

  if (Number.isNaN(d.getTime())) {
    return 'Invalid date';
  }

  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}

/**
 * Formats date-only in Asia/Ho_Chi_Minh timezone.
 * Example: "Oct 23, 2026"
 */
export function formatVNDDateOnly(date: Date | string | number): string {
  const d =
    typeof date === 'string' || typeof date === 'number'
      ? new Date(date)
      : date;

  if (Number.isNaN(d.getTime())) {
    return 'Invalid date';
  }

  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
}

/**
 * Calculates current balance and totals from a collection of transactions.
 * Current Balance = Total Added - Total Subtracted
 */
export function calculateFinancialSummary(
  transactions: Array<{ type: 'ADD' | 'SUBTRACT'; amount: number }>,
): FinancialSummary {
  let totalAdded = 0;
  let totalSubtracted = 0;

  for (const tx of transactions) {
    if (tx.type === 'ADD') {
      totalAdded += tx.amount;
    } else if (tx.type === 'SUBTRACT') {
      totalSubtracted += tx.amount;
    }
  }

  const currentBalance = totalAdded - totalSubtracted;

  return {
    currentBalance,
    totalAdded,
    totalSubtracted,
    transactionCount: transactions.length,
  };
}

/**
 * Verifies that the chronological running balance never drops below zero.
 */
export function validateRunningBalance(transactions: LedgerTransaction[]): {
  valid: boolean;
  minBalance: number;
  violationTx?: LedgerTransaction;
} {
  // Sort ascending by createdAt
  const sorted = [...transactions].sort((a, b) => {
    const timeA =
      a.createdAt instanceof Date ? a.createdAt.getTime() : a.createdAt;
    const timeB =
      b.createdAt instanceof Date ? b.createdAt.getTime() : b.createdAt;
    if (timeA !== timeB) return timeA - timeB;
    return a.id.localeCompare(b.id);
  });

  let runningBalance = 0;
  let minBalance = 0;

  for (const tx of sorted) {
    if (tx.type === 'ADD') {
      runningBalance += tx.amount;
    } else {
      runningBalance -= tx.amount;
    }

    if (runningBalance < minBalance) {
      minBalance = runningBalance;
    }

    if (runningBalance < 0) {
      return {
        valid: false,
        minBalance,
        violationTx: tx,
      };
    }
  }

  return {
    valid: true,
    minBalance,
  };
}

/**
 * Checks if a proposed deletion would violate the nonnegative balance rule.
 */
export function canDeleteTransaction(
  transactions: LedgerTransaction[],
  txIdToDelete: string,
): { allowed: boolean; reason?: string } {
  const target = transactions.find((t) => t.id === txIdToDelete);
  if (!target) {
    return { allowed: false, reason: 'Transaction not found.' };
  }

  const remaining = transactions.filter((t) => t.id !== txIdToDelete);
  const summary = calculateFinancialSummary(remaining);

  if (summary.currentBalance < 0) {
    return {
      allowed: false,
      reason: `Deleting this transaction would reduce your total balance to ${formatVND(
        summary.currentBalance,
      )}, which violates the non-negative balance rule.`,
    };
  }

  const runningCheck = validateRunningBalance(remaining);
  if (!runningCheck.valid) {
    return {
      allowed: false,
      reason: `Deleting this transaction would result in a negative balance of ${formatVND(
        runningCheck.minBalance,
      )} in transaction history.`,
    };
  }

  return { allowed: true };
}

/**
 * Checks if a proposed edit would violate the nonnegative balance rule.
 */
export function canUpdateTransaction(
  transactions: LedgerTransaction[],
  txIdToUpdate: string,
  updates: { amount?: number; type?: 'ADD' | 'SUBTRACT' },
): { allowed: boolean; reason?: string } {
  const target = transactions.find((t) => t.id === txIdToUpdate);
  if (!target) {
    return { allowed: false, reason: 'Transaction not found.' };
  }

  const updatedTransactions = transactions.map((t) => {
    if (t.id === txIdToUpdate) {
      return {
        ...t,
        amount: updates.amount ?? t.amount,
        type: updates.type ?? t.type,
      };
    }
    return t;
  });

  const summary = calculateFinancialSummary(updatedTransactions);
  if (summary.currentBalance < 0) {
    return {
      allowed: false,
      reason: `Updating this transaction would reduce your total balance to ${formatVND(
        summary.currentBalance,
      )}, which violates the non-negative balance rule.`,
    };
  }

  const runningCheck = validateRunningBalance(updatedTransactions);
  if (!runningCheck.valid) {
    return {
      allowed: false,
      reason: `Updating this transaction would result in a negative balance of ${formatVND(
        runningCheck.minBalance,
      )} in transaction history.`,
    };
  }

  return { allowed: true };
}
