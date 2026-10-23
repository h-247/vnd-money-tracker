'use client';

import React, { useState } from 'react';
import {
  X,
  Tag as TagIcon,
  Plus,
  Edit2,
  Trash2,
  Check,
  AlertCircle,
} from 'lucide-react';
import { TagItem } from '@/db/schema';

interface ManageTagsModalProps {
  isOpen: boolean;
  tags: TagItem[];
  onClose: () => void;
  onCreateTag: (data: {
    name: string;
    type: 'INCOME' | 'EXPENSE' | 'ALL';
    color?: string;
  }) => Promise<void>;
  onUpdateTag: (
    id: string,
    data: {
      name?: string;
      type?: 'INCOME' | 'EXPENSE' | 'ALL';
      color?: string;
    },
  ) => Promise<void>;
  onDeleteTag: (id: string) => Promise<void>;
  onDeleteAllTags?: () => Promise<void>;
  onRestoreDefaults?: () => Promise<void>;
}

export function ManageTagsModal({
  isOpen,
  tags,
  onClose,
  onCreateTag,
  onUpdateTag,
  onDeleteTag,
  onDeleteAllTags,
  onRestoreDefaults,
}: ManageTagsModalProps) {
  const [filterType, setFilterType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>(
    'ALL',
  );
  const [newTagName, setNewTagName] = useState('');
  const [newTagType, setNewTagType] = useState<'INCOME' | 'EXPENSE' | 'ALL'>(
    'ALL',
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingType, setEditingType] = useState<'INCOME' | 'EXPENSE' | 'ALL'>(
    'ALL',
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isConfirmingDeleteAll, setIsConfirmingDeleteAll] = useState(false);
  const [isConfirmingRestore, setIsConfirmingRestore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const filteredTags = tags.filter((t) => {
    if (filterType === 'ALL') return true;
    return t.type === filterType || t.type === 'ALL';
  });

  const handleCreate = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const trimmed = newTagName.trim();
    if (!trimmed) {
      setError('Please enter a tag name.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onCreateTag({
        name: trimmed,
        type: newTagType,
        color:
          newTagType === 'INCOME'
            ? '#22C55E'
            : newTagType === 'EXPENSE'
              ? '#EF4444'
              : '#3B82F6',
      });
      setNewTagName('');
      setNewTagType('ALL');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create tag.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (tag: TagItem) => {
    setEditingId(tag.id);
    setEditingName(tag.name);
    setEditingType(tag.type as 'INCOME' | 'EXPENSE' | 'ALL');
    setError(null);
  };

  const handleSaveEdit = async (id: string) => {
    const trimmed = editingName.trim();
    if (!trimmed) {
      setError('Tag name cannot be empty.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onUpdateTag(id, {
        name: trimmed,
        type: editingType,
        color:
          editingType === 'INCOME'
            ? '#22C55E'
            : editingType === 'EXPENSE'
              ? '#EF4444'
              : '#3B82F6',
      });
      setEditingId(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update tag.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async (id: string) => {
    try {
      setIsSubmitting(true);
      setError(null);
      await onDeleteTag(id);
      setDeletingId(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete tag.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDeleteAll = async () => {
    if (!onDeleteAllTags) return;
    try {
      setIsSubmitting(true);
      setError(null);
      await onDeleteAllTags();
      setIsConfirmingDeleteAll(false);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete all tags.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmRestore = async () => {
    if (!onRestoreDefaults) return;
    try {
      setIsSubmitting(true);
      setError(null);
      await onRestoreDefaults();
      setIsConfirmingRestore(false);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Failed to restore default tags.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="manage-tags-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-[#262626] border border-[#2E2E2E] shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2E2E2E] px-6 py-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#333333] border border-[#3E3E3E] text-[#ECECEC]">
              <TagIcon className="w-4 h-4" />
            </div>
            <div>
              <h3
                id="manage-tags-title"
                className="text-base font-semibold text-[#ECECEC]"
              >
                Manage Tags
              </h3>
              <p className="text-xs text-[#9CA3AF]">
                Create, edit, or delete transaction category tags
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

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-950/50 border border-red-800/40 text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* New Tag Form */}
          <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] space-y-3">
            <span className="block text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">
              Add New Tag
            </span>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="New tag name (e.g. Freelance, Coffee)..."
                  maxLength={40}
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  disabled={isSubmitting}
                  className="flex-1 px-3 py-2 rounded-xl bg-[#212121] border border-[#2E2E2E] text-xs sm:text-sm text-[#ECECEC] placeholder:text-[#666666] focus:outline-none focus:ring-2 focus:ring-white/30"
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !newTagName.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white text-[#171717] hover:bg-zinc-200 disabled:opacity-50 transition-colors shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Add Tag</span>
                </button>
              </div>

              {/* Tag Type Pills */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[#9CA3AF] text-[11px]">Type:</span>
                <button
                  type="button"
                  onClick={() => setNewTagType('ALL')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    newTagType === 'ALL'
                      ? 'bg-[#333333] border-white/40 text-white'
                      : 'bg-[#212121] border-[#2E2E2E] text-[#9CA3AF] hover:text-[#ECECEC]'
                  }`}
                >
                  All Types
                </button>
                <button
                  type="button"
                  onClick={() => setNewTagType('INCOME')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    newTagType === 'INCOME'
                      ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                      : 'bg-[#212121] border-[#2E2E2E] text-[#9CA3AF] hover:text-emerald-400'
                  }`}
                >
                  + Income (Add)
                </button>
                <button
                  type="button"
                  onClick={() => setNewTagType('EXPENSE')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    newTagType === 'EXPENSE'
                      ? 'bg-red-950/80 border-red-500 text-red-300'
                      : 'bg-[#212121] border-[#2E2E2E] text-[#9CA3AF] hover:text-red-400'
                  }`}
                >
                  - Expense (Subtract)
                </button>
              </div>
            </form>
          </div>

          {/* Filter Bar & Bulk Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">
              Existing Tags ({filteredTags.length})
            </span>
            <div className="flex items-center gap-2">
              {tags.length > 0 && onDeleteAllTags && (
                <button
                  type="button"
                  onClick={() => setIsConfirmingDeleteAll(true)}
                  disabled={isSubmitting}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-red-400 hover:text-red-300 hover:bg-red-950/40 border border-red-900/50 transition-colors"
                  title="Delete all existing tags"
                >
                  Delete All
                </button>
              )}
              {onRestoreDefaults && (
                <button
                  type="button"
                  onClick={() => setIsConfirmingRestore(true)}
                  disabled={isSubmitting}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 border border-zinc-700 transition-colors"
                  title="Restore default tags"
                >
                  Restore Defaults
                </button>
              )}
              <div className="inline-flex p-0.5 rounded-lg bg-[#1A1A1A] border border-[#2E2E2E]">
                <button
                  type="button"
                  onClick={() => setFilterType('ALL')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                    filterType === 'ALL'
                      ? 'bg-white text-[#171717]'
                      : 'text-[#9CA3AF] hover:text-[#ECECEC]'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('INCOME')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                    filterType === 'INCOME'
                      ? 'bg-emerald-500 text-white'
                      : 'text-[#9CA3AF] hover:text-[#ECECEC]'
                  }`}
                >
                  Income
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('EXPENSE')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                    filterType === 'EXPENSE'
                      ? 'bg-red-500 text-white'
                      : 'text-[#9CA3AF] hover:text-[#ECECEC]'
                  }`}
                >
                  Expense
                </button>
              </div>
            </div>
          </div>

          {/* Delete All Confirmation Banner */}
          {isConfirmingDeleteAll && (
            <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-red-200 animate-in fade-in">
              <span>
                Delete all <strong>{tags.length}</strong> existing tags?
                Transactions will lose these tags.
              </span>
              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={handleConfirmDeleteAll}
                  disabled={isSubmitting}
                  className="px-3 py-1 rounded-md bg-red-600 hover:bg-red-500 text-white font-semibold text-[11px]"
                >
                  Yes, Delete All
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingDeleteAll(false)}
                  disabled={isSubmitting}
                  className="px-2.5 py-1 rounded-md text-zinc-300 hover:text-white text-[11px]"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Restore Defaults Confirmation Banner */}
          {isConfirmingRestore && (
            <div className="p-3.5 rounded-xl bg-blue-950/60 border border-blue-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-blue-200 animate-in fade-in">
              <span>Restore standard default income and expense tags?</span>
              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={handleConfirmRestore}
                  disabled={isSubmitting}
                  className="px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[11px]"
                >
                  Yes, Restore
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingRestore(false)}
                  disabled={isSubmitting}
                  className="px-2.5 py-1 rounded-md text-zinc-300 hover:text-white text-[11px]"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Tags List */}
          <div className="divide-y divide-[#2E2E2E] border border-[#2E2E2E] rounded-xl overflow-hidden bg-[#1A1A1A]">
            {filteredTags.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center gap-2 text-xs text-[#9CA3AF]">
                <p>
                  {tags.length === 0
                    ? 'No tags existing. All existing tags have been deleted.'
                    : 'No tags found in this category filter.'}
                </p>
                {tags.length === 0 && onRestoreDefaults && (
                  <button
                    type="button"
                    onClick={() => setIsConfirmingRestore(true)}
                    disabled={isSubmitting}
                    className="mt-1 text-xs text-blue-400 hover:text-blue-300 underline"
                  >
                    Restore default tags
                  </button>
                )}
              </div>
            ) : (
              filteredTags.map((tag) => {
                const isEditing = editingId === tag.id;
                const isDeleting = deletingId === tag.id;

                if (isEditing) {
                  return (
                    <div
                      key={tag.id}
                      className="p-3 bg-[#242424] flex flex-col gap-2 animate-in fade-in"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          maxLength={40}
                          className="flex-1 px-2.5 py-1.5 rounded-lg bg-[#141414] border border-zinc-500 text-xs text-[#ECECEC] focus:outline-none focus:ring-1 focus:ring-white/40"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(tag.id)}
                          disabled={isSubmitting || !editingName.trim()}
                          className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500"
                          title="Save tag name"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#ECECEC] hover:bg-[#333333]"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Editing Type Options */}
                      <div className="flex items-center gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => setEditingType('ALL')}
                          className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                            editingType === 'ALL'
                              ? 'bg-zinc-700 text-white border-zinc-500'
                              : 'text-[#9CA3AF] border-transparent'
                          }`}
                        >
                          All
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingType('INCOME')}
                          className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                            editingType === 'INCOME'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                              : 'text-[#9CA3AF] border-transparent'
                          }`}
                        >
                          Income
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingType('EXPENSE')}
                          className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                            editingType === 'EXPENSE'
                              ? 'bg-red-950 text-red-300 border-red-500'
                              : 'text-[#9CA3AF] border-transparent'
                          }`}
                        >
                          Expense
                        </button>
                      </div>
                    </div>
                  );
                }

                if (isDeleting) {
                  return (
                    <div
                      key={tag.id}
                      className="p-3 bg-red-950/40 border-l-2 border-red-500 flex items-center justify-between gap-3 text-xs"
                    >
                      <span className="text-red-200">
                        Delete <strong>&quot;{tag.name}&quot;</strong>?
                        (Transactions will lose this tag)
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleConfirmDelete(tag.id)}
                          disabled={isSubmitting}
                          className="px-2.5 py-1 rounded-md bg-red-600 text-white font-semibold hover:bg-red-500 text-[11px]"
                        >
                          Yes, Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingId(null)}
                          className="px-2 py-1 rounded-md text-[#9CA3AF] hover:text-[#ECECEC] text-[11px]"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={tag.id}
                    className="p-3 flex items-center justify-between gap-3 hover:bg-[#202020] transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-semibold text-[#ECECEC] truncate">
                        {tag.name}
                      </span>
                      <span
                        className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                          tag.type === 'INCOME'
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/40'
                            : tag.type === 'EXPENSE'
                              ? 'bg-red-950/80 text-red-300 border border-red-800/40'
                              : 'bg-[#2A2A2A] text-[#9CA3AF] border border-[#3A3A3A]'
                        }`}
                      >
                        {tag.type}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(tag)}
                        disabled={isSubmitting}
                        className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#ECECEC] hover:bg-[#333333] transition-colors"
                        title={`Edit ${tag.name}`}
                        aria-label={`Edit ${tag.name}`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingId(tag.id)}
                        disabled={isSubmitting}
                        className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-red-400 hover:bg-red-950/30 transition-colors"
                        title={`Delete ${tag.name}`}
                        aria-label={`Delete ${tag.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-[#2E2E2E] shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#333333] hover:bg-[#3F3F46] text-[#ECECEC] border border-[#444444] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
