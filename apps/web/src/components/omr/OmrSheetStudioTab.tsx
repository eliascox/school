'use client';

import React, { useMemo, useState } from 'react';
import {
  Printer,
  Download,
  Users,
  FileText,
  Palette,
  Check,
  Sparkles,
} from 'lucide-react';
import {
  OMR_TEMPLATE_LIST,
  OMR_TEMPLATE_PRESETS,
  OmrColorTheme,
  OmrOptionStyle,
  OmrTemplateId,
} from '@/lib/omr/omrTemplates';
import { generateOmrSheetSvg, OmrSheetHeaderMeta } from '@/lib/omr/omrSheetSvg';
import {
  OmrExamSession,
  getEligibleStudentsForSession,
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
        'templateId' | 'rollDigits' | 'optionStyle' | 'setCount' | 'colorTheme'
      >
    >,
  ) => void;
}

type PrintBatchMode = 'blank_single' | 'blank_2up' | 'class_batch';

export default function OmrSheetStudioTab({
  session,
  schoolSettings,
  classLabelBn,
  onUpdateConfig,
}: OmrSheetStudioTabProps) {
  const [printMode, setPrintMode] = useState<PrintBatchMode>(
    session.templateId === 'a4_100' ? 'blank_single' : 'blank_2up',
  );
  const [preFillRollBubbles, setPreFillRollBubbles] = useState(true);
  const [previewStudentId, setPreviewStudentId] = useState<string>('');

  const eligibleStudents = useMemo(
    () => getEligibleStudentsForSession(session),
    [session],
  );

  const preset = OMR_TEMPLATE_PRESETS[session.templateId] || OMR_TEMPLATE_PRESETS.a5_30;
  const isA4Template = preset.pageSize === 'A4';

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
      subjectCode: session.subjectCode,
      examDate: new Date().toLocaleDateString('bn-BD'),
    }),
    [schoolSettings, session, classLabelBn],
  );

  const previewStudent = useMemo(() => {
    if (printMode !== 'class_batch') return undefined;
    if (previewStudentId) {
      const found = eligibleStudents.find((s) => s.id === previewStudentId);
      if (found) return found;
    }
    return eligibleStudents[0];
  }, [printMode, previewStudentId, eligibleStudents]);

  const previewSvg = useMemo(
    () =>
      generateOmrSheetSvg({
        templateId: session.templateId,
        rollDigits: session.rollDigits,
        optionStyle: session.optionStyle,
        setCount: session.setCount,
        colorTheme: session.colorTheme,
        header: headerMeta,
        student: previewStudent
          ? {
              id: previewStudent.id,
              name: previewStudent.name,
              roll: previewStudent.roll,
              section: previewStudent.section,
              group: previewStudent.group,
            }
          : undefined,
        preFillRollBubbles: printMode === 'class_batch' && preFillRollBubbles,
      }),
    [session, headerMeta, previewStudent, printMode, preFillRollBubbles],
  );

  const handleDownloadSvg = () => {
    const blob = new Blob([previewSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OMR_${session.grade}_${session.subjectCode}_${session.templateId}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('ভেক্টর OMR শিট (SVG) ডাউনলোড হয়েছে।', 'success');
  };

  const handlePrintSheets = () => {
    if (printMode === 'class_batch' && eligibleStudents.length === 0) {
      showToast('এই শ্রেণিতে কোনো শিক্ষার্থী পাওয়া যায়নি। ফাঁকা মাস্টার শিট প্রিন্ট করুন।', 'error');
      return;
    }
    window.print();
  };

  // Build printable pages for @media print
  const printablePages = useMemo(() => {
    const effectiveMode: PrintBatchMode =
      isA4Template && printMode === 'blank_2up' ? 'blank_single' : printMode;

    if (effectiveMode === 'blank_single') {
      return [
        {
          key: 'blank-1',
          isTwoUp: false,
          svgs: [
            generateOmrSheetSvg({
              templateId: session.templateId,
              rollDigits: session.rollDigits,
              optionStyle: session.optionStyle,
              setCount: session.setCount,
              colorTheme: session.colorTheme,
              header: headerMeta,
            }),
          ],
        },
      ];
    }

    if (effectiveMode === 'blank_2up') {
      const blankSvg = generateOmrSheetSvg({
        templateId: session.templateId,
        rollDigits: session.rollDigits,
        optionStyle: session.optionStyle,
        setCount: session.setCount,
        colorTheme: session.colorTheme,
        header: headerMeta,
      });
      return [{ key: 'blank-2up', isTwoUp: true, svgs: [blankSvg, blankSvg] }];
    }

    // Class batch printing
    const list = eligibleStudents;
    if (isA4Template) {
      return list.map((st) => ({
        key: st.id,
        isTwoUp: false,
        svgs: [
          generateOmrSheetSvg({
            templateId: session.templateId,
            rollDigits: session.rollDigits,
            optionStyle: session.optionStyle,
            setCount: session.setCount,
            colorTheme: session.colorTheme,
            header: headerMeta,
            student: {
              id: st.id,
              name: st.name,
              roll: st.roll,
              section: st.section,
              group: st.group,
            },
            preFillRollBubbles,
          }),
        ],
      }));
    }

    // Pair A5 students 2-up on A4 Landscape to save 50% paper!
    const pages: Array<{ key: string; isTwoUp: boolean; svgs: string[] }> = [];
    for (let i = 0; i < list.length; i += 2) {
      const s1 = list[i];
      const s2 = list[i + 1];
      const svg1 = generateOmrSheetSvg({
        templateId: session.templateId,
        rollDigits: session.rollDigits,
        optionStyle: session.optionStyle,
        setCount: session.setCount,
        colorTheme: session.colorTheme,
        header: headerMeta,
        student: { id: s1.id, name: s1.name, roll: s1.roll, section: s1.section, group: s1.group },
        preFillRollBubbles,
      });
      const svg2 = s2
        ? generateOmrSheetSvg({
            templateId: session.templateId,
            rollDigits: session.rollDigits,
            optionStyle: session.optionStyle,
            setCount: session.setCount,
            colorTheme: session.colorTheme,
            header: headerMeta,
            student: { id: s2.id, name: s2.name, roll: s2.roll, section: s2.section, group: s2.group },
            preFillRollBubbles,
          })
        : '';
      pages.push({
        key: `pair-${i}`,
        isTwoUp: true,
        svgs: svg2 ? [svg1, svg2] : [svg1],
      });
    }
    return pages;
  }, [isA4Template, printMode, session, headerMeta, eligibleStudents, preFillRollBubbles]);

  const useLandscape2Up =
    !isA4Template && (printMode === 'blank_2up' || printMode === 'class_batch');

  const printPageCss = useLandscape2Up
    ? '@media print { @page { size: A4 landscape; margin: 0; } body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }'
    : isA4Template
      ? '@media print { @page { size: A4 portrait; margin: 0; } body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }'
      : '@media print { @page { size: A5 portrait; margin: 0; } body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }';

  return (
    <>
      <style>{printPageCss}</style>

      {/* Screen Studio Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 print:hidden">
        {/* Left Controls */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#0B5D3B] dark:text-emerald-400" />
                OMR শিট কনফিগারেশন
              </h3>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800">
                {preset.pageSize} · {preset.questionCount} MCQ
              </span>
            </div>

            {/* Template Preset */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                প্রশ্ন সংখ্যা ও টেমপ্লেট
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {OMR_TEMPLATE_LIST.map((tpl) => {
                  const active = session.templateId === tpl.id;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => {
                        onUpdateConfig({ templateId: tpl.id as OmrTemplateId });
                        if (tpl.pageSize === 'A4' && printMode === 'blank_2up') {
                          setPrintMode('blank_single');
                        }
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                        active
                          ? 'border-[#0B5D3B] bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">{tpl.nameBn}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {tpl.recommendedForBn}
                        </div>
                      </div>
                      {active && <Check className="w-4 h-4 text-[#0B5D3B] dark:text-emerald-400 shrink-0" />}
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
          </div>

          {/* Print Mode & Batch Controls */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-2xs">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
              প্রিন্ট মোড নির্বাচন
            </h4>

            <div className="space-y-2">
              {!isA4Template && (
                <button
                  type="button"
                  onClick={() => setPrintMode('blank_2up')}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border text-xs transition-colors ${
                    printMode === 'blank_2up'
                      ? 'border-[#0B5D3B] bg-emerald-50/70 dark:bg-emerald-950/40 font-bold text-emerald-950 dark:text-emerald-100'
                      : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div>২-আপ A4 ফটোকপি মাস্টার (১ পাতায় ২টি A5 শিট)</div>
                  <div className="text-[10px] font-normal text-slate-500 dark:text-slate-400">
                    ৫০% কাগজ সাশ্রয় — মাঝখান দিয়ে কেটে বিতরণ করুন
                  </div>
                </button>
              )}

              <button
                type="button"
                onClick={() => setPrintMode('blank_single')}
                className={`w-full text-left px-3 py-2.5 rounded-xl border text-xs transition-colors ${
                  printMode === 'blank_single'
                    ? 'border-[#0B5D3B] bg-emerald-50/70 dark:bg-emerald-950/40 font-bold text-emerald-950 dark:text-emerald-100'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div>একক ফাঁকা মাস্টার শিট ({preset.pageSize})</div>
                <div className="text-[10px] font-normal text-slate-500 dark:text-slate-400">
                  ফটোকপি বা সরাসরি প্রিন্টের জন্য আদর্শ
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPrintMode('class_batch')}
                className={`w-full text-left px-3 py-2.5 rounded-xl border text-xs transition-colors ${
                  printMode === 'class_batch'
                    ? 'border-[#0B5D3B] bg-emerald-50/70 dark:bg-emerald-950/40 font-bold text-emerald-950 dark:text-emerald-100'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#0B5D3B] dark:text-emerald-400" />
                    শ্রেণিভিত্তিক শিক্ষার্থী ব্যাচ প্রিন্ট ({eligibleStudents.length} জন)
                  </span>
                  <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 font-bold">
                    <Sparkles className="w-2.5 h-2.5" /> জিরো রোল ভুল
                  </span>
                </div>
                <div className="text-[10px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                  প্রতিটি শিটে শিক্ষার্থীর নাম, রোল ও শ্রেণি-শাখা আগে থেকেই ছাপা থাকবে
                </div>
              </button>
            </div>

            {printMode === 'class_batch' && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preFillRollBubbles}
                    onChange={(e) => setPreFillRollBubbles(e.target.checked)}
                    className="rounded border-slate-300 text-[#0B5D3B] focus:ring-[#0B5D3B]"
                  />
                  রোল নম্বরের বৃত্তগুলো আগে থেকেই ভরাট (Pre-Fill) রাখুন
                </label>

                {eligibleStudents.length > 0 && (
                  <select
                    value={previewStudent?.id || ''}
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
                {printMode === 'class_batch'
                  ? `সকল শিট প্রিন্ট (${printablePages.length} পাতা)`
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
          <div className="w-full flex items-center justify-between mb-3 text-xs text-slate-600 dark:text-slate-400">
            <span className="font-semibold">
              লাইভ ভেক্টর প্রিভিউ ({preset.pageWidthMm}mm × {preset.pageHeightMm}mm · ৪ কর্নার ফিডুশিয়াল যুক্ত)
            </span>
            <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
              পিঙ্ক ড্রপআউট ও B&amp;W লেজার উভয় স্ক্যানেই শতভাগ উপযোগী
            </span>
          </div>

          <div
            className="w-full max-w-[540px] bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden [&>svg]:w-full [&>svg]:h-auto"
            dangerouslySetInnerHTML={{ __html: previewSvg }}
          />
        </div>
      </div>

      {/* Print-Only Output (Exact mm, Zero UI Chrome) */}
      <div className="hidden print:block">
        {printablePages.map((pg) => (
          <div
            key={pg.key}
            style={{
              pageBreakAfter: 'always',
              breakAfter: 'page',
              display: pg.isTwoUp ? 'flex' : 'block',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              width: pg.isTwoUp ? '297mm' : `${preset.pageWidthMm}mm`,
              height: pg.isTwoUp ? '210mm' : `${preset.pageHeightMm}mm`,
              background: '#ffffff',
              overflow: 'hidden',
            }}
          >
            {pg.svgs.map((svgHtml, sIdx) => (
              <div
                key={sIdx}
                style={{
                  width: `${preset.pageWidthMm}mm`,
                  height: `${preset.pageHeightMm}mm`,
                  borderRight:
                    pg.isTwoUp && sIdx === 0 ? '0.25mm dashed #cbd5e1' : 'none',
                  boxSizing: 'border-box',
                }}
                dangerouslySetInnerHTML={{ __html: svgHtml }}
              />
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
