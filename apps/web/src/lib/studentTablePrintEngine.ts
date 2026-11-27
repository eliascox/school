/**
 * Unified Student List Print Engine, Column Reordering, Custom Blank Columns,
 * Signature Box Controls & Saved Table Templates.
 * Shared by BOTH `/dashboard/students` (StudentPrintSuiteView) and `/dashboard/students/print`.
 */

import type { SchoolSettings } from '@/services/settingsService';
import {
  getEnglishAddress,
  getEnglishPrincipalTitleFromSettings,
  getEnglishSchoolName,
} from '@/services/settingsService';
import type { Student } from '@/services/studentService';
import { sortStudentsGroupAndRoll } from '@/services/studentBulkImportEngine';
import { toAsciiDigits, toBanglaDigits } from '@/lib/omr/omrTemplates';
import {
  RANK_GRADE_BN_MAP,
  RANK_GRADE_EN_MAP,
  getRankGroupEn,
  normalizeRankGrade,
} from '@/lib/rankResultUtils';

export type TablePrintLang = 'bn' | 'en';
export type TableOrientation = 'portrait' | 'landscape';
export type TableMarginPreset = 'compact' | 'normal' | 'wide';
export type TableHeaderTheme = 'classic_bw' | 'dark_navy' | 'emerald';
export type TableRowDensity = 'compact' | 'standard' | 'sign_tall';
export type TableFontSize = 'sm' | 'md' | 'lg';
export type ColumnWidthPreset = 'narrow' | 'medium' | 'wide';

export type StandardPrintColumnKey =
  | 'sl'
  | 'roll'
  | 'id'
  | 'name'
  | 'gender'
  | 'religion'
  | 'grade'
  | 'group'
  | 'guardian'
  | 'fatherNid'
  | 'motherName'
  | 'motherNid'
  | 'mobile'
  | 'optionalSubject'
  | 'birthRegNo'
  | 'dob'
  | 'bloodGroup'
  | 'address'
  | 'stipend'
  | 'signature'
  | 'remarks';

export interface CustomBlankColumn {
  id: string; // e.g. 'custom_1730000000'
  labelBn: string;
  labelEn: string;
  width: ColumnWidthPreset;
  align: 'left' | 'center';
}

export interface ResolvedPrintColumn {
  key: string;
  labelBn: string;
  labelEn: string;
  align: 'left' | 'center';
  widthCss?: string;
  isCustom?: boolean;
  isSignature?: boolean;
  required?: boolean;
}

export interface SignatorySlot {
  id: string;
  enabled: boolean;
  labelBn: string;
  labelEn: string;
  showDateLine?: boolean;
  isPrincipal?: boolean;
}

export interface StudentTableStyleConfig {
  headerTheme: TableHeaderTheme;
  rowDensity: TableRowDensity;
  fontSize: TableFontSize;
  zebraStripes: boolean;
  showStatsStrip: boolean;
  showWatermark: boolean;
  signatureColWidth: ColumnWidthPreset;
  customTitle: string;
  customSubtitle: string;
  showBottomSignatures: boolean;
  signatories: SignatorySlot[];
}

export type BuiltInTablePresetId =
  | 'attendance_sign'
  | 'basic_list'
  | 'guardian_contact'
  | 'board_official'
  | 'distribution_sheet';

export interface SavedTablePrintTemplate {
  id: string;
  name: string;
  orientation: TableOrientation;
  margin: TableMarginPreset;
  docLang: TablePrintLang;
  columnOrder: string[];
  activeColumns: Record<string, boolean>;
  customColumns: CustomBlankColumn[];
  style: StudentTableStyleConfig;
  createdAt: number;
}

export interface StudentTableFilters {
  grade: string;
  branch: string;
  group: string;
  gender: string;
  religion: string;
  stipend: string;
  q: string;
}

export const WIDTH_PRESET_PX: Record<ColumnWidthPreset, string> = {
  narrow: '78px',
  medium: '118px',
  wide: '162px',
};

