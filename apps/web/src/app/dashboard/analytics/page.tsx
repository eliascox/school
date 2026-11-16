'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Download,
  Printer,
  ArrowLeft,
  Users,
  Award,
  TrendingUp,
  FileSpreadsheet,
  CalendarCheck2,
  BookOpen,
} from 'lucide-react';
import { studentService, Student } from '@/services/studentService';
import { examService, ExamItem } from '@/services/examService';
import { attendanceService } from '@/services/attendanceService';
import { settingsService, SchoolSettings } from '@/services/settingsService';
import { alumniService } from '@/services/alumniService';
import { libraryService } from '@/services/libraryService';
import { campusFacilityService } from '@/services/campusFacilityService';
import { getActiveCurriculumSubjects } from '@/lib/curriculumUtils';
import { getUniversalStudentMark } from '@/lib/markStorageUtils';
import { calculateGradeAndPoint } from '@/services/resultService';
import {
  downloadBANBEISWorkbook,
  downloadEMISWorkbook,
  downloadStipendBoardWorkbook,
} from '@/lib/boardExcelExport';
import { localDateKey } from '@/lib/dateUtils';
import { showToast } from '@/components/ui/ToastProvider';

const GRADES = [
  { key: '6th', label: '৬ষ্ঠ' },
  { key: '7th', label: '৭ম' },
  { key: '8th', label: '৮ম' },
  { key: '9th', label: '৯ম' },
  { key: '10th', label: '১০ম' },
];

const isFemale = (gender?: string) => {
  const g = (gender || '').toLowerCase();
  return g.includes('ছাত্রী') || g.includes('মেয়ে') || g.includes('মেয়ে') || g.includes('female') || g === 'f';
};

