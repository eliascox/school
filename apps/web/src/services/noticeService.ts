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

const DEFAULT_NOTICES: Notice[] = [
  {
    id: 'NOT-1001',
    title: 'বার্ষিক পরীক্ষা ২০২৬ এর সময়সূচি ও প্রস্তুতি নির্দেশিকা প্রকাশ',
    content: 'এতদ্দ্বারা বিদ্যালয়ের ৬ষ্ঠ হতে ১০ম শ্রেণির সকল শিক্ষার্থী ও সম্মানিত অভিভাবকদের জানানো যাচ্ছে যে, আগামী ১৫ নভেম্বর ২০২৬ তারিখ হতে বার্ষিক পরীক্ষা শুরু হবে। পরীক্ষার বিস্তারিত সময়সূচি ও আসন বিন্যাস শ্রেণিকক্ষে ও নোটিশ বোর্ডে টাঙিয়ে দেওয়া হয়েছে। সকল শিক্ষার্থীকে নির্ধারিত সময়ের ১৫ মিনিট পূর্বে পরীক্ষার হলে উপস্থিত থাকার জন্য নির্দেশ প্রদান করা হলো।',
    category: 'exam',
    targetAudience: 'all',
    priority: 'urgent',
    publisherName: 'মোহাম্মদ রফিকুল ইসলাম',
    publisherRole: 'প্রধান শিক্ষক',
    publishedAt: '2026-07-30T10:30:00Z',
    isPinned: true,
    refNo: 'বউবি/নোটিশ/২০২৬/১০৪'
  },
  {
    id: 'NOT-1002',
    title: 'পবিত্র ঈদ-উল-আজহা উপলক্ষে বিদ্যালয় ছুটি সংক্রান্ত নোটিশ',
    content: 'সকল শিক্ষক, কর্মচারী ও শিক্ষার্থীদের অবগতির জন্য জানানো যাচ্ছে যে, পবিত্র ঈদ-উল-আজহা উপলক্ষে আগামী ১০ জুন হতে ১৮ জুন ২০২৬ পর্যন্ত বিদ্যালয়ের সকল একাডেমিক ও প্রশাসনিক কার্যক্রম বন্ধ থাকবে। ১৯ জুন ২০২৬ তারিখ বুধবার যথারীতি বিদ্যালয় খোলা হবে। সকলকে ঈদের শুভেচ্ছা।',
    category: 'holiday',
    targetAudience: 'all',
    priority: 'important',
    publisherName: 'মোহাম্মদ রফিকুল ইসলাম',
    publisherRole: 'প্রধান শিক্ষক',
    publishedAt: '2026-06-05T09:00:00Z',
    isPinned: true,
    refNo: 'বউবি/ছুটি/২০২৬/০৮৯'
  },
  {
    id: 'NOT-1003',
    title: 'সম্মানিত শিক্ষকবৃন্দের জরুরি স্টাফ মিটিং আহ্বান',
    content: 'আগামী পরশু বৃহস্পতিবার দুপুর ২:৩০ টায় শিক্ষকমণ্ডলীর কক্ষে এক জরুরি স্টাফ মিটিং অনুষ্ঠিত হবে। উক্ত সভায় শ্রেণি পাঠদান মূল্যায়ন ও আগামী ত্রৈমাসিক পরীক্ষার খাতা মূল্যায়ন সংক্রান্ত সিদ্ধান্ত গৃহীত হবে। সকল শিক্ষক-শিক্ষিকাকে যথাসময়ে উপস্থিত থাকার জন্য বিনীত অনুরোধ করা হলো।',
    category: 'academic',
    targetAudience: 'teachers',
    priority: 'urgent',
    publisherName: 'মোহাম্মদ রফিকুল ইসলাম',
    publisherRole: 'প্রধান শিক্ষক',
    publishedAt: '2026-07-28T14:00:00Z',
    isPinned: false,
    refNo: 'বউবি/স্টাফ/২০২৬/০৫৮'
  },
  {
    id: 'NOT-1004',
    title: 'অভিভাবক সমাবেশ ও মূল্যায়ন পত্র বিতরণ',
    content: '৬ষ্ঠ ও ৭ম শ্রেণির শিক্ষার্থীদের ১ম সাময়িক পরীক্ষার ফলাফল প্রকাশ ও শিক্ষক-অভিভাবক মতবিনিময় সভা আগামী শনিবার সকাল ১০:০০ টায় মিলনায়তনে অনুষ্ঠিত হবে। সকল অভিভাবককে নির্ধারিত সময়ে উপস্থিত থেকে সন্তানের শিক্ষার অগ্রগতির খোঁজখবর নেওয়ার জন্য অনুরোধ করা হচ্ছে।',
    category: 'events',
    targetAudience: 'parents',
    priority: 'normal',
    publisherName: 'মোহাম্মদ রফিকুল ইসলাম',
    publisherRole: 'প্রধান শিক্ষক',
    publishedAt: '2026-07-25T11:15:00Z',
    isPinned: false,
    refNo: 'বউবি/অভি/২০২৬/০৪৭'
  }
];

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
