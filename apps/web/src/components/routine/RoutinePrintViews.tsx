'use client';

import React from 'react';
import type {
  RoutineDayConfig,
  RoutineDayKey,
  RoutinePeriod,
  RoutineSlot,
  SubstitutionRecord,
} from '@/services/routineService';
import type { SchoolSettings } from '@/services/settingsService';
import type { TeacherRecord } from '@/services/teacherRBACService';
import {
  ClassOption,
  formatClassIdBn,
  RoutinePrintMode,
  toBanglaDigits,
} from './routineHelpers';

interface RoutinePrintViewsProps {
  printMode: RoutinePrintMode;
  settings: SchoolSettings | null;
  days: RoutineDayConfig[];
  periods: RoutinePeriod[];
  routines: RoutineSlot[];
  classOptions: ClassOption[];
  activeClassOpt?: ClassOption;
  teachers: TeacherRecord[];
  selectedTeacherObj?: TeacherRecord;
  selectedMasterDay: RoutineDayKey;
  subDate: string;
  daySubstitutions: SubstitutionRecord[];
}

function PrintSheetHeader({
  settings,
  title,
  subtitle,
}: {
  settings: SchoolSettings | null;
  title: string;
  subtitle?: string;
}) {
  const schoolName = settings?.schoolName || 'শিক্ষা প্রতিষ্ঠান';
  const address = settings?.address || '';
  const eiin = settings?.eiin || '';
  const logoUrl = settings?.schoolLogo || '';

  return (
    <div className="border-b-2 border-slate-900 pb-2.5 mb-3 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={schoolName}
            className="w-12 h-12 object-contain shrink-0"
          />
        ) : null}
        <div>
          <h1 className="text-lg font-black text-slate-900 leading-tight">{schoolName}</h1>
          <p className="text-[11px] font-medium text-slate-700">
            {address}
            {address && eiin ? ' • ' : ''}
            {eiin ? `EIIN: ${eiin}` : ''}
          </p>
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm font-extrabold text-slate-900">{title}</div>
        {subtitle && <p className="text-[11px] font-bold text-slate-700">{subtitle}</p>}
        <p className="text-[10px] text-slate-500">
          প্রিন্ট তারিখ: {new Date().toLocaleDateString('bn-BD')}
        </p>
      </div>
    </div>
  );
}

function PrintSignatureFooter({ settings }: { settings: SchoolSettings | null }) {
  return (
    <div className="mt-10 pt-4 flex items-end justify-between text-[11px] font-bold text-slate-800">
      <div className="text-center">
        <div className="w-44 border-t border-slate-500 pt-1">রুটিন কমিটি / সহকারী প্রধান শিক্ষক</div>
      </div>
      <div className="text-center">
        <div className="w-48 border-t border-slate-900 pt-1 font-extrabold text-slate-900">
          {settings?.principalTitle || 'প্রধান শিক্ষক'}
        </div>
        <div className="text-[10px] font-normal text-slate-600">
          {settings?.schoolName || 'শিক্ষা প্রতিষ্ঠান'}
        </div>
      </div>
    </div>
  );
}

