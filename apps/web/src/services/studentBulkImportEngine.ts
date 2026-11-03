/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🎓 STUDENT BULK IMPORT & GROUP-WISE AUTOMATIC ROLL GENERATION ENGINE
 * ═══════════════════════════════════════════════════════════════════════════════
 * Handles end-to-end bulk student processing for Class 9 (and other grades):
 * 1. Bilingual Column Header Mapping (Bangla & English, case/symbol insensitive)
 * 2. Academic Group Categorization (Science, Humanities, Business Studies)
 * 3. Group-wise Automatic Sequential Roll Generation (1..N per group, independent sequences)
 * 4. Configurable Sorting (Alphabetical A-Z, File Order, Previous Roll)
 * 5. Batch Data Validation & Problematic Row Reporting
 * 6. Atomic Database Transaction with Duplicate Collision Prevention
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { Student, studentService } from './studentService';
import { auditTrailService } from './auditTrailService';
import { syncQueueService } from './syncQueueService';
import { sanitizeCsvField } from '@/lib/securityUtils';

export type RollSortStrategy = 'name_asc' | 'file_order' | 'prev_roll';

export interface GroupStats {
  science: number;
  humanities: number;
  business: number;
  general: number;
  total: number;
}

export interface RollRangeInfo {
  count: number;
  startRoll: string;
  endRoll: string;
  rangeBn: string;
}

export interface GroupWiseRollResult {
  students: Student[];
  groupStats: GroupStats;
  rollRanges: Record<string, RollRangeInfo>;
}

export interface ValidationErrorItem {
  row: number;
  studentName?: string;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface BatchValidationReport {
  isValid: boolean;
  canProceed: boolean;
  totalRows: number;
  validRows: number;
  errorCount: number;
  warningCount: number;
  errors: ValidationErrorItem[];
  groupStats: GroupStats;
}

export interface BulkImportOptions {
  mode: 'merge' | 'replace' | 'replace_grade';
  sortStrategy?: RollSortStrategy;
  targetGrade?: string;
  autoAssignRolls?: boolean;
  keepUploadedRoll?: boolean; // Default true: retains uploaded roll from file while sorting A-Z
  performedBy?: string;
  abortOnError?: boolean;
}

export interface BulkImportExecutionResult {
  success: boolean;
  message: string;
  importedCount: number;
  groupStats: GroupStats;
  rollRanges: Record<string, RollRangeInfo>;
  students: Student[];
  validationReport: BatchValidationReport;
}

// ─── 0. BILINGUAL DIGIT CONVERTERS ───────────────────────────────────────────
export const bnToEnDigits = (str: string | number = ''): string => {
  const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(str ?? '').replace(/[০-৯]/g, (d) => String(bn.indexOf(d)));
};

export const enToBnDigits = (str: string | number = ''): string => {
  const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(str ?? '').replace(/[0-9]/g, (d) => bn[parseInt(d, 10)]);
};

// ─── 1. BILINGUAL COLUMN HEADER NORMALIZER ───────────────────────────────────
/**
 * Maps English & Bengali Excel/CSV headers to standardized object keys.
 * Crucial: Non-alphanumeric/Bengali symbols (e.g. apostrophes in "Father's Name")
 * are stripped, and specific keys (Father/Mother/Guardian/PrevRoll) are checked
 * BEFORE generic keys like "name" or "roll".
 */
export function normalizeHeaderKey(rawKey: string): string {
  const k = (rawKey || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0980-\u09FF]/g, '');

  // 1. Father Details (CHECK BEFORE generic 'name'!)
  if (k.includes('fathernid') || k.includes('পিতারএনআইডি') || k.includes('বাবারএনআইডি') || k.includes('পিতারজাতীয়')) {
    return 'fatherNid';
  }
  if (
    k.includes('father') ||
    k.includes('পিতারনাম') ||
    k.includes('বাবারনাম') ||
    k.includes('পিতা') ||
    k.includes('বাবা') ||
    k.includes('বাপেরনাম')
  ) {
    return 'fatherName';
  }

  // 2. Mother Details (CHECK BEFORE generic 'name'!)
  if (k.includes('mothernid') || k.includes('মাতারএনআইডি') || k.includes('মায়েরএনআইডি') || k.includes('মাতারজাতীয়')) {
    return 'motherNid';
  }
  if (
    k.includes('mother') ||
    k.includes('মাতারনাম') ||
    k.includes('মায়েরনাম') ||
    k.includes('মাতা') ||
    k.includes('মা')
  ) {
    return 'motherName';
  }

  // 3. Legal Guardian Details (CHECK BEFORE generic 'name'!)
  if (
    k.includes('guardian') ||
    k.includes('আইনগতঅভিভাবক') ||
    k.includes('অভিভাবকেরনাম') ||
    k.includes('অভিভাবক')
  ) {
    return 'guardian';
  }

