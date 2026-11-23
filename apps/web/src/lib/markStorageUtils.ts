import { ReligionType, getReligionSubjectKeys } from '@/lib/religionUtils';

export interface RetrievedMark {
  cq: number;
  mcq: number;
  practical: number;
  ca: number;
  total: number;
  hasMarks: boolean;
}

// ══════════════════════════════════════════════════════════════════════════════
// 📚 COMPREHENSIVE SUBJECT SYNONYMS & ALIAS DICTIONARY
// Fully distinct mappings for Compulsory, Science, Humanities, and Commerce
// ══════════════════════════════════════════════════════════════════════════════

export const SUBJECT_SYNONYMS: Record<string, { names: string[]; codes: string[] }> = {
  // Social Science / বাংলাদেশ ও বিশ্বপরিচয় (Science & 6-8) / ইতিহাস ও সামাজিক বিজ্ঞান (6-8)
  bgs: {
    names: [
      'বাংলাদেশ ও বিশ্বপরিচয়',
      'বাংলাদেশ ও বিশ্বপরিচয়',
      'বাংলাদেশ ও বিশ্ব পরিচয়',
      'Bangladesh and Global Studies',
      'ইতিহাস ও সামাজিক বিজ্ঞান',
      'সমাজ',
      'সামাজিক বিজ্ঞান'
    ],
    codes: ['150', 'BGS-150', 'BGS-606', 'BGS-706', 'BGS-806', 'HIS-606', 'HIS-706', 'HIS-806', 'BGS-604', 'BGS-704', 'BGS-804', 'BGS-106']
  },

  // Civics / পৌরনীতি ও নাগরিকতা (Humanities)
  civics: {
    names: ['পৌরনীতি ও নাগরিকতা', 'পৌরনীতি', 'Civics & Citizenship', 'Civics'],
    codes: ['140', 'CIV-140', 'CIV-112', 'CIV-901', 'CIV-1001']
  },

  // History / বাংলাদেশের ইতিহাস ও বিশ্বসভ্যতা (Humanities)
  history: {
    names: ['বাংলাদেশের ইতিহাস ও বিশ্বসভ্যতা', 'ইতিহাস ও বিশ্বসভ্যতা', 'ইতিহাস', 'History of Bangladesh & World Civilization'],
    codes: ['153', 'HIS-153', 'HIS-901', 'HIS-1001']
  },

  // Geography / ভূগোল ও পরিবেশ (Humanities)
  geography: {
    names: ['ভূগোল ও পরিবেশ', 'ভূগোল', 'Geography & Environment'],
    codes: ['110', 'GEO-110', 'GEO-901', 'GEO-1001']
  },

  // Economics / অর্থনীতি (Humanities & Commerce)
  economics: {
    names: ['অর্থনীতি', 'Economics'],
    codes: ['141', 'ECO-141', 'ECO-141-COM']
  },

  // Physics / পদার্থবিজ্ঞান (Science)
  physics: {
    names: ['পদার্থবিজ্ঞান', 'পদার্থ বিজ্ঞান', 'পদার্থ', 'Physics'],
    codes: ['136', 'PHY-136']
  },

  // Chemistry / রসায়ন (Science)
  chemistry: {
    names: ['রসায়ন', 'রসায়ন', 'Chemistry'],
    codes: ['137', 'CHE-137']
  },

  // Biology / জীববিজ্ঞান (Science)
  biology: {
    names: ['জীববিজ্ঞান', 'জীব বিজ্ঞান', 'Biology'],
    codes: ['138', 'BIO-138']
  },

  // Higher Mathematics / উচ্চতর গণিত (Science 4th)
  higherMath: {
    names: ['উচ্চতর গণিত', 'উচ্চতর', 'Higher Mathematics'],
    codes: ['126', 'HMT-126']
  },

  // Accounting / হিসাববিজ্ঞান (Commerce)
  accounting: {
    names: ['হিসাববিজ্ঞান', 'হিসাব বিজ্ঞান', 'Accounting'],
    codes: ['146', 'ACC-146']
  },

  // Business Entrepreneurship / ব্যবসায় উদ্যোগ (Commerce)
  business: {
    names: ['ব্যবসায় উদ্যোগ', 'ব্যবসা উদ্যোগ', 'ব্যবসায় উদ্যোগ', 'Business Entrepreneurship'],
    codes: ['143', 'BUS-143', 'BUS-147']
  },

  // Finance & Banking / ফিন্যান্স ও ব্যাংকিং (Commerce)
  finance: {
    names: ['ফিন্যান্স ও ব্যাংকিং', 'ফিন্যান্স', 'ব্যাংকিং', 'Finance & Banking'],
    codes: ['152', 'FIN-152']
  },

  // Agriculture / কৃষি শিক্ষা
  agriculture: {
    names: ['কৃষি শিক্ষা', 'কৃষি', 'কৃষি শিক্ষা (৪র্থ বিষয়)', 'Agriculture Studies'],
    codes: ['134', 'AGR-134', 'AGR-139', 'AGR-607', 'AGR-707', 'AGR-807', 'AGR-134-SCI', 'AGR-134-HUM', 'AGR-134-COM']
  },

  // Home Science / গার্হস্থ্য বিজ্ঞান
  homeScience: {
    names: ['গার্হস্থ্য বিজ্ঞান', 'গার্হস্থ্য', 'গার্হস্থ্য অর্থনীতি', 'Home Science'],
    codes: ['151', 'HMS-151', 'HMS-140', 'HMS-601', 'HMS-701', 'HMS-801']
  },

  // ICT / Digital Technology
  ict: {
    names: ['ডিজিটাল প্রযুক্তি', 'তথ্য ও যোগাযোগ প্রযুক্তি', 'আইসিটি', 'ICT', 'Digital Technology'],
    codes: ['154', 'ICT-154', 'ICT-605', 'ICT-705', 'ICT-805']
  },

  // General Science / বিজ্ঞান (6-8 & 9-10 Humanities/Commerce)
  science: {
    names: ['বিজ্ঞান', 'সাধারণ বিজ্ঞান', 'Science'],
    codes: ['127', 'GSCI-127', 'SCI-127', 'SCI-113', 'SCI-604', 'SCI-704', 'SCI-804']
  },

  // General Math / গণিত
  math: {
    names: ['গণিত', 'সাধারণ গণিত', 'Mathematics', 'Math'],
    codes: ['109', 'MAT-109', 'MAT-603', 'MAT-703', 'MAT-803']
  },

  // Bangla 1st / বাংলা ১ম পত্র
  bangla1: {
    names: ['বাংলা ১ম পত্র', 'বাংলা ১ম', 'Bangla 1st Paper'],
    codes: ['101', 'BAN-101', 'BAN-601', 'BAN-701', 'BAN-801']
  },

  // Bangla 2nd / বাংলা ২য় পত্র
  bangla2: {
    names: ['বাংলা ২য় পত্র', 'বাংলা ২য় পত্র', 'বাংলা ২য়', 'বাংলা ২য়', 'Bangla 2nd Paper'],
    codes: ['102', 'BAN-102', 'BAN-602', 'BAN-702', 'BAN-802']
  },

  // English 1st / ইংরেজি ১ম পত্র
  english1: {
    names: ['ইংরেজি ১ম পত্র', 'ইংরেজি ১ম', 'English 1st Paper'],
    codes: ['107', 'ENG-107', 'ENG-601', 'ENG-701', 'ENG-801']
  },

  // English 2nd / ইংরেজি ২য় পত্র
  english2: {
    names: ['ইংরেজি ২য় পত্র', 'ইংরেজি ২য় পত্র', 'ইংরেজি ২য়', 'English 2nd Paper'],
    codes: ['108', 'ENG-108', 'ENG-602', 'ENG-702', 'ENG-802']
  },

  // Islam & Moral Education / ইসলাম ও নৈতিক শিক্ষা
  islam: {
    names: ['ইসলাম ও নৈতিক শিক্ষা', 'ইসলাম শিক্ষা', 'ইসলামিক শিক্ষা', 'Islam & Moral Education', 'ধর্ম ও নৈতিক শিক্ষা'],
    codes: ['111', 'REL-111', 'REL-610', 'REL-710', 'REL-810']
  },

  // Hindu Religion & Moral Education / হিন্দুধর্ম ও নৈতিক শিক্ষা
  hindu: {
    names: ['হিন্দুধর্ম ও নৈতিক শিক্ষা', 'হিন্দু ধর্ম', 'হিন্দুধর্ম', 'সনাতন ধর্ম', 'Hindu Religion & Moral Education', 'Hinduism & Moral Education'],
    codes: ['112', 'REL-112']
  },

  // Buddhist Religion / বৌদ্ধধর্ম ও নৈতিক শিক্ষা
  buddhist: {
    names: ['বৌদ্ধধর্ম ও নৈতিক শিক্ষা', 'বৌদ্ধ ধর্ম', 'Buddhist Religion & Moral Education'],
    codes: ['113', 'REL-113']
  },

  // Christian Religion / খ্রিষ্টধর্ম ও নৈতিক শিক্ষা
  christian: {
    names: ['খ্রিষ্টধর্ম ও নৈতিক শিক্ষা', 'খ্রিস্টান ধর্ম', 'খ্রিস্টান ধর্ম ও নৈতিক শিক্ষা', 'Christian Religion & Moral Education'],
    codes: ['114', 'REL-114']
  }
};

