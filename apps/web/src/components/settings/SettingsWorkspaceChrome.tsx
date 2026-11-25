'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronDown,
  Cpu,
  Database,
  GraduationCap,
  MessageSquare,
  Palette,
  Printer,
  RotateCcw,
  Save,
  School,
  Search,
  Settings,
  Shield,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import {
  ALL_SETTINGS_NAV_ITEMS,
  searchSettingsItems,
  SETTINGS_CATEGORY_GROUPS,
  SettingsNavItemId,
  SettingsSearchEntry,
  SetupChecklistSummary,
} from '@/lib/settingsWorkspaceUtils';
import type { SettingsTab } from './settingsShared';

const NAV_ICON_MAP: Record<SettingsNavItemId, React.ReactNode> = {
  identity: <School className="w-4 h-4" />,
  committee: <Users className="w-4 h-4" />,
  facilities: <Building2 className="w-4 h-4" />,
  pad: <Printer className="w-4 h-4" />,
  appearance: <Palette className="w-4 h-4" />,
  academic: <GraduationCap className="w-4 h-4" />,
  sms: <MessageSquare className="w-4 h-4" />,
  security: <Shield className="w-4 h-4" />,
  data: <Database className="w-4 h-4" />,
  system: <Cpu className="w-4 h-4" />,
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/* 1. SLIM EXECUTIVE HEADER + QUICK SETTINGS SEARCH                           */
/* ═══════════════════════════════════════════════════════════════════════════ */
interface SettingsSlimHeaderProps {
  isDirty: boolean;
  isSaving: boolean;
  savedSuccess: boolean;
  onSave: () => void;
  onNavigateTarget: (tab: SettingsNavItemId, anchorId?: string) => void;
}

export function SettingsSlimHeader({
  isDirty,
  isSaving,
  savedSuccess,
  onSave,
  onNavigateTarget,
}: SettingsSlimHeaderProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => searchSettingsItems(query), [query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleSelectEntry = (entry: SettingsSearchEntry) => {
    onNavigateTarget(entry.tab, entry.anchorId);
    setQuery('');
    setOpen(false);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 px-4 py-3 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 print:hidden">
      {/* Left: Clean Minimal Title */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-indigo-600 text-white flex items-center justify-center shrink-0">
          <Settings className="w-4.5 h-4.5" />
        </div>
        <div>
          <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
            সিস্টেম সেটিংস
          </h1>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            প্রতিষ্ঠান, প্রিন্ট প্যাড, একাডেমিক ও নিরাপত্তা কনফিগারেশন
          </p>
        </div>
      </div>

      {/* Center: Quick Settings Search */}
      <div ref={containerRef} className="relative flex-1 max-w-md w-full">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (!open || results.length === 0) return;
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActiveIndex((i) => (i + 1) % results.length);
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActiveIndex((i) => (i - 1 + results.length) % results.length);
            } else if (e.key === 'Enter') {
              e.preventDefault();
              handleSelectEntry(results[activeIndex]);
            } else if (e.key === 'Escape') {
              setOpen(false);
            }
          }}
          placeholder="সেটিংস খুঁজুন... (যেমন: লোগো, প্যাড, পাসওয়ার্ড, ব্যাকআপ, SMS)"
          className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 outline-none transition-all placeholder:text-slate-400 placeholder:font-normal"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            aria-label="সার্চ মুছুন"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Search Results Dropdown */}
        {open && query.trim().length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-40 overflow-hidden">
            {results.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400">
                &quot;{query}&quot; নামে কোনো সেটিংস পাওয়া যায়নি
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
                {results.map((entry, idx) => (
                  <li key={entry.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectEntry(entry)}
                      className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between gap-2 transition cursor-pointer ${
                        idx === activeIndex
                          ? 'bg-indigo-50/80 dark:bg-indigo-950/50'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/70'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                          {entry.titleBn}
                        </p>
                        <p className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate">
                          {entry.categoryBn} · {entry.subtitleBn}
                        </p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Right: Primary Save Button (No Reset button in header!) */}
      <div className="flex items-center gap-2 shrink-0 justify-end">
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer shadow-xs disabled:opacity-60 ${
            savedSuccess
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
              : isDirty
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white ring-2 ring-indigo-500/20'
              : 'bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white'
          }`}
        >
          {savedSuccess ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" /> সংরক্ষিত হয়েছে
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" /> {isSaving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* 2. COMPACT SETUP COMPLETION CHECKLIST BAR (Auto-hides at 5/5)              */
/* ═══════════════════════════════════════════════════════════════════════════ */
interface SetupCompletionBarProps {
  checklist: SetupChecklistSummary;
  onJump: (tab: SettingsNavItemId, anchorId?: string) => void;
}

export function SetupCompletionBar({ checklist, onJump }: SetupCompletionBarProps) {
  if (checklist.isComplete) return null;

  return (
    <div className="bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/60 rounded-2xl px-4 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3 print:hidden">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-black text-indigo-950 dark:text-indigo-100">
              প্রাথমিক সেটআপ ({checklist.completedCount}/{checklist.totalCount} সম্পন্ন)
            </span>
            <div className="w-24 h-1.5 bg-indigo-200/70 dark:bg-indigo-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 dark:bg-indigo-400 rounded-full transition-all duration-300"
                style={{ width: `${checklist.percent}%` }}
              />
            </div>
          </div>
          <p className="text-[11px] text-indigo-800/80 dark:text-indigo-300/80 truncate mt-0.5">
            বাকি থাকা আইটেমে ক্লিক করে দ্রুত পূরণ করুন (সব পূরণ হলে এই বারটি স্বয়ংক্রিয়ভাবে সরে যাবে)
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {checklist.missingItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onJump(item.tab, item.anchorId)}
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 hover:bg-indigo-600 hover:text-white text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs"
          >
            <span>+ {item.labelBn}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* 3. CATEGORIZED VERTICAL SETTINGS SIDEBAR (Desktop) + CLEAN MOBILE PICKER   */
/* ═══════════════════════════════════════════════════════════════════════════ */
interface SettingsVerticalSidebarProps {
  activeTab: SettingsTab;
  missingTabs: Set<SettingsNavItemId>;
  onSelectTab: (tab: SettingsNavItemId) => void;
}

export function SettingsVerticalSidebar({
  activeTab,
  missingTabs,
  onSelectTab,
}: SettingsVerticalSidebarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const currentItem =
    ALL_SETTINGS_NAV_ITEMS.find((i) => i.id === activeTab) || ALL_SETTINGS_NAV_ITEMS[0];

  return (
    <>
      {/* Mobile / Tablet Compact Category Dropdown */}
      <div className="lg:hidden relative print:hidden">
        <button
          type="button"
          onClick={() => setMobileMenuOpen((v) => !v)}
          className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs flex items-center justify-between gap-2 text-left cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              {NAV_ICON_MAP[currentItem.id]}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                {currentItem.labelBn}
              </p>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate">
                {currentItem.descBn}
              </p>
            </div>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${
              mobileMenuOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {mobileMenuOpen && (
          <div className="mt-2 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg space-y-3">
            {SETTINGS_CATEGORY_GROUPS.map((group) => (
              <div key={group.id} className="space-y-1">
                <p className="px-2.5 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {group.titleBn}
                </p>
                {group.items.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onSelectTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full px-3 py-2 rounded-xl flex items-center gap-2.5 text-left transition cursor-pointer ${
                        isActive
                          ? 'bg-slate-900 dark:bg-indigo-600 text-white'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className={isActive ? 'text-amber-300' : 'text-slate-400'}>
                        {NAV_ICON_MAP[item.id]}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold truncate">{item.labelBn}</p>
                        <p
                          className={`text-[10px] truncate ${
                            isActive ? 'text-slate-300 dark:text-indigo-100' : 'text-slate-400'
                          }`}
                        >
                          {item.descBn}
                        </p>
                      </div>
                      {missingTabs.has(item.id) && !isActive && (
                        <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop Sticky Vertical Sidebar */}
      <nav
        aria-label="সেটিংস ক্যাটাগরি"
        className="hidden lg:block w-60 shrink-0 print:hidden"
      >
        <div className="sticky top-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-2.5 shadow-2xs space-y-4">
          {SETTINGS_CATEGORY_GROUPS.map((group) => (
            <div key={group.id} className="space-y-1">
              <p className="px-2.5 pb-0.5 text-[10.5px] font-black tracking-wide text-slate-400 dark:text-slate-500">
                {group.titleBn}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelectTab(item.id)}
                      className={`w-full px-2.5 py-2 rounded-xl flex items-start gap-2.5 text-left cursor-pointer ${
                        isActive
                          ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
                      }`}
                    >
                      <span
                        className={`mt-0.5 shrink-0 ${
                          isActive
                            ? 'text-amber-300 dark:text-white'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {NAV_ICON_MAP[item.id]}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <span
                            className={`text-xs font-black truncate ${
                              isActive
                                ? 'text-white'
                                : 'text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {item.labelBn}
                          </span>
                          {missingTabs.has(item.id) && !isActive && (
                            <span
                              className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"
                              title="সেটআপ বাকি আছে"
                            />
                          )}
                        </div>
                        <p
                          className={`text-[10.5px] truncate mt-0.5 leading-snug ${
                            isActive
                              ? 'text-slate-300 dark:text-indigo-100'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {item.descBn}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* 4. SMART FLOATING UNSAVED CHANGES BAR                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */
interface UnsavedChangesBarProps {
  visible: boolean;
  isSaving: boolean;
  onDiscard: () => void;
  onSave: () => void;
}

export function UnsavedChangesBar({
  visible,
  isSaving,
  onDiscard,
  onSave,
}: UnsavedChangesBarProps) {
  if (!visible) return null;

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-lg print:hidden">
      <div className="bg-slate-900 dark:bg-slate-800 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
          <span className="text-xs font-bold truncate">অসংরক্ষিত পরিবর্তন রয়েছে</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onDiscard}
            disabled={isSaving}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer transition disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" /> বাতিল
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="px-4 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-black flex items-center gap-1.5 shadow-md cursor-pointer transition disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" /> {isSaving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
          </button>
        </div>
      </div>
    </div>
  );
}
