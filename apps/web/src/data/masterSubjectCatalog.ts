/**
 * Master Subject Catalog — 10 Institutional Libraries (259 Subjects)
 * Covers Bangladesh NCTB Secondary (SSC), Primary, Junior, College (HSC),
 * Madrasah (Dakhil, Ebtedayi, Alim New/Old, Hifz/Nurani), and Pre-school/KG.
 */

import { SubjectCurriculumItem } from '@/services/curriculumService';

export type MasterSubjectType = 'general' | 'group' | 'religion';
export type MasterPassRule = 'total' | 'part';

export interface MasterSubjectEntry {
  id: string;
  libraryId: MasterLibraryId;
  code: string;
  nameEn: string;
  nameBn: string;
  cq: number;
  mcq: number;
  practical: number;
  type: MasterSubjectType;
  passRule: MasterPassRule;
  combinedWithCode?: string;
  streamTag?: string; // e.g., 'Science', 'Business Studies', 'Humanities', '4th subject', 'General', 'Mujabbid', 'Hifzul Quran'
}

export type MasterLibraryId =
  | 'school.secondary'
  | 'school.primary'
  | 'school.junior'
  | 'college.hsc'
  | 'madrasah.dakhil'
  | 'madrasah.ebtedayi'
  | 'madrasah.alim'
  | 'madrasah.alim_old'
  | 'madrasah.hifz'
  | 'preschool.kg';

export interface MasterSubjectLibrary {
  id: MasterLibraryId;
  titleBn: string;
  titleEn: string;
  subtitleBn: string;
  badge: string;
  subjects: MasterSubjectEntry[];
}

// Compact tuple: [code, nameEn, nameBn, cq, mcq, practical, type('G'|'Gr'|'R'), pass('T'|'P'), combinedWith?, streamTag?]
type RawSubjectTuple = [
  string,
  string,
  string,
  number,
  number,
  number,
  'G' | 'Gr' | 'R',
  'T' | 'P',
  string?,
  string?,
];

function expandLibrary(libraryId: MasterLibraryId, tuples: RawSubjectTuple[]): MasterSubjectEntry[] {
  return tuples.map(([code, nameEn, nameBn, cq, mcq, practical, t, p, combinedWithCode, streamTag], idx) => ({
    id: `${libraryId}::${code}::${idx}`,
    libraryId,
    code,
    nameEn,
    nameBn,
    cq,
    mcq,
    practical,
    type: t === 'G' ? 'general' : t === 'R' ? 'religion' : 'group',
    passRule: p === 'P' ? 'part' : 'total',
    combinedWithCode: combinedWithCode || undefined,
    streamTag: streamTag || undefined,
  }));
}

const SECONDARY_TUPLES: RawSubjectTuple[] = [
  ['101', 'Bangla 1st Paper', 'বাংলা ১ম পত্র', 70, 30, 0, 'G', 'P', '102'],
  ['102', 'Bangla 2nd Paper', 'বাংলা ২য় পত্র', 70, 30, 0, 'G', 'P', '101'],
  ['107', 'English 1st Paper', 'ইংরেজি ১ম পত্র', 100, 0, 0, 'G', 'P', '108'],
  ['108', 'English 2nd Paper', 'ইংরেজি ২য় পত্র', 100, 0, 0, 'G', 'P', '107'],
  ['109', 'Mathematics', 'গণিত', 70, 30, 0, 'G', 'P'],
  ['127', 'Science', 'বিজ্ঞান', 70, 30, 0, 'G', 'P'],
  ['150', 'Bangladesh and Global Studies', 'বাংলাদেশ ও বিশ্বপরিচয়', 70, 30, 0, 'G', 'P'],
  ['154', 'ICT', 'তথ্য ও যোগাযোগ প্রযুক্তি', 0, 25, 25, 'G', 'P'],
  ['134', 'Agriculture Studies', 'কৃষি শিক্ষা', 50, 25, 25, 'G', 'P', undefined, '4th subject'],
  ['151', 'Home Science', 'গার্হস্থ্য বিজ্ঞান', 50, 25, 25, 'G', 'P', undefined, '4th subject'],
  ['147', 'Physical Education & Health', 'শারীরিক শিক্ষা ও স্বাস্থ্য', 70, 0, 30, 'G', 'T'],
  ['156', 'Career Education', 'ক্যারিয়ার শিক্ষা', 100, 0, 0, 'G', 'T'],
  ['148', 'Arts & Crafts', 'চারু ও কারুকলা', 50, 0, 50, 'G', 'T'],
  ['149', 'Music', 'সংগীত', 30, 0, 70, 'G', 'T'],
  ['155', 'Work & Life Oriented Education', 'কর্ম ও জীবনমুখী শিক্ষা', 70, 0, 30, 'G', 'T'],
  ['136', 'Physics', 'পদার্থবিজ্ঞান', 50, 25, 25, 'Gr', 'P', undefined, 'Science'],
  ['137', 'Chemistry', 'রসায়ন', 50, 25, 25, 'Gr', 'P', undefined, 'Science'],
  ['138', 'Biology', 'জীববিজ্ঞান', 50, 25, 25, 'Gr', 'P', undefined, 'Science'],
  ['126', 'Higher Mathematics', 'উচ্চতর গণিত', 50, 25, 25, 'Gr', 'P', undefined, 'Science'],
  ['146', 'Accounting', 'হিসাববিজ্ঞান', 70, 30, 0, 'Gr', 'P', undefined, 'Business Studies'],
  ['152', 'Finance & Banking', 'ফিন্যান্স ও ব্যাংকিং', 70, 30, 0, 'Gr', 'P', undefined, 'Business Studies'],
  ['143', 'Business Entrepreneurship', 'ব্যবসায় উদ্যোগ', 70, 30, 0, 'Gr', 'P', undefined, 'Business Studies'],
  ['110', 'Geography & Environment', 'ভূগোল ও পরিবেশ', 70, 30, 0, 'Gr', 'P', undefined, 'Humanities'],
  ['141', 'Economics', 'অর্থনীতি', 70, 30, 0, 'Gr', 'P', undefined, 'Humanities'],
  ['140', 'Civics & Citizenship', 'পৌরনীতি ও নাগরিকতা', 70, 30, 0, 'Gr', 'P', undefined, 'Humanities'],
  ['153', 'History of Bangladesh & World Civilization', 'বাংলাদেশের ইতিহাস ও বিশ্বসভ্যতা', 70, 30, 0, 'Gr', 'P', undefined, 'Humanities'],
  ['111', 'Islam & Moral Education', 'ইসলাম ও নৈতিক শিক্ষা', 70, 30, 0, 'R', 'P'],
  ['112', 'Hindu Religion & Moral Education', 'হিন্দুধর্ম ও নৈতিক শিক্ষা', 70, 30, 0, 'R', 'P'],
  ['113', 'Buddhist Religion & Moral Education', 'বৌদ্ধধর্ম ও নৈতিক শিক্ষা', 70, 30, 0, 'R', 'P'],
  ['114', 'Christian Religion & Moral Education', 'খ্রিষ্টধর্ম ও নৈতিক শিক্ষা', 70, 30, 0, 'R', 'P'],
  ['121', 'Arabic', 'আরবি', 70, 30, 0, 'Gr', 'P', undefined, '4th subject'],
  ['123', 'Sanskrit', 'সংস্কৃত', 70, 30, 0, 'Gr', 'P', undefined, '4th subject'],
  ['124', 'Pali', 'পালি', 70, 30, 0, 'Gr', 'P', undefined, '4th subject'],
];

