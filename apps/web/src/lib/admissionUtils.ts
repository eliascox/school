import { normalizeRollDigits } from '@/lib/resultPortalUtils';

export interface OnlineApplicationRecord {
  id?: string;
  appId?: string;
  name: string;
  nameEn?: string;
  grade: string;
  section?: string;
  branch?: string;
  roll?: string;
  group?: string;
  optionalSubject?: string;
  dob?: string;
  gender?: string;
  religion?: string;
  bloodGroup?: string;
  fatherName?: string;
  fatherNid?: string;
  fatherOcc?: string;
  fatherOccupation?: string;
  motherName?: string;
  motherNid?: string;
  motherOcc?: string;
  motherOccupation?: string;
  guardian?: string;
  mobile?: string;
  birthRegNo?: string;
  prevSchoolName?: string;
  prevGpa?: string;
  currentAddress?: string;
  permanentAddress?: string;
  photo?: string;
  appliedAt?: string;
  status?: string;
  isStipend?: boolean;
  stipendCategory?: string;
}

/**
 * Normalizes Bangla (০-৯) and English digits and strips non-digits.
 */
export function normalizeNumericField(input: string | number | null | undefined): string {
  return normalizeRollDigits(String(input ?? '')).replace(/\D/g, '');
}

export interface PublicAdmissionValidationInput {
  selectedClass: string;
  fullName: string;
  mobile: string;
  birthRegNo: string;
  dob: string;
  fatherName: string;
  motherName: string;
  currentAddress: string;
  declaredCorrect: boolean;
}

export interface AdmissionValidationResult {
  valid: boolean;
  errorMessage?: string;
  scrollSectionId?: string;
}

export function validatePublicAdmissionFields(
  input: PublicAdmissionValidationInput
): AdmissionValidationResult {
  if (!input.selectedClass) {
    return {
      valid: false,
      errorMessage: 'অনুগ্রহ করে ভর্তির শ্রেণি নির্বাচন করুন।',
      scrollSectionId: 'admission-step-1',
    };
  }
  if (!input.fullName.trim()) {
    return {
      valid: false,
      errorMessage: 'শিক্ষার্থীর পূর্ণ নাম (বাংলায়) লিখুন।',
      scrollSectionId: 'admission-step-2',
    };
  }
  const cleanPhone = normalizeNumericField(input.mobile);
  if (!cleanPhone || cleanPhone.length < 11) {
    return {
      valid: false,
      errorMessage:
        'অভিভাবকের সঠিক ১১ ডিজিটের সচল মোবাইল নম্বর লিখুন (যেমন: 018XXXXXXXX)। এই নম্বরে নিশ্চিতকরণ SMS যাবে।',
      scrollSectionId: 'admission-step-2',
    };
  }
  const cleanBreg = normalizeNumericField(input.birthRegNo);
  if (!cleanBreg || cleanBreg.length < 17) {
    return {
      valid: false,
      errorMessage: '১৭ ডিজিটের ডিজিটাল জন্ম নিবন্ধন নম্বর সঠিকভাবে প্রদান করুন।',
      scrollSectionId: 'admission-step-2',
    };
  }
  if (!input.dob) {
    return {
      valid: false,
      errorMessage: 'শিক্ষার্থীর জন্ম তারিখ নির্বাচন করুন।',
      scrollSectionId: 'admission-step-2',
    };
  }
  if (!input.fatherName.trim() && !input.motherName.trim()) {
    return {
      valid: false,
      errorMessage: 'পিতা অথবা মাতার নাম অবশ্যই পূরণ করুন।',
      scrollSectionId: 'admission-step-3',
    };
  }
  if (!input.currentAddress.trim()) {
    return {
      valid: false,
      errorMessage: 'বর্তমান ঠিকানা প্রদান করুন।',
      scrollSectionId: 'admission-step-4',
    };
  }
  if (!input.declaredCorrect) {
    return {
      valid: false,
      errorMessage: 'তথ্য সঠিক হওয়ার ঘোষণা বক্সে টিক চিহ্ন দিন।',
      scrollSectionId: 'admission-step-4',
    };
  }
  return { valid: true };
}

export interface AdmissionStepCompletion {
  step1Academic: boolean;
  step2Personal: boolean;
  step3Parents: boolean;
  step4Address: boolean;
  completedCount: number;
}

export function computeAdmissionStepCompletion(fields: {
  selectedClass: string;
  section: string;
  fullName: string;
  mobile: string;
  dob: string;
  birthRegNo: string;
  fatherName: string;
  motherName: string;
  currentAddress: string;
}): AdmissionStepCompletion {
  const step1Academic = Boolean(fields.selectedClass && fields.section);
  const step2Personal = Boolean(
    fields.fullName.trim() &&
      normalizeNumericField(fields.mobile).length >= 11 &&
      fields.dob &&
      normalizeNumericField(fields.birthRegNo).length >= 10
  );
  const step3Parents = Boolean(fields.fatherName.trim() || fields.motherName.trim());
  const step4Address = Boolean(fields.currentAddress.trim());

  const completedCount = [step1Academic, step2Personal, step3Parents, step4Address].filter(
    Boolean
  ).length;

  return {
    step1Academic,
    step2Personal,
    step3Parents,
    step4Address,
    completedCount,
  };
}

export function filterOnlineApplications(
  apps: OnlineApplicationRecord[],
  filters: { grade?: string; group?: string; query?: string }
): OnlineApplicationRecord[] {
  const targetGrade = (filters.grade || 'all').trim();
  const targetGroup = (filters.group || 'all').trim();
  const q = normalizeRollDigits(filters.query || '').toLowerCase();

  return apps.filter((app) => {
    if (targetGrade && targetGrade !== 'all') {
      const appGrade = (app.grade || '').trim();
      if (appGrade !== targetGrade) return false;
    }

    if (targetGroup && targetGroup !== 'all') {
      const appGroup = (app.group || 'সাধারণ').trim();
      if (appGroup !== targetGroup) return false;
    }

    if (q) {
      const haystack = [
        app.name,
        app.nameEn,
        app.appId,
        app.id,
        normalizeRollDigits(app.mobile || ''),
        normalizeRollDigits(app.birthRegNo || ''),
        app.fatherName,
        app.motherName,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    return true;
  });
}
