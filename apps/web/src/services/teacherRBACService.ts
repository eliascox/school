'use client';

import { auditTrailService } from './auditTrailService';
import { hashPassword } from '@/lib/passwordUtils';

// ==============================================================================
// TEACHER MANAGEMENT & ROLE-BASED ACCESS CONTROL (RBAC) SERVICE ENGINE
// ==============================================================================

export interface TeacherRecord {
  id: string;
  name: string;
  phone: string; // Login Username
  designation: string;
  dob: string; // YYYY-MM-DD
  photoUrl?: string;
  status: 'active' | 'inactive';
  passwordHash: string; // bcrypt / argon2 hash
  mustChangePassword: boolean; // First login password change flag
  createdAt: string;
}

export interface SubjectAssignment {
  id: string;
  teacherId: string;
  classId: string; // e.g. "8th"
  subjectId: string; // e.g. "Math"
  academicYear: number; // e.g. 2026
}

export interface ClassTeacherAssignment {
  id: string;
  teacherId: string;
  classId: string; // e.g. "8th-A"
  academicYear: number; // e.g. 2026
}

export interface MarkEntryPayload {
  studentId: string;
  classId: string;
  subjectId: string;
  examId: string;
  obtainedMarks: number;
  fullMarks: number;
  academicYear: number;
  enteredBy: string; // teacherId
}

export interface AttendancePayload {
  studentId: string;
  classId: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  markedBy: string; // teacherId
}

class TeacherRBACService {

  // ---------------------------------------------------------------------------
  // 1. TEACHER CRUD & CREDENTIAL MANAGMENT (ADMIN ONLY)
  // ---------------------------------------------------------------------------

  getTeachers(): TeacherRecord[] {
    if (typeof window === 'undefined') return [];
    let teachers: TeacherRecord[] = [];
    const storedRBAC = localStorage.getItem('sms_rbac_teachers');
    const storedList = localStorage.getItem('sms_teachers_list');

    if (storedRBAC) {
      try { teachers = JSON.parse(storedRBAC); } catch (e) {}
    }
    if (teachers.length === 0 && storedList) {
      try {
        const rawList = JSON.parse(storedList);
        teachers = rawList.map((t: any) => ({
          id: t.id,
          name: t.name,
          phone: t.phone || t.mobile || '01812000000',
          designation: t.designation || 'সহকারী শিক্ষক',
          dob: t.dob || '1990-01-01',
          status: 'active',
          passwordHash: t.password || t.passwordHash || '123456',
          mustChangePassword: t.mustChangePassword !== undefined ? t.mustChangePassword : true,
          createdAt: t.createdAt || new Date().toISOString()
        }));
      } catch (e) {}
    }
    return teachers;
  }

  async createTeacher(data: Omit<TeacherRecord, 'id' | 'createdAt' | 'mustChangePassword'>): Promise<{ success: boolean; message: string; teacher?: TeacherRecord }> {
    if (typeof window === 'undefined') return { success: false, message: 'Browser environment missing' };
    
    const teachers = this.getTeachers();

    // Check Unique Phone (Username) Constraint
    const existing = teachers.find(t => t.phone === data.phone.trim());
    if (existing) {
      return { success: false, message: `ফোন নম্বর/ইউজারনেম '${data.phone}' ইতিমধ্যে রেজিস্টার করা আছে!` };
    }

    const rawPassword = data.passwordHash || '123456';
    const secureHash = rawPassword.startsWith('pbkdf2:') ? rawPassword : await hashPassword(rawPassword);

    const newTeacher: TeacherRecord = {
      ...data,
      passwordHash: secureHash,
      id: `TCH-${Math.floor(1000 + Math.random() * 9000)}`,
      mustChangePassword: true, // MANDATORY CHANGE ON FIRST LOGIN
      createdAt: new Date().toISOString()
    };

    const updated = [newTeacher, ...teachers];
    localStorage.setItem('sms_rbac_teachers', JSON.stringify(updated));

    // Also sync to sms_teachers_list for app and login portal
    const listFormat = updated.map(t => ({
      id: t.id,
      name: t.name,
      designation: t.designation,
      subject: (t as any).subject || 'সাধারণ',
      qualification: 'B.A / B.Sc',
      mobile: t.phone,
      phone: t.phone,
      email: `${t.id.toLowerCase()}@school.edu.bd`,
      password: t.passwordHash,
      passwordHash: t.passwordHash,
      dob: t.dob,
      mustChangePassword: t.mustChangePassword
    }));
    localStorage.setItem('sms_teachers_list', JSON.stringify(listFormat));

    return { success: true, message: 'শিক্ষক সফলভাবে যুক্ত করা হয়েছে!', teacher: newTeacher };
  }

