import { Student } from '@/services/studentService';
import {
  SchoolSettings,
  getEnglishSchoolName as resolveEnglishSchoolName,
  getEnglishAddress as resolveEnglishAddress,
} from '@/services/settingsService';
import { AppLanguage } from '@/services/languageService';
import { CertificateRecord } from '@/services/certificateService';

export type MainTab =
  | 'single_generator'
  | 'bulk_generator'
  | 'batch_print'
  | 'register'
  | 'settings'
  | 'border_manager';

export interface SSCTestimonialRecord {
  id: string;
  studentId: string;
  studentName: string;
  fatherName: string;
  motherName: string;
  village?: string;
  postOffice?: string;
  upazilla?: string;
  upazila?: string;
  district?: string;
  dob: string;
  dobWords?: string;
  gender: 'Male' | 'Female' | 'Other';
  schoolName: string;
  schoolNameEn: string;
  schoolAddress: string;
  schoolAddressEn: string;
  eiin: string;
  boardName: string;
  centerName: string;
  group: string;
  boardRoll: string;
  boardReg: string;
  session: string;
  passingYear: string;
  gpa: string;
  gradeLetter: string;
  issueDate: string;
  refNo: string;
  characterRemarks?: string;
}

export interface PrintLayoutConfig {
  fontScale: number;
  topMargin: number;
  leftMargin: number;
  rightMargin: number;
  bottomMargin: number;
  lineHeight: 'tight' | 'normal' | 'relaxed';
  signatureGap: number;
  borderOpacity: number;
  borderInset: number;
  customPhone?: string;
  titleStyle?: 'cinzel' | 'playfair' | 'classic';
}

export const DEFAULT_LAYOUT_CONFIG: PrintLayoutConfig = {
  fontScale: 100,
  topMargin: 0.5,
  leftMargin: 0.5,
  rightMargin: 0.5,
  bottomMargin: 0.5,
  lineHeight: 'normal',
  signatureGap: 18,
  borderOpacity: 1.0,
  borderInset: 0,
  customPhone: '',
  titleStyle: 'cinzel',
};

export function getEnglishPrincipalName(name?: string): string {
  if (!name || !name.trim()) return 'MOHAMMAD RAFIQUL ISLAM';
  const trimmed = name.trim();
  if (/[a-zA-Z]/.test(trimmed)) {
    return trimmed.toUpperCase();
  }
  const bengaliMap: Record<string, string> = {
    'মোহাম্মদ রফিকুল ইসলাম': 'MOHAMMAD RAFIQUL ISLAM',
    'মো: রফিকুল ইসলাম': 'MD. RAFIQUL ISLAM',
    'মোঃ রফিকুল ইসলাম': 'MD. RAFIQUL ISLAM',
    'মোহাম্মদ নুরুল ইসলাম': 'MOHAMMAD NURUL ISLAM',
    'মোঃ নুরুল ইসলাম': 'MD. NURUL ISLAM',
    'মোহাম্মদ আবুল কালাম': 'MOHAMMAD ABUL KALAM',
    'মোঃ আবুল কালাম': 'MD. ABUL KALAM',
    'আব্দুর রহমান': 'ABDUR RAHMAN',
    'মো: আব্দুর রহমান': 'MD. ABDUR RAHMAN',
  };
  if (bengaliMap[trimmed]) return bengaliMap[trimmed];

  const converted = trimmed
    .replace(/মোহাম্মদ/g, 'MOHAMMAD')
    .replace(/মোঃ/g, 'MD.')
    .replace(/মো:/g, 'MD.')
    .replace(/মাওলানা/g, 'MAULANA')
    .replace(/ড./g, 'DR.')
    .replace(/ডক্টর/g, 'DR.')
    .replace(/রফিকুল/g, 'RAFIQUL')
    .replace(/ইসলাম/g, 'ISLAM')
    .replace(/আহমেদ/g, 'AHMED')
    .replace(/হোসেন/g, 'HOSSAIN')
    .replace(/রহমান/g, 'RAHMAN')
    .replace(/উদ্দিন/g, 'UDDIN')
    .replace(/চৌধুরী/g, 'CHOWDHURY')
    .replace(/খান/g, 'KHAN')
    .replace(/হক/g, 'HAQUE')
    .replace(/আলী/g, 'ALI')
    .replace(/কালাম/g, 'KALAM')
    .replace(/হাসান/g, 'HASAN');

  return /[a-zA-Z]/.test(converted) ? converted : trimmed;
}

