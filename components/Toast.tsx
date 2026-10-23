'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0 pointer-events-none"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-xl border backdrop-blur-md transition-all duration-200 animate-in fade-in slide-in-from-bottom-3 ${
            toast.type === 'success'
              ? 'bg-[#262626]/95 border-emerald-500/40 text-[#ECECEC]'
              : toast.type === 'error'
                ? 'bg-[#262626]/95 border-red-500/40 text-[#ECECEC]'
                : 'bg-[#262626]/95 border-blue-500/40 text-[#ECECEC]'
          }`}
        >
          <div className="shrink-0 mt-0.5">
            {toast.type === 'success' && (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            )}
            {toast.type === 'error' && (
              <AlertCircle className="w-5 h-5 text-red-400" />
            )}
            {toast.type === 'info' && (
              <Info className="w-5 h-5 text-blue-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold tracking-tight text-[#ECECEC]">
              {toast.title}
            </h4>
            {toast.message && (
              <p className="mt-1 text-xs text-[#9CA3AF] break-words">
                {toast.message}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            className="shrink-0 p-1 rounded-lg text-[#9CA3AF] hover:text-[#ECECEC] hover:bg-[#333333] transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