export const STANDARD_TABLE_COLUMNS: Array<{
  key: StandardPrintColumnKey;
  labelBn: string;
  labelEn: string;
  align: 'left' | 'center';
  widthCss?: string;
  required?: boolean;
  isSignature?: boolean;
}> = [
  { key: 'sl', labelBn: 'ক্র.', labelEn: 'SL', align: 'center', widthCss: '34px', required: true },
  { key: 'roll', labelBn: 'রোল', labelEn: 'Roll', align: 'center', widthCss: '48px' },
  { key: 'id', labelBn: 'আইডি', labelEn: 'Student ID', align: 'center', widthCss: '86px' },
  { key: 'name', labelBn: 'শিক্ষার্থীর নাম', labelEn: "Student's Name", align: 'left' },
  { key: 'gender', labelBn: 'লিঙ্গ', labelEn: 'Gender', align: 'center', widthCss: '50px' },
  { key: 'religion', labelBn: 'ধর্ম', labelEn: 'Religion', align: 'center', widthCss: '58px' },
  { key: 'grade', labelBn: 'শ্রেণি ও শাখা', labelEn: 'Class & Sec', align: 'center', widthCss: '78px' },
  { key: 'group', labelBn: 'বিভাগ', labelEn: 'Group', align: 'center', widthCss: '80px' },
  { key: 'guardian', labelBn: 'পিতার নাম / অভিভাবক', labelEn: "Father's Name / Guardian", align: 'left' },
  { key: 'fatherNid', labelBn: 'পিতার এনআইডি', labelEn: 'Father NID', align: 'center' },
  { key: 'motherName', labelBn: 'মাতার নাম', labelEn: "Mother's Name", align: 'left' },
  { key: 'motherNid', labelBn: 'মাতার এনআইডি', labelEn: 'Mother NID', align: 'center' },
  { key: 'mobile', labelBn: 'মোবাইল নম্বর', labelEn: 'Mobile', align: 'center', widthCss: '96px' },
  { key: 'optionalSubject', labelBn: '৪র্থ/ঐচ্ছিক বিষয়', labelEn: '4th Subject', align: 'center' },
  { key: 'birthRegNo', labelBn: 'জন্ম নিবন্ধন', labelEn: 'Birth Reg. No.', align: 'center' },
  { key: 'dob', labelBn: 'জন্ম তারিখ', labelEn: 'Date of Birth', align: 'center', widthCss: '80px' },
  { key: 'bloodGroup', labelBn: 'রক্ত', labelEn: 'Blood', align: 'center', widthCss: '46px' },
  { key: 'address', labelBn: 'ঠিকানা', labelEn: 'Address', align: 'left' },
  { key: 'stipend', labelBn: 'উপবৃত্তি', labelEn: 'Stipend', align: 'center', widthCss: '58px' },
  {
    key: 'signature',
    labelBn: 'স্বাক্ষর',
    labelEn: 'Signature',
    align: 'center',
    widthCss: WIDTH_PRESET_PX.medium,
    isSignature: true,
  },
  { key: 'remarks', labelBn: 'মন্তব্য', labelEn: 'Remarks', align: 'center', widthCss: '84px' },
];

export const DEFAULT_COLUMN_ORDER: string[] = STANDARD_TABLE_COLUMNS.map((c) => c.key);

export const DEFAULT_SIGNATORIES: SignatorySlot[] = [
  {
    id: 'class_teacher',
    enabled: true,
    labelBn: 'শ্রেণি শিক্ষকের স্বাক্ষর',
    labelEn: "Class Teacher's Signature",
    showDateLine: true,
  },
  {
    id: 'asst_head',
    enabled: true,
    labelBn: 'সহকারী প্রধান শিক্ষক',
    labelEn: 'Assistant Headmaster',
    showDateLine: true,
  },
  {
    id: 'headmaster',
    enabled: true,
    labelBn: 'প্রধান শিক্ষক',
    labelEn: 'Headmaster',
    showDateLine: false,
    isPrincipal: true,
  },
  {
    id: 'controller',
    enabled: false,
    labelBn: 'দায়িত্বপ্রাপ্ত শিক্ষক / সমন্বয়ক',
    labelEn: 'Coordinator / Officer-in-Charge',
    showDateLine: true,
  },
];