/**
 * Returns all possible synonyms, names, and codes for a given subject query.
 */
export function getAllSubjectAliases(subjectQuery: string): { names: string[]; codes: string[] } {
  const q = (subjectQuery || '').trim().toLowerCase();
  const names = new Set<string>([subjectQuery]);
  const codes = new Set<string>();

  // Check against dictionary (by Bangla, English, or exact NCTB / legacy code)
  if (q === '140' || q.includes('পৌরনীতি') || q.includes('civ')) {
    SUBJECT_SYNONYMS.civics.names.forEach(n => names.add(n));
    SUBJECT_SYNONYMS.civics.codes.forEach(c => codes.add(c));
  } else if (q === '153' || q.includes('ইতিহাস ও বিশ্বসভ্যতা') || q.includes('his-153') || q.includes('history of bangladesh') || (q.includes('ইতিহাস') && !q.includes('সামাজিক'))) {
    SUBJECT_SYNONYMS.history.names.forEach(n => names.add(n));
    SUBJECT_SYNONYMS.history.codes.forEach(c => codes.add(c));
  } else if (q === '110' || q.includes('ভূগোল') || q.includes('geo')) {
    SUBJECT_SYNONYMS.geography.names.forEach(n => names.add(n));
    SUBJECT_SYNONYMS.geography.codes.forEach(c => codes.add(c));
  } else if (q === '141' || q.includes('অর্থনীতি') || q.includes('eco')) {
    SUBJECT_SYNONYMS.economics.names.forEach(n => names.add(n));
    SUBJECT_SYNONYMS.economics.codes.forEach(c => codes.add(c));
  } else if (q === '150' || q.includes('সমাজ') || q.includes('বিশ্বপরিচ') || q.includes('bgs') || q.includes('his-606') || q.includes('his-706') || q.includes('his-806') || q.includes('global studies') || (q.includes('ইতিহাস') && q.includes('সামাজিক'))) {
    SUBJECT_SYNONYMS.bgs.names.forEach(n => names.add(n));
    SUBJECT_SYNONYMS.bgs.codes.forEach(c => codes.add(c));
  }

  if (q === '136' || q.includes('পদার্থ') || q.includes('phy')) {
    SUBJECT_SYNONYMS.physics.names.forEach(n => names.add(n));
    SUBJECT_SYNONYMS.physics.codes.forEach(c => codes.add(c));
  }
  if (q === '137' || q.includes('রসায়ন') || q.includes('রসায়ন') || q.includes('che')) {
    SUBJECT_SYNONYMS.chemistry.names.forEach(n => names.add(n));
    SUBJECT_SYNONYMS.chemistry.codes.forEach(c => codes.add(c));
  }
  if (q === '146' || q.includes('হিসাব') || q.includes('acc')) {
    SUBJECT_SYNONYMS.accounting.names.forEach(n => names.add(n));
    SUBJECT_SYNONYMS.accounting.codes.forEach(c => codes.add(c));
  }
  if (q === '143' || q.includes('উদ্যোগ') || q.includes('bus')) {
    SUBJECT_SYNONYMS.business.names.forEach(n => names.add(n));
    SUBJECT_SYNONYMS.business.codes.forEach(c => codes.add(c));
  }
  if (q === '152' || q.includes('ফিন্যান্স') || q.includes('fin')) {
    SUBJECT_SYNONYMS.finance.names.forEach(n => names.add(n));
    SUBJECT_SYNONYMS.finance.codes.forEach(c => codes.add(c));
  }
  if (q === '134' || q.includes('কৃষি') || q.includes('agr')) {
    SUBJECT_SYNONYMS.agriculture.names.forEach(n => names.add(n));
    SUBJECT_SYNONYMS.agriculture.codes.forEach(c => codes.add(c));
  }
  if (q === '151' || q.includes('গার্হস্থ্য') || q.includes('hms') || q.includes('home science')) {
    SUBJECT_SYNONYMS.homeScience.names.forEach(n => names.add(n));
    SUBJECT_SYNONYMS.homeScience.codes.forEach(c => codes.add(c));
  }
  if (q === '126' || q.includes('উচ্চতর') || q.includes('hmt') || q.includes('higher math')) {
    SUBJECT_SYNONYMS.higherMath.names.forEach(n => names.add(n));
    SUBJECT_SYNONYMS.higherMath.codes.forEach(c => codes.add(c));
  }
  if (q === '138' || q.includes('জীববিজ্ঞান') || q.includes('জীব বিজ্ঞান') || q.includes('bio')) {
    SUBJECT_SYNONYMS.biology.names.forEach(n => names.add(n));
    SUBJECT_SYNONYMS.biology.codes.forEach(c => codes.add(c));
  }
  if (q === '154' || q.includes('ict') || q.includes('ডিজিটাল') || q.includes('তথ্য') || q.includes('কম্পিউটার') || q.includes('digital tech')) {
    SUBJECT_SYNONYMS.ict.names.forEach(n => names.add(n));
    SUBJECT_SYNONYMS.ict.codes.forEach(c => codes.add(c));
  }
  if (q === '101' || q.includes('বাংলা ১ম') || q.includes('bangla 1st') || q.includes('ban-101') || q.includes('ban-601') || q.includes('ban-701') || q.includes('ban-801')) {
    SUBJECT_SYNONYMS.bangla1.names.forEach(n => names.add(n));
    SUBJECT_SYNONYMS.bangla1.codes.forEach(c => codes.add(c));
  }
  if (q === '102' || q.includes('বাংলা ২') || q.includes('bangla 2nd') || q.includes('ban-102') || q.includes('ban-602') || q.includes('ban-702') || q.includes('ban-802')) {
    SUBJECT_SYNONYMS.bangla2.names.forEach(n => names.add(n));
    SUBJECT_SYNONYMS.bangla2.codes.forEach(c => codes.add(c));
  }
  if (q === '107' || q.includes('ইংরেজি ১ম') || q.includes('english 1st') || q.includes('eng-107') || q.includes('eng-601') || q.includes('eng-701') || q.includes('eng-801')) {
    SUBJECT_SYNONYMS.english1.names.forEach(n => names.add(n));
    SUBJECT_SYNONYMS.english1.codes.forEach(c => codes.add(c));
  }
  if (q === '108' || q.includes('ইংরেজি ২') || q.includes('english 2nd') || q.includes('eng-108') || q.includes('eng-602') || q.includes('eng-702') || q.includes('eng-802')) {
    SUBJECT_SYNONYMS.english2.names.forEach(n => names.add(n));
    SUBJECT_SYNONYMS.english2.codes.forEach(c => codes.add(c));
  }
  if (q === '109' || ((q.includes('গণিত') || q.includes('mat')) && !q.includes('উচ্চতর') && !q.includes('higher'))) {
    SUBJECT_SYNONYMS.math.names.forEach(n => names.add(n));
    SUBJECT_SYNONYMS.math.codes.forEach(c => codes.add(c));
  }
  if (q === '127' || ((q.includes('বিজ্ঞান') || q.includes('science') || q.includes('sci')) && !q.includes('গার্হস্থ্য') && !q.includes('জীববিজ্ঞান') && !q.includes('সামাজিক') && !q.includes('উচ্চতর') && !q.includes('home'))) {
    SUBJECT_SYNONYMS.science.names.forEach(n => names.add(n));
    SUBJECT_SYNONYMS.science.codes.forEach(c => codes.add(c));
  }
  if (q === '112' || q === 'rel-112' || q.includes('হিন্দু') || q.includes('সনাতন') || q.includes('hindu')) {
    SUBJECT_SYNONYMS.hindu.names.forEach(n => names.add(n));
    SUBJECT_SYNONYMS.hindu.codes.forEach(c => codes.add(c));
  } else if (q === '113' || q === 'rel-113' || q.includes('বৌদ্ধ') || q.includes('buddhist')) {
    SUBJECT_SYNONYMS.buddhist.names.forEach(n => names.add(n));
    SUBJECT_SYNONYMS.buddhist.codes.forEach(c => codes.add(c));
  } else if (q === '114' || q === 'rel-114' || q.includes('খ্রিস্ট') || q.includes('খ্রিষ্ট') || q.includes('christian')) {
    SUBJECT_SYNONYMS.christian.names.forEach(n => names.add(n));
    SUBJECT_SYNONYMS.christian.codes.forEach(c => codes.add(c));
  } else if (q === '111' || q.startsWith('rel-') || q.includes('ইসলাম') || q.includes('islam') || q.includes('ধর্ম')) {
    SUBJECT_SYNONYMS.islam.names.forEach(n => names.add(n));
    SUBJECT_SYNONYMS.islam.codes.forEach(c => codes.add(c));
  }

  return {
    names: Array.from(names),
    codes: Array.from(codes)
  };
}