  async resetPassword(teacherId: string, newRawPassword: string): Promise<{ success: boolean; message: string }> {
    const teachers = this.getTeachers();
    const idx = teachers.findIndex(t => t.id === teacherId);
    if (idx === -1) return { success: false, message: 'শিক্ষক খুঁজে পাওয়া যায়নি' };

    const secureHash = newRawPassword.startsWith('pbkdf2:') ? newRawPassword : await hashPassword(newRawPassword);
    teachers[idx].passwordHash = secureHash; // SEC-102: PBKDF2 hash
    teachers[idx].mustChangePassword = true; // Mandatory password change flag reactivated
    localStorage.setItem('sms_rbac_teachers', JSON.stringify(teachers));

    const listFormat = teachers.map(t => ({
      id: t.id,
      name: t.name,
      designation: t.designation,
      subject: (t as any).subject || 'সাধারণ',
      qualification: 'B.A / B.Sc',
      mobile: t.phone,
      phone: t.phone,
      email: `${t.id.toLowerCase()}@school.edu.bd`,
      password: t.passwordHash,
      passwordHash: t.passwordHash,
      dob: t.dob,
      mustChangePassword: t.mustChangePassword
    }));
    localStorage.setItem('sms_teachers_list', JSON.stringify(listFormat));

    return { success: true, message: 'পাসওয়ার্ড রিসেট সফল হয়েছে! প্রথম লগইনে পরিবর্তনের ফ্ল্যাগ অ্যাক্টিভ হয়েছে।' };
  }

  updateTeacher(id: string, data: Partial<TeacherRecord> & { password?: string }): { success: boolean; message: string } {
    if (typeof window === 'undefined') return { success: false, message: 'Browser environment missing' };
    
    const teachers = this.getTeachers();
    const idx = teachers.findIndex(t => t.id === id);
    if (idx === -1) return { success: false, message: 'শিক্ষক খুঁজে পাওয়া যায়নি!' };

    if (data.phone && data.phone.trim() !== teachers[idx].phone) {
      const existing = teachers.find(t => t.phone === data.phone?.trim() && t.id !== id);
      if (existing) {
        return { success: false, message: `ফোন নম্বর '${data.phone}' দিয়ে ইতিমধ্যে একজন শিক্ষক যুক্ত আছেন!` };
      }
    }

    const updatedTeacher: TeacherRecord = {
      ...teachers[idx],
      ...data,
      phone: data.phone ? data.phone.trim() : teachers[idx].phone,
      passwordHash: data.password && data.password.trim() ? data.password.trim() : teachers[idx].passwordHash
    };

    teachers[idx] = updatedTeacher;
    localStorage.setItem('sms_rbac_teachers', JSON.stringify(teachers));

    const listFormat = teachers.map(t => ({
      id: t.id,
      name: t.name,
      designation: t.designation,
      subject: (t as any).subject || 'সাধারণ',
      qualification: 'B.A / B.Sc',
      mobile: t.phone,
      phone: t.phone,
      email: `${t.id.toLowerCase()}@school.edu.bd`,
      password: t.passwordHash,
      passwordHash: t.passwordHash,
      dob: t.dob,
      mustChangePassword: t.mustChangePassword
    }));
    localStorage.setItem('sms_teachers_list', JSON.stringify(listFormat));
    window.dispatchEvent(new Event('storage'));

    return { success: true, message: 'শিক্ষকের তথ্য সফলভাবে আপডেট করা হয়েছে!' };
  }