const PRIMARY_TUPLES: RawSubjectTuple[] = [
  ['11', 'Bangla', 'বাংলা', 100, 0, 0, 'G', 'T'],
  ['12', 'English', 'ইংরেজি', 100, 0, 0, 'G', 'T'],
  ['13', 'Mathematics', 'গণিত', 100, 0, 0, 'G', 'T'],
  ['14', 'Bangladesh and Global Studies', 'বাংলাদেশ ও বিশ্বপরিচয়', 100, 0, 0, 'G', 'T'],
  ['15', 'Primary Science', 'প্রাথমিক বিজ্ঞান', 100, 0, 0, 'G', 'T'],
  ['20', 'Arts & Crafts', 'চারু ও কারুকলা', 50, 0, 50, 'G', 'T'],
  ['21', 'Physical Education', 'শারীরিক শিক্ষা', 50, 0, 50, 'G', 'T'],
  ['22', 'Music', 'সংগীত', 50, 0, 50, 'G', 'T'],
  ['16', 'Islam & Moral Education', 'ইসলাম ও নৈতিক শিক্ষা', 100, 0, 0, 'R', 'T'],
  ['17', 'Hindu Religion & Moral Education', 'হিন্দুধর্ম ও নৈতিক শিক্ষা', 100, 0, 0, 'R', 'T'],
  ['18', 'Buddhist Religion & Moral Education', 'বৌদ্ধধর্ম ও নৈতিক শিক্ষা', 100, 0, 0, 'R', 'T'],
  ['19', 'Christian Religion & Moral Education', 'খ্রিষ্টধর্ম ও নৈতিক শিক্ষা', 100, 0, 0, 'R', 'T'],
];

const JUNIOR_2023_TUPLES: RawSubjectTuple[] = [
  ['101', 'Bangla', 'বাংলা', 70, 30, 0, 'G', 'T'],
  ['107', 'English', 'ইংরেজি', 100, 0, 0, 'G', 'T'],
  ['109', 'Mathematics', 'গণিত', 70, 30, 0, 'G', 'T'],
  ['127', 'Science', 'বিজ্ঞান', 70, 30, 0, 'G', 'T'],
  ['153', 'History & Social Science', 'ইতিহাস ও সামাজিক বিজ্ঞান', 70, 30, 0, 'G', 'T'],
  ['154', 'Digital Technology', 'ডিজিটাল প্রযুক্তি', 50, 0, 50, 'G', 'T'],
  ['155', 'Life & Livelihood', 'জীবন ও জীবিকা', 50, 0, 50, 'G', 'T'],
  ['147', 'Health Protection', 'স্বাস্থ্য সুরক্ষা', 50, 0, 50, 'G', 'T'],
  ['148', 'Arts & Culture', 'শিল্প ও সংস্কৃতি', 50, 0, 50, 'G', 'T'],
  ['111', 'Islam Education', 'ইসলাম শিক্ষা', 70, 30, 0, 'R', 'T'],
  ['112', 'Hindu Religion Education', 'হিন্দুধর্ম শিক্ষা', 70, 30, 0, 'R', 'T'],
  ['113', 'Buddhist Religion Education', 'বৌদ্ধধর্ম শিক্ষা', 70, 30, 0, 'R', 'T'],
  ['114', 'Christian Religion Education', 'খ্রিষ্টধর্ম শিক্ষা', 70, 30, 0, 'R', 'T'],
];

