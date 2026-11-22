'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  Printer,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Calendar,
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
  Home,
  Copy,
  Check,
  Cloud,
  RefreshCw,
  Phone,
  Mail,
  Table2,
  FileBadge2,
  UserPlus,
  Layers,
} from 'lucide-react';
import {
  settingsService,
  getEnglishSchoolName as resolveEnglishSchoolName,
  getEnglishAddress as resolveEnglishAddress,
} from '@/services/settingsService';
import { studentService } from '@/services/studentService';
import { examService, ExamItem } from '@/services/examService';
import { firebaseSyncService } from '@/services/firebaseSyncService';
import {
  MarksheetSheetCard,
  MARKSHEET_A4_PRINT_STYLES,
  generateStudentMarksheetData,
  getStudentsForClassSectionGroup,
  StudentProfile,
  SubjectMark,
} from '@/components/OfficialMarksheetSheet';
import { triggerProfessionalPrint } from '@/lib/printPdfUtils';
import {
  PortalLang,
  PORTAL_CLASS_OPTIONS,
  PORTAL_GROUP_OPTIONS,
  NCTB_GRADING_SCALE,
  normalizeRollDigits,
  formatPortalNumber,
  formatPortalClassName,
  formatPortalGroupName,
  pickDefaultExamTitle,
  buildResultShareUrl,
} from '@/lib/resultPortalUtils';

type MarksheetComputedData = ReturnType<typeof generateStudentMarksheetData>;
type ResultViewMode = 'marksheet' | 'breakdown';

function getGradeBadgeStyle(grade: string | undefined): string {
  switch (grade) {
    case 'A+':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    case 'A':
      return 'bg-teal-100 text-teal-800 dark:bg-teal-950/70 dark:text-teal-300 border-teal-200 dark:border-teal-800';
    case 'A-':
      return 'bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300 border-sky-200 dark:border-sky-800';
    case 'B':
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
    case 'C':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800';
    case 'D':
      return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    default:
      return 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200 dark:border-rose-800';
  }
}

