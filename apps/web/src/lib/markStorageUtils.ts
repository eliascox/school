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
  // Social Science / বাংলাদেশ ও বিশ্বপরিচয় (Science) / ইতিহাস ও সামাজিক বিজ্ঞান (6-8)
  bgs: {
    names: [
      'বাংলাদেশ ও বিশ্বপরিচয়',
      'বাংলাদেশ ও বিশ্বপরিচয়',
      'বাংলাদেশ ও বিশ্ব পরিচয়',
      'ইতিহাস ও সামাজিক বিজ্ঞান',
      'সমাজ',
      'সামাজিক বিজ্ঞান'
    ],
    codes: ['BGS-150', 'BGS-606', 'BGS-706', 'BGS-806', 'BGS-604', 'BGS-704', 'BGS-804', 'BGS-106']
  },

  // Civics / পৌরনীতি ও নাগরিকতা (Humanities)
  civics: {
    names: ['পৌরনীতি ও নাগরিকতা', 'পৌরনীতি'],
    codes: ['CIV-140', 'CIV-112', 'CIV-901', 'CIV-1001']
  },

  // History / বাংলাদেশের ইতিহাস ও বিশ্বসভ্যতা (Humanities)
  history: {
    names: ['বাংলাদেশের ইতিহাস ও বিশ্বসভ্যতা', 'ইতিহাস ও বিশ্বসভ্যতা', 'ইতিহাস'],
    codes: ['HIS-153', 'HIS-901', 'HIS-1001']
  },

  // Geography / ভূগোল ও পরিবেশ (Humanities)
  geography: {
    names: ['ভূগোল ও পরিবেশ', 'ভূগোল'],
    codes: ['GEO-110', 'GEO-901', 'GEO-1001']
  },

  // Economics / অর্থনীতি (Humanities & Commerce)
  economics: {
    names: ['অর্থনীতি'],
    codes: ['ECO-141', 'ECO-141-COM']
  },

  // Physics / পদার্থবিজ্ঞান (Science)
  physics: {
    names: ['পদার্থবিজ্ঞান', 'পদার্থ বিজ্ঞান', 'পদার্থ'],
    codes: ['PHY-136']
  },

  // Chemistry / রসায়ন (Science)
  chemistry: {
    names: ['রসায়ন', 'রসায়ন'],
    codes: ['CHE-137']
  },

  // Biology / জীববিজ্ঞান (Science)
  biology: {
    names: ['জীববিজ্ঞান', 'জীব বিজ্ঞান'],
    codes: ['BIO-138']
  },

  // Higher Mathematics / উচ্চতর গণিত (Science 4th)
  higherMath: {
    names: ['উচ্চতর গণিত', 'উচ্চতর'],
    codes: ['HMT-126']
  },

  // Accounting / হিসাববিজ্ঞান (Commerce)
  accounting: {
    names: ['হিসাববিজ্ঞান', 'হিসাব বিজ্ঞান'],
    codes: ['ACC-146']
  },

  // Business Entrepreneurship / ব্যবসায় উদ্যোগ (Commerce)
  business: {
    names: ['ব্যবসায় উদ্যোগ', 'ব্যবসা উদ্যোগ', 'ব্যবসায় উদ্যোগ'],
    codes: ['BUS-147', 'BUS-143']
  },

  // Finance & Banking / ফিন্যান্স ও ব্যাংকিং (Commerce)
  finance: {
    names: ['ফিন্যান্স ও ব্যাংকিং', 'ফিন্যান্স', 'ব্যাংকিং'],
    codes: ['FIN-152']
  },

  // Agriculture / কৃষি শিক্ষা
  agriculture: {
    names: ['কৃষি শিক্ষা', 'কৃষি', 'কৃষি শিক্ষা (৪র্থ বিষয়)'],
    codes: ['AGR-139', 'AGR-607', 'AGR-707', 'AGR-807', 'AGR-134', 'AGR-134-SCI', 'AGR-134-HUM', 'AGR-134-COM']
  },

  // Home Science / গার্হস্থ্য বিজ্ঞান
  homeScience: {
    names: ['গার্হস্থ্য বিজ্ঞান', 'গার্হস্থ্য', 'গার্হস্থ্য অর্থনীতি'],
    codes: ['HMS-140', 'HMS-601', 'HMS-701', 'HMS-801']
  },

  // ICT / Digital Technology
  ict: {
    names: ['ডিজিটাল প্রযুক্তি', 'তথ্য ও যোগাযোগ প্রযুক্তি', 'আইসিটি', 'ICT'],
    codes: ['ICT-154', 'ICT-605', 'ICT-705', 'ICT-805']
  },

  // General Science / বিজ্ঞান (6-8 & 9-10 Humanities/Commerce)
  science: {
    names: ['বিজ্ঞান', 'সাধারণ বিজ্ঞান'],
    codes: ['SCI-113', 'SCI-127', 'GSCI-127', 'SCI-604', 'SCI-704', 'SCI-804']
  },

  // General Math / গণিত
  math: {
    names: ['গণিত', 'সাধারণ গণিত'],
    codes: ['MAT-109', 'MAT-603', 'MAT-703', 'MAT-803']
  },

  // Bangla 1st / বাংলা ১ম পত্র
  bangla1: {
    names: ['বাংলা ১ম পত্র', 'বাংলা ১ম'],
    codes: ['BAN-101', 'BAN-601', 'BAN-701', 'BAN-801']
  },

  // Bangla 2nd / বাংলা ২য় পত্র
  bangla2: {
    names: ['বাংলা ২য় পত্র', 'বাংলা ২য় পত্র', 'বাংলা ২য়', 'বাংলা ২য়'],
    codes: ['BAN-102', 'BAN-602', 'BAN-702', 'BAN-802']
  },

  // English 1st / ইংরেজি ১ম পত্র
  english1: {
    names: ['ইংরেজি ১ম পত্র', 'ইংরেজি ১ম', 'English 1st Paper'],
    codes: ['ENG-107', 'ENG-601', 'ENG-701', 'ENG-801']
  },

  // English 2nd / ইংরেজি ২য় পত্র
  english2: {
    names: ['ইংরেজি ২য় পত্র', 'ইংরেজি ২য় পত্র', 'ইংরেজি ২য়', 'English 2nd Paper'],
    codes: ['ENG-108', 'ENG-602', 'ENG-702', 'ENG-802']
  }
};

