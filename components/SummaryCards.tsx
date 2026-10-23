'use client';

import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatVND } from '@/lib/financial';

interface SummaryCardsProps {
  totalAdded: number;
  totalSubtracted: number;
  isLoading?: boolean;
}

export function SummaryCards({
  totalAdded,
  totalSubtracted,
  isLoading,
}: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Total Added Card */}
      <div className="relative overflow-hidden rounded-2xl bg-[#262626] border border-[#2E2E2E] p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">
            Total Added
          </span>
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-950/50 border border-emerald-800/30 text-emerald-400">
            <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>

        <div className="mt-3">
          {isLoading ? (
            <div className="h-8 w-36 rounded-md bg-[#333333] animate-pulse" />
          ) : (
            <p className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-400 font-sans">
              +{formatVND(totalAdded)}
            </p>
          )}
        </div>
        <p className="mt-1 text-xs text-[#9CA3AF]">
          Cumulative sum of all additions
        </p>
      </div>

      {/* Total Subtracted Card */}
      <div className="relative overflow-hidden rounded-2xl bg-[#262626] border border-[#2E2E2E] p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">
            Total Subtracted
          </span>
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-950/50 border border-red-800/30 text-red-400">
            <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>

        <div className="mt-3">
          {isLoading ? (
            <div className="h-8 w-36 rounded-md bg-[#333333] animate-pulse" />
          ) : (
            <p className="text-2xl sm:text-3xl font-bold tracking-tight text-red-400 font-sans">
              -{formatVND(totalSubtracted)}
            </p>
          )}
        </div>
        <p className="mt-1 text-xs text-[#9CA3AF]">
          Cumulative sum of all subtractions
        </p>
      </div>
    </div>
  );
}