function ResultSearchContent() {
  const searchParams = useSearchParams();
  const initialUrlExam = searchParams.get('exam');
  const initialUrlGrade = searchParams.get('grade');
  const initialUrlGroup = searchParams.get('group');
  const initialUrlRoll = searchParams.get('roll');

  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState<PortalLang>('bn');
  const [settings, setSettings] = useState(settingsService.getSettings());
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [cloudSyncedOnce, setCloudSyncedOnce] = useState(false);

  // Dynamic Examination state
  const [activeExams, setActiveExams] = useState<ExamItem[]>([]);

  // Form States
  const [selectedExam, setSelectedExam] = useState<string>(
    initialUrlExam || 'Annual Examination 2026'
  );
  const [selectedGrade, setSelectedGrade] = useState<string>(
    initialUrlGrade || '6th'
  );
  const [selectedGroup, setSelectedGroup] = useState<string>(
    initialUrlGroup || 'Science'
  );
  const [rollInput, setRollInput] = useState<string>(initialUrlRoll || '');

  // Border State
  const [borderImageUrl, setBorderImageUrl] = useState<string>('');

  // Result Search States
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [foundStudent, setFoundStudent] = useState<StudentProfile | null>(null);
  const [foundMarksheetData, setFoundMarksheetData] = useState<MarksheetComputedData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [searchSuccess, setSearchSuccess] = useState<boolean>(false);
  const [pdfHelpToast, setPdfHelpToast] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [resultViewMode, setResultViewMode] = useState<ResultViewMode>('marksheet');

  const autoSearchedRef = useRef(false);

  const isBn = lang === 'bn';

  // Helper to resolve border URL from SchoolSettings
  const syncBorderFromSettings = useCallback((s: ReturnType<typeof settingsService.getSettings>) => {
    if (s.selectedBorderId && s.customBorders && s.customBorders.length > 0) {
      const found = s.customBorders.find((b) => b.id === s.selectedBorderId);
      if (found) {
        setBorderImageUrl(found.url);
        return;
      }
    }
    if (s.customBorderPng) {
      setBorderImageUrl(s.customBorderPng);
    }
  }, []);

  // 1. Dynamic Examination & Cloud Synchronization
  useEffect(() => {
    const loadExams = (preferUrl = false) => {
      const list = examService.getActiveExams();
      setActiveExams(list);
      if (list.length > 0) {
        setSelectedExam((prev) =>
          pickDefaultExamTitle(
            list,
            preferUrl ? initialUrlExam : prev,
            (title) => examService.formatExamNameForDisplay(title)
          )
        );
      }
    };

    loadExams(true);
    setIsSyncingCloud(true);
    firebaseSyncService
      .fetchPublicResultDataFromCloud()
      .then(() => {
        loadExams(Boolean(initialUrlExam));
        const freshSettings = settingsService.getSettings();
        setSettings(freshSettings);
        syncBorderFromSettings(freshSettings);
        setCloudSyncedOnce(true);
      })
      .catch(() => {
        setCloudSyncedOnce(true);
      })
      .finally(() => {
        setIsSyncingCloud(false);
      });

    const unsubExams = examService.subscribe(() => loadExams(false));
    const handleExamEvent = () => loadExams(false);
    window.addEventListener('sms_exam_setup_changed', handleExamEvent);
    window.addEventListener('storage', handleExamEvent);

    return () => {
      unsubExams();
      window.removeEventListener('sms_exam_setup_changed', handleExamEvent);
      window.removeEventListener('storage', handleExamEvent);
    };
  }, [initialUrlExam, syncBorderFromSettings]);

  // 2. School Settings & Border Synchronization
  useEffect(() => {
    setMounted(true);
    const s = settingsService.getSettings();
    setSettings(s);
    syncBorderFromSettings(s);

    const unsub = settingsService.subscribe((next) => {
      setSettings(next);
      syncBorderFromSettings(next);
    });

    return () => unsub();
  }, [syncBorderFromSettings]);

  // Logic: Only Class 9 and 10 have group selection; Class 6-8 have neither group nor section
  const isClass9or10 = selectedGrade === '9th' || selectedGrade === '10th';

  const runSearch = useCallback(
    async (params: { exam: string; grade: string; group: string; roll: string; skipCloud?: boolean }) => {
      setErrorMsg('');
      setSearchSuccess(false);
      setHasSearched(true);
      setIsSearching(true);

      const cleanRoll = normalizeRollDigits(params.roll);
      if (!cleanRoll) {
        setErrorMsg(
          isBn
            ? 'অনুগ্রহ করে শিক্ষার্থীর সঠিক রোল নম্বর লিখুন।'
            : 'Please enter a valid student roll number.'
        );
        setFoundStudent(null);
        setFoundMarksheetData(null);
        setIsSearching(false);
        return;
      }

      if (!params.skipCloud) {
        try {
          await firebaseSyncService.fetchPublicResultDataFromCloud();
        } catch {
          // Offline / cached fallback is allowed
        }
      }

      // 0. Strict Publication Gate
      const isExamPublished = examService.isExamResultPublished(params.exam);
      if (!isExamPublished) {
        setFoundStudent(null);
        setFoundMarksheetData(null);
        setIsSearching(false);
        setErrorMsg(
          isBn
            ? 'নির্বাচিত পরীক্ষার ফলাফল এখনো অনলাইনে প্রকাশিত হয়নি। অনুগ্রহ করে পরে আবার চেষ্টা করুন অথবা বিদ্যালয় কর্তৃপক্ষের সাথে যোগাযোগ করুন।'
            : 'The results for this examination have not been published yet. Please check back later or contact school authorities.'
        );
        return;
      }

      const class9or10 = params.grade === '9th' || params.grade === '10th';

      // 1. Load students for current selection (section 'all' so search works without section dropdown)
      const classStudents = getStudentsForClassSectionGroup(
        params.grade,
        'all',
        class9or10 ? params.group : 'General'
      );

      const targetRollNum = parseInt(cleanRoll.replace(/\D/g, ''), 10);

      // 2. Match student by roll number (normalized Bangla/English digits)
      let matched = classStudents.find((s) => {
        const sClean = normalizeRollDigits(s.roll || '');
        const sRollNum = parseInt(sClean.replace(/\D/g, ''), 10);
        return (!Number.isNaN(targetRollNum) && sRollNum === targetRollNum) || sClean === cleanRoll;
      });

      // 3. Fallback: Search across all stored students
      if (!matched) {
        const all = studentService.getAllStudents();
        const globalMatch = all.find((s) => {
          const sGrade = (s.grade || s.gradeBn || '').trim();
          const sClean = normalizeRollDigits(s.roll || '');
          const sRollNum = parseInt(sClean.replace(/\D/g, ''), 10);
          const isGradeMatch =
            sGrade === params.grade ||
            sGrade.includes(params.grade) ||
            (params.grade === '6th' && (sGrade.includes('6') || sGrade.includes('Six') || sGrade.includes('৬'))) ||
            (params.grade === '7th' && (sGrade.includes('7') || sGrade.includes('Seven') || sGrade.includes('৭'))) ||
            (params.grade === '8th' && (sGrade.includes('8') || sGrade.includes('Eight') || sGrade.includes('৮'))) ||
            (params.grade === '9th' && (sGrade.includes('9') || sGrade.includes('Nine') || sGrade.includes('৯'))) ||
            (params.grade === '10th' && (sGrade.includes('10') || sGrade.includes('Ten') || sGrade.includes('১০')));

          let isGroupMatch = true;
          if (class9or10) {
            const g = (s.group || '').toLowerCase();
            const selG = params.group.toLowerCase();
            isGroupMatch =
              g === selG ||
              g.includes(selG) ||
              (selG.includes('science') && (g.includes('science') || g.includes('বিজ্ঞান'))) ||
              (selG.includes('humanities') && (g.includes('humanities') || g.includes('মানবিক') || g.includes('arts'))) ||
              (selG.includes('business') && (g.includes('business') || g.includes('commerce') || g.includes('ব্যবসায়') || g.includes('ব্যবসায়')));
          }

          const isRollMatch =
            (!Number.isNaN(targetRollNum) && sRollNum === targetRollNum) || sClean === cleanRoll;
          return isGradeMatch && isGroupMatch && isRollMatch;
        });

        if (globalMatch) {
          const fallbackGuardian = (globalMatch as { guardian?: string }).guardian || '';
          matched = {
            id: globalMatch.id,
            roll: globalMatch.roll || cleanRoll,
            name: globalMatch.name,
            grade: params.grade,
            gradeBn: `Class ${params.grade.replace(/\D/g, '')}`,
            section: globalMatch.section || globalMatch.branch || 'A',
            group: class9or10 ? globalMatch.group || params.group : 'General',
            fatherName: globalMatch.fatherName || fallbackGuardian,
            motherName: globalMatch.motherName || '',
            session: globalMatch.session || String(new Date().getFullYear()),
            optionalSubject:
              globalMatch.optionalSubject ||
              (class9or10 &&
              ((globalMatch.group || params.group).includes('বিজ্ঞান') ||
                (globalMatch.group || params.group).toLowerCase().includes('science'))
                ? 'Higher Mathematics'
                : 'Agricultural Studies'),
          };
        }
      }

      if (!matched) {
        setFoundStudent(null);
        setFoundMarksheetData(null);
        setErrorMsg(
          isBn
            ? 'নির্বাচিত পরীক্ষা, শ্রেণি ও রোল নম্বরের সাথে কোনো শিক্ষার্থীর তথ্য পাওয়া যায়নি। অনুগ্রহ করে তথ্যগুলো যাচাই করুন।'
            : 'No student record found for the selected examination, class, and roll number. Please verify your details.'
        );
        setIsSearching(false);
        return;
      }

      // 4. Calculate exact marksheet data using shared NCTB engine
      const marksData = generateStudentMarksheetData(matched, {
        selectedExam: params.exam,
        selectedGrade: params.grade,
        selectedBranch: matched.section || 'A',
      });

      setFoundStudent(matched);
      setFoundMarksheetData(marksData);
      setSearchSuccess(true);
      setIsSearching(false);

      setTimeout(() => {
        document.getElementById('result-dashboard-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    },
    [isBn]
  );

  // Auto-run search if deep-linked with ?roll=...
  useEffect(() => {
    if (!mounted || !cloudSyncedOnce || autoSearchedRef.current) return;
    if (initialUrlRoll && initialUrlRoll.trim()) {
      autoSearchedRef.current = true;
      void runSearch({
        exam: selectedExam,
        grade: selectedGrade,
        group: selectedGroup,
        roll: initialUrlRoll,
        skipCloud: true,
      });
    }
  }, [mounted, cloudSyncedOnce, initialUrlRoll, selectedExam, selectedGrade, selectedGroup, runSearch]);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    void runSearch({
      exam: selectedExam,
      grade: selectedGrade,
      group: selectedGroup,
      roll: rollInput,
    });
  };

  const handlePrintResult = () => {
    triggerProfessionalPrint([
      settings?.schoolName || 'SchoolPro',
      'Academic_Transcript',
      foundStudent?.grade || selectedGrade,
      foundStudent?.roll ? `Roll_${normalizeRollDigits(foundStudent.roll)}` : undefined,
      foundStudent?.name,
    ]);
  };

  const handleDownloadReportCard = () => {
    setPdfHelpToast(true);
    setTimeout(() => {
      handlePrintResult();
    }, 280);
    setTimeout(() => {
      setPdfHelpToast(false);
    }, 6500);
  };

  const handleCopyShareLink = async () => {
    if (typeof window === 'undefined' || !foundStudent) return;
    const shareUrl = buildResultShareUrl(window.location.origin, {
      exam: selectedExam,
      grade: selectedGrade,
      group: selectedGroup,
      roll: foundStudent.roll,
    });
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Fallback copy
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleResetSearch = () => {
    setRollInput('');
    setFoundStudent(null);
    setFoundMarksheetData(null);
    setHasSearched(false);
    setErrorMsg('');
    setSearchSuccess(false);
    setResultViewMode('marksheet');
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-800 dark:text-slate-200">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#0B5D3B] border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 dark:text-slate-400 font-semibold text-sm">
            ফলাফল পোর্টাল লোড হচ্ছে...
          </p>
        </div>
      </div>
    );
  }

  // School branding resolved for selected UI language
  const schoolDisplayName = isBn
    ? settings?.schoolName || resolveEnglishSchoolName(settings)
    : resolveEnglishSchoolName(settings);
  const schoolDisplayAddress = isBn
    ? settings?.address || resolveEnglishAddress(settings)
    : resolveEnglishAddress(settings);

  // Selected examination metadata
  const currentExamMeta = activeExams.find(
    (ex) => ex.title === selectedExam || examService.formatExamNameForDisplay(ex.title) === selectedExam
  );
  const isCurrentExamPublished = examService.isExamResultPublished(selectedExam);
  const publishedExamCount = activeExams.filter((e) => Boolean(e.isPublished)).length;

  // Performance summary metrics
  const totalObtainedMarks = foundMarksheetData?.totalObtained ?? 0;
  const totalMaxMarks = foundMarksheetData?.totalFull ?? 0;
  const rawPercentage = totalMaxMarks > 0 ? (totalObtainedMarks / totalMaxMarks) * 100 : 0;
  const averagePercentage = rawPercentage.toFixed(1);
  const gpaScore = foundMarksheetData?.hasFailed
    ? '0.00'
    : foundMarksheetData?.finalGPA !== undefined
    ? foundMarksheetData.finalGPA.toFixed(2)
    : '0.00';
  const bonusGp = foundMarksheetData?.bonusGP ?? 0;
  const isPassed = !foundMarksheetData?.hasFailed;
  const overallGrade = foundMarksheetData?.overallGrade || 'N/A';
  const resultStatusLabel = isPassed
    ? isBn
      ? 'উত্তীর্ণ'
      : 'PASSED'
    : isBn
    ? 'অকৃতকার্য'
    : 'FAILED';

  const subjectsList: SubjectMark[] = foundMarksheetData?.subjects || [];
  const optionalSubMark: SubjectMark | null = foundMarksheetData?.optionalSubject || null;
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans relative overflow-x-hidden selection:bg-emerald-600 selection:text-white print:bg-white print:text-black print:min-h-0 print:h-auto print:block print:p-0 print:m-0">
      {/* ═════════════════════════════════════════════════════════════ */}
      {/* 🏛️ INSTITUTIONAL TOP ACCENT & NAVIGATION HEADER (print:hidden) */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <div className="h-1 bg-gradient-to-r from-[#064e3b] via-[#0B5D3B] to-teal-500 print:hidden" />

      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800 shadow-2xs print:hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
          {/* Left: Official School Crest & Identity */}
          <Link
            href="/"
            className="flex items-center gap-3 min-w-0 group"
            title={isBn ? 'মূল ওয়েবসাইটে ফিরে যান' : 'Back to School Home'}
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#0B5D3B] to-emerald-600 p-0.5 shadow-md shadow-emerald-900/15 group-hover:scale-[1.03] transition-transform shrink-0">
              <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[10px] flex items-center justify-center overflow-hidden p-1">
                {settings?.schoolLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={settings.schoolLogo}
                    alt={schoolDisplayName}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <GraduationCap className="w-6 h-6 text-[#0B5D3B] dark:text-emerald-400" />
                )}
              </div>
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base lg:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight truncate group-hover:text-[#0B5D3B] dark:group-hover:text-emerald-400 transition-colors">
                {schoolDisplayName}
              </h1>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                <span className="truncate max-w-[200px] sm:max-w-xs">{schoolDisplayAddress}</span>
                {settings?.eiin && (
                  <>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="font-mono font-bold text-slate-600 dark:text-slate-300">
                      EIIN: {formatPortalNumber(settings.eiin, lang)}
                    </span>
                  </>
                )}
                {settings?.estdYear && (
                  <span className="hidden md:inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    {isBn ? 'স্থাপিত:' : 'ESTD:'} {formatPortalNumber(settings.estdYear, lang)}
                  </span>
                )}
              </div>
            </div>
          </Link>

          {/* Right: Language Switcher & Compact Portal Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Bilingual Pill Switcher */}
            <div
              className="inline-flex items-center rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700"
              role="group"
              aria-label="Language Switcher"
            >
              <button
                type="button"
                onClick={() => setLang('bn')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                  isBn
                    ? 'bg-[#0B5D3B] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                বাংলা
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                  !isBn
                    ? 'bg-[#0B5D3B] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                EN
              </button>
            </div>

            <Link
              href="/"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition"
            >
              <Home className="w-3.5 h-3.5 text-[#0B5D3B] dark:text-emerald-400" />
              <span>{isBn ? 'হোম' : 'Home'}</span>
            </Link>

            <Link
              href="/verify-certificate"
              className="hidden lg:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition"
            >
              <FileBadge2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>{isBn ? 'সনদ যাচাই' : 'Verify'}</span>
            </Link>

            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-lg bg-[#0B5D3B] hover:bg-emerald-800 text-white shadow-sm shadow-emerald-900/20 transition active:scale-[0.98]"
            >
              <User className="w-3.5 h-3.5" />
              <span>{isBn ? 'লগইন' : 'Login'}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* 🎓 INSTITUTIONAL EMERALD HERO BANNER (print:hidden)          */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <section className="relative bg-gradient-to-br from-[#053b26] via-[#0B5D3B] to-[#0f172a] text-white pt-8 pb-20 sm:pt-10 sm:pb-24 overflow-hidden print:hidden">
        {/* Subtle Architectural Grid Overlay */}
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }}
        />
        <div className="absolute -top-24 right-0 w-96 h-96 bg-emerald-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 left-0 w-80 h-80 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          {/* Official Status Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide bg-white/10 border border-white/20 text-emerald-100 backdrop-blur-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span>
                {isBn ? 'অফিশিয়াল অনলাইন ফলাফল পোর্টাল (NCTB)' : 'OFFICIAL NCTB RESULT PORTAL'}
              </span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-black/20 border border-white/15 text-emerald-100/90 backdrop-blur-sm">
              {isSyncingCloud ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin text-emerald-300" />
                  <span>{isBn ? 'ক্লাউড ডাটা হালনাগাদ হচ্ছে...' : 'Syncing Live Data...'}</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <Cloud className="w-3 h-3 text-emerald-300" />
                  <span>
                    {isBn
                      ? `লাইভ ডাটা সংযুক্ত • ${formatPortalNumber(publishedExamCount, lang)}টি প্রকাশিত পরীক্ষা`
                      : `Live Sync Active • ${publishedExamCount} Published Exam${publishedExamCount === 1 ? '' : 's'}`}
                  </span>
                </>
              )}
            </span>
          </div>

          {/* Hero Title & Subtitle */}
          <div className="space-y-2 max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight">
              {isBn
                ? 'অনলাইন পরীক্ষার ফলাফল ও একাডেমিক ট্রান্সক্রিপ্ট'
                : 'Online Examination Results & Academic Transcript'}
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/85 font-medium leading-relaxed max-w-2xl mx-auto">
              {isBn
                ? 'পরীক্ষা, শ্রেণি এবং শিক্ষার্থীর রোল নম্বর দিয়ে তাৎক্ষণিক ফলাফল দেখুন এবং অফিশিয়াল A4 মার্কশিট প্রিন্ট অথবা PDF ডাউনলোড করুন।'
                : 'Instantly look up verified examination results by roll number and print or save your official A4 academic transcript as PDF.'}
            </p>
          </div>

          {/* Quick Interactive Exam Selector Strip */}
          {activeExams.length > 0 && (
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto">
              {activeExams.slice(0, 5).map((exam) => {
                const displayLabel = examService.formatExamNameForDisplay(exam.title);
                const isSelected =
                  selectedExam === exam.title ||
                  examService.formatExamNameForDisplay(selectedExam) === displayLabel;
                const isPub = Boolean(exam.isPublished);
                return (
                  <button
                    key={exam.id}
                    type="button"
                    onClick={() => setSelectedExam(exam.title)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer border ${
                      isSelected
                        ? 'bg-white text-[#064e3b] border-white shadow-md'
                        : 'bg-white/10 hover:bg-white/18 text-white/90 border-white/20'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        isPub ? 'bg-emerald-500' : 'bg-amber-400'
                      }`}
                    />
                    <span className="truncate max-w-[200px]">{displayLabel}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                        isSelected
                          ? isPub
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                          : isPub
                          ? 'bg-emerald-400/20 text-emerald-100'
                          : 'bg-amber-400/20 text-amber-100'
                      }`}
                    >
                      {isPub ? (isBn ? 'প্রকাশিত' : 'Live') : isBn ? 'অপ্রকাশিত' : 'Pending'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* 🔍 MAIN CONTENT CONTAINER                                     */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 -mt-12 sm:-mt-14 pb-12 space-y-8 relative z-20 print:p-0 print:m-0 print:mt-0 print:pb-0 print:space-y-0 print:max-w-none print:w-full print:block">
        {/* ─── ELEVATED SEARCH CONSOLE CARD (print:hidden) ─── */}
        <div id="search-section" className="space-y-4 print:hidden">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-900/8 dark:shadow-black/50 overflow-hidden">
            {/* Publication Status Strip */}
            {!isCurrentExamPublished ? (
              <div className="px-5 py-3 bg-amber-50 dark:bg-amber-950/50 border-b border-amber-200/80 dark:border-amber-800/60 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5 text-amber-900 dark:text-amber-200 text-xs sm:text-sm font-semibold">
                  <span className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/80 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                    <Lock className="w-3.5 h-3.5" />
                  </span>
                  <span>
                    {isBn
                      ? 'এই পরীক্ষার ফলাফল এখনো প্রকাশিত হয়নি — বিদ্যালয় কর্তৃপক্ষ প্রকাশ করলে এখান থেকে দেখতে পারবেন।'
                      : 'Results for this examination are not published yet. Please select a published exam or check back later.'}
                  </span>
                </div>
                {currentExamMeta?.date && (
                  <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-900/50 px-2.5 py-1 rounded-md">
                    {currentExamMeta.date}
                  </span>
                )}
              </div>
            ) : (
              <div className="px-5 py-3 bg-emerald-50/90 dark:bg-emerald-950/40 border-b border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5 text-emerald-900 dark:text-emerald-200 text-xs sm:text-sm font-semibold">
                  <span className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </span>
                  <span>
                    {isBn
                      ? 'ফলাফল প্রকাশিত হয়েছে — শ্রেণি ও রোল নম্বর লিখে আপনার পূর্ণাঙ্গ মার্কশিট দেখুন।'
                      : 'Examination results are published and live. Select class and enter your roll number below.'}
                  </span>
                </div>
                {currentExamMeta?.date && (
                  <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-900/50 px-2.5 py-1 rounded-md">
                    {currentExamMeta.date}
                  </span>
                )}
              </div>
            )}

            {/* Search Form Controls */}
            <form onSubmit={handleSearch} className="p-5 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-end">
                {/* 1. Examination */}
                <div className={`${isClass9or10 ? 'lg:col-span-4' : 'lg:col-span-5'} space-y-1.5`}>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#0B5D3B] dark:text-emerald-400" />
                    <span>{isBn ? 'পরীক্ষার নাম' : 'Examination'}</span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedExam}
                      onChange={(e) => setSelectedExam(e.target.value)}
                      className="w-full h-11 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 pr-9 text-sm font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-600/20 focus:border-[#0B5D3B] appearance-none cursor-pointer transition outline-none"
                    >
                      {activeExams.length > 0 ? (
                        activeExams.map((exam) => {
                          const displayLabel = examService.formatExamNameForDisplay(exam.title);
                          const isPub = Boolean(exam.isPublished);
                          return (
                            <option
                              key={exam.id}
                              value={exam.title}
                              className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                            >
                              {displayLabel} — {isPub ? (isBn ? 'প্রকাশিত ✓' : 'Published ✓') : isBn ? 'অপ্রকাশিত' : 'Unpublished'}
                            </option>
                          );
                        })
                      ) : (
                        <option value="Annual Examination 2026">
                          Annual Examination 2026
                        </option>
                      )}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* 2. Class */}
                <div className="lg:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-[#0B5D3B] dark:text-emerald-400" />
                    <span>{isBn ? 'শ্রেণি' : 'Class'}</span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedGrade}
                      onChange={(e) => setSelectedGrade(e.target.value)}
                      className="w-full h-11 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 pr-9 text-sm font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-600/20 focus:border-[#0B5D3B] appearance-none cursor-pointer transition outline-none"
                    >
                      {PORTAL_CLASS_OPTIONS.map((cls) => (
                        <option
                          key={cls.value}
                          value={cls.value}
                          className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        >
                          {isBn ? cls.labelBn : cls.labelEn}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* 3. Group (Conditional ONLY for Class 9 & 10) */}
                {isClass9or10 && (
                  <div className="lg:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-[#0B5D3B] dark:text-emerald-400" />
                      <span>{isBn ? 'বিভাগ' : 'Group'}</span>
                    </label>
                    <div className="relative">
                      <select
                        value={selectedGroup}
                        onChange={(e) => setSelectedGroup(e.target.value)}
                        className="w-full h-11 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 pr-9 text-sm font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-600/20 focus:border-[#0B5D3B] appearance-none cursor-pointer transition outline-none"
                      >
                        {PORTAL_GROUP_OPTIONS.map((grp) => (
                          <option
                            key={grp.value}
                            value={grp.value}
                            className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                          >
                            {isBn ? grp.labelBn : grp.labelEn}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                )}

                {/* 4. Roll Number (supports Bangla & English digits) */}
                <div className={`${isClass9or10 ? 'lg:col-span-2' : 'lg:col-span-2'} space-y-1.5`}>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-[#0B5D3B] dark:text-emerald-400" />
                    <span>{isBn ? 'রোল নম্বর' : 'Roll Number'}</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      value={rollInput}
                      onChange={(e) => setRollInput(e.target.value)}
                      placeholder={isBn ? 'যেমন: ০১ বা 01' : 'e.g. 01'}
                      className="w-full h-11 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 pr-8 text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 font-mono focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-600/20 focus:border-[#0B5D3B] transition outline-none"
                    />
                    {rollInput && (
                      <button
                        type="button"
                        onClick={() => setRollInput('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xs p-1 rounded cursor-pointer"
                        title={isBn ? 'মুছুন' : 'Clear'}
                        aria-label={isBn ? 'রোল নম্বর মুছুন' : 'Clear roll number'}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* 5. Submit & Reset Actions */}
                <div
                  className={`${
                    isClass9or10 ? 'sm:col-span-2 lg:col-span-2' : 'sm:col-span-2 lg:col-span-3'
                  } flex items-center gap-2`}
                >
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="flex-1 h-11 px-4 rounded-xl bg-[#0B5D3B] hover:bg-emerald-800 text-white font-bold text-sm shadow-md shadow-emerald-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {isSearching ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>{isBn ? 'খোঁজা হচ্ছে...' : 'Searching...'}</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        <span>{isBn ? 'ফলাফল দেখুন' : 'View Result'}</span>
                      </>
                    )}
                  </button>

                  {hasSearched && (
                    <button
                      type="button"
                      onClick={handleResetSearch}
                      className="h-11 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 transition flex items-center justify-center gap-1 cursor-pointer shrink-0"
                      title={isBn ? 'নতুন অনুসন্ধান' : 'Reset search'}
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span className="hidden xl:inline">{isBn ? 'রিসেট' : 'Reset'}</span>
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>

          {/* Inline Error Alert */}
          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 text-rose-900 dark:text-rose-200 text-sm flex items-start gap-3 shadow-xs">
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold">{errorMsg}</p>
                <p className="text-xs text-rose-700/85 dark:text-rose-300/80">
                  {isBn
                    ? 'সঠিক পরীক্ষা, শ্রেণি (নবম-দশম হলে বিভাগ) এবং রোল নম্বর যাচাই করে পুনরায় চেষ্টা করুন।'
                    : 'Please double-check the selected examination, class, group (for Class 9–10), and roll number.'}
                </p>
              </div>
            </div>
          )}

          {/* Subtle Success Confirmation */}
          {searchSuccess && foundStudent && isCurrentExamPublished && (
            <div className="px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/70 text-emerald-900 dark:text-emerald-200 text-xs sm:text-sm flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  {isBn ? (
                    <>
                      <strong>{foundStudent.name}</strong> (রোল:{' '}
                      <span className="font-mono font-bold">
                        {formatPortalNumber(foundStudent.roll, lang)}
                      </span>
                      )-এর ফলাফল সফলভাবে পাওয়া গেছে।
                    </>
                  ) : (
                    <>
                      Verified result loaded for <strong>{foundStudent.name}</strong> (Roll:{' '}
                      <span className="font-mono font-bold">{foundStudent.roll}</span>).
                    </>
                  )}
                </span>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                <ShieldCheck className="w-3.5 h-3.5" />
                {isBn ? 'যাচাইকৃত রেকর্ড' : 'Verified'}
              </span>
            </div>
          )}
        </div>

        {/* ═════════════════════════════════════════════════════════════ */}
        {/* 🔒 UNPUBLISHED EXAM NOTICE (When searched on unpublished exam) */}
        {/* ═════════════════════════════════════════════════════════════ */}
        {hasSearched && !isCurrentExamPublished && (
          <div className="max-w-2xl mx-auto p-8 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/60 text-center space-y-4 shadow-md print:hidden">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400">
              <Lock className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                {isBn ? 'ফলাফল এখনো প্রকাশিত হয়নি' : 'Results Not Published Yet'}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {isBn ? (
                  <>
                    <strong>&ldquo;{examService.formatExamNameForDisplay(selectedExam)}&rdquo;</strong>-এর
                    ফলাফল এখনো অনলাইনে উন্মুক্ত করা হয়নি।
                  </>
                ) : (
                  <>
                    Official results for{' '}
                    <strong>&ldquo;{examService.formatExamNameForDisplay(selectedExam)}&rdquo;</strong> have
                    not been released online yet.
                  </>
                )}
              </p>
            </div>
            <div className="pt-1">
              <button
                type="button"
                onClick={handleResetSearch}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition cursor-pointer"
              >
                {isBn ? 'অন্য পরীক্ষা নির্বাচন করুন' : 'Select Another Exam'}
              </button>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════ */}
        {/* 📘 PRE-SEARCH INSTITUTIONAL GUIDE & NCTB GRADING SCALE        */}
        {/* ═════════════════════════════════════════════════════════════ */}
        {!foundStudent && (!hasSearched || isCurrentExamPublished) && (
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:hidden">
            {/* Left: Step-by-step Guide + Helpdesk */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-[#0B5D3B] dark:text-emerald-400 flex items-center justify-center border border-emerald-200/70 dark:border-emerald-800">
                      <BookOpen className="w-4 h-4" />
                    </span>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {isBn ? 'অনলাইনে ফলাফল দেখার নিয়মাবলি' : 'How to Check Your Result'}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isBn
                          ? 'সহজ ৩টি ধাপে আপনার অফিশিয়াল মার্কশিট সংগ্রহ করুন'
                          : 'Retrieve your verified A4 marksheet in 3 quick steps'}
                      </p>
                    </div>
                  </div>
                </div>

                <ol className="space-y-3.5">
                  {[
                    {
                      step: isBn ? '০১' : '01',
                      title: isBn ? 'পরীক্ষা ও শ্রেণি নির্বাচন করুন' : 'Select Examination & Class',
                      desc: isBn
                        ? 'উপরের তালিকা থেকে প্রকাশিত পরীক্ষা এবং আপনার শ্রেণি (৬ষ্ঠ থেকে ১০ম) নির্বাচন করুন। নবম-দশম শ্রেণির ক্ষেত্রে বিভাগ (বিজ্ঞান/মানবিক/ব্যবসায় শিক্ষা) বেছে নিন।'
                        : 'Pick a published examination and your class (Class 6 to 10). For Class 9 and 10, also choose your academic group.',
                    },
                    {
                      step: isBn ? '০২' : '02',
                      title: isBn ? 'সঠিক রোল নম্বর লিখুন' : 'Enter Student Roll Number',
                      desc: isBn
                        ? 'বাংলা (০১) অথবা ইংরেজি (01)—যেকোনো সংখ্যায় শিক্ষার্থীর রোল নম্বর লিখে "ফলাফল দেখুন" বাটনে ক্লিক করুন।'
                        : 'Enter your roll number in either Bangla or English digits and click "View Result".',
                    },
                    {
                      step: isBn ? '০৩' : '03',
                      title: isBn ? 'A4 মার্কশিট প্রিন্ট বা PDF ডাউনলোড করুন' : 'Print or Save Official A4 PDF',
                      desc: isBn
                        ? 'ফলাফল যাচাই করে সরাসরি প্রিন্ট করুন অথবা "PDF ডাউনলোড" বাটন থেকে "Save as PDF" নির্বাচন করে সংরক্ষণ করুন।'
                        : 'Review your subject-wise GPA summary and click "Download PDF" or "Print A4" for an official clean copy.',
                    },
                  ].map((item) => (
                    <li key={item.step} className="flex items-start gap-3.5">
                      <span className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-[#0B5D3B] dark:text-emerald-400 font-mono text-xs font-black flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 mt-0.5">
                        {item.step}
                      </span>
                      <div className="space-y-0.5">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                          {item.title}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Helpdesk & Quick Links Strip */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                  {settings?.phone && (
                    <span className="inline-flex items-center gap-1.5 font-semibold">
                      <Phone className="w-3.5 h-3.5 text-[#0B5D3B] dark:text-emerald-400" />
                      {formatPortalNumber(settings.phone, lang)}
                    </span>
                  )}
                  {settings?.email && (
                    <span className="inline-flex items-center gap-1.5 font-semibold">
                      <Mail className="w-3.5 h-3.5 text-[#0B5D3B] dark:text-emerald-400" />
                      {settings.email}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href="/admission"
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-[#0B5D3B] dark:text-emerald-400" />
                    <span>{isBn ? 'অনলাইন ভর্তি' : 'Admission'}</span>
                  </Link>
                  <Link
                    href="/verify-certificate"
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
                  >
                    <FileBadge2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span>{isBn ? 'সনদ যাচাই' : 'Verify Certificate'}</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Right: Official NCTB Grading Scale Reference */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-[#0B5D3B] dark:text-emerald-400 flex items-center justify-center border border-emerald-200/70 dark:border-emerald-800">
                    <Award className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {isBn ? 'সরকারি NCTB গ্রেডিং স্কেল' : 'Official NCTB Grading Scale'}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {isBn ? 'সর্বোচ্চ জিপিএ ৫.০০ ভিত্তিক মূল্যায়ন' : '5.00 GPA Secondary Evaluation Standard'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200/80 dark:border-slate-800">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200/80 dark:border-slate-700">
                      <th className="py-2 px-3 text-left font-bold">
                        {isBn ? 'নম্বর (%)' : 'Marks (%)'}
                      </th>
                      <th className="py-2 px-3 text-center font-bold">
                        {isBn ? 'গ্রেড' : 'Grade'}
                      </th>
                      <th className="py-2 px-3 text-center font-bold">
                        {isBn ? 'পয়েন্ট' : 'GP'}
                      </th>
                      <th className="py-2 px-3 text-right font-bold">
                        {isBn ? 'মন্তব্য' : 'Remarks'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {NCTB_GRADING_SCALE.map((row) => (
                      <tr
                        key={row.grade}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-2 px-3 font-mono font-semibold text-slate-700 dark:text-slate-200">
                          {isBn ? row.intervalBn : row.interval}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span
                            className={`inline-flex items-center justify-center min-w-[34px] px-2 py-0.5 rounded-md font-extrabold border text-[11px] ${row.badgeClass}`}
                          >
                            {row.grade}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-slate-800 dark:text-slate-100">
                          {isBn ? row.pointBn : row.point}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-500 dark:text-slate-400 font-medium">
                          {isBn ? row.remarkBn : row.remarkEn}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* ═════════════════════════════════════════════════════════════ */}
        {/* 📊 EXECUTIVE RESULT SHOWCASE & OFFICIAL A4 TRANSCRIPT         */}
        {/* ═════════════════════════════════════════════════════════════ */}
        {foundStudent && foundMarksheetData && isCurrentExamPublished && (
          <div
            id="result-dashboard-section"
            className="space-y-6 pt-1 print:space-y-0 print:pt-0 print:p-0 print:m-0 print:block print:w-full"
          >
            {/* 1. Executive Result Command Toolbar (Hidden on Print) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-sm print:hidden">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Student Summary Title */}
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wide border ${
                        isPassed
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                          : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                      }`}
                    >
                      {isPassed ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5" />
                      )}
                      {resultStatusLabel}
                    </span>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      {examService.formatExamNameForDisplay(selectedExam)}
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate">
                    {foundStudent.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                    <span>
                      {isBn ? 'রোল:' : 'Roll:'}{' '}
                      <strong className="font-mono text-slate-900 dark:text-white">
                        {formatPortalNumber(foundStudent.roll, lang)}
                      </strong>
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span>{formatPortalClassName(foundStudent.grade, lang)}</span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span>
                      {isBn ? `শাখা: ${foundStudent.section || 'A'}` : `Section ${foundStudent.section || 'A'}`}
                    </span>
                    {isClass9or10 && (
                      <>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span>{formatPortalGroupName(foundStudent.group, lang)}</span>
                      </>
                    )}
                    {foundStudent.fatherName && (
                      <>
                        <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
                        <span className="hidden sm:inline">
                          {isBn ? 'পিতা:' : 'Father:'} {foundStudent.fatherName}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleDownloadReportCard}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#0B5D3B] hover:bg-emerald-800 text-white text-xs font-bold shadow-md shadow-emerald-900/20 transition flex items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isBn ? 'PDF ডাউনলোড' : 'Download PDF'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrintResult}
                    className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold border border-slate-200 dark:border-slate-700 transition flex items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-[#0B5D3B] dark:text-emerald-400" />
                    <span>{isBn ? 'প্রিন্ট (A4)' : 'Print A4'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyShareLink}
                    className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
                    title={isBn ? 'সরাসরি ফলাফলের লিঙ্ক কপি করুন' : 'Copy direct result link'}
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span className="text-emerald-700 dark:text-emerald-400">
                          {isBn ? 'কপি হয়েছে' : 'Copied'}
                        </span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-slate-500" />
                        <span className="hidden sm:inline">{isBn ? 'লিঙ্ক কপি' : 'Copy Link'}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      document.getElementById('search-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-800 transition flex items-center justify-center gap-1.5 cursor-pointer"
                    title={isBn ? 'অন্য রোল খুঁজুন' : 'Search another roll'}
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">{isBn ? 'নতুন খোঁজ' : 'New Search'}</span>
                  </button>
                </div>
              </div>

              {/* PDF Tip Banner */}
              {pdfHelpToast && (
                <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-700/60 rounded-xl text-emerald-900 dark:text-emerald-200 text-xs flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    {isBn ? (
                      <>
                        টিপস: প্রিন্ট ডায়ালগে Destination হিসেবে <strong>&ldquo;Save as PDF&rdquo;</strong> নির্বাচন
                        করলে সম্পূর্ণ A4 মার্কশিট নিখুঁত PDF হিসেবে ডাউনলোড হবে।
                      </>
                    ) : (
                      <>
                        Tip: Choose <strong>&ldquo;Save as PDF&rdquo;</strong> as the Destination in the print dialog
                        to save your crisp A4 academic transcript.
                      </>
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* 2. Four Crisp Executive KPI Metric Cards (Hidden on Print) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 print:hidden">
              {/* KPI 1: Total Marks */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                  <span>{isBn ? 'মোট প্রাপ্ত নম্বর' : 'Total Marks'}</span>
                  <Award className="w-4 h-4 text-[#0B5D3B] dark:text-emerald-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                  {formatPortalNumber(totalObtainedMarks, lang)}{' '}
                  <span className="text-sm font-semibold text-slate-400">
                    / {formatPortalNumber(totalMaxMarks, lang)}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isPassed ? 'bg-[#0B5D3B] dark:bg-emerald-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, rawPercentage))}%` }}
                  />
                </div>
              </div>

              {/* KPI 2: Overall Percentage */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                  <span>{isBn ? 'শতকরা হার' : 'Overall Percentage'}</span>
                  <TrendingUp className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                  {formatPortalNumber(averagePercentage, lang)}%
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {isBn
                    ? `মোট ${formatPortalNumber(subjectsList.length + (optionalSubMark ? 1 : 0), lang)}টি বিষয়ে মূল্যায়িত`
                    : `Across ${subjectsList.length + (optionalSubMark ? 1 : 0)} evaluated subjects`}
                </p>
              </div>

              {/* KPI 3: Final GPA */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                  <span>{isBn ? 'চূড়ান্ত জিপিএ' : 'Final GPA'}</span>
                  <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                  {formatPortalNumber(gpaScore, lang)}{' '}
                  <span className="text-sm font-semibold text-slate-400">
                    / {formatPortalNumber('5.00', lang)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {bonusGp > 0 && isPassed
                    ? isBn
                      ? `৪র্থ বিষয় বোনাস: +${formatPortalNumber(bonusGp.toFixed(2), lang)} পয়েন্ট`
                      : `Includes +${bonusGp.toFixed(2)} 4th-subject bonus`
                    : isBn
                    ? 'NCTB ৫.০০ স্কেল অনুযায়ী'
                    : 'NCTB 5.00 GPA Scale'}
                </p>
              </div>

              {/* KPI 4: Grade & Status */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                  <span>{isBn ? 'লেটার গ্রেড ও ফলাফল' : 'Grade & Status'}</span>
                  {isPassed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                  )}
                </div>
                <div className="flex items-center gap-2.5">
                  <span
                    className={`inline-flex items-center justify-center min-w-[44px] px-2.5 py-1 rounded-xl text-xl font-black border ${getGradeBadgeStyle(
                      overallGrade
                    )}`}
                  >
                    {overallGrade}
                  </span>
                  <span
                    className={`text-sm font-extrabold uppercase tracking-wide ${
                      isPassed
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-rose-700 dark:text-rose-400'
                    }`}
                  >
                    {resultStatusLabel}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {isBn
                    ? `শিক্ষাবর্ষ: ${formatPortalNumber(foundStudent.session || currentYear, lang)}`
                    : `Session: ${foundStudent.session || currentYear}`}
                </p>
              </div>
            </div>

            {/* 3. Document View Switcher (Hidden on Print) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 print:hidden">
              <div className="inline-flex items-center rounded-xl bg-white dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-800 shadow-2xs self-start">
                <button
                  type="button"
                  onClick={() => setResultViewMode('marksheet')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                    resultViewMode === 'marksheet'
                      ? 'bg-[#0B5D3B] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{isBn ? 'অফিশিয়াল A4 মার্কশিট' : 'Official A4 Marksheet'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setResultViewMode('breakdown')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                    resultViewMode === 'breakdown'
                      ? 'bg-[#0B5D3B] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Table2 className="w-3.5 h-3.5" />
                  <span>{isBn ? 'বিষয়ভিত্তিক সংক্ষিপ্ত তালিকা' : 'Subject-wise Summary'}</span>
                </button>
              </div>

              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#0B5D3B] dark:text-emerald-400" />
                {resultViewMode === 'marksheet'
                  ? isBn
                    ? 'A4 পোর্ট্রেট প্রিন্ট প্রিভিউ (অফিশিয়াল ইংরেজি ফরম্যাট)'
                    : 'Official A4 Portrait Institutional Transcript'
                  : isBn
                  ? 'মোবাইল-বান্ধব বিষয়ভিত্তিক নম্বর ও গ্রেড বিশ্লেষণ'
                  : 'Responsive Subject-wise Marks & Grade Breakdown'}
              </span>
            </div>

            {/* 4A. Subject-wise Mobile-Friendly Breakdown View (Hidden on Print) */}
            {resultViewMode === 'breakdown' && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs print:hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                        <th className="py-3 px-4 text-left font-bold">
                          {isBn ? 'কোড' : 'Code'}
                        </th>
                        <th className="py-3 px-4 text-left font-bold">
                          {isBn ? 'বিষয়ের নাম' : 'Subject'}
                        </th>
                        <th className="py-3 px-3 text-center font-bold">
                          {isBn ? 'পূর্ণমান' : 'Full'}
                        </th>
                        <th className="py-3 px-3 text-center font-bold">CQ</th>
                        <th className="py-3 px-3 text-center font-bold">MCQ</th>
                        <th className="py-3 px-3 text-center font-bold">
                          {isBn ? 'ব্যব.' : 'Prac'}
                        </th>
                        <th className="py-3 px-3 text-center font-bold">
                          {isBn ? 'মোট' : 'Total'}
                        </th>
                        <th className="py-3 px-3 text-center font-bold">
                          {isBn ? 'গ্রেড' : 'Grade'}
                        </th>
                        <th className="py-3 px-4 text-center font-bold">
                          {isBn ? 'পয়েন্ট' : 'GP'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {subjectsList.map((sub) => (
                        <tr
                          key={`${sub.code}-${sub.name}`}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-3 px-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                            {formatPortalNumber(sub.code, lang)}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                            {sub.name}
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-slate-500 dark:text-slate-400">
                            {formatPortalNumber(sub.fullMarks, lang)}
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-slate-700 dark:text-slate-200">
                            {formatPortalNumber(sub.cq, lang)}
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-slate-700 dark:text-slate-200">
                            {formatPortalNumber(sub.mcq, lang)}
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-slate-700 dark:text-slate-200">
                            {formatPortalNumber(sub.practical, lang)}
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-extrabold text-slate-900 dark:text-white">
                            {formatPortalNumber(sub.totalMarks, lang)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`inline-flex items-center justify-center min-w-[34px] px-2 py-0.5 rounded-md text-xs font-extrabold border ${getGradeBadgeStyle(
                                sub.letterGrade
                              )}`}
                            >
                              {sub.letterGrade || '—'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-slate-800 dark:text-slate-100">
                            {formatPortalNumber(
                              sub.gradePoint !== undefined ? sub.gradePoint.toFixed(2) : '0.00',
                              lang
                            )}
                          </td>
                        </tr>
                      ))}

                      {optionalSubMark && (
                        <tr className="bg-emerald-50/50 dark:bg-emerald-950/25">
                          <td className="py-3 px-4 font-mono text-xs text-emerald-700 dark:text-emerald-400">
                            {formatPortalNumber(optionalSubMark.code, lang)}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                            <div className="flex flex-wrap items-center gap-2">
                              <span>{optionalSubMark.name}</span>
                              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/70 text-emerald-800 dark:text-emerald-300">
                                {isBn ? '৪র্থ / ঐচ্ছিক বিষয়' : '4th / Optional'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-slate-500 dark:text-slate-400">
                            {formatPortalNumber(optionalSubMark.fullMarks, lang)}
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-slate-700 dark:text-slate-200">
                            {formatPortalNumber(optionalSubMark.cq, lang)}
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-slate-700 dark:text-slate-200">
                            {formatPortalNumber(optionalSubMark.mcq, lang)}
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-slate-700 dark:text-slate-200">
                            {formatPortalNumber(optionalSubMark.practical, lang)}
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-extrabold text-slate-900 dark:text-white">
                            {formatPortalNumber(optionalSubMark.totalMarks, lang)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`inline-flex items-center justify-center min-w-[34px] px-2 py-0.5 rounded-md text-xs font-extrabold border ${getGradeBadgeStyle(
                                optionalSubMark.letterGrade
                              )}`}
                            >
                              {optionalSubMark.letterGrade || '—'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-slate-800 dark:text-slate-100">
                            {formatPortalNumber(
                              optionalSubMark.gradePoint !== undefined
                                ? optionalSubMark.gradePoint.toFixed(2)
                                : '0.00',
                              lang
                            )}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 4B. Official A4 Academic Transcript Sheet (ALWAYS mounted in DOM for Print/PDF) */}
            <div
              className={`${
                resultViewMode === 'marksheet' ? 'block' : 'hidden print:block'
              } print:p-0 print:m-0 print:w-full`}
            >
              {/* Mobile horizontal scroll hint */}
              <div className="md:hidden mb-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-600 dark:text-slate-300 text-center print:hidden">
                {isBn
                  ? 'পুরো A4 মার্কশিট দেখতে বামে/ডানে স্ক্রল করুন অথবা উপরের "বিষয়ভিত্তিক সংক্ষিপ্ত তালিকা" ট্যাব দেখুন।'
                  : 'Swipe horizontally to view the full A4 transcript, or switch to "Subject-wise Summary" above.'}
              </div>

              <div className="overflow-x-auto w-full flex justify-start lg:justify-center bg-slate-200/70 dark:bg-slate-900/70 rounded-2xl p-3 sm:p-6 lg:p-8 border border-slate-300/70 dark:border-slate-800 print:bg-transparent print:p-0 print:m-0 print:border-none print:overflow-visible print:w-full print:rounded-none print:block">
                <div className="min-w-[780px] sm:min-w-[840px] w-full max-w-[850px] bg-white shadow-2xl shadow-slate-900/15 ring-1 ring-slate-900/10 rounded-[2px] print:min-w-0 print:w-full print:max-w-none print:p-0 print:m-0 print:shadow-none print:ring-0 print:rounded-none print:border-none print:block">
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
      {/* 🏛️ INSTITUTIONAL FOOTER (print:hidden)                       */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <footer className="border-t border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/80 py-6 mt-auto print:hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="text-center sm:text-left space-y-0.5">
            <p className="font-bold text-slate-700 dark:text-slate-200">
              © {formatPortalNumber(currentYear, lang)} {schoolDisplayName}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {schoolDisplayAddress}
              {settings?.eiin ? ` • EIIN: ${formatPortalNumber(settings.eiin, lang)}` : ''}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] font-semibold">
            <Link href="/" className="hover:text-[#0B5D3B] dark:hover:text-emerald-400 transition">
              {isBn ? 'মূল ওয়েবসাইট' : 'Home'}
            </Link>
            <Link href="/admission" className="hover:text-[#0B5D3B] dark:hover:text-emerald-400 transition">
              {isBn ? 'অনলাইন ভর্তি' : 'Online Admission'}
            </Link>
            <Link
              href="/verify-certificate"
              className="hover:text-[#0B5D3B] dark:hover:text-emerald-400 transition"
            >
              {isBn ? 'সনদ যাচাই' : 'Verify Certificate'}
            </Link>
            <Link href="/login" className="hover:text-[#0B5D3B] dark:hover:text-emerald-400 transition">
              {isBn ? 'অ্যাডমিন / শিক্ষক লগইন' : 'Portal Login'}
            </Link>
          </div>
        </div>
      </footer>

      {/* Canonical A4 Portrait 0mm Full-Bleed Marksheet Print & PDF Rules */}
      <style>{MARKSHEET_A4_PRINT_STYLES}</style>
    </div>
  );
}

export default function ResultPublicPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-800 dark:text-slate-200">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-[#0B5D3B] border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-500 dark:text-slate-400 font-semibold text-sm">
              ফলাফল পোর্টাল লোড হচ্ছে...
            </p>
          </div>
        </div>
      }
    >
      <ResultSearchContent />
    </Suspense>
  );
}
