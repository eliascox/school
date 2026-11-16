'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  ExternalLink,
  Printer,
  QrCode,
  Search,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import {
  generateStudentMarksheetData,
  MARKSHEET_A4_PRINT_STYLES,
  MarksheetSheetCard,
  StudentProfile,
} from '@/components/OfficialMarksheetSheet';
import { RankedStudentResult, parseNumericRoll } from '@/lib/resultAnalyticsEngine';
import { AppLanguage } from '@/services/languageService';
import { SchoolSettings } from '@/services/settingsService';
import { Student } from '@/services/studentService';
import { fmtNum, GRADE_LABELS, toBnDigits } from './resultStudioShared';

const TRAIT_TAGS_BN = [
  'নিয়মিত ও সময়নিষ্ঠ',
  'পাঠে মনোযোগী',
  'শৃঙ্খলাপরায়ণ',
  'উৎসাহী ও সৃজনশীল',
  'ভদ্র ও বিনয়ী',
  'অতিরিক্ত সহায়তা প্রয়োজন',
];

const TRAIT_TAGS_EN = [
  'Regular & Punctual',
  'Attentive in Class',
  'Well Disciplined',
  'Creative & Proactive',
  'Polite & Courteous',
  'Needs Extra Support',
];

function buildStudentProfile(st: Student, grade: string, group: string): StudentProfile {
  const gInfo = GRADE_LABELS[grade];
  return {
    id: st.id,
    roll: st.roll,
    name: st.name,
    grade,
    gradeBn: st.gradeBn || gInfo?.bn || grade,
    section: st.section || st.branch || 'A',
    group: grade === '9th' || grade === '10th' ? st.group || group : 'সাধারণ',
    fatherName: st.fatherName || st.guardian || '',
    motherName: st.motherName || '',
    session: st.session || '২০২৬',
    optionalSubject:
      st.optionalSubject ||
      ((grade === '9th' || grade === '10th') && (st.group || group) === 'বিজ্ঞান'
        ? 'উচ্চতর গণিত'
        : grade === '9th' || grade === '10th'
        ? 'কৃষি শিক্ষা'
        : ''),
  };
}

