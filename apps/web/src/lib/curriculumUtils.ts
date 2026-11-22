/**
 * Universal Centralized Curriculum & Class Subject Configuration Engine
 * Seamlessly connects /dashboard/academic/curriculum with:
 * - Marksheet (/dashboard/academic/marksheet)
 * - Mark Entry (/dashboard/exam/mark-entry)
 * - Bulk Spreadsheet Entry (/dashboard/exam/bulk-entry)
 * - Tabulation Sheet (/dashboard/exam/tabulation)
 * - Rank Result / Merit List (/dashboard/exam/rank-result)
 */

import { getSubjectReligion, isReligionSubject } from '@/lib/religionUtils';
import {
  ensureHinduReligionSubjects,
  normalizeLegacyNctbSubjectCodes,
} from '@/services/curriculumService';

function resolveFaithMeta(studentReligion?: string): { code: string; name: string } {
  const rel = (studentReligion || '').toLowerCase();
  if (rel.includes('hindu') || rel.includes('হিন্দু') || rel.includes('সনাতন')) {
    return { code: '112', name: 'হিন্দুধর্ম ও নৈতিক শিক্ষা' };
  }
  if (rel.includes('buddhist') || rel.includes('বৌদ্ধ')) {
    return { code: '113', name: 'বৌদ্ধধর্ম ও নৈতিক শিক্ষা' };
  }
  if (rel.includes('christian') || rel.includes('খ্রিস্ট') || rel.includes('খ্রিষ্ট')) {
    return { code: '114', name: 'খ্রিষ্টধর্ম ও নৈতিক শিক্ষা' };
  }
  if (rel.includes('muslim') || rel.includes('islam') || rel.includes('ইসলাম') || rel.includes('মুসলিম')) {
    return { code: '111', name: 'ইসলাম ও নৈতিক শিক্ষা' };
  }
  return { code: '111', name: 'ধর্ম ও নৈতিক শিক্ষা' };
}

export interface DynamicClassSubject {
  code: string;
  name: string;
  nameBn?: string;
  nameEn?: string;
  fullMarks: number;
  cq: number;
  mcq: number;
  practical: number;
  ca: number;
  passMarks?: number;
  passRules?: string;
  passRuleMode?: 'part' | 'total';
  isJointPass?: boolean;
  jointPairCode?: string;
  isUncountableCA?: boolean;
  category?: string;
  group?: string;
}

// ══════════════════════════════════════════════════════════════════════════════
// 📚 DEFAULT NCTB BASE SUBJECT TEMPLATES
// Class 8 English 2nd Paper is officially 50 Marks (CQ: 50, FullMarks: 50)
// Class 6-8 Bangla 1st (100) + Bangla 2nd (50) = 150 joint pass
// Class 6-8 English 1st (100) + English 2nd (50) = 150 joint pass
// ══════════════════════════════════════════════════════════════════════════════