export default function AnalyticsPortalPage() {
  const [mounted, setMounted] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [selectedExam, setSelectedExam] = useState<string>('Annual Examination 2026');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [alumniCount, setAlumniCount] = useState(0);
  const [activeLoansCount, setActiveLoansCount] = useState(0);
  const [transportCount, setTransportCount] = useState(0);

  const loadAll = useCallback(() => {
    setStudents(studentService.getAllStudents());
    const ex = examService.getExams();
    setExams(ex);
    if (ex.length > 0) {
      setSelectedExam((prev) => (ex.some((x) => x.title === prev) ? prev : ex[0].title));
    }
    setSettings(settingsService.getSettings());
    setAlumniCount(alumniService.getAlumni().length);
    setActiveLoansCount(libraryService.getLoans().filter((l) => l.status === 'issued').length);
    setTransportCount(campusFacilityService.getTransportAssignments().filter((a) => a.active).length);
  }, []);

  useEffect(() => {
    setMounted(true);
    loadAll();
    const onStorage = () => loadAll();
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [loadAll]);

  // Class-wise Enrollment & Attendance Stats
  const classAnalytics = useMemo(() => {
    const ymPrefix = localDateKey().slice(0, 7);
    const branches = ['A', 'B', 'C', 'Science', 'Humanities', 'Commerce'];

    return GRADES.map((g) => {
      const gradeStudents = students.filter((s) => s.grade === g.key);
      const girls = gradeStudents.filter((s) => isFemale(s.gender)).length;
      const boys = gradeStudents.length - girls;
      const stipend = gradeStudents.filter((s) => s.isStipend || s.stipendStatus === 'Active').length;

      let presentSlots = 0;
      let totalSlots = 0;
      for (const b of branches) {
        const monthly = attendanceService.getMonthlyClassAttendance(ymPrefix, g.key, b);
        for (const dt of monthly.dates.slice(-5)) {
          const recs = attendanceService.getAttendance(dt, g.key, b);
          presentSlots += recs.filter((r) => r.status === 'Present').length;
          totalSlots += recs.length;
        }
      }
      const attendanceRate = totalSlots > 0 ? Math.round((presentSlots / totalSlots) * 100) : 0;

      return {
        gradeKey: g.key,
        gradeLabel: g.label,
        total: gradeStudents.length,
        boys,
        girls,
        stipend,
        attendanceRate,
      };
    });
  }, [students]);

  const maxClassSize = useMemo(
    () => Math.max(1, ...classAnalytics.map((c) => c.total)),
    [classAnalytics]
  );

  // Subject-wise Pass/Fail Heatmap
  const subjectHeatmap = useMemo(() => {
    const targetGrades = selectedGrade === 'all' ? GRADES.map((g) => g.key) : [selectedGrade];
    const rows: Array<{
      gradeKey: string;
      gradeLabel: string;
      subjectName: string;
      assessedCount: number;
      passCount: number;
      failCount: number;
      passRate: number;
      avgMarks: number;
    }> = [];

    for (const gKey of targetGrades) {
      const gStudents = students.filter((s) => s.grade === gKey);
      if (gStudents.length === 0) continue;

      const subjects = getActiveCurriculumSubjects(gKey, 'বিজ্ঞান');
      const gLabel = GRADES.find((x) => x.key === gKey)?.label || gKey;

      for (const sub of subjects) {
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
  }, [students, selectedGrade, selectedExam]);

  const totalGirls = useMemo(() => students.filter((s) => isFemale(s.gender)).length, [students]);
  const totalStipend = useMemo(
    () => students.filter((s) => s.isStipend || s.stipendStatus === 'Active').length,
    [students]
  );

  const handleDownloadBANBEIS = () => {
    const cfg = settings || settingsService.getSettings();
    const count = downloadBANBEISWorkbook(students, cfg);
    showToast(`BANBEIS রিপোর্ট (.xlsx) ডাউনলোড হয়েছে (${count} জন শিক্ষার্থী)।`, 'success');
  };

  const handleDownloadEMIS = () => {
    const cfg = settings || settingsService.getSettings();
    const count = downloadEMISWorkbook(students, cfg);
    showToast(`EMIS প্রোফাইল এক্সেল (.xlsx) ডাউনলোড হয়েছে (${count} জন শিক্ষার্থী)।`, 'success');
  };

  const handleDownloadStipend = () => {
    const cfg = settings || settingsService.getSettings();
    const stipendRows = students
      .filter((s) => s.isStipend || s.stipendCategory || s.stipendStatus === 'Active')
      .map((s) => ({
        ...s,
        attRate: s.attendance ?? 85,
        examScore: s.examMarkAvg ?? 60,
        monthlyAmount: 500,
        isEligible: (s.attendance ?? 85) >= 75 && (s.examMarkAvg ?? 60) >= 45,
      }));
    const count = downloadStipendBoardWorkbook(stipendRows, cfg);
    showToast(`বোর্ড উপবৃত্তি এক্সেল (.xlsx) ডাউনলোড হয়েছে (${count} জন)।`, 'success');
  };

  if (!mounted) {
    return (
      <div className="p-8 text-center text-sm font-bold text-slate-500 dark:text-slate-400">
        অ্যাডভান্সড অ্যানালিটিক্স ড্যাশবোর্ড লোড হচ্ছে...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-6 space-y-6">
      <style jsx global>{`
        @media print {
          @page { size: A4 landscape; margin: 10mm; }
          .no-print { display: none !important; }
          body { background: #ffffff !important; color: #0f172a !important; }
        }
      `}</style>

      {/* Print Header */}
      <div className="hidden print:block text-center border-b-2 border-slate-900 pb-2 mb-4">
        <h1 className="text-xl font-black">{settings?.schoolName || 'স্মার্ট স্কুল অ্যান্ড কলেজ'}</h1>
        <p className="text-xs font-bold text-slate-600">
          {settings?.address || ''} • প্রাতিষ্ঠানিক অ্যানালিটিক্স ও ফলাফল হিটম্যাপ ({selectedExam})
        </p>
      </div>

      {/* Header + Export Hub */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs no-print">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shrink-0">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              অ্যাডভান্সড অ্যানালিটিক্স, হিটম্যাপ ও BANBEIS / EMIS এক্সপোর্ট হাব
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              বিষয়ভিত্তিক পাস-ফেল হিটম্যাপ, শ্রেণি উপস্থিতি বিশ্লেষণ এবং শিক্ষা মন্ত্রণালয়ের সরকারি এক্সেল ফরম্যাট ডাউনলোড
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/dashboard"
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> ড্যাশবোর্ড
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" /> প্রিন্ট
          </button>
        </div>
      </div>

      {/* Government & Board Export Buttons */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white rounded-2xl p-5 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-sm font-black flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-300" />
            সরকারি ও শিক্ষা বোর্ড এক-ক্লিক এক্সেল (.xlsx) এক্সপোর্ট সেন্টার
          </h2>
          <p className="text-xs text-emerald-100/80 mt-0.5">
            ব্যানবেইস (BANBEIS), ইএমআইএস (EMIS) এবং উপবৃত্তি (HSP) পোর্টালের জন্য প্রস্তুতকৃত এক্সেল ওয়ার্কবুক
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleDownloadBANBEIS}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" /> BANBEIS (.xlsx)
          </button>
          <button
            type="button"
            onClick={handleDownloadEMIS}
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" /> EMIS (.xlsx)
          </button>
          <button
            type="button"
            onClick={handleDownloadStipend}
            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" /> উপবৃত্তি বোর্ড (.xlsx)
          </button>
        </div>
      </div>

      {/* Campus KPI Snapshot */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { label: 'মোট সক্রিয় শিক্ষার্থী', val: `${students.length} জন`, icon: Users },
          { label: 'ছাত্র / ছাত্রী', val: `${Math.max(0, students.length - totalGirls)} / ${totalGirls}`, icon: Users },
          { label: 'উপবৃত্তি সুবিধাভোগী', val: `${totalStipend} জন`, icon: Award },
          { label: 'চলমান লাইব্রেরি ইস্যু', val: `${activeLoansCount}টি`, icon: BookOpen },
          { label: 'বাস সার্ভিস শিক্ষার্থী', val: `${transportCount} জন`, icon: TrendingUp },
          { label: 'অ্যালুমনাই আর্কাইভ', val: `${alumniCount} জন`, icon: CalendarCheck2 },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-bold">{kpi.label}</span>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <p className="text-base font-black text-slate-900 dark:text-white">{kpi.val}</p>
            </div>
          );
        })}
      </div>

      {/* Class Enrollment & Attendance SVG/Tailwind Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-black flex items-center gap-2">
            <Users className="w-4 h-4 text-sky-600" /> শ্রেণিভিত্তিক শিক্ষার্থী ও ছাত্র-ছাত্রী অনুপাত
          </h2>
          <div className="space-y-3">
            {classAnalytics.map((c) => {
              const widthPct = Math.round((c.total / maxClassSize) * 100);
              const girlPct = c.total > 0 ? Math.round((c.girls / c.total) * 100) : 0;
              return (
                <div key={c.gradeKey} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>{c.gradeLabel} শ্রেণি</span>
                    <span className="text-slate-500 dark:text-slate-400">
                      মোট: {c.total} (ছাত্র {c.boys} • ছাত্রী {c.girls})
                    </span>
                  </div>
                  <div className="h-3.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-indigo-600 flex overflow-hidden rounded-full"
                      style={{ width: `${Math.max(c.total > 0 ? 4 : 0, widthPct)}%` }}
                    >
                      <div className="h-full bg-sky-500" style={{ width: `${100 - girlPct}%` }} />
                      <div className="h-full bg-pink-500" style={{ width: `${girlPct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 text-[11px] font-bold text-slate-500 pt-1">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" /> ছাত্র</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-pink-500 inline-block" /> ছাত্রী</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-black flex items-center gap-2">
            <CalendarCheck2 className="w-4 h-4 text-emerald-600" /> চলতি মাসে শ্রেণিভিত্তিক গড় উপস্থিতির হার (%)
          </h2>
          <div className="grid grid-cols-5 gap-3 items-end h-48 pt-6 border-b border-slate-200 dark:border-slate-800 pb-2">
            {classAnalytics.map((c) => (
              <div key={c.gradeKey} className="flex flex-col items-center justify-end h-full gap-1.5">
                <span className="text-[11px] font-black text-slate-700 dark:text-slate-200">
                  {c.attendanceRate}%
                </span>
                <div className="w-full max-w-[44px] flex-1 bg-slate-100 dark:bg-slate-800 rounded-t-xl flex items-end overflow-hidden">
                  <div
                    className={`w-full rounded-t-xl transition-all ${
                      c.attendanceRate >= 80
                        ? 'bg-emerald-500'
                        : c.attendanceRate >= 50
                        ? 'bg-amber-500'
                        : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                    style={{ height: `${Math.max(4, c.attendanceRate)}%` }}
                  />
                </div>
                <span className="text-xs font-black text-slate-600 dark:text-slate-300">{c.gradeLabel}</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 font-bold">
            চলতি মাসের সর্বশেষ রেকর্ডকৃত রোল কল সেশনগুলোর ওপর ভিত্তি করে স্বয়ংক্রিয় গড় হিসাব।
          </p>
        </div>
      </div>

      {/* Subject-wise Pass/Fail Heatmap */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" /> বিষয়ভিত্তিক পাস/ফেল হিটম্যাপ
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              পরীক্ষা ও শ্রেণি অনুযায়ী প্রতিটি বিষয়ের গড় নম্বর এবং পাসের হার (সবুজ &ge;৮০%, হলুদ ৬০-৭৯%, লাল &lt;৬০%)
            </p>
          </div>
          <div className="flex items-center gap-2 no-print">
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
            >
              {exams.map((ex) => (
                <option key={ex.id} value={ex.title}>{ex.title}</option>
              ))}
            </select>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
            >
              <option value="all">সকল শ্রেণি</option>
              {GRADES.map((g) => (
                <option key={g.key} value={g.key}>{g.label} শ্রেণি</option>
              ))}
            </select>
          </div>
        </div>

        {subjectHeatmap.length === 0 ? (
          <div className="py-10 text-center text-xs font-bold text-slate-400">
            নির্বাচিত পরীক্ষার জন্য এখনো কোনো নম্বর এন্ট্রি পাওয়া যায়নি। নম্বর এন্ট্রি সম্পন্ন হলে এখানে বিষয়ভিত্তিক হিটম্যাপ দেখা যাবে।
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {subjectHeatmap.map((cell) => {
              const toneClass =
                cell.passRate >= 80
                  ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40'
                  : cell.passRate >= 60
                  ? 'border-amber-200 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/40'
                  : 'border-rose-200 dark:border-rose-800 bg-rose-50/70 dark:bg-rose-950/40';
              const badgeClass =
                cell.passRate >= 80
                  ? 'bg-emerald-600 text-white'
                  : cell.passRate >= 60
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-rose-600 text-white';

              return (
                <div key={`${cell.gradeKey}-${cell.subjectName}`} className={`p-3.5 rounded-2xl border space-y-2 ${toneClass}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-black text-slate-500 dark:text-slate-400">
                        {cell.gradeLabel} শ্রেণি
                      </span>
                      <h3 className="text-xs font-black text-slate-900 dark:text-white leading-snug">
                        {cell.subjectName}
                      </h3>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-black shrink-0 ${badgeClass}`}>
                      {cell.passRate}% পাস
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    <span>উত্তীর্ণ: {cell.passCount} • অকৃতকার্য: {cell.failCount}</span>
                    <span>গড়: {cell.avgMarks}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