export function TranscriptWorkspace({
  mode,
  examTitle,
  grade,
  branch,
  group,
  lang,
  students,
  rankedResults,
  subjectHighestMap,
  settings,
  borderImageUrl,
  showHighestStats,
  onToggleHighestStats,
}: {
  mode: 'single_transcript' | 'batch_transcript';
  examTitle: string;
  grade: string;
  branch: string;
  group: string;
  lang: AppLanguage;
  students: Student[];
  rankedResults: RankedStudentResult[];
  subjectHighestMap: Record<string, number>;
  settings: Partial<SchoolSettings> | null;
  borderImageUrl: string;
  showHighestStats: boolean;
  onToggleHighestStats: (val: boolean) => void;
}) {
  const [studentQuery, setStudentQuery] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [rollFrom, setRollFrom] = useState('');
  const [rollTo, setRollTo] = useState('');
  const [useBorder, setUseBorder] = useState(true);
  const [showQrPanel, setShowQrPanel] = useState(true);
  const [selectedTraits, setSelectedTraits] = useState<string[]>(['নিয়মিত ও সময়নিষ্ঠ', 'শৃঙ্খলাপরায়ণ']);

  const resultByStudentId = useMemo(() => {
    const map = new Map<string, RankedStudentResult>();
    rankedResults.forEach((r) => map.set(r.studentId, r));
    return map;
  }, [rankedResults]);

  const filteredSingleCandidates = useMemo(() => {
    const q = studentQuery.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        String(s.roll).toLowerCase().includes(q) ||
        String(s.id).toLowerCase().includes(q),
    );
  }, [students, studentQuery]);

  const activeSingleStudent = useMemo(() => {
    if (filteredSingleCandidates.length === 0) return null;
    return (
      filteredSingleCandidates.find((s) => s.id === selectedStudentId) ||
      filteredSingleCandidates[0]
    );
  }, [filteredSingleCandidates, selectedStudentId]);

  const batchStudents = useMemo(() => {
    const fromNum = rollFrom.trim() ? parseNumericRoll(rollFrom) : Number.MIN_SAFE_INTEGER;
    const toNum = rollTo.trim() ? parseNumericRoll(rollTo) : Number.MAX_SAFE_INTEGER;
    return students.filter((s) => {
      const r = parseNumericRoll(s.roll);
      return r >= fromNum && r <= toNum;
    });
  }, [students, rollFrom, rollTo]);

  const toggleTrait = (trait: string) => {
    setSelectedTraits((prev) =>
      prev.includes(trait) ? prev.filter((t) => t !== trait) : [...prev, trait],
    );
  };

  const targets = mode === 'single_transcript' ? (activeSingleStudent ? [activeSingleStudent] : []) : batchStudents;
  const activeBorder = useBorder ? borderImageUrl : '';
  const pendingCohortStudents = rankedResults.filter((r) => r.hasIncompleteMarks).length;

  return (
    <div className="space-y-4">
      <style jsx global>{MARKSHEET_A4_PRINT_STYLES}</style>

      {/* Studio Transcript Control Strip (Screen Only) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3 print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          {mode === 'single_transcript' ? (
            <>
              <div className="md:col-span-4">
                <label className="block text-[11px] font-extrabold text-slate-500 dark:text-slate-400 mb-1">
                  {lang === 'bn' ? 'শিক্ষার্থী খুঁজুন (নাম / রোল / আইডি)' : 'Find Student (Name / Roll / ID)'}
                </label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={studentQuery}
                    onChange={(e) => setStudentQuery(e.target.value)}
                    placeholder={lang === 'bn' ? 'রোল বা নাম লিখুন...' : 'Type roll or name...'}
                    className="w-full pl-9 pr-3 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="md:col-span-4">
                <label className="block text-[11px] font-extrabold text-slate-500 dark:text-slate-400 mb-1">
                  {lang === 'bn' ? 'নির্বাচিত শিক্ষার্থী' : 'Select Student'}
                </label>
                <select
                  value={activeSingleStudent?.id || ''}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {filteredSingleCandidates.length === 0 ? (
                    <option value="">{lang === 'bn' ? 'কোনো শিক্ষার্থী নেই' : 'No students matched'}</option>
                  ) : (
                    filteredSingleCandidates.map((s) => (
                      <option key={s.id} value={s.id}>
                        Roll {s.roll} — {s.name} ({s.section || 'A'})
                      </option>
                    ))
                  )}
                </select>
              </div>
            </>
          ) : (
            <>
              <div className="md:col-span-4">
                <label className="block text-[11px] font-extrabold text-slate-500 dark:text-slate-400 mb-1">
                  {lang === 'bn' ? 'রোল সীমা থেকে (ঐচ্ছিক)' : 'Roll From (Optional)'}
                </label>
                <input
                  type="text"
                  value={rollFrom}
                  onChange={(e) => setRollFrom(e.target.value)}
                  placeholder="01"
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="md:col-span-4">
                <label className="block text-[11px] font-extrabold text-slate-500 dark:text-slate-400 mb-1">
                  {lang === 'bn' ? 'রোল পর্যন্ত (ঐচ্ছিক)' : 'Roll To (Optional)'}
                </label>
                <input
                  type="text"
                  value={rollTo}
                  onChange={(e) => setRollTo(e.target.value)}
                  placeholder={lang === 'bn' ? 'শেষ রোল' : 'End roll'}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </>
          )}

          <div className="md:col-span-4 flex flex-wrap items-center justify-end gap-2">
            <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={showHighestStats}
                onChange={(e) => onToggleHighestStats(e.target.checked)}
                className="accent-indigo-600 cursor-pointer"
              />
              {lang === 'bn' ? 'সর্বোচ্চ ও মেধা' : 'Highest & Rank'}
            </label>
            <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={useBorder}
                onChange={(e) => setUseBorder(e.target.checked)}
                className="accent-indigo-600 cursor-pointer"
              />
              {lang === 'bn' ? 'বর্ডার' : 'Border'}
            </label>
            <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={showQrPanel}
                onChange={(e) => setShowQrPanel(e.target.checked)}
                className="accent-indigo-600 cursor-pointer"
              />
              {lang === 'bn' ? 'যাচাই তথ্য' : 'Verify Info'}
            </label>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-xs cursor-pointer"
            >
              <Printer size={14} />
              {mode === 'batch_transcript'
                ? lang === 'bn'
                  ? `ব্যাচ প্রিন্ট (${toBnDigits(targets.length)})`
                  : `Batch Print (${targets.length})`
                : lang === 'bn'
                ? 'প্রিন্ট / PDF'
                : 'Print / PDF'}
            </button>
          </div>
        </div>

        {/* Teacher Observation Traits & Batch Incomplete Indicator */}
        {mode === 'single_transcript' && activeSingleStudent && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 mr-1">
              {lang === 'bn' ? 'শিক্ষকের মন্তব্য ট্যাগ:' : 'Conduct Tags:'}
            </span>
            {(lang === 'bn' ? TRAIT_TAGS_BN : TRAIT_TAGS_EN).map((trait) => {
              const active = selectedTraits.includes(trait);
              return (
                <button
                  key={trait}
                  type="button"
                  onClick={() => toggleTrait(trait)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                    active
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-transparent'
                  }`}
                >
                  {active ? '✓ ' : '+ '}
                  {trait}
                </button>
              );
            })}
          </div>
        )}

        {mode === 'batch_transcript' && pendingCohortStudents > 0 && (
          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-200 text-xs font-bold">
            <AlertTriangle size={15} className="shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              {lang === 'bn'
                ? `সতর্কতা: এই ব্যাচের ${toBnDigits(pendingCohortStudents)} জন শিক্ষার্থীর কিছু বিষয়ের নম্বর এখনো ইনপুট দেওয়া বাকি আছে।`
                : `Pending Notice: ${pendingCohortStudents} student(s) in this cohort still have unentered subject marks.`}
            </span>
          </div>
        )}
      </div>

      {/* Empty State */}
      {targets.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-2 print:hidden">
          <UserCheck size={28} className="mx-auto text-slate-400" />
          <h4 className="text-sm font-black text-slate-800 dark:text-white">
            {lang === 'bn' ? 'নির্বাচিত শ্রেণি/শাখায় কোনো শিক্ষার্থী নেই' : 'No students matched current selection'}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {lang === 'bn'
              ? 'উপরের শ্রেণি/শাখা পরিবর্তন করুন অথবা শিক্ষার্থী তালিকা থেকে নতুন শিক্ষার্থী যোগ করুন।'
              : 'Adjust class/section filters above or enroll students first.'}
          </p>
        </div>
      ) : (
        <div id="marksheet-result-container" className={mode === 'batch_transcript' ? 'marksheet-bulk-container space-y-6' : 'space-y-4'}>
          {targets.map((st) => {
            const profile = buildStudentProfile(st, grade, group);
            const marksheetData = generateStudentMarksheetData(profile, {
              selectedExam: examTitle,
              selectedGrade: grade,
              selectedBranch: st.section || st.branch || branch,
            });
            const analyticsRes = resultByStudentId.get(st.id);

            return (
              <div key={st.id} className="space-y-3">
                {/* Screen-only SchoolPro Analytics & Incomplete Guard Strip */}
                {(showHighestStats || analyticsRes?.hasIncompleteMarks || showQrPanel) && (
                  <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 print:hidden">
                    {analyticsRes?.hasIncompleteMarks && (
                      <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs font-bold">
                        <AlertTriangle size={15} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                        <div>
                          <span>
                            {lang === 'bn'
                              ? `অসম্পূর্ণ ফলাফল সতর্কতা — ${toBnDigits(analyticsRes.enteredSubjectsCount ?? 0)}/${toBnDigits(analyticsRes.expectedSubjectsCount ?? 0)}টি বিষয়ের নম্বর পাওয়া গেছে। বাকি বিষয়: `
                              : `Incomplete Marks Warning — ${analyticsRes.enteredSubjectsCount ?? 0}/${analyticsRes.expectedSubjectsCount ?? 0} compulsory subjects entered. Pending: `}
                          </span>
                          <span className="font-black">
                            {(analyticsRes.pendingSubjectNames || []).join(', ')}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                      <div className="rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5">
                        <div className="text-[10px] font-extrabold text-slate-400 uppercase">
                          {lang === 'bn' ? 'মেধাক্রম (Merit)' : 'Class Rank'}
                        </div>
                        <div className="text-base font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                          <Award size={15} />
                          {analyticsRes?.isPassed
                            ? lang === 'bn'
                              ? `${toBnDigits(analyticsRes.meritPosition)}তম`
                              : `#${analyticsRes.meritPosition}`
                            : lang === 'bn'
                            ? 'অকৃতকার্য'
                            : 'Not Ranked'}
                        </div>
                      </div>

                      <div className="rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5">
                        <div className="text-[10px] font-extrabold text-slate-400 uppercase">
                          {lang === 'bn' ? 'মোট নম্বর (%)' : 'Total & %'}
                        </div>
                        <div className="text-base font-black font-mono text-slate-900 dark:text-white">
                          {fmtNum(marksheetData.totalObtained, lang)} / {fmtNum(marksheetData.totalFull, lang)} (
                          {fmtNum(
                            marksheetData.totalFull > 0
                              ? ((marksheetData.totalObtained / marksheetData.totalFull) * 100).toFixed(1)
                              : '0.0',
                            lang,
                          )}
                          %)
                        </div>
                      </div>

                      <div className="rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5">
                        <div className="text-[10px] font-extrabold text-slate-400 uppercase">
                          {lang === 'bn' ? 'অর্জিত GPA / গ্রেড' : 'GPA / Grade'}
                        </div>
                        <div className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                          {fmtNum(marksheetData.finalGPA.toFixed(2), lang)} ({marksheetData.overallGrade})
                        </div>
                      </div>

                      <div className="rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 flex items-center justify-between gap-2">
                        <div>
                          <div className="text-[10px] font-extrabold text-slate-400 uppercase">
                            {lang === 'bn' ? 'উপস্থিতি ও যাচাই' : 'Attendance & Portal'}
                          </div>
                          <div className="text-xs font-black text-slate-800 dark:text-slate-200">
                            {st.attendance !== undefined ? `${fmtNum(st.attendance, lang)}%` : lang === 'bn' ? 'প্রযোজ্য' : 'Recorded'}
                          </div>
                        </div>
                        {showQrPanel && (
                          <Link
                            href={`/result?roll=${encodeURIComponent(st.roll)}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold hover:bg-indigo-100"
                          >
                            <QrCode size={13} />
                            <ExternalLink size={11} />
                          </Link>
                        )}
                      </div>
                    </div>

                    {showHighestStats && marksheetData.subjects.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                        <span className="inline-flex items-center gap-1 font-black text-slate-600 dark:text-slate-300 mr-1">
                          <Sparkles size={12} className="text-amber-500" />
                          {lang === 'bn' ? 'শ্রেণির সর্বোচ্চ নম্বর:' : 'Class Highest:'}
                        </span>
                        {marksheetData.subjects.map((sub: any) => {
                          const maxVal = subjectHighestMap[sub.code] ?? subjectHighestMap[sub.name] ?? sub.totalMarks;
                          return (
                            <span
                              key={sub.code}
                              className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-semibold"
                            >
                              {sub.name}: <strong className="font-mono text-indigo-600 dark:text-indigo-400">{maxVal}</strong>
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {mode === 'single_transcript' && selectedTraits.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-300 font-bold">
                        <CheckCircle2 size={13} />
                        <span>{lang === 'bn' ? 'আচরণগত মূল্যায়ন:' : 'Conduct:'}</span>
                        <span>{selectedTraits.join(' • ')}</span>
                      </div>
                    )}
                  </div>
                )}

                <MarksheetSheetCard
                  student={profile}
                  settings={settings}
                  examName={examTitle}
                  data={marksheetData}
                  borderImageUrl={activeBorder}
                  lang={lang}
                  includePrintStyles={false}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
