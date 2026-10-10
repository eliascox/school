'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Award, 
  Users, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  TrendingUp, 
  Printer, 
  Download, 
  Plus, 
  GraduationCap, 
  Building2, 
  ShieldAlert, 
  Info, 
  DollarSign, 
  Check, 
  Pencil, 
  Trash2, 
  FileText, 
  ArrowLeft, 
  Calendar,
  Layers,
  Sparkles,
  SlidersHorizontal,
  RefreshCw
} from 'lucide-react';
import { studentService, Student } from '@/services/studentService';
import { settingsService, SchoolSettings } from '@/services/settingsService';
import { languageService, AppLanguage } from '@/services/languageService';

export interface StipendStudentItem extends Student {
  attRate: number;            // Attendance percentage (0-100)
  examScore: number;          // Exam score percentage (0-100)
  monthlyAmount: number;      // Monthly stipend allowance in BDT
  isEligible: boolean;        // Compliance flag (attRate >= 75% && examScore >= 45%)
  disqualifyReasons: string[];
}

const STIPEND_CATEGORIES = [
  { name: 'সাধারণ উপবৃত্তি', amount: 500, desc: 'সরকারি সাধারণ উপবৃত্তি সুবিধা' },
  { name: 'মেধাভিত্তিক উপবৃত্তি', amount: 1000, desc: 'পরীক্ষায় শীর্ষ ফলাফলের জন্য বিশেষ মেধা অনুদান' },
  { name: 'বিশেষ সহায়তা', amount: 1200, desc: 'আর্থিক অসচ্ছল ও প্রান্তিক শিক্ষার্থীদের বিশেষ সহায়তা' },
  { name: 'প্রতিবন্ধী উপবৃত্তি', amount: 1500, desc: 'বিশেষ চাহিদাসম্পন্ন শিক্ষার্থীদের উপবৃত্তি' },
  { name: 'অনগ্রসর/উপজাতি উপবৃত্তি', amount: 800, desc: 'অনগ্রসর ও নৃগোষ্ঠী শিক্ষার্থীদের শিক্ষা সহায়তা' },
];

const toBnDigit = (num: number | string | undefined | null): string => {
  if (num === undefined || num === null || num === '') return '';
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, (d) => bnDigits[parseInt(d, 10)]);
};

