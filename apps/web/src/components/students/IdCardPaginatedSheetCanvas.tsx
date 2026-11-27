'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Users,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type { Student } from '@/services/studentService';
import type { SchoolSettings } from '@/services/settingsService';
import { toBanglaDigits } from '@/lib/omr/omrTemplates';
import type { IdCardDocLang, IdCardTemplateConfig } from '@/lib/idCardTemplateTypes';
import {
  type IdCardPageSettings,
  type IdCardPrintSheetPage,
  PAGE_SIZE_PRESETS,
  type SheetGridMetrics,
} from '@/lib/idCardLayoutUtils';
import { StudentIdCardPreview } from './StudentIdCardPreview';

export interface IdCardPaginatedSheetCanvasProps {
  pages: IdCardPrintSheetPage<Student>[];
  currentPage: number;
  onChangePage: (pageNumber: number) => void;
  targetPrintPageNumbers: number[];
  metrics: SheetGridMetrics;
  pageSettings: IdCardPageSettings;
  schoolSettings: SchoolSettings;
  template: IdCardTemplateConfig;
  docLang: IdCardDocLang;
  sessionYear: string;
  selectedIds: Set<string>;
  onToggleSelectStudent: (id: string) => void;
  populatedGrades: Array<{ grade: string; labelBn: string; count: number }>;
  onJumpToGrade: (grade: string) => void;
  onResetFilters: () => void;
  totalStudentsInDb: number;
}

const MM_TO_SCREEN_PX = 3.7795;

