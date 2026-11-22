'use client';

import React, { useState } from 'react';
import { Calendar, Check, Copy, Edit3, FileText, Pin, Printer, X } from 'lucide-react';
import { Notice } from '@/services/noticeService';
import { SchoolSettings } from '@/services/settingsService';
import SchoolPadWrapper from '@/components/SchoolPadWrapper';
import {
  formatNoticeDate,
  getCategoryBadge,
  getPublisherInitial,
  getTargetAudienceBadge,
} from './noticeHelpers';

export interface NoticeQuickViewModalProps {
  notice: Notice | null;
  schoolSettings: SchoolSettings;
  isAdmin: boolean;
  onClose: () => void;
  onEdit: (notice: Notice) => void;
  onPrint: (notice: Notice) => void;
}

export function NoticeQuickViewModal({
  notice,
  schoolSettings,
  isAdmin,
  onClose,
  onEdit,
  onPrint,
}: NoticeQuickViewModalProps) {
  const [copied, setCopied] = useState(false);

  if (!notice) return null;

  const handleCopy = () => {
    const text = `${schoolSettings.schoolName || 'শিক্ষা প্রতিষ্ঠান'}\nস্মারক নং: ${notice.refNo || '—'} | তারিখ: ${formatNoticeDate(notice.publishedAt)}\n\n${notice.title}\n\n${notice.content}\n\n${notice.publisherName || schoolSettings.principalName || 'প্রধান শিক্ষক'}\n${notice.publisherRole || 'প্রধান শিক্ষক'}`;
    try {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto print:hidden">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden my-8 max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800">
        {/* Executive Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-6 py-4 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
              <FileText size={18} className="text-indigo-200" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-[11px] font-bold text-indigo-200 bg-white/10 px-2 py-0.5 rounded-md">
                  {notice.refNo || 'প্রাতিষ্ঠানিক নোটিশ'}
                </span>
                {notice.isPinned && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 text-[10px] font-black">
                    <Pin size={10} /> পিনকৃত
                  </span>
                )}
              </div>
              <h3 className="text-sm sm:text-base font-black text-white mt-0.5 truncate">
                {schoolSettings.schoolName || 'অফিসিয়াল বিজ্ঞপ্তি'}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition shrink-0"
            aria-label="বন্ধ করুন"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-1.5">
              {getCategoryBadge(notice.category)}
              {getTargetAudienceBadge(notice.targetAudience)}
              {notice.priority === 'urgent' && (
                <span className="px-2 py-0.5 bg-rose-600 text-white rounded-lg text-[10px] font-black">
                  জরুরি
                </span>
              )}
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
              <Calendar size={13} className="text-slate-400" />
              {formatNoticeDate(notice.publishedAt)}
            </span>
          </div>

          <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug">
            {notice.title}
          </h4>

          <div className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line bg-slate-50/80 dark:bg-slate-950/70 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            {notice.content}
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-indigo-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                {getPublisherInitial(notice.publisherName || schoolSettings.principalName)}
              </div>
              <div>
                <strong className="text-xs font-black text-slate-900 dark:text-white block">
                  {notice.publisherName || schoolSettings.principalName}
                </strong>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                  {notice.publisherRole || 'প্রধান শিক্ষক'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition"
            >
              {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
              <span>{copied ? 'কপি হয়েছে' : 'টেক্সট কপি'}</span>
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/70 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs transition cursor-pointer"
          >
            বন্ধ করুন
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(notice);
              }}
              className="px-4 py-2 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800/60 rounded-xl font-bold text-xs transition inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 size={14} /> এডিট করুন
            </button>
          )}
          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onPrint(notice);
              }}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs shadow-sm transition inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Printer size={14} /> A4 প্যাডে প্রিন্ট
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export interface BlankPadModalProps {
  open: boolean;
  schoolSettings: SchoolSettings;
  onClose: () => void;
}

export function BlankPadModal({ open, schoolSettings, onClose }: BlankPadModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 print:p-0 print:bg-white print:relative print:z-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 print:shadow-none print:border-none print:p-0 max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Printer size={18} />
            </div>
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-sm sm:text-base">
                ফাঁকা স্কুল প্যাড প্রিন্ট প্রিভিউ
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                মার্জিন: উপরে {schoolSettings?.padMargins?.top ?? 2.4}&quot; • বামে {schoolSettings?.padMargins?.left ?? 0.75}&quot; • ডানে {schoolSettings?.padMargins?.right ?? 0.75}&quot; • নিচে {schoolSettings?.padMargins?.bottom ?? 0.9}&quot;
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs transition inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Printer size={14} /> প্রিন্ট করুন (A4)
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl cursor-pointer"
              aria-label="বন্ধ করুন"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="py-2">
          <SchoolPadWrapper
            settings={schoolSettings}
            mode="blank_pad"
            title=""
            hideHeaderActions={true}
            signatures={[
              {
                title: 'প্রধান শিক্ষক',
                subtitle: schoolSettings.schoolName || 'বরইতলী উচ্চ বিদ্যালয়',
                rightAligned: true,
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
