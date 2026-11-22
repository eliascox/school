// ═════════════════════════════════════════════════════════════════
// CURRICULUM SERVICE (DYNAMIC SUBJECTS & OPTIONAL 4TH SUBJECTS)
// ═════════════════════════════════════════════════════════════════

export interface SubjectCurriculumItem {
  id: string;
  code: string;
  name: string;
  nameBn?: string;
  nameEn?: string;
  grade: '6th' | '7th' | '8th' | '9th' | '10th' | string;
  group: 'সাধারণ' | 'বিজ্ঞান' | 'মানবিক' | 'ব্যবসায় শিক্ষা' | 'ব্যবসায় শিক্ষা' | 'মানবিক ও ব্যবসায় শিক্ষা' | string;
  subjectType?: 'general' | 'group' | 'religion';
  cq: number | string;
  mcq: number | string;
  practical: number | string;
  ca: number | string;
  fullMarks: number;
  passMarks: number;
  passRules: string;
  passRuleMode?: 'part' | 'total';
  isJointPass?: boolean;
  combinedWithCode?: string;
  jointPassInfo?: string;
  isUncountableCA?: boolean;
  category: 'আবশ্যিক' | 'ঐচ্ছিক' | '৪র্থ বিষয়' | 'সাধারণ' | string;
}

const base6to8Subjects: Omit<SubjectCurriculumItem, 'id' | 'grade'>[] = [
  { code: '101', name: 'বাংলা ১ম পত্র', nameBn: 'বাংলা ১ম পত্র', nameEn: 'Bangla 1st Paper', group: 'সাধারণ', subjectType: 'general', cq: 100, mcq: '-', practical: '-', ca: 0, fullMarks: 100, passMarks: 33, passRuleMode: 'total', passRules: 'বাংলা ২য় পত্রের সাথে যৌথ পাস (মোট ৫০/১৫০)', isJointPass: true, combinedWithCode: '102', jointPassInfo: 'যুগ্ম পত্র কোড: 102', category: 'আবশ্যিক' },
  { code: '102', name: 'বাংলা ২য় পত্র', nameBn: 'বাংলা ২য় পত্র', nameEn: 'Bangla 2nd Paper', group: 'সাধারণ', subjectType: 'general', cq: 50, mcq: '-', practical: '-', ca: 0, fullMarks: 50, passMarks: 17, passRuleMode: 'total', passRules: 'বাংলা ১ম পত্রের সাথে যৌথ পাস (মোট ৫০/১৫০)', isJointPass: true, combinedWithCode: '101', jointPassInfo: 'যুগ্ম পত্র কোড: 101', category: 'আবশ্যিক' },
  { code: '107', name: 'ইংরেজি ১ম পত্র', nameBn: 'ইংরেজি ১ম পত্র', nameEn: 'English 1st Paper', group: 'সাধারণ', subjectType: 'general', cq: 100, mcq: '-', practical: '-', ca: 0, fullMarks: 100, passMarks: 33, passRuleMode: 'total', passRules: 'ইংরেজি ২য় পত্রের সাথে যৌথ পাস (মোট ৫০/১৫০)', isJointPass: true, combinedWithCode: '108', jointPassInfo: 'যুগ্ম পত্র কোড: 108', category: 'আবশ্যিক' },
  { code: '108', name: 'ইংরেজি ২য় পত্র', nameBn: 'ইংরেজি ২য় পত্র', nameEn: 'English 2nd Paper', group: 'সাধারণ', subjectType: 'general', cq: 50, mcq: '-', practical: '-', ca: 0, fullMarks: 50, passMarks: 17, passRuleMode: 'total', passRules: 'ইংরেজি ১ম পত্রের সাথে যৌথ পাস (মোট ৫০/১৫০)', isJointPass: true, combinedWithCode: '107', jointPassInfo: 'যুগ্ম পত্র কোড: 107', category: 'আবশ্যিক' },
  { code: '109', name: 'গণিত (Mathematics)', nameBn: 'গণিত (Mathematics)', nameEn: 'Mathematics', group: 'সাধারণ', subjectType: 'general', cq: 70, mcq: '-', practical: '-', ca: 30, fullMarks: 100, passMarks: 33, passRuleMode: 'part', passRules: 'লিখিত ও সিএ-তে আলাদা পাস (৩৩% নম্বর)', isJointPass: false, category: 'আবশ্যিক' },
  { code: '127', name: 'বিজ্ঞান (Science)', nameBn: 'বিজ্ঞান (Science)', nameEn: 'Science', group: 'সাধারণ', subjectType: 'general', cq: 100, mcq: '-', practical: 0, ca: 0, fullMarks: 100, passMarks: 33, passRuleMode: 'total', passRules: 'লিখিত ৩৩% নম্বর (৩৩/১০০)', isJointPass: false, category: 'আবশ্যিক' },
  { code: '154', name: 'তথ্য ও যোগাযোগ প্রযুক্তি (ICT)', nameBn: 'তথ্য ও যোগাযোগ প্রযুক্তি (ICT)', nameEn: 'ICT', group: 'সাধারণ', subjectType: 'general', cq: 25, mcq: '-', practical: 25, ca: 0, fullMarks: 50, passMarks: 17, passRuleMode: 'part', passRules: 'লিখিত ও ব্যবহারিকে পৃথকভাবে পাস', isJointPass: false, category: 'আবশ্যিক' },
  { code: '150', name: 'বাংলাদেশ ও বিশ্বপরিচয়', nameBn: 'বাংলাদেশ ও বিশ্বপরিচয়', nameEn: 'Bangladesh and Global Studies', group: 'সাধারণ', subjectType: 'general', cq: 100, mcq: '-', practical: '-', ca: 0, fullMarks: 100, passMarks: 33, passRuleMode: 'total', passRules: 'লিখিত ৩৩% নম্বর (৩৩/১০০)', isJointPass: false, category: 'আবশ্যিক' },
  { code: '111', name: 'ইসলাম ও নৈতিক শিক্ষা', nameBn: 'ইসলাম ও নৈতিক শিক্ষা', nameEn: 'Islam & Moral Education', group: 'সাধারণ', subjectType: 'religion', cq: 100, mcq: '-', practical: '-', ca: 0, fullMarks: 100, passMarks: 33, passRuleMode: 'total', passRules: 'লিখিত ৩৩% নম্বর (৩৩/১০০)', isJointPass: false, category: 'আবশ্যিক' },
  { code: '112', name: 'হিন্দুধর্ম ও নৈতিক শিক্ষা', nameBn: 'হিন্দুধর্ম ও নৈতিক শিক্ষা', nameEn: 'Hindu Religion & Moral Education', group: 'সাধারণ', subjectType: 'religion', cq: 100, mcq: '-', practical: '-', ca: 0, fullMarks: 100, passMarks: 33, passRuleMode: 'total', passRules: 'লিখিত ৩৩% নম্বর (৩৩/১০০)', isJointPass: false, category: 'আবশ্যিক' },
  { code: '134', name: 'কৃষি শিক্ষা (Agricultural Science)', nameBn: 'কৃষি শিক্ষা (Agricultural Science)', nameEn: 'Agriculture Studies', group: 'সাধারণ', subjectType: 'group', cq: 50, mcq: 25, practical: 25, ca: 0, fullMarks: 100, passMarks: 33, passRuleMode: 'part', passRules: 'CQ ১৭ + MCQ ৮ + Practical ৮ (প্রতিটি অংশে পৃথক পাস)', isJointPass: false, category: '৪র্থ বিষয়' }
];

