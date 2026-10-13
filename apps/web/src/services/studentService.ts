import { auditTrailService } from './auditTrailService';
import { syncQueueService } from './syncQueueService';
import { systemResetService, SystemPurgeReport } from './systemResetService';

export interface Student {
  id: string;
  name: string;
  roll: string;
  grade: string;        // '6th', '7th', '8th', '9th', '10th'
  gradeBn?: string;
  section: string;      // 'A', 'B', 'C'
  branch?: string;
  group: string;        // 'বিজ্ঞান', 'মানবিক', 'ব্যবসায় শিক্ষা', 'সাধারণ'
  optionalSubject?: string;
  guardian?: string;
  fatherName?: string;
  fatherNid?: string;
  motherName?: string;
  motherNid?: string;
  session?: string;
  mobile?: string;
  attendance?: number;
  gpa?: string;
  birthRegNo?: string;
  dob?: string;
  gender?: string;
  religion?: string;
  bloodGroup?: string;
  currentAddress?: string;
  permanentAddress?: string;
  photo?: string;
  remarks?: string;
  isStipend?: boolean;          // উপবৃত্তি প্রাপ্ত কিনা (Stipend Beneficiary Flag)
  stipendCategory?: string;     // উপবৃত্তি ক্যাটাগরি ('সাধারণ উপবৃত্তি', 'মেধাভিত্তিক')
  stipendStatus?: 'Active' | 'Suspended' | 'Revoked'; // উপবৃত্তি স্থিতি
  examMarkAvg?: number;         // ৬ মাসিক/বার্ষিক অর্জিত নম্বর (%)
}

// ─── NO DEMO / HARDCODED STUDENTS HERE ───
// The system starts EMPTY. Admin must bulk upload or add students manually.
// All student data comes from localStorage keys:
//   sms_students         → manually added students
//   sms_uploaded_students → CSV-imported students
// When sms_demo_cleared === 'true', system returns [] until real data is entered.

const getStudentDedupeKey = (s: Partial<Student>, idx: number): string => {
  const grade = (s.grade || s.gradeBn || '8th').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
  const section = (s.section || s.branch || 'a').toString().toLowerCase().trim();
  const roll = (s.roll || String(idx + 1)).toString().trim().replace(/^0+/, '');
  const name = (s.name || '').toString().toLowerCase().trim().replace(/\s+/g, '');

  if (grade && roll) {
    return `${grade}_${section}_${roll}`;
  }
  return `${grade}_${name}_${idx}`;
};

const deduplicateStudentList = (list: Student[]): Student[] => {
  const uniqueMap = new Map<string, Student>();
  list.forEach((st, idx) => {
    const key = getStudentDedupeKey(st, idx);
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, {
        ...st,
        branch: st.branch || st.section || 'A',
        section: st.section || st.branch || 'A',
        religion: st.religion !== undefined ? st.religion : ''
      });
    } else {
      const existing = uniqueMap.get(key)!;
      uniqueMap.set(key, {
        ...existing,
        ...st,
        photo: st.photo || existing.photo || '',
        religion: (st.religion !== undefined && st.religion !== '') ? st.religion : (existing.religion || ''),
        branch: st.branch || existing.branch || 'A',
        section: st.section || existing.section || 'A'
      });
    }
  });
  return Array.from(uniqueMap.values());
};

const listeners: (() => void)[] = [];

