/**
 * Universal Centralized Curriculum & Class Subject Configuration Engine
 * Seamlessly connects /dashboard/academic/curriculum with:
 * - Marksheet (/dashboard/academic/marksheet)
 * - Mark Entry (/dashboard/exam/mark-entry)
 * - Bulk Spreadsheet Entry (/dashboard/exam/bulk-entry)
 * - Tabulation Sheet (/dashboard/exam/tabulation)
 * - Rank Result / Merit List (/dashboard/exam/rank-result)
 */

export interface DynamicClassSubject {
  code: string;
  name: string;
  fullMarks: number;
  cq: number;
  mcq: number;
  practical: number;
  ca: number;
  passMarks?: number;
  passRules?: string;
  isJointPass?: boolean;
  jointPairCode?: string;
  category?: string;
  group?: string;
}

// ══════════════════════════════════════════════════════════════════════════════
// 📚 DEFAULT NCTB BASE SUBJECT TEMPLATES
// Class 8 English 2nd Paper is officially 50 Marks (CQ: 50, FullMarks: 50)
// Class 6-8 Bangla 1st (100) + Bangla 2nd (50) = 150 joint pass
// Class 6-8 English 1st (100) + English 2nd (50) = 150 joint pass
// ══════════════════════════════════════════════════════════════════════════════

export const DEFAULT_6_TO_8_SUBJECTS = (gradeNum: number): DynamicClassSubject[] => {
  const p = gradeNum;
  return [
    { code: `BAN-${p}01`, name: 'বাংলা ১ম পত্র',             fullMarks: 100, cq: 100, mcq: 0,  practical: 0,  ca: 0,  passMarks: 33, isJointPass: true, jointPairCode: `BAN-${p}02`, category: 'আবশ্যিক', group: 'সাধারণ' },
    { code: `BAN-${p}02`, name: 'বাংলা ২য় পত্র',             fullMarks: 50,  cq: 50,  mcq: 0,  practical: 0,  ca: 0,  passMarks: 17, isJointPass: true, jointPairCode: `BAN-${p}01`, category: 'আবশ্যিক', group: 'সাধারণ' },
    { code: `ENG-${p}01`, name: 'ইংরেজি ১ম পত্র',            fullMarks: 100, cq: 100, mcq: 0,  practical: 0,  ca: 0,  passMarks: 33, isJointPass: true, jointPairCode: `ENG-${p}02`, category: 'আবশ্যিক', group: 'সাধারণ' },
    { code: `ENG-${p}02`, name: 'ইংরেজি ২য় পত্র',           fullMarks: 50,  cq: 50,  mcq: 0,  practical: 0,  ca: 0,  passMarks: 17, isJointPass: true, jointPairCode: `ENG-${p}01`, category: 'আবশ্যিক', group: 'সাধারণ' },
    { code: `MAT-${p}03`, name: 'গণিত',                       fullMarks: 100, cq: 70,  mcq: 0,  practical: 0,  ca: 30, passMarks: 33, isJointPass: false, category: 'আবশ্যিক', group: 'সাধারণ' },
    { code: `SCI-${p}04`, name: 'বিজ্ঞান',                    fullMarks: 100, cq: 100, mcq: 0,  practical: 0,  ca: 0,  passMarks: 33, isJointPass: false, category: 'আবশ্যিক', group: 'সাধারণ' },
    { code: `ICT-${p}05`, name: 'ডিজিটাল প্রযুক্তি',          fullMarks: 50,  cq: 25,  mcq: 0,  practical: 25, ca: 0,  passMarks: 17, isJointPass: false, category: 'আবশ্যিক', group: 'সাধারণ' },
    { code: `BGS-${p}06`, name: 'ইতিহাস ও সামাজিক বিজ্ঞান', fullMarks: 100, cq: 100, mcq: 0,  practical: 0,  ca: 0,  passMarks: 33, isJointPass: false, category: 'আবশ্যিক', group: 'সাধারণ' },
    { code: `REL-${p}10`, name: 'ধর্ম ও নৈতিক শিক্ষা',       fullMarks: 100, cq: 100, mcq: 0,  practical: 0,  ca: 0,  passMarks: 33, isJointPass: false, category: 'আবশ্যিক', group: 'সাধারণ' },
    { code: `AGR-${p}07`, name: 'কৃষি শিক্ষা',               fullMarks: 100, cq: 50,  mcq: 25, practical: 25, ca: 0,  passMarks: 33, isJointPass: false, category: '৪র্থ বিষয়', group: 'সাধারণ' }
  ];
};