const base9to10Subjects: Omit<SubjectCurriculumItem, 'id' | 'grade'>[] = [
  // ── আবশ্যিক বিষয় (Compulsory Subjects - Official NCTB Codes) ──
  { code: '101', name: 'বাংলা ১ম পত্র (সাহিত্য)', nameBn: 'বাংলা ১ম পত্র (সাহিত্য)', nameEn: 'Bangla 1st Paper', group: 'সাধারণ', subjectType: 'general', cq: 70, mcq: 30, practical: '-', ca: 0, fullMarks: 100, passMarks: 33, passRuleMode: 'part', passRules: 'বাংলা ২য় পত্রের সাথে যৌথ পাস (মোট ৬৬/২০০)', isJointPass: true, combinedWithCode: '102', jointPassInfo: 'যুগ্ম পত্র কোড: 102', category: 'আবশ্যিক' },
  { code: '102', name: 'বাংলা ২য় পত্র (ব্যাকরণ ও রচনা)', nameBn: 'বাংলা ২য় পত্র (ব্যাকরণ ও রচনা)', nameEn: 'Bangla 2nd Paper', group: 'সাধারণ', subjectType: 'general', cq: 70, mcq: 30, practical: '-', ca: 0, fullMarks: 100, passMarks: 33, passRuleMode: 'part', passRules: 'বাংলা ১ম পত্রের সাথে যৌথ পাস (মোট ৬৬/২০০)', isJointPass: true, combinedWithCode: '101', jointPassInfo: 'যুগ্ম পত্র কোড: 101', category: 'আবশ্যিক' },
  { code: '107', name: 'English 1st Paper', nameBn: 'ইংরেজি ১ম পত্র', nameEn: 'English 1st Paper', group: 'সাধারণ', subjectType: 'general', cq: 100, mcq: '-', practical: '-', ca: 0, fullMarks: 100, passMarks: 33, passRuleMode: 'total', passRules: 'ইংরেজি ২য় পত্রের সাথে যৌথ পাস (মোট ৬৬/২০০)', isJointPass: true, combinedWithCode: '108', jointPassInfo: 'যুগ্ম পত্র কোড: 108', category: 'আবশ্যিক' },
  { code: '108', name: 'English 2nd Paper', nameBn: 'ইংরেজি ২য় পত্র', nameEn: 'English 2nd Paper', group: 'সাধারণ', subjectType: 'general', cq: 100, mcq: '-', practical: '-', ca: 0, fullMarks: 100, passMarks: 33, passRuleMode: 'total', passRules: 'ইংরেজি ১ম পত্রের সাথে যৌথ পাস (মোট ৬৬/২০০)', isJointPass: true, combinedWithCode: '107', jointPassInfo: 'যুগ্ম পত্র কোড: 107', category: 'আবশ্যিক' },
  { code: '109', name: 'সাধারণ গণিত (General Math)', nameBn: 'সাধারণ গণিত (General Math)', nameEn: 'Mathematics', group: 'সাধারণ', subjectType: 'general', cq: 70, mcq: 30, practical: '-', ca: 0, fullMarks: 100, passMarks: 33, passRuleMode: 'part', passRules: 'CQ ২৩ + MCQ ১০ (পৃথক পাস আবশ্যক)', isJointPass: false, category: 'আবশ্যিক' },
  { code: '154', name: 'তথ্য ও যোগাযোগ প্রযুক্তি (ICT)', nameBn: 'তথ্য ও যোগাযোগ প্রযুক্তি (ICT)', nameEn: 'ICT', group: 'সাধারণ', subjectType: 'general', cq: '-', mcq: 25, practical: 25, ca: 0, fullMarks: 50, passMarks: 17, passRuleMode: 'part', passRules: 'MCQ ৮ + Practical ৮ (পৃথক পাস)', isJointPass: false, category: 'আবশ্যিক' },
  { code: '111', name: 'ইসলাম ও নৈতিক শিক্ষা', nameBn: 'ইসলাম ও নৈতিক শিক্ষা', nameEn: 'Islam & Moral Education', group: 'সাধারণ', subjectType: 'religion', cq: 70, mcq: 30, practical: '-', ca: 0, fullMarks: 100, passMarks: 33, passRuleMode: 'part', passRules: 'CQ ২৩ + MCQ ১০ (পৃথক পাস)', isJointPass: false, category: 'আবশ্যিক' },
  { code: '112', name: 'হিন্দুধর্ম ও নৈতিক শিক্ষা', nameBn: 'হিন্দুধর্ম ও নৈতিক শিক্ষা', nameEn: 'Hindu Religion & Moral Education', group: 'সাধারণ', subjectType: 'religion', cq: 70, mcq: 30, practical: '-', ca: 0, fullMarks: 100, passMarks: 33, passRuleMode: 'part', passRules: 'CQ ২৩ + MCQ ১০ (পৃথক পাস)', isJointPass: false, category: 'আবশ্যিক' },
  { code: '150', name: 'বাংলাদেশ ও বিশ্বপরিচয় (BGS)', nameBn: 'বাংলাদেশ ও বিশ্বপরিচয় (BGS)', nameEn: 'Bangladesh and Global Studies', group: 'বিজ্ঞান', subjectType: 'general', cq: 70, mcq: 30, practical: '-', ca: 0, fullMarks: 100, passMarks: 33, passRuleMode: 'part', passRules: 'CQ ২৩ + MCQ ১০ (বিজ্ঞান বিভাগের আবশ্যিক)', isJointPass: false, category: 'আবশ্যিক' },
  { code: '127', name: 'সাধারণ বিজ্ঞান (General Science)', nameBn: 'সাধারণ বিজ্ঞান (General Science)', nameEn: 'Science', group: 'মানবিক ও ব্যবসায় শিক্ষা', subjectType: 'general', cq: 70, mcq: 30, practical: '-', ca: 0, fullMarks: 100, passMarks: 33, passRuleMode: 'part', passRules: 'CQ ২৩ + MCQ ১০ (মানবিক ও ব্যবসায় শিক্ষার আবশ্যিক)', isJointPass: false, category: 'আবশ্যিক' },

  // ── বিজ্ঞান বিভাগ (Science Group) ──
  { code: '136', name: 'পদার্থবিজ্ঞান (Physics)', nameBn: 'পদার্থবিজ্ঞান (Physics)', nameEn: 'Physics', group: 'বিজ্ঞান', subjectType: 'group', cq: 50, mcq: 25, practical: 25, ca: 0, fullMarks: 100, passMarks: 33, passRuleMode: 'part', passRules: 'CQ ১৭ + MCQ ৮ + Practical ৮ (প্রতিটি অংশে পৃথক পাস)', isJointPass: false, category: 'আবশ্যিক' },
  { code: '137', name: 'রসায়ন (Chemistry)', nameBn: 'রসায়ন (Chemistry)', nameEn: 'Chemistry', group: 'বিজ্ঞান', subjectType: 'group', cq: 50, mcq: 25, practical: 25, ca: 0, fullMarks: 100, passMarks: 33, passRuleMode: 'part', passRules: 'CQ ১৭ + MCQ ৮ + Practical ৮ (প্রতিটি অংশে পৃথক পাস)', isJointPass: false, category: 'আবশ্যিক' },
  { code: '138', name: 'জীববিজ্ঞান (Biology)', nameBn: 'জীববিজ্ঞান (Biology)', nameEn: 'Biology', group: 'বিজ্ঞান', subjectType: 'group', cq: 50, mcq: 25, practical: 25, ca: 0, fullMarks: 100, passMarks: 33, passRuleMode: 'part', passRules: 'CQ ১৭ + MCQ ৮ + Practical ৮ (প্রতিটি অংশে পৃথক পাস)', isJointPass: false, category: 'আবশ্যিক' },
  { code: '126', name: 'উচ্চতর গণিত (Higher Math)', nameBn: 'উচ্চতর গণিত (Higher Math)', nameEn: 'Higher Mathematics', group: 'বিজ্ঞান', subjectType: 'group', cq: 50, mcq: 25, practical: 25, ca: 0, fullMarks: 100, passMarks: 33, passRuleMode: 'part', passRules: 'CQ ১৭ + MCQ ৮ + Practical ৮ (প্রতিটি অংশে পৃথক পাস)', isJointPass: false, category: '৪র্থ বিষয়' },
  { code: '134', name: 'কৃষি শিক্ষা (Agricultural Science)', nameBn: 'কৃষি শিক্ষা (Agricultural Science)', nameEn: 'Agriculture Studies', group: 'বিজ্ঞান', subjectType: 'group', cq: 50, mcq: 25, practical: 25, ca: 0, fullMarks: 100, passMarks: 33, passRuleMode: 'part', passRules: 'CQ ১৭ + MCQ ৮ + Practical ৮ (প্রতিটি অংশে পৃথক পাস)', isJointPass: false, category: '৪র্থ বিষয়' },

  // ── মানবিক বিভাগ (Humanities Group) ──
  { code: '153', name: 'বাংলাদেশের ইতিহাস ও বিশ্বসভ্যতা', nameBn: 'বাংলাদেশের ইতিহাস ও বিশ্বসভ্যতা', nameEn: 'History of Bangladesh & World Civilization', group: 'মানবিক', subjectType: 'group', cq: 70, mcq: 30, practical: '-', ca: 0, fullMarks: 100, passMarks: 33, passRuleMode: 'part', passRules: 'CQ ২৩ + MCQ ১০ (পৃথক পাস)', isJointPass: false, category: 'আবশ্যিক' },
  { code: '110', name: 'ভূগোল ও পরিবেশ', nameBn: 'ভূগোল ও পরিবেশ', nameEn: 'Geography & Environment', group: 'মানবিক', subjectType: 'group', cq: 70, mcq: 30, practical: '-', ca: 0, fullMarks: 100, passMarks: 33, passRuleMode: 'part', passRules: 'CQ ২৩ + MCQ ১০ (পৃথক পাস)', isJointPass: false, category: 'আবশ্যিক' },
  { code: '140', name: 'পৌরনীতি ও নাগরিকতা', nameBn: 'পৌরনীতি ও নাগরিকতা', nameEn: 'Civics & Citizenship', group: 'মানবিক', subjectType: 'group', cq: 70, mcq: 30, practical: '-', ca: 0, fullMarks: 100, passMarks: 33, passRuleMode: 'part', passRules: 'CQ ২৩ + MCQ ১০ (পৃথক পাস)', isJointPass: false, category: 'আবশ্যিক' },
  { code: '141', name: 'অর্থনীতি (Economics)', nameBn: 'অর্থনীতি (Economics)', nameEn: 'Economics', group: 'মানবিক', subjectType: 'group', cq: 70, mcq: 30, practical: '-', ca: 0, fullMarks: 100, passMarks: 33, passRuleMode: 'part', passRules: 'CQ ২৩ + MCQ ১০ (পৃথক পাস)', isJointPass: false, category: 'ঐচ্ছিক' },
  { code: '134', name: 'কৃষি শিক্ষা (Agricultural Science)', nameBn: 'কৃষি শিক্ষা (Agricultural Science)', nameEn: 'Agriculture Studies', group: 'মানবিক', subjectType: 'group', cq: 50, mcq: 25, practical: 25, ca: 0, fullMarks: 100, passMarks: 33, passRuleMode: 'part', passRules: 'CQ ১৭ + MCQ ৮ + Practical ৮ (প্রতিটি অংশে পৃথক পাস)', isJointPass: false, category: '৪র্থ বিষয়' },

  // ── ব্যবসায় শিক্ষা বিভাগ (Commerce Group) ──
  { code: '146', name: 'হিসাববিজ্ঞান (Accounting)', nameBn: 'হিসাববিজ্ঞান (Accounting)', nameEn: 'Accounting', group: 'ব্যবসায় শিক্ষা', subjectType: 'group', cq: 70, mcq: 30, practical: '-', ca: 0, fullMarks: 100, passMarks: 33, passRuleMode: 'part', passRules: 'CQ ২৩ + MCQ ১০ (পৃথক পাস)', isJointPass: false, category: 'আবশ্যিক' },
  { code: '143', name: 'ব্যবসায় উদ্যোগ (Business Ent.)', nameBn: 'ব্যবসায় উদ্যোগ (Business Ent.)', nameEn: 'Business Entrepreneurship', group: 'ব্যবসায় শিক্ষা', subjectType: 'group', cq: 70, mcq: 30, practical: '-', ca: 0, fullMarks: 100, passMarks: 33, passRuleMode: 'part', passRules: 'CQ ২৩ + MCQ ১০ (পৃথক পাস)', isJointPass: false, category: 'আবশ্যিক' },
  { code: '152', name: 'ফিন্যান্স ও ব্যাংকিং (Finance)', nameBn: 'ফিন্যান্স ও ব্যাংকিং (Finance)', nameEn: 'Finance & Banking', group: 'ব্যবসায় শিক্ষা', subjectType: 'group', cq: 70, mcq: 30, practical: '-', ca: 0, fullMarks: 100, passMarks: 33, passRuleMode: 'part', passRules: 'CQ ২৩ + MCQ ১০ (পৃথক পাস)', isJointPass: false, category: 'আবশ্যিক' },
  { code: '134', name: 'কৃষি শিক্ষা (Agricultural Science)', nameBn: 'কৃষি শিক্ষা (Agricultural Science)', nameEn: 'Agriculture Studies', group: 'ব্যবসায় শিক্ষা', subjectType: 'group', cq: 50, mcq: 25, practical: 25, ca: 0, fullMarks: 100, passMarks: 33, passRuleMode: 'part', passRules: 'CQ ১৭ + MCQ ৮ + Practical ৮ (প্রতিটি অংশে পৃথক পাস)', isJointPass: false, category: '৪র্থ বিষয়' },
  { code: '141', name: 'অর্থনীতি (Economics)', nameBn: 'অর্থনীতি (Economics)', nameEn: 'Economics', group: 'ব্যবসায় শিক্ষা', subjectType: 'group', cq: 70, mcq: 30, practical: '-', ca: 0, fullMarks: 100, passMarks: 33, passRuleMode: 'part', passRules: 'CQ ২৩ + MCQ ১০ (পৃথক পাস)', isJointPass: false, category: 'ঐচ্ছিক' }
];