  // 4. Previous Roll / Past Roll (CHECK BEFORE generic 'roll'!)
  if (
    k.includes('previousroll') ||
    k.includes('prevroll') ||
    k.includes('oldroll') ||
    k.includes('pastroll') ||
    k.includes('formerroll') ||
    k.includes('পূর্বেররোল') ||
    k.includes('পূর্ববর্তীরোল') ||
    k.includes('আগেররোল')
  ) {
    return 'prevRoll';
  }

  // 5. Roll / Serial Number
  if (
    k.includes('rollno') ||
    k.includes('rollnum') ||
    k.includes('roll') ||
    k.includes('রোলনম্বর') ||
    k.includes('রোলনং') ||
    k.includes('রোল') ||
    k.includes('ক্রমিকনং') ||
    k.includes('ক্রমিক') ||
    k.includes('slno') ||
    k.includes('sl') ||
    k.includes('serial')
  ) {
    return 'roll';
  }

  // 6. Student Name (Now safe to check 'name' / 'নাম')
  if (
    k.includes('student') ||
    k.includes('শিক্ষার্থী') ||
    k.includes('ছাত্র') ||
    k.includes('ছাত্রী') ||
    k.includes('fullname') ||
    k.includes('name') ||
    k.includes('নাম')
  ) {
    return 'name';
  }

  // 7. Class / Grade
  if (
    k.includes('grade') ||
    k.includes('class') ||
    k.includes('standard') ||
    k.includes('শ্রেণি') ||
    k.includes('শ্রেণী') ||
    k.includes('ক্লাস')
  ) {
    return 'grade';
  }

  // 8. Section / Branch
  if (
    k.includes('section') ||
    k.includes('branch') ||
    k.includes('sec') ||
    k.includes('শাখা') ||
    k.includes('সেকশন')
  ) {
    return 'section';
  }

  // 9. Blood Group (MUST CHECK BEFORE Academic Group to prevent 'bloodgroup' or 'রক্তেরগ্রুপ' matching generic 'group')
  if (
    k.includes('bloodgroup') ||
    k.includes('blood') ||
    k.includes('রক্তেরগ্রুপ') ||
    k.includes('রক্তের') ||
    k.includes('রক্ত') ||
    k.includes('ব্লাডগ্রুপ') ||
    k.includes('ব্লাড')
  ) {
    return 'bloodGroup';
  }

  // 10. Academic Group / Department / Stream (Explicitly excludes 'blood' and 'রক্ত')
  if (
    !k.includes('blood') &&
    !k.includes('রক্ত') &&
    !k.includes('ব্লাড') &&
    (
      k.includes('group') ||
      k.includes('বিভাগ') ||
      k.includes('গ্রুপ') ||
      k.includes('শাখা/বিভাগ') ||
      k.includes('শাখা-বিভাগ') ||
      k.includes('stream') ||
      k.includes('dept') ||
      k.includes('department') ||
      k.includes('faculty')
    )
  ) {
    return 'group';
  }

  // 11. Gender
  if (
    k.includes('gender') ||
    k.includes('sex') ||
    k.includes('লিঙ্গ') ||
    k.includes('ছাত্রছাত্রী')
  ) {
    return 'gender';
  }

  // 11. Date of Birth (DOB)
  if (
    k.includes('dateofbirth') ||
    k.includes('birthdate') ||
    k.includes('dob') ||
    k.includes('জন্মতারিখ') ||
    k.includes('জন্মদিন')
  ) {
    return 'dob';
  }

  // 12. Birth Registration Number (BRN)
  if (
    k.includes('birthreg') ||
    k.includes('brn') ||
    k.includes('birthcertificate') ||
    k.includes('জন্মনিবন্ধন') ||
    k.includes('নিবন্ধননম্বর') ||
    k.includes('সনদ')
  ) {
    return 'birthRegNo';
  }

  // 13. Board Registration Number (for Class 9-10)
  if (
    !k.includes('birth') &&
    !k.includes('জন্ম') &&
    (
      k.includes('boardreg') ||
      k.includes('registrationno') ||
      k.includes('regno') ||
      k.includes('regnumber') ||
      k.includes('registrationnumber') ||
      k.includes('registration') ||
      k.includes('রেজিস্ট্রেশননম্বর') ||
      k.includes('রেজিস্ট্রেশননং') ||
      k.includes('রেজিস্ট্রেশন') ||
      k.includes('বোর্ডরেজিস্ট্রেশন')
    )
  ) {
    return 'registrationNo';
  }

  // 14. Mobile / Phone Number
  if (
    k.includes('mobile') ||
    k.includes('phone') ||
    k.includes('contact') ||
    k.includes('cell') ||
    k.includes('মোবাইল') ||
    k.includes('ফোন') ||
    k.includes('যোগাযোগ')
  ) {
    return 'mobile';
  }

  // 14. Permanent Address (Check BEFORE generic address)
  if (
    k.includes('permanentaddress') ||
    k.includes('permanent') ||
    k.includes('স্থায়ীঠিকানা') ||
    k.includes('স্থায়িঠিকানা')
  ) {
    return 'permanentAddress';
  }

  // 15. Current / Present Address
  if (
    k.includes('currentaddress') ||
    k.includes('presentaddress') ||
    k.includes('address') ||
    k.includes('ঠিকানা') ||
    k.includes('বর্তমানঠিকানা')
  ) {
    return 'currentAddress';
  }

  // 16. Religion (Blood Group already handled above)
  if (k.includes('religion') || k.includes('faith') || k.includes('ধর্ম')) {
    return 'religion';
  }

  // 18. Session / Academic Year
  if (
    k.includes('session') ||
    k.includes('academicyear') ||
    k.includes('year') ||
    k.includes('শিক্ষাবর্ষ') ||
    k.includes('সেশন') ||
    k.includes('বছর')
  ) {
    return 'session';
  }

  // 19. Optional / 4th Subject
  if (
    k.includes('optionalsubject') ||
    k.includes('optional') ||
    k.includes('4thsubject') ||
    k.includes('৪র্থবিষয়') ||
    k.includes('৪র্থ') ||
    k.includes('ঐচ্ছিকবিষয়') ||
    k.includes('ঐচ্ছিক')
  ) {
    return 'optionalSubject';
  }

  // 20. Stipend Details
  if (k.includes('stipendcat') || k.includes('উপবৃত্তিক্যাটাগরি') || k.includes('উপবৃত্তিধরন')) {
    return 'stipendCategory';
  }
  if (k.includes('isstipend') || k.includes('stipend') || k.includes('উপবৃত্তি')) {
    return 'isStipend';
  }

  // 21. Remarks / Notes
  if (k.includes('remark') || k.includes('note') || k.includes('মন্তব্য') || k.includes('নোট')) {
    return 'remarks';
  }

  return k;
}

// ─── 2. ACADEMIC GROUP CATEGORIZATION ────────────────────────────────────────
export function detectAcademicGroup(
  rawGroup: string = '',
  grade: string = '9th'
): {
  group: 'বিজ্ঞান' | 'মানবিক' | 'ব্যবসায় শিক্ষা' | 'সাধারণ';
  groupEn: 'Science' | 'Humanities' | 'Business Studies' | 'General';
  groupCode: 'SCI' | 'HUM' | 'BUS' | 'GEN';
  isValid: boolean;
} {
  const g = (rawGroup || '').toLowerCase().trim();
  const clean = g.replace(/[^a-z0-9\u0980-\u09FF]/g, '');

  const isClass9or10 =
    grade === '9th' ||
    grade === '10th' ||
    grade.includes('9') ||
    grade.includes('10') ||
    grade.includes('৯') ||
    grade.includes('১০');

  // Science
  if (
    clean.includes('বিজ্ঞান') ||
    clean.includes('সাইন্স') ||
    clean.includes('সায়েন্স') ||
    clean.includes('science') ||
    clean === 'sci' ||
    clean.startsWith('sci')
  ) {
    return { group: 'বিজ্ঞান', groupEn: 'Science', groupCode: 'SCI', isValid: true };
  }

  // Humanities / Arts
  if (
    clean.includes('মানবিক') ||
    clean.includes('আর্টস') ||
    clean.includes('আর্ট') ||
    clean.includes('হিউম্যানিটিজ') ||
    clean.includes('হিউম্যানিটি') ||
    clean.includes('humanities') ||
    clean.includes('humanity') ||
    clean.includes('arts') ||
    clean === 'art' ||
    clean.includes('কলা')
  ) {
    return { group: 'মানবিক', groupEn: 'Humanities', groupCode: 'HUM', isValid: true };
  }

  // Business Studies / Commerce
  if (
    clean.includes('ব্যবসা') ||
    clean.includes('ব্যবসায়') ||
    clean.includes('ব্যবসায়') ||
    clean.includes('বাণিজ্য') ||
    clean.includes('বানিজ্য') ||
    clean.includes('কমার্স') ||
    clean.includes('বিজনেস') ||
    clean.includes('business') ||
    clean.includes('commerce') ||
    clean.includes('bstudies') ||
    clean.includes('bstudy') ||
    clean === 'bba' ||
    clean === 'bus' ||
    clean === 'com'
  ) {
    return { group: 'ব্যবসায় শিক্ষা', groupEn: 'Business Studies', groupCode: 'BUS', isValid: true };
  }

  // Lower classes (6th-8th) default to General
  if (!isClass9or10) {
    return { group: 'সাধারণ', groupEn: 'General', groupCode: 'GEN', isValid: true };
  }

  // If Class 9 or 10 has 'general' or 'সাধারণ', flag as not strictly one of 3 standard groups
  if (clean.includes('general') || clean.includes('সাধারণ')) {
    return { group: 'সাধারণ', groupEn: 'General', groupCode: 'GEN', isValid: false };
  }

  // Fallback when missing or unrecognizable for Class 9/10
  return { group: 'বিজ্ঞান', groupEn: 'Science', groupCode: 'SCI', isValid: false };
}

// ─── 3. ROW NORMALIZATION ────────────────────────────────────────────────────
export function normalizeStudentRow(
  rawRow: Record<string, any>,
  index: number
): Student {
  const row: Record<string, string> = {};

  Object.keys(rawRow).forEach((k) => {
    if (k.startsWith('_')) return; // Internal metadata
    const val = rawRow[k];
    const normKey = normalizeHeaderKey(k);
    row[normKey] = val !== null && val !== undefined ? sanitizeCsvField(val) : '';
  });

  // 1. Student Name
  const nameVal = (row['name'] || '').trim() || `শিক্ষার্থী ${index + 1}`;

  // 2. Class / Grade
  const rawGrade = (row['grade'] || rawRow['_sheetGrade'] || '9th').toLowerCase();
  const gradeClean = bnToEnDigits(rawGrade);
  let gradeVal = '9th';
  let gradeBn = '৯ম শ্রেণি';

  if (gradeClean.includes('6') || rawGrade.includes('৬') || rawGrade.includes('six') || rawGrade.includes('ষষ্ঠ')) {
    gradeVal = '6th';
    gradeBn = '৬ষ্ঠ শ্রেণি';
  } else if (gradeClean.includes('7') || rawGrade.includes('৭') || rawGrade.includes('seven') || rawGrade.includes('সপ্তম')) {
    gradeVal = '7th';
    gradeBn = '৭ম শ্রেণি';
  } else if (gradeClean.includes('8') || rawGrade.includes('৮') || rawGrade.includes('eight') || rawGrade.includes('অষ্টম')) {
    gradeVal = '8th';
    gradeBn = '৮ম শ্রেণি';
  } else if (gradeClean.includes('10') || rawGrade.includes('১০') || rawGrade.includes('ten') || rawGrade.includes('দশম')) {
    gradeVal = '10th';
    gradeBn = '১০ম শ্রেণি';
  } else if (gradeClean.includes('9') || rawGrade.includes('৯') || rawGrade.includes('nine') || rawGrade.includes('নবম')) {
    gradeVal = '9th';
    gradeBn = '৯ম শ্রেণি';
  }

  // 3. Section / Branch
  let rawSec = (row['section'] || 'A').toUpperCase().trim();
  if (rawSec === 'ক' || rawSec.includes('পদ্মা') || rawSec.includes('PADMA')) rawSec = 'A';
  else if (rawSec === 'খ' || rawSec.includes('মেঘনা') || rawSec.includes('MEGHNA')) rawSec = 'B';
  else if (rawSec === 'গ' || rawSec.includes('যমুনা') || rawSec.includes('JAMUNA')) rawSec = 'C';
  else if (rawSec === 'ঘ' || rawSec.includes('কর্ণফুলী') || rawSec.includes('KARNAFULI')) rawSec = 'D';
  else if (!['A', 'B', 'C', 'D'].includes(rawSec)) rawSec = rawSec.slice(0, 1) || 'A';

  // 4. Academic Group
  const rawGroup = row['group'] || rawRow['_sheetGroup'] || '';
  const detected = detectAcademicGroup(rawGroup, gradeVal);
  const groupVal = detected.group;
  const groupCode = detected.groupCode;

  // 5. Roll and Previous Roll
  const prevRollVal = (row['prevRoll'] || '').trim();
  const rawOriginalRoll = row['roll'] || prevRollVal || String(index + 1);
  const rollDigits = bnToEnDigits(rawOriginalRoll).replace(/[^0-9]/g, '');
  const rollVal = rollDigits ? rollDigits.padStart(2, '0') : String(index + 1).padStart(2, '0');

  // 6. Gender
  let rawGender = (row['gender'] || 'পুরুষ').toLowerCase().trim();
  let genderVal = 'পুরুষ';
  if (
    rawGender.includes('মহিলা') ||
    rawGender.includes('মেয়ে') ||
    rawGender.includes('ছাত্রী') ||
    rawGender.includes('female') ||
    rawGender === 'f' ||
    rawGender.includes('girl')
  ) {
    genderVal = 'মহিলা';
  } else if (rawGender.includes('অন্যান্য') || rawGender.includes('other')) {
    genderVal = 'অন্যান্য';
  }

  // 7. Religion
  let rawRel = (row['religion'] || 'ইসলাম').toLowerCase().trim();
  let religionVal = 'ইসলাম';
  if (rawRel.includes('হিন্দু') || rawRel.includes('সনাতন') || rawRel.includes('hindu')) {
    religionVal = 'হিন্দু';
  } else if (rawRel.includes('বৌদ্ধ') || rawRel.includes('buddhist')) {
    religionVal = 'বৌদ্ধ';
  } else if (rawRel.includes('খ্রিস্টান') || rawRel.includes('christian')) {
    religionVal = 'খ্রিস্টান';
  }

  // 8. Blood Group
  let rawBg = (row['bloodGroup'] || '').toUpperCase().trim();
  rawBg = rawBg
    .replace(/এবি/g, 'AB')
    .replace(/এ/g, 'A')
    .replace(/বি/g, 'B')
    .replace(/ও/g, 'O')
    .replace(/পজিটিভ/g, '+')
    .replace(/নেগেটিভ/g, '-');
  let bloodGroupVal = '';
  if (
    rawBg.includes('A+') ||
    rawBg.includes('AB+') ||
    rawBg.includes('B+') ||
    rawBg.includes('O+') ||
    rawBg.includes('A-') ||
    rawBg.includes('AB-') ||
    rawBg.includes('B-') ||
    rawBg.includes('O-')
  ) {
    bloodGroupVal = rawBg;
  }

  // 9. Mobile Number (Bengali/English digits cleaned to 11 digits)
  let rawMobile = bnToEnDigits(row['mobile'] || '').replace(/[^0-9]/g, '');
  if (rawMobile.startsWith('880')) rawMobile = rawMobile.slice(2);
  if (rawMobile.length > 11) rawMobile = rawMobile.slice(-11);

  // 10. Birth Reg No, Board Reg No & NIDs
  const brnVal = bnToEnDigits(row['birthRegNo'] || '').replace(/[^0-9]/g, '');
  const regNoVal = bnToEnDigits(row['registrationNo'] || '').replace(/[^0-9]/g, '');
  const fatherNidVal = bnToEnDigits(row['fatherNid'] || '').replace(/[^0-9]/g, '');
  const motherNidVal = bnToEnDigits(row['motherNid'] || '').replace(/[^0-9]/g, '');
  const dobVal = bnToEnDigits(row['dob'] || '').trim();
  const sessionVal = row['session'] ? enToBnDigits(bnToEnDigits(row['session'])) : '২০২৬';

  // 11. Parents & Guardian Details (Strictly Separated!)
  const fatherVal = (row['fatherName'] || '').trim();
  const motherVal = (row['motherName'] || '').trim();
  const guardianVal = (row['guardian'] || '').trim() || fatherVal || motherVal || '';

  // 12. Optional Subject
  let optSub = row['optionalSubject'] || '';
  const optLower = optSub.toLowerCase();
  if (optLower.includes('higher math') || optSub.includes('উচ্চতর গণিত')) {
    optSub = 'উচ্চতর গণিত';
  } else if (optLower.includes('agri') || optSub.includes('কৃষি')) {
    optSub = 'কৃষি শিক্ষা';
  } else if (optLower.includes('home science') || optSub.includes('গার্হস্থ্য')) {
    optSub = 'গার্হস্থ্য বিজ্ঞান';
  } else if (optLower.includes('computer') || optSub.includes('কম্পিউটার')) {
    optSub = 'কম্পিউটার শিক্ষা';
  } else if (!optSub) {
    optSub = ['9th', '10th'].includes(gradeVal)
      ? groupVal === 'বিজ্ঞান' ? 'উচ্চতর গণিত' : 'কৃষি শিক্ষা'
      : 'কৃষি শিক্ষা';
  }

  // 13. Stipend
  const rawStipend = (row['isStipend'] || '').toLowerCase().trim();
  const isStipendVal =
    rawStipend === 'হ্যাঁ' ||
    rawStipend === 'yes' ||
    rawStipend === 'true' ||
    rawStipend === '1' ||
    rawStipend === 'প্রাপ্ত';

  // Unique ID incorporating Group Code
  const generatedId = `STD-${gradeVal}-${groupCode}-${rawSec}-${rollVal}`;

  return {
    id: row['id'] || generatedId,
    roll: rollVal,
    prevRoll: prevRollVal || rawOriginalRoll,
    name: nameVal,
    grade: gradeVal,
    gradeBn,
    section: rawSec,
    branch: rawSec,
    group: groupVal,
    session: sessionVal,
    gender: genderVal,
    dob: dobVal,
    birthRegNo: brnVal,
    registrationNo: regNoVal,
    bloodGroup: bloodGroupVal,
    religion: religionVal,
    mobile: rawMobile,
    fatherName: fatherVal,
    fatherNid: fatherNidVal,
    motherName: motherVal,
    motherNid: motherNidVal,
    guardian: guardianVal,
    currentAddress: row['currentAddress'] || '',
    permanentAddress: row['permanentAddress'] || row['currentAddress'] || '',
    optionalSubject: optSub,
    isStipend: isStipendVal,
    stipendCategory: isStipendVal ? row['stipendCategory'] || 'সাধারণ উপবৃত্তি' : '',
    stipendStatus: isStipendVal ? 'Active' : undefined,
    remarks: row['remarks'] || '',
  };
}

// ─── 4. AUTOMATIC GROUP-WISE ROLL GENERATION (CORE REQUIREMENT 3) ────────────
/**
 * Takes any list of students (with unordered, random, or duplicate rolls) and:
 * 1. Categorizes students into Science, Humanities, and Business Studies.
 * 2. Sorts each group according to selected strategy (default: Alphabetical A-Z).
 * 3. Automatically generates sequential roll numbers (1..N) independently for each group.
 * 4. Ensures each group starts at Roll 1 (e.g. Science 1-35, Humanities 1-30, Business 1-25).
 * 5. Guarantees 100% collision-free IDs across all groups.
 */
export function generateGroupWiseRolls(
  students: Student[],
  strategy: RollSortStrategy = 'name_asc',
  targetGrade: string = '9th',
  keepUploadedRoll: boolean = true
): GroupWiseRollResult {
  const isClass9or10 =
    targetGrade === '9th' ||
    targetGrade === '10th' ||
    targetGrade.includes('9') ||
    targetGrade.includes('10');

  // Buckets for groups
  const sciBucket: Student[] = [];
  const humBucket: Student[] = [];
  const busBucket: Student[] = [];
  const otherBucket: Student[] = [];

  students.forEach((st) => {
    const sGrade = st.grade || st.gradeBn || '';
    const isTargetGrade =
      !targetGrade ||
      targetGrade === 'all' ||
      sGrade === targetGrade ||
      (targetGrade === '9th' && (sGrade.includes('9') || sGrade.includes('৯')));

    if (isClass9or10 && isTargetGrade) {
      if (st.group === 'বিজ্ঞান') sciBucket.push(st);
      else if (st.group === 'মানবিক') humBucket.push(st);
      else if (st.group === 'ব্যবসায় শিক্ষা') busBucket.push(st);
      else otherBucket.push(st);
    } else {
      otherBucket.push(st);
    }
  });

  // Sorter function based on strategy
  const sortGroup = (list: Student[]): Student[] => {
    const copy = [...list];
    if (strategy === 'name_asc') {
      copy.sort((a, b) => {
        const nameA = (a.name || '').trim();
        const nameB = (b.name || '').trim();
        return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
      });
    } else if (strategy === 'prev_roll') {
      copy.sort((a, b) => {
        const rA = parseInt(bnToEnDigits(a.prevRoll || a.roll || '999999').replace(/[^0-9]/g, ''), 10) || 999999;
        const rB = parseInt(bnToEnDigits(b.prevRoll || b.roll || '999999').replace(/[^0-9]/g, ''), 10) || 999999;
        if (rA !== rB) return rA - rB;
        return (a.name || '').localeCompare(b.name || '');
      });
    }
    // 'file_order' maintains existing order
    return copy;
  };

  // Assign rolls: If keepUploadedRoll is true, retain uploaded roll from Excel; otherwise reassign 1..N
  const assignRolls = (list: Student[], groupCode: string, groupName: string): Student[] => {
    const sorted = sortGroup(list);
    return sorted.map((st, idx) => {
      // 🛡️ USER REQUIREMENT:
      // "বালক্ আপলোডে শিক্ষার্থীর যে রোল আপলোড হবে সেটি ঠিক থাকবে , শুধু এ-ঝেড আকারে সাজাবে ।"
      const hasUploadedRoll = st.roll && String(st.roll).trim().length > 0;
      const finalRoll = keepUploadedRoll && hasUploadedRoll
        ? String(st.roll).trim()
        : String(idx + 1).padStart(2, '0');

      const uniqueId = `STD-${st.grade}-${groupCode}-${st.section || 'A'}-${finalRoll}`;
      return {
        ...st,
        id: uniqueId,
        roll: finalRoll,
        group: groupName,
        prevRoll: st.prevRoll || st.roll,
      };
    });
  };

  const processedSci = assignRolls(sciBucket, 'SCI', 'বিজ্ঞান');
  const processedHum = assignRolls(humBucket, 'HUM', 'মানবিক');
  const processedBus = assignRolls(busBucket, 'BUS', 'ব্যবসায় শিক্ষা');

  // For other classes/groups, also preserve uploaded roll and sort A-Z
  let processedOther: Student[] = otherBucket;
  if (otherBucket.length > 0) {
    const sortedOther = sortGroup(otherBucket);
    processedOther = sortedOther.map((st, idx) => {
      const hasUploadedRoll = st.roll && String(st.roll).trim().length > 0;
      const finalRoll = keepUploadedRoll && hasUploadedRoll
        ? String(st.roll).trim()
        : (st.roll || String(idx + 1).padStart(2, '0'));
      return {
        ...st,
        roll: finalRoll,
        prevRoll: st.prevRoll || st.roll,
      };
    });
  }

  const allProcessed = [...processedSci, ...processedHum, ...processedBus, ...processedOther];

  const rollRanges: Record<string, RollRangeInfo> = {};

  const buildRange = (list: Student[], groupName: string) => {
    if (list.length === 0) return;
    const numericRolls = list
      .map((s) => parseInt(bnToEnDigits(s.roll).replace(/[^0-9]/g, ''), 10))
      .filter((n) => !isNaN(n));

    let rangeBn = '';
    let startRoll = '01';
    let endRoll = String(list.length).padStart(2, '0');

    if (numericRolls.length > 0) {
      const min = Math.min(...numericRolls);
      const max = Math.max(...numericRolls);
      startRoll = String(min).padStart(2, '0');
      endRoll = String(max).padStart(2, '0');
      rangeBn = `${enToBnDigits(startRoll)} – ${enToBnDigits(endRoll)}`;
    } else {
      rangeBn = `০১ – ${enToBnDigits(list.length)}`;
    }

    rollRanges[groupName] = {
      count: list.length,
      startRoll,
      endRoll,
      rangeBn,
    };
  };

  buildRange(processedSci, 'বিজ্ঞান');
  buildRange(processedHum, 'মানবিক');
  buildRange(processedBus, 'ব্যবসায় শিক্ষা');

  const groupStats: GroupStats = {
    science: processedSci.length,
    humanities: processedHum.length,
    business: processedBus.length,
    general: processedOther.length,
    total: allProcessed.length,
  };

  return {
    students: allProcessed,
    groupStats,
    rollRanges,
  };
}

// ─── 5. DATA VALIDATION ENGINE (CORE REQUIREMENT 5) ──────────────────────────
export function validateBulkImportBatch(
  students: Student[],
  existingStudents: Student[] = []
): BatchValidationReport {
  const errors: ValidationErrorItem[] = [];
  let errorCount = 0;
  let warningCount = 0;

  let sciCount = 0;
  let humCount = 0;
  let busCount = 0;
  let genCount = 0;

  // Track duplicates within the imported batch
  const seenBatchKeys = new Map<string, number>();

  students.forEach((st, idx) => {
    const rowNum = idx + 2; // +1 for 1-based, +1 for header row
    const studentName = st.name?.trim();

    // 1. Missing Student Name (Critical Error)
    if (!studentName || studentName.startsWith('শিক্ষার্থী ')) {
      errors.push({
        row: rowNum,
        studentName,
        field: 'name',
        message: `রো #${rowNum}: শিক্ষার্থীর নাম অনুপস্থিত বা অসম্পূর্ণ।`,
        severity: 'error',
      });
      errorCount++;
    }

    // 2. Class / Grade Validation
    if (!st.grade) {
      errors.push({
        row: rowNum,
        studentName,
        field: 'grade',
        message: `রো #${rowNum}: শ্রেণি নির্ধারণ করা সম্ভব হয়নি।`,
        severity: 'error',
      });
      errorCount++;
    }

    // 3. Academic Group Validation for Class 9 and 10
    const is9or10 =
      st.grade === '9th' ||
      st.grade === '10th' ||
      st.grade.includes('9') ||
      st.grade.includes('10');

    if (is9or10) {
      if (st.group === 'বিজ্ঞান') sciCount++;
      else if (st.group === 'মানবিক') humCount++;
      else if (st.group === 'ব্যবসায় শিক্ষা') busCount++;
      else {
        genCount++;
        errors.push({
          row: rowNum,
          studentName,
          field: 'group',
          message: `রো #${rowNum}: ৯ম শ্রেণির জন্য বিভাগ (Science, Humanities, Business Studies) স্পষ্ট নয়। ডিফল্ট বিজ্ঞান গ্রুপে রাখা হয়েছে।`,
          severity: 'warning',
        });
        warningCount++;
      }
    } else {
      genCount++;
    }

    // 4. Duplicate Check within Uploaded File
    // Check by combination of Name + Father Name + Group
    const batchDedupeKey = `${st.grade}_${st.group || ''}_${(studentName || '').toLowerCase()}_${(st.fatherName || '').toLowerCase()}`;
    if (seenBatchKeys.has(batchDedupeKey)) {
      errors.push({
        row: rowNum,
        studentName,
        field: 'duplicate',
        message: `রো #${rowNum}: ফাইলে একই নাম ও পিতার নাম বিশিষ্ট একাধিক রেকর্ড পাওয়া গেছে (পূর্ববর্তী রো #${seenBatchKeys.get(batchDedupeKey)})।`,
        severity: 'warning',
      });
      warningCount++;
    } else {
      seenBatchKeys.set(batchDedupeKey, rowNum);
    }
  });

  const totalRows = students.length;
  const validRows = totalRows - errorCount;
  const isValid = errorCount === 0;
  const canProceed = errorCount === 0;

  return {
    isValid,
    canProceed,
    totalRows,
    validRows,
    errorCount,
    warningCount,
    errors,
    groupStats: {
      science: sciCount,
      humanities: humCount,
      business: busCount,
      general: genCount,
      total: totalRows,
    },
  };
}