function ClassWeeklyPrintSheet({
  settings,
  classOpt,
  days,
  periods,
  routines,
  pageBreakAfter,
}: {
  settings: SchoolSettings | null;
  classOpt: ClassOption;
  days: RoutineDayConfig[];
  periods: RoutinePeriod[];
  routines: RoutineSlot[];
  pageBreakAfter: boolean;
}) {
  const slotMap = new Map<string, RoutineSlot>();
  for (const r of routines) {
    if (r.classId === classOpt.classId) {
      slotMap.set(`${r.day}|${r.periodNo}`, r);
    }
  }

  return (
    <div
      className="bg-white text-slate-900"
      style={pageBreakAfter ? { pageBreakAfter: 'always', breakAfter: 'page' } : undefined}
    >
      <PrintSheetHeader
        settings={settings}
        title="সাপ্তাহিক ক্লাস রুটিন"
        subtitle={`${classOpt.label} • কক্ষ: ${classOpt.defaultRoom}`}
      />
      <table className="w-full border-collapse text-[11px]">
        <thead>
          <tr className="bg-slate-100 text-slate-900">
            <th className="border border-slate-400 px-2 py-1.5 text-left w-24">বার / সময়</th>
            {periods.map((p) => (
              <th
                key={p.periodNo}
                className={`border border-slate-400 px-1.5 py-1.5 text-center ${
                  p.isBreak ? 'bg-slate-200/80 w-20' : ''
                }`}
              >
                <div className="font-extrabold">{p.periodName}</div>
                <div className="text-[9.5px] font-medium text-slate-600">
                  {p.startTime}–{p.endTime}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {days.map((day) => (
            <tr key={day.key}>
              <td className="border border-slate-400 px-2 py-2 font-extrabold bg-slate-50">
                {day.labelBn}
              </td>
              {periods.map((p) => {
                if (p.isBreak) {
                  return (
                    <td
                      key={p.periodNo}
                      className="border border-slate-400 px-1 py-2 text-center font-bold bg-slate-50 text-[10px]"
                    >
                      {p.periodName}
                    </td>
                  );
                }
                const slot = slotMap.get(`${day.key}|${p.periodNo}`);
                return (
                  <td key={p.periodNo} className="border border-slate-400 px-1.5 py-1.5 align-top">
                    {slot ? (
                      <div>
                        <div className="font-extrabold text-slate-900 leading-snug">
                          {slot.subject}
                        </div>
                        <div className="text-[10px] font-semibold text-slate-700">
                          {slot.teacherName}
                        </div>
                        <div className="text-[9.5px] text-slate-500">রুম: {slot.roomNo}</div>
                      </div>
                    ) : (
                      <div className="text-center text-slate-300">—</div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <PrintSignatureFooter settings={settings} />
    </div>
  );
}

function TeacherWeeklyPrintSheet({
  settings,
  teacher,
  days,
  periods,
  routines,
  classOptions,
  pageBreakAfter,
}: {
  settings: SchoolSettings | null;
  teacher: TeacherRecord;
  days: RoutineDayConfig[];
  periods: RoutinePeriod[];
  routines: RoutineSlot[];
  classOptions: ClassOption[];
  pageBreakAfter: boolean;
}) {
  const tSlots = routines.filter(
    (r) =>
      (r.teacherId && r.teacherId.trim().toLowerCase() === teacher.id.trim().toLowerCase()) ||
      r.teacherName.trim().toLowerCase() === teacher.name.trim().toLowerCase()
  );

  const slotMap = new Map<string, RoutineSlot[]>();
  for (const s of tSlots) {
    const key = `${s.day}|${s.periodNo}`;
    const list = slotMap.get(key) || [];
    list.push(s);
    slotMap.set(key, list);
  }

  return (
    <div
      className="bg-white text-slate-900"
      style={pageBreakAfter ? { pageBreakAfter: 'always', breakAfter: 'page' } : undefined}
    >
      <PrintSheetHeader
        settings={settings}
        title="ব্যক্তিগত সাপ্তাহিক ক্লাস রুটিন (শিক্ষক)"
        subtitle={`${teacher.name} (${teacher.designation}) • সাপ্তাহিক মোট ক্লাস: ${toBanglaDigits(
          tSlots.length
        )}টি`}
      />
      <table className="w-full border-collapse text-[11px]">
        <thead>
          <tr className="bg-slate-100 text-slate-900">
            <th className="border border-slate-400 px-2 py-1.5 text-left w-24">বার / সময়</th>
            {periods.map((p) => (
              <th
                key={p.periodNo}
                className={`border border-slate-400 px-1.5 py-1.5 text-center ${
                  p.isBreak ? 'bg-slate-200/80 w-20' : ''
                }`}
              >
                <div className="font-extrabold">{p.periodName}</div>
                <div className="text-[9.5px] font-medium text-slate-600">
                  {p.startTime}–{p.endTime}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {days.map((day) => (
            <tr key={day.key}>
              <td className="border border-slate-400 px-2 py-2 font-extrabold bg-slate-50">
                {day.labelBn}
              </td>
              {periods.map((p) => {
                if (p.isBreak) {
                  return (
                    <td
                      key={p.periodNo}
                      className="border border-slate-400 px-1 py-2 text-center font-bold bg-slate-50 text-[10px]"
                    >
                      {p.periodName}
                    </td>
                  );
                }
                const list = slotMap.get(`${day.key}|${p.periodNo}`) || [];
                return (
                  <td key={p.periodNo} className="border border-slate-400 px-1.5 py-1.5 align-top">
                    {list.length === 0 ? (
                      <div className="text-center text-slate-400 text-[10px]">ফ্রি</div>
                    ) : (
                      list.map((s) => (
                        <div key={s.id} className="mb-1 last:mb-0">
                          <div className="font-extrabold text-slate-900">{s.subject}</div>
                          <div className="text-[10px] font-bold text-slate-700">
                            {formatClassIdBn(s.classId, classOptions)}
                          </div>
                          <div className="text-[9.5px] text-slate-500">রুম: {s.roomNo}</div>
                        </div>
                      ))
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <PrintSignatureFooter settings={settings} />
    </div>
  );
}

function MasterDayPrintSheet({
  settings,
  dayObj,
  periods,
  classOptions,
  routines,
  pageBreakAfter,
}: {
  settings: SchoolSettings | null;
  dayObj: RoutineDayConfig;
  periods: RoutinePeriod[];
  classOptions: ClassOption[];
  routines: RoutineSlot[];
  pageBreakAfter: boolean;
}) {
  const slotMap = new Map<string, RoutineSlot>();
  for (const r of routines) {
    if (r.day === dayObj.key) {
      slotMap.set(`${r.classId}|${r.periodNo}`, r);
    }
  }

  return (
    <div
      className="bg-white text-slate-900"
      style={pageBreakAfter ? { pageBreakAfter: 'always', breakAfter: 'page' } : undefined}
    >
      <PrintSheetHeader
        settings={settings}
        title="মাস্টার ক্লাস রুটিন (সকল শ্রেণি)"
        subtitle={`বার: ${dayObj.labelBn} • মোট শ্রেণি/শাখা: ${toBanglaDigits(classOptions.length)}টি`}
      />
      <table className="w-full border-collapse text-[10.5px]">
        <thead>
          <tr className="bg-slate-100 text-slate-900">
            <th className="border border-slate-400 px-2 py-1.5 text-left w-32">শ্রেণি ও শাখা</th>
            {periods.map((p) => (
              <th
                key={p.periodNo}
                className={`border border-slate-400 px-1.5 py-1.5 text-center ${
                  p.isBreak ? 'bg-slate-200/80 w-16' : ''
                }`}
              >
                <div className="font-extrabold">{p.periodName}</div>
                <div className="text-[9px] font-medium text-slate-600">
                  {p.startTime}–{p.endTime}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {classOptions.map((cls) => (
            <tr key={cls.classId}>
              <td className="border border-slate-400 px-2 py-1.5 font-extrabold bg-slate-50">
                {cls.shortLabel}
              </td>
              {periods.map((p) => {
                if (p.isBreak) {
                  return (
                    <td
                      key={p.periodNo}
                      className="border border-slate-400 px-1 py-1.5 text-center text-[9.5px] font-bold bg-slate-50"
                    >
                      বিরতি
                    </td>
                  );
                }
                const slot = slotMap.get(`${cls.classId}|${p.periodNo}`);
                return (
                  <td key={p.periodNo} className="border border-slate-400 px-1.5 py-1 align-top">
                    {slot ? (
                      <div>
                        <div className="font-extrabold text-slate-900 leading-tight">
                          {slot.subject}
                        </div>
                        <div className="text-[9.5px] font-semibold text-slate-700">
                          {slot.teacherName}
                        </div>
                        <div className="text-[9px] text-slate-500">রুম {slot.roomNo}</div>
                      </div>
                    ) : (
                      <div className="text-center text-slate-300">—</div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <PrintSignatureFooter settings={settings} />
    </div>
  );
}

export default function RoutinePrintViews({
  printMode,
  settings,
  days,
  periods,
  routines,
  classOptions,
  activeClassOpt,
  teachers,
  selectedTeacherObj,
  selectedMasterDay,
  subDate,
  daySubstitutions,
}: RoutinePrintViewsProps) {
  return (
    <div className="hidden print:block bg-white text-slate-900">
      {printMode === 'current_class' && activeClassOpt && (
        <ClassWeeklyPrintSheet
          settings={settings}
          classOpt={activeClassOpt}
          days={days}
          periods={periods}
          routines={routines}
          pageBreakAfter={false}
        />
      )}

      {printMode === 'all_classes' &&
        classOptions.map((cls, idx) => (
          <ClassWeeklyPrintSheet
            key={cls.classId}
            settings={settings}
            classOpt={cls}
            days={days}
            periods={periods}
            routines={routines}
            pageBreakAfter={idx < classOptions.length - 1}
          />
        ))}

      {printMode === 'current_teacher' && selectedTeacherObj && (
        <TeacherWeeklyPrintSheet
          settings={settings}
          teacher={selectedTeacherObj}
          days={days}
          periods={periods}
          routines={routines}
          classOptions={classOptions}
          pageBreakAfter={false}
        />
      )}

      {printMode === 'all_teachers' &&
        teachers.map((tch, idx) => (
          <TeacherWeeklyPrintSheet
            key={tch.id}
            settings={settings}
            teacher={tch}
            days={days}
            periods={periods}
            routines={routines}
            classOptions={classOptions}
            pageBreakAfter={idx < teachers.length - 1}
          />
        ))}

      {printMode === 'master_day' && (() => {
        const dayObj = days.find((d) => d.key === selectedMasterDay) || days[0];
        if (!dayObj) return null;
        return (
          <MasterDayPrintSheet
            settings={settings}
            dayObj={dayObj}
            periods={periods}
            classOptions={classOptions}
            routines={routines}
            pageBreakAfter={false}
          />
        );
      })()}

      {printMode === 'master_week' &&
        days.map((dayObj, idx) => (
          <MasterDayPrintSheet
            key={dayObj.key}
            settings={settings}
            dayObj={dayObj}
            periods={periods}
            classOptions={classOptions}
            routines={routines}
            pageBreakAfter={idx < days.length - 1}
          />
        ))}

      {printMode === 'substitution' && (
        <div className="bg-white text-slate-900">
          <PrintSheetHeader
            settings={settings}
            title="দৈনিক প্রক্সি ও বিকল্প শিক্ষক তালিকা"
            subtitle={`তারিখ: ${subDate} • মোট প্রক্সি: ${toBanglaDigits(daySubstitutions.length)}টি`}
          />
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-900">
                <th className="border border-slate-400 px-2.5 py-2 text-center w-10">ক্রম</th>
                <th className="border border-slate-400 px-2.5 py-2 text-left">শ্রেণি ও শাখা</th>
                <th className="border border-slate-400 px-2.5 py-2 text-left">পিরিয়ড</th>
                <th className="border border-slate-400 px-2.5 py-2 text-left">বিষয় ও কক্ষ</th>
                <th className="border border-slate-400 px-2.5 py-2 text-left">মূল শিক্ষক</th>
                <th className="border border-slate-400 px-2.5 py-2 text-left">বিকল্প শিক্ষক</th>
              </tr>
            </thead>
            <tbody>
              {daySubstitutions.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="border border-slate-400 px-3 py-6 text-center text-slate-500"
                  >
                    এই তারিখে কোনো প্রক্সি শিক্ষক নির্ধারিত নেই।
                  </td>
                </tr>
              ) : (
                daySubstitutions.map((s, idx) => {
                  const pMeta = periods.find((p) => p.periodNo === s.periodNo);
                  return (
                    <tr key={s.id}>
                      <td className="border border-slate-400 px-2.5 py-2 text-center font-bold">
                        {toBanglaDigits(idx + 1)}
                      </td>
                      <td className="border border-slate-400 px-2.5 py-2 font-bold">
                        {formatClassIdBn(s.classId, classOptions)}
                      </td>
                      <td className="border border-slate-400 px-2.5 py-2">
                        {pMeta ? `${pMeta.periodName} (${pMeta.startTime}–${pMeta.endTime})` : `P${s.periodNo}`}
                      </td>
                      <td className="border border-slate-400 px-2.5 py-2">
                        {s.subject} (রুম: {s.roomNo || '—'})
                      </td>
                      <td className="border border-slate-400 px-2.5 py-2">{s.absentTeacherName}</td>
                      <td className="border border-slate-400 px-2.5 py-2 font-extrabold">
                        {s.substituteTeacherName}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          <PrintSignatureFooter settings={settings} />
        </div>
      )}
    </div>
  );
}
