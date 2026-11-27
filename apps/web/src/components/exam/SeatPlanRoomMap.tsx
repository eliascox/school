'use client';

import React from 'react';
import { ArrowLeftRight, Building2, CheckCircle2, Users } from 'lucide-react';
import type { ExamHallRoom, SeatPlanEntry } from '@/services/examSeatPlanService';
import type { SchoolSettings } from '@/services/settingsService';
import {
  type ColumnGenderRule,
  type NormalizedGender,
  type RoomDoorSummary,
  formatGenderRuleBn,
  formatSeatGradeShort,
  getBenchesForColumn,
  getRoomColumnGenders,
  normalizeSeatGradeKey,
  toAsciiDigits,
  toBanglaDigits,
} from '@/lib/seatPlanUtils';
import {
  type SeatPrintLang,
  formatSeatPrintExam,
  getSeatPlanInstitutionHeader,
} from '@/lib/seatPlanPrintUtils';

const GRADE_CARD_STYLES: Record<string, string> = {
  '6th': 'bg-sky-50/90 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800/70 text-sky-950 dark:text-sky-100',
  '7th': 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/70 text-emerald-950 dark:text-emerald-100',
  '8th': 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/70 text-amber-950 dark:text-amber-100',
  '9th': 'bg-violet-50/90 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800/70 text-violet-950 dark:text-violet-100',
  '10th': 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/70 text-rose-950 dark:text-rose-100',
  other: 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100',
};

const GRADE_PILL_STYLES: Record<string, string> = {
  '6th': 'bg-sky-100 text-sky-800 dark:bg-sky-900/70 dark:text-sky-200',
  '7th': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/70 dark:text-emerald-200',
  '8th': 'bg-amber-100 text-amber-800 dark:bg-amber-900/70 dark:text-amber-200',
  '9th': 'bg-violet-100 text-violet-800 dark:bg-violet-900/70 dark:text-violet-200',
  '10th': 'bg-rose-100 text-rose-800 dark:bg-rose-900/70 dark:text-rose-200',
  other: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
};

const COL_HEADER_STYLES: Record<ColumnGenderRule, string> = {
  male: 'bg-sky-50 dark:bg-sky-950/50 border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-200',
  female: 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200',
  any: 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200',
};

const POS_LABEL_BN: Record<'L' | 'M' | 'R', string> = {
  L: 'বাম',
  M: 'মাঝ',
  R: 'ডান',
};

export interface SeatPlanRoomMapProps {
  summaries: RoomDoorSummary[];
  entriesByRoom: Map<string, SeatPlanEntry[]>;
  roomsById: Map<string, ExamHallRoom>;
  studentGenderById: Map<string, NormalizedGender>;
  globalColumnGenders: ColumnGenderRule[];
  settings: SchoolSettings | null;
  examTitle: string;
  searchQuery: string;
  swapMode: boolean;
  selectedSwapSeatId: string | null;
  onSeatClick: (seat: SeatPlanEntry) => void;
}