  // ---------------------------------------------------------------------------
  // 2. ASSIGNMENT ENGINE (Subject Assignments & Class Teacher)
  // ---------------------------------------------------------------------------

  getSubjectAssignments(): SubjectAssignment[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem('sms_rbac_subject_assignments');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    // Seed default assignments for initial active teachers
    const teachers = this.getTeachers();
    if (teachers.length > 0) {
      const firstTeacher = teachers[0];
      const initial: SubjectAssignment[] = [
        { id: 'SA-INIT-1', teacherId: firstTeacher.id, classId: '6th', subjectId: 'বাংলা ১ম পত্র', academicYear: 2026 },
        { id: 'SA-INIT-2', teacherId: firstTeacher.id, classId: '7th', subjectId: 'বাংলা ১ম পত্র', academicYear: 2026 },
        { id: 'SA-INIT-3', teacherId: firstTeacher.id, classId: '8th', subjectId: 'সাধারণ গণিত', academicYear: 2026 },
        { id: 'SA-INIT-4', teacherId: firstTeacher.id, classId: '9th', subjectId: 'বাংলা ১ম পত্র', academicYear: 2026 },
        { id: 'SA-INIT-5', teacherId: firstTeacher.id, classId: '10th', subjectId: 'সাধারণ গণিত', academicYear: 2026 }
      ];
      try {
        localStorage.setItem('sms_rbac_subject_assignments', JSON.stringify(initial));
      } catch (e) {}
      return initial;
    }
    return [];
  }

  assignSubject(teacherId: string, classId: string, subjectId: string, academicYear: number = 2026): { success: boolean; message: string } {
    const assignments = this.getSubjectAssignments();

    // UNIQUE Constraint Check (teacher_id + class_id + subject_id + academic_year)
    const exists = assignments.some(a => 
      a.teacherId === teacherId && 
      a.classId === classId && 
      a.subjectId === subjectId && 
      a.academicYear === academicYear
    );

    if (exists) {
      return { success: false, message: 'এই শিক্ষককে উক্ত শ্রেণি ও বিষয়ে ইতিমধ্যে এসাইন করা আছে!' };
    }

    const newAssignment: SubjectAssignment = {
      id: `SA-${Date.now()}`,
      teacherId,
      classId,
      subjectId,
      academicYear
    };

    localStorage.setItem('sms_rbac_subject_assignments', JSON.stringify([...assignments, newAssignment]));
    auditTrailService.addLog({
      action: 'ASSIGN_SUBJECT',
      category: 'RBAC',
      details: `শিক্ষক (ID: ${teacherId}) কে শ্রেণি ${classId}-এ '${subjectId}' বিষয় বরাদ্দ দেওয়া হয়েছে`,
      performedBy: 'অ্যাডমিন',
      status: 'SUCCESS'
    });
    window.dispatchEvent(new Event('storage'));
    return { success: true, message: 'বিষয়ভিত্তিক ক্লাস বণ্টন সফল হয়েছে!' };
  }

  removeSubjectAssignment(id: string): { success: boolean; message: string } {
    const assignments = this.getSubjectAssignments();
    const target = assignments.find(a => a.id === id);
    const updated = assignments.filter(a => a.id !== id);
    localStorage.setItem('sms_rbac_subject_assignments', JSON.stringify(updated));
    if (target) {
      auditTrailService.addLog({
        action: 'REMOVE_SUBJECT_ASSIGNMENT',
        category: 'RBAC',
        details: `শিক্ষক (ID: ${target.teacherId}) এর শ্রেণি ${target.classId} থেকে '${target.subjectId}' বিষয় বরাদ্দ বাতিল করা হয়েছে`,
        performedBy: 'অ্যাডমিন',
        status: 'SUCCESS'
      });
    }
    window.dispatchEvent(new Event('storage'));
    return { success: true, message: 'বিষয় বণ্টন সফলভাবে বাতিল করা হয়েছে!' };
  }

