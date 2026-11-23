import * as XLSX from 'xlsx';
import type { Student } from '@/services/studentService';
import type { ExamHallRoom, SeatPlanEntry } from '@/services/examSeatPlanService';

export type ColumnGenderRule = 'male' | 'female' | 'any';
export type NormalizedGender = 'male' | 'female' | 'other';
export type SeatGenderMode =
  | 'column_split'
  | 'boys_only'
  | 'girls_only'
  | 'separate_rooms'
  | 'combined';
export type ClassDistributionMode =
  | 'anti_cheat_bench'
  | 'sequential'
  | 'anti_cheat_alternate';
export type SeatFillOrder = 'column_first' | 'row_first';

export interface LiveClassGroupBucket {
  key: string;
  gradeKey: '6th' | '7th' | '8th' | '9th' | '10th' | 'other';
  gradeLabelBn: string;
  groupLabelBn: string;
  shortBadge: string;
  students: Student[];
  boys: number;
  girls: number;
  other: number;
  total: number;
  sections: string[];
}

export interface CapacityForecast {
  totalStudents: number;
  boysNeeded: number;
  girlsNeeded: number;
  otherNeeded: number;
  totalSeats: number;
  maleSeats: number;
  femaleSeats: number;
  anySeats: number;
  shortfallBoys: number;
  shortfallGirls: number;
  shortfallOther: number;
  shortfallTotal: number;
  recommendedRoomCount: number;
}

export interface RoomClassRollRange {
  classKey: string;
  gradeLabel: string;
  groupLabel: string;
  shortBadge: string;
  rolls: string[];
  rollRangeLabel: string;
  count: number;
  boys: number;
  girls: number;
}

export interface RoomColumnSummary {
  colIndex: number;
  rule: ColumnGenderRule;
  benches: number;
  capacity: number;
  boys: number;
  girls: number;
  other: number;
  total: number;
}

export interface RoomDoorSummary {
  roomId: string;
  roomNo: string;
  roomName: string;
  building?: string;
  cols: number;
  rows: number;
  seatsPerBench: 1 | 2 | 3;
  capacity: number;
  totalAssigned: number;
  boys: number;
  girls: number;
  other: number;
  columnSummary: RoomColumnSummary[];
  classRanges: RoomClassRollRange[];
}

export interface ColumnGenderPreset {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  recommendedCols?: number;
  build: (cols: number) => ColumnGenderRule[];
}

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toAsciiDigits(input: string | number | undefined | null): string {
  if (input === undefined || input === null) return '';
  return String(input).replace(/[০-৯]/g, (d) => {
    const idx = BN_DIGITS.indexOf(d);
    return idx >= 0 ? String(idx) : d;
  });
}

export function toBanglaDigits(input: string | number | undefined | null): string {
  if (input === undefined || input === null) return '';
  return String(input).replace(/\d/g, (d) => BN_DIGITS[Number(d)] ?? d);
}

export function normalizeSeatGender(gender?: string): NormalizedGender {
  if (!gender) return 'other';
  const g = gender.toLowerCase().trim();
  if (!g) return 'other';

  // Check female patterns FIRST so 'ছাত্রী' never matches 'ছাত্র'
  if (
    g.includes('মহিলা') ||
    g.includes('মেয়ে') ||
    g.includes('মেয়ে') ||
    g.includes('নারী') ||
    g.includes('ছাত্রী') ||
    g.includes('বালিকা') ||
    g.includes('female') ||
    g.includes('girl') ||
    g === 'f'
  ) {
    return 'female';
  }

  if (
    g.includes('পুরুষ') ||
    g.includes('ছেলে') ||
    g.includes('ছাত্র') ||
    g.includes('বালক') ||
    g.includes('male') ||
    g.includes('boy') ||
    g === 'm'
  ) {
    return 'male';
  }

  return 'other';
}

export function normalizeSeatGradeKey(
  grade?: string
): '6th' | '7th' | '8th' | '9th' | '10th' | 'other' {
  const g = toAsciiDigits(grade || '')
    .toLowerCase()
    .trim();
  if (g === '10th' || g.includes('10') || g.includes('ten') || g.includes('দশম')) return '10th';
  if (g === '6th' || g.includes('6') || g.includes('six') || g.includes('ষষ্ঠ')) return '6th';
  if (g === '7th' || g.includes('7') || g.includes('seven') || g.includes('সপ্তম')) return '7th';
  if (g === '8th' || g.includes('8') || g.includes('eight') || g.includes('অষ্টম')) return '8th';
  if (g === '9th' || g.includes('9') || g.includes('nine') || g.includes('নবম')) return '9th';
  return 'other';
}

