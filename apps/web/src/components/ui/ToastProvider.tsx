'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';

export type ToastVariant = 'info' | 'success' | 'warning' | 'error';

export interface ToastOptions {
  type?: ToastVariant;
  durationMs?: number;
}

export interface ConfirmDialogOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface PendingConfirm extends ConfirmDialogOptions {
  resolve: (accepted: boolean) => void;
}

interface ToastContextValue {
  showToast: (message: string, variantOrOptions?: ToastVariant | ToastOptions) => void;
  confirm: (options: string | ConfirmDialogOptions) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let globalShowToast: ((message: string, variantOrOptions?: ToastVariant | ToastOptions) => void) | null = null;
let globalConfirm: ((options: string | ConfirmDialogOptions) => Promise<boolean>) | null = null;

function inferToastVariant(message: string): ToastVariant {
  const m = String(message || '').toLowerCase();
  if (
    m.includes('ব্যর্থ') ||
    m.includes('ত্রুটি') ||
    m.includes('সমস্যা') ||
    m.includes('অনুমতি নেই') ||
    m.includes('অবৈধ') ||
    m.includes('সঠিক নয়') ||
    m.includes('error') ||
    m.includes('failed')
  ) {
    return 'error';
  }
  if (
    m.includes('সতর্কতা') ||
    m.includes('বাধ্যতামূলক') ||
    m.includes('অনুগ্রহ করে') ||
    m.includes('অবশ্যই') ||
    m.includes('বেশি হতে পারবে না') ||
    m.includes('নেই!') ||
    m.includes('ফাকা রাখা') ||
    m.includes('বাতিল করা হয়েছে') ||
    m.includes('warning')
  ) {
    return 'warning';
  }
  if (
    m.includes('সফল') ||
    m.includes('সংরক্ষিত') ||
    m.includes('সংরক্ষণ') ||
    m.includes('অভিনন্দন') ||
    m.includes('প্রস্তুত') ||
    m.includes('সম্পন্ন') ||
    m.includes('পাঠানো হয়েছে') ||
    m.includes('জমা হয়েছে') ||
    m.includes('জমা হয়েছে') ||
    m.includes('মুছে ফেলা') ||
    m.includes('রিসেট করা') ||
    m.includes('হয়েছে') ||
    m.includes('হয়েছে')
  ) {
    return 'success';
  }
  return 'info';
}

/**
 * Displays a non-blocking global toast notification (replaces window.alert).
 */
export function showToast(message: string, variantOrOptions?: ToastVariant | ToastOptions): void {
  if (globalShowToast) {
    globalShowToast(message, variantOrOptions);
    return;
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('sms:toast', { detail: { message, variantOrOptions } })
    );
  }
}

/**
 * Opens an accessible in-app confirmation modal (replaces window.confirm).
 */
export function confirmDialog(options: string | ConfirmDialogOptions): Promise<boolean> {
  if (globalConfirm) {
    return globalConfirm(options);
  }
  if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
    const msg = typeof options === 'string' ? options : options.message;
    return Promise.resolve(window.confirm(msg));
  }
  return Promise.resolve(false);
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      showToast,
      confirm: confirmDialog,
    };
  }
  return ctx;
}