export const DEFAULT_TABLE_STYLE: StudentTableStyleConfig = {
  headerTheme: 'classic_bw',
  rowDensity: 'standard',
  fontSize: 'md',
  zebraStripes: true,
  showStatsStrip: true,
  showWatermark: false,
  signatureColWidth: 'medium',
  customTitle: '',
  customSubtitle: '',
  showBottomSignatures: true,
  signatories: DEFAULT_SIGNATORIES,
};

export interface BuiltInTablePresetSpec {
  id: BuiltInTablePresetId;
  labelBn: string;
  shortDescBn: string;
  titleBn: string;
  titleEn: string;
  orientation: TableOrientation;
  rowDensity: TableRowDensity;
  signatureColWidth: ColumnWidthPreset;
  columnOrder: string[];
  activeKeys: string[];
  customColumns?: CustomBlankColumn[];
}

export const BUILT_IN_TABLE_PRESETS: Record<BuiltInTablePresetId, BuiltInTablePresetSpec> = {
  attendance_sign: {
    id: 'attendance_sign',
    labelBn: 'হাজিরা ও স্বাক্ষর শিট',
    shortDescBn: 'পোর্ট্রেট • স্বাক্ষরের বড় ঘর ও উঁচু সারি',
    titleBn: 'শ্রেণি হাজিরা ও স্বাক্ষর রেজিস্টার',
    titleEn: 'CLASS ATTENDANCE & SIGNATURE REGISTER',
    orientation: 'portrait',
    rowDensity: 'sign_tall',
    signatureColWidth: 'wide',
    columnOrder: DEFAULT_COLUMN_ORDER,
    activeKeys: ['sl', 'roll', 'name', 'guardian', 'mobile', 'signature'],
  },
  basic_list: {
    id: 'basic_list',
    labelBn: 'বেসিক শিক্ষার্থী তালিকা',
    shortDescBn: 'পোর্ট্রেট • রোল, নাম, শ্রেণি, মোবাইল ও স্বাক্ষর',
    titleBn: 'শিক্ষার্থী তালিকা ও সাধারণ বিবরণী',
    titleEn: 'STUDENT DIRECTORY & GENERAL REGISTER',
    orientation: 'portrait',
    rowDensity: 'standard',
    signatureColWidth: 'medium',
    columnOrder: DEFAULT_COLUMN_ORDER,
    activeKeys: ['sl', 'roll', 'name', 'gender', 'grade', 'group', 'guardian', 'mobile', 'signature'],
  },
  guardian_contact: {
    id: 'guardian_contact',
    labelBn: 'অভিভাবক ডিরেক্টরি',
    shortDescBn: 'ল্যান্ডস্কেপ • পিতা-মাতা, মোবাইল ও ঠিকানা',
    titleBn: 'অভিভাবক যোগাযোগ ডিরেক্টরি',
    titleEn: 'GUARDIAN CONTACT DIRECTORY',
    orientation: 'landscape',
    rowDensity: 'standard',
    signatureColWidth: 'medium',
    columnOrder: DEFAULT_COLUMN_ORDER,
    activeKeys: ['sl', 'roll', 'name', 'grade', 'group', 'guardian', 'motherName', 'mobile', 'address', 'signature'],
  },
  board_official: {
    id: 'board_official',
    labelBn: 'বোর্ড রেজিস্ট্রেশন ও NID',
    shortDescBn: 'ল্যান্ডস্কেপ • জন্ম নিবন্ধন, NID ও ৪র্থ বিষয়',
    titleBn: 'বোর্ড রেজিস্ট্রেশন ও জাতীয় পরিচয়পত্র তালিকা',
    titleEn: 'BOARD REGISTRATION & NID REGISTER',
    orientation: 'landscape',
    rowDensity: 'compact',
    signatureColWidth: 'narrow',
    columnOrder: DEFAULT_COLUMN_ORDER,
    activeKeys: [
      'sl',
      'roll',
      'name',
      'grade',
      'group',
      'guardian',
      'fatherNid',
      'motherName',
      'motherNid',
      'birthRegNo',
      'dob',
      'optionalSubject',
    ],
  },
  distribution_sheet: {
    id: 'distribution_sheet',
    labelBn: 'বই / উপবৃত্তি বিতরণ শিট',
    shortDescBn: 'পোর্ট্রেট • গ্রহণের তারিখ ও বড় স্বাক্ষর ঘর',
    titleBn: 'পাঠ্যবই / উপবৃত্তি বিতরণ ও স্বাক্ষর তালিকা',
    titleEn: 'BOOK / STIPEND DISTRIBUTION & SIGNATURE SHEET',
    orientation: 'portrait',
    rowDensity: 'sign_tall',
    signatureColWidth: 'wide',
    columnOrder: [
      'sl',
      'roll',
      'name',
      'grade',
      'guardian',
      'mobile',
      'custom_receive_date',
      'signature',
      'remarks',
      ...DEFAULT_COLUMN_ORDER.filter(
        (k) => !['sl', 'roll', 'name', 'grade', 'guardian', 'mobile', 'signature', 'remarks'].includes(k),
      ),
    ],
    activeKeys: ['sl', 'roll', 'name', 'grade', 'guardian', 'mobile', 'custom_receive_date', 'signature'],
    customColumns: [
      {
        id: 'custom_receive_date',
        labelBn: 'তারিখ / বিবরণ',
        labelEn: 'Date / Item',
        width: 'medium',
        align: 'center',
      },
    ],
  },
};