export function normalizeSeatGroupLabel(
  gradeKey: '6th' | '7th' | '8th' | '9th' | '10th' | 'other',
  group?: string,
  section?: string
): string {
  if (gradeKey === '6th' || gradeKey === '7th' || gradeKey === '8th') {
    return 'সাধারণ';
  }
  const combined = `${group || ''} ${section || ''}`.toLowerCase();
  if (combined.includes('বিজ্ঞান') || combined.includes('sci')) return 'বিজ্ঞান';
  if (
    combined.includes('মানবিক') ||
    combined.includes('hum') ||
    combined.includes('arts')
  ) {
    return 'মানবিক';
  }
  if (
    combined.includes('ব্যবসায়') ||
    combined.includes('ব্যবসায়') ||
    combined.includes('বাণিজ্য') ||
    combined.includes('com') ||
    combined.includes('bus')
  ) {
    return 'ব্যবসায় শিক্ষা';
  }
  return (group || '').trim() || 'সাধারণ';
}

export function formatSeatGradeShort(grade?: string): string {
  const key = normalizeSeatGradeKey(grade);
  const map: Record<string, string> = {
    '6th': '৬ষ্ঠ',
    '7th': '৭ম',
    '8th': '৮ম',
    '9th': '৯ম',
    '10th': '১০ম',
  };
  return map[key] || grade || 'অন্যান্য';
}

export function formatSeatGradeFull(grade?: string): string {
  const key = normalizeSeatGradeKey(grade);
  const map: Record<string, string> = {
    '6th': '৬ষ্ঠ শ্রেণি',
    '7th': '৭ম শ্রেণি',
    '8th': '৮ম শ্রেণি',
    '9th': '৯ম শ্রেণি',
    '10th': '১০ম শ্রেণি',
  };
  return map[key] || grade || 'অন্যান্য শ্রেণি';
}

export function formatGenderRuleBn(rule: ColumnGenderRule | NormalizedGender): string {
  if (rule === 'male') return 'ছাত্র';
  if (rule === 'female') return 'ছাত্রী';
  if (rule === 'any') return 'মিশ্র';
  return 'অনির্ধারিত';
}

export function getStudentClassBucketKey(
  student: Pick<Student, 'grade' | 'gradeBn' | 'group' | 'section' | 'branch'>
): string {
  const gradeKey = normalizeSeatGradeKey(student.grade || student.gradeBn);
  if (gradeKey === '9th' || gradeKey === '10th') {
    const grp = normalizeSeatGroupLabel(
      gradeKey,
      student.group,
      student.section || student.branch
    );
    return `${gradeKey}::${grp}`;
  }
  if (gradeKey === 'other') {
    return `other::${(student.grade || student.gradeBn || 'অন্যান্য').trim()}`;
  }
  return gradeKey;
}

export function extractNumericRoll(roll?: string): number | null {
  const ascii = toAsciiDigits(roll || '').trim();
  const match = ascii.match(/\d+/);
  if (!match) return null;
  const num = parseInt(match[0], 10);
  return Number.isNaN(num) ? null : num;
}

export function compareSeatRolls(
  a: Pick<Student, 'roll' | 'name'>,
  b: Pick<Student, 'roll' | 'name'>
): number {
  const na = extractNumericRoll(a.roll);
  const nb = extractNumericRoll(b.roll);
  if (na !== null && nb !== null && na !== nb) return na - nb;
  const sa = toAsciiDigits(a.roll || '');
  const sb = toAsciiDigits(b.roll || '');
  const cmp = sa.localeCompare(sb, undefined, { numeric: true });
  if (cmp !== 0) return cmp;
  return (a.name || '').localeCompare(b.name || '');
}

