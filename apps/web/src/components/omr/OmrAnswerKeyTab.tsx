'use client';

import React, { useMemo, useRef, useState } from 'react';
import {
  KeyRound,
  CheckCircle2,
  Copy,
  Trash2,
  Upload,
  Loader2,
  Sparkles,
} from 'lucide-react';
import {
  OMR_OPTION_LABELS,
  toBanglaDigits,
} from '@/lib/omr/omrTemplates';
import {
  OmrExamSession,
  getSessionSetCodes,
} from '@/services/omrService';
import { decodeOmrImageBuffer } from '@/lib/omr/omrVisionEngine';
import { loadImageFileToRgbaBuffer } from '@/lib/omr/omrPdfBatchLoader';
import { showToast } from '@/components/ui/ToastProvider';

interface OmrAnswerKeyTabProps {
  session: OmrExamSession;
  onSaveAnswerKey: (setCode: string, answers: Array<number | null>) => void;
  onUpdateScoringRules: (updates: { markPerCorrect?: number; negativeMark?: number }) => void;
}

export default function OmrAnswerKeyTab({
  session,
  onSaveAnswerKey,
  onUpdateScoringRules,
}: OmrAnswerKeyTabProps) {
  const validSets = useMemo(() => getSessionSetCodes(session), [session]);
  const [activeSet, setActiveSet] = useState<string>(validSets[0] || 'default');
  const [isScanningKey, setIsScanningKey] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const currentSetCode = validSets.includes(activeSet) ? activeSet : validSets[0];
  const optionLabels = OMR_OPTION_LABELS[session.optionStyle];
  const isBn = session.optionStyle === 'bn';

  const currentAnswers: Array<number | null> = useMemo(() => {
    const arr = session.answerKeys[currentSetCode] || [];
    return Array.from({ length: session.questionCount }, (_, i) =>
      arr[i] !== undefined ? arr[i] : null,
    );
  }, [session.answerKeys, currentSetCode, session.questionCount]);

  const filledCount = useMemo(
    () => currentAnswers.filter((v) => v !== null).length,
    [currentAnswers],
  );

  const handleSelectOption = (qIdx: number, optIdx: number) => {
    const next = [...currentAnswers];
    next[qIdx] = next[qIdx] === optIdx ? null : optIdx;
    onSaveAnswerKey(currentSetCode, next);
  };

  const handleCopyFromFirstSet = () => {
    const firstKey = session.answerKeys[validSets[0]] || [];
    if (firstKey.every((v) => v === null)) {
      showToast(`প্রথমে সেট "${validSets[0]}"-এর উত্তরপত্র পূরণ করুন।`, 'error');
      return;
    }
    onSaveAnswerKey(currentSetCode, [...firstKey]);
    showToast(`সেট "${validSets[0]}" থেকে উত্তরপত্র কপি হয়েছে।`, 'success');
  };

  const handleClearCurrentSet = () => {
    onSaveAnswerKey(
      currentSetCode,
      Array.from({ length: session.questionCount }, () => null),
    );
    showToast('এই সেটের উত্তরপত্র খালি করা হয়েছে।', 'info');
  };

  const handleScanTeacherKeySheet = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setIsScanningKey(true);
    try {
      const page = await loadImageFileToRgbaBuffer(file);
      const decoded = decodeOmrImageBuffer(page.buffer, {
        templateId: session.templateId,
        rollDigits: session.rollDigits,
        optionStyle: session.optionStyle,
        setCount: session.setCount,
      });

      if (!decoded.success) {
        showToast(decoded.error || 'উত্তরপত্র শিটটি পড়া যায়নি।', 'error');
        return;
      }

      const extracted = decoded.questions.map((q) =>
        q.status === 'filled' || q.status === 'uncertain' ? q.selectedIndex : null,
      );
      const detectedCount = extracted.filter((v) => v !== null).length;

      if (detectedCount === 0) {
        showToast('শিটে কোনো ভরাট করা উত্তর পাওয়া যায়নি।', 'error');
        return;
      }

      const targetSet =
        decoded.setCode && validSets.includes(decoded.setCode)
          ? decoded.setCode
          : currentSetCode;

      setActiveSet(targetSet);
      onSaveAnswerKey(targetSet, extracted);
      showToast(
        `সেট "${targetSet === 'default' ? 'মূল' : targetSet}"-এর ${detectedCount}/${session.questionCount}টি উত্তর স্বয়ংক্রিয়ভাবে সেট হয়েছে!`,
        'success',
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'উত্তরপত্র স্ক্যানে সমস্যা হয়েছে।', 'error');
    } finally {
      setIsScanningKey(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Control Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 mr-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#0B5D3B] dark:text-emerald-400 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                উত্তরপত্র (Answer Key)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                সেট করা হয়েছে:{' '}
                <strong
                  className={
                    filledCount === session.questionCount
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }
                >
                  {filledCount} / {session.questionCount}
                </strong>
              </p>
            </div>
          </div>

          {session.setCount === 4 && (
            <div className="inline-flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
              {validSets.map((sc) => {
                const cnt = (session.answerKeys[sc] || []).filter((v) => v !== null).length;
                const active = currentSetCode === sc;
                return (
                  <button
                    key={sc}
                    type="button"
                    onClick={() => setActiveSet(sc)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      active
                        ? 'bg-[#0B5D3B] text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span>সেট {sc}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        active
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {cnt}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Scoring Rules & Scan-a-Key */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-semibold">সঠিক:</span>
            <select
              value={session.markPerCorrect}
              onChange={(e) => onUpdateScoringRules({ markPerCorrect: Number(e.target.value) })}
              className="bg-transparent font-bold text-slate-900 dark:text-white focus:outline-none"
            >
              <option value={1}>+1</option>
              <option value={0.5}>+0.5</option>
              <option value={2}>+2</option>
            </select>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="text-slate-500 dark:text-slate-400 font-semibold">ভুল:</span>
            <select
              value={session.negativeMark}
              onChange={(e) => onUpdateScoringRules({ negativeMark: Number(e.target.value) })}
              className="bg-transparent font-bold text-slate-900 dark:text-white focus:outline-none"
            >
              <option value={0}>নেগেটিভ নেই (0)</option>
              <option value={0.25}>-0.25</option>
              <option value={0.5}>-0.50</option>
              <option value={1}>-1.0</option>
            </select>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleScanTeacherKeySheet}
            className="hidden"
          />
          <button
            type="button"
            disabled={isScanningKey}
            onClick={() => fileInputRef.current?.click()}
            className="h-9 px-3.5 rounded-xl bg-[#0B5D3B] hover:bg-[#094a2f] disabled:opacity-60 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
          >
            {isScanningKey ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            মাস্টার শিট স্ক্যান করে Key দিন
          </button>

          {session.setCount === 4 && currentSetCode !== validSets[0] && (
            <button
              type="button"
              onClick={handleCopyFromFirstSet}
              className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" /> সেট {validSets[0]} কপি
            </button>
          )}

          {filledCount > 0 && (
            <button
              type="button"
              onClick={handleClearCurrentSet}
              className="h-9 px-3 rounded-xl border border-rose-200 dark:border-rose-900/60 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 inline-flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" /> ক্লিয়ার
            </button>
          )}
        </div>
      </div>

      {/* Fast Interactive Bubble Matrix */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-3 text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            প্রতিটি প্রশ্নের সঠিক বৃত্তে ক্লিক করুন — সাথে সাথেই অটো-সেভ ও পূর্বের স্ক্যান পুনর্মূল্যায়ন হবে।
          </span>
          {filledCount === session.questionCount && (
            <span className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" /> উত্তরপত্র সম্পূর্ণ প্রস্তুত
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {currentAnswers.map((selectedOpt, qIdx) => {
            const qNum = qIdx + 1;
            const qLabel = isBn ? toBanglaDigits(qNum) : String(qNum);
            return (
              <div
                key={qNum}
                className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl border transition-colors ${
                  selectedOpt !== null
                    ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/35 dark:bg-emerald-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/30'
                }`}
              >
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 w-7 shrink-0">
                  {qLabel}.
                </span>
                <div className="flex items-center gap-1.5">
                  {optionLabels.map((lbl, optIdx) => {
                    const active = selectedOpt === optIdx;
                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => handleSelectOption(qIdx, optIdx)}
                        className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center border transition-all ${
                          active
                            ? 'bg-[#0B5D3B] text-white border-[#0B5D3B] shadow-2xs scale-105'
                            : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#0B5D3B] hover:text-[#0B5D3B]'
                        }`}
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
  );
}