const HSC_TUPLES: RawSubjectTuple[] = [
  ['101', 'Bangla 1st Paper', 'বাংলা ১ম পত্র', 70, 30, 0, 'G', 'P', '102'],
  ['102', 'Bangla 2nd Paper', 'বাংলা ২য় পত্র', 100, 0, 0, 'G', 'P', '101'],
  ['107', 'English 1st Paper', 'ইংরেজি ১ম পত্র', 100, 0, 0, 'G', 'P', '108'],
  ['108', 'English 2nd Paper', 'ইংরেজি ২য় পত্র', 100, 0, 0, 'G', 'P', '107'],
  ['275', 'ICT', 'তথ্য ও যোগাযোগ প্রযুক্তি', 50, 25, 25, 'G', 'P'],
  ['174', 'Physics 1st Paper', 'পদার্থবিজ্ঞান ১ম পত্র', 50, 25, 25, 'Gr', 'P', '175', 'Science'],
  ['175', 'Physics 2nd Paper', 'পদার্থবিজ্ঞান ২য় পত্র', 50, 25, 25, 'Gr', 'P', '174', 'Science'],
  ['176', 'Chemistry 1st Paper', 'রসায়ন ১ম পত্র', 50, 25, 25, 'Gr', 'P', '177', 'Science'],
  ['177', 'Chemistry 2nd Paper', 'রসায়ন ২য় পত্র', 50, 25, 25, 'Gr', 'P', '176', 'Science'],
  ['178', 'Biology 1st Paper', 'জীববিজ্ঞান ১ম পত্র', 50, 25, 25, 'Gr', 'P', '179', 'Science'],
  ['179', 'Biology 2nd Paper', 'জীববিজ্ঞান ২য় পত্র', 50, 25, 25, 'Gr', 'P', '178', 'Science'],
  ['265', 'Higher Mathematics 1st Paper', 'উচ্চতর গণিত ১ম পত্র', 50, 25, 25, 'Gr', 'P', '266', 'Science'],
  ['266', 'Higher Mathematics 2nd Paper', 'উচ্চতর গণিত ২য় পত্র', 50, 25, 25, 'Gr', 'P', '265', 'Science'],
  ['129', 'Statistics 1st Paper', 'পরিসংখ্যান ১ম পত্র', 50, 25, 25, 'Gr', 'P', '130', 'Science'],
  ['130', 'Statistics 2nd Paper', 'পরিসংখ্যান ২য় পত্র', 50, 25, 25, 'Gr', 'P', '129', 'Science'],
  ['180', 'Engineering Drawing & Workshop Practice 1st Paper', 'প্রকৌশল অঙ্কন ও ওয়ার্কশপ প্র্যাকটিস ১ম পত্র', 50, 0, 50, 'Gr', 'P', '181', 'Science'],
  ['181', 'Engineering Drawing & Workshop Practice 2nd Paper', 'প্রকৌশল অঙ্কন ও ওয়ার্কশপ প্র্যাকটিস ২য় পত্র', 50, 0, 50, 'Gr', 'P', '180', 'Science'],
  ['253', 'Accounting 1st Paper', 'হিসাববিজ্ঞান ১ম পত্র', 70, 30, 0, 'Gr', 'P', '254', 'Business Studies'],
  ['254', 'Accounting 2nd Paper', 'হিসাববিজ্ঞান ২য় পত্র', 70, 30, 0, 'Gr', 'P', '253', 'Business Studies'],
  ['277', 'Business Organization & Management 1st Paper', 'ব্যবসায় সংগঠন ও ব্যবস্থাপনা ১ম পত্র', 70, 30, 0, 'Gr', 'P', '278', 'Business Studies'],
  ['278', 'Business Organization & Management 2nd Paper', 'ব্যবসায় সংগঠন ও ব্যবস্থাপনা ২য় পত্র', 70, 30, 0, 'Gr', 'P', '277', 'Business Studies'],
  ['292', 'Finance, Banking & Insurance 1st Paper', 'ফিন্যান্স, ব্যাংকিং ও বিমা ১ম পত্র', 70, 30, 0, 'Gr', 'P', '293', 'Business Studies'],
  ['293', 'Finance, Banking & Insurance 2nd Paper', 'ফিন্যান্স, ব্যাংকিং ও বিমা ২য় পত্র', 70, 30, 0, 'Gr', 'P', '292', 'Business Studies'],
  ['286', 'Production Management & Marketing 1st Paper', 'উৎপাদন ব্যবস্থাপনা ও বিপণন ১ম পত্র', 70, 30, 0, 'Gr', 'P', '287', 'Business Studies'],
  ['287', 'Production Management & Marketing 2nd Paper', 'উৎপাদন ব্যবস্থাপনা ও বিপণন ২য় পত্র', 70, 30, 0, 'Gr', 'P', '286', 'Business Studies'],
  ['109', 'Economics 1st Paper', 'অর্থনীতি ১ম পত্র', 70, 30, 0, 'Gr', 'P', '110', 'Humanities'],
  ['110', 'Economics 2nd Paper', 'অর্থনীতি ২য় পত্র', 70, 30, 0, 'Gr', 'P', '109', 'Humanities'],
  ['269', 'Civics & Good Governance 1st Paper', 'পৌরনীতি ও সুশাসন ১ম পত্র', 70, 30, 0, 'Gr', 'P', '270', 'Humanities'],
  ['270', 'Civics & Good Governance 2nd Paper', 'পৌরনীতি ও সুশাসন ২য় পত্র', 70, 30, 0, 'Gr', 'P', '269', 'Humanities'],
  ['121', 'Logic 1st Paper', 'যুক্তিবিদ্যা ১ম পত্র', 70, 30, 0, 'Gr', 'P', '122', 'Humanities'],
  ['122', 'Logic 2nd Paper', 'যুক্তিবিদ্যা ২য় পত্র', 70, 30, 0, 'Gr', 'P', '121', 'Humanities'],
  ['304', 'History 1st Paper', 'ইতিহাস ১ম পত্র', 70, 30, 0, 'Gr', 'P', '305', 'Humanities'],
  ['305', 'History 2nd Paper', 'ইতিহাস ২য় পত্র', 70, 30, 0, 'Gr', 'P', '304', 'Humanities'],
  ['267', 'Islamic History & Culture 1st Paper', 'ইসলামের ইতিহাস ও সংস্কৃতি ১ম পত্র', 70, 30, 0, 'Gr', 'P', '268', 'Humanities'],
  ['268', 'Islamic History & Culture 2nd Paper', 'ইসলামের ইতিহাস ও সংস্কৃতি ২য় পত্র', 70, 30, 0, 'Gr', 'P', '267', 'Humanities'],
  ['117', 'Sociology 1st Paper', 'সমাজবিজ্ঞান ১ম পত্র', 70, 30, 0, 'Gr', 'P', '118', 'Humanities'],
  ['118', 'Sociology 2nd Paper', 'সমাজবিজ্ঞান ২য় পত্র', 70, 30, 0, 'Gr', 'P', '117', 'Humanities'],
  ['271', 'Social Work 1st Paper', 'সমাজকর্ম ১ম পত্র', 70, 30, 0, 'Gr', 'P', '272', 'Humanities'],
  ['272', 'Social Work 2nd Paper', 'সমাজকর্ম ২য় পত্র', 70, 30, 0, 'Gr', 'P', '271', 'Humanities'],
  ['125', 'Geography 1st Paper', 'ভূগোল ১ম পত্র', 50, 25, 25, 'Gr', 'P', '126', 'Humanities'],
  ['126', 'Geography 2nd Paper', 'ভূগোল ২য় পত্র', 50, 25, 25, 'Gr', 'P', '125', 'Humanities'],
  ['123', 'Psychology 1st Paper', 'মনোবিজ্ঞান ১ম পত্র', 50, 25, 25, 'Gr', 'P', '124', 'Humanities'],
  ['124', 'Psychology 2nd Paper', 'মনোবিজ্ঞান ২য় পত্র', 50, 25, 25, 'Gr', 'P', '123', 'Humanities'],
  ['249', 'Islamic Studies 1st Paper', 'ইসলাম শিক্ষা ১ম পত্র', 70, 30, 0, 'Gr', 'P', '250', 'Humanities'],
  ['250', 'Islamic Studies 2nd Paper', 'ইসলাম শিক্ষা ২য় পত্র', 70, 30, 0, 'Gr', 'P', '249', 'Humanities'],
  ['239', 'Agriculture Education 1st Paper', 'কৃষিশিক্ষা ১ম পত্র', 50, 25, 25, 'Gr', 'P', '240', 'Humanities'],
  ['240', 'Agriculture Education 2nd Paper', 'কৃষিশিক্ষা ২য় পত্র', 50, 25, 25, 'Gr', 'P', '239', 'Humanities'],
  ['273', 'Home Science 1st Paper', 'গার্হস্থ্য বিজ্ঞান ১ম পত্র', 50, 25, 25, 'Gr', 'P', '274', 'Humanities'],
  ['274', 'Home Science 2nd Paper', 'গার্হস্থ্য বিজ্ঞান ২য় পত্র', 50, 25, 25, 'Gr', 'P', '273', 'Humanities'],
  ['279', 'Food & Nutrition 1st Paper', 'খাদ্য ও পুষ্টি ১ম পত্র', 50, 25, 25, 'Gr', 'P', '280', 'Humanities'],
  ['280', 'Food & Nutrition 2nd Paper', 'খাদ্য ও পুষ্টি ২য় পত্র', 50, 25, 25, 'Gr', 'P', '279', 'Humanities'],
  ['133', 'Arabic 1st Paper', 'আরবি ১ম পত্র', 100, 0, 0, 'Gr', 'P', '134', 'Humanities'],
  ['134', 'Arabic 2nd Paper', 'আরবি ২য় পত্র', 100, 0, 0, 'Gr', 'P', '133', 'Humanities'],
];