export function buildLiveClassGroups(students: Student[]): LiveClassGroupBucket[] {
  const standardSpecs: Array<{
    key: string;
    gradeKey: '6th' | '7th' | '8th' | '9th' | '10th';
    gradeLabelBn: string;
    groupLabelBn: string;
    shortBadge: string;
  }> = [
    { key: '6th', gradeKey: '6th', gradeLabelBn: '৬ষ্ঠ শ্রেণি', groupLabelBn: 'সাধারণ', shortBadge: '৬ষ্ঠ' },
    { key: '7th', gradeKey: '7th', gradeLabelBn: '৭ম শ্রেণি', groupLabelBn: 'সাধারণ', shortBadge: '৭ম' },
    { key: '8th', gradeKey: '8th', gradeLabelBn: '৮ম শ্রেণি', groupLabelBn: 'সাধারণ', shortBadge: '৮ম' },
    { key: '9th::বিজ্ঞান', gradeKey: '9th', gradeLabelBn: '৯ম শ্রেণি', groupLabelBn: 'বিজ্ঞান', shortBadge: '৯ম · বিজ্ঞান' },
    { key: '9th::মানবিক', gradeKey: '9th', gradeLabelBn: '৯ম শ্রেণি', groupLabelBn: 'মানবিক', shortBadge: '৯ম · মানবিক' },
    { key: '9th::ব্যবসায় শিক্ষা', gradeKey: '9th', gradeLabelBn: '৯ম শ্রেণি', groupLabelBn: 'ব্যবসায় শিক্ষা', shortBadge: '৯ম · ব্যবসায়' },
    { key: '10th::বিজ্ঞান', gradeKey: '10th', gradeLabelBn: '১০ম শ্রেণি', groupLabelBn: 'বিজ্ঞান', shortBadge: '১০ম · বিজ্ঞান' },
    { key: '10th::মানবিক', gradeKey: '10th', gradeLabelBn: '১০ম শ্রেণি', groupLabelBn: 'মানবিক', shortBadge: '১০ম · মানবিক' },
    { key: '10th::ব্যবসায় শিক্ষা', gradeKey: '10th', gradeLabelBn: '১০ম শ্রেণি', groupLabelBn: 'ব্যবসায় শিক্ষা', shortBadge: '১০ম · ব্যবসায়' },
  ];

  const bucketMap = new Map<string, LiveClassGroupBucket>();
  for (const spec of standardSpecs) {
    bucketMap.set(spec.key, {
      ...spec,
      students: [],
      boys: 0,
      girls: 0,
      other: 0,
      total: 0,
      sections: [],
    });
  }

  for (const st of students) {
    const key = getStudentClassBucketKey(st);
    let bucket = bucketMap.get(key);
    if (!bucket) {
      const gradeKey = normalizeSeatGradeKey(st.grade || st.gradeBn);
      const grp = normalizeSeatGroupLabel(gradeKey, st.group, st.section || st.branch);
      const gradeLabelBn = formatSeatGradeFull(st.grade || st.gradeBn);
      const shortBadge =
        gradeKey === '9th' || gradeKey === '10th'
          ? `${formatSeatGradeShort(gradeKey)} · ${grp}`
          : formatSeatGradeShort(st.grade || st.gradeBn);
      bucket = {
        key,
        gradeKey,
        gradeLabelBn,
        groupLabelBn: grp,
        shortBadge,
        students: [],
        boys: 0,
        girls: 0,
        other: 0,
        total: 0,
        sections: [],
      };
      bucketMap.set(key, bucket);
    }

    bucket.students.push(st);
    const g = normalizeSeatGender(st.gender);
    if (g === 'male') bucket.boys += 1;
    else if (g === 'female') bucket.girls += 1;
    else bucket.other += 1;
    bucket.total += 1;

    const sec = (st.section || st.branch || '').trim();
    if (sec && !bucket.sections.includes(sec)) {
      bucket.sections.push(sec);
    }
  }

  const results = Array.from(bucketMap.values());
  for (const b of results) {
    b.students.sort(compareSeatRolls);
    b.sections.sort();
  }
  return results;
}

export function filterStudentsByRollRange(
  students: Student[],
  rollFrom?: string,
  rollTo?: string
): Student[] {
  const fromNum = extractNumericRoll(rollFrom);
  const toNum = extractNumericRoll(rollTo);
  if (fromNum === null && toNum === null) return students;

  return students.filter((s) => {
    const r = extractNumericRoll(s.roll);
    if (r === null) return true;
    if (fromNum !== null && r < fromNum) return false;
    if (toNum !== null && r > toNum) return false;
    return true;
  });
}