export const DEFAULT_CURRICULUM_DATA: SubjectCurriculumItem[] = [
  ...(['6th', '7th', '8th'] as const).flatMap(g =>
    base6to8Subjects.map((s, idx) => ({
      ...s,
      id: `curr-${g}-${s.code}-${idx}`,
      grade: g,
    }))
  ),
  ...(['9th', '10th'] as const).flatMap(g =>
    base9to10Subjects.map((s, idx) => ({
      ...s,
      id: `curr-${g}-${s.code}-${idx}`,
      grade: g,
    }))
  )
];

const LEGACY_TO_NCTB_CODE_MAP: Record<string, string> = {
  'BAN-601': '101', 'BAN-701': '101', 'BAN-801': '101', 'BAN-101': '101',
  'BAN-602': '102', 'BAN-702': '102', 'BAN-802': '102', 'BAN-102': '102',
  'ENG-601': '107', 'ENG-701': '107', 'ENG-801': '107', 'ENG-107': '107',
  'ENG-602': '108', 'ENG-702': '108', 'ENG-802': '108', 'ENG-108': '108',
  'MAT-603': '109', 'MAT-703': '109', 'MAT-803': '109', 'MAT-109': '109',
  'SCI-604': '127', 'SCI-704': '127', 'SCI-804': '127', 'GSCI-127': '127', 'SCI-127': '127',
  'ICT-605': '154', 'ICT-705': '154', 'ICT-805': '154', 'ICT-154': '154',
  'HIS-606': '150', 'HIS-706': '150', 'HIS-806': '150',
  'BGS-606': '150', 'BGS-706': '150', 'BGS-806': '150', 'BGS-150': '150',
  'REL-610': '111', 'REL-710': '111', 'REL-810': '111', 'REL-111': '111',
  'REL-112': '112', 'REL-113': '113', 'REL-114': '114',
  'AGR-607': '134', 'AGR-707': '134', 'AGR-807': '134', 'AGR-139': '134',
  'AGR-134': '134', 'AGR-134-SCI': '134', 'AGR-134-HUM': '134', 'AGR-134-COM': '134',
  'PHY-136': '136', 'CHE-137': '137', 'BIO-138': '138', 'HMT-126': '126',
  'HIS-153': '153', 'GEO-110': '110',
  'CIV-112': '140', 'CIV-140': '140',
  'ECO-141': '141', 'ECO-141-COM': '141',
  'ACC-146': '146',
  'BUS-143': '143', 'BUS-147': '143',
  'FIN-152': '152',
  'HMS-140': '151', 'HMS-151': '151', 'HMS-601': '151', 'HMS-701': '151', 'HMS-801': '151',
};