const VARIANT_STYLES: Record<ToastVariant, { container: string; icon: React.ReactNode }> = {
  success: {
    container:
      'bg-emerald-50 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100',
    icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />,
  },
  warning: {
    container:
      'bg-amber-50 dark:bg-amber-950/90 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100',
    icon: <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />,
  },
  error: {
    container:
      'bg-rose-50 dark:bg-rose-950/90 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-100',
    icon: <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />,
  },
  info: {
    container:
      'bg-indigo-50 dark:bg-slate-900 border-indigo-200 dark:border-indigo-800 text-slate-900 dark:text-slate-100',
    icon: <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />,
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmQueue, setConfirmQueue] = useState<PendingConfirm[]>([]);
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null);
  const cancelBtnRef = useRef<HTMLButtonElement | null>(null);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const triggerToast = useCallback(
    (message: string, variantOrOptions?: ToastVariant | ToastOptions) => {
      const text = String(message || '').trim();
      if (!text) return;
      const variant =
        typeof variantOrOptions === 'string'
          ? variantOrOptions
          : variantOrOptions?.type || inferToastVariant(text);
      const durationMs =
        typeof variantOrOptions === 'object' && variantOrOptions?.durationMs
          ? variantOrOptions.durationMs
          : 4500;
      const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

      setToasts((prev) => [...prev.slice(-4), { id, message: text, variant }]);
      setTimeout(() => dismissToast(id), durationMs);
    },
    [dismissToast]
  );

  const triggerConfirm = useCallback((options: string | ConfirmDialogOptions): Promise<boolean> => {
    const normalized: ConfirmDialogOptions =
      typeof options === 'string' ? { message: options } : options;
    return new Promise<boolean>((resolve) => {
      setConfirmQueue((prev) => [...prev, { ...normalized, resolve }]);
    });
  }, []);

  const activeConfirm = confirmQueue[0] || null;

  const resolveActiveConfirm = useCallback((accepted: boolean) => {
    setConfirmQueue((prev) => {
      const [first, ...rest] = prev;
      if (first) {
        first.resolve(accepted);
      }
      return rest;
    });
  }, []);

  useEffect(() => {
    globalShowToast = triggerToast;
    globalConfirm = triggerConfirm;

    const handleToastEvent = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (detail?.message) {
        triggerToast(detail.message, detail.variantOrOptions);
      }
    };
    window.addEventListener('sms:toast', handleToastEvent);
    return () => {
      if (globalShowToast === triggerToast) globalShowToast = null;
      if (globalConfirm === triggerConfirm) globalConfirm = null;
      window.removeEventListener('sms:toast', handleToastEvent);
    };
  }, [triggerToast, triggerConfirm]);

  useEffect(() => {
    if (!activeConfirm) return;
    cancelBtnRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        resolveActiveConfirm(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeConfirm, resolveActiveConfirm]);

  return (
    <ToastContext.Provider value={{ showToast: triggerToast, confirm: triggerConfirm }}>
      {children}

      {/* Stacked Toast Region */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed top-4 right-4 z-[9998] flex flex-col gap-2.5 max-w-md w-[calc(100vw-2rem)] sm:w-auto pointer-events-none print:hidden"
      >
        {toasts.map((t) => {
          const style = VARIANT_STYLES[t.variant];
          return (
            <div
              key={t.id}
              role="status"
              className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-md transition-all animate-in fade-in slide-in-from-top-2 ${style.container}`}
            >
              <div className="mt-0.5">{style.icon}</div>
              <p className="text-sm font-medium leading-relaxed whitespace-pre-line flex-1">
                {t.message}
              </p>
              <button
                type="button"
                onClick={() => dismissToast(t.id)}
                aria-label="বন্ধ করুন"
                className="p-1 rounded-lg opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-opacity cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Accessible Confirmation Modal */}
      {activeConfirm && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs print:hidden"
          onClick={() => resolveActiveConfirm(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="sms-confirm-dialog-title"
            aria-describedby="sms-confirm-dialog-desc"
            className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-slate-900 dark:text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3.5">
              <div
                className={`p-2.5 rounded-xl shrink-0 ${
                  activeConfirm.danger
                    ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400'
                    : 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400'
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3
                  id="sms-confirm-dialog-title"
                  className="text-base font-bold text-slate-900 dark:text-slate-100"
                >
                  {activeConfirm.title || 'নিশ্চিতকরণ'}
                </h3>
                <p
                  id="sms-confirm-dialog-desc"
                  className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line"
                >
                  {activeConfirm.message}
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                ref={cancelBtnRef}
                type="button"
                onClick={() => resolveActiveConfirm(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                {activeConfirm.cancelLabel || 'বাতিল'}
              </button>
              <button
                ref={confirmBtnRef}
                type="button"
                onClick={() => resolveActiveConfirm(true)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors cursor-pointer ${
                  activeConfirm.danger
                    ? 'bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-500'
                    : 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500'
                }`}
              >
                {activeConfirm.confirmLabel || 'নিশ্চিত করুন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}