// ─── HIGH-SPEED IN-MEMORY MARKS INDEX CACHE (ELIMINATES O(N*S*1300) FREEZE) ──

interface IndexedMarkSheet {
  raw: string;
  byId: Map<string, RetrievedMark>;
  byRoll: Map<string, RetrievedMark>;
  byName: Map<string, RetrievedMark>;
}

interface TurnMarksKeySnapshot {
  storageRef: Storage;
  storageLength: number;
  firstKey: string | null;
  lastKey: string | null;
  marksKeySet: Set<string>;
  marksKeys: string[];
  /** Caches exact ordered matching `sms_marks_*` keys per (exam|grade|branch|group|subject|religion) */
  subjectKeysCache: Map<string, string[]>;
}

const parsedSheetCache = new Map<string, IndexedMarkSheet>();
const MAX_PARSED_SHEET_CACHE = 320;
let activeTurnSnapshot: TurnMarksKeySnapshot | null = null;
let turnClearScheduled = false;

if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('storage', (e) => {
    if (!e.key || e.key.startsWith('sms_marks_')) {
      invalidateMarkStorageCache();
    }
  });
}

/**
 * Explicitly clears the in-memory marks index cache (called automatically every microtask
 * and whenever `localStorage` length or boundary keys change).
 */
export function invalidateMarkStorageCache(): void {
  activeTurnSnapshot = null;
  parsedSheetCache.clear();
}