export function normalizeLegacyNctbSubjectCodes(items: SubjectCurriculumItem[]): SubjectCurriculumItem[] {
  return items.map((item) => {
    const rawCode = String(item.code || '').trim();
    const upperCode = rawCode.toUpperCase();
    let mappedCode = LEGACY_TO_NCTB_CODE_MAP[upperCode] || rawCode;

    const nameStr = `${item.name || ''} ${item.nameBn || ''} ${item.nameEn || ''}`.toLowerCase();
    if (mappedCode === '122' && (nameStr.includes('সংস্কৃত') || nameStr.includes('sanskrit'))) {
      mappedCode = '123';
    } else if (mappedCode === '123' && (nameStr.includes('পালি') || nameStr.includes('pali'))) {
      mappedCode = '124';
    } else if (mappedCode === '131' && (nameStr.includes('কর্ম ও জীবনমুখী') || nameStr.includes('জীবন ও জীবিকা') || nameStr.includes('work & life'))) {
      mappedCode = '155';
    } else if (mappedCode === '112' && (nameStr.includes('পৌরনীতি') || nameStr.includes('civics'))) {
      mappedCode = '140';
    }

    const rawCombined = String(item.combinedWithCode || '').trim();
    const mappedCombined = rawCombined
      ? LEGACY_TO_NCTB_CODE_MAP[rawCombined.toUpperCase()] || rawCombined
      : undefined;

    let resolvedCombined = mappedCombined;
    if (!resolvedCombined && item.isJointPass) {
      if (mappedCode === '101') resolvedCombined = '102';
      else if (mappedCode === '102') resolvedCombined = '101';
      else if (mappedCode === '107') resolvedCombined = '108';
      else if (mappedCode === '108') resolvedCombined = '107';
    }

    const isRel =
      item.subjectType === 'religion' ||
      upperCode.startsWith('REL-') ||
      (['111', '112', '113', '114'].includes(mappedCode) && !nameStr.includes('পৌরনীতি'));

    return {
      ...item,
      code: mappedCode,
      subjectType: isRel ? 'religion' : item.subjectType,
      combinedWithCode: resolvedCombined,
      jointPassInfo: resolvedCombined ? `যুগ্ম পত্র কোড: ${resolvedCombined}` : item.jointPassInfo,
    };
  });
}

