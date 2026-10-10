// ═════════════════════════════════════════════════════════════════
// CURRICULUM SERVICE (DYNAMIC SUBJECTS & OPTIONAL 4TH SUBJECTS)
// ═════════════════════════════════════════════════════════════════

export interface SubjectCurriculumItem {
  id: string;
  code: string;
  name: string;
  grade: '6th' | '7th' | '8th' | '9th' | '10th' | string;
  group: 'সাধারণ' | 'বিজ্ঞান' | 'মানবিক' | 'ব্যবসায় শিক্ষা' | 'ব্যবসায় শিক্ষা' | 'মানবিক ও ব্যবসায় শিক্ষা' | string;
  cq: number | string;
  mcq: number | string;
  practical: number | string;
  ca: number | string;
  fullMarks: number;
  passMarks: number;
  passRules: string;
  isJointPass?: boolean;
  jointPassInfo?: string;
  category: 'আবশ্যিক' | 'ঐচ্ছিক' | '৪র্থ বিষয়' | 'সাধারণ' | string;
}

const base6to8Subjects: Omit<SubjectCurriculumItem, 'id' | 'grade'>[] = [
  { code: 'BAN-601', name: 'বাংলা ১ম পত্র', group: 'সাধারণ', cq: 100, mcq: '-', practical: '-', ca: 0, fullMarks: 100, passMarks: 33, passRules: 'বাংলা ২য় পত্রের সাথে যৌথ পাস (মোট ৫০/১৫০)', isJointPass: true, jointPassInfo: 'বাংলা ১ম + ২য় যৌথ মোট ৫০ মার্কস', category: 'আবশ্যিক' },
  { code: 'BAN-602', name: 'বাংলা ২য় পত্র', group: 'সাধারণ', cq: 50, mcq: '-', practical: '-', ca: 0, fullMarks: 50, passMarks: 17, passRules: 'বাংলা ১ম পত্রের সাথে যৌথ পাস (মোট ৫০/১৫০)', isJointPass: true, jointPassInfo: 'বাংলা ১ম + ২য় যৌথ মোট ৫০ মার্কস', category: 'আবশ্যিক' },
  { code: 'ENG-601', name: 'ইংরেজি ১ম পত্র', group: 'সাধারণ', cq: 100, mcq: '-', practical: '-', ca: 0, fullMarks: 100, passMarks: 33, passRules: 'ইংরেজি ২য় পত্রের সাথে যৌথ পাস (মোট ৬৬/২০০)', isJointPass: true, jointPassInfo: 'ইংরেজি ১ম + ২য় যৌথ মোট ৬৬ মার্কস', category: 'আবশ্যিক' },
  { code: 'ENG-602', name: 'ইংরেজি ২য় পত্র', group: 'সাধারণ', cq: 50, mcq: '-', practical: '-', ca: 0, fullMarks: 50, passMarks: 17, passRules: 'ইংরেজি ১ম পত্রের সাথে যৌথ পাস (মোট ৫০/১৫০)', isJointPass: true, jointPassInfo: 'ইংরেজি ১ম + ২য় যৌথ মোট ৫০ মার্কস', category: 'আবশ্যিক' },
  { code: 'MAT-603', name: 'গণিত (Mathematics)', group: 'সাধারণ', cq: 70, mcq: '-', practical: '-', ca: 30, fullMarks: 100, passMarks: 33, passRules: 'লিখিত ও সিএ-তে আলাদা পাস (৩৩% নম্বর)', isJointPass: false, category: 'আবশ্যিক' },
  { code: 'SCI-604', name: 'বিজ্ঞান (Science)', group: 'সাধারণ', cq: 100, mcq: '-', practical: 0, ca: 0, fullMarks: 100, passMarks: 33, passRules: 'লিখিত ৩৩% নম্বর (৩৩/১০০)', isJointPass: false, category: 'আবশ্যিক' },
  { code: 'ICT-605', name: 'ডিজিটাল প্রযুক্তি (Digital Tech)', group: 'সাধারণ', cq: 25, mcq: '-', practical: 25, ca: 0, fullMarks: 50, passMarks: 17, passRules: 'লিখিত ও ব্যবহারিকে পৃথকভাবে পাস', isJointPass: false, category: 'আবশ্যিক' },
  { code: 'HIS-606', name: 'ইতিহাস ও সামাজিক বিজ্ঞান', group: 'সাধারণ', cq: 100, mcq: '-', practical: '-', ca: 0, fullMarks: 100, passMarks: 33, passRules: 'লিখিত ৩৩% নম্বর (৩৩/১০০)', isJointPass: false, category: 'আবশ্যিক' },
  { code: 'REL-610', name: 'ধর্ম ও নৈতিক শিক্ষা', group: 'সাধারণ', cq: 100, mcq: '-', practical: '-', ca: 0, fullMarks: 100, passMarks: 33, passRules: 'লিখিত ৩৩% নম্বর (৩৩/১০০)', isJointPass: false, category: 'আবশ্যিক' },
  { code: 'AGR-607', name: 'কৃষি শিক্ষা (Agricultural Science)', group: 'সাধারণ', cq: 50, mcq: 25, practical: 25, ca: 0, fullMarks: 100, passMarks: 33, passRules: 'CQ+MCQ ২৫ + Practical ৮ (৪র্থ বিষয়)', isJointPass: false, category: '৪র্থ বিষয়' }
];

