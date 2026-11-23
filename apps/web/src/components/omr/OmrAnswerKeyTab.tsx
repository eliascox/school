'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyRound,
  CheckCircle2,
  Copy,
  Trash2,
  Upload,
  Loader2,
  Lock,
  Unlock,
  Search,
  Printer,
  ClipboardPaste,
  FileSpreadsheet,
  Download,
  FolderUp,
  Layers,
  Keyboard,
  AlertCircle,
  Check,
  X,
  StickyNote,
} from 'lucide-react';
import {
  OMR_MAX_QUESTIONS,
  OMR_MIN_QUESTIONS,
  OMR_OPTION_LABELS,
  OMR_QUICK_QUESTION_CHIPS,
  OmrOptionStyle,
  clampOmrQuestionCount,
  toAsciiDigits,
  toBanglaDigits,
} from '@/lib/omr/omrTemplates';
import {
  buildAnswerKeyExcelRows,
  computeAnswerKeyStats,
  formatAnswerKeyAsCopyText,
  getVerticalAnswerColumns,
  mapTokenToOptionIndex,
  mergeParsedAnswerKey,
  parseBulkAnswerKeyText,
} from '@/lib/omr/omrAnswerKeyUtils';
import {
  OMR_GRADE_LABELS_BN,
  OmrExamSession,
  getSessionSetCodes,
  getSiblingScopesForSession,
  normalizeGroupToBn,
  normalizeSubjectCode3Digit,
  omrService,
} from '@/services/omrService';
import type { SchoolSettings } from '@/services/settingsService';
import { decodeOmrImageBuffer } from '@/lib/omr/omrVisionEngine';
import { loadImageFileToRgbaBuffer } from '@/lib/omr/omrPdfBatchLoader';
import { showToast } from '@/components/ui/ToastProvider';

const GRADES_LIST: Array<{ id: string; shortBn: string; labelBn: string }> = [
  { id: '6th', shortBn: '৬ষ্ঠ', labelBn: '৬ষ্ঠ শ্রেণি' },
  { id: '7th', shortBn: '৭ম', labelBn: '৭ম শ্রেণি' },
  { id: '8th', shortBn: '৮ম', labelBn: '৮ম শ্রেণি' },
  { id: '9th', shortBn: '৯ম', labelBn: '৯ম শ্রেণি' },
  { id: '10th', shortBn: '১০ম', labelBn: '১০ম শ্রেণি' },
];

const SECTIONS_6_8 = ['A', 'B', 'C'];
const GROUPS_9_10: Array<{
  code: 'science' | 'humanities' | 'commerce';
  branch: string;
  labelBn: string;
}> = [
  { code: 'science', branch: 'Science', labelBn: 'বিজ্ঞান' },
  { code: 'humanities', branch: 'Humanities', labelBn: 'মানবিক' },
  { code: 'commerce', branch: 'Commerce', labelBn: 'ব্যবসায় শিক্ষা' },
];

export interface OmrAnswerKeySubjectItem {
  code: string;
  name: string;
  mcqMax: number;
  category?: string;
  group?: string;
}

export interface OmrAnswerKeyTabProps {
  session: OmrExamSession;
  allSessions: OmrExamSession[];
  availableSubjects: OmrAnswerKeySubjectItem[];
  schoolSettings: SchoolSettings | null;
  classLabelBn: string;
  userDisplayName: string;
  selectedExamTitle: string;
  selectedGrade: string;
  selectedBranch: string;
  selectedGroup: 'science' | 'humanities' | 'commerce';
  onChangeContext: (next: {
    grade?: string;
    branch?: string;
    group?: 'science' | 'humanities' | 'commerce';
    subjectName?: string;
  }) => void;
  onSaveAnswerKey: (setCode: string, answers: Array<number | null>) => void;
  onUpdateConfig: (
    updates: Partial<
      Pick<
        OmrExamSession,
        'questionCount' | 'setCount' | 'optionStyle' | 'markPerCorrect' | 'negativeMark'
      >
    >,
  ) => void;
  onSessionsMutated: () => void;
}

type ReadinessFilter = 'all' | 'complete' | 'pending';

