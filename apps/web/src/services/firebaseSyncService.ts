/**
 * ☁️ Google Firebase Cloud Sync Service
 * Handles live synchronization between local client storage (IndexedDB / LocalStorage)
 * and Google Cloud Firestore (Project: bhsedu-e0906).
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  writeBatch,
  onSnapshot,
  serverTimestamp,
  getCountFromServer,
  Unsubscribe,
  Firestore
} from 'firebase/firestore';
import { db, isFirebaseConfigured, firebaseConfig } from '../lib/firebase';
import { studentService, Student } from './studentService';
import { settingsService, SchoolSettings } from './settingsService';
import { classSectionService } from './classSectionService';
import { auditTrailService } from './auditTrailService';
import { landingPageService, LandingPageConfig } from './landingPageService';
import { noticeService, Notice } from './noticeService';
import { teacherAuthService, TeacherAccount } from './teacherAuthService';
import { canonicalizeLocalStorageKeys } from '../lib/storageMigration';

const ALLOWED_PUBLIC_APPLICATION_KEYS = new Set([
  'id', 'appId', 'studentName', 'studentNameEn', 'appliedClass',
  'section', 'branch', 'group', 'optionalSubject', 'dob', 'gender',
  'religion', 'bloodGroup', 'fatherName', 'fatherNid', 'fatherOcc',
  'motherName', 'motherNid', 'motherOcc', 'guardian', 'mobile',
  'phone', 'email', 'birthRegNo', 'prevSchoolName', 'prevGpa',
  'currentAddress', 'permanentAddress', 'photo', 'appliedAt', 'status'
]);

const ALLOWED_FEE_INVOICE_KEYS = new Set([
  'id', 'invoiceNo', 'invoiceId', 'studentId', 'studentName', 'roll',
  'mobile', 'grade', 'section', 'month', 'year', 'issueDate', 'dueDate',
  'items', 'subtotal', 'totalDiscount', 'waiverReason', 'totalPayable',
  'netPayable', 'totalPaid', 'paidAmount', 'dueAmount', 'status',
  'payments', 'notes', 'createdAt'
]);

const ALLOWED_FEE_LEDGER_KEYS = new Set([
  'id', 'studentId', 'studentName', 'roll', 'grade', 'section',
  'sessionYear', 'isStipend', 'stipendStartMonth', 'openingDue',
  'openingDuePaid', 'openingDueRemaining', 'openingDueNote',
  'openingDueSetDate', 'months', 'otherFees', 'totalBilled',
  'totalPaid', 'totalDiscount', 'totalDue', 'lastPaymentDate',
  'lastPaymentMethod', 'lastReceiptId'
]);

const ALLOWED_PAYROLL_KEYS = new Set([
  'id', 'voucherNo', 'teacherId', 'teacherName', 'designation',
  'month', 'year', 'baseSalary', 'allowances', 'bonus', 'deductions',
  'netPayable', 'paidAmount', 'status', 'paymentDate', 'paymentMethod',
  'trxId', 'note'
]);

const ALLOWED_EXPENSE_KEYS = new Set([
  'id', 'voucherNo', 'category', 'accountCode', 'amount', 'date',
  'paidTo', 'paymentMethod', 'note', 'recordedBy'
]);

const ALLOWED_LEDGER_KEYS = new Set([
  'id', 'type', 'category', 'grade', 'studentName', 'studentRoll',
  'amount', 'voucherNo', 'date', 'paymentMethod', 'description', 'createdByName'
]);

const ALLOWED_STIPEND_KEYS = new Set([
  'id', 'studentId', 'name', 'studentName', 'roll', 'grade', 'section',
  'group', 'mobile', 'isStipend', 'stipendCategory', 'stipendStatus',
  'stipendStartMonth', 'monthlyAmount', 'attRate', 'examMarkAvg',
  'isEligible', 'bankAccount', 'mobileBankingNo', 'remarks'
]);

const ALLOWED_TEACHER_LEAVE_KEYS = new Set([
  'id', 'teacherId', 'teacherName', 'designation', 'leaveType',
  'startDate', 'endDate', 'totalDays', 'reason', 'appliedAt',
  'status', 'reviewedBy', 'reviewedAt', 'remarks'
]);

const ALLOWED_CLASS_ROUTINE_KEYS = new Set([
  'id', 'classId', 'grade', 'branch', 'day', 'dayBn', 'periodNo',
  'subject', 'teacherId', 'teacherName', 'roomNo'
]);

const ALLOWED_SSC_TESTIMONIAL_KEYS = new Set([
  'id', 'studentId', 'studentName', 'fatherName', 'motherName',
  'village', 'postOffice', 'upazilla', 'upazila', 'district', 'dob',
  'dobWords', 'gender', 'schoolName', 'schoolNameEn', 'schoolAddress',
  'schoolAddressEn', 'eiin', 'boardName', 'centerName', 'group',
  'boardRoll', 'boardReg', 'session', 'passingYear', 'gpa', 'gradeLetter',
  'issueDate', 'refNo', 'characterRemarks'
]);

const VALID_ROUTINE_DAYS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];

export interface LandingPageCloudData {
  settings?: SchoolSettings;
  landingConfig?: LandingPageConfig;
  notices?: Notice[];
  teachers?: TeacherAccount[];
  totalStudents?: number;
}

export interface CloudSyncProgress {
  step: string;
  current: number;
  total: number;
  percent: number;
  status: 'idle' | 'syncing' | 'completed' | 'error';
  errorMessage?: string;
}

export interface CloudSyncStatus {
  isConfigured: boolean;
  projectId: string;
  isOnline: boolean;
  lastSyncTime: string | null;
  totalCloudStudents?: number;
}

const STORAGE_KEY_LAST_CLOUD_SYNC = 'sms_last_firebase_cloud_sync_time';
const CLOUD_FETCH_TIMEOUT_MS = 8000;

/** Bound a cloud promise so stalled DNS/ISPs resolve to fallback without hanging UI loads. */
function withTimeout<T>(promise: Promise<T>, ms: number = CLOUD_FETCH_TIMEOUT_MS): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return new Promise<T>((resolve, reject) => {
    timer = setTimeout(() => reject(new Error('Cloud request timed out')), ms);
    promise.then(resolve, reject);
  }).finally(() => {
    if (timer !== undefined) clearTimeout(timer);
  });
}

function isOfflineOrUnavailableError(err: any): boolean {
  const code = String(err?.code || '').toLowerCase();
  const msg = String(err?.message || '').toLowerCase();
  return (
    (typeof navigator !== 'undefined' && !navigator.onLine) ||
    code === 'unavailable' ||
    msg.includes('offline') ||
    msg.includes('timed out') ||
    msg.includes('network')
  );
}

class FirebaseSyncService {
  private activeStudentsUnsub: Unsubscribe | null = null;
  private activeSettingsUnsub: Unsubscribe | null = null;

  /**
   * Check current Cloud Firestore connectivity status
   */
  public async testConnection(): Promise<{ success: boolean; message: string; latencyMs?: number }> {
    if (!db || !isFirebaseConfigured()) {
      return { success: false, message: 'ফায়ারবেস কনফিগারেশন পাওয়া যায়নি।' };
    }

    const start = Date.now();
    try {
      const firestore = db as Firestore;
      // Ping a dedicated healthcheck document
      const pingRef = doc(firestore, '_system_health', 'ping');
      await setDoc(pingRef, {
        timestamp: serverTimestamp(),
        client: 'Next.js School Web App',
        project: firebaseConfig.projectId
      }, { merge: true });

      const latencyMs = Date.now() - start;
      return {
        success: true,
        message: `গুগল ক্লাউড ফায়ারবেস সফলভাবে সংযুক্ত (${latencyMs}ms)`,
        latencyMs
      };
    } catch (error: any) {
      console.warn('[FirebaseSync] Connection test failed:', error);
      return {
        success: false,
        message: error?.message || 'ক্লাউড সংযোগ স্থাপন করা সম্ভব হয়নি।'
      };
    }
  }

  /**
   * Get current sync status summary
   */
  public getStatus(): CloudSyncStatus {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : false;
    const lastSyncTime = typeof window !== 'undefined' 
      ? localStorage.getItem(STORAGE_KEY_LAST_CLOUD_SYNC) 
      : null;

    return {
      isConfigured: isFirebaseConfigured(),
      projectId: firebaseConfig.projectId,
      isOnline,
      lastSyncTime
    };
  }

