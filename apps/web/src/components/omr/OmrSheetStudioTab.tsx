'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Printer,
  Download,
  Users,
  FileText,
  Palette,
  Scissors,
  Sparkles,
  Layers,
} from 'lucide-react';
import {
  LEGAL_LANDSCAPE_HEIGHT_MM,
  LEGAL_LANDSCAPE_WIDTH_MM,
  OMR_MAX_QUESTIONS,
  OMR_MIN_QUESTIONS,
  OMR_QUICK_QUESTION_CHIPS,
  OmrColorTheme,
  OmrOptionStyle,
  OmrPaperFormat,
  clampOmrQuestionCount,
  getOmrTemplateLayout,
  toBanglaDigits,
} from '@/lib/omr/omrTemplates';
import {
  OmrSheetHeaderMeta,
  generateLegalTwoUpPrintSvg,
  generateOmrSheetSvg,
} from '@/lib/omr/omrSheetSvg';
import {
  OmrExamSession,
  getEligibleStudentsForSession,
  normalizeSubjectCode3Digit,
} from '@/services/omrService';
import type { SchoolSettings } from '@/services/settingsService';
import { showToast } from '@/components/ui/ToastProvider';

interface OmrSheetStudioTabProps {
  session: OmrExamSession;
  schoolSettings: SchoolSettings | null;
  classLabelBn: string;
  onUpdateConfig: (
    updates: Partial<
      Pick<
        OmrExamSession,
        'questionCount' | 'paperFormat' | 'rollDigits' | 'optionStyle' | 'setCount' | 'colorTheme'
      >
    >,
  ) => void;
}

type PrintBatchMode =
  | 'legal_2up_blank'
  | 'legal_2up_batch'
  | 'a4_2up_blank'
  | 'a4_single_blank';

