'use client';

import React from 'react';
import Link from 'next/link';
import { Eye, Upload, UserCheck, UserX } from 'lucide-react';
import type { SchoolSettings } from '@/services/settingsService';
import {
  type TabulationColumnOptions,
  type TabulationDocLang,
  type TabulationGradeId,
  type TabulationGroupBn,
  type TabulationRow,
  type TabulationSubjectSpec,
  type TabulationSummaryStats,
  formatMeritCell,
  formatTabulationDigits,
  formatTabulationScopeBanner,
  formatTabulationSubjectName,
  getTabulationDocLabels,
  getTabulationInstitutionHeader,
} from '@/lib/tabulationStudioUtils';

export interface TabulationSheetViewProps {
  rows: TabulationRow[];
  subjects: TabulationSubjectSpec[];
  summary: TabulationSummaryStats;
  settings: SchoolSettings | null;
  selectedExam: string;
  selectedGrade: TabulationGradeId;
  selectedSection: string;
  selectedGroup: TabulationGroupBn;
  docLang: TabulationDocLang;
  columns: TabulationColumnOptions;
  zoomPercent: number;
  onEnableSamplePreview: () => void;
}

export function TabulationSheetView({
  rows,
  subjects,
  summary,
  settings,
  selectedExam,
  selectedGrade,
  selectedSection,
  selectedGroup,
  docLang,
  columns,
  zoomPercent,
  onEnableSamplePreview,
}: TabulationSheetViewProps) {
  const header = getTabulationInstitutionHeader(settings, docLang);
  const labels = getTabulationDocLabels(docLang);
  const scopeBanner = formatTabulationScopeBanner({
    examTitle: selectedExam,
    grade: selectedGrade,
    section: selectedSection,
    groupBn: selectedGroup,
    lang: docLang,
  });

  const dateText =
    docLang === 'bn'
      ? new Date().toLocaleDateString('bn-BD')
      : new Date().toLocaleDateString('en-GB');

  const padClass = columns.compactRows ? 'px-1 py-1' : 'px-1.5 py-1.5';

  return (
    <div className="bg-white text-slate-950 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs print:shadow-none print:p-0 print:border-0 print:rounded-none overflow-x-auto">
      <div
        className="tabulation-zoom-wrapper space-y-4 print:space-y-3"
        style={{
          fontSize: `${zoomPercent}%`,
        }}
      >
        {/* OFFICIAL INSTITUTIONAL LETTERHEAD (<div>, NEVER <header>) */}
        <div className="border-b-2 border-slate-950 pb-3">
          <div className="flex items-center justify-between gap-3">
            <div className="w-14 h-14 shrink-0 flex items-center justify-center">
              {settings?.schoolLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={settings.schoolLogo}
                  alt="Logo"
                  className="w-13 h-13 object-contain"
                />
              ) : null}
            </div>
            <div className="text-center flex-1 min-w-0">
              <div className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight leading-tight font-serif">
                {header.schoolName}
              </div>
              {(header.address || header.metaLine) && (
                <div className="text-[11px] font-bold text-slate-800 mt-0.5">
                  {[header.address, header.metaLine].filter(Boolean).join(' • ')}
                </div>
              )}
              <div className="mt-1.5">
                <span className="inline-block px-4 py-1 bg-slate-950 text-white font-black text-[11px] rounded tracking-wide">
                  {scopeBanner}
                </span>
              </div>
            </div>
            <div className="w-24 shrink-0 text-right text-[10px] font-bold text-slate-700 hidden sm:block print:block">
              <div>{labels.printDateLabel}:</div>
              <div className="font-mono font-black text-slate-950">{dateText}</div>
            </div>
          </div>
        </div>

        {/* MASTER TABULATION MATRIX TABLE */}
        {rows.length === 0 ? (
          <div className="p-10 text-center space-y-3 border border-dashed border-slate-300 rounded-2xl print:hidden">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
              <UserX size={24} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-black text-slate-900">
                এই শ্রেণি বা বিভাগে কোনো শিক্ষার্থী পাওয়া যায়নি
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                বাম পাশ থেকে অন্য শ্রেণি/বিভাগ নির্বাচন করুন অথবা টেবুলেশন শীটের প্রিন্ট ফরম্যাট দেখতে নমুনা প্রিভিউ চালু করুন।
              </p>
            </div>
            <div className="pt-1 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={onEnableSamplePreview}
                className="px-4 py-2 bg-[#0B5D3B] hover:bg-[#094a2f] text-white rounded-xl text-xs font-black transition inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Eye size={14} /> নমুনা টেবুলেশন দেখুন
              </button>
              <Link
                href="/dashboard/students/bulk-import"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5"
              >
                <Upload size={14} /> বাল্ক আপলোড
              </Link>
              <Link
                href="/dashboard/students"
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5"
              >
                <UserCheck size={14} /> শিক্ষার্থী তালিকা
              </Link>
            </div>
          </div>
        ) : (
          <table className="tabulation-print-table w-full text-left text-[10.5px] border-collapse border border-slate-950">
            <thead>
              <tr className="bg-slate-200 text-slate-950 font-black text-[9.5px] border-b border-slate-950">
                <th className={`${padClass} text-center border-r border-slate-950 w-10`}>
                  {labels.colRoll}
                </th>
                <th className={`${padClass} border-r border-slate-950 min-w-[130px]`}>
                  {labels.colName}
                </th>

                {subjects.map((sub) => (
                  <th
                    key={sub.code}
                    className={`${padClass} text-center border-r border-slate-950 min-w-[54px]`}
                  >
                    <div className="font-black leading-tight">
                      {formatTabulationSubjectName(sub.name, docLang)}
                    </div>
                    <div className="text-[8px] text-slate-700 font-mono font-bold">
                      ({formatTabulationDigits(sub.fullMarks, docLang)})
                    </div>
                  </th>
                ))}

                <th className={`${padClass} text-center border-r border-slate-950 w-14`}>
                  {labels.colTotal}
                </th>
                {columns.show4thSubject && (
                  <th className={`${padClass} text-center border-r border-slate-950 w-14 bg-slate-100`}>
                    {labels.colGpaNo4th}
                  </th>
                )}
                <th className={`${padClass} text-center border-r border-slate-950 w-14 bg-indigo-50 text-indigo-950`}>
                  {labels.colGpa}
                </th>
                <th className={`${padClass} text-center border-r border-slate-950 w-12`}>
                  {labels.colGrade}
                </th>
                {columns.showMerit && (
                  <th className={`${padClass} text-center border-r border-slate-950 w-14 bg-emerald-50 text-emerald-950`}>
                    {labels.colMerit}
                  </th>
                )}
                <th className={`${padClass} text-center w-16`}>{labels.colStatus}</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-950 font-medium">
              {rows.map((st) => (
                <tr key={st.id} className="border-b border-slate-950 hover:bg-slate-50/80">
                  <td className={`${padClass} text-center font-black font-mono border-r border-slate-950`}>
                    {formatTabulationDigits(st.roll, docLang)}
                  </td>
                  <td className={`${padClass} font-bold border-r border-slate-950 text-slate-950`}>
                    {docLang === 'en' ? st.nameEn || st.name : st.name}
                  </td>

                  {subjects.map((sub) => {
                    const mark = st.subjectMarksMap[sub.code];
                    return (
                      <td
                        key={sub.code}
                        className={`${padClass} text-center font-mono border-r border-slate-950 ${
                          mark?.isOptional ? 'bg-amber-50/70' : ''
                        }`}
                      >
                        {mark ? (
                          <div className="leading-tight">
                            <span
                              className={
                                mark.grade === 'F'
                                  ? 'text-rose-700 font-black'
                                  : 'text-slate-950 font-bold'
                              }
                            >
                              {formatTabulationDigits(mark.total, docLang)} ({mark.grade})
                            </span>
                            {columns.showGradePoint && (
                              <div className="text-[8px] text-slate-600 font-bold">
                                {formatTabulationDigits(mark.point.toFixed(1), docLang)}
                              </div>
                            )}
                            {columns.showBreakdown &&
                              (mark.cq !== undefined || mark.mcq !== undefined) && (
                                <div className="text-[7.5px] text-slate-600 font-semibold whitespace-nowrap">
                                  {formatTabulationDigits(mark.cq ?? 0, docLang)}/
                                  {formatTabulationDigits(mark.mcq ?? 0, docLang)}
                                  {mark.practical ? `/${formatTabulationDigits(mark.practical, docLang)}` : ''}
                                </div>
                              )}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    );
                  })}

                  <td className={`${padClass} text-center font-mono font-black text-slate-950 border-r border-slate-950`}>
                    {formatTabulationDigits(st.totalObtained, docLang)}
                  </td>

                  {columns.show4thSubject && (
                    <td className={`${padClass} text-center font-mono font-bold text-slate-800 bg-slate-50 border-r border-slate-950`}>
                      {formatTabulationDigits(
                        st.hasFailed ? '0.00' : st.gpaWithout4th.toFixed(2),
                        docLang,
                      )}
                    </td>
                  )}

                  <td className={`${padClass} text-center font-mono font-black text-indigo-950 bg-indigo-50/60 border-r border-slate-950`}>
                    {formatTabulationDigits(
                      st.hasFailed ? '0.00' : st.finalGPA.toFixed(2),
                      docLang,
                    )}
                  </td>

                  <td
                    className={`${padClass} text-center font-black border-r border-slate-950 ${
                      st.hasFailed ? 'text-rose-700' : 'text-slate-950'
                    }`}
                  >
                    {st.overallGrade}
                  </td>

                  {columns.showMerit && (
                    <td className={`${padClass} text-center font-black text-emerald-900 bg-emerald-50/50 border-r border-slate-950`}>
                      {formatMeritCell(st.meritPosition, docLang)}
                    </td>
                  )}

                  <td className={`${padClass} text-center font-black`}>
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-black ${
                        st.hasFailed
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {st.hasFailed ? labels.statusFail : labels.statusPass}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>

            <tfoot className="bg-slate-100 font-black text-[9.5px] text-slate-950 border-t-2 border-slate-950">
              <tr>
                <td colSpan={2} className="p-2 border-r border-slate-950 text-center">
                  {labels.summaryTitle}
                </td>
                <td colSpan={subjects.length} className="p-2 border-r border-slate-950 text-center font-bold">
                  {labels.summaryExaminees}: {formatTabulationDigits(summary.total, docLang)} |{' '}
                  {labels.summaryPassed}: {formatTabulationDigits(summary.passed, docLang)} |{' '}
                  {labels.summaryFailed}: {formatTabulationDigits(summary.failed, docLang)} |{' '}
                  {labels.summaryAPlus}: {formatTabulationDigits(summary.aPlus, docLang)}
                </td>
                <td className="p-2 text-center border-r border-slate-950 font-mono">
                  {labels.summaryAvg}: {formatTabulationDigits(summary.avgMarks.toFixed(0), docLang)}
                </td>
                {columns.show4thSubject && (
                  <td className="p-2 text-center border-r border-slate-950 font-mono">—</td>
                )}
                <td className="p-2 text-center border-r border-slate-950 font-mono bg-indigo-100/80 text-indigo-950">
                  {formatTabulationDigits(summary.avgGpa.toFixed(2), docLang)}
                </td>
                <td
                  colSpan={columns.showMerit ? 3 : 2}
                  className="p-2 text-center font-black text-emerald-900"
                >
                  {labels.summaryPassRate}: {formatTabulationDigits(summary.passRate.toFixed(1), docLang)}%
                </td>
              </tr>
            </tfoot>
          </table>
        )}

        {/* ATOMIC OFFICIAL 3-COLUMN SIGNATURE FOOTER */}
        {rows.length > 0 && (
          <div className="tabulation-signature-block pt-10 flex justify-between items-end text-center text-xs font-bold text-slate-950">
            <div>
              <div className="w-40 border-b border-slate-950 mx-auto" />
              <p className="mt-1.5">{labels.sigPreparedBy}</p>
            </div>
            <div>
              <div className="w-40 border-b border-slate-950 mx-auto" />
              <p className="mt-1.5">{labels.sigController}</p>
            </div>
            <div>
              <div className="w-44 border-b border-slate-950 mx-auto" />
              <p className="mt-1.5 font-black">{header.principalTitle}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