export function cleanFatherName(name?: string): string {
  if (!name || !name.trim()) return 'Md. Guardian';
  return name.trim().replace(/^Mr\.?\s+/i, '');
}

export function cleanMotherName(name?: string): string {
  if (!name || !name.trim()) return 'Fatema Begum';
  return name.trim().replace(/^Mrs\.?\s+/i, '');
}

export function getEnglishPrincipalTitle(title?: string): string {
  if (!title || !title.trim()) return 'Headmaster';
  const t = title.trim();
  if (t.includes('প্রধান শিক্ষক') || t.toLowerCase().includes('headmaster')) return 'Headmaster';
  if (t.includes('অধ্যক্ষ') || t.toLowerCase().includes('principal')) return 'Principal';
  if (t.includes('ভারপ্রাপ্ত') || t.toLowerCase().includes('acting')) return 'Acting Headmaster';
  return t;
}

export function detectGender(genderRaw?: string, name?: string): 'Male' | 'Female' | 'Other' {
  if (genderRaw) {
    const g = genderRaw.trim().toLowerCase();
    if (g === 'female' || g === 'মহিলা' || g === 'ছাত্রী' || g === 'f') return 'Female';
    if (g === 'male' || g === 'পুরুষ' || g === 'ছাত্র' || g === 'm') return 'Male';
  }
  if (name) {
    const n = name.trim().toLowerCase();
    if (
      n.includes('আক্তার') || n.includes('খাতুন') || n.includes('বেগম') ||
      n.includes('শ্রাবন্তী') || n.includes('ফাতিমা') || n.includes('ফাতেমা') ||
      n.includes('জান্নাত') || n.includes('নুসরাত') || n.includes('মারিয়া') ||
      n.includes('মিতা') || n.includes('অনিকা') || n.includes('তানজিলা') ||
      n.includes('রোকসানা') || n.includes('আয়েশা') || n.includes('সুলতানা') ||
      n.includes('রুবিনা') || n.includes('শারমিন') || n.includes('সানজিদা') ||
      n.includes('akter') || n.includes('khatun') || n.includes('begum') ||
      n.includes('shrabanti') || n.includes('fatema') || n.includes('jannat') ||
      n.includes('anika') || n.includes('sultana') || n.includes('ayesha') ||
      n.includes('sarmin') || n.includes('nusrat') || n.includes('maria')
    ) {
      return 'Female';
    }
  }
  return 'Male';
}

export function translateGroupToEnglish(grp?: string): string {
  if (!grp) return 'Science';
  const g = grp.toLowerCase();
  if (g.includes('বিজ্ঞান') || g.includes('sci')) return 'Science';
  if (g.includes('মানবিক') || g.includes('hum') || g.includes('art')) return 'Humanities';
  if (g.includes('ব্যবসায়') || g.includes('ব্যবসা') || g.includes('com') || g.includes('bus')) return 'Business Studies';
  return grp;
}

