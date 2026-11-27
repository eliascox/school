'use client';

import React from 'react';
import { GraduationCap } from 'lucide-react';
import type { SchoolSettings } from '@/services/settingsService';
import type { Student } from '@/services/studentService';
import {
  RANK_GRADE_BN_MAP,
  RANK_GRADE_EN_MAP,
  getRankGroupEn,
} from '@/lib/rankResultUtils';
import type { ClassSummaryRow } from '@/lib/studentPrintUtils';
import {
  type ResolvedPrintColumn,
  type StudentTableFilters,
  type StudentTableStyleConfig,
  type TableMarginPreset,
  type TableOrientation,
  type TablePrintLang,
  formatOrderedCellValue,
  formatTableDigits,
  getTableMarginMm,
  getTablePrintInstitutionHeader,
  isStudentFemale,
  isStudentMale,
} from '@/lib/studentTablePrintEngine';

export interface StudentContinuousPrintSheetProps {
  reportType: 'detailed' | 'summary';
  students: Array<Student & Record<string, unknown>>;
  classSummaryData: ClassSummaryRow[];
  orderedColumns: ResolvedPrintColumn[];
  settings: SchoolSettings | null;
  filters: StudentTableFilters;
  docLang: TablePrintLang;
  orientation: TableOrientation;
  marginPreset: TableMarginPreset;
  rowsPerPage: number; // 0 = Native Continuous Zero-Gap Print Flow (Recommended)
  styleConfig: StudentTableStyleConfig;
  defaultTitleBn: string;
  defaultTitleEn: string;
  year: string;
}

