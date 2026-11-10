'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { studentService } from '@/services/studentService';
import { sortStudentsGroupAndRoll } from '@/services/studentBulkImportEngine';
import { settingsService } from '@/services/settingsService';
import { GraduationCap, Printer, ArrowLeft, BarChart3, FileText } from 'lucide-react';

// Bengali digit converter
const toBn = (n: number | string) => {
  const d = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
  return String(n).replace(/[0-9]/g, (c) => d[+c]);
};

function PrintPageContent() {
  const searchParams = useSearchParams();
  const [ready, setReady] = useState(false);
  const [allStudentsList, setAllStudentsList] = useState<any[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [reportType, setReportType] = useState<'summary' | 'detailed'>('summary');
  const [filters, setFilters] = useState({
    grade: 'all',
    branch: 'all',
    group: 'all',
    gender: 'all',
    religion: 'all',
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
    const initialReport = (tabParam === 'detailed' || typeParam === 'detailed') ? 'detailed' : 'summary';
    setReportType(initialReport);

    const grade = searchParams?.get('grade') || 'all';
    const branch = searchParams?.get('branch') || 'all';
    const group = searchParams?.get('group') || 'all';
    const gender = searchParams?.get('gender') || 'all';
    const religion = searchParams?.get('religion') || 'all';
    const yr = searchParams?.get('year') || '২০২৬';

    setFilters({ grade, branch, group, gender, religion });
    setYear(yr);

    // 4. Filter students
    const filtered = all.filter((st: any) => {
      const g = (st.grade || '').toLowerCase();
      const matchGrade =
        grade === 'all' ||
        g === grade.toLowerCase() ||
        (grade === '6th'  && (g.includes('6')  || g.includes('৬'))) ||
        (grade === '7th'  && (g.includes('7')  || g.includes('৭'))) ||
        (grade === '8th'  && (g.includes('8')  || g.includes('৮'))) ||
        (grade === '9th'  && (g.includes('9')  || g.includes('৯'))) ||
        (grade === '10th' && (g.includes('10') || g.includes('১০')));

      const matchBranch =
        branch === 'all' ||
        (st.branch && st.branch.toLowerCase() === branch.toLowerCase());

      const matchGroup =
        group === 'all' ||
        (st.group && st.group.includes(group));

      const matchGender =
        gender === 'all' ||
        (gender === 'পুরুষ' && (st.gender?.includes('পুরুষ') || st.gender?.includes('ছেলে') || st.gender?.toLowerCase() === 'male')) ||
        (gender === 'মহিলা' && (st.gender?.includes('মহিলা') || st.gender?.includes('মেয়ে') || st.gender?.toLowerCase() === 'female'));

      const matchReligion =
        religion === 'all' ||
        (st.religion && st.religion.includes(religion));

      return matchGrade && matchBranch && matchGroup && matchGender && matchReligion;
    });

    // 🌟 Group-wise and Roll-wise sorting: ছোট থেকে বড় (১, ২, ৩...)
    setFilteredStudents(sortStudentsGroupAndRoll(filtered, 'roll_asc'));
    setReady(true);

    return () => unsub();
  }, [searchParams]);

  // Auto-trigger print once document is ready
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

    return standardSpecs.map(spec => {
      const matched = baseList.filter(st => {
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
          if (spec.group === 'বিজ্ঞান') matchGroup = grp.includes('বিজ্ঞান') || grp.toLowerCase().includes('sci');
          else if (spec.group === 'মানবিক') matchGroup = grp.includes('মানবিক') || grp.toLowerCase().includes('hum') || grp.toLowerCase().includes('arts');
          else if (spec.group === 'ব্যবসায় শিক্ষা') matchGroup = grp.includes('ব্যবসায়') || grp.includes('বাণিজ্য') || grp.toLowerCase().includes('com') || grp.toLowerCase().includes('bus');
        }

        return matchGrade && matchGroup;
      });

      const boys = matched.filter(s => s.gender && (s.gender.includes('পুরুষ') || s.gender.includes('ছেলে') || s.gender?.toLowerCase() === 'male')).length;
      const girls = matched.filter(s => s.gender && (s.gender.includes('মহিলা') || s.gender.includes('মেয়ে') || s.gender?.toLowerCase() === 'female')).length;
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
          PRINT & SCREEN STYLES (A4 PORTRAIT WITH BORDER)
      ══════════════════════════════════════════════ */}
      <style>{`
        * { box-sizing: border-box; }

        @page {
          size: A4 portrait;
          margin: 8mm;
        }

        body {
          margin: 0;
          padding: 0;
          background: #f1f5f9;
          font-family: 'SolaimanLipi', 'Kalpurush', 'Noto Sans Bengali', 'Nikosh', 'Arial', sans-serif;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        /* ── A4 PORTRAIT PAGE CONTAINER ── */
        .a4-portrait-page {
          width: 210mm;
          min-height: 297mm;
          margin: 20px auto;
          background: #ffffff;
          padding: 12mm 15mm;
          box-shadow: 0 4px 24px rgba(0,0,0,0.12);
          position: relative;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
        }

        /* ── ELEGANT SIDE BORDER (ব্যবহারকারীর চাহিদামতো সাইডে বর্ডার) ── */
        .page-border-outer {
          position: absolute;
          inset: 5mm;
          border: 1.5px solid #000000;
          pointer-events: none;
          z-index: 10;
        }
        .page-border-inner {
          position: absolute;
          inset: 6.5mm;
          border: 0.8px solid #64748b;
          pointer-events: none;
          z-index: 10;
        }

        /* ── TABLE STYLING EXACTLY MATCHING USER SCREENSHOT ── */
        .official-summary-table {
          width: 100%;
          border-collapse: collapse;
          border: 1.5px solid #000000;
          text-align: center;
          background: #ffffff;
          margin-top: 8px;
        }

        .official-summary-table th {
          border: 1px solid #000000;
          padding: 7px 4px;
          font-size: 11pt;
          font-weight: 700;
          color: #000000;
          background: #ffffff;
        }

        .official-summary-table td {
          border: 1px solid #000000;
          padding: 6.5px 4px;
          font-size: 11pt;
          font-weight: 600;
          color: #000000;
        }

        .official-summary-table tr:hover {
          background-color: #f8fafc;
        }

        @media print {
          html, body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .a4-portrait-page {
            width: 100% !important;
            min-height: auto !important;
            margin: 0 !important;
            padding: 10mm 12mm !important;
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
          .official-summary-table {
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      {/* ── NO-PRINT TOP CONTROL TOOLBAR ── */}
      <div className="no-print sticky top-0 z-50 bg-slate-900 text-white px-5 py-3 shadow-xl flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <ArrowLeft size={14} /> ফিরে যান
          </button>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setReportType('summary')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                reportType === 'summary'
                  ? 'bg-emerald-600 text-white shadow-xs font-black'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <BarChart3 size={14} />
              শ্রেণি ও বিভাগ শিক্ষার্থী সংখ্যা (পোট্রেইট)
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
              বিস্তারিত শিক্ষার্থী তালিকা
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-300 font-bold hidden sm:inline">
            📄 A4 পোট্রেইট পেইজ | সর্বমোট শিক্ষার্থী: {toBn(allStudentsList.length)} জন
          </span>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl shadow-lg transition active:scale-95 cursor-pointer"
          >
            <Printer size={15} /> প্রিন্ট / PDF সংরক্ষণ
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          📄 OFFICIAL A4 PORTRAIT DOCUMENT
      ══════════════════════════════════════════════ */}
      <div className="a4-portrait-page">
        {/* Double-line Side Border as requested by user ("সাইডে বর্ডার থাকবে") */}
        <div className="page-border-outer" />
        <div className="page-border-inner" />

        <div className="relative z-10 flex flex-col h-full">

          {/* ── 1. OFFICIAL INSTITUTION HEADER (EXACTLY MATCHING USER SCREENSHOT) ── */}
          <div className="relative flex items-center justify-between pb-3 pt-1">
            
            {/* Top-Left School Logo */}
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

            {/* 03-Line Centered School Identity */}
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

          {/* Thin Horizontal Divider Line Matching Screenshot */}
          <div className="w-full border-b-[1.5px] border-black my-2" />

          {/* ── 2. VIEW 1: EXACT SUMMARY TABLE MATCHING USER SCREENSHOT ── */}
          {reportType === 'summary' ? (
            <div className="flex-1 flex flex-col justify-between">
              
              <div>
                {/* Centered Document Subtitle */}
                <div className="text-center font-bold text-[13pt] my-3 text-slate-950 font-serif tracking-wide">
                  {bnYear} সালের শিক্ষার্থী সংখ্যা
                </div>

                {/* Main Statistical Table with Exact Rowspan & Columns */}
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
                    {/* Row 1: Class 6 */}
                    <tr>
                      <td className="font-mono">০১</td>
                      <td className="font-bold">৬ষ্ঠ</td>
                      <td></td>
                      <td className="font-mono font-bold">{toBn(r6.boys)}</td>
                      <td className="font-mono font-bold">{toBn(r6.girls)}</td>
                      <td className="font-mono font-bold">{toBn(r6.total)}</td>
                      <td rowSpan={10} style={{ width: '150px' }} className="align-middle text-xs text-slate-400"></td>
                    </tr>

                    {/* Row 2: Class 7 */}
                    <tr>
                      <td className="font-mono">০২</td>
                      <td className="font-bold">৭ম</td>
                      <td></td>
                      <td className="font-mono font-bold">{toBn(r7.boys)}</td>
                      <td className="font-mono font-bold">{toBn(r7.girls)}</td>
                      <td className="font-mono font-bold">{toBn(r7.total)}</td>
                    </tr>

                    {/* Row 3: Class 8 */}
                    <tr>
                      <td className="font-mono">০৩</td>
                      <td className="font-bold">৮ম</td>
                      <td></td>
                      <td className="font-mono font-bold">{toBn(r8.boys)}</td>
                      <td className="font-mono font-bold">{toBn(r8.girls)}</td>
                      <td className="font-mono font-bold">{toBn(r8.total)}</td>
                    </tr>

                    {/* Row 4: Class 9 Science */}
                    <tr>
                      <td rowSpan={3} className="font-mono align-middle">০৪</td>
                      <td rowSpan={3} className="font-bold align-middle">৯ম</td>
                      <td>বিজ্ঞান</td>
                      <td className="font-mono font-bold">{toBn(r9Sci.boys)}</td>
                      <td className="font-mono font-bold">{toBn(r9Sci.girls)}</td>
                      <td className="font-mono font-bold">{toBn(r9Sci.total)}</td>
                    </tr>
                    {/* Row 5: Class 9 Humanities */}
                    <tr>
                      <td>মানবিক</td>
                      <td className="font-mono font-bold">{toBn(r9Hum.boys)}</td>
                      <td className="font-mono font-bold">{toBn(r9Hum.girls)}</td>
                      <td className="font-mono font-bold">{toBn(r9Hum.total)}</td>
                    </tr>
                    {/* Row 6: Class 9 Business Studies */}
                    <tr>
                      <td>ব্যবসায় শিক্ষা</td>
                      <td className="font-mono font-bold">{toBn(r9Bs.boys)}</td>
                      <td className="font-mono font-bold">{toBn(r9Bs.girls)}</td>
                      <td className="font-mono font-bold">{toBn(r9Bs.total)}</td>
                    </tr>

                    {/* Row 7: Class 10 Science */}
                    <tr>
                      <td rowSpan={3} className="font-mono align-middle">০৫</td>
                      <td rowSpan={3} className="font-bold align-middle">১০ম</td>
                      <td>বিজ্ঞান</td>
                      <td className="font-mono font-bold">{toBn(r10Sci.boys)}</td>
                      <td className="font-mono font-bold">{toBn(r10Sci.girls)}</td>
                      <td className="font-mono font-bold">{toBn(r10Sci.total)}</td>
                    </tr>
                    {/* Row 8: Class 10 Humanities */}
                    <tr>
                      <td>মানবিক</td>
                      <td className="font-mono font-bold">{toBn(r10Hum.boys)}</td>
                      <td className="font-mono font-bold">{toBn(r10Hum.girls)}</td>
                      <td className="font-mono font-bold">{toBn(r10Hum.total)}</td>
                    </tr>
                    {/* Row 9: Class 10 Business Studies */}
                    <tr>
                      <td>ব্যবসায় শিক্ষা</td>
                      <td className="font-mono font-bold">{toBn(r10Bs.boys)}</td>
                      <td className="font-mono font-bold">{toBn(r10Bs.girls)}</td>
                      <td className="font-mono font-bold">{toBn(r10Bs.total)}</td>
                    </tr>

                    {/* Row 10: Total */}
                    <tr style={{ borderTop: '2px solid black' }}>
                      <td colSpan={3} className="font-bold text-center">মোট</td>
                      <td className="font-mono font-bold">{toBn(summaryTotalBoys)}</td>
                      <td className="font-mono font-bold">{toBn(summaryTotalGirls)}</td>
                      <td className="font-mono font-bold">{toBn(summaryGrandTotal)}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* ── 3. SINGLE OFFICIAL PRINCIPAL SIGNATURE (MATCHING USER SCREENSHOT) ── */}
              <div className="pt-24 pb-6 flex justify-end text-center text-xs font-bold text-slate-900">
                <div className="space-y-1">
                  <div className="w-52 border-b-[1.5px] border-slate-900 mx-auto"></div>
                  <p className="font-extrabold text-slate-950 text-sm">প্রধান শিক্ষক</p>
                  <p className="text-[10pt] text-slate-700 font-bold">
                    {settings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়'}, {settings?.address?.split(' ')[1] || 'চকরিয়া'}
                  </p>
                </div>
              </div>

            </div>
          ) : (
            /* ── VIEW 2: DETAILED STUDENT DIRECTORY TABLE ── */
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <div className="text-center font-bold text-sm my-2 text-slate-950 font-serif">
                  শিক্ষার্থী বিবরণী ও তালিকা — {bnYear} সাল
                </div>
                <table className="w-full text-left text-[10pt] border-collapse border border-black">
                  <thead>
                    <tr className="bg-slate-100 text-black font-bold border border-black">
                      <th className="p-1.5 text-center w-8 border border-black">ক্র.</th>
                      <th className="p-1.5 text-center w-12 border border-black">রোল</th>
                      <th className="p-1.5 border border-black">শিক্ষার্থীর নাম</th>
                      <th className="p-1.5 text-center border border-black">লিঙ্গ</th>
                      <th className="p-1.5 text-center border border-black">শ্রেণি</th>
                      <th className="p-1.5 text-center border border-black">বিভাগ</th>
                      <th className="p-1.5 border border-black">পিতার নাম / অভিভাবক</th>
                      <th className="p-1.5 text-center border border-black">মোবাইল</th>
                      <th className="p-1.5 text-center w-16 border border-black">স্বাক্ষর</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((st, idx) => (
                      <tr key={st.id || idx}>
                        <td className="p-1.5 text-center font-mono border border-black">{toBn(idx + 1)}</td>
                        <td className="p-1.5 text-center font-mono font-bold border border-black">{toBn(st.roll || idx + 1)}</td>
                        <td className="p-1.5 font-bold border border-black">{st.name}</td>
                        <td className="p-1.5 text-center border border-black">
                          {st.gender?.includes('পুরুষ') || st.gender?.toLowerCase() === 'male' ? 'ছাত্র' : 'ছাত্রী'}
                        </td>
                        <td className="p-1.5 text-center border border-black">{st.grade} ({st.branch || 'A'})</td>
                        <td className="p-1.5 text-center border border-black">{st.group || 'সাধারণ'}</td>
                        <td className="p-1.5 border border-black">{st.guardian || st.fatherName || '—'}</td>
                        <td className="p-1.5 text-center font-mono border border-black">{st.mobile || '—'}</td>
                        <td className="p-1.5 border border-black text-center"></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Detailed Signatures */}
              <div className="pt-16 pb-4 flex justify-between items-end text-center text-xs font-bold text-slate-900">
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
                  <p className="text-[9pt] text-slate-600 font-bold">{settings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Printable Page Footer */}
          <div className="pt-2 border-t border-slate-400 flex justify-between text-[8pt] text-slate-600 font-mono">
            <span>প্রিন্ট সময়: {new Date().toLocaleString('bn-BD')}</span>
            <span>পৃষ্ঠা: ১ / ১</span>
            <span>School Management System — Official Summary Report</span>
          </div>

        </div>
      </div>
    </>
  );
}

export default function StudentPrintPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-white">
        <p className="text-sm font-bold text-slate-600">রিপোর্ট লোড হচ্ছে…</p>
      </div>
    }>
      <PrintPageContent />
    </Suspense>
  );
}
