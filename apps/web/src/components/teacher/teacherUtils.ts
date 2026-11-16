import { getActiveCurriculumSubjects } from '@/lib/curriculumUtils';

export type TeacherTab =
  | 'teachers'
  | 'assignments'
  | 'class_teachers'
  | 'permission_test'
  | 'leave_applications'
  | 'audit_trail';

export interface DynamicConfiguredSubject {
  code: string;
  name: string;
  category: string;
}

/**
 * Loads deduplicated active NCTB curriculum subjects for a class/group,
 * splitting generic religion subjects into Islam & Hindu assignments.
 */
export function getDynamicConfiguredSubjects(
  gradeStr: string,
  group: string = 'all',
  isMounted: boolean = false
): DynamicConfiguredSubject[] {
  const toBnAscii = (s: string) => s.replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d)));
  const normalized = toBnAscii(gradeStr);
  const gradeNum = parseInt(normalized.replace(/\D/g, ''), 10) || 8;

  if (!isMounted && typeof window === 'undefined') return [];

  const groupsToLoad =
    gradeNum >= 9 && group === 'all'
      ? ['science', 'humanities', 'commerce']
      : [gradeNum >= 9 ? group : 'সাধারণ'];

  const seen = new Set<string>();
  const combined: DynamicConfiguredSubject[] = [];

  for (const grp of groupsToLoad) {
    for (const sub of getActiveCurriculumSubjects(gradeStr, grp)) {
      if (seen.has(sub.name)) continue;
      seen.add(sub.name);
      const isRel = (sub.code || '').includes('REL') || sub.name.includes('ধর্ম');
      if (isRel) {
        for (const relName of ['ইসলাম ও নৈতিক শিক্ষা', 'হিন্দুধর্ম ও নৈতিক শিক্ষা']) {
          if (!seen.has(relName)) {
            seen.add(relName);
            combined.push({ code: sub.code, name: relName, category: sub.category || 'আবশ্যিক' });
          }
        }
      } else {
        combined.push({ code: sub.code, name: sub.name, category: sub.group || sub.category || 'সাধারণ' });
      }
    }
  }

  return combined;
}