export function buildActiveColumnsMap(activeKeys: string[]): Record<string, boolean> {
  const set = new Set(activeKeys);
  const map: Record<string, boolean> = {};
  for (const col of STANDARD_TABLE_COLUMNS) {
    map[col.key] = col.required ? true : set.has(col.key);
  }
  activeKeys.forEach((k) => {
    map[k] = true;
  });
  map.sl = true;
  return map;
}

export function normalizeColumnOrder(
  currentOrder: string[],
  customColumns: CustomBlankColumn[],
): string[] {
  const validKeys = new Set<string>([
    ...STANDARD_TABLE_COLUMNS.map((c) => c.key),
    ...customColumns.map((c) => c.id),
  ]);
  const seen = new Set<string>();
  const result: string[] = [];

  for (const key of currentOrder) {
    if (validKeys.has(key) && !seen.has(key)) {
      seen.add(key);
      result.push(key);
    }
  }
  for (const key of validKeys) {
    if (!seen.has(key)) {
      seen.add(key);
      result.push(key);
    }
  }
  return result;
}

/**
 * Moves column `fromKey` to the exact slot occupied by `toKey` (Drag & Drop reorder).
 */
export function reorderColumnOrder(
  order: string[],
  fromKey: string,
  toKey: string,
): string[] {
  if (fromKey === toKey) return order;
  const fromIdx = order.indexOf(fromKey);
  const toIdx = order.indexOf(toKey);
  if (fromIdx < 0 || toIdx < 0) return order;
  const next = [...order];
  const [moved] = next.splice(fromIdx, 1);
  next.splice(toIdx, 0, moved);
  return next;
}

/**
 * Moves a column up (-1) or down (+1) among visible columns (or full order list).
 */
export function moveColumnByDelta(
  order: string[],
  key: string,
  delta: -1 | 1,
  onlyAmongActive?: Record<string, boolean>,
): string[] {
  const idx = order.indexOf(key);
  if (idx < 0) return order;

  if (!onlyAmongActive) {
    const target = idx + delta;
    if (target < 0 || target >= order.length) return order;
    return reorderColumnOrder(order, key, order[target]);
  }

  // Find nearest active neighbor in `delta` direction so 1 click always visually shifts 1 visible column!
  let cursor = idx + delta;
  while (cursor >= 0 && cursor < order.length) {
    if (onlyAmongActive[order[cursor]]) {
      return reorderColumnOrder(order, key, order[cursor]);
    }
    cursor += delta;
  }
  return order;
}

