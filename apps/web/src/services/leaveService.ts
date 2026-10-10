'use client';

import { auditTrailService } from './auditTrailService';

export type LeaveType = 'casual' | 'medical' | 'maternity' | 'emergency' | 'earned';

export interface LeaveApplication {
  id: string;
  teacherId: string;
  teacherName: string;
  designation: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  appliedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
  remarks?: string;
}

const STORAGE_KEY = 'sms_teacher_leave_applications';

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  casual: 'নৈমিত্তিক ছুটি (Casual Leave)',
  medical: 'চিকিৎসা ছুটি (Medical Leave)',
  maternity: 'মাতৃত্বকালীন ছুটি (Maternity Leave)',
  emergency: 'জরুরি বিশেষ ছুটি (Emergency Leave)',
  earned: 'অর্জিত ছুটি (Earned Leave)'
};

const DEFAULT_LEAVES: LeaveApplication[] = [
  {
    id: 'LEV-1001',
    teacherId: 'TCH-101',
    teacherName: 'মোহাম্মদ আবদুল করিম',
    designation: 'সহকারী শিক্ষক (গণিত)',
    leaveType: 'casual',
    startDate: '2026-09-05',
    endDate: '2026-09-06',
    totalDays: 2,
    reason: 'পারিবারিক জরুরি সামাজিক কাজের জন্য ২ দিনের নৈমিত্তিক ছুটি প্রয়োজন।',
    appliedAt: '2026-08-30T09:30:00Z',
    status: 'approved',
    reviewedBy: 'প্রধান শিক্ষক',
    reviewedAt: '2026-08-30T11:00:00Z',
    remarks: 'ছুটি মঞ্জুর করা হলো। পরীক্ষার পূর্বের ক্লাস সম্পন্ন করার অনুরোধ রইলো।'
  },
  {
    id: 'LEV-1002',
    teacherId: 'TCH-102',
    teacherName: 'নাসরিন আক্তার',
    designation: 'সহকারী শিক্ষক (বিজ্ঞান)',
    leaveType: 'medical',
    startDate: '2026-09-10',
    endDate: '2026-09-12',
    totalDays: 3,
    reason: 'শারীরিক অসুস্থতার কারণে ডাক্তারের পরামর্শ অনুযায়ী ৩ দিনের বিশ্রাম।',
    appliedAt: '2026-08-31T08:15:00Z',
    status: 'pending'
  }
];

class LeaveService {
  private listeners: (() => void)[] = [];