export function StudentContinuousPrintSheet({
  reportType,
  students,
  classSummaryData,
  orderedColumns,
  settings,
  filters,
  docLang,
  orientation,
  marginPreset,
  rowsPerPage,
  styleConfig,
  defaultTitleBn,
  defaultTitleEn,
  year,
}: StudentContinuousPrintSheetProps) {
  const header = getTablePrintInstitutionHeader(settings, docLang);
  const marginInfo = getTableMarginMm(marginPreset);
  const yearDisplay = formatTableDigits(year, docLang);

  const reportTitle =
    styleConfig.customTitle.trim() ||
    (docLang === 'en' ? `${defaultTitleEn} — ${yearDisplay}` : `${defaultTitleBn} — ${yearDisplay}`);

  const gradeScopeText =
    filters.grade === 'all'
      ? docLang === 'en'
        ? 'All Classes'
        : 'সকল শ্রেণি'
      : docLang === 'en'
      ? RANK_GRADE_EN_MAP[filters.grade] || filters.grade
      : RANK_GRADE_BN_MAP[filters.grade] || filters.grade;

  const groupScopeText =
    filters.group === 'all'
      ? docLang === 'en'
        ? 'All Groups'
        : 'সকল বিভাগ'
      : docLang === 'en'
      ? getRankGroupEn(filters.group)
      : filters.group;

  const branchScopeText =
    filters.branch === 'all'
      ? docLang === 'en'
        ? 'All Sections'
        : 'সকল শাখা'
      : docLang === 'en'
      ? `Sec ${filters.branch}`
      : `শাখা ${filters.branch}`;

  const dateText =
    docLang === 'en'
      ? new Date().toLocaleDateString('en-GB')
      : new Date().toLocaleDateString('bn-BD');

  const maleCount = students.filter((s) => isStudentMale(s.gender)).length;
  const femaleCount = students.filter((s) => isStudentFemale(s.gender)).length;
  const stipendCount = students.filter((s) => Boolean(s.isStipend)).length;

  const summaryTotalBoys = classSummaryData.reduce((s, r) => s + r.boys, 0);
  const summaryTotalGirls = classSummaryData.reduce((s, r) => s + r.girls, 0);
  const summaryGrandTotal = classSummaryData.reduce((s, r) => s + r.total, 0);

  const enabledSignatories = styleConfig.signatories.filter((s) => s.enabled);

  // Typography & Density Tokens
  const fontSizeCss =
    styleConfig.fontSize === 'sm' ? '9px' : styleConfig.fontSize === 'lg' ? '12px' : '10.5px';
  const cellPadY =
    styleConfig.rowDensity === 'compact'
      ? '3px'
      : styleConfig.rowDensity === 'sign_tall'
      ? '9px'
      : '5.5px';
  const rowMinH =
    styleConfig.rowDensity === 'compact'
      ? '20px'
      : styleConfig.rowDensity === 'sign_tall'
      ? '34px'
      : '24px';

  // Header Theme Styles
  const theadRowStyle: React.CSSProperties =
    styleConfig.headerTheme === 'dark_navy'
      ? { backgroundColor: '#0f172a', color: '#ffffff' }
      : styleConfig.headerTheme === 'emerald'
      ? { backgroundColor: '#0B5D3B', color: '#ffffff' }
      : { backgroundColor: '#f1f5f9', color: '#000000' };

  const titlePillStyle: React.CSSProperties =
    styleConfig.headerTheme === 'emerald'
      ? { backgroundColor: '#0B5D3B', color: '#ffffff' }
      : styleConfig.headerTheme === 'dark_navy'
      ? { backgroundColor: '#0f172a', color: '#ffffff' }
      : { backgroundColor: '#ffffff', color: '#000000', border: '1.5px solid #000000' };

  const runningFooterSchool = header.schoolName.replace(/"/g, "'");
  const runningPageLabel = docLang === 'en' ? 'Page ' : 'পৃষ্ঠা ';

  return (
    <div className="student-print-root">
      {/*
        PRESS-GRADE CONTINUOUS PRINT CSS:
        - ZERO display: flex on print container (flex breaks Chromium table pagination!)
        - ZERO min-height: 270mm lock (min-height forces phantom blank pages!)
        - ZERO artificial page-break-after: always between chunks (causes 65% blank spill voids!)
        - Native thead { display: table-header-group } repeats headers cleanly on EVERY printed page!
      */}
      <style>{`
        .student-continuous-sheet {
          width: ${orientation === 'landscape' ? '297mm' : '210mm'};
          margin: 0 auto;
          background: #ffffff;
          color: #000000;
          padding: ${marginInfo.v}mm ${marginInfo.h}mm;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12);
          box-sizing: border-box;
          position: relative;
        }
        .student-continuous-table {
          width: 100%;
          border-collapse: collapse;
          border: 1.5px solid #0f172a;
          background: #ffffff;
          font-size: ${fontSizeCss};
        }
        .student-continuous-table thead {
          display: table-header-group !important;
        }
        .student-continuous-table th {
          border: 1px solid #1e293b;
          padding: 6px 5px;
          font-weight: 800;
          line-height: 1.25;
        }
        .student-continuous-table td {
          border: 1px solid #334155;
          padding: ${cellPadY} 5px;
          height: ${rowMinH};
          vertical-align: middle;
          color: #000000;
          line-height: 1.25;
        }
        .student-continuous-table tbody tr {
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }
        .student-signature-footer {
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }
        @media print {
          @page {
            size: A4 ${orientation} !important;
            margin: ${marginInfo.v}mm ${marginInfo.h}mm ${Math.max(marginInfo.v + 3, 13)}mm ${marginInfo.h}mm !important;
            @bottom-left {
              content: "${runningFooterSchool}";
              font-size: 8pt;
              color: #475569;
            }
            @bottom-right {
              content: "${runningPageLabel}" counter(page) " / " counter(pages);
              font-size: 8pt;
              font-weight: 700;
              color: #0f172a;
            }
          }
          html, body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .student-continuous-sheet {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            min-height: 0 !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            overflow: visible !important;
          }
          .student-manual-row-break {
            break-after: page !important;
            page-break-after: always !important;
          }
        }
      `}</style>

      <div className="student-continuous-sheet">
        {/* Optional Institutional Watermark */}
        {styleConfig.showWatermark && (
          <div className="fixed inset-0 pointer-events-none flex items-center justify-center opacity-[0.04] select-none z-0">
            <div className="text-center -rotate-12">
              <div className="text-5xl font-black tracking-widest text-slate-900">
                {header.schoolName}
              </div>
            </div>
          </div>
        )}

        <div className="relative z-10">
          {/* 1. OFFICIAL INSTITUTIONAL LETTERHEAD (<div>, NEVER <header>) */}
          <div className="flex items-center justify-between gap-3 pb-2.5 border-b-2 border-slate-950">
            <div className="w-14 h-14 shrink-0 flex items-center justify-center">
              {settings?.schoolLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={settings.schoolLogo}
                  alt="School Logo"
                  className="w-14 h-14 object-contain"
                />
              ) : (
                <div className="w-13 h-13 rounded-full bg-[#0B5D3B] text-white border-2 border-emerald-700 flex items-center justify-center">
                  <GraduationCap className="w-7 h-7 text-amber-200" />
                </div>
              )}
            </div>

            <div className="text-center flex-1 min-w-0 pr-14">
              <div className="text-xl sm:text-[20pt] font-black text-black font-serif leading-tight">
                {header.schoolName}
              </div>
              {header.address && (
                <div className="text-[10pt] font-bold text-slate-900 mt-0.5">{header.address}</div>
              )}
              {header.metaLine && (
                <div className="text-[8.5pt] font-semibold text-slate-700">{header.metaLine}</div>
              )}
            </div>
          </div>

          {/* 2. REPORT TITLE & OPTIONAL CUSTOM SUBTITLE */}
          <div className="text-center mt-2.5 mb-2">
            <div
              style={titlePillStyle}
              className="inline-block px-5 py-1 font-black text-xs tracking-wide rounded"
            >
              {reportTitle}
            </div>
            {styleConfig.customSubtitle.trim() && (
              <div className="text-[10px] font-bold text-slate-700 mt-1">
                {styleConfig.customSubtitle.trim()}
              </div>
            )}
          </div>

          {/* VIEW A: CLASS STATISTICAL SUMMARY */}
          {reportType === 'summary' ? (
            <table className="student-continuous-table mt-2 text-center">
              <thead>
                <tr style={theadRowStyle}>
                  <th style={{ width: '48px' }}>{docLang === 'en' ? 'SL' : 'ক্র. নং'}</th>
                  <th style={{ width: '82px' }}>{docLang === 'en' ? 'Class' : 'শ্রেণি'}</th>
                  <th style={{ width: '140px' }}>{docLang === 'en' ? 'Group' : 'বিভাগ'}</th>
                  <th style={{ width: '80px' }}>{docLang === 'en' ? 'Boys' : 'ছাত্র'}</th>
                  <th style={{ width: '80px' }}>{docLang === 'en' ? 'Girls' : 'ছাত্রী'}</th>
                  <th style={{ width: '80px' }}>{docLang === 'en' ? 'Total' : 'মোট'}</th>
                  <th>{docLang === 'en' ? 'Remarks' : 'মন্তব্য'}</th>
                </tr>
              </thead>
              <tbody>
                {classSummaryData.map((row, idx) => (
                  <tr key={row.key} className={styleConfig.zebraStripes && idx % 2 === 1 ? 'bg-slate-50/80' : ''}>
                    <td className="font-mono font-bold text-center">
                      {formatTableDigits(String(idx + 1).padStart(2, '0'), docLang)}
                    </td>
                    <td className="font-bold text-center">
                      {docLang === 'en' ? row.gradeEn : row.gradeBn}
                    </td>
                    <td className="text-center">
                      {docLang === 'en' ? row.groupEn || '—' : row.groupBn || '—'}
                    </td>
                    <td className="font-mono font-bold text-center">
                      {formatTableDigits(row.boys, docLang)}
                    </td>
                    <td className="font-mono font-bold text-center">
                      {formatTableDigits(row.girls, docLang)}
                    </td>
                    <td className="font-mono font-black text-center">
                      {formatTableDigits(row.total, docLang)}
                    </td>
                    {idx === 0 && <td rowSpan={classSummaryData.length + 1} />}
                  </tr>
                ))}
                <tr style={{ borderTop: '2px solid #000000', backgroundColor: '#f1f5f9' }}>
                  <td colSpan={3} className="font-black text-center">
                    {docLang === 'en' ? 'Grand Total' : 'সর্বমোট'}
                  </td>
                  <td className="font-mono font-black text-center">
                    {formatTableDigits(summaryTotalBoys, docLang)}
                  </td>
                  <td className="font-mono font-black text-center">
                    {formatTableDigits(summaryTotalGirls, docLang)}
                  </td>
                  <td className="font-mono font-black text-center">
                    {formatTableDigits(summaryGrandTotal, docLang)}
                  </td>
                </tr>
              </tbody>
            </table>
          ) : (
            <>
              {/* META BAR */}
              <div className="grid grid-cols-3 items-center text-[9.5px] font-bold text-black bg-slate-50 px-3 py-1.5 border border-slate-900 mb-1.5">
                <div className="text-left">
                  {branchScopeText} · {groupScopeText}
                </div>
                <div className="text-center">
                  <span className="font-black text-[11px] border-b border-black px-2">
                    {docLang === 'en' ? 'Class' : 'শ্রেণি'}: {gradeScopeText}
                  </span>
                </div>
                <div className="text-right font-mono">
                  {docLang === 'en' ? 'Date' : 'তারিখ'}: {dateText}
                </div>
              </div>

              {/* OPTIONAL SUMMARY STATS STRIP */}
              {styleConfig.showStatsStrip && (
                <div className="bg-slate-100/90 border border-slate-800 px-3 py-1 text-[9.5px] font-bold text-black flex flex-wrap justify-between items-center gap-2 mb-2">
                  <span>
                    {docLang === 'en' ? 'Total' : 'মোট শিক্ষার্থী'}:{' '}
                    <strong>{formatTableDigits(students.length, docLang)}</strong>
                  </span>
                  <span>
                    {docLang === 'en' ? 'Boys' : 'ছাত্র'}:{' '}
                    <strong>{formatTableDigits(maleCount, docLang)}</strong>
                  </span>
                  <span>
                    {docLang === 'en' ? 'Girls' : 'ছাত্রী'}:{' '}
                    <strong>{formatTableDigits(femaleCount, docLang)}</strong>
                  </span>
                  <span>
                    {docLang === 'en' ? 'Stipend' : 'উপবৃত্তিপ্রাপ্ত'}:{' '}
                    <strong>{formatTableDigits(stipendCount, docLang)}</strong>
                  </span>
                </div>
              )}

              {/* CONTINUOUS ZERO-GAP NATIVE PRINT TABLE */}
              <table className="student-continuous-table">
                <thead>
                  <tr style={theadRowStyle}>
                    {orderedColumns.map((col) => (
                      <th
                        key={col.key}
                        style={col.widthCss ? { width: col.widthCss } : undefined}
                        className={col.align === 'left' ? 'text-left' : 'text-center'}
                      >
                        {docLang === 'en' ? col.labelEn : col.labelBn}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.length === 0 ? (
                    <tr>
                      <td
                        colSpan={Math.max(1, orderedColumns.length)}
                        className="p-8 text-center text-slate-500 font-bold"
                      >
                        {docLang === 'en'
                          ? 'No students matched the active filters.'
                          : 'নির্বাচিত ফিল্টারে কোনো শিক্ষার্থী পাওয়া যায়নি।'}
                      </td>
                    </tr>
                  ) : (
                    students.map((st, idx) => {
                      const rowNum = idx + 1;
                      const shouldManualBreak =
                        rowsPerPage > 0 &&
                        rowNum < students.length &&
                        rowNum % rowsPerPage === 0;
                      const isZebra = styleConfig.zebraStripes && idx % 2 === 1;

                      return (
                        <tr
                          key={st.id || rowNum}
                          className={`${isZebra ? 'bg-slate-50/75' : 'bg-white'} ${
                            shouldManualBreak ? 'student-manual-row-break' : ''
                          }`}
                        >
                          {orderedColumns.map((col) => {
                            const isMono = [
                              'sl',
                              'roll',
                              'id',
                              'mobile',
                              'fatherNid',
                              'motherNid',
                              'birthRegNo',
                              'dob',
                            ].includes(col.key);
                            return (
                              <td
                                key={col.key}
                                className={`${
                                  col.align === 'left' ? 'text-left' : 'text-center'
                                } ${col.key === 'name' || col.key === 'roll' ? 'font-bold' : ''} ${
                                  isMono ? 'font-mono' : ''
                                } ${col.isSignature ? 'bg-white' : ''}`}
                              >
                                {formatOrderedCellValue(st, col.key, rowNum, docLang)}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </>
          )}

          {/* 3. ATOMIC CUSTOMIZABLE BOTTOM SIGNATURE BLOCK (Never splits across pages) */}
          {styleConfig.showBottomSignatures && enabledSignatories.length > 0 && (
            <div
              className={`student-signature-footer pt-12 pb-2 flex items-end gap-6 text-center text-xs font-bold text-black ${
                enabledSignatories.length === 1 ? 'justify-end' : 'justify-between'
              }`}
            >
              {enabledSignatories.map((slot) => (
                <div key={slot.id} className="space-y-1 min-w-[130px]">
                  <div className="w-36 sm:w-44 border-b border-black mx-auto" />
                  <p className={slot.isPrincipal ? 'font-black text-black' : 'font-bold text-slate-900'}>
                    {docLang === 'en'
                      ? slot.isPrincipal
                        ? header.principalTitle
                        : slot.labelEn
                      : slot.labelBn}
                  </p>
                  {slot.isPrincipal && (
                    <p className="text-[9px] font-bold text-slate-700">{header.schoolName}</p>
                  )}
                  {slot.showDateLine && (
                    <p className="text-[9px] font-normal text-slate-600">
                      {docLang === 'en' ? 'Date: ....................' : 'তারিখ: ....................'}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
