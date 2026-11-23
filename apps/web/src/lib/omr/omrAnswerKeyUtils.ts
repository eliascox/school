/**
 * Pure Utilities for the Subject-Wise OMR Answer Key Studio:
 *  - Multi-format bulk text parser (Bangla ক-ঘ, English A-D, digits 1-4/১-৪, numbered pairs 1:A / ১.ক)
 *  - Keyboard shortcut mapping for rapid sequential entry
 *  - Live option distribution & missing-question telemetry
 *  - Board-style vertical sequential column partitioning (1-15 | 16-30, etc.)
 *  - Copyable text & Excel worksheet row builders
 */

import {
  OMR_OPTION_LABELS,
  OmrOptionStyle,
  clampOmrQuestionCount,
  toAsciiDigits,
  toBanglaDigits,
} from './omrTemplates';

export interface ParsedBulkAnswerKeyResult {
  answers: Array<number | null>;
  providedIndices: number[];
  parsedCount: number;
  mode: 'numbered' | 'sequence';
  warnings: string[];
}

export interface AnswerKeyStats {
  total: number;
  filled: number;
  missingCount: number;
  missingQuestionNumbers: number[];
  optionCounts: [number, number, number, number];
  completionPercent: number;
  isComplete: boolean;
}

export interface VerticalAnswerColumn {
  colIndex: number;
  startIndex: number; // 0-based inclusive
  endIndex: number; // 0-based inclusive
}

const SINGLE_OPTION_MAP: Record<string, number> = {
  ক: 0,
  খ: 1,
  গ: 2,
  ঘ: 3,
  a: 0,
  b: 1,
  c: 2,
  d: 3,
  A: 0,
  B: 1,
  C: 2,
  D: 3,
  '1': 0,
  '2': 1,
  '3': 2,
  '4': 3,
  '১': 0,
  '২': 1,
  '৩': 2,
  '৪': 3,
};

/**
 * Maps a single character or keyboard key to option index 0..3 (or null if unrecognized).
 */
export function mapTokenToOptionIndex(token: string): number | null {
  const trimmed = token.trim();
  if (!trimmed) return null;
  if (trimmed in SINGLE_OPTION_MAP) {
    return SINGLE_OPTION_MAP[trimmed];
  }
  const lower = trimmed.toLowerCase();
  if (lower in SINGLE_OPTION_MAP) {
    return SINGLE_OPTION_MAP[lower];
  }
  return null;
}

/**
 * Parses teacher-entered or pasted bulk Answer Key text in virtually any common format:
 *   1. Numbered pairs: "1:A, 2:C, 3:B" | "১. ক ২. গ ৩. ঘ" | "1) ঘ\n2) ক" | "5 - B"
 *   2. Spaced sequence: "ক খ গ ঘ ক খ" | "A B C D A B" | "1 2 3 4 1 2"
 *   3. Compact unspaced sequence: "কখগঘকখগঘ..." | "ABCDABCD..." | "12341234..."
 *   4. Blank placeholders: "-", "_", "?" leave that slot as null
 */
