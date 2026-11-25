'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  GraduationCap,
  FileSpreadsheet,
  ArrowRight,
  ArrowUpRight,
  School,
  UserCheck,
  Clock,
  CheckCircle2,
  BarChart3,
  PieChart,
  Table as TableIcon,
  Send,
  Wallet,
  Bell,
  Pin,
  RefreshCw,
  Award,
  Smartphone,
  Printer,
  LayoutDashboard,
  TrendingUp,
  BookOpen,
} from 'lucide-react';
import { studentService, Student } from '@/services/studentService';
import { settingsService, SchoolSettings } from '@/services/settingsService';
import { classSectionService } from '@/services/classSectionService';
import { leaveService, LeaveApplication, LEAVE_TYPE_LABELS } from '@/services/leaveService';
import { noticeService, Notice } from '@/services/noticeService';
import { financeService, FeeCollectionStats } from '@/services/financeService';
import { examService, ExamItem } from '@/services/examService';
import { attendanceService } from '@/services/attendanceService';
import { alumniService } from '@/services/alumniService';
import { libraryService } from '@/services/libraryService';
import { localDateKey } from '@/lib/dateUtils';
import { languageService, AppLanguage } from '@/services/languageService';
import { teacherAuthService } from '@/services/teacherAuthService';
import { getActiveCurriculumSubjects } from '@/lib/curriculumUtils';
import { getUniversalStudentMark } from '@/lib/markStorageUtils';
import { calculateGradeAndPoint } from '@/services/resultService';
import { URL_QUERY_CHANGED_EVENT, syncUrlQueryParams } from '@/lib/urlTabSync';
import { showToast } from '@/components/ui/ToastProvider';

import AttendanceTrendChart from '@/components/dashboard/AttendanceTrendChart';
import MonthlyAttendanceChart, {
  MonthlyClassAttendanceItem,
} from '@/components/dashboard/MonthlyAttendanceChart';
import DemographicsDonutChart from '@/components/dashboard/DemographicsDonutChart';
import ClassEnrollmentChart from '@/components/dashboard/ClassEnrollmentChart';
import QuickActionHub from '@/components/dashboard/QuickActionHub';
import SubjectPerformanceHeatmap, {
  SubjectHeatmapCell,
} from '@/components/dashboard/SubjectPerformanceHeatmap';
import ExecutiveExportBar from '@/components/dashboard/ExecutiveExportBar';

type DashboardTab = 'overview' | 'analytics' | 'exports';

interface ClassDemographicRow {
  gradeKey: string;
  gradeLabel: string;
  male: number;
  female: number;
  muslim: number;
  hindu: number;
  stipend: number;
  total: number;
}

interface GroupStreamRow {
  gradeKey: string;
  gradeLabel: string;
  scienceMale: number;
  scienceFemale: number;
  scienceTotal: number;
  humanitiesMale: number;
  humanitiesFemale: number;
  humanitiesTotal: number;
  commerceMale: number;
  commerceFemale: number;
  commerceTotal: number;
  total: number;
}

interface ClassAttendanceSummary {
  gradeKey: string;
  gradeLabel: string;
  total: number;
  present: number;
  absent: number;
  leave: number;
  rate: number;
  isTaken: boolean;
}

const formatCurrency = (amount: number, lang: AppLanguage) => {
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0;
  try {
    return `৳${safe.toLocaleString(lang === 'en' ? 'en-US' : 'bn-BD')}`;
  } catch {
    return `৳${safe}`;
  }
};

function matchesGrade(student: Student, gradeKey: string): boolean {
  const g = student.grade || student.gradeBn || '';
  return (
    g === gradeKey ||
    g.includes(gradeKey) ||
    (gradeKey === '6th' && (g.includes('6') || g.includes('৬'))) ||
    (gradeKey === '7th' && (g.includes('7') || g.includes('৭'))) ||
    (gradeKey === '8th' && (g.includes('8') || g.includes('৮'))) ||
    (gradeKey === '9th' && (g.includes('9') || g.includes('৯'))) ||
    (gradeKey === '10th' && (g.includes('10') || g.includes('১০')))
  );
}

function getGenderBucket(s: Student): 'male' | 'female' | 'unspecified' {
  const gen = (s.gender || '').toString().toLowerCase().trim();
  if (
    gen.includes('female') ||
    gen === 'f' ||
    gen.includes('নারী') ||
    gen.includes('মহিলা') ||
    gen.includes('ছাত্রী') ||
    gen.includes('মেয়ে') ||
    gen.includes('মেয়ে')
  ) {
    return 'female';
  }
  if (
    gen.includes('male') ||
    gen === 'm' ||
    gen.includes('পুরুষ') ||
    gen.includes('ছাত্র') ||
    gen.includes('ছেলে')
  ) {
    return 'male';
  }
  return 'unspecified';
}

function getReligionBucket(
  s: Student,
): 'muslim' | 'hindu' | 'buddhist' | 'christian' | 'other' | 'unspecified' {
  const rel = (s.religion || (s as { religionBn?: string }).religionBn || '')
    .toString()
    .toLowerCase()
    .trim();
  if (rel.includes('islam') || rel.includes('ইসলাম') || rel.includes('muslim') || rel.includes('মুসলিম')) {
    return 'muslim';
  }
  if (rel.includes('hindu') || rel.includes('হিন্দু') || rel.includes('sanatan') || rel.includes('সনাতন')) {
    return 'hindu';
  }
  if (rel.includes('buddhist') || rel.includes('বৌদ্ধ')) return 'buddhist';
  if (rel.includes('christian') || rel.includes('খ্রিস্টান') || rel.includes('খ্রিষ্টান')) return 'christian';
  if (rel.includes('other') || rel.includes('অন্যান্য')) return 'other';
  if (!rel) return 'unspecified';
  return 'other';
}

function UnifiedDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<DashboardTab>(() =>
    initialTabParam === 'analytics' || initialTabParam === 'exports'
      ? initialTabParam
      : 'overview',
  );

  const [mounted, setMounted] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings | null>(null);
  const [currentLang, setCurrentLang] = useState<AppLanguage>('bn');
  const [analyticsView, setAnalyticsView] = useState<'charts' | 'table'>('charts');
  const [attendanceView, setAttendanceView] = useState<'live' | 'monthly' | 'table'>('live');
  const [pendingLeaves, setPendingLeaves] = useState<LeaveApplication[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [teacherCount, setTeacherCount] = useState<number>(0);
  const [feeStats, setFeeStats] = useState<FeeCollectionStats | null>(null);
  const [syncing, setSyncing] = useState(false);

  // Merged Analytics & Export State
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [selectedExam, setSelectedExam] = useState<string>('Annual Examination 2026');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [alumniCount, setAlumniCount] = useState(0);
  const [activeLoansCount, setActiveLoansCount] = useState(0);

  useEffect(() => {
    const syncTabFromUrl = () => {
      const tabParam =
        typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('tab')
          : searchParams.get('tab');
      if (tabParam === 'analytics' || tabParam === 'exports' || tabParam === 'overview') {
        setActiveTab(tabParam);
      } else if (!tabParam) {
        setActiveTab('overview');
      }
    };
    syncTabFromUrl();
    window.addEventListener(URL_QUERY_CHANGED_EVENT, syncTabFromUrl);
    window.addEventListener('popstate', syncTabFromUrl);
    return () => {
      window.removeEventListener(URL_QUERY_CHANGED_EVENT, syncTabFromUrl);
      window.removeEventListener('popstate', syncTabFromUrl);
    };
  }, [searchParams]);

  const switchTab = (next: DashboardTab) => {
    setActiveTab(next);
    syncUrlQueryParams('/dashboard', { tab: next === 'overview' ? null : next });
  };

  const loadDashboardData = useCallback(() => {
    setStudents(studentService.getAllStudents());
    try {
      const allLeaves = leaveService.getLeaves();
      setPendingLeaves(allLeaves.filter((l) => l.status === 'pending'));
    } catch {}
    try {
      const teachers = teacherAuthService.getAllTeachers();
      setTeacherCount(teachers.length);
    } catch {}
    try {
      setNotices(noticeService.getNotices());
    } catch {}
    try {
      const payments = financeService.getPaymentHistory();
      setFeeStats(financeService.getFeeCollectionStats(payments));
    } catch {}
    try {
      const ex = examService.getExams();
      setExams(ex);
      if (ex.length > 0) {
        setSelectedExam((prev) => (ex.some((x) => x.title === prev) ? prev : ex[0].title));
      }
    } catch {}
    try {
      setAlumniCount(alumniService.getAlumni().length);
    } catch {}
    try {
      setActiveLoansCount(libraryService.getLoans().filter((l) => l.status === 'issued').length);
    } catch {}
  }, []);

  useEffect(() => {
    setMounted(true);
    setSchoolSettings(settingsService.getSettings());
    setCurrentLang(languageService.getLanguage());

    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sms_current_session');
      if (!stored) {
        router.replace('/login');
        return;
      }
      try {
        const sess = JSON.parse(stored);
        if (!sess || !sess.role) {
          router.replace('/login');
          return;
        }
        if (sess?.role === 'teacher') {
          router.replace('/dashboard/teacher-portal');
          return;
        }
      } catch {
        router.replace('/login');
        return;
      }
    }

    loadDashboardData();

    const unsubscribeStudents = studentService.subscribe(loadDashboardData);
    const unsubscribeLeaves = leaveService.subscribe(loadDashboardData);
    const unsubscribeNotices = noticeService.subscribe(loadDashboardData);
    const unsubscribeSettings = settingsService.subscribe((s) => setSchoolSettings(s));
    const unsubscribeLang = languageService.subscribe((l) => setCurrentLang(l));

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', loadDashboardData);
    }

    return () => {
      unsubscribeStudents();
      unsubscribeLeaves();
      unsubscribeNotices();
      unsubscribeSettings();
      unsubscribeLang();
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', loadDashboardData);
      }
    };
  }, [router, loadDashboardData]);

  const handleCloudSync = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      const { firebaseSyncService } = await import('@/services/firebaseSyncService');
      await firebaseSyncService.pullAllFromCloud();
      loadDashboardData();
      showToast('ক্লাউড ডেটা সফলভাবে সিঙ্ক হয়েছে।', 'success');
    } catch {
    } finally {
      setSyncing(false);
    }
  };

  // 1. Class Order & Demographics (Class 6–10)
  const classOrder = useMemo(
    () => [
      { key: '6th', shortLabel: currentLang === 'en' ? 'Class 6' : '৬ষ্ঠ', label: currentLang === 'en' ? 'Class 6' : '৬ষ্ঠ শ্রেণি' },
      { key: '7th', shortLabel: currentLang === 'en' ? 'Class 7' : '৭ম', label: currentLang === 'en' ? 'Class 7' : '৭ম শ্রেণি' },
      { key: '8th', shortLabel: currentLang === 'en' ? 'Class 8' : '৮ম', label: currentLang === 'en' ? 'Class 8' : '৮ম শ্রেণি' },
      { key: '9th', shortLabel: currentLang === 'en' ? 'Class 9' : '৯ম', label: currentLang === 'en' ? 'Class 9' : '৯ম শ্রেণি' },
      { key: '10th', shortLabel: currentLang === 'en' ? 'Class 10' : '১০ম', label: currentLang === 'en' ? 'Class 10' : '১০ম শ্রেণি' },
    ],
    [currentLang],
  );

  const demographics: ClassDemographicRow[] = useMemo(
    () =>
      classOrder.map((c) => {
        const classStudents = students.filter((s) => matchesGrade(s, c.key));
        let male = 0;
        let female = 0;
        let muslim = 0;
        let hindu = 0;
        let stipend = 0;

        classStudents.forEach((s) => {
          const gBucket = getGenderBucket(s);
          if (gBucket === 'female') female++;
          else if (gBucket === 'male') male++;

          const rBucket = getReligionBucket(s);
          if (rBucket === 'hindu') hindu++;
          else if (rBucket === 'muslim') muslim++;

          if (s.isStipend || s.stipendStatus === 'Active') stipend++;
        });

        return {
          gradeKey: c.key,
          gradeLabel: c.label,
          male,
          female,
          muslim,
          hindu,
          stipend,
          total: classStudents.length,
        };
      }),
    [classOrder, students],
  );

  const grandTotalStudents = students.length;
  const grandTotalMale = useMemo(
    () => students.filter((s) => getGenderBucket(s) === 'male').length,
    [students],
  );
  const grandTotalFemale = useMemo(
    () => students.filter((s) => getGenderBucket(s) === 'female').length,
    [students],
  );
  const grandTotalMuslim = useMemo(
    () => students.filter((s) => getReligionBucket(s) === 'muslim').length,
    [students],
  );
  const grandTotalHindu = useMemo(
    () => students.filter((s) => getReligionBucket(s) === 'hindu').length,
    [students],
  );
  const grandTotalStipend = useMemo(
    () => students.filter((s) => s.isStipend || s.stipendStatus === 'Active').length,
    [students],
  );
  const maleRatioPct =
    grandTotalStudents > 0 ? Math.round((grandTotalMale / grandTotalStudents) * 100) : 0;

  // 2. Group Stream Analytics for Class 9 & 10
  const groupStats: GroupStreamRow[] = useMemo(() => {
    const groupOrder = [
      { key: '9th', label: currentLang === 'en' ? 'Class 9' : '৯ম শ্রেণি' },
      { key: '10th', label: currentLang === 'en' ? 'Class 10' : '১০ম শ্রেণি' },
    ];
    return groupOrder.map((gItem) => {
      const gStudents = students.filter((s) => matchesGrade(s, gItem.key));
      let scienceMale = 0;
      let scienceFemale = 0;
      let humanitiesMale = 0;
      let humanitiesFemale = 0;
      let commerceMale = 0;
      let commerceFemale = 0;

      gStudents.forEach((s) => {
        const grp = (s.group || '').toLowerCase();
        const female = getGenderBucket(s) === 'female';
        if (grp.includes('science') || grp.includes('বিজ্ঞান')) {
          if (female) scienceFemale++;
          else scienceMale++;
        } else if (grp.includes('humanities') || grp.includes('মানবিক') || grp.includes('arts')) {
          if (female) humanitiesFemale++;
          else humanitiesMale++;
        } else if (
          grp.includes('commerce') ||
          grp.includes('ব্যবসায়') ||
          grp.includes('ব্যবসায়') ||
          grp.includes('business')
        ) {
          if (female) commerceFemale++;
          else commerceMale++;
        } else {
          if (female) scienceFemale++;
          else scienceMale++;
        }
      });

      const scienceTotal = scienceMale + scienceFemale;
      const humanitiesTotal = humanitiesMale + humanitiesFemale;
      const commerceTotal = commerceMale + commerceFemale;
      return {
        gradeKey: gItem.key,
        gradeLabel: gItem.label,
        scienceMale,
        scienceFemale,
        scienceTotal,
        humanitiesMale,
        humanitiesFemale,
        humanitiesTotal,
        commerceMale,
        commerceFemale,
        commerceTotal,
        total: scienceTotal + humanitiesTotal + commerceTotal,
      };
    });
  }, [currentLang, students]);

  const totalScienceAll = groupStats.reduce((acc, c) => acc + c.scienceTotal, 0);
  const totalHumanitiesAll = groupStats.reduce((acc, c) => acc + c.humanitiesTotal, 0);
  const totalCommerceAll = groupStats.reduce((acc, c) => acc + c.commerceTotal, 0);
  const totalDepartmentStudents = totalScienceAll + totalHumanitiesAll + totalCommerceAll;

  // 3. Today's Live Class-wise Attendance
  const todayStr = localDateKey();

  const classAttendanceList: ClassAttendanceSummary[] = useMemo(() => {
    return classOrder.map((c) => {
      const classStudents = students.filter((s) => matchesGrade(s, c.key));
      const total = classStudents.length;
      let present = 0;
      let absent = 0;
      let leave = 0;
      let isTaken = false;

      if (typeof window !== 'undefined') {
        const sections = classSectionService.getSectionsForGrade(c.key);
        const branchKeys = new Set<string>(['A', 'B', 'C', 'all']);
        sections.forEach((s) => {
          if (s.name) {
            branchKeys.add(s.name);
            const clean = s.name.replace(/[^a-zA-Z0-9]/g, '');
            if (clean) branchKeys.add(clean);
            if (s.name.includes('A')) branchKeys.add('A');
            if (s.name.includes('B')) branchKeys.add('B');
            if (s.name.includes('C')) branchKeys.add('C');
            if (s.name.includes('D')) branchKeys.add('D');
          }
        });
        if (c.key === '9th' || c.key === '10th') {
          branchKeys.add('Science');
          branchKeys.add('Humanities');
          branchKeys.add('Commerce');
          branchKeys.add('বিজ্ঞান');
          branchKeys.add('মানবিক');
          branchKeys.add('ব্যবসায়');
        }

        const checkedKeys = new Set<string>();
        const processRecordList = (parsed: unknown[]) => {
          if (Array.isArray(parsed) && parsed.length > 0) {
            isTaken = true;
            parsed.forEach((st) => {
              const rec = st as { status?: string };
              if (rec.status === 'Present') present++;
              else if (rec.status === 'Absent') absent++;
              else if (rec.status === 'Leave') leave++;
            });
          }
        };

        branchKeys.forEach((b) => {
          const storageKey = `sms_attendance_${todayStr}_${c.key}-${b}`;
          if (!checkedKeys.has(storageKey)) {
            checkedKeys.add(storageKey);
            const saved = localStorage.getItem(storageKey);
            if (saved) {
              try {
                processRecordList(JSON.parse(saved));
              } catch {}
            }
          }
        });

        const singleKey = `sms_attendance_${todayStr}_${c.key}`;
        if (!checkedKeys.has(singleKey)) {
          checkedKeys.add(singleKey);
          const savedSingle = localStorage.getItem(singleKey);
          if (savedSingle) {
            try {
              processRecordList(JSON.parse(savedSingle));
            } catch {}
          }
        }

        try {
          const prefix = `sms_attendance_${todayStr}_${c.key}`;
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && (k === prefix || k.startsWith(`${prefix}-`) || k.startsWith(`${prefix}_`))) {
              if (!checkedKeys.has(k)) {
                checkedKeys.add(k);
                const val = localStorage.getItem(k);
                if (val) {
                  try {
                    processRecordList(JSON.parse(val));
                  } catch {}
                }
              }
            }
          }
        } catch {}
      }

      if (!isTaken) {
        present = 0;
        absent = 0;
        leave = 0;
      }

      const rate = isTaken && total > 0 ? parseFloat(((present / total) * 100).toFixed(1)) : 0;

      return {
        gradeKey: c.key,
        gradeLabel: c.label,
        total,
        present,
        absent,
        leave,
        rate,
        isTaken,
      };
    });
  }, [classOrder, students, todayStr]);

  const grandTotalAttStudents = classAttendanceList.reduce((acc, c) => acc + c.total, 0);
  const grandTotalPresent = classAttendanceList.reduce((acc, c) => acc + c.present, 0);
  const grandTotalAbsent = classAttendanceList.reduce((acc, c) => acc + c.absent, 0);
  const grandTotalLeave = classAttendanceList.reduce((acc, c) => acc + c.leave, 0);
  const takenClassesCount = classAttendanceList.filter((c) => c.isTaken).length;
  const overallAttRate =
    grandTotalAttStudents > 0
      ? parseFloat(((grandTotalPresent / grandTotalAttStudents) * 100).toFixed(1))
      : 0;

  // 4. Monthly Rolling Attendance Chart Data (lazy: only computed when monthly view or analytics tab is visible)
  const monthlyClassAttendance: MonthlyClassAttendanceItem[] = useMemo(() => {
    if (!mounted || (attendanceView !== 'monthly' && activeTab !== 'analytics')) {
      return [];
    }
    const ymPrefix = todayStr.slice(0, 7);
    const branches = ['A', 'B', 'C', 'Science', 'Humanities', 'Commerce'];

    return classOrder.map((c, idx) => {
      const demo = demographics[idx];
      const liveAtt = classAttendanceList[idx];

      let presentSlots = 0;
      let totalSlots = 0;
      if (typeof window !== 'undefined') {
        for (const b of branches) {
          const monthly = attendanceService.getMonthlyClassAttendance(ymPrefix, c.key, b);
          for (const dt of monthly.dates.slice(-5)) {
            const recs = attendanceService.getAttendance(dt, c.key, b);
            presentSlots += recs.filter((r) => r.status === 'Present').length;
            totalSlots += recs.length;
          }
        }
      }
      const monthlyRate =
        totalSlots > 0
          ? Math.round((presentSlots / totalSlots) * 100)
          : Math.round(liveAtt?.rate || 0);

      return {
        gradeKey: c.key,
        gradeLabel: c.shortLabel,
        total: demo?.total || 0,
        boys: demo?.male || 0,
        girls: demo?.female || 0,
        stipend: demo?.stipend || 0,
        attendanceRate: monthlyRate,
        todayRate: Math.round(liveAtt?.rate || 0),
      };
    });
  }, [mounted, attendanceView, activeTab, classOrder, demographics, classAttendanceList, todayStr]);

  // 5. Subject-wise Pass/Fail Performance Analytics & Heatmap (lazy: only computed on Analytics tab)
  const subjectHeatmap: SubjectHeatmapCell[] = useMemo(() => {
    if (!mounted || activeTab !== 'analytics') return [];
    const targetGrades =
      selectedGrade === 'all' ? classOrder.map((g) => g.key) : [selectedGrade];
    const rows: SubjectHeatmapCell[] = [];

    for (const gKey of targetGrades) {
      const gStudents = students.filter((s) => matchesGrade(s, gKey));
      if (gStudents.length === 0) continue;

      // Gather unique subjects across streams for 9th/10th so Science, Humanities & Commerce are all represented
      const subjectMap = new Map<string, { name: string; code: string; fullMarks: number }>();
      const groupsToScan =
        gKey === '9th' || gKey === '10th'
          ? ['বিজ্ঞান', 'মানবিক', 'ব্যবসায় শিক্ষা']
          : ['সাধারণ'];

      for (const grp of groupsToScan) {
        for (const sub of getActiveCurriculumSubjects(gKey, grp)) {
          if (!subjectMap.has(sub.name)) {
            subjectMap.set(sub.name, {
              name: sub.name,
              code: sub.code,
              fullMarks: sub.fullMarks || 100,
            });
          }
        }
      }

      const gLabel = classOrder.find((x) => x.key === gKey)?.shortLabel || gKey;

      for (const sub of subjectMap.values()) {
        let assessed = 0;
        let passed = 0;
        let failed = 0;
        let sumTotal = 0;

        for (const st of gStudents) {
          const m = getUniversalStudentMark({
            exam: selectedExam,
            grade: gKey,
            branch: st.section || st.branch || 'A',
            group: st.group,
            subjectCodeOrName: sub.name,
            studentRoll: st.roll,
            studentId: st.id,
            studentName: st.name,
          });
          if (!m.hasMarks) continue;
          assessed += 1;
          sumTotal += m.total;
          const res = calculateGradeAndPoint(m.total, sub.fullMarks || 100);
          if (res.letterGrade === 'F' || res.gradePoint <= 0) {
            failed += 1;
          } else {
            passed += 1;
          }
        }

        if (assessed > 0) {
          rows.push({
            gradeKey: gKey,
            gradeLabel: gLabel,
            subjectName: sub.name,
            assessedCount: assessed,
            passCount: passed,
            failCount: failed,
            passRate: Math.round((passed / assessed) * 100),
            avgMarks: Math.round(sumTotal / assessed),
          });
        }
      }
    }

    return rows;
  }, [mounted, activeTab, students, selectedGrade, selectedExam, classOrder]);

  // 6. Export Handlers (BANBEIS / EMIS / HSP Stipend — dynamically loads xlsx only on click)
  const handleDownloadBANBEIS = async () => {
    const cfg = schoolSettings || settingsService.getSettings();
    const { downloadBANBEISWorkbook } = await import('@/lib/boardExcelExport');
    const count = downloadBANBEISWorkbook(students, cfg);
    showToast(`BANBEIS রিপোর্ট (.xlsx) ডাউনলোড হয়েছে (${count} জন শিক্ষার্থী)।`, 'success');
  };

  const handleDownloadEMIS = async () => {
    const cfg = schoolSettings || settingsService.getSettings();
    const { downloadEMISWorkbook } = await import('@/lib/boardExcelExport');
    const count = downloadEMISWorkbook(students, cfg);
    showToast(`EMIS প্রোফাইল এক্সেল (.xlsx) ডাউনলোড হয়েছে (${count} জন শিক্ষার্থী)।`, 'success');
  };

  const handleDownloadStipend = async () => {
    const cfg = schoolSettings || settingsService.getSettings();
    const stipendRows = students
      .filter((s) => s.isStipend || s.stipendCategory || s.stipendStatus === 'Active')
      .map((s) => ({
        ...s,
        attRate: s.attendance ?? 85,
        examScore: s.examMarkAvg ?? 60,
        monthlyAmount: 500,
        isEligible: (s.attendance ?? 85) >= 75 && (s.examMarkAvg ?? 60) >= 45,
      }));
    const { downloadStipendBoardWorkbook } = await import('@/lib/boardExcelExport');
    const count = downloadStipendBoardWorkbook(stipendRows, cfg);
    showToast(`বোর্ড উপবৃত্তি এক্সেল (.xlsx) ডাউনলোড হয়েছে (${count} জন)।`, 'success');
  };

  const sortedNotices = useMemo(() => {
    return [...notices].sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });
  }, [notices]);

  const schoolName = schoolSettings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়';
  const eiin = schoolSettings?.eiin || '';
  const todayFormatted = useMemo(() => {
    try {
      return new Date().toLocaleDateString(currentLang === 'en' ? 'en-US' : 'bn-BD', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return todayStr;
    }
  }, [currentLang, todayStr]);

  if (!mounted) {
    return (
      <div className="p-8 text-center text-slate-400 font-bold">
        {currentLang === 'en' ? 'Loading Executive Dashboard...' : 'ড্যাশবোর্ড ও অ্যানালিটিক্স লোড হচ্ছে...'}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10 font-sans max-w-[1600px] mx-auto">
      <style jsx global>{`
        @media print {
          @page { size: A4 landscape; margin: 10mm; }
          .no-print { display: none !important; }
          body { background: #ffffff !important; color: #0f172a !important; }
        }
      `}</style>

      {/* Print-Only Institutional Header */}
      <div className="hidden print:block text-center border-b-2 border-slate-900 pb-2 mb-4">
        <h1 className="text-xl font-black">{schoolName}</h1>
        <p className="text-xs font-bold text-slate-600">
          {schoolSettings?.address || ''} {eiin ? `• EIIN: ${eiin}` : ''} • সমন্বিত ড্যাশবোর্ড ও অ্যানালিটিক্স রিপোর্ট ({todayFormatted})
        </p>
      </div>

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* 0. COMPACT EXECUTIVE VIEW SWITCHER & LIVE CAMPUS BAR              */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 px-3.5 py-2.5 shadow-2xs no-print">
        <div className="inline-flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800">
          {(
            [
              {
                id: 'overview',
                labelBn: 'ওভারভিউ ও চার্ট',
                labelEn: 'Overview & Charts',
                icon: LayoutDashboard,
              },
              {
                id: 'analytics',
                labelBn: 'অ্যানালিটিক্স ও হিটম্যাপ',
                labelEn: 'Analytics & Heatmap',
                icon: BarChart3,
              },
              {
                id: 'exports',
                labelBn: 'BANBEIS / EMIS এক্সপোর্ট',
                labelEn: 'Board Exports (.xlsx)',
                icon: FileSpreadsheet,
              },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => switchTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-black inline-flex items-center gap-1.5 transition cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon size={13} />
                <span>{currentLang === 'en' ? tab.labelEn : tab.labelBn}</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="hidden xl:flex items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
              <Award size={12} className="text-amber-500" />
              {currentLang === 'en' ? 'Stipend' : 'উপবৃত্তি'}:{' '}
              <strong className="font-mono text-slate-900 dark:text-white">{grandTotalStipend}</strong>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
              <BookOpen size={12} className="text-sky-500" />
              {currentLang === 'en' ? 'Library' : 'লাইব্রেরি'}:{' '}
              <strong className="font-mono text-slate-900 dark:text-white">{activeLoansCount}</strong>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
              <GraduationCap size={12} className="text-emerald-500" />
              {currentLang === 'en' ? 'Alumni' : 'অ্যালুমনাই'}:{' '}
              <strong className="font-mono text-slate-900 dark:text-white">{alumniCount}</strong>
            </span>
          </div>

          <button
            type="button"
            onClick={handleCloudSync}
            disabled={syncing}
            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer disabled:opacity-60"
            title="ক্লাউড সিঙ্ক করুন"
          >
            <RefreshCw size={13} className={syncing ? 'animate-spin text-indigo-600' : ''} />
            <span className="hidden sm:inline">{currentLang === 'en' ? 'Sync' : 'সিঙ্ক'}</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
            title="প্রিন্ট রিপোর্ট"
          >
            <Printer size={13} className="text-slate-500" />
            <span className="hidden sm:inline">{currentLang === 'en' ? 'Print' : 'প্রিন্ট'}</span>
          </button>
        </div>
      </div>

      {/* 🔔 Pending Teacher Leaves Action Bar */}
      {pendingLeaves.length > 0 && activeTab === 'overview' && (
        <div className="rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 border-l-4 border-l-amber-500 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3.5 no-print">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Send size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white font-black text-[10px]">
                  {currentLang === 'en' ? 'Action Required' : 'অনুমোদন প্রয়োজন'}
                </span>
                <span className="text-xs font-extrabold text-amber-900 dark:text-amber-300">
                  {currentLang === 'en'
                    ? `${pendingLeaves.length} Pending Teacher Leave Applications`
                    : `${pendingLeaves.length}টি শিক্ষকের ছুটির আবেদন বিবেচনাধীন`}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                {pendingLeaves
                  .slice(0, 2)
                  .map(
                    (l) =>
                      `${l.teacherName} (${l.totalDays} দিন - ${LEAVE_TYPE_LABELS[l.leaveType] || l.leaveType})`,
                  )
                  .join(' • ')}
                {pendingLeaves.length > 2 ? ` এবং আরও ${pendingLeaves.length - 2} জন` : ''}
              </p>
            </div>
          </div>

          <Link
            href="/dashboard/leaves"
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shrink-0 self-start md:self-auto transition shadow-xs"
          >
            <span>{currentLang === 'en' ? 'Review Now' : 'আবেদন দেখুন'}</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: OVERVIEW & EXECUTIVE CHARTS (DEFAULT UNIFIED EXPERIENCE)   */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <>
          {/* 1. FOUR EXECUTIVE PRIMARY KPI CARDS */}
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* KPI 1: Total Students & Gender Split */}
            <Link
              href="/dashboard/students"
              className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between gap-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {currentLang === 'en' ? 'Total Students' : 'মোট শিক্ষার্থী'}
                  </span>
                  <div className="mt-1.5 flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                      {grandTotalStudents}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      {currentLang === 'en' ? 'enrolled' : 'জন'}
                    </span>
                  </div>
                </div>
                <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Users size={20} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                  <div className="h-full bg-indigo-600" style={{ width: `${maleRatioPct}%` }} />
                  <div
                    className="h-full bg-rose-500"
                    style={{ width: `${grandTotalStudents > 0 ? 100 - maleRatioPct : 0}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  <span>
                    {currentLang === 'en' ? 'Boys' : 'ছাত্র'}:{' '}
                    <strong className="text-slate-800 dark:text-slate-200 font-mono">
                      {grandTotalMale}
                    </strong>{' '}
                    • {currentLang === 'en' ? 'Girls' : 'ছাত্রী'}:{' '}
                    <strong className="text-slate-800 dark:text-slate-200 font-mono">
                      {grandTotalFemale}
                    </strong>
                  </span>
                  <span className="text-indigo-600 dark:text-indigo-400 inline-flex items-center gap-0.5">
                    {currentLang === 'en' ? 'Stipend' : 'উপবৃত্তি'} {grandTotalStipend}
                  </span>
                </div>
              </div>
            </Link>

            {/* KPI 2: Today's Live Attendance */}
            <Link
              href="/dashboard/academic/attendance"
              className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-teal-300 dark:hover:border-teal-700 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between gap-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {currentLang === 'en' ? "Today's Attendance" : 'আজকের উপস্থিতি'}
                  </span>
                  <div className="mt-1.5 flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                      {overallAttRate}%
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                        takenClassesCount === 0
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                          : overallAttRate >= 80
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300'
                      }`}
                    >
                      {takenClassesCount === 0
                        ? currentLang === 'en'
                          ? 'Pending'
                          : 'বাকি'
                        : `${takenClassesCount}/${classAttendanceList.length} ${currentLang === 'en' ? 'Classes' : 'শ্রেণি'}`}
                    </span>
                  </div>
                </div>
                <div className="w-11 h-11 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-900/50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <UserCheck size={20} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, overallAttRate))}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  <span>
                    {currentLang === 'en' ? 'Present' : 'উপস্থিত'}:{' '}
                    <strong className="text-emerald-600 dark:text-emerald-400 font-mono">
                      {grandTotalPresent}
                    </strong>
                  </span>
                  <span>
                    {currentLang === 'en' ? 'Absent' : 'অনুপস্থিত'}:{' '}
                    <strong className="text-rose-600 dark:text-rose-400 font-mono">
                      {grandTotalAbsent}
                    </strong>
                  </span>
                </div>
              </div>
            </Link>

            {/* KPI 3: Fee Collection & Dues */}
            <Link
              href="/dashboard/finance"
              className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between gap-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {currentLang === 'en' ? 'Total Fee Collected' : 'মোট ফি আদায়'}
                  </span>
                  <div className="mt-1.5 flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight truncate">
                      {formatCurrency(feeStats?.totalCollectedAll || 0, currentLang)}
                    </span>
                  </div>
                </div>
                <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Wallet size={20} />
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold">
                <span className="text-emerald-700 dark:text-emerald-400 font-mono">
                  {currentLang === 'en' ? 'Today' : 'আজ'}:{' '}
                  {formatCurrency(feeStats?.todayCollected || 0, currentLang)}
                </span>
                <span className="text-slate-500 dark:text-slate-400 font-mono">
                  {currentLang === 'en' ? 'Due' : 'বকেয়া'}:{' '}
                  <strong className="text-rose-600 dark:text-rose-400">
                    {formatCurrency(feeStats?.totalDueAll || 0, currentLang)}
                  </strong>
                </span>
              </div>
            </Link>

            {/* KPI 4: Faculty & Institutional Operations */}
            <Link
              href="/dashboard/teacher"
              className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-violet-300 dark:hover:border-violet-700 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between gap-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {currentLang === 'en' ? 'Teachers & Staff' : 'শিক্ষক ও কর্মকর্তা'}
                  </span>
                  <div className="mt-1.5 flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                      {teacherCount}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      {currentLang === 'en' ? 'active' : 'জন'}
                    </span>
                  </div>
                </div>
                <div className="w-11 h-11 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-900/50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <School size={20} />
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold">
                <span
                  className={`px-2 py-0.5 rounded-md ${
                    pendingLeaves.length > 0
                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                      : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                  }`}
                >
                  {pendingLeaves.length > 0
                    ? `${pendingLeaves.length} ${currentLang === 'en' ? 'Leave Req.' : 'ছুটির আবেদন'}`
                    : currentLang === 'en'
                      ? 'No Pending Leaves'
                      : 'ছুটি ক্লিয়ার'}
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  {currentLang === 'en' ? 'Notices' : 'নোটিশ'}:{' '}
                  <strong className="text-slate-800 dark:text-slate-200 font-mono">
                    {notices.length}
                  </strong>
                </span>
              </div>
            </Link>
          </section>

          {/* 2. QUICK ACTIONS COMMAND BAR */}
          <QuickActionHub lang={currentLang} pendingLeavesCount={pendingLeaves.length} />

          {/* 3. OPERATIONAL BENTO: ATTENDANCE MONITOR & MONTHLY CHART (8) + NOTICE BOARD (4) */}
          <section className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
            <div className="xl:col-span-8 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-2">
                  <UserCheck size={16} className="text-teal-600 dark:text-teal-400" />
                  <h2 className="font-black text-sm text-slate-900 dark:text-slate-100">
                    {currentLang === 'en'
                      ? 'Attendance Analytics & Live Monitor'
                      : 'উপস্থিতি অ্যানালিটিক্স ও লাইভ মনিটর'}
                  </h2>
                </div>

                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs font-bold no-print">
                  <button
                    type="button"
                    onClick={() => setAttendanceView('live')}
                    className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                      attendanceView === 'live'
                        ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-2xs font-black'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <UserCheck size={13} />
                    <span>{currentLang === 'en' ? 'Live' : 'লাইভ'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttendanceView('monthly')}
                    className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                      attendanceView === 'monthly'
                        ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-2xs font-black'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <BarChart3 size={13} />
                    <span>{currentLang === 'en' ? 'Chart (%)' : 'মাসিক চার্ট'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttendanceView('table')}
                    className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                      attendanceView === 'table'
                        ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-2xs font-black'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <TableIcon size={13} />
                    <span>{currentLang === 'en' ? 'Table' : 'টেবিল'}</span>
                  </button>
                </div>
              </div>

              {attendanceView === 'live' ? (
                <AttendanceTrendChart
                  data={classAttendanceList}
                  overallRate={overallAttRate}
                  grandTotal={grandTotalAttStudents}
                  totalPresent={grandTotalPresent}
                  totalAbsent={grandTotalAbsent}
                  totalLeave={grandTotalLeave}
                  lang={currentLang}
                />
              ) : attendanceView === 'monthly' ? (
                <MonthlyAttendanceChart data={monthlyClassAttendance} lang={currentLang} />
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-extrabold uppercase text-[10.5px] tracking-wider">
                          <th className="py-3.5 px-4 text-slate-700 dark:text-slate-200">
                            {currentLang === 'en' ? 'Class' : 'শ্রেণি'}
                          </th>
                          <th className="py-3.5 px-3 text-center">
                            {currentLang === 'en' ? 'Total' : 'মোট'}
                          </th>
                          <th className="py-3.5 px-3 text-center text-emerald-700 dark:text-emerald-400">
                            {currentLang === 'en' ? 'Present' : 'উপস্থিত'}
                          </th>
                          <th className="py-3.5 px-3 text-center text-rose-700 dark:text-rose-400">
                            {currentLang === 'en' ? 'Absent' : 'অনুপস্থিত'}
                          </th>
                          <th className="py-3.5 px-3 text-center">
                            {currentLang === 'en' ? 'Rate' : 'হার'}
                          </th>
                          <th className="py-3.5 px-4 text-right">
                            {currentLang === 'en' ? 'Action' : 'কার্যক্রম'}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
                        {classAttendanceList.map((row) => (
                          <tr
                            key={row.gradeKey}
                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            <td className="py-3 px-4 font-extrabold text-slate-900 dark:text-white">
                              {row.gradeLabel}
                            </td>
                            <td className="py-3 px-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                              {row.total}
                            </td>
                            <td className="py-3 px-3 text-center font-mono font-black text-emerald-700 dark:text-emerald-400">
                              {row.isTaken ? row.present : '—'}
                            </td>
                            <td className="py-3 px-3 text-center font-mono font-black text-rose-600 dark:text-rose-400">
                              {row.isTaken ? row.absent : '—'}
                            </td>
                            <td className="py-3 px-3 text-center">
                              {row.isTaken ? (
                                <span className="px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-mono font-black text-[11px]">
                                  {row.rate}%
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                                  <Clock size={10} />
                                  {currentLang === 'en' ? 'Pending' : 'বাকি'}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <Link
                                href={`/dashboard/academic/attendance?grade=${row.gradeKey}`}
                                className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-black transition ${
                                  row.isTaken
                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200'
                                    : 'bg-teal-600 hover:bg-teal-700 text-white'
                                }`}
                              >
                                <span>
                                  {row.isTaken
                                    ? currentLang === 'en'
                                      ? 'View'
                                      : 'দেখুন'
                                    : currentLang === 'en'
                                      ? 'Roll Call'
                                      : 'হাজিরা নিন'}
                                </span>
                                <ArrowUpRight size={12} />
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 font-black">
                        <tr>
                          <td className="py-3 px-4 text-slate-900 dark:text-white">
                            {currentLang === 'en' ? 'Grand Total' : 'সর্বমোট'}
                          </td>
                          <td className="py-3 px-3 text-center font-mono">{grandTotalAttStudents}</td>
                          <td className="py-3 px-3 text-center font-mono text-emerald-700 dark:text-emerald-400">
                            {grandTotalPresent}
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-rose-600 dark:text-rose-400">
                            {grandTotalAbsent}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="px-2.5 py-0.5 rounded-full bg-teal-600 text-white font-mono text-[11px]">
                              {overallAttRate}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right text-[10.5px] text-emerald-700 dark:text-emerald-400">
                            <span className="inline-flex items-center gap-1">
                              <CheckCircle2 size={12} /> {takenClassesCount}/{classAttendanceList.length}
                            </span>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Right 4 Cols: Live Notice Board & Campus Pulse */}
            <div className="xl:col-span-4 space-y-3">
              <div className="flex items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-2">
                  <Bell size={16} className="text-amber-600 dark:text-amber-400" />
                  <h2 className="font-black text-sm text-slate-900 dark:text-slate-100">
                    {currentLang === 'en' ? 'Notice Board & Pulse' : 'নোটিশ বোর্ড ও ক্যাম্পাস আপডেট'}
                  </h2>
                </div>
                <Link
                  href="/dashboard/notices"
                  className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-0.5"
                >
                  <span>{currentLang === 'en' ? 'All' : 'সব দেখুন'}</span>
                  <ArrowUpRight size={13} />
                </Link>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-2xs space-y-4">
                {sortedNotices.length === 0 ? (
                  <div className="py-7 px-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2.5">
                    <div className="w-10 h-10 mx-auto rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
                      <Bell size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                        {currentLang === 'en' ? 'No Active Notices' : 'কোনো সক্রিয় নোটিশ নেই'}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {currentLang === 'en'
                          ? 'Publish announcements for teachers & guardians.'
                          : 'শিক্ষক ও অভিভাবকদের জন্য নতুন বিজ্ঞপ্তি প্রকাশ করুন।'}
                      </p>
                    </div>
                    <Link
                      href="/dashboard/notices"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold transition"
                    >
                      <span>{currentLang === 'en' ? 'Create Notice' : 'নতুন নোটিশ প্রকাশ'}</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {sortedNotices.slice(0, 4).map((notice) => (
                      <Link
                        key={notice.id}
                        href="/dashboard/notices"
                        className="block p-3 rounded-xl bg-slate-50/70 dark:bg-slate-950/50 hover:bg-indigo-50/50 dark:hover:bg-slate-800/70 border border-slate-200/70 dark:border-slate-800 transition space-y-1"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                            {notice.isPinned && <Pin size={11} className="text-indigo-600 shrink-0" />}
                            <h4 className="text-xs font-extrabold text-slate-900 dark:text-white line-clamp-1">
                              {notice.title}
                            </h4>
                            {notice.priority === 'urgent' && (
                              <span className="px-1.5 py-0.2 rounded bg-rose-600 text-white text-[9px] font-black">
                                জরুরি
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 shrink-0">
                            {new Date(notice.publishedAt).toLocaleDateString(
                              currentLang === 'en' ? 'en-US' : 'bn-BD',
                            )}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {notice.content}
                        </p>
                      </Link>
                    ))}
                  </div>
                )}

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2.5">
                  <Link
                    href="/dashboard/stipend"
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-800 transition flex items-center gap-2.5"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <Award size={15} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-slate-500 block truncate">
                        {currentLang === 'en' ? 'Stipend' : 'উপবৃত্তি'}
                      </span>
                      <span className="text-xs font-black text-slate-900 dark:text-white font-mono">
                        {grandTotalStipend} {currentLang === 'en' ? '' : 'জন'}
                      </span>
                    </div>
                  </Link>

                  <Link
                    href="/mobile-app"
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-800 transition flex items-center gap-2.5"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                      <Smartphone size={15} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-slate-500 block truncate">
                        {currentLang === 'en' ? 'Mobile App' : 'মোবাইল অ্যাপ'}
                      </span>
                      <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 truncate block">
                        {currentLang === 'en' ? 'Open Portal →' : 'পোর্টাল খুলুন →'}
                      </span>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* 4. STUDENT DEMOGRAPHICS & INTERACTIVE ENROLLMENT CHARTS */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-2">
                <PieChart size={16} className="text-indigo-600 dark:text-indigo-400" />
                <h2 className="font-black text-sm text-slate-900 dark:text-slate-100">
                  {currentLang === 'en'
                    ? 'Enrollment, Demographics & Attendance Charts'
                    : 'শিক্ষার্থী ডেমোগ্রাফিক্স, কলাম চার্ট ও বিভাগীয় বিশ্লেষণ'}
                </h2>
              </div>

              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs font-bold no-print">
                <button
                  type="button"
                  onClick={() => setAnalyticsView('charts')}
                  className={`px-3 py-1 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                    analyticsView === 'charts'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-black'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <PieChart size={13} />
                  <span>{currentLang === 'en' ? 'Charts' : 'চার্ট'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAnalyticsView('table')}
                  className={`px-3 py-1 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                    analyticsView === 'table'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-black'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <TableIcon size={13} />
                  <span>{currentLang === 'en' ? 'Tables' : 'ডেটা টেবিল'}</span>
                </button>
              </div>
            </div>

            {analyticsView === 'charts' ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                <div className="lg:col-span-5">
                  <DemographicsDonutChart
                    maleCount={grandTotalMale}
                    femaleCount={grandTotalFemale}
                    muslimCount={grandTotalMuslim}
                    hinduCount={grandTotalHindu}
                    totalStudents={grandTotalStudents}
                    lang={currentLang}
                  />
                </div>
                <div className="lg:col-span-7">
                  <ClassEnrollmentChart
                    enrollments={demographics.map((d) => ({
                      gradeKey: d.gradeKey,
                      gradeLabel: d.gradeLabel,
                      male: d.male,
                      female: d.female,
                      total: d.total,
                    }))}
                    groupStats={groupStats.map((g) => ({
                      gradeLabel: g.gradeLabel,
                      scienceTotal: g.scienceTotal,
                      humanitiesTotal: g.humanitiesTotal,
                      commerceTotal: g.commerceTotal,
                      total: g.total,
                    }))}
                    lang={currentLang}
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Table 1: Class 6-10 Demographics */}
                <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                        <Users size={16} />
                      </div>
                      <h3 className="font-black text-slate-900 dark:text-white text-sm">
                        {currentLang === 'en'
                          ? 'Class-wise Demographics (6–10)'
                          : 'শ্রেণিভিত্তিক শিক্ষার্থী সংখ্যা (৬ষ্ঠ–১০ম)'}
                      </h3>
                    </div>
                    <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-black text-xs rounded-lg font-mono">
                      {currentLang === 'en' ? 'Total' : 'মোট'}: {grandTotalStudents}
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-extrabold uppercase text-[10.5px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                          <th className="py-3 px-4 text-slate-700 dark:text-slate-200">শ্রেণি</th>
                          <th className="py-3 px-3 text-center text-indigo-600 dark:text-indigo-400">ছাত্র</th>
                          <th className="py-3 px-3 text-center text-rose-600 dark:text-rose-400">ছাত্রী</th>
                          <th className="py-3 px-3 text-center text-emerald-600 dark:text-emerald-400">মুসলিম</th>
                          <th className="py-3 px-3 text-center text-amber-600 dark:text-amber-400">হিন্দু</th>
                          <th className="py-3 px-4 text-right text-slate-700 dark:text-slate-200">মোট</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
                        {demographics.map((row) => (
                          <tr key={row.gradeKey} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                            <td className="py-3 px-4 font-extrabold text-slate-900 dark:text-white">{row.gradeLabel}</td>
                            <td className="py-3 px-3 text-center font-mono text-indigo-700 dark:text-indigo-300">{row.male}</td>
                            <td className="py-3 px-3 text-center font-mono text-rose-700 dark:text-rose-300">{row.female}</td>
                            <td className="py-3 px-3 text-center font-mono text-emerald-700 dark:text-emerald-300">{row.muslim}</td>
                            <td className="py-3 px-3 text-center font-mono text-amber-700 dark:text-amber-300">{row.hindu}</td>
                            <td className="py-3 px-4 text-right font-mono font-black text-slate-900 dark:text-white">{row.total}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-50 dark:bg-slate-800/80 font-black border-t border-slate-200 dark:border-slate-700">
                        <tr>
                          <td className="py-3 px-4">সর্বমোট</td>
                          <td className="py-3 px-3 text-center font-mono text-indigo-700 dark:text-indigo-300">{grandTotalMale}</td>
                          <td className="py-3 px-3 text-center font-mono text-rose-700 dark:text-rose-300">{grandTotalFemale}</td>
                          <td className="py-3 px-3 text-center font-mono text-emerald-700 dark:text-emerald-300">{grandTotalMuslim}</td>
                          <td className="py-3 px-3 text-center font-mono text-amber-700 dark:text-amber-300">{grandTotalHindu}</td>
                          <td className="py-3 px-4 text-right font-mono text-indigo-700 dark:text-indigo-300">{grandTotalStudents}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Table 2: Class 9-10 Streams */}
                <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-2xs space-y-4 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                          <GraduationCap size={16} />
                        </div>
                        <h3 className="font-black text-slate-900 dark:text-white text-sm">
                          {currentLang === 'en' ? '9th & 10th Streams' : '৯ম ও ১০ম বিভাগ পরিসংখ্যান'}
                        </h3>
                      </div>
                      <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-black text-xs rounded-lg font-mono">
                        {totalDepartmentStudents}
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-extrabold uppercase text-[10.5px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                            <th className="py-3 px-4 text-slate-700 dark:text-slate-200">শ্রেণি</th>
                            <th className="py-3 px-3 text-center text-emerald-600 dark:text-emerald-400">বিজ্ঞান</th>
                            <th className="py-3 px-3 text-center text-indigo-600 dark:text-indigo-400">মানবিক</th>
                            <th className="py-3 px-3 text-center text-amber-600 dark:text-amber-400">ব্যবসায়</th>
                            <th className="py-3 px-4 text-right text-slate-700 dark:text-slate-200">মোট</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
                          {groupStats.map((row) => (
                            <tr key={row.gradeKey} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                              <td className="py-3 px-4 font-extrabold text-slate-900 dark:text-white">{row.gradeLabel}</td>
                              <td className="py-3 px-3 text-center font-mono text-emerald-700 dark:text-emerald-300">{row.scienceTotal}</td>
                              <td className="py-3 px-3 text-center font-mono text-indigo-700 dark:text-indigo-300">{row.humanitiesTotal}</td>
                              <td className="py-3 px-3 text-center font-mono text-amber-700 dark:text-amber-300">{row.commerceTotal}</td>
                              <td className="py-3 px-4 text-right font-mono font-black text-slate-900 dark:text-white">{row.total}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-slate-50 dark:bg-slate-800/80 font-black border-t border-slate-200 dark:border-slate-700">
                          <tr>
                            <td className="py-3 px-4">সর্বমোট</td>
                            <td className="py-3 px-3 text-center font-mono text-emerald-700 dark:text-emerald-300">{totalScienceAll}</td>
                            <td className="py-3 px-3 text-center font-mono text-indigo-700 dark:text-indigo-300">{totalHumanitiesAll}</td>
                            <td className="py-3 px-3 text-center font-mono text-amber-700 dark:text-amber-300">{totalCommerceAll}</td>
                            <td className="py-3 px-4 text-right font-mono text-indigo-700 dark:text-indigo-300">{totalDepartmentStudents}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    <span>{currentLang === 'en' ? 'Active Session: 2026' : 'সক্রিয় শিক্ষাবর্ষ: ২০২৬'}</span>
                    <button
                      type="button"
                      onClick={() => switchTab('analytics')}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>{currentLang === 'en' ? 'Deep Analytics' : 'বিস্তারিত অ্যানালিটিক্স'}</span>
                      <ArrowUpRight size={12} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* 5. SUBJECT PERFORMANCE CHART & PASS/FAIL HEATMAP */}
          <SubjectPerformanceHeatmap
            rows={subjectHeatmap}
            exams={exams}
            selectedExam={selectedExam}
            onChangeExam={setSelectedExam}
            selectedGrade={selectedGrade}
            onChangeGrade={setSelectedGrade}
            lang={currentLang}
          />

          {/* 6. ONE-CLICK GOVERNMENT & BOARD EXCEL EXPORT STRIP */}
          <ExecutiveExportBar
            totalStudents={grandTotalStudents}
            totalGirls={grandTotalFemale}
            totalStipend={grandTotalStipend}
            activeLoansCount={activeLoansCount}
            alumniCount={alumniCount}
            onDownloadBANBEIS={handleDownloadBANBEIS}
            onDownloadEMIS={handleDownloadEMIS}
            onDownloadStipend={handleDownloadStipend}
            onPrintReport={() => window.print()}
            variant="compact"
            lang={currentLang}
          />
        </>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: DEEP ANALYTICS, INTERACTIVE CHARTS & HEATMAP               */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* 5-Card School Analytics Snapshot */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
            {[
              { label: currentLang === 'en' ? 'Active Students' : 'মোট সক্রিয় শিক্ষার্থী', val: `${grandTotalStudents} জন`, icon: Users, tone: 'text-indigo-600' },
              { label: currentLang === 'en' ? 'Boys / Girls' : 'ছাত্র / ছাত্রী', val: `${grandTotalMale} / ${grandTotalFemale}`, icon: Users, tone: 'text-rose-500' },
              { label: currentLang === 'en' ? 'Stipend' : 'উপবৃত্তি সুবিধাভোগী', val: `${grandTotalStipend} জন`, icon: Award, tone: 'text-amber-500' },
              { label: currentLang === 'en' ? 'Library Loans' : 'চলমান লাইব্রেরি ইস্যু', val: `${activeLoansCount}টি`, icon: BookOpen, tone: 'text-sky-500' },
              { label: currentLang === 'en' ? 'Alumni' : 'অ্যালুমনাই আর্কাইভ', val: `${alumniCount} জন`, icon: GraduationCap, tone: 'text-emerald-500' },
            ].map((kpi) => {
              const Icon = kpi.icon;
              return (
                <div
                  key={kpi.label}
                  className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-2xs"
                >
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[11px] font-bold truncate">{kpi.label}</span>
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${kpi.tone}`} />
                  </div>
                  <p className="text-base font-black font-mono text-slate-900 dark:text-white">
                    {kpi.val}
                  </p>
                </div>
              );
            })}
          </div>

          {/* 2-Column Primary Interactive Charts: Monthly Attendance SVG + Class Enrollment SVG */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            <div className="lg:col-span-6">
              <MonthlyAttendanceChart data={monthlyClassAttendance} lang={currentLang} />
            </div>
            <div className="lg:col-span-6">
              <DemographicsDonutChart
                maleCount={grandTotalMale}
                femaleCount={grandTotalFemale}
                muslimCount={grandTotalMuslim}
                hinduCount={grandTotalHindu}
                totalStudents={grandTotalStudents}
                lang={currentLang}
              />
            </div>
          </div>

          {/* Full-Width Class Enrollment Grouped Columns + 9-10 Streams */}
          <ClassEnrollmentChart
            enrollments={demographics.map((d) => ({
              gradeKey: d.gradeKey,
              gradeLabel: d.gradeLabel,
              male: d.male,
              female: d.female,
              total: d.total,
            }))}
            groupStats={groupStats.map((g) => ({
              gradeLabel: g.gradeLabel,
              scienceTotal: g.scienceTotal,
              humanitiesTotal: g.humanitiesTotal,
              commerceTotal: g.commerceTotal,
              total: g.total,
            }))}
            lang={currentLang}
          />

          {/* Subject-wise Pass/Fail Bar Chart & Heatmap */}
          <SubjectPerformanceHeatmap
            rows={subjectHeatmap}
            exams={exams}
            selectedExam={selectedExam}
            onChangeExam={setSelectedExam}
            selectedGrade={selectedGrade}
            onChangeGrade={setSelectedGrade}
            lang={currentLang}
          />
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: GOVERNMENT & BOARD EXCEL EXPORTS (BANBEIS / EMIS / HSP)    */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {activeTab === 'exports' && (
        <div className="space-y-6">
          <ExecutiveExportBar
            totalStudents={grandTotalStudents}
            totalGirls={grandTotalFemale}
            totalStipend={grandTotalStipend}
            activeLoansCount={activeLoansCount}
            alumniCount={alumniCount}
            onDownloadBANBEIS={handleDownloadBANBEIS}
            onDownloadEMIS={handleDownloadEMIS}
            onDownloadStipend={handleDownloadStipend}
            onPrintReport={() => window.print()}
            variant="expanded"
            lang={currentLang}
          />

          {/* Export Data Readiness Summary Table */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-2xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3.5">
              <div>
                <h2 className="text-sm font-black text-slate-900 dark:text-white">
                  {currentLang === 'en'
                    ? 'Class-wise Export Readiness Summary (BANBEIS / EMIS / Stipend)'
                    : 'শ্রেণিভিত্তিক সরকারি রিপোর্ট ডেটা সারাংশ (BANBEIS / EMIS / উপবৃত্তি)'}
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {currentLang === 'en'
                    ? 'Verified live counts included in the generated Excel workbooks.'
                    : 'এক্সেল ওয়ার্কবুকে অন্তর্ভুক্ত হতে যাওয়া প্রতিটি শ্রেণির লাইভ পরিসংখ্যান।'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-indigo-600 hover:opacity-90 text-white text-xs font-black inline-flex items-center gap-1.5 cursor-pointer transition no-print"
              >
                <Printer size={13} /> {currentLang === 'en' ? 'Print Summary' : 'সারাংশ প্রিন্ট'}
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-extrabold uppercase text-[10.5px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                    <th className="py-3 px-4 text-slate-700 dark:text-slate-200">শ্রেণি</th>
                    <th className="py-3 px-3 text-center text-indigo-600 dark:text-indigo-400">ছাত্র</th>
                    <th className="py-3 px-3 text-center text-rose-600 dark:text-rose-400">ছাত্রী</th>
                    <th className="py-3 px-3 text-center text-emerald-600 dark:text-emerald-400">মুসলিম</th>
                    <th className="py-3 px-3 text-center text-amber-600 dark:text-amber-400">হিন্দু</th>
                    <th className="py-3 px-3 text-center text-sky-600 dark:text-sky-400">উপবৃত্তি</th>
                    <th className="py-3 px-3 text-center text-teal-600 dark:text-teal-400">মাসিক উপস্থিতি</th>
                    <th className="py-3 px-4 text-right text-slate-700 dark:text-slate-200">মোট শিক্ষার্থী</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
                  {demographics.map((row, idx) => (
                    <tr key={row.gradeKey} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-extrabold text-slate-900 dark:text-white">{row.gradeLabel}</td>
                      <td className="py-3 px-3 text-center font-mono text-indigo-700 dark:text-indigo-300">{row.male}</td>
                      <td className="py-3 px-3 text-center font-mono text-rose-700 dark:text-rose-300">{row.female}</td>
                      <td className="py-3 px-3 text-center font-mono text-emerald-700 dark:text-emerald-300">{row.muslim}</td>
                      <td className="py-3 px-3 text-center font-mono text-amber-700 dark:text-amber-300">{row.hindu}</td>
                      <td className="py-3 px-3 text-center font-mono text-sky-700 dark:text-sky-300">{row.stipend}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-teal-700 dark:text-teal-300">
                        {monthlyClassAttendance[idx]?.attendanceRate ?? 0}%
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-slate-900 dark:text-white">{row.total}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 dark:bg-slate-800/80 font-black border-t border-slate-200 dark:border-slate-700">
                  <tr>
                    <td className="py-3 px-4">সর্বমোট</td>
                    <td className="py-3 px-3 text-center font-mono text-indigo-700 dark:text-indigo-300">{grandTotalMale}</td>
                    <td className="py-3 px-3 text-center font-mono text-rose-700 dark:text-rose-300">{grandTotalFemale}</td>
                    <td className="py-3 px-3 text-center font-mono text-emerald-700 dark:text-emerald-300">{grandTotalMuslim}</td>
                    <td className="py-3 px-3 text-center font-mono text-amber-700 dark:text-amber-300">{grandTotalHindu}</td>
                    <td className="py-3 px-3 text-center font-mono text-sky-700 dark:text-sky-300">{grandTotalStipend}</td>
                    <td className="py-3 px-3 text-center font-mono text-teal-700 dark:text-teal-300">{overallAttRate}%</td>
                    <td className="py-3 px-4 text-right font-mono text-indigo-700 dark:text-indigo-300">{grandTotalStudents}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-400 font-bold">
          ড্যাশবোর্ড ও অ্যানালিটিক্স লোড হচ্ছে...
        </div>
      }
    >
      <UnifiedDashboardContent />
    </Suspense>
  );
}
