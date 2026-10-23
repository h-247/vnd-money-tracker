'use client';

import React, { FormEvent, useState } from 'react';
import {
  Check,
  Copy,
  Eye,
  Link2,
  LoaderCircle,
  Share2,
  Trash2,
  X,
} from 'lucide-react';

export interface FinancialShareRecord {
  id: string;
  ownerName?: string;
  viewerEmail?: string;
  createdAt: string | number | Date;
}

interface ShareMoneyModalProps {
  isOpen: boolean;
  isLoading: boolean;
  outgoing: FinancialShareRecord[];
  incoming: FinancialShareRecord[];
  activeShareId?: string;
  onClose: () => void;
  onInvite: (email: string) => Promise<void>;
  onRevoke: (id: string) => Promise<void>;
  onView: (share: FinancialShareRecord) => void;
  onViewMyMoney: () => void;
}

function formatDate(value: FinancialShareRecord['createdAt']) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Recently'
    : date.toLocaleDateString('en', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
}

export function ShareMoneyModal({
  isOpen,
  isLoading,
  outgoing,
  incoming,
  activeShareId,
  onClose,
  onInvite,
  onRevoke,
  onView,
  onViewMyMoney,
}: ShareMoneyModalProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyShareId, setBusyShareId] = useState<string | null>(null);
  const [copiedShareId, setCopiedShareId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleInvite = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await onInvite(email.trim());
      setEmail('');
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Could not create this invitation.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async (id: string) => {
    setBusyShareId(id);
    setError('');
    try {
      await onRevoke(id);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Could not revoke this invitation.',
      );
    } finally {
      setBusyShareId(null);
    }
  };

  const copyInviteLink = async (shareId: string) => {
    try {
      const inviteUrl = new URL('/', window.location.origin);
      inviteUrl.searchParams.set('shareId', shareId);
      await navigator.clipboard.writeText(inviteUrl.toString());
      setCopiedShareId(shareId);
      window.setTimeout(() => setCopiedShareId(null), 1800);
    } catch {
      setError(
        'Could not copy the link. Copy the address from your browser instead.',
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="presentation"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-money-title"
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[#3A3A3A] bg-[#222222] shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#333333] p-5 sm:p-6">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#303030] text-zinc-100">
              <Share2 className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="share-money-title"
                className="text-lg font-bold text-[#ECECEC]"
              >
                Share your finances
              </h2>
              <p className="mt-1 text-xs leading-5 text-[#A3A3A3]">
                Invite by email for read-only access. The invited person must
                sign in to ChatGPT with that email.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sharing"
            className="rounded-lg p-2 text-[#A3A3A3] hover:bg-[#333333] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-6 p-5 sm:p-6">
          {activeShareId && (
            <button
              type="button"
              onClick={onViewMyMoney}
              className="w-full rounded-xl border border-[#454545] bg-[#2A2A2A] px-4 py-3 text-left text-sm font-semibold text-white hover:bg-[#333333]"
            >
              Return to my money
            </button>
          )}

          <form onSubmit={handleInvite} className="space-y-3">
            <label
              htmlFor="share-email"
              className="block text-sm font-semibold text-[#ECECEC]"
            >
              Invite someone to view your account
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="share-email"
                type="email"
                required
                maxLength={254}
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
                className="min-w-0 flex-1 rounded-xl border border-[#444444] bg-[#171717] px-3.5 py-3 text-sm text-white outline-none placeholder:text-[#777777] focus:border-zinc-400 focus:ring-2 focus:ring-white/10"
              />
              <button
                type="submit"
                disabled={isSubmitting || !email.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-[#171717] transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Share2 className="h-4 w-4" />
                )}
                Invite
              </button>
            </div>
            <p className="text-xs leading-5 text-[#929292]">
              After inviting them, copy their invitation link below. They must
              sign in to ChatGPT with the invited email.
            </p>
          </form>

          {error && (
            <p
              role="alert"
              className="rounded-lg border border-red-900/70 bg-red-950/30 px-3 py-2 text-xs text-red-300"
            >
              {error}
            </p>
          )}

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-[#ECECEC]">
                  People who can view your account
                </h3>
                <p className="text-xs text-[#929292]">
                  Revoke access at any time.
                </p>
              </div>
            </div>
            {isLoading ? (
              <div className="flex items-center gap-2 py-3 text-xs text-[#929292]">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Loading sharing settings…
              </div>
            ) : outgoing.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[#444444] px-4 py-5 text-center text-xs text-[#929292]">
                No one has access yet.
              </p>
            ) : (
              <ul className="divide-y divide-[#383838] rounded-xl border border-[#383838]">
                {outgoing.map((share) => (
                  <li
                    key={share.id}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[#ECECEC]">
                        {share.viewerEmail}
                      </p>
                      <p className="mt-0.5 text-[11px] text-[#929292]">
                        Invited {formatDate(share.createdAt)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void copyInviteLink(share.id)}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#444444] px-3 py-2 text-xs font-semibold text-[#ECECEC] hover:bg-[#333333]"
                      aria-label={`Copy invitation link for ${share.viewerEmail}`}
                    >
                      {copiedShareId === share.id ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      {copiedShareId === share.id ? 'Copied' : 'Invite link'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleRevoke(share.id)}
                      disabled={busyShareId === share.id}
                      title="Revoke access"
                      aria-label={`Revoke access for ${share.viewerEmail}`}
                      className="rounded-lg p-2 text-[#A3A3A3] hover:bg-red-950/40 hover:text-red-300 disabled:opacity-50"
                    >
                      {busyShareId === share.id ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-3 border-t border-[#383838] pt-5">
            <div>
              <h3 className="text-sm font-semibold text-[#ECECEC]">
                Accounts shared with you
              </h3>
              <p className="text-xs text-[#929292]">
                Only invitations sent to your signed-in email appear here.
              </p>
            </div>
            {!isLoading && incoming.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[#444444] px-4 py-5 text-center text-xs text-[#929292]">
                No one has shared an account with you.
              </p>
            ) : (
              <ul className="space-y-2">
                {incoming.map((share) => (
                  <li
                    key={share.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-[#383838] bg-[#1D1D1D] px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#ECECEC]">
                        {share.ownerName}
                      </p>
                      <p className="mt-0.5 text-[11px] text-[#929292]">
                        Read-only account
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onView(share)}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#333333] px-3 py-2 text-xs font-semibold text-white hover:bg-[#414141]"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="flex items-start gap-2 rounded-xl bg-[#1B1B1B] p-3 text-[11px] leading-5 text-[#999999]">
            <Link2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p>
              The app link can be opened by anyone, but financial data is
              returned only to the account owner or an invited email. Shared
              viewers cannot add, edit, or delete transactions.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