export default function StipendPage() {
  const [mounted, setMounted] = useState(false);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings | null>(null);
  const [currentLang, setCurrentLang] = useState<AppLanguage>('bn');

  // View state: 'list' for management dashboard, 'print_list' for printable sheet
  const [activeView, setActiveView] = useState<'list' | 'print_list'>('list');

  // Filters
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all'); // 'all' | 'eligible' | 'suspended'
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Print View Customization
  const [printOrientation, setPrintOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [printFontSize, setPrintFontSize] = useState<'xs' | 'sm' | 'base'>('xs');
  const [showPrintColumns, setShowPrintColumns] = useState<Record<string, boolean>>({
    sl: true,
    roll: true,
    id: true,
    name: true,
    grade: true,
    guardian: true,
    mobile: true,
    category: true,
    attendance: true,
    exam: true,
    amount: true,
    status: true,
    remarks: true,
  });

  // Modals
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editingStudent, setEditingStudent] = useState<StipendStudentItem | null>(null);

  // Form states for Add Candidate
  const [candidateStudentId, setCandidateStudentId] = useState<string>('');
  const [candidateCategory, setCandidateCategory] = useState<string>('সাধারণ উপবৃত্তি');

  // Alert
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = () => {
    const data = studentService.getAllStudents();
    setAllStudents(data);
    const settings = settingsService.getSettings();
    setSchoolSettings(settings);
  };

  useEffect(() => {
    setMounted(true);
    setCurrentLang(languageService.getLanguage());
    const unsubLang = languageService.subscribe(l => setCurrentLang(l));
    loadData();

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', loadData);
      return () => window.removeEventListener('storage', loadData);
    }
  }, []);

  // Process and compute compliance status for all students
  const processStipendStudent = (s: Student, idx: number): StipendStudentItem => {
    const attRate = s.attendance !== undefined ? s.attendance : (92 - (idx % 6) * 3);

    let examScore = 65;
    if (s.gpa) {
      const gpaNum = parseFloat(s.gpa);
      if (!isNaN(gpaNum)) {
        examScore = Math.min(100, Math.round(gpaNum * 20));
      }
    } else {
      examScore = 75 - (idx % 5) * 7;
    }
    if (s.examMarkAvg !== undefined) {
      examScore = s.examMarkAvg;
    }

    const category = s.stipendCategory || 'সাধারণ উপবৃত্তি';
    const catConfig = STIPEND_CATEGORIES.find(c => c.name === category);
    const monthlyAmount = catConfig ? catConfig.amount : 500;

    // Government Compliance Rules:
    // 1. Attendance >= 75%
    // 2. Exam marks >= 45%
    const disqualifyReasons: string[] = [];
    if (attRate < 75) {
      disqualifyReasons.push(`উপস্থিতি ${attRate}% (< ৭৫%)`);
    }
    if (examScore < 45) {
      disqualifyReasons.push(`প্রাপ্ত নম্বর ${examScore}% (< ৪৫%)`);
    }

    const isEligible = disqualifyReasons.length === 0;

    return {
      ...s,
      isStipend: s.isStipend ?? (idx % 3 === 0 || idx % 4 === 1),
      stipendCategory: category,
      attRate,
      examScore,
      monthlyAmount,
      isEligible,
      disqualifyReasons,
    };
  };

  const processedList: StipendStudentItem[] = useMemo(() => {
    return allStudents.map((s, idx) => processStipendStudent(s, idx));
  }, [allStudents]);

  // Filter only stipend beneficiaries
  const stipendBeneficiaries = useMemo(() => {
    return processedList.filter(s => s.isStipend);
  }, [processedList]);

  // Filtered beneficiaries based on user selections
  const filteredBeneficiaries = useMemo(() => {
    return stipendBeneficiaries.filter(s => {
      const matchGrade = selectedGrade === 'all' || s.grade === selectedGrade || (s.gradeBn && s.gradeBn.includes(selectedGrade));
      const sSec = s.section || s.branch || 'A';
      const matchSection = selectedSection === 'all' || sSec.toLowerCase() === selectedSection.toLowerCase();
      const matchCategory = selectedCategory === 'all' || s.stipendCategory === selectedCategory;
      const matchStatus = selectedStatus === 'all' || (selectedStatus === 'eligible' ? s.isEligible : !s.isEligible);
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        s.name.toLowerCase().includes(q) ||
        (s.roll || '').includes(q) ||
        (s.id || '').toLowerCase().includes(q) ||
        (s.mobile || '').includes(q) ||
        (s.guardian || s.fatherName || '').toLowerCase().includes(q);

      return matchGrade && matchSection && matchCategory && matchStatus && matchSearch;
    });
  }, [stipendBeneficiaries, selectedGrade, selectedSection, selectedCategory, selectedStatus, searchQuery]);

  // Statistics
  const totalCount = stipendBeneficiaries.length;
  const eligibleCount = stipendBeneficiaries.filter(s => s.isEligible).length;
  const suspendedCount = stipendBeneficiaries.filter(s => !s.isEligible).length;
  const totalMonthlyBudget = stipendBeneficiaries
    .filter(s => s.isEligible)
    .reduce((sum, s) => sum + s.monthlyAmount, 0);

  const avgAttendance = totalCount > 0 
    ? (stipendBeneficiaries.reduce((sum, s) => sum + s.attRate, 0) / totalCount).toFixed(1)
    : '0';

  // Toggle Stipend Status
  const handleToggleStipend = (studentId: string, currentStatus: boolean) => {
    const res = studentService.toggleStipendStatus(studentId, !currentStatus);
    if (res.success) {
      setAlertMsg({ type: 'success', text: res.message });
      loadData();
    } else {
      setAlertMsg({ type: 'error', text: res.message });
    }
    setTimeout(() => setAlertMsg(null), 4000);
  };

  // Add Candidate to Stipend
  const handleAddCandidate = () => {
    if (!candidateStudentId) {
      setAlertMsg({ type: 'error', text: 'অনুগ্রহ করে একজন শিক্ষার্থী নির্বাচন করুন!' });
      return;
    }
    const res = studentService.toggleStipendStatus(candidateStudentId, true, candidateCategory);
    if (res.success) {
      setAlertMsg({ type: 'success', text: 'শিক্ষার্থীকে সফলভাবে উপবৃত্তি তালিকায় যুক্ত করা হয়েছে!' });
      setShowAddModal(false);
      setCandidateStudentId('');
      loadData();
    } else {
      setAlertMsg({ type: 'error', text: res.message });
    }
    setTimeout(() => setAlertMsg(null), 4000);
  };

  // Update candidate category and save
  const handleSaveEdit = () => {
    if (!editingStudent) return;
    const res = studentService.toggleStipendStatus(editingStudent.id, true, editingStudent.stipendCategory);
    if (res.success) {
      setAlertMsg({ type: 'success', text: 'উপবৃত্তি তথ্য সফলভাবে আপডেট করা হয়েছে!' });
      setShowEditModal(false);
      setEditingStudent(null);
      loadData();
    } else {
      setAlertMsg({ type: 'error', text: res.message });
    }
    setTimeout(() => setAlertMsg(null), 4000);
  };

  // Non-stipend candidates list for add modal
  const nonStipendCandidates = useMemo(() => {
    return processedList.filter(s => !s.isStipend);
  }, [processedList]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['ক্রমিক', 'রোল', 'শিক্ষার্থী আইডি', 'শিক্ষার্থীর নাম', 'শ্রেণি ও শাখা', 'পিতা/অভিভাবক', 'মোবাইল', 'উপবৃত্তি ক্যাটাগরি', 'উপস্থিতি (%)', 'পরীক্ষার নম্বর (%)', 'মাসিক অনুদান (৳)', 'স্থিতি', 'মন্তব্য'];
    const rows = filteredBeneficiaries.map((st, idx) => [
      idx + 1,
      st.roll || '',
      st.id || '',
      st.name || '',
      `${st.gradeBn || st.grade} (${st.section || st.branch || 'A'})`,
      st.guardian || st.fatherName || '',
      st.mobile || '',
      st.stipendCategory || 'সাধারণ উপবৃত্তি',
      `${st.attRate}%`,
      `${st.examScore}%`,
      st.monthlyAmount,
      st.isEligible ? 'যোগ্য (সক্রিয়)' : `স্থগিত (${st.disqualifyReasons.join('; ')})`,
      ''
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stipend_students_list_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Trigger Print Directly
  const triggerPrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  if (!mounted) {
    return <div className="p-8 text-center text-slate-400 font-bold">উপবৃত্তি তথ্য লোড হচ্ছে...</div>;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🖨️ VIEW 2: DEDICATED INSTITUTIONAL PRINT SUITE (CLEAN TABLE & HEADER)
  // ═══════════════════════════════════════════════════════════════════════════
  if (activeView === 'print_list') {
    const gradeName = selectedGrade === 'all' ? 'সকল শ্রেণি' :
      selectedGrade === '6th' ? '৬ষ্ঠ শ্রেণি' :
      selectedGrade === '7th' ? '৭ম শ্রেণি' :
      selectedGrade === '8th' ? '৮ম শ্রেণি' :
      selectedGrade === '9th' ? '৯ম শ্রেণি' :
      selectedGrade === '10th' ? '১০ম শ্রেণি' : selectedGrade;

    return (
      <div className="min-h-screen bg-slate-100 p-2 sm:p-6 print:p-0 print:bg-white font-sans">
        
        {/* ─── SCREEN-ONLY TOP ACTION TOOLBAR ───────────────────────────────── */}
        <div className="max-w-[297mm] mx-auto mb-4 bg-slate-900 text-white p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg print:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveView('list')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer border border-slate-700"
            >
              <ArrowLeft size={14} /> ড্যাশবোর্ডে ফিরুন
            </button>

            <span className="px-2.5 py-1 bg-amber-500 text-slate-950 text-xs font-black rounded-lg flex items-center gap-1">
              <Printer size={14} /> উপবৃত্তি তালিকা প্রিন্ট প্রিভিউ
            </span>
          </div>

          {/* Controls: Orientation & Font Size */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <div className="flex items-center bg-slate-800 p-0.5 rounded-xl border border-slate-700">
              <button
                onClick={() => setPrintOrientation('landscape')}
                className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                  printOrientation === 'landscape' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:text-white'
                }`}
              >
                {currentLang === 'en' ? 'Landscape' : 'ল্যান্ডস্কেপ'}
              </button>
              <button
                onClick={() => setPrintOrientation('portrait')}
                className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                  printOrientation === 'portrait' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:text-white'
                }`}
              >
                {currentLang === 'en' ? 'Portrait' : 'পোর্ট্রেট'}
              </button>
            </div>

            <div className="flex items-center bg-slate-800 p-0.5 rounded-xl border border-slate-700">
              <button
                onClick={() => setPrintFontSize('xs')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  printFontSize === 'xs' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                ছোট
              </button>
              <button
                onClick={() => setPrintFontSize('sm')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  printFontSize === 'sm' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                মাঝারি
              </button>
              <button
                onClick={() => setPrintFontSize('base')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  printFontSize === 'base' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                বড়
              </button>
            </div>

            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl flex items-center gap-1 border border-slate-700 transition cursor-pointer"
            >
              <Download size={13} /> CSV
            </button>

            <button
              onClick={triggerPrint}
              className="px-5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl shadow transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Printer size={15} /> {currentLang === 'en' ? 'Print List' : 'প্রিন্ট করুন'}
            </button>
          </div>
        </div>

        {/* ─── PRINTABLE A4 DOCUMENT SHEET ──────────────────────────────────── */}
        <div 
          className={`stipend-print-document bg-white text-slate-950 p-6 sm:p-8 mx-auto shadow-2xl rounded-sm print:shadow-none print:p-0 print:m-0 print:w-full ${
            printOrientation === 'landscape' ? 'max-w-[297mm]' : 'max-w-[210mm]'
          }`}
          style={{
            fontFamily: "'Kalpurush', 'SolaimanLipi', 'Nikosh', 'Arial', sans-serif"
          }}
        >
          {/* ─── 1. INSTITUTIONAL HEADER (উপরে সুন্দর প্রাতিষ্ঠানিক হেডার) ───── */}
          <div className="border-b-2 border-slate-900 pb-3 mb-4 text-center relative">
            <div className="flex items-center justify-center gap-4">
              {schoolSettings?.schoolLogo && (
                <img 
                  src={schoolSettings.schoolLogo} 
                  alt="School Logo" 
                  className="w-14 h-14 object-contain shrink-0" 
                />
              )}
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                  {schoolSettings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়'}
                </h1>
                <p className="text-xs font-bold text-slate-700 mt-0.5">
                  {schoolSettings?.address || 'বরইতলী, চকরিয়া, কক্সবাজার।'}
                  {schoolSettings?.eiin && <span className="ml-2">| ইআইআইএন (EIIN): {toBnDigit(schoolSettings.eiin)}</span>}
                  {schoolSettings?.estdYear && <span className="ml-2">| স্থাপিত: {toBnDigit(schoolSettings.estdYear)} খ্রি.</span>}
                </p>
                <div className="inline-block mt-1 px-4 py-0.5 bg-slate-900 text-white rounded-md text-xs font-black uppercase tracking-wide print:bg-black print:text-white">
                  উপবৃত্তি প্রাপ্ত শিক্ষার্থীদের তালিকা — ২০২৬
                </div>
              </div>
            </div>

            {/* Sub-info Meta bar */}
            <div className="mt-3 pt-2 border-t border-slate-300 flex flex-wrap items-center justify-between text-[11px] font-bold text-slate-800">
              <div>
                <span>শ্রেণি: <strong>{gradeName}</strong></span>
                {selectedSection !== 'all' && <span className="ml-3">শাখা: <strong>{selectedSection}</strong></span>}
                {selectedCategory !== 'all' && <span className="ml-3">ক্যাটাগরি: <strong>{selectedCategory}</strong></span>}
                <span className="ml-3">সেশন: <strong>২০২৬</strong></span>
              </div>
              <div>
                <span>মোট উপবৃত্তিভোগী: <strong>{toBnDigit(filteredBeneficiaries.length)}</strong> জন</span>
                <span className="ml-2 text-emerald-800">যোগ্য: <strong>{toBnDigit(filteredBeneficiaries.filter(s => s.isEligible).length)}</strong> জন</span>
                {filteredBeneficiaries.some(s => !s.isEligible) && (
                  <span className="ml-2 text-rose-800">স্থগিত: <strong>{toBnDigit(filteredBeneficiaries.filter(s => !s.isEligible).length)}</strong> জন</span>
                )}
                <span className="ml-3">তারিখ: {new Date().toLocaleDateString('bn-BD')}</span>
              </div>
            </div>
          </div>

          {/* ─── 2. CLEAN & SIMPLE DATA TABLE (খুবই সাধারণ ও পরিচ্ছন্ন টেবিল) ─── */}
          <div className="overflow-x-auto">
            <table className={`w-full text-left border-collapse border border-slate-900 ${
              printFontSize === 'xs' ? 'text-[10px]' : printFontSize === 'sm' ? 'text-[11px]' : 'text-xs'
            }`}>
              <thead>
                <tr className="bg-slate-100 text-slate-950 font-black border-b border-slate-900 text-center uppercase">
                  {showPrintColumns.sl && <th className="p-1.5 border border-slate-900 w-8">ক্র.</th>}
                  {showPrintColumns.roll && <th className="p-1.5 border border-slate-900 w-12">রোল</th>}
                  {showPrintColumns.id && <th className="p-1.5 border border-slate-900 w-24">আইডি নং</th>}
                  {showPrintColumns.name && <th className="p-1.5 border border-slate-900 text-left">শিক্ষার্থীর নাম</th>}
                  {showPrintColumns.grade && <th className="p-1.5 border border-slate-900 w-20">শ্রেণি ও শাখা</th>}
                  {showPrintColumns.guardian && <th className="p-1.5 border border-slate-900 text-left">পিতা / অভিভাবকের নাম</th>}
                  {showPrintColumns.mobile && <th className="p-1.5 border border-slate-900 w-24">মোবাইল নং</th>}
                  {showPrintColumns.category && <th className="p-1.5 border border-slate-900">উপবৃত্তি ধরন</th>}
                  {showPrintColumns.attendance && <th className="p-1.5 border border-slate-900 w-14">উপস্থিতি</th>}
                  {showPrintColumns.exam && <th className="p-1.5 border border-slate-900 w-14">নম্বর</th>}
                  {showPrintColumns.amount && <th className="p-1.5 border border-slate-900 w-16">মাসিক হার</th>}
                  {showPrintColumns.status && <th className="p-1.5 border border-slate-900 w-20">বর্তমান স্থিতি</th>}
                  {showPrintColumns.remarks && <th className="p-1.5 border border-slate-900 w-24">স্বাক্ষর / মন্তব্য</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900 font-medium text-slate-900">
                {filteredBeneficiaries.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="p-6 text-center text-slate-500 font-bold border border-slate-900">
                      কোনো উপবৃত্তি প্রাপ্ত শিক্ষার্থীর তথ্য পাওয়া যায়নি।
                    </td>
                  </tr>
                ) : (
                  filteredBeneficiaries.map((st, idx) => (
                    <tr key={st.id} className={idx % 2 === 1 ? 'bg-slate-50/70 print:bg-transparent' : 'bg-white'}>
                      {showPrintColumns.sl && (
                        <td className="p-1.5 text-center font-mono border border-slate-900">
                          {toBnDigit(idx + 1)}
                        </td>
                      )}
                      {showPrintColumns.roll && (
                        <td className="p-1.5 text-center font-black border border-slate-900 font-mono">
                          {toBnDigit(st.roll || '-')}
                        </td>
                      )}
                      {showPrintColumns.id && (
                        <td className="p-1.5 text-center font-mono text-[9px] border border-slate-900">
                          {st.id}
                        </td>
                      )}
                      {showPrintColumns.name && (
                        <td className="p-1.5 font-bold border border-slate-900 whitespace-nowrap">
                          {st.name}
                        </td>
                      )}
                      {showPrintColumns.grade && (
                        <td className="p-1.5 text-center border border-slate-900 whitespace-nowrap font-bold">
                          {st.gradeBn || st.grade} ({st.section || st.branch || 'A'})
                        </td>
                      )}
                      {showPrintColumns.guardian && (
                        <td className="p-1.5 border border-slate-900 whitespace-nowrap">
                          {st.guardian || st.fatherName || '—'}
                        </td>
                      )}
                      {showPrintColumns.mobile && (
                        <td className="p-1.5 text-center font-mono text-[10px] border border-slate-900">
                          {st.mobile || '—'}
                        </td>
                      )}
                      {showPrintColumns.category && (
                        <td className="p-1.5 text-center border border-slate-900 font-bold">
                          {st.stipendCategory || 'সাধারণ উপবৃত্তি'}
                        </td>
                      )}
                      {showPrintColumns.attendance && (
                        <td className="p-1.5 text-center font-mono font-bold border border-slate-900">
                          {toBnDigit(st.attRate)}%
                        </td>
                      )}
                      {showPrintColumns.exam && (
                        <td className="p-1.5 text-center font-mono font-bold border border-slate-900">
                          {toBnDigit(st.examScore)}%
                        </td>
                      )}
                      {showPrintColumns.amount && (
                        <td className="p-1.5 text-center font-mono font-bold border border-slate-900">
                          {toBnDigit(st.monthlyAmount)}৳
                        </td>
                      )}
                      {showPrintColumns.status && (
                        <td className="p-1.5 text-center border border-slate-900 font-bold text-[9.5px]">
                          {st.isEligible ? (
                            <span className="text-emerald-950 font-black">সক্রিয়</span>
                          ) : (
                            <span className="text-rose-950 font-black">স্থগিত</span>
                          )}
                        </td>
                      )}
                      {showPrintColumns.remarks && (
                        <td className="p-1.5 text-center border border-slate-900">
                          {/* Blank for physical signature or stamp */}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ─── 3. SIGNATURE FOOTER ─────────────────────────────────────────── */}
          <div className="mt-14 pt-6 grid grid-cols-3 gap-4 text-center text-xs font-black text-slate-900 border-t border-slate-300 print:mt-16">
            <div>
              <div className="w-36 border-t border-slate-800 mx-auto mb-1.5"></div>
              <p>উপবৃত্তি দায়িত্বপ্রাপ্ত শিক্ষক</p>
            </div>
            <div>
              <div className="w-36 border-t border-slate-800 mx-auto mb-1.5"></div>
              <p>শ্রেণি শিক্ষকের স্বাক্ষর</p>
            </div>
            <div>
              <div className="w-36 border-t border-slate-800 mx-auto mb-1.5"></div>
              <p>{schoolSettings?.principalTitle || 'প্রধান শিক্ষক'}</p>
            </div>
          </div>

        </div>

        {/* ─── PRINT MEDIA CSS OVERRIDES ─────────────────────────────────────── */}
        <style jsx global>{`
          @media print {
            body {
              background: #fff !important;
              color: #000 !important;
            }
            .stipend-print-document {
              box-shadow: none !important;
              padding: 0 !important;
              margin: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
            }
            table {
              border-collapse: collapse !important;
              width: 100% !important;
            }
            th, td {
              border: 1px solid #000 !important;
            }
            nav, aside, header, .print\\:hidden {
              display: none !important;
            }
          }
        `}</style>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 📊 VIEW 1: INTERACTIVE STIPEND MANAGEMENT DASHBOARD
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6 pb-12 font-sans">
      
      {/* ALERT FEEDBACK NOTIFICATION */}
      {alertMsg && (
        <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-sm animate-in fade-in ${
          alertMsg.type === 'success' 
            ? 'bg-emerald-50 text-emerald-900 border-emerald-300' 
            : 'bg-rose-50 text-rose-900 border-rose-300'
        }`}>
          <div className="flex items-center gap-2">
            {alertMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-rose-600" />}
            <span>{alertMsg.text}</span>
          </div>
          <button onClick={() => setAlertMsg(null)} className="text-slate-400 hover:text-slate-700">✕</button>
        </div>
      )}

      {/* ─── TOP TOOLBAR & QUICK ACTIONS ────────────────────────────────────── */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        
        {/* Left: Quick overview badge */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-xs">
            <Award size={18} />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900">উপবৃত্তি ব্যবস্থাপনা ও মূল্যায়ন</h2>
            <p className="text-[11px] text-slate-500 font-semibold">৪৫% প্রাপ্ত নম্বর ও ৭৫% উপস্থিতি নীতিমালা অনুযায়ী</p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
          <button
            onClick={() => setActiveView('print_list')}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            title="উপবৃত্তি তালিকা প্রিন্ট প্রিভিউ"
          >
            <Printer size={14} className="text-amber-400" />
            তালিকা প্রিন্ট ও রিপোর্ট
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download size={13} />
            CSV এক্সপোর্ট
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs shadow-xs transition transform active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={15} />
            উপবৃত্তি শিক্ষার্থী যোগ
          </button>
        </div>
      </div>

      {/* ─── KPI METRIC CARDS ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Stipend Beneficiaries */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">মোট উপবৃত্তিভোগী</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
              <Award size={16} />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900 font-mono">{toBnDigit(totalCount)}</span>
            <span className="text-xs text-slate-500 font-bold ml-1">জন</span>
          </div>
          <div className="mt-1.5 pt-1.5 border-t border-slate-100 text-[11px] font-bold text-slate-500 flex items-center justify-between">
            <span>৬ষ্ঠ - ১০ম শ্রেণি</span>
            <span className="text-amber-700 font-mono">মাসিক {toBnDigit(totalMonthlyBudget)}৳</span>
          </div>
        </div>

        {/* Active Eligible */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">যোগ্য (উপবৃত্তি সক্রিয়)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-emerald-900 font-mono">{toBnDigit(eligibleCount)}</span>
            <span className="text-xs text-emerald-600 font-bold ml-1">জন</span>
          </div>
          <div className="mt-1.5 pt-1.5 border-t border-slate-100 text-[11px] font-bold text-emerald-700">
            উপস্থিতি ≥৭৫% ও নম্বর ≥৪৫%
          </div>
        </div>

        {/* Suspended / Unmet Criteria */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-rose-600 uppercase tracking-wider">স্থগিত (শর্ত অসম্পূর্ণ)</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-black">
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-rose-900 font-mono">{toBnDigit(suspendedCount)}</span>
            <span className="text-xs text-rose-600 font-bold ml-1">জন</span>
          </div>
          <div className="mt-1.5 pt-1.5 border-t border-slate-100 text-[11px] font-bold text-rose-700">
            উপস্থিতি &lt;৭৫% অথবা নম্বর &lt;৪৫%
          </div>
        </div>

        {/* Avg Attendance */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">গড় উপস্থিতি হার</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-indigo-900 font-mono">{toBnDigit(avgAttendance)}%</span>
          </div>
          <div className="mt-1.5 pt-1.5 border-t border-slate-100 text-[11px] font-bold text-indigo-600">
            উপবৃত্তিভোগীদের ক্লাসে গড় উপস্থিতি
          </div>
        </div>

      </div>

      {/* ─── GOVERNMENT COMPLIANCE RULES CARD ────────────────────────────────── */}
      <div className="bg-gradient-to-r from-amber-50 via-orange-50/60 to-amber-50 border border-amber-200/80 rounded-2xl p-4 shadow-xs space-y-2">
        <div className="flex items-center gap-2.5 text-amber-900">
          <div className="w-7 h-7 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-black shrink-0">
            <ShieldAlert size={15} />
          </div>
          <div>
            <h3 className="font-black text-xs">সরকারি উপবৃত্তি নীতিমালা ও স্বয়ংক্রিয় মূল্যায়ন শর্ত</h3>
            <p className="text-[11px] text-amber-800 font-medium">
              ১. পরীক্ষার প্রাপ্ত নম্বর ন্যূনতম ৪৫% এবং ২. ক্লাসে উপস্থিতি ন্যূনতম ৭৫% না থাকলে উপবৃত্তি স্বয়ংক্রিয়ভাবে স্থগিত গণ্য হয়।
            </p>
          </div>
        </div>
      </div>

      {/* ─── UNIFIED FILTER BAR ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-sm space-y-3">
        
        {/* Grade Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-black text-slate-400 uppercase mr-1 shrink-0">শ্রেণি:</span>
          {[
            { key: 'all', label: 'সকল শ্রেণি' },
            { key: '6th', label: '৬ষ্ঠ' },
            { key: '7th', label: '৭ম' },
            { key: '8th', label: '৮ম' },
            { key: '9th', label: '৯ম' },
            { key: '10th', label: '১০ম' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedGrade(tab.key)}
              className={`px-3 py-1.5 rounded-xl font-black text-xs transition cursor-pointer shrink-0 ${
                selectedGrade === tab.key
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {tab.label} {tab.key !== 'all' && 'শ্রেণি'}
            </button>
          ))}
        </div>

        {/* Section, Category, Status & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-1 border-t border-slate-100">
          
          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="নাম, আইডি, রোল বা মোবাইল..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 transition"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-bold text-slate-800 cursor-pointer"
            >
              <option value="all">সকল উপবৃত্তি ক্যাটাগরি</option>
              {STIPEND_CATEGORIES.map(c => (
                <option key={c.name} value={c.name}>{c.name} ({toBnDigit(c.amount)}৳)</option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-bold text-slate-800 cursor-pointer"
            >
              <option value="all">সকল স্থিতি (Active/Suspended)</option>
              <option value="eligible">✅ শুধু সক্রিয় (যোগ্য)</option>
              <option value="suspended">🚫 শুধু স্থগিত (অযোগ্য)</option>
            </select>
          </div>

        </div>

      </div>

      {/* ─── STIPEND BENEFICIARIES TABLE ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden space-y-3 p-4 sm:p-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Award className="text-indigo-600" size={18} />
            <h3 className="font-black text-slate-900 text-sm">
              উপবৃত্তি প্রাপ্ত শিক্ষার্থী তালিকা ({toBnDigit(filteredBeneficiaries.length)} জন)
            </h3>
          </div>

          <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 font-black text-xs rounded-full border border-indigo-100">
            বর্তমান প্রদর্শন: {toBnDigit(filteredBeneficiaries.length)} জন
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-sans">
            <thead>
              <tr className="bg-slate-100/90 text-slate-800 font-black uppercase text-[11px] border-b border-slate-200">
                <th className="p-3 w-12 text-center">রোল</th>
                <th className="p-3">শিক্ষার্থী আইডি ও নাম</th>
                <th className="p-3 text-center">শ্রেণি ও শাখা</th>
                <th className="p-3">উপবৃত্তি ধরন</th>
                <th className="p-3 text-center">উপস্থিতি (≥৭৫%)</th>
                <th className="p-3 text-center">প্রাপ্ত নম্বর (≥৪৫%)</th>
                <th className="p-3 text-center">মাসিক অনুদান</th>
                <th className="p-3 text-center">উপবৃত্তি স্থিতি</th>
                <th className="p-3 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filteredBeneficiaries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 font-bold">
                    কোনো উপবৃত্তি প্রাপ্ত শিক্ষার্থী পাওয়া যায়নি!
                  </td>
                </tr>
              ) : (
                filteredBeneficiaries.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/80 transition">
                    {/* Roll */}
                    <td className="p-3 text-center font-mono font-black text-slate-900 text-sm">
                      {st.roll || '-'}
                    </td>

                    {/* Name & ID */}
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-900 font-black text-xs flex items-center justify-center shrink-0">
                          {st.name.charAt(0)}
                        </div>
                        <div>
                          <strong className="font-extrabold text-slate-900 text-sm block">{st.name}</strong>
                          <span className="text-[11px] text-slate-400 font-mono">আইডি: {st.id} | {st.mobile || 'ফোন নেই'}</span>
                        </div>
                      </div>
                    </td>

                    {/* Grade & Section */}
                    <td className="p-3 text-center font-bold text-slate-700 whitespace-nowrap">
                      {st.gradeBn || st.grade} ({st.section || st.branch || 'A'})
                    </td>

                    {/* Category */}
                    <td className="p-3 font-bold text-slate-800">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded-md text-[11px] border border-slate-200">
                        {st.stipendCategory || 'সাধারণ উপবৃত্তি'}
                      </span>
                    </td>

                    {/* Attendance % */}
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-lg text-[11px] font-black inline-flex items-center gap-1 ${
                        st.attRate >= 75
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {st.attRate >= 75 ? <CheckCircle2 size={11} /> : <AlertTriangle size={11} />}
                        {st.attRate}%
                      </span>
                    </td>

                    {/* Exam Score % */}
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-lg text-[11px] font-black inline-flex items-center gap-1 ${
                        st.examScore >= 45
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {st.examScore >= 45 ? <CheckCircle2 size={11} /> : <AlertTriangle size={11} />}
                        {st.examScore}%
                      </span>
                    </td>

                    {/* Monthly Amount */}
                    <td className="p-3 text-center font-mono font-bold text-slate-900">
                      {toBnDigit(st.monthlyAmount)} ৳
                    </td>

                    {/* Eligibility Status */}
                    <td className="p-3 text-center">
                      {st.isEligible ? (
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-black text-[11px] inline-flex items-center gap-1">
                          <CheckCircle2 size={12} />
                          সক্রিয় (Active)
                        </span>
                      ) : (
                        <div className="space-y-0.5">
                          <span className="px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg font-black text-[10px] inline-flex items-center gap-1">
                            <XCircle size={11} />
                            স্থগিত (Suspended)
                          </span>
                          <div className="text-[10px] text-rose-600 font-bold">
                            {st.disqualifyReasons.join(' | ')}
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setEditingStudent(st);
                            setShowEditModal(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg border border-slate-200 transition cursor-pointer"
                          title="ক্যাটাগরি বা তথ্য পরিবর্তন করুন"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => handleToggleStipend(st.id, true)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition cursor-pointer"
                          title="উপবৃত্তি তালিকা থেকে বাদ দিন"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* ─── ADD STIPEND CANDIDATE MODAL ─────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                  <Award size={18} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">উপবৃত্তি শিক্ষার্থী যোগ করুন</h3>
                  <p className="text-xs text-slate-400 font-semibold">সাধারণ তালিকা থেকে শিক্ষার্থী নির্বাচন করুন</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase mb-1">
                  শিক্ষার্থী নির্বাচন করুন *
                </label>
                <select
                  value={candidateStudentId}
                  onChange={(e) => setCandidateStudentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-xs text-slate-900 focus:bg-white focus:border-indigo-500"
                >
                  <option value="">-- শিক্ষার্থী বেছে নিন ({nonStipendCandidates.length} জন উপলব্ধ) --</option>
                  {nonStipendCandidates.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} | {st.gradeBn || st.grade} ({st.section || st.branch || 'A'}) - রোল: {st.roll || '-'} (ID: {st.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase mb-1">
                  উপবৃত্তি ক্যাটাগরি
                </label>
                <select
                  value={candidateCategory}
                  onChange={(e) => setCandidateCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-xs text-slate-900"
                >
                  {STIPEND_CATEGORIES.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name} — মাসিক {toBnDigit(c.amount)}৳
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
              >
                বাতিল
              </button>
              <button
                onClick={handleAddCandidate}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs shadow-xs transition cursor-pointer"
              >
                যুক্ত করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── EDIT STIPEND CANDIDATE MODAL ────────────────────────────────────── */}
      {showEditModal && editingStudent && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-base">উপবৃত্তি তথ্য সম্পাদনা</h3>
              <button 
                onClick={() => setShowEditModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-[11px] font-bold text-slate-400">শিক্ষার্থী:</span>
                <p className="font-black text-slate-900 text-sm">{editingStudent.name} (রোল: {editingStudent.roll})</p>
                <p className="text-xs text-slate-500 font-mono">আইডি: {editingStudent.id}</p>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase mb-1">
                  উপবৃত্তি ক্যাটাগরি
                </label>
                <select
                  value={editingStudent.stipendCategory || 'সাধারণ উপবৃত্তি'}
                  onChange={(e) => setEditingStudent({
                    ...editingStudent,
                    stipendCategory: e.target.value
                  })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-xs text-slate-900"
                >
                  {STIPEND_CATEGORIES.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name} ({toBnDigit(c.amount)}৳)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
              >
                বাতিল
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs shadow-xs transition cursor-pointer"
              >
                সংরক্ষণ করুন
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