const DAKHIL_TUPLES: RawSubjectTuple[] = [
  ['101', 'Quran Majid & Tajvid', 'কুরআন মাজিদ ও তাজভিদ', 70, 30, 0, 'G', 'P'],
  ['102', 'Hadith Sharif', 'হাদিস শরিফ', 70, 30, 0, 'G', 'P'],
  ['133', 'Aqaid & Fiqh', 'আকাইদ ও ফিকহ', 70, 30, 0, 'G', 'P'],
  ['103', 'Arabic 1st Paper', 'আরবি ১ম পত্র', 70, 30, 0, 'G', 'P', '104'],
  ['104', 'Arabic 2nd Paper', 'আরবি ২য় পত্র', 70, 30, 0, 'G', 'P', '103'],
  ['134', 'Bangla 1st Paper', 'বাংলা ১ম পত্র', 70, 30, 0, 'G', 'P', '135'],
  ['135', 'Bangla 2nd Paper', 'বাংলা ২য় পত্র', 70, 30, 0, 'G', 'P', '134'],
  ['136', 'English 1st Paper', 'ইংরেজি ১ম পত্র', 100, 0, 0, 'G', 'P', '137'],
  ['137', 'English 2nd Paper', 'ইংরেজি ২য় পত্র', 100, 0, 0, 'G', 'P', '136'],
  ['108', 'Mathematics', 'গণিত', 70, 30, 0, 'G', 'P'],
  ['140', 'ICT', 'তথ্য ও যোগাযোগ প্রযুক্তি', 0, 25, 25, 'G', 'P'],
  ['143', 'Bangladesh and Global Studies', 'বাংলাদেশ ও বিশ্বপরিচয়', 70, 30, 0, 'G', 'P'],
  ['142', 'Physical Education, Health & Sports', 'শারীরিক শিক্ষা, স্বাস্থ্যবিজ্ঞান ও খেলাধুলা', 70, 0, 30, 'G', 'T'],
  ['145', 'Career Education', 'ক্যারিয়ার শিক্ষা', 100, 0, 0, 'G', 'T'],
  ['148', 'Arts & Crafts', 'চারু ও কারুকলা', 50, 0, 50, 'G', 'T'],
  ['130', 'Physics', 'পদার্থবিজ্ঞান', 50, 25, 25, 'Gr', 'P', undefined, 'Science'],
  ['131', 'Chemistry', 'রসায়ন', 50, 25, 25, 'Gr', 'P', undefined, 'Science'],
  ['132', 'Biology', 'জীববিজ্ঞান', 50, 25, 25, 'Gr', 'P', undefined, 'Science'],
  ['115', 'Higher Mathematics', 'উচ্চতর গণিত', 50, 25, 25, 'Gr', 'P', undefined, 'Science'],
  ['139', 'Islamic History', 'ইসলামের ইতিহাস', 70, 30, 0, 'Gr', 'P', undefined, 'General'],
  ['111', 'Civics & Citizenship', 'পৌরনীতি ও নাগরিকতা', 70, 30, 0, 'Gr', 'P', undefined, 'General'],
  ['119', 'Tajvid Nasr & Nazm', 'তাজভিদ নসর ও নজম', 70, 30, 0, 'Gr', 'P', undefined, 'Mujabbid'],
  ['120', 'Qiraat Tartil & Hadr', 'কিরাআতে তারতিল ও হাদর', 0, 0, 100, 'Gr', 'T', undefined, 'Mujabbid'],
  ['121', 'Tajvid (Hifzul Quran)', 'তাজভিদ (হিফজুল কুরআন)', 75, 0, 25, 'Gr', 'T', undefined, 'Hifzul Quran'],
  ['122', 'Hifzul Quran Daur', 'হিফজুল কুরআন দাওর', 0, 0, 100, 'Gr', 'T', undefined, 'Hifzul Quran'],
  ['112', 'Mantiq', 'মানতিক', 100, 0, 0, 'Gr', 'T', undefined, '4th subject'],
  ['113', 'Agriculture Studies', 'কৃষিশিক্ষা', 50, 25, 25, 'Gr', 'P', undefined, '4th subject'],
  ['114', 'Home Science', 'গার্হস্থ্যবিজ্ঞান', 50, 25, 25, 'Gr', 'P', undefined, '4th subject'],
  ['116', 'Urdu', 'উর্দু', 100, 0, 0, 'Gr', 'T', undefined, '4th subject'],
  ['123', 'Farsi', 'ফারসি', 100, 0, 0, 'Gr', 'T', undefined, '4th subject'],
];

const EBTEDAYI_TUPLES: RawSubjectTuple[] = [
  ['31', 'Quran Majid', 'কুরআন মাজিদ', 100, 0, 0, 'G', 'T'],
  ['32', 'Aqaid & Fiqh', 'আকাইদ ও ফিকহ', 100, 0, 0, 'G', 'T'],
  ['33', 'Arabic', 'আরবি', 100, 0, 0, 'G', 'T'],
  ['34', 'Bangla', 'বাংলা', 100, 0, 0, 'G', 'T'],
  ['35', 'English', 'ইংরেজি', 100, 0, 0, 'G', 'T'],
  ['36', 'Mathematics', 'গণিত', 100, 0, 0, 'G', 'T'],
  ['37', 'Bangladesh and Global Studies', 'বাংলাদেশ ও বিশ্বপরিচয়', 100, 0, 0, 'G', 'T'],
  ['38', 'Primary Science', 'প্রাথমিক বিজ্ঞান', 100, 0, 0, 'G', 'T'],
  ['39', 'Akhlaq', 'আখলাক', 100, 0, 0, 'G', 'T'],
  ['40', 'Arts & Crafts', 'চারু ও কারুকলা', 50, 0, 50, 'G', 'T'],
];

