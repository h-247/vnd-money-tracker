'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Minus,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { formatVND, parseVNDInput } from '@/lib/financial';
import { TagSelector } from '@/components/TagSelector';

interface SubtractMoneyModalProps {
  isOpen: boolean;
  currentBalance: number;
  availableTags?: string[];
  onClose: () => void;
  onConfirm: (data: {
    amount: number;
    note?: string;
    tag?: string;
  }) => Promise<void>;
  onManageTags?: () => void;
}

const QUICK_AMOUNTS = [50000, 100000, 200000, 500000, 1000000];

export function SubtractMoneyModal({
  isOpen,
  currentBalance,
  availableTags = [],
  onClose,
  onConfirm,
  onManageTags,
}: SubtractMoneyModalProps) {
  const [amountInput, setAmountInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAmountInput('');
      setNoteInput('');
      setSelectedTag(null);
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const parsed = parseVNDInput(amountInput);
  const isInsufficientFunds =
    parsed.success &&
    parsed.amount !== undefined &&
    parsed.amount > currentBalance;

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!parsed.success || !parsed.amount) {
      setError(parsed.error || 'Please enter a valid positive VND amount.');
      return;
    }

    if (parsed.amount > currentBalance) {
      setError(
        `Insufficient funds. Your available balance is ${formatVND(
          currentBalance,
        )}, but you tried to subtract ${formatVND(parsed.amount)}.`,
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onConfirm({
        amount: parsed.amount,
        note: noteInput.trim() || undefined,
        tag: selectedTag || undefined,
      });
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to subtract money. Please try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickSubtract = (amount: number) => {
    setAmountInput(new Intl.NumberFormat('en-US').format(amount));
    setError(null);
  };

  const handleMaxAvailable = () => {
    if (currentBalance > 0) {
      setAmountInput(new Intl.NumberFormat('en-US').format(currentBalance));
      setError(null);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="subtract-money-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-[#262626] border border-[#2E2E2E] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2E2E2E] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-950/60 border border-red-800/40 text-red-400">
              <Minus className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3
                id="subtract-money-title"
                className="text-base font-semibold text-[#ECECEC]"
              >
                Subtract Money
              </h3>
              <p className="text-xs text-[#9CA3AF]">
                Record an expenditure or money withdrawal
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

        {/* Current Available Banner */}
        <div className="bg-[#1A1A1A] px-6 py-3 border-b border-[#2E2E2E] flex items-center justify-between">
          <span className="text-xs text-[#9CA3AF]">Available Balance:</span>
          <span className="text-sm font-bold text-[#ECECEC]">
            {formatVND(currentBalance)}
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-950/50 border border-red-800/40 text-red-300 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {isInsufficientFunds && !error && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-950/50 border border-amber-800/40 text-amber-300 text-xs animate-in fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <span>
                Entered amount exceeds your available balance of{' '}
                {formatVND(currentBalance)}.
              </span>
            </div>
          )}

          {/* Amount Field */}
          <div>
            <label
              htmlFor="subtract-amount"
              className="block text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] mb-1.5"
            >
              Amount (VND) <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                id="subtract-amount"
                type="text"
                autoFocus
                placeholder="e.g. 200,000"
                value={amountInput}
                onChange={(e) => {
                  setAmountInput(e.target.value);
                  setError(null);
                }}
                disabled={isSubmitting}
                className={`w-full px-4 py-3 rounded-xl bg-[#1A1A1A] border text-lg font-semibold text-[#ECECEC] placeholder:text-[#666666] focus:outline-none transition-all ${
                  isInsufficientFunds
                    ? 'border-red-500/80 focus:ring-2 focus:ring-red-500/30'
                    : 'border-[#2E2E2E] focus:ring-2 focus:ring-white/30 focus:border-transparent'
                }`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#9CA3AF] pointer-events-none">
                ₫
              </span>
            </div>

            {/* Live Formatted Preview */}
            {parsed.success && parsed.amount && !isInsufficientFunds && (
              <div className="mt-1.5 flex items-center justify-between text-xs font-medium">
                <span className="flex items-center gap-1.5 text-red-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Will subtract: {formatVND(parsed.amount)}
                </span>
                <span className="text-[#9CA3AF]">
                  Remaining:{' '}
                  {formatVND(Math.max(0, currentBalance - parsed.amount))}
                </span>
              </div>
            )}

            {/* Quick Presets */}
            <div className="mt-2.5">
              <p className="text-[11px] font-medium text-[#9CA3AF] mb-1.5">
                Quick Options:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_AMOUNTS.filter((amt) => amt <= currentBalance).map(
                  (amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleQuickSubtract(amt)}
                      disabled={isSubmitting}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg bg-[#333333] hover:bg-[#3F3F46] text-[#ECECEC] border border-[#3E3E3E] transition-colors active:scale-95"
                    >
                      {formatVND(amt)}
                    </button>
                  ),
                )}
                {currentBalance > 0 && (
                  <button
                    type="button"
                    onClick={handleMaxAvailable}
                    disabled={isSubmitting}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg bg-zinc-700/60 hover:bg-zinc-700 text-amber-300 border border-amber-500/30 transition-colors active:scale-95"
                  >
                    All Available ({formatVND(currentBalance)})
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Tag Selector */}
          <TagSelector
            selectedTag={selectedTag}
            onSelectTag={setSelectedTag}
            tags={availableTags}
            accentColor="red"
            disabled={isSubmitting}
            onManageTags={onManageTags}
          />

          {/* Note Field */}
          <div>
            <label
              htmlFor="subtract-note"
              className="block text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] mb-1.5"
            >
              Note{' '}
              <span className="text-xs font-normal text-[#666666]">
                (Optional)
              </span>
            </label>
            <input
              id="subtract-note"
              type="text"
              maxLength={500}
              placeholder="e.g. Lunch, groceries, utilities, coffee..."
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
              disabled={
                isSubmitting ||
                !amountInput.trim() ||
                isInsufficientFunds ||
                currentBalance <= 0
              }
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-white text-[#171717] hover:bg-zinc-200 transition-colors shadow-md disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-zinc-800 border-t-transparent rounded-full animate-spin" />
                  <span>Subtracting...</span>
                </>
              ) : (
                <>
                  <Minus className="w-4 h-4 stroke-[2.5]" />
                  <span>Confirm Subtract</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