export const COLUMN_GENDER_PRESETS: ColumnGenderPreset[] = [
  {
    id: 'one_boy_two_girls',
    label: '১ সারি ছাত্র + বাকি ছাত্রী',
    shortLabel: '১ ছাত্র + ২ ছাত্রী',
    description: 'প্রথম সারিতে ছাত্র এবং বাকি সারিগুলোতে ছাত্রী',
    recommendedCols: 3,
    build: (cols: number) =>
      cols <= 1
        ? ['male']
        : Array.from({ length: cols }, (_, i) => (i === 0 ? 'male' : 'female')),
  },
  {
    id: 'two_boys_one_girl',
    label: '২ সারি ছাত্র + ১ সারি ছাত্রী',
    shortLabel: '২ ছাত্র + ১ ছাত্রী',
    description: 'প্রথম সারিগুলোতে ছাত্র এবং শেষ সারিতে ছাত্রী',
    recommendedCols: 3,
    build: (cols: number) =>
      cols <= 1
        ? ['male']
        : Array.from({ length: cols }, (_, i) => (i < cols - 1 ? 'male' : 'female')),
  },
  {
    id: 'half_split',
    label: '১ সারি ছাত্র + ১ সারি ছাত্রী',
    shortLabel: 'অর্ধেক ছাত্র / ছাত্রী',
    description: 'বাম দিকের সারি ছাত্র ও ডান দিকের সারি ছাত্রী',
    recommendedCols: 2,
    build: (cols: number) =>
      cols <= 1
        ? ['any']
        : Array.from({ length: cols }, (_, i) => (i < Math.ceil(cols / 2) ? 'male' : 'female')),
  },
  {
    id: 'all_boys',
    label: 'সব সারি ছাত্র',
    shortLabel: 'সব ছাত্র',
    description: 'কক্ষের প্রতিটি সারিতে শুধু ছাত্র',
    build: (cols: number) => Array.from({ length: Math.max(1, cols) }, () => 'male'),
  },
  {
    id: 'all_girls',
    label: 'সব সারি ছাত্রী',
    shortLabel: 'সব ছাত্রী',
    description: 'কক্ষের প্রতিটি সারিতে শুধু ছাত্রী',
    build: (cols: number) => Array.from({ length: Math.max(1, cols) }, () => 'female'),
  },
  {
    id: 'all_any',
    label: 'সব সারি মিশ্র',
    shortLabel: 'সব মিশ্র',
    description: 'যেকোনো সারিতে ছাত্র-ছাত্রী একসাথে',
    build: (cols: number) => Array.from({ length: Math.max(1, cols) }, () => 'any'),
  },
];

export function getBenchesForColumn(room: ExamHallRoom, colZeroIdx: number): number {
  if (
    Array.isArray(room.benchesPerColumn) &&
    typeof room.benchesPerColumn[colZeroIdx] === 'number' &&
    room.benchesPerColumn[colZeroIdx] > 0
  ) {
    return room.benchesPerColumn[colZeroIdx];
  }
  return Math.max(1, room.rows || 1);
}

export function getRoomBenchCount(room: ExamHallRoom): number {
  const cols = Math.max(1, room.cols || 1);
  let total = 0;
  for (let c = 0; c < cols; c++) {
    total += getBenchesForColumn(room, c);
  }
  return total;
}

export function getRoomCapacity(room: ExamHallRoom): number {
  return getRoomBenchCount(room) * (room.seatsPerBench || 2);
}

export function getRoomColumnGenders(
  room: ExamHallRoom,
  globalRules?: ColumnGenderRule[]
): ColumnGenderRule[] {
  const cols = Math.max(1, room.cols || 1);
  const result: ColumnGenderRule[] = [];
  for (let c = 0; c < cols; c++) {
    const roomRule = room.columnGenders?.[c];
    const globalRule = globalRules?.[c];
    result.push(roomRule || globalRule || 'any');
  }
  return result;
}

