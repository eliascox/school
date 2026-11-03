import { describe, it, expect, beforeEach } from 'vitest';

const store: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
  clear: () => {
    for (const k of Object.keys(store)) delete store[k];
  },
  get length() { return Object.keys(store).length; },
  key: (i: number) => Object.keys(store)[i] ?? null,
};
(globalThis as any).sessionStorage = (globalThis as any).localStorage;
(globalThis as any).window = globalThis;
(globalThis as any).window.dispatchEvent = () => true;

try {
  Object.defineProperty(globalThis, 'navigator', {
    value: { onLine: true },
    configurable: true,
    writable: true
  });
} catch {}

import { firebaseSyncService } from '../src/services/firebaseSyncService';
import { isFirebaseConfigured, firebaseConfig } from '../src/lib/firebase';
import { studentService } from '../src/services/studentService';

describe('firebaseSyncService Unit Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('verifies that Firebase is properly configured with project bhsedu-e0906', () => {
    expect(isFirebaseConfigured()).toBe(true);
    expect(firebaseConfig.projectId).toBe('bhsedu-e0906');
    expect(firebaseConfig.authDomain).toContain('bhsedu-e0906.firebaseapp.com');
  });

  it('retrieves live status matching configured project', () => {
    const status = firebaseSyncService.getStatus();
    expect(status.isConfigured).toBe(true);
    expect(status.projectId).toBe('bhsedu-e0906');
  });

  it('allows safe local student mutations without throwing network errors', () => {
    const student = studentService.addStudent({
      name: 'সাকিব আল হাসান',
      roll: '১',
      grade: '9th',
      section: 'A',
      group: 'বিজ্ঞান'
    });

    expect(student.id).toBeDefined();
    expect(student.name).toBe('সাকিব আল হাসান');

    const all = studentService.getAllStudents();
    expect(all.length).toBe(1);

    const updateRes = studentService.updateStudent({
      ...student,
      mobile: '01712345678'
    });
    expect(updateRes).toBe(true);

    const delRes = studentService.deleteStudent(student.id);
    expect(delRes).toBe(true);
    expect(studentService.getAllStudents().length).toBe(0);
  });
});
