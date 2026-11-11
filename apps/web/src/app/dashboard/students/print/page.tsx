'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { studentService } from '@/services/studentService';
import { sortStudentsGroupAndRoll } from '@/services/studentBulkImportEngine';
import { settingsService } from '@/services/settingsService';
import {
  GraduationCap,
  Printer,
  ArrowLeft,
  BarChart3,
  FileText,
  ChevronLeft,
  ChevronRight,
  Layers,
  Maximize2,
} from 'lucide-react';

// Bengali digit converter
const toBn = (n: number | string) => {
  const d = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(n).replace(/[0-9]/g, (c) => d[+c]);
};

type OrientationMode = 'portrait' | 'landscape';
type MarginPreset = 'normal' | 'wide' | 'compact';

const DEFAULT_COLUMNS: Record<string, boolean> = {
  sl: true,
  roll: true,
  id: false,
  name: true,
  gender: true,
  religion: false,
  grade: true,
  group: true,
  guardian: true,
  fatherNid: false,
  motherName: false,
  motherNid: false,
  mobile: true,
  optionalSubject: false,
  birthRegNo: false,
  dob: false,
  bloodGroup: false,
  address: false,
  stipend: false,
  remarks: true,
};

function PrintPageContent() {
  const searchParams = useSearchParams();
  const [ready, setReady] = useState(false);
  const [allStudentsList, setAllStudentsList] = useState<any[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [reportType, setReportType] = useState<'summary' | 'detailed'>('summary');
  const [orientation, setOrientation] = useState<OrientationMode>('portrait');
  const [marginPreset, setMarginPreset] = useState<MarginPreset>('normal');
  const [activeCols, setActiveCols] = useState<Record<string, boolean>>(DEFAULT_COLUMNS);
  const [currentSheetPage, setCurrentSheetPage] = useState<number>(1);
  const [viewAllSheets, setViewAllSheets] = useState<boolean>(true);

  const [filters, setFilters] = useState({
    grade: 'all',
    branch: 'all',
    group: 'all',
    gender: 'all',
    religion: 'all',
    q: '',
  });
  const [year, setYear] = useState('২০২৬');

  useEffect(() => {
    // 1. Load students
    const all = studentService.getAllStudents();
    setAllStudentsList(all);

    // 2. Load settings
    const storedSettings = settingsService.getSettings();
    setSettings(storedSettings);

    // Subscribe to settings for real-time cloud hydration
    const unsub = settingsService.subscribe((s) => {
      if (s) setSettings(s);
    });

    // 3. Read URL query params
    const tabParam = searchParams?.get('tab');
    const typeParam = searchParams?.get('type');
    const initialReport =
      tabParam === 'detailed' || typeParam === 'detailed' ? 'detailed' : 'summary';
    setReportType(initialReport);

    const orientationParam = searchParams?.get('orientation');
    if (orientationParam === 'landscape' || orientationParam === 'portrait') {
      setOrientation(orientationParam);
    } else {
      setOrientation(initialReport === 'detailed' ? 'landscape' : 'portrait');
    }

    const marginParam = searchParams?.get('margin');
    if (marginParam === 'normal' || marginParam === 'wide' || marginParam === 'compact') {
      setMarginPreset(marginParam);
    }

    const colsParam = searchParams?.get('cols');
    if (colsParam) {
      const colSet = new Set(colsParam.split(',').map((c) => c.trim()).filter(Boolean));
      if (colSet.size > 0) {
        const nextCols: Record<string, boolean> = {};
        Object.keys(DEFAULT_COLUMNS).forEach((k) => {
          nextCols[k] = colSet.has(k);
        });
        nextCols.sl = true;
        setActiveCols(nextCols);
      }
    }

    const grade = searchParams?.get('grade') || 'all';
    const branch = searchParams?.get('branch') || 'all';
    const group = searchParams?.get('group') || 'all';
    const gender = searchParams?.get('gender') || 'all';
    const religion = searchParams?.get('religion') || 'all';
    const q = (searchParams?.get('q') || '').trim();
    const yr = searchParams?.get('year') || '২০২৬';

    setFilters({ grade, branch, group, gender, religion, q });
    setYear(yr);

    // 4. Filter students
    const filtered = all.filter((st: any) => {
      const g = (st.grade || '').toLowerCase();
      const matchGrade =
        grade === 'all' ||
        g === grade.toLowerCase() ||
        (grade === '6th' && (g.includes('6') || g.includes('৬'))) ||
        (grade === '7th' && (g.includes('7') || g.includes('৭'))) ||
        (grade === '8th' && (g.includes('8') || g.includes('৮'))) ||
        (grade === '9th' && (g.includes('9') || g.includes('৯'))) ||
        (grade === '10th' && (g.includes('10') || g.includes('১০')));

      const matchBranch =
        branch === 'all' ||
        (st.branch && st.branch.toLowerCase() === branch.toLowerCase());

      const matchGroup =
        group === 'all' ||
        (st.group && st.group.includes(group));

      const matchGender =
        gender === 'all' ||
        (gender === 'পুরুষ' &&
          (st.gender?.includes('পুরুষ') ||
            st.gender?.includes('ছেলে') ||
            st.gender?.toLowerCase() === 'male')) ||
        (gender === 'মহিলা' &&
          (st.gender?.includes('মহিলা') ||
            st.gender?.includes('মেয়ে') ||
            st.gender?.toLowerCase() === 'female'));

      const matchReligion =
        religion === 'all' ||
        (st.religion && st.religion.includes(religion));

      const qLower = q.toLowerCase();
      const matchSearch =
        !qLower ||
        (st.name || '').toLowerCase().includes(qLower) ||
        String(st.roll || '').includes(qLower) ||
        (st.id || '').toLowerCase().includes(qLower) ||
        (st.guardian || st.fatherName || '').toLowerCase().includes(qLower) ||
        (st.mobile || '').includes(qLower);

      return (
        matchGrade &&
        matchBranch &&
        matchGroup &&
        matchGender &&
        matchReligion &&
        matchSearch
      );
    });

    // 🌟 Group-wise and Roll-wise sorting: ছোট থেকে বড় (১, ২, ৩...)
    setFilteredStudents(sortStudentsGroupAndRoll(filtered, 'roll_asc'));
    setReady(true);

    return () => unsub();
  }, [searchParams]);

  // Auto-trigger print once document is ready (unless disabled by user interaction)
  useEffect(() => {
    if (ready) {
      const timer = setTimeout(() => {
        window.print();
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [ready]);

  // ─────────────────────────────────────────────────────────────
  // 📊 CLASS & GROUP-WISE SUMMARY CALCULATION
  // ─────────────────────────────────────────────────────────────
  const classSummaryData = useMemo(() => {
    const standardSpecs = [
      { gradeKey: '6', gradeBn: '৬ষ্ঠ', group: '' },
      { gradeKey: '7', gradeBn: '৭ম', group: '' },
      { gradeKey: '8', gradeBn: '৮ম', group: '' },
      { gradeKey: '9_sci', gradeKeyNum: '9', gradeBn: '৯ম', group: 'বিজ্ঞান' },
      { gradeKey: '9_hum', gradeKeyNum: '9', gradeBn: '৯ম', group: 'মানবিক' },
      { gradeKey: '9_bs', gradeKeyNum: '9', gradeBn: '৯ম', group: 'ব্যবসায় শিক্ষা' },
      { gradeKey: '10_sci', gradeKeyNum: '10', gradeBn: '১০ম', group: 'বিজ্ঞান' },
      { gradeKey: '10_hum', gradeKeyNum: '10', gradeBn: '১০ম', group: 'মানবিক' },
      { gradeKey: '10_bs', gradeKeyNum: '10', gradeBn: '১০ম', group: 'ব্যবসায় শিক্ষা' },
    ];

    const baseList = allStudentsList;

    return standardSpecs.map((spec) => {
      const matched = baseList.filter((st) => {
        const g = (st.grade || '').toLowerCase();
        const grp = st.group || 'সাধারণ';

        let matchGrade = false;
        if (spec.gradeKey === '6') matchGrade = g.includes('6') || g.includes('৬');
        else if (spec.gradeKey === '7') matchGrade = g.includes('7') || g.includes('৭');
        else if (spec.gradeKey === '8') matchGrade = g.includes('8') || g.includes('৮');
        else if (spec.gradeKeyNum === '9') matchGrade = g.includes('9') || g.includes('৯');
        else if (spec.gradeKeyNum === '10') matchGrade = g.includes('10') || g.includes('১০');

        let matchGroup = false;
        if (spec.gradeKey === '6' || spec.gradeKey === '7' || spec.gradeKey === '8') {
          matchGroup = true;
        } else {
          if (spec.group === 'বিজ্ঞান')
            matchGroup = grp.includes('বিজ্ঞান') || grp.toLowerCase().includes('sci');
          else if (spec.group === 'মানবিক')
            matchGroup =
              grp.includes('মানবিক') ||
              grp.toLowerCase().includes('hum') ||
              grp.toLowerCase().includes('arts');
          else if (spec.group === 'ব্যবসায় শিক্ষা')
            matchGroup =
              grp.includes('ব্যবসায়') ||
              grp.includes('বাণিজ্য') ||
              grp.toLowerCase().includes('com') ||
              grp.toLowerCase().includes('bus');
        }

        return matchGrade && matchGroup;
      });

      const boys = matched.filter(
        (s) =>
          s.gender &&
          (s.gender.includes('পুরুষ') ||
            s.gender.includes('ছেলে') ||
            s.gender?.toLowerCase() === 'male')
      ).length;
      const girls = matched.filter(
        (s) =>
          s.gender &&
          (s.gender.includes('মহিলা') ||
            s.gender.includes('মেয়ে') ||
            s.gender?.toLowerCase() === 'female')
      ).length;
      const total = matched.length;

      return {
        grade: spec.gradeBn,
        group: spec.group,
        boys,
        girls,
        total,
      };
    });
  }, [allStudentsList]);

  const summaryTotalBoys = classSummaryData.reduce((sum, r) => sum + r.boys, 0);
  const summaryTotalGirls = classSummaryData.reduce((sum, r) => sum + r.girls, 0);
  const summaryGrandTotal = classSummaryData.reduce((sum, r) => sum + r.total, 0);

  const r6 = classSummaryData[0] || { boys: 0, girls: 0, total: 0 };
  const r7 = classSummaryData[1] || { boys: 0, girls: 0, total: 0 };
  const r8 = classSummaryData[2] || { boys: 0, girls: 0, total: 0 };
  const r9Sci = classSummaryData[3] || { boys: 0, girls: 0, total: 0 };
  const r9Hum = classSummaryData[4] || { boys: 0, girls: 0, total: 0 };
  const r9Bs = classSummaryData[5] || { boys: 0, girls: 0, total: 0 };
  const r10Sci = classSummaryData[6] || { boys: 0, girls: 0, total: 0 };
  const r10Hum = classSummaryData[7] || { boys: 0, girls: 0, total: 0 };
  const r10Bs = classSummaryData[8] || { boys: 0, girls: 0, total: 0 };

  const bnYear = toBn(year);

  // ─────────────────────────────────────────────────────────────
  // 📄 MULTI-PAGE A4 PAGINATION ENGINE FOR DETAILED STUDENT LIST
  // Ensures every printed page has exact margins, header, table header,
  // page numbering, and never splits a student row or signature block!
  // ─────────────────────────────────────────────────────────────
  const paginatedDetailedSheets = useMemo(() => {
    const firstPageMax = orientation === 'portrait' ? 24 : 15;
    const subsequentPageMax = orientation === 'portrait' ? 28 : 18;

    if (filteredStudents.length === 0) {
      return [{ pageNumber: 1, rows: [] as Array<{ student: any; globalIndex: number }> }];
    }

    const sheets: Array<{
      pageNumber: number;
      rows: Array<{ student: any; globalIndex: number }>;
    }> = [];

    let cursor = 0;
    let pageNum = 1;

    while (cursor < filteredStudents.length) {
      const limit = pageNum === 1 ? firstPageMax : subsequentPageMax;
      const chunk = filteredStudents.slice(cursor, cursor + limit).map((student, i) => ({
        student,
        globalIndex: cursor + i + 1,
      }));
      sheets.push({ pageNumber: pageNum, rows: chunk });
      cursor += limit;
      pageNum += 1;
    }

    return sheets;
  }, [filteredStudents, orientation]);

  const totalDetailedPages = paginatedDetailedSheets.length;

  useEffect(() => {
    setCurrentSheetPage(1);
  }, [orientation, reportType, filteredStudents.length]);

  const scrollToSheet = (pageNum: number) => {
    setCurrentSheetPage(pageNum);
    if (viewAllSheets && typeof document !== 'undefined') {
      const el = document.getElementById(`print-sheet-${pageNum}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  // Margin values for @page and on-screen/print sheet padding
  const marginConfig = useMemo(() => {
    if (marginPreset === 'wide') {
      return {
        pageMargin: '18mm 20mm',
        screenPadding: '20mm 22mm',
        printPadding: '6mm 6mm',
        label: 'প্রশস্ত মার্জিন (২০ মিমি)',
      };
    }
    if (marginPreset === 'compact') {
      return {
        pageMargin: '10mm 12mm',
        screenPadding: '12mm 14mm',
        printPadding: '3mm 3mm',
        label: 'কমপ্যাক্ট মার্জিন (১০ মিমি)',
      };
    }
    return {
      pageMargin: '14mm 16mm',
      screenPadding: '16mm 18mm',
      printPadding: '4mm 4mm',
      label: 'স্ট্যান্ডার্ড মার্জিন (১৫ মিমি)',
    };
  }, [marginPreset]);

  const gradeLabelBn =
    filters.grade === 'all'
      ? 'সকল শ্রেণি'
      : filters.grade === '6th'
      ? '৬ষ্ঠ শ্রেণি'
      : filters.grade === '7th'
      ? '৭ম শ্রেণি'
      : filters.grade === '8th'
      ? '৮ম শ্রেণি'
      : filters.grade === '9th'
      ? '৯ম শ্রেণি'
      : filters.grade === '10th'
      ? '১০ম শ্রেণি'
      : filters.grade;

  const maleCount = useMemo(
    () =>
      filteredStudents.filter(
        (s) =>
          s.gender &&
          (s.gender.includes('পুরুষ') ||
            s.gender.includes('ছেলে') ||
            s.gender?.toLowerCase() === 'male')
      ).length,
    [filteredStudents]
  );
  const femaleCount = useMemo(
    () =>
      filteredStudents.filter(
        (s) =>
          s.gender &&
          (s.gender.includes('মহিলা') ||
            s.gender.includes('মেয়ে') ||
            s.gender?.toLowerCase() === 'female')
      ).length,
    [filteredStudents]
  );

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent mx-auto mb-4" />
          <p className="text-sm font-bold text-slate-600">শিক্ষার্থী রিপোর্ট প্রস্তুত হচ্ছে…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ══════════════════════════════════════════════
          PRINT & SCREEN STYLES (PORTRAIT & LANDSCAPE + GUARANTEED MARGINS + MULTI-PAGE)
      ══════════════════════════════════════════════ */}
      <style>{`
        * { box-sizing: border-box; }

        @page {
          size: A4 ${orientation};
          margin: ${marginConfig.pageMargin};
        }

        body {
          margin: 0;
          padding: 0;
          background: #e2e8f0;
          font-family: 'SolaimanLipi', 'Kalpurush', 'Noto Sans Bengali', 'Hind Siliguri', 'Nikosh', 'Arial', sans-serif;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        /* ── A4 SHEET CONTAINER (DYNAMIC PORTRAIT / LANDSCAPE WITH GUARANTEED MARGINS) ── */
        .a4-print-sheet {
          width: ${orientation === 'landscape' ? '297mm' : '210mm'};
          min-height: ${orientation === 'landscape' ? '210mm' : '297mm'};
          margin: 24px auto;
          background: #ffffff;
          padding: ${marginConfig.screenPadding};
          box-shadow: 0 8px 30px rgba(15, 23, 42, 0.12);
          border: none;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-sizing: border-box;
          transition: width 0.2s ease, padding 0.2s ease;
        }

        /* ── SUMMARY TABLE STYLING ── */
        .official-summary-table {
          width: 100%;
          border-collapse: collapse;
          border: 1.5px solid #000000;
          text-align: center;
          background: #ffffff;
          margin-top: 10px;
        }

        .official-summary-table th {
          border: 1px solid #000000;
          padding: 7.5px 4px;
          font-size: 11pt;
          font-weight: 700;
          color: #000000;
          background: #ffffff;
        }

        .official-summary-table td {
          border: 1px solid #000000;
          padding: 7px 4px;
          font-size: 11pt;
          font-weight: 600;
          color: #000000;
        }

        /* ── DETAILED STUDENT TABLE STYLING ── */
        .official-detailed-table {
          width: 100%;
          border-collapse: collapse;
          border: 1.5px solid #000000;
          background: #ffffff;
        }

        .official-detailed-table thead {
          display: table-header-group !important;
        }

        .official-detailed-table tr {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }

        .official-detailed-table th {
          border: 1px solid #000000;
          padding: 6px 5px;
          font-size: 9.5pt;
          font-weight: 800;
          color: #000000;
          background: #f1f5f9 !important;
        }

        .official-detailed-table td {
          border: 1px solid #000000;
          padding: 5.5px 5px;
          font-size: 9.5pt;
          font-weight: 600;
          color: #000000;
          vertical-align: middle;
        }

        .signature-avoid-break {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }

        @media print {
          html, body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          /* Ensure all sheets are visible when printing even if single-page preview is active on screen */
          .a4-print-sheet {
            display: flex !important;
            width: 100% !important;
            min-height: calc(100vh - 4mm) !important;
            margin: 0 !important;
            padding: ${marginConfig.printPadding} !important;
            border: none !important;
            box-shadow: none !important;
          }
          .a4-sheet-page-break {
            page-break-after: always !important;
            break-after: page !important;
          }
          .official-summary-table {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      {/* ── NO-PRINT TOP CONTROL TOOLBAR ── */}
      <div className="no-print sticky top-0 z-50 bg-slate-900 text-white px-4 sm:px-6 py-3 shadow-xl border-b border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* Left: Back & Report Mode Switcher */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => {
                if (window.history.length > 1) {
                  window.history.back();
                } else {
                  window.location.href = '/dashboard/students?view=print';
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition cursor-pointer border border-slate-700"
            >
              <ArrowLeft size={14} /> ফিরে যান
            </button>

            {/* Report Mode Switcher Tabs */}
            <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                onClick={() => {
                  setReportType('summary');
                  setOrientation('portrait');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  reportType === 'summary'
                    ? 'bg-emerald-600 text-white shadow-xs font-black'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <BarChart3 size={14} />
                শ্রেণি ও বিভাগ সামারি
              </button>
              <button
                onClick={() => setReportType('detailed')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  reportType === 'detailed'
                    ? 'bg-indigo-600 text-white shadow-xs font-black'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <FileText size={14} />
                বিস্তারিত শিক্ষার্থী তালিকা ({toBn(filteredStudents.length)} জন)
              </button>
            </div>
          </div>

          {/* Center: Orientation & Margin Controls */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Portrait / Landscape Toggle */}
            <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                onClick={() => setOrientation('portrait')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  orientation === 'portrait'
                    ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                📄 পোর্ট্রেট (Portrait)
              </button>
              <button
                onClick={() => setOrientation('landscape')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  orientation === 'landscape'
                    ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                📜 ল্যান্ডস্কেপ (Landscape)
              </button>
            </div>

            {/* Page Margin Selector */}
            <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-700 text-xs">
              <Maximize2 size={13} className="text-emerald-400" />
              <span className="text-slate-400 font-bold">মার্জিন:</span>
              <select
                value={marginPreset}
                onChange={(e) => setMarginPreset(e.target.value as MarginPreset)}
                className="bg-slate-900 text-white font-bold text-xs px-2 py-0.5 rounded-lg border border-slate-700 outline-none cursor-pointer"
              >
                <option value="normal">স্ট্যান্ডার্ড (১৫ মিমি)</option>
                <option value="wide">প্রশস্ত (২০ মিমি)</option>
                <option value="compact">কমপ্যাক্ট (১০ মিমি)</option>
              </select>
            </div>
          </div>

          {/* Right: Print Action */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl shadow-lg transition active:scale-95 cursor-pointer"
            >
              <Printer size={15} /> প্রিন্ট / PDF সংরক্ষণ
            </button>
          </div>
        </div>

        {/* ── MULTI-PAGE NAVIGATION BAR (Shown when Detailed Report has pages) ── */}
        {reportType === 'detailed' && (
          <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-800/80 text-xs">
            <div className="flex items-center gap-2 text-slate-300 font-semibold">
              <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-amber-300 font-bold border border-slate-700">
                A4 {orientation === 'landscape' ? 'ল্যান্ডস্কেপ' : 'পোর্ট্রেট'} | মোট পৃষ্ঠা: {toBn(totalDetailedPages)} টি
              </span>
              <span className="hidden md:inline text-slate-400">
                • প্রতিটি পৃষ্ঠায় স্বয়ংক্রিয় মার্জিন ও টেবিল হেডার যুক্ত রয়েছে
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Toggle All Sheets vs Single Page Step */}
              {totalDetailedPages > 1 && (
                <button
                  onClick={() => setViewAllSheets(!viewAllSheets)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold border transition cursor-pointer ${
                    !viewAllSheets
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                  }`}
                >
                  <Layers size={13} />
                  {viewAllSheets ? 'এক পৃষ্ঠা করে দেখুন' : 'সব পৃষ্ঠা একসাথে দেখুন'}
                </button>
              )}

              {/* Page Stepper Buttons */}
              <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
                <button
                  onClick={() => scrollToSheet(Math.max(1, currentSheetPage - 1))}
                  disabled={currentSheetPage <= 1}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-700 disabled:opacity-40 text-white font-bold flex items-center gap-1 transition cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={13} /> পূর্ববর্তী পৃষ্ঠা
                </button>

                <div className="flex items-center gap-1 px-1">
                  {Array.from({ length: totalDetailedPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => scrollToSheet(p)}
                      className={`w-7 h-7 rounded-lg font-extrabold text-xs transition cursor-pointer ${
                        currentSheetPage === p
                          ? 'bg-amber-400 text-slate-950 shadow-xs'
                          : 'bg-slate-900/60 text-slate-300 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      {toBn(p)}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => scrollToSheet(Math.min(totalDetailedPages, currentSheetPage + 1))}
                  disabled={currentSheetPage >= totalDetailedPages}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-700 disabled:opacity-40 text-white font-bold flex items-center gap-1 transition cursor-pointer disabled:cursor-not-allowed"
                >
                  পরবর্তী পৃষ্ঠা <ChevronRight size={13} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════
          📄 VIEW 1: SUMMARY REPORT (SINGLE A4 SHEET, BORDERLESS, PROPER MARGINS)
      ══════════════════════════════════════════════ */}
      {reportType === 'summary' && (
        <div className="a4-print-sheet">
          <div>
            {/* 1. OFFICIAL INSTITUTION HEADER */}
            <div className="relative flex items-center justify-between pb-3 pt-1">
              <div className="w-16 h-16 shrink-0 flex items-center justify-center">
                {settings?.schoolLogo ? (
                  <img
                    src={settings.schoolLogo}
                    alt="School Logo"
                    className="w-16 h-16 object-contain"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-emerald-800 text-white border-2 border-emerald-600 flex items-center justify-center shadow-xs">
                    <GraduationCap className="w-8 h-8 text-amber-200" />
                  </div>
                )}
              </div>

              <div className="text-center flex-1 pr-16">
                <h1 className="text-2xl sm:text-[22pt] font-black text-slate-950 font-serif leading-tight">
                  {settings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়'}
                </h1>
                <p className="text-[11pt] font-bold text-slate-800 mt-1">
                  {settings?.address || 'বরইতলী , চকরিয়া , কক্সবাজার।'}
                </p>
                <p className="text-[9.5pt] font-semibold text-slate-700 mt-0.5">
                  EIIN: {settings?.eiin || '106184'} , স্থাপিত: {settings?.estdYear || '1969'} খ্রি .
                </p>
              </div>
            </div>

            <div className="w-full border-b-[1.5px] border-black my-2" />

            {/* Centered Document Subtitle */}
            <div className="text-center font-bold text-[13pt] my-3 text-slate-950 font-serif tracking-wide">
              {bnYear} সালের শিক্ষার্থী সংখ্যা
            </div>

            {/* Main Statistical Table */}
            <table className="official-summary-table">
              <thead>
                <tr>
                  <th style={{ width: '45px' }}>ক্র: নং:</th>
                  <th style={{ width: '70px' }}>শ্রেণি</th>
                  <th style={{ width: '130px' }}>বিভাগ</th>
                  <th style={{ width: '80px' }}>ছাত্র</th>
                  <th style={{ width: '80px' }}>ছাত্রী</th>
                  <th style={{ width: '80px' }}>মোট</th>
                  <th>মন্তব্য</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-mono">০১</td>
                  <td className="font-bold">৬ষ্ঠ</td>
                  <td></td>
                  <td className="font-mono font-bold">{toBn(r6.boys)}</td>
                  <td className="font-mono font-bold">{toBn(r6.girls)}</td>
                  <td className="font-mono font-bold">{toBn(r6.total)}</td>
                  <td rowSpan={10} style={{ width: '150px' }} className="align-middle text-xs text-slate-400"></td>
                </tr>
                <tr>
                  <td className="font-mono">০২</td>
                  <td className="font-bold">৭ম</td>
                  <td></td>
                  <td className="font-mono font-bold">{toBn(r7.boys)}</td>
                  <td className="font-mono font-bold">{toBn(r7.girls)}</td>
                  <td className="font-mono font-bold">{toBn(r7.total)}</td>
                </tr>
                <tr>
                  <td className="font-mono">০৩</td>
                  <td className="font-bold">৮ম</td>
                  <td></td>
                  <td className="font-mono font-bold">{toBn(r8.boys)}</td>
                  <td className="font-mono font-bold">{toBn(r8.girls)}</td>
                  <td className="font-mono font-bold">{toBn(r8.total)}</td>
                </tr>
                <tr>
                  <td rowSpan={3} className="font-mono align-middle">০৪</td>
                  <td rowSpan={3} className="font-bold align-middle">৯ম</td>
                  <td>বিজ্ঞান</td>
                  <td className="font-mono font-bold">{toBn(r9Sci.boys)}</td>
                  <td className="font-mono font-bold">{toBn(r9Sci.girls)}</td>
                  <td className="font-mono font-bold">{toBn(r9Sci.total)}</td>
                </tr>
                <tr>
                  <td>মানবিক</td>
                  <td className="font-mono font-bold">{toBn(r9Hum.boys)}</td>
                  <td className="font-mono font-bold">{toBn(r9Hum.girls)}</td>
                  <td className="font-mono font-bold">{toBn(r9Hum.total)}</td>
                </tr>
                <tr>
                  <td>ব্যবসায় শিক্ষা</td>
                  <td className="font-mono font-bold">{toBn(r9Bs.boys)}</td>
                  <td className="font-mono font-bold">{toBn(r9Bs.girls)}</td>
                  <td className="font-mono font-bold">{toBn(r9Bs.total)}</td>
                </tr>
                <tr>
                  <td rowSpan={3} className="font-mono align-middle">০৫</td>
                  <td rowSpan={3} className="font-bold align-middle">১০ম</td>
                  <td>বিজ্ঞান</td>
                  <td className="font-mono font-bold">{toBn(r10Sci.boys)}</td>
                  <td className="font-mono font-bold">{toBn(r10Sci.girls)}</td>
                  <td className="font-mono font-bold">{toBn(r10Sci.total)}</td>
                </tr>
                <tr>
                  <td>মানবিক</td>
                  <td className="font-mono font-bold">{toBn(r10Hum.boys)}</td>
                  <td className="font-mono font-bold">{toBn(r10Hum.girls)}</td>
                  <td className="font-mono font-bold">{toBn(r10Hum.total)}</td>
                </tr>
                <tr>
                  <td>ব্যবসায় শিক্ষা</td>
                  <td className="font-mono font-bold">{toBn(r10Bs.boys)}</td>
                  <td className="font-mono font-bold">{toBn(r10Bs.girls)}</td>
                  <td className="font-mono font-bold">{toBn(r10Bs.total)}</td>
                </tr>
                <tr style={{ borderTop: '2px solid black' }}>
                  <td colSpan={3} className="font-bold text-center">মোট</td>
                  <td className="font-mono font-bold">{toBn(summaryTotalBoys)}</td>
                  <td className="font-mono font-bold">{toBn(summaryTotalGirls)}</td>
                  <td className="font-mono font-bold">{toBn(summaryGrandTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Official Principal Signature */}
          <div className="signature-avoid-break pt-20 pb-4 flex justify-end text-center text-xs font-bold text-slate-900">
            <div className="space-y-1">
              <div className="w-52 border-b-[1.5px] border-slate-900 mx-auto"></div>
              <p className="font-extrabold text-slate-950 text-sm">প্রধান শিক্ষক</p>
              <p className="text-[10pt] text-slate-700 font-bold">
                {settings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়'}, {settings?.address?.split(' ')[1] || 'চকরিয়া'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          📄 VIEW 2: DETAILED STUDENT DIRECTORY (MULTI-PAGE A4 SHEETS WITH GUARANTEED MARGINS)
      ══════════════════════════════════════════════ */}
      {reportType === 'detailed' && (
        <div>
          {paginatedDetailedSheets.map((sheet, sheetIdx) => {
            const isFirstPage = sheet.pageNumber === 1;
            const isLastPage = sheet.pageNumber === totalDetailedPages;
            const hiddenOnScreen = !viewAllSheets && currentSheetPage !== sheet.pageNumber;

            return (
              <div
                key={sheet.pageNumber}
                id={`print-sheet-${sheet.pageNumber}`}
                style={hiddenOnScreen ? { display: 'none' } : undefined}
                className={`a4-print-sheet ${!isLastPage ? 'a4-sheet-page-break' : ''}`}
              >
                {/* TOP SECTION OF PAGE */}
                <div>
                  {/* Screen-Only Page Badge in Top-Right Corner */}
                  <div className="no-print flex items-center justify-between mb-2 pb-1.5 border-b border-dashed border-slate-200 text-[11px] font-bold text-slate-400">
                    <span>
                      📄 পৃষ্ঠা {toBn(sheet.pageNumber)} / {toBn(totalDetailedPages)} ({orientation === 'landscape' ? 'ল্যান্ডস্কেপ' : 'পোর্ট্রেট'})
                    </span>
                    <span>
                      ক্রম: {sheet.rows.length > 0 ? `${toBn(sheet.rows[0].globalIndex)} – ${toBn(sheet.rows[sheet.rows.length - 1].globalIndex)}` : '০'} (মোট {toBn(filteredStudents.length)} জন)
                    </span>
                  </div>

                  {isFirstPage ? (
                    /* ── PAGE 1: FULL OFFICIAL INSTITUTION HEADER ── */
                    <>
                      <div className="relative flex items-center justify-between pb-2.5 pt-0.5">
                        <div className="w-14 h-14 shrink-0 flex items-center justify-center">
                          {settings?.schoolLogo ? (
                            <img
                              src={settings.schoolLogo}
                              alt="School Logo"
                              className="w-14 h-14 object-contain"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-full bg-emerald-800 text-white border-2 border-emerald-600 flex items-center justify-center shadow-xs">
                              <GraduationCap className="w-7 h-7 text-amber-200" />
                            </div>
                          )}
                        </div>

                        <div className="text-center flex-1 pr-14">
                          <h1 className="text-xl sm:text-[20pt] font-black text-slate-950 font-serif leading-tight">
                            {settings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়'}
                          </h1>
                          <p className="text-[10.5pt] font-bold text-slate-800 mt-0.5">
                            {settings?.address || 'বরইতলী , চকরিয়া , কক্সবাজার।'}
                          </p>
                          <p className="text-[9pt] font-semibold text-slate-700">
                            EIIN: {settings?.eiin || '106184'} , স্থাপিত: {settings?.estdYear || '1969'} খ্রি .
                          </p>
                        </div>
                      </div>

                      <div className="w-full border-b-[1.5px] border-black my-1.5" />

                      {/* Report Title & Filter Meta Strip */}
                      <div className="flex flex-wrap items-center justify-between gap-2 my-2 text-[9.5pt] font-bold text-slate-900 bg-slate-50 px-3 py-1.5 border border-black">
                        <div>
                          শ্রেণি: <span className="font-extrabold">{gradeLabelBn}</span> | শাখা:{' '}
                          <span className="font-extrabold">
                            {filters.branch === 'all' ? 'সকল শাখা' : filters.branch}
                          </span>{' '}
                          | বিভাগ:{' '}
                          <span className="font-extrabold">
                            {filters.group === 'all' ? 'সকল বিভাগ' : filters.group}
                          </span>
                          {filters.religion !== 'all' && (
                            <>
                              {' '}
                              | ধর্ম: <span className="font-extrabold">{filters.religion}</span>
                            </>
                          )}
                          {filters.gender !== 'all' && (
                            <>
                              {' '}
                              | লিঙ্গ: <span className="font-extrabold">{filters.gender}</span>
                            </>
                          )}
                        </div>
                        <div className="text-center font-serif text-[11pt] font-black uppercase">
                          শিক্ষার্থী বিবরণী ও তালিকা — {bnYear}
                        </div>
                        <div>
                          মোট: <strong>{toBn(filteredStudents.length)} জন</strong> (ছাত্র: {toBn(maleCount)}, ছাত্রী: {toBn(femaleCount)})
                        </div>
                      </div>
                    </>
                  ) : (
                    /* ── PAGE 2+: COMPACT PROFESSIONAL CONTINUATION HEADER ── */
                    <div className="flex items-center justify-between border-b-[1.5px] border-black pb-2 mb-2.5 text-[9.5pt] font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-black text-[11pt] text-slate-950">
                          {settings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়'}
                        </span>
                        <span className="text-slate-500">|</span>
                        <span>শিক্ষার্থী তালিকা — {bnYear} (পূর্ববর্তী পৃষ্ঠার পর)</span>
                      </div>
                      <div>
                        শ্রেণি: <strong>{gradeLabelBn}</strong>
                        {filters.group !== 'all' ? ` | বিভাগ: ${filters.group}` : ''} | পৃষ্ঠা:{' '}
                        <strong>
                          {toBn(sheet.pageNumber)} / {toBn(totalDetailedPages)}
                        </strong>
                      </div>
                    </div>
                  )}

                  {/* STUDENT DATA TABLE FOR THIS SHEET */}
                  <table className="official-detailed-table">
                    <thead>
                      <tr>
                        {activeCols.sl && <th style={{ width: '36px' }} className="text-center">ক্র.</th>}
                        {activeCols.roll && <th style={{ width: '48px' }} className="text-center">রোল</th>}
                        {activeCols.id && <th style={{ width: '90px' }} className="text-center">আইডি</th>}
                        {activeCols.name && <th className="text-left">শিক্ষার্থীর নাম</th>}
                        {activeCols.gender && <th style={{ width: '52px' }} className="text-center">লিঙ্গ</th>}
                        {activeCols.religion && <th style={{ width: '60px' }} className="text-center">ধর্ম</th>}
                        {activeCols.grade && <th style={{ width: '76px' }} className="text-center">শ্রেণি ও শাখা</th>}
                        {activeCols.group && <th style={{ width: '85px' }} className="text-center">বিভাগ</th>}
                        {activeCols.guardian && <th className="text-left">পিতার নাম / অভিভাবক</th>}
                        {activeCols.fatherNid && <th className="text-center">পিতার NID</th>}
                        {activeCols.motherName && <th className="text-left">মাতার নাম</th>}
                        {activeCols.motherNid && <th className="text-center">মাতার NID</th>}
                        {activeCols.mobile && <th style={{ width: '98px' }} className="text-center">মোবাইল</th>}
                        {activeCols.optionalSubject && <th className="text-center">৪র্থ/ঐচ্ছিক বিষয়</th>}
                        {activeCols.birthRegNo && <th className="text-center">জন্ম নিবন্ধন</th>}
                        {activeCols.dob && <th className="text-center">জন্ম তারিখ</th>}
                        {activeCols.bloodGroup && <th style={{ width: '50px' }} className="text-center">রক্ত</th>}
                        {activeCols.address && <th className="text-left">ঠিকানা</th>}
                        {activeCols.stipend && <th style={{ width: '60px' }} className="text-center">উপবৃত্তি</th>}
                        {activeCols.remarks && <th style={{ width: '75px' }} className="text-center">মন্তব্য/স্বাক্ষর</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {sheet.rows.map(({ student: st, globalIndex }) => (
                        <tr key={st.id || globalIndex}>
                          {activeCols.sl && (
                            <td className="text-center font-mono">{toBn(globalIndex)}</td>
                          )}
                          {activeCols.roll && (
                            <td className="text-center font-mono font-bold">
                              {toBn(st.roll || globalIndex)}
                            </td>
                          )}
                          {activeCols.id && (
                            <td className="text-center font-mono text-[8.5pt]">{st.id}</td>
                          )}
                          {activeCols.name && (
                            <td className="font-bold text-left">{st.name}</td>
                          )}
                          {activeCols.gender && (
                            <td className="text-center">
                              {st.gender?.includes('পুরুষ') ||
                              st.gender?.includes('ছেলে') ||
                              st.gender?.toLowerCase() === 'male'
                                ? 'ছাত্র'
                                : 'ছাত্রী'}
                            </td>
                          )}
                          {activeCols.religion && (
                            <td className="text-center">{st.religion || 'ইসলাম'}</td>
                          )}
                          {activeCols.grade && (
                            <td className="text-center">
                              {st.grade} ({st.branch || 'A'})
                            </td>
                          )}
                          {activeCols.group && (
                            <td className="text-center">{st.group || 'সাধারণ'}</td>
                          )}
                          {activeCols.guardian && (
                            <td className="text-left">{st.guardian || st.fatherName || '—'}</td>
                          )}
                          {activeCols.fatherNid && (
                            <td className="text-center font-mono text-[8.5pt]">
                              {st.fatherNid || '—'}
                            </td>
                          )}
                          {activeCols.motherName && (
                            <td className="text-left">{st.motherName || '—'}</td>
                          )}
                          {activeCols.motherNid && (
                            <td className="text-center font-mono text-[8.5pt]">
                              {st.motherNid || '—'}
                            </td>
                          )}
                          {activeCols.mobile && (
                            <td className="text-center font-mono">{st.mobile || '—'}</td>
                          )}
                          {activeCols.optionalSubject && (
                            <td className="text-center">{st.optionalSubject || '—'}</td>
                          )}
                          {activeCols.birthRegNo && (
                            <td className="text-center font-mono text-[8.5pt]">
                              {st.birthRegNo || '—'}
                            </td>
                          )}
                          {activeCols.dob && (
                            <td className="text-center font-mono text-[8.5pt]">{st.dob || '—'}</td>
                          )}
                          {activeCols.bloodGroup && (
                            <td className="text-center font-bold">{st.bloodGroup || 'B+'}</td>
                          )}
                          {activeCols.address && (
                            <td className="text-left text-[8.5pt]">{st.currentAddress || '—'}</td>
                          )}
                          {activeCols.stipend && (
                            <td className="text-center">
                              {st.isStipend ? 'হ্যাঁ' : '—'}
                            </td>
                          )}
                          {activeCols.remarks && <td className="text-center"></td>}
                        </tr>
                      ))}

                      {sheet.rows.length === 0 && (
                        <tr>
                          <td colSpan={20} className="p-8 text-center text-slate-500 font-bold">
                            নির্বাচিত ফিল্টারে কোনো শিক্ষার্থী পাওয়া যায়নি।
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* BOTTOM SECTION OF PAGE (SIGNATURES ON LAST PAGE + CLEAN PAGE NUMBERING) */}
                <div className="signature-avoid-break pt-4">
                  {isLastPage ? (
                    <div className="pt-12 pb-2 flex justify-between items-end text-center text-xs font-bold text-slate-900">
                      <div className="space-y-1">
                        <div className="w-36 border-b border-slate-900 mx-auto"></div>
                        <p>শ্রেণি শিক্ষকের স্বাক্ষর</p>
                      </div>
                      <div className="space-y-1">
                        <div className="w-36 border-b border-slate-900 mx-auto"></div>
                        <p>সহকারী প্রধান শিক্ষক</p>
                      </div>
                      <div className="space-y-1">
                        <div className="w-48 border-b border-slate-900 mx-auto"></div>
                        <p className="font-extrabold text-slate-950">প্রধান শিক্ষক</p>
                        <p className="text-[9pt] text-slate-600 font-bold">
                          {settings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-3 flex items-center justify-between text-[9pt] font-bold text-slate-600">
                      <span>
                        চলমান তালিকা — পরবর্তী পৃষ্ঠায় ({toBn(sheet.pageNumber + 1)} নং পৃষ্ঠায়) দেখুন...
                      </span>
                      <span>অনুস্বাক্ষর: ..............................</span>
                    </div>
                  )}

                  {totalDetailedPages > 1 && (
                    <div className="pt-2 mt-1 border-t border-slate-300 flex items-center justify-between text-[8.5pt] font-semibold text-slate-600">
                      <span>{settings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়'} — অফিশিয়াল শিক্ষার্থী ডিরেক্টরি</span>
                      <span>
                        পৃষ্ঠা: <strong>{toBn(sheet.pageNumber)}</strong> / <strong>{toBn(totalDetailedPages)}</strong>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

export default function StudentPrintPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-white">
          <p className="text-sm font-bold text-slate-600">রিপোর্ট লোড হচ্ছে…</p>
        </div>
      }
    >
      <PrintPageContent />
    </Suspense>
  );
}