const ALIM_NEW_TUPLES: RawSubjectTuple[] = [
  ['100', 'Quran Majid', 'কুরআন মাজিদ', 100, 0, 0, 'G', 'T'],
  ['330', 'Hadith & Usulul Hadith', 'হাদিস ও উসুলুল হাদিস', 100, 0, 0, 'G', 'T'],
  ['331', 'Al Fiqh 1st Paper', 'আল ফিকহ ১ম পত্র', 100, 0, 0, 'G', 'T'],
  ['101', 'Bangla 1st Paper', 'বাংলা ১ম পত্র', 70, 30, 0, 'G', 'P', '102'],
  ['102', 'Bangla 2nd Paper', 'বাংলা ২য় পত্র', 100, 0, 0, 'G', 'P', '101'],
  ['107', 'English 1st Paper', 'ইংরেজি ১ম পত্র', 100, 0, 0, 'G', 'P', '108'],
  ['108', 'English 2nd Paper', 'ইংরেজি ২য় পত্র', 100, 0, 0, 'G', 'P', '107'],
  ['275', 'ICT', 'তথ্য ও যোগাযোগ প্রযুক্তি', 50, 25, 25, 'G', 'P'],
  ['332', 'Al Fiqh 2nd Paper', 'আল ফিকহ ২য় পত্র', 100, 0, 0, 'Gr', 'T', undefined, 'General'],
  ['333', 'Arabic 1st Paper', 'আরবি ১ম পত্র', 100, 0, 0, 'Gr', 'T', '334', 'General'],
  ['334', 'Arabic 2nd Paper', 'আরবি ২য় পত্র', 100, 0, 0, 'Gr', 'T', '333', 'General'],
  ['335', 'Islamic History', 'ইসলামের ইতিহাস', 100, 0, 0, 'Gr', 'T', undefined, 'General'],
  ['336', 'Balagat & Mantiq', 'বালাগাত ও মানতিক', 100, 0, 0, 'Gr', 'T', undefined, 'General'],
  ['341', 'Arabic', 'আরবি', 100, 0, 0, 'Gr', 'T', undefined, 'Science'],
  ['174', 'Physics 1st Paper', 'পদার্থবিজ্ঞান ১ম পত্র', 50, 25, 25, 'Gr', 'P', '175', 'Science'],
  ['175', 'Physics 2nd Paper', 'পদার্থবিজ্ঞান ২য় পত্র', 50, 25, 25, 'Gr', 'P', '174', 'Science'],
  ['176', 'Chemistry 1st Paper', 'রসায়ন ১ম পত্র', 50, 25, 25, 'Gr', 'P', '177', 'Science'],
  ['177', 'Chemistry 2nd Paper', 'রসায়ন ২য় পত্র', 50, 25, 25, 'Gr', 'P', '176', 'Science'],
  ['265', 'Higher Mathematics 1st Paper', 'উচ্চতর গণিত ১ম পত্র', 50, 25, 25, 'Gr', 'P', '266', 'Science'],
  ['266', 'Higher Mathematics 2nd Paper', 'উচ্চতর গণিত ২য় পত্র', 50, 25, 25, 'Gr', 'P', '265', 'Science'],
  ['178', 'Biology 1st Paper', 'জীববিজ্ঞান ১ম পত্র', 50, 25, 25, 'Gr', 'P', '179', 'Science'],
  ['179', 'Biology 2nd Paper', 'জীববিজ্ঞান ২য় পত্র', 50, 25, 25, 'Gr', 'P', '178', 'Science'],
  ['342', 'Tajvid 1st Paper', 'তাজভিদ ১ম পত্র', 100, 0, 0, 'Gr', 'P', '343', 'Mujabbid'],
  ['343', 'Tajvid 2nd Paper', 'তাজভিদ ২য় পত্র', 100, 0, 0, 'Gr', 'P', '342', 'Mujabbid'],
  ['344', 'Qiraat Tartil', 'কিরাআতে তারতিল', 0, 0, 100, 'Gr', 'T', undefined, 'Mujabbid'],
  ['345', 'Qiraat Hadr', 'কিরাআতে হাদর', 0, 0, 100, 'Gr', 'T', undefined, 'Mujabbid'],
  ['109', 'Economics 1st Paper', 'অর্থনীতি ১ম পত্র', 70, 30, 0, 'Gr', 'P', '110', '4th subject'],
  ['110', 'Economics 2nd Paper', 'অর্থনীতি ২য় পত্র', 70, 30, 0, 'Gr', 'P', '109', '4th subject'],
  ['269', 'Civics & Good Governance 1st Paper', 'পৌরনীতি ও সুশাসন ১ম পত্র', 70, 30, 0, 'Gr', 'P', '270', '4th subject'],
  ['270', 'Civics & Good Governance 2nd Paper', 'পৌরনীতি ও সুশাসন ২য় পত্র', 70, 30, 0, 'Gr', 'P', '269', '4th subject'],
  ['337', 'Urdu 1st Paper', 'উর্দু ১ম পত্র', 100, 0, 0, 'Gr', 'P', '338', '4th subject'],
  ['338', 'Urdu 2nd Paper', 'উর্দু ২য় পত্র', 100, 0, 0, 'Gr', 'P', '337', '4th subject'],
  ['339', 'Farsi 1st Paper', 'ফারসি ১ম পত্র', 100, 0, 0, 'Gr', 'P', '340', '4th subject'],
  ['340', 'Farsi 2nd Paper', 'ফারসি ২য় পত্র', 100, 0, 0, 'Gr', 'P', '339', '4th subject'],
];