function toAsciiRollDigits(raw: string): string {
  return String(raw || '').replace(/[০-৯]/g, (d) => '0123456789'['০১২৩৪৫৬৭৮৯'.indexOf(d)]);
}

function normalizeRollKeyVariants(rawRoll: string): string[] {
  const trimmed = String(rawRoll || '').trim();
  const ascii = toAsciiRollDigits(trimmed);
  const digitsOnly = ascii.replace(/\D/g, '');
  const set = new Set<string>();
  if (trimmed) set.add(trimmed);
  if (ascii) set.add(ascii);
  if (digitsOnly) {
    const num = parseInt(digitsOnly, 10);
    if (Number.isFinite(num)) {
      const s = String(num);
      set.add(s);
      set.add(s.padStart(2, '0'));
      set.add(s.padStart(3, '0'));
    }
  }
  return Array.from(set);
}

function supportsStorageEnumeration(): boolean {
  return (
    typeof localStorage !== 'undefined' &&
    typeof localStorage.length === 'number' &&
    typeof localStorage.key === 'function'
  );
}

function getTurnMarksKeySnapshot(): TurnMarksKeySnapshot | null {
  if (!supportsStorageEnumeration()) return null;

  const len = localStorage.length;
  const firstKey = len > 0 ? localStorage.key(0) : null;
  const lastKey = len > 0 ? localStorage.key(len - 1) : null;

  if (
    activeTurnSnapshot &&
    activeTurnSnapshot.storageRef === localStorage &&
    activeTurnSnapshot.storageLength === len &&
    activeTurnSnapshot.firstKey === firstKey &&
    activeTurnSnapshot.lastKey === lastKey
  ) {
    return activeTurnSnapshot;
  }

  const marksKeySet = new Set<string>();
  const marksKeys: string[] = [];
  for (let i = 0; i < len; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('sms_marks_')) {
      marksKeySet.add(k);
      marksKeys.push(k);
    }
  }

  activeTurnSnapshot = {
    storageRef: localStorage,
    storageLength: len,
    firstKey,
    lastKey,
    marksKeySet,
    marksKeys,
    subjectKeysCache: new Map<string, string[]>(),
  };

  if (!turnClearScheduled) {
    turnClearScheduled = true;
    Promise.resolve().then(() => {
      activeTurnSnapshot = null;
      turnClearScheduled = false;
    });
  }

  return activeTurnSnapshot;
}

