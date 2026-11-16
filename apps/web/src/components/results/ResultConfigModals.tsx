'use client';

import React, { useState } from 'react';
import { ArrowDown, ArrowUp, Check, RotateCcw, SlidersHorizontal, X } from 'lucide-react';
import { DynamicClassSubject } from '@/lib/curriculumUtils';
import { DEFAULT_TIE_BREAKER_RULES, TieBreakerRule } from '@/lib/resultAnalyticsEngine';
import { AppLanguage } from '@/services/languageService';

export function TieBreakerOrderModal({
  isOpen,
  initialRules,
  lang,
  onSave,
  onClose,
}: {
  isOpen: boolean;
  initialRules: TieBreakerRule[];
  lang: AppLanguage;
  onSave: (rules: TieBreakerRule[]) => void;
  onClose: () => void;
}) {
  const [rules, setRules] = useState<TieBreakerRule[]>(initialRules);

  if (!isOpen) return null;

  const moveItem = (index: number, delta: -1 | 1) => {
    const nextIdx = index + delta;
    if (nextIdx < 0 || nextIdx >= rules.length) return;
    const copy = [...rules];
    const [picked] = copy.splice(index, 1);
    copy.splice(nextIdx, 0, picked);
    setRules(copy);
  };

  const toggleRule = (idx: number) => {
    setRules((prev) => prev.map((r, i) => (i === idx ? { ...r, enabled: !r.enabled } : r)));
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 print:hidden">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={18} className="text-indigo-600 dark:text-indigo-400" />
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                {lang === 'bn' ? 'মেধাক্রম ও টাই-ব্রেকার নিয়মাবলি' : 'Merit Ranking & Tie-Breaker Priority'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {lang === 'bn'
                  ? 'সমান ফলাফলের ক্ষেত্রে কোন ক্রমে মেধাস্থান নির্ধারিত হবে তা সাজান'
                  : 'Reorder or toggle tie-breaking steps for merit ranking'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-2.5 max-h-[60vh] overflow-y-auto">
          {rules.map((rule, idx) => (
            <div
              key={rule.key}
              className={`flex items-center justify-between gap-3 p-3 rounded-2xl border transition ${
                rule.enabled
                  ? 'bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/60'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
              }`}
            >
              <label className="flex items-center gap-3 cursor-pointer flex-1">
                <input
                  type="checkbox"
                  checked={rule.enabled}
                  onChange={() => toggleRule(idx)}
                  className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                />
                <div>
                  <div className="text-xs font-black text-slate-900 dark:text-white">
                    {idx + 1}. {lang === 'bn' ? rule.labelBn : rule.labelEn}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                    {lang === 'bn' ? rule.directionBn : rule.directionEn}
                  </div>
                </div>
              </label>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => moveItem(idx, -1)}
                  disabled={idx === 0}
                  className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-30 cursor-pointer"
                  aria-label="Move up"
                >
                  <ArrowUp size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => moveItem(idx, 1)}
                  disabled={idx === rules.length - 1}
                  className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-30 cursor-pointer"
                  aria-label="Move down"
                >
                  <ArrowDown size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setRules(DEFAULT_TIE_BREAKER_RULES)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 cursor-pointer"
          >
            <RotateCcw size={13} />
            {lang === 'bn' ? 'ডিফল্ট রিসেট' : 'Reset Default'}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 cursor-pointer"
            >
              {lang === 'bn' ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={() => {
                onSave(rules);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer"
            >
              <Check size={14} />
              {lang === 'bn' ? 'সংরক্ষণ ও প্রয়োগ' : 'Apply Priority'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SubjectOrderModal({
  isOpen,
  subjects,
  defaultSubjects,
  lang,
  onSave,
  onClose,
}: {
  isOpen: boolean;
  subjects: DynamicClassSubject[];
  defaultSubjects: DynamicClassSubject[];
  lang: AppLanguage;
  onSave: (orderedCodes: string[]) => void;
  onClose: () => void;
}) {
  const [items, setItems] = useState<DynamicClassSubject[]>(subjects);

  if (!isOpen) return null;

  const moveItem = (index: number, delta: -1 | 1) => {
    const nextIdx = index + delta;
    if (nextIdx < 0 || nextIdx >= items.length) return;
    const copy = [...items];
    const [picked] = copy.splice(index, 1);
    copy.splice(nextIdx, 0, picked);
    setItems(copy);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 print:hidden">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              {lang === 'bn' ? 'বিষয়ের কলাম ক্রম সাজান' : 'Customize Subject Display Order'}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {lang === 'bn'
                ? 'টেবুলেশন ও সব বিষয়ের সারসংক্ষেপ টেবিলে বিষয়ের ক্রম নির্ধারণ করুন'
                : 'Applies to Tabulation and All-Subjects Summary columns'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-2 max-h-[60vh] overflow-y-auto">
          {items.map((sub, idx) => (
            <div
              key={`${sub.code}_${idx}`}
              className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono text-[11px] font-black flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <div className="truncate">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{sub.name}</div>
                  <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                    {sub.code} • {sub.fullMarks} marks
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => moveItem(idx, -1)}
                  disabled={idx === 0}
                  className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-30 cursor-pointer"
                >
                  <ArrowUp size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => moveItem(idx, 1)}
                  disabled={idx === items.length - 1}
                  className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-30 cursor-pointer"
                >
                  <ArrowDown size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setItems(defaultSubjects)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 cursor-pointer"
          >
            <RotateCcw size={13} />
            {lang === 'bn' ? 'পাঠ্যক্রম ক্রম' : 'Curriculum Default'}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 cursor-pointer"
            >
              {lang === 'bn' ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={() => {
                onSave(items.map((s) => String(s.code)));
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer"
            >
              <Check size={14} />
              {lang === 'bn' ? 'সংরক্ষণ' : 'Save Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