/**
 * Ensures Hindu Religion & Moral Education (NCTB 112) is professionally included
 * right alongside Islam (111) across Grades 6th–10th in an idempotent pass.
 */
export function ensureHinduReligionSubjects(items: SubjectCurriculumItem[]): {
  updated: SubjectCurriculumItem[];
  changed: boolean;
} {
  let changed = false;
  const result: SubjectCurriculumItem[] = [];
  const gradesPresent = Array.from(new Set(items.map((i) => i.grade)));

  for (const grade of gradesPresent) {
    const gradeItems = items.filter((i) => i.grade === grade);
    const hasHindu = gradeItems.some(
      (i) =>
        String(i.code).trim() === '112' ||
        (i.name || '').includes('হিন্দু') ||
        (i.nameEn || '').toLowerCase().includes('hindu'),
    );
    const isUpper = grade === '9th' || grade === '10th';

    for (const item of gradeItems) {
      let nextItem = item;
      // Upgrade ambiguous generic "ধর্ম ও নৈতিক শিক্ষা (111)" label to explicit Islam title when adding Hindu (112)
      if (!hasHindu && String(item.code).trim() === '111' && item.name.trim() === 'ধর্ম ও নৈতিক শিক্ষা') {
        changed = true;
        nextItem = {
          ...item,
          name: 'ইসলাম ও নৈতিক শিক্ষা',
          nameBn: 'ইসলাম ও নৈতিক শিক্ষা',
          nameEn: 'Islam & Moral Education',
          subjectType: 'religion',
        };
      }
      result.push(nextItem);

      if (!hasHindu && String(item.code).trim() === '111' && !result.some((r) => r.grade === grade && r.code === '112')) {
        changed = true;
        result.push({
          id: `curr-${grade}-112-auto`,
          code: '112',
          name: 'হিন্দুধর্ম ও নৈতিক শিক্ষা',
          nameBn: 'হিন্দুধর্ম ও নৈতিক শিক্ষা',
          nameEn: 'Hindu Religion & Moral Education',
          grade,
          group: 'সাধারণ',
          subjectType: 'religion',
          cq: isUpper ? 70 : 100,
          mcq: isUpper ? 30 : '-',
          practical: '-',
          ca: 0,
          fullMarks: 100,
          passMarks: 33,
          passRuleMode: isUpper ? 'part' : 'total',
          passRules: isUpper ? 'CQ ২৩ + MCQ ১০ (পৃথক পাস)' : 'লিখিত ৩৩% নম্বর (৩৩/১০০)',
          isJointPass: false,
          category: 'আবশ্যিক',
        });
      }
    }

    if (!hasHindu && !result.some((r) => r.grade === grade && String(r.code).trim() === '112')) {
      changed = true;
      result.push({
        id: `curr-${grade}-112-auto`,
        code: '112',
        name: 'হিন্দুধর্ম ও নৈতিক শিক্ষা',
        nameBn: 'হিন্দুধর্ম ও নৈতিক শিক্ষা',
        nameEn: 'Hindu Religion & Moral Education',
        grade,
        group: 'সাধারণ',
        subjectType: 'religion',
        cq: isUpper ? 70 : 100,
        mcq: isUpper ? 30 : '-',
        practical: '-',
        ca: 0,
        fullMarks: 100,
        passMarks: 33,
        passRuleMode: isUpper ? 'part' : 'total',
        passRules: isUpper ? 'CQ ২৩ + MCQ ১০ (পৃথক পাস)' : 'লিখিত ৩৩% নম্বর (৩৩/১০০)',
        isJointPass: false,
        category: 'আবশ্যিক',
      });
    }
  }

  return { updated: changed ? result : items, changed };
}

