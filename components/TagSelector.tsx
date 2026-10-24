'use client';

import React, { useState } from 'react';
import { Tag as TagIcon, Plus, Check, X } from 'lucide-react';

interface TagSelectorProps {
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
  tags?: string[];
  defaultTags?: string[];
  customTags?: string[];
  accentColor?: 'emerald' | 'red' | 'blue';
  variant?: 'chips' | 'cards';
  disabled?: boolean;
  onManageTags?: () => void;
}

export function TagSelector({
  selectedTag,
  onSelectTag,
  tags = [],
  defaultTags = [],
  customTags = [],
  accentColor = 'emerald',
  variant = 'chips',
  disabled = false,
  onManageTags,
}: TagSelectorProps) {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');

  // Combine tags without duplicates
  const allTags = Array.from(
    new Set([...tags, ...defaultTags, ...customTags.filter(Boolean)]),
  );

  const handleAddNewTag = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const trimmed = newTagInput.trim();
    if (trimmed) {
      onSelectTag(trimmed);
      setNewTagInput('');
      setIsAddingNew(false);
    }
  };

  const selectedClasses =
    variant === 'cards'
      ? accentColor === 'blue'
        ? 'bg-[#E9ECFF] text-[#4854C7] border-[#5965D8] shadow-sm'
        : 'bg-[#FDE7F2] text-[#D8127D] border-[#EB168B] shadow-sm'
      : accentColor === 'emerald'
        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500 shadow-sm'
        : accentColor === 'red'
          ? 'bg-red-950/80 text-red-300 border-red-500 shadow-sm'
          : 'bg-blue-950/80 text-blue-300 border-blue-500 shadow-sm';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span
          className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider ${variant === 'cards' ? 'text-[#77717A]' : 'text-[#9CA3AF]'}`}
        >
          <TagIcon className="w-3.5 h-3.5" />
          <span>Category Tag</span>
          <span
            className={`text-[11px] font-normal lowercase ${variant === 'cards' ? 'text-[#999199]' : 'text-[#666666]'}`}
          >
            (optional)
          </span>
        </span>
        <div className="flex items-center gap-2">
          {onManageTags && (
            <button
              type="button"
              onClick={onManageTags}
              disabled={disabled}
              className={`text-[11px] transition-colors underline focus:outline-none ${variant === 'cards' ? 'text-[#77717A] hover:text-[#242126]' : 'text-[#9CA3AF] hover:text-[#ECECEC]'}`}
            >
              Manage tags
            </button>
          )}
          {selectedTag && (
            <button
              type="button"
              onClick={() => onSelectTag(null)}
              disabled={disabled}
              className={`text-[11px] transition-colors focus:outline-none ${variant === 'cards' ? 'text-[#77717A] hover:text-[#242126]' : 'text-[#9CA3AF] hover:text-[#ECECEC]'}`}
            >
              Clear tag
            </button>
          )}
        </div>
      </div>

      {/* Selected Tag Active Indicator */}
      {selectedTag && !allTags.includes(selectedTag) && (
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border ${selectedClasses}`}
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{selectedTag}</span>
            <button
              type="button"
              onClick={() => onSelectTag(null)}
              className="ml-1 hover:opacity-75 focus:outline-none"
              aria-label="Remove tag"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        </div>
      )}

      {/* Tag Chips List */}
      <div
        className={
          variant === 'cards'
            ? 'grid max-h-52 grid-cols-2 gap-2 overflow-y-auto pr-1'
            : 'flex max-h-36 flex-wrap gap-1.5 overflow-y-auto pr-1'
        }
      >
        {allTags.map((tag) => {
          const isSelected = selectedTag === tag;
          return (
            <button
              key={tag}
              type="button"
              disabled={disabled}
              onClick={() => onSelectTag(isSelected ? null : tag)}
              className={`inline-flex items-center gap-1.5 rounded-xl border text-xs font-medium transition-all active:scale-[0.98] ${
                variant === 'cards'
                  ? 'min-h-14 w-full justify-start px-3 py-3 text-left'
                  : 'px-2.5 py-1'
              } ${
                isSelected
                  ? selectedClasses
                  : variant === 'cards'
                    ? 'border-[#E8E1E5] bg-white text-[#514C52] hover:border-[#D6CCD2] hover:bg-[#FFFAFC]'
                    : 'border-[#383838] bg-[#292929] text-[#BDBDBD] hover:bg-[#333333] hover:text-[#ECECEC]'
              }`}
            >
              {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
              <span>{tag}</span>
            </button>
          );
        })}

        {allTags.length === 0 && !isAddingNew && (
          <span className="text-xs text-[#9CA3AF] self-center mr-1 italic">
            No tags yet.
          </span>
        )}

        {/* Add New Tag Trigger */}
        {!isAddingNew ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => setIsAddingNew(true)}
            className={`inline-flex items-center gap-1 text-xs font-medium text-zinc-300 transition-colors active:scale-[0.98] ${
              variant === 'cards'
                ? 'min-h-14 w-full justify-start rounded-xl border border-dashed border-[#D9CFD5] bg-[#FFFAFC] px-3 py-3 text-[#6F6B70] hover:bg-[#FFF3F8]'
                : 'rounded-lg border border-dashed border-[#444444] bg-[#2A2A2A] px-2.5 py-1 hover:bg-[#383838]'
            }`}
          >
            <Plus className="w-3 h-3" />
            <span>New Tag</span>
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <input
              type="text"
              placeholder="Tag name..."
              maxLength={40}
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddNewTag(e);
                } else if (e.key === 'Escape') {
                  setIsAddingNew(false);
                  setNewTagInput('');
                }
              }}
              className={`w-28 rounded-lg border px-2 py-0.5 text-xs focus:outline-none focus:ring-1 ${variant === 'cards' ? 'border-[#E2D9DE] bg-white text-[#242126] placeholder:text-[#AAA4AA] focus:ring-[#EB168B]/30' : 'border-zinc-600 bg-[#141414] text-[#ECECEC] placeholder:text-[#666666] focus:ring-white/40'}`}
            />
            <button
              type="button"
              onClick={handleAddNewTag}
              className="p-1 rounded-md bg-white text-[#171717] hover:bg-zinc-200 text-xs font-semibold"
              title="Add tag"
            >
              <Check className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAddingNew(false);
                setNewTagInput('');
              }}
              className={`rounded-md p-1 ${variant === 'cards' ? 'text-[#77717A] hover:text-[#242126]' : 'text-[#9CA3AF] hover:text-[#ECECEC]'}`}
              title="Cancel"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
