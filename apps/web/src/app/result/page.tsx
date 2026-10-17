'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Search, 
  Printer, 
  Download, 
  School, 
  Building2, 
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
  Layers,
  Sparkles,
  Percent
} from 'lucide-react';
import Link from 'next/link';
import { settingsService } from '@/services/settingsService';
import { studentService } from '@/services/studentService';
import { examService, ExamItem } from '@/services/examService';
import { classSectionService, SectionBranch } from '@/services/classSectionService';
import {
  MarksheetSheetCard,
  generateStudentMarksheetData,
  getStudentsForClassSectionGroup,
  StudentProfile
} from '@/components/OfficialMarksheetSheet';

// ── Class Options (English) ──
const CLASS_OPTIONS = [
  { value: '6th', label: 'Class 6' },
  { value: '7th', label: 'Class 7' },
  { value: '8th', label: 'Class 8' },
  { value: '9th', label: 'Class 9' },
  { value: '10th', label: 'Class 10' },
];

// ── Group Options (English) ──
const GROUP_OPTIONS = [
  { value: 'Science', label: 'Science' },
  { value: 'Humanities', label: 'Humanities' },
  { value: 'Business Studies', label: 'Business Studies' },
  { value: 'General', label: 'General' },
];

// Helper to format class name in English
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

// Helper to format group in English
const formatGroupName = (group: string | undefined): string => {
  if (!group) return 'General';
  const g = group.trim();
  if (g.includes('বিজ্ঞান') || g.toLowerCase().includes('science')) return 'Science';
  if (g.includes('মানবিক') || g.toLowerCase().includes('humanities') || g.toLowerCase().includes('arts')) return 'Humanities';
  if (g.includes('ব্যবসায়') || g.includes('ব্যবসায়') || g.toLowerCase().includes('commerce') || g.toLowerCase().includes('business')) return 'Business Studies';
  if (g.includes('সাধারণ') || g.toLowerCase().includes('general')) return 'General';
  return g;
};