export function buildBatchRooms(params: {
  count: number;
  startNo: number;
  building?: string;
  cols: number;
  rows: number;
  seatsPerBench: 1 | 2 | 3;
  columnGenders?: ColumnGenderRule[];
}): ExamHallRoom[] {
  const safeCount = Math.min(40, Math.max(1, Math.round(params.count || 1)));
  const safeStart = Math.max(1, Math.round(params.startNo || 101));
  const safeCols = Math.min(6, Math.max(1, Math.round(params.cols || 3)));
  const safeRows = Math.min(20, Math.max(1, Math.round(params.rows || 7)));
  const safeSeats: 1 | 2 | 3 =
    params.seatsPerBench === 1 || params.seatsPerBench === 3 ? params.seatsPerBench : 2;
  const building = (params.building || 'মূল ভবন').trim();
  const normalizedColGenders: ColumnGenderRule[] = Array.from(
    { length: safeCols },
    (_, idx) => params.columnGenders?.[idx] || 'any'
  );

  const list: ExamHallRoom[] = [];
  for (let i = 0; i < safeCount; i++) {
    const num = safeStart + i;
    const roomNoBn = toBanglaDigits(num);
    list.push({
      id: `room-gen-${num}-${i + 1}`,
      roomNo: roomNoBn,
      roomName: `কক্ষ নং ${roomNoBn}${building ? ` (${building})` : ''}`,
      building,
      rows: safeRows,
      cols: safeCols,
      seatsPerBench: safeSeats,
      columnGenders: [...normalizedColGenders],
      roomGender: 'any',
    });
  }
  return list;
}

