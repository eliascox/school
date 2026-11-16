'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  CreditCard, Printer, Search, CheckSquare, Square, Layers,
  ArrowLeft, Sliders, Sparkles, Users
} from 'lucide-react';
import { studentService, Student } from '@/services/studentService';
import { settingsService, SchoolSettings } from '@/services/settingsService';
import {
  StudentIdCardPreview,
  IdCardOrientation,
  IdCardSideMode,
  IdCardTheme,
} from '@/components/students/StudentIdCardPreview';

export default function StudentIdCardPrintPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [settings, setSettings] = useState<SchoolSettings | null>(null);

  const [gradeFilter, setGradeFilter] = useState<string>('6th');
  const [sectionFilter, setSectionFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Card Print Calibration
  const [orientation, setOrientation] = useState<IdCardOrientation>('portrait');
  const [sideMode, setSideMode] = useState<IdCardSideMode>('both');
  const [printTarget, setPrintTarget] = useState<'a4-grid' | 'cr80-pvc'>('a4-grid');
  const [bleedMm, setBleedMm] = useState<number>(2);
  const [showCropMarks, setShowCropMarks] = useState<boolean>(true);
  const [theme, setTheme] = useState<IdCardTheme>('indigo');
  const [sessionYear, setSessionYear] = useState<string>('2026');

  const loadData = useCallback(() => {
    const all = studentService.getAllStudents();
    setStudents(all);
    setSettings(settingsService.getSettings());
  }, []);

  useEffect(() => {
    loadData();
    const unsub = settingsService.subscribe((s) => setSettings({ ...s }));
    return () => unsub();
  }, [loadData]);

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return students
      .filter((s) => {
        if (gradeFilter !== 'all' && s.grade !== gradeFilter) return false;
        const sec = (s.section || s.branch || 'A').toLowerCase();
        if (sectionFilter !== 'all' && sec !== sectionFilter.toLowerCase()) return false;
        if (
          q &&
          !s.name.toLowerCase().includes(q) &&
          !String(s.roll).toLowerCase().includes(q) &&
          !String(s.id).toLowerCase().includes(q)
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => (parseInt(a.roll || '0', 10) || 0) - (parseInt(b.roll || '0', 10) || 0));
  }, [students, gradeFilter, sectionFilter, searchQuery]);

  const targetStudents = useMemo(() => {
    if (selectedIds.size === 0) return filteredStudents;
    return filteredStudents.filter((s) => selectedIds.has(s.id));
  }, [filteredStudents, selectedIds]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllFiltered = () => {
    if (selectedIds.size === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredStudents.map((s) => s.id)));
    }
  };

  const cr80PageCss =
    printTarget === 'cr80-pvc'
      ? orientation === 'portrait'
        ? '@page { size: 53.98mm 85.6mm; margin: 0; }'
        : '@page { size: 85.6mm 53.98mm; margin: 0; }'
      : '@page { size: A4 portrait; margin: 8mm; }';

  return (
    <div className="space-y-6 pb-12 print:p-0 print:m-0">
      <style jsx global>{`
        @media print {
          ${cr80PageCss}
          body {
            background: #ffffff !important;
          }
          ${
            printTarget === 'cr80-pvc'
              ? `.cr80-card-sheet { page-break-after: always; break-after: page; margin: 0 !important; }`
              : `.cr80-card-sheet { break-inside: avoid; page-break-inside: avoid; }`
          }
        }
      `}</style>

      {/* Header & Controls (Print Hidden) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link
                href="/dashboard/students"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                <ArrowLeft className="w-3 h-3" /> শিক্ষার্থী তালিকা
              </Link>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[11px] font-black">
                <CreditCard className="w-3.5 h-3.5" /> ISO CR80 (85.6mm × 53.98mm)
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              শিক্ষার্থী স্মার্ট PVC আইডি কার্ড বাল্ক প্রিন্ট
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              ডিজিটাল ভেরিফিকেশন QR কোড সহ A4 শিট অথবা সরাসরি সিঙ্গেল PVC কার্ড প্রিন্টারে প্রিন্ট করুন
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={selectAllFiltered}
              className="px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-black flex items-center gap-1.5 cursor-pointer"
            >
              {selectedIds.size > 0 && selectedIds.size === filteredStudents.length ? (
                <CheckSquare className="w-4 h-4 text-indigo-600" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              {selectedIds.size > 0 ? `নির্বাচিত (${selectedIds.size})` : `সব নির্বাচন (${filteredStudents.length})`}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              disabled={targetStudents.length === 0}
              className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              আইডি কার্ড প্রিন্ট ({targetStudents.length} জন)
            </button>
          </div>
        </div>

        {/* Filters & Calibration Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="block text-[10px] font-black text-slate-500 mb-1">শ্রেণি</label>
            <select
              value={gradeFilter}
              onChange={(e) => {
                setGradeFilter(e.target.value);
                setSelectedIds(new Set());
              }}
              className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"
            >
              <option value="all">সকল শ্রেণি</option>
              <option value="6th">৬ষ্ঠ শ্রেণি</option>
              <option value="7th">৭ম শ্রেণি</option>
              <option value="8th">৮ম শ্রেণি</option>
              <option value="9th">৯ম শ্রেণি</option>
              <option value="10th">১০ম শ্রেণি</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 mb-1">শাখা / বিভাগ</label>
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"
            >
              <option value="all">সকল</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
              <option value="Science">Science</option>
              <option value="Humanities">Humanities</option>
              <option value="Commerce">Commerce</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 mb-1">সার্চ (নাম/রোল)</label>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="খুঁজুন..."
              className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 mb-1">কার্ড ওরিয়েন্টেশন</label>
            <select
              value={orientation}
              onChange={(e) => setOrientation(e.target.value as IdCardOrientation)}
              className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"
            >
              <option value="portrait">লম্বালম্বি (Portrait)</option>
              <option value="landscape">আড়াআড়ি (Landscape)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 mb-1">পৃষ্ঠা মোড</label>
            <select
              value={sideMode}
              onChange={(e) => setSideMode(e.target.value as IdCardSideMode)}
              className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"
            >
              <option value="both">সামনে ও পেছনে (Both)</option>
              <option value="front">শুধু সামনের দিক</option>
              <option value="back">শুধু পেছনের দিক</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 mb-1">প্রিন্ট টার্গেট</label>
            <select
              value={printTarget}
              onChange={(e) => setPrintTarget(e.target.value as 'a4-grid' | 'cr80-pvc')}
              className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"
            >
              <option value="a4-grid">A4 মাল্টি-কার্ড শিট</option>
              <option value="cr80-pvc">সিঙ্গেল CR80 PVC প্রিন্টার</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 mb-1">রঙের থিম</label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as IdCardTheme)}
              className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"
            >
              <option value="indigo">নেভি-ইন্ডিগো</option>
              <option value="emerald">এমারেল্ড সবুজ</option>
              <option value="crimson">রয়্যাল ক্রিমসন</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 mb-1">ব্লিড গ্যাপ / সেশন</label>
            <div className="flex items-center gap-1.5">
              <select
                value={bleedMm}
                onChange={(e) => setBleedMm(Number(e.target.value))}
                className="w-1/2 px-2 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"
              >
                <option value={0}>0mm</option>
                <option value={2}>2mm</option>
                <option value={4}>4mm</option>
              </select>
              <input
                value={sessionYear}
                onChange={(e) => setSessionYear(e.target.value)}
                className="w-1/2 px-2 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Optional Student Quick Picker Chips */}
        {filteredStudents.length > 0 && (
          <div className="flex items-center justify-between pt-2 text-[11px] text-slate-500 dark:text-slate-400">
            <label className="inline-flex items-center gap-1.5 cursor-pointer font-bold">
              <input
                type="checkbox"
                checked={showCropMarks}
                onChange={(e) => setShowCropMarks(e.target.checked)}
                className="rounded"
              />
              কাটার সুবিধার্থে ড্যাশ বর্ডার (Crop Marks) দেখান
            </label>
            <span>
              কোনো কার্ডে ক্লিক করলে নির্দিষ্ট শিক্ষার্থী প্রিন্টের জন্য আলাদাভাবে নির্বাচন/বাদ দিতে পারবেন।
            </span>
          </div>
        )}
      </div>

      {/* Cards Render Grid */}
      {!settings ? null : targetStudents.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 print:hidden">
          <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-black text-slate-700 dark:text-slate-300">
            নির্বাচিত ফিল্টারে কোনো শিক্ষার্থী পাওয়া যায়নি
          </p>
        </div>
      ) : (
        <div
          style={{ gap: printTarget === 'a4-grid' ? `${bleedMm}mm` : '0px' }}
          className={
            printTarget === 'cr80-pvc'
              ? 'flex flex-col items-center gap-4 print:block print:gap-0'
              : 'flex flex-wrap items-start justify-center bg-slate-100/70 dark:bg-slate-950/60 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 print:bg-transparent print:border-0 print:p-0 print:justify-start'
          }
        >
          {targetStudents.map((st) => {
            const isPicked = selectedIds.has(st.id);
            return (
              <div
                key={st.id}
                onClick={() => toggleSelect(st.id)}
                className={`relative group cursor-pointer rounded-xl p-1 transition print:p-0 print:ring-0 ${
                  isPicked ? 'ring-2 ring-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30' : ''
                }`}
                title="সিলেক্ট/আনসিলেক্ট করতে ক্লিক করুন"
              >
                <StudentIdCardPreview
                  student={st}
                  settings={settings}
                  orientation={orientation}
                  sideMode={sideMode}
                  theme={theme}
                  sessionYear={sessionYear}
                  showCropMarks={showCropMarks}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