  getLeaves(): LeaveApplication[] {
    if (typeof window === 'undefined') return DEFAULT_LEAVES;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_LEAVES));
      return DEFAULT_LEAVES;
    } catch (e) {
      console.error(e);
      return DEFAULT_LEAVES;
    }
  }

  getTeacherLeaves(teacherId: string): LeaveApplication[] {
    if (!teacherId) return [];
    const cleanId = teacherId.trim().toLowerCase();
    const leaves = this.getLeaves();
    return leaves.filter(l => 
      l.teacherId.toLowerCase() === cleanId || 
      l.teacherName.toLowerCase() === cleanId
    );
  }

  submitLeave(data: {
    teacherId: string;
    teacherName: string;
    designation: string;
    leaveType: LeaveType;
    startDate: string;
    endDate: string;
    totalDays: number;
    reason: string;
  }): { success: boolean; message: string; leave?: LeaveApplication } {
    if (typeof window === 'undefined') return { success: false, message: 'ব্রাউজার অনুপস্থিত' };

    if (!data.startDate || !data.endDate) {
      return { success: false, message: 'ছুটির শুরু ও শেষের তারিখ প্রদান করুন!' };
    }
    if (!data.reason || data.reason.trim().length < 5) {
      return { success: false, message: 'ছুটির সুনির্দিষ্ট কারণ কমপক্ষে ৫ অক্ষরে উল্লেখ করুন!' };
    }

    const leaves = this.getLeaves();
    const newLeave: LeaveApplication = {
      ...data,
      id: `LEV-${Math.floor(1000 + Math.random() * 9000)}`,
      appliedAt: new Date().toISOString(),
      status: 'pending'
    };

    const updated = [newLeave, ...leaves];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    auditTrailService.addLog({
      action: 'SUBMIT_LEAVE_APPLICATION',
      category: 'LEAVE',
      details: `শিক্ষক '${data.teacherName}' (${data.designation}) ${LEAVE_TYPE_LABELS[data.leaveType]} এর জন্য ${data.totalDays} দিনের আবেদন করেছেন`,
      performedBy: data.teacherName,
      status: 'SUCCESS'
    });

    window.dispatchEvent(new Event('storage'));
    this.notify();

    return { success: true, message: 'প্রধান শিক্ষক বরাবর ছুটির আবেদন সফলভাবে সাবমিট করা হয়েছে!', leave: newLeave };
  }

  reviewLeave(
    leaveId: string, 
    status: 'approved' | 'rejected', 
    reviewedBy: string = 'প্রধান শিক্ষক', 
    remarks?: string
  ): { success: boolean; message: string } {
    if (typeof window === 'undefined') return { success: false, message: 'ব্রাউজার অনুপস্থিত' };

    const leaves = this.getLeaves();
    const idx = leaves.findIndex(l => l.id === leaveId);
    if (idx === -1) {
      return { success: false, message: 'ছুটির আবেদনটি পাওয়া যায়নি!' };
    }

    const target = leaves[idx];
    leaves[idx] = {
      ...target,
      status,
      reviewedBy,
      reviewedAt: new Date().toISOString(),
      remarks: remarks || (status === 'approved' ? 'ছুটি মঞ্জুর করা হলো।' : 'আবেদনটি বিবেচনা করা সম্ভব হয়নি।')
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(leaves));

    auditTrailService.addLog({
      action: status === 'approved' ? 'APPROVE_LEAVE' : 'REJECT_LEAVE',
      category: 'LEAVE',
      details: `ছুটির আবেদন (${leaveId} - ${target.teacherName}) ${status === 'approved' ? 'মঞ্জুর' : 'বাতিল'} করেছেন ${reviewedBy}`,
      performedBy: reviewedBy,
      status: 'SUCCESS'
    });

    window.dispatchEvent(new Event('storage'));
    this.notify();

    return { 
      success: true, 
      message: status === 'approved' ? 'ছুটি সফলভাবে মঞ্জুর করা হয়েছে!' : 'ছুটির আবেদন বাতিল করা হয়েছে!' 
    };
  }

  cancelLeave(leaveId: string, teacherId: string): { success: boolean; message: string } {
    if (typeof window === 'undefined') return { success: false, message: 'ব্রাউজার অনুপস্থিত' };

    const leaves = this.getLeaves();
    const target = leaves.find(l => l.id === leaveId);
    if (!target) return { success: false, message: 'ছুটির আবেদনটি পাওয়া যায়নি!' };
    if (target.status !== 'pending') return { success: false, message: 'শুধুমাত্র বিবেচনাধীন (Pending) আবেদন বাতিল করা সম্ভব!' };

    const updated = leaves.filter(l => l.id !== leaveId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    auditTrailService.addLog({
      action: 'CANCEL_LEAVE_APPLICATION',
      category: 'LEAVE',
      details: `শিক্ষক '${target.teacherName}' ছুটির আবেদন (${leaveId}) প্রত্যাহার করেছেন`,
      performedBy: target.teacherName,
      status: 'SUCCESS'
    });

    window.dispatchEvent(new Event('storage'));
    this.notify();

    return { success: true, message: 'ছুটির আবেদন সফলভাবে প্রত্যাহার করা হয়েছে!' };
  }

  subscribe(fn: () => void) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }
}

export const leaveService = new LeaveService();
