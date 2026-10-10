'use client';

import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  ArrowLeft, 
  Building2, 
  Search, 
  Filter, 
  CheckCircle2, 
  Award, 
  BookOpen, 
  User, 
  School,
  Sparkles,
  FileCheck,
  ChevronDown,
  UserX,
  Upload,
  UserCheck
} from 'lucide-react';
import { settingsService } from '@/services/settingsService';
import { studentService } from '@/services/studentService';
import Link from 'next/link';
import {
  MarksheetSheetCard,
  generateStudentMarksheetData as calculateMarksheetData,
  getStudentsForClassSectionGroup,
  calculateGradeAndPoint,
  StudentProfile,
  SubjectMark
} from '@/components/OfficialMarksheetSheet';


export default function AcademicMarksheetPage() {
  const [mounted, setMounted] = useState(false);
  const [settings, setSettings] = useState(settingsService.getSettings());

  // Filter States
  const [selectedExam, setSelectedExam] = useState('অর্ধ-বার্ষিক পরীক্ষা ২০২৬');
  const [selectedGrade, setSelectedGrade] = useState('8th');
  const [selectedBranch, setSelectedBranch] = useState('A');
  const [selectedGroup, setSelectedGroup] = useState('বিজ্ঞান');
  const [selectedRoll, setSelectedRoll] = useState('01');
  const [searchQuery, setSearchQuery] = useState('');
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [marksheetLang, setMarksheetLang] = useState<'bn' | 'en'>('bn');

  // Border PNG upload state — stored in localStorage for persistence
  const [borderImageUrl, setBorderImageUrl] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sms_marksheet_border_png');
      const cleared = localStorage.getItem('sms_marksheet_border_cleared');
      if (saved) return saved;
      if (!cleared && settings?.customBorderPng) return settings.customBorderPng;
    }
    return '';
  });

  const handleBorderUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      if (url) {
        setBorderImageUrl(url);
        localStorage.setItem('sms_marksheet_border_png', url);
        localStorage.removeItem('sms_marksheet_border_cleared');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleBorderClear = () => {
    setBorderImageUrl('');
    localStorage.removeItem('sms_marksheet_border_png');
    localStorage.setItem('sms_marksheet_border_cleared', 'true');
  };

  useEffect(() => {
    setMounted(true);
    const unsub = settingsService.subscribe((s) => {
      setSettings(s);
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('sms_marksheet_border_png');
        const cleared = localStorage.getItem('sms_marksheet_border_cleared');
        if (!saved && !cleared && s?.customBorderPng) {
          setBorderImageUrl(s.customBorderPng);
        }
      }
    });
    return () => unsub();
  }, []);

  if (!mounted) {
    return <div className="p-8 text-center text-slate-400 font-bold">মার্কশিট লোড হচ্ছে...</div>;
  }

  // Grade Name Helper
  const gradeNameBn = selectedGrade === '6th' ? '৬ষ্ঠ শ্রেণি' : selectedGrade === '7th' ? '৭ম শ্রেণি' : selectedGrade === '8th' ? '৮ম শ্রেণি' : selectedGrade === '9th' ? '৯ম শ্রেণি' : '১০ম শ্রেণি';
  const isClass9or10 = selectedGrade === '9th' || selectedGrade === '10th';

  // Available Students List for current selection
  const classStudentsList = getStudentsForClassSectionGroup(selectedGrade, selectedBranch, selectedGroup);

  // Filter Students by Search Query
  const filteredStudents = classStudentsList.filter(s => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.roll.includes(q);
  });

  // Selected Single Student
  const currentStudent = filteredStudents.find(s => s.roll === selectedRoll) || filteredStudents[0] || classStudentsList[0];

  // Helper to generate marks breakdown for a student with Joint Pass Calculation Engine
  const generateStudentMarksheetData = (targetInput: StudentProfile | string) => {
    const targetStudent: StudentProfile = (typeof targetInput === 'object' && targetInput !== null)
      ? targetInput
      : (filteredStudents.find(s => s.roll === targetInput || String(s.roll) === String(targetInput)) || currentStudent || {
          id: 'empty',
          roll: '01',
          name: 'শিক্ষার্থী পাওয়া যায়নি',
          grade: selectedGrade,
          gradeBn: gradeNameBn,
          section: selectedBranch,
          group: selectedGroup,
          fatherName: 'পিতার নাম',
          motherName: 'মাতার নাম',
          session: '২০২৬',
          optionalSubject: 'কৃষি শিক্ষা'
        });

    return calculateMarksheetData(targetStudent, {
      selectedExam,
      selectedGrade,
      selectedBranch
    });
  };

  const currentMarksheetData = currentStudent ? generateStudentMarksheetData(currentStudent) : null;

  const handleTriggerBulkPrint = () => {
    if (!isBulkMode) {
      setIsBulkMode(true);
      setTimeout(() => {
        window.print();
      }, 350);
    } else {
      window.print();
    }
  };

  return (
    <div className="space-y-6 pb-12 print:p-0 print:m-0">
      
      {/* ═══════════════════════════════════════════ */}
      {/* FILTER & SELECTION CONTROLS (Hidden on Print) */}
      {/* ═══════════════════════════════════════════ */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-4 print:hidden">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <BookOpen size={18} className="text-indigo-600" />
              শ্রেণি ও রোল ভিত্তিক অফিশিয়াল মার্কশিট প্রিন্ট প্যানেল
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              বাংলা ১ম+২য় এবং ইংরেজি ১ম+২য় যৌথ পাস (Joint Pass) মোট নম্বর সমন্বয়ে ডাইনামিক জিপিএ হিসাব।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* View Mode Toggle */}
            <button
              onClick={() => setIsBulkMode(!isBulkMode)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition border flex items-center gap-1 ${
                isBulkMode 
                  ? 'bg-purple-100 text-purple-900 border-purple-300' 
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {isBulkMode ? `✓ বাল্ক ভিউ মোড (${filteredStudents.length} জন)` : `বাল্ক ভিউ মোড (${filteredStudents.length} জন)`}
            </button>

            {/* Official English Marksheet Badge */}
            <span
              className="px-3 py-1.5 rounded-xl font-bold text-xs border border-indigo-200 bg-indigo-50 text-indigo-700 flex items-center gap-1.5"
              title="অফিশিয়াল মার্কশীট সর্বদা শতভাগ ইংরেজিতে প্রস্তুত হয়"
            >
              🌐 অফিশিয়াল ইংলিশ ফরম্যাট
            </span>

            {/* PNG Border Upload Button */}
            <label className="relative cursor-pointer">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleBorderUpload}
              />
              <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition border ${
                borderImageUrl
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}>
                <Upload size={13} />
                {borderImageUrl ? '✓ বর্ডার সেট' : 'PNG বর্ডার'}
              </span>
            </label>
            {borderImageUrl && (
              <button
                onClick={handleBorderClear}
                title="বর্ডার সরান"
                className="px-2 py-1.5 rounded-xl font-bold text-xs border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition"
              >
                ✕ বর্ডার সরান
              </button>
            )}

            {/* Direct Bulk Print Button */}
            <button
              onClick={handleTriggerBulkPrint}
              disabled={filteredStudents.length === 0}
              className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-black text-xs shadow-md transition flex items-center gap-1.5 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              title="নির্বাচিত শ্রেণি ও শাখার সকল শিক্ষার্থীর মার্কশীট একসাথে প্রিন্ট করুন"
            >
              <Printer size={15} /> বাল্ক প্রিন্ট ({filteredStudents.length} জন একসাথে)
            </button>

            {/* Single Student Print Button */}
            {!isBulkMode && (
              <button
                onClick={() => window.print()}
                disabled={!currentStudent}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs shadow-md transition flex items-center gap-1.5 transform active:scale-95 disabled:opacity-50"
                title="কেবলমাত্র নির্বাচিত শিক্ষার্থীর একক মার্কশীট প্রিন্ট করুন"
              >
                <Printer size={15} /> একক প্রিন্ট (রোল: {currentStudent?.roll || '০১'})
              </button>
            )}
          </div>
        </div>

        {/* Dropdown & Search Filters Grid */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${isClass9or10 ? 'lg:grid-cols-6' : 'lg:grid-cols-5'} gap-3 text-xs font-bold`}>
          
          {/* Exam Filter */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">পরীক্ষা (Exam)</label>
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200 text-slate-900 font-bold"
            >
              <option value="অর্ধ-বার্ষিক পরীক্ষা ২০২৬">অর্ধ-বার্ষিক পরীক্ষা ২০২৬</option>
              <option value="বার্ষিক পরীক্ষা ২০২৬">বার্ষিক পরীক্ষা ২০২৬</option>
              <option value="এসএসসি প্রাক-নির্বাচনী ২০২৬">এসএসসি প্রাক-নির্বাচনী ২০২৬</option>
            </select>
          </div>

          {/* Class Filter */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">শ্রেণি (Class)</label>
            <select
              value={selectedGrade}
              onChange={(e) => {
                setSelectedGrade(e.target.value);
                setSelectedRoll('01');
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200 text-slate-900 font-bold"
            >
              <option value="6th">৬ষ্ঠ শ্রেণি (Class 6)</option>
              <option value="7th">৭ম শ্রেণি (Class 7)</option>
              <option value="8th">৮ম শ্রেণি (Class 8)</option>
              <option value="9th">৯ম শ্রেণি (Class 9)</option>
              <option value="10th">১০ম শ্রেণি (Class 10)</option>
            </select>
          </div>

          {/* Group Filter for Class 9 & 10 */}
          {isClass9or10 && (
            <div>
              <label className="block text-[10px] font-extrabold text-purple-700 uppercase mb-1">বিভাগ / গ্রুপ (Group) *</label>
              <select
                value={selectedGroup}
                onChange={(e) => {
                  setSelectedGroup(e.target.value);
                  setSelectedRoll('01');
                }}
                className="w-full px-3 py-2 bg-purple-50 border border-purple-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-200 text-purple-950 font-bold"
              >
                <option value="বিজ্ঞান">বিজ্ঞান (Science)</option>
                <option value="মানবিক">মানবিক (Humanities)</option>
                <option value="ব্যবসায় শিক্ষা">ব্যবসায় শিক্ষা (Commerce)</option>
              </select>
            </div>
          )}

          {/* Section Filter */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">শাখা / সেকশন (Section)</label>
            <select
              value={selectedBranch}
              onChange={(e) => {
                setSelectedBranch(e.target.value);
                setSelectedRoll('01');
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200 text-slate-900 font-bold"
            >
              <option value="A">Section A (ক শাখা)</option>
              <option value="B">Section B (খ শাখা)</option>
              <option value="C">Section C (গ শাখা)</option>
            </select>
          </div>

          {/* Search Filter */}
          <div>
            <label className="block text-[10px] font-extrabold text-indigo-600 uppercase mb-1">খোঁজ করুন (Search)</label>
            <div className="relative">
              <input
                type="text"
                placeholder="রোল বা শিক্ষার্থীর নাম..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-indigo-50/50 border border-indigo-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200 font-bold text-slate-900 placeholder:text-slate-400"
              />
              <Search className="absolute left-2.5 top-2.5 text-indigo-500" size={14} />
            </div>
          </div>

          {/* Roll / Student Selector */}
          <div>
            <label className="block text-[10px] font-extrabold text-indigo-600 uppercase mb-1">
              {isBulkMode ? `বাল্ক মোড (${filteredStudents.length} জন)` : 'রোল ও শিক্ষার্থী নির্বাচন *'}
            </label>
            <select
              disabled={isBulkMode || filteredStudents.length === 0}
              value={selectedRoll}
              onChange={(e) => setSelectedRoll(e.target.value)}
              className={`w-full px-3 py-2 border rounded-xl outline-none text-slate-900 font-bold ${
                isBulkMode ? 'bg-amber-50 border-amber-200 text-amber-900 cursor-not-allowed' : 'bg-indigo-50 border-indigo-200 focus:ring-2 focus:ring-indigo-200'
              }`}
            >
              {filteredStudents.length === 0 ? (
                <option value="">কোনো শিক্ষার্থী পাওয়া যায়নি</option>
              ) : (
                filteredStudents.map(st => (
                  <option key={st.id} value={st.roll}>
                    [রোল: {st.roll}] {st.name} ({st.optionalSubject})
                  </option>
                ))
              )}
            </select>
          </div>

        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* 📄 PRINTABLE MARKSHEET DOCUMENT CONTAINER (SINGLE OR BULK)        */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-4 shadow-sm print:hidden">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
            <UserX size={32} />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-900">এই শ্রেণি বা শাখায় কোনো শিক্ষার্থী পাওয়া যায়নি</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              বর্তমানে বেছে নেওয়া শ্রেণি ({gradeNameBn}) ও সেকশনে কোনো শিক্ষার্থী নিবন্ধিত নেই। অনুগ্রহ করে সেটিংস পেজ থেকে সিএসভি ফাইল আপলোড করুন অথবা নতুন শিক্ষার্থী ভর্তি করুন।
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <Link href="/dashboard/settings" className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-extrabold text-xs shadow-md transition">
              <Upload size={16} /> সেটিংসে যান ও বাল্ক আপলোড দিন
            </Link>
            <Link href="/dashboard/students" className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-extrabold text-xs transition">
              <UserCheck size={16} /> শিক্ষার্থী তালিকায় যান
            </Link>
          </div>
        </div>
      ) : isBulkMode ? (
        /* Bulk Print All Students in Selected Class & Branch */
        <div className="marksheet-bulk-container space-y-12 print:space-y-0 print:m-0 print:p-0 print:block">
          {filteredStudents.map((st) => (
            <MarksheetSheetCard 
              key={st.id || st.roll} 
              student={st} 
              settings={settings} 
              examName={selectedExam}
              data={generateStudentMarksheetData(st)}
              borderImageUrl={borderImageUrl}
              lang={marksheetLang}
            />
          ))}
        </div>
      ) : (
        /* Single Selected Student Marksheet */
        <MarksheetSheetCard 
          student={currentStudent} 
          settings={settings} 
          examName={selectedExam}
          data={currentMarksheetData || generateStudentMarksheetData(currentStudent)}
          borderImageUrl={borderImageUrl}
          lang={marksheetLang}
        />
      )}

      {/* 🖨️ PROFESSIONAL A4 PRINT & PDF EXPORT STYLES (0.5IN MARGINS ON ALL 4 SIDES & MULTI-PAGE BULK PRINT) */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait !important;
            margin: 0mm !important;
          }
          html, body {
            margin: 0mm !important;
            padding: 0mm !important;
            height: auto !important;
            min-height: 100% !important;
            overflow: visible !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .marksheet-bulk-container {
            display: block !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }
          .marksheet-card-wrapper {
            width: 210mm !important;
            min-height: 297mm !important;
            height: 297mm !important;
            max-height: 297mm !important;
            padding: 0.5in !important;
            box-sizing: border-box !important;
            margin: 0 auto !important;
            box-shadow: none !important;
            border: none !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            overflow: hidden !important;
          }
          .marksheet-card-wrapper:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
        }
      `}</style>

    </div>
  );
}
