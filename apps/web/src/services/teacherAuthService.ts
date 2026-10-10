'use client';

import { smsService } from './smsService';
import { settingsService } from './settingsService';

export interface TeacherAccount {
  id: string; // TCH-101
  name: string;
  designation: string;
  subject: string;
  qualification: string;
  mobile: string;
  phone?: string;
  email: string;
  password?: string; // Admin-configured password e.g. "123456"
  passwordHash?: string;
  isClassTeacherOf?: string; // e.g. "8th - A"
}

export interface UserSession {
  role: 'admin' | 'teacher';
  teacherId?: string;
  teacherName?: string;
}

// Helper: Normalize phone numbers (convert Bengali digits, remove dashes/spaces/country code)
export function normalizePhoneNumber(raw?: string): string {
  if (!raw) return '';
  // Convert Bengali numerals to ASCII digits
  const toAscii = raw.replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d)));
  // Extract digits only
  let digits = toAscii.replace(/\D/g, '');
  // Strip Bangladesh country code if present (+880 or 880)
  if (digits.startsWith('8801') && digits.length === 13) {
    digits = digits.slice(2);
  }
  return digits;
}

export const teacherAuthService = {
  // Get Current Active Session
  getSession: (): UserSession | null => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sms_current_session');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          console.error(e);
        }
      }
    }
    return null;
  },

  // Set Session
  setSession: (session: UserSession) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sms_current_session', JSON.stringify(session));
      window.dispatchEvent(new Event('storage'));
    }
  },

  // Get all registered teachers
  getAllTeachers: (): TeacherAccount[] => {
    if (typeof window === 'undefined') return [];
    let teachers: any[] = [];
    const storedRBAC = localStorage.getItem('sms_rbac_teachers');
    const storedTch = localStorage.getItem('sms_teachers_list');

    if (storedRBAC) {
      try { teachers = JSON.parse(storedRBAC); } catch (e) {}
    }
    if (teachers.length === 0 && storedTch) {
      try { teachers = JSON.parse(storedTch); } catch (e) {}
    }
    return teachers.map((t: any) => ({
      id: t.id,
      name: t.name,
      designation: t.designation || 'সহকারী শিক্ষক',
      subject: t.subject || 'সাধারণ',
      qualification: t.qualification || 'B.A / B.Sc',
      mobile: t.phone || t.mobile || '',
      phone: t.phone || t.mobile || '',
      email: t.email || `${t.id.toLowerCase()}@school.edu.bd`,
      password: t.password || t.passwordHash || '123456',
      passwordHash: t.passwordHash || t.password || '123456'
    }));
  },

  // Find a teacher by their Phone Number or ID
  findTeacherByPhone: (phoneOrId: string): TeacherAccount | undefined => {
    if (!phoneOrId) return undefined;
    const cleanDigits = normalizePhoneNumber(phoneOrId);
    const cleanLower = phoneOrId.trim().toLowerCase();
    const teachers = teacherAuthService.getAllTeachers();

    return teachers.find((t: any) => {
      const tDigits = normalizePhoneNumber(t.phone || t.mobile);
      return (
        (cleanDigits.length >= 10 && tDigits === cleanDigits) ||
        (t.id && t.id.toLowerCase() === cleanLower) ||
        (t.phone && t.phone.trim() === phoneOrId.trim()) ||
        (t.mobile && t.mobile.trim() === phoneOrId.trim())
      );
    });
  },

  // Unified Login (Teacher User ID is Phone Number, Admin is 'admin' or admin phone)
  unifiedLogin: (identifier: string, passwordInput: string): { success: boolean; message: string; role?: 'admin' | 'teacher'; teacher?: TeacherAccount } => {
    if (typeof window === 'undefined') return { success: false, message: 'ক্লিপবোর্ড বা ব্রাউজার অনুপস্থিত' };

    const cleanInput = identifier.trim();
    const cleanPass = passwordInput.trim();
    const inputDigits = normalizePhoneNumber(cleanInput);

    if (!cleanInput) {
      return { success: false, message: 'অনুগ্রহ করে ইউজার আইডি (ফোন নম্বর) লিখুন।' };
    }
    if (!cleanPass) {
      return { success: false, message: 'অনুগ্রহ করে পাসওয়ার্ড লিখুন।' };
    }

    // 1. Check Admin Credentials
    const storedAdminPass = localStorage.getItem('sms_admin_password') || 'admin123';
    const storedAdminPhone = (localStorage.getItem('sms_admin_phone') || 'admin').toLowerCase();
    const adminDigits = normalizePhoneNumber(storedAdminPhone);

    const isAdminIdentifier = 
      cleanInput.toLowerCase() === 'admin' || 
      cleanInput.toLowerCase() === 'headmaster' || 
      cleanInput.toLowerCase() === storedAdminPhone ||
      (inputDigits.length >= 10 && inputDigits === adminDigits) ||
      cleanInput === '01700000000';
    
    if (isAdminIdentifier && cleanPass === storedAdminPass) {
      const session: UserSession = { role: 'admin' };
      teacherAuthService.setSession(session);
      return { success: true, message: 'প্রধান শিক্ষক / অ্যাডমিন হিসেবে লগইন সফল হয়েছে!', role: 'admin' };
    }

    // 2. Check Teacher Accounts (Primary User ID = Teacher Phone Number)
    const teachers = teacherAuthService.getAllTeachers();

    const found = teachers.find((t: any) => {
      const tDigits = normalizePhoneNumber(t.phone || t.mobile);
      return (
        (inputDigits.length >= 10 && tDigits === inputDigits) ||
        (t.id && t.id.toLowerCase() === cleanInput.toLowerCase()) ||
        (t.phone && t.phone.trim().toLowerCase() === cleanInput.toLowerCase()) ||
        (t.mobile && t.mobile.trim().toLowerCase() === cleanInput.toLowerCase())
      );
    });

    if (found) {
      const validPass = found.passwordHash || found.password;
      if (validPass && cleanPass === validPass) {
        const session: UserSession = {
          role: 'teacher',
          teacherId: found.id,
          teacherName: found.name
        };
        teacherAuthService.setSession(session);
        return { success: true, message: `স্বাগতম ${found.name}! সফলভাবে লগইন হয়েছে।`, role: 'teacher', teacher: found };
      } else {
        return { success: false, message: 'পাসওয়ার্ডটি ভুল হয়েছে! অ্যাডমিন নির্ধারিত সঠিক পাসওয়ার্ড দিন।' };
      }
    }

    return { success: false, message: 'এই ফোন নম্বর/ইউজার আইডি দিয়ে কোনো শিক্ষক পাওয়া যায়নি! সঠিক নম্বর দিন।' };
  },

  loginTeacher: (identifier: string, passwordInput: string) => {
    return teacherAuthService.unifiedLogin(identifier, passwordInput);
  },

  // Set Admin Password (Admin functionality)
  setAdminPassword: (newPassword: string, newPhone?: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sms_admin_password', newPassword);
      if (newPhone) {
        localStorage.setItem('sms_admin_phone', newPhone);
      }
    }
  },

  // Set/Update Teacher Password (Admin functionality - 'পাসওয়ার্ড এডমিন সেটিংস করে দিবে')
  setTeacherPassword: (teacherId: string, newPassword: string) => {
    if (typeof window === 'undefined') return { success: false, message: 'ব্রাউজার এনভায়রনমেন্ট পাওয়া যায়নি' };

    let updated = false;
    // Update in sms_rbac_teachers
    const storedRBAC = localStorage.getItem('sms_rbac_teachers');
    if (storedRBAC) {
      try {
        const list = JSON.parse(storedRBAC);
        const next = list.map((t: any) => {
          if (t.id === teacherId) {
            updated = true;
            return { ...t, passwordHash: newPassword, password: newPassword, mustChangePassword: false };
          }
          return t;
        });
        localStorage.setItem('sms_rbac_teachers', JSON.stringify(next));
      } catch (e) {}
    }

    // Update in sms_teachers_list
    const storedTch = localStorage.getItem('sms_teachers_list');
    if (storedTch) {
      try {
        const list = JSON.parse(storedTch);
        const next = list.map((t: any) => {
          if (t.id === teacherId) {
            updated = true;
            return { ...t, password: newPassword, passwordHash: newPassword, mustChangePassword: false };
          }
          return t;
        });
        localStorage.setItem('sms_teachers_list', JSON.stringify(next));
      } catch (e) {}
    }

    window.dispatchEvent(new Event('storage'));
    return { success: true, message: 'শিক্ষকের পাসওয়ার্ড সফলভাবে আপডেট করা হয়েছে!' };
  },

  // ─── TEACHER OTP PASSWORD RESET ENGINE ─────────────────────────────────────

  // Step 1: Send OTP to Teacher's registered phone
  sendTeacherResetOTP: async (rawPhone: string): Promise<{ success: boolean; message: string; otp?: string; teacherName?: string }> => {
    const cleanDigits = normalizePhoneNumber(rawPhone);
    if (!cleanDigits || cleanDigits.length < 11) {
      return { success: false, message: 'অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 018XXXXXXXX)' };
    }

    const teacher = teacherAuthService.findTeacherByPhone(rawPhone);
    if (!teacher) {
      return {
        success: false,
        message: `এই মোবাইল নম্বর (${cleanDigits}) দিয়ে কোনো শিক্ষক নিবন্ধিত নেই। অনুগ্রহ করে প্রধান শিক্ষক / অ্যাডমিনের সাথে যোগাযোগ করুন।`
      };
    }

    const schoolSettings = settingsService.getSettings();
    const schoolName = schoolSettings?.schoolName || 'Boraitoli High School';

    try {
      const otpRes = await smsService.sendOTP(cleanDigits, teacher.name, schoolName);
      const generatedOtp = otpRes.otp;

      // Store OTP in localStorage with 5 minutes TTL
      if (typeof window !== 'undefined') {
        const otpRecord = {
          phone: cleanDigits,
          teacherId: teacher.id,
          otp: generatedOtp,
          expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes validity
        };
        localStorage.setItem(`sms_teacher_otp_${cleanDigits}`, JSON.stringify(otpRecord));
      }

      return {
        success: true,
        message: `শিক্ষক ${teacher.name}-এর মোবাইল নম্বরে (${cleanDigits}) একটি ৪ ডিজিটের OTP পাঠানো হয়েছে।`,
        otp: generatedOtp,
        teacherName: teacher.name
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'OTP পাঠাতে সমস্যা হয়েছে।'
      };
    }
  },

  // Step 2: Verify Teacher OTP
  verifyTeacherResetOTP: (rawPhone: string, enteredOtp: string): { success: boolean; message: string } => {
    const cleanDigits = normalizePhoneNumber(rawPhone);
    const cleanOtp = enteredOtp.trim();

    if (!cleanOtp || cleanOtp.length !== 4) {
      return { success: false, message: 'অনুগ্রহ করে ৪ ডিজিটের সঠিক OTP কোড লিখুন।' };
    }

    if (typeof window === 'undefined') return { success: false, message: 'সেশন পাওয়া যায়নি।' };

    const storedRaw = localStorage.getItem(`sms_teacher_otp_${cleanDigits}`);
    if (!storedRaw) {
      return { success: false, message: 'কোনো সক্রিয় OTP পাওয়া যায়নি বা সময় উত্তীর্ণ হয়েছে। আবার OTP পাঠান।' };
    }

    try {
      const record = JSON.parse(storedRaw);
      if (Date.now() > record.expiresAt) {
        localStorage.removeItem(`sms_teacher_otp_${cleanDigits}`);
        return { success: false, message: 'OTP কোডের মেয়াদ শেষ হয়ে গেছে (৫ মিনিট অতিক্রান্ত)। অনুগ্রহ করে পুনরায় OTP পাঠান।' };
      }

      if (record.otp !== cleanOtp) {
        return { success: false, message: 'ভুল OTP কোড! আপনার মোবাইলে প্রেরিত সঠিক ৪ ডিজিটের কোডটি দিন।' };
      }

      return { success: true, message: 'OTP সফলভাবে যাচাই হয়েছে! এবার নতুন পাসওয়ার্ড সেট করুন।' };
    } catch (e) {
      return { success: false, message: 'OTP যাচাইকরণে ত্রুটি হয়েছে।' };
    }
  },

  // Step 3: Complete Password Reset with Verified OTP
  resetTeacherPasswordWithOTP: (rawPhone: string, otp: string, newPassword: string): { success: boolean; message: string } => {
    const verifyRes = teacherAuthService.verifyTeacherResetOTP(rawPhone, otp);
    if (!verifyRes.success) {
      return verifyRes;
    }

    const cleanPass = newPassword.trim();
    if (!cleanPass || cleanPass.length < 4) {
      return { success: false, message: 'পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।' };
    }

    const cleanDigits = normalizePhoneNumber(rawPhone);
    const storedRaw = localStorage.getItem(`sms_teacher_otp_${cleanDigits}`);
    if (!storedRaw) {
      return { success: false, message: 'সেশন পাওয়া যায়নি।' };
    }

    const record = JSON.parse(storedRaw);
    const teacherId = record.teacherId;

    // Update password
    teacherAuthService.setTeacherPassword(teacherId, cleanPass);

    // Clear OTP from storage
    localStorage.removeItem(`sms_teacher_otp_${cleanDigits}`);

    return {
      success: true,
      message: 'অভিনন্দন! আপনার পাসওয়ার্ড সফলভাবে রিসেট হয়েছে। এখন নতুন পাসওয়ার্ড দিয়ে লগইন করুন।'
    };
  },

  // Logout
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sms_current_session');
      window.dispatchEvent(new Event('storage'));
    }
  },

  // Get Allocations for a specific Teacher
  getTeacherAllocations: (teacherId: string) => {
    if (typeof window === 'undefined') return { classTeacherOf: [], assignedSubjects: [] };

    let classTeacherOf: { grade: string; branch: string }[] = [];
    let assignedSubjects: { grade: string; branch: string; subjectName: string }[] = [];

    // Scan all keys starting with sms_teacher_allocation_
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sms_teacher_allocation_')) {
        const parts = key.split('_');
        const grade = parts[3];
        const branch = parts[4];
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (parsed.classTeacherId === teacherId) {
              classTeacherOf.push({ grade, branch });
            }
            if (parsed.subjects) {
              Object.entries(parsed.subjects).forEach(([subName, tchId]) => {
                if (tchId === teacherId) {
                  assignedSubjects.push({ grade, branch, subjectName: subName });
                }
              });
            }
          } catch (e) {}
        }
      }
    });

    return { classTeacherOf, assignedSubjects };
  }
};