export function parseBulkAnswerKeyText(
  rawText: string,
  questionCount: number,
): ParsedBulkAnswerKeyResult {
  const total = clampOmrQuestionCount(questionCount, 30);
  const answers: Array<number | null> = Array.from({ length: total }, () => null);
  const warnings: string[] = [];

  const trimmed = (rawText || '').trim();
  if (!trimmed) {
    return { answers, providedIndices: [], parsedCount: 0, mode: 'sequence', warnings };
  }

  // Normalize Bangla digits to ASCII for uniform numbered-pair detection,
  // while keeping Bangla option letters (ক খ গ ঘ) intact.
  const normalizedDigits = toAsciiDigits(trimmed);

  // Detect explicit numbered pairs like "1:A", "1. ক", "1) গ", "1-B", "12 = ঘ"
  const pairRegex = /(?:^|[\s,;|/\\।]+)(\d{1,3})\s*[:.)=\-–—]+\s*([কখগঘa-dA-D1-4\-_?])(?=$|[\s,;|/\\।]+)/g;
  const matchedPairs: Array<{ qNum: number; val: number | null; rawOpt: string }> = [];
  let m: RegExpExecArray | null = null;
  while ((m = pairRegex.exec(normalizedDigits)) !== null) {
    const qNum = parseInt(m[1], 10);
    const rawOpt = m[2];
    const val = rawOpt === '-' || rawOpt === '_' || rawOpt === '?' ? null : mapTokenToOptionIndex(rawOpt);
    matchedPairs.push({ qNum, val, rawOpt });
  }

  if (matchedPairs.length >= 2 || (matchedPairs.length === 1 && /^\d{1,3}\s*[:.)=\-–—]+/.test(normalizedDigits))) {
    let parsedCount = 0;
    let outOfRange = 0;
    const providedSet = new Set<number>();
    for (const pair of matchedPairs) {
      if (pair.qNum < 1 || pair.qNum > total) {
        outOfRange++;
        continue;
      }
      const idx = pair.qNum - 1;
      answers[idx] = pair.val;
      providedSet.add(idx);
      if (pair.val !== null) parsedCount++;
    }
    if (outOfRange > 0) {
      warnings.push(`${toBanglaDigits(outOfRange)}টি নম্বর ১–${toBanglaDigits(total)} সীমার বাইরে থাকায় বাদ দেওয়া হয়েছে।`);
    }
    return {
      answers,
      providedIndices: Array.from(providedSet).sort((a, b) => a - b),
      parsedCount,
      mode: 'numbered',
      warnings,
    };
  }

  // Otherwise parse as sequential tokens (either whitespace/punctuation separated or compact string)
  const rawTokens = normalizedDigits.split(/[\s,;|/\\।\t\r\n]+/).filter(Boolean);
  const flatChoices: Array<number | null> = [];

  for (const tok of rawTokens) {
    if (tok === '-' || tok === '_' || tok === '?') {
      flatChoices.push(null);
      continue;
    }
    const direct = mapTokenToOptionIndex(tok);
    if (direct !== null) {
      flatChoices.push(direct);
      continue;
    }
    // Strip trailing punctuation like "ক," or "(A)" or handle compact strings like "কখগঘ" or "ABCD"
    const cleaned = tok.replace(/[()[\]{}.:]/g, '');
    let consumedAny = false;
    for (const ch of cleaned) {
      if (ch === '-' || ch === '_' || ch === '?') {
        flatChoices.push(null);
        consumedAny = true;
      } else {
        const idx = mapTokenToOptionIndex(ch);
        if (idx !== null) {
          flatChoices.push(idx);
          consumedAny = true;
        }
      }
    }
    if (!consumedAny && cleaned.length > 0) {
      warnings.push(`অচেনা অংশ "${tok}" উপেক্ষা করা হয়েছে।`);
    }
  }

  let parsedCount = 0;
  const providedIndices: number[] = [];
  for (let i = 0; i < Math.min(total, flatChoices.length); i++) {
    answers[i] = flatChoices[i];
    providedIndices.push(i);
    if (flatChoices[i] !== null) parsedCount++;
  }

  if (flatChoices.length > total) {
    warnings.push(
      `মোট ${toBanglaDigits(flatChoices.length)}টি উত্তর দেওয়া হয়েছে; প্রথম ${toBanglaDigits(total)}টি নেওয়া হয়েছে।`,
    );
  }

  return { answers, providedIndices, parsedCount, mode: 'sequence', warnings };
}

/**
 * Merges parsed answers into an existing Answer Key array.
 *  - 'replace': overwrites provided slots (in numbered mode preserves unmentioned slots; in sequence mode replaces 0..N-1)
 *  - 'fill_missing': only fills slots where existing[i] === null
 */
export function mergeParsedAnswerKey(
  existing: Array<number | null>,
  parsed: ParsedBulkAnswerKeyResult,
  questionCount: number,
  strategy: 'replace' | 'fill_missing',
): Array<number | null> {
  const total = clampOmrQuestionCount(questionCount, 30);
  const base = Array.from({ length: total }, (_, i) =>
    existing[i] === 0 || existing[i] === 1 || existing[i] === 2 || existing[i] === 3
      ? existing[i]
      : null,
  );

  if (strategy === 'fill_missing') {
    return base.map((curr, idx) => (curr !== null ? curr : parsed.answers[idx] ?? null));
  }

  if (parsed.mode === 'numbered') {
    const provided = new Set(parsed.providedIndices);
    return base.map((curr, idx) => (provided.has(idx) ? parsed.answers[idx] ?? null : curr));
  }

  return Array.from({ length: total }, (_, idx) => parsed.answers[idx] ?? null);
}

/**
 * Computes completion percentage, missing question numbers, and option distribution (A/B/C/D or ক/খ/গ/ঘ).
 */