export function createCustomBlankColumn(params: {
  labelBn: string;
  labelEn?: string;
  width?: ColumnWidthPreset;
  align?: 'left' | 'center';
}): CustomBlankColumn {
  const cleanBn = params.labelBn.trim() || 'কাস্টম কলাম';
  const cleanEn = (params.labelEn || '').trim() || cleanBn;
  return {
    id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    labelBn: cleanBn,
    labelEn: cleanEn,
    width: params.width || 'medium',
    align: params.align || 'center',
  };
}

export function resolveVisibleOrderedColumns(params: {
  columnOrder: string[];
  activeColumns: Record<string, boolean>;
  customColumns: CustomBlankColumn[];
  signatureColWidth: ColumnWidthPreset;
}): ResolvedPrintColumn[] {
  const { columnOrder, activeColumns, customColumns, signatureColWidth } = params;
  const stdMap = new Map(STANDARD_TABLE_COLUMNS.map((c) => [c.key as string, c]));
  const customMap = new Map(customColumns.map((c) => [c.id, c]));
  const normalized = normalizeColumnOrder(columnOrder, customColumns);

  const out: ResolvedPrintColumn[] = [];
  for (const key of normalized) {
    if (!activeColumns[key]) continue;
    const std = stdMap.get(key);
    if (std) {
      out.push({
        key: std.key,
        labelBn: std.labelBn,
        labelEn: std.labelEn,
        align: std.align,
        widthCss: std.isSignature ? WIDTH_PRESET_PX[signatureColWidth] : std.widthCss,
        isSignature: std.isSignature,
        required: std.required,
      });
      continue;
    }
    const custom = customMap.get(key);
    if (custom) {
      out.push({
        key: custom.id,
        labelBn: custom.labelBn,
        labelEn: custom.labelEn,
        align: custom.align,
        widthCss: WIDTH_PRESET_PX[custom.width],
        isCustom: true,
      });
    }
  }
  return out;
}

export function formatTableDigits(val: string | number, lang: TablePrintLang): string {
  return lang === 'bn' ? toBanglaDigits(val) : toAsciiDigits(val);
}

export function isStudentMale(gender?: string): boolean {
  const g = (gender || '').toLowerCase();
  return (
    g.includes('পুরুষ') ||
    g.includes('ছেলে') ||
    (g.includes('ছাত্র') && !g.includes('ছাত্রী')) ||
    g === 'male' ||
    g === 'm'
  );
}

export function isStudentFemale(gender?: string): boolean {
  const g = (gender || '').toLowerCase();
  return (
    g.includes('মহিলা') ||
    g.includes('মেয়ে') ||
    g.includes('মেয়ে') ||
    g.includes('ছাত্রী') ||
    g === 'female' ||
    g === 'f'
  );
}