export function translateBoardToEnglish(board?: string): string {
  if (!board) return 'Board of Intermediate and Secondary Education, Chattogram';
  const b = board.toLowerCase();
  const boardMappings: Array<[string[], string]> = [
    [['চট্টগ্রাম', 'chattogram', 'chittagong'], 'Board of Intermediate and Secondary Education, Chattogram'],
    [['ঢাকা', 'dhaka'], 'Board of Intermediate and Secondary Education, Dhaka'],
    [['রাজশাহী', 'rajshahi'], 'Board of Intermediate and Secondary Education, Rajshahi'],
    [['কুমিল্লা', 'comilla', 'cumilla'], 'Board of Intermediate and Secondary Education, Cumilla'],
    [['যশোর', 'jessore', 'jashore'], 'Board of Intermediate and Secondary Education, Jashore'],
    [['বরিশাল', 'barisal', 'barishal'], 'Board of Intermediate and Secondary Education, Barishal'],
    [['সিলেট', 'sylhet'], 'Board of Intermediate and Secondary Education, Sylhet'],
    [['দিনাজপুর', 'dinajpur'], 'Board of Intermediate and Secondary Education, Dinajpur'],
    [['ময়মনসিংহ', 'mymensingh'], 'Board of Intermediate and Secondary Education, Mymensingh'],
    [['মাদ্রাসা', 'madrasah'], 'Bangladesh Madrasah Education Board, Dhaka'],
    [['কারিগরি', 'technical'], 'Bangladesh Technical Education Board, Dhaka'],
  ];

  for (const [tokens, englishName] of boardMappings) {
    if (tokens.some((t) => b.includes(t))) return englishName;
  }
  return board;
}

export function getEnglishSchoolName(nameBn?: string): string {
  return resolveEnglishSchoolName({ schoolName: nameBn }).toUpperCase();
}

export function getEnglishSchoolAddress(addrBn?: string): string {
  return resolveEnglishAddress({ address: addrBn });
}

