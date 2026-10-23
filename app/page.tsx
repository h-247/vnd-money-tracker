'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { BalanceCard } from '@/components/BalanceCard';
import { SummaryCards } from '@/components/SummaryCards';
import { TransactionHistory } from '@/components/TransactionHistory';
import { AddMoneyModal } from '@/components/AddMoneyModal';
import { SubtractMoneyModal } from '@/components/SubtractMoneyModal';
import { EditTransactionModal } from '@/components/EditTransactionModal';
import { DeleteTransactionModal } from '@/components/DeleteTransactionModal';
import { ManageTagsModal } from '@/components/ManageTagsModal';
import { ToastContainer, ToastMessage } from '@/components/Toast';
import { TagItem, Transaction } from '@/db/schema';
import { formatVND } from '@/lib/financial';
import {
  FinancialShareRecord,
  ShareMoneyModal,
} from '@/components/ShareMoneyModal';

interface SummaryData {
  currentBalance: number;
  totalAdded: number;
  totalSubtracted: number;
  transactionCount: number;
}

interface UserData {
  userId: string;
  displayName: string;
  email: string;
}

interface ApiResponse<T = unknown> {
  success?: boolean;
  data?: T;
  availableTags?: string[];
  user?: UserData;
  viewing?: { ownerName: string | null; isShared: boolean };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
  error?: string;
  message?: string;
}