export function InstitutionalPrintBanner({
  settings,
  examTitle,
  docSubtitle,
  compact = false,
  docLang = 'bn',
}: {
  settings: SchoolSettings | null;
  examTitle: string;
  docSubtitle: string;
  compact?: boolean;
  docLang?: SeatPrintLang;
}) {
  const header = getSeatPlanInstitutionHeader(settings, docLang);
  const formattedExam = formatSeatPrintExam(examTitle, docLang);
  return (
    <div
      className={`hidden print:flex items-center justify-between gap-3 border-b-2 border-slate-900 ${
        compact ? 'pb-1.5 mb-2' : 'pb-2 mb-3'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {settings?.schoolLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={settings.schoolLogo}
            alt="Logo"
            className={`${compact ? 'w-9 h-9' : 'w-11 h-11'} object-contain shrink-0`}
          />
        ) : null}
        <div className="min-w-0">
          <div className={`${compact ? 'text-sm' : 'text-base'} font-black text-slate-950 leading-tight`}>
            {header.schoolName}
          </div>
          <div className="text-[10px] font-semibold text-slate-600 leading-snug">
            {[header.address, header.eiinText].filter(Boolean).join(' • ')}
          </div>
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-xs font-black text-slate-950">{formattedExam}</div>
        <div className="text-[10px] font-bold text-emerald-900">{docSubtitle}</div>
      </div>
    </div>
  );
}

export function SeatPlanRoomMap({
  summaries,
  entriesByRoom,
  roomsById,
  studentGenderById,
  globalColumnGenders,
  settings,
  examTitle,
  searchQuery,
  swapMode,
  selectedSwapSeatId,
  onSeatClick,
}: SeatPlanRoomMapProps) {
  const normalizedQuery = toAsciiDigits(searchQuery).toLowerCase().trim();

  const matchesSearch = (entry: SeatPlanEntry): boolean => {
    if (!normalizedQuery) return false;
    const rollAscii = toAsciiDigits(entry.roll).toLowerCase();
    const nameLower = (entry.studentName || '').toLowerCase();
    return rollAscii === normalizedQuery || rollAscii.includes(normalizedQuery) || nameLower.includes(normalizedQuery);
  };

  return (
    <div className="space-y-5 print:space-y-0">
      {summaries.map((summary, roomIdx) => {
        const roomEntries = entriesByRoom.get(summary.roomId) || [];
        const roomMeta = roomsById.get(summary.roomId);
        const cols = summary.cols;
        const seatsPerBench = summary.seatsPerBench;
        const positions: Array<'L' | 'M' | 'R'> =
          seatsPerBench === 1 ? ['L'] : seatsPerBench === 2 ? ['L', 'R'] : ['L', 'M', 'R'];
        const colRules = roomMeta
          ? getRoomColumnGenders(roomMeta, globalColumnGenders)
          : summary.columnSummary.map((c) => c.rule);

        // Index seats by colIndex -> rowIndex -> position
        const seatLookup = new Map<string, SeatPlanEntry>();
        const benchNoLookup = new Map<string, number>();
        roomEntries.forEach((e) => {
          seatLookup.set(`${e.colIndex}:${e.rowIndex}:${e.seatPosition}`, e);
          benchNoLookup.set(`${e.colIndex}:${e.rowIndex}`, e.benchNo);
        });

        const isLast = roomIdx === summaries.length - 1;

        return (
          <div
            key={summary.roomId}
            className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-4 sm:p-5 space-y-3.5 print:shadow-none print:border-0 print:rounded-none print:p-0 ${
              isLast ? 'seat-print-last' : 'seat-print-break'
            }`}
          >
            {/* Institutional Print Banner on EVERY printed room page (uses <div>, never <header>) */}
            <InstitutionalPrintBanner
              settings={settings}
              examTitle={examTitle}
              docSubtitle={`কক্ষভিত্তিক আসন বিন্যাস (হল ম্যাপ) — কক্ষ নং ${summary.roomNo}`}
              compact
            />

            {/* Room Top Meta Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-slate-200 dark:border-slate-800 print:pb-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#0B5D3B]/10 dark:bg-emerald-500/15 text-[#0B5D3B] dark:text-emerald-300 font-black text-sm flex items-center justify-center shrink-0 border border-[#0B5D3B]/20 print:w-8 print:h-8 print:text-xs">
                  {summary.roomNo}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                      {summary.roomName}
                    </h3>
                    {summary.building && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                        <Building2 className="w-3 h-3" /> {summary.building}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    {summary.classRanges.map((cr) => (
                      <span
                        key={cr.classKey}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-200 print:border print:border-slate-300"
                      >
                        <span>{cr.shortBadge}:</span>
                        <span className="font-black text-slate-900 dark:text-white">
                          রোল {cr.rollRangeLabel}
                        </span>
                        <span className="text-slate-500">({toBanglaDigits(cr.count)})</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-black">
                <span className="px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-200 border border-sky-200 dark:border-sky-800">
                  ছাত্র: {toBanglaDigits(summary.boys)}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800">
                  ছাত্রী: {toBanglaDigits(summary.girls)}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-[#0B5D3B]/10 dark:bg-emerald-950/60 text-[#0B5D3B] dark:text-emerald-200 border border-[#0B5D3B]/20">
                  মোট: {toBanglaDigits(summary.totalAssigned)} / {toBanglaDigits(summary.capacity)}
                </span>
              </div>
            </div>

            {/* Blackboard / Front Desk Direction Strip */}
            <div className="flex items-center justify-center">
              <div className="w-full max-w-md py-1.5 px-4 rounded-xl bg-slate-800 dark:bg-slate-800 text-white text-center text-[11px] font-black tracking-wide shadow-2xs print:bg-slate-100 print:text-slate-900 print:border print:border-slate-500">
                ব্ল্যাকবোর্ড / পরিদর্শকের টেবিল (সামনের দিক)
              </div>
            </div>

            {swapMode && (
              <div className="print:hidden flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-bold">
                <span className="flex items-center gap-1.5">
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  {selectedSwapSeatId
                    ? '১ম আসন নির্বাচিত হয়েছে — এখন ২য় আসনে ক্লিক করে অদল-বদল করুন।'
                    : 'আসন অদল-বদল মোড চালু আছে — যেকোনো দুটি আসনে ক্লিক করুন।'}
                </span>
              </div>
            )}

            {/* Physical Classroom Column Grid */}
            <div
              className="grid gap-3 print:gap-2"
              style={{
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              }}
            >
              {Array.from({ length: cols }, (_, cZero) => {
                const colNum = cZero + 1;
                const colMeta = summary.columnSummary[cZero];
                const colRule = colRules[cZero] || colMeta?.rule || 'any';
                const benchesInCol = roomMeta
                  ? getBenchesForColumn(roomMeta, cZero)
                  : summary.rows;

                // Determine running bench number fallback if column empty
                let colBenchOffset = 0;
                for (let prev = 0; prev < cZero; prev++) {
                  colBenchOffset += roomMeta
                    ? getBenchesForColumn(roomMeta, prev)
                    : summary.rows;
                }

                return (
                  <div
                    key={colNum}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 p-2.5 space-y-2 print:p-1.5 print:space-y-1.5 print:border-slate-400"
                  >
                    {/* Column Header Pill */}
                    <div
                      className={`px-2.5 py-1.5 rounded-lg border text-xs font-black flex items-center justify-between gap-1 print:py-1 print:text-[10px] ${
                        COL_HEADER_STYLES[colRule]
                      }`}
                    >
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 shrink-0 print:hidden" />
                        সারি {toBanglaDigits(colNum)} · {formatGenderRuleBn(colRule)}
                      </span>
                      <span className="text-[10px] font-bold opacity-85">
                        {toBanglaDigits(colMeta?.total || 0)}/{toBanglaDigits(colMeta?.capacity || benchesInCol * seatsPerBench)}
                      </span>
                    </div>

                    {/* Benches from Front (1) to Back (N) */}
                    <div className="space-y-2 print:space-y-1.5">
                      {Array.from({ length: benchesInCol }, (_, rZero) => {
                        const rowNum = rZero + 1;
                        const benchNo =
                          benchNoLookup.get(`${colNum}:${rowNum}`) ||
                          colBenchOffset + rowNum;

                        return (
                          <div
                            key={rowNum}
                            className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 space-y-1.5 seat-avoid-break print:p-1 print:space-y-1 print:border-slate-400"
                          >
                            <div className="flex items-center justify-between text-[10px] font-black text-slate-400 dark:text-slate-500 px-0.5 print:text-slate-600 print:text-[9px]">
                              <span>বেঞ্চ #{toBanglaDigits(benchNo)}</span>
                              <span>ধাপ {toBanglaDigits(rowNum)}</span>
                            </div>

                            <div
                              className="grid gap-1.5 print:gap-1"
                              style={{
                                gridTemplateColumns: `repeat(${positions.length}, minmax(0, 1fr))`,
                              }}
                            >
                              {positions.map((pos) => {
                                const seat = seatLookup.get(`${colNum}:${rowNum}:${pos}`);
                                if (!seat) {
                                  return (
                                    <div
                                      key={pos}
                                      className="rounded-lg border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 px-2 py-2.5 text-center text-[10px] font-bold text-slate-400 dark:text-slate-600 print:py-1.5 print:border-slate-300"
                                    >
                                      {POS_LABEL_BN[pos]} · খালি
                                    </div>
                                  );
                                }

                                const gradeKey = normalizeSeatGradeKey(seat.grade);
                                const gender =
                                  seat.gender || studentGenderById.get(seat.studentId) || 'other';
                                const isMatch = matchesSearch(seat);
                                const isSwapSelected = selectedSwapSeatId === seat.id;

                                return (
                                  <button
                                    key={seat.id}
                                    type="button"
                                    onClick={() => onSeatClick(seat)}
                                    className={`text-left rounded-lg border p-1.5 transition-all print:p-1 ${
                                      GRADE_CARD_STYLES[gradeKey]
                                    } ${
                                      swapMode
                                        ? 'cursor-pointer hover:ring-2 hover:ring-[#0B5D3B]'
                                        : 'cursor-default'
                                    } ${
                                      isSwapSelected
                                        ? 'ring-2 ring-amber-500 scale-[1.02] shadow-md'
                                        : isMatch
                                        ? 'ring-2 ring-[#0B5D3B] shadow-sm'
                                        : ''
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="text-[11px] font-black leading-none print:text-[10px]">
                                        রোল {toBanglaDigits(seat.roll)}
                                      </span>
                                      <span className="flex items-center gap-0.5 text-[9px] font-bold opacity-80">
                                        {isSwapSelected && (
                                          <CheckCircle2 className="w-3 h-3 text-amber-600 print:hidden" />
                                        )}
                                        <span
                                          className={`px-1 rounded ${
                                            gender === 'male'
                                              ? 'bg-sky-200/70 text-sky-900 dark:bg-sky-900/70 dark:text-sky-100'
                                              : gender === 'female'
                                              ? 'bg-rose-200/70 text-rose-900 dark:bg-rose-900/70 dark:text-rose-100'
                                              : 'bg-slate-200/70 text-slate-800'
                                          } print:border print:border-slate-400`}
                                        >
                                          {gender === 'male'
                                            ? 'ছাত্র'
                                            : gender === 'female'
                                            ? 'ছাত্রী'
                                            : POS_LABEL_BN[pos]}
                                        </span>
                                      </span>
                                    </div>
                                    <div className="text-[10.5px] font-bold truncate mt-1 print:text-[9.5px] print:whitespace-normal print:leading-tight">
                                      {seat.studentName}
                                    </div>
                                    <div className="flex items-center justify-between gap-1 mt-1">
                                      <span
                                        className={`px-1.5 py-0.5 rounded text-[9px] font-black leading-none truncate ${
                                          GRADE_PILL_STYLES[gradeKey]
                                        } print:border print:border-slate-300`}
                                      >
                                        {formatSeatGradeShort(seat.grade)}
                                        {(gradeKey === '9th' || gradeKey === '10th') && seat.group
                                          ? ` · ${seat.group}`
                                          : ''}
                                      </span>
                                      <span className="text-[8.5px] font-bold opacity-65">
                                        {POS_LABEL_BN[pos]}
                                      </span>
                                    </div>
                                  </button>
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

            {/* Print-only Institutional Signatures */}
            <div className="hidden print:grid grid-cols-2 gap-8 pt-6 text-[11px] font-bold text-slate-800">
              <div>
                <div className="w-44 border-t border-slate-700 pt-1">
                  আহ্বায়ক, পরীক্ষা পরিচালনা কমিটি
                </div>
              </div>
              <div className="text-right">
                <div className="w-48 ml-auto border-t border-slate-700 pt-1 text-center">
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