  deleteTeacher(id: string): { success: boolean; message: string } {
    if (typeof window === 'undefined') return { success: false, message: 'Browser missing' };
    const teachers = this.getTeachers();
    const target = teachers.find(t => t.id === id);
    const updated = teachers.filter(t => t.id !== id);
    localStorage.setItem('sms_rbac_teachers', JSON.stringify(updated));
    localStorage.setItem('sms_teachers_list', JSON.stringify(updated));
    
    // Clean up their assignments as well
    const assignments = this.getSubjectAssignments().filter(a => a.teacherId !== id);
    localStorage.setItem('sms_rbac_subject_assignments', JSON.stringify(assignments));

    const classTeachers = this.getClassTeachers().filter(ct => ct.teacherId !== id);
    localStorage.setItem('sms_rbac_class_teachers', JSON.stringify(classTeachers));

    auditTrailService.addLog({
      action: 'DELETE_TEACHER',
      category: 'RBAC',
      details: `শিক্ষক '${target?.name || id}' (ID: ${id}) এর রেকর্ড ও সকল পারমিশন ডিলিট করা হয়েছে`,
      performedBy: 'অ্যাডমিন',
      status: 'SUCCESS'
    });

    window.dispatchEvent(new Event('storage'));
    return { success: true, message: 'শিক্ষকের তথ্য ও সকল অ্যাসাইনমেন্ট সফলভাবে মুছে ফেলা হয়েছে!' };
  }

  getClassTeachers(): ClassTeacherAssignment[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem('sms_rbac_class_teachers');
    if (stored) {
      try { return JSON.parse(stored); } catch (e) {}
    }
    return [];
  }

  assignClassTeacher(teacherId: string, classId: string, academicYear: number = 2026): { success: boolean; message: string } {
    const classTeachers = this.getClassTeachers();

    const existingIndex = classTeachers.findIndex(ct => ct.classId === classId && ct.academicYear === academicYear);
    
    const newEntry: ClassTeacherAssignment = {
      id: `CT-${Date.now()}`,
      teacherId,
      classId,
      academicYear
    };

    let updated: ClassTeacherAssignment[];
    if (existingIndex !== -1) {
      updated = [...classTeachers];
      updated[existingIndex] = newEntry;
    } else {
      updated = [...classTeachers, newEntry];
    }

    localStorage.setItem('sms_rbac_class_teachers', JSON.stringify(updated));
    auditTrailService.addLog({
      action: 'ASSIGN_CLASS_TEACHER',
      category: 'RBAC',
      details: `শিক্ষক (ID: ${teacherId}) কে শ্রেণি '${classId}' এর শ্রেণি শিক্ষক হিসেবে নিয়োগ দেওয়া হয়েছে`,
      performedBy: 'অ্যাডমিন',
      status: 'SUCCESS'
    });
    window.dispatchEvent(new Event('storage'));
    return { success: true, message: `উক্ত শ্রেণির জন্য শ্রেণি শিক্ষক সফলভাবে নির্বাচন করা হয়েছে!` };
  }

  removeClassTeacher(id: string): { success: boolean; message: string } {
    const classTeachers = this.getClassTeachers();
    const target = classTeachers.find(ct => ct.id === id);
    const updated = classTeachers.filter(ct => ct.id !== id);
    localStorage.setItem('sms_rbac_class_teachers', JSON.stringify(updated));
    if (target) {
      auditTrailService.addLog({
        action: 'REMOVE_CLASS_TEACHER',
        category: 'RBAC',
        details: `শ্রেণি '${target.classId}' থেকে শ্রেণি শিক্ষক (ID: ${target.teacherId}) প্রত্যাহার করা হয়েছে`,
        performedBy: 'অ্যাডমিন',
        status: 'SUCCESS'
      });
    }
    window.dispatchEvent(new Event('storage'));
    return { success: true, message: 'শ্রেণি শিক্ষক নির্বাচন বাতিল করা হয়েছে!' };
  }