const STORAGE_KEY = 'sms_curriculum_subjects';
const HINDU_MIGRATION_FLAG = 'sms_curriculum_hindu_v1';

class CurriculumService {
  private listeners: Array<() => void> = [];

  public getCurriculumList(): SubjectCurriculumItem[] {
    if (typeof window === 'undefined') return DEFAULT_CURRICULUM_DATA;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const normalized = normalizeLegacyNctbSubjectCodes(parsed);
          if (normalized.length >= 5 && localStorage.getItem(HINDU_MIGRATION_FLAG) !== '1') {
            const { updated } = ensureHinduReligionSubjects(normalized);
            return updated;
          }
          return normalized;
        }
      }
    } catch (e) {
      console.error('Failed to load curriculum subjects from storage', e);
    }
    return DEFAULT_CURRICULUM_DATA;
  }

  public saveCurriculumList(items: SubjectCurriculumItem[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      localStorage.setItem(HINDU_MIGRATION_FLAG, '1');
      this.notifyListeners();
    } catch (e) {
      console.error('Failed to save curriculum subjects', e);
    }
  }

  /**
   * Returns all Optional / 4th Subjects defined in the Curriculum for the given class and group.
   */
  public getOptionalSubjects(grade: string, group?: string): { code: string; name: string; category: string }[] {
    const list = this.getCurriculumList();
    const normalizedGrade = grade.toLowerCase();
    const normalizedGroup = (group || 'সাধারণ').replace('ব্যবসায়', 'ব্যবসায়').trim();

    // Filter by grade
    const classSubjects = list.filter(item => {
      const g = item.grade.toLowerCase();
      return g === normalizedGrade || 
        (normalizedGrade.includes('6') && g.includes('6')) ||
        (normalizedGrade.includes('7') && g.includes('7')) ||
        (normalizedGrade.includes('8') && g.includes('8')) ||
        (normalizedGrade.includes('9') && g.includes('9')) ||
        (normalizedGrade.includes('10') && g.includes('10'));
    });

    // Filter by optional / 4th subject category and group
    const optionalItems = classSubjects.filter(item => {
      const isElective = item.category === 'ঐচ্ছিক' || item.category === '৪র্থ বিষয়' || item.category === '4th Subject';
      if (!isElective) return false;

      // Group match
      const itemGroup = item.group.replace('ব্যবসায়', 'ব্যবসায়').trim();
      if (itemGroup === 'সাধারণ' || itemGroup === 'সকল') return true;
      if (normalizedGroup === 'সাধারণ') return true;
      if (itemGroup === normalizedGroup) return true;
      if (itemGroup.includes(normalizedGroup) || (normalizedGroup.includes('ব্যবসায়') && itemGroup.includes('ব্যবসায়'))) return true;

      return false;
    });

    // Deduplicate by name
    const seenNames = new Set<string>();
    const result: { code: string; name: string; category: string }[] = [];

    for (const item of optionalItems) {
      const cleanName = item.name.trim();
      if (!seenNames.has(cleanName)) {
        seenNames.add(cleanName);
        result.push({
          code: item.code,
          name: cleanName,
          category: item.category
        });
      }
    }

    // Fallback if no specific 4th subjects exist in that custom list
    if (result.length === 0) {
      if (normalizedGrade.includes('9') || normalizedGrade.includes('10')) {
        if (normalizedGroup.includes('বিজ্ঞান')) {
          return [
            { code: '126', name: 'উচ্চতর গণিত (Higher Math)', category: '৪র্থ বিষয়' },
            { code: '134', name: 'কৃষি শিক্ষা (Agricultural Science)', category: '৪র্থ বিষয়' },
            { code: 'NONE', name: 'কোনটিই নয়', category: 'ঐচ্ছিক' }
          ];
        } else if (normalizedGroup.includes('মানবিক')) {
          return [
            { code: '134', name: 'কৃষি শিক্ষা (Agricultural Science)', category: '৪র্থ বিষয়' },
            { code: '141', name: 'অর্থনীতি (Economics)', category: 'ঐচ্ছিক' },
            { code: 'NONE', name: 'কোনটিই নয়', category: 'ঐচ্ছিক' }
          ];
        } else if (normalizedGroup.includes('ব্যবসায়') || normalizedGroup.includes('ব্যবসায়')) {
          return [
            { code: '134', name: 'কৃষি শিক্ষা (Agricultural Science)', category: '৪র্থ বিষয়' },
            { code: '141', name: 'অর্থনীতি (Economics)', category: 'ঐচ্ছিক' },
            { code: 'NONE', name: 'কোনটিই নয়', category: 'ঐচ্ছিক' }
          ];
        }
      }
      return [
        { code: '134', name: 'কৃষি শিক্ষা (Agricultural Science)', category: '৪র্থ বিষয়' },
        { code: 'NONE', name: 'কোনটিই নয়', category: 'ঐচ্ছিক' }
      ];
    }

    // Always append 'কোনটিই নয়' option at the end if not already present
    if (!seenNames.has('কোনটিই নয়') && !seenNames.has('None')) {
      result.push({ code: 'NONE', name: 'কোনটিই নয়', category: 'ঐচ্ছিক' });
    }

    return result;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (e) {
        console.error('Error notifying curriculum listener', e);
      }
    });
  }
}

export const curriculumService = new CurriculumService();
