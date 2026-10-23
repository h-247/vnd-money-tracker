'use client';

import React, { useState, useEffect } from 'react';
import { X, Edit2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { formatVND, parseVNDInput, formatVNDDate } from '@/lib/financial';
import { Transaction } from '@/db/schema';
import { TagSelector } from '@/components/TagSelector';

interface EditTransactionModalProps {
  isOpen: boolean;
  transaction: Transaction | null;
  availableTags?: string[];
  onClose: () => void;
  onConfirm: (
    id: string,
    data: {
      amount: number;
      note?: string;
      tag?: string | null;
      type?: 'ADD' | 'SUBTRACT';
    },
  ) => Promise<void>;
  onManageTags?: () => void;
}

export function EditTransactionModal({
  isOpen,
  transaction,
  availableTags = [],
  onClose,
  onConfirm,
  onManageTags,
}: EditTransactionModalProps) {
  const [amountInput, setAmountInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [type, setType] = useState<'ADD' | 'SUBTRACT'>('ADD');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && transaction) {
      setAmountInput(new Intl.NumberFormat('en-US').format(transaction.amount));
      setNoteInput(transaction.note || '');
      setSelectedTag(transaction.tag || null);
      setType(transaction.type as 'ADD' | 'SUBTRACT');
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, transaction]);

  if (!isOpen || !transaction) return null;

  const parsed = parseVNDInput(amountInput);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!parsed.success || !parsed.amount) {
      setError(parsed.error || 'Please enter a valid positive VND amount.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onConfirm(transaction.id, {
        amount: parsed.amount,
        note: noteInput.trim(),
        tag: selectedTag || null,
        type,
      });
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to update transaction.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-transaction-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-[#262626] border border-[#2E2E2E] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2E2E2E] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-950/60 border border-blue-800/40 text-blue-400">
              <Edit2 className="w-4 h-4" />
            </div>
            <div>
              <h3
                id="edit-transaction-title"
                className="text-base font-semibold text-[#ECECEC]"
              >
                Edit Transaction
              </h3>
              <p className="text-xs text-[#9CA3AF]">
                Created on {formatVNDDate(transaction.createdAt)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#ECECEC] hover:bg-[#333333] transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-950/50 border border-red-800/40 text-red-300 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Type Selector */}
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] mb-1.5">
              Transaction Type
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('ADD')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  type === 'ADD'
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 shadow-sm'
                    : 'bg-[#1A1A1A] border-[#2E2E2E] text-[#9CA3AF] hover:bg-[#333333]'
                }`}
              >
                + Add Money
              </button>
              <button
                type="button"
                onClick={() => setType('SUBTRACT')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  type === 'SUBTRACT'
                    ? 'bg-red-950/60 border-red-500 text-red-300 shadow-sm'
                    : 'bg-[#1A1A1A] border-[#2E2E2E] text-[#9CA3AF] hover:bg-[#333333]'
                }`}
              >
                - Subtract Money
              </button>
            </div>
          </div>

          {/* Amount Field */}
          <div>
            <label
              htmlFor="edit-amount"
              className="block text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] mb-1.5"
            >
              Amount (VND) <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                id="edit-amount"
                type="text"
                value={amountInput}
                onChange={(e) => {
                  setAmountInput(e.target.value);
                  setError(null);
                }}
                disabled={isSubmitting}
                className="w-full px-4 py-3 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-lg font-semibold text-[#ECECEC] placeholder:text-[#666666] focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#9CA3AF] pointer-events-none">
                ₫
              </span>
            </div>

            {parsed.success && parsed.amount && (
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-blue-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>New amount: {formatVND(parsed.amount)}</span>
              </div>
            )}
          </div>

          {/* Tag Selector */}
          <TagSelector
            selectedTag={selectedTag}
            onSelectTag={setSelectedTag}
            tags={availableTags}
            accentColor={type === 'ADD' ? 'emerald' : 'red'}
            disabled={isSubmitting}
            onManageTags={onManageTags}
          />

          {/* Note Field */}
          <div>
            <label
              htmlFor="edit-note"
              className="block text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] mb-1.5"
            >
              Note{' '}
              <span className="text-xs font-normal text-[#666666]">
                (Optional)
              </span>
            </label>
            <input
              id="edit-note"
              type="text"
              maxLength={500}
              placeholder="e.g. Note description..."
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-4 py-2.5 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-sm text-[#ECECEC] placeholder:text-[#666666] focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2E2E2E]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#333333] hover:bg-[#3F3F46] text-[#ECECEC] border border-[#444444] transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !amountInput.trim()}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-white text-[#171717] hover:bg-zinc-200 transition-colors shadow-md disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-zinc-800 border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
