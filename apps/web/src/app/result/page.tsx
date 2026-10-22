'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Search, 
  Printer, 
  Download, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  ArrowLeft, 
  BookOpen, 
  User, 
  GraduationCap, 
  ShieldCheck, 
  Award, 
  Hash, 
  TrendingUp, 
  FileText, 
  Lock, 
  ChevronDown, 
  Sparkles, 
  Home
} from 'lucide-react';
import Link from 'next/link';
import { settingsService } from '@/services/settingsService';
import { studentService } from '@/services/studentService';
import { examService, ExamItem } from '@/services/examService';
import {
  MarksheetSheetCard,
  generateStudentMarksheetData,
  getStudentsForClassSectionGroup,
  StudentProfile
} from '@/components/OfficialMarksheetSheet';

// ── Class Options (English Only) ──
const CLASS_OPTIONS = [
  { value: '6th', label: 'Class 6' },
  { value: '7th', label: 'Class 7' },
  { value: '8th', label: 'Class 8' },
  { value: '9th', label: 'Class 9' },
  { value: '10th', label: 'Class 10' },
];

// ── Group Options (English Only) ──
const GROUP_OPTIONS = [
  { value: 'Science', label: 'Science' },
  { value: 'Humanities', label: 'Humanities' },
  { value: 'Business Studies', label: 'Business Studies' },
  { value: 'General', label: 'General' },
];

// Helper to format class name
const formatClassName = (grade: string | undefined): string => {
  if (!grade) return 'Class 6';
  const num = grade.replace(/\D/g, '');
  if (num) return `Class ${num}`;
  if (grade.includes('6')) return 'Class 6';
  if (grade.includes('7')) return 'Class 7';
  if (grade.includes('8')) return 'Class 8';
  if (grade.includes('9')) return 'Class 9';
  if (grade.includes('10')) return 'Class 10';
  return grade;
};

// Helper to format group name
const formatGroupName = (group: string | undefined): string => {
  if (!group) return 'General';
  const g = group.trim();
  if (g.includes('বিজ্ঞান') || g.toLowerCase().includes('science')) return 'Science';
  if (g.includes('মানবিক') || g.toLowerCase().includes('humanities') || g.toLowerCase().includes('arts')) return 'Humanities';
  if (g.includes('ব্যবসায়') || g.includes('ব্যবসায়') || g.toLowerCase().includes('commerce') || g.toLowerCase().includes('business')) return 'Business Studies';
  if (g.includes('সাধারণ') || g.toLowerCase().includes('general')) return 'General';
  return g;
};

// Helper for English School Name
const getEnglishSchoolName = (name: string | undefined): string => {
  if (!name) return 'Baraitali High School';
  if (/[\u0980-\u09FF]/.test(name)) {
    if (name.includes('বরইতলী') || name.includes('বড়াইতলী')) {
      return 'Baraitali High School';
    }
    return name
      .replace(/উচ্চ\s*বিদ্যালয়|উচ্চ\s*বিদ্যালয়/g, 'High School')
      .replace(/মাধ্যমিক\s*বিদ্যালয়|মাধ্যমিক\s*বিদ্যালয়/g, 'Secondary School')
      .replace(/মডেল\s*স্কুল/g, 'Model School')
      .replace(/কলেজ/g, 'College')
      .replace(/মাদ্রাসা|মাদরাসা/g, 'Madrasah')
      .replace(/সরকারি/g, 'Govt.')
      .trim();
  }
  return name;
};

// Helper for English School Address
const getEnglishAddress = (addr: string | undefined): string => {
  if (!addr) return "Baraitoli, Chakaria, Cox's Bazar";
  if (/[\u0980-\u09FF]/.test(addr)) {
    if (addr.includes('বরইতলী') || addr.includes('চকরিয়া') || addr.includes('কক্সবাজার')) {
      return "Baraitoli, Chakaria, Cox's Bazar";
    }
  }
  return addr;
};