const base9to10Subjects: Omit<SubjectCurriculumItem, 'id' | 'grade'>[] = [
  // ── আবশ্যিক বিষয় (Compulsory Subjects) ──
  { code: 'BAN-101', name: 'বাংলা ১ম পত্র (সাহিত্য)', group: 'সাধারণ', cq: 70, mcq: 30, practical: '-', ca: 0, fullMarks: 100, passMarks: 33, passRules: 'বাংলা ২য় পত্রের সাথে যৌথ পাস (মোট ৬৬/২০০)', isJointPass: true, jointPassInfo: 'বাংলা ১ম + ২য় যৌথ মোট ৬৬ মার্কস', category: 'আবশ্যিক' },
  { code: 'BAN-102', name: 'বাংলা ২য় পত্র (ব্যাকরণ ও রচনা)', group: 'সাধারণ', cq: 70, mcq: 30, practical: '-', ca: 0, fullMarks: 100, passMarks: 33, passRules: 'বাংলা ১ম পত্রের সাথে যৌথ পাস (মোট ৬৬/২০০)', isJointPass: true, jointPassInfo: 'বাংলা ১ম + ২য় যৌথ মোট ৬৬ মার্কস', category: 'আবশ্যিক' },
  { code: 'ENG-107', name: 'English 1st Paper', group: 'সাধারণ', cq: 100, mcq: '-', practical: '-', ca: 0, fullMarks: 100, passMarks: 33, passRules: 'ইংরেজি ২য় পত্রের সাথে যৌথ পাস (মোট ৬৬/২০০)', isJointPass: true, jointPassInfo: 'ইংরেজি ১ম + ২য় যৌথ মোট ৬৬ মার্কস', category: 'আবশ্যিক' },
  { code: 'ENG-108', name: 'English 2nd Paper', group: 'সাধারণ', cq: 100, mcq: '-', practical: '-', ca: 0, fullMarks: 100, passMarks: 33, passRules: 'ইংরেজি ১ম পত্রের সাথে যৌথ পাস (মোট ৬৬/২০০)', isJointPass: true, jointPassInfo: 'ইংরেজি ১ম + ২য় যৌথ মোট ৬৬ মার্কস', category: 'আবশ্যিক' },
  { code: 'MAT-109', name: 'সাধারণ গণিত (General Math)', group: 'সাধারণ', cq: 70, mcq: 30, practical: '-', ca: 0, fullMarks: 100, passMarks: 33, passRules: 'CQ ২৩ + MCQ ১০ (পৃথক পাস আবশ্যক)', isJointPass: false, category: 'আবশ্যিক' },
  { code: 'ICT-154', name: 'তথ্য ও যোগাযোগ প্রযুক্তি (ICT)', group: 'সাধারণ', cq: '-', mcq: 25, practical: 25, ca: 0, fullMarks: 50, passMarks: 17, passRules: 'MCQ ৮ + Practical ৮ (পৃথক পাস)', isJointPass: false, category: 'আবশ্যিক' },
  { code: 'REL-111', name: 'ইসলাম ও নৈতিক শিক্ষা', group: 'সাধারণ', cq: 70, mcq: 30, practical: '-', ca: 0, fullMarks: 100, passMarks: 33, passRules: 'CQ ২৩ + MCQ ১০ (পৃথক পাস)', isJointPass: false, category: 'আবশ্যিক' },
  { code: 'BGS-150', name: 'বাংলাদেশ ও বিশ্বপরিচয় (BGS)', group: 'বিজ্ঞান', cq: 70, mcq: 30, practical: '-', ca: 0, fullMarks: 100, passMarks: 33, passRules: 'CQ ২৩ + MCQ ১০ (বিজ্ঞান বিভাগের আবশ্যিক)', isJointPass: false, category: 'আবশ্যিক' },
  { code: 'GSCI-127', name: 'সাধারণ বিজ্ঞান (General Science)', group: 'মানবিক ও ব্যবসায় শিক্ষা', cq: 70, mcq: 30, practical: '-', ca: 0, fullMarks: 100, passMarks: 33, passRules: 'CQ ২৩ + MCQ ১০ (মানবিক ও ব্যবসায় শিক্ষার আবশ্যিক)', isJointPass: false, category: 'আবশ্যিক' },

  // ── বিজ্ঞান বিভাগ (Science Group) ──
  { code: 'PHY-136', name: 'পদার্থবিজ্ঞান (Physics)', group: 'বিজ্ঞান', cq: 50, mcq: 25, practical: 25, ca: 0, fullMarks: 100, passMarks: 33, passRules: 'CQ+MCQ ২৫ (একত্রে) + Practical ৮ (পৃথক)', isJointPass: false, category: 'আবশ্যিক' },
  { code: 'CHE-137', name: 'রসায়ন (Chemistry)', group: 'বিজ্ঞান', cq: 50, mcq: 25, practical: 25, ca: 0, fullMarks: 100, passMarks: 33, passRules: 'CQ+MCQ ২৫ (একত্রে) + Practical ৮ (পৃথক)', isJointPass: false, category: 'আবশ্যিক' },
  { code: 'BIO-138', name: 'জীববিজ্ঞান (Biology)', group: 'বিজ্ঞান', cq: 50, mcq: 25, practical: 25, ca: 0, fullMarks: 100, passMarks: 33, passRules: 'CQ+MCQ ২৫ (একত্রে) + Practical ৮ (পৃথক)', isJointPass: false, category: 'আবশ্যিক' },
  { code: 'HMT-126', name: 'উচ্চতর গণিত (Higher Math)', group: 'বিজ্ঞান', cq: 50, mcq: 25, practical: 25, ca: 0, fullMarks: 100, passMarks: 33, passRules: 'CQ+MCQ ২৫ (একত্রে) + Practical ৮ (পৃথক)', isJointPass: false, category: '৪র্থ বিষয়' },
  { code: 'AGR-134-SCI', name: 'কৃষি শিক্ষা (Agricultural Science)', group: 'বিজ্ঞান', cq: 50, mcq: 25, practical: 25, ca: 0, fullMarks: 100, passMarks: 33, passRules: 'CQ+MCQ ২৫ + Practical ৮ (৪র্থ বিষয়)', isJointPass: false, category: '৪র্থ বিষয়' },

  // ── মানবিক বিভাগ (Humanities Group) ──
  { code: 'HIS-153', name: 'বাংলাদেশের ইতিহাস ও বিশ্বসভ্যতা', group: 'মানবিক', cq: 70, mcq: 30, practical: '-', ca: 0, fullMarks: 100, passMarks: 33, passRules: 'CQ ২৩ + MCQ ১০ ( পৃথক পাস)', isJointPass: false, category: 'আবশ্যিক' },
  { code: 'GEO-110', name: 'ভূগোল ও পরিবেশ', group: 'মানবিক', cq: 70, mcq: 30, practical: '-', ca: 0, fullMarks: 100, passMarks: 33, passRules: 'CQ ২৩ + MCQ ১০ ( পৃথক পাস)', isJointPass: false, category: 'আবশ্যিক' },
  { code: 'CIV-112', name: 'পৌরনীতি ও নাগরিকতা', group: 'মানবিক', cq: 70, mcq: 30, practical: '-', ca: 0, fullMarks: 100, passMarks: 33, passRules: 'CQ ২৩ + MCQ ১০ ( পৃথক পাস)', isJointPass: false, category: 'আবশ্যিক' },
  { code: 'ECO-141', name: 'অর্থনীতি (Economics)', group: 'মানবিক', cq: 70, mcq: 30, practical: '-', ca: 0, fullMarks: 100, passMarks: 33, passRules: 'CQ ২৩ + MCQ ১০ ( পৃথক পাস)', isJointPass: false, category: 'ঐচ্ছিক' },
  { code: 'AGR-134-HUM', name: 'কৃষি শিক্ষা (Agricultural Science)', group: 'মানবিক', cq: 50, mcq: 25, practical: 25, ca: 0, fullMarks: 100, passMarks: 33, passRules: 'CQ+MCQ ২৫ + Practical ৮ (৪র্থ বিষয়)', isJointPass: false, category: '৪র্থ বিষয়' },

  // ── ব্যবসায় শিক্ষা বিভাগ (Commerce Group) ──
  { code: 'ACC-146', name: 'হিসাববিজ্ঞান (Accounting)', group: 'ব্যবসায় শিক্ষা', cq: 70, mcq: 30, practical: '-', ca: 0, fullMarks: 100, passMarks: 33, passRules: 'CQ ২৩ + MCQ ১০ ( পৃথক পাস)', isJointPass: false, category: 'আবশ্যিক' },
  { code: 'BUS-143', name: 'ব্যবসায় উদ্যোগ (Business Ent.)', group: 'ব্যবসায় শিক্ষা', cq: 70, mcq: 30, practical: '-', ca: 0, fullMarks: 100, passMarks: 33, passRules: 'CQ ২৩ + MCQ ১০ ( পৃথক পাস)', isJointPass: false, category: 'আবশ্যিক' },
  { code: 'FIN-152', name: 'ফিন্যান্স ও ব্যাংকিং (Finance)', group: 'ব্যবসায় শিক্ষা', cq: 70, mcq: 30, practical: '-', ca: 0, fullMarks: 100, passMarks: 33, passRules: 'CQ ২৩ + MCQ ১০ ( পৃথক পাস)', isJointPass: false, category: 'আবশ্যিক' },
  { code: 'AGR-134-COM', name: 'কৃষি শিক্ষা (Agricultural Science)', group: 'ব্যবসায় শিক্ষা', cq: 50, mcq: 25, practical: 25, ca: 0, fullMarks: 100, passMarks: 33, passRules: 'CQ+MCQ ২৫ + Practical ৮ (৪র্থ বিষয়)', isJointPass: false, category: '৪র্থ বিষয়' },
  { code: 'ECO-141-COM', name: 'অর্থনীতি (Economics)', group: 'ব্যবসায় শিক্ষা', cq: 70, mcq: 30, practical: '-', ca: 0, fullMarks: 100, passMarks: 33, passRules: 'CQ ২৩ + MCQ ১০ ( পৃথক পাস)', isJointPass: false, category: 'ঐচ্ছিক' }
];

