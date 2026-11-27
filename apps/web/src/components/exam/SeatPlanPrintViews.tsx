'use client';

import React from 'react';
import { ShieldCheck } from 'lucide-react';
import type {
  ExamHallRoom,
  InvigilatorDuty,
  SeatPlanEntry,
} from '@/services/examSeatPlanService';
import type { SchoolSettings } from '@/services/settingsService';
import {
  type NormalizedGender,
  type RoomDoorSummary,
  normalizeSeatGradeKey,
  toBanglaDigits,
} from '@/lib/seatPlanUtils';
import {
  STICKER_DENSITY_SPECS,
  type SeatPrintLang,
  type StickerDensityId,
  formatSeatPrintDigits,
  formatSeatPrintExam,
  formatSeatPrintGender,
  formatSeatPrintGrade,
  formatSeatPrintGroup,
  getSeatPlanInstitutionHeader,
  getSeatPlanPrintLabels,
  paginateStickersByDensity,
} from '@/lib/seatPlanPrintUtils';
import { InstitutionalPrintBanner } from './SeatPlanRoomMap';

// ───────────────────────────────────────────────────────────────────────────
// 1. DOOR NOTICE SHEET (কক্ষের দরজার আসন নোটিশ)
// ───────────────────────────────────────────────────────────────────────────

