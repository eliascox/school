'use client';

import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Download,
  Printer,
  RefreshCw,
  Eye,
  Trash2,
  BarChart3,
  Users,
  Layers,
  Search,
  Check,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  OmrExamSession,
  OmrScanRecord,
  omrService,
} from '@/services/omrService';
import type { SchoolSettings } from '@/services/settingsService';
import { OMR_OPTION_LABELS, toBanglaDigits } from '@/lib/omr/omrTemplates';
import { showToast } from '@/components/ui/ToastProvider';

interface OmrResultsSyncTabProps {
  session: OmrExamSession;
  allSessions: OmrExamSession[];
  scans: OmrScanRecord[];
  schoolSettings: SchoolSettings | null;
  classLabelBn: string;
  userName: string;
  onSelectSession: (session: OmrExamSession) => void;
  onInspectScan: (scan: OmrScanRecord) => void;
  onScansChanged: () => void;
}

const GRADE_LABEL_BN: Record<string, string> = {
  '6th': '৬ষ্ঠ শ্রেণি',
  '7th': '৭ম শ্রেণি',
  '8th': '৮ম শ্রেণি',
  '9th': '৯ম শ্রেণি',
  '10th': '১০ম শ্রেণি',
};

export default function OmrResultsSyncTab({
  session,
  allSessions,
  scans,
  schoolSettings,
  classLabelBn,
  userName,
  onSelectSession,
  onInspectScan,
  onScansChanged,
}: OmrResultsSyncTabProps) {
  const [subView, setSubView] = useState<'students' | 'classes' | 'analysis'>('students');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  const { roster, unmatchedScans } = useMemo(
    () => omrService.getClassStudentOmrRoster(session),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session, scans],
  );

  const itemAnalysis = useMemo(
    () => omrService.computeSessionItemAnalysis(session),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session, scans],
  );

  const scanCountBySession = useMemo(
    () => omrService.getScanCountBySession(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scans, allSessions],
  );

  const stats = useMemo(() => {
    const matchedScans = scans.filter((s) => s.matchStatus === 'matched');
    const syncedCount = matchedScans.filter((s) => s.syncedToMarkEntry).length;
    const passedCount = matchedScans.filter((s) => s.isPassedMcq).length;
    const avgScore =
      matchedScans.length > 0
        ? Number(
            (
              matchedScans.reduce((sum, sc) => sum + sc.obtainedMarks, 0) /
              matchedScans.length
            ).toFixed(1),
          )
        : 0;
    const highest =
      matchedScans.length > 0
        ? Math.max(...matchedScans.map((sc) => sc.obtainedMarks))
        : 0;
    return {
      totalStudents: roster.length,
      scannedMatched: matchedScans.length,
      unmatched: unmatchedScans.length,
      syncedCount,
      passedCount,
      avgScore,
      highest,
    };
  }, [roster.length, scans, unmatchedScans.length]);

  const filteredRoster = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return roster;
    return roster.filter(
      (r) =>
        r.student.name.toLowerCase().includes(q) ||
        String(r.student.roll).toLowerCase().includes(q),
    );
  }, [roster, searchQuery]);

  const handleSyncToMarkEntry = () => {
    if (stats.scannedMatched === 0) {
      showToast('সিঙ্ক করার মতো কোনো ম্যাচড শিক্ষার্থীর OMR স্ক্যান পাওয়া যায়নি।', 'error');
      return;
    }
    setIsSyncing(true);
    try {
      const report = omrService.syncSessionMarksToMarkEntry(session.id, userName);
      onScansChanged();
      showToast(
        `${report.syncedCount} জন শিক্ষার্থীর MCQ নম্বর মূল মার্ক এন্ট্রিতে সিঙ্ক হয়েছে (CQ ও Practical অক্ষত আছে)।`,
        'success',
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'মার্ক এন্ট্রি সিঙ্ক ব্যর্থ হয়েছে।', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportExcel = () => {
    const rows = roster.map(({ student, scan }) => ({
      রোল: student.roll,
      'শিক্ষার্থীর নাম': student.name,
      শ্রেণি: classLabelBn,
      'শাখা/বিভাগ': session.grade === '9th' || session.grade === '10th' ? session.group : session.branch,
      বিষয়: session.subjectName,
      অবস্থা: scan ? 'স্ক্যান সম্পন্ন' : 'বাকি / অনুপস্থিত',
      সেট: scan ? (scan.setCode === 'default' ? 'মূল' : scan.setCode) : '-',
      সঠিক: scan ? scan.correctCount : '-',
      ভুল: scan ? scan.wrongCount : '-',
      ফাঁকা: scan ? scan.blankCount : '-',
      ডাবল: scan ? scan.doubleCount : '-',
      'প্রাপ্ত MCQ': scan ? scan.obtainedMarks : '-',
      পূর্ণমান: scan ? scan.totalMarks : session.questionCount,
      'শতকরা (%)': scan ? `${scan.percentage}%` : '-',
      ফলাফল: scan ? (scan.isPassedMcq ? 'পাস' : 'ফেল') : '-',
      'মার্ক এন্ট্রি সিঙ্ক': scan ? (scan.syncedToMarkEntry ? 'হ্যাঁ' : 'বাকি') : '-',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'OMR Results');
    XLSX.writeFile(
      wb,
      `OMR_Results_${session.grade}_${session.subjectCode}_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
    showToast('শ্রেণি ও শিক্ষার্থীভিত্তিক OMR ফলাফল Excel-এ এক্সপোর্ট হয়েছে।', 'success');
  };

  const optionLabels = OMR_OPTION_LABELS[session.optionStyle];
  const isBn = session.optionStyle === 'bn';

  return (
    <>
      <style>
        {'@media print { @page { size: A4 portrait; margin: 12mm; } body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }'}
      </style>

      {/* Screen Content */}
      <div className="space-y-4 print:hidden">
        {/* Compact Summary & Sub-Navigation Strip */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
          <div className="inline-flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setSubView('students')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-all ${
                subView === 'students'
                  ? 'bg-[#0B5D3B] text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              শিক্ষার্থী তালিকা ({stats.scannedMatched}/{stats.totalStudents})
            </button>
            <button
              type="button"
              onClick={() => setSubView('classes')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-all ${
                subView === 'classes'
                  ? 'bg-[#0B5D3B] text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              সকল শ্রেণি ({allSessions.length})
            </button>
            <button
              type="button"
              onClick={() => setSubView('analysis')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-all ${
                subView === 'analysis'
                  ? 'bg-[#0B5D3B] text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              প্রশ্ন বিশ্লেষণ
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="hidden xl:flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span>গড়: <strong>{stats.avgScore}</strong></span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span>সর্বোচ্চ: <strong>{stats.highest}</strong></span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span>পাস: <strong className="text-emerald-700 dark:text-emerald-400">{stats.passedCount}</strong></span>
            </div>

            <button
              type="button"
              onClick={handleExportExcel}
              className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Excel
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" /> A4 প্রিন্ট
            </button>

            <button
              type="button"
              disabled={isSyncing || stats.scannedMatched === 0}
              onClick={handleSyncToMarkEntry}
              className="h-9 px-3.5 rounded-xl bg-[#0B5D3B] hover:bg-[#094a2f] disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              মার্ক এন্ট্রিতে সিঙ্ক ({stats.scannedMatched})
            </button>
          </div>
        </div>

        {/* Unmatched Rolls Alert Section (Zero Lost Sheets!) */}
        {subView === 'students' && unmatchedScans.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              অজানা / অমিল রোল ({unmatchedScans.length}টি শিট) — রোল ঠিক করে শিক্ষার্থী লিঙ্ক করলে মূল মার্ক এন্ট্রিতে সিঙ্ক হবে
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {unmatchedScans.map((sc) => (
                <div
                  key={sc.id}
                  className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/70 rounded-xl px-3 py-2 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 dark:text-white truncate">
                      পঠিত রোল: {sc.decodedRollRaw}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      নম্বর: {sc.obtainedMarks}/{sc.totalMarks} · সেট {sc.setCode === 'default' ? 'মূল' : sc.setCode}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onInspectScan(sc)}
                      className="h-7 px-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold"
                    >
                      রোল ঠিক করুন
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        omrService.deleteScan(sc.id);
                        onScansChanged();
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 1: Student-Wise Class Roster */}
        {subView === 'students' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {classLabelBn} ({session.grade === '9th' || session.grade === '10th' ? session.group : `শাখা ${session.branch}`}) · {session.subjectName}
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="নাম বা রোল খুঁজুন..."
                  className="w-full h-8 pl-8 pr-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/90 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                    <th className="py-2.5 px-4">রোল</th>
                    <th className="py-2.5 px-3">শিক্ষার্থীর নাম</th>
                    <th className="py-2.5 px-3 text-center">সেট</th>
                    <th className="py-2.5 px-3 text-center">সঠিক / ভুল / ফাঁকা</th>
                    <th className="py-2.5 px-3 text-center">প্রাপ্ত MCQ</th>
                    <th className="py-2.5 px-3 text-center">ফলাফল</th>
                    <th className="py-2.5 px-3 text-center">মার্ক সিঙ্ক</th>
                    <th className="py-2.5 px-4 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                  {filteredRoster.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400">
                        এই শ্রেণিতে কোনো শিক্ষার্থী পাওয়া যায়নি।
                      </td>
                    </tr>
                  ) : (
                    filteredRoster.map(({ student, scan }) => (
                      <tr
                        key={student.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-2.5 px-4 font-extrabold text-slate-800 dark:text-slate-100">
                          {student.roll}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {student.name}
                          </div>
                          {scan?.needsReview && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                              <AlertTriangle className="w-3 h-3" /> অস্পষ্ট/ডাবল উত্তর যাচাই করুন
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center font-semibold text-slate-600 dark:text-slate-300">
                          {scan ? (scan.setCode === 'default' ? 'মূল' : scan.setCode) : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {scan ? (
                            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold">
                              <span className="text-emerald-700 dark:text-emerald-400">
                                {scan.correctCount}
                              </span>
                              <span className="text-slate-300">/</span>
                              <span className="text-rose-600 dark:text-rose-400">
                                {scan.wrongCount}
                              </span>
                              <span className="text-slate-300">/</span>
                              <span className="text-slate-500">{scan.blankCount}</span>
                              {scan.doubleCount > 0 && (
                                <span className="px-1.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px]">
                                  +{scan.doubleCount} ডাবল
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400">স্ক্যান বাকি</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {scan ? (
                            <span className="font-extrabold text-slate-900 dark:text-white">
                              {scan.obtainedMarks}{' '}
                              <span className="text-[10px] font-normal text-slate-400">
                                / {scan.totalMarks}
                              </span>
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {scan ? (
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                scan.isPassedMcq
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                              }`}
                            >
                              {scan.isPassedMcq ? 'পাস' : 'ফেল'} ({scan.percentage}%)
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">অনুপস্থিত</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {scan ? (
                            scan.syncedToMarkEntry ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                                <Check className="w-3.5 h-3.5" /> সিঙ্কড
                              </span>
                            ) : (
                              <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                                পেন্ডিং
                              </span>
                            )
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          {scan ? (
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => onInspectScan(scan)}
                                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-[#0B5D3B] hover:border-[#0B5D3B]"
                                title="শিট যাচাই ও সংশোধন"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  omrService.deleteScan(scan.id);
                                  onScansChanged();
                                  showToast('স্ক্যান মুছে ফেলা হয়েছে।', 'info');
                                }}
                                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 hover:border-rose-300"
                                title="মুছুন"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 2: Class-Wise & Subject-Wise Archive Overview */}
        {subView === 'classes' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {allSessions.map((sess) => {
              const cnt = scanCountBySession[sess.id] || 0;
              const isCurrent = sess.id === session.id;
              return (
                <button
                  key={sess.id}
                  type="button"
                  onClick={() => {
                    onSelectSession(sess);
                    setSubView('students');
                  }}
                  className={`text-left p-4 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'border-[#0B5D3B] bg-emerald-50/50 dark:bg-emerald-950/30 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-[#0B5D3B] dark:text-emerald-400 truncate">
                        {GRADE_LABEL_BN[sess.grade] || sess.grade} ·{' '}
                        {sess.grade === '9th' || sess.grade === '10th' ? sess.group : `শাখা ${sess.branch}`}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5">
                        {sess.subjectName}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {sess.examTitle}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 shrink-0">
                      {cnt} শিট
                    </span>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>{sess.questionCount} MCQ</span>
                    <span className="font-semibold text-[#0B5D3B] dark:text-emerald-400">
                      {isCurrent ? 'সক্রিয় সেশন' : 'দেখুন →'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* VIEW 3: Question-Wise Item Analysis */}
        {subView === 'analysis' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  প্রশ্নভিত্তিক দক্ষতা বিশ্লেষণ (Item Analysis)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  কোন প্রশ্নগুলো শিক্ষার্থীরা সবচেয়ে বেশি ভুল করেছে তা সহজেই শনাক্ত করুন।
                </p>
              </div>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                মোট স্ক্যান: {scans.length} জন
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {itemAnalysis.map((st) => {
                const qLabel = isBn ? toBanglaDigits(st.questionNumber) : String(st.questionNumber);
                const keyLbl =
                  st.correctOption !== null ? optionLabels[st.correctOption] : '—';
                const isHard = st.totalScanned > 0 && st.accuracyPercent < 45;
                return (
                  <div
                    key={st.questionNumber}
                    className={`p-3 rounded-xl border text-xs space-y-2 ${
                      isHard
                        ? 'border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">
                        প্রশ্ন {qLabel}{' '}
                        <span className="text-emerald-700 dark:text-emerald-400">
                          (উত্তর: {keyLbl})
                        </span>
                      </span>
                      <span
                        className={`font-extrabold ${
                          isHard
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-emerald-700 dark:text-emerald-400'
                        }`}
                      >
                        {st.accuracyPercent}% সঠিক
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isHard ? 'bg-rose-500' : 'bg-[#0B5D3B]'
                        }`}
                        style={{ width: `${st.accuracyPercent}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                      {optionLabels.map((lbl, idx) => (
                        <span key={idx}>
                          {lbl}: {st.optionCounts[idx]}
                        </span>
                      ))}
                      <span>ফাঁকা: {st.blankCount}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* A4 Institutional Print Report */}
      <div className="hidden print:block text-slate-900 bg-white">
        <div className="flex items-center justify-center gap-4 border-b-2 border-slate-800 pb-3 mb-4">
          {schoolSettings?.schoolLogo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={schoolSettings.schoolLogo}
              alt="School Logo"
              className="w-14 h-14 object-contain"
            />
          )}
          <div className="text-center">
            <h1 className="text-lg font-extrabold text-slate-900">
              {schoolSettings?.schoolName || 'শিক্ষা প্রতিষ্ঠান'}
            </h1>
            {schoolSettings?.address && (
              <p className="text-xs text-slate-600">{schoolSettings.address}</p>
            )}
            <p className="text-sm font-bold text-[#0B5D3B] mt-0.5">
              {session.examTitle} — OMR বহুনির্বাচনি ফলাফল শিট
            </p>
            <p className="text-xs font-semibold text-slate-700">
              শ্রেণি: {classLabelBn} ({session.grade === '9th' || session.grade === '10th' ? session.group : `শাখা ${session.branch}`}) · বিষয়: {session.subjectName} · পূর্ণমান: {session.questionCount}
            </p>
          </div>
        </div>

        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-slate-400 py-1.5 px-2 text-center">রোল</th>
              <th className="border border-slate-400 py-1.5 px-2 text-left">শিক্ষার্থীর নাম</th>
              <th className="border border-slate-400 py-1.5 px-2 text-center">সেট</th>
              <th className="border border-slate-400 py-1.5 px-2 text-center">সঠিক</th>
              <th className="border border-slate-400 py-1.5 px-2 text-center">ভুল</th>
              <th className="border border-slate-400 py-1.5 px-2 text-center">ফাঁকা</th>
              <th className="border border-slate-400 py-1.5 px-2 text-center">প্রাপ্ত নম্বর</th>
              <th className="border border-slate-400 py-1.5 px-2 text-center">মন্তব্য</th>
            </tr>
          </thead>
          <tbody>
            {roster.map(({ student, scan }) => (
              <tr key={student.id}>
                <td className="border border-slate-300 py-1 px-2 text-center font-bold">
                  {student.roll}
                </td>
                <td className="border border-slate-300 py-1 px-2 font-medium">{student.name}</td>
                <td className="border border-slate-300 py-1 px-2 text-center">
                  {scan ? (scan.setCode === 'default' ? 'মূল' : scan.setCode) : '-'}
                </td>
                <td className="border border-slate-300 py-1 px-2 text-center">
                  {scan ? scan.correctCount : '-'}
                </td>
                <td className="border border-slate-300 py-1 px-2 text-center">
                  {scan ? scan.wrongCount : '-'}
                </td>
                <td className="border border-slate-300 py-1 px-2 text-center">
                  {scan ? scan.blankCount : '-'}
                </td>
                <td className="border border-slate-300 py-1 px-2 text-center font-bold">
                  {scan ? `${scan.obtainedMarks}/${scan.totalMarks}` : 'অনুপস্থিত'}
                </td>
                <td className="border border-slate-300 py-1 px-2 text-center">
                  {scan ? (scan.isPassedMcq ? 'পাস' : 'ফেল') : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-10 flex items-end justify-between text-xs font-bold text-slate-700 px-4">
          <div className="text-center border-t border-slate-500 pt-1 px-6">বিষয় শিক্ষকের স্বাক্ষর</div>
          <div className="text-center border-t border-slate-500 pt-1 px-6">প্রধান শিক্ষকের স্বাক্ষর</div>
        </div>
      </div>
    </>
  );
}