function extractRetrievedMark(entry: unknown): RetrievedMark | null {
  if (entry === null || entry === undefined) return null;
  if (typeof entry === 'number') {
    return { cq: entry, mcq: 0, practical: 0, ca: 0, total: entry, hasMarks: true };
  }
  if (typeof entry !== 'object') return null;
  const obj = entry as Record<string, unknown>;
  if (
    obj.cq !== undefined ||
    obj.written !== undefined ||
    obj.mcq !== undefined ||
    obj.practical !== undefined ||
    obj.ca !== undefined ||
    obj.total !== undefined
  ) {
    const cq = Number(obj.cq !== undefined ? obj.cq : obj.written || 0);
    const mcq = Number(obj.mcq || 0);
    const practical = Number(obj.practical || 0);
    const ca = Number(obj.ca || 0);
    const total = obj.total !== undefined ? Number(obj.total) : cq + mcq + practical + ca;
    return { cq, mcq, practical, ca, total, hasMarks: true };
  }
  return null;
}

function getIndexedMarkSheet(key: string): IndexedMarkSheet | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;

  const cached = parsedSheetCache.get(key);
  if (cached && cached.raw === raw) {
    return cached;
  }

  const byId = new Map<string, RetrievedMark>();
  const byRoll = new Map<string, RetrievedMark>();
  const byName = new Map<string, RetrievedMark>();

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      for (const row of parsed) {
        if (!row || typeof row !== 'object') continue;
        const mark = extractRetrievedMark(row);
        if (!mark) continue;
        const r = row as Record<string, unknown>;
        if (r.id) byId.set(String(r.id), mark);
        if (r.studentId) byId.set(String(r.studentId), mark);
        if (r.roll !== undefined && r.roll !== null) {
          for (const rv of normalizeRollKeyVariants(String(r.roll))) {
            if (!byRoll.has(rv)) byRoll.set(rv, mark);
          }
        }
        if (r.name) {
          const cleanName = String(r.name).trim();
          if (cleanName && !byName.has(cleanName)) byName.set(cleanName, mark);
        }
      }
    } else if (typeof parsed === 'object' && parsed !== null) {
      for (const [k, val] of Object.entries(parsed)) {
        const mark = extractRetrievedMark(val);
        if (!mark) continue;
        byId.set(k, mark);
        for (const rv of normalizeRollKeyVariants(k)) {
          if (!byRoll.has(rv)) byRoll.set(rv, mark);
        }
      }
    }
  } catch {
    // ignore malformed sheet JSON
  }

  const indexed: IndexedMarkSheet = { raw, byId, byRoll, byName };
  if (parsedSheetCache.size >= MAX_PARSED_SHEET_CACHE) {
    parsedSheetCache.clear();
  }
  parsedSheetCache.set(key, indexed);
  return indexed;
}