export function formatDobInWords(dobStr?: string): string {
  if (!dobStr) return '';
  try {
    const parts = dobStr.includes('-') ? dobStr.split('-') : dobStr.split('/');
    let year = 2009;
    let month = 5;
    let day = 14;
    if (parts[0].length === 4) {
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      day = parseInt(parts[2], 10);
    } else {
      day = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      year = parseInt(parts[2], 10);
    }
    const days = [
      '', 'First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth',
      'Eleventh', 'Twelfth', 'Thirteenth', 'Fourteenth', 'Fifteenth', 'Sixteenth', 'Seventeenth', 'Eighteenth',
      'Nineteenth', 'Twentieth', 'Twenty-First', 'Twenty-Second', 'Twenty-Third', 'Twenty-Fourth', 'Twenty-Fifth',
      'Twenty-Sixth', 'Twenty-Seventh', 'Twenty-Eighth', 'Twenty-Ninth', 'Thirtieth', 'Thirty-First',
    ];
    const months = [
      '', 'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const dayWord = days[day] || `${day}th`;
    const monthWord = months[month] || '';

    let yearWord = `${year}`;
    if (year >= 2000 && year < 2100) {
      const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
      const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
      const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
      const rem = year - 2000;
      if (rem === 0) yearWord = 'Two Thousand';
      else if (rem < 10) yearWord = `Two Thousand ${units[rem]}`;
      else if (rem < 20) yearWord = `Two Thousand ${teens[rem - 10]}`;
      else {
        const t = Math.floor(rem / 10);
        const u = rem % 10;
        yearWord = `Two Thousand ${tens[t]}${u > 0 ? '-' + units[u] : ''}`;
      }
    }
    return `${dayWord} ${monthWord} ${yearWord}`.trim();
  } catch {
    return '';
  }
}

export function getStudentExtraField(student: Student, key: string): string | undefined {
  return (student as unknown as Record<string, string | undefined>)[key];
}

export function buildRecordFromStudent(
  student: Student,
  schoolSettings: SchoolSettings,
  passingYearFilter: string,
  currentLang: AppLanguage,
  rollOffset = 0,
  customGpa = '5.00',
  customBoardRoll?: string
): SSCTestimonialRecord {
  const englishGroup = translateGroupToEnglish(student.group);
  const boardRollVal = customBoardRoll || (102900 + parseInt(student.roll || '1', 10) + rollOffset).toString();
  const boardRegVal = `1810293${(parseInt(student.roll || '1', 10) + rollOffset).toString().padStart(3, '0')}`;
  const id = `TESTIMONIAL-SSC-${passingYearFilter}-${student.id || Math.random().toString(36).substring(7)}`;
  const studentGender: 'Male' | 'Female' | 'Other' = detectGender(student.gender, student.name);
  const dobStr = student.dob || '2009-05-14';

  return {
    id,
    studentId: student.id,
    studentName: student.name,
    fatherName: student.fatherName || 'Md. Rafiqul Islam',
    motherName: student.motherName || 'Fatema Begum',
    village: getStudentExtraField(student, 'village') || 'Boraitoli',
    postOffice: getStudentExtraField(student, 'postOffice') || 'Boraitoli',
    upazilla: getStudentExtraField(student, 'upazilla') || getStudentExtraField(student, 'upazila') || 'Chakaria',
    district: getStudentExtraField(student, 'district') || "Cox's Bazar",
    dob: dobStr,
    dobWords: formatDobInWords(dobStr),
    gender: studentGender,
    schoolName: schoolSettings.schoolName || 'শিক্ষা প্রতিষ্ঠান',
    schoolNameEn: getEnglishSchoolName(schoolSettings.schoolNameEn || schoolSettings.schoolName),
    schoolAddress: schoolSettings.address || '',
    schoolAddressEn: getEnglishSchoolAddress(schoolSettings.addressEn || schoolSettings.address),
    eiin: schoolSettings.eiin || '---',
    boardName: translateBoardToEnglish(
      currentLang === 'en'
        ? 'Board of Intermediate and Secondary Education, Chattogram'
        : 'চট্টগ্রাম মাধ্যমিক ও উচ্চ মাধ্যমিক শিক্ষা বোর্ড'
    ),
    centerName: 'Chakaria-1',
    group: englishGroup,
    boardRoll: boardRollVal,
    boardReg: boardRegVal,
    session: '2024-2025',
    passingYear: passingYearFilter,
    gpa: customGpa,
    gradeLetter: parseFloat(customGpa) >= 5.0 ? 'A+' : parseFloat(customGpa) >= 4.0 ? 'A' : 'A-',
    issueDate: new Date().toISOString().split('T')[0],
    refNo: `BHS/SSC/${passingYearFilter}/${(100 + rollOffset).toString()}`,
    characterRemarks:
      studentGender === 'Female'
        ? 'She bears an exemplary moral character.'
        : 'He bears an exemplary moral character.',
  };
}

export function buildRecordFromCertificate(
  cert: CertificateRecord,
  schoolSettings: SchoolSettings
): SSCTestimonialRecord {
  return {
    id: cert.id,
    studentId: cert.studentId,
    studentName: cert.studentName,
    fatherName: cert.fatherName || '',
    motherName: cert.motherName || '',
    village: cert.village || 'Boraitoli',
    postOffice: cert.postOffice || 'Boraitoli',
    upazilla: cert.upazila || 'Chakaria',
    district: cert.district || "Cox's Bazar",
    gender: 'Male',
    dob: cert.dob || '2009-01-01',
    dobWords: formatDobInWords(cert.dob || '2009-01-01'),
    schoolName: schoolSettings.schoolName || 'শিক্ষা প্রতিষ্ঠান',
    schoolNameEn: getEnglishSchoolName(schoolSettings.schoolNameEn || schoolSettings.schoolName),
    schoolAddress: schoolSettings.address || '',
    schoolAddressEn: getEnglishSchoolAddress(schoolSettings.addressEn || schoolSettings.address),
    eiin: schoolSettings.eiin || '---',
    centerName: 'Chakaria-1',
    group: translateGroupToEnglish(cert.group || 'Science'),
    boardRoll: cert.boardRoll || '—',
    boardReg: cert.boardReg || '—',
    session: cert.session || '2024-2025',
    passingYear: cert.passingYear || '2026',
    boardName: 'Board of Intermediate and Secondary Education, Chattogram',
    gpa: cert.gpa || '5.00',
    gradeLetter: 'A+',
    issueDate: cert.issueDate,
    refNo: cert.refNo,
    characterRemarks: cert.characterRemarks || 'He bears an exemplary moral character.',
  };
}