export function formatOrderedCellValue(
  st: Student & Record<string, unknown>,
  colKey: string,
  globalIndex: number,
  lang: TablePrintLang,
): string {
  if (colKey.startsWith('custom_') || colKey === 'signature' || colKey === 'remarks') {
    return '';
  }

  switch (colKey) {
    case 'sl':
      return formatTableDigits(globalIndex, lang);
    case 'roll':
      return formatTableDigits(st.roll || globalIndex, lang);
    case 'id':
      return String(st.id || '—');
    case 'name':
      return lang === 'en' ? String(st.nameEn || st.name || '—') : String(st.name || '—');
    case 'gender':
      if (lang === 'en') return isStudentMale(st.gender) ? 'Boy' : 'Girl';
      return isStudentMale(st.gender) ? 'ছাত্র' : 'ছাত্রী';
    case 'religion': {
      const r = String(st.religion || 'ইসলাম');
      if (lang === 'en') {
        if (r.includes('ইসলাম') || r.toLowerCase().includes('muslim')) return 'Islam';
        if (r.includes('হিন্দু') || r.toLowerCase().includes('hindu') || r.includes('সনাতন')) return 'Hinduism';
        if (r.includes('বৌদ্ধ') || r.toLowerCase().includes('buddh')) return 'Buddhism';
        if (r.includes('খ্রিস্ট') || r.toLowerCase().includes('christ')) return 'Christianity';
        return r;
      }
      if (r.toLowerCase().includes('muslim')) return 'ইসলাম';
      if (r.toLowerCase().includes('hindu')) return 'হিন্দু';
      return r;
    }
    case 'grade': {
      const gKey = normalizeRankGrade(st.grade || st.gradeBn);
      const sec = st.branch || st.section || 'A';
      return lang === 'en'
        ? `${RANK_GRADE_EN_MAP[gKey].replace(/\s*\(.+\)/, '')} (${sec})`
        : `${RANK_GRADE_BN_MAP[gKey]} (${sec})`;
    }
    case 'group':
      return lang === 'en' ? getRankGroupEn(st.group || '') : String(st.group || 'সাধারণ');
    case 'guardian':
      return String(st.guardian || st.fatherName || '—');
    case 'fatherNid':
      return formatTableDigits(String(st.fatherNid || '—'), lang);
    case 'motherName':
      return String(st.motherName || '—');
    case 'motherNid':
      return formatTableDigits(String(st.motherNid || '—'), lang);
    case 'mobile':
      return formatTableDigits(String(st.mobile || '—'), lang);
    case 'optionalSubject':
      return String(st.optionalSubject || '—');
    case 'birthRegNo':
      return formatTableDigits(String(st.birthRegNo || '—'), lang);
    case 'dob':
      return formatTableDigits(String(st.dob || '—'), lang);
    case 'bloodGroup':
      return String(st.bloodGroup || '—');
    case 'address':
      return String(st.currentAddress || '—');
    case 'stipend':
      return st.isStipend ? (lang === 'en' ? 'Yes' : 'হ্যাঁ') : '—';
    default:
      return '';
  }
}

export function buildOrderedStudentExcelRows(
  students: Array<Student & Record<string, unknown>>,
  orderedCols: ResolvedPrintColumn[],
  lang: TablePrintLang,
): Array<Record<string, string>> {
  return students.map((st, idx) => {
    const row: Record<string, string> = {};
    for (const col of orderedCols) {
      const header = lang === 'en' ? col.labelEn : col.labelBn;
      row[header] = formatOrderedCellValue(st, col.key, idx + 1, lang);
    }
    return row;
  });
}

export function buildOrderedStudentCsvContent(
  students: Array<Student & Record<string, unknown>>,
  orderedCols: ResolvedPrintColumn[],
  lang: TablePrintLang,
): string {
  const esc = (v: string) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const headers = orderedCols.map((c) => esc(lang === 'en' ? c.labelEn : c.labelBn));
  const body = students.map((st, idx) =>
    orderedCols.map((c) => esc(formatOrderedCellValue(st, c.key, idx + 1, lang))).join(','),
  );
  return '\uFEFF' + [headers.join(','), ...body].join('\n');
}