function lookupStudentInSheet(
  sheet: IndexedMarkSheet | null,
  normalizedRolls: string[],
  studentId?: string,
  studentName?: string,
): RetrievedMark | null {
  if (!sheet) return null;
  if (studentId) {
    const byIdHit = sheet.byId.get(studentId);
    if (byIdHit) return byIdHit;
  }
  for (const r of normalizedRolls) {
    const byRollHit = sheet.byRoll.get(r);
    if (byRollHit) return byRollHit;
  }
  if (studentName) {
    const byNameHit = sheet.byName.get(studentName.trim());
    if (byNameHit) return byNameHit;
  }
  return null;
}

/**
 * Robust Universal Mark Retriever from LocalStorage (O(1) per-turn indexed).
 * Searches across accurate key permutations without cross-group leakage.
 */
export function getUniversalStudentMark(params: {
  exam: string;
  grade: string;
  branch: string;
  group?: string;
  subjectCodeOrName: string;
  studentRoll: string;
  studentId?: string;
  studentName?: string;
  religion?: ReligionType;
}): RetrievedMark {
  const { exam, grade, branch, group, subjectCodeOrName, studentRoll, studentId, studentName, religion } = params;

  const defaultResult: RetrievedMark = {
    cq: 0,
    mcq: 0,
    practical: 0,
    ca: 0,
    total: 0,
    hasMarks: false
  };

  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return defaultResult;

  const snapshot = getTurnMarksKeySnapshot();
  if (snapshot && snapshot.marksKeys.length === 0) return defaultResult;

  const normalizedRolls = normalizeRollKeyVariants(studentRoll || '1');

  // FAST PATH (O(1)): Reuse pre-resolved existing storage keys for this (exam, grade, branch, group, subject, religion)
  const subjectCacheKey = `${exam}|${grade}|${branch || ''}|${group || ''}|${subjectCodeOrName}|${religion || ''}`;
  if (snapshot) {
    const cachedKeys = snapshot.subjectKeysCache.get(subjectCacheKey);
    if (cachedKeys !== undefined) {
      for (const key of cachedKeys) {
        const sheet = getIndexedMarkSheet(key);
        const hit = lookupStudentInSheet(sheet, normalizedRolls, studentId, studentName);
        if (hit) return hit;
      }
      return defaultResult;
    }
  }

  // 1. Resolve Subject Synonyms
  let targetNames: string[] = [subjectCodeOrName];
  let targetCodes: string[] = [subjectCodeOrName];

  const trimmedQ = subjectCodeOrName.trim();
  if (
    trimmedQ.includes('ধর্ম') ||
    trimmedQ.includes('REL') ||
    trimmedQ.includes('ইসলাম') ||
    trimmedQ.includes('হিন্দু') ||
    trimmedQ.includes('বৌদ্ধ') ||
    trimmedQ.includes('খ্রিস্ট') ||
    trimmedQ.includes('খ্রিষ্ট') ||
    trimmedQ.toLowerCase().includes('religion') ||
    trimmedQ.toLowerCase().includes('islam') ||
    trimmedQ.toLowerCase().includes('hindu') ||
    ['111', '112', '113', '114'].includes(trimmedQ)
  ) {
    const relKeys = getReligionSubjectKeys(religion || 'Muslim');
    targetNames = relKeys.names;
    targetCodes = relKeys.codes;
  } else {
    const aliases = getAllSubjectAliases(subjectCodeOrName);
    targetNames = aliases.names;
    targetCodes = aliases.codes.length > 0 ? aliases.codes : [subjectCodeOrName];
  }

  // 2. Build Permutations: only try student's current group + 'সাধারণ', NOT opposite groups
  const isClass9or10 = grade === '9th' || grade === '10th';
  let groupsToTry: string[] = ['সাধারণ', ''];

  if (isClass9or10 && group) {
    if (group.includes('বিজ্ঞান') || group === 'science') {
      groupsToTry = ['বিজ্ঞান', 'science', 'সাধারণ', ''];
    } else if (group.includes('ব্যবসায়') || group.includes('ব্যবসায়') || group === 'commerce') {
      groupsToTry = ['ব্যবসায় শিক্ষা', 'commerce', 'সাধারণ', ''];
    } else if (group.includes('মানবিক') || group === 'humanities') {
      groupsToTry = ['মানবিক', 'humanities', 'সাধারণ', ''];
    }
  }

  const branchesToTry = Array.from(
    new Set([branch || 'A', 'A', 'B', 'C', 'Science', 'Humanities', 'Commerce', '']),
  );

  const examAliases: Record<string, string[]> = {
    'Annual Examination 2026': ['Annual Examination 2026', 'বার্ষিক পরীক্ষা ২০২৬'],
    'বার্ষিক পরীক্ষা ২০২৬': ['Annual Examination 2026', 'বার্ষিক পরীক্ষা ২০২৬'],
    'Half-Yearly Examination 2026': ['Half-Yearly Examination 2026', 'অর্ধ-বার্ষিক পরীক্ষা ২০২৬'],
    'অর্ধ-বার্ষিক পরীক্ষা ২০২৬': ['Half-Yearly Examination 2026', 'অর্ধ-বার্ষিক পরীক্ষা ২০২৬'],
    '1st Terminal Examination 2026': ['1st Terminal Examination 2026', '১ম সাময়িক পরীক্ষা ২০২৬', '১ম সাময়িক পরীক্ষা ২০২৬'],
    '১ম সাময়িক পরীক্ষা ২০২৬': ['1st Terminal Examination 2026', '১ম সাময়িক পরীক্ষা ২০২৬', '১ম সাময়িক পরীক্ষা ২০২৬'],
    '2nd Terminal Examination 2026': ['2nd Terminal Examination 2026', '২য় সাময়িক পরীক্ষা ২০২৬', '২য় সাময়িক পরীক্ষা ২০২৬'],
    '২য় সাময়িক পরীক্ষা ২০২৬': ['2nd Terminal Examination 2026', '২য় সাময়িক পরীক্ষা ২০২৬', '২য় সাময়িক পরীক্ষা ২০২৬'],
    'Model Test Examination 2026': ['Model Test Examination 2026', 'মডেল টেস্ট পরীক্ষা ২০২৬'],
    'মডেল টেস্ট পরীক্ষা ২০২৬': ['Model Test Examination 2026', 'মডেল টেস্ট পরীক্ষা ২০২৬'],
    'Test Examination 2026': ['Test Examination 2026', 'নির্বাচনী পরীক্ষা ২০২৬'],
    'নির্বাচনী পরীক্ষা ২০২৬': ['Test Examination 2026', 'নির্বাচনী পরীক্ষা ২০২৬'],
    'SSC Pre-Selection Examination 2026': ['SSC Pre-Selection Examination 2026', 'এসএসসি প্রাক-নির্বাচনী ২০২৬'],
    'এসএসসি প্রাক-নির্বাচনী ২০২৬': ['SSC Pre-Selection Examination 2026', 'এসএসসি প্রাক-নির্বাচনী ২০২৬'],
  };

  const defaultAliases = examAliases[exam] || [];
  const parentheticalPart = (exam.match(/\(([^)]+)\)/)?.[1] || '').trim();
  const strippedPart = exam.replace(/\([^)]*\)/g, '').trim();

  const examsToTry = Array.from(new Set([
    exam,
    ...defaultAliases,
    ...(examAliases[strippedPart] || []),
    ...(parentheticalPart ? (examAliases[parentheticalPart] || [parentheticalPart]) : []),
    strippedPart
  ])).filter(Boolean);

  const identifiers = Array.from(new Set([...targetNames, ...targetCodes])).filter(Boolean);

  if (snapshot) {
    // Resolve ordered matching existing keys ONCE per turn for this subject scope!
    const matchedKeyList: string[] = [];
    const seenMatched = new Set<string>();

    for (const ex of examsToTry) {
      for (const br of branchesToTry) {
        for (const gp of groupsToTry) {
          for (const ident of identifiers) {
            const key = gp ? `sms_marks_${ex}_${grade}_${br}_${gp}_${ident}` : `sms_marks_${ex}_${grade}_${br}_${ident}`;
            if (snapshot.marksKeySet.has(key) && !seenMatched.has(key)) {
              seenMatched.add(key);
              matchedKeyList.push(key);
            }
          }
        }
      }
    }

    // Resilient fallback keys from snapshot
    for (const key of snapshot.marksKeys) {
      if (seenMatched.has(key)) continue;
      if (examsToTry.length > 0 && !examsToTry.some(ex => key.includes(ex))) continue;
      if (grade && !key.includes(grade)) continue;
      const keyMatchesSubject =
        targetNames.some(n => key.endsWith(`_${n}`) || key.includes(`_${n}_`)) ||
        targetCodes.some(c => key.endsWith(`_${c}`) || key.includes(`_${c}_`));
      if (!keyMatchesSubject) continue;
      seenMatched.add(key);
      matchedKeyList.push(key);
    }

    snapshot.subjectKeysCache.set(subjectCacheKey, matchedKeyList);

    for (const key of matchedKeyList) {
      const sheet = getIndexedMarkSheet(key);
      const hit = lookupStudentInSheet(sheet, normalizedRolls, studentId, studentName);
      if (hit) return hit;
    }
    return defaultResult;
  }

  // Fallback for minimal mock `localStorage` implementations lacking `.length` / `.key(i)`
  for (const ex of examsToTry) {
    for (const br of branchesToTry) {
      for (const gp of groupsToTry) {
        for (const ident of identifiers) {
          const key = gp ? `sms_marks_${ex}_${grade}_${br}_${gp}_${ident}` : `sms_marks_${ex}_${grade}_${br}_${ident}`;
          const sheet = getIndexedMarkSheet(key);
          const hit = lookupStudentInSheet(sheet, normalizedRolls, studentId, studentName);
          if (hit) return hit;
        }
      }
    }
  }

  try {
    const allKeys = Object.keys(localStorage);
    for (const key of allKeys) {
      if (!key.startsWith('sms_marks_')) continue;
      if (examsToTry.length > 0 && !examsToTry.some(ex => key.includes(ex))) continue;
      if (grade && !key.includes(grade)) continue;
      const keyMatchesSubject =
        targetNames.some(n => key.endsWith(`_${n}`) || key.includes(`_${n}_`)) ||
        targetCodes.some(c => key.endsWith(`_${c}`) || key.includes(`_${c}_`));
      if (!keyMatchesSubject) continue;
      const sheet = getIndexedMarkSheet(key);
      const hit = lookupStudentInSheet(sheet, normalizedRolls, studentId, studentName);
      if (hit) return hit;
    }
  } catch (e) {
    console.error('Error in universal mark retrieval', e);
  }

  return defaultResult;
}