export default function OmrSheetStudioTab({
  session,
  schoolSettings,
  classLabelBn,
  onUpdateConfig,
}: OmrSheetStudioTabProps) {
  const [questionInput, setQuestionInput] = useState<string>(String(session.questionCount));
  const [printMode, setPrintMode] = useState<PrintBatchMode>(
    session.paperFormat === 'a4'
      ? 'a4_single_blank'
      : session.paperFormat === 'a5'
        ? 'a4_2up_blank'
        : 'legal_2up_blank',
  );
  const [previewSpread, setPreviewSpread] = useState<'single' | '2up'>('2up');
  const [preFillRollBubbles, setPreFillRollBubbles] = useState(true);
  const [preFillIdentityBubbles, setPreFillIdentityBubbles] = useState(true);
  const [previewStudentId, setPreviewStudentId] = useState<string>('');

  useEffect(() => {
    setQuestionInput(String(session.questionCount));
  }, [session.questionCount]);

  const eligibleStudents = useMemo(
    () => getEligibleStudentsForSession(session),
    [session],
  );

  const activePaperFormat: OmrPaperFormat = useMemo(() => {
    if (printMode === 'a4_single_blank') return 'a4';
    if (printMode === 'a4_2up_blank') return 'a5';
    return 'legal_half';
  }, [printMode]);

  const layout = useMemo(
    () =>
      getOmrTemplateLayout({
        questionCount: session.questionCount,
        paperFormat: activePaperFormat,
        rollDigits: session.rollDigits,
        optionStyle: session.optionStyle,
        setCount: session.setCount,
      }),
    [session.questionCount, activePaperFormat, session.rollDigits, session.optionStyle, session.setCount],
  );

  const normalizedSubCode = normalizeSubjectCode3Digit(session.subjectCode);

  const headerMeta: OmrSheetHeaderMeta = useMemo(
    () => ({
      schoolName: schoolSettings?.schoolName || 'শিক্ষা প্রতিষ্ঠান',
      schoolAddress: schoolSettings?.address || '',
      eiin: schoolSettings?.eiin || '',
      schoolLogo: schoolSettings?.schoolLogo || '',
      examTitle: session.examTitle,
      classLabel: classLabelBn,
      sectionOrGroupLabel:
        session.grade === '9th' || session.grade === '10th'
          ? session.group
          : `শাখা: ${session.branch}`,
      subjectLabel: session.subjectName,
      subjectCode: normalizedSubCode || session.subjectCode,
      examDate: new Date().toLocaleDateString('bn-BD'),
    }),
    [schoolSettings, session, classLabelBn, normalizedSubCode],
  );

  const commitQuestionCount = (rawVal: string | number) => {
    const clamped = clampOmrQuestionCount(rawVal, session.questionCount);
    setQuestionInput(String(clamped));
    if (clamped !== session.questionCount) {
      onUpdateConfig({ questionCount: clamped });
    }
  };

  const handlePrintModeChange = (mode: PrintBatchMode) => {
    setPrintMode(mode);
    const nextPaper: OmrPaperFormat =
      mode === 'a4_single_blank' ? 'a4' : mode === 'a4_2up_blank' ? 'a5' : 'legal_half';
    if (nextPaper !== session.paperFormat) {
      onUpdateConfig({ paperFormat: nextPaper });
    }
    if (mode === 'a4_single_blank') {
      setPreviewSpread('single');
    } else if (mode === 'legal_2up_blank' || mode === 'legal_2up_batch') {
      setPreviewSpread('2up');
    }
  };

  const previewStudent1 = useMemo(() => {
    if (printMode !== 'legal_2up_batch') return undefined;
    if (previewStudentId) {
      const found = eligibleStudents.find((s) => s.id === previewStudentId);
      if (found) return found;
    }
    return eligibleStudents[0];
  }, [printMode, previewStudentId, eligibleStudents]);

  const previewStudent2 = useMemo(() => {
    if (printMode !== 'legal_2up_batch' || eligibleStudents.length < 2) return undefined;
    const idx = previewStudent1
      ? eligibleStudents.findIndex((s) => s.id === previewStudent1.id)
      : 0;
    return eligibleStudents[idx + 1] || eligibleStudents[0];
  }, [printMode, eligibleStudents, previewStudent1]);

  const buildSheetSvg = (student?: { id: string; name: string; roll: string; section?: string; group?: string }) =>
    generateOmrSheetSvg({
      questionCount: session.questionCount,
      paperFormat: activePaperFormat,
      rollDigits: session.rollDigits,
      optionStyle: session.optionStyle,
      setCount: session.setCount,
      colorTheme: session.colorTheme,
      header: headerMeta,
      student,
      preFillRollBubbles: Boolean(student && preFillRollBubbles),
      subjectCodeValue: normalizedSubCode,
      preFillSubjectCodeBubbles: Boolean(preFillIdentityBubbles && normalizedSubCode),
      preFillGrade: preFillIdentityBubbles ? session.grade : undefined,
      preFillGroup: preFillIdentityBubbles ? session.group : undefined,
    });

  const previewSingleSvg = useMemo(
    () =>
      buildSheetSvg(
        previewStudent1
          ? {
              id: previewStudent1.id,
              name: previewStudent1.name,
              roll: previewStudent1.roll,
              section: previewStudent1.section,
              group: previewStudent1.group,
            }
          : undefined,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      session,
      activePaperFormat,
      headerMeta,
      previewStudent1,
      preFillRollBubbles,
      preFillIdentityBubbles,
      normalizedSubCode,
    ],
  );

  const previewLegalTwoUpSvg = useMemo(() => {
    if (activePaperFormat !== 'legal_half') return previewSingleSvg;
    const rightSvg =
      printMode === 'legal_2up_batch' && previewStudent2
        ? buildSheetSvg({
            id: previewStudent2.id,
            name: previewStudent2.name,
            roll: previewStudent2.roll,
            section: previewStudent2.section,
            group: previewStudent2.group,
          })
        : previewSingleSvg;
    return generateLegalTwoUpPrintSvg(previewSingleSvg, rightSvg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePaperFormat, previewSingleSvg, printMode, previewStudent2]);

  const activePreviewSvg =
    activePaperFormat === 'legal_half' && previewSpread === '2up'
      ? previewLegalTwoUpSvg
      : previewSingleSvg;

  const handleDownloadSvg = () => {
    const blob = new Blob([activePreviewSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OMR_${session.grade}_${normalizedSubCode || session.subjectCode}_${session.questionCount}Q_${activePaperFormat === 'legal_half' && previewSpread === '2up' ? 'Legal2Up' : activePaperFormat}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('ভেক্টর OMR শিট (SVG) ডাউনলোড হয়েছে।', 'success');
  };

  const handlePrintSheets = () => {
    if (printMode === 'legal_2up_batch' && eligibleStudents.length === 0) {
      showToast('এই শ্রেণিতে কোনো শিক্ষার্থী পাওয়া যায়নি। ফাঁকা মাস্টার ২-আপ প্রিন্ট করুন।', 'error');
      return;
    }
    window.print();
  };

  // Build exact printable pages for @media print
  const printablePages = useMemo(() => {
    if (printMode === 'legal_2up_blank') {
      const sheet = buildSheetSvg(undefined);
      return [
        {
          key: 'legal-2up-blank',
          kind: 'legal_2up' as const,
          svg: generateLegalTwoUpPrintSvg(sheet, sheet),
        },
      ];
    }

    if (printMode === 'legal_2up_batch') {
      const list = eligibleStudents;
      const pages: Array<{ key: string; kind: 'legal_2up'; svg: string }> = [];
      for (let i = 0; i < list.length; i += 2) {
        const s1 = list[i];
        const s2 = list[i + 1];
        const leftSvg = buildSheetSvg({
          id: s1.id,
          name: s1.name,
          roll: s1.roll,
          section: s1.section,
          group: s1.group,
        });
        const rightSvg = s2
          ? buildSheetSvg({
              id: s2.id,
              name: s2.name,
              roll: s2.roll,
              section: s2.section,
              group: s2.group,
            })
          : undefined;
        pages.push({
          key: `legal-pair-${i}`,
          kind: 'legal_2up',
          svg: generateLegalTwoUpPrintSvg(leftSvg, rightSvg),
        });
      }
      return pages;
    }

    if (printMode === 'a4_2up_blank') {
      const a5Sheet = buildSheetSvg(undefined);
      return [
        {
          key: 'a4-2up-blank',
          kind: 'a4_2up' as const,
          svgs: [a5Sheet, a5Sheet],
        },
      ];
    }

    // a4_single_blank
    return [
      {
        key: 'a4-single',
        kind: 'a4_single' as const,
        svg: buildSheetSvg(undefined),
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    printMode,
    session,
    activePaperFormat,
    headerMeta,
    eligibleStudents,
    preFillRollBubbles,
    preFillIdentityBubbles,
    normalizedSubCode,
  ]);

  const printPageCss =
    printMode === 'legal_2up_blank' || printMode === 'legal_2up_batch'
      ? '@media print { @page { size: 355.6mm 215.9mm; margin: 0; } body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; margin: 0; padding: 0; } }'
      : printMode === 'a4_2up_blank'
        ? '@media print { @page { size: A4 landscape; margin: 0; } body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; margin: 0; padding: 0; } }'
        : '@media print { @page { size: A4 portrait; margin: 0; } body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; margin: 0; padding: 0; } }';

  return (
    <>
      <style>{printPageCss}</style>

      {/* Screen Studio Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 print:hidden">
        {/* Left Controls */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#0B5D3B] dark:text-emerald-400" />
                OMR শিট ডিজাইন
              </h3>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800">
                {toBanglaDigits(session.questionCount)} MCQ · {layout.questionColumns.length} কলাম
              </span>
            </div>

            {/* Dynamic Custom Question Count (10..100, Bangla & English digits) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  মোট প্রশ্ন সংখ্যা ({OMR_MIN_QUESTIONS}–{OMR_MAX_QUESTIONS})
                </label>
                <span className="text-[10px] font-semibold text-slate-400">
                  বাংলা/ইংরেজি অঙ্ক লিখুন
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  value={questionInput}
                  onChange={(e) => setQuestionInput(e.target.value)}
                  onBlur={() => commitQuestionCount(questionInput)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      commitQuestionCount(questionInput);
                    }
                  }}
                  placeholder="যেমন: ১৫, ২০, ২৫, ৩০"
                  className="flex-1 h-9 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-extrabold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-[#0B5D3B]"
                />
                <button
                  type="button"
                  onClick={() => commitQuestionCount(questionInput)}
                  className="h-9 px-3.5 rounded-xl bg-slate-900 dark:bg-emerald-700 hover:bg-slate-800 dark:hover:bg-emerald-600 text-white text-xs font-bold transition-colors shrink-0"
                >
                  সেট করুন
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {OMR_QUICK_QUESTION_CHIPS.map((cnt) => {
                  const active = session.questionCount === cnt;
                  return (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => commitQuestionCount(cnt)}
                      className={`h-7 px-2.5 rounded-lg text-xs font-bold border transition-all ${
                        active
                          ? 'bg-[#0B5D3B] text-white border-[#0B5D3B]'
                          : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-[#0B5D3B]'
                      }`}
                    >
                      {toBanglaDigits(cnt)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Roll Digits + Option Language */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  রোল ডিজিট সংখ্যা
                </label>
                <select
                  value={session.rollDigits}
                  onChange={(e) => onUpdateConfig({ rollDigits: Number(e.target.value) })}
                  className="w-full h-9 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-bold text-slate-800 dark:text-slate-100"
                >
                  {[2, 3, 4, 5, 6].map((d) => (
                    <option key={d} value={d}>
                      {d} ডিজিট ({'0'.repeat(d - 1)}1–{'9'.repeat(d)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  অপশন ভাষা
                </label>
                <div className="grid grid-cols-2 gap-1">
                  {(
                    [
                      { id: 'bn', label: 'ক খ গ ঘ' },
                      { id: 'en', label: 'A B C D' },
                    ] as Array<{ id: OmrOptionStyle; label: string }>
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onUpdateConfig({ optionStyle: opt.id })}
                      className={`h-9 rounded-xl text-xs font-bold border transition-colors ${
                        session.optionStyle === opt.id
                          ? 'bg-[#0B5D3B] text-white border-[#0B5D3B]'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Set Count + Color Theme */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  প্রশ্ন সেট কোড
                </label>
                <div className="grid grid-cols-2 gap-1">
                  {([4, 1] as const).map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => onUpdateConfig({ setCount: cnt })}
                      className={`h-9 rounded-xl text-xs font-bold border transition-colors ${
                        session.setCount === cnt
                          ? 'bg-[#0B5D3B] text-white border-[#0B5D3B]'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {cnt === 4 ? '৪ সেট' : '১ সেট'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  প্রিন্ট কালার থিম
                </label>
                <div className="grid grid-cols-2 gap-1">
                  {(
                    [
                      { id: 'pink', label: 'পিঙ্ক (সেরা)' },
                      { id: 'bw', label: 'সাদা-কালো' },
                    ] as Array<{ id: OmrColorTheme; label: string }>
                  ).map((th) => (
                    <button
                      key={th.id}
                      type="button"
                      onClick={() => onUpdateConfig({ colorTheme: th.id })}
                      className={`h-9 rounded-xl text-xs font-bold border transition-colors inline-flex items-center justify-center gap-1 ${
                        session.colorTheme === th.id
                          ? th.id === 'pink'
                            ? 'bg-pink-600 text-white border-pink-600'
                            : 'bg-slate-800 text-white border-slate-800'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Palette className="w-3 h-3" /> {th.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Auto-Sync Identity Bubble Pre-Fill Toggle */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <label className="flex items-start gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preFillIdentityBubbles}
                  onChange={(e) => setPreFillIdentityBubbles(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-[#0B5D3B] focus:ring-[#0B5D3B]"
                />
                <span>
                  বিষয় কোড ({normalizedSubCode || '—'}), শ্রেণি ও বিভাগ বাবল আগে থেকেই ভরাট (Pre-Fill) রাখুন
                </span>
              </label>
            </div>
          </div>

          {/* Legal Landscape 2-Up Primary Print Selector */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5 text-[#0B5D3B] dark:text-emerald-400" />
                লিগাল ২-আপ ও প্রিন্ট মোড
              </h4>
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                355.6 × 215.9 mm
              </span>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handlePrintModeChange('legal_2up_blank')}
                className={`w-full text-left px-3 py-2.5 rounded-xl border text-xs transition-colors ${
                  printMode === 'legal_2up_blank'
                    ? 'border-[#0B5D3B] bg-emerald-50/70 dark:bg-emerald-950/40 font-bold text-emerald-950 dark:text-emerald-100'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span>লিগাল ২-আপ — ফাঁকা মাস্টার (ডিফল্ট)</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 font-bold">
                    ✂ মাঝখানে কাটিং
                  </span>
                </div>
                <div className="text-[10px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                  ১ লিগাল ল্যান্ডস্কেপ পাতায় সমান ২টি শিট (১৭৭.৮ মিমি × ২১৫.৯ মিমি)
                </div>
              </button>

              <button
                type="button"
                onClick={() => handlePrintModeChange('legal_2up_batch')}
                className={`w-full text-left px-3 py-2.5 rounded-xl border text-xs transition-colors ${
                  printMode === 'legal_2up_batch'
                    ? 'border-[#0B5D3B] bg-emerald-50/70 dark:bg-emerald-950/40 font-bold text-emerald-950 dark:text-emerald-100'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#0B5D3B] dark:text-emerald-400" />
                    লিগাল ২-আপ — শ্রেণি ব্যাচ ({eligibleStudents.length} জন)
                  </span>
                  <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 font-bold">
                    <Sparkles className="w-2.5 h-2.5" /> জিরো রোল ভুল
                  </span>
                </div>
                <div className="text-[10px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                  প্রতি পাতায় ২ জন শিক্ষার্থীর নাম, রোল, বিভাগ ও বিষয় কোডসহ (রোল ক্রমিকে)
                </div>
              </button>

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handlePrintModeChange('a4_2up_blank')}
                  className={`px-2.5 py-2 rounded-xl border text-[11px] font-semibold transition-colors ${
                    printMode === 'a4_2up_blank'
                      ? 'border-[#0B5D3B] bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  A4 ২-আপ (A5 শিট)
                </button>
                <button
                  type="button"
                  onClick={() => handlePrintModeChange('a4_single_blank')}
                  className={`px-2.5 py-2 rounded-xl border text-[11px] font-semibold transition-colors ${
                    printMode === 'a4_single_blank'
                      ? 'border-[#0B5D3B] bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  একক A4 পূর্ণ পাতা
                </button>
              </div>
            </div>

            {printMode === 'legal_2up_batch' && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preFillRollBubbles}
                    onChange={(e) => setPreFillRollBubbles(e.target.checked)}
                    className="rounded border-slate-300 text-[#0B5D3B] focus:ring-[#0B5D3B]"
                  />
                  শিক্ষার্থীর রোল বাবল প্রি-ফিল রাখুন
                </label>

                {eligibleStudents.length > 0 && (
                  <select
                    value={previewStudent1?.id || ''}
                    onChange={(e) => setPreviewStudentId(e.target.value)}
                    className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium text-slate-700 dark:text-slate-200"
                  >
                    {eligibleStudents.map((st) => (
                      <option key={st.id} value={st.id}>
                        প্রিভিউ: রোল {st.roll} — {st.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handlePrintSheets}
                className="flex-1 h-10 px-4 rounded-xl bg-[#0B5D3B] hover:bg-[#094a2f] text-white text-xs font-bold inline-flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <Printer className="w-4 h-4" />
                {printMode === 'legal_2up_batch'
                  ? `ব্যাচ প্রিন্ট (${printablePages.length} লিগাল পাতা)`
                  : 'OMR শিট প্রিন্ট করুন'}
              </button>
              <button
                type="button"
                onClick={handleDownloadSvg}
                className="h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                title="ভেক্টর SVG ডাউনলোড"
              >
                <Download className="w-4 h-4" /> SVG
              </button>
            </div>
          </div>
        </div>

        {/* Right Live Vector Sheet Preview */}
        <div className="lg:col-span-8 bg-slate-100/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 flex flex-col items-center">
          <div className="w-full flex flex-wrap items-center justify-between gap-2 mb-3 text-xs text-slate-600 dark:text-slate-400">
            <span className="font-semibold">
              {activePaperFormat === 'legal_half' && previewSpread === '2up'
                ? `লিগাল ২-আপ প্রিভিউ (${LEGAL_LANDSCAPE_WIDTH_MM} × ${LEGAL_LANDSCAPE_HEIGHT_MM} mm · মাঝখানে x=177.8mm ✂ কাটিং লাইন)`
                : `একক শিট প্রিভিউ (${layout.preset.pageWidthMm} × ${layout.preset.pageHeightMm} mm · ৪ কর্নার ফিডুশিয়াল)`}
            </span>

            {activePaperFormat === 'legal_half' && (
              <div className="inline-flex items-center bg-white dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setPreviewSpread('2up')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold inline-flex items-center gap-1 ${
                    previewSpread === '2up'
                      ? 'bg-[#0B5D3B] text-white'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Layers className="w-3 h-3" /> ২-আপ লিগাল
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewSpread('single')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                    previewSpread === 'single'
                      ? 'bg-[#0B5D3B] text-white'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  একক শিট
                </button>
              </div>
            )}
          </div>

          <div
            className={`w-full bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden [&>svg]:w-full [&>svg]:h-auto ${
              activePaperFormat === 'legal_half' && previewSpread === '2up'
                ? 'max-w-[880px]'
                : 'max-w-[540px]'
            }`}
            dangerouslySetInnerHTML={{ __html: activePreviewSvg }}
          />
        </div>
      </div>

      {/* Print-Only Output (Exact Legal 355.6x215.9mm / A4 / A5, Zero UI Chrome) */}
      <div className="hidden print:block">
        {printablePages.map((pg) => {
          if (pg.kind === 'legal_2up') {
            return (
              <div
                key={pg.key}
                style={{
                  pageBreakAfter: 'always',
                  breakAfter: 'page',
                  width: `${LEGAL_LANDSCAPE_WIDTH_MM}mm`,
                  height: `${LEGAL_LANDSCAPE_HEIGHT_MM}mm`,
                  background: '#ffffff',
                  overflow: 'hidden',
                }}
                dangerouslySetInnerHTML={{ __html: pg.svg }}
              />
            );
          }
          if (pg.kind === 'a4_2up') {
            return (
              <div
                key={pg.key}
                style={{
                  pageBreakAfter: 'always',
                  breakAfter: 'page',
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '297mm',
                  height: '210mm',
                  background: '#ffffff',
                  overflow: 'hidden',
                }}
              >
                {pg.svgs.map((svgHtml, sIdx) => (
                  <div
                    key={sIdx}
                    style={{
                      width: '148mm',
                      height: '210mm',
                      borderRight: sIdx === 0 ? '0.35mm dashed #64748b' : 'none',
                      boxSizing: 'border-box',
                    }}
                    dangerouslySetInnerHTML={{ __html: svgHtml }}
                  />
                ))}
              </div>
            );
          }
          return (
            <div
              key={pg.key}
              style={{
                pageBreakAfter: 'always',
                breakAfter: 'page',
                width: '210mm',
                height: '297mm',
                background: '#ffffff',
                overflow: 'hidden',
              }}
              dangerouslySetInnerHTML={{ __html: pg.svg }}
            />
          );
        })}
      </div>
    </>
  );
}
