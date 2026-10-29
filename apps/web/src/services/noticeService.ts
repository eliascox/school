'use client';

export interface Notice {
  id: string;
  title: string;
  content: string;
  category: 'general' | 'academic' | 'exam' | 'emergency' | 'holiday' | 'events';
  targetAudience: 'all' | 'students' | 'teachers' | 'parents';
  priority: 'normal' | 'important' | 'urgent';
  publisherName: string;
  publisherRole: string;
  publishedAt: string;
  isPinned: boolean;
  refNo?: string;
  attachmentUrl?: string;
}

// ─── NO DEMO / HARDCODED NOTICES ─────────────────────────────────────────────
// System starts with an empty notice board. All notices must be created
// through the dashboard Notice Board management panel by authorized staff.
// ─────────────────────────────────────────────────────────────────────────────

class NoticeService {
  private listeners: (() => void)[] = [];

  getNotices(): Notice[] {
    if (typeof window === 'undefined') return [];
    const isCleared = localStorage.getItem('sms_notices_cleared');
    const stored = localStorage.getItem('sms_notices');

    if (stored !== null) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        console.error('Error loading notices:', e);
      }
    }

    // Return empty array for clean start
    return [];
  }

  saveNotice(noticeData: Omit<Notice, 'id'> & { id?: string }): { success: boolean; message: string; notice?: Notice } {
    if (typeof window === 'undefined') return { success: false, message: 'Browser required' };

    const notices = this.getNotices();
    const publishedAt = noticeData.publishedAt ? new Date(noticeData.publishedAt).toISOString() : new Date().toISOString();

    if (noticeData.id) {
      // Edit existing
      const index = notices.findIndex(n => n.id === noticeData.id);
      if (index !== -1) {
        const updatedNotice: Notice = {
          ...notices[index],
          ...noticeData,
          id: noticeData.id,
          publishedAt: publishedAt
        };
        notices[index] = updatedNotice;
        localStorage.setItem('sms_notices', JSON.stringify(notices));
        this.notify();
        return { success: true, message: 'নোটিশ সফলভাবে আপডেট করা হয়েছে!', notice: updatedNotice };
      }
    }

    // Create new notice
    const year = new Date().getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    const newNotice: Notice = {
      id: `NOT-${Date.now()}`,
      title: noticeData.title,
      content: noticeData.content,
      category: noticeData.category,
      targetAudience: noticeData.targetAudience,
      priority: noticeData.priority,
      publisherName: noticeData.publisherName || 'ড. এ. কে. এম. রেজাউল করিম',
      publisherRole: noticeData.publisherRole || 'প্রধান শিক্ষক',
      publishedAt: publishedAt,
      isPinned: !!noticeData.isPinned,
      refNo: noticeData.refNo || `স্মারক নং: মউবি/নোটিশ/${year}/${rand}`,
      attachmentUrl: noticeData.attachmentUrl
    };

    const updatedList = [newNotice, ...notices];
    localStorage.setItem('sms_notices', JSON.stringify(updatedList));
    this.notify();
    return { success: true, message: 'প্রধান শিক্ষকের নোটিশ সফলভাবে প্রকাশ করা হয়েছে!', notice: newNotice };
  }

  togglePin(id: string): { success: boolean; message: string } {
    const notices = this.getNotices();
    const index = notices.findIndex(n => n.id === id);
    if (index !== -1) {
      notices[index].isPinned = !notices[index].isPinned;
      localStorage.setItem('sms_notices', JSON.stringify(notices));
      this.notify();
      return { success: true, message: notices[index].isPinned ? 'নোটিশ পিন করা হয়েছে' : 'নোটিশ আনপিন করা হয়েছে' };
    }
    return { success: false, message: 'নোটিশ পাওয়া যায়নি' };
  }

  deleteNotice(id: string): { success: boolean; message: string } {
    const notices = this.getNotices();
    const filtered = notices.filter(n => n.id !== id);
    localStorage.setItem('sms_notices', JSON.stringify(filtered));
    if (filtered.length === 0) {
      localStorage.setItem('sms_notices_cleared', 'true');
    }
    this.notify();
    return { success: true, message: 'নোটিশ সফলভাবে মুছে ফেলা হয়েছে' };
  }

  clearAllNotices(): { success: boolean; message: string } {
    localStorage.setItem('sms_notices', JSON.stringify([]));
    localStorage.setItem('sms_notices_cleared', 'true');
    this.notify();
    return { success: true, message: 'সকল ডেমো নোটিশ স্থায়ীভাবে মুছে ফেলা হয়েছে!' };
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
    }
  }
}

export const noticeService = new NoticeService();