export function filterAndSortTableStudents<T extends Student & Record<string, unknown>>(
  allStudents: T[],
  filters: StudentTableFilters,
): T[] {
  const norm = (v: unknown) =>
    toAsciiDigits(String(v ?? ''))
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  const qNorm = norm(filters.q);

  const filtered = allStudents.filter((st) => {
    const gNorm = normalizeRankGrade(st.grade || st.gradeBn);
    const matchGrade = filters.grade === 'all' || gNorm === filters.grade;
    const stBranch = String(st.branch || st.section || 'A').toLowerCase();
    const matchBranch = filters.branch === 'all' || stBranch === filters.branch.toLowerCase();

    const stGroup = String(st.group || 'সাধারণ');
    const matchGroup =
      filters.group === 'all' ||
      stGroup.includes(filters.group) ||
      (filters.group === 'বিজ্ঞান' && stGroup.toLowerCase().includes('sci')) ||
      (filters.group === 'মানবিক' && stGroup.toLowerCase().includes('hum')) ||
      ((filters.group === 'ব্যবসায় শিক্ষা' || filters.group === 'ব্যবসায়') &&
        (stGroup.includes('ব্যবসায়') ||
          stGroup.includes('ব্যবসায়') ||
          stGroup.toLowerCase().includes('com') ||
          stGroup.toLowerCase().includes('bus')));

    const matchGender =
      filters.gender === 'all' ||
      (filters.gender === 'পুরুষ' && isStudentMale(st.gender)) ||
      (filters.gender === 'মহিলা' && isStudentFemale(st.gender));

    const stRel = String(st.religion || 'ইসলাম');
    const matchReligion =
      filters.religion === 'all' ||
      stRel.includes(filters.religion) ||
      (filters.religion === 'ইসলাম' && stRel.toLowerCase().includes('muslim')) ||
      (filters.religion === 'হিন্দু' && (stRel.toLowerCase().includes('hindu') || stRel.includes('সনাতন')));

    const matchStipend =
      filters.stipend === 'all' || (filters.stipend === 'stipend_only' && Boolean(st.isStipend));

    const haystack = [
      st.name,
      st.nameEn,
      st.roll,
      st.id,
      st.guardian,
      st.fatherName,
      st.motherName,
      st.mobile,
      st.grade,
      st.branch,
      st.section,
      st.group,
      st.birthRegNo,
      st.registrationNo,
    ]
      .map(norm)
      .join(' | ');
    const matchSearch = !qNorm || qNorm.split(' ').every((term) => haystack.includes(term));

    return (
      matchGrade &&
      matchBranch &&
      matchGroup &&
      matchGender &&
      matchReligion &&
      matchStipend &&
      matchSearch
    );
  });

  return sortStudentsGroupAndRoll(filtered, 'roll_asc') as unknown as T[];
}

export function getTablePrintInstitutionHeader(
  settings: Partial<SchoolSettings> | null | undefined,
  lang: TablePrintLang,
) {
  const eiin = (settings?.eiin || '').trim();
  const estd = (settings?.estdYear || '').trim();
  if (lang === 'en') {
    const parts: string[] = [];
    if (eiin) parts.push(`EIIN: ${toAsciiDigits(eiin)}`);
    if (estd) parts.push(`Estd: ${toAsciiDigits(estd)}`);
    return {
      schoolName: getEnglishSchoolName(settings, 'Smart School'),
      address: getEnglishAddress(settings, ''),
      metaLine: parts.join(' • '),
      principalTitle: getEnglishPrincipalTitleFromSettings(settings, 'Headmaster'),
    };
  }
  const parts: string[] = [];
  if (eiin) parts.push(`ইআইআইএন: ${toBanglaDigits(eiin)}`);
  if (estd) parts.push(`স্থাপিত: ${toBanglaDigits(estd)} খ্রি.`);
  return {
    schoolName: (settings?.schoolName || '').trim() || 'শিক্ষা প্রতিষ্ঠান',
    address: (settings?.address || '').trim(),
    metaLine: parts.join(' • '),
    principalTitle: (settings?.principalTitle || '').trim() || 'প্রধান শিক্ষক',
  };
}

export function getTableMarginMm(preset: TableMarginPreset): { v: number; h: number; css: string } {
  if (preset === 'compact') return { v: 8, h: 9, css: '8mm 9mm' };
  if (preset === 'wide') return { v: 16, h: 18, css: '16mm 18mm' };
  return { v: 11, h: 12, css: '11mm 12mm' };
}

const TEMPLATES_STORAGE_KEY = 'sms_student_print_custom_templates_v1';

