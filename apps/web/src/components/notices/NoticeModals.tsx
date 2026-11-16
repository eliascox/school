'use client';

import React from 'react';
import { Edit3, Eye, Printer, X } from 'lucide-react';
import { Notice } from '@/services/noticeService';
import { SchoolSettings } from '@/services/settingsService';
import SchoolPadWrapper from '@/components/SchoolPadWrapper';
import {
  formatNoticeDate,
  getCategoryBadge,
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
  if (!notice) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto print:hidden">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-5 animate-in fade-in my-8 max-h-[90vh] overflow-y-auto border border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-black">
              <Eye size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                  {notice.refNo || 'বউবি/নোটিশ'}
                </span>
                {getCategoryBadge(notice.category)}
                {getTargetAudienceBadge(notice.targetAudience)}
              </div>
              <h3 className="text-base font-black text-slate-950 dark:text-white mt-0.5">নোটিশ প্রিভিউ ও বিবরণ</h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 flex items-center justify-center font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="bg-slate-50/70 dark:bg-slate-950/70 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex justify-between items-center text-xs font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-2">
            <span>
              স্মারক: <strong className="text-slate-900 dark:text-white font-mono">{notice.refNo || 'N/A'}</strong>
            </span>
            <span>
              প্রকাশ: <strong className="text-slate-900 dark:text-white">{formatNoticeDate(notice.publishedAt)}</strong>
            </span>
          </div>

          <div>
            <h4 className="text-base font-black text-slate-900 dark:text-white leading-snug">{notice.title}</h4>
          </div>

          <div className="text-[14px] text-slate-900 dark:text-white leading-relaxed whitespace-pre-line bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            {notice.content}
          </div>

          <div className="flex justify-between items-end pt-2 text-xs">
            <div className="text-slate-500 dark:text-slate-400 text-[11px]">
              <span>উদ্দিষ্ট প্রাপক: </span>
              <strong className="text-slate-800 dark:text-slate-100">
                {getTargetAudienceBadge(notice.targetAudience)}
              </strong>
            </div>
            <div className="text-right">
              <strong className="text-xs font-black text-slate-950 dark:text-white block">
                {notice.publisherName || schoolSettings.principalName}
              </strong>
              <span className="text-[11px] text-indigo-700 dark:text-indigo-300 font-bold">
                {notice.publisherRole || 'প্রধান শিক্ষক'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs transition cursor-pointer"
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
              className="px-4 py-2 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800/60 rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
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
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs shadow transition flex items-center gap-1.5 cursor-pointer"
            >
              <Printer size={15} /> A4 প্যাডে প্রিন্ট করুন
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
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 print:hidden">
          <div>
            <h3 className="font-black text-slate-950 dark:text-white text-base flex items-center gap-2">
              <Printer className="text-emerald-600 dark:text-emerald-400" size={18} />
              ফাঁকা স্কুল প্যাড প্রিন্ট প্রিভিউ (Blank School Letterhead)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              মার্জিন: উপরে {schoolSettings?.padMargins?.top ?? 0.5}&quot; | বামে {schoolSettings?.padMargins?.left ?? 0.5}&quot; | ডানে {schoolSettings?.padMargins?.right ?? 0.5}&quot; | নিচে {schoolSettings?.padMargins?.bottom ?? 0.5}&quot;
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
            >
              <Printer size={15} /> প্রিন্ট করুন (A4)
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl cursor-pointer"
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