const ALIM_OLD_TUPLES: RawSubjectTuple[] = [
  ['201', 'Quran Majid', 'কুরআন মাজিদ', 100, 0, 0, 'G', 'T'],
  ['202', 'Hadith & Usulul Hadith', 'হাদিস ও উসুলুল হাদিস', 100, 0, 0, 'G', 'T'],
  ['203', 'Al Fiqh 1st Paper', 'আল ফিকহ ১ম পত্র', 100, 0, 0, 'G', 'T'],
  ['236', 'Bangla 1st Paper', 'বাংলা ১ম পত্র', 70, 30, 0, 'G', 'P', '237'],
  ['237', 'Bangla 2nd Paper', 'বাংলা ২য় পত্র', 100, 0, 0, 'G', 'P', '236'],
  ['238', 'English 1st Paper', 'ইংরেজি ১ম পত্র', 100, 0, 0, 'G', 'P', '239'],
  ['239', 'English 2nd Paper', 'ইংরেজি ২য় পত্র', 100, 0, 0, 'G', 'P', '238'],
  ['240', 'ICT', 'তথ্য ও যোগাযোগ প্রযুক্তি', 50, 25, 25, 'G', 'P'],
  ['204', 'Al Fiqh 2nd Paper', 'আল ফিকহ ২য় পত্র', 100, 0, 0, 'Gr', 'T', undefined, 'General'],
  ['205', 'Arabic 1st Paper', 'আরবি ১ম পত্র', 100, 0, 0, 'Gr', 'T', '206', 'General'],
  ['206', 'Arabic 2nd Paper', 'আরবি ২য় পত্র', 100, 0, 0, 'Gr', 'T', '205', 'General'],
  ['209', 'Islamic History', 'ইসলামের ইতিহাস', 100, 0, 0, 'Gr', 'T', undefined, 'General'],
  ['210', 'Balagat & Mantiq', 'বালাগাত ও মানতিক', 100, 0, 0, 'Gr', 'T', undefined, 'General'],
  ['223', 'Arabic', 'আরবি', 100, 0, 0, 'Gr', 'T', undefined, 'Science'],
  ['224', 'Physics 1st Paper', 'পদার্থবিজ্ঞান ১ম পত্র', 50, 25, 25, 'Gr', 'P', '225', 'Science'],
  ['225', 'Physics 2nd Paper', 'পদার্থবিজ্ঞান ২য় পত্র', 50, 25, 25, 'Gr', 'P', '224', 'Science'],
  ['226', 'Chemistry 1st Paper', 'রসায়ন ১ম পত্র', 50, 25, 25, 'Gr', 'P', '227', 'Science'],
  ['227', 'Chemistry 2nd Paper', 'রসায়ন ২য় পত্র', 50, 25, 25, 'Gr', 'P', '226', 'Science'],
  ['228', 'Higher Mathematics 1st Paper', 'উচ্চতর গণিত ১ম পত্র', 50, 25, 25, 'Gr', 'P', '229', 'Science'],
  ['229', 'Higher Mathematics 2nd Paper', 'উচ্চতর গণিত ২য় পত্র', 50, 25, 25, 'Gr', 'P', '228', 'Science'],
  ['230', 'Biology 1st Paper', 'জীববিজ্ঞান ১ম পত্র', 50, 25, 25, 'Gr', 'P', '231', 'Science'],
  ['231', 'Biology 2nd Paper', 'জীববিজ্ঞান ২য় পত্র', 50, 25, 25, 'Gr', 'P', '230', 'Science'],
  ['232', 'Tajvid 1st Paper', 'তাজভিদ ১ম পত্র', 100, 0, 0, 'Gr', 'P', '233', 'Mujabbid'],
  ['233', 'Tajvid 2nd Paper', 'তাজভিদ ২য় পত্র', 100, 0, 0, 'Gr', 'P', '232', 'Mujabbid'],
  ['234', 'Qiraat Tartil', 'কিরাআতে তারতিল', 0, 0, 100, 'Gr', 'T', undefined, 'Mujabbid'],
  ['235', 'Qiraat Hadr', 'কিরাআতে হাদর', 0, 0, 100, 'Gr', 'T', undefined, 'Mujabbid'],
  ['213', 'Economics 1st Paper', 'অর্থনীতি ১ম পত্র', 70, 30, 0, 'Gr', 'P', '214', '4th subject'],
  ['214', 'Economics 2nd Paper', 'অর্থনীতি ২য় পত্র', 70, 30, 0, 'Gr', 'P', '213', '4th subject'],
  ['241', 'Civics & Good Governance 1st Paper', 'পৌরনীতি ও সুশাসন ১ম পত্র', 70, 30, 0, 'Gr', 'P', '242', '4th subject'],
  ['242', 'Civics & Good Governance 2nd Paper', 'পৌরনীতি ও সুশাসন ২য় পত্র', 70, 30, 0, 'Gr', 'P', '241', '4th subject'],
  ['219', 'Urdu 1st Paper', 'উর্দু ১ম পত্র', 100, 0, 0, 'Gr', 'P', '220', '4th subject'],
  ['220', 'Urdu 2nd Paper', 'উর্দু ২য় পত্র', 100, 0, 0, 'Gr', 'P', '219', '4th subject'],
  ['221', 'Farsi 1st Paper', 'ফারসি ১ম পত্র', 100, 0, 0, 'Gr', 'P', '222', '4th subject'],
  ['222', 'Farsi 2nd Paper', 'ফারসি ২য় পত্র', 100, 0, 0, 'Gr', 'P', '221', '4th subject'],
];

const HIFZ_TUPLES: RawSubjectTuple[] = [
  ['51', 'Hifzul Quran', 'হিফজুল কুরআন', 0, 0, 100, 'G', 'T'],
  ['52', 'Nazera Quran', 'নাজেরা কুরআন', 0, 0, 100, 'G', 'T'],
  ['53', 'Nurani Qaida', 'নূরানী কায়দা', 0, 0, 100, 'G', 'T'],
  ['54', 'Tajvid', 'তাজভিদ', 50, 0, 50, 'G', 'T'],
  ['55', 'Masnun Dua & Kalima', 'মাসনুন দোয়া ও কালিমা', 0, 0, 100, 'G', 'T'],
  ['56', 'Arabic', 'আরবি', 100, 0, 0, 'G', 'T'],
  ['57', 'Aqaid & Masail', 'আকাইদ ও মাসায়েল', 100, 0, 0, 'G', 'T'],
  ['58', 'Akhlaq & Adab', 'আখলাক ও আদব', 100, 0, 0, 'G', 'T'],
  ['59', 'Bangla', 'বাংলা', 100, 0, 0, 'G', 'T'],
  ['60', 'English', 'ইংরেজি', 100, 0, 0, 'G', 'T'],
  ['61', 'Mathematics', 'গণিত', 100, 0, 0, 'G', 'T'],
  ['62', 'Urdu', 'উর্দু', 100, 0, 0, 'G', 'T'],
];

const PRESCHOOL_TUPLES: RawSubjectTuple[] = [
  ['1', 'Bangla', 'বাংলা', 100, 0, 0, 'G', 'T'],
  ['2', 'English', 'ইংরেজি', 100, 0, 0, 'G', 'T'],
  ['3', 'Mathematics', 'গণিত', 100, 0, 0, 'G', 'T'],
  ['4', 'Drawing', 'অঙ্কন', 0, 0, 100, 'G', 'T'],
  ['5', 'Rhymes & Poems', 'ছড়া ও কবিতা', 0, 0, 100, 'G', 'T'],
  ['6', 'General Knowledge', 'সাধারণ জ্ঞান', 100, 0, 0, 'G', 'T'],
  ['7', 'Religion', 'ধর্ম', 100, 0, 0, 'G', 'T'],
  ['8', 'Spoken English', 'স্পোকেন ইংলিশ', 0, 0, 100, 'G', 'T'],
  ['9', 'Handwriting', 'হাতের লেখা', 0, 0, 100, 'G', 'T'],
  ['10', 'Moral Education', 'নৈতিক শিক্ষা', 100, 0, 0, 'G', 'T'],
  ['23', 'Art & Craft', 'আর্ট ও ক্রাফট', 0, 0, 100, 'G', 'T'],
  ['24', 'Computer', 'কম্পিউটার', 0, 0, 100, 'G', 'T'],
  ['11', 'Islam Education', 'ইসলাম শিক্ষা', 100, 0, 0, 'R', 'T'],
  ['12', 'Hindu Religion Education', 'হিন্দুধর্ম শিক্ষা', 100, 0, 0, 'R', 'T'],
  ['13', 'Buddhist Religion Education', 'বৌদ্ধধর্ম শিক্ষা', 100, 0, 0, 'R', 'T'],
  ['14', 'Christian Religion Education', 'খ্রিষ্টধর্ম শিক্ষা', 100, 0, 0, 'R', 'T'],
  ['15', 'Arabic & Quran', 'আরবি ও কুরআন', 50, 0, 50, 'G', 'T'],
  ['16', 'Environment & Science', 'পরিবেশ ও বিজ্ঞান', 100, 0, 0, 'G', 'T'],
  ['17', 'Social Studies', 'সমাজ পরিচিতি', 100, 0, 0, 'G', 'T'],
  ['18', 'English Rhymes', 'ইংরেজি ছড়া', 0, 0, 100, 'G', 'T'],
  ['19', 'Bangla Rhymes', 'বাংলা ছড়া', 0, 0, 100, 'G', 'T'],
  ['20', 'Dictation & Spelling', 'শ্রুতলিখন ও বানান', 100, 0, 0, 'G', 'T'],
  ['21', 'Games & Physical Education', 'খেলাধুলা ও শরীরচর্চা', 0, 0, 100, 'G', 'T'],
  ['22', 'Music & Dance', 'গান ও নাচ', 0, 0, 100, 'G', 'T'],
  ['25', 'Colouring', 'রং করা', 0, 0, 100, 'G', 'T'],
  ['26', 'Bangla Handwriting', 'বাংলা হাতের লেখা', 0, 0, 100, 'G', 'T'],
  ['27', 'English Handwriting', 'ইংরেজি হাতের লেখা', 0, 0, 100, 'G', 'T'],
  ['28', 'Number Work', 'সংখ্যা পরিচিতি', 100, 0, 0, 'G', 'T'],
];