export function loadSavedTableTemplates(): SavedTablePrintTemplate[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCustomTableTemplate(
  template: Omit<SavedTablePrintTemplate, 'id' | 'createdAt'>,
): SavedTablePrintTemplate[] {
  const existing = loadSavedTableTemplates();
  const entry: SavedTablePrintTemplate = {
    ...template,
    id: `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    createdAt: Date.now(),
  };
  const updated = [entry, ...existing].slice(0, 20);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore storage quota error
    }
  }
  return updated;
}

export function deleteCustomTableTemplate(id: string): SavedTablePrintTemplate[] {
  const updated = loadSavedTableTemplates().filter((t) => t.id !== id);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }
  return updated;
}

/**
 * Generates realistic read-only sample students (up to 45) for multi-page print preview testing
 * when the local database has 0 students — never persisted to localStorage.
 */
export function buildSampleMultiPageStudents(count = 36): Array<Student & Record<string, unknown>> {
  const names = [
    ['তানভীর আহমেদ চৌধুরী', 'Tanvir Ahmed Chowdhury', 'পুরুষ', 'ইসলাম'],
    ['নুসরাত জাহান মীম', 'Nusrat Jahan Mim', 'মহিলা', 'ইসলাম'],
    ['রাফিউল ইসলাম সাকিব', 'Rafiul Islam Sakib', 'পুরুষ', 'ইসলাম'],
    ['সাদিয়া আফরিন তিশা', 'Sadia Afrin Tisha', 'মহিলা', 'ইসলাম'],
    ['অনির্বান বড়ুয়া', 'Anirban Barua', 'পুরুষ', 'বৌদ্ধ'],
    ['পূজা রানী দাশ', 'Puja Rani Das', 'মহিলা', 'হিন্দু'],
    ['হাবিবুল্লাহ সাজ্জাদ ওয়ালিদ', 'Habibullah Sajjad Walid', 'পুরুষ', 'ইসলাম'],
    ['তাসপিয়া মোস্তারিন', 'Taspiya Mostarin', 'মহিলা', 'ইসলাম'],
    ['মোহাম্মদ সাঈদ আল মাহমুদ', 'Mohammad Said Al Mahmud', 'পুরুষ', 'ইসলাম'],
    ['আবু ঈসা মোহাম্মদ সায়েম', 'Abu Isa Mohammad Saim', 'পুরুষ', 'ইসলাম'],
    ['ফারিহা তাসনিম', 'Fariha Tasnim', 'মহিলা', 'ইসলাম'],
    ['মাহমুদুল হাসান রাহাত', 'Mahmudul Hasan Rahat', 'পুরুষ', 'ইসলাম'],
  ] as const;

  return Array.from({ length: count }, (_, idx) => {
    const pick = names[idx % names.length];
    const roll = String(idx + 1).padStart(2, '0');
    const grade = idx < 18 ? '9th' : '8th';
    const group = idx < 18 ? 'ব্যবসায় শিক্ষা' : 'সাধারণ';
    return {
      id: `STD-${grade}-${roll}`,
      roll,
      name: idx >= names.length ? `${pick[0]} (${toBanglaDigits(Math.floor(idx / names.length) + 1)})` : pick[0],
      nameEn: idx >= names.length ? `${pick[1]} (${Math.floor(idx / names.length) + 1})` : pick[1],
      gender: pick[2],
      religion: pick[3],
      grade,
      branch: 'A',
      section: 'A',
      group,
      guardian: `অভিভাবক — ${pick[0].split(' ')[0]}`,
      fatherName: `মোঃ সাইফুল ইসলাম ${toBanglaDigits(idx + 1)}`,
      fatherNid: `1980151122${String(100 + idx)}`,
      motherName: `নাসরিন সুলতানা ${toBanglaDigits(idx + 1)}`,
      motherNid: `1986151122${String(100 + idx)}`,
      mobile: `018${String(16510000 + idx * 137)}`,
      optionalSubject: grade === '9th' ? 'কৃষি শিক্ষা' : '—',
      birthRegNo: `2011221401100${String(1000 + idx)}`,
      dob: '2011-05-12',
      bloodGroup: ['A+', 'B+', 'O+', 'AB+'][idx % 4],
      currentAddress: 'বরইতলী, চকরিয়া, কক্সবাজার',
      isStipend: idx % 3 === 0,
    } as unknown as Student & Record<string, unknown>;
  });
}
