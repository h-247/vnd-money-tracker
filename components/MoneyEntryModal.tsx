'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Minus,
  Plus,
  Wallet,
  X,
} from 'lucide-react';
import { formatVND, parseVNDInput } from '@/lib/financial';
import { TagSelector } from '@/components/TagSelector';

export type MoneyEntryType = 'ADD' | 'SUBTRACT';

interface MoneyEntryModalProps {
  isOpen: boolean;
  initialType: MoneyEntryType;
  currentBalance: number;
  availableTags: string[];
  onClose: () => void;
  onTypeChange: (type: MoneyEntryType) => void;
  onConfirm: (
    type: MoneyEntryType,
    data: { amount: number; note?: string; tag?: string },
  ) => Promise<void>;
  onManageTags?: () => void;
}

const QUICK_AMOUNTS = [100_000, 1_000_000, 10_000_000];

export function MoneyEntryModal({
  isOpen,
  initialType,
  currentBalance,
  availableTags,
  onClose,
  onTypeChange,
  onConfirm,
  onManageTags,
}: MoneyEntryModalProps) {
  const [type, setType] = useState<MoneyEntryType>(initialType);
  const [amountInput, setAmountInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mobileViewport, setMobileViewport] = useState<{
    top: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    if (isOpen) setType(initialType);
  }, [initialType, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setAmountInput('');
      setNoteInput('');
      setSelectedTag(null);
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || typeof window === 'undefined' || window.innerWidth >= 640) {
      setMobileViewport(null);
      return;
    }

    const viewport = window.visualViewport;
    if (!viewport) return;

    const updateViewport = () => {
      setMobileViewport({ top: viewport.offsetTop, height: viewport.height });
    };
    updateViewport();
    viewport.addEventListener('resize', updateViewport);
    viewport.addEventListener('scroll', updateViewport);
    window.addEventListener('resize', updateViewport);

    return () => {
      viewport.removeEventListener('resize', updateViewport);
      viewport.removeEventListener('scroll', updateViewport);
      window.removeEventListener('resize', updateViewport);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const parsed = parseVNDInput(amountInput);
  const isAdd = type === 'ADD';
  const isInsufficientFunds =
    !isAdd &&
    parsed.success &&
    parsed.amount !== undefined &&
    parsed.amount > currentBalance;
  const accentText = isAdd ? 'text-[#EB168B]' : 'text-[#5965D8]';
  const accentBorder = isAdd ? 'border-[#EB168B]' : 'border-[#5965D8]';
  const accentBackground = isAdd ? 'bg-[#FDE7F2]' : 'bg-[#E9ECFF]';
  const actionLabel = isAdd ? 'Add Money' : 'Subtract Money';

  const selectType = (nextType: MoneyEntryType) => {
    if (nextType === type) return;
    setType(nextType);
    setSelectedTag(null);
    setError(null);
    onTypeChange(nextType);
  };

  const setAmount = (value: number) => {
    setAmountInput(new Intl.NumberFormat('en-US').format(value));
    setError(null);
  };

  const handleQuickAmount = (value: number) => {
    setAmount(value);
  };

  const formatAmountInput = (value: string) => {
    const digits = value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
    setAmountInput(
      digits ? new Intl.NumberFormat('en-US').format(Number(digits)) : '',
    );
    setError(null);
  };

  const handleSubmit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    if (!parsed.success || !parsed.amount) {
      setError(parsed.error || 'Enter a valid positive VND amount.');
      return;
    }
    if (isInsufficientFunds) {
      setError(`Your available balance is ${formatVND(currentBalance)}.`);
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onConfirm(type, {
        amount: parsed.amount,
        note: noteInput.trim() || undefined,
        tag: selectedTag || undefined,
      });
      onClose();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : `Could not ${isAdd ? 'add' : 'subtract'} money. Please try again.`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="money-entry-title"
      className="fixed inset-x-0 top-0 z-50 bg-[#F8E8EF] sm:inset-0 sm:flex sm:items-center sm:justify-center sm:bg-black/60 sm:p-4 sm:backdrop-blur-sm"
      style={
        mobileViewport
          ? { top: mobileViewport.top, height: mobileViewport.height }
          : undefined
      }
    >
      <section className="mx-auto flex h-full max-h-full w-full flex-col overflow-hidden bg-white text-[#242126] shadow-xl sm:h-auto sm:max-h-[92vh] sm:max-w-lg sm:rounded-2xl sm:border sm:border-zinc-200">
        <header className="flex shrink-0 items-center justify-between border-b border-[#F0E7EC] px-4 py-3 sm:px-5">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl border ${accentBorder} ${accentBackground} ${accentText}`}
            >
              {isAdd ? (
                <Plus className="h-5 w-5 stroke-[2.5]" />
              ) : (
                <Minus className="h-5 w-5 stroke-[2.5]" />
              )}
            </div>
            <div>
              <h2 id="money-entry-title" className="text-base font-bold">
                Add or subtract money
              </h2>
              <p className="text-xs text-[#77717A]">
                Record a balance change in VND
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close money form"
            className="rounded-lg p-2 text-[#77717A] transition hover:bg-[#F5F1F3] hover:text-[#242126] disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="shrink-0 px-4 pt-4 sm:px-5">
          <div
            role="tablist"
            aria-label="Transaction type"
            className="mx-4 mt-3 grid grid-cols-2 rounded-xl bg-[#F1EFF0] p-1 sm:mx-5"
          >
            <button
              type="button"
              role="tab"
              aria-selected={isAdd}
              onClick={() => selectType('ADD')}
              disabled={isSubmitting}
              className={`flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-semibold transition ${
                isAdd
                  ? 'bg-white text-[#EB168B] shadow-sm'
                  : 'text-[#6F6B70] hover:text-[#242126]'
              }`}
            >
              <Plus className="h-4 w-4" />
              Add Money
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={!isAdd}
              onClick={() => selectType('SUBTRACT')}
              disabled={isSubmitting}
              className={`flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-semibold transition ${
                !isAdd
                  ? 'bg-white text-[#5965D8] shadow-sm'
                  : 'text-[#6F6B70] hover:text-[#242126]'
              }`}
            >
              <Minus className="h-4 w-4" />
              Subtract Money
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-[#242126]">
                  {isAdd ? 'Add money to balance' : 'Subtract from balance'}
                </h3>
                <p className="mt-1 text-xs text-[#77717A]">
                  {isAdd
                    ? 'Choose a category and enter the amount.'
                    : 'Record an expense or withdrawal.'}
                </p>
              </div>
              <div className="shrink-0 rounded-lg border border-[#E9E3E7] bg-[#FAF8F9] px-3 py-2 text-right">
                <span className="block text-[10px] uppercase tracking-wide text-[#77717A]">
                  Available
                </span>
                <span className="text-xs font-semibold text-[#242126]">
                  {formatVND(currentBalance)}
                </span>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {isInsufficientFunds && !error && (
              <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  This is more than your available balance of{' '}
                  {formatVND(currentBalance)}.
                </span>
              </div>
            )}

            <TagSelector
              selectedTag={selectedTag}
              onSelectTag={setSelectedTag}
              tags={availableTags}
              accentColor={isAdd ? 'emerald' : 'blue'}
              variant="cards"
              disabled={isSubmitting}
              onManageTags={onManageTags}
            />

            <div className="space-y-2">
              <label
                htmlFor="money-entry-amount"
                className="block text-sm font-medium text-[#514C52]"
              >
                Amount needed
              </label>
              <div
                className={`relative rounded-xl border bg-white transition focus-within:ring-2 ${
                  isInsufficientFunds
                    ? 'border-red-500/80 focus-within:ring-red-500/20'
                    : isAdd
                      ? 'border-[#EB168B]/70 focus-within:ring-[#EB168B]/15'
                      : 'border-[#5965D8]/70 focus-within:ring-[#5965D8]/15'
                }`}
              >
                <input
                  id="money-entry-amount"
                  type="text"
                  inputMode="numeric"
                  autoFocus
                  autoComplete="off"
                  placeholder="0"
                  value={amountInput}
                  onChange={(event) => formatAmountInput(event.target.value)}
                  disabled={isSubmitting}
                  aria-describedby="money-entry-currency money-entry-preview"
                  className="w-full rounded-xl bg-transparent px-4 py-4 pr-16 text-3xl font-bold tracking-tight text-[#242126] outline-none placeholder:text-[#AAA4AA]"
                />
                <span
                  id="money-entry-currency"
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-base font-semibold text-[#77717A]"
                >
                  ₫
                </span>
                {amountInput && (
                  <button
                    type="button"
                    onClick={() => formatAmountInput('')}
                    disabled={isSubmitting}
                    aria-label="Clear amount"
                    className="absolute right-10 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#8A8389] hover:bg-[#F3EEF1]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div id="money-entry-preview" className="min-h-5">
                {parsed.success && parsed.amount ? (
                  <p
                    className={`flex items-center gap-1.5 text-xs font-medium ${accentText}`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {isAdd ? 'Will add' : 'Will subtract'}{' '}
                    {formatVND(parsed.amount)}
                    {!isAdd && !isInsufficientFunds && (
                      <span className="ml-auto text-[#77717A]">
                        Left {formatVND(currentBalance - parsed.amount)}
                      </span>
                    )}
                  </p>
                ) : (
                  <p className="text-xs text-[#77717A]">
                    {isAdd
                      ? 'This amount will increase your available balance.'
                      : 'The amount cannot exceed your available balance.'}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-[#F3E7ED] bg-[#FFF8FB] p-3 text-xs leading-5 text-[#6F6B70]">
              <Wallet className="h-4 w-4 shrink-0 text-[#EB168B]" />
              {isAdd
                ? 'Your balance is recalculated from saved transactions.'
                : 'Your available balance is protected from going below zero.'}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="money-entry-note"
                className="block text-sm font-medium text-[#514C52]"
              >
                Note{' '}
                <span className="font-normal text-[#777777]">(optional)</span>
              </label>
              <input
                id="money-entry-note"
                type="text"
                maxLength={500}
                placeholder={isAdd ? 'e.g. Salary, refund' : 'e.g. Food, bills'}
                value={noteInput}
                onChange={(event) => setNoteInput(event.target.value)}
                disabled={isSubmitting}
                className="w-full rounded-xl border border-[#E5DDE2] bg-white px-4 py-3 text-sm text-[#242126] outline-none transition placeholder:text-[#AAA4AA] focus:border-[#EB168B] focus:ring-2 focus:ring-[#EB168B]/10"
              />
            </div>
          </div>

          <footer className="shrink-0 space-y-2 border-t border-[#F0E7EC] bg-white px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 sm:px-5 sm:pb-3 sm:pt-3">
            <button
              type="submit"
              disabled={
                isSubmitting ||
                !amountInput.trim() ||
                isInsufficientFunds ||
                (!isAdd && currentBalance <= 0)
              }
              className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-base font-bold text-white shadow-md transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 ${isAdd ? 'bg-[#EB168B] hover:bg-[#D8127D]' : 'bg-[#5965D8] hover:bg-[#4854C7]'}`}
            >
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Saving…
                </>
              ) : (
                <>
                  {isAdd ? (
                    <Plus className="h-4 w-4 stroke-[2.5]" />
                  ) : (
                    <Minus className="h-4 w-4 stroke-[2.5]" />
                  )}
                  {actionLabel}
                </>
              )}
            </button>
            <div className="grid grid-cols-3 gap-2">
              {QUICK_AMOUNTS.filter(
                (amount) => isAdd || amount <= currentBalance,
              ).map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => handleQuickAmount(amount)}
                  disabled={isSubmitting}
                  className="rounded-lg bg-[#F1EFF0] px-2 py-1.5 text-xs font-semibold text-[#29252A] transition hover:bg-[#E8E4E6] active:scale-[0.98] disabled:opacity-50"
                >
                  {formatVND(amount)}
                </button>
              ))}
            </div>
            {!isAdd && currentBalance > 0 && (
              <button
                type="button"
                onClick={() => setAmount(currentBalance)}
                disabled={isSubmitting}
                className="w-full text-center text-[11px] font-medium text-[#77717A] hover:text-[#242126] disabled:opacity-50"
              >
                Use all available · {formatVND(currentBalance)}
              </button>
            )}
          </footer>
        </form>
      </section>
    </div>
  );
}