export const DEFAULT_CURRICULUM_DATA: SubjectCurriculumItem[] = [
  ...(['6th', '7th', '8th'] as const).flatMap(g => 
    base6to8Subjects.map(s => ({
      ...s,
      id: `curr-${g}-${s.code}`,
      grade: g,
      code: s.code.replace('-6', `-${g === '6th' ? '6' : g === '7th' ? '7' : '8'}`)
    }))
  ),
  ...(['9th', '10th'] as const).flatMap(g => 
    base9to10Subjects.map(s => ({
      ...s,
      id: `curr-${g}-${s.code}`,
      grade: g
    }))
  )
];

const STORAGE_KEY = 'sms_curriculum_subjects';

class CurriculumService {
  private listeners: Array<() => void> = [];

  public getCurriculumList(): SubjectCurriculumItem[] {
    if (typeof window === 'undefined') return DEFAULT_CURRICULUM_DATA;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
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
            { code: 'HMT-126', name: 'উচ্চতর গণিত (Higher Math)', category: '৪র্থ বিষয়' },
            { code: 'AGR-134', name: 'কৃষি শিক্ষা (Agricultural Science)', category: '৪র্থ বিষয়' },
            { code: 'NONE', name: 'কোনটিই নয়', category: 'ঐচ্ছিক' }
          ];
        } else if (normalizedGroup.includes('মানবিক')) {
          return [
            { code: 'AGR-134', name: 'কৃষি শিক্ষা (Agricultural Science)', category: '৪র্থ বিষয়' },
            { code: 'ECO-141', name: 'অর্থনীতি (Economics)', category: 'ঐচ্ছিক' },
            { code: 'NONE', name: 'কোনটিই নয়', category: 'ঐচ্ছিক' }
          ];
        } else if (normalizedGroup.includes('ব্যবসায়') || normalizedGroup.includes('ব্যবসায়')) {
          return [
            { code: 'AGR-134', name: 'কৃষি শিক্ষা (Agricultural Science)', category: '৪র্থ বিষয়' },
            { code: 'ECO-141', name: 'অর্থনীতি (Economics)', category: 'ঐচ্ছিক' },
            { code: 'NONE', name: 'কোনটিই নয়', category: 'ঐচ্ছিক' }
          ];
        }
      }
      return [
        { code: 'AGR-607', name: 'কৃষি শিক্ষা (Agricultural Science)', category: '৪র্থ বিষয়' },
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