  // ---------------------------------------------------------------------------
  // 3. BACKEND OWNERSHIP AUTHORIZATION & VALIDATION LOGIC
  // ---------------------------------------------------------------------------

  /**
   * Resolves all possible identifier representations (ID, Phone, Name) for a given teacher
   */
  resolveTeacherIdentifiers(identifier: string): string[] {
    if (!identifier) return [];
    const teachers = this.getTeachers();
    const clean = identifier.trim().toLowerCase();
    const found = teachers.find(t => 
      (t.id && t.id.toLowerCase() === clean) ||
      (t.name && t.name.trim().toLowerCase() === clean) ||
      (t.phone && t.phone.trim().toLowerCase() === clean)
    );
    if (found) {
      return Array.from(new Set([found.id, found.phone, found.name, identifier].filter(Boolean)));
    }
    return [identifier];
  }

  /**
   * Get all subject assignments for a specific teacher, optionally filtered by classId
   */
  getTeacherAssignedSubjects(identifier: string, classId?: string): SubjectAssignment[] {
    if (!identifier) return [];
    const assignments = this.getSubjectAssignments();
    const validIds = this.resolveTeacherIdentifiers(identifier).map(id => id.toLowerCase().trim());
    
    return assignments.filter(a => {
      const matchTeacher = validIds.some(id => 
        a.teacherId.toLowerCase().trim() === id || 
        a.teacherId.toLowerCase().includes(id) || 
        id.includes(a.teacherId.toLowerCase())
      );
      const matchClass = !classId || a.classId === classId;
      return matchTeacher && matchClass;
    });
  }

  /**
   * Get all class teacher assignments for a specific teacher
   */
  getTeacherClassTeacherAssignments(identifier: string): ClassTeacherAssignment[] {
    if (!identifier) return [];
    const classTeachers = this.getClassTeachers();
    const validIds = this.resolveTeacherIdentifiers(identifier).map(id => id.toLowerCase().trim());

    return classTeachers.filter(ct => 
      validIds.some(id => 
        ct.teacherId.toLowerCase().trim() === id || 
        ct.teacherId.toLowerCase().includes(id) || 
        id.includes(ct.teacherId.toLowerCase())
      )
    );
  }

  /**
   * Check if a teacher is a designated Class Teacher for any class or a specific class
   */
  isTeacherClassTeacher(identifier: string, classId?: string): boolean {
    const list = this.getTeacherClassTeacherAssignments(identifier);
    if (!classId) return list.length > 0;
    return list.some(ct => ct.classId === classId || ct.classId.startsWith(classId));
  }