export function calculateCapacityForecast(params: {
  students: Student[];
  rooms: ExamHallRoom[];
  genderMode: SeatGenderMode;
  globalColumnGenders?: ColumnGenderRule[];
  strictGenderOverflow?: boolean;
  templateRoom?: {
    cols: number;
    rows: number;
    seatsPerBench: 1 | 2 | 3;
    columnGenders?: ColumnGenderRule[];
  };
}): CapacityForecast {
  const strict = params.strictGenderOverflow !== false;
  let boysNeeded = 0;
  let girlsNeeded = 0;
  let otherNeeded = 0;

  for (const st of params.students) {
    const g = normalizeSeatGender(st.gender);
    if (g === 'male') boysNeeded += 1;
    else if (g === 'female') girlsNeeded += 1;
    else otherNeeded += 1;
  }

  if (params.genderMode === 'boys_only') {
    girlsNeeded = 0;
    otherNeeded = 0;
  } else if (params.genderMode === 'girls_only') {
    boysNeeded = 0;
    otherNeeded = 0;
  }

  const totalStudents = boysNeeded + girlsNeeded + otherNeeded;

  let maleSeats = 0;
  let femaleSeats = 0;
  let anySeats = 0;

  if (params.genderMode === 'separate_rooms') {
    // Explicit roomGender rooms first; unassigned 'any' rooms split to cover boys then girls
    const explicitMale = params.rooms.filter((r) => r.roomGender === 'male');
    const explicitFemale = params.rooms.filter((r) => r.roomGender === 'female');
    const flexRooms = params.rooms.filter((r) => !r.roomGender || r.roomGender === 'any');

    maleSeats = explicitMale.reduce((acc, r) => acc + getRoomCapacity(r), 0);
    femaleSeats = explicitFemale.reduce((acc, r) => acc + getRoomCapacity(r), 0);

    for (const r of flexRooms) {
      const cap = getRoomCapacity(r);
      const remBoys = Math.max(0, boysNeeded - maleSeats);
      const remGirls = Math.max(0, girlsNeeded - femaleSeats);
      if (remBoys > 0 && (remBoys >= remGirls || remGirls === 0)) {
        maleSeats += cap;
      } else if (remGirls > 0) {
        femaleSeats += cap;
      } else {
        anySeats += cap;
      }
    }
  } else {
    for (const room of params.rooms) {
      const cols = Math.max(1, room.cols || 1);
      const colRules = getRoomColumnGenders(room, params.globalColumnGenders);
      for (let c = 0; c < cols; c++) {
        const cap = getBenchesForColumn(room, c) * (room.seatsPerBench || 2);
        if (params.genderMode === 'boys_only') {
          maleSeats += cap;
        } else if (params.genderMode === 'girls_only') {
          femaleSeats += cap;
        } else if (params.genderMode === 'combined') {
          anySeats += cap;
        } else {
          // column_split
          const rule = colRules[c] || 'any';
          if (rule === 'male') maleSeats += cap;
          else if (rule === 'female') femaleSeats += cap;
          else anySeats += cap;
        }
      }
    }
  }

  const totalSeats = maleSeats + femaleSeats + anySeats;

  let shortfallBoys = Math.max(0, boysNeeded - maleSeats);
  let shortfallGirls = Math.max(0, girlsNeeded - femaleSeats);
  let shortfallOther = otherNeeded;

  let freeAny = anySeats;
  if (!strict) {
    // Allow spare opposite-gender seats to act as overflow
    freeAny += Math.max(0, maleSeats - boysNeeded) + Math.max(0, femaleSeats - girlsNeeded);
  }

  const coverBoys = Math.min(shortfallBoys, freeAny);
  shortfallBoys -= coverBoys;
  freeAny -= coverBoys;

  const coverGirls = Math.min(shortfallGirls, freeAny);
  shortfallGirls -= coverGirls;
  freeAny -= coverGirls;

  const coverOther = Math.min(shortfallOther, freeAny);
  shortfallOther -= coverOther;
  freeAny -= coverOther;

  const shortfallTotal = shortfallBoys + shortfallGirls + shortfallOther;

  // Recommended room count based on templateRoom or first selected room
  const refCols = Math.max(1, params.templateRoom?.cols || params.rooms[0]?.cols || 3);
  const refRows = Math.max(1, params.templateRoom?.rows || params.rooms[0]?.rows || 7);
  const refSeats = params.templateRoom?.seatsPerBench || params.rooms[0]?.seatsPerBench || 2;
  const perColCap = refRows * refSeats;
  const perRoomCap = refCols * perColCap;

  let recommendedRoomCount = 1;
  if (totalStudents === 0) {
    recommendedRoomCount = Math.max(1, params.rooms.length || 1);
  } else if (params.genderMode === 'separate_rooms') {
    const boyRooms = boysNeeded > 0 ? Math.ceil(boysNeeded / perRoomCap) : 0;
    const girlRooms = girlsNeeded > 0 ? Math.ceil(girlsNeeded / perRoomCap) : 0;
    const otherRooms = otherNeeded > 0 ? Math.ceil(otherNeeded / perRoomCap) : 0;
    recommendedRoomCount = Math.max(1, boyRooms + girlRooms + otherRooms);
  } else if (params.genderMode === 'column_split') {
    const rules =
      params.templateRoom?.columnGenders ||
      params.globalColumnGenders ||
      Array.from({ length: refCols }, () => 'any' as ColumnGenderRule);
    const mCols = rules.slice(0, refCols).filter((r) => r === 'male').length;
    const fCols = rules.slice(0, refCols).filter((r) => r === 'female').length;
    const aCols = Math.max(0, refCols - mCols - fCols);

    const mPerRoom = (mCols + aCols) * perColCap;
    const fPerRoom = (fCols + aCols) * perColCap;

    const rForBoys =
      boysNeeded > 0 ? (mPerRoom > 0 ? Math.ceil(boysNeeded / mPerRoom) : Math.ceil(boysNeeded / perRoomCap)) : 0;
    const rForGirls =
      girlsNeeded > 0 ? (fPerRoom > 0 ? Math.ceil(girlsNeeded / fPerRoom) : Math.ceil(girlsNeeded / perRoomCap)) : 0;
    const rForTotal = Math.ceil(totalStudents / perRoomCap);
    recommendedRoomCount = Math.max(1, rForBoys, rForGirls, rForTotal);
  } else {
    recommendedRoomCount = Math.max(1, Math.ceil(totalStudents / perRoomCap));
  }

  return {
    totalStudents,
    boysNeeded,
    girlsNeeded,
    otherNeeded,
    totalSeats,
    maleSeats,
    femaleSeats,
    anySeats,
    shortfallBoys,
    shortfallGirls,
    shortfallOther,
    shortfallTotal,
    recommendedRoomCount,
  };
}