function ResultSearchContent() {
  const searchParams = useSearchParams();

  const [mounted, setMounted] = useState(false);
  const [settings, setSettings] = useState(settingsService.getSettings());

  // Dynamic Examination state
  const [activeExams, setActiveExams] = useState<ExamItem[]>([]);

  // Form States
  const [selectedExam, setSelectedExam] = useState<string>(
    searchParams.get('exam') || 'Annual Examination 2026'
  );
  const [selectedGrade, setSelectedGrade] = useState<string>(
    searchParams.get('grade') || '6th'
  );
  const [selectedGroup, setSelectedGroup] = useState<string>(
    searchParams.get('group') || 'Science'
  );
  const [rollInput, setRollInput] = useState<string>(
    searchParams.get('roll') || ''
  );

  // Border State
  const [borderImageUrl, setBorderImageUrl] = useState<string>('');

  // Result Search States
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [foundStudent, setFoundStudent] = useState<StudentProfile | null>(null);
  const [foundMarksheetData, setFoundMarksheetData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [searchSuccess, setSearchSuccess] = useState<boolean>(false);
  const [pdfHelpToast, setPdfHelpToast] = useState(false);

  // 1. Dynamic Examination Synchronization from Examination Management
  useEffect(() => {
    const loadExams = () => {
      const list = examService.getActiveExams();
      setActiveExams(list);
      if (list.length > 0) {
        setSelectedExam((prev) => {
          if (!prev) return list[0].title;
          const exists = list.some(
            (e) => e.title === prev || examService.formatExamNameForDisplay(e.title) === prev
          );
          return exists ? prev : list[0].title;
        });
      }
    };

    loadExams();
    const unsubExams = examService.subscribe(loadExams);
    const handleExamEvent = () => loadExams();
    window.addEventListener('sms_exam_setup_changed', handleExamEvent);
    window.addEventListener('storage', handleExamEvent);

    return () => {
      unsubExams();
      window.removeEventListener('sms_exam_setup_changed', handleExamEvent);
      window.removeEventListener('storage', handleExamEvent);
    };
  }, []);

  // 2. School Settings & Border Synchronization
  useEffect(() => {
    setMounted(true);
    const loadSettings = () => {
      const s = settingsService.getSettings();
      setSettings(s);

      // Auto-load custom PNG border if selected
      if (s.selectedBorderId && s.customBorders && s.customBorders.length > 0) {
        const found = s.customBorders.find((b) => b.id === s.selectedBorderId);
        if (found) {
          setBorderImageUrl(found.url);
        }
      } else if (s.customBorderPng) {
        setBorderImageUrl(s.customBorderPng);
      }
    };

    loadSettings();
    const unsub = settingsService.subscribe((s) => {
      setSettings(s);
      if (s.selectedBorderId && s.customBorders && s.customBorders.length > 0) {
        const found = s.customBorders.find((b) => b.id === s.selectedBorderId);
        if (found) {
          setBorderImageUrl(found.url);
        }
      } else if (s.customBorderPng) {
        setBorderImageUrl(s.customBorderPng);
      }
    });

    return () => unsub();
  }, []);

  // Logic: Only Class 9 and 10 have group selection; Class 6-8 have neither group nor section
  const isClass9or10 = selectedGrade === '9th' || selectedGrade === '10th';

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSearchSuccess(false);
    setHasSearched(true);
    setIsSearching(true);

    const cleanRoll = rollInput.trim();
    if (!cleanRoll) {
      setErrorMsg('Please enter a valid student roll number.');
      setFoundStudent(null);
      setFoundMarksheetData(null);
      setIsSearching(false);
      return;
    }

    // 0. Strict Publication Gate: Check if exam result is published
    const isExamPublished = examService.isExamResultPublished(selectedExam);
    if (!isExamPublished) {
      setFoundStudent(null);
      setFoundMarksheetData(null);
      setIsSearching(false);
      setErrorMsg('The results for this examination have not been published yet. Please check back later or contact school authorities.');
      return;
    }

    // 1. Load students for current selection (section 'all' so search works without section dropdown)
    const classStudents = getStudentsForClassSectionGroup(
      selectedGrade,
      'all',
      isClass9or10 ? selectedGroup : 'General'
    );

    const targetRollNum = parseInt(cleanRoll.replace(/\D/g, ''), 10);

    // 2. Match student by roll number
    let matched = classStudents.find((s) => {
      const sRollNum = parseInt(String(s.roll || '').replace(/\D/g, ''), 10);
      return sRollNum === targetRollNum || s.roll.trim() === cleanRoll;
    });

    // 3. Fallback: Search across all stored students
    if (!matched) {
      const all = studentService.getAllStudents();
      const globalMatch = all.find((s) => {
        const sGrade = (s.grade || s.gradeBn || '').trim();
        const sRollNum = parseInt(String(s.roll || '').replace(/\D/g, ''), 10);
        const isGradeMatch =
          sGrade === selectedGrade ||
          sGrade.includes(selectedGrade) ||
          (selectedGrade === '6th' && (sGrade.includes('6') || sGrade.includes('Six') || sGrade.includes('৬'))) ||
          (selectedGrade === '7th' && (sGrade.includes('7') || sGrade.includes('Seven') || sGrade.includes('৭'))) ||
          (selectedGrade === '8th' && (sGrade.includes('8') || sGrade.includes('Eight') || sGrade.includes('৮'))) ||
          (selectedGrade === '9th' && (sGrade.includes('9') || sGrade.includes('Nine') || sGrade.includes('৯'))) ||
          (selectedGrade === '10th' && (sGrade.includes('10') || sGrade.includes('Ten') || sGrade.includes('১০')));

        let isGroupMatch = true;
        if (isClass9or10) {
          const g = (s.group || '').toLowerCase();
          const selG = selectedGroup.toLowerCase();
          isGroupMatch = g === selG || g.includes(selG) ||
            (selG.includes('science') && (g.includes('science') || g.includes('বিজ্ঞান'))) ||
            (selG.includes('humanities') && (g.includes('humanities') || g.includes('মানবিক') || g.includes('arts'))) ||
            (selG.includes('business') && (g.includes('business') || g.includes('commerce') || g.includes('ব্যবসায়')));
        }

        return isGradeMatch && isGroupMatch && sRollNum === targetRollNum;
      });

      if (globalMatch) {
        matched = {
          id: globalMatch.id,
          roll: globalMatch.roll || cleanRoll,
          name: globalMatch.name,
          grade: selectedGrade,
          gradeBn: `Class ${selectedGrade.replace(/\D/g, '')}`,
          section: globalMatch.section || globalMatch.branch || 'A',
          group: isClass9or10 ? globalMatch.group || selectedGroup : 'General',
          fatherName: globalMatch.fatherName || (globalMatch as any).guardian || '',
          motherName: globalMatch.motherName || '',
          session: globalMatch.session || '2026',
          optionalSubject:
            globalMatch.optionalSubject ||
            (isClass9or10 && (globalMatch.group || selectedGroup).includes('বিজ্ঞান')
              ? 'Higher Mathematics'
              : 'Agricultural Studies'),
        };
      }
    }

    if (!matched) {
      setFoundStudent(null);
      setFoundMarksheetData(null);
      setErrorMsg('No student record found for the selected examination, class, and roll number. Please verify your details.');
      setIsSearching(false);
      return;
    }

    // 4. Calculate exact marksheet data using shared NCTB engine
    const marksData = generateStudentMarksheetData(matched, {
      selectedExam,
      selectedGrade,
      selectedBranch: matched.section || 'A',
    });

    setFoundStudent(matched);
    setFoundMarksheetData(marksData);
    setSearchSuccess(true);
    setIsSearching(false);

    // Smooth scroll to marksheet result dashboard
    setTimeout(() => {
      document.getElementById('result-dashboard-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  };

  const handlePrintResult = () => {
    window.print();
  };

  const handleDownloadReportCard = () => {
    setPdfHelpToast(true);
    setTimeout(() => {
      window.print();
    }, 400);
    setTimeout(() => {
      setPdfHelpToast(false);
    }, 6000);
  };

  const handleResetSearch = () => {
    setRollInput('');
    setFoundStudent(null);
    setFoundMarksheetData(null);
    setHasSearched(false);
    setErrorMsg('');
    setSearchSuccess(false);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-800">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium text-sm">Loading Result Portal...</p>
        </div>
      </div>
    );
  }

  // Check if selected exam is published online
  const isCurrentExamPublished = examService.isExamResultPublished(selectedExam);

  // Calculate statistics for performance summary
  const totalObtainedMarks = foundMarksheetData?.totalObtained ?? 0;
  const totalMaxMarks = foundMarksheetData?.totalFull ?? 0;
  const averagePercentage = totalMaxMarks > 0 
    ? ((totalObtainedMarks / totalMaxMarks) * 100).toFixed(1)
    : '0.0';
  const gpaScore = foundMarksheetData?.hasFailed 
    ? '0.00' 
    : (foundMarksheetData?.finalGPA !== undefined ? foundMarksheetData.finalGPA.toFixed(2) : '0.00');
  const isPassed = !foundMarksheetData?.hasFailed;
  const resultStatus = isPassed ? 'PASSED' : 'FAILED';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100/70 to-emerald-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans relative overflow-x-hidden selection:bg-emerald-500 selection:text-white print:bg-white print:text-black print:min-h-0 print:h-auto print:block print:p-0 print:m-0">
      
      {/* ── Ambient Soft Background Glow Elements (Under Frosted Glass) ── */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-400/10 dark:bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-40 right-10 w-[450px] h-[450px] bg-indigo-400/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 left-10 w-[500px] h-[500px] bg-amber-400/10 dark:bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-40" />

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* 🏛️ OFFICIAL INSTITUTION HEADER: Glassmorphic Nav (English) */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <header className="border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl sticky top-0 z-40 shadow-xs print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          
          {/* Left: School Identity */}
          <Link 
            href="/" 
            className="flex items-center gap-3 hover:opacity-90 transition-opacity cursor-pointer group shrink-0"
            title="Back to Home"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 p-0.5 shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform shrink-0">
              <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[14px] flex items-center justify-center overflow-hidden">
                {settings?.schoolLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={settings.schoolLogo} alt="School Logo" className="w-8 h-8 object-contain" />
                ) : (
                  <GraduationCap className="w-6 h-6 text-emerald-600" />
                )}
              </div>
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight leading-tight group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                {getEnglishSchoolName(settings?.schoolName)}
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
                {getEnglishAddress(settings?.address)} • EIIN: {settings?.eiin || '106184'}
              </p>
            </div>
          </Link>

          {/* Right: Navigation Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="text-xs font-bold px-3.5 py-2 rounded-xl bg-white/70 dark:bg-slate-800/70 hover:bg-slate-100 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition flex items-center gap-1.5 shadow-2xs"
            >
              <Home className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Home</span>
            </Link>

            <Link
              href="/login"
              className="text-xs font-bold px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5 active:scale-95"
              title="Student and Teacher Login"
            >
              <User className="w-3.5 h-3.5" />
              <span>Login</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* 🔍 HERO & SEARCH SECTION: Pure White Glassmorphism (English) */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 relative z-10 print:p-0 print:m-0 print:py-0 print:my-0 print:space-y-0 print:max-w-none print:w-full print:block">
        
        <div id="search-section" className="space-y-6 print:hidden">
          
          {/* Hero Titles */}
          <div className="text-center max-w-5xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-white/80 dark:bg-slate-800/80 backdrop-blur-md text-emerald-800 dark:text-emerald-300 border border-emerald-200/90 dark:border-emerald-800 shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>OFFICIAL RESULT PORTAL</span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[44px] font-black text-slate-900 dark:text-white tracking-tight leading-tight md:whitespace-nowrap">
              Online Examination Results &amp; <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 dark:from-emerald-400 dark:via-teal-300 dark:to-indigo-400 bg-clip-text text-transparent">Marksheet</span>
            </h2>
          </div>

          {/* ─── THE WHITE FROSTED GLASS SEARCH CARD ("এক লাইনে সকল কিছু") ─── */}
          <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-2xl border border-white/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-slate-200/60 dark:shadow-black/50 max-w-5xl mx-auto relative overflow-hidden ring-1 ring-slate-900/5">
            
            {/* Top Accent Gradient Bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600" />

            <form onSubmit={handleSearch} className="space-y-5">
              
              {/* Publication Status Banner (Glassy Box) */}
              {!isCurrentExamPublished ? (
                <div className="p-3.5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/90 dark:border-amber-700/60 text-amber-950 dark:text-amber-200 text-xs sm:text-sm flex items-start gap-3 shadow-xs">
                  <div className="w-7 h-7 rounded-xl bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-bold text-amber-900 dark:text-amber-200">Results Not Published Yet</p>
                    <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
                      Official results for this examination have not been published by the institution yet. Once published, students will be able to search and view their marksheets online.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200/90 dark:border-emerald-700/60 text-emerald-950 dark:text-emerald-200 text-xs sm:text-sm flex items-center gap-2.5 shadow-xs">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <span>Examination results are published and available online. Enter your roll number to view the result.</span>
                </div>
              )}

              {/* ── SINGLE ROW / ONE LINE SEARCH TOOLBAR ("এক লাইনে থাকবে সকল কিছু") ── */}
              <div className="flex flex-col lg:flex-row items-stretch lg:items-end gap-3.5 w-full">
                
                {/* 1. Examination */}
                <div className="flex-1 min-w-[200px] space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Examination</span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedExam}
                      onChange={(e) => setSelectedExam(e.target.value)}
                      className="w-full bg-slate-50/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-3 text-sm font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 appearance-none pr-9 cursor-pointer transition shadow-2xs outline-none"
                    >
                      {activeExams.length > 0 ? (
                        activeExams.map((exam) => {
                          const displayLabel = examService.formatExamNameForDisplay(exam.title);
                          const isPub = Boolean(exam.isPublished);
                          return (
                            <option key={exam.id} value={exam.title} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                              {displayLabel} {isPub ? '✓ (Published)' : '🔒 (Unpublished)'}
                            </option>
                          );
                        })
                      ) : (
                        <option value="Annual Examination 2026" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                          Annual Examination 2026 🔒 (Unpublished)
                        </option>
                      )}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* 2. Class */}
                <div className="w-full lg:w-36 shrink-0 space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Class</span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedGrade}
                      onChange={(e) => setSelectedGrade(e.target.value)}
                      className="w-full bg-slate-50/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-3 text-sm font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 appearance-none pr-9 cursor-pointer transition shadow-2xs outline-none"
                    >
                      {CLASS_OPTIONS.map((cls) => (
                        <option key={cls.value} value={cls.value} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                          {cls.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* 3. Group (Conditional: ONLY for Class 9 and 10; NOT shown for Class 6-8) */}
                {isClass9or10 && (
                  <div className="w-full lg:w-44 shrink-0 space-y-1.5 animate-fade-in">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Group</span>
                    </label>
                    <div className="relative">
                      <select
                        value={selectedGroup}
                        onChange={(e) => setSelectedGroup(e.target.value)}
                        className="w-full bg-slate-50/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-3 text-sm font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 appearance-none pr-9 cursor-pointer transition shadow-2xs outline-none"
                      >
                        {GROUP_OPTIONS.map((grp) => (
                          <option key={grp.value} value={grp.value} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                            {grp.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                )}

                {/* 4. Student Roll Number */}
                <div className="w-full lg:w-40 shrink-0 space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Roll Number</span>
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={rollInput}
                      onChange={(e) => setRollInput(e.target.value)}
                      placeholder="Roll No (01)"
                      className="w-full bg-slate-50/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-3 text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 font-mono tracking-normal focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition shadow-2xs outline-none"
                    />
                    {rollInput && (
                      <button
                        type="button"
                        onClick={() => setRollInput('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs p-1 rounded-md"
                        title="Clear"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* 5. Search Action Button */}
                <div className="shrink-0">
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="w-full lg:w-auto h-[46px] px-6 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-sm shadow-md shadow-emerald-600/25 transition-all transform hover:-translate-y-0.5 active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {isSearching ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Searching...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        <span>Search Result</span>
                      </>
                    )}
                  </button>
                </div>

                {/* 6. Reset / New Search Button */}
                {hasSearched && (
                  <div className="shrink-0">
                    <button
                      type="button"
                      onClick={handleResetSearch}
                      className="w-full lg:w-auto h-[46px] px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm border border-slate-200 dark:border-slate-700 transition flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer whitespace-nowrap"
                      title="Reset search"
                    >
                      <RotateCcw className="w-4 h-4 text-slate-500" />
                      <span>Reset</span>
                    </button>
                  </div>
                )}

              </div>
            </form>
          </div>

          {/* Validation & Error Messages */}
          {errorMsg && (
            <div className="max-w-5xl mx-auto p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 text-rose-900 dark:text-rose-200 text-sm flex items-start gap-3 shadow-md animate-fade-in">
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-rose-900 dark:text-rose-200">{errorMsg}</p>
                <p className="text-xs text-rose-700/80 dark:text-rose-300/80">
                  Please verify examination, class, and roll number.
                </p>
              </div>
            </div>
          )}

          {/* Success Notification */}
          {searchSuccess && foundStudent && isCurrentExamPublished && (
            <div className="max-w-5xl mx-auto p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-200 text-xs sm:text-sm flex items-center gap-2.5 shadow-md">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Result found successfully for <strong>{foundStudent.name}</strong>. See detailed marksheet below.</span>
            </div>
          )}

        </div>

        {/* ═════════════════════════════════════════════════════════════ */}
        {/* 🔒 UNPUBLISHED EXAM NOTICE (When searched on unpublished exam) */}
        {/* ═════════════════════════════════════════════════════════════ */}
        {hasSearched && !isCurrentExamPublished && (
          <div className="max-w-3xl mx-auto p-8 rounded-3xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-amber-300/80 dark:border-amber-500/40 text-center space-y-4 shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400 shadow-xs">
              <Lock className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Results Not Published Yet</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Official results for <strong>&ldquo;{selectedExam}&rdquo;</strong> have not been released online by the school authority yet.
              </p>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-amber-800 dark:text-amber-200/90 max-w-lg mx-auto">
                Once the administration publishes the examination results, students can search and download their complete marksheet using their roll number.
              </div>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleResetSearch}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-300 dark:border-slate-700 transition cursor-pointer"
              >
                Select Another Exam
              </button>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════ */}
        {/* 📊 STUDENT RESULT DASHBOARD SECTION (Pure White Glassmorphism) */}
        {/* ═════════════════════════════════════════════════════════════ */}
        {foundStudent && foundMarksheetData && isCurrentExamPublished && (
          <div id="result-dashboard-section" className="space-y-6 pt-4 print:space-y-0 print:pt-0 print:p-0 print:m-0 print:block print:w-full">
            
            {/* 1. Header Banner & Action Bar (Hidden on Print) */}
            <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 p-5 rounded-2xl max-w-5xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm print:hidden">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                  Academic Result — 2026
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                  {selectedExam}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Official marksheet record for <strong>{foundStudent.name}</strong>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                {/* Print Result */}
                <button
                  type="button"
                  onClick={handlePrintResult}
                  className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold border border-slate-200 dark:border-slate-700 shadow-2xs transition flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Print</span>
                </button>

                {/* Download Report Card */}
                <button
                  type="button"
                  onClick={handleDownloadReportCard}
                  className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Marksheet</span>
                </button>

                {/* Back to Search */}
                <button
                  type="button"
                  onClick={() => {
                    document.getElementById('search-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-600 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-800 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Scroll to search section"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Search</span>
                </button>
              </div>
            </div>

            {/* PDF Help Tip Toast */}
            {pdfHelpToast && (
              <div className="max-w-5xl mx-auto p-3.5 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-500/40 rounded-xl text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2.5 animate-fade-in print:hidden">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Tip: In the print dialog, select <strong>&quot;Save as PDF&quot;</strong> as the destination to download your marksheet.
                </span>
              </div>
            )}

            {/* 2. Student Information Card in Pure White Glass (Hidden on Print) */}
            <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 max-w-5xl mx-auto shadow-sm print:hidden">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Student Information</span>
                </h4>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 font-bold">
                  ✓ Verified Record
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
                {/* Student Name */}
                <div className="col-span-2 sm:col-span-1 lg:col-span-2">
                  <span className="text-slate-400 block text-[11px]">Student Name</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm block mt-0.5">{foundStudent.name}</span>
                </div>

                {/* Roll Number */}
                <div>
                  <span className="text-slate-400 block text-[11px]">Roll Number</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white text-sm block mt-0.5">{foundStudent.roll}</span>
                </div>

                {/* Class */}
                <div>
                  <span className="text-slate-400 block text-[11px]">Class</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm block mt-0.5">
                    {formatClassName(foundStudent.grade)}
                  </span>
                </div>

                {/* Section */}
                <div>
                  <span className="text-slate-400 block text-[11px]">Section</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm block mt-0.5">
                    Section {foundStudent.section || 'A'}
                  </span>
                </div>

                {/* Group */}
                <div>
                  <span className="text-slate-400 block text-[11px]">Group</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm block mt-0.5">
                    {formatGroupName(foundStudent.group)}
                  </span>
                </div>

                {/* Academic Year */}
                <div>
                  <span className="text-slate-400 block text-[11px]">Academic Year</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white text-sm block mt-0.5">2026</span>
                </div>
              </div>
            </div>

            {/* 3. Performance Summary: 4 Visually Distinct White Glass Stat Cards (Hidden on Print) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto print:hidden">
              
              {/* Statistic 1: Total Marks */}
              <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold mb-2">
                  <span>Total Marks</span>
                  <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                  {totalObtainedMarks} <span className="text-sm font-normal text-slate-400">/ {totalMaxMarks}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Total marks achieved</p>
              </div>

              {/* Statistic 2: Average */}
              <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold mb-2">
                  <span>Average Score</span>
                  <TrendingUp className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                  {averagePercentage}%
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Overall percentage</p>
              </div>

              {/* Statistic 3: GPA */}
              <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold mb-2">
                  <span>GPA (Grade Point)</span>
                  <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                  {gpaScore} <span className="text-sm font-normal text-slate-400">/ 5.00</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Grade Point Average</p>
              </div>

              {/* Statistic 4: Result Status */}
              <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold mb-2">
                  <span>Result Status</span>
                  {isPassed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-block px-3 py-1 rounded-xl text-base sm:text-lg font-black tracking-wider uppercase ${
                    isPassed 
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                      : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                  }`}>
                    {resultStatus}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Letter Grade: <strong className="text-slate-900 dark:text-white font-black">{foundMarksheetData?.overallGrade || 'N/A'}</strong>
                </p>
              </div>

            </div>

            {/* 4. Official Academic Transcript & Marksheet (A4 Institutional Document) */}
            <div className="pt-2">
              <div className="max-w-5xl mx-auto flex items-center justify-between pb-3 print:hidden">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                    Official Academic Transcript & Marksheet
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  Official Institutional Document (A4)
                </span>
              </div>

              {/* Container for Official Marksheet Sheet */}
              <div className="overflow-x-auto pb-8 pt-1 w-full flex justify-center bg-slate-200/40 dark:bg-slate-900/40 rounded-2xl p-1 sm:p-4 border border-slate-200/80 dark:border-slate-800/80 print:bg-transparent print:p-0 print:m-0 print:border-none print:overflow-visible print:w-full print:rounded-none">
                <div className="min-w-[780px] sm:min-w-[850px] w-full max-w-4xl bg-white shadow-2xl rounded-sm print:min-w-0 print:w-full print:max-w-none print:p-0 print:m-0 print:shadow-none print:rounded-none print:border-none print:block">
                  <MarksheetSheetCard
                    student={foundStudent}
                    settings={settings}
                    examName={selectedExam}
                    data={foundMarksheetData}
                    borderImageUrl={borderImageUrl}
                    lang="en"
                  />
                </div>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* 🏛️ OFFICIAL INSTITUTION FOOTER (English) */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-slate-950/60 backdrop-blur-md py-8 mt-12 text-center text-xs text-slate-500 print:hidden">
        <div className="max-w-7xl mx-auto px-4 space-y-1.5">
          <p className="font-bold text-slate-700 dark:text-slate-300">
            © 2026 {getEnglishSchoolName(settings?.schoolName)}. All Rights Reserved.
          </p>
          <p className="text-[11px] text-slate-400">
            Official Academic Result Portal • {getEnglishAddress(settings?.address)} • EIIN: {settings?.eiin || '106184'}
          </p>
        </div>
      </footer>

    </div>
  );
}

export default function ResultPublicPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-800">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-medium text-sm">Loading Result Portal...</p>
          </div>
        </div>
      }
    >
      <ResultSearchContent />
    </Suspense>
  );
}