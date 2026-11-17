/**
 * Pure bilingual certificate & testimonial logic engine for SchoolPro.
 * Handles smart gender pronouns, enrollment tense conjugation, trait/purpose
 * composition, Student/Alumni/Exam-Result synchronization, and QR verify links.
 */

import type { Student } from '@/services/studentService';
import type { AlumniRecord } from '@/services/alumniService';
import type { SchoolSettings } from '@/services/settingsService';
import type { CertificateRecord, CertificateType } from '@/services/certificateService';
import { getEnglishSchoolName, getEnglishAddress, getSchoolInitials } from '@/services/settingsService';
import { examService } from '@/services/examService';
import { resultService } from '@/services/resultService';
import { detectGender, translateGroupToEnglish } from '@/components/ssc-transcript/sscTranscriptUtils';

export type CertificateGender = 'male' | 'female' | 'unspecified';
export type CertificateLanguage = 'bn' | 'en';
export type StudentSourceKind = 'active' | 'alumni' | 'manual';

export interface GenderGrammarTokens {
  gender: CertificateGender;
  sonDaughterBn: string;
  studentNounBn: string;
  pronounBn: string;
  possessiveBn: string;
  sonDaughterEn: string;
  heShe: string;
  heSheLower: string;
  hisHer: string;
  HisHer: string;
  himHer: string;
}

export interface TraitOption {
  id: string;
  labelBn: string;
  labelEn: string;
  adjBn: string;
  adjEn: string;
}

export const CERTIFICATE_TRAITS: TraitOption[] = [
  { id: 'meritorious', labelBn: 'মেধাবী', labelEn: 'Meritorious', adjBn: 'মেধাবী', adjEn: 'meritorious' },
  { id: 'regular', labelBn: 'নিয়মিত', labelEn: 'Regular', adjBn: 'নিয়মিত', adjEn: 'regular' },
  { id: 'disciplined', labelBn: 'শৃঙ্খলাপরায়ণ', labelEn: 'Disciplined', adjBn: 'শৃঙ্খলাপরায়ণ', adjEn: 'disciplined' },
  { id: 'polite', labelBn: 'ভদ্র ও বিনয়ী', labelEn: 'Polite & Humble', adjBn: 'ভদ্র ও বিনয়ী', adjEn: 'polite and well-mannered' },
  { id: 'diligent', labelBn: 'পরিশ্রমী', labelEn: 'Diligent', adjBn: 'পরিশ্রমী', adjEn: 'hardworking and diligent' },
  { id: 'responsible', labelBn: 'দায়িত্বশীল', labelEn: 'Responsible', adjBn: 'দায়িত্বশীল', adjEn: 'responsible' },
  { id: 'creative', labelBn: 'সৃজনশীল', labelEn: 'Creative', adjBn: 'সৃজনশীল', adjEn: 'creative' },
  { id: 'honest', labelBn: 'সৎ', labelEn: 'Honest', adjBn: 'সৎ ও চরিত্রবান', adjEn: 'honest and upright' },
];

export interface PurposePreset {
  id: string;
  labelBn: string;
  labelEn: string;
  clauseBn: string;
  clauseEn: string;
}

export const CERTIFICATE_PURPOSES: PurposePreset[] = [
  {
    id: 'higher_study',
    labelBn: 'উচ্চশিক্ষায় ভর্তি',
    labelEn: 'Higher Study Admission',
    clauseBn: 'উচ্চতর শ্রেণিতে / কলেজে ভর্তির সুবিধার্থে এই সনদপত্র প্রদান করা হলো।',
    clauseEn: 'This certificate is issued for the purpose of admission to higher studies.',
  },
  {
    id: 'scholarship',
    labelBn: 'বৃত্তি / উপবৃত্তি আবেদন',
    labelEn: 'Scholarship / Stipend',
    clauseBn: 'শিক্ষা বৃত্তি ও সরকারি উপবৃত্তির আবেদনের নিমিত্তে এই প্রত্যয়নপত্র প্রদান করা হলো।',
    clauseEn: 'This certificate is issued to support an application for academic scholarship or stipend.',
  },
  {
    id: 'abroad',
    labelBn: 'বিদেশে উচ্চশিক্ষা / সুপারিশ',
    labelEn: 'Study Abroad / LOR',
    clauseBn: 'বিদেশে উচ্চশিক্ষা ও প্রাতিষ্ঠানিক সুপারিশের (Letter of Recommendation) জন্য এই সনদপত্র প্রদান করা হলো।',
    clauseEn: 'We strongly recommend the student for higher education opportunities abroad.',
  },
  {
    id: 'job',
    labelBn: 'চাকরি / কর্মসংস্থান',
    labelEn: 'Employment Application',
    clauseBn: 'চাকরি ও দাপ্তরিক আবেদনের প্রয়োজনে এই প্রত্যয়নপত্র প্রদান করা হলো।',
    clauseEn: 'This certificate is issued upon request for employment and official verification purposes.',
  },
  {
    id: 'verification',
    labelBn: 'পাসপোর্ট / ব্যাংক / এনআইডি যাচাই',
    labelEn: 'Passport / Bank / Official ID',
    clauseBn: 'পাসপোর্ট, ব্যাংক হিসাব ও জাতীয় পরিচয়পত্র সংক্রান্ত প্রাতিষ্ঠানিক যাচাইয়ের জন্য এই প্রত্যয়ন প্রদান করা হলো।',
    clauseEn: 'This certificate is issued for identity verification in passport, banking, and official formalities.',
  },
  {
    id: 'general',
    labelBn: 'সাধারণ প্রাতিষ্ঠানিক কাজে',
    labelEn: 'General Official Use',
    clauseBn: 'সংশ্লিষ্ট যেকোনো দাপ্তরিক ও শিক্ষামূলক কাজে ব্যবহারের জন্য এই সনদপত্র প্রদান করা হলো।',
    clauseEn: 'This certificate is issued for general academic and official reference upon request.',
  },
];

export const EDUCATION_BOARDS: Array<{ bn: string; en: string }> = [
  { bn: 'চট্টগ্রাম মাধ্যমিক ও উচ্চ মাধ্যমিক শিক্ষা বোর্ড', en: 'Board of Intermediate and Secondary Education, Chattogram' },
  { bn: 'ঢাকা মাধ্যমিক ও উচ্চ মাধ্যমিক শিক্ষা বোর্ড', en: 'Board of Intermediate and Secondary Education, Dhaka' },
  { bn: 'রাজশাহী মাধ্যমিক ও উচ্চ মাধ্যমিক শিক্ষা বোর্ড', en: 'Board of Intermediate and Secondary Education, Rajshahi' },
  { bn: 'কুমিল্লা মাধ্যমিক ও উচ্চ মাধ্যমিক শিক্ষা বোর্ড', en: 'Board of Intermediate and Secondary Education, Cumilla' },
  { bn: 'যশোর মাধ্যমিক ও উচ্চ মাধ্যমিক শিক্ষা বোর্ড', en: 'Board of Intermediate and Secondary Education, Jashore' },
  { bn: 'বরিশাল মাধ্যমিক ও উচ্চ মাধ্যমিক শিক্ষা বোর্ড', en: 'Board of Intermediate and Secondary Education, Barishal' },
  { bn: 'সিলেট মাধ্যমিক ও উচ্চ মাধ্যমিক শিক্ষা বোর্ড', en: 'Board of Intermediate and Secondary Education, Sylhet' },
  { bn: 'দিনাজপুর মাধ্যমিক ও উচ্চ মাধ্যমিক শিক্ষা বোর্ড', en: 'Board of Intermediate and Secondary Education, Dinajpur' },
  { bn: 'ময়মনসিংহ মাধ্যমিক ও উচ্চ মাধ্যমিক শিক্ষা বোর্ড', en: 'Board of Intermediate and Secondary Education, Mymensingh' },
  { bn: 'বাংলাদেশ মাদ্রাসা শিক্ষা বোর্ড, ঢাকা', en: 'Bangladesh Madrasah Education Board, Dhaka' },
  { bn: 'বাংলাদেশ কারিগরি শিক্ষা বোর্ড, ঢাকা', en: 'Bangladesh Technical Education Board, Dhaka' },
];

export const BOARD_EXAM_TYPES: Array<{ id: string; labelBn: string; labelEn: string }> = [
  { id: 'SSC', labelBn: 'এস.এস.সি (S.S.C.)', labelEn: 'Secondary School Certificate (S.S.C.)' },
  { id: 'DAKHIL', labelBn: 'দাখিল (Dakhil)', labelEn: 'Dakhil Examination' },
  { id: 'SSC_VOC', labelBn: 'এস.এস.সি ভোকেশনাল', labelEn: 'S.S.C. (Vocational) Examination' },
  { id: 'JSC', labelBn: 'জে.এস.সি (J.S.C.)', labelEn: 'Junior School Certificate (J.S.C.)' },
  { id: 'ANNUAL', labelBn: 'বার্ষিক / নির্বাচনি পরীক্ষা', labelEn: 'Annual / Pre-Test Examination' },
];

export const DOTTED_BLANK = '........................';

/** Convert ASCII digits to Bengali numerals. */
export function toBanglaDigits(input?: string | number | null): string {
  if (input === undefined || input === null) return '';
  const map = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(input).replace(/\d/g, (d) => map[Number(d)] ?? d);
}

/** Convert Bengali numerals back to ASCII digits for English output. */
export function toEnglishDigits(input?: string | number | null): string {
  if (input === undefined || input === null) return '';
  const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(input).replace(/[০-৯]/g, (ch) => {
    const idx = bn.indexOf(ch);
    return idx >= 0 ? String(idx) : ch;
  });
}

/** Format numbers cleanly according to selected certificate language. */
export function localizeNumericText(val: string | undefined, lang: CertificateLanguage): string {
  if (!val) return '';
  return lang === 'bn' ? toBanglaDigits(val) : toEnglishDigits(val);
}

/** Sanitize accidental HTML entities (e.g. Cox&#039;S Bazar or &amp;) cleanly. */
export function cleanEntityText(text?: string): string {
  if (!text) return '';
  return text
    .replace(/&#0*39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .trim();
}

/** Format ISO date string into clean Bengali or English calendar display. */
export function formatCertificateDate(dateStr?: string, lang: CertificateLanguage = 'bn'): string {
  if (!dateStr) return lang === 'bn' ? toBanglaDigits(new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0];
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) {
    return localizeNumericText(dateStr, lang);
  }
  const bnMonths = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
  const enMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const d = parsed.getDate();
  const m = parsed.getMonth();
  const y = parsed.getFullYear();
  if (lang === 'bn') {
    return `${toBanglaDigits(d)} ${bnMonths[m] || ''} ${toBanglaDigits(y)}`.trim();
  }
  return `${String(d).padStart(2, '0')} ${enMonths[m] || ''} ${y}`.trim();
}

/** Normalize raw student gender string into structured gender enum. */
export function normalizeCertificateGender(raw?: string, nameHint?: string): CertificateGender {
  const g = (raw || '').trim().toLowerCase();
  if (
    g === 'female' ||
    g === 'f' ||
    g.includes('নারী') ||
    g.includes('মহিলা') ||
    g.includes('মেয়ে') ||
    g.includes('মেয়ে') ||
    g.includes('ছাত্রী')
  ) {
    return 'female';
  }
  if (
    g === 'male' ||
    g === 'm' ||
    g.includes('পুরুষ') ||
    g.includes('ছেলে') ||
    g.includes('ছাত্র')
  ) {
    return 'male';
  }
  if (g === 'other' || g === 'unspecified' || g.includes('অন্যান্য') || g.includes('উল্লেখ')) {
    return 'unspecified';
  }
  if (nameHint && nameHint.trim()) {
    const inferred = detectGender(undefined, nameHint);
    return inferred === 'Female' ? 'female' : 'male';
  }
  return 'unspecified';
}

/** Produce grammatically exact Bangla + English pronouns without "son/daughter" or "He/She" slashes. */
export function resolveGenderGrammar(rawGender?: string, nameHint?: string): GenderGrammarTokens {
  const gender = normalizeCertificateGender(rawGender, nameHint);
  if (gender === 'female') {
    return {
      gender,
      sonDaughterBn: 'কন্যা',
      studentNounBn: 'ছাত্রী',
      pronounBn: 'সে',
      possessiveBn: 'তার',
      sonDaughterEn: 'daughter of',
      heShe: 'She',
      heSheLower: 'she',
      hisHer: 'her',
      HisHer: 'Her',
      himHer: 'her',
    };
  }
  if (gender === 'male') {
    return {
      gender,
      sonDaughterBn: 'পুত্র',
      studentNounBn: 'ছাত্র',
      pronounBn: 'সে',
      possessiveBn: 'তার',
      sonDaughterEn: 'son of',
      heShe: 'He',
      heSheLower: 'he',
      hisHer: 'his',
      HisHer: 'His',
      himHer: 'him',
    };
  }
  return {
    gender: 'unspecified',
    sonDaughterBn: 'সন্তান',
    studentNounBn: 'শিক্ষার্থী',
    pronounBn: 'সে',
    possessiveBn: 'তার',
    sonDaughterEn: 'ward of',
    heShe: 'They',
    heSheLower: 'they',
    hisHer: 'their',
    HisHer: 'Their',
    himHer: 'them',
  };
}

/** Translate class / grade codes gracefully for bilingual rendering. */
export function formatClassLabel(grade?: string, lang: CertificateLanguage = 'bn'): string {
  const g = (grade || '').trim();
  if (!g) return DOTTED_BLANK;
  if (lang === 'bn') {
    if (/6/.test(g) || g.includes('৬')) return '৬ষ্ঠ';
    if (/7/.test(g) || g.includes('৭')) return '৭ম';
    if (/8/.test(g) || g.includes('৮')) return '৮ম';
    if (/9/.test(g) || g.includes('৯')) return '৯ম';
    if (/10/.test(g) || g.includes('১০') || g.toUpperCase().includes('SSC')) return '১০ম';
    return g;
  }
  if (/6/.test(g) || g.includes('৬')) return 'VI (6th)';
  if (/7/.test(g) || g.includes('৭')) return 'VII (7th)';
  if (/8/.test(g) || g.includes('৮')) return 'VIII (8th)';
  if (/9/.test(g) || g.includes('৯')) return 'IX (9th)';
  if (/10/.test(g) || g.includes('১০') || g.toUpperCase().includes('SSC')) return 'X (10th / SSC)';
  return g;
}

/** Translate academic group into clean BN or EN label. */
export function formatGroupLabel(group?: string, lang: CertificateLanguage = 'bn'): string {
  const g = (group || '').trim();
  if (!g) return lang === 'bn' ? 'সাধারণ' : 'General';
  if (lang === 'en') {
    if (g.includes('সাধারণ') || g.toLowerCase().includes('gen')) return 'General';
    return translateGroupToEnglish(g);
  }
  const low = g.toLowerCase();
  if (low.includes('sci')) return 'বিজ্ঞান';
  if (low.includes('hum') || low.includes('art')) return 'মানবিক';
  if (low.includes('bus') || low.includes('com')) return 'ব্যবসায় শিক্ষা';
  if (low.includes('gen')) return 'সাধারণ';
  return g;
}

/** Parse student address string without hardcoded institution-specific village defaults. */
export function parseAddressParts(
  rawAddress?: string,
  schoolSettings?: Partial<SchoolSettings>
): { village: string; postOffice: string; upazila: string; district: string } {
  const clean = cleanEntityText(rawAddress || '')
    .replace(/গ্রাম\s*[:ঃ]?\s*/gi, '')
    .replace(/ডাকঘর\s*[:ঃ]?\s*/gi, '')
    .replace(/উপজেলা\s*[:ঃ]?\s*/gi, '')
    .replace(/জেলা\s*[:ঃ]?\s*/gi, '')
    .replace(/vill(age)?\s*[:.]?\s*/gi, '')
    .replace(/p\.?o\.?\s*[:.]?\s*/gi, '')
    .replace(/upazil+a\s*[:.]?\s*/gi, '')
    .replace(/dist(rict)?\s*[:.]?\s*/gi, '');

  const schoolParts = cleanEntityText(schoolSettings?.address || '')
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  const fallbackUpazila = schoolParts.length >= 2 ? schoolParts[schoolParts.length - 2] : '';
  const fallbackDistrict = schoolParts.length >= 1 ? schoolParts[schoolParts.length - 1] : '';

  if (!clean) {
    return {
      village: '',
      postOffice: '',
      upazila: fallbackUpazila,
      district: fallbackDistrict,
    };
  }

  const parts = clean
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length >= 4) {
    return {
      village: parts[0] || '',
      postOffice: parts[1] || '',
      upazila: parts[2] || fallbackUpazila,
      district: parts[3] || fallbackDistrict,
    };
  }
  if (parts.length === 3) {
    return {
      village: parts[0] || '',
      postOffice: parts[0] || '',
      upazila: parts[1] || fallbackUpazila,
      district: parts[2] || fallbackDistrict,
    };
  }
  if (parts.length === 2) {
    return {
      village: parts[0] || '',
      postOffice: parts[0] || '',
      upazila: parts[1] || fallbackUpazila,
      district: fallbackDistrict,
    };
  }
  return {
    village: parts[0] || '',
    postOffice: parts[0] || '',
    upazila: fallbackUpazila,
    district: fallbackDistrict,
  };
}

/** Generate clean ref number prefix based on school settings initials. */
export function buildDefaultRefNo(schoolSettings?: Partial<SchoolSettings>): string {
  const prefix = schoolSettings?.padRefPrefix?.trim();
  const year = new Date().getFullYear();
  const serial = Math.floor(100 + Math.random() * 900);
  if (prefix) {
    const normalized = prefix.replace(/স্মারক\s*নং\s*[:ঃ]?\s*/gi, '').trim();
    if (normalized) return `${normalized}/${year}/${serial}`;
  }
  const initials = getSchoolInitials(schoolSettings, 'SMS');
  return `${initials}/CERT/${year}/${serial}`;
}

/** Resolve latest exam GPA and grade for an active student using examService + resultService. */
export function resolveStudentLatestResultGpa(student: Student): {
  gpa: string;
  gradeLetter: string;
  examTitle?: string;
} {
  if (student.gpa && String(student.gpa).trim()) {
    const parsed = parseFloat(String(student.gpa));
    const letter = !Number.isNaN(parsed)
      ? parsed >= 5.0
        ? 'A+'
        : parsed >= 4.0
        ? 'A'
        : parsed >= 3.5
        ? 'A-'
        : parsed >= 3.0
        ? 'B'
        : parsed >= 2.0
        ? 'C'
        : 'D'
      : '';
    return { gpa: String(student.gpa).trim(), gradeLetter: letter };
  }

  try {
    const exams = examService.getExams();
    for (const exam of exams) {
      const candidateKeys = Array.from(new Set([exam.id, exam.title].filter(Boolean)));
      for (const examKey of candidateKeys) {
        const calculated = resultService.calculateStudentResult({
          examId: examKey,
          student: {
            id: student.id,
            roll: student.roll,
            name: student.name,
            grade: student.grade,
            gradeBn: student.gradeBn,
            section: student.section,
            branch: student.branch,
            group: student.group,
            optionalSubject: student.optionalSubject,
            religion: student.religion,
          },
          grade: student.grade,
          branch: student.branch || student.section || 'A',
          group: student.group,
        });
        if (calculated && (calculated.enteredSubjectsCount ?? 0) > 0 && calculated.gpa > 0) {
          return {
            gpa: calculated.gpa.toFixed(2),
            gradeLetter: calculated.letterGrade,
            examTitle: exam.title,
          };
        }
      }
    }
  } catch {
    // Graceful fallback when storage is empty or running in SSR tests
  }

  return { gpa: '', gradeLetter: '' };
}

export interface CertificateDraft {
  sourceKind: StudentSourceKind;
  studentId: string;
  studentName: string;
  studentNameEn: string;
  fatherName: string;
  fatherNameEn: string;
  motherName: string;
  motherNameEn: string;
  gender: CertificateGender;
  roll: string;
  grade: string;
  section: string;
  group: string;
  session: string;
  dob: string;
  birthRegNo: string;
  photoUrl: string;
  village: string;
  postOffice: string;
  upazila: string;
  district: string;
  boardRoll: string;
  boardReg: string;
  passingYear: string;
  gpa: string;
  gradeLetter: string;
  gpaScale: string;
  examType: string;
  boardName: string;
  studyPeriod: string;
  currentlyStudying: boolean;
}

/** Map active Student record (+ exam GPA) into certificate studio draft state. */
export function mapStudentToCertificateDraft(
  student: Student,
  schoolSettings?: Partial<SchoolSettings>
): CertificateDraft {
  const addr = parseAddressParts(
    student.permanentAddress || student.currentAddress || '',
    schoolSettings
  );
  const res = resolveStudentLatestResultGpa(student);
  const startY = student.studyStartYear || '';
  const endY = student.studyEndYear || '';
  const studyPeriod = startY && endY ? `${startY} - ${endY}` : student.session || '';

  return {
    sourceKind: 'active',
    studentId: student.id,
    studentName: student.name || '',
    studentNameEn: student.nameEn || (/[a-zA-Z]/.test(student.name || '') ? student.name : ''),
    fatherName: student.fatherName || student.guardian || '',
    fatherNameEn: student.fatherNameEn || '',
    motherName: student.motherName || '',
    motherNameEn: student.motherNameEn || '',
    gender: normalizeCertificateGender(student.gender, student.name),
    roll: student.roll || '',
    grade: student.grade || '10th',
    section: student.section || student.branch || 'A',
    group: student.group || 'সাধারণ',
    session: student.session || String(new Date().getFullYear()),
    dob: student.dob || '',
    birthRegNo: student.birthRegNo || '',
    photoUrl: student.photo || '',
    village: addr.village,
    postOffice: addr.postOffice,
    upazila: addr.upazila,
    district: addr.district,
    boardRoll: student.sscRoll || '',
    boardReg: student.registrationNo || '',
    passingYear: String(new Date().getFullYear()),
    gpa: res.gpa,
    gradeLetter: res.gradeLetter,
    gpaScale: '5.00',
    examType: 'SSC',
    boardName: EDUCATION_BOARDS[0].bn,
    studyPeriod,
    currentlyStudying: true,
  };
}

/** Map AlumniRecord into certificate studio draft state (pre-configured as passed/alumni). */
export function mapAlumniToCertificateDraft(
  alumni: AlumniRecord,
  schoolSettings?: Partial<SchoolSettings>
): CertificateDraft {
  const addr = parseAddressParts(alumni.address || '', schoolSettings);
  const gpaNum = alumni.gpa ? parseFloat(alumni.gpa) : NaN;
  const gradeLetter = !Number.isNaN(gpaNum)
    ? gpaNum >= 5.0
      ? 'A+'
      : gpaNum >= 4.0
      ? 'A'
      : gpaNum >= 3.5
      ? 'A-'
      : gpaNum >= 3.0
      ? 'B'
      : 'C'
    : '';

  return {
    sourceKind: 'alumni',
    studentId: alumni.studentId || alumni.id,
    studentName: alumni.name || '',
    studentNameEn: /[a-zA-Z]/.test(alumni.name || '') ? alumni.name : '',
    fatherName: alumni.fatherName || '',
    fatherNameEn: '',
    motherName: alumni.motherName || '',
    motherNameEn: '',
    gender: normalizeCertificateGender(undefined, alumni.name),
    roll: alumni.sscRoll || '',
    grade: '10th',
    section: 'A',
    group: alumni.group || 'সাধারণ',
    session: alumni.batch || alumni.passingYear || '',
    dob: '',
    birthRegNo: '',
    photoUrl: '',
    village: addr.village,
    postOffice: addr.postOffice,
    upazila: addr.upazila,
    district: addr.district,
    boardRoll: alumni.sscRoll || '',
    boardReg: alumni.regNo || '',
    passingYear: alumni.passingYear || String(new Date().getFullYear()),
    gpa: alumni.gpa || '',
    gradeLetter,
    gpaScale: '5.00',
    examType: 'SSC',
    boardName: EDUCATION_BOARDS[0].bn,
    studyPeriod: alumni.batch || '',
    currentlyStudying: false,
  };
}

export interface ComposeBodyInput {
  type: CertificateType;
  language: CertificateLanguage;
  draft: CertificateDraft;
  schoolSettings?: Partial<SchoolSettings>;
  selectedTraits: string[];
  purposeId: string;
  customPurposeText?: string;
  achievementTitle?: string;
  characterRemarks?: string;
}

/** Build safe parent/guardian text avoiding dangling commas when father or mother is empty. */
function formatAddressClause(draft: CertificateDraft, lang: CertificateLanguage): string {
  const vill = cleanEntityText(draft.village) || DOTTED_BLANK;
  const po = cleanEntityText(draft.postOffice) || DOTTED_BLANK;
  const upz = cleanEntityText(draft.upazila) || DOTTED_BLANK;
  const dist = cleanEntityText(draft.district) || DOTTED_BLANK;
  if (lang === 'bn') {
    return `গ্রাম: ${vill}, ডাকঘর: ${po}, উপজেলা: ${upz}, জেলা: ${dist}`;
  }
  return `Village: ${vill}, Post Office: ${po}, Upazila: ${upz}, District: ${dist}`;
}

/** Resolve default formal title for a certificate type and language. */
export function getDefaultCertificateTitle(type: CertificateType, lang: CertificateLanguage): string {
  const titles: Record<CertificateType, { bn: string; en: string }> = {
    current_student: { bn: 'অধ্যয়নরত প্রত্যয়ন পত্র', en: 'CERTIFICATE OF STUDENTSHIP' },
    character_certificate: { bn: 'চারিত্রিক সনদ পত্র', en: 'CHARACTER CERTIFICATE' },
    transfer_certificate: { bn: 'বিদ্যালয় ছাড়পত্র (TC)', en: 'TRANSFER CERTIFICATE' },
    ssc_testimonial: { bn: 'প্রশংসাপত্র (TESTIMONIAL)', en: 'TESTIMONIAL' },
    student_verification: { bn: 'শিক্ষার্থী তথ্য যাচাইকরণ প্রত্যয়ন', en: 'STUDENT VERIFICATION CERTIFICATE' },
    merit_certificate: { bn: 'মেধা সনদ পত্র', en: 'CERTIFICATE OF MERIT' },
    appreciation: { bn: 'কৃতিত্ব ও প্রশংসা সনদ', en: 'CERTIFICATE OF APPRECIATION' },
    participation: { bn: 'সহশিক্ষা অংশগ্রহণ সনদ', en: 'CERTIFICATE OF PARTICIPATION' },
    activity_certificate: { bn: 'সহশিক্ষা ও অভিজ্ঞতা সনদ', en: 'EXPERIENCE & ACTIVITY CERTIFICATE' },
    custom_certificate: { bn: 'প্রাতিষ্ঠানিক প্রত্যয়ন পত্র', en: 'TO WHOM IT MAY CONCERN' },
  };
  return titles[type]?.[lang] || (lang === 'bn' ? 'প্রত্যয়ন পত্র' : 'CERTIFICATE');
}

/**
 * Compose crisp, grammatically correct bilingual certificate prose using gender,
 * enrollment tense, trait pills, purpose preset, and board/exam metadata.
 */
export function composeCertificateBody(input: ComposeBodyInput): string {
  const {
    type,
    language: lang,
    draft,
    schoolSettings,
    selectedTraits,
    purposeId,
    customPurposeText,
    achievementTitle,
    characterRemarks,
  } = input;

  const grammar = resolveGenderGrammar(
    draft.gender,
    lang === 'en' ? draft.studentNameEn || draft.studentName : draft.studentName
  );
  const studentDisplayName =
    cleanEntityText(lang === 'en' ? draft.studentNameEn || draft.studentName : draft.studentName) ||
    DOTTED_BLANK;
  const fatherDisplay =
    cleanEntityText(lang === 'en' ? draft.fatherNameEn || draft.fatherName : draft.fatherName) ||
    DOTTED_BLANK;
  const motherDisplay =
    cleanEntityText(lang === 'en' ? draft.motherNameEn || draft.motherName : draft.motherName) ||
    DOTTED_BLANK;

  const schoolNameDisplay =
    lang === 'en'
      ? cleanEntityText(getEnglishSchoolName(schoolSettings, 'This Institution'))
      : cleanEntityText(schoolSettings?.schoolName || 'অত্র বিদ্যালয়');

  const addrClause = formatAddressClause(draft, lang);
  const classLabel = formatClassLabel(draft.grade, lang);
  const groupLabel = formatGroupLabel(draft.group, lang);
  const rollLabel = localizeNumericText(draft.roll || DOTTED_BLANK, lang);
  const sessionLabel = localizeNumericText(draft.session || DOTTED_BLANK, lang);
  const dobLabel = draft.dob ? formatCertificateDate(draft.dob, lang) : DOTTED_BLANK;
  const boardRoll = localizeNumericText(draft.boardRoll || draft.roll || DOTTED_BLANK, lang);
  const boardReg = localizeNumericText(draft.boardReg || DOTTED_BLANK, lang);
  const passYear = localizeNumericText(draft.passingYear || String(new Date().getFullYear()), lang);
  const gpaVal = localizeNumericText(draft.gpa || DOTTED_BLANK, lang);
  const gpaScale = localizeNumericText(draft.gpaScale || '5.00', lang);

  const selectedTraitObjs = CERTIFICATE_TRAITS.filter((t) => selectedTraits.includes(t.id));
  const traitsClauseBn =
    selectedTraitObjs.length > 0
      ? selectedTraitObjs.map((t) => t.adjBn).join(', ')
      : 'নিয়মিত, বিনয়ী ও শৃঙ্খলাপরায়ণ';
  const traitsClauseEn =
    selectedTraitObjs.length > 0
      ? selectedTraitObjs.map((t) => t.adjEn).join(', ')
      : 'disciplined, regular, and well-mannered';

  const purposePreset = CERTIFICATE_PURPOSES.find((p) => p.id === purposeId);
  const purposeLine =
    purposeId === 'custom' && customPurposeText?.trim()
      ? customPurposeText.trim()
      : purposePreset
      ? lang === 'bn'
        ? purposePreset.clauseBn
        : purposePreset.clauseEn
      : '';

  const examInfo = BOARD_EXAM_TYPES.find((e) => e.id === draft.examType) || BOARD_EXAM_TYPES[0];
  const matchedBoard = EDUCATION_BOARDS.find(
    (b) => b.bn === draft.boardName || b.en === draft.boardName
  );
  const boardLabel =
    lang === 'en'
      ? matchedBoard?.en || cleanEntityText(draft.boardName) || EDUCATION_BOARDS[0].en
      : matchedBoard?.bn || cleanEntityText(draft.boardName) || EDUCATION_BOARDS[0].bn;

  // ── 1. TESTIMONIAL (SSC / Institutional) ───────────────────────────────────
  if (type === 'ssc_testimonial') {
    if (lang === 'en') {
      const statusSentence = draft.currentlyStudying
        ? `is a bona fide student of **${schoolNameDisplay}**, currently studying in Class **${classLabel}** (${groupLabel} Group), Roll No. **${rollLabel}**, Session **${sessionLabel}**.`
        : `was a bona fide student of **${schoolNameDisplay}** under Session **${sessionLabel}** (${groupLabel} Group) and passed the **${examInfo.labelEn}** held in **${passYear}** under the ${boardLabel} bearing Roll No. **${boardRoll}**, Registration No. **${boardReg}**, securing **GPA ${gpaVal}**${draft.gradeLetter ? ` (Grade **${draft.gradeLetter}**)` : ''} out of ${gpaScale}.`;

      const dobSentence = draft.dob
        ? ` According to the school admission register, ${grammar.hisHer} date of birth is **${dobLabel}**.`
        : '';

      const p1 = `This is to certify that **${studentDisplayName}**, ${grammar.sonDaughterEn} **${fatherDisplay}** and **${motherDisplay}**, ${addrClause}, ${statusSentence}${dobSentence}`;
      const p2 = `During ${grammar.hisHer} stay in this institution, ${grammar.heSheLower} was found to be ${traitsClauseEn}. ${characterRemarks?.trim() || `To the best of my knowledge, ${grammar.heSheLower} bears a good moral character and took no part in any activity subversive of the state or institutional discipline.`}`;
      const p3 = [purposeLine, `I wish ${grammar.himHer} every success in future life and academic endeavors.`].filter(Boolean).join(' ');
      return [p1, p2, p3].join('\n\n');
    }

    const statusBn = draft.currentlyStudying
      ? `${schoolNameDisplay}-এর **${classLabel}** শ্রেণির **${groupLabel}** বিভাগের একজন নিয়মিত ${grammar.studentNounBn} (শ্রেণি রোল: **${rollLabel}**, শিক্ষাবর্ষ: **${sessionLabel}**)।`
      : `${schoolNameDisplay}-এর **${sessionLabel}** শিক্ষাবর্ষের **${groupLabel}** বিভাগের একজন নিয়মিত ${grammar.studentNounBn} ছিলেন এবং **${boardLabel}**-এর অধীনে **${passYear}** সালে অনুষ্ঠিত **${examInfo.labelBn}** পরীক্ষায় অংশগ্রহণ করে **GPA ${gpaVal}**${draft.gradeLetter ? ` (গ্রেড: **${draft.gradeLetter}**)` : ''} (রোল নং: **${boardRoll}**, রেজি. নং: **${boardReg}**) অর্জন করে কৃতিত্বের সাথে উত্তীর্ণ হয়েছেন।`;
    const dobBn = draft.dob ? ` বিদ্যালয়ের ভর্তি রেজিস্টার অনুযায়ী ${grammar.possessiveBn} জন্ম তারিখ **${dobLabel}** খ্রি.।` : '';

    const p1 = `এই মর্মে **প্রশংসাপত্র** প্রদান করা যাচ্ছে যে, **${studentDisplayName}**, পিতা: **${fatherDisplay}**, মাতা: **${motherDisplay}**, ${addrClause}। ${grammar.pronounBn} ${statusBn}${dobBn}`;
    const p2 = `অত্র বিদ্যালয়ে অধ্যয়নকালে ${grammar.possessiveBn} স্বভাব-চরিত্র ছিল ${traitsClauseBn}। ${characterRemarks?.trim() || `আমার জানামতে ${grammar.pronounBn} রাষ্ট্র বা বিদ্যালয়ের শৃঙ্খলা পরিপন্থী কোনো কর্মকাণ্ডে কখনো জড়িত ছিলেন না।`}`;
    const p3 = [purposeLine, `আমি ${grammar.possessiveBn} জীবনের সর্বাঙ্গীন সাফল্য ও উজ্জ্বল ভবিষ্যৎ কামনা করি।`].filter(Boolean).join(' ');
    return [p1, p2, p3].join('\n\n');
  }

  // ── 2. TRANSFER CERTIFICATE (TC) ───────────────────────────────────────────
  if (type === 'transfer_certificate') {
    if (lang === 'en') {
      const p1 = `This is to certify that **${studentDisplayName}**, ${grammar.sonDaughterEn} **${fatherDisplay}** and **${motherDisplay}**, ${addrClause}, was a regular student of Class **${classLabel}** (${groupLabel} Group), Roll No. **${rollLabel}**, Session **${sessionLabel}** at **${schoolNameDisplay}**.${draft.dob ? ` ${grammar.HisHer} date of birth according to the school register is **${dobLabel}**.` : ''}`;
      const p2 = `${grammar.heShe} has cleared all school dues and fees up to date. During ${grammar.hisHer} tenure, ${grammar.heSheLower} was ${traitsClauseEn}, and ${grammar.hisHer} conduct was satisfactory. This Transfer Certificate is issued upon the guardian's application.`;
      const p3 = `We wish ${grammar.himHer} bright prospects ahead.`;
      return [p1, p2, p3].join('\n\n');
    }

    const p1 = `এই মর্মে **বিদ্যালয় ছাড়পত্র (TC)** প্রদান করা যাচ্ছে যে, **${studentDisplayName}**, পিতা: **${fatherDisplay}**, মাতা: **${motherDisplay}**, ${addrClause}। ${grammar.pronounBn} অত্র বিদ্যালয়ের **${classLabel}** শ্রেণির **${groupLabel}** বিভাগের একজন নিয়মিত ${grammar.studentNounBn} ছিল (রোল: **${rollLabel}**, সেশন: **${sessionLabel}**)।${draft.dob ? ` ভর্তিবহি অনুযায়ী ${grammar.possessiveBn} জন্ম তারিখ: **${dobLabel}** খ্রি.।` : ''}`;
    const p2 = `অত্র বিদ্যালয়ে অবস্থানকালে ${grammar.possessiveBn} স্বভাব-চরিত্র ছিল ${traitsClauseBn} এবং বিদ্যালয়ের সমুদয় পাওনাদি পরিশোধিত হয়েছে। অভিভাবকের আবেদনের প্রেক্ষিতে তাকে এই ছাড়পত্র প্রদান করা হলো।`;
    const p3 = [purposeLine, `আমি ${grammar.possessiveBn} উত্তরোত্তর মঙ্গল ও সাফল্য কামনা করি।`].filter(Boolean).join(' ');
    return [p1, p2, p3].join('\n\n');
  }

  // ── 3. ACHIEVEMENT / MERIT / PARTICIPATION / ACTIVITY ─────────────────────
  if (
    type === 'merit_certificate' ||
    type === 'appreciation' ||
    type === 'participation' ||
    type === 'activity_certificate'
  ) {
    const meritDetail =
      achievementTitle?.trim() ||
      (lang === 'bn' ? 'প্রাতিষ্ঠানিক কৃতিত্ব ও সহশিক্ষা কার্যক্রম' : 'Outstanding Academic & Co-curricular Excellence');
    if (lang === 'en') {
      const gpaNote = draft.gpa ? ` achieving **GPA ${gpaVal}**` : '';
      const p1 = `This certificate is proudly awarded to **${studentDisplayName}**, ${grammar.sonDaughterEn} **${fatherDisplay}** and **${motherDisplay}**, student of Class **${classLabel}**, Roll No. **${rollLabel}**, Session **${sessionLabel}** at **${schoolNameDisplay}**, in recognition of **${meritDetail}**${gpaNote}.`;
      const p2 = `${grammar.heShe} has consistently demonstrated ${traitsClauseEn} qualities during academic and co-curricular engagements.`;
      const p3 = [purposeLine, `We wish ${grammar.himHer} continued brilliance and success.`].filter(Boolean).join(' ');
      return [p1, p2, p3].join('\n\n');
    }

    const gpaNoteBn = draft.gpa ? ` (অর্জিত জিপিএ: **${gpaVal}**)` : '';
    const p1 = `অত্যন্ত আনন্দের সাথে প্রত্যয়ন করা যাচ্ছে যে, **${studentDisplayName}**, পিতা: **${fatherDisplay}**, মাতা: **${motherDisplay}**, ${addrClause}, অত্র বিদ্যালয়ের **${classLabel}** শ্রেণির **${groupLabel}** বিভাগের একজন নিয়মিত ${grammar.studentNounBn} (রোল: **${rollLabel}**, শিক্ষাবর্ষ: **${sessionLabel}**) — **${meritDetail}**${gpaNoteBn}-এ গৌরবোজ্জ্বল কৃতিত্ব প্রদর্শনের স্বীকৃতিস্বরূপ এই সনদপত্র লাভ করেছে।`;
    const p2 = `${grammar.pronounBn} অত্যন্ত ${traitsClauseBn} হিসেবে বিদ্যালয়ের সুনাম বৃদ্ধি করেছে।`;
    const p3 = [purposeLine, `আমরা ${grammar.possessiveBn} উজ্জ্বল ভবিষ্যৎ ও অব্যাহত সাফল্য কামনা করি।`].filter(Boolean).join(' ');
    return [p1, p2, p3].join('\n\n');
  }

  // ── 4. CURRENT STUDENT / CHARACTER / VERIFICATION / CUSTOM ─────────────────
  if (lang === 'en') {
    const enrollmentPhrase = draft.currentlyStudying
      ? `is a bona fide regular student currently studying in Class **${classLabel}** (${groupLabel} Group), Roll No. **${rollLabel}**, Session **${sessionLabel}** at **${schoolNameDisplay}**.`
      : `was a bona fide student of Class **${classLabel}** (${groupLabel} Group), Roll No. **${rollLabel}**, Session **${sessionLabel}** at **${schoolNameDisplay}**.`;
    const dobNote = draft.dob ? ` ${grammar.HisHer} date of birth as per admission register is **${dobLabel}**.` : '';
    const gpaNote = draft.gpa ? ` ${grammar.heShe} secured **GPA ${gpaVal}** in the latest institutional assessment.` : '';
    const p1 = `This is to certify that **${studentDisplayName}**, ${grammar.sonDaughterEn} **${fatherDisplay}** and **${motherDisplay}**, ${addrClause}, ${enrollmentPhrase}${dobNote}${gpaNote}`;
    const p2 = `During ${grammar.hisHer} study period, ${grammar.heSheLower} has been ${traitsClauseEn}. ${characterRemarks?.trim() || `To the best of my knowledge, ${grammar.hisHer} moral character and conduct are commendable, and ${grammar.heSheLower} is not involved in any anti-social or anti-state activity.`}`;
    const p3 = [purposeLine, `I wish ${grammar.himHer} every success in life.`].filter(Boolean).join(' ');
    return [p1, p2, p3].join('\n\n');
  }

  const enrollmentBn = draft.currentlyStudying
    ? `বর্তমানে অত্র বিদ্যালয়ের **${classLabel}** শ্রেণির **${groupLabel}** বিভাগের একজন নিয়মিত ${grammar.studentNounBn} হিসেবে অধ্যয়নরত আছে (রোল নম্বর: **${rollLabel}**, সেশন: **${sessionLabel}**)।`
    : `অত্র বিদ্যালয়ের **${classLabel}** শ্রেণির **${groupLabel}** বিভাগের একজন নিয়মিত ${grammar.studentNounBn} ছিল (রোল নম্বর: **${rollLabel}**, সেশন: **${sessionLabel}**)।`;
  const dobNoteBn = draft.dob ? ` ভর্তিবহি অনুযায়ী ${grammar.possessiveBn} জন্ম তারিখ **${dobLabel}** খ্রি.।` : '';
  const birthRegNoteBn =
    type === 'student_verification' && draft.birthRegNo
      ? ` ডিজিটাল জন্ম নিবন্ধন নং: **${localizeNumericText(draft.birthRegNo, 'bn')}** এবং শিক্ষার্থী আইডি: **${draft.studentId}**।`
      : '';
  const gpaNoteBn = draft.gpa ? ` সর্বশেষ মূল্যায়নে অর্জিত জিপিএ: **${gpaVal}**।` : '';

  const p1 = `এই মর্মে **${getDefaultCertificateTitle(type, 'bn')}** প্রদান করা যাচ্ছে যে, **${studentDisplayName}**, পিতা: **${fatherDisplay}**, মাতা: **${motherDisplay}**, ${addrClause}। ${grammar.pronounBn} ${enrollmentBn}${dobNoteBn}${birthRegNoteBn}${gpaNoteBn}`;
  const p2 = `বিদ্যালয়ে অধ্যয়নকালে ${grammar.possessiveBn} নৈতিক চরিত্র, শৃঙ্খলাবোধ ও আচার-ব্যবহার ${traitsClauseBn} ছিল। ${characterRemarks?.trim() || `আমার জানামতে ${grammar.pronounBn} কোনো প্রকার রাষ্ট্রবিরোধী বা শৃঙ্খলাপরিপন্থী কর্মকাণ্ডে জড়িত নয়।`}`;
  const p3 = [purposeLine, `আমি ${grammar.possessiveBn} জীবনের সর্বাঙ্গীন মঙ্গল ও উত্তরোত্তর সমৃদ্ধি কামনা করি।`].filter(Boolean).join(' ');
  return [p1, p2, p3].join('\n\n');
}

/** Build public `/verify-certificate` verification URL encoded inside QR code. */
export function buildCertificateVerifyUrl(
  cert: Partial<CertificateRecord>,
  originOverride?: string
): string {
  const origin =
    originOverride ||
    (typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://schoolpro.app');
  const params = new URLSearchParams();
  if (cert.id) params.set('id', cert.id);
  if (cert.studentNameEn || cert.studentName) {
    params.set('n', cert.studentNameEn || cert.studentName || '');
  }
  if (cert.boardRoll || cert.roll) params.set('r', cert.boardRoll || cert.roll || '');
  if (cert.boardReg) params.set('reg', cert.boardReg);
  if (cert.gpa) params.set('g', cert.gpa);
  if (cert.passingYear) params.set('y', cert.passingYear);
  if (cert.fatherName) params.set('f', cert.fatherName);
  if (cert.motherName) params.set('m', cert.motherName);
  if (cert.group) params.set('grp', cert.group);
  if (cert.session) params.set('s', cert.session);
  if (cert.issueDate) params.set('d', cert.issueDate);
  return `${origin}/verify-certificate?${params.toString()}`;
}