export function formatRollRangesBn(rolls: string[]): string {
  if (rolls.length === 0) return '—';
  const numericList: number[] = [];
  const textList: string[] = [];

  for (const r of rolls) {
    const num = extractNumericRoll(r);
    if (num !== null) numericList.push(num);
    else if (r.trim()) textList.push(r.trim());
  }

  const uniqueNums = Array.from(new Set(numericList)).sort((a, b) => a - b);
  const segments: string[] = [];

  let i = 0;
  while (i < uniqueNums.length) {
    const start = uniqueNums[i];
    let end = start;
    while (i + 1 < uniqueNums.length && uniqueNums[i + 1] === end + 1) {
      i += 1;
      end = uniqueNums[i];
    }
    if (start === end) {
      segments.push(toBanglaDigits(start));
    } else {
      segments.push(`${toBanglaDigits(start)}–${toBanglaDigits(end)}`);
    }
    i += 1;
  }

  const uniqueTexts = Array.from(new Set(textList));
  return [...segments, ...uniqueTexts].join(', ');
}

export function buildRoomDoorSummaries(
  entries: SeatPlanEntry[],
  rooms: ExamHallRoom[],
  studentGenderById?: Map<string, NormalizedGender>,
  globalColumnGenders?: ColumnGenderRule[]
): RoomDoorSummary[] {
  const roomMap = new Map<string, ExamHallRoom>();
  rooms.forEach((r) => roomMap.set(r.id, r));

  const grouped = new Map<string, SeatPlanEntry[]>();
  for (const e of entries) {
    if (!grouped.has(e.roomId)) grouped.set(e.roomId, []);
    grouped.get(e.roomId)!.push(e);
  }

  const summaries: RoomDoorSummary[] = [];

  grouped.forEach((roomEntries, roomId) => {
    const meta = roomMap.get(roomId);
    const cols = Math.max(
      1,
      meta?.cols || Math.max(...roomEntries.map((e) => e.colIndex || 1), 1)
    );
    const rows = Math.max(
      1,
      meta?.rows || Math.max(...roomEntries.map((e) => e.rowIndex || 1), 1)
    );
    const seatsPerBench: 1 | 2 | 3 = meta?.seatsPerBench || 2;
    const capacity = meta ? getRoomCapacity(meta) : cols * rows * seatsPerBench;
    const colRules = meta
      ? getRoomColumnGenders(meta, globalColumnGenders)
      : Array.from({ length: cols }, (_, idx) => globalColumnGenders?.[idx] || 'any');

    let boys = 0;
    let girls = 0;
    let other = 0;

    const colBuckets: RoomColumnSummary[] = Array.from({ length: cols }, (_, idx) => {
      const benches = meta ? getBenchesForColumn(meta, idx) : rows;
      return {
        colIndex: idx + 1,
        rule: colRules[idx] || 'any',
        benches,
        capacity: benches * seatsPerBench,
        boys: 0,
        girls: 0,
        other: 0,
        total: 0,
      };
    });

    const classMap = new Map<
      string,
      {
        classKey: string;
        gradeLabel: string;
        groupLabel: string;
        shortBadge: string;
        rolls: string[];
        boys: number;
        girls: number;
      }
    >();

    for (const e of roomEntries) {
      const g: NormalizedGender =
        e.gender || studentGenderById?.get(e.studentId) || 'other';
      if (g === 'male') boys += 1;
      else if (g === 'female') girls += 1;
      else other += 1;

      const cIdx = Math.min(cols - 1, Math.max(0, (e.colIndex || 1) - 1));
      const colB = colBuckets[cIdx];
      if (colB) {
        colB.total += 1;
        if (g === 'male') colB.boys += 1;
        else if (g === 'female') colB.girls += 1;
        else colB.other += 1;
      }

      const gradeKey = normalizeSeatGradeKey(e.grade);
      const groupLabel = normalizeSeatGroupLabel(gradeKey, e.group, e.section);
      const classKey =
        gradeKey === '9th' || gradeKey === '10th'
          ? `${gradeKey}::${groupLabel}`
          : gradeKey;
      const gradeLabel = formatSeatGradeFull(e.grade);
      const shortBadge =
        gradeKey === '9th' || gradeKey === '10th'
          ? `${formatSeatGradeShort(gradeKey)} (${groupLabel})`
          : formatSeatGradeShort(e.grade);

      if (!classMap.has(classKey)) {
        classMap.set(classKey, {
          classKey,
          gradeLabel,
          groupLabel,
          shortBadge,
          rolls: [],
          boys: 0,
          girls: 0,
        });
      }
      const cEntry = classMap.get(classKey)!;
      cEntry.rolls.push(e.roll);
      if (g === 'male') cEntry.boys += 1;
      else if (g === 'female') cEntry.girls += 1;
    }

    const classRanges: RoomClassRollRange[] = Array.from(classMap.values()).map((c) => ({
      classKey: c.classKey,
      gradeLabel: c.gradeLabel,
      groupLabel: c.groupLabel,
      shortBadge: c.shortBadge,
      rolls: c.rolls,
      rollRangeLabel: formatRollRangesBn(c.rolls),
      count: c.rolls.length,
      boys: c.boys,
      girls: c.girls,
    }));

    summaries.push({
      roomId,
      roomNo: roomEntries[0]?.roomNo || meta?.roomNo || roomId,
      roomName: roomEntries[0]?.roomName || meta?.roomName || roomId,
      building: meta?.building,
      cols,
      rows,
      seatsPerBench,
      capacity,
      totalAssigned: roomEntries.length,
      boys,
      girls,
      other,
      columnSummary: colBuckets,
      classRanges,
    });
  });

  return summaries;
}