export const studentService = {
  // Get all active students from Central Storage
  getAllStudents: (): Student[] => {
    if (typeof window === 'undefined') return [];

    const storedStudents = localStorage.getItem('sms_students');
    const storedUploaded = localStorage.getItem('sms_uploaded_students');

    let combined: Student[] = [];
    let hadUploaded = false;

    if (storedStudents) {
      try { combined = [...combined, ...JSON.parse(storedStudents)]; } catch (e) {}
    }
    if (storedUploaded) {
      try {
        const uploaded: Student[] = JSON.parse(storedUploaded);
        if (Array.isArray(uploaded) && uploaded.length > 0) {
          combined = [...combined, ...uploaded];
          hadUploaded = true;
        }
        localStorage.removeItem('sms_uploaded_students');
      } catch (e) {}
    }

    if (hadUploaded) {
      // Only write to localStorage when newly uploaded batch was merged
      const deduped = deduplicateStudentList(combined);
      localStorage.setItem('sms_students', JSON.stringify(deduped));
      return deduped;
    }

    return combined;
  },

  // Get filtered students for specific Grade, Section & Group
  getStudentsByFilter: (grade?: string, section?: string, group?: string): Student[] => {
    const all = studentService.getAllStudents();
    const gradeBnMap: Record<string, string> = {
      '6th': '৬ষ্ঠ শ্রেণি',
      '7th': '৭ম শ্রেণি',
      '8th': '৮ম শ্রেণি',
      '9th': '৯ম শ্রেণি',
      '10th': '১০ম শ্রেণি'
    };
    const targetGradeBn = grade ? (gradeBnMap[grade] || grade) : '';

    return all.filter(s => {
      const sGrade = s.grade || s.gradeBn || '';
      const sSection = s.section || s.branch || '';
      const sGroup = s.group || '';

      const matchGrade = !grade || grade === 'all' || sGrade === grade || sGrade === targetGradeBn || sGrade.includes(grade) ||
        (grade === '6th' && (sGrade.includes('6') || sGrade.includes('Six') || sGrade.includes('৬'))) ||
        (grade === '7th' && (sGrade.includes('7') || sGrade.includes('Seven') || sGrade.includes('৭'))) ||
        (grade === '8th' && (sGrade.includes('8') || sGrade.includes('Eight') || sGrade.includes('৮'))) ||
        (grade === '9th' && (sGrade.includes('9') || sGrade.includes('Nine') || sGrade.includes('৯'))) ||
        (grade === '10th' && (sGrade.includes('10') || sGrade.includes('Ten') || sGrade.includes('১০')));

      const is9or10 = grade === '9th' || grade === '10th' || sGrade.includes('9') || sGrade.includes('10') || sGrade.includes('৯') || sGrade.includes('১০');

      let matchSection = true;
      if (section && section !== 'all') {
        const secLower = section.toLowerCase();
        const sSecLower = sSection.toLowerCase();
        const sGrpLower = sGroup.toLowerCase();

        if (is9or10) {
          if (secLower.includes('science') || secLower.includes('বিজ্ঞান') || secLower === 'a') {
            matchSection = sGrpLower.includes('বিজ্ঞান') || sGrpLower.includes('science') || sSecLower.includes('science') || sSecLower.includes('বিজ্ঞান') || sSecLower === 'a';
          } else if (secLower.includes('humanities') || secLower.includes('মানবিক') || secLower === 'b') {
            matchSection = sGrpLower.includes('মানবিক') || sGrpLower.includes('humanities') || sSecLower.includes('humanities') || sSecLower.includes('মানবিক') || sSecLower === 'b';
          } else if (secLower.includes('commerce') || secLower.includes('business') || secLower.includes('ব্যবসায়') || secLower === 'c') {
            matchSection = sGrpLower.includes('ব্যবসায়') || sGrpLower.includes('commerce') || sSecLower.includes('commerce') || sSecLower.includes('ব্যবসায়') || sSecLower === 'c';
          } else {
            matchSection = sSecLower.includes(secLower) || sSecLower === secLower;
          }
        } else {
          matchSection = sSecLower.includes(secLower) || sSecLower === secLower;
        }
      }

      let matchGroup = true;
      if (group && group !== 'all') {
        const grpLower = group.toLowerCase();
        const sGrpLower = sGroup.toLowerCase();
        
        if (grpLower.includes('science') || grpLower.includes('বিজ্ঞান')) {
          matchGroup = sGrpLower.includes('বিজ্ঞান') || sGrpLower.includes('science');
        } else if (grpLower.includes('humanities') || grpLower.includes('মানবিক') || grpLower.includes('arts')) {
          matchGroup = sGrpLower.includes('মানবিক') || sGrpLower.includes('humanities') || sGrpLower.includes('arts');
        } else if (grpLower.includes('commerce') || grpLower.includes('business') || grpLower.includes('ব্যবসায়')) {
          matchGroup = sGrpLower.includes('ব্যবসায়') || sGrpLower.includes('commerce') || sGrpLower.includes('business');
        } else {
          matchGroup = sGrpLower.includes(grpLower) || sGrpLower === grpLower;
        }
      }

      return matchGrade && matchSection && matchGroup;
    });
  },

  // Save/Add single student
  addStudent: (data: Partial<Student>): Student => {
    const all = studentService.getAllStudents();
    const newStudent: Student = {
      ...data,
      id: data.id || `STD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      name: data.name || 'নতুন শিক্ষার্থী',
      roll: data.roll || '01',
      grade: data.grade || '8th',
      section: data.section || data.branch || 'A',
      branch: data.branch || data.section || 'A',
      group: data.group || 'সাধারণ',
      optionalSubject: data.optionalSubject || 'কৃষি শিক্ষা',
      guardian: data.guardian || data.fatherName || '',
      fatherName: data.fatherName || data.guardian || '',
      fatherNid: data.fatherNid || '',
      motherName: data.motherName || '',
      motherNid: data.motherNid || '',
      mobile: data.mobile || '',
      attendance: data.attendance || 0,
      gpa: data.gpa || '',
      birthRegNo: data.birthRegNo || '',
      dob: data.dob || '',
      gender: data.gender || 'পুরুষ',
      religion: data.religion || 'ইসলাম',
      bloodGroup: data.bloodGroup || 'A+',
      currentAddress: data.currentAddress || '',
      permanentAddress: data.permanentAddress || '',
      photo: data.photo || '',
      session: data.session || '২০২৬',
      remarks: data.remarks || '',
      isStipend: data.isStipend || false,
      stipendCategory: data.stipendCategory,
      stipendStatus: data.stipendStatus
    };

    const updated = deduplicateStudentList([newStudent, ...all]);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sms_students', JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
      syncQueueService.enqueue('student', newStudent.id, 'CREATE', newStudent).catch(() => {});
    }
    listeners.forEach((fn) => fn());
    return newStudent;
  },

  // Update existing student
  updateStudent: (student: Student): boolean => {
    if (typeof window === 'undefined') return false;
    const all = studentService.getAllStudents();
    const index = all.findIndex((s) => s.id === student.id || (student.roll && s.roll === student.roll && s.grade === student.grade));
    let updated: Student[];
    if (index !== -1) {
      updated = [...all];
      updated[index] = {
        ...all[index],
        ...student,
        photo: student.photo !== undefined ? student.photo : all[index].photo
      };
    } else {
      updated = deduplicateStudentList([student, ...all]);
    }
    try {
      localStorage.setItem('sms_students', JSON.stringify(updated));
      if (student.photo) {
        const pSaved = localStorage.getItem('sms_student_photos');
        const pMap = pSaved ? JSON.parse(pSaved) : {};
        if (student.id) pMap[student.id] = student.photo;
        if (student.roll) {
          pMap[student.roll] = student.photo;
          const g = (student.grade || student.gradeBn || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          if (g) pMap[`${g}_${student.roll}`] = student.photo;
        }
        localStorage.setItem('sms_student_photos', JSON.stringify(pMap));
      }
      syncQueueService.enqueue('student', student.id, 'UPDATE', student).catch(() => {});
    } catch (e) {
      console.error('Storage error in updateStudent:', e);
    }
    window.dispatchEvent(new Event('storage'));
    listeners.forEach((fn) => fn());
    return true;
  },

  // Save/Update student photo directly (bidirectionally linked with Admit Card)
  saveStudentPhoto: (studentId: string, photoDataUrl: string): boolean => {
    if (typeof window === 'undefined' || !studentId) return false;
    const all = studentService.getAllStudents();
    let index = all.findIndex((s) => s.id === studentId);
    if (index === -1) {
      index = all.findIndex((s) => s.roll === studentId);
    }
    if (index !== -1) {
      all[index] = { ...all[index], photo: photoDataUrl };
      try {
        localStorage.setItem('sms_students', JSON.stringify(all));
      } catch (e) {
        console.error('Storage error in saveStudentPhoto:', e);
      }
    }

    try {
      const pSaved = localStorage.getItem('sms_student_photos');
      const pMap = pSaved ? JSON.parse(pSaved) : {};
      pMap[studentId] = photoDataUrl;
      if (index !== -1) {
        const found = all[index];
        if (found.id) pMap[found.id] = photoDataUrl;
        if (found.roll) {
          pMap[found.roll] = photoDataUrl;
          const g = (found.grade || found.gradeBn || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          if (g) pMap[`${g}_${found.roll}`] = photoDataUrl;
        }
      }
      localStorage.setItem('sms_student_photos', JSON.stringify(pMap));
    } catch (e) {}

    window.dispatchEvent(new Event('storage'));
    listeners.forEach((fn) => fn());
    return true;
  },

  // Update only basic demographic info (for Class Teachers with limited edit rights)
  updateStudentBasicInfo: (
    studentId: string,
    basicInfo: {
      name?: string;
      guardian?: string;
      fatherName?: string;
      motherName?: string;
      mobile?: string;
      dob?: string;
      gender?: string;
      religion?: string;
      bloodGroup?: string;
      currentAddress?: string;
      permanentAddress?: string;
      photo?: string;
      remarks?: string;
    },
    modifiedBy: string = 'শ্রেণি শিক্ষক'
  ): { success: boolean; message: string; student?: Student } => {
    if (typeof window === 'undefined') return { success: false, message: 'ব্রাউজার অনুপস্থিত' };
    const all = studentService.getAllStudents();
    const index = all.findIndex((s) => s.id === studentId);
    if (index === -1) {
      return { success: false, message: 'শিক্ষার্থী পাওয়া যায়নি!' };
    }

    const current = all[index];
    // Strictly preserve academic fields: grade, roll, section, session, stipend, marks, etc.
    const updatedStudent: Student = {
      ...current,
      name: basicInfo.name !== undefined ? basicInfo.name.trim() : current.name,
      guardian: basicInfo.guardian !== undefined ? basicInfo.guardian.trim() : current.guardian,
      fatherName: basicInfo.fatherName !== undefined ? basicInfo.fatherName.trim() : current.fatherName,
      motherName: basicInfo.motherName !== undefined ? basicInfo.motherName.trim() : current.motherName,
      mobile: basicInfo.mobile !== undefined ? basicInfo.mobile.trim() : current.mobile,
      dob: basicInfo.dob !== undefined ? basicInfo.dob : current.dob,
      gender: basicInfo.gender !== undefined ? basicInfo.gender : current.gender,
      religion: basicInfo.religion !== undefined ? basicInfo.religion : current.religion,
      bloodGroup: basicInfo.bloodGroup !== undefined ? basicInfo.bloodGroup : current.bloodGroup,
      currentAddress: basicInfo.currentAddress !== undefined ? basicInfo.currentAddress.trim() : current.currentAddress,
      permanentAddress: basicInfo.permanentAddress !== undefined ? basicInfo.permanentAddress.trim() : current.permanentAddress,
      photo: basicInfo.photo !== undefined ? basicInfo.photo : current.photo,
      remarks: basicInfo.remarks !== undefined ? basicInfo.remarks.trim() : current.remarks,
    };

    all[index] = updatedStudent;
    localStorage.setItem('sms_students', JSON.stringify(all));
    syncQueueService.enqueue('student', updatedStudent.id, 'UPDATE', updatedStudent).catch(() => {});

    auditTrailService.addLog({
      action: 'UPDATE_STUDENT_BASIC_PROFILE',
      category: 'STUDENT',
      details: `শিক্ষার্থী '${updatedStudent.name}' (রোল: ${updatedStudent.roll}, শ্রেণি: ${updatedStudent.grade}) এর মৌলিক প্রোফাইল তথ্য এডিট করা হয়েছে`,
      performedBy: modifiedBy,
      status: 'SUCCESS'
    });

    window.dispatchEvent(new Event('storage'));
    listeners.forEach((fn) => fn());
    return { success: true, message: 'শিক্ষার্থীর মৌলিক তথ্য সফলভাবে আপডেট করা হয়েছে!', student: updatedStudent };
  },

  // Delete student by ID
  deleteStudent: (studentId: string): boolean => {
    if (typeof window === 'undefined') return false;
    const all = studentService.getAllStudents();
    const filtered = all.filter((s) => s.id !== studentId);
    localStorage.setItem('sms_students', JSON.stringify(filtered));
    window.dispatchEvent(new Event('storage'));
    listeners.forEach((fn) => fn());
    syncQueueService.enqueue('student', studentId, 'DELETE', { id: studentId }).catch(() => {});
    return true;
  },

  // Save Bulk Imported Students
  saveBulkStudents: (importedList: Student[]): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('sms_uploaded_students');

    const existing = studentService.getAllStudents();
    const merged = deduplicateStudentList([...importedList, ...existing]);

    localStorage.setItem('sms_students', JSON.stringify(merged));
    window.dispatchEvent(new Event('storage'));
    listeners.forEach((fn) => fn());
    importedList.forEach(st => {
      syncQueueService.enqueue('student', st.id, 'CREATE', st).catch(() => {});
    });
  },

  // Clear All Demo/Real Data & Reset DB completely (Synchronized across all system layers)
  clearAllDemoData: (comment?: string, performedBy?: string): SystemPurgeReport => {
    const report = systemResetService.purgeAllSystemData(comment, performedBy);
    listeners.forEach((fn) => fn());
    return report;
  },

  // Restore Default Demo Data (explicit admin action only)
  restoreDemoData: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('sms_demo_cleared');
    localStorage.removeItem('sms_students');
    localStorage.removeItem('sms_uploaded_students');
    localStorage.removeItem('school_ledger_records');
    localStorage.removeItem('sms_student_fee_ledgers');
    localStorage.removeItem('sms_payment_history');
    localStorage.removeItem('sms_vouchers_ledger');
    localStorage.removeItem('sms_payroll_records');
    localStorage.removeItem('sms_expense_records');
    localStorage.removeItem('sms_fee_invoices');
    localStorage.removeItem('sms_waivers');
    localStorage.removeItem('sms_refunds');
    window.dispatchEvent(new Event('storage'));
    listeners.forEach((fn) => fn());
  },

  // Bulk promote students to new grade/session
  promoteStudents: (studentIds: string[], targetGrade: string, targetSession: string = '২০২৭', groupOverride?: string): { success: boolean; message: string; count: number } => {
    if (typeof window === 'undefined') return { success: false, message: 'Browser environment missing', count: 0 };

    const all = studentService.getAllStudents();
    let updatedCount = 0;

    const updatedStudents = all.map(st => {
      if (studentIds.includes(st.id)) {
        updatedCount++;
        return {
          ...st,
          grade: targetGrade,
          session: targetSession,
          group: groupOverride || st.group || 'সাধারণ'
        };
      }
      return st;
    });

    localStorage.setItem('sms_students', JSON.stringify(updatedStudents));
    window.dispatchEvent(new Event('storage'));
    listeners.forEach((fn) => fn());

    return {
      success: true,
      message: `${updatedCount} জন শিক্ষার্থীকে সফলভাবে ${targetGrade} (সেশন ${targetSession}) এ প্রমোশন দেওয়া হয়েছে!`,
      count: updatedCount
    };
  },

  // Toggle stipend beneficiary status for a student
  toggleStipendStatus: (studentId: string, isStipend: boolean, category?: string): { success: boolean; message: string } => {
    if (typeof window === 'undefined') return { success: false, message: 'Browser window unavailable' };

    const all = studentService.getAllStudents();
    let found = false;

    const updated = all.map(st => {
      if (st.id === studentId) {
        found = true;
        return {
          ...st,
          isStipend,
          stipendCategory: category || st.stipendCategory || 'সাধারণ উপবৃত্তি',
          stipendStatus: isStipend ? 'Active' : 'Revoked'
        };
      }
      return st;
    });

    if (!found) {
      return { success: false, message: 'শিক্ষার্থী পাওয়া যায়নি' };
    }

    localStorage.setItem('sms_students', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
    listeners.forEach((fn) => fn());

    return { 
      success: true, 
      message: isStipend ? 'শিক্ষার্থীকে উপবৃত্তি প্রাপ্ত হিসেবে চিহ্নিত করা হয়েছে' : 'উপবৃত্তি সুবিধা বাতিল করা হয়েছে' 
    };
  },

  subscribe: (fn: () => void) => {
    listeners.push(fn);
    return () => {
      const idx = listeners.indexOf(fn);
      if (idx > -1) listeners.splice(idx, 1);
    };
  }
};
