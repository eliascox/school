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
  formatGenderRuleBn,
  formatSeatGradeFull,
  formatSeatGradeShort,
  normalizeSeatGradeKey,
  toBanglaDigits,
} from '@/lib/seatPlanUtils';
import { InstitutionalPrintBanner } from './SeatPlanRoomMap';

// ───────────────────────────────────────────────────────────────────────────
// 1. DOOR NOTICE SHEET (কক্ষের দরজার আসন নোটিশ)
// ───────────────────────────────────────────────────────────────────────────

export function DoorNoticePrintView({
  summaries,
  settings,
  examTitle,
  cardsPerPage,
}: {
  summaries: RoomDoorSummary[];
  settings: SchoolSettings | null;
  examTitle: string;
  cardsPerPage: 1 | 2;
}) {
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
        const shouldPageBreak =
          !isLast && (cardsPerPage === 1 || idx % 2 === 1);

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
                    {settings?.schoolName || 'স্মার্ট স্কুল অ্যান্ড কলেজ'}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    {[settings?.address, settings?.eiin ? `EIIN: ${settings.eiin}` : '']
                      .filter(Boolean)
                      .join(' • ')}
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs font-black text-[#0B5D3B] dark:text-emerald-400">
                  {examTitle}
                </div>
                <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  পরীক্ষা কক্ষের আসন নির্দেশিকা
                </div>
              </div>
            </div>

            {/* Big Room Banner */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-200 dark:border-slate-800 print:bg-slate-50 print:border-slate-400">
              <div>
                <div className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                  পরীক্ষা কক্ষ
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  কক্ষ নং {rm.roomNo}
                </div>
                <div className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  {rm.roomName}
                  {rm.building ? ` • ${rm.building}` : ''}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 print:border-slate-400">
                  <div className="text-[10px] font-bold text-slate-500">মোট পরীক্ষার্থী</div>
                  <div className="text-lg font-black text-slate-900 dark:text-white">
                    {toBanglaDigits(rm.totalAssigned)}
                  </div>
                </div>
                <div className="px-3 py-2 rounded-xl bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 print:border-slate-400">
                  <div className="text-[10px] font-bold text-sky-700 dark:text-sky-300">ছাত্র</div>
                  <div className="text-lg font-black text-sky-900 dark:text-sky-100">
                    {toBanglaDigits(rm.boys)}
                  </div>
                </div>
                <div className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 print:border-slate-400">
                  <div className="text-[10px] font-bold text-rose-700 dark:text-rose-300">ছাত্রী</div>
                  <div className="text-lg font-black text-rose-900 dark:text-rose-100">
                    {toBanglaDigits(rm.girls)}
                  </div>
                </div>
              </div>
            </div>

            {/* Class & Roll Range Table */}
            <table className="w-full text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 print:bg-slate-100">
                  <th className="p-2.5 border border-slate-300 dark:border-slate-700 text-left font-black">
                    শ্রেণি ও বিভাগ
                  </th>
                  <th className="p-2.5 border border-slate-300 dark:border-slate-700 text-left font-black">
                    রোল নম্বর (হতে – পর্যন্ত)
                  </th>
                  <th className="p-2.5 border border-slate-300 dark:border-slate-700 text-center font-black w-16">
                    ছাত্র
                  </th>
                  <th className="p-2.5 border border-slate-300 dark:border-slate-700 text-center font-black w-16">
                    ছাত্রী
                  </th>
                  <th className="p-2.5 border border-slate-300 dark:border-slate-700 text-center font-black w-16">
                    মোট
                  </th>
                </tr>
              </thead>
              <tbody>
                {rm.classRanges.map((cr) => (
                  <tr key={cr.classKey}>
                    <td className="p-2.5 border border-slate-300 dark:border-slate-700 font-black text-slate-900 dark:text-white">
                      {cr.gradeLabel}
                      {cr.groupLabel && cr.groupLabel !== 'সাধারণ'
                        ? ` (${cr.groupLabel})`
                        : ''}
                    </td>
                    <td className="p-2.5 border border-slate-300 dark:border-slate-700 font-black text-[#0B5D3B] dark:text-emerald-400">
                      {cr.rollRangeLabel}
                    </td>
                    <td className="p-2.5 border border-slate-300 dark:border-slate-700 text-center font-bold">
                      {toBanglaDigits(cr.boys)}
                    </td>
                    <td className="p-2.5 border border-slate-300 dark:border-slate-700 text-center font-bold">
                      {toBanglaDigits(cr.girls)}
                    </td>
                    <td className="p-2.5 border border-slate-300 dark:border-slate-700 text-center font-black">
                      {toBanglaDigits(cr.count)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Column Seating Guide Strip */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-black text-slate-600 dark:text-slate-300">
                সারিভিত্তিক বসার বিন্যাস ({toBanglaDigits(rm.cols)} সারি × প্রতি বেঞ্চে {toBanglaDigits(rm.seatsPerBench)} জন):
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
                      সারি {toBanglaDigits(col.colIndex)} — {formatGenderRuleBn(col.rule)}
                    </div>
                    <div className="text-[11px] font-bold opacity-80">
                      {toBanglaDigits(col.benches)} বেঞ্চ • {toBanglaDigits(col.total)} জন
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Signature Line */}
            <div className="grid grid-cols-2 gap-6 pt-5 text-xs font-bold text-slate-700 dark:text-slate-300">
              <div>
                <div className="w-40 border-t border-slate-400 dark:border-slate-600 pt-1">
                  পরীক্ষা নিয়ন্ত্রক
                </div>
              </div>
              <div className="text-right">
                <div className="w-44 ml-auto border-t border-slate-400 dark:border-slate-600 pt-1 text-center">
                  {settings?.principalTitle || 'প্রধান শিক্ষক / অধ্যক্ষ'}
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
// 2. BENCH / DESK STICKERS (কাটিং-রেডি বেঞ্চ ও আসন স্টিকার)
// ───────────────────────────────────────────────────────────────────────────

export function BenchStickersPrintView({
  summaries,
  entriesByRoom,
  studentGenderById,
  settings,
  examTitle,
  stickerMode,
  columnsPerRow,
}: {
  summaries: RoomDoorSummary[];
  entriesByRoom: Map<string, SeatPlanEntry[]>;
  studentGenderById: Map<string, NormalizedGender>;
  settings: SchoolSettings | null;
  examTitle: string;
  stickerMode: 'per_bench' | 'per_seat';
  columnsPerRow: 2 | 3;
}) {
  const gridColsClass =
    columnsPerRow === 2
      ? 'grid-cols-1 sm:grid-cols-2 print:grid-cols-2'
      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-3';

  if (stickerMode === 'per_seat') {
    const allEntries = summaries.flatMap((s) => entriesByRoom.get(s.roomId) || []);
    return (
      <div className="space-y-3">
        <InstitutionalPrintBanner
          settings={settings}
          examTitle={examTitle}
          docSubtitle="ব্যক্তিগত আসন স্টিকার (Desk Seat Labels)"
          compact
        />
        <div className={`grid ${gridColsClass} gap-3 print:gap-2`}>
          {allEntries.map((s) => {
            const g = s.gender || studentGenderById.get(s.studentId) || 'other';
            const gradeKey = normalizeSeatGradeKey(s.grade);
            return (
              <div
                key={s.id}
                className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-3 space-y-1.5 seat-avoid-break print:border-slate-600 print:p-2.5"
              >
                <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-1">
                  <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 truncate">
                    {settings?.schoolName || 'স্মার্ট স্কুল'}
                  </span>
                  <span className="text-[10px] font-black text-[#0B5D3B] dark:text-emerald-400 shrink-0">
                    কক্ষ {s.roomNo}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-[10px] font-bold text-slate-500">
                      সারি {toBanglaDigits(s.colIndex)} • বেঞ্চ #{toBanglaDigits(s.benchNo)} ({s.seatPosition})
                    </div>
                    <div className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                      রোল: {toBanglaDigits(s.roll)}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-800 dark:text-slate-200 print:border print:border-slate-400">
                      {formatSeatGradeShort(s.grade)}
                      {(gradeKey === '9th' || gradeKey === '10th') && s.group
                        ? ` (${s.group})`
                        : ''}
                    </span>
                    <div className="text-[10px] font-bold text-slate-500 mt-0.5">
                      {formatGenderRuleBn(g)}
                    </div>
                  </div>
                </div>
                <div className="text-xs font-black text-slate-800 dark:text-slate-200 truncate">
                  {s.studentName}
                </div>
                <div className="text-[9.5px] font-semibold text-slate-400 truncate">
                  {examTitle}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Per-Bench Stickers (L + R combined on one cut-out card)
  return (
    <div className="space-y-3">
      <InstitutionalPrintBanner
        settings={settings}
        examTitle={examTitle}
        docSubtitle="বেঞ্চভিত্তিক আসন স্টিকার (Bench Labels)"
        compact
      />
      <div className={`grid ${gridColsClass} gap-3 print:gap-2`}>
        {summaries.flatMap((rm) => {
          const roomEntries = entriesByRoom.get(rm.roomId) || [];
          const benchesMap = new Map<number, SeatPlanEntry[]>();
          roomEntries.forEach((e) => {
            if (!benchesMap.has(e.benchNo)) benchesMap.set(e.benchNo, []);
            benchesMap.get(e.benchNo)!.push(e);
          });

          return Array.from(benchesMap.entries()).map(([benchNo, seats]) => {
            const first = seats[0];
            return (
              <div
                key={`${rm.roomId}-${benchNo}`}
                className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-3 space-y-2 seat-avoid-break print:border-slate-600 print:p-2.5"
              >
                <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-1.5">
                  <span className="text-xs font-black text-[#0B5D3B] dark:text-emerald-400">
                    কক্ষ {first?.roomNo} • সারি {toBanglaDigits(first?.colIndex)} • বেঞ্চ #{toBanglaDigits(benchNo)}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 truncate max-w-[110px]">
                    {examTitle}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {seats.map((s) => {
                    const g = s.gender || studentGenderById.get(s.studentId) || 'other';
                    return (
                      <div
                        key={s.id}
                        className="flex items-center justify-between gap-2 text-xs bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-200/80 dark:border-slate-800 print:border-slate-400"
                      >
                        <div className="min-w-0">
                          <span className="font-black text-slate-900 dark:text-white">
                            [{s.seatPosition}] রোল {toBanglaDigits(s.roll)}
                          </span>
                          <span className="ml-1.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                            ({formatSeatGradeShort(s.grade)} · {formatGenderRuleBn(g)})
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate max-w-[125px]">
                          {s.studentName}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          });
        })}
      </div>
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
}: {
  summaries: RoomDoorSummary[];
  entriesByRoom: Map<string, SeatPlanEntry[]>;
  studentGenderById: Map<string, NormalizedGender>;
  settings: SchoolSettings | null;
  examTitle: string;
}) {
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
              docSubtitle={`পরীক্ষার্থীদের হাজিরা ও স্বাক্ষরপত্র — কক্ষ নং ${rm.roomNo}`}
              compact
            />

            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  {rm.roomName} (কক্ষ নং {rm.roomNo})
                </h3>
                <p className="text-[11px] font-semibold text-slate-500">
                  তারিখ: __________________ • বিষয়: ________________________ • শিফট: সকাল / বিকাল
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-black">
                <span className="px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-200">
                  ছাত্র: {toBanglaDigits(rm.boys)}
                </span>
                <span className="px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200">
                  ছাত্রী: {toBanglaDigits(rm.girls)}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                  মোট: {toBanglaDigits(rm.totalAssigned)} জন
                </span>
              </div>
            </div>

            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 print:bg-slate-100">
                  <th className="p-1.5 border border-slate-300 dark:border-slate-700 w-10 text-center">ক্র.</th>
                  <th className="p-1.5 border border-slate-300 dark:border-slate-700 w-24 text-center">সারি ও বেঞ্চ</th>
                  <th className="p-1.5 border border-slate-300 dark:border-slate-700 w-16 text-center">রোল</th>
                  <th className="p-1.5 border border-slate-300 dark:border-slate-700 text-left">পরীক্ষার্থীর নাম</th>
                  <th className="p-1.5 border border-slate-300 dark:border-slate-700 w-28 text-center">শ্রেণি ও বিভাগ</th>
                  <th className="p-1.5 border border-slate-300 dark:border-slate-700 w-14 text-center">লিঙ্গ</th>
                  <th className="p-1.5 border border-slate-300 dark:border-slate-700 w-28 text-center">খাতার ক্রমিক</th>
                  <th className="p-1.5 border border-slate-300 dark:border-slate-700 w-28 text-center">স্বাক্ষর</th>
                </tr>
              </thead>
              <tbody>
                {roomEntries.map((s, rowIdx) => {
                  const g = s.gender || studentGenderById.get(s.studentId) || 'other';
                  return (
                    <tr key={s.id} className="seat-avoid-break">
                      <td className="p-1.5 border border-slate-300 dark:border-slate-700 text-center font-semibold">
                        {toBanglaDigits(rowIdx + 1)}
                      </td>
                      <td className="p-1.5 border border-slate-300 dark:border-slate-700 text-center font-bold">
                        সা-{toBanglaDigits(s.colIndex)} · বে-{toBanglaDigits(s.benchNo)} ({s.seatPosition})
                      </td>
                      <td className="p-1.5 border border-slate-300 dark:border-slate-700 text-center font-black">
                        {toBanglaDigits(s.roll)}
                      </td>
                      <td className="p-1.5 border border-slate-300 dark:border-slate-700 font-bold">
                        {s.studentName}
                      </td>
                      <td className="p-1.5 border border-slate-300 dark:border-slate-700 text-center">
                        {formatSeatGradeFull(s.grade)}
                        {s.group && s.group !== 'সাধারণ' ? ` (${s.group})` : ''}
                      </td>
                      <td className="p-1.5 border border-slate-300 dark:border-slate-700 text-center font-bold">
                        {formatGenderRuleBn(g)}
                      </td>
                      <td className="p-1.5 border border-slate-300 dark:border-slate-700" />
                      <td className="p-1.5 border border-slate-300 dark:border-slate-700" />
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs font-bold text-slate-700 dark:text-slate-300">
              <div>মোট পরীক্ষার্থী: {toBanglaDigits(rm.totalAssigned)} জন</div>
              <div>উপস্থিত: _________ জন</div>
              <div>অনুপস্থিত: _________ জন</div>
              <div className="text-right">পরিদর্শকের স্বাক্ষর: _______________</div>
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
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-4 print:border-0 print:rounded-none print:p-0">
      <InstitutionalPrintBanner
        settings={settings}
        examTitle={examTitle}
        docSubtitle="পরিদর্শক (Invigilator) ডিউটি রোস্টার"
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
              <option value="Morning">সকাল (Morning)</option>
              <option value="Afternoon">বিকাল (Afternoon)</option>
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
                <th className="p-2.5 border border-slate-300 dark:border-slate-700 text-center w-10">ক্র.</th>
                <th className="p-2.5 border border-slate-300 dark:border-slate-700 text-left">তারিখ ও শিফট</th>
                <th className="p-2.5 border border-slate-300 dark:border-slate-700 text-left">পরীক্ষা কক্ষ</th>
                <th className="p-2.5 border border-slate-300 dark:border-slate-700 text-center">পরীক্ষার্থী</th>
                <th className="p-2.5 border border-slate-300 dark:border-slate-700 text-left">দায়িত্বপ্রাপ্ত পরিদর্শকবৃন্দ</th>
                <th className="p-2.5 border border-slate-300 dark:border-slate-700 w-36 text-center">স্বাক্ষর</th>
              </tr>
            </thead>
            <tbody>
              {duties.map((d, idx) => {
                const roomSum = summariesByRoomId.get(d.roomId);
                return (
                  <tr key={d.id}>
                    <td className="p-2.5 border border-slate-300 dark:border-slate-700 text-center font-bold">
                      {toBanglaDigits(idx + 1)}
                    </td>
                    <td className="p-2.5 border border-slate-300 dark:border-slate-700 font-bold">
                      {d.date} ({d.shift === 'Morning' ? 'সকাল' : 'বিকাল'})
                    </td>
                    <td className="p-2.5 border border-slate-300 dark:border-slate-700 font-black">
                      {d.roomName} (কক্ষ {d.roomNo})
                    </td>
                    <td className="p-2.5 border border-slate-300 dark:border-slate-700 text-center font-bold">
                      {roomSum
                        ? `${toBanglaDigits(roomSum.totalAssigned)} (ছা: ${toBanglaDigits(roomSum.boys)}, ছাত্রী: ${toBanglaDigits(roomSum.girls)})`
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

          <div className="hidden print:grid grid-cols-2 gap-8 pt-10 text-xs font-bold text-slate-800">
            <div>
              <div className="w-44 border-t border-slate-700 pt-1">পরীক্ষা নিয়ন্ত্রক</div>
            </div>
            <div className="text-right">
              <div className="w-48 ml-auto border-t border-slate-700 pt-1 text-center">
                {settings?.principalTitle || 'প্রধান শিক্ষক / অধ্যক্ষ'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
