'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import type {
  FinanceGroupedNavCluster,
  FinanceNavAccent,
} from '@/lib/financeWorkspaceNavUtils';
import { findActiveGroupedNavItem } from '@/lib/financeWorkspaceNavUtils';

const ACCENT_STYLES: Record<
  FinanceNavAccent,
  {
    headerText: string;
    dot: string;
    activeBtn: string;
    activeBadge: string;
    contextBorder: string;
    contextPill: string;
  }
> = {
  teal: {
    headerText: 'text-teal-700 dark:text-teal-400',
    dot: 'bg-teal-500',
    activeBtn:
      'bg-teal-600 text-white shadow-sm shadow-teal-600/20 ring-1 ring-teal-500/40',
    activeBadge: 'bg-white/20 text-white',
    contextBorder: 'border-teal-200/70 dark:border-teal-800/60 bg-teal-50/50 dark:bg-teal-950/30',
    contextPill: 'bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200',
  },
  indigo: {
    headerText: 'text-indigo-700 dark:text-indigo-400',
    dot: 'bg-indigo-500',
    activeBtn:
      'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20 ring-1 ring-indigo-500/40',
    activeBadge: 'bg-white/20 text-white',
    contextBorder:
      'border-indigo-200/70 dark:border-indigo-800/60 bg-indigo-50/50 dark:bg-indigo-950/30',
    contextPill: 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200',
  },
  amber: {
    headerText: 'text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-500',
    activeBtn:
      'bg-slate-900 dark:bg-amber-600 text-white shadow-sm shadow-slate-900/15 ring-1 ring-slate-800/30 dark:ring-amber-500/40',
    activeBadge: 'bg-white/20 text-white',
    contextBorder:
      'border-amber-200/70 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/30',
    contextPill: 'bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200',
  },
};

function getInactiveBadgeClass(tone: 'neutral' | 'alert' | 'success' | 'info' = 'neutral') {
  if (tone === 'alert') {
    return 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200/70 dark:border-rose-800/60';
  }
  if (tone === 'success') {
    return 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60';
  }
  if (tone === 'info') {
    return 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/70 dark:border-teal-800/60';
  }
  return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300';
}

export interface FinanceGroupedWorkspaceNavProps<T extends string> {
  clusters: FinanceGroupedNavCluster<T>[];
  iconsById: Record<T, React.ComponentType<{ className?: string }>>;
  activeId: T;
  onSelect: (id: T) => void;
  primaryTabId?: T;
  primaryReturnLabel?: string;
}

export function FinanceGroupedWorkspaceNav<T extends string>({
  clusters,
  iconsById,
  activeId,
  onSelect,
  primaryTabId,
  primaryReturnLabel,
}: FinanceGroupedWorkspaceNavProps<T>) {
  const activeMeta = findActiveGroupedNavItem(clusters, activeId);
  const activeAccentStyle = activeMeta ? ACCENT_STYLES[activeMeta.cluster.accent] : ACCENT_STYLES.teal;

  return (
    <div className="print:hidden space-y-2">
      {/* 3-Cluster Executive Command Dock */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-2.5">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-2.5 xl:gap-0 xl:divide-x divide-slate-200/80 dark:divide-slate-800">
          {clusters.map((cluster, idx) => {
            const style = ACCENT_STYLES[cluster.accent];
            // Proportional desktop spans: 3 items -> 4 cols, 2 items -> 4 cols (total 12)
            const colSpanClass =
              clusters.length === 3
                ? idx === 2 && cluster.items.length === 2
                  ? 'xl:col-span-3'
                  : idx === 0 && clusters[2]?.items.length === 2
                  ? 'xl:col-span-5'
                  : 'xl:col-span-4'
                : 'xl:col-span-4';

            return (
              <div
                key={cluster.id}
                className={`${colSpanClass} ${
                  idx > 0 ? 'xl:pl-3 pt-2 xl:pt-0 border-t xl:border-t-0 border-slate-100 dark:border-slate-800/80' : ''
                } ${idx < clusters.length - 1 ? 'xl:pr-3' : ''} flex flex-col gap-1.5 min-w-0`}
              >
                {/* Micro Cluster Heading */}
                <div className="flex items-center gap-1.5 px-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                  <span
                    className={`text-[10px] font-black tracking-wide uppercase ${style.headerText}`}
                  >
                    {cluster.title}
                  </span>
                </div>

                {/* 1-Click Action Pills */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {cluster.items.map((item) => {
                    const Icon = iconsById[item.id] as
                      | React.ComponentType<{ className?: string }>
                      | undefined;
                    const isActive = activeId === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onSelect(item.id)}
                        aria-current={isActive ? 'page' : undefined}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                          isActive
                            ? style.activeBtn
                            : 'bg-slate-50/90 dark:bg-slate-950/70 text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white'
                        }`}
                      >
                        {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
                        <span>{item.label}</span>
                        {item.badgeText && (
                          <span
                            className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-black leading-tight ${
                              isActive
                                ? style.activeBadge
                                : getInactiveBadgeClass(item.badgeTone)
                            }`}
                          >
                            {item.badgeText}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Slim Active Context Guide Strip (only shown on secondary tabs or subtle summary) */}
      {activeMeta && (
        <div
          className={`px-3.5 py-2 rounded-xl border flex flex-wrap items-center justify-between gap-2 text-xs ${activeAccentStyle.contextBorder}`}
        >
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <span
              className={`px-2 py-0.5 rounded-lg text-[10.5px] font-black shrink-0 ${activeAccentStyle.contextPill}`}
            >
              {activeMeta.cluster.title} · {activeMeta.item.label}
            </span>
            <span className="text-[11.5px] font-semibold text-slate-600 dark:text-slate-300">
              {activeMeta.item.shortDesc}
            </span>
          </div>

          {primaryTabId && activeId !== primaryTabId && primaryReturnLabel && (
            <button
              type="button"
              onClick={() => onSelect(primaryTabId)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-black text-slate-700 dark:text-slate-200 hover:border-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>{primaryReturnLabel}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