/**
 * Returns all possible synonyms, names, and codes for a given subject query.
 */
export function getAllSubjectAliases(subjectQuery: string): { names: string[]; codes: string[] } {
  const q = (subjectQuery || '').trim().toLowerCase();
  const names = new Set<string>([subjectQuery]);
  const codes = new Set<string>();

  // Check against dictionary
  if (q.includes('পৌরনীতি') || q.includes('civ')) {
    SUBJECT_SYNONYMS.civics.names.forEach(n => names.add(n));
    SUBJECT_SYNONYMS.civics.codes.forEach(c => codes.add(c));
  } else if (q.includes('ইতিহাস ও বিশ্বসভ্যতা') || q.includes('his-153') || (q.includes('ইতিহাস') && !q.includes('সামাজিক'))) {
    SUBJECT_SYNONYMS.history.names.forEach(n => names.add(n));
    SUBJECT_SYNONYMS.history.codes.forEach(c => codes.add(c));
  } else if (q.includes('ভূগোল') || q.includes('geo')) {
    SUBJECT_SYNONYMS.geography.names.forEach(n => names.add(n));
    SUBJECT_SYNONYMS.geography.codes.forEach(c => codes.add(c));
  } else if (q.includes('অর্থনীতি') || q.includes('eco')) {
    SUBJECT_SYNONYMS.economics.names.forEach(n => names.add(n));
    SUBJECT_SYNONYMS.economics.codes.forEach(c => codes.add(c));
  } else if (q.includes('সমাজ') || q.includes('বিশ্বপরিচ') || q.includes('bgs') || (q.includes('ইতিহাস') && q.includes('সামাজিক'))) {
    SUBJECT_SYNONYMS.bgs.names.forEach(n => names.add(n));
    SUBJECT_SYNONYMS.bgs.codes.forEach(c => codes.add(c));
  }

  if (q.includes('পদার্থ') || q.includes('phy')) {
    SUBJECT_SYNONYMS.physics.names.forEach(n => names.add(n));
    SUBJECT_SYNONYMS.physics.codes.forEach(c => codes.add(c));
  }
  if (q.includes('রসায়ন') || q.includes('রসায়ন') || q.includes('che')) {
    SUBJECT_SYNONYMS.chemistry.names.forEach(n => names.add(n));
    SUBJECT_SYNONYMS.chemistry.codes.forEach(c => codes.add(c));
  }
  if (q.includes('হিসাব') || q.includes('acc')) {
    SUBJECT_SYNONYMS.accounting.names.forEach(n => names.add(n));
    SUBJECT_SYNONYMS.accounting.codes.forEach(c => codes.add(c));
  }
  if (q.includes('উদ্যোগ') || q.includes('bus')) {
    SUBJECT_SYNONYMS.business.names.forEach(n => names.add(n));
    SUBJECT_SYNONYMS.business.codes.forEach(c => codes.add(c));
  }
  if (q.includes('ফিন্যান্স') || q.includes('fin')) {
    SUBJECT_SYNONYMS.finance.names.forEach(n => names.add(n));
    SUBJECT_SYNONYMS.finance.codes.forEach(c => codes.add(c));
  }
  if (q.includes('কৃষি') || q.includes('agr')) {
    SUBJECT_SYNONYMS.agriculture.names.forEach(n => names.add(n));
    SUBJECT_SYNONYMS.agriculture.codes.forEach(c => codes.add(c));
  }
  if (q.includes('গার্হস্থ্য') || q.includes('hms')) {
    SUBJECT_SYNONYMS.homeScience.names.forEach(n => names.add(n));
    SUBJECT_SYNONYMS.homeScience.codes.forEach(c => codes.add(c));
  }
  if (q.includes('উচ্চতর') || q.includes('hmt')) {
    SUBJECT_SYNONYMS.higherMath.names.forEach(n => names.add(n));
    SUBJECT_SYNONYMS.higherMath.codes.forEach(c => codes.add(c));
  }
  if (q.includes('জীববিজ্ঞান') || q.includes('জীব বিজ্ঞান') || q.includes('bio')) {
    SUBJECT_SYNONYMS.biology.names.forEach(n => names.add(n));
    SUBJECT_SYNONYMS.biology.codes.forEach(c => codes.add(c));
  }
  if (q.includes('ict') || q.includes('ডিজিটাল') || q.includes('তথ্য') || q.includes('কম্পিউটার')) {
    SUBJECT_SYNONYMS.ict.names.forEach(n => names.add(n));
    SUBJECT_SYNONYMS.ict.codes.forEach(c => codes.add(c));
  }
  if (q.includes('বাংলা ১ম') || q.includes('ban-101') || q.includes('ban-601') || q.includes('ban-701') || q.includes('ban-801')) {
    SUBJECT_SYNONYMS.bangla1.names.forEach(n => names.add(n));
    SUBJECT_SYNONYMS.bangla1.codes.forEach(c => codes.add(c));
  }
  if (q.includes('বাংলা ২') || q.includes('ban-102') || q.includes('ban-602') || q.includes('ban-702') || q.includes('ban-802')) {
    SUBJECT_SYNONYMS.bangla2.names.forEach(n => names.add(n));
    SUBJECT_SYNONYMS.bangla2.codes.forEach(c => codes.add(c));
  }
  if (q.includes('ইংরেজি ১ম') || q.includes('eng-107') || q.includes('eng-601') || q.includes('eng-701') || q.includes('eng-801')) {
    SUBJECT_SYNONYMS.english1.names.forEach(n => names.add(n));
    SUBJECT_SYNONYMS.english1.codes.forEach(c => codes.add(c));
  }
  if (q.includes('ইংরেজি ২') || q.includes('eng-108') || q.includes('eng-602') || q.includes('eng-702') || q.includes('eng-802')) {
    SUBJECT_SYNONYMS.english2.names.forEach(n => names.add(n));
    SUBJECT_SYNONYMS.english2.codes.forEach(c => codes.add(c));
  }
  if ((q.includes('গণিত') || q.includes('mat')) && !q.includes('উচ্চতর')) {
    SUBJECT_SYNONYMS.math.names.forEach(n => names.add(n));
    SUBJECT_SYNONYMS.math.codes.forEach(c => codes.add(c));
  }
  if (q.includes('বিজ্ঞান') && !q.includes('গার্হস্থ্য') && !q.includes('জীববিজ্ঞান') && !q.includes('সামাজিক') && !q.includes('উচ্চতর')) {
    SUBJECT_SYNONYMS.science.names.forEach(n => names.add(n));
    SUBJECT_SYNONYMS.science.codes.forEach(c => codes.add(c));
  }

  return {
    names: Array.from(names),
    codes: Array.from(codes)
  };
}

