'use client';

import { auditTrailService } from './auditTrailService';

export interface HomeworkAssignment {
  id: string;
  title: string;
  description: string;
  grade: string;
  section: string;
  subject: string;
  teacherId?: string;
  teacherName: string;
  dueDate: string;
  attachmentName?: string;
  attachmentUrl?: string;
  submittedStudentIds: string[];
  status: 'active' | 'archived';
  createdAt: string;
}

const STORAGE_KEY = 'sms_homework_assignments';

export const homeworkService = {
  getHomeworks(filters?: { grade?: string; section?: string; teacherId?: string; includeArchived?: boolean }): HomeworkAssignment[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const list: HomeworkAssignment[] = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(list)) return [];
      return list.filter((hw) => {
        if (!filters?.includeArchived && hw.status === 'archived') return false;
        if (filters?.grade && filters.grade !== 'all' && hw.grade !== filters.grade) return false;
        if (filters?.section && filters.section !== 'all' && hw.section !== filters.section) return false;
        if (filters?.teacherId && hw.teacherId !== filters.teacherId) return false;
        return true;
      });
    } catch {
      return [];
    }
  },

  createHomework(
    data: Omit<HomeworkAssignment, 'id' | 'createdAt' | 'submittedStudentIds' | 'status'>
  ): { success: boolean; message: string; homework?: HomeworkAssignment } {
    if (typeof window === 'undefined') return { success: false, message: 'ব্রাউজার অনুপস্থিত' };
    if (!data.title.trim() || !data.subject.trim() || !data.dueDate) {
      return { success: false, message: 'শিরোনাম, বিষয় ও জমা দেওয়ার তারিখ আবশ্যক।' };
    }
    if (data.attachmentUrl && data.attachmentUrl.length > 2_000_000) {
      return { success: false, message: 'সংযুক্ত ফাইলের আকার ১.৫ MB-এর বেশি হলে এক্সটার্নাল ড্রাইভ/ফায়ারবেস লিংক দিন।' };
    }

    const hw: HomeworkAssignment = {
      ...data,
      id: `HW-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      submittedStudentIds: [],
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    const all = this.getHomeworks({ includeArchived: true });
    localStorage.setItem(STORAGE_KEY, JSON.stringify([hw, ...all]));
    auditTrailService.addLog({
      action: 'HOMEWORK_CREATED',
      category: 'Academic',
      details: `${hw.grade} (${hw.section}) — ${hw.subject}: "${hw.title}" হোমওয়ার্ক প্রকাশ করা হয়েছে।`,
      performedBy: hw.teacherName || 'শিক্ষক',
      status: 'Success',
    });
    window.dispatchEvent(new Event('storage'));
    return { success: true, message: 'হোমওয়ার্ক ও লেকচার সফলভাবে প্রকাশিত হয়েছে!', homework: hw };
  },

  toggleStudentSubmission(homeworkId: string, studentId: string): HomeworkAssignment | null {
    if (typeof window === 'undefined') return null;
    const all = this.getHomeworks({ includeArchived: true });
    let updatedItem: HomeworkAssignment | null = null;
    const next = all.map((hw) => {
      if (hw.id !== homeworkId) return hw;
      const exists = hw.submittedStudentIds.includes(studentId);
      updatedItem = {
        ...hw,
        submittedStudentIds: exists
          ? hw.submittedStudentIds.filter((id) => id !== studentId)
          : [...hw.submittedStudentIds, studentId],
      };
      return updatedItem;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event('storage'));
    return updatedItem;
  },

  toggleArchive(homeworkId: string): void {
    if (typeof window === 'undefined') return;
    const next = this.getHomeworks({ includeArchived: true }).map((hw) =>
      hw.id === homeworkId ? { ...hw, status: hw.status === 'active' ? 'archived' : 'active' } : hw
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event('storage'));
  },

  deleteHomework(homeworkId: string): void {
    if (typeof window === 'undefined') return;
    const next = this.getHomeworks({ includeArchived: true }).filter((hw) => hw.id !== homeworkId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event('storage'));
  },
};