export function IdCardPaginatedSheetCanvas({
  pages,
  currentPage,
  onChangePage,
  targetPrintPageNumbers,
  metrics,
  pageSettings,
  schoolSettings,
  template,
  docLang,
  sessionYear,
  selectedIds,
  onToggleSelectStudent,
  populatedGrades,
  onJumpToGrade,
  onResetFilters,
  totalStudentsInDb,
}: IdCardPaginatedSheetCanvasProps) {
  const [zoomPercent, setZoomPercent] = useState<number>(85);

  const safePageIdx = Math.max(0, Math.min(pages.length - 1, currentPage - 1));
  const activePage = pages[safePageIdx] || null;
  const targetSet = new Set(targetPrintPageNumbers);

  // Render an exact millimeter-positioned sheet (used identically for screen preview & @media print)
  const renderSheet = (page: IdCardPrintSheetPage<Student>, isScreenPreview: boolean) => {
    const scale = isScreenPreview ? zoomPercent / 100 : 1;
    const sheetWidthPx = metrics.pageWidthMm * MM_TO_SCREEN_PX;
    const sheetHeightPx = metrics.pageHeightMm * MM_TO_SCREEN_PX;

    const innerSheet = (
      <div
        className={`relative bg-white text-slate-900 overflow-hidden ${
          isScreenPreview
            ? 'rounded-xl shadow-md border border-slate-300/90 dark:border-slate-700'
            : 'id-card-print-sheet'
        }`}
        style={{
          width: `${metrics.pageWidthMm}mm`,
          height: `${metrics.pageHeightMm}mm`,
          ...(isScreenPreview
            ? {
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
              }
            : {}),
        }}
      >
        {/* Subtle screen-only margin guide */}
        {isScreenPreview && !metrics.isSinglePvcMode && (
          <div
            className="pointer-events-none absolute border border-dashed border-emerald-500/25 print:hidden"
            style={{
              top: `${metrics.marginTopMm}mm`,
              right: `${metrics.marginRightMm}mm`,
              bottom: `${metrics.marginBottomMm}mm`,
              left: `${metrics.marginLeftMm}mm`,
            }}
          />
        )}

        {page.slots.map((slot) => {
          if (!slot.student) return null;
          const st = slot.student;
          const isPicked = selectedIds.has(st.id);
          return (
            <div
              key={`${page.pageNumber}_${slot.row}_${slot.col}_${st.id}_${slot.side}`}
              onClick={isScreenPreview ? () => onToggleSelectStudent(st.id) : undefined}
              className={`absolute ${
                isScreenPreview
                  ? `cursor-pointer group transition-shadow ${
                      isPicked ? 'ring-2 ring-indigo-600 ring-offset-1 rounded-[5px]' : 'hover:ring-2 hover:ring-emerald-500/60 rounded-[5px]'
                    }`
                  : ''
              }`}
              style={{
                left: `${slot.xMm}mm`,
                top: `${slot.yMm}mm`,
              }}
              title={isScreenPreview ? `${st.name} (রোল ${st.roll}) — ক্লিক করে নির্বাচন করুন` : undefined}
            >
              {isScreenPreview && isPicked && (
                <span className="pointer-events-none absolute -top-2 -right-2 z-40 bg-indigo-600 text-white rounded-full p-0.5 shadow-sm print:hidden">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </span>
              )}
              <StudentIdCardPreview
                student={st}
                settings={schoolSettings}
                orientation={pageSettings.cardOrientation}
                sideMode={slot.side === 'pair' ? 'both_side_by_side' : slot.side}
                template={template}
                docLang={docLang}
                sessionYear={sessionYear}
                showCropMarks={pageSettings.showCropMarks && !metrics.isSinglePvcMode}
                cardWidthMm={metrics.cardWidthMm}
                cardHeightMm={metrics.cardHeightMm}
                innerPairGapMm={metrics.innerPairGapMm}
              />
            </div>
          );
        })}
      </div>
    );

    if (!isScreenPreview) return innerSheet;

    // Outer sized box prevents collapsed height/width when CSS transform scale() shrinks the sheet
    return (
      <div
        className="mx-auto shrink-0"
        style={{
          width: `${Math.round(sheetWidthPx * scale)}px`,
          height: `${Math.round(sheetHeightPx * scale)}px`,
        }}
      >
        {innerSheet}
      </div>
    );
  };

  return (
    <section className="w-full flex-1 min-w-0 max-w-full space-y-3 print:space-y-0">
      {/* Screen-only Page Switcher, Spec & Zoom Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2.5 shadow-2xs print:hidden">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            disabled={pages.length <= 1 || currentPage <= 1}
            onClick={() => onChangePage(Math.max(1, currentPage - 1))}
            className="h-8 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 disabled:opacity-40 text-xs font-extrabold inline-flex items-center gap-1 cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">পূর্ববর্তী</span>
          </button>

          <span className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-[#0B5D3B] dark:text-emerald-300 text-xs font-black tabular-nums">
            পেইজ {toBanglaDigits(pages.length === 0 ? 0 : safePageIdx + 1)} /{' '}
            {toBanglaDigits(pages.length)}
          </span>

          <button
            type="button"
            disabled={pages.length <= 1 || currentPage >= pages.length}
            onClick={() => onChangePage(Math.min(pages.length, currentPage + 1))}
            className="h-8 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 disabled:opacity-40 text-xs font-extrabold inline-flex items-center gap-1 cursor-pointer"
          >
            <span className="hidden sm:inline">পরবর্তী</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {activePage && (
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 px-1.5">
              • {activePage.labelBn}
            </span>
          )}
        </div>

        {/* Spec & Zoom */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl tabular-nums">
            {PAGE_SIZE_PRESETS[pageSettings.pageSize].id.toUpperCase()} · {metrics.pageWidthMm}×
            {metrics.pageHeightMm}mm · {pageSettings.dpi} DPI
          </span>

          <div className="inline-flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-0.5">
            <button
              type="button"
              onClick={() => setZoomPercent((z) => Math.max(45, z - 15))}
              className="p-1.5 rounded-lg hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
              title="জুম আউট"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 text-[11px] font-extrabold text-slate-700 dark:text-slate-200 tabular-nums w-10 text-center">
              {zoomPercent}%
            </span>
            <button
              type="button"
              onClick={() => setZoomPercent((z) => Math.min(140, z + 15))}
              className="p-1.5 rounded-lg hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
              title="জুম ইন"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Page Number Jump Strip (when > 1 page) */}
      {pages.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar print:hidden">
          {pages.slice(0, 24).map((pg) => {
            const isActive = pg.pageNumber === safePageIdx + 1;
            const isInPrintScope = targetSet.has(pg.pageNumber);
            return (
              <button
                key={pg.pageNumber}
                type="button"
                onClick={() => onChangePage(pg.pageNumber)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold whitespace-nowrap border transition cursor-pointer ${
                  isActive
                    ? 'bg-[#0B5D3B] text-white border-[#0B5D3B] shadow-2xs'
                    : isInPrintScope
                      ? 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                      : 'bg-slate-100/70 dark:bg-slate-900/50 text-slate-400 border-slate-200/70 dark:border-slate-800'
                }`}
              >
                পেইজ {toBanglaDigits(pg.pageNumber)}
                {pg.pageKind === 'back_mirrored' ? ' (মিরর)' : ''}
              </button>
            );
          })}
          {pages.length > 24 && (
            <span className="text-[11px] font-bold text-slate-400 px-2">
              +{toBanglaDigits(pages.length - 24)} আরও পেইজ
            </span>
          )}
        </div>
      )}

      {/* Screen-Only Scaled Active Page Preview */}
      <div className="print:hidden">
        {!activePage ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-10 text-center space-y-4 shadow-2xs">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-[#0B5D3B] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center">
              {totalStudentsInDb === 0 ? (
                <Users className="w-6 h-6" />
              ) : (
                <CreditCard className="w-6 h-6" />
              )}
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                {totalStudentsInDb === 0
                  ? 'এখনো কোনো শিক্ষার্থী যুক্ত করা হয়নি'
                  : 'নির্বাচিত শ্রেণি বা ফিল্টারে কোনো শিক্ষার্থী নেই'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {totalStudentsInDb === 0
                  ? 'আইডি কার্ড তৈরি করতে প্রথমে শিক্ষার্থী তালিকা বা বাল্ক ইম্পোর্ট থেকে শিক্ষার্থী যোগ করুন।'
                  : 'নিচ থেকে শিক্ষার্থী থাকা শ্রেণিতে ক্লিক করুন অথবা ফিল্টার রিসেট করুন।'}
              </p>
            </div>

            {populatedGrades.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {populatedGrades.map((g) => (
                  <button
                    key={g.grade}
                    type="button"
                    onClick={() => onJumpToGrade(g.grade)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-[#0B5D3B] dark:text-emerald-300 text-xs font-extrabold transition cursor-pointer"
                  >
                    {g.labelBn} ({toBanglaDigits(g.count)} জন)
                  </button>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              {totalStudentsInDb > 0 && (
                <button
                  type="button"
                  onClick={onResetFilters}
                  className="h-9 px-4 rounded-xl bg-[#0B5D3B] hover:bg-[#094a2f] text-white text-xs font-extrabold cursor-pointer"
                >
                  সকল শিক্ষার্থী দেখুন
                </button>
              )}
              <Link
                href="/dashboard/students/"
                className="h-9 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-bold inline-flex items-center gap-1.5"
              >
                <span>শিক্ষার্থী তালিকা</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/dashboard/students/bulk-import/"
                className="h-9 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-bold inline-flex items-center gap-1.5"
              >
                <span>বাল্ক ইম্পোর্ট</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-slate-200/65 dark:bg-slate-950/80 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 overflow-x-auto">
            {renderSheet(activePage, true)}
          </div>
        )}
      </div>

      {/* Print-Only Millimeter-Exact Pages (strictly filtered to targetPrintPageNumbers) */}
      <div className="hidden print:block">
        {pages
          .filter((pg) => targetSet.has(pg.pageNumber))
          .map((pg) => (
            <React.Fragment key={`print_pg_${pg.pageNumber}`}>
              {renderSheet(pg, false)}
            </React.Fragment>
          ))}
      </div>
    </section>
  );
}