export const DEFAULT_6_TO_8_SUBJECTS = (
  gradeNum: number,
  studentReligion?: string,
): DynamicClassSubject[] => {
  void gradeNum;
  const faith = resolveFaithMeta(studentReligion);
  return [
    { code: '101', name: 'বাংলা ১ম পত্র',             fullMarks: 100, cq: 100, mcq: 0,  practical: 0,  ca: 0,  passMarks: 33, isJointPass: true, jointPairCode: '102', category: 'আবশ্যিক', group: 'সাধারণ' },
    { code: '102', name: 'বাংলা ২য় পত্র',             fullMarks: 50,  cq: 50,  mcq: 0,  practical: 0,  ca: 0,  passMarks: 17, isJointPass: true, jointPairCode: '101', category: 'আবশ্যিক', group: 'সাধারণ' },
    { code: '107', name: 'ইংরেজি ১ম পত্র',            fullMarks: 100, cq: 100, mcq: 0,  practical: 0,  ca: 0,  passMarks: 33, isJointPass: true, jointPairCode: '108', category: 'আবশ্যিক', group: 'সাধারণ' },
    { code: '108', name: 'ইংরেজি ২য় পত্র',           fullMarks: 50,  cq: 50,  mcq: 0,  practical: 0,  ca: 0,  passMarks: 17, isJointPass: true, jointPairCode: '107', category: 'আবশ্যিক', group: 'সাধারণ' },
    { code: '109', name: 'গণিত',                       fullMarks: 100, cq: 70,  mcq: 0,  practical: 0,  ca: 30, passMarks: 33, passRules: 'লিখিত ও সিএ-তে আলাদা পাস (৩৩%)', isJointPass: false, category: 'আবশ্যিক', group: 'সাধারণ' },
    { code: '127', name: 'বিজ্ঞান',                    fullMarks: 100, cq: 100, mcq: 0,  practical: 0,  ca: 0,  passMarks: 33, isJointPass: false, category: 'আবশ্যিক', group: 'সাধারণ' },
    { code: '154', name: 'তথ্য ও যোগাযোগ প্রযুক্তি', fullMarks: 50,  cq: 25,  mcq: 0,  practical: 25, ca: 0,  passMarks: 17, passRules: 'লিখিত ও ব্যবহারিকে পৃথক পাস (৩৩%)', isJointPass: false, category: 'আবশ্যিক', group: 'সাধারণ' },
    { code: '150', name: 'বাংলাদেশ ও বিশ্বপরিচয়',   fullMarks: 100, cq: 100, mcq: 0,  practical: 0,  ca: 0,  passMarks: 33, isJointPass: false, category: 'আবশ্যিক', group: 'সাধারণ' },
    { code: faith.code, name: faith.name,              fullMarks: 100, cq: 100, mcq: 0,  practical: 0,  ca: 0,  passMarks: 33, isJointPass: false, category: 'আবশ্যিক', group: 'সাধারণ' },
    { code: '134', name: 'কৃষি শিক্ষা',               fullMarks: 100, cq: 50,  mcq: 25, practical: 25, ca: 0,  passMarks: 33, passRules: 'CQ ১৭ + MCQ ৮ + Practical ৮ (পৃথক পাস)', isJointPass: false, category: '৪র্থ বিষয়', group: 'সাধারণ' }
  ];
};

