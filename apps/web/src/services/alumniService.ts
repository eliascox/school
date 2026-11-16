'use client';

import { Student } from './studentService';
import { auditTrailService } from './auditTrailService';

export interface AlumniRecord {
  id: string;
  studentId?: string;
  name: string;
  fatherName?: string;
  motherName?: string;
  passingYear: string;
  batch: string;
  sscRoll?: string;
  regNo?: string;
  group?: string;
  gpa?: string;
  phone?: string;
  email?: string;
  currentStatus?: 'উচ্চশিক্ষা' | 'চাকরি' | 'ব্যবসা' | 'প্রবাসী' | 'অন্যান্য';
  institutionOrWork?: string;
  address?: string;
  archivedAt: string;
}

const STORAGE_KEY = 'sms_alumni_archive';

export const alumniService = {
  getAlumni(): AlumniRecord[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  saveAlumni(record: Omit<AlumniRecord, 'id' | 'archivedAt'> & { id?: string }): AlumniRecord {
    const all = this.getAlumni();
    const existing = record.id ? all.find((a) => a.id === record.id) : undefined;
    const saved: AlumniRecord = {
      ...record,
      id: record.id || `ALM-${record.passingYear}-${Math.floor(1000 + Math.random() * 9000)}`,
      archivedAt: existing?.archivedAt || new Date().toISOString(),
    };
    const next = existing ? all.map((a) => (a.id === saved.id ? saved : a)) : [saved, ...all];
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event('storage'));
    }
    return saved;
  },

  archiveGraduatingStudents(students: Student[], passingYear: string, batchLabel?: string): number {
    if (typeof window === 'undefined' || students.length === 0) return 0;
    const all = this.getAlumni();
    const existingIds = new Set(all.map((a) => a.studentId).filter(Boolean));
    const newlyAdded: AlumniRecord[] = [];

    for (const st of students) {
      if (existingIds.has(st.id)) continue;
      newlyAdded.push({
        id: `ALM-${passingYear}-${st.roll || Math.floor(1000 + Math.random() * 9000)}-${Math.floor(10 + Math.random() * 89)}`,
        studentId: st.id,
        name: st.name,
        fatherName: st.fatherName || st.guardian,
        motherName: st.motherName,
        passingYear,
        batch: batchLabel || `ব্যাচ ${passingYear}`,
        sscRoll: st.sscRoll || st.roll,
        regNo: st.registrationNo,
        group: st.group || 'সাধারণ',
        gpa: st.gpa || '',
        phone: st.mobile,
        address: st.permanentAddress || st.currentAddress,
        currentStatus: 'উচ্চশিক্ষা',
        archivedAt: new Date().toISOString(),
      });
    }

    if (newlyAdded.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...newlyAdded, ...all]));
      auditTrailService.addLog({
        action: 'ALUMNI_ARCHIVE_CREATED',
        category: 'Alumni',
        details: `${passingYear} ব্যাচের ${newlyAdded.length} জন পাস-আউট শিক্ষার্থী অ্যালুমনাই আর্কাইভে সংরক্ষিত হয়েছে।`,
        performedBy: 'অ্যাডমিন',
        status: 'Success',
      });
      window.dispatchEvent(new Event('storage'));
    }
    return newlyAdded.length;
  },

  deleteAlumni(id: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.getAlumni().filter((a) => a.id !== id)));
    window.dispatchEvent(new Event('storage'));
  },
};