export function computeAnswerKeyStats(
  answers: Array<number | null>,
  questionCount: number,
): AnswerKeyStats {
  const total = clampOmrQuestionCount(questionCount, 30);
  const optionCounts: [number, number, number, number] = [0, 0, 0, 0];
  const missingQuestionNumbers: number[] = [];
  let filled = 0;

  for (let i = 0; i < total; i++) {
    const val = answers[i];
    if (val === 0 || val === 1 || val === 2 || val === 3) {
      filled++;
      optionCounts[val]++;
    } else {
      missingQuestionNumbers.push(i + 1);
    }
  }

  const completionPercent = total > 0 ? Math.round((filled / total) * 100) : 0;

  return {
    total,
    filled,
    missingCount: total - filled,
    missingQuestionNumbers,
    optionCounts,
    completionPercent,
    isComplete: filled === total && total > 0,
  };
}

/**
 * Partitions questions into board-style vertical sequential columns:
 *   - 10..30 questions -> 2 balanced columns (e.g., 1-15 | 16-30)
 *   - 31..60 questions -> 3 balanced columns (e.g., 1-15 | 16-30 | 31-45)
 *   - 61..100 questions -> 4 balanced columns (e.g., 1-25 | 26-50 | 51-75 | 76-100)
 */
export function getVerticalAnswerColumns(questionCount: number): VerticalAnswerColumn[] {
  const total = clampOmrQuestionCount(questionCount, 30);
  const numCols = total <= 30 ? 2 : total <= 60 ? 3 : 4;
  const baseRows = Math.floor(total / numCols);
  const extra = total % numCols;

  const cols: VerticalAnswerColumn[] = [];
  let cursor = 0;
  for (let c = 0; c < numCols; c++) {
    const rows = baseRows + (c < extra ? 1 : 0);
    if (rows <= 0) continue;
    cols.push({
      colIndex: c,
      startIndex: cursor,
      endIndex: cursor + rows - 1,
    });
    cursor += rows;
  }
  return cols;
}

/**
 * Formats an Answer Key into clean copyable text for WhatsApp/notes/docs.
 */
export function formatAnswerKeyAsCopyText(
  answers: Array<number | null>,
  optionStyle: OmrOptionStyle,
  format: 'numbered' | 'compact' = 'numbered',
): string {
  const labels = OMR_OPTION_LABELS[optionStyle === 'en' ? 'en' : 'bn'];
  const isBn = optionStyle !== 'en';

  if (format === 'compact') {
    return answers
      .map((val) => (val !== null && val >= 0 && val <= 3 ? labels[val] : '-'))
      .join(' ');
  }

  return answers
    .map((val, idx) => {
      const qNum = isBn ? toBanglaDigits(idx + 1) : String(idx + 1);
      const opt = val !== null && val >= 0 && val <= 3 ? labels[val] : '-';
      return `${qNum}.${opt}`;
    })
    .join('  ');
}

export interface AnswerKeyExcelInputRow {
  examTitle: string;
  gradeLabel: string;
  scopeLabel: string;
  subjectCode: string;
  subjectName: string;
  questionCount: number;
  optionStyle: OmrOptionStyle;
  markPerCorrect: number;
  negativeMark: number;
  setCode: string;
  answers: Array<number | null>;
}

/**
 * Builds clean tabular rows ready for `XLSX.utils.json_to_sheet`.
 */
export function buildAnswerKeyExcelRows(
  entries: AnswerKeyExcelInputRow[],
): Array<Record<string, string | number>> {
  const maxQ = entries.reduce((acc, item) => Math.max(acc, item.questionCount), 30);

  return entries.map((entry) => {
    const labels = OMR_OPTION_LABELS[entry.optionStyle === 'en' ? 'en' : 'bn'];
    const filled = entry.answers.filter((v) => v !== null).length;
    const row: Record<string, string | number> = {
      'পরীক্ষা': entry.examTitle,
      'শ্রেণি': entry.gradeLabel,
      'শাখা/বিভাগ': entry.scopeLabel,
      'বিষয় কোড': entry.subjectCode,
      'বিষয়ের নাম': entry.subjectName,
      'সেট': entry.setCode === 'default' ? 'মূল সেট' : `সেট ${entry.setCode}`,
      'মোট প্রশ্ন': entry.questionCount,
      'সেট করা হয়েছে': filled,
      'সঠিক নম্বর': entry.markPerCorrect,
      'নেগেটিভ': entry.negativeMark,
    };

    for (let i = 0; i < maxQ; i++) {
      const qCol = `প্রশ্ন ${i + 1}`;
      if (i >= entry.questionCount) {
        row[qCol] = '';
      } else {
        const v = entry.answers[i];
        row[qCol] = v !== null && v >= 0 && v <= 3 ? labels[v] : '';
      }
    }
    return row;
  });
}
