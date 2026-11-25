import React from 'react';

/**
 * Lightweight instant skeleton rendered by Next.js App Router while any
 * `/dashboard/*` route chunk is streaming or hydrating. Guarantees immediate
 * visual feedback on every sidebar/menu click instead of appearing frozen.
 */
export default function DashboardRouteLoading() {
  return (
    <div
      className="max-w-[1600px] mx-auto p-4 sm:p-6 space-y-5 animate-pulse"
      aria-busy="true"
      aria-label="লোড হচ্ছে..."
    >
      {/* Top compact header bar skeleton */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/70" />
          <div className="space-y-2">
            <div className="h-4 w-44 rounded-lg bg-slate-200 dark:bg-slate-800" />
            <div className="h-3 w-28 rounded-md bg-slate-100 dark:bg-slate-800/70" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-24 rounded-xl bg-slate-100 dark:bg-slate-800" />
          <div className="h-9 w-28 rounded-xl bg-indigo-100 dark:bg-indigo-950/60" />
        </div>
      </div>

      {/* KPI cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[0, 1, 2, 3].map((idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 space-y-3"
          >
            <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-7 w-24 rounded-lg bg-slate-200 dark:bg-slate-800" />
            <div className="h-2.5 w-32 rounded bg-slate-100 dark:bg-slate-800/70" />
          </div>
        ))}
      </div>

      {/* Main workspace table/panel skeleton */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-3">
        <div className="h-4 w-56 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="space-y-2.5 pt-2">
          {[0, 1, 2, 3, 4, 5].map((row) => (
            <div
              key={row}
              className="h-10 w-full rounded-xl bg-slate-100/90 dark:bg-slate-800/60"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