function ResultSearchContent() {
  const searchParams = useSearchParams();

  const [mounted, setMounted] = useState(false);
  const [settings, setSettings] = useState(settingsService.getSettings());

  // Dynamic Examination and Section states
  const [activeExams, setActiveExams] = useState<ExamItem[]>([]);
  const [availableSections, setAvailableSections] = useState<SectionBranch[]>([]);

  // Form States (Initialized with specified placeholders/values)
  const [selectedExam, setSelectedExam] = useState<string>(
    searchParams.get('exam') || 'Annual Examination 2026'
  );
  const [selectedGrade, setSelectedGrade] = useState<string>(
    searchParams.get('grade') || '6th'
  );
  const [selectedBranch, setSelectedBranch] = useState<string>(
    searchParams.get('section') || 'A'
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

  // 2. Dynamic Section Synchronization from Class & Section Management
  useEffect(() => {
    const loadSections = () => {
      const secs = classSectionService.getSectionsForGrade(selectedGrade);
      setAvailableSections(secs);
    };

    loadSections();
    const unsubSecs = classSectionService.subscribe(loadSections);
    const handleStorage = () => loadSections();
    window.addEventListener('storage', handleStorage);

    return () => {
      unsubSecs();
      window.removeEventListener('storage', handleStorage);
    };
  }, [selectedGrade]);

  // Compute dynamic section options for the current class
  const dynamicSectionOptions = React.useMemo(() => {
    if (!availableSections || availableSections.length === 0) {
      return [
        { value: 'A', label: 'Section A' },
        { value: 'B', label: 'Section B' },
        { value: 'all', label: 'All Sections' }
      ];
    }

    const items = availableSections.map((sec) => {
      const raw = sec.name.trim();
      let val = 'A';
      if (raw.includes('B') || raw.includes('খ')) val = 'B';
      else if (raw.includes('C') || raw.includes('গ')) val = 'C';
      else if (raw.includes('D') || raw.includes('ঘ')) val = 'D';
      else if (raw.includes('A') || raw.includes('ক')) val = 'A';
      else val = raw;

      const engMatch = raw.match(/([A-Za-z0-9\s]+)/);
      const displayLabel = engMatch && engMatch[1].trim().length > 1 ? engMatch[1].trim() : `Section ${val}`;

      return {
        value: val,
        label: displayLabel.startsWith('Section') ? displayLabel : `Section ${displayLabel}`
      };
    });

    return [...items, { value: 'all', label: 'All Sections' }];
  }, [availableSections]);

  // Keep selectedBranch valid when class changes
  useEffect(() => {
    if (dynamicSectionOptions.length > 0 && selectedBranch !== 'all') {
      const validValues = dynamicSectionOptions.map((o) => o.value);
      if (!validValues.includes(selectedBranch)) {
        setSelectedBranch(dynamicSectionOptions[0].value);
      }
    }
  }, [selectedGrade, dynamicSectionOptions, selectedBranch]);

  useEffect(() => {
    setMounted(true);
    const s = settingsService.getSettings();
    setSettings(s);

    if (typeof window !== 'undefined') {
      const savedBorder = localStorage.getItem('sms_marksheet_border_png');
      const clearedBorder = localStorage.getItem('sms_marksheet_border_cleared');
      if (savedBorder) {
        setBorderImageUrl(savedBorder);
      } else if (!clearedBorder && s?.customBorderPng) {
        setBorderImageUrl(s.customBorderPng);
      }
    }

    const unsub = settingsService.subscribe((updated) => {
      setSettings(updated);
    });
    return () => unsub();
  }, []);

  // Auto search if query parameters exist in URL
  useEffect(() => {
    if (mounted && searchParams.get('roll')) {
      handleSearch();
    }
  }, [mounted]);

  const isClass9or10 = selectedGrade === '9th' || selectedGrade === '10th';

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSearchSuccess(false);
    setHasSearched(true);
    setIsSearching(true);

    // 0. Strict Publication Gate: Check if exam result is published (ফলাফল পাবলিশ যাচাই)
    const isExamPublished = examService.isExamResultPublished(selectedExam);
    if (!isExamPublished) {
      setFoundStudent(null);
      setFoundMarksheetData(null);
      setIsSearching(false);
      setErrorMsg('উক্ত পরীক্ষার ফলাফল এখনও প্রকাশিত হয়নি। বিদ্যালয় কর্তৃপক্ষ ফলাফল পাবলিশ করার পর শিক্ষার্থীরা অনলাইন থেকে তা দেখতে পাবে।');
      return;
    }

    const cleanRoll = rollInput.trim();
    if (!cleanRoll) {
      setErrorMsg('Please enter a valid student roll number.');
      setFoundStudent(null);
      setFoundMarksheetData(null);
      setIsSearching(false);
      return;
    }

    // 1. Load students for current selection
    const classStudents = getStudentsForClassSectionGroup(
      selectedGrade,
      selectedBranch,
      isClass9or10 ? selectedGroup : 'Science'
    );

    const targetRollNum = parseInt(cleanRoll.replace(/\D/g, ''), 10);

    // 2. Match student by roll number
    let matched = classStudents.find((s) => {
      const sRollNum = parseInt(String(s.roll || '').replace(/\D/g, ''), 10);
      return sRollNum === targetRollNum || s.roll.trim() === cleanRoll;
    });

    // 3. Fallback: Search across all stored students if section was 'all' or loose match
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

        return isGradeMatch && sRollNum === targetRollNum;
      });

      if (globalMatch) {
        matched = {
          id: globalMatch.id,
          roll: globalMatch.roll || cleanRoll,
          name: globalMatch.name,
          grade: selectedGrade,
          gradeBn: `Class ${selectedGrade.replace(/\D/g, '')}`,
          section: globalMatch.section || globalMatch.branch || (selectedBranch === 'all' ? 'A' : selectedBranch),
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
      setErrorMsg('No student record found for this roll number.');
      setIsSearching(false);
      return;
    }

    // 4. Calculate exact marksheet data using shared NCTB engine
    const marksData = generateStudentMarksheetData(matched, {
      selectedExam,
      selectedGrade,
      selectedBranch: matched.section || (selectedBranch === 'all' ? 'A' : selectedBranch),
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
    setHasSearched(false);
    setSearchSuccess(false);
    setFoundStudent(null);
    setFoundMarksheetData(null);
    setErrorMsg('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#070B1A] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#4F46E5] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-medium text-sm">Loading Academic Portal...</p>
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
    <div className="min-h-screen bg-[#070B1A] text-slate-100 flex flex-col font-sans print:bg-white print:text-black print:min-h-0 print:h-auto print:block print:p-0 print:m-0">
      
      {/* ═════════════════════════════════════════════════════════════ */}
      {/* 🏛️ OFFICIAL INSTITUTION HEADER (Hidden on Print) */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <header className="border-b border-slate-800/80 bg-[#0B1026]/95 backdrop-blur-md sticky top-0 z-40 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          
          {/* Left: School Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
              {settings?.schoolLogo ? (
                <img src={settings.schoolLogo} alt="School Logo" className="w-8 h-8 object-contain" />
              ) : (
                <div className="flex flex-col items-center justify-center text-indigo-400 font-black text-xs leading-none">
                  <span className="text-[10px] text-amber-400">★</span>
                  <span>BHS</span>
                </div>
              )}
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight leading-tight">
                Baraitali High School
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Baraitali, Chakaria, Cox's Bazar • EIIN: 106184
              </p>
            </div>
          </div>

          {/* Right: Student Login Action */}
          <div className="flex items-center gap-2.5">
            <Link
              href="/login"
              className="text-xs font-semibold px-4 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-2 active:scale-95 shadow-sm"
              title="Official Student & Staff Login"
            >
              <User className="w-3.5 h-3.5 text-indigo-400" />
              <span>Student Login</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* 🔍 HERO & SEARCH SECTION (Hidden on Print) */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 print:p-0 print:m-0 print:py-0 print:my-0 print:space-y-0 print:max-w-none print:w-full print:block">
        
        <div id="search-section" className="space-y-5 print:hidden">
          
          {/* Hero Titles */}
          <div className="text-center max-w-2xl mx-auto space-y-2.5">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>OFFICIAL ONLINE RESULT PORTAL</span>
            </div>
            
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Online Academic Results & Report Card
            </h2>
            
            <p className="text-sm text-slate-400 leading-relaxed">
              View your academic performance and access your official report card securely.
            </p>
          </div>

          {/* Result Search Card */}
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl shadow-black/40 max-w-3xl mx-auto">
            <form onSubmit={handleSearch} className="space-y-6">
              
              {/* Publication Status Banner */}
              {!isCurrentExamPublished ? (
                <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-600/40 text-amber-200 text-xs sm:text-sm flex items-start gap-2.5">
                  <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-bold text-amber-200">উক্ত পরীক্ষার ফলাফল এখনও প্রকাশিত হয়নি</p>
                    <p className="text-[11px] text-amber-300/80">
                      বিদ্যালয় কর্তৃপক্ষ আনুষ্ঠানিকভাবে &ldquo;ফলাফল পাবলিশ&rdquo; করার পর শিক্ষার্থীরা অনলাইন থেকে তা দেখতে পারবে।
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-600/30 text-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>এই পরীক্ষার ফলাফল অনলাইনে প্রকাশিত ও উন্মুক্ত রয়েছে।</span>
                </div>
              )}

              {/* 2-Column Grid on Desktop, 1-Column on Mobile */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* 1. Examination */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Examination</span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedExam}
                      onChange={(e) => setSelectedExam(e.target.value)}
                      className="w-full bg-[#0A0F24] border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none pr-10 cursor-pointer transition"
                    >
                      {activeExams.length > 0 ? (
                        activeExams.map((exam) => {
                          const displayLabel = examService.formatExamNameForDisplay(exam.title);
                          const isPub = Boolean(exam.isPublished);
                          return (
                            <option key={exam.id} value={exam.title} className="bg-slate-900 text-white">
                              {displayLabel} {isPub ? '✓ (ফলাফল প্রকাশিত)' : '🔒 (ফলাফল অপ্রকাশিত)'}
                            </option>
                          );
                        })
                      ) : (
                        <option value="Annual Examination 2026" className="bg-slate-900 text-white">
                          Annual Examination 2026 🔒 (ফলাফল অপ্রকাশিত)
                        </option>
                      )}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* 2. Class */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Class</span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedGrade}
                      onChange={(e) => setSelectedGrade(e.target.value)}
                      className="w-full bg-[#0A0F24] border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none pr-10 cursor-pointer transition"
                    >
                      {CLASS_OPTIONS.map((cls) => (
                        <option key={cls.value} value={cls.value} className="bg-slate-900 text-white">
                          {cls.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* 3. Section */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Section</span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedBranch}
                      onChange={(e) => setSelectedBranch(e.target.value)}
                      className="w-full bg-[#0A0F24] border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none pr-10 cursor-pointer transition"
                    >
                      {dynamicSectionOptions.map((sec) => (
                        <option key={sec.value} value={sec.value} className="bg-slate-900 text-white">
                          {sec.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* 4. Group */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Group</span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedGroup}
                      onChange={(e) => setSelectedGroup(e.target.value)}
                      className="w-full bg-[#0A0F24] border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none pr-10 cursor-pointer transition"
                    >
                      {GROUP_OPTIONS.map((grp) => (
                        <option key={grp.value} value={grp.value} className="bg-slate-900 text-white">
                          {grp.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

              </div>

              {/* 5. Student Roll Number (Full Width) */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Student Roll Number</span>
                  </span>
                  <span className="text-[11px] text-slate-500 font-normal">Example: 01, 05, 12</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={rollInput}
                    onChange={(e) => setRollInput(e.target.value)}
                    placeholder="01"
                    className="w-full bg-[#0A0F24] border border-slate-700/80 rounded-xl px-4 py-3 text-base text-white placeholder-slate-500 font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  />
                  {rollInput && (
                    <button
                      type="button"
                      onClick={() => setRollInput('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-sm p-1 rounded-md"
                      title="Clear roll number"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Action Buttons: Primary & Secondary */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSearching}
                  className="w-full sm:flex-1 py-3 px-6 rounded-xl bg-[#4F46E5] hover:bg-indigo-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-indigo-600/25 transition flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSearching ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Searching Records...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>View Result</span>
                    </>
                  )}
                </button>

                {hasSearched && (
                  <button
                    type="button"
                    onClick={handleResetSearch}
                    className="w-full sm:w-auto py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm border border-slate-700 transition flex items-center justify-center gap-1.5 active:scale-[0.99] cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4 text-slate-400" />
                    <span>New Search</span>
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Validation & Error Messages */}
          {errorMsg && (
            <div className="max-w-3xl mx-auto p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-200 text-sm flex items-start gap-3 shadow-md animate-fade-in">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-rose-200">{errorMsg}</p>
                <p className="text-xs text-rose-300/80">
                  Please verify the examination, class, section, and roll number entered.
                </p>
              </div>
            </div>
          )}

          {/* Success Notification */}
          {searchSuccess && foundStudent && isCurrentExamPublished && (
            <div className="max-w-3xl mx-auto p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/80 text-emerald-200 text-xs sm:text-sm flex items-center gap-2.5 shadow-md">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Result record found successfully for <strong>{foundStudent.name}</strong>.</span>
            </div>
          )}

        </div>

        {/* ═════════════════════════════════════════════════════════════ */}
        {/* 🔒 UNPUBLISHED EXAM NOTICE (When searched on unpublished exam) */}
        {/* ═════════════════════════════════════════════════════════════ */}
        {hasSearched && !isCurrentExamPublished && (
          <div className="max-w-3xl mx-auto p-8 rounded-3xl bg-[#111827] border border-amber-500/40 text-center space-y-4 shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
              <Lock className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-white">ফলাফল এখনও প্রকাশিত হয়নি</h3>
              <p className="text-sm text-slate-300">
                নির্বাচিত <strong>&ldquo;{selectedExam}&rdquo;</strong>-এর ফলাফল বিদ্যালয় কর্তৃপক্ষ এখনও অনলাইন পোর্টালে প্রকাশ করেনি।
              </p>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-amber-200/90 max-w-lg mx-auto">
                বিদ্যালয় কর্তৃপক্ষ পরীক্ষা ব্যবস্থাপনা থেকে ফলাফল পাবলিশ করার পর শিক্ষার্থীরা তাদের রোল নম্বর দিয়ে সম্পূর্ণ মার্কশীট দেখতে ও ডাউনলোড করতে পারবে।
              </div>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleResetSearch}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition cursor-pointer"
              >
                অন্য পরীক্ষা নির্বাচন করুন
              </button>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════ */}
        {/* 📊 STUDENT RESULT DASHBOARD SECTION */}
        {/* ═════════════════════════════════════════════════════════════ */}
        {foundStudent && foundMarksheetData && isCurrentExamPublished && (
          <div id="result-dashboard-section" className="space-y-6 pt-4 print:space-y-0 print:pt-0 print:p-0 print:m-0 print:block print:w-full">
            
            {/* 1. Header Banner & Action Bar (Hidden on Print) */}
            <div className="bg-[#111827] border border-slate-800 p-5 rounded-2xl max-w-5xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl print:hidden">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 block">
                  Academic Result — 2026
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
                  {selectedExam}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Official published marksheet record for {foundStudent.name}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                {/* Print Result */}
                <button
                  type="button"
                  onClick={handlePrintResult}
                  className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 shadow-sm transition flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-indigo-400" />
                  <span>Print Result</span>
                </button>

                {/* Download Report Card */}
                <button
                  type="button"
                  onClick={handleDownloadReportCard}
                  className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Report Card</span>
                </button>

                {/* Back to Search */}
                <button
                  type="button"
                  onClick={() => {
                    document.getElementById('search-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold border border-slate-800 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Scroll to search section"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Search</span>
                </button>
              </div>
            </div>

            {/* PDF Help Tip Toast */}
            {pdfHelpToast && (
              <div className="max-w-5xl mx-auto p-3.5 bg-indigo-950/80 border border-indigo-500/40 rounded-xl text-indigo-200 text-xs flex items-center gap-2.5 animate-fade-in print:hidden">
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>
                  Tip: In the print dialog, select <strong>"Save as PDF"</strong> under Destination, then click Save to download your report card.
                </span>
              </div>
            )}

            {/* 2. Student Information Card (Hidden on Print) */}
            <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 max-w-5xl mx-auto shadow-xl print:hidden">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-400" />
                  <span>Student Information</span>
                </h4>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                  Verified Record
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
                {/* Student Name */}
                <div className="col-span-2 sm:col-span-1 lg:col-span-2">
                  <span className="text-slate-400 block text-[11px]">Student Name</span>
                  <span className="font-bold text-white text-sm block mt-0.5">{foundStudent.name}</span>
                </div>

                {/* Roll Number */}
                <div>
                  <span className="text-slate-400 block text-[11px]">Roll Number</span>
                  <span className="font-mono font-bold text-white text-sm block mt-0.5">{foundStudent.roll}</span>
                </div>

                {/* Class */}
                <div>
                  <span className="text-slate-400 block text-[11px]">Class</span>
                  <span className="font-bold text-white text-sm block mt-0.5">
                    {formatClassName(foundStudent.grade)}
                  </span>
                </div>

                {/* Section */}
                <div>
                  <span className="text-slate-400 block text-[11px]">Section</span>
                  <span className="font-bold text-white text-sm block mt-0.5">
                    Section {foundStudent.section || 'A'}
                  </span>
                </div>

                {/* Group */}
                <div>
                  <span className="text-slate-400 block text-[11px]">Group</span>
                  <span className="font-bold text-white text-sm block mt-0.5">
                    {formatGroupName(foundStudent.group)}
                  </span>
                </div>

                {/* Academic Year */}
                <div>
                  <span className="text-slate-400 block text-[11px]">Academic Year</span>
                  <span className="font-mono font-bold text-white text-sm block mt-0.5">2026</span>
                </div>
              </div>
            </div>

            {/* 3. Performance Summary (Four Visually Distinct Statistics Cards) (Hidden on Print) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto print:hidden">
              
              {/* Statistic 1: Total Marks */}
              <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
                  <span>Total Marks</span>
                  <Award className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                  {totalObtainedMarks} <span className="text-sm font-normal text-slate-500">/ {totalMaxMarks}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Aggregated examination marks</p>
              </div>

              {/* Statistic 2: Average */}
              <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
                  <span>Average</span>
                  <TrendingUp className="w-4 h-4 text-sky-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                  {averagePercentage}%
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Overall percentage score</p>
              </div>

              {/* Statistic 3: GPA */}
              <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
                  <span>GPA</span>
                  <GraduationCap className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                  {gpaScore} <span className="text-sm font-normal text-slate-500">/ 5.00</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Grade Point Average</p>
              </div>

              {/* Statistic 4: Result Status */}
              <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
                  <span>Result Status</span>
                  {isPassed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-block px-3 py-1 rounded-xl text-lg sm:text-xl font-black tracking-wider uppercase ${
                    isPassed 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  }`}>
                    {resultStatus}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Final Grade: <strong className="text-white">{foundMarksheetData?.overallGrade || 'N/A'}</strong>
                </p>
              </div>

            </div>

            {/* 4. Official Academic Transcript & Marksheet (A4 Institutional Document) */}
            <div className="pt-2">
              <div className="max-w-5xl mx-auto flex items-center justify-between pb-3 print:hidden">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Official Academic Transcript & Marksheet
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  Official Institutional Document (A4)
                </span>
              </div>

              {/* Container for Official Marksheet Sheet */}
              <div className="overflow-x-auto pb-8 pt-1 w-full flex justify-center bg-slate-900/40 rounded-2xl p-1 sm:p-4 border border-slate-800/80 print:bg-transparent print:p-0 print:m-0 print:border-none print:overflow-visible print:w-full print:rounded-none">
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
      {/* 🏛️ OFFICIAL FOOTER (Hidden on Print) */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <footer className="border-t border-slate-800/80 bg-[#070B1A] py-8 mt-12 text-center text-xs text-slate-500 print:hidden">
        <div className="max-w-7xl mx-auto px-4 space-y-1.5">
          <p className="font-medium text-slate-400">
            © 2026 Baraitali High School. All Rights Reserved.
          </p>
          <p className="text-[11px] text-slate-500">
            Official Academic Result Portal • Baraitali, Chakaria, Cox's Bazar • EIIN: 106184
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
        <div className="min-h-screen bg-[#070B1A] flex items-center justify-center text-white">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-[#4F46E5] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 font-medium text-sm">Loading Academic Portal...</p>
          </div>
        </div>
      }
    >
      <ResultSearchContent />
    </Suspense>
  );
}