export function exportSeatPlanToExcel(params: {
  examTitle: string;
  schoolName: string;
  entries: SeatPlanEntry[];
  summaries: RoomDoorSummary[];
  studentGenderById?: Map<string, NormalizedGender>;
}): void {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Room Door Summary
  const summaryRows = params.summaries.map((rm, idx) => ({
    'ক্রমিক': idx + 1,
    'কক্ষ নং': rm.roomNo,
    'কক্ষের নাম': rm.roomName,
    'মোট আসন': rm.capacity,
    'মোট পরীক্ষার্থী': rm.totalAssigned,
    'ছাত্র': rm.boys,
    'ছাত্রী': rm.girls,
    'সারি বিন্যাস': rm.columnSummary
      .map((c) => `সারি ${toBanglaDigits(c.colIndex)}: ${formatGenderRuleBn(c.rule)} (${c.total})`)
      .join(' | '),
    'শ্রেণি ও রোল রেঞ্জ': rm.classRanges
      .map((cr) => `${cr.shortBadge}: রোল ${cr.rollRangeLabel} (${cr.count} জন)`)
      .join('; '),
  }));

  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'কক্ষভিত্তিক সারসংক্ষেপ');

  // Sheet 2: Full Seat Assignment List
  const seatRows = params.entries.map((s, idx) => {
    const g = s.gender || params.studentGenderById?.get(s.studentId) || 'other';
    return {
      'ক্রমিক': idx + 1,
      'কক্ষ নং': s.roomNo,
      'কক্ষের নাম': s.roomName,
      'সারি (Column)': s.colIndex,
      'বেঞ্চ নং': s.benchNo,
      'আসন (L/M/R)': s.seatPosition,
      'রোল': s.roll,
      'শিক্ষার্থীর নাম': s.studentName,
      'শ্রেণি': formatSeatGradeFull(s.grade),
      'বিভাগ': s.group || 'সাধারণ',
      'শাখা': s.section || 'A',
      'লিঙ্গ': formatGenderRuleBn(g),
    };
  });

  const wsSeats = XLSX.utils.json_to_sheet(seatRows);
  XLSX.utils.book_append_sheet(wb, wsSeats, 'সম্পূর্ণ আসন তালিকা');

  // Sheet 3: Column Matrix Breakdown
  const colRows: Array<Record<string, string | number>> = [];
  params.summaries.forEach((rm) => {
    rm.columnSummary.forEach((col) => {
      colRows.push({
        'কক্ষ নং': rm.roomNo,
        'কক্ষের নাম': rm.roomName,
        'সারি নং': `সারি ${toBanglaDigits(col.colIndex)}`,
        'সারির ধরন': formatGenderRuleBn(col.rule),
        'বেঞ্চ সংখ্যা': col.benches,
        'আসন ধারণক্ষমতা': col.capacity,
        'বরাদ্দকৃত ছাত্র': col.boys,
        'বরাদ্দকৃত ছাত্রী': col.girls,
        'মোট বরাদ্দকৃত': col.total,
      });
    });
  });

  const wsCols = XLSX.utils.json_to_sheet(colRows);
  XLSX.utils.book_append_sheet(wb, wsCols, 'সারিভিত্তিক বিবরণ');

  const safeFile = `Seat_Plan_${params.examTitle.replace(/[^\w\u0980-\u09FF-]+/g, '_')}.xlsx`;
  XLSX.writeFile(wb, safeFile);
}