export default function Home() {
  const [summary, setSummary] = useState<SummaryData>({
    currentBalance: 0,
    totalAdded: 0,
    totalSubtracted: 0,
    transactionCount: 0,
  });
  const [user, setUser] = useState<UserData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    hasMore: false,
  });

  // Filter States
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'ADD' | 'SUBTRACT'>(
    'ALL',
  );
  const [tagFilter, setTagFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Loading States
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [authStatus, setAuthStatus] = useState<
    'checking' | 'authenticated' | 'unauthenticated' | 'error'
  >('checking');
  const [signInReturnTo, setSignInReturnTo] = useState('/');
  const [sharedAccountError, setSharedAccountError] = useState<string | null>(
    null,
  );

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubtractModalOpen, setIsSubtractModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null);
  const [isManageTagsOpen, setIsManageTagsOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isLoadingShares, setIsLoadingShares] = useState(true);
  const [outgoingShares, setOutgoingShares] = useState<FinancialShareRecord[]>(
    [],
  );
  const [incomingShares, setIncomingShares] = useState<FinancialShareRecord[]>(
    [],
  );
  const [activeSharedAccount, setActiveSharedAccount] =
    useState<FinancialShareRecord | null>(null);
  const [tags, setTags] = useState<TagItem[]>([]);
  const isSharedView = activeSharedAccount !== null;

  // Toast Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (
    type: 'success' | 'error' | 'info',
    title: string,
    message?: string,
  ) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch Authoritative Financial Summary
  const fetchSummary = useCallback(async () => {
    setIsLoadingSummary(true);
    try {
      const params = new URLSearchParams();
      if (activeSharedAccount) {
        params.set('shareId', activeSharedAccount.id);
      }
      const query = params.size ? `?${params.toString()}` : '';
      const res = await fetch(`/api/summary${query}`, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error('Failed to fetch balance summary.');
      }
      const data = (await res.json()) as ApiResponse<SummaryData>;
      if (data.success && data.data) {
        setSummary(data.data);
        setSharedAccountError(null);
        if (data.user) {
          setUser(data.user);
        }
      }
    } catch (err: unknown) {
      console.error('fetchSummary error:', err);
      if (activeSharedAccount) {
        setSummary({
          currentBalance: 0,
          totalAdded: 0,
          totalSubtracted: 0,
          transactionCount: 0,
        });
        setTransactions([]);
        setSharedAccountError(
          'This invitation is unavailable for the signed-in email. Sign in with the invited ChatGPT account or ask the owner to resend the invitation.',
        );
      }
    } finally {
      setIsLoadingSummary(false);
    }
  }, [activeSharedAccount]);

  const fetchShares = useCallback(async () => {
    setIsLoadingShares(true);
    try {
      const res = await fetch('/api/shares', { cache: 'no-store' });
      if (res.status === 401) {
        setAuthStatus('unauthenticated');
        return null;
      }
      const payload = (await res.json()) as {
        success?: boolean;
        data?: {
          outgoing: FinancialShareRecord[];
          incoming: FinancialShareRecord[];
        };
      };
      if (!res.ok || !payload.success || !payload.data) {
        throw new Error('Unable to load sharing settings.');
      }
      setOutgoingShares(payload.data.outgoing);
      setIncomingShares(payload.data.incoming);
      setAuthStatus('authenticated');
      return payload.data.incoming;
    } catch (error) {
      console.error('fetchShares error:', error);
      setAuthStatus('error');
      return null;
    } finally {
      setIsLoadingShares(false);
    }
  }, []);

  // Fetch Tags
  const fetchTags = useCallback(async () => {
    try {
      const res = await fetch('/api/tags', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error('Failed to fetch tags.');
      }
      const data = (await res.json()) as ApiResponse<TagItem[]>;
      if (data.success && data.data) {
        setTags(data.data);
        if (!isSharedView) setAvailableTags(data.data.map((t) => t.name));
      }
    } catch (err: unknown) {
      console.error('fetchTags error:', err);
    }
  }, [isSharedView]);

  // Fetch Filtered Transactions
  const fetchTransactions = useCallback(
    async (pageToLoad = pagination.page) => {
      try {
        setIsLoadingTransactions(true);
        const params = new URLSearchParams();
        if (activeSharedAccount) {
          params.set('shareId', activeSharedAccount.id);
        }
        params.set('page', pageToLoad.toString());
        params.set('limit', pagination.limit.toString());
        if (search.trim()) params.set('search', search.trim());
        if (typeFilter !== 'ALL') params.set('type', typeFilter);
        if (tagFilter !== 'ALL') params.set('tag', tagFilter);
        if (startDate) params.set('startDate', startDate);
        if (endDate) params.set('endDate', endDate);

        const res = await fetch(`/api/transactions?${params.toString()}`, {
          cache: 'no-store',
        });
        if (!res.ok) {
          throw new Error('Failed to fetch transaction history.');
        }
        const data = (await res.json()) as ApiResponse<Transaction[]>;
        if (data.success && data.data) {
          setTransactions(data.data);
          if (data.availableTags) {
            setAvailableTags(data.availableTags);
          }
          if (data.pagination) {
            setPagination(data.pagination);
          }
        }
      } catch (err: unknown) {
        console.error('fetchTransactions error:', err);
        if (activeSharedAccount) setTransactions([]);
      } finally {
        setIsLoadingTransactions(false);
      }
    },
    [
      pagination.page,
      pagination.limit,
      search,
      typeFilter,
      tagFilter,
      startDate,
      endDate,
      activeSharedAccount,
    ],
  );

  // Load account shares before requesting financial data so invite links open
  // directly into the correct read-only ledger.
  useEffect(() => {
    let isCurrent = true;
    const initializeShares = async () => {
      const incoming = await fetchShares();
      if (!isCurrent) return;
      if (!incoming) {
        setInitialLoadComplete(true);
        return;
      }

      const requestedShareId = new URLSearchParams(window.location.search).get(
        'shareId',
      );
      const selectedShare = requestedShareId
        ? (incoming.find((share) => share.id === requestedShareId) ?? {
            id: requestedShareId,
            createdAt: new Date(),
          })
        : incoming.length === 1
          ? incoming[0]
          : null;

      if (selectedShare) {
        setActiveSharedAccount(selectedShare);
      }
      setInitialLoadComplete(true);
    };

    void initializeShares();
    return () => {
      isCurrent = false;
    };
  }, [fetchShares]);

  useEffect(() => {
    if (authStatus === 'authenticated') void fetchTags();
  }, [authStatus, fetchTags]);

  useEffect(() => {
    if (initialLoadComplete && authStatus === 'authenticated') {
      void fetchSummary();
    }
  }, [authStatus, fetchSummary, initialLoadComplete]);

  // Load transactions when filters change
  useEffect(() => {
    if (!initialLoadComplete || authStatus !== 'authenticated') return;
    void fetchTransactions(1);
  }, [
    search,
    typeFilter,
    tagFilter,
    startDate,
    endDate,
    fetchTransactions,
    authStatus,
    initialLoadComplete,
  ]);

  // Sync / Manual Refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      fetchSummary(),
      fetchTransactions(pagination.page),
      fetchTags(),
    ]);
    setIsRefreshing(false);
    addToast(
      'info',
      'Synced',
      'Authoritative data refreshed from cloud database.',
    );
  };

  const handleInvite = async (email: string) => {
    const res = await fetch('/api/shares', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const payload = (await res.json()) as ApiResponse;
    if (!res.ok || !payload.success) {
      throw new Error(payload.error || 'Unable to create this invitation.');
    }
    await fetchShares();
    addToast(
      'success',
      'Invitation ready',
      'Copy the invitation link next to their email and send it to them.',
    );
  };

  const handleRevokeShare = async (id: string) => {
    const res = await fetch(`/api/shares?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    const payload = (await res.json()) as ApiResponse;
    if (!res.ok || !payload.success) {
      throw new Error(payload.error || 'Unable to revoke this invitation.');
    }
    setOutgoingShares((previous) =>
      previous.filter((share) => share.id !== id),
    );
    addToast(
      'success',
      'Access revoked',
      'That person can no longer view your account.',
    );
  };

  const showSharedAccount = (share: FinancialShareRecord) => {
    setIsAddModalOpen(false);
    setIsSubtractModalOpen(false);
    setEditingTx(null);
    setDeletingTx(null);
    setIsManageTagsOpen(false);
    setIsShareModalOpen(false);
    setSharedAccountError(null);
    setSearch('');
    setTypeFilter('ALL');
    setTagFilter('ALL');
    setStartDate('');
    setEndDate('');
    setPagination((current) => ({ ...current, page: 1 }));
    setActiveSharedAccount(share);
  };

  const showMyAccount = () => {
    setSharedAccountError(null);
    setSearch('');
    setTypeFilter('ALL');
    setTagFilter('ALL');
    setStartDate('');
    setEndDate('');
    setPagination((current) => ({ ...current, page: 1 }));
    setActiveSharedAccount(null);
  };

  // Add Money Handler
  const handleConfirmAdd = async (data: {
    amount: number;
    note?: string;
    tag?: string;
  }) => {
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'ADD',
        amount: data.amount,
        note: data.note,
        tag: data.tag,
      }),
    });

    const resJson = (await res.json()) as ApiResponse;
    if (!res.ok || !resJson.success) {
      throw new Error(resJson.error || 'Failed to add money.');
    }

    addToast(
      'success',
      'Money Added',
      `Successfully added ${formatVND(data.amount)} to your balance.`,
    );

    // Refresh authoritative balance and records immediately
    await Promise.all([fetchSummary(), fetchTransactions(1)]);
  };

  // Subtract Money Handler
  const handleConfirmSubtract = async (data: {
    amount: number;
    note?: string;
    tag?: string;
  }) => {
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'SUBTRACT',
        amount: data.amount,
        note: data.note,
        tag: data.tag,
      }),
    });

    const resJson = (await res.json()) as ApiResponse;
    if (!res.ok || !resJson.success) {
      throw new Error(resJson.error || 'Failed to subtract money.');
    }

    addToast(
      'success',
      'Money Subtracted',
      `Successfully subtracted ${formatVND(data.amount)} from your balance.`,
    );

    // Refresh authoritative balance and records immediately
    await Promise.all([fetchSummary(), fetchTransactions(1)]);
  };

  // Edit Transaction Handler
  const handleConfirmEdit = async (
    id: string,
    data: {
      amount: number;
      note?: string;
      tag?: string | null;
      type?: 'ADD' | 'SUBTRACT';
    },
  ) => {
    const res = await fetch(`/api/transactions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const resJson = (await res.json()) as ApiResponse;
    if (!res.ok || !resJson.success) {
      throw new Error(resJson.error || 'Failed to update transaction.');
    }

    addToast(
      'success',
      'Transaction Updated',
      'Transaction has been successfully saved.',
    );

    // Refresh data
    await Promise.all([fetchSummary(), fetchTransactions(pagination.page)]);
  };

  // Delete Transaction Handler
  const handleConfirmDelete = async (id: string) => {
    const res = await fetch(`/api/transactions/${id}`, {
      method: 'DELETE',
    });

    const resJson = (await res.json()) as ApiResponse;
    if (!res.ok || !resJson.success) {
      throw new Error(resJson.error || 'Failed to delete transaction.');
    }

    addToast(
      'success',
      'Transaction Deleted',
      'The transaction was successfully removed.',
    );

    // Refresh data
    await Promise.all([fetchSummary(), fetchTransactions(pagination.page)]);
  };

  // Tag CRUD Handlers
  const handleCreateTag = async (data: {
    name: string;
    type: 'INCOME' | 'EXPENSE' | 'ALL';
    color?: string;
  }) => {
    const res = await fetch('/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const resJson = (await res.json()) as ApiResponse<TagItem>;
    if (!res.ok || !resJson.success) {
      throw new Error(resJson.error || 'Failed to create tag.');
    }
    addToast('success', 'Tag Created', `Tag "${data.name}" has been created.`);
    await fetchTags();
  };

  const handleUpdateTag = async (
    id: string,
    data: {
      name?: string;
      type?: 'INCOME' | 'EXPENSE' | 'ALL';
      color?: string;
    },
  ) => {
    const res = await fetch(`/api/tags/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const resJson = (await res.json()) as ApiResponse<TagItem>;
    if (!res.ok || !resJson.success) {
      throw new Error(resJson.error || 'Failed to update tag.');
    }
    addToast('success', 'Tag Updated', 'Tag updated successfully.');
    await Promise.all([fetchTags(), fetchTransactions(pagination.page)]);
  };

  const handleDeleteTag = async (id: string) => {
    const res = await fetch(`/api/tags/${id}`, {
      method: 'DELETE',
    });
    const resJson = (await res.json()) as ApiResponse;
    if (!res.ok || !resJson.success) {
      throw new Error(resJson.error || 'Failed to delete tag.');
    }
    addToast('success', 'Tag Deleted', 'Tag deleted successfully.');
    await Promise.all([fetchTags(), fetchTransactions(pagination.page)]);
  };

  const handleDeleteAllTags = async () => {
    const res = await fetch('/api/tags', {
      method: 'DELETE',
    });
    const resJson = (await res.json()) as ApiResponse;
    if (!res.ok || !resJson.success) {
      throw new Error(resJson.error || 'Failed to delete all tags.');
    }
    addToast(
      'success',
      'All Tags Deleted',
      'All existing tags have been deleted.',
    );
    await Promise.all([fetchTags(), fetchTransactions(pagination.page)]);
  };

  const handleRestoreDefaultTags = async () => {
    const res = await fetch('/api/tags/reset', {
      method: 'POST',
    });
    const resJson = (await res.json()) as ApiResponse<TagItem[]>;
    if (!res.ok || !resJson.success) {
      throw new Error(resJson.error || 'Failed to restore default tags.');
    }
    addToast(
      'success',
      'Defaults Restored',
      'Standard default tags have been restored.',
    );
    await Promise.all([fetchTags(), fetchTransactions(pagination.page)]);
  };

  const handleResetFilters = () => {
    setSearch('');
    setTypeFilter('ALL');
    setTagFilter('ALL');
    setStartDate('');
    setEndDate('');
  };

  const incomeTagNames = tags
    .filter((t) => t.type === 'INCOME' || t.type === 'ALL')
    .map((t) => t.name);

  const expenseTagNames = tags
    .filter((t) => t.type === 'EXPENSE' || t.type === 'ALL')
    .map((t) => t.name);

  const editTagNames = tags
    .filter((t) =>
      editingTx?.type === 'ADD'
        ? t.type === 'INCOME' || t.type === 'ALL'
        : t.type === 'EXPENSE' || t.type === 'ALL',
    )
    .map((t) => t.name);

  useEffect(() => {
    setSignInReturnTo(
      `${window.location.pathname}${window.location.search}${window.location.hash}`,
    );
  }, []);

  if (authStatus === 'unauthenticated') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#212121] px-4 text-[#ECECEC]">
        <section className="w-full max-w-md rounded-2xl border border-[#3A3A3A] bg-[#222222] p-6 text-center shadow-xl">
          <h1 className="text-xl font-bold">Sign in to view this account</h1>
          <p className="mt-3 text-sm leading-6 text-[#A3A3A3]">
            Open this invitation in ChatGPT and sign in with the email address
            the owner invited. Your account and transactions stay private.
          </p>
          <a
            href={`/signin-with-chatgpt?return_to=${encodeURIComponent(signInReturnTo)}`}
            target="_top"
            className="mt-6 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#171717] hover:bg-zinc-200"
          >
            Sign in with ChatGPT
          </a>
        </section>
      </main>
    );
  }

  if (authStatus === 'error') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#212121] px-4 text-[#ECECEC]">
        <section className="w-full max-w-md rounded-2xl border border-[#3A3A3A] bg-[#222222] p-6 text-center shadow-xl">
          <h1 className="text-xl font-bold">Could not verify your sign-in</h1>
          <p className="mt-3 text-sm leading-6 text-[#A3A3A3]">
            Refresh the page to try again. Financial data stays hidden until
            your ChatGPT account can be verified.
          </p>
          <button
            type="button"
            onClick={() => void fetchShares()}
            className="mt-6 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#171717] hover:bg-zinc-200"
          >
            Try again
          </button>
        </section>
      </main>
    );
  }

  if (authStatus === 'checking' || !initialLoadComplete) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#212121] text-sm text-[#A3A3A3]">
        Checking your ChatGPT sign-in…
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#212121] text-[#ECECEC] flex flex-col">
      {/* Top Header */}
      <Header
        user={user}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
        onManageTags={
          isSharedView ? undefined : () => setIsManageTagsOpen(true)
        }
        onManageSharing={() => {
          void fetchShares();
          setIsShareModalOpen(true);
        }}
      />

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {activeSharedAccount && (
          <div className="flex flex-col gap-3 rounded-xl border border-sky-900/60 bg-sky-950/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-sky-100">
                Viewing {activeSharedAccount.ownerName || 'a shared'} account
              </p>
              <p className="mt-0.5 text-xs text-sky-200/70">
                Read-only access. You can view the balance and transaction
                history.
              </p>
              {sharedAccountError && (
                <p role="alert" className="mt-2 text-xs text-red-300">
                  {sharedAccountError}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={showMyAccount}
              className="self-start rounded-lg border border-sky-800/70 px-3 py-2 text-xs font-semibold text-sky-100 hover:bg-sky-900/40 sm:self-auto"
            >
              Back to my account
            </button>
          </div>
        )}

        {/* Prominent Current Balance Section */}
        <BalanceCard
          currentBalance={summary.currentBalance}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onOpenSubtractModal={() => setIsSubtractModalOpen(true)}
          isLoading={isLoadingSummary}
          readOnly={isSharedView}
        />

        {/* Financial Summary Cards Row */}
        <SummaryCards
          totalAdded={summary.totalAdded}
          totalSubtracted={summary.totalSubtracted}
          isLoading={isLoadingSummary}
        />

        {/* Authoritative Ledger History Section */}
        <TransactionHistory
          transactions={transactions}
          pagination={pagination}
          search={search}
          onSearchChange={setSearch}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          tagFilter={tagFilter}
          onTagFilterChange={setTagFilter}
          availableTags={availableTags}
          startDate={startDate}
          onStartDateChange={setStartDate}
          endDate={endDate}
          onEndDateChange={setEndDate}
          onResetFilters={handleResetFilters}
          onPageChange={(page) => fetchTransactions(page)}
          onEdit={(tx) => setEditingTx(tx)}
          onDelete={(tx) => setDeletingTx(tx)}
          isLoading={isLoadingTransactions}
          onManageTags={
            isSharedView ? undefined : () => setIsManageTagsOpen(true)
          }
          readOnly={isSharedView}
        />
      </main>

      {/* Modals & Dialogs */}
      <AddMoneyModal
        isOpen={isAddModalOpen}
        availableTags={incomeTagNames}
        onClose={() => setIsAddModalOpen(false)}
        onConfirm={handleConfirmAdd}
        onManageTags={() => setIsManageTagsOpen(true)}
      />

      <SubtractMoneyModal
        isOpen={isSubtractModalOpen}
        currentBalance={summary.currentBalance}
        availableTags={expenseTagNames}
        onClose={() => setIsSubtractModalOpen(false)}
        onConfirm={handleConfirmSubtract}
        onManageTags={() => setIsManageTagsOpen(true)}
      />

      <EditTransactionModal
        isOpen={editingTx !== null}
        transaction={editingTx}
        availableTags={editTagNames}
        onClose={() => setEditingTx(null)}
        onConfirm={handleConfirmEdit}
        onManageTags={() => setIsManageTagsOpen(true)}
      />

      <DeleteTransactionModal
        isOpen={deletingTx !== null}
        transaction={deletingTx}
        currentBalance={summary.currentBalance}
        onClose={() => setDeletingTx(null)}
        onConfirm={handleConfirmDelete}
      />

      {/* Manage Category Tags Modal */}
      <ManageTagsModal
        isOpen={isManageTagsOpen}
        tags={tags}
        onClose={() => setIsManageTagsOpen(false)}
        onCreateTag={handleCreateTag}
        onUpdateTag={handleUpdateTag}
        onDeleteTag={handleDeleteTag}
        onDeleteAllTags={handleDeleteAllTags}
        onRestoreDefaults={handleRestoreDefaultTags}
      />

      <ShareMoneyModal
        isOpen={isShareModalOpen}
        isLoading={isLoadingShares}
        outgoing={outgoingShares}
        incoming={incomingShares}
        activeShareId={activeSharedAccount?.id}
        onClose={() => setIsShareModalOpen(false)}
        onInvite={handleInvite}
        onRevoke={handleRevokeShare}
        onView={showSharedAccount}
        onViewMyMoney={showMyAccount}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
