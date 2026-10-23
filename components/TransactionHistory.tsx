'use client';

import React from 'react';
import {
  Search,
  Edit2,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Receipt,
  Tag as TagIcon,
} from 'lucide-react';
import { formatVND, formatVNDDate } from '@/lib/financial';
import { Transaction } from '@/db/schema';

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

interface TransactionHistoryProps {
  transactions: Transaction[];
  pagination: PaginationMeta;
  search: string;
  onSearchChange: (val: string) => void;
  typeFilter: 'ALL' | 'ADD' | 'SUBTRACT';
  onTypeFilterChange: (type: 'ALL' | 'ADD' | 'SUBTRACT') => void;
  tagFilter: string;
  onTagFilterChange: (tag: string) => void;
  availableTags?: string[];
  startDate: string;
  onStartDateChange: (val: string) => void;
  endDate: string;
  onEndDateChange: (val: string) => void;
  onResetFilters: () => void;
  onPageChange: (newPage: number) => void;
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
  isLoading?: boolean;
  onManageTags?: () => void;
  readOnly?: boolean;
}

export function TransactionHistory({
  transactions,
  pagination,
  search,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  tagFilter,
  onTagFilterChange,
  availableTags = [],
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  onResetFilters,
  onPageChange,
  onEdit,
  onDelete,
  isLoading,
  onManageTags,
  readOnly,
}: TransactionHistoryProps) {
  const hasActiveFilters =
    search.trim() !== '' ||
    typeFilter !== 'ALL' ||
    tagFilter !== 'ALL' ||
    startDate !== '' ||
    endDate !== '';

  return (
    <section
      aria-label="Transaction History"
      className="rounded-2xl bg-[#262626] border border-[#2E2E2E] shadow-sm overflow-hidden"
    >
      {/* Header and Filter Controls */}
      <div className="p-5 sm:p-6 border-b border-[#2E2E2E] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold tracking-tight text-[#ECECEC]">
              Transaction History
            </h3>
            <p className="text-xs text-[#9CA3AF]">
              All times displayed in Asia/Ho Chi Minh (UTC+7)
            </p>
          </div>

          {/* Type Filter Buttons */}
          <div className="inline-flex p-1 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] self-start sm:self-auto">
            <button
              type="button"
              onClick={() => onTypeFilterChange('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                typeFilter === 'ALL'
                  ? 'bg-white text-[#171717] shadow-sm'
                  : 'text-[#9CA3AF] hover:text-[#ECECEC]'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => onTypeFilterChange('ADD')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                typeFilter === 'ADD'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-[#9CA3AF] hover:text-[#ECECEC]'
              }`}
            >
              Add (+)
            </button>
            <button
              type="button"
              onClick={() => onTypeFilterChange('SUBTRACT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                typeFilter === 'SUBTRACT'
                  ? 'bg-red-500 text-white shadow-sm'
                  : 'text-[#9CA3AF] hover:text-[#ECECEC]'
              }`}
            >
              Subtract (-)
            </button>
          </div>
        </div>

        {/* Search, Tag & Date Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto_auto_auto] gap-3 items-center">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by note or tag..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-xs sm:text-sm text-[#ECECEC] placeholder:text-[#666666] focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
            />
          </div>

          {/* Tag Filter */}
          <div className="flex items-center gap-1.5">
            <TagIcon className="w-3.5 h-3.5 text-[#9CA3AF] hidden sm:inline" />
            <select
              value={tagFilter}
              onChange={(e) => onTagFilterChange(e.target.value)}
              aria-label="Filter by tag"
              className="w-full sm:w-auto px-3 py-2 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-xs text-[#ECECEC] focus:outline-none focus:ring-2 focus:ring-white/20"
            >
              <option value="ALL">All Tags</option>
              {availableTags.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            {onManageTags && (
              <button
                type="button"
                onClick={onManageTags}
                className="px-2.5 py-2 rounded-xl bg-[#1A1A1A] hover:bg-[#333333] border border-[#2E2E2E] text-xs text-[#9CA3AF] hover:text-[#ECECEC] transition-colors flex items-center gap-1 shrink-0"
                title="Manage category tags"
                aria-label="Manage tags"
              >
                <span>Manage</span>
              </button>
            )}
          </div>

          {/* Start Date */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#9CA3AF] hidden lg:inline">
              From:
            </span>
            <div className="relative w-full sm:w-auto">
              <input
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                aria-label="Start date filter"
                className="w-full sm:w-auto px-3 py-2 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-xs text-[#ECECEC] focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>
          </div>

          {/* End Date */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#9CA3AF] hidden lg:inline">To:</span>
            <div className="relative w-full sm:w-auto">
              <input
                type="date"
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                aria-label="End date filter"
                className="w-full sm:w-auto px-3 py-2 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-xs text-[#ECECEC] focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>
          </div>

          {/* Clear Filter Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#333333] hover:bg-[#3F3F46] text-[#ECECEC] border border-[#444444] transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-400"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Transaction List */}
      <div>
        {isLoading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-16 rounded-xl bg-[#1F1F1F] animate-pulse"
              />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-[#1A1A1A] border border-[#2E2E2E] text-[#9CA3AF] mb-3">
              <Receipt className="w-7 h-7 stroke-1" />
            </div>
            <h4 className="text-base font-semibold text-[#ECECEC]">
              {hasActiveFilters
                ? 'No matching transactions'
                : 'No transactions recorded'}
            </h4>
            <p className="mt-1 text-xs text-[#9CA3AF] max-w-sm">
              {hasActiveFilters
                ? 'Try clearing or modifying your search and filter criteria.'
                : 'Click "Add Money" above to record your first VND deposit.'}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-[#333333] hover:bg-[#3F3F46] text-[#ECECEC] transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-[#2E2E2E]">
            {transactions.map((tx) => {
              const isAdd = tx.type === 'ADD';
              return (
                <div
                  key={tx.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-[#2A2A2A]/50 transition-colors"
                >
                  {/* Left: Icon, Note, Tag, and Timestamp */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0 border ${
                        isAdd
                          ? 'bg-emerald-950/50 border-emerald-800/40 text-emerald-400'
                          : 'bg-red-950/50 border-red-800/40 text-red-400'
                      }`}
                    >
                      {isAdd ? (
                        <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
                      ) : (
                        <ArrowDownRight className="w-5 h-5 stroke-[2.5]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                            isAdd
                              ? 'bg-emerald-950/80 text-emerald-300'
                              : 'bg-red-950/80 text-red-300'
                          }`}
                        >
                          {isAdd ? 'Add Money' : 'Subtract Money'}
                        </span>

                        {tx.tag && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#333333] text-[#ECECEC] border border-[#444444]">
                            <TagIcon className="w-3 h-3 text-[#9CA3AF]" />
                            <span>{tx.tag}</span>
                          </span>
                        )}

                        <span className="text-xs text-[#9CA3AF]">
                          {formatVNDDate(tx.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-medium text-[#ECECEC] break-words">
                        {tx.note ? (
                          tx.note
                        ) : (
                          <span className="italic text-[#666666] font-normal">
                            No note provided
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Right: Amount & Action Buttons */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pl-13 sm:pl-0">
                    <div className="text-left sm:text-right">
                      <span
                        className={`text-base sm:text-lg font-bold font-sans ${
                          isAdd ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {isAdd ? '+' : '-'}
                        {formatVND(tx.amount)}
                      </span>
                    </div>

                    {!readOnly && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onEdit(tx)}
                          className="p-2 rounded-lg text-[#9CA3AF] hover:text-[#ECECEC] hover:bg-[#333333] transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
                          title="Edit transaction"
                          aria-label={`Edit transaction ${tx.id}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(tx)}
                          className="p-2 rounded-lg text-[#9CA3AF] hover:text-red-400 hover:bg-red-950/30 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/40"
                          title="Delete transaction"
                          aria-label={`Delete transaction ${tx.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      {pagination.totalPages > 1 && (
        <div className="p-4 sm:p-5 border-t border-[#2E2E2E] flex items-center justify-between gap-3 text-xs text-[#9CA3AF]">
          <div>
            Showing page {pagination.page} of {pagination.totalPages} (
            {pagination.total} transactions)
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pagination.page <= 1 || isLoading}
              onClick={() => onPageChange(pagination.page - 1)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#333333] hover:bg-[#3F3F46] text-[#ECECEC] disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Previous</span>
            </button>
            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages || isLoading}
              onClick={() => onPageChange(pagination.page + 1)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#333333] hover:bg-[#3F3F46] text-[#ECECEC] disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