export const DEFAULT_9_TO_10_SUBJECTS = (group: string = 'সাধারণ'): DynamicClassSubject[] => {
  const isScience = group.includes('বিজ্ঞান') || group === 'science';
  const isComm = group.includes('ব্যবসায়') || group === 'commerce';

  const compulsory: DynamicClassSubject[] = [
    { code: 'BAN-101', name: 'বাংলা ১ম পত্র',             fullMarks: 100, cq: 70,  mcq: 30, practical: 0,  ca: 0, passMarks: 33, isJointPass: true, jointPairCode: 'BAN-102', category: 'আবশ্যিক', group: 'সাধারণ' },
    { code: 'BAN-102', name: 'বাংলা ২য় পত্র',             fullMarks: 100, cq: 70,  mcq: 30, practical: 0,  ca: 0, passMarks: 33, isJointPass: true, jointPairCode: 'BAN-101', category: 'আবশ্যিক', group: 'সাধারণ' },
    { code: 'ENG-107', name: 'ইংরেজি ১ম পত্র',            fullMarks: 100, cq: 100, mcq: 0,  practical: 0,  ca: 0, passMarks: 33, isJointPass: true, jointPairCode: 'ENG-108', category: 'আবশ্যিক', group: 'সাধারণ' },
    { code: 'ENG-108', name: 'ইংরেজি ২য় পত্র',           fullMarks: 100, cq: 100, mcq: 0,  practical: 0,  ca: 0, passMarks: 33, isJointPass: true, jointPairCode: 'ENG-107', category: 'আবশ্যিক', group: 'সাধারণ' },
    { code: 'MAT-109', name: 'সাধারণ গণিত',                fullMarks: 100, cq: 70,  mcq: 30, practical: 0,  ca: 0, passMarks: 33, isJointPass: false, category: 'আবশ্যিক', group: 'সাধারণ' },
    { code: 'ICT-154', name: 'তথ্য ও যোগাযোগ প্রযুক্তি', fullMarks: 50,  cq: 0,   mcq: 25, practical: 25, ca: 0, passMarks: 17, isJointPass: false, category: 'আবশ্যিক', group: 'সাধারণ' },
    { code: 'REL-111', name: 'ধর্ম ও নৈতিক শিক্ষা',       fullMarks: 100, cq: 70,  mcq: 30, practical: 0,  ca: 0, passMarks: 33, isJointPass: false, category: 'আবশ্যিক', group: 'সাধারণ' },
  ];

  let groupSubjects: DynamicClassSubject[] = [];

  if (isScience) {
    groupSubjects = [
      { code: 'BGS-150', name: 'বাংলাদেশ ও বিশ্বপরিচয়', fullMarks: 100, cq: 70, mcq: 30, practical: 0,  ca: 0, passMarks: 33, category: 'আবশ্যিক', group: 'বিজ্ঞান' },
      { code: 'PHY-136', name: 'পদার্থবিজ্ঞান',            fullMarks: 100, cq: 50, mcq: 25, practical: 25, ca: 0, passMarks: 33, category: 'আবশ্যিক', group: 'বিজ্ঞান' },
      { code: 'CHE-137', name: 'রসায়ন',                   fullMarks: 100, cq: 50, mcq: 25, practical: 25, ca: 0, passMarks: 33, category: 'আবশ্যিক', group: 'বিজ্ঞান' },
      { code: 'BIO-138', name: 'জীববিজ্ঞান',              fullMarks: 100, cq: 50, mcq: 25, practical: 25, ca: 0, passMarks: 33, category: 'আবশ্যিক', group: 'বিজ্ঞান' },
      { code: 'HMT-126', name: 'উচ্চতর গণিত',             fullMarks: 100, cq: 50, mcq: 25, practical: 25, ca: 0, passMarks: 33, category: '৪র্থ বিষয়', group: 'বিজ্ঞান' }
    ];
  } else if (isComm) {
    groupSubjects = [
      { code: 'GSCI-127', name: 'সাধারণ বিজ্ঞান',       fullMarks: 100, cq: 70, mcq: 30, practical: 0, ca: 0, passMarks: 33, category: 'আবশ্যিক', group: 'ব্যবসায় শিক্ষা' },
      { code: 'ACC-146', name: 'হিসাববিজ্ঞান',        fullMarks: 100, cq: 70, mcq: 30, practical: 0, ca: 0, passMarks: 33, category: 'আবশ্যিক', group: 'ব্যবসায় শিক্ষা' },
      { code: 'BUS-147', name: 'ব্যবসায় উদ্যোগ',      fullMarks: 100, cq: 70, mcq: 30, practical: 0, ca: 0, passMarks: 33, category: 'আবশ্যিক', group: 'ব্যবসায় শিক্ষা' },
      { code: 'FIN-152', name: 'ফিন্যান্স ও ব্যাংকিং', fullMarks: 100, cq: 70, mcq: 30, practical: 0, ca: 0, passMarks: 33, category: 'আবশ্যিক', group: 'ব্যবসায় শিক্ষা' },
      { code: 'AGR-139', name: 'কৃষি শিক্ষা',          fullMarks: 100, cq: 50, mcq: 25, practical: 25, ca: 0, passMarks: 33, category: '৪র্থ বিষয়', group: 'ব্যবসায় শিক্ষা' }
    ];
  } else {
    // Humanities (মানবিক)
    groupSubjects = [
      { code: 'GSCI-127', name: 'সাধারণ বিজ্ঞান',                  fullMarks: 100, cq: 70, mcq: 30, practical: 0, ca: 0, passMarks: 33, category: 'আবশ্যিক', group: 'মানবিক' },
      { code: 'HIS-153', name: 'বাংলাদেশের ইতিহাস ও বিশ্বসভ্যতা', fullMarks: 100, cq: 70, mcq: 30, practical: 0, ca: 0, passMarks: 33, category: 'আবশ্যিক', group: 'মানবিক' },
      { code: 'GEO-110', name: 'ভূগোল ও পরিবেশ',                   fullMarks: 100, cq: 70, mcq: 30, practical: 0, ca: 0, passMarks: 33, category: 'আবশ্যিক', group: 'মানবিক' },
      { code: 'CIV-140', name: 'পৌরনীতি ও নাগরিকতা',              fullMarks: 100, cq: 70, mcq: 30, practical: 0, ca: 0, passMarks: 33, category: 'আবশ্যিক', group: 'মানবিক' },
      { code: 'AGR-139', name: 'কৃষি শিক্ষা',                      fullMarks: 100, cq: 50, mcq: 25, practical: 25, ca: 0, passMarks: 33, category: '৪র্থ বিষয়', group: 'মানবিক' }
    ];
  }

  return [...compulsory, ...groupSubjects];
};

