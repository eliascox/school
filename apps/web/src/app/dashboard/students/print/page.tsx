'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { studentService } from '@/services/studentService';
import { settingsService } from '@/services/settingsService';
import { GraduationCap } from 'lucide-react';

// Bengali digit converter
const toBn = (n: number | string) => {
  const d = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
  return String(n).replace(/[0-9]/g, (c) => d[+c]);
};

function PrintPageContent() {
  const searchParams = useSearchParams();
  const [ready, setReady] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [filters, setFilters] = useState({
    grade: 'all',
    branch: 'all',
    group: 'all',
    gender: 'all',
    religion: 'all',
  });
  const [year, setYear] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    // Load students
    const allStudents = studentService.getAllStudents();

    // Load settings
    const stored = typeof window !== 'undefined' ? localStorage.getItem('sms_school_settings') : null;
    if (stored) {
      try { setSettings(JSON.parse(stored)); } catch {}
    }

    // Read URL filter params
    const grade = searchParams?.get('grade') || 'all';
    const branch = searchParams?.get('branch') || 'all';
    const group = searchParams?.get('group') || 'all';
    const gender = searchParams?.get('gender') || 'all';
    const religion = searchParams?.get('religion') || 'all';
    const yr = searchParams?.get('year') || new Date().getFullYear().toString();

    setFilters({ grade, branch, group, gender, religion });
    setYear(yr);

    // Apply filters
    const filtered = allStudents.filter((st: any) => {
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

    setStudents(filtered);
    setReady(true);
  }, []);

  // Auto-print once loaded
  useEffect(() => {
    if (ready && students.length > 0) {
      const timer = setTimeout(() => {
        window.print();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [ready]);

  const maleCount   = students.filter(s => s.gender?.includes('পুরুষ') || s.gender?.includes('ছেলে') || s.gender?.toLowerCase() === 'male').length;
  const femaleCount = students.filter(s => s.gender?.includes('মহিলা') || s.gender?.includes('মেয়ে') || s.gender?.toLowerCase() === 'female').length;
  const muslimCount = students.filter(s => s.religion?.includes('ইসলাম') || s.religion?.includes('Muslim')).length;
  const hinduCount  = students.filter(s => s.religion?.includes('হিন্দু') || s.religion?.includes('Hindu') || s.religion?.includes('সনাতন')).length;
  const otherReligionCount = Math.max(0, students.length - muslimCount - hinduCount);

  const gradeLabel = (g: string) => {
    if (g === '6th') return '৬ষ্ঠ শ্রেণি';
    if (g === '7th') return '৭ম শ্রেণি';
    if (g === '8th') return '৮ম শ্রেণি';
    if (g === '9th') return '৯ম শ্রেণি';
    if (g === '10th') return '১০ম শ্রেণি';
    return 'সকল শ্রেণি';
  };

  const bnYear = toBn(year);

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent mx-auto mb-4" />
          <p className="text-sm font-bold text-slate-600">শিক্ষার্থী তালিকা প্রস্তুত হচ্ছে…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ══════════════════════════════════════════════
          GLOBAL PRINT + SCREEN STYLES
      ══════════════════════════════════════════════ */}
      <style>{`
        * { box-sizing: border-box; }

        @font-face {
          font-family: 'SolaimanLipi';
          src: local('SolaimanLipi'), local('Kalpurush'), local('Mitra'), local('serif');
        }

        body {
          margin: 0;
          padding: 0;
          background: #e5e7eb;
          font-family: 'SolaimanLipi', 'Kalpurush', 'Noto Sans Bengali', 'Hind Siliguri', serif;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        /* ── A4 PAGE CONTAINER (screen preview) ── */
        .a4-page {
          width: 210mm;
          min-height: 297mm;
          margin: 24px auto;
          background: #ffffff;
          box-shadow: 0 4px 32px rgba(0,0,0,0.18);
          position: relative;
          display: flex;
          flex-direction: column;
        }

        /* ── DOUBLE-RULE OUTER BORDER ── */
        .outer-border {
          position: absolute;
          inset: 6mm;
          border: 2px solid #0a2558;
          pointer-events: none;
          z-index: 10;
        }
        .inner-border {
          position: absolute;
          inset: 8mm;
          border: 1px solid #3b82f6;
          pointer-events: none;
          z-index: 10;
        }

        /* ── INNER CONTENT PADDING ── */
        .page-content {
          padding: 12mm 14mm;
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        /* ── HEADER ── */
        .header {
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 2.5px double #0a2558;
          padding-bottom: 6px;
          margin-bottom: 6px;
        }
        .school-logo {
          width: 60px;
          height: 60px;
          object-fit: contain;
          flex-shrink: 0;
        }
        .logo-placeholder {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: #0a2558;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .header-text {
          flex: 1;
          text-align: center;
        }
        .school-name {
          font-size: 20pt;
          font-weight: 900;
          color: #0a2558;
          line-height: 1.1;
          letter-spacing: -0.5px;
        }
        .school-address {
          font-size: 9pt;
          color: #374151;
          margin-top: 2px;
          font-weight: 600;
        }
        .school-eiin {
          font-size: 8pt;
          color: #6b7280;
          margin-top: 2px;
        }

        /* ── REPORT TITLE BADGE ── */
        .title-badge {
          text-align: center;
          margin: 5px 0;
        }
        .title-badge span {
          display: inline-block;
          background: #0a2558;
          color: #fbbf24;
          font-size: 10pt;
          font-weight: 900;
          padding: 3px 20px;
          letter-spacing: 1px;
          border: 1px solid #fbbf24;
        }

        /* ── FILTER META INFO BAR ── */
        .meta-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 7.5pt;
          font-weight: 700;
          color: #374151;
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          padding: 3px 8px;
          margin: 4px 0;
        }

        /* ── STATS STRIP ── */
        .stats-strip {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 7.5pt;
          font-weight: 800;
          color: #0f172a;
          background: #dbeafe;
          border: 1px solid #93c5fd;
          padding: 3px 10px;
          margin-bottom: 6px;
        }
        .stats-strip strong { color: #1e40af; }

        /* ── STUDENT TABLE ── */
        .student-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 7.5pt;
          table-layout: auto;
          flex: 1;
        }
        .student-table thead th {
          background: #0a2558 !important;
          color: #ffffff !important;
          font-weight: 800;
          text-align: center;
          padding: 5px 4px;
          border: 1px solid #1e3a8a;
          font-size: 7pt;
          letter-spacing: 0.3px;
          white-space: nowrap;
        }
        .student-table tbody tr:nth-child(even) {
          background: #f1f5f9;
        }
        .student-table tbody tr:nth-child(odd) {
          background: #ffffff;
        }
        .student-table tbody tr:hover {
          background: #dbeafe;
        }
        .student-table tbody td {
          padding: 4px 4px;
          border: 1px solid #94a3b8;
          vertical-align: middle;
          color: #0f172a;
        }
        .td-sl   { text-align: center; font-weight: 800; width: 24px; font-variant-numeric: tabular-nums; }
        .td-roll { text-align: center; font-weight: 900; width: 30px; color: #0a2558; }
        .td-name { font-weight: 700; min-width: 90px; }
        .td-center { text-align: center; }
        .td-mobile { text-align: center; font-family: monospace; white-space: nowrap; }
        .td-sign { text-align: center; width: 50px; }

        /* ── SIGNATURE BLOCK ── */
        .signatures {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: 20px;
          padding-top: 8px;
        }
        .sig-block {
          text-align: center;
          min-width: 100px;
        }
        .sig-line {
          width: 120px;
          border-bottom: 1.5px solid #0f172a;
          margin: 0 auto 4px;
        }
        .sig-title {
          font-size: 8pt;
          font-weight: 800;
          color: #0f172a;
        }
        .sig-date {
          font-size: 7pt;
          color: #6b7280;
          margin-top: 2px;
        }

        /* ── FOOTER ── */
        .print-footer {
          border-top: 1px solid #94a3b8;
          padding-top: 4px;
          display: flex;
          justify-content: space-between;
          font-size: 6.5pt;
          color: #6b7280;
          font-family: monospace;
          margin-top: 8px;
        }

        /* ── PRINT-ONLY RESETS ── */
        @media print {
          html, body { background: white !important; margin: 0; padding: 0; }
          .a4-page {
            width: 100%;
            min-height: 100%;
            margin: 0;
            box-shadow: none;
          }
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }

          /* Ensure table rows don't split across pages */
          .student-table tbody tr {
            page-break-inside: avoid;
          }
          .student-table thead {
            display: table-header-group;
          }
        }

        @page {
          size: A4 portrait;
          margin: 0;
        }
      `}</style>

      {/* ── NO-PRINT TOP TOOLBAR ── */}
      <div className="no-print" style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: '#1e293b', color: 'white',
        padding: '10px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '13px', fontWeight: 800 }}>
            🖨️ প্রিন্ট প্রিভিউ — {gradeLabel(filters.grade)} শিক্ষার্থী তালিকা ({bnYear})
          </span>
          <span style={{
            background: '#10b981', color: 'white',
            borderRadius: '999px', padding: '2px 10px',
            fontSize: '11px', fontWeight: 700
          }}>
            {toBn(students.length)} জন
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => window.history.back()}
            style={{
              background: '#374151', color: 'white', border: 'none',
              borderRadius: '8px', padding: '7px 16px', fontSize: '12px',
              fontWeight: 700, cursor: 'pointer'
            }}
          >
            ← ফিরে যান
          </button>
          <button
            onClick={() => window.print()}
            style={{
              background: '#16a34a', color: 'white', border: 'none',
              borderRadius: '8px', padding: '7px 20px', fontSize: '12px',
              fontWeight: 800, cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(22,163,74,0.4)'
            }}
          >
            🖨️ প্রিন্ট / PDF সংরক্ষণ
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          A4 DOCUMENT BODY
      ══════════════════════════════════════════════ */}
      <div className="a4-page">
        {/* Double-rule border decoration */}
        <div className="outer-border" />
        <div className="inner-border" />

        <div className="page-content">

          {/* ── 1. INSTITUTIONAL HEADER ── */}
          <div className="header">
            {settings?.schoolLogo ? (
              <img src={settings.schoolLogo} alt="Logo" className="school-logo" />
            ) : (
              <div className="logo-placeholder">
                <GraduationCap size={32} color="#fbbf24" />
              </div>
            )}

            <div className="header-text">
              <div className="school-name">
                {settings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়'}
              </div>
              <div className="school-address">
                {settings?.address || 'বরইতলী, চকরিয়া, কক্সবাজার'}
              </div>
              <div className="school-eiin">
                EIIN: {settings?.eiin || '106184'} &nbsp;|&nbsp; স্থাপিত: {settings?.estdYear || '১৯৬৯'} খ্রি.
                {settings?.phone ? ` | ফোন: ${settings.phone}` : ''}
              </div>
            </div>
          </div>

          {/* ── 2. REPORT TITLE ── */}
          <div className="title-badge">
            <span>
              বর্তমান বছরের শিক্ষার্থী তালিকা ও সাধারণ বিবরণী — {bnYear} সাল
            </span>
          </div>

          {/* ── 3. META INFO BAR ── */}
          <div className="meta-bar">
            <span>
              শ্রেণি:&nbsp;<strong>{gradeLabel(filters.grade)}</strong>
              &nbsp;|&nbsp; শাখা:&nbsp;<strong>{filters.branch === 'all' ? 'সকল' : filters.branch}</strong>
              &nbsp;|&nbsp; বিভাগ:&nbsp;<strong>{filters.group === 'all' ? 'সকল' : filters.group}</strong>
              &nbsp;|&nbsp; ধর্ম:&nbsp;<strong>{filters.religion === 'all' ? 'সকল' : filters.religion}</strong>
              &nbsp;|&nbsp; লিঙ্গ:&nbsp;<strong>{filters.gender === 'all' ? 'সকল' : filters.gender}</strong>
            </span>
            <span>তারিখ: <strong>{new Date().toLocaleDateString('bn-BD')}</strong></span>
          </div>

          {/* ── 4. STATS STRIP ── */}
          <div className="stats-strip">
            <span>মোট শিক্ষার্থী: <strong>{toBn(students.length)} জন</strong></span>
            <span>ছাত্র: <strong>{toBn(maleCount)} জন</strong></span>
            <span>ছাত্রী: <strong>{toBn(femaleCount)} জন</strong></span>
            <span>মুসলিম: <strong>{toBn(muslimCount)} জন</strong></span>
            <span>হিন্দু: <strong>{toBn(hinduCount)} জন</strong></span>
            {otherReligionCount > 0 && <span>অন্যান্য: <strong>{toBn(otherReligionCount)} জন</strong></span>}
          </div>

          {/* ── 5. STUDENT TABLE ── */}
          <table className="student-table">
            <thead>
              <tr>
                <th style={{ width: '24px' }}>ক্র.</th>
                <th style={{ width: '30px' }}>রোল</th>
                <th>শিক্ষার্থীর নাম</th>
                <th style={{ width: '40px' }}>লিঙ্গ</th>
                <th style={{ width: '40px' }}>ধর্ম</th>
                <th style={{ width: '60px' }}>শ্রেণি ও শাখা</th>
                <th style={{ width: '55px' }}>বিভাগ</th>
                <th>পিতার নাম / অভিভাবক</th>
                <th style={{ width: '75px' }}>মোবাইল</th>
                <th style={{ width: '60px' }}>ঐচ্ছিক বিষয়</th>
                <th style={{ width: '50px' }}>স্বাক্ষর</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: '24px', color: '#6b7280', fontStyle: 'italic' }}>
                    নির্বাচিত ফিল্টারের ভিত্তিতে কোনো শিক্ষার্থী পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                students.map((st, idx) => (
                  <tr key={st.id || idx}>
                    <td className="td-sl">{toBn(idx + 1)}</td>
                    <td className="td-roll">{toBn(st.roll || (idx + 1))}</td>
                    <td className="td-name">{st.name}</td>
                    <td className="td-center" style={{ fontSize: '7pt' }}>
                      {st.gender?.includes('পুরুষ') || st.gender?.includes('ছেলে') || st.gender?.toLowerCase() === 'male' ? 'ছাত্র' : 'ছাত্রী'}
                    </td>
                    <td className="td-center" style={{ fontSize: '7pt' }}>{st.religion || 'ইসলাম'}</td>
                    <td className="td-center" style={{ fontWeight: 700 }}>
                      {st.grade} ({st.branch || st.section || 'A'})
                    </td>
                    <td className="td-center">{st.group || 'সাধারণ'}</td>
                    <td>{st.guardian || st.fatherName || '—'}</td>
                    <td className="td-mobile">{st.mobile || '—'}</td>
                    <td className="td-center" style={{ fontSize: '6.5pt' }}>
                      {st.optionalSubject || '—'}
                    </td>
                    <td className="td-sign"></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* ── 6. SIGNATURE BLOCK ── */}
          <div className="signatures">
            <div className="sig-block">
              <div className="sig-line" />
              <div className="sig-title">শ্রেণি শিক্ষকের স্বাক্ষর</div>
              <div className="sig-date">তারিখ: ....................</div>
            </div>
            <div className="sig-block">
              <div className="sig-line" />
              <div className="sig-title">সহকারী প্রধান শিক্ষক</div>
              <div className="sig-date">তারিখ: ....................</div>
            </div>
            <div className="sig-block">
              <div className="sig-line" style={{ width: '140px' }} />
              <div className="sig-title" style={{ fontSize: '9pt', fontWeight: 900 }}>প্রধান শিক্ষক</div>
              <div className="sig-date">
                {settings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়'}
              </div>
            </div>
          </div>

          {/* ── 7. FOOTER ── */}
          <div className="print-footer">
            <span>প্রিন্ট সময়: {new Date().toLocaleString('bn-BD')}</span>
            <span>মোট শিক্ষার্থী: {toBn(students.length)} জন</span>
            <span>EduPulse School Management System — Official Student Directory</span>
          </div>

        </div>
      </div>
    </>
  );
}

export default function StudentPrintPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'white' }}>
        <p style={{ fontSize: '14px', color: '#374151', fontWeight: 700 }}>তালিকা প্রস্তুত হচ্ছে…</p>
      </div>
    }>
      <PrintPageContent />
    </Suspense>
  );
}