/**
 * Robust Universal Mark Retriever from LocalStorage.
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

  if (typeof window === 'undefined') return defaultResult;

  const rollNum = parseInt(studentRoll || '1', 10);
  const normalizedRolls = [
    studentRoll,
    String(rollNum),
    String(rollNum).padStart(2, '0'),
    String(rollNum).padStart(3, '0')
  ];

  // 1. Resolve Subject Synonyms
  let targetNames: string[] = [subjectCodeOrName];
  let targetCodes: string[] = [subjectCodeOrName];

  // Religion special check
  if (subjectCodeOrName.includes('ধর্ম') || subjectCodeOrName.includes('REL') || subjectCodeOrName.includes('ইসলাম') || subjectCodeOrName.includes('হিন্দু')) {
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
    } else if (group.includes('ব্যবসায়') || group === 'commerce') {
      groupsToTry = ['ব্যবসায় শিক্ষা', 'commerce', 'সাধারণ', ''];
    } else if (group.includes('মানবিক') || group === 'humanities') {
      groupsToTry = ['মানবিক', 'humanities', 'সাধারণ', ''];
    }
  }

  const branchesToTry = [
    branch || 'A',
    'A',
    'B',
    'C',
    'Science',
    'Humanities',
    'Commerce',
    ''
  ];

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
  const gradesToTry = [grade];

  // Try direct lookup with priority keys
  for (const ex of examsToTry) {
    for (const gr of gradesToTry) {
      for (const br of branchesToTry) {
        for (const gp of groupsToTry) {
          for (const ident of [...targetNames, ...targetCodes]) {
            if (!ident) continue;
            const key = gp ? `sms_marks_${ex}_${gr}_${br}_${gp}_${ident}` : `sms_marks_${ex}_${gr}_${br}_${ident}`;
            const stored = localStorage.getItem(key);
            if (stored) {
              const res = parseStudentMarkFromJson(stored, normalizedRolls, studentId, studentName);
              if (res.hasMarks) return res;
            }
          }
        }
      }
    }
  }

  // 3. Resilient Fallback: Scan keys for current grade and exam
  try {
    const allKeys = Object.keys(localStorage);
    for (const key of allKeys) {
      if (!key.startsWith('sms_marks_')) continue;
      if (examsToTry.length > 0 && !examsToTry.some(ex => key.includes(ex))) continue;
      if (grade && !key.includes(grade)) continue;

      // Check if key matches target subject identifiers
      const keyMatchesSubject = targetNames.some(n => key.includes(n)) || targetCodes.some(c => key.includes(c));
      if (!keyMatchesSubject) continue;

      const raw = localStorage.getItem(key);
      if (raw) {
        const res = parseStudentMarkFromJson(raw, normalizedRolls, studentId, studentName);
        if (res.hasMarks) return res;
      }
    }
  } catch (e) {
    console.error('Error in universal mark retrieval', e);
  }

  return defaultResult;
}

/**
 * Helper to safely extract student mark row from parsed JSON array or object
 */
