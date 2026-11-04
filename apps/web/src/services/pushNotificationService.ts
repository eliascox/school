/**
 * 🔔 Firebase Cloud Messaging (FCM) Web Push Notification Service
 * Project: bhsedu-e0906
 */

import { getMessaging, getToken, onMessage, isSupported, Messaging } from 'firebase/messaging';
import { doc, setDoc, serverTimestamp, Firestore } from 'firebase/firestore';
import { app, db, FIREBASE_VAPID_KEY } from '../lib/firebase';
import { auditTrailService } from './auditTrailService';

export interface PushSubscriptionState {
  isSupported: boolean;
  permission: NotificationPermission | 'default';
  token: string | null;
  isLoading: boolean;
  error?: string;
}

const STORAGE_KEY_FCM_TOKEN = 'sms_fcm_push_token_v1';

class PushNotificationService {
  private messaging: Messaging | null = null;
  private isInitialized: boolean = false;

  private async getMessagingInstance(): Promise<Messaging | null> {
    if (typeof window === 'undefined') return null;
    if (this.messaging) return this.messaging;

    try {
      const supported = await isSupported();
      if (supported && app) {
        this.messaging = getMessaging(app);
        return this.messaging;
      }
    } catch (e) {
      console.warn('[FCM] Messaging not supported in this browser environment:', e);
    }
    return null;
  }

  /**
   * Check if web push is supported in current environment
   */
  public async checkSupport(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
      return false;
    }
    try {
      return await isSupported();
    } catch {
      return false;
    }
  }

  /**
   * Request push permission and register FCM device token
   */
  public async subscribeToPush(role: 'admin' | 'teacher' | 'guardian' = 'admin'): Promise<{
    success: boolean;
    token?: string;
    message: string;
  }> {
    if (typeof window === 'undefined') {
      return { success: false, message: 'ব্রাউজার এনভায়রনমেন্ট প্রয়োজন।' };
    }

    const supported = await this.checkSupport();
    if (!supported) {
      return {
        success: false,
        message: 'আপনার বর্তমান ব্রাউজার ওয়েব পুশ নোটিফিকেশন সমর্থন করে না।'
      };
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        return {
          success: false,
          message: 'নোটিফিকেশন পারমিশন দেওয়া হয়নি। ব্রাউজার সেটিংস থেকে অনুমতি দিন।'
        };
      }

      // Register or get existing service worker registration
      let registration: ServiceWorkerRegistration;
      try {
        registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      } catch {
        registration = await navigator.serviceWorker.ready;
      }

      const msg = await this.getMessagingInstance();
      if (!msg) {
        return { success: false, message: 'মেসেজিং সার্ভিস চালু করা সম্ভব হয়নি।' };
      }

      const token = await getToken(msg, {
        vapidKey: FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: registration
      });

      if (!token) {
        return { success: false, message: 'টোকেন সংগ্রহ করা সম্ভব হয়নি।' };
      }

      // Save locally
      localStorage.setItem(STORAGE_KEY_FCM_TOKEN, token);

      // Save to Cloud Firestore if db is active
      if (db) {
        try {
          const firestore = db as Firestore;
          const sanitizedTokenId = token.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40);
          const tokenRef = doc(firestore, 'fcm_tokens', sanitizedTokenId);
          await setDoc(tokenRef, {
            token,
            role,
            userAgent: navigator.userAgent,
            platform: navigator.platform || 'web',
            subscribedAt: serverTimestamp(),
            lastActiveAt: serverTimestamp()
          }, { merge: true });
        } catch (err) {
          console.warn('[FCM] Token cloud sync deferred:', err);
        }
      }

      auditTrailService.addLog({
        action: 'PUSH_NOTIFICATION_SUBSCRIBED',
        category: 'Notification',
        details: `ডিভাইস পুশ নোটিফিকেশন সফলভাবে সক্রিয় করা হয়েছে (${role})।`,
        performedBy: role,
        severity: 'info',
        status: 'Success'
      });

      return {
        success: true,
        token,
        message: 'অভিনন্দন! ওয়েব পুশ নোটিফিকেশন সফলভাবে সক্রিয় হয়েছে।'
      };
    } catch (err: any) {
      console.error('[FCM] Error subscribing to push:', err);
      return {
        success: false,
        message: err?.message || 'নোটিফিকেশন সক্রিয় করার সময় ত্রুটি দেখা দিয়েছে।'
      };
    }
  }

  /**
   * Listen to incoming foreground push messages
   */
  public async listenForegroundMessages(
    callback: (payload: { title?: string; body?: string; data?: any }) => void
  ): Promise<(() => void) | null> {
    const msg = await this.getMessagingInstance();
    if (!msg) return null;

    return onMessage(msg, (payload) => {
      console.log('[FCM] Foreground push message received:', payload);
      const title = payload.notification?.title || payload.data?.title || 'নতুন নোটিশ';
      const body = payload.notification?.body || payload.data?.body || '';
      callback({ title, body, data: payload.data });
    });
  }

  /**
   * Get currently saved token
   */
  public getCurrentToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEY_FCM_TOKEN);
  }
}

export const pushNotificationService = new PushNotificationService();