export default function OmrAnswerKeyTab({
  session,
  allSessions,
  availableSubjects,
  schoolSettings,
  classLabelBn,
  userDisplayName,
  selectedExamTitle,
  selectedGrade,
  selectedBranch,
  selectedGroup,
  onChangeContext,
  onSaveAnswerKey,
  onUpdateConfig,
  onSessionsMutated,
}: OmrAnswerKeyTabProps) {
  const validSets = useMemo(() => getSessionSetCodes(session), [session]);
  const [activeSet, setActiveSet] = useState<string>(validSets[0] || 'default');
  const [isScanningKey, setIsScanningKey] = useState(false);

  // Left-pane directory filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReadinessFilter>('all');

  // Per-subject inline question count input
  const [questionInput, setQuestionInput] = useState<string>(String(session.questionCount));

  // Optional note editor
  const [noteDraft, setNoteDraft] = useState<string>(session.keyNote || '');
  const [editingNote, setEditingNote] = useState(false);

  // Bulk text input drawer
  const [bulkDrawerOpen, setBulkDrawerOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');

  // Keyboard rapid-entry focus state
  const [focusedQIdx, setFocusedQIdx] = useState<number | null>(null);
  const rowRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const masterScanInputRef = useRef<HTMLInputElement | null>(null);
  const jsonImportInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setQuestionInput(String(session.questionCount));
  }, [session.questionCount, session.id]);

  useEffect(() => {
    setNoteDraft(session.keyNote || '');
    setEditingNote(false);
    setFocusedQIdx(null);
  }, [session.id, session.keyNote]);

  const currentSetCode = validSets.includes(activeSet) ? activeSet : validSets[0];
  const optionLabels = OMR_OPTION_LABELS[session.optionStyle];
  const isBn = session.optionStyle === 'bn';
  const isLocked = Boolean(session.isKeyLocked);
  const isClass9or10 = selectedGrade === '9th' || selectedGrade === '10th';
  const activeGroupBn = normalizeGroupToBn(selectedGrade, selectedGroup, selectedBranch);
  const normalizedSubCode = normalizeSubjectCode3Digit(session.subjectCode) || session.subjectCode;

  const currentAnswers: Array<number | null> = useMemo(() => {
    const arr = session.answerKeys[currentSetCode] || [];
    return Array.from({ length: session.questionCount }, (_, i) =>
      arr[i] !== undefined ? arr[i] : null,
    );
  }, [session.answerKeys, currentSetCode, session.questionCount]);

  const stats = useMemo(
    () => computeAnswerKeyStats(currentAnswers, session.questionCount),
    [currentAnswers, session.questionCount],
  );

  const verticalColumns = useMemo(
    () => getVerticalAnswerColumns(session.questionCount),
    [session.questionCount],
  );

  const parsedBulk = useMemo(
    () => parseBulkAnswerKeyText(bulkText, session.questionCount),
    [bulkText, session.questionCount],
  );

  const siblingScopes = useMemo(
    () => getSiblingScopesForSession(session),
    [session],
  );

  // Subject Readiness Directory (read-only over allSubjects of active Class + Branch/Group)
  const readinessList = useMemo(
    () =>
      omrService.getSubjectKeyReadinessList({
        examTitle: selectedExamTitle,
        grade: selectedGrade,
        branch: selectedBranch,
        group: activeGroupBn,
        subjects: availableSubjects,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedExamTitle, selectedGrade, selectedBranch, activeGroupBn, availableSubjects, allSessions],
  );

  const readinessSummary = useMemo(() => {
    const total = readinessList.length;
    const complete = readinessList.filter((r) => r.status === 'complete').length;
    const partial = readinessList.filter((r) => r.status === 'partial').length;
    const empty = total - complete - partial;
    const pct = total > 0 ? Math.round((complete / total) * 100) : 0;
    return { total, complete, partial, empty, pct };
  }, [readinessList]);

  const filteredReadiness = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const qAscii = toAsciiDigits(q);
    return readinessList.filter((item) => {
      if (statusFilter === 'complete' && item.status !== 'complete') return false;
      if (statusFilter === 'pending' && item.status === 'complete') return false;
      if (!q) return true;
      const nameHit = item.subjectName.toLowerCase().includes(q);
      const codeHit =
        item.subjectCode.toLowerCase().includes(q) ||
        normalizeSubjectCode3Digit(item.subjectCode).includes(qAscii);
      return nameHit || codeHit;
    });
  }, [readinessList, searchQuery, statusFilter]);

  // First non-empty donor set for 1-click Copy Set
  const copyDonorSet = useMemo(() => {
    if (session.setCount !== 4) return null;
    for (const sc of validSets) {
      if (sc === currentSetCode) continue;
      const arr = session.answerKeys[sc] || [];
      if (arr.some((v) => v === 0 || v === 1 || v === 2 || v === 3)) {
        return sc;
      }
    }
    return null;
  }, [session.setCount, session.answerKeys, validSets, currentSetCode]);

  const fullMarks = Number((session.questionCount * (session.markPerCorrect || 1)).toFixed(2));
  const passCutoff = Math.round(fullMarks * 0.33);

  // Keyboard Rapid Entry Handler
  useEffect(() => {
    if (focusedQIdx === null || isLocked || bulkDrawerOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const activeEl = document.activeElement as HTMLElement | null;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT' ||
          activeEl.isContentEditable)
      ) {
        return;
      }

      if (e.key === 'Escape') {
        setFocusedQIdx(null);
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        const nextIdx = Math.min(session.questionCount - 1, focusedQIdx + 1);
        setFocusedQIdx(nextIdx);
        rowRefs.current[nextIdx]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        return;
      }
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const prevIdx = Math.max(0, focusedQIdx - 1);
        setFocusedQIdx(prevIdx);
        rowRefs.current[prevIdx]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        return;
      }
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        const next = [...currentAnswers];
        next[focusedQIdx] = null;
        onSaveAnswerKey(currentSetCode, next);
        return;
      }

      const mapped = mapTokenToOptionIndex(e.key);
      if (mapped !== null) {
        e.preventDefault();
        const next = [...currentAnswers];
        next[focusedQIdx] = mapped;
        onSaveAnswerKey(currentSetCode, next);
        if (focusedQIdx + 1 < session.questionCount) {
          const nextIdx = focusedQIdx + 1;
          setFocusedQIdx(nextIdx);
          rowRefs.current[nextIdx]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        } else {
          setFocusedQIdx(null);
          showToast('সকল প্রশ্নের উত্তর এন্ট্রি সম্পন্ন হয়েছে!', 'success');
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    focusedQIdx,
    isLocked,
    bulkDrawerOpen,
    session.questionCount,
    currentAnswers,
    currentSetCode,
    onSaveAnswerKey,
  ]);

  const commitQuestionCount = (rawVal: string | number) => {
    if (isLocked) {
      showToast('প্রশ্ন সংখ্যা পরিবর্তনের আগে উত্তরপত্র আনলক করুন।', 'info');
      setQuestionInput(String(session.questionCount));
      return;
    }
    const clamped = clampOmrQuestionCount(rawVal, session.questionCount);
    setQuestionInput(String(clamped));
    if (clamped !== session.questionCount) {
      onUpdateConfig({ questionCount: clamped });
      showToast(`প্রশ্ন সংখ্যা ${toBanglaDigits(clamped)}টিতে আপডেট হয়েছে।`, 'success');
    }
  };

  const handleSelectOption = (qIdx: number, optIdx: number) => {
    if (isLocked) {
      showToast('উত্তরপত্র লক করা আছে — পরিবর্তনের জন্য উপরে "আনলক" করুন।', 'info');
      return;
    }
    const next = [...currentAnswers];
    next[qIdx] = next[qIdx] === optIdx ? null : optIdx;
    onSaveAnswerKey(currentSetCode, next);
    setFocusedQIdx(qIdx);
  };

  const handleToggleLock = () => {
    const nextLocked = !isLocked;
    omrService.setAnswerKeyLock(session.id, nextLocked, userDisplayName);
    onSessionsMutated();
    showToast(
      nextLocked
        ? 'উত্তরপত্র নিরাপদভাবে লক করা হয়েছে — দুর্ঘটনাবশত পরিবর্তন হবে না।'
        : 'উত্তরপত্র আনলক করা হয়েছে — এখন সম্পাদনা করতে পারবেন।',
      nextLocked ? 'success' : 'info',
    );
  };

  const handleSaveNote = () => {
    omrService.updateSessionKeyMeta(session.id, {
      keyNote: noteDraft.trim(),
      keyUpdatedBy: userDisplayName,
    });
    setEditingNote(false);
    onSessionsMutated();
    showToast('উত্তরপত্রের নোট সংরক্ষিত হয়েছে।', 'success');
  };

  const handleApplyBulk = (strategy: 'replace' | 'fill_missing') => {
    if (isLocked) {
      showToast('উত্তরপত্র লক করা আছে — আগে আনলক করুন।', 'info');
      return;
    }
    if (parsedBulk.parsedCount === 0 && parsedBulk.providedIndices.length === 0) {
      showToast('কোনো বৈধ উত্তর শনাক্ত হয়নি। যেমন: ক খ গ ঘ... বা A B C D...', 'error');
      return;
    }
    const merged = mergeParsedAnswerKey(
      currentAnswers,
      parsedBulk,
      session.questionCount,
      strategy,
    );
    onSaveAnswerKey(currentSetCode, merged);
    setBulkDrawerOpen(false);
    setBulkText('');
    showToast(
      `সেট "${currentSetCode === 'default' ? 'মূল' : currentSetCode}"-এ ${toBanglaDigits(parsedBulk.parsedCount)}টি উত্তর সফলভাবে যুক্ত হয়েছে!`,
      'success',
    );
  };

  const handleCopyFromDonorSet = () => {
    if (isLocked) {
      showToast('উত্তরপত্র লক করা আছে — আগে আনলক করুন।', 'info');
      return;
    }
    if (!copyDonorSet) {
      showToast('কপি করার মতো অন্য কোনো পূরণকৃত সেট পাওয়া যায়নি।', 'error');
      return;
    }
    const donorArr = session.answerKeys[copyDonorSet] || [];
    onSaveAnswerKey(currentSetCode, [...donorArr]);
    showToast(`সেট "${copyDonorSet}" থেকে উত্তরপত্র কপি হয়েছে।`, 'success');
  };

  const handleClearCurrentSet = () => {
    if (isLocked) {
      showToast('উত্তরপত্র লক করা আছে — আগে আনলক করুন।', 'info');
      return;
    }
    onSaveAnswerKey(
      currentSetCode,
      Array.from({ length: session.questionCount }, () => null),
    );
    showToast('এই সেটের উত্তরপত্র খালি করা হয়েছে।', 'info');
  };

  const handleCopyKeyAsText = async () => {
    const text = formatAnswerKeyAsCopyText(currentAnswers, session.optionStyle, 'numbered');
    const header = `${session.subjectName} (${normalizedSubCode}) - ${classLabelBn} - সেট ${currentSetCode === 'default' ? 'মূল' : currentSetCode}\n`;
    try {
      await navigator.clipboard.writeText(`${header}${text}`);
      showToast('উত্তরপত্র ক্লিপবোর্ডে কপি হয়েছে।', 'success');
    } catch {
      showToast('ক্লিপবোর্ডে কপি করা যায়নি।', 'error');
    }
  };

  const handleApplyToSiblings = () => {
    if (stats.filled === 0) {
      showToast('অন্য শাখা/বিভাগে প্রয়োগের আগে অন্তত একটি উত্তর সেট করুন।', 'error');
      return;
    }
    const res = omrService.applyAnswerKeyToSiblingScopes(session.id, {
      updatedBy: userDisplayName,
    });
    if (res.updatedCount === 0) {
      showToast('প্রয়োগ করার মতো কোনো সমগোত্রীয় শাখা/বিভাগ পাওয়া যায়নি।', 'info');
      return;
    }
    onSessionsMutated();
    showToast(
      `"${session.subjectName}"-এর উত্তরপত্র ${res.targetLabelsBn.join(', ')}-এ সফলভাবে কপি ও সিংক হয়েছে!`,
      'success',
    );
  };

  const handleJumpToFirstMissing = () => {
    if (stats.missingQuestionNumbers.length === 0) return;
    const idx = stats.missingQuestionNumbers[0] - 1;
    setFocusedQIdx(idx);
    rowRefs.current[idx]?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  };

  const handleScanTeacherKeySheet = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (isLocked) {
      showToast('উত্তরপত্র লক করা আছে — মাস্টার শিট স্ক্যানের আগে আনলক করুন।', 'info');
      return;
    }

    setIsScanningKey(true);
    try {
      const page = await loadImageFileToRgbaBuffer(file);
      const decoded = decodeOmrImageBuffer(page.buffer, {
        templateId: session.templateId,
        questionCount: session.questionCount,
        paperFormat: session.paperFormat,
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
        `সেট "${targetSet === 'default' ? 'মূল' : targetSet}"-এর ${toBanglaDigits(detectedCount)}/${toBanglaDigits(session.questionCount)}টি উত্তর স্বয়ংক্রিয়ভাবে সেট হয়েছে!`,
        'success',
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'উত্তরপত্র স্ক্যানে সমস্যা হয়েছে।', 'error');
    } finally {
      setIsScanningKey(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      const scopeLabel = isClass9or10 ? activeGroupBn : `শাখা ${selectedBranch}`;
      const rowsInput: Parameters<typeof buildAnswerKeyExcelRows>[0] = [];

      const sessionsById = new Map(allSessions.map((s) => [s.id, s]));
      for (const item of readinessList) {
        if (!item.sessionId || item.status === 'empty') continue;
        const sess = sessionsById.get(item.sessionId);
        if (!sess) continue;
        const sets = getSessionSetCodes(sess);
        for (const sc of sets) {
          const arr = sess.answerKeys[sc] || [];
          if (!arr.some((v) => v !== null)) continue;
          rowsInput.push({
            examTitle: sess.examTitle,
            gradeLabel: OMR_GRADE_LABELS_BN[sess.grade] || sess.grade,
            scopeLabel,
            subjectCode: normalizeSubjectCode3Digit(sess.subjectCode) || sess.subjectCode,
            subjectName: sess.subjectName,
            questionCount: sess.questionCount,
            optionStyle: sess.optionStyle,
            markPerCorrect: sess.markPerCorrect,
            negativeMark: sess.negativeMark,
            setCode: sc,
            answers: arr,
          });
        }
      }

      if (rowsInput.length === 0) {
        showToast('এক্সপোর্ট করার মতো কোনো পূরণকৃত উত্তরপত্র এই শ্রেণিতে নেই।', 'info');
        return;
      }

      const sheetRows = buildAnswerKeyExcelRows(rowsInput);
      const ws = XLSX.utils.json_to_sheet(sheetRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'AnswerKeys');
      XLSX.writeFile(wb, `OMR_AnswerKeys_${selectedGrade}_${selectedBranch}.xlsx`);
      showToast(`${toBanglaDigits(rowsInput.length)}টি উত্তরপত্র সেট Excel ফাইলে ডাউনলোড হয়েছে।`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Excel এক্সপোর্ট ব্যর্থ হয়েছে।', 'error');
    }
  };

  const handleExportJsonBackup = () => {
    const bundle = omrService.exportAnswerKeysBundle({ examTitle: selectedExamTitle });
    if (bundle.entries.length === 0) {
      showToast('এই পরীক্ষায় ব্যাকআপ নেওয়ার মতো কোনো পূরণকৃত উত্তরপত্র নেই।', 'info');
      return;
    }
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OMR_AnswerKeys_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`${toBanglaDigits(bundle.entries.length)}টি বিষয়ের উত্তরপত্র JSON ব্যাকআপ ডাউনলোড হয়েছে।`, 'success');
  };

  const handleImportJsonBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const result = omrService.importAnswerKeysBundle(parsed, userDisplayName);
      onSessionsMutated();
      showToast(
        `ইমপোর্ট সম্পন্ন: নতুন ${toBanglaDigits(result.importedCount)}টি, আপডেট ${toBanglaDigits(result.updatedCount)}টি উত্তরপত্র রিস্টোর হয়েছে!`,
        'success',
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'JSON ফাইলটি সঠিক নয়।', 'error');
    }
  };

  // Print table block split (2 balanced side-by-side blocks so 30 questions fit cleanly on 1 A4 page)
  const printBlockSplit = Math.ceil(session.questionCount / 2);

  return (
    <div className="space-y-4">
      <style>{`@media print { @page { size: A4 portrait; margin: 12mm; } }`}</style>

      {/* ─── INTERACTIVE 2-PANE ANSWER KEY STUDIO (SCREEN ONLY) ─── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start print:hidden">
        {/* ══ LEFT PANE: SUBJECT-WISE ANSWER KEY DIRECTORY ══ */}
        <aside className="xl:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs overflow-hidden flex flex-col">
          {/* Directory Header & Class/Group Switcher */}
          <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#0B5D3B] dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    বিষয়ভিত্তিক উত্তরপত্র তালিকা
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {selectedExamTitle}
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-[#0B5D3B] dark:text-emerald-300 shrink-0">
                {toBanglaDigits(readinessSummary.complete)}/{toBanglaDigits(readinessSummary.total)} প্রস্তুত
              </span>
            </div>

            {/* Class Quick Pills (6th–10th) */}
            <div className="grid grid-cols-5 gap-1 bg-slate-100/90 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800">
              {GRADES_LIST.map((g) => {
                const active = selectedGrade === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => onChangeContext({ grade: g.id })}
                    className={`h-7 rounded-lg text-[11px] font-bold transition-all ${
                      active
                        ? 'bg-[#0B5D3B] text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {g.shortBn}
                  </button>
                );
              })}
            </div>

            {/* Group / Section Quick Pills */}
            <div className="grid grid-cols-3 gap-1">
              {isClass9or10
                ? GROUPS_9_10.map((grp) => {
                    const active = selectedGroup === grp.code;
                    return (
                      <button
                        key={grp.code}
                        type="button"
                        onClick={() =>
                          onChangeContext({ group: grp.code, branch: grp.branch })
                        }
                        className={`h-7 px-2 rounded-lg text-[11px] font-bold border transition-all truncate ${
                          active
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 border-[#0B5D3B] text-[#0B5D3B] dark:text-emerald-300'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        {grp.labelBn}
                      </button>
                    );
                  })
                : SECTIONS_6_8.map((sec) => {
                    const active = selectedBranch === sec;
                    return (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => onChangeContext({ branch: sec })}
                        className={`h-7 px-2 rounded-lg text-[11px] font-bold border transition-all ${
                          active
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 border-[#0B5D3B] text-[#0B5D3B] dark:text-emerald-300'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        শাখা {sec}
                      </button>
                    );
                  })}
            </div>

            {/* Readiness Progress Bar */}
            <div className="space-y-1">
              <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#0B5D3B] dark:bg-emerald-500 transition-all duration-300"
                  style={{ width: `${readinessSummary.pct}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                <span>সম্পূর্ণ: {toBanglaDigits(readinessSummary.complete)}</span>
                <span>আংশিক: {toBanglaDigits(readinessSummary.partial)}</span>
                <span>বাকি: {toBanglaDigits(readinessSummary.empty)}</span>
              </div>
            </div>

            {/* Search & Status Filter */}
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="বিষয় বা কোড (১০৯)..."
                  className="w-full h-8 pl-8 pr-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#0B5D3B]"
                />
              </div>
              <div className="inline-flex bg-slate-100 dark:bg-slate-950 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 shrink-0">
                {(
                  [
                    { id: 'all', label: 'সকল' },
                    { id: 'complete', label: 'প্রস্তুত' },
                    { id: 'pending', label: 'বাকি' },
                  ] as Array<{ id: ReadinessFilter; label: string }>
                ).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setStatusFilter(f.id)}
                    className={`px-2 py-1 rounded-md text-[10px] font-bold transition-colors ${
                      statusFilter === f.id
                        ? 'bg-white dark:bg-slate-800 text-[#0B5D3B] dark:text-emerald-300 shadow-2xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Scrollable Subject Cards */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 max-h-[540px] overflow-y-auto">
            {filteredReadiness.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                {availableSubjects.length === 0
                  ? 'এই শ্রেণিতে আপনার কোনো বিষয় বরাদ্দ নেই।'
                  : 'এই ফিল্টারে কোনো বিষয় পাওয়া যায়নি।'}
              </div>
            ) : (
              filteredReadiness.map((item) => {
                const isSelected =
                  item.subjectName === session.subjectName ||
                  (item.sessionId !== null && item.sessionId === session.id);
                const code3 = normalizeSubjectCode3Digit(item.subjectCode) || item.subjectCode;

                return (
                  <button
                    key={`${item.subjectCode}-${item.subjectName}`}
                    type="button"
                    onClick={() => onChangeContext({ subjectName: item.subjectName })}
                    className={`w-full text-left px-3.5 py-2.5 transition-colors flex items-start justify-between gap-2 border-l-3 ${
                      isSelected
                        ? 'border-l-[#0B5D3B] bg-emerald-50/55 dark:bg-emerald-950/30'
                        : 'border-l-transparent hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.2 rounded-md text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 tabular-nums shrink-0">
                          {code3}
                        </span>
                        <span
                          className={`text-xs font-bold truncate ${
                            isSelected
                              ? 'text-[#0B5D3B] dark:text-emerald-300'
                              : 'text-slate-800 dark:text-slate-100'
                          }`}
                        >
                          {item.subjectName}
                        </span>
                        {item.isKeyLocked && (
                          <Lock className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                          {toBanglaDigits(item.questionCount)} প্রশ্ন
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">·</span>
                        <div className="flex items-center gap-1">
                          {item.setSummaries.map((st) => {
                            const shortLbl = st.setCode === 'default' ? 'মূল' : st.setCode;
                            return (
                              <span
                                key={st.setCode}
                                title={`সেট ${shortLbl}: ${st.filled}/${st.total}`}
                                className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                  st.isComplete
                                    ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                                    : st.filled > 0
                                      ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                                }`}
                              >
                                {shortLbl}
                                {st.isComplete ? '✓' : st.filled > 0 ? ` ${toBanglaDigits(st.filled)}` : ''}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {item.status === 'complete' ? (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                          <CheckCircle2 className="w-3 h-3" /> প্রস্তুত
                        </span>
                      ) : item.status === 'partial' ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300">
                          আংশিক
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                          খালি
                        </span>
                      )}
                      {item.scannedCount > 0 && (
                        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                          স্ক্যান: {toBanglaDigits(item.scannedCount)}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Directory Footer: Excel & JSON Backup/Restore */}
          <div className="p-2.5 bg-slate-50/90 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-1.5">
            <button
              type="button"
              onClick={handleExportExcel}
              className="flex-1 h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-200 inline-flex items-center justify-center gap-1"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Excel
            </button>
            <button
              type="button"
              onClick={handleExportJsonBackup}
              className="flex-1 h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-200 inline-flex items-center justify-center gap-1"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              ব্যাকআপ
            </button>
            <input
              ref={jsonImportInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleImportJsonBackup}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => jsonImportInputRef.current?.click()}
              className="flex-1 h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-200 inline-flex items-center justify-center gap-1"
            >
              <FolderUp className="w-3.5 h-3.5 text-slate-500" />
              ইমপোর্ট
            </button>
          </div>
        </aside>

        {/* ══ RIGHT PANE: ACTIVE SUBJECT ANSWER KEY WORKBENCH ══ */}
        <section className="xl:col-span-8 space-y-3.5">
          {/* 1. Active Subject Header & Per-Subject Inline Config Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-3.5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded-lg text-xs font-extrabold bg-emerald-50 dark:bg-emerald-950/70 text-[#0B5D3B] dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60 tabular-nums">
                    কোড {normalizedSubCode}
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white truncate">
                    {session.subjectName}
                  </h3>
                  {stats.isComplete ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5" /> সেট প্রস্তুত
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                      {toBanglaDigits(stats.filled)} / {toBanglaDigits(stats.total)} সেট করা হয়েছে
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {classLabelBn} · {isClass9or10 ? session.group : `শাখা ${session.branch}`} · পূর্ণমান{' '}
                  <strong className="text-slate-700 dark:text-slate-200">{toBanglaDigits(fullMarks)}</strong> · পাস (৩৩%){' '}
                  <strong className="text-slate-700 dark:text-slate-200">{toBanglaDigits(passCutoff)}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingNote((v) => !v)}
                  className={`h-8 px-2.5 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
                    session.keyNote
                      ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/40 text-[#0B5D3B] dark:text-emerald-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <StickyNote className="w-3.5 h-3.5" />
                  {session.keyNote ? 'নোট দেখুন' : 'নোট'}
                </button>

                <button
                  type="button"
                  onClick={handleToggleLock}
                  className={`h-8 px-3 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 border transition-colors ${
                    isLocked
                      ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 hover:bg-amber-100'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-[#0B5D3B]'
                  }`}
                >
                  {isLocked ? (
                    <>
                      <Unlock className="w-3.5 h-3.5" /> লক করা (আনলক)
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" /> উত্তরপত্র লক
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Optional Teacher Key Note Bar */}
            {(editingNote || session.keyNote) && (
              <div className="flex flex-wrap items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs">
                <StickyNote className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {editingNote ? (
                  <>
                    <input
                      type="text"
                      value={noteDraft}
                      onChange={(e) => setNoteDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveNote();
                      }}
                      placeholder="যেমন: বোর্ড মডেল প্রশ্নপত্র ২০২৬ / প্রশ্ন ১৪ সংশোধিত..."
                      className="flex-1 min-w-[200px] bg-transparent text-slate-800 dark:text-slate-100 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleSaveNote}
                      className="h-7 px-2.5 rounded-lg bg-[#0B5D3B] text-white font-bold inline-flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" /> সংরক্ষণ
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNoteDraft(session.keyNote || '');
                        setEditingNote(false);
                      }}
                      className="h-7 px-2 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <div className="flex items-center justify-between flex-1 gap-2">
                    <span className="text-slate-600 dark:text-slate-300 font-medium">
                      {session.keyNote}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingNote(true)}
                      className="text-[11px] font-bold text-[#0B5D3B] dark:text-emerald-400 hover:underline shrink-0"
                    >
                      সম্পাদনা
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Inline Per-Subject Configuration Row */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2.5 text-xs">
              {/* Dynamic Custom Question Count + Quick Chips */}
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">প্রশ্ন:</span>
                <input
                  type="text"
                  inputMode="numeric"
                  disabled={isLocked}
                  value={questionInput}
                  onChange={(e) => setQuestionInput(e.target.value)}
                  onBlur={() => commitQuestionCount(questionInput)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      commitQuestionCount(questionInput);
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                  aria-label="প্রশ্ন সংখ্যা"
                  title={`${OMR_MIN_QUESTIONS} থেকে ${OMR_MAX_QUESTIONS} এর মধ্যে যেকোনো সংখ্যা`}
                  className="w-11 h-6 text-center rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-extrabold text-slate-900 dark:text-white focus:outline-none focus:border-[#0B5D3B] disabled:opacity-50"
                />
                <div className="flex items-center gap-1">
                  {OMR_QUICK_QUESTION_CHIPS.map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      disabled={isLocked}
                      onClick={() => commitQuestionCount(cnt)}
                      className={`h-6 px-2 rounded-md text-[11px] font-bold transition-colors disabled:opacity-50 ${
                        session.questionCount === cnt
                          ? 'bg-[#0B5D3B] text-white'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-[#0B5D3B]'
                      }`}
                    >
                      {toBanglaDigits(cnt)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Set Mode (1 vs 4) */}
              <div className="inline-flex bg-slate-100 dark:bg-slate-950 p-0.5 rounded-xl border border-slate-200 dark:border-slate-800">
                {([1, 4] as const).map((sc) => (
                  <button
                    key={sc}
                    type="button"
                    disabled={isLocked}
                    onClick={() => onUpdateConfig({ setCount: sc })}
                    className={`h-7 px-2.5 rounded-lg text-[11px] font-bold transition-colors disabled:opacity-50 ${
                      session.setCount === sc
                        ? 'bg-white dark:bg-slate-800 text-[#0B5D3B] dark:text-emerald-300 shadow-2xs'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {sc === 1 ? '১ সেট' : '৪ সেট'}
                  </button>
                ))}
              </div>

              {/* Option Language (ক-ঘ vs A-D) */}
              <div className="inline-flex bg-slate-100 dark:bg-slate-950 p-0.5 rounded-xl border border-slate-200 dark:border-slate-800">
                {(
                  [
                    { id: 'bn', label: 'ক খ গ ঘ' },
                    { id: 'en', label: 'A B C D' },
                  ] as Array<{ id: OmrOptionStyle; label: string }>
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={isLocked}
                    onClick={() => onUpdateConfig({ optionStyle: opt.id })}
                    className={`h-7 px-2.5 rounded-lg text-[11px] font-bold transition-colors disabled:opacity-50 ${
                      session.optionStyle === opt.id
                        ? 'bg-white dark:bg-slate-800 text-[#0B5D3B] dark:text-emerald-300 shadow-2xs'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Scoring Rules */}
              <div className="flex items-center gap-1.5 px-2.5 h-8 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">সঠিক:</span>
                <select
                  disabled={isLocked}
                  value={session.markPerCorrect}
                  onChange={(e) => onUpdateConfig({ markPerCorrect: Number(e.target.value) })}
                  className="bg-transparent font-bold text-slate-900 dark:text-white focus:outline-none disabled:opacity-50"
                >
                  <option value={1}>+1</option>
                  <option value={0.5}>+0.5</option>
                  <option value={2}>+2</option>
                </select>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">ভুল:</span>
                <select
                  disabled={isLocked}
                  value={session.negativeMark}
                  onChange={(e) => onUpdateConfig({ negativeMark: Number(e.target.value) })}
                  className="bg-transparent font-bold text-slate-900 dark:text-white focus:outline-none disabled:opacity-50"
                >
                  <option value={0}>0</option>
                  <option value={0.25}>-0.25</option>
                  <option value={0.5}>-0.50</option>
                  <option value={1}>-1.0</option>
                </select>
              </div>
            </div>
          </div>

          {/* 2. Set Switcher & Rapid Entry Toolbar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-2xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              {/* Set Tabs */}
              {session.setCount === 4 ? (
                <div className="inline-flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                  {validSets.map((sc) => {
                    const cnt = (session.answerKeys[sc] || []).filter((v) => v !== null).length;
                    const done = cnt === session.questionCount && session.questionCount > 0;
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
                              : done
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {done ? '✓' : toBanglaDigits(cnt)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/50 text-xs font-bold text-[#0B5D3B] dark:text-emerald-300">
                  মূল উত্তরপত্র · {toBanglaDigits(stats.filled)}/{toBanglaDigits(stats.total)}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  disabled={isLocked}
                  onClick={() => setBulkDrawerOpen((v) => !v)}
                  className={`h-8 px-3 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 border transition-colors disabled:opacity-50 ${
                    bulkDrawerOpen
                      ? 'bg-[#0B5D3B] text-white border-[#0B5D3B]'
                      : 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/40 text-[#0B5D3B] dark:text-emerald-300 hover:bg-emerald-100/70'
                  }`}
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  দ্রুত টেক্সট ইনপুট
                </button>

                <input
                  ref={masterScanInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleScanTeacherKeySheet}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={isScanningKey || isLocked}
                  onClick={() => masterScanInputRef.current?.click()}
                  className="h-8 px-3 rounded-xl bg-[#0B5D3B] hover:bg-[#094a2f] disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                >
                  {isScanningKey ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  মাস্টার শিট স্ক্যান
                </button>

                {copyDonorSet && (
                  <button
                    type="button"
                    disabled={isLocked}
                    onClick={handleCopyFromDonorSet}
                    className="h-8 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1 disabled:opacity-50"
                  >
                    <Copy className="w-3.5 h-3.5" /> সেট {copyDonorSet} কপি
                  </button>
                )}

                {siblingScopes.length > 0 && stats.filled > 0 && (
                  <button
                    type="button"
                    onClick={handleApplyToSiblings}
                    title={`একই উত্তরপত্র ${siblingScopes.map((s) => s.labelBn).join(' ও ')}-এ প্রয়োগ করুন`}
                    className="h-8 px-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900 text-xs font-bold text-[#0B5D3B] dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 inline-flex items-center gap-1"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    {isClass9or10
                      ? 'সকল বিভাগে প্রয়োগ'
                      : `শাখা ${siblingScopes.map((s) => s.branch).join(' ও ')}-এ প্রয়োগ`}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="h-8 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" /> প্রিন্ট (A4)
                </button>

                {stats.filled > 0 && (
                  <button
                    type="button"
                    onClick={handleCopyKeyAsText}
                    title="উত্তরপত্র টেক্সট আকারে কপি করুন"
                    className="h-8 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" /> টেক্সট
                  </button>
                )}

                {stats.filled > 0 && !isLocked && (
                  <button
                    type="button"
                    onClick={handleClearCurrentSet}
                    className="h-8 px-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> ক্লিয়ার
                  </button>
                )}
              </div>
            </div>

            {/* Smart Paste / Bulk Text Input Drawer */}
            {bulkDrawerOpen && !isLocked && (
              <div className="p-3.5 rounded-xl bg-emerald-50/45 dark:bg-emerald-950/25 border border-emerald-200/80 dark:border-emerald-900/60 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    একসাথে উত্তর পেস্ট বা টাইপ করুন (সেট {currentSetCode === 'default' ? 'মূল' : currentSetCode})
                  </div>
                  <span className="text-[11px] font-bold text-[#0B5D3B] dark:text-emerald-300">
                    শনাক্ত হয়েছে: {toBanglaDigits(parsedBulk.parsedCount)} / {toBanglaDigits(session.questionCount)}
                  </span>
                </div>

                <textarea
                  rows={3}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder="উদাহরণ: ক খ গ ঘ ক খ... অথবা কখগঘকখ... অথবা A B C D... অথবা 1:ক, 2:গ, 3:ঘ"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#0B5D3B]"
                />

                {parsedBulk.warnings.length > 0 && (
                  <div className="text-[11px] text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{parsedBulk.warnings[0]}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    খালি রাখতে চাইলে <code className="px-1 bg-white dark:bg-slate-800 rounded">-</code> লিখুন।
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleApplyBulk('fill_missing')}
                      className="h-8 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50"
                    >
                      শুধু খালিগুলো পূরণ
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyBulk('replace')}
                      className="h-8 px-3.5 rounded-lg bg-[#0B5D3B] hover:bg-[#094a2f] text-white text-xs font-bold"
                    >
                      প্রয়োগ করুন
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Option Distribution Telemetry & Missing Question Jump */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px]">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-semibold text-slate-500 dark:text-slate-400 mr-0.5">বণ্টন:</span>
                {optionLabels.map((lbl, idx) => (
                  <span
                    key={lbl}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold"
                  >
                    <span>{lbl}:</span>
                    <span className="text-[#0B5D3B] dark:text-emerald-400">
                      {toBanglaDigits(stats.optionCounts[idx])}
                    </span>
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2">
                {stats.missingCount > 0 ? (
                  <button
                    type="button"
                    onClick={handleJumpToFirstMissing}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-bold hover:bg-amber-100 transition-colors"
                  >
                    <AlertCircle className="w-3 h-3" />
                    বাকি {toBanglaDigits(stats.missingCount)}টি · প্রশ্ন #{toBanglaDigits(stats.missingQuestionNumbers[0])}-এ যান
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" /> এই সেট ১০০% প্রস্তুত
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 3. Board-Column Interactive & Keyboard-Navigable Bubble Matrix */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-3">
            {isLocked ? (
              <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
                <span className="inline-flex items-center gap-1.5 font-semibold">
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  এই উত্তরপত্রটি লক করা আছে। পরিবর্তনের জন্য উপরের &quot;আনলক&quot; বাটনে ক্লিক করুন।
                </span>
                <button
                  type="button"
                  onClick={handleToggleLock}
                  className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shrink-0"
                >
                  আনলক করুন
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <Keyboard className="w-3.5 h-3.5 text-[#0B5D3B] dark:text-emerald-400 shrink-0" />
                  যেকোনো প্রশ্নে ক্লিক করে কীবোর্ডে <strong className="text-slate-700 dark:text-slate-200">ক/খ/গ/ঘ</strong>,{' '}
                  <strong className="text-slate-700 dark:text-slate-200">A/B/C/D</strong> বা{' '}
                  <strong className="text-slate-700 dark:text-slate-200">1–4</strong> চাপলেই স্বয়ংক্রিয়ভাবে পরের প্রশ্নে যাবে।
                </span>
                {focusedQIdx !== null && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-[#0B5D3B] dark:text-emerald-300 font-bold">
                    কীবোর্ড সক্রিয়: প্রশ্ন #{toBanglaDigits(focusedQIdx + 1)}
                  </span>
                )}
              </div>
            )}

            {/* Vertical Sequential Board Columns */}
            <div
              className={`grid gap-3 ${
                verticalColumns.length === 2
                  ? 'grid-cols-1 md:grid-cols-2'
                  : verticalColumns.length === 3
                    ? 'grid-cols-1 md:grid-cols-3'
                    : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
              }`}
            >
              {verticalColumns.map((col) => {
                const indices: number[] = [];
                for (let idx = col.startIndex; idx <= col.endIndex; idx++) {
                  indices.push(idx);
                }
                return (
                  <div
                    key={col.colIndex}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50/35 dark:bg-slate-950/30"
                  >
                    {/* Column Header */}
                    <div className="grid grid-cols-[44px_1fr] items-center px-3 py-1.5 bg-slate-100/90 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[11px] font-extrabold text-slate-600 dark:text-slate-300">
                      <span>প্রশ্ন</span>
                      <div className="grid grid-cols-4 text-center">
                        {optionLabels.map((lbl) => (
                          <span key={lbl}>{lbl}</span>
                        ))}
                      </div>
                    </div>

                    {/* Rows */}
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
                      {indices.map((qIdx) => {
                        const qNum = qIdx + 1;
                        const qLabel = isBn ? toBanglaDigits(qNum) : String(qNum);
                        const selectedOpt = currentAnswers[qIdx];
                        const isFocused = focusedQIdx === qIdx;

                        return (
                          <div
                            key={qNum}
                            ref={(el) => {
                              rowRefs.current[qIdx] = el;
                            }}
                            onClick={() => {
                              if (!isLocked) setFocusedQIdx(qIdx);
                            }}
                            className={`grid grid-cols-[44px_1fr] items-center px-3 py-1.5 transition-colors cursor-pointer ${
                              isFocused
                                ? 'bg-emerald-50/90 dark:bg-emerald-950/50 ring-1 ring-inset ring-[#0B5D3B]/60'
                                : selectedOpt !== null
                                  ? 'bg-white dark:bg-slate-900/60'
                                  : 'bg-slate-50/40 dark:bg-slate-950/20 hover:bg-slate-100/60 dark:hover:bg-slate-900/50'
                            }`}
                          >
                            <span
                              className={`text-xs font-extrabold tabular-nums ${
                                isFocused
                                  ? 'text-[#0B5D3B] dark:text-emerald-300'
                                  : selectedOpt !== null
                                    ? 'text-slate-800 dark:text-slate-100'
                                    : 'text-slate-500 dark:text-slate-400'
                              }`}
                            >
                              {qLabel}.
                            </span>

                            <div className="grid grid-cols-4 place-items-center">
                              {optionLabels.map((lbl, optIdx) => {
                                const active = selectedOpt === optIdx;
                                return (
                                  <button
                                    key={optIdx}
                                    type="button"
                                    disabled={isLocked}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSelectOption(qIdx, optIdx);
                                    }}
                                    aria-label={`প্রশ্ন ${qNum} অপশন ${lbl}`}
                                    className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center border transition-all disabled:cursor-not-allowed ${
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
                );
              })}
            </div>
          </div>
        </section>
      </div>

      {/* ─── OFFICIAL A4 PRINTABLE ANSWER KEY SHEET (PRINT ONLY) ─── */}
      <div className="hidden print:block bg-white text-slate-900 p-2">
        {/* School Header */}
        <div className="flex items-center justify-center gap-3 pb-3 border-b-2 border-slate-800">
          {schoolSettings?.schoolLogo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={schoolSettings.schoolLogo}
              alt="School Logo"
              className="w-12 h-12 object-contain"
            />
          )}
          <div className="text-center">
            <h1 className="text-xl font-extrabold text-slate-900">
              {schoolSettings?.schoolName || 'শিক্ষা প্রতিষ্ঠান'}
            </h1>
            {(schoolSettings?.address || schoolSettings?.eiin) && (
              <p className="text-xs text-slate-600">
                {[schoolSettings?.address, schoolSettings?.eiin ? `EIIN: ${schoolSettings.eiin}` : '']
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            )}
            <div className="mt-1 inline-block px-3 py-0.5 rounded-full bg-slate-900 text-white text-xs font-bold">
              অফিশিয়াল OMR উত্তরপত্র (Answer Key)
            </div>
          </div>
        </div>

        {/* Metadata Strip */}
        <div className="grid grid-cols-3 gap-2 py-2.5 px-3 my-3 bg-slate-50 border border-slate-300 rounded-lg text-xs">
          <div>
            <span className="text-slate-500">পরীক্ষা:</span>{' '}
            <strong>{session.examTitle}</strong>
          </div>
          <div>
            <span className="text-slate-500">শ্রেণি ও শাখা/বিভাগ:</span>{' '}
            <strong>
              {classLabelBn} ({isClass9or10 ? session.group : `শাখা ${session.branch}`})
            </strong>
          </div>
          <div>
            <span className="text-slate-500">বিষয়:</span>{' '}
            <strong>
              {session.subjectName} ({normalizedSubCode})
            </strong>
          </div>
          <div>
            <span className="text-slate-500">মোট প্রশ্ন:</span>{' '}
            <strong>{toBanglaDigits(session.questionCount)}টি</strong>
          </div>
          <div>
            <span className="text-slate-500">নম্বর নিয়ম:</span>{' '}
            <strong>
              সঠিক +{session.markPerCorrect} · নেগেটিভ -{session.negativeMark} (পূর্ণমান {fullMarks})
            </strong>
          </div>
          <div>
            <span className="text-slate-500">প্রিন্ট তারিখ:</span>{' '}
            <strong>{new Date().toLocaleDateString('bn-BD')}</strong>
          </div>
        </div>

        {session.keyNote && (
          <div className="mb-3 px-3 py-1.5 border border-slate-300 rounded text-xs">
            <strong>বিশেষ নোট:</strong> {session.keyNote}
          </div>
        )}

        {/* Two Side-by-Side Tables Covering All Active Sets */}
        <div className="grid grid-cols-2 gap-4">
          {[0, 1].map((blockIdx) => {
            const start = blockIdx === 0 ? 0 : printBlockSplit;
            const end = blockIdx === 0 ? Math.min(printBlockSplit, session.questionCount) : session.questionCount;
            if (start >= end) return null;
            const rows: number[] = [];
            for (let i = start; i < end; i++) rows.push(i);

            return (
              <table key={blockIdx} className="w-full border-collapse border border-slate-400 text-xs">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-400 px-2 py-1 text-center w-12">প্রশ্ন</th>
                    {validSets.map((sc) => (
                      <th key={sc} className="border border-slate-400 px-2 py-1 text-center">
                        {sc === 'default' ? 'সঠিক উত্তর' : `সেট ${sc}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((qIdx) => (
                    <tr key={qIdx} className={qIdx % 2 === 1 ? 'bg-slate-50/70' : ''}>
                      <td className="border border-slate-300 px-2 py-1 text-center font-bold">
                        {isBn ? toBanglaDigits(qIdx + 1) : qIdx + 1}
                      </td>
                      {validSets.map((sc) => {
                        const ans = session.answerKeys[sc]?.[qIdx];
                        const display =
                          ans !== null && ans !== undefined && ans >= 0 && ans <= 3
                            ? optionLabels[ans]
                            : '—';
                        return (
                          <td
                            key={sc}
                            className="border border-slate-300 px-2 py-1 text-center font-extrabold"
                          >
                            {display}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            );
          })}
        </div>

        {/* Official Signatures Footer */}
        <div className="grid grid-cols-3 gap-8 mt-12 pt-4 text-center text-xs">
          <div className="border-t border-slate-700 pt-1.5 font-semibold">বিষয় শিক্ষক</div>
          <div className="border-t border-slate-700 pt-1.5 font-semibold">পরীক্ষা নিয়ন্ত্রক</div>
          <div className="border-t border-slate-700 pt-1.5 font-semibold">প্রধান শিক্ষক</div>
        </div>
      </div>
    </div>
  );
}