function parseStudentMarkFromJson(
  rawJson: string,
  normalizedRolls: string[],
  studentId?: string,
  studentName?: string
): RetrievedMark {
  try {
    const parsed = JSON.parse(rawJson);
    let match: any = null;

    if (Array.isArray(parsed)) {
      match = parsed.find((s: any) => {
        if (!s) return false;
        if (studentId && (s.id === studentId || s.studentId === studentId)) return true;
        const sRollStr = s.roll ? String(s.roll).trim() : '';
        if (normalizedRolls.includes(sRollStr)) return true;
        if (sRollStr && normalizedRolls.includes(String(parseInt(sRollStr, 10)))) return true;
        if (studentName && s.name && s.name.trim() === studentName.trim()) return true;
        return false;
      });
    } else if (typeof parsed === 'object' && parsed !== null) {
      for (const r of normalizedRolls) {
        if (parsed[r]) {
          match = parsed[r];
          break;
        }
      }
      if (!match && studentId && parsed[studentId]) {
        match = parsed[studentId];
      }
    }

    if (match) {
      if (typeof match === 'number') {
        return {
          cq: match,
          mcq: 0,
          practical: 0,
          ca: 0,
          total: match,
          hasMarks: true
        };
      }

      if (match.cq !== undefined || match.written !== undefined || match.mcq !== undefined || match.practical !== undefined || match.ca !== undefined || match.total !== undefined) {
        const cq = Number(match.cq !== undefined ? match.cq : match.written || 0);
        const mcq = Number(match.mcq || 0);
        const practical = Number(match.practical || 0);
        const ca = Number(match.ca || 0);
        const total = match.total !== undefined ? Number(match.total) : cq + mcq + practical + ca;

        return {
          cq,
          mcq,
          practical,
          ca,
          total,
          hasMarks: true
        };
      }
    }
  } catch (e) {}

  return {
    cq: 0,
    mcq: 0,
    practical: 0,
    ca: 0,
    total: 0,
    hasMarks: false
  };
}