/**
 * Loads dynamic subjects configured in Curriculum (/dashboard/academic/curriculum)
 * or falls back to standardized NCTB syllabus.
 * Strictly guarantees that each subject appears EXACTLY ONCE for any student,
 * filtered by Grade and Group (Science, Humanities, Commerce).
 */
export function getActiveCurriculumSubjects(
  gradeKey: string,
  group: string = 'সাধারণ',
  targetOptionalSubject?: string
): DynamicClassSubject[] {
  const gradeNumMap: Record<string, number> = { '6th': 6, '7th': 7, '8th': 8, '9th': 9, '10th': 10 };
  const targetGradeNum = gradeNumMap[gradeKey] || 8;

  // 1. Try reading customized curriculum from localStorage (sms_curriculum_subjects)
  if (typeof window !== 'undefined') {
    try {
      const storedCurriculum = localStorage.getItem('sms_curriculum_subjects');
      if (storedCurriculum) {
        const parsed = JSON.parse(storedCurriculum);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const matchingForGrade = parsed.filter((c: any) => c.grade === gradeKey);
          if (matchingForGrade.length > 0) {
            const mapped: DynamicClassSubject[] = matchingForGrade.map((c: any) => {
              const cq = typeof c.cq === 'number' ? c.cq : Number(c.cq) || 0;
              const mcq = typeof c.mcq === 'number' ? c.mcq : Number(c.mcq) || 0;
              const practical = typeof c.practical === 'number' ? c.practical : Number(c.practical) || 0;
              const ca = typeof c.ca === 'number' ? c.ca : Number(c.ca) || 0;
              const fullMarks = Number(c.fullMarks) || (cq + mcq + practical + ca) || 100;

              return {
                code: c.code,
                name: c.name,
                fullMarks,
                cq,
                mcq,
                practical,
                ca,
                passMarks: c.passMarks,
                passRules: c.passRules,
                isJointPass: Boolean(c.isJointPass),
                jointPairCode: c.jointPassInfo || c.jointWith,
                category: c.category || 'আবশ্যিক',
                group: c.group || 'সাধারণ'
              };
            });

            // Filtering for Class 9-10 by Group
            let resultSubjects: DynamicClassSubject[] = [];

            if (targetGradeNum >= 9) {
              const groupNameBn = group.includes('বিজ্ঞান') || group === 'science' ? 'বিজ্ঞান' :
                                  group.includes('ব্যবসায়') || group === 'commerce' ? 'ব্যবসায় শিক্ষা' : 'মানবিক';

              resultSubjects = mapped.filter(s => {
                const itemGroup = (s.group || '').trim();

                // Compulsory across all groups
                if (itemGroup === 'সাধারণ' || itemGroup === 'সকল' || !itemGroup) return true;

                // Shared non-science subjects
                if (itemGroup === 'মানবিক ও ব্যবসায় শিক্ষা' && (groupNameBn === 'মানবিক' || groupNameBn === 'ব্যবসায় শিক্ষা')) return true;

                // Direct group match
                if (itemGroup === groupNameBn || itemGroup.includes(groupNameBn)) return true;

                return false;
              });
            } else {
              resultSubjects = mapped;
            }

            // Deduplicate by subject code and religion so NO subject appears twice for a student
            const seenCodes = new Set<string>();
            const seenNames = new Set<string>();
            let hasReligionIncluded = false;
            const deduplicated: DynamicClassSubject[] = [];

            for (const sub of resultSubjects) {
              const subName = (sub.name || '').trim();
              const isRel = (sub.code || '').includes('REL') || subName.includes('ধর্ম') || subName.includes('ইসলাম') || subName.includes('হিন্দু') || subName.includes('খ্রিস্টান') || subName.includes('বৌদ্ধ');
              
              if (isRel) {
                if (hasReligionIncluded) continue; // Only 1 religion subject slot per class
                hasReligionIncluded = true;
              }

              if (!seenCodes.has(sub.code) && !seenNames.has(subName)) {
                seenCodes.add(sub.code);
                seenNames.add(subName);
                deduplicated.push(sub);
              }
            }

            if (deduplicated.length > 0) {
              return deduplicated;
            }
          }
        }
      }
    } catch (e) {
      console.error('Error loading sms_curriculum_subjects in getActiveCurriculumSubjects', e);
    }
  }

  // 2. Default NCTB templates
  if (targetGradeNum <= 8) {
    return DEFAULT_6_TO_8_SUBJECTS(targetGradeNum);
  } else {
    return DEFAULT_9_TO_10_SUBJECTS(group);
  }
}