export const DEFAULT_9_TO_10_SUBJECTS = (
  group: string = 'সাধারণ',
  studentReligion?: string,
): DynamicClassSubject[] => {
  const isScience = group.includes('বিজ্ঞান') || group === 'science';
  const isComm = group.includes('ব্যবসায়') || group === 'commerce';
  const faith = resolveFaithMeta(studentReligion);

  const compulsory: DynamicClassSubject[] = [
    { code: '101', name: 'বাংলা ১ম পত্র',             fullMarks: 100, cq: 70,  mcq: 30, practical: 0,  ca: 0, passMarks: 33, passRules: 'যৌথ পত্রের CQ ও MCQ-তে পৃথক পাস', isJointPass: true, jointPairCode: '102', category: 'আবশ্যিক', group: 'সাধারণ' },
    { code: '102', name: 'বাংলা ২য় পত্র',             fullMarks: 100, cq: 70,  mcq: 30, practical: 0,  ca: 0, passMarks: 33, passRules: 'যৌথ পত্রের CQ ও MCQ-তে পৃথক পাস', isJointPass: true, jointPairCode: '101', category: 'আবশ্যিক', group: 'সাধারণ' },
    { code: '107', name: 'ইংরেজি ১ম পত্র',            fullMarks: 100, cq: 100, mcq: 0,  practical: 0,  ca: 0, passMarks: 33, isJointPass: true, jointPairCode: '108', category: 'আবশ্যিক', group: 'সাধারণ' },
    { code: '108', name: 'ইংরেজি ২য় পত্র',           fullMarks: 100, cq: 100, mcq: 0,  practical: 0,  ca: 0, passMarks: 33, isJointPass: true, jointPairCode: '107', category: 'আবশ্যিক', group: 'সাধারণ' },
    { code: '109', name: 'সাধারণ গণিত',                fullMarks: 100, cq: 70,  mcq: 30, practical: 0,  ca: 0, passMarks: 33, passRules: 'CQ ২৩ + MCQ ১০ (পৃথক পাস আবশ্যক)', isJointPass: false, category: 'আবশ্যিক', group: 'সাধারণ' },
    { code: '154', name: 'তথ্য ও যোগাযোগ প্রযুক্তি', fullMarks: 50,  cq: 0,   mcq: 25, practical: 25, ca: 0, passMarks: 17, passRules: 'MCQ ৮ + Practical ৮ (পৃথক পাস)', isJointPass: false, category: 'আবশ্যিক', group: 'সাধারণ' },
    { code: faith.code, name: faith.name,              fullMarks: 100, cq: 70,  mcq: 30, practical: 0,  ca: 0, passMarks: 33, passRules: 'CQ ২৩ + MCQ ১০ (পৃথক পাস)', isJointPass: false, category: 'আবশ্যিক', group: 'সাধারণ' },
  ];

  let groupSubjects: DynamicClassSubject[] = [];

  if (isScience) {
    groupSubjects = [
      { code: '150', name: 'বাংলাদেশ ও বিশ্বপরিচয়', fullMarks: 100, cq: 70, mcq: 30, practical: 0,  ca: 0, passMarks: 33, passRules: 'CQ ২৩ + MCQ ১০ (পৃথক পাস)', category: 'আবশ্যিক', group: 'বিজ্ঞান' },
      { code: '136', name: 'পদার্থবিজ্ঞান',            fullMarks: 100, cq: 50, mcq: 25, practical: 25, ca: 0, passMarks: 33, passRules: 'CQ ১৭ + MCQ ৮ + Practical ৮ (পৃথক পাস)', category: 'আবশ্যিক', group: 'বিজ্ঞান' },
      { code: '137', name: 'রসায়ন',                   fullMarks: 100, cq: 50, mcq: 25, practical: 25, ca: 0, passMarks: 33, passRules: 'CQ ১৭ + MCQ ৮ + Practical ৮ (পৃথক পাস)', category: 'আবশ্যিক', group: 'বিজ্ঞান' },
      { code: '138', name: 'জীববিজ্ঞান',              fullMarks: 100, cq: 50, mcq: 25, practical: 25, ca: 0, passMarks: 33, passRules: 'CQ ১৭ + MCQ ৮ + Practical ৮ (পৃথক পাস)', category: 'আবশ্যিক', group: 'বিজ্ঞান' },
      { code: '126', name: 'উচ্চতর গণিত',             fullMarks: 100, cq: 50, mcq: 25, practical: 25, ca: 0, passMarks: 33, passRules: 'CQ ১৭ + MCQ ৮ + Practical ৮ (পৃথক পাস)', category: '৪র্থ বিষয়', group: 'বিজ্ঞান' }
    ];
  } else if (isComm) {
    groupSubjects = [
      { code: '127', name: 'সাধারণ বিজ্ঞান',       fullMarks: 100, cq: 70, mcq: 30, practical: 0, ca: 0, passMarks: 33, passRules: 'CQ ২৩ + MCQ ১০ (পৃথক পাস)', category: 'আবশ্যিক', group: 'ব্যবসায় শিক্ষা' },
      { code: '146', name: 'হিসাববিজ্ঞান',        fullMarks: 100, cq: 70, mcq: 30, practical: 0, ca: 0, passMarks: 33, passRules: 'CQ ২৩ + MCQ ১০ (পৃথক পাস)', category: 'আবশ্যিক', group: 'ব্যবসায় শিক্ষা' },
      { code: '143', name: 'ব্যবসায় উদ্যোগ',      fullMarks: 100, cq: 70, mcq: 30, practical: 0, ca: 0, passMarks: 33, passRules: 'CQ ২৩ + MCQ ১০ (পৃথক পাস)', category: 'আবশ্যিক', group: 'ব্যবসায় শিক্ষা' },
      { code: '152', name: 'ফিন্যান্স ও ব্যাংকিং', fullMarks: 100, cq: 70, mcq: 30, practical: 0, ca: 0, passMarks: 33, passRules: 'CQ ২৩ + MCQ ১০ (পৃথক পাস)', category: 'আবশ্যিক', group: 'ব্যবসায় শিক্ষা' },
      { code: '134', name: 'কৃষি শিক্ষা',          fullMarks: 100, cq: 50, mcq: 25, practical: 25, ca: 0, passMarks: 33, passRules: 'CQ ১৭ + MCQ ৮ + Practical ৮ (পৃথক পাস)', category: '৪র্থ বিষয়', group: 'ব্যবসায় শিক্ষা' }
    ];
  } else {
    // Humanities (মানবিক)
    groupSubjects = [
      { code: '127', name: 'সাধারণ বিজ্ঞান',                  fullMarks: 100, cq: 70, mcq: 30, practical: 0, ca: 0, passMarks: 33, passRules: 'CQ ২৩ + MCQ ১০ (পৃথক পাস)', category: 'আবশ্যিক', group: 'মানবিক' },
      { code: '153', name: 'বাংলাদেশের ইতিহাস ও বিশ্বসভ্যতা', fullMarks: 100, cq: 70, mcq: 30, practical: 0, ca: 0, passMarks: 33, passRules: 'CQ ২৩ + MCQ ১০ (পৃথক পাস)', category: 'আবশ্যিক', group: 'মানবিক' },
      { code: '110', name: 'ভূগোল ও পরিবেশ',                   fullMarks: 100, cq: 70, mcq: 30, practical: 0, ca: 0, passMarks: 33, passRules: 'CQ ২৩ + MCQ ১০ (পৃথক পাস)', category: 'আবশ্যিক', group: 'মানবিক' },
      { code: '140', name: 'পৌরনীতি ও নাগরিকতা',              fullMarks: 100, cq: 70, mcq: 30, practical: 0, ca: 0, passMarks: 33, passRules: 'CQ ২৩ + MCQ ১০ (পৃথক পাস)', category: 'আবশ্যিক', group: 'মানবিক' },
      { code: '134', name: 'কৃষি শিক্ষা',                      fullMarks: 100, cq: 50, mcq: 25, practical: 25, ca: 0, passMarks: 33, passRules: 'CQ ১৭ + MCQ ৮ + Practical ৮ (পৃথক পাস)', category: '৪র্থ বিষয়', group: 'মানবিক' }
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
  targetOptionalSubject?: string,
  studentReligion?: string,
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
          let normalized = normalizeLegacyNctbSubjectCodes(parsed);
          if (normalized.length >= 5 && localStorage.getItem('sms_curriculum_hindu_v1') !== '1') {
            normalized = ensureHinduReligionSubjects(normalized).updated;
          }
          const matchingForGrade = normalized.filter((c: any) => c.grade === gradeKey);
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
                nameBn: c.nameBn,
                nameEn: c.nameEn,
                fullMarks,
                cq,
                mcq,
                practical,
                ca,
                passMarks: c.passMarks,
                passRules: c.passRules,
                passRuleMode: c.passRuleMode,
                isJointPass: Boolean(c.isJointPass || c.combinedWithCode),
                jointPairCode: c.combinedWithCode || c.jointPassInfo || c.jointWith,
                isUncountableCA: Boolean(c.isUncountableCA),
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

            // Pick the best religion subject slot for the queried context
            const religionRows = resultSubjects.filter((s) =>
              isReligionSubject(`${s.code} ${s.name}`),
            );
            let selectedReligionSlot: DynamicClassSubject | null = null;
            if (religionRows.length > 0) {
              if (studentReligion) {
                const faith = resolveFaithMeta(studentReligion);
                const exactRel = religionRows.find((r) => {
                  const subRel = getSubjectReligion(`${r.name} ${r.nameEn || ''}`);
                  return (
                    r.code === faith.code ||
                    (subRel && subRel.toLowerCase() === studentReligion.toLowerCase()) ||
                    (studentReligion.toLowerCase().includes('hindu') && subRel === 'Hindu') ||
                    (studentReligion.toLowerCase().includes('muslim') && subRel === 'Muslim') ||
                    (studentReligion.toLowerCase().includes('christian') && subRel === 'Christian') ||
                    (studentReligion.toLowerCase().includes('buddhist') && subRel === 'Buddhist')
                  );
                });
                selectedReligionSlot = exactRel || {
                  ...religionRows[0],
                  code: faith.code,
                  name: faith.name,
                };
              } else {
                // Combined class-wide view (Bulk Entry, Tabulation, etc.): collapse multiple faiths into one slot
                selectedReligionSlot =
                  religionRows.length > 1
                    ? { ...religionRows[0], code: '111', name: 'ধর্ম ও নৈতিক শিক্ষা' }
                    : religionRows[0];
              }
            }

            // Deduplicate by subject code and religion so NO subject appears twice for a student
            const seenCodes = new Set<string>();
            const seenNames = new Set<string>();
            let hasReligionIncluded = false;
            const deduplicated: DynamicClassSubject[] = [];

            for (const sub of resultSubjects) {
              const subName = (sub.name || '').trim();
              const isRel = isReligionSubject(`${sub.code} ${subName}`);

              if (isRel) {
                if (hasReligionIncluded) continue; // Only 1 religion subject slot per student/sheet
                hasReligionIncluded = true;
                const chosenRel = selectedReligionSlot || sub;
                if (!seenCodes.has(chosenRel.code) && !seenNames.has(chosenRel.name)) {
                  seenCodes.add(chosenRel.code);
                  seenNames.add(chosenRel.name);
                  deduplicated.push(chosenRel);
                }
                continue;
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
    return DEFAULT_6_TO_8_SUBJECTS(targetGradeNum, studentReligion);
  } else {
    return DEFAULT_9_TO_10_SUBJECTS(group, studentReligion);
  }
}
