'use client';

import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  Plus,
  Printer,
  Search,
  X,
} from 'lucide-react';
import {
  RoutineConflict,
  RoutineDayConfig,
  RoutineDayKey,
  RoutinePeriod,
  RoutineSlot,
} from '@/services/routineService';
import { ClassOption, formatClassIdBn, toBanglaDigits } from './routineHelpers';
import type { EditingSlotContext } from './SlotEditorModal';

interface MasterRoutineGridTabProps {
  days: RoutineDayConfig[];
  periods: RoutinePeriod[];
  classOptions: ClassOption[];
  routines: RoutineSlot[];
  conflictMap: Map<string, RoutineConflict[]>;
  selectedMasterDay: RoutineDayKey;
  setSelectedMasterDay: (day: RoutineDayKey) => void;
  onEditCell: (ctx: EditingSlotContext) => void;
  onPrintMasterDay: () => void;
  onPrintMasterWeek: () => void;
}

export default function MasterRoutineGridTab({
  days,
  periods,
  classOptions,
  routines,
  conflictMap,
  selectedMasterDay,
  setSelectedMasterDay,
  onEditCell,
  onPrintMasterDay,
  onPrintMasterWeek,
}: MasterRoutineGridTabProps) {
  const [scopeMode, setScopeMode] = useState<'day' | 'week'>('day');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const visibleClasses = useMemo(() => {
    if (gradeFilter === 'all') return classOptions;
    return classOptions.filter((c) => c.grade === gradeFilter);
  }, [classOptions, gradeFilter]);

  const activeDayObj = useMemo(
    () => days.find((d) => d.key === selectedMasterDay) || days[0],
    [days, selectedMasterDay]
  );

  const daysToRender = useMemo(() => {
    if (scopeMode === 'week') return days;
    return activeDayObj ? [activeDayObj] : [];
  }, [scopeMode, days, activeDayObj]);

  const slotLookup = useMemo(() => {
    const map = new Map<string, RoutineSlot>();
    for (const r of routines) {
      map.set(`${r.classId}|${r.day}|${r.periodNo}`, r);
    }
    return map;
  }, [routines]);

  const queryLower = searchQuery.trim().toLowerCase();

  const visibleConflictsCount = useMemo(() => {
    const daySet = new Set(daysToRender.map((d) => d.key));
    let count = 0;
    for (const r of routines) {
      if (daySet.has(r.day) && conflictMap.has(r.id)) {
        count++;
      }
    }
    return count;
  }, [routines, daysToRender, conflictMap]);

  return (
    <div className="space-y-4">
      {/* Compact Master Controls Strip */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Scope & Day Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/70 dark:border-slate-700/70">
              <button
                type="button"
                onClick={() => setScopeMode('day')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  scopeMode === 'day'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                একক বার
              </button>
              <button
                type="button"
                onClick={() => setScopeMode('week')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  scopeMode === 'week'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                পুরো সপ্তাহ ({toBanglaDigits(days.length)} দিন)
              </button>
            </div>

            {scopeMode === 'day' && (
              <div className="flex items-center gap-1 overflow-x-auto max-w-full">
                {days.map((d) => {
                  const active = activeDayObj?.key === d.key;
                  return (
                    <button
                      key={d.key}
                      type="button"
                      onClick={() => setSelectedMasterDay(d.key)}
                      className={`h-8 px-2.5 rounded-lg text-xs font-bold border transition cursor-pointer whitespace-nowrap ${
                        active
                          ? 'bg-[#0B5D3B] text-white border-[#0B5D3B]'
                          : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {d.labelBn}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Quick Status + Print */}
          <div className="flex flex-wrap items-center gap-2">
            {visibleConflictsCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/70 text-[11px] font-extrabold">
                <AlertTriangle size={12} /> কনফ্লিক্ট: {toBanglaDigits(visibleConflictsCount)}টি
              </span>
            )}
            <button
              type="button"
              onClick={scopeMode === 'day' ? onPrintMasterDay : onPrintMasterWeek}
              className="h-8 px-3 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition"
            >
              <Printer size={13} />
              {scopeMode === 'day' ? 'এই বারের মাস্টার প্রিন্ট' : 'সপ্তাহের মাস্টার প্রিন্ট'}
            </button>
          </div>
        </div>

        {/* Grade Filter Pills + Cell Search */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'সকল শ্রেণি' },
              { id: '6th', label: '৬ষ্ঠ' },
              { id: '7th', label: '৭ম' },
              { id: '8th', label: '৮ম' },
              { id: '9th', label: '৯ম' },
              { id: '10th', label: '১০ম' },
            ].map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setGradeFilter(g.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                  gradeFilter === g.id
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#0B5D3B] dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                    : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="শিক্ষক, বিষয় বা রুম হাইলাইট করুন..."
              className="w-full h-8 pl-8 pr-7 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-[#0B5D3B]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Master Grid Tables (1 Table per Day Rendered) */}
      {daysToRender.map((dayObj) => (
        <div
          key={dayObj.key}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 bg-slate-50/70 dark:bg-slate-950/40">
            <div className="flex items-center gap-2">
              <Calendar size={15} className="text-[#0B5D3B] dark:text-emerald-400" />
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                মাস্টার রুটিন — {dayObj.labelBn}
              </h3>
            </div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              {toBanglaDigits(visibleClasses.length)}টি শ্রেণি/শাখা • যেকোনো সেলে ক্লিক করে এডিট করুন
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs min-w-[920px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/70 text-slate-700 dark:text-slate-200">
                  <th className="p-2.5 border-b border-r border-slate-200 dark:border-slate-800 font-extrabold text-left w-40 sticky left-0 z-10 bg-slate-50 dark:bg-slate-950">
                    শ্রেণি ও শাখা
                  </th>
                  {periods.map((p) => (
                    <th
                      key={p.periodNo}
                      className={`p-2 border-b border-r last:border-r-0 border-slate-200 dark:border-slate-800 text-center ${
                        p.isBreak
                          ? 'bg-amber-50/80 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 w-24'
                          : ''
                      }`}
                    >
                      <div className="font-extrabold text-[11px]">{p.periodName}</div>
                      <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {p.startTime} – {p.endTime}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
                {visibleClasses.map((clsOpt) => (
                  <tr
                    key={clsOpt.classId}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20"
                  >
                    <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 font-extrabold text-slate-900 dark:text-white bg-white dark:bg-slate-900 sticky left-0 z-10">
                      <span className="block text-xs leading-snug">{clsOpt.shortLabel}</span>
                      <span className="text-[10px] font-medium text-slate-400">
                        রুম {clsOpt.defaultRoom}
                      </span>
                    </td>

                    {periods.map((p) => {
                      if (p.isBreak) {
                        return (
                          <td
                            key={p.periodNo}
                            className="p-2 border-r last:border-r-0 border-slate-200 dark:border-slate-800 bg-amber-50/40 dark:bg-amber-950/20 text-center text-[10px] font-bold text-amber-700 dark:text-amber-400"
                          >
                            {p.periodName}
                          </td>
                        );
                      }

                      const slot = slotLookup.get(`${clsOpt.classId}|${dayObj.key}|${p.periodNo}`);
                      const slotConflicts = slot ? conflictMap.get(slot.id) || [] : [];
                      const hasConflict = slotConflicts.length > 0;

                      const matchesSearch =
                        !queryLower ||
                        (slot &&
                          `${slot.subject} ${slot.teacherName} ${slot.roomNo}`
                            .toLowerCase()
                            .includes(queryLower));

                      const conflictTooltip = slotConflicts
                        .map(
                          (c) =>
                            `${c.type === 'teacher' ? 'শিক্ষক সংঘর্ষ' : 'রুম সংঘর্ষ'}: ${formatClassIdBn(
                              c.conflictingSlot.classId,
                              classOptions
                            )} (${c.conflictingSlot.subject})`
                        )
                        .join(' | ');

                      return (
                        <td
                          key={p.periodNo}
                          onClick={() =>
                            onEditCell({
                              classOption: clsOpt,
                              day: dayObj.key,
                              dayBn: dayObj.labelBn,
                              periodNo: p.periodNo,
                              existing: slot,
                            })
                          }
                          title={hasConflict ? conflictTooltip : 'ক্লিক করে সম্পাদনা করুন'}
                          className={`p-2 border-r last:border-r-0 border-slate-200 dark:border-slate-800 align-top cursor-pointer transition min-w-[115px] ${
                            hasConflict
                              ? 'bg-rose-50/90 dark:bg-rose-950/40 hover:bg-rose-100/80 dark:hover:bg-rose-950/60'
                              : slot
                              ? queryLower && matchesSearch
                                ? 'bg-emerald-50/80 dark:bg-emerald-950/40 hover:bg-emerald-100/70'
                                : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                              : 'bg-slate-50/30 dark:bg-slate-950/20 hover:bg-slate-100/60 dark:hover:bg-slate-800/40'
                          } ${queryLower && !matchesSearch && slot ? 'opacity-35' : ''}`}
                        >
                          {slot ? (
                            <div className="space-y-0.5">
                              <div className="flex items-start justify-between gap-1">
                                <p className="font-extrabold text-slate-900 dark:text-white leading-tight text-[11.5px]">
                                  {slot.subject}
                                </p>
                                {hasConflict && (
                                  <span className="px-1.5 py-0.2 rounded bg-rose-600 text-white text-[9px] font-extrabold shrink-0 inline-flex items-center gap-0.5">
                                    <AlertTriangle size={9} /> কনফ্লিক্ট
                                  </span>
                                )}
                              </div>
                              <p className="text-[10.5px] font-bold text-[#0B5D3B] dark:text-emerald-300 truncate">
                                {slot.teacherName}
                              </p>
                              <span className="inline-block text-[9.5px] font-semibold text-slate-500 dark:text-slate-400">
                                রুম: {slot.roomNo}
                              </span>
                            </div>
                          ) : (
                            <div className="h-11 flex items-center justify-center text-slate-300 dark:text-slate-700 hover:text-[#0B5D3B] dark:hover:text-emerald-400 transition">
                              <Plus size={14} />
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
