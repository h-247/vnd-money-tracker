'use client';

import React from 'react';
import { Plus, Minus, ShieldCheck } from 'lucide-react';
import { formatVND } from '@/lib/financial';

interface BalanceCardProps {
  currentBalance: number;
  onOpenAddModal: () => void;
  onOpenSubtractModal: () => void;
  isLoading?: boolean;
  readOnly?: boolean;
}

export function BalanceCard({
  currentBalance,
  onOpenAddModal,
  onOpenSubtractModal,
  isLoading,
  readOnly,
}: BalanceCardProps) {
  return (
    <section
      aria-label="Current Available Balance"
      className="relative overflow-hidden rounded-2xl bg-[#262626] border border-[#2E2E2E] p-6 sm:p-8 shadow-lg"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">
              Current Available Balance
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
              <ShieldCheck className="w-3 h-3" />
              Non-Negative Guaranteed
            </span>
          </div>

          <div className="mt-3">
            {isLoading ? (
              <div className="h-12 w-48 rounded-lg bg-[#333333] animate-pulse" />
            ) : (
              <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#ECECEC] font-sans">
                {formatVND(currentBalance)}
              </h2>
            )}
          </div>
          <p className="mt-2 text-xs text-[#9CA3AF]">
            Calculated authoritative balance across all saved ledger records in
            Vietnamese Dong.
          </p>
        </div>

        {/* Primary Action Buttons */}
        {!readOnly && (
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Add Money: Primary Button (White bg, black text) */}
            <button
              type="button"
              onClick={onOpenAddModal}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-semibold text-sm bg-white text-[#171717] hover:bg-zinc-200 active:scale-[0.98] transition-all duration-150 shadow-md focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Money</span>
            </button>

            {/* Subtract Money: Secondary Button (Dark gray with hover effects) */}
            <button
              type="button"
              onClick={onOpenSubtractModal}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-semibold text-sm bg-[#333333] hover:bg-[#3F3F46] active:scale-[0.98] text-[#ECECEC] transition-all duration-150 border border-[#444444] shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
            >
              <Minus className="w-4 h-4 stroke-[2.5]" />
              <span>Subtract Money</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
