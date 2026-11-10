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
      console.error('[FirebaseSync] Connection test failed:', error);
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
              const appBatch = writeBatch(firestore);
              apps.slice(0, 400).forEach((ap) => {
                const docId = String(ap.appId || ap.id || `app_${Date.now()}`);
                const apRef = doc(firestore, 'online_applications', docId);
                appBatch.set(apRef, { ...ap, updatedAt: serverTimestamp(), schoolId: firebaseConfig.projectId }, { merge: true });
              });
              await appBatch.commit();
            }
          }
        } catch (err) {
          console.warn('[FirebaseSync] Online applications upload warning:', err);
        }
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
      console.error('[FirebaseSync] uploadAllToCloud failed:', err);
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
      console.error('[FirebaseSync] pullAllFromCloud failed:', err);
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
    try {
      const firestore = db as Firestore;
      const result: LandingPageCloudData = {};

      // 1. School Settings
      try {
        const settingsSnap = await getDoc(doc(firestore, 'settings', 'general'));
        if (settingsSnap.exists()) {
          result.settings = settingsSnap.data() as SchoolSettings;
        }
      } catch (e) {
        console.warn('[FirebaseSync] Failed to fetch cloud settings:', e);
      }

      // 2. Landing Page Published CMS Config
      try {
        const landingSnap = await getDoc(doc(firestore, 'landing_page', 'published'));
        if (landingSnap.exists()) {
          result.landingConfig = landingSnap.data() as LandingPageConfig;
        }
      } catch (e) {
        console.warn('[FirebaseSync] Failed to fetch cloud landing page config:', e);
      }

      // 3. Published Notices
      try {
        const noticesSnap = await getDocs(collection(firestore, 'notices'));
        const noticesList: Notice[] = [];
        noticesSnap.forEach((docSnap) => {
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
      } catch (e) {
        console.warn('[FirebaseSync] Failed to fetch cloud notices:', e);
      }

      // 4. Real Students Count from Cloud
      try {
        const studentsColl = collection(firestore, 'students');
        const countSnap = await getCountFromServer(studentsColl);
        result.totalStudents = countSnap.data().count;
      } catch (e) {
        try {
          const snap = await getDocs(collection(firestore, 'students'));
          result.totalStudents = snap.size;
        } catch (err) {}
      }

      return result;
    } catch (err) {
      console.warn('[FirebaseSync] fetchLandingPageCloudData error:', err);
      return {};
    }
  }

  /**
   * 📡 Subscribe to real-time changes on Landing Page documents (Settings, CMS, Notices)
   * Updates public visitor views immediately when the admin makes changes
   */
  public subscribeLandingPageCloud(
    callback: (data: LandingPageCloudData) => void
  ): () => void {
    if (!db || typeof window === 'undefined') return () => {};
    try {
      const firestore = db as Firestore;
      const unsubList: Unsubscribe[] = [];

      // Real-time Settings Listener
      const unsubSettings = onSnapshot(
        doc(firestore, 'settings', 'general'),
        (snap) => {
          if (snap.exists()) {
            callback({ settings: snap.data() as SchoolSettings });
          }
        },
        (err) => console.warn('[FirebaseSync] Cloud settings snapshot warning:', err)
      );
      unsubList.push(unsubSettings);

      // Real-time Landing Page Config Listener
      const unsubLanding = onSnapshot(
        doc(firestore, 'landing_page', 'published'),
        (snap) => {
          if (snap.exists()) {
            callback({ landingConfig: snap.data() as LandingPageConfig });
          }
        },
        (err) => console.warn('[FirebaseSync] Cloud landing snapshot warning:', err)
      );
      unsubList.push(unsubLanding);

      // Real-time Notices Listener
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
      unsubList.push(unsubNotices);

      return () => {
        unsubList.forEach((fn) => fn());
      };
    } catch (err) {
      console.warn('[FirebaseSync] subscribeLandingPageCloud warning:', err);
      return () => {};
    }
  }

  /**
   * 📜 Instant Certificate Auto-Sync to Firestore ('certificates' collection)
   */
  public async syncCertificateToCloud(cert: any): Promise<void> {
    if (!db || !cert?.id || typeof navigator === 'undefined' || !navigator.onLine) return;
    try {
      const firestore = db as Firestore;
      const certRef = doc(firestore, 'certificates', String(cert.id));
      await setDoc(certRef, {
        ...cert,
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
      await deleteDoc(doc(firestore, 'certificates', String(certId)));
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
      const queryLower = queryClean.toLowerCase();

      // 1. Try direct document ID lookup first
      const directSnap = await getDoc(doc(firestore, 'certificates', queryClean));
      if (directSnap.exists()) {
        return { ...directSnap.data(), id: directSnap.id };
      }

      // 2. Scan certificates collection for case-insensitive ID, verificationCode, or refNo match
      const certsSnap = await getDocs(collection(firestore, 'certificates'));
      let matched: any | null = null;
      const allCloudCerts: any[] = [];

      certsSnap.forEach((d) => {
        const data = { ...d.data(), id: d.id } as any;
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

  /**
   * 🎓 Sync Online Admission Application to Firestore ('online_applications' collection)
   */
  public async syncOnlineApplicationToCloud(appData: any): Promise<void> {
    if (!db || !appData || typeof navigator === 'undefined' || !navigator.onLine) return;
    try {
      const firestore = db as Firestore;
      const docId = String(appData.appId || appData.id || `app_${Date.now()}`);
      await setDoc(doc(firestore, 'online_applications', docId), {
        ...appData,
        updatedAt: serverTimestamp(),
        schoolId: firebaseConfig.projectId
      }, { merge: true });
    } catch (err) {
      console.warn('[FirebaseSync] Online application cloud sync warning:', err);
    }
  }
}

export const firebaseSyncService = new FirebaseSyncService();