export const MASTER_SUBJECT_LIBRARIES: MasterSubjectLibrary[] = [
  {
    id: 'school.secondary',
    titleBn: 'মাধ্যমিক · ৬ষ্ঠ–১০ম (SSC কোড)',
    titleEn: 'School · Secondary · Class 6–10',
    subtitleBn: 'NCTB ও শিক্ষা বোর্ডের সকল আবশ্যিক, বিভাগীয়, ধর্মীয় ও ৪র্থ বিষয়',
    badge: 'SSC',
    subjects: expandLibrary('school.secondary', SECONDARY_TUPLES),
  },
  {
    id: 'school.primary',
    titleBn: 'প্রাথমিক · ১ম–৫ম শ্রেণি',
    titleEn: 'School · Primary · Class 1–5',
    subtitleBn: 'প্রাথমিক স্তরের সাধারণ, ধর্মীয় ও সহশিক্ষা বিষয়সমূহ',
    badge: 'Primary',
    subjects: expandLibrary('school.primary', PRIMARY_TUPLES),
  },
  {
    id: 'school.junior',
    titleBn: 'নিম্ন মাধ্যমিক · ৬ষ্ঠ–৮ম (২০২৩)',
    titleEn: 'Class 6–8 · 2023 Curriculum',
    subtitleBn: 'ডিজিটাল প্রযুক্তি, জীবন ও জীবিকা, স্বাস্থ্য সুরক্ষা ও শিল্প সংস্কৃতি',
    badge: 'Junior',
    subjects: expandLibrary('school.junior', JUNIOR_2023_TUPLES),
  },
  {
    id: 'college.hsc',
    titleBn: 'কলেজ · এইচএসসি (১১শ–১২শ)',
    titleEn: 'College · HSC · Class 11–12',
    subtitleBn: 'উচ্চ মাধ্যমিক বিজ্ঞান, ব্যবসায় শিক্ষা ও মানবিক (১ম ও ২য় পত্র)',
    badge: 'HSC',
    subjects: expandLibrary('college.hsc', HSC_TUPLES),
  },
  {
    id: 'madrasah.dakhil',
    titleBn: 'মাদ্রাসা · দাখিল (৬ষ্ঠ–১০ম)',
    titleEn: 'Madrasah · Dakhil · Class 6–10',
    subtitleBn: 'কুরআন, হাদিস, আকাইদ, আরবি, বিজ্ঞান, মুজাব্বিদ ও হিফজুল কুরআন',
    badge: 'Dakhil',
    subjects: expandLibrary('madrasah.dakhil', DAKHIL_TUPLES),
  },
  {
    id: 'madrasah.ebtedayi',
    titleBn: 'মাদ্রাসা · ইবতেদায়ী (১ম–৫ম)',
    titleEn: 'Madrasah · Ebtedayi · Class 1–5',
    subtitleBn: 'ইবতেদায়ী স্তরের কুরআন, আকাইদ, আরবি ও সাধারণ বিষয়',
    badge: 'Ebtedayi',
    subjects: expandLibrary('madrasah.ebtedayi', EBTEDAYI_TUPLES),
  },
  {
    id: 'madrasah.alim',
    titleBn: 'আলিম · ১১শ–১২শ (নতুন কোড ২০২৬-২৭)',
    titleEn: 'Alim · Class 11–12 (New Codes)',
    subtitleBn: 'মাদ্রাসা বোর্ডের নতুন কোডভিত্তিক আলিম সাধারণ, বিজ্ঞান ও মুজাব্বিদ',
    badge: 'Alim 26+',
    subjects: expandLibrary('madrasah.alim', ALIM_NEW_TUPLES),
  },
  {
    id: 'madrasah.alim_old',
    titleBn: 'আলিম · ১১শ–১২শ (পুরাতন কোড)',
    titleEn: 'Alim · Class 11–12 (Legacy Codes)',
    subtitleBn: '২০২৬-২৭ পূর্ববর্তী সেশনের আলিম বোর্ড কোডসমূহ',
    badge: 'Alim Old',
    subjects: expandLibrary('madrasah.alim_old', ALIM_OLD_TUPLES),
  },
  {
    id: 'madrasah.hifz',
    titleBn: 'হিফজ · নূরানী · নাজেরা',
    titleEn: 'Hifz · Nurani · Nazera',
    subtitleBn: 'হিফজুল কুরআন, নাজেরা, নূরানী কায়দা, তাজভিদ ও মাসনুন দোয়া',
    badge: 'Hifz',
    subjects: expandLibrary('madrasah.hifz', HIFZ_TUPLES),
  },
  {
    id: 'preschool.kg',
    titleBn: 'প্রি-স্কুল · কেজি (Play / Nursery / KG)',
    titleEn: 'Pre-school · KG',
    subtitleBn: 'প্লে, নার্সারি ও কেজি শ্রেণির ছড়া, অঙ্কন, হাতের লেখা ও প্রাথমিক বিষয়',
    badge: 'KG',
    subjects: expandLibrary('preschool.kg', PRESCHOOL_TUPLES),
  },
];

export const ALL_MASTER_SUBJECTS: MasterSubjectEntry[] = MASTER_SUBJECT_LIBRARIES.flatMap(
  (lib) => lib.subjects,
);

