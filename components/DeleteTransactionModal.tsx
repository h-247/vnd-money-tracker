'use client';

import React, { useState } from 'react';
import { X, Trash2, AlertTriangle, AlertCircle } from 'lucide-react';
import { formatVND, formatVNDDate } from '@/lib/financial';
import { Transaction } from '@/db/schema';

interface DeleteTransactionModalProps {
  isOpen: boolean;
  transaction: Transaction | null;
  currentBalance: number;
  onClose: () => void;
  onConfirm: (id: string) => Promise<void>;
}

export function DeleteTransactionModal({
  isOpen,
  transaction,
  currentBalance,
  onClose,
  onConfirm,
}: DeleteTransactionModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !transaction) return null;

  // If this is an ADD transaction, deleting it reduces current balance by amount
  const isAdd = transaction.type === 'ADD';
  const wouldViolateBalance = isAdd && transaction.amount > currentBalance;
  const balanceAfterDelete = isAdd
    ? currentBalance - transaction.amount
    : currentBalance + transaction.amount;

  const handleDelete = async () => {
    if (isDeleting || wouldViolateBalance) return;

    try {
      setIsDeleting(true);
      setError(null);
      await onConfirm(transaction.id);
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to delete transaction.';
      setError(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-transaction-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-[#262626] border border-[#2E2E2E] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2E2E2E] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-950/60 border border-red-800/40 text-red-400">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <h3
                id="delete-transaction-title"
                className="text-base font-semibold text-[#ECECEC]"
              >
                Delete Transaction
              </h3>
              <p className="text-xs text-[#9CA3AF]">
                Confirm permanent removal
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#ECECEC] hover:bg-[#333333] transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-950/50 border border-red-800/40 text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {wouldViolateBalance && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-950/60 border border-amber-800/40 text-amber-300 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <div>
                <p className="font-semibold">Cannot Delete This Transaction</p>
                <p className="mt-1 text-amber-200/90">
                  Deleting this addition of {formatVND(transaction.amount)}{' '}
                  would reduce your balance to {formatVND(balanceAfterDelete)},
                  violating the non-negative balance rule.
                </p>
              </div>
            </div>
          )}

          <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-[#9CA3AF]">Type:</span>
              <span
                className={`font-semibold ${
                  isAdd ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {isAdd ? '+ Addition' : '- Subtraction'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#9CA3AF]">Amount:</span>
              <span className="font-bold text-[#ECECEC]">
                {formatVND(transaction.amount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#9CA3AF]">Date:</span>
              <span className="text-[#ECECEC]">
                {formatVNDDate(transaction.createdAt)}
              </span>
            </div>
            {transaction.note && (
              <div className="flex justify-between">
                <span className="text-[#9CA3AF]">Note:</span>
                <span className="text-[#ECECEC] max-w-[200px] truncate">
                  {transaction.note}
                </span>
              </div>
            )}
            <div className="pt-2 border-t border-[#2E2E2E] flex justify-between">
              <span className="text-[#9CA3AF]">Balance After:</span>
              <span
                className={`font-semibold ${
                  balanceAfterDelete < 0 ? 'text-red-400' : 'text-[#ECECEC]'
                }`}
              >
                {formatVND(balanceAfterDelete)}
              </span>
            </div>
          </div>

          <p className="text-xs text-[#9CA3AF]">
            Are you sure you want to delete this record? This action cannot be
            undone.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#2E2E2E]">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#333333] hover:bg-[#3F3F46] text-[#ECECEC] border border-[#444444] transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-400"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting || wouldViolateBalance}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-500 text-white transition-colors shadow-md disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            {isDeleting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