  /**
   * BACKEND OWNERSHIP VALIDATION for Exam Mark Entry
   * Checks if teacher has permission to enter marks for target classId + subjectName
   */
  validateSubjectOwnership(identifier: string, classId: string, subjectName: string, academicYear: number = 2026): boolean {
    if (!identifier || !classId || !subjectName) return false;
    const assigned = this.getTeacherAssignedSubjects(identifier, classId);
    if (assigned.length === 0) return false;

    const targetSub = subjectName.trim().toLowerCase();
    return assigned.some(a => {
      const aSub = a.subjectId.trim().toLowerCase();
      if (aSub === targetSub) return true;
      if (aSub.includes(targetSub) || targetSub.includes(aSub)) return true;

      // ─── 1. Religion Subject Cross-Matching ───────────────────────
      // Handles cases where teacher is assigned "ইসলাম ও নৈতিক শিক্ষা" or "হিন্দুধর্ম ও নৈতিক শিক্ষা"
      // while curriculum/spreadsheet has "ধর্ম ও নৈতিক শিক্ষা" or vice versa.
      const isRelA = aSub.includes('ধর্ম') || aSub.includes('ইসলাম') || aSub.includes('হিন্দু') || aSub.includes('সনাতন') || aSub.includes('rel');
      const isRelTarget = targetSub.includes('ধর্ম') || targetSub.includes('ইসলাম') || targetSub.includes('হিন্দু') || targetSub.includes('সনাতন') || targetSub.includes('rel');

      if (isRelA && isRelTarget) {
        // If either is generic religion ("ধর্ম ও নৈতিক শিক্ষা", "ধর্ম", "rel-111"), allow any assigned religion teacher
        if (targetSub === 'ধর্ম ও নৈতিক শিক্ষা' || targetSub === 'ধর্ম' || targetSub === 'rel-111' || targetSub.startsWith('rel-')) return true;
        if (aSub === 'ধর্ম ও নৈতিক শিক্ষা' || aSub === 'ধর্ম' || aSub === 'rel-111' || aSub.startsWith('rel-')) return true;

        // If both specify specific religion faith, match faith:
        const isMuslimA = aSub.includes('ইসলাম') || aSub.includes('মুসলিম');
        const isMuslimTarget = targetSub.includes('ইসলাম') || targetSub.includes('মুসলিম');
        if (isMuslimA && isMuslimTarget) return true;

        const isHinduA = aSub.includes('হিন্দু') || aSub.includes('সনাতন');
        const isHinduTarget = targetSub.includes('হিন্দু') || targetSub.includes('সনাতন');
        if (isHinduA && isHinduTarget) return true;
      }

      // ─── 2. Bengali Unicode & Alias Normalization ───────────────────
      // Normalize '২য়' (ya+hasant/nukta) vs '২য়' (ya-fola), '১ম', 'পত্র', spaces
      const cleanStr = (s: string) => s
        .replace(/\s+/g, '')
        .replace(/পত্র/g, '')
        .replace(/২য়/g, '২')
        .replace(/২য়/g, '২')
        .replace(/১ম/g, '১');

      const normA = cleanStr(aSub);
      const normT = cleanStr(targetSub);
      return normA === normT || normA.includes(normT) || normT.includes(normA);
    });
  }

  /**
   * BACKEND OWNERSHIP VALIDATION for Attendance Entry
   * Checks if teacher is the designated Class Teacher
   */
  validateClassTeacherOwnership(identifier: string, classId: string, academicYear: number = 2026): boolean {
    if (!identifier || !classId) return false;
    return this.isTeacherClassTeacher(identifier, classId);
  }

  // ---------------------------------------------------------------------------
  // 4. GRANULAR RBAC PERMISSION MATRIX (DENY-BY-DEFAULT)
  // ---------------------------------------------------------------------------

  /**
   * 1. Attendance: Class Teacher gets Full Access for assigned class;
   * Assistant Teacher gets Limited Access for their assigned subjects/periods.
   */
  canTakeClassAttendance(identifier: string, classId: string): boolean {
    return this.isTeacherClassTeacher(identifier, classId);
  }

  canTakePeriodAttendance(identifier: string, classId: string, subjectId: string): boolean {
    return this.validateSubjectOwnership(identifier, classId, subjectId) || this.isTeacherClassTeacher(identifier, classId);
  }

  /**
   * 2. Marks Entry: Both roles strictly limited to assigned (classId, subjectId)
   */
  canEditMarks(identifier: string, classId: string, subjectId: string): boolean {
    return this.validateSubjectOwnership(identifier, classId, subjectId);
  }

  /**
   * 3. Fee Info: View-only for Class Teacher (their own class only). Denied for assistant teachers.
   */
  canViewFeeInfo(identifier: string, classId: string): boolean {
    return this.isTeacherClassTeacher(identifier, classId);
  }

