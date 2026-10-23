'use client';

import React from 'react';
import { Wallet, RefreshCw, LogOut, User, Tag, Share2 } from 'lucide-react';

interface HeaderProps {
  user?: {
    displayName?: string;
    email?: string;
  } | null;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onManageTags?: () => void;
  onManageSharing?: () => void;
}

export function Header({
  user,
  isRefreshing,
  onRefresh,
  onManageTags,
  onManageSharing,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-[#2E2E2E] bg-[#212121]/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#262626] border border-[#2E2E2E] shadow-sm">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-[#ECECEC]">
              VND Money Tracker
            </h1>
            <p className="text-xs text-[#9CA3AF] hidden sm:block">
              Personal Bookkeeping &bull; Vietnamese Dong
            </p>
          </div>
        </div>

        {/* Minimal Navigation & User status */}
        <div className="flex items-center gap-2 sm:gap-4">
          {onManageSharing && (
            <button
              type="button"
              onClick={onManageSharing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#262626] border border-[#2E2E2E] text-[#ECECEC] hover:bg-[#333333] transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
              title="Share your finances"
              aria-label="Share your finances"
            >
              <Share2 className="w-3.5 h-3.5 text-[#9CA3AF]" />
              <span className="hidden sm:inline">Share</span>
            </button>
          )}

          {onManageTags && (
            <button
              type="button"
              onClick={onManageTags}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#262626] border border-[#2E2E2E] text-[#ECECEC] hover:bg-[#333333] transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
              title="Manage category tags"
              aria-label="Manage tags"
            >
              <Tag className="w-3.5 h-3.5 text-[#9CA3AF]" />
              <span className="hidden sm:inline">Tags</span>
            </button>
          )}

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#262626] border border-[#2E2E2E] text-[#ECECEC] hover:bg-[#333333] transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-white/20"
              title="Refresh financial data"
              aria-label="Refresh data"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-[#9CA3AF] ${
                  isRefreshing ? 'animate-spin' : ''
                }`}
              />
              <span className="hidden sm:inline">Sync</span>
            </button>
          )}

          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-[#2E2E2E]">
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#262626] border border-[#2E2E2E]">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-medium text-[#ECECEC] max-w-[120px] sm:max-w-[160px] truncate">
                  {user.displayName || user.email || 'User'}
                </span>
              </div>

              <a
                href="/signout-with-chatgpt"
                className="p-2 rounded-lg text-[#9CA3AF] hover:text-[#ECECEC] hover:bg-[#262626] transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
                title="Sign out of ChatGPT"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