export function DoorNoticePrintView({
  summaries,
  settings,
  examTitle,
  cardsPerPage,
  docLang = 'bn',
}: {
  summaries: RoomDoorSummary[];
  settings: SchoolSettings | null;
  examTitle: string;
  cardsPerPage: 1 | 2;
  docLang?: SeatPrintLang;
}) {
  const header = getSeatPlanInstitutionHeader(settings, docLang);
  const labels = getSeatPlanPrintLabels(docLang);
  const formattedExam = formatSeatPrintExam(examTitle, docLang);

  return (
    <div
      className={
        cardsPerPage === 2
          ? 'grid grid-cols-1 lg:grid-cols-2 gap-4 print:block print:space-y-4'
          : 'space-y-6 print:space-y-0'
      }
    >
      {summaries.map((rm, idx) => {
        const isLast = idx === summaries.length - 1;
        const shouldPageBreak = !isLast && (cardsPerPage === 1 || idx % 2 === 1);

        return (
          <div
            key={rm.roomId}
            className={`bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4 seat-avoid-break print:border-2 print:border-slate-900 print:rounded-lg print:p-5 ${
              shouldPageBreak ? 'seat-print-break' : ''
            } ${cardsPerPage === 2 ? 'print:mb-4' : ''}`}
          >
            {/* Institutional Header (uses <div>, never <header>) */}
            <div className="flex items-center justify-between gap-3 border-b-2 border-slate-900 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-3 min-w-0">
                {settings?.schoolLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={settings.schoolLogo}
                    alt="Logo"
                    className="w-11 h-11 object-contain shrink-0"
                  />
                ) : null}
                <div className="min-w-0">
                  <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                    {header.schoolName}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    {[header.address, header.eiinText].filter(Boolean).join(' • ')}
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs font-black text-[#0B5D3B] dark:text-emerald-400">
                  {formattedExam}
                </div>
                <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  {labels.doorSubtitle}
                </div>
              </div>
            </div>

            {/* Big Room Banner */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-200 dark:border-slate-800 print:bg-slate-50 print:border-slate-400">
              <div>
                <div className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                  {labels.examHallLabel}
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  {labels.roomNoPrefix} {formatSeatPrintDigits(rm.roomNo, docLang)}
                </div>
                <div className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  {rm.roomName}
                  {rm.building ? ` • ${rm.building}` : ''}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 print:border-slate-400">
                  <div className="text-[10px] font-bold text-slate-500">{labels.totalExaminees}</div>
                  <div className="text-lg font-black text-slate-900 dark:text-white">
                    {formatSeatPrintDigits(rm.totalAssigned, docLang)}
                  </div>
                </div>
                <div className="px-3 py-2 rounded-xl bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 print:border-slate-400">
                  <div className="text-[10px] font-bold text-sky-700 dark:text-sky-300">{labels.boys}</div>
                  <div className="text-lg font-black text-sky-900 dark:text-sky-100">
                    {formatSeatPrintDigits(rm.boys, docLang)}
                  </div>
                </div>
                <div className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 print:border-slate-400">
                  <div className="text-[10px] font-bold text-rose-700 dark:text-rose-300">{labels.girls}</div>
                  <div className="text-lg font-black text-rose-900 dark:text-rose-100">
                    {formatSeatPrintDigits(rm.girls, docLang)}
                  </div>
                </div>
              </div>
            </div>

            {/* Class & Roll Range Table */}
            <table className="w-full text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 print:bg-slate-100">
                  <th className="p-2.5 border border-slate-300 dark:border-slate-700 text-left font-black">
                    {labels.colClassGroup}
                  </th>
                  <th className="p-2.5 border border-slate-300 dark:border-slate-700 text-left font-black">
                    {labels.colRollRange}
                  </th>
                  <th className="p-2.5 border border-slate-300 dark:border-slate-700 text-center font-black w-16">
                    {labels.boys}
                  </th>
                  <th className="p-2.5 border border-slate-300 dark:border-slate-700 text-center font-black w-16">
                    {labels.girls}
                  </th>
                  <th className="p-2.5 border border-slate-300 dark:border-slate-700 text-center font-black w-16">
                    {labels.colTotal}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rm.classRanges.map((cr) => {
                  const grpText = formatSeatPrintGroup(cr.groupLabel, docLang);
                  return (
                    <tr key={cr.classKey}>
                      <td className="p-2.5 border border-slate-300 dark:border-slate-700 font-black text-slate-900 dark:text-white">
                        {formatSeatPrintGrade(cr.gradeLabel, false, docLang)}
                        {grpText ? ` (${grpText})` : ''}
                      </td>
                      <td className="p-2.5 border border-slate-300 dark:border-slate-700 font-black text-[#0B5D3B] dark:text-emerald-400">
                        {formatSeatPrintDigits(cr.rollRangeLabel, docLang)}
                      </td>
                      <td className="p-2.5 border border-slate-300 dark:border-slate-700 text-center font-bold">
                        {formatSeatPrintDigits(cr.boys, docLang)}
                      </td>
                      <td className="p-2.5 border border-slate-300 dark:border-slate-700 text-center font-bold">
                        {formatSeatPrintDigits(cr.girls, docLang)}
                      </td>
                      <td className="p-2.5 border border-slate-300 dark:border-slate-700 text-center font-black">
                        {formatSeatPrintDigits(cr.count, docLang)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Column Seating Guide Strip */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-black text-slate-600 dark:text-slate-300">
                {labels.rowLayoutPrefix} ({formatSeatPrintDigits(rm.cols, docLang)} × {formatSeatPrintDigits(rm.seatsPerBench, docLang)}):
              </div>
              <div
                className="grid gap-2"
                style={{ gridTemplateColumns: `repeat(${rm.columnSummary.length}, minmax(0, 1fr))` }}
              >
                {rm.columnSummary.map((col) => (
                  <div
                    key={col.colIndex}
                    className={`rounded-xl border px-3 py-2 text-center ${
                      col.rule === 'male'
                        ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-200'
                        : col.rule === 'female'
                        ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                    } print:border-slate-400`}
                  >
                    <div className="text-xs font-black">
                      {labels.colWord} {formatSeatPrintDigits(col.colIndex, docLang)} —{' '}
                      {formatSeatPrintGender(col.rule, docLang)}
                    </div>
                    <div className="text-[11px] font-bold opacity-80">
                      {formatSeatPrintDigits(col.benches, docLang)} {labels.benchWord} •{' '}
                      {formatSeatPrintDigits(col.total, docLang)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Signature Line */}
            <div className="grid grid-cols-2 gap-6 pt-5 text-xs font-bold text-slate-700 dark:text-slate-300">
              <div>
                <div className="w-40 border-t border-slate-400 dark:border-slate-600 pt-1">
                  {labels.controllerSign}
                </div>
              </div>
              <div className="text-right">
                <div className="w-44 ml-auto border-t border-slate-400 dark:border-slate-600 pt-1 text-center">
                  {header.principalTitle}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// 2. BENCH / DESK STICKERS (3-TIER A4 DENSITY: 12 LARGE | 18 MEDIUM | 21 SMALL)
// ───────────────────────────────────────────────────────────────────────────

export function BenchStickersPrintView({
  summaries,
  entriesByRoom,
  studentGenderById,
  settings,
  examTitle,
  stickerMode,
  columnsPerRow,
  stickerDensity = 'medium_18',
  docLang = 'bn',
}: {
  summaries: RoomDoorSummary[];
  entriesByRoom: Map<string, SeatPlanEntry[]>;
  studentGenderById: Map<string, NormalizedGender>;
  settings: SchoolSettings | null;
  examTitle: string;
  stickerMode: 'per_bench' | 'per_seat';
  columnsPerRow: 2 | 3;
  stickerDensity?: StickerDensityId;
  docLang?: SeatPrintLang;
}) {
  const header = getSeatPlanInstitutionHeader(settings, docLang);
  const labels = getSeatPlanPrintLabels(docLang);
  const formattedExam = formatSeatPrintExam(examTitle, docLang);
  const densitySpec = STICKER_DENSITY_SPECS[stickerDensity] || STICKER_DENSITY_SPECS.medium_18;
  const isCompactSmall = stickerDensity === 'small_21';
  const isLarge = stickerDensity === 'large_12';

  const gridColsClass =
    columnsPerRow === 2
      ? 'grid-cols-1 sm:grid-cols-2 print:grid-cols-2'
      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-3';

  if (stickerMode === 'per_seat') {
    const allEntries = summaries.flatMap((s) => entriesByRoom.get(s.roomId) || []);
    const pages = paginateStickersByDensity(allEntries, stickerDensity);

    return (
      <div className="space-y-6 print:space-y-0">
        {pages.map((pageItems, pIdx) => {
          const isLast = pIdx === pages.length - 1;
          return (
            <div
              key={`seat-sticker-page-${pIdx}`}
              className={`space-y-2.5 ${isLast ? 'seat-print-last' : 'seat-print-break'}`}
            >
              <InstitutionalPrintBanner
                settings={settings}
                examTitle={examTitle}
                docSubtitle={`${labels.seatStickerSubtitle} (${docLang === 'en' ? densitySpec.labelEn : densitySpec.labelBn})`}
                compact
                docLang={docLang}
              />
              <div className={`grid ${gridColsClass} gap-2.5 print:gap-2`}>
                {pageItems.map((s) => {
                  const g = s.gender || studentGenderById.get(s.studentId) || 'other';
                  const gradeKey = normalizeSeatGradeKey(s.grade);
                  const grpText =
                    gradeKey === '9th' || gradeKey === '10th'
                      ? formatSeatPrintGroup(s.group, docLang)
                      : '';
                  return (
                    <div
                      key={s.id}
                      style={{ minHeight: `${densitySpec.printMinHeightMm}mm` }}
                      className={`bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex flex-col justify-between seat-avoid-break print:border-slate-700 ${
                        isCompactSmall ? 'p-2' : isLarge ? 'p-3.5' : 'p-2.5'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-1">
                        <span className="text-[9.5px] font-black text-slate-700 dark:text-slate-300 truncate">
                          {header.schoolName}
                        </span>
                        <span className="text-[9.5px] font-black text-[#0B5D3B] dark:text-emerald-400 shrink-0">
                          {labels.roomNoPrefix} {formatSeatPrintDigits(s.roomNo, docLang)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 my-1">
                        <div>
                          <div className="text-[9px] font-bold text-slate-500">
                            {labels.colWord} {formatSeatPrintDigits(s.colIndex, docLang)} • {labels.benchWord} #{formatSeatPrintDigits(s.benchNo, docLang)} ({s.seatPosition})
                          </div>
                          <div
                            className={`${
                              isLarge ? 'text-xl' : isCompactSmall ? 'text-sm' : 'text-base'
                            } font-black text-slate-900 dark:text-white leading-tight`}
                          >
                            {labels.rollLabel}: {formatSeatPrintDigits(s.roll, docLang)}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[9.5px] font-black text-slate-800 dark:text-slate-200 print:border print:border-slate-400">
                            {formatSeatPrintGrade(s.grade, true, docLang)}
                            {grpText ? ` (${grpText})` : ''}
                          </span>
                          <div className="text-[9px] font-bold text-slate-500 mt-0.5">
                            {formatSeatPrintGender(g, docLang)}
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className={`${isCompactSmall ? 'text-[10.5px]' : 'text-xs'} font-black text-slate-900 dark:text-slate-100 truncate`}>
                          {s.studentName}
                        </div>
                        {!isCompactSmall && (
                          <div className="text-[8.5px] font-semibold text-slate-500 truncate">
                            {formattedExam}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Per-Bench Stickers (L + R combined on one cut-out card, paginated by density)
  const benchCards = summaries.flatMap((rm) => {
    const roomEntries = entriesByRoom.get(rm.roomId) || [];
    const benchesMap = new Map<number, SeatPlanEntry[]>();
    roomEntries.forEach((e) => {
      if (!benchesMap.has(e.benchNo)) benchesMap.set(e.benchNo, []);
      benchesMap.get(e.benchNo)!.push(e);
    });
    return Array.from(benchesMap.entries()).map(([benchNo, seats]) => ({
      key: `${rm.roomId}-${benchNo}`,
      benchNo,
      seats,
    }));
  });

  const benchPages = paginateStickersByDensity(benchCards, stickerDensity);

  return (
    <div className="space-y-6 print:space-y-0">
      {benchPages.map((pageCards, pIdx) => {
        const isLast = pIdx === benchPages.length - 1;
        return (
          <div
            key={`bench-sticker-page-${pIdx}`}
            className={`space-y-2.5 ${isLast ? 'seat-print-last' : 'seat-print-break'}`}
          >
            <InstitutionalPrintBanner
              settings={settings}
              examTitle={examTitle}
              docSubtitle={`${labels.benchStickerSubtitle} (${docLang === 'en' ? densitySpec.labelEn : densitySpec.labelBn})`}
              compact
              docLang={docLang}
            />
            <div className={`grid ${gridColsClass} gap-2.5 print:gap-2`}>
              {pageCards.map(({ key, benchNo, seats }) => {
                const first = seats[0];
                return (
                  <div
                    key={key}
                    style={{ minHeight: `${densitySpec.printMinHeightMm}mm` }}
                    className={`bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex flex-col justify-between gap-1.5 seat-avoid-break print:border-slate-700 ${
                      isCompactSmall ? 'p-2' : isLarge ? 'p-3.5' : 'p-2.5'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-1">
                      <span className="text-[10.5px] font-black text-[#0B5D3B] dark:text-emerald-400">
                        {labels.roomNoPrefix} {formatSeatPrintDigits(first?.roomNo, docLang)} •{' '}
                        {labels.colWord} {formatSeatPrintDigits(first?.colIndex, docLang)} •{' '}
                        {labels.benchWord} #{formatSeatPrintDigits(benchNo, docLang)}
                      </span>
                      <span className="text-[9px] font-bold text-slate-500 truncate max-w-[95px]">
                        {formattedExam}
                      </span>
                    </div>

                    <div className="space-y-1 flex-1 flex flex-col justify-center">
                      {seats.map((s) => {
                        const g = s.gender || studentGenderById.get(s.studentId) || 'other';
                        return (
                          <div
                            key={s.id}
                            className={`flex items-center justify-between gap-1.5 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200/80 dark:border-slate-800 print:border-slate-400 ${
                              isCompactSmall ? 'px-2 py-1 text-[10px]' : 'px-2.5 py-1.5 text-xs'
                            }`}
                          >
                            <div className="min-w-0">
                              <span className="font-black text-slate-900 dark:text-white">
                                [{s.seatPosition}] {labels.rollLabel} {formatSeatPrintDigits(s.roll, docLang)}
                              </span>
                              <span className="ml-1 text-[9.5px] font-bold text-slate-600 dark:text-slate-300">
                                ({formatSeatPrintGrade(s.grade, true, docLang)} · {formatSeatPrintGender(g, docLang)})
                              </span>
                            </div>
                            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 truncate max-w-[110px]">
                              {s.studentName}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// 3. ATTENDANCE TOP SHEET (কক্ষভিত্তিক হাজিরা ও উত্তরপত্র টপশিট)
// ───────────────────────────────────────────────────────────────────────────

export function AttendanceTopSheetPrintView({
  summaries,
  entriesByRoom,
  studentGenderById,
  settings,
  examTitle,
  docLang = 'bn',
}: {
  summaries: RoomDoorSummary[];
  entriesByRoom: Map<string, SeatPlanEntry[]>;
  studentGenderById: Map<string, NormalizedGender>;
  settings: SchoolSettings | null;
  examTitle: string;
  docLang?: SeatPrintLang;
}) {
  const labels = getSeatPlanPrintLabels(docLang);

  return (
    <div className="space-y-6 print:space-y-0">
      {summaries.map((rm, idx) => {
        const roomEntries = entriesByRoom.get(rm.roomId) || [];
        const isLast = idx === summaries.length - 1;

        return (
          <div
            key={rm.roomId}
            className={`bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-3 print:border-0 print:rounded-none print:p-0 ${
              isLast ? 'seat-print-last' : 'seat-print-break'
            }`}
          >
            <InstitutionalPrintBanner
              settings={settings}
              examTitle={examTitle}
              docSubtitle={`${labels.topSheetSubtitlePrefix} ${formatSeatPrintDigits(rm.roomNo, docLang)}`}
              compact
              docLang={docLang}
            />

            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  {rm.roomName} ({labels.roomNoPrefix} {formatSeatPrintDigits(rm.roomNo, docLang)})
                </h3>
                <p className="text-[11px] font-semibold text-slate-500">
                  {labels.dateSubjectShiftLine}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-black">
                <span className="px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-200">
                  {labels.boys}: {formatSeatPrintDigits(rm.boys, docLang)}
                </span>
                <span className="px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200">
                  {labels.girls}: {formatSeatPrintDigits(rm.girls, docLang)}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                  {labels.colTotal}: {formatSeatPrintDigits(rm.totalAssigned, docLang)}
                </span>
              </div>
            </div>

            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 print:bg-slate-100">
                  <th className="p-1.5 border border-slate-300 dark:border-slate-700 w-10 text-center">
                    {labels.colSl}
                  </th>
                  <th className="p-1.5 border border-slate-300 dark:border-slate-700 w-24 text-center">
                    {labels.colColBench}
                  </th>
                  <th className="p-1.5 border border-slate-300 dark:border-slate-700 w-16 text-center">
                    {labels.rollLabel}
                  </th>
                  <th className="p-1.5 border border-slate-300 dark:border-slate-700 text-left">
                    {labels.colName}
                  </th>
                  <th className="p-1.5 border border-slate-300 dark:border-slate-700 w-28 text-center">
                    {labels.colClassGroup}
                  </th>
                  <th className="p-1.5 border border-slate-300 dark:border-slate-700 w-14 text-center">
                    {labels.colGender}
                  </th>
                  <th className="p-1.5 border border-slate-300 dark:border-slate-700 w-28 text-center">
                    {labels.colScriptSerial}
                  </th>
                  <th className="p-1.5 border border-slate-300 dark:border-slate-700 w-28 text-center">
                    {labels.colSignature}
                  </th>
                </tr>
              </thead>
              <tbody>
                {roomEntries.map((s, rowIdx) => {
                  const g = s.gender || studentGenderById.get(s.studentId) || 'other';
                  const grpText = formatSeatPrintGroup(s.group, docLang);
                  return (
                    <tr key={s.id} className="seat-avoid-break">
                      <td className="p-1.5 border border-slate-300 dark:border-slate-700 text-center font-semibold">
                        {formatSeatPrintDigits(rowIdx + 1, docLang)}
                      </td>
                      <td className="p-1.5 border border-slate-300 dark:border-slate-700 text-center font-bold">
                        {labels.colWord}-{formatSeatPrintDigits(s.colIndex, docLang)} · {labels.benchWord}-{formatSeatPrintDigits(s.benchNo, docLang)} ({s.seatPosition})
                      </td>
                      <td className="p-1.5 border border-slate-300 dark:border-slate-700 text-center font-black">
                        {formatSeatPrintDigits(s.roll, docLang)}
                      </td>
                      <td className="p-1.5 border border-slate-300 dark:border-slate-700 font-bold">
                        {s.studentName}
                      </td>
                      <td className="p-1.5 border border-slate-300 dark:border-slate-700 text-center">
                        {formatSeatPrintGrade(s.grade, false, docLang)}
                        {grpText ? ` (${grpText})` : ''}
                      </td>
                      <td className="p-1.5 border border-slate-300 dark:border-slate-700 text-center font-bold">
                        {formatSeatPrintGender(g, docLang)}
                      </td>
                      <td className="p-1.5 border border-slate-300 dark:border-slate-700" />
                      <td className="p-1.5 border border-slate-300 dark:border-slate-700" />
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs font-bold text-slate-700 dark:text-slate-300 seat-avoid-break">
              <div>
                {labels.totalExaminees}: {formatSeatPrintDigits(rm.totalAssigned, docLang)}
              </div>
              <div>{labels.presentBlank}</div>
              <div>{labels.absentBlank}</div>
              <div className="text-right">{labels.invigilatorSign}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// 4. INVIGILATOR DUTY ROSTER (ছুটি-সম্মত পরিদর্শক ডিউটি রোস্টার)
// ───────────────────────────────────────────────────────────────────────────

export function InvigilatorDutyPrintView({
  duties,
  rooms,
  summariesByRoomId,
  settings,
  examTitle,
  dutyDate,
  setDutyDate,
  dutyShift,
  setDutyShift,
  teachersPerRoom,
  setTeachersPerRoom,
  onAutoAssign,
  docLang = 'bn',
}: {
  duties: InvigilatorDuty[];
  rooms: ExamHallRoom[];
  summariesByRoomId: Map<string, RoomDoorSummary>;
  settings: SchoolSettings | null;
  examTitle: string;
  dutyDate: string;
  setDutyDate: (v: string) => void;
  dutyShift: 'Morning' | 'Afternoon';
  setDutyShift: (v: 'Morning' | 'Afternoon') => void;
  teachersPerRoom: number;
  setTeachersPerRoom: (v: number) => void;
  onAutoAssign: () => void;
  docLang?: SeatPrintLang;
}) {
  const header = getSeatPlanInstitutionHeader(settings, docLang);
  const labels = getSeatPlanPrintLabels(docLang);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-4 print:border-0 print:rounded-none print:p-0">
      <InstitutionalPrintBanner
        settings={settings}
        examTitle={examTitle}
        docSubtitle={labels.dutySubtitle}
        docLang={docLang}
      />

      <div className="flex flex-wrap items-end justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800 print:hidden">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[11px] font-black text-slate-500 mb-1">পরীক্ষার তারিখ</label>
            <input
              type="date"
              value={dutyDate}
              onChange={(e) => setDutyDate(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-[11px] font-black text-slate-500 mb-1">শিফট</label>
            <select
              value={dutyShift}
              onChange={(e) => setDutyShift(e.target.value as 'Morning' | 'Afternoon')}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"
            >
              <option value="Morning">সকাল</option>
              <option value="Afternoon">বিকাল</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-black text-slate-500 mb-1">প্রতি কক্ষে পরিদর্শক</label>
            <select
              value={teachersPerRoom}
              onChange={(e) => setTeachersPerRoom(Number(e.target.value))}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"
            >
              <option value={1}>১ জন</option>
              <option value={2}>২ জন</option>
              <option value={3}>৩ জন</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={onAutoAssign}
          className="px-4 py-2.5 rounded-xl bg-[#0B5D3B] hover:bg-[#094a2f] text-white text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer transition"
        >
          <ShieldCheck className="w-4 h-4" /> ছুটি-সম্মত ডিউটি বণ্টন করুন ({toBanglaDigits(rooms.length)} কক্ষ)
        </button>
      </div>

      {duties.length === 0 ? (
        <div className="p-10 text-center text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
          এখনো কোনো পরিদর্শক ডিউটি রোস্টার তৈরি করা হয়নি। উপরের বাটনে ক্লিক করলে অনুমোদিত ছুটিতে থাকা শিক্ষকদের বাদ দিয়ে স্বয়ংক্রিয়ভাবে ডিউটি বণ্টন হবে।
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 print:bg-slate-100">
                <th className="p-2.5 border border-slate-300 dark:border-slate-700 text-center w-10">
                  {labels.colSl}
                </th>
                <th className="p-2.5 border border-slate-300 dark:border-slate-700 text-left">
                  {labels.colDateShift}
                </th>
                <th className="p-2.5 border border-slate-300 dark:border-slate-700 text-left">
                  {labels.colExamRoom}
                </th>
                <th className="p-2.5 border border-slate-300 dark:border-slate-700 text-center">
                  {labels.colExaminees}
                </th>
                <th className="p-2.5 border border-slate-300 dark:border-slate-700 text-left">
                  {labels.colInvigilators}
                </th>
                <th className="p-2.5 border border-slate-300 dark:border-slate-700 w-36 text-center">
                  {labels.colSignature}
                </th>
              </tr>
            </thead>
            <tbody>
              {duties.map((d, idx) => {
                const roomSum = summariesByRoomId.get(d.roomId);
                return (
                  <tr key={d.id} className="seat-avoid-break">
                    <td className="p-2.5 border border-slate-300 dark:border-slate-700 text-center font-bold">
                      {formatSeatPrintDigits(idx + 1, docLang)}
                    </td>
                    <td className="p-2.5 border border-slate-300 dark:border-slate-700 font-bold">
                      {formatSeatPrintDigits(d.date, docLang)} (
                      {d.shift === 'Morning' ? labels.shiftMorning : labels.shiftAfternoon})
                    </td>
                    <td className="p-2.5 border border-slate-300 dark:border-slate-700 font-black">
                      {d.roomName} ({labels.roomNoPrefix} {formatSeatPrintDigits(d.roomNo, docLang)})
                    </td>
                    <td className="p-2.5 border border-slate-300 dark:border-slate-700 text-center font-bold">
                      {roomSum
                        ? `${formatSeatPrintDigits(roomSum.totalAssigned, docLang)} (${labels.boys}: ${formatSeatPrintDigits(roomSum.boys, docLang)}, ${labels.girls}: ${formatSeatPrintDigits(roomSum.girls, docLang)})`
                        : '—'}
                    </td>
                    <td className="p-2.5 border border-slate-300 dark:border-slate-700 font-black text-[#0B5D3B] dark:text-emerald-300">
                      {d.teacherNames.join(', ')}
                    </td>
                    <td className="p-2.5 border border-slate-300 dark:border-slate-700" />
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="hidden print:grid grid-cols-2 gap-8 pt-10 text-xs font-bold text-slate-800 seat-avoid-break">
            <div>
              <div className="w-44 border-t border-slate-700 pt-1">{labels.controllerSign}</div>
            </div>
            <div className="text-right">
              <div className="w-48 ml-auto border-t border-slate-700 pt-1 text-center">
                {header.principalTitle}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
