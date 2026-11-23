'use client';

import React, { useMemo, useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  UserX,
  Save,
  RotateCcw,
} from 'lucide-react';
import {
  OmrExamSession,
  OmrScanRecord,
  getAllOmrCurriculumSubjects,
  getEligibleStudentsForSession,
  getSessionSetCodes,
  gradeOmrQuestionResponses,
  matchStudentByRollForSession,
  normalizeGroupToBranch,
  normalizeGroupToBn,
  normalizeSubjectCode3Digit,
  resolveOmrSubjectByCode,
} from '@/services/omrService';
import {
  OMR_GRADE_OPTIONS,
  OMR_GROUP_OPTIONS,
  OMR_OPTION_LABELS,
  getOmrTemplateLayout,
  toBanglaDigits,
} from '@/lib/omr/omrTemplates';

interface OmrVerifyModalProps {
  session: OmrExamSession;
  scan: OmrScanRecord;
  onClose: () => void;
  onSave: (updates: {
    roll: string;
    studentId: string | null;
    grade: string;
    group: string;
    subjectCode: string;
    setCode: string;
    answers: Array<number | null>;
  }) => void;
}

export default function OmrVerifyModal({
  session,
  scan,
  onClose,
  onSave,
}: OmrVerifyModalProps) {
  const layout = useMemo(
    () =>
      getOmrTemplateLayout({
        templateId: session.templateId,
        questionCount: session.questionCount,
        paperFormat: session.paperFormat,
        rollDigits: session.rollDigits,
        optionStyle: session.optionStyle,
        setCount: session.setCount,
      }),
    [
      session.templateId,
      session.questionCount,
      session.paperFormat,
      session.rollDigits,
      session.optionStyle,
      session.setCount,
    ],
  );

  const validSets = useMemo(() => getSessionSetCodes(session), [session]);
  const optionLabels = OMR_OPTION_LABELS[session.optionStyle];
  const isBn = session.optionStyle === 'bn';

  const [gradeInput, setGradeInput] = useState<string>(scan.grade || session.grade);
  const [groupInput, setGroupInput] = useState<string>(
    normalizeGroupToBn(scan.grade || session.grade, scan.group || session.group, scan.branch || session.branch),
  );
  const [subjectCodeInput, setSubjectCodeInput] = useState<string>(
    scan.decodedSubjectCodeRaw || normalizeSubjectCode3Digit(scan.subjectCode || session.subjectCode) || session.subjectCode,
  );
  const [rollInput, setRollInput] = useState(scan.studentRoll === '?' ? '' : scan.studentRoll);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(scan.studentId);
  const [setCode, setSetCode] = useState(scan.setCode || validSets[0]);
  const [answers, setAnswers] = useState<Array<number | null>>(() =>
    scan.answers.map((a) => a.selectedIndex),
  );
  const [filterFlaggedOnly, setFilterFlaggedOnly] = useState(false);

  const isGrade9or10 = gradeInput === '9th' || gradeInput === '10th';
  const effectiveGroupBn = normalizeGroupToBn(gradeInput, groupInput);
  const effectiveBranch = normalizeGroupToBranch(gradeInput, effectiveGroupBn, session.branch);

  const curriculumSubjectsForTarget = useMemo(
    () => getAllOmrCurriculumSubjects(gradeInput, effectiveGroupBn),
    [gradeInput, effectiveGroupBn],
  );

  const resolvedSubject = useMemo(
    () => resolveOmrSubjectByCode(gradeInput, effectiveGroupBn, subjectCodeInput),
    [gradeInput, effectiveGroupBn, subjectCodeInput],
  );

  const effectiveSubjectName = resolvedSubject?.subject.name || session.subjectName;

  const previewSessionScope = useMemo(
    () => ({
      grade: gradeInput,
      branch: effectiveBranch,
      group: effectiveGroupBn,
      subjectName: effectiveSubjectName,
    }),
    [gradeInput, effectiveBranch, effectiveGroupBn, effectiveSubjectName],
  );

  const eligibleStudents = useMemo(
    () => getEligibleStudentsForSession(previewSessionScope),
    [previewSessionScope],
  );

  const liveMatch = useMemo(
    () => matchStudentByRollForSession(previewSessionScope, rollInput, selectedStudentId),
    [previewSessionScope, rollInput, selectedStudentId],
  );

  const liveGraded = useMemo(() => {
    const responses = answers.map((choice, idx) => {
      const orig = scan.answers[idx];
      const modified = choice !== orig?.selectedIndex;
      return {
        questionNumber: idx + 1,
        selectedIndex: choice,
        filledIndices: choice !== null ? [choice] : [],
        status: modified
          ? choice !== null
            ? ('filled' as const)
            : ('blank' as const)
          : orig?.status || (choice !== null ? ('filled' as const) : ('blank' as const)),
        confidence: modified ? 1 : orig?.confidence ?? 1,
      };
    });
    return gradeOmrQuestionResponses(session, setCode, responses);
  }, [answers, scan.answers, session, setCode]);

  const handleToggleOption = (qIdx: number, optIdx: number) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[qIdx] = next[qIdx] === optIdx ? null : optIdx;
      return next;
    });
  };

  const handleStudentSelect = (studentId: string) => {
    if (!studentId) {
      setSelectedStudentId(null);
      return;
    }
    const found = eligibleStudents.find((s) => s.id === studentId);
    if (found) {
      setSelectedStudentId(found.id);
      setRollInput(found.roll);
    }
  };

  const handleRollTyping = (val: string) => {
    setRollInput(val);
    setSelectedStudentId(null);
  };

  const flaggedIndices = useMemo(
    () =>
      liveGraded.answers
        .map((a, idx) => (a.status === 'uncertain' || a.status === 'double' ? idx : -1))
        .filter((i) => i >= 0),
    [liveGraded.answers],
  );

  const visibleQuestionIndices = useMemo(() => {
    const all = Array.from({ length: session.questionCount }, (_, i) => i);
    if (!filterFlaggedOnly || flaggedIndices.length === 0) return all;
    return flaggedIndices;
  }, [filterFlaggedOnly, flaggedIndices, session.questionCount]);

  const vbW = layout.canonicalWidthPx;
  const vbH = layout.canonicalHeightPx;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Top Modal Bar */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-950/50">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                liveMatch.student
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                  : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
              }`}
            >
              {liveMatch.student ? <UserCheck className="w-5 h-5" /> : <UserX className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                OMR শিট যাচাই ও সংশোধন (Tap-to-Fix)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {effectiveSubjectName} ({subjectCodeInput || '—'}) · রোল: {rollInput || '?'} · স্কোর:{' '}
                <strong className="text-emerald-700 dark:text-emerald-400">
                  {liveGraded.obtainedMarks}/{liveGraded.totalMarks}
                </strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
          {/* Left: Perspective-Corrected Sheet Visual Overlay */}
          <div className="lg:col-span-5 p-4 bg-slate-100/70 dark:bg-slate-950/60 flex flex-col items-center justify-start gap-3">
            <div className="w-full flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              <span>স্ক্যানকৃত ওয়ার্পড শিট (ট্যাপ করে উত্তর বদলান)</span>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> সঠিক
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> ভুল
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> যাচাই
                </span>
              </div>
            </div>

            {scan.warpedThumbnail ? (
              <div className="relative w-full max-w-[390px] rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 shadow-sm bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={scan.warpedThumbnail}
                  alt="Warped OMR Sheet"
                  className="w-full h-auto block select-none"
                />
                <svg
                  viewBox={`0 0 ${vbW} ${vbH}`}
                  preserveAspectRatio="none"
                  className="absolute inset-0 w-full h-full"
                >
                  {layout.questionBubbles.map((rowBubbles, qIdx) => {
                    const ans = liveGraded.answers[qIdx];
                    if (!ans) return null;
                    return rowBubbles.map((b, optIdx) => {
                      const cx = b.u * vbW;
                      const cy = b.v * vbH;
                      const rx = b.rU * vbW * 1.15;
                      const ry = b.rV * vbH * 1.15;

                      const isSelected = ans.selectedIndex === optIdx;
                      const isCorrectKey = ans.correctIndex === optIdx;
                      const isFlagged = ans.status === 'uncertain' || ans.status === 'double';

                      let stroke = 'transparent';
                      let fill = 'transparent';

                      if (isSelected) {
                        if (ans.outcome === 'correct') {
                          stroke = '#10b981';
                          fill = 'rgba(16, 185, 129, 0.28)';
                        } else if (ans.outcome === 'wrong') {
                          stroke = '#ef4444';
                          fill = 'rgba(239, 68, 68, 0.28)';
                        } else {
                          stroke = '#0ea5e9';
                          fill = 'rgba(14, 165, 233, 0.25)';
                        }
                      } else if (isFlagged && ans.filledIndices.includes(optIdx)) {
                        stroke = '#f59e0b';
                        fill = 'rgba(245, 158, 11, 0.30)';
                      } else if (isCorrectKey && ans.outcome !== 'correct') {
                        stroke = '#10b981';
                        fill = 'rgba(16, 185, 129, 0.08)';
                      }

                      return (
                        <ellipse
                          key={`ov-${qIdx}-${optIdx}`}
                          cx={cx}
                          cy={cy}
                          rx={rx}
                          ry={ry}
                          fill={fill}
                          stroke={stroke}
                          strokeWidth={isSelected || isFlagged ? 3 : isCorrectKey ? 2 : 0}
                          strokeDasharray={!isSelected && isCorrectKey ? '4 2' : undefined}
                          className="cursor-pointer"
                          onClick={() => handleToggleOption(qIdx, optIdx)}
                        />
                      );
                    });
                  })}
                </svg>
              </div>
            ) : (
              <div className="w-full max-w-[360px] py-14 px-6 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-500 dark:text-slate-400">
                এই রেকর্ডের লোকাল থাম্বনেইল সংরক্ষিত নেই। ডান পাশের গ্রিড থেকে রোল, বিষয় কোড ও উত্তর সংশোধন করুন।
              </div>
            )}
          </div>

          {/* Right: Identity (Class + Group + Subject Code + Roll) + Tap-to-Fix Grid */}
          <div className="lg:col-span-7 p-4 sm:p-5 flex flex-col gap-4">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 bg-slate-50/60 dark:bg-slate-950/40 space-y-3">
              {/* Row 1: Decoded Class + Group + 3-Digit Subject Code */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    শ্রেণি
                  </label>
                  <select
                    value={gradeInput}
                    onChange={(e) => {
                      const nextG = e.target.value;
                      setGradeInput(nextG);
                      setGroupInput(normalizeGroupToBn(nextG, groupInput));
                      setSelectedStudentId(null);
                    }}
                    className="w-full h-9 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-100"
                  >
                    {OMR_GRADE_OPTIONS.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.labelBn}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    বিভাগ / গ্রুপ
                  </label>
                  <select
                    value={effectiveGroupBn}
                    disabled={!isGrade9or10}
                    onChange={(e) => {
                      setGroupInput(e.target.value);
                      setSelectedStudentId(null);
                    }}
                    className="w-full h-9 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 disabled:opacity-60 text-xs font-bold text-slate-800 dark:text-slate-100"
                  >
                    {isGrade9or10 ? (
                      OMR_GROUP_OPTIONS.filter((g) => g.id !== 'সাধারণ').map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.labelBn}
                        </option>
                      ))
                    ) : (
                      <option value="সাধারণ">সাধারণ</option>
                    )}
                  </select>
                </div>

                <div className="sm:col-span-5">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    ৩-ডিজিট বিষয় কোড / বিষয়
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={subjectCodeInput}
                      onChange={(e) => setSubjectCodeInput(e.target.value)}
                      placeholder="136"
                      className="w-20 h-9 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-extrabold text-slate-900 dark:text-white"
                    />
                    <select
                      value={resolvedSubject?.subject.code || ''}
                      onChange={(e) => {
                        if (e.target.value) setSubjectCodeInput(e.target.value);
                      }}
                      className="flex-1 min-w-0 h-9 px-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-100"
                    >
                      <option value="">{effectiveSubjectName}</option>
                      {curriculumSubjectsForTarget.map((sub) => (
                        <option key={`${sub.code}-${sub.name}`} value={sub.code}>
                          {sub.code} — {sub.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Row 2: Roll + Student Match + Set */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    রোল নম্বর
                  </label>
                  <input
                    type="text"
                    value={rollInput}
                    onChange={(e) => handleRollTyping(e.target.value)}
                    placeholder="যেমন: 05"
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-700"
                  />
                </div>

                <div className="sm:col-span-6">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    শিক্ষার্থী নির্বাচন (শ্রেণি ও বিভাগ তালিকা থেকে)
                  </label>
                  <select
                    value={liveMatch.student?.id || ''}
                    onChange={(e) => handleStudentSelect(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-700"
                  >
                    <option value="">-- অজানা / ম্যানুয়ালি নির্বাচন করুন --</option>
                    {eligibleStudents.map((st) => (
                      <option key={st.id} value={st.id}>
                        রোল {st.roll} — {st.name}
                      </option>
                    ))}
                  </select>
                </div>

                {session.setCount === 4 && (
                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      প্রশ্ন সেট
                    </label>
                    <div className="grid grid-cols-4 gap-1">
                      {validSets.map((sc) => (
                        <button
                          key={sc}
                          type="button"
                          onClick={() => setSetCode(sc)}
                          className={`h-9 rounded-lg text-xs font-bold border transition-colors ${
                            setCode === sc
                              ? 'bg-[#0B5D3B] text-white border-[#0B5D3B]'
                              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {sc}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-slate-200/70 dark:border-slate-800 text-xs">
                {liveMatch.student ? (
                  <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    নিশ্চিত ম্যাচ: {liveMatch.student.name} (রোল {liveMatch.student.roll})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 font-semibold text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="w-4 h-4" />
                    এই শ্রেণি ও বিভাগে রোল মেলেনি — ড্রপডাউন থেকে সঠিক শিক্ষার্থী নির্বাচন করুন।
                  </span>
                )}

                <div className="flex items-center gap-2 text-[11px] font-bold">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                    সঠিক: {liveGraded.correctCount}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                    ভুল: {liveGraded.wrongCount}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    ফাঁকা: {liveGraded.blankCount}
                  </span>
                  {liveGraded.doubleCount > 0 && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                      ডাবল: {liveGraded.doubleCount}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Filter & Quick Reset Bar */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  প্রশ্নভিত্তিক উত্তর ({session.questionCount}টি)
                </span>
                {flaggedIndices.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilterFlaggedOnly((p) => !p)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors ${
                      filterFlaggedOnly
                        ? 'bg-amber-600 text-white'
                        : 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                    }`}
                  >
                    যাচাই প্রয়োজন ({flaggedIndices.length})
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setAnswers(scan.answers.map((a) => a.selectedIndex))}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                <RotateCcw className="w-3.5 h-3.5" /> মূল স্ক্যানে ফিরুন
              </button>
            </div>

            {/* Interactive Question Answer Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[340px] overflow-y-auto pr-1">
              {visibleQuestionIndices.map((qIdx) => {
                const ans = liveGraded.answers[qIdx];
                if (!ans) return null;
                const isFlagged = ans.status === 'uncertain' || ans.status === 'double';
                const qLabel = isBn ? toBanglaDigits(ans.questionNumber) : String(ans.questionNumber);

                return (
                  <div
                    key={ans.questionNumber}
                    className={`flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs ${
                      isFlagged
                        ? 'border-amber-300 dark:border-amber-700 bg-amber-50/70 dark:bg-amber-950/30'
                        : ans.outcome === 'correct'
                          ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20'
                          : ans.outcome === 'wrong'
                            ? 'border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <span className="font-bold text-slate-700 dark:text-slate-200 w-6 shrink-0">
                      {qLabel}.
                    </span>
                    <div className="flex items-center gap-1">
                      {optionLabels.map((lbl, optIdx) => {
                        const chosen = ans.selectedIndex === optIdx;
                        const isKey = ans.correctIndex === optIdx;
                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => handleToggleOption(qIdx, optIdx)}
                            className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center border transition-all ${
                              chosen
                                ? ans.outcome === 'correct'
                                  ? 'bg-emerald-600 text-white border-emerald-600'
                                  : ans.outcome === 'wrong'
                                    ? 'bg-rose-600 text-white border-rose-600'
                                    : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900'
                                : isKey
                                  ? 'border-emerald-500 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
                                  : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-500'
                            }`}
                            title={isKey ? 'সঠিক উত্তরপত্রের অপশন' : undefined}
                          >
                            {lbl}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            প্রাপ্ত নম্বর:{' '}
            <strong className="text-sm text-slate-900 dark:text-white">
              {liveGraded.obtainedMarks} / {liveGraded.totalMarks}
            </strong>{' '}
            ({liveGraded.percentage}%)
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              বাতিল
            </button>
            <button
              type="button"
              onClick={() =>
                onSave({
                  roll: rollInput.trim() || scan.studentRoll,
                  studentId: liveMatch.student?.id ?? null,
                  grade: gradeInput,
                  group: effectiveGroupBn,
                  subjectCode: subjectCodeInput.trim() || session.subjectCode,
                  setCode,
                  answers,
                })
              }
              className="h-9 px-4 rounded-xl bg-[#0B5D3B] hover:bg-[#094a2f] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Save className="w-3.5 h-3.5" /> সংশোধন সংরক্ষণ করুন
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