  /**
   * Upload all local database collections to Google Cloud Firestore in batches
   */
  public async uploadAllToCloud(
    onProgress?: (p: CloudSyncProgress) => void
  ): Promise<{ success: boolean; uploadedCount: number; message: string }> {
    if (!db) {
      throw new Error('ফায়ারবেস ডাটাবেজ অবজেক্ট পাওয়া যায়নি।');
    }
    const firestore = db as Firestore;

    const reportProgress = (step: string, current: number, total: number) => {
      const percent = total > 0 ? Math.round((current / total) * 100) : 0;
      if (onProgress) {
        onProgress({
          step,
          current,
          total,
          percent,
          status: 'syncing'
        });
      }
    };

    try {
      canonicalizeLocalStorageKeys();
      reportProgress('স্কুল সেটিংস ক্লাউডে পাঠানো হচ্ছে...', 0, 100);

      // 1. Settings Collection
      const currentSettings = settingsService.getSettings();
      const settingsRef = doc(firestore, 'settings', 'general');
      await setDoc(settingsRef, {
        ...currentSettings,
        updatedAt: serverTimestamp(),
        schoolId: firebaseConfig.projectId
      }, { merge: true });

      reportProgress('ল্যান্ডিং পেইজ ও নোটিশ ক্লাউডে পাঠানো হচ্ছে...', 10, 100);

      // 2. Landing Page Published Config
      try {
        const publishedLanding = landingPageService.getPublishedConfig();
        const landingRef = doc(firestore, 'landing_page', 'published');
        await setDoc(landingRef, {
          ...publishedLanding,
          updatedAt: serverTimestamp(),
          schoolId: firebaseConfig.projectId
        }, { merge: true });
      } catch (err) {
        console.warn('[FirebaseSync] Landing page config upload warning:', err);
      }

      // 3. Notices Collection
      try {
        const notices = noticeService.getNotices();
        if (notices.length > 0) {
          const noticeBatch = writeBatch(firestore);
          notices.forEach((n) => {
            const nRef = doc(firestore, 'notices', n.id);
            noticeBatch.set(nRef, { ...n, updatedAt: serverTimestamp(), schoolId: firebaseConfig.projectId }, { merge: true });
          });
          await noticeBatch.commit();
        }
      } catch (err) {
        console.warn('[FirebaseSync] Notices upload warning:', err);
      }

      // 4. Teachers Collection (Public Directory)
      try {
        const teachers = teacherAuthService.getAllTeachers();
        if (teachers.length > 0) {
          const teacherBatch = writeBatch(firestore);
          teachers.forEach((t) => {
            const tRef = doc(firestore, 'teachers', t.id);
            const { password, passwordHash, ...safeTeacher } = t;
            teacherBatch.set(tRef, { ...safeTeacher, updatedAt: serverTimestamp(), schoolId: firebaseConfig.projectId }, { merge: true });
          });
          await teacherBatch.commit();
        }
      } catch (err) {
        console.warn('[FirebaseSync] Teachers upload warning:', err);
      }

      reportProgress('ক্লাস ও সেকশন ক্লাউডে পাঠানো হচ্ছে...', 20, 100);

      // 5. Classes & Sections Collection
      const classes = classSectionService.getClasses();
      if (classes.length > 0) {
        const classBatch = writeBatch(firestore);
        classes.forEach((cls) => {
          const clsRef = doc(firestore, 'classes', cls.id || `cls-${cls.gradeNumber || cls.code}`);
          classBatch.set(clsRef, { ...cls, updatedAt: serverTimestamp() }, { merge: true });
        });
        await classBatch.commit();
      }

      reportProgress('শিক্ষার্থীদের ডাটা প্রস্তুত করা হচ্ছে...', 30, 100);

      // 3. Students Collection
      const students = studentService.getAllStudents();
      const totalStudents = students.length;
      let uploadedStudents = 0;

      if (totalStudents > 0) {
        // Firestore batch max size is 500 operations
        const BATCH_SIZE = 400;
        for (let i = 0; i < totalStudents; i += BATCH_SIZE) {
          const chunk = students.slice(i, i + BATCH_SIZE);
          const batch = writeBatch(firestore);

          chunk.forEach((st) => {
            const studentId = st.id || `st_${st.grade}_${st.roll}_${Date.now()}`;
            const stRef = doc(firestore, 'students', studentId);
            batch.set(stRef, {
              ...st,
              id: studentId,
              updatedAt: serverTimestamp(),
              schoolId: firebaseConfig.projectId
            }, { merge: true });
          });

          await batch.commit();
          uploadedStudents += chunk.length;

           const studentPercent = 25 + Math.round((uploadedStudents / totalStudents) * 50);
           reportProgress(
             `শিক্ষার্থী আপলোড হচ্ছে (${uploadedStudents}/${totalStudents})...`,
             studentPercent,
             100
           );
         }
       }

      // 6. Certificates, Exams, Marks, Attendance, Online Applications & Finance
      if (typeof window !== 'undefined') {
        reportProgress('সনদপত্র, পরীক্ষার ফলাফল ও হাজিরা ক্লাউডে সংরক্ষণ হচ্ছে...', 80, 100);

        // 6a. Certificates History
        try {
          const rawCerts = localStorage.getItem('sms_certificates_history');
          if (rawCerts) {
            const certs: any[] = JSON.parse(rawCerts);
            if (Array.isArray(certs) && certs.length > 0) {
              const certBatch = writeBatch(firestore);
              certs.slice(0, 450).forEach((c) => {
                if (c && c.id) {
                  const cRef = doc(firestore, 'certificates', String(c.id));
                  certBatch.set(cRef, { ...c, updatedAt: serverTimestamp(), schoolId: firebaseConfig.projectId }, { merge: true });
                }
              });
              await certBatch.commit();
            }
          }
        } catch (err) {
          console.warn('[FirebaseSync] Certificates upload warning:', err);
        }

        // 6b. Exam Setup (sms_exam_setup)
        try {
          const rawExams = localStorage.getItem('sms_exam_setup');
          if (rawExams) {
            const exams = JSON.parse(rawExams);
            await setDoc(doc(firestore, 'academic_data', 'exam_setup'), {
              exams,
              updatedAt: serverTimestamp(),
              schoolId: firebaseConfig.projectId
            }, { merge: true });
          }
        } catch (err) {
          console.warn('[FirebaseSync] Exam setup upload warning:', err);
        }

        // 6c. Exam Marks (sms_marks_*) & Attendance (sms_attendance_*)
        try {
          const allLocalKeys = Object.keys(localStorage);
          const markKeys = allLocalKeys.filter((k) => k.startsWith('sms_marks_'));
          for (let i = 0; i < markKeys.length; i += 350) {
            const chunk = markKeys.slice(i, i + 350);
            const markBatch = writeBatch(firestore);
            chunk.forEach((k) => {
              const val = localStorage.getItem(k);
              if (val) {
                const safeDocId = encodeURIComponent(k).replace(/\./g, '%2E');
                const mRef = doc(firestore, 'exam_marks', safeDocId);
                markBatch.set(mRef, {
                  storageKey: k,
                  value: val,
                  updatedAt: serverTimestamp(),
                  schoolId: firebaseConfig.projectId
                }, { merge: true });
              }
            });
            await markBatch.commit();
          }

          const attKeys = allLocalKeys.filter((k) => k.startsWith('sms_attendance_'));
          for (let i = 0; i < attKeys.length; i += 350) {
            const chunk = attKeys.slice(i, i + 350);
            const attBatch = writeBatch(firestore);
            chunk.forEach((k) => {
              const val = localStorage.getItem(k);
              if (val) {
                const safeDocId = encodeURIComponent(k).replace(/\./g, '%2E');
                const aRef = doc(firestore, 'attendance_records', safeDocId);
                attBatch.set(aRef, {
                  storageKey: k,
                  value: val,
                  updatedAt: serverTimestamp(),
                  schoolId: firebaseConfig.projectId
                }, { merge: true });
              }
            });
            await attBatch.commit();
          }
        } catch (err) {
          console.warn('[FirebaseSync] Marks/Attendance upload warning:', err);
        }

        // 6d. Online Applications (sms_online_applications)
        try {
          const rawApps = localStorage.getItem('sms_online_applications');
          if (rawApps) {
            const apps: any[] = JSON.parse(rawApps);
            if (Array.isArray(apps) && apps.length > 0) {
              const adminAppAllowed = new Set([
                ...ALLOWED_PUBLIC_APPLICATION_KEYS,
                'reviewedBy', 'reviewedAt', 'adminRemarks', 'admittedStudentId',
              ]);
              const normalizedApps = apps
                .filter((ap) => ap && (ap.studentName || ap.name))
                .map((ap) => {
                  const docId = String(ap.appId || ap.id || `app_${Date.now()}`);
                  const rawStatus = String(ap.status || 'pending').toLowerCase();
                  const status = ['pending', 'approved', 'rejected', 'admitted'].includes(rawStatus)
                    ? rawStatus
                    : 'pending';
                  const candidate = {
                    ...ap,
                    id: docId,
                    appId: String(ap.appId || docId),
                    studentName: String(ap.studentName || ap.name),
                    ...(ap.studentNameEn || ap.nameEn
                      ? { studentNameEn: String(ap.studentNameEn || ap.nameEn) }
                      : {}),
                    appliedClass: String(ap.appliedClass || ap.grade || '6th'),
                    status,
                  };
                  return { docId, data: this.sanitizeFirestoreObject(candidate, adminAppAllowed) };
                });
              await this.uploadCollectionDocs(firestore, 'online_applications', normalizedApps);
            }
          }
        } catch (err) {
          console.warn('[FirebaseSync] Online applications upload warning:', err);
        }

        reportProgress('আর্থিক, রুটিন, ছুটি ও উপবৃত্তি তথ্য সিঙ্ক হচ্ছে...', 85, 100);
        await this.uploadExtendedModulesToCloud(firestore);
      }

      // Mark successful sync timestamp
      const now = new Date().toISOString();
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_LAST_CLOUD_SYNC, now);
      }

