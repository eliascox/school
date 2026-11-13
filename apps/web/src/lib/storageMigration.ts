'use client';

const parseJsonArray = <T = unknown>(raw: string | null): T[] | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : null;
  } catch {
    return null;
  }
};

const parseJsonObject = (raw: string | null): Record<string, unknown> | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
};

const studentDedupeKey = (s: Record<string, unknown>, fallbackIdx: number): string => {
  if (s.id) return `id:${String(s.id)}`;
  const grade = String(s.grade || s.class || '').trim();
  const section = String(s.section || s.branch || '').trim();
  const roll = String(s.roll || '').trim();
  if (grade && roll) return `roll:${grade}_${section}_${roll}`;
  return `idx:${fallbackIdx}`;
};

const migrateArrayKeyIfEmpty = (
  legacyKey: string,
  canonicalKey: string,
  migratedKeys: string[],
  skipIfTrueKey?: string
): void => {
  const legacyRaw = localStorage.getItem(legacyKey);
  if (legacyRaw === null) return;

  if (skipIfTrueKey && localStorage.getItem(skipIfTrueKey) === 'true') {
    return;
  }

  const legacyArr = parseJsonArray(legacyRaw);
  const canonicalArr = parseJsonArray(localStorage.getItem(canonicalKey));

  if (legacyArr && legacyArr.length > 0 && (!canonicalArr || canonicalArr.length === 0)) {
    localStorage.setItem(canonicalKey, JSON.stringify(legacyArr));
    localStorage.removeItem(legacyKey);
    migratedKeys.push(`${legacyKey}->${canonicalKey}`);
  } else if (legacyArr && legacyArr.length === 0 && canonicalArr !== null) {
    localStorage.removeItem(legacyKey);
  }
};

/**
 * Idempotently migrates legacy localStorage keys into their canonical `sms_*`
 * keys without overwriting existing non-empty canonical data.
 */
export function canonicalizeLocalStorageKeys(): { migratedKeys: string[] } {
  const migratedKeys: string[] = [];
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return { migratedKeys };
  }

  try {
    // 1. Students: merge `students` and `sms_uploaded_students` -> `sms_students`
    const legacyStudents = parseJsonArray<Record<string, unknown>>(localStorage.getItem('students'));
    const uploadedStudents = parseJsonArray<Record<string, unknown>>(localStorage.getItem('sms_uploaded_students'));
    const canonicalRaw = localStorage.getItem('sms_students');
    const canonicalStudents = parseJsonArray<Record<string, unknown>>(canonicalRaw) || [];

    const hasLegacyStudents = Boolean(legacyStudents && legacyStudents.length > 0);
    const hasUploadedStudents = Boolean(uploadedStudents && uploadedStudents.length > 0);

    if (hasLegacyStudents || hasUploadedStudents) {
      const mergedMap = new Map<string, Record<string, unknown>>();
      canonicalStudents.forEach((st, idx) => {
        if (st && typeof st === 'object') {
          mergedMap.set(studentDedupeKey(st, idx), st);
        }
      });

      // Migrate `students` only if canonical was empty so intentional edits/resets are preserved
      if (hasLegacyStudents && canonicalStudents.length === 0) {
        legacyStudents!.forEach((st, idx) => {
          if (st && typeof st === 'object') {
            const k = studentDedupeKey(st, idx);
            if (!mergedMap.has(k)) mergedMap.set(k, st);
          }
        });
        migratedKeys.push('students->sms_students');
      }

      // Always fold unmerged CSV/bulk upload buffer records into `sms_students`
      if (hasUploadedStudents) {
        uploadedStudents!.forEach((st, idx) => {
          if (st && typeof st === 'object') {
            const k = studentDedupeKey(st, idx + 10000);
            if (!mergedMap.has(k)) mergedMap.set(k, st);
          }
        });
        migratedKeys.push('sms_uploaded_students->sms_students');
      }

      if (migratedKeys.length > 0) {
        localStorage.setItem('sms_students', JSON.stringify(Array.from(mergedMap.values())));
      }
    }

    if (localStorage.getItem('students') !== null && (canonicalStudents.length > 0 || hasLegacyStudents)) {
      localStorage.removeItem('students');
    }
    if (localStorage.getItem('sms_uploaded_students') !== null) {
      localStorage.removeItem('sms_uploaded_students');
    }

    // 2. Teachers, Notices, Expenses, Teacher Leaves
    migrateArrayKeyIfEmpty('teachers_v1', 'sms_rbac_teachers', migratedKeys);
    migrateArrayKeyIfEmpty('school_notices_v1', 'sms_notices', migratedKeys, 'sms_notices_cleared');
    migrateArrayKeyIfEmpty('sms_expense_records', 'sms_expenses', migratedKeys);
    migrateArrayKeyIfEmpty('sms_teacher_leaves', 'sms_teacher_leave_applications', migratedKeys);

    // 3. School Settings object
    const legacySettings = parseJsonObject(localStorage.getItem('school_settings_v1'));
    const canonicalSettings = parseJsonObject(localStorage.getItem('sms_school_settings'));
    if (legacySettings && Object.keys(legacySettings).length > 0 && !canonicalSettings) {
      localStorage.setItem('sms_school_settings', JSON.stringify(legacySettings));
      localStorage.removeItem('school_settings_v1');
      migratedKeys.push('school_settings_v1->sms_school_settings');
    }
  } catch (err) {
    console.warn('[StorageMigration] Canonicalization warning:', err);
  }

  return { migratedKeys };
}
