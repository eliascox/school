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
  Unsubscribe,
  Firestore
} from 'firebase/firestore';
import { db, isFirebaseConfigured, firebaseConfig } from '../lib/firebase';
import { studentService, Student } from './studentService';
import { settingsService, SchoolSettings } from './settingsService';
import { classSectionService } from './classSectionService';
import { auditTrailService } from './auditTrailService';

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

      reportProgress('ক্লাস ও সেকশন ক্লাউডে পাঠানো হচ্ছে...', 10, 100);

      // 2. Classes & Sections Collection
      const classes = classSectionService.getClasses();
      if (classes.length > 0) {
        const classBatch = writeBatch(firestore);
        classes.forEach((cls) => {
          const clsRef = doc(firestore, 'classes', cls.id || `cls-${cls.gradeNumber || cls.code}`);
          classBatch.set(clsRef, { ...cls, updatedAt: serverTimestamp() }, { merge: true });
        });
        await classBatch.commit();
      }

      reportProgress('শিক্ষার্থীদের ডাটা প্রস্তুত করা হচ্ছে...', 25, 100);

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

          const studentPercent = 25 + Math.round((uploadedStudents / totalStudents) * 70);
          reportProgress(
            `শিক্ষার্থী আপলোড হচ্ছে (${uploadedStudents}/${totalStudents})...`,
            studentPercent,
            100
          );
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

      if (onProgress) {
        onProgress({
          step: 'শিক্ষার্থীদের তালিকা সংগ্রহ করা হচ্ছে...',
          current: 40,
          total: 100,
          percent: 40,
          status: 'syncing'
        });
      }

      // 2. Pull Students
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
}

export const firebaseSyncService = new FirebaseSyncService();