  /**
   * 4. Student Profile: Limited Edit (basic demographic/contact info only) for Class Teacher. Denied for others.
   */
  canEditStudentBasicProfile(identifier: string, classId: string): boolean {
    return this.isTeacherClassTeacher(identifier, classId);
  }

  /**
   * 5. Notices: View-only for all teachers. Creation restricted to Admin/Principal.
   */
  canViewNotices(identifier: string): boolean {
    return Boolean(identifier);
  }

  canCreateNotice(role?: string): boolean {
    return role === 'admin';
  }

  /**
   * 6. Routines: View for all teachers (own class + full school master routine).
   */
  canViewRoutine(identifier: string): boolean {
    return Boolean(identifier);
  }

  /**
   * 7. Leave Application: Create/Submit for all teachers to Head Teacher.
   */
  canSubmitLeave(identifier: string): boolean {
    return Boolean(identifier);
  }

  canApproveLeave(role?: string): boolean {
    return role === 'admin';
  }

  /**
   * 8. Result Consolidation & Tabulation Finalization: Restricted to Admin / Exam Controller
   */
  canConsolidateResults(role?: string): boolean {
    return role === 'admin';
  }

  /**
   * Get structured permission profile for UI and runtime checks
   */
  getTeacherPermissionProfile(identifier: string) {
    const isCT = this.isTeacherClassTeacher(identifier);
    const assignedCT = this.getTeacherClassTeacherAssignments(identifier);
    const assignedSubjects = this.getTeacherAssignedSubjects(identifier);

    return {
      teacherIdentifier: identifier,
      isClassTeacher: isCT,
      classTeacherClasses: assignedCT.map(c => c.classId),
      assignedSubjectCount: assignedSubjects.length,
      assignedSubjects,
      permissions: {
        attendance: isCT ? 'full_assigned_class' : 'period_only',
        marksEntry: 'assigned_subjects_only',
        feeInfo: isCT ? 'view_only_assigned_class' : 'none',
        studentProfileEdit: isCT ? 'basic_info_only' : 'none',
        notices: 'view_only',
        routines: 'view_all',
        leaveApplication: 'create_submit',
        resultConsolidation: 'denied'
      }
    };
  }

  /**
   * MARKS ENTRY INPUT VALIDATION:
   * Rule: obtained_marks <= full_marks AND obtained_marks >= 0
   */
  validateMarkPayload(payload: MarkEntryPayload): { valid: boolean; error?: string } {
    if (payload.obtainedMarks < 0) {
      return { valid: false, error: 'প্রাপ্ত নম্বর কখনো ঋণাত্মক (Negative) হতে পারে না!' };
    }
    if (payload.fullMarks <= 0) {
      return { valid: false, error: 'মোট নম্বর অবশ্যই ০ এর বেশি হতে হবে!' };
    }
    if (payload.obtainedMarks > payload.fullMarks) {
      return { valid: false, error: `প্রাপ্ত নম্বর (${payload.obtainedMarks}) কখনো মোট নম্বর (${payload.fullMarks}) এর চেয়ে বেশি হতে পারে না!` };
    }
    return { valid: true };
  }

  /**
   * UPDATE TEACHER PROFILE PHOTO
   */
  updateTeacherPhoto(teacherId: string, photoUrl: string): { success: boolean; message: string } {
    if (typeof window === 'undefined') return { success: false, message: 'Browser environment missing' };
    
    const teachers = this.getTeachers();
    const updated = teachers.map(t => t.id === teacherId ? { ...t, photoUrl } : t);

    localStorage.setItem('sms_rbac_teachers', JSON.stringify(updated));
    localStorage.setItem('sms_teachers_list', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));

    return { success: true, message: 'শিক্ষকের ছবি সফলভাবে আপডেট করা হয়েছে!' };
  }

}

export const teacherRBACService = new TeacherRBACService();