// ─── 6. ATOMIC DATABASE INTEGRATION ENGINE (REQUIREMENT 6) ───────────────────
/**
 * Executes the database transaction:
 * - Runs validation.
 * - If abortOnError is true and critical errors exist, halts transaction atomically.
 * - Saves all students into database (localStorage + central sync).
 * - Records audit trail log.
 */
export function executeBulkImport(
  rawStudents: Student[],
  options: BulkImportOptions
): BulkImportExecutionResult {
  const {
    mode = 'merge',
    sortStrategy = 'name_asc',
    targetGrade = '9th',
    autoAssignRolls = true,
    keepUploadedRoll = true, // Default true: retains uploaded roll from file while sorting A-Z
    performedBy = 'অ্যাডমিন / প্রধান শিক্ষক',
    abortOnError = true,
  } = options;

  // 1. Automatic Roll & Sort Processing (Group-wise)
  const rollGenResult = autoAssignRolls
    ? generateGroupWiseRolls(rawStudents, sortStrategy, targetGrade, keepUploadedRoll)
    : {
        students: rawStudents,
        groupStats: {
          science: rawStudents.filter((s) => s.group === 'বিজ্ঞান').length,
          humanities: rawStudents.filter((s) => s.group === 'মানবিক').length,
          business: rawStudents.filter((s) => s.group === 'ব্যবসায় শিক্ষা').length,
          general: rawStudents.filter((s) => s.group === 'সাধারণ').length,
          total: rawStudents.length,
        },
        rollRanges: {},
      };

  const processedStudents = rollGenResult.students;

  // 2. Validate the batch
  const existingAll = typeof window !== 'undefined' ? studentService.getAllStudents() : [];
  const validationReport = validateBulkImportBatch(processedStudents, existingAll);

  if (abortOnError && !validationReport.canProceed) {
    return {
      success: false,
      message: `বাল্ক আপলোড বাতিল করা হয়েছে: ফাইলে ${validationReport.errorCount} টি সংশোধনযোগ্য গুরুতর ত্রুটি রয়েছে।`,
      importedCount: 0,
      groupStats: rollGenResult.groupStats,
      rollRanges: rollGenResult.rollRanges,
      students: processedStudents,
      validationReport,
    };
  }

  // 3. Atomic Database Save
  try {
    let finalStudentList: Student[] = [];

    if (mode === 'replace') {
      // Complete database replacement
      finalStudentList = processedStudents;
    } else if (mode === 'replace_grade') {
      // Replace only target grade (e.g. Class 9) while keeping Classes 6, 7, 8, 10 safe
      const otherGrades = existingAll.filter((s) => {
        const g = s.grade || s.gradeBn || '';
        return targetGrade === '9th'
          ? !g.includes('9') && !g.includes('৯')
          : g !== targetGrade;
      });
      finalStudentList = [...processedStudents, ...otherGrades];
    } else {
      // Merge mode: preserve existing students, update matching ones, append new ones
      const existingMap = new Map<string, Student>();
      existingAll.forEach((s) => {
        const key = `${s.grade}_${s.group || ''}_${s.section || ''}_${s.roll}`;
        existingMap.set(key, s);
      });

      processedStudents.forEach((st) => {
        const key = `${st.grade}_${st.group || ''}_${st.section || ''}_${st.roll}`;
        if (existingMap.has(key)) {
          // Merge updates into existing record
          const current = existingMap.get(key)!;
          existingMap.set(key, {
            ...current,
            ...st,
            photo: st.photo || current.photo || '',
          });
        } else {
          existingMap.set(key, st);
        }
      });

      finalStudentList = Array.from(existingMap.values());
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('sms_students', JSON.stringify(finalStudentList));
      localStorage.removeItem('sms_uploaded_students');
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('sms:students-updated'));
    }

    // Enqueue for central server sync
    processedStudents.forEach((st) => {
      syncQueueService.enqueue('student', st.id, 'CREATE', st).catch(() => {});
    });

    // Record Audit Log
    auditTrailService.addLog({
      action: mode === 'replace' ? 'BULK_IMPORT_REPLACE' : 'BULK_IMPORT_MERGE',
      category: 'STUDENT',
      details: `বাল্ক শিক্ষার্থী আপলোড সফল: মোট ${processedStudents.length} জন (বিজ্ঞান: ${rollGenResult.groupStats.science}, মানবিক: ${rollGenResult.groupStats.humanities}, ব্যবসায় শিক্ষা: ${rollGenResult.groupStats.business}) ডাটাবেজে সংরক্ষিত হয়েছে।`,
      performedBy,
      status: 'SUCCESS',
    });

    return {
      success: true,
      message: `সফলভাবে ${processedStudents.length} জন শিক্ষার্থীর তথ্য ডাটাবেজে সংরক্ষিত হয়েছে!`,
      importedCount: processedStudents.length,
      groupStats: rollGenResult.groupStats,
      rollRanges: rollGenResult.rollRanges,
      students: processedStudents,
      validationReport,
    };
  } catch (err: any) {
    console.error('Failed to commit bulk students:', err);
    return {
      success: false,
      message: 'ডাটাবেজে সংরক্ষণে সমস্যা হয়েছে: ' + (err.message || 'অজানা ত্রুটি'),
      importedCount: 0,
      groupStats: rollGenResult.groupStats,
      rollRanges: rollGenResult.rollRanges,
      students: processedStudents,
      validationReport,
    };
  }
}