      auditTrailService.addLog({
        action: 'FIREBASE_CLOUD_SYNC_UPLOAD',
        category: 'Cloud Backup',
        details: `ক্লাউডে ${uploadedStudents} জন শিক্ষার্থী ও সেটিংস সফলভাবে আপলোড হয়েছে।`,
        performedBy: 'অ্যাডমিন',
        severity: 'info',
        status: 'Success'
      });

      if (onProgress) {
        onProgress({
          step: 'সম্পূর্ণ সফলভাবে ক্লাউড ব্যাকআপ সম্পন্ন হয়েছে!',
          current: 100,
          total: 100,
          percent: 100,
          status: 'completed'
        });
      }

      return {
        success: true,
        uploadedCount: uploadedStudents,
        message: `${uploadedStudents} জন শিক্ষার্থীর ডাটা ও প্রতিষ্ঠানের সেটিংস গুগল ফায়ারবেস ক্লাউডে সফলভাবে সেভ করা হয়েছে।`
      };
    } catch (err: any) {
      if (isOfflineOrUnavailableError(err)) {
        console.warn('[FirebaseSync] uploadAllToCloud offline/unavailable:', err?.message || err);
      } else {
        console.error('[FirebaseSync] uploadAllToCloud failed:', err);
      }
      if (onProgress) {
        onProgress({
          step: 'ক্লাউড আপলোডে ত্রুটি দেখা দিয়েছে।',
          current: 0,
          total: 100,
          percent: 0,
          status: 'error',
          errorMessage: err?.message || 'অজানা ত্রুটি'
        });
      }
      throw err;
    }
  }

  /**
   * Pull all records from Google Cloud Firestore down to the local browser storage
   */
  public async pullAllFromCloud(
    onProgress?: (p: CloudSyncProgress) => void
  ): Promise<{ success: boolean; studentCount: number; message: string }> {
    if (!db) {
      throw new Error('ফায়ারবেস ডাটাবেজ অবজেক্ট পাওয়া যায়নি।');
    }
    const firestore = db as Firestore;

    if (onProgress) {
      onProgress({
        step: 'ক্লাউড থেকে তথ্য নামানো হচ্ছে...',
        current: 10,
        total: 100,
        percent: 10,
        status: 'syncing'
      });
    }

    try {
      canonicalizeLocalStorageKeys();
      // 1. Pull Settings
      const settingsRef = doc(firestore, 'settings', 'general');
      const settingsSnap = await getDoc(settingsRef);
      if (settingsSnap.exists()) {
        const cloudSettings = settingsSnap.data() as SchoolSettings;
        settingsService.updateSettings(cloudSettings);
      }

      // 2. Pull Landing Page Published Config
      try {
        const landingRef = doc(firestore, 'landing_page', 'published');
        const landingSnap = await getDoc(landingRef);
        if (landingSnap.exists()) {
          const cloudLanding = landingSnap.data() as LandingPageConfig;
          if (typeof window !== 'undefined') {
            localStorage.setItem('sms_landing_published', JSON.stringify(cloudLanding));
            localStorage.setItem('sms_landing_draft', JSON.stringify(cloudLanding));
          }
        }
      } catch (err) {
        console.warn('[FirebaseSync] Pull landing page config skipped:', err);
      }

      // 3. Pull Notices
      try {
        const noticesRef = collection(firestore, 'notices');
        const noticesSnap = await getDocs(noticesRef);
        const cloudNotices: Notice[] = [];
        noticesSnap.forEach((docSnap) => {
          cloudNotices.push({ ...docSnap.data(), id: docSnap.id } as Notice);
        });
        if (cloudNotices.length > 0 && typeof window !== 'undefined') {
          localStorage.setItem('sms_notices', JSON.stringify(cloudNotices));
        }
      } catch (err) {
        console.warn('[FirebaseSync] Pull notices skipped:', err);
      }

      // 4. Pull Teachers
      try {
        const teachersRef = collection(firestore, 'teachers');
        const teachersSnap = await getDocs(teachersRef);
        const cloudTeachers: any[] = [];
        teachersSnap.forEach((docSnap) => {
          cloudTeachers.push({ ...docSnap.data(), id: docSnap.id });
        });
        if (cloudTeachers.length > 0 && typeof window !== 'undefined') {
          localStorage.setItem('sms_rbac_teachers', JSON.stringify(cloudTeachers));
          localStorage.setItem('sms_teachers_list', JSON.stringify(cloudTeachers));
        }
      } catch (err) {
        console.warn('[FirebaseSync] Pull teachers skipped:', err);
      }

      if (onProgress) {
        onProgress({
          step: 'শিক্ষার্থীদের তালিকা সংগ্রহ করা হচ্ছে...',
          current: 40,
          total: 100,
          percent: 40,
          status: 'syncing'
        });
      }

      // 5. Pull Students
      const studentsRef = collection(firestore, 'students');
      const querySnap = await getDocs(studentsRef);
      const cloudStudents: Student[] = [];

      querySnap.forEach((docSnap) => {
        const data = docSnap.data() as Student;
        cloudStudents.push({
          ...data,
          id: docSnap.id
        });
      });

      if (cloudStudents.length > 0 && typeof window !== 'undefined') {
        localStorage.setItem('sms_students', JSON.stringify(cloudStudents));
        // Trigger student listeners
        studentService.getAllStudents();
      }

      // 6. Pull Certificates, Exam Setup, Exam Marks, Attendance & Online Applications
      if (typeof window !== 'undefined') {
        if (onProgress) {
          onProgress({
            step: 'পরীক্ষার ফলাফল, সনদপত্র ও হাজিরা সিঙ্ক হচ্ছে...',
            current: 75,
            total: 100,
            percent: 75,
            status: 'syncing'
          });
        }

        // 6a. Pull Certificates
        try {
          const certsSnap = await getDocs(collection(firestore, 'certificates'));
          const cloudCerts: any[] = [];
          certsSnap.forEach((d) => cloudCerts.push({ ...d.data(), id: d.id }));
          if (cloudCerts.length > 0) {
            localStorage.setItem('sms_certificates_history', JSON.stringify(cloudCerts));
          }
        } catch (err) {
          console.warn('[FirebaseSync] Pull certificates skipped:', err);
        }

        // 6b. Pull Exam Setup
        try {
          const examDoc = await getDoc(doc(firestore, 'academic_data', 'exam_setup'));
          if (examDoc.exists()) {
            const data = examDoc.data();
            if (Array.isArray(data?.exams) && data.exams.length > 0) {
              localStorage.setItem('sms_exam_setup', JSON.stringify(data.exams));
            }
          }
        } catch (err) {
          console.warn('[FirebaseSync] Pull exam setup skipped:', err);
        }

        // 6c. Pull Exam Marks
        try {
          const marksSnap = await getDocs(collection(firestore, 'exam_marks'));
          marksSnap.forEach((d) => {
            const data = d.data();
            if (data?.storageKey && typeof data?.value === 'string') {
              localStorage.setItem(data.storageKey, data.value);
            }
          });
        } catch (err) {
          console.warn('[FirebaseSync] Pull exam marks skipped:', err);
        }

        // 6d. Pull Attendance Records
        try {
          const attSnap = await getDocs(collection(firestore, 'attendance_records'));
          attSnap.forEach((d) => {
            const data = d.data();
            if (data?.storageKey && typeof data?.value === 'string') {
              localStorage.setItem(data.storageKey, data.value);
            }
          });
        } catch (err) {
          console.warn('[FirebaseSync] Pull attendance skipped:', err);
        }

        // 6e. Pull Online Applications
        try {
          const appsSnap = await getDocs(collection(firestore, 'online_applications'));
          const cloudApps: any[] = [];
          appsSnap.forEach((d) => cloudApps.push({ ...d.data(), id: d.id }));
          if (cloudApps.length > 0) {
            localStorage.setItem('sms_online_applications', JSON.stringify(cloudApps));
          }
        } catch (err) {
          console.warn('[FirebaseSync] Pull online applications skipped:', err);
        }

        await this.pullExtendedModulesFromCloud(firestore);
      }

      const now = new Date().toISOString();
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_LAST_CLOUD_SYNC, now);
      }

      if (onProgress) {
        onProgress({
          step: 'ক্লাউড থেকে ডাটা সিঙ্ক সম্পন্ন হয়েছে!',
          current: 100,
          total: 100,
          percent: 100,
          status: 'completed'
        });
      }

      auditTrailService.addLog({
        action: 'FIREBASE_CLOUD_SYNC_PULL',
        category: 'Cloud Restore',
        details: `ক্লাউড থেকে ${cloudStudents.length} জন শিক্ষার্থীর ডাটা লোকাল ডিভাইসে রিস্টোর করা হয়েছে।`,
        performedBy: 'অ্যাডমিন',
        severity: 'info',
        status: 'Success'
      });

      return {
        success: true,
        studentCount: cloudStudents.length,
        message: `ক্লাউড থেকে ${cloudStudents.length} জন শিক্ষার্থীর তথ্য সফলভাবে ডিভাইসে সিঙ্ক করা হয়েছে।`
      };
    } catch (err: any) {
      if (isOfflineOrUnavailableError(err)) {
        console.warn('[FirebaseSync] pullAllFromCloud offline/unavailable:', err?.message || err);
      } else {
        console.error('[FirebaseSync] pullAllFromCloud failed:', err);
      }
      if (onProgress) {
        onProgress({
          step: 'ক্লাউড থেকে ডাটা নামাতে ব্যর্থ হয়েছে।',
          current: 0,
          total: 100,
          percent: 0,
          status: 'error',
          errorMessage: err?.message || 'অজানা ত্রুটি'
        });
      }
      throw err;
    }
  }

  /**
   * Instant single student auto-sync to Firestore
   */
  public async syncStudent(student: Student): Promise<void> {
    if (!db || typeof navigator === 'undefined' || !navigator.onLine) return;
    try {
      const firestore = db as Firestore;
      const studentId = student.id || `st_${student.grade}_${student.roll}_${Date.now()}`;
      const stRef = doc(firestore, 'students', studentId);
      await setDoc(stRef, {
        ...student,
        id: studentId,
        updatedAt: serverTimestamp(),
        schoolId: firebaseConfig.projectId
      }, { merge: true });
    } catch (err) {
      console.warn('[FirebaseSync] Single student auto-sync failed (queued offline):', err);
    }
  }

  /**
   * Instant single student deletion from Firestore
   */
  public async deleteStudent(studentId: string): Promise<void> {
    if (!db || typeof navigator === 'undefined' || !navigator.onLine) return;
    try {
      const firestore = db as Firestore;
      const stRef = doc(firestore, 'students', studentId);
      await deleteDoc(stRef);
    } catch (err) {
      console.warn('[FirebaseSync] Single student deletion failed in cloud:', err);
    }
  }

  /**
   * Real-time listener for students changes
   */
  public subscribeToStudents(callback: (students: Student[]) => void): Unsubscribe | null {
    if (!db || typeof window === 'undefined') return null;
    try {
      const firestore = db as Firestore;
      const studentsRef = collection(firestore, 'students');
      this.activeStudentsUnsub = onSnapshot(studentsRef, (snapshot) => {
        const students: Student[] = [];
        snapshot.forEach((doc) => {
          students.push({ ...doc.data(), id: doc.id } as Student);
        });
        callback(students);
      }, (err) => {
        console.warn('[FirebaseSync] Student subscription warning:', err);
      });
      return this.activeStudentsUnsub;
    } catch (err) {
      return null;
    }
  }

  /**
   * Instant settings auto-sync to Firestore doc 'settings/general'
   */
  public async syncSettingsToCloud(settings: Partial<SchoolSettings>): Promise<void> {
    if (!db || typeof navigator === 'undefined' || !navigator.onLine) return;
    try {
      const firestore = db as Firestore;
      const settingsRef = doc(firestore, 'settings', 'general');
      await setDoc(settingsRef, {
        ...settings,
        updatedAt: serverTimestamp(),
        schoolId: firebaseConfig.projectId
      }, { merge: true });
    } catch (err) {
      console.warn('[FirebaseSync] Cloud settings sync warning:', err);
    }
  }

  /**
   * Instant landing page published config auto-sync to Firestore doc 'landing_page/published'
   */
  public async syncLandingConfigToCloud(config: LandingPageConfig): Promise<void> {
    if (!db || typeof navigator === 'undefined' || !navigator.onLine) return;
    try {
      const firestore = db as Firestore;
      const landingRef = doc(firestore, 'landing_page', 'published');
      await setDoc(landingRef, {
        ...config,
        updatedAt: serverTimestamp(),
        schoolId: firebaseConfig.projectId
      }, { merge: true });
    } catch (err) {
      console.warn('[FirebaseSync] Cloud landing page sync warning:', err);
    }
  }

  /**
   * Instant notice auto-sync to Firestore collection 'notices'
   */
  public async syncNoticeToCloud(notice: Notice): Promise<void> {
    if (!db || typeof navigator === 'undefined' || !navigator.onLine) return;
    try {
      const firestore = db as Firestore;
      const noticeRef = doc(firestore, 'notices', notice.id);
      await setDoc(noticeRef, {
        ...notice,
        updatedAt: serverTimestamp(),
        schoolId: firebaseConfig.projectId
      }, { merge: true });
    } catch (err) {
      console.warn('[FirebaseSync] Cloud notice sync warning:', err);
    }
  }

  /**
   * Instant notice deletion from Firestore collection 'notices'
   */
  public async deleteNoticeFromCloud(noticeId: string): Promise<void> {
    if (!db || typeof navigator === 'undefined' || !navigator.onLine) return;
    try {
      const firestore = db as Firestore;
      const noticeRef = doc(firestore, 'notices', noticeId);
      await deleteDoc(noticeRef);
    } catch (err) {
      console.warn('[FirebaseSync] Cloud notice deletion warning:', err);
    }
  }

  /**
   * 🌐 Fetch complete public landing page data directly from Google Cloud Firestore
   * Enables anonymous visitors on any browser or mobile device to load real school data
   */
  public async fetchLandingPageCloudData(): Promise<LandingPageCloudData> {
    if (!db || !isFirebaseConfigured()) return {};
    if (typeof navigator !== 'undefined' && !navigator.onLine) return {};
    try {
      const firestore = db as Firestore;
      const result: LandingPageCloudData = {};

      const [settingsRes, landingRes, noticesRes, countRes] = await Promise.allSettled([
        withTimeout(getDoc(doc(firestore, 'settings', 'general'))),
        withTimeout(getDoc(doc(firestore, 'landing_page', 'published'))),
        withTimeout(getDocs(collection(firestore, 'notices'))),
        withTimeout(getCountFromServer(collection(firestore, 'students'))),
      ]);

      if (settingsRes.status === 'fulfilled' && settingsRes.value.exists()) {
        result.settings = settingsRes.value.data() as SchoolSettings;
      }

      if (landingRes.status === 'fulfilled' && landingRes.value.exists()) {
        result.landingConfig = landingRes.value.data() as LandingPageConfig;
      }

      if (noticesRes.status === 'fulfilled') {
        const noticesList: Notice[] = [];
        noticesRes.value.forEach((docSnap) => {
          noticesList.push({ ...docSnap.data(), id: docSnap.id } as Notice);
        });
        if (noticesList.length > 0) {
          noticesList.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
          });
          result.notices = noticesList;
        }
      }

      if (countRes.status === 'fulfilled') {
        result.totalStudents = countRes.value.data().count;
      }

      return result;
    } catch (err) {
      console.warn('[FirebaseSync] fetchLandingPageCloudData fallback to local:', err);
      return {};
    }
  }

  /**
   * 📡 Subscribe to real-time changes on Landing Page documents (Settings, CMS, Notices)
   * Defers listener attachment while offline and attaches automatically when online.
   */
  public subscribeLandingPageCloud(
    callback: (data: LandingPageCloudData) => void
  ): () => void {
    if (!db || typeof window === 'undefined') return () => {};

    let disposed = false;
    let unsubList: Unsubscribe[] = [];

    const attachListeners = () => {
      if (disposed || unsubList.length > 0) return;
      try {
        const firestore = db as Firestore;

        const unsubSettings = onSnapshot(
          doc(firestore, 'settings', 'general'),
          (snap) => {
            if (snap.exists()) {
              callback({ settings: snap.data() as SchoolSettings });
            }
          },
          (err) => console.warn('[FirebaseSync] Cloud settings snapshot warning:', err)
        );

        const unsubLanding = onSnapshot(
          doc(firestore, 'landing_page', 'published'),
          (snap) => {
            if (snap.exists()) {
              callback({ landingConfig: snap.data() as LandingPageConfig });
            }
          },
          (err) => console.warn('[FirebaseSync] Cloud landing snapshot warning:', err)
        );

        const unsubNotices = onSnapshot(
          collection(firestore, 'notices'),
          (snap) => {
            const notices: Notice[] = [];
            snap.forEach((d) => notices.push({ ...d.data(), id: d.id } as Notice));
            notices.sort((a, b) => {
              if (a.isPinned && !b.isPinned) return -1;
              if (!a.isPinned && b.isPinned) return 1;
              return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
            });
            callback({ notices });
          },
          (err) => console.warn('[FirebaseSync] Cloud notices snapshot warning:', err)
        );

        unsubList = [unsubSettings, unsubLanding, unsubNotices];
      } catch (err) {
        console.warn('[FirebaseSync] subscribeLandingPageCloud warning:', err);
      }
    };

    const handleOnline = () => attachListeners();

    if (typeof navigator === 'undefined' || navigator.onLine) {
      attachListeners();
    } else {
      window.addEventListener('online', handleOnline, { once: true });
    }

    return () => {
      disposed = true;
      window.removeEventListener('online', handleOnline);
      unsubList.forEach((fn) => fn());
      unsubList = [];
    };
  }

  /**
   * 📜 Instant Certificate Auto-Sync to Firestore ('certificates' collection)
   */
  public async syncCertificateToCloud(cert: any): Promise<void> {
    if (!db || !cert?.id || typeof navigator === 'undefined' || !navigator.onLine) return;
    try {
      const firestore = db as Firestore;
      const safeDocId = String(cert.id).replace(/\//g, '_');
      const certRef = doc(firestore, 'certificates', safeDocId);
      const cleanCert = JSON.parse(JSON.stringify(cert));
      await setDoc(certRef, {
        ...cleanCert,
        updatedAt: serverTimestamp(),
        schoolId: firebaseConfig.projectId
      }, { merge: true });
    } catch (err) {
      console.warn('[FirebaseSync] Certificate cloud sync warning:', err);
    }
  }

  /**
   * 🗑️ Instant Certificate Deletion from Firestore
   */
  public async deleteCertificateFromCloud(certId: string): Promise<void> {
    if (!db || !certId || typeof navigator === 'undefined' || !navigator.onLine) return;
    try {
      const firestore = db as Firestore;
      const safeDocId = String(certId).replace(/\//g, '_');
      await deleteDoc(doc(firestore, 'certificates', safeDocId));
    } catch (err) {
      console.warn('[FirebaseSync] Certificate cloud delete warning:', err);
    }
  }

  /**
   * 🔍 Public Certificate Verification from Cloud Firestore
   * Enables mobile QR scanners on any device to verify official school certificates
   */
  public async fetchCertificateFromCloudById(idOrCode: string): Promise<any | null> {
    if (!db || !idOrCode) return null;
    try {
      const firestore = db as Firestore;
      const queryClean = idOrCode.trim();
      const safeDocId = queryClean.replace(/\//g, '_');
      const queryLower = queryClean.toLowerCase();

      // 1. Try direct document ID lookup first
      const directSnap = await getDoc(doc(firestore, 'certificates', safeDocId));
      if (directSnap.exists()) {
        const data = directSnap.data();
        return { ...data, id: data.id || directSnap.id };
      }

      // 2. Scan certificates collection for case-insensitive ID, verificationCode, or refNo match
      const certsSnap = await getDocs(collection(firestore, 'certificates'));
      let matched: any | null = null;
      const allCloudCerts: any[] = [];

      certsSnap.forEach((d) => {
        const data = { ...d.data(), id: d.data().id || d.id } as any;
        allCloudCerts.push(data);
        if (
          data.id?.toLowerCase() === queryLower ||
          data.verificationCode?.toLowerCase() === queryLower ||
          data.refNo?.toLowerCase() === queryLower
        ) {
          matched = data;
        }
      });

      if (allCloudCerts.length > 0 && typeof window !== 'undefined') {
        localStorage.setItem('sms_certificates_history', JSON.stringify(allCloudCerts));
      }

      return matched;
    } catch (err) {
      console.warn('[FirebaseSync] fetchCertificateFromCloudById warning:', err);
      return null;
    }
  }

  /**
   * 📝 Sync Exam Setup (sms_exam_setup) to Firestore
   */
  public async syncExamsToCloud(exams: any[]): Promise<void> {
    if (!db || typeof navigator === 'undefined' || !navigator.onLine) return;
    try {
      const firestore = db as Firestore;
      await setDoc(doc(firestore, 'academic_data', 'exam_setup'), {
        exams,
        updatedAt: serverTimestamp(),
        schoolId: firebaseConfig.projectId
      }, { merge: true });
    } catch (err) {
      console.warn('[FirebaseSync] Exam setup cloud sync warning:', err);
    }
  }

  /**
   * 📊 Sync specific Exam Mark keys (sms_marks_*) to Firestore
   */
  public async syncMarksKeysToCloud(keys: string[]): Promise<void> {
    if (!db || typeof window === 'undefined' || typeof navigator === 'undefined' || !navigator.onLine) return;
    try {
      const firestore = db as Firestore;
      const uniqueKeys = Array.from(new Set(keys)).filter((k) => k.startsWith('sms_marks_'));
      if (uniqueKeys.length === 0) return;

      const batch = writeBatch(firestore);
      uniqueKeys.slice(0, 400).forEach((k) => {
        const val = localStorage.getItem(k);
        if (val) {
          const safeDocId = encodeURIComponent(k).replace(/\./g, '%2E');
          const mRef = doc(firestore, 'exam_marks', safeDocId);
          batch.set(mRef, {
            storageKey: k,
            value: val,
            updatedAt: serverTimestamp(),
            schoolId: firebaseConfig.projectId
          }, { merge: true });
        }
      });
      await batch.commit();
    } catch (err) {
      console.warn('[FirebaseSync] Marks cloud sync warning:', err);
    }
  }

  /**
   * 🌐 Fetch Public Result Data (Settings, Exams, Students, Marks) from Cloud Firestore
   * Enables students & parents on any mobile phone to check results live on /result
   */
  public async fetchPublicResultDataFromCloud(): Promise<{
    synced: boolean;
    studentCount: number;
    markKeysCount: number;
  }> {
    if (!db || typeof window === 'undefined') {
      return { synced: false, studentCount: 0, markKeysCount: 0 };
    }
    try {
      const firestore = db as Firestore;

      // 1. Settings
      try {
        const settingsSnap = await getDoc(doc(firestore, 'settings', 'general'));
        if (settingsSnap.exists()) {
          settingsService.updateSettings(settingsSnap.data() as SchoolSettings);
        }
      } catch (e) {}

      // 2. Exam Setup
      try {
        const examSnap = await getDoc(doc(firestore, 'academic_data', 'exam_setup'));
        if (examSnap.exists()) {
          const data = examSnap.data();
          if (Array.isArray(data?.exams) && data.exams.length > 0) {
            localStorage.setItem('sms_exam_setup', JSON.stringify(data.exams));
            window.dispatchEvent(new CustomEvent('sms_exam_setup_changed', { detail: data.exams }));
          }
        }
      } catch (e) {}

      // 3. Students
      let studentCount = 0;
      try {
        const studentsSnap = await getDocs(collection(firestore, 'students'));
        const cloudStudents: Student[] = [];
        studentsSnap.forEach((d) => cloudStudents.push({ ...d.data(), id: d.id } as Student));
        if (cloudStudents.length > 0) {
          localStorage.setItem('sms_students', JSON.stringify(cloudStudents));
          studentCount = cloudStudents.length;
        }
      } catch (e) {}

      // 4. Exam Marks
      let markKeysCount = 0;
      try {
        const marksSnap = await getDocs(collection(firestore, 'exam_marks'));
        marksSnap.forEach((d) => {
          const data = d.data();
          if (data?.storageKey && typeof data?.value === 'string') {
            localStorage.setItem(data.storageKey, data.value);
            markKeysCount++;
          }
        });
      } catch (e) {}

      return { synced: true, studentCount, markKeysCount };
    } catch (err) {
      console.warn('[FirebaseSync] fetchPublicResultDataFromCloud warning:', err);
      return { synced: false, studentCount: 0, markKeysCount: 0 };
    }
  }

  private sanitizeFirestoreObject(raw: Record<string, any>, allowedKeys?: Set<string>): Record<string, any> {
    if (!raw || typeof raw !== 'object') return {};
    const filtered: Record<string, any> = {};
    for (const [k, v] of Object.entries(raw)) {
      if (v === undefined) continue;
      if (allowedKeys && !allowedKeys.has(k)) continue;
      filtered[k] = v;
    }
    try {
      return JSON.parse(JSON.stringify(filtered));
    } catch {
      return filtered;
    }
  }

  private readLocalJson<T>(key: string, fallback: T): T {
    if (typeof localStorage === 'undefined') return fallback;
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  }

  private async uploadCollectionDocs(
    firestore: Firestore,
    collectionName: string,
    entries: Array<{ docId: string; data: Record<string, any> }>
  ): Promise<number> {
    if (!entries.length) return 0;
    let uploaded = 0;
    const chunkSize = 400;
    for (let i = 0; i < entries.length; i += chunkSize) {
      const chunk = entries.slice(i, i + chunkSize);
      try {
        const batch = writeBatch(firestore);
        chunk.forEach(({ docId, data }) => {
          const ref = doc(firestore, collectionName, docId);
          batch.set(
            ref,
            {
              ...data,
              updatedAt: serverTimestamp(),
              schoolId: firebaseConfig.projectId,
            },
            { merge: true }
          );
        });
        await batch.commit();
        uploaded += chunk.length;
      } catch (err) {
        console.warn(`[FirebaseSync] ${collectionName} batch upload warning:`, err);
      }
    }
    return uploaded;
  }

  private async pullCollectionDocs(
    firestore: Firestore,
    collectionName: string
  ): Promise<Array<Record<string, any>> | null> {
    try {
      const snap = await getDocs(collection(firestore, collectionName));
      const docs: Array<Record<string, any>> = [];
      snap.forEach((d) => {
        const raw = d.data();
        const cleaned: Record<string, any> = { ...raw, id: d.id };
        if (cleaned.updatedAt && typeof cleaned.updatedAt?.toDate === 'function') {
          cleaned.updatedAt = cleaned.updatedAt.toDate().toISOString();
        }
        if (cleaned.createdAt && typeof cleaned.createdAt?.toDate === 'function') {
          cleaned.createdAt = cleaned.createdAt.toDate().toISOString();
        }
        docs.push(cleaned);
      });
      return docs;
    } catch (err) {
      console.warn(`[FirebaseSync] Pull ${collectionName} skipped:`, err);
      return null;
    }
  }

  private normalizeLeavePayload(lv: Record<string, any>): Record<string, any> {
    const reasonStr = String(lv.reason || 'প্রাতিষ্ঠানিক ছুটি').trim();
    const lt = String(lv.leaveType || 'casual').toLowerCase();
    const validLeaveType = ['casual', 'medical', 'maternity', 'emergency', 'earned'].includes(lt) ? lt : 'casual';
    return this.sanitizeFirestoreObject(
      {
        ...lv,
        id: String(lv.id),
        teacherId: String(lv.teacherId || ''),
        teacherName: String(lv.teacherName || 'Teacher'),
        leaveType: validLeaveType,
        startDate: String(lv.startDate || ''),
        endDate: String(lv.endDate || ''),
        totalDays: Math.max(1, Math.min(365, Number(lv.totalDays || 1))),
        reason: reasonStr.length >= 3 ? reasonStr : 'প্রাতিষ্ঠানিক ছুটি',
        status: ['Pending', 'pending', 'Approved', 'approved', 'Rejected', 'rejected'].includes(lv.status) ? lv.status : 'Pending',
      },
      ALLOWED_TEACHER_LEAVE_KEYS
    );
  }

  private buildExtendedModuleEntries() {
    const invoices = this.readLocalJson<any[]>('sms_fee_invoices', [])
      .filter((inv) => inv && (inv.id || inv.invoiceNo) && inv.studentId)
      .map((inv) => {
        const docId = String(inv.id || inv.invoiceNo);
        const normalized = {
          ...inv,
          id: docId,
          studentId: String(inv.studentId),
          studentName: String(inv.studentName || 'Unknown'),
          totalPayable: Number(inv.totalPayable ?? inv.netPayable ?? 0),
          totalPaid: Number(inv.totalPaid ?? inv.paidAmount ?? 0),
          dueAmount: Number(inv.dueAmount ?? 0),
          status: ['unpaid', 'partial', 'paid', 'cancelled'].includes(inv.status) ? inv.status : 'unpaid',
        };
        return { docId, data: this.sanitizeFirestoreObject(normalized, ALLOWED_FEE_INVOICE_KEYS) };
      });

    const ledgerMap = this.readLocalJson<Record<string, any>>('sms_student_fee_ledgers', {});
    const feeLedgers = Object.entries(ledgerMap || {})
      .filter(([, val]) => val && typeof val === 'object')
      .map(([studentKey, val]) => {
        const studentId = String(val.studentId || studentKey);
        const normalized = {
          ...val,
          id: studentId,
          studentId,
          sessionYear: Number(val.sessionYear || new Date().getFullYear()),
          months: Array.isArray(val.months) ? val.months.slice(0, 24) : [],
          totalBilled: Number(val.totalBilled ?? 0),
          totalPaid: Number(val.totalPaid ?? 0),
          totalDue: Number(val.totalDue ?? 0),
        };
        return { docId: studentId, data: this.sanitizeFirestoreObject(normalized, ALLOWED_FEE_LEDGER_KEYS) };
      });

    const payrollRecords = this.readLocalJson<any[]>('sms_payroll_records', [])
      .filter((p) => p && p.id && p.teacherId)
      .map((p) => {
        const normalized: Record<string, any> = {
          ...p,
          id: String(p.id),
          teacherId: String(p.teacherId),
          teacherName: String(p.teacherName || 'Teacher'),
          month: String(p.month || 'N/A'),
          year: Number(p.year || new Date().getFullYear()),
          netPayable: Number(p.netPayable ?? 0),
          paidAmount: Number(p.paidAmount ?? 0),
          status: ['Paid', 'Pending', 'paid', 'pending'].includes(p.status) ? p.status : 'Pending',
        };
        if (!['Cash', 'Bank Transfer', 'bKash', 'Nagad'].includes(normalized.paymentMethod)) {
          delete normalized.paymentMethod;
        }
        return { docId: String(p.id), data: this.sanitizeFirestoreObject(normalized, ALLOWED_PAYROLL_KEYS) };
      });

    const expenseRecords = this.readLocalJson<any[]>('sms_expenses', [])
      .filter((e) => e && e.id && Number(e.amount) > 0 && e.date)
      .map((e) => {
        const normalized: Record<string, any> = {
          ...e,
          id: String(e.id),
          category: String(e.category || 'General'),
          amount: Number(e.amount),
          date: String(e.date),
          paidTo: String(e.paidTo || 'N/A'),
        };
        if (!['Cash', 'Bank Check', 'Bank Transfer', 'bKash', 'Nagad'].includes(normalized.paymentMethod)) {
          delete normalized.paymentMethod;
        }
        return { docId: String(e.id), data: this.sanitizeFirestoreObject(normalized, ALLOWED_EXPENSE_KEYS) };
      });

    const ledgerRecords = this.readLocalJson<any[]>('school_ledger_records', [])
      .filter((l) => l && l.id && Number(l.amount) > 0 && l.voucherNo && l.date)
      .map((l) => {
        const normalized: Record<string, any> = {
          ...l,
          id: String(l.id),
          type: l.type === 'Expense' ? 'Expense' : 'Income',
          category: String(l.category || 'General'),
          amount: Number(l.amount),
          voucherNo: String(l.voucherNo),
          date: String(l.date),
        };
        if (!['Cash', 'bKash', 'Nagad', 'Bank Transfer'].includes(normalized.paymentMethod)) {
          delete normalized.paymentMethod;
        }
        return { docId: String(l.id), data: this.sanitizeFirestoreObject(normalized, ALLOWED_LEDGER_KEYS) };
      });

    const rawStipend = this.readLocalJson<any[]>('sms_stipend_students', []);
    const allStudents = this.readLocalJson<any[]>('sms_students', []);
    const stipendMap = new Map<string, any>();
    [...allStudents.filter((s) => s?.isStipend), ...rawStipend].forEach((s) => {
      if (!s || !(s.id || s.studentId) || !(s.name || s.studentName)) return;
      const docId = String(s.id || s.studentId);
      const normalized: Record<string, any> = {
        ...s,
        id: docId,
        studentId: String(s.studentId || docId),
        name: String(s.name || s.studentName),
        grade: String(s.grade || '6th'),
        roll: String(s.roll || '00'),
        isStipend: s.isStipend !== false,
      };
      if (!['Active', 'Suspended', 'Revoked'].includes(normalized.stipendStatus)) {
        delete normalized.stipendStatus;
      }
      stipendMap.set(docId, { docId, data: this.sanitizeFirestoreObject(normalized, ALLOWED_STIPEND_KEYS) });
    });

    const teacherLeaves = this.readLocalJson<any[]>('sms_teacher_leave_applications', [])
      .filter((lv) => lv && lv.id && lv.teacherId && lv.startDate && lv.endDate)
      .map((lv) => ({ docId: String(lv.id), data: this.normalizeLeavePayload(lv) }));

    const classRoutines = this.readLocalJson<any[]>('sms_master_class_routine', [])
      .filter((r) => r && r.classId && r.subject && VALID_ROUTINE_DAYS.includes(r.day))
      .map((r, idx) => {
        const periodNo = Math.max(1, Math.min(12, Math.trunc(Number(r.periodNo || 1))));
        const docId = String(r.id || `ROT-${r.classId}-${r.day}-P${periodNo}-${idx}`);
        const normalized = {
          ...r,
          id: docId,
          classId: String(r.classId),
          day: r.day,
          periodNo,
          subject: String(r.subject),
        };
        return { docId, data: this.sanitizeFirestoreObject(normalized, ALLOWED_CLASS_ROUTINE_KEYS) };
      });

    const rawTestimonials = this.readLocalJson<any[]>('sms_ssc_testimonials', []);
    const certTestimonials = this.readLocalJson<any[]>('sms_certificates_history', []).filter(
      (c) => c?.type === 'ssc_testimonial'
    );
    const testimonialMap = new Map<string, any>();
    [...certTestimonials, ...rawTestimonials].forEach((t, idx) => {
      if (!t || !(t.studentName || t.name)) return;
      const docId = String(t.id || t.refNo || `ssc_test_${idx}`);
      const normalized: Record<string, any> = {
        ...t,
        id: docId,
        studentName: String(t.studentName || t.name),
        boardRoll: String(t.boardRoll || t.roll || '00'),
        passingYear: String(t.passingYear || new Date().getFullYear()),
        refNo: String(t.refNo || docId),
      };
      if (!['Male', 'Female', 'Other'].includes(normalized.gender)) {
        delete normalized.gender;
      }
      testimonialMap.set(docId, { docId, data: this.sanitizeFirestoreObject(normalized, ALLOWED_SSC_TESTIMONIAL_KEYS) });
    });

    return {
      invoices,
      feeLedgers,
      payrollRecords,
      expenseRecords,
      ledgerRecords,
      stipendStudents: Array.from(stipendMap.values()),
      teacherLeaves,
      classRoutines,
      sscTestimonials: Array.from(testimonialMap.values()),
    };
  }

  private async uploadAcademicConfigDocs(firestore: Firestore): Promise<number> {
    let count = 0;
    const curriculum = this.readLocalJson<any[]>('sms_curriculum_subjects', []);
    if (curriculum.length > 0) {
      try {
        await setDoc(
          doc(firestore, 'academic_data', 'curriculum_subjects'),
          {
            subjects: this.sanitizeFirestoreObject({ list: curriculum.slice(0, 500) }).list,
            updatedAt: serverTimestamp(),
            schoolId: firebaseConfig.projectId,
          },
          { merge: true }
        );
        count++;
      } catch (err) {
        console.warn('[FirebaseSync] Curriculum upload warning:', err);
      }
    }

    const sessions = this.readLocalJson<any[]>('sms_academic_sessions', []);
    if (sessions.length > 0) {
      const active = sessions.find((s) => s?.isCurrent) || sessions[0];
      try {
        await setDoc(
          doc(firestore, 'academic_data', 'session_setup'),
          {
            sessions: this.sanitizeFirestoreObject({ list: sessions.slice(0, 100) }).list,
            ...(active && typeof active === 'object' ? { activeSession: this.sanitizeFirestoreObject(active) } : {}),
            ...(active?.id ? { activeSessionId: String(active.id) } : {}),
            updatedAt: serverTimestamp(),
            schoolId: firebaseConfig.projectId,
          },
          { merge: true }
        );
        count++;
      } catch (err) {
        console.warn('[FirebaseSync] Session setup upload warning:', err);
      }
    }

    const routines = this.readLocalJson<any[]>('sms_master_class_routine', []);
    if (routines.length > 0) {
      try {
        await setDoc(
          doc(firestore, 'academic_data', 'class_routines'),
          {
            routines: this.sanitizeFirestoreObject({ list: routines.slice(0, 1000) }).list,
            updatedAt: serverTimestamp(),
            schoolId: firebaseConfig.projectId,
          },
          { merge: true }
        );
        count++;
      } catch (err) {
        console.warn('[FirebaseSync] Academic class_routines doc upload warning:', err);
      }
    }
    return count;
  }

  private async uploadExtendedModulesToCloud(firestore: Firestore): Promise<number> {
    if (typeof localStorage === 'undefined') return 0;
    const data = this.buildExtendedModuleEntries();
    const collections: Array<[string, Array<{ docId: string; data: Record<string, any> }>]> = [
      ['fee_invoices', data.invoices],
      ['fee_ledgers', data.feeLedgers],
      ['payroll_records', data.payrollRecords],
      ['expense_records', data.expenseRecords],
      ['ledger_records', data.ledgerRecords],
      ['stipend_students', data.stipendStudents],
      ['teacher_leaves', data.teacherLeaves],
      ['class_routines', data.classRoutines],
      ['ssc_testimonials', data.sscTestimonials],
    ];

    let total = 0;
    for (const [colName, entries] of collections) {
      total += await this.uploadCollectionDocs(firestore, colName, entries);
    }
    total += await this.uploadAcademicConfigDocs(firestore);
    return total;
  }

  private async pullExtendedModulesFromCloud(firestore: Firestore): Promise<void> {
    if (typeof localStorage === 'undefined') return;

    const directArrayPulls: Array<[string, string]> = [
      ['fee_invoices', 'sms_fee_invoices'],
      ['payroll_records', 'sms_payroll_records'],
      ['expense_records', 'sms_expenses'],
      ['ledger_records', 'school_ledger_records'],
      ['teacher_leaves', 'sms_teacher_leave_applications'],
      ['class_routines', 'sms_master_class_routine'],
      ['ssc_testimonials', 'sms_ssc_testimonials'],
    ];

    for (const [colName, storageKey] of directArrayPulls) {
      const pulled = await this.pullCollectionDocs(firestore, colName);
      if (pulled && pulled.length > 0) {
        localStorage.setItem(storageKey, JSON.stringify(pulled));
      }
    }

    const pulledLedgers = await this.pullCollectionDocs(firestore, 'fee_ledgers');
    if (pulledLedgers && pulledLedgers.length > 0) {
      const existing = this.readLocalJson<Record<string, any>>('sms_student_fee_ledgers', {});
      const merged = { ...existing };
      pulledLedgers.forEach((item) => {
        const key = String(item.studentId || item.id);
        if (key) merged[key] = item;
      });
      localStorage.setItem('sms_student_fee_ledgers', JSON.stringify(merged));
    }

    const pulledStipends = await this.pullCollectionDocs(firestore, 'stipend_students');
    if (pulledStipends && pulledStipends.length > 0) {
      localStorage.setItem('sms_stipend_students', JSON.stringify(pulledStipends));
      const stipendById = new Map(pulledStipends.map((s) => [String(s.studentId || s.id), s]));
      const students = this.readLocalJson<any[]>('sms_students', []);
      if (students.length > 0) {
        const enriched = students.map((st) => {
          const match = stipendById.get(String(st.id));
          if (!match) return st;
          return {
            ...st,
            isStipend: match.isStipend ?? true,
            stipendCategory: match.stipendCategory ?? st.stipendCategory,
            stipendStatus: match.stipendStatus ?? st.stipendStatus,
          };
        });
        localStorage.setItem('sms_students', JSON.stringify(enriched));
      }
    }

    const academicPulls: Array<{ docId: string; storageKey: string; fieldCandidates: string[] }> = [
      { docId: 'curriculum_subjects', storageKey: 'sms_curriculum_subjects', fieldCandidates: ['subjects', 'items', 'curriculum'] },
      { docId: 'session_setup', storageKey: 'sms_academic_sessions', fieldCandidates: ['sessions'] },
      { docId: 'class_routines', storageKey: 'sms_master_class_routine', fieldCandidates: ['routines', 'slots'] },
    ];

    for (const cfg of academicPulls) {
      try {
        const snap = await getDoc(doc(firestore, 'academic_data', cfg.docId));
        if (snap.exists()) {
          const d = snap.data();
          for (const field of cfg.fieldCandidates) {
            if (Array.isArray(d?.[field]) && d[field].length > 0) {
              localStorage.setItem(cfg.storageKey, JSON.stringify(d[field]));
              break;
            }
          }
        }
      } catch (err) {
        console.warn(`[FirebaseSync] Pull academic_data/${cfg.docId} skipped:`, err);
      }
    }
  }

  /**
   * Sync Finance, Payroll, Expenses, School Ledger and Stipend records to Firestore.
   */
  public async syncFinanceToCloud(): Promise<{ uploadedCount: number }> {
    if (!db || typeof navigator === 'undefined' || !navigator.onLine) {
      return { uploadedCount: 0 };
    }
    canonicalizeLocalStorageKeys();
    const firestore = db as Firestore;
    const data = this.buildExtendedModuleEntries();
    let uploadedCount = 0;
    uploadedCount += await this.uploadCollectionDocs(firestore, 'fee_invoices', data.invoices);
    uploadedCount += await this.uploadCollectionDocs(firestore, 'fee_ledgers', data.feeLedgers);
    uploadedCount += await this.uploadCollectionDocs(firestore, 'payroll_records', data.payrollRecords);
    uploadedCount += await this.uploadCollectionDocs(firestore, 'expense_records', data.expenseRecords);
    uploadedCount += await this.uploadCollectionDocs(firestore, 'ledger_records', data.ledgerRecords);
    uploadedCount += await this.uploadCollectionDocs(firestore, 'stipend_students', data.stipendStudents);
    return { uploadedCount };
  }

  /**
   * Sync all or single Teacher Leave application to Firestore.
   */
  public async syncLeaveToCloud(leave?: Record<string, any>): Promise<void> {
    if (!db || typeof navigator === 'undefined' || !navigator.onLine) return;
    const firestore = db as Firestore;
    if (leave && leave.id) {
      const sanitized = this.normalizeLeavePayload(leave);
      await this.uploadCollectionDocs(firestore, 'teacher_leaves', [{ docId: String(leave.id), data: sanitized }]);
      return;
    }
    const { teacherLeaves } = this.buildExtendedModuleEntries();
    await this.uploadCollectionDocs(firestore, 'teacher_leaves', teacherLeaves);
  }

  /**
   * Sync Master Class Routine to `academic_data/class_routines` and `class_routines/*`.
   */
  public async syncRoutineToCloud(): Promise<void> {
    if (!db || typeof navigator === 'undefined' || !navigator.onLine) return;
    const firestore = db as Firestore;
    const { classRoutines } = this.buildExtendedModuleEntries();
    await this.uploadCollectionDocs(firestore, 'class_routines', classRoutines);
    const routines = this.readLocalJson<any[]>('sms_master_class_routine', []);
    if (routines.length > 0) {
      try {
        await setDoc(
          doc(firestore, 'academic_data', 'class_routines'),
          {
            routines: this.sanitizeFirestoreObject({ list: routines.slice(0, 1000) }).list,
            updatedAt: serverTimestamp(),
            schoolId: firebaseConfig.projectId,
          },
          { merge: true }
        );
      } catch (err) {
        console.warn('[FirebaseSync] syncRoutineToCloud warning:', err);
      }
    }
  }

  /**
   * Sync NCTB Curriculum Subjects & Academic Sessions to `academic_data/*`.
   */
  public async syncCurriculumToCloud(): Promise<void> {
    if (!db || typeof navigator === 'undefined' || !navigator.onLine) return;
    const firestore = db as Firestore;
    await this.uploadAcademicConfigDocs(firestore);
  }

  /**
   * 🎓 Sync Online Admission Application to Firestore ('online_applications' collection)
   */
  public async syncOnlineApplicationToCloud(appData: any): Promise<void> {
    if (!db || !appData || typeof navigator === 'undefined' || !navigator.onLine) return;
    try {
      const firestore = db as Firestore;
      const docId = String(appData.appId || appData.id || `app_${Date.now()}`);
      const candidate = {
        ...appData,
        id: docId,
        appId: String(appData.appId || docId),
        studentName: String(appData.studentName || appData.name || 'Applicant').trim(),
        ...(appData.studentNameEn || appData.nameEn
          ? { studentNameEn: String(appData.studentNameEn || appData.nameEn).trim() }
          : {}),
        appliedClass: String(appData.appliedClass || appData.grade || '6th').trim(),
        status: 'pending',
      };
      const sanitized = this.sanitizeFirestoreObject(candidate, ALLOWED_PUBLIC_APPLICATION_KEYS);
      await setDoc(doc(firestore, 'online_applications', docId), {
        ...sanitized,
        updatedAt: serverTimestamp(),
        schoolId: firebaseConfig.projectId
      }, { merge: true });
    } catch (err) {
      console.warn('[FirebaseSync] Online application cloud sync warning:', err);
    }
  }
}

export const firebaseSyncService = new FirebaseSyncService();
