'use client';

import { auditTrailService } from './auditTrailService';
import { financeService } from './financeService';

export interface SystemPurgeLayer {
  layer: string;
  description: string;
  status: 'cleared' | 'reset' | 'empty';
}

export interface SystemPurgeReport {
  success: boolean;
  message: string;
  purgedLayers: SystemPurgeLayer[];
  comment: string;
  performedBy: string;
  timestamp: string;
}

const getAllStorageKeys = (): string[] => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return [];
  const keysSet = new Set<string>();
  try {
    if (typeof localStorage.length === 'number') {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k) keysSet.add(k);
      }
    }
  } catch (e) {}
  try {
    Object.keys(localStorage).forEach((k) => {
      if (typeof (localStorage as any)[k] !== 'function' && k !== 'length' && k !== 'key' && k !== 'getItem' && k !== 'setItem' && k !== 'removeItem' && k !== 'clear') {
        keysSet.add(k);
      }
    });
  } catch (e) {}
  return Array.from(keysSet);
};

export const systemResetService = {
  /**
   * Comprehensive Multi-Layer System Data Purge
   * Synchronizes and completely wipes data across ALL system layers:
   * 1. Students & Profiles (sms_students, uploaded, photos, applications, promotions)
   * 2. Exams & Marks (sms_marks_*, exam_results_v1, exam names, last save)
   * 3. Finance, Fees & Ledgers (school_ledger_records, student fees, vouchers, payroll, expenses, invoices, waivers, refunds)
   * 4. Cash & Bank Accounts (all bank balances and COA balances reset to ৳০)
   * 5. Attendance (attendance_records_v1, sms_attendance_*)
   * 6. Notices & Announcements (school_notices_v1, sms_notices, sms_notices_cleared)
   * 7. SMS & Messages History (sms_logs_history)
   * 8. Certificates (sms_certificate_*)
   * 9. Sync Queue & Audit Trail (logs permanent record with the user's comment)
   */
  purgeAllSystemData: (
    comment: string = 'সকল ডেমো ডাটা মুছে ফ্রেশ স্টার্ট',
    performedBy: string = 'প্রধান শিক্ষক / অ্যাডমিন'
  ): SystemPurgeReport => {
    if (typeof window === 'undefined') {
      return {
        success: false,
        message: 'ব্রাউজার এনভায়রনমেন্ট অনুপস্থিত',
        purgedLayers: [],
        comment,
        performedBy,
        timestamp: new Date().toISOString()
      };
    }

    const trimmedComment = comment.trim() || 'সকল ডেমো ডাটা মুছে ফ্রেশ স্টার্ট';
    const layers: SystemPurgeLayer[] = [];
    const allKeys = getAllStorageKeys();

    // ─── ১. শিক্ষার্থী ও ভর্তি স্তর (Students & Admissions) ───
    try {
      localStorage.setItem('sms_students', JSON.stringify([]));
      localStorage.removeItem('sms_uploaded_students');
      localStorage.removeItem('students');
      localStorage.setItem('sms_student_photos', JSON.stringify({}));
      localStorage.setItem('sms_online_applications', JSON.stringify([]));
      localStorage.setItem('sms_promotion_history', JSON.stringify([]));
      layers.push({
        layer: 'শিক্ষার্থী স্তর',
        description: 'সকল শিক্ষার্থী, আপলোড তালিকা, ছবি ও অনলাইন ভর্তি আবেদন সম্পূর্ণ খালি করা হয়েছে',
        status: 'cleared'
      });
    } catch (e) {
      console.error('Error clearing student layer:', e);
    }

    // ─── ২. পরীক্ষা, নম্বর ও ফলাফল স্তর (Exams & Marks) ───
    try {
      let markKeysCount = 0;
      allKeys.forEach((key) => {
        if (key.startsWith('sms_marks_') || key.startsWith('sms_marksheet_')) {
          localStorage.removeItem(key);
          markKeysCount++;
        }
      });
      localStorage.setItem('exam_results_v1', JSON.stringify([]));
      localStorage.removeItem('sms_last_mark_save');
      localStorage.removeItem('sms_exam_names');
      layers.push({
        layer: 'পরীক্ষা ও ফলাফল স্তর',
        description: `৬ষ্ঠ-১০ম শ্রেণির বিষয়ভিত্তিক সকল নম্বর ও ফলাফল মুছে ফেলা হয়েছে (${markKeysCount} সেট)`,
        status: 'cleared'
      });
    } catch (e) {
      console.error('Error clearing marks layer:', e);
    }

    // ─── ৩. হিসাব, ফি কালেকশন, বেতন ও লেজার স্তর (Finance & Ledgers) ───
    try {
      localStorage.setItem('school_ledger_records', JSON.stringify([]));
      localStorage.setItem('sms_student_fee_ledgers', JSON.stringify({}));
      localStorage.setItem('sms_payment_history', JSON.stringify([]));
      localStorage.setItem('fee_collections_v1', JSON.stringify([]));
      localStorage.setItem('sms_vouchers_ledger', JSON.stringify([]));
      localStorage.setItem('sms_payroll_records', JSON.stringify([]));
      localStorage.setItem('sms_expenses', JSON.stringify([]));
      localStorage.setItem('sms_expense_records', JSON.stringify([]));
      localStorage.setItem('sms_fee_invoices', JSON.stringify([]));
      localStorage.setItem('sms_waivers', JSON.stringify([]));
      localStorage.setItem('sms_refunds', JSON.stringify([]));

      // Reset all bank balances to 0
      financeService.resetAllBankBalancesToZero();

      // Reset all Chart of Accounts opening balances to 0
      try {
        const coa = financeService.getChartOfAccounts();
        if (Array.isArray(coa)) {
          const resetCoa = coa.map((a) => ({ ...a, openingBalance: 0 }));
          financeService.saveChartOfAccounts(resetCoa);
        }
      } catch (e) {}

      layers.push({
        layer: 'হিসাব ও অর্থ স্তর',
        description: 'ফি কালেকশন, খতিয়ান, আয়-ব্যয় ভাউচার ও সকল ব্যাংকের স্থিতি ৳০ করা হয়েছে',
        status: 'reset'
      });
    } catch (e) {
      console.error('Error clearing finance layer:', e);
    }

    // ─── ৪. উপস্থিতি ও হাজিরা স্তর (Attendance) ───
    try {
      let attCount = 0;
      allKeys.forEach((key) => {
        if (key.startsWith('sms_attendance_')) {
          localStorage.removeItem(key);
          attCount++;
        }
      });
      localStorage.setItem('attendance_records_v1', JSON.stringify([]));
      layers.push({
        layer: 'উপস্থিতি স্তর',
        description: `দৈনিক সকল উপস্থিতি ও অনুপস্থিতির রেকর্ড মুছে ফেলা হয়েছে (${attCount} দিন)`,
        status: 'cleared'
      });
    } catch (e) {
      console.error('Error clearing attendance layer:', e);
    }

    // ─── ৫. নোটিশ ও যোগাযোগ স্তর (Notices & SMS) ───
    try {
      localStorage.setItem('school_notices_v1', JSON.stringify([]));
      localStorage.setItem('sms_notices', JSON.stringify([]));
      localStorage.setItem('sms_notices_cleared', 'true');
      localStorage.setItem('sms_logs_history', JSON.stringify([]));
      layers.push({
        layer: 'নোটিশ ও এসএমএস স্তর',
        description: 'নোটিশ বোর্ড ও এসএমএস লগ ইতিহাস খালি করা হয়েছে',
        status: 'cleared'
      });
    } catch (e) {
      console.error('Error clearing notices layer:', e);
    }

    // ─── ৬. সনদ ও সার্টিফিকেট স্তর (Certificates) ───
    try {
      let certCount = 0;
      allKeys.forEach((key) => {
        if (key.startsWith('sms_certificate_')) {
          localStorage.removeItem(key);
          certCount++;
        }
      });
      layers.push({
        layer: 'সনদপত্র স্তর',
        description: `ইস্যুকৃত প্রশংসাপত্র ও প্রত্যয়ন লগ মুছে ফেলা হয়েছে (${certCount} টি)`,
        status: 'cleared'
      });
    } catch (e) {
      console.error('Error clearing certificates layer:', e);
    }

    // ─── ৭. সিংক কিউ ও অডিট লগ (Sync Queue & Audit Trail) ───
    try {
      localStorage.setItem('sms_sync_queue', JSON.stringify([]));
      auditTrailService.addLog({
        action: 'MASTER_SYSTEM_DATA_PURGE',
        category: 'System Clean',
        details: `সকল স্তরের ডেমো ডাটা স্থায়ীভাবে মুছে ফেলা হয়েছে। মুছে ফেলার কমেন্ট: "${trimmedComment}"`,
        performedBy: performedBy,
        severity: 'warning',
        timestamp: new Date().toISOString()
      });
      layers.push({
        layer: 'অডিট ট্রেইল স্তর',
        description: `সিস্টেম ওয়াইপ অডিট লগে স্থায়ীভাবে সংরক্ষিত (কমেন্ট: "${trimmedComment}")`,
        status: 'cleared'
      });
    } catch (e) {
      console.error('Error logging audit trail:', e);
    }

    // ─── ৮. গ্লোবাল ফ্ল্যাগ ও সিংক ইভেন্ট ───
    try {
      localStorage.setItem('sms_demo_cleared', 'true');
      localStorage.setItem('sms_fresh_install_mode', 'true');
      window.dispatchEvent(new Event('storage'));
    } catch (e) {}

    return {
      success: true,
      message: 'সকল স্তরের ডেমো ডাটা সফলভাবে মুছে সম্পূর্ণ ফ্রেশ ডেটাবেস প্রস্তুত করা হয়েছে!',
      purgedLayers: layers,
      comment: trimmedComment,
      performedBy: performedBy,
      timestamp: new Date().toISOString()
    };
  }
};