export function toNumMark(v: number | string | undefined): number {
  if (typeof v === 'number') return Number.isFinite(v) ? Math.max(0, v) : 0;
  const parsed = Number(String(v ?? '').replace(/[^\d.]/g, ''));
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

/** Standard NCTB 33% rounding (e.g. 100 -> 33, 70 -> 23, 50 -> 17, 30 -> 10, 25 -> 8) */
export function computeComponentPass(maxMarks: number): number {
  if (maxMarks <= 0) return 0;
  return Math.round(maxMarks * 0.33);
}

export function formatPassMarksBreakdown(params: {
  cq: number | string;
  mcq: number | string;
  practical: number | string;
  ca?: number | string;
  passRuleMode?: MasterPassRule;
}): { totalMarks: number; totalPass: number; summaryText: string } {
  const cq = toNumMark(params.cq);
  const mcq = toNumMark(params.mcq);
  const practical = toNumMark(params.practical);
  const ca = toNumMark(params.ca);
  const totalMarks = cq + mcq + practical + ca;
  const totalPass = computeComponentPass(totalMarks);

  if (params.passRuleMode === 'total') {
    return {
      totalMarks,
      totalPass,
      summaryText: `মোট ${totalPass}`,
    };
  }

  const parts: string[] = [];
  if (cq > 0) parts.push(`CQ ${computeComponentPass(cq)}`);
  if (mcq > 0) parts.push(`MCQ ${computeComponentPass(mcq)}`);
  if (practical > 0) parts.push(`ব্যব ${computeComponentPass(practical)}`);
  if (ca > 0) parts.push(`CA ${computeComponentPass(ca)}`);

  return {
    totalMarks,
    totalPass,
    summaryText: parts.length > 0 ? parts.join(' · ') : `মোট ${totalPass}`,
  };
}

export function mapStreamTagToGroupBn(streamTag?: string): SubjectCurriculumItem['group'] {
  if (!streamTag) return 'সাধারণ';
  const low = streamTag.toLowerCase();
  if (low.includes('science')) return 'বিজ্ঞান';
  if (low.includes('business') || low.includes('commerce')) return 'ব্যবসায় শিক্ষা';
  if (low.includes('humanities')) return 'মানবিক';
  return 'সাধারণ';
}

export function mapCatalogItemToCurriculumItem(
  entry: MasterSubjectEntry,
  grade: '6th' | '7th' | '8th' | '9th' | '10th',
  nameLang: 'bn' | 'en' = 'bn',
): SubjectCurriculumItem {
  const fullMarks = entry.cq + entry.mcq + entry.practical;
  const passInfo = formatPassMarksBreakdown({
    cq: entry.cq,
    mcq: entry.mcq,
    practical: entry.practical,
    ca: 0,
    passRuleMode: entry.passRule,
  });
  const isFourth = (entry.streamTag || '').toLowerCase().includes('4th');
  const groupBn = mapStreamTagToGroupBn(entry.streamTag);

  return {
    id: `curr-${grade}-${entry.code}-${entry.libraryId.replace('.', '_')}`,
    code: entry.code,
    name: nameLang === 'en' ? entry.nameEn : entry.nameBn,
    nameEn: entry.nameEn,
    nameBn: entry.nameBn,
    grade,
    group: groupBn,
    subjectType: entry.type,
    cq: entry.cq,
    mcq: entry.mcq > 0 ? entry.mcq : 0,
    practical: entry.practical > 0 ? entry.practical : 0,
    ca: 0,
    fullMarks,
    passMarks: passInfo.totalPass,
    passRuleMode: entry.passRule,
    passRules:
      entry.passRule === 'part'
        ? `${passInfo.summaryText} (পৃথক পাস)`
        : `মোট ${passInfo.totalPass}/${fullMarks} (মোট পাস)`,
    isJointPass: Boolean(entry.combinedWithCode),
    combinedWithCode: entry.combinedWithCode,
    jointPassInfo: entry.combinedWithCode ? `যুগ্ম পত্র কোড: ${entry.combinedWithCode}` : undefined,
    isUncountableCA: false,
    category: isFourth ? '৪র্থ বিষয়' : 'আবশ্যিক',
  };
}

/**
 * Bidirectionally pairs (or unpairs) two subjects in the same grade.
 * Ensures clean symmetry: if A pairs with B, B automatically pairs with A,
 * and any previous partner of A or B is cleanly detached.
 */
export function pairCombinedSubjectsBidirectionally(
  items: SubjectCurriculumItem[],
  grade: string,
  sourceId: string,
  targetCode: string,
): SubjectCurriculumItem[] {
  const sourceItem = items.find((i) => i.id === sourceId && i.grade === grade);
  if (!sourceItem) return items;

  const cleanTarget = targetCode.trim();
  const prevTargetCode = (sourceItem.combinedWithCode || '').trim();

  return items.map((item) => {
    if (item.grade !== grade) return item;

    // Detach previous partner of source
    if (prevTargetCode && item.code === prevTargetCode && item.id !== sourceId) {
      return {
        ...item,
        isJointPass: false,
        combinedWithCode: undefined,
        jointPassInfo: undefined,
      };
    }

    // Detach anyone else who was pointing to the new target
    if (cleanTarget && item.combinedWithCode === cleanTarget && item.id !== sourceId) {
      return {
        ...item,
        isJointPass: false,
        combinedWithCode: undefined,
        jointPassInfo: undefined,
      };
    }

    // Update source row
    if (item.id === sourceId) {
      if (!cleanTarget || cleanTarget === item.code) {
        return {
          ...item,
          isJointPass: false,
          combinedWithCode: undefined,
          jointPassInfo: undefined,
        };
      }
      return {
        ...item,
        isJointPass: true,
        combinedWithCode: cleanTarget,
        jointPassInfo: `যুগ্ম পত্র কোড: ${cleanTarget}`,
      };
    }

    // Update target partner row symmetrically
    if (cleanTarget && item.code === cleanTarget && item.id !== sourceId) {
      return {
        ...item,
        isJointPass: true,
        combinedWithCode: sourceItem.code,
        jointPassInfo: `যুগ্ম পত্র কোড: ${sourceItem.code}`,
      };
    }

    return item;
  });
}

/**
 * Batch-assigns selected master subjects into one or more grades without creating duplicates.
 */
export function assignMasterSubjectsToGrades(
  existing: SubjectCurriculumItem[],
  selectedEntries: MasterSubjectEntry[],
  targetGrades: Array<'6th' | '7th' | '8th' | '9th' | '10th'>,
  nameLang: 'bn' | 'en' = 'bn',
): { updated: SubjectCurriculumItem[]; addedCount: number } {
  const next = [...existing];
  let addedCount = 0;

  for (const grade of targetGrades) {
    const existingKeys = new Set(
      next
        .filter((i) => i.grade === grade)
        .flatMap((i) => [
          i.code.trim().toLowerCase(),
          i.name.trim().toLowerCase(),
          (i.nameBn || '').trim().toLowerCase(),
          (i.nameEn || '').trim().toLowerCase(),
        ])
        .filter(Boolean),
    );

    for (const entry of selectedEntries) {
      const codeKey = entry.code.trim().toLowerCase();
      const bnKey = entry.nameBn.trim().toLowerCase();
      const enKey = entry.nameEn.trim().toLowerCase();

      if (existingKeys.has(codeKey) || existingKeys.has(bnKey) || existingKeys.has(enKey)) {
        continue;
      }

      const mapped = mapCatalogItemToCurriculumItem(entry, grade, nameLang);
      next.push(mapped);
      existingKeys.add(codeKey);
      existingKeys.add(bnKey);
      existingKeys.add(enKey);
      addedCount += 1;
    }
  }

  return { updated: next, addedCount };
}
