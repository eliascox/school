/**
 * Shared Public Landing Page & Portal Utilities
 * Single source of truth for section anchors, route-aware href resolution,
 * notice synchronization, contact/footer consistency, image safety, and admission tracking.
 */

import type { Notice } from '@/services/noticeService';
import type { SchoolSettings } from '@/services/settingsService';
import type {
  ContactConfig,
  FooterConfig,
  GalleryMediaItem,
  ServiceCard,
  ServicesConfig,
} from '@/services/landingPageService';
import { normalizeRollDigits, toBanglaDigits } from '@/lib/resultPortalUtils';
import type { OnlineApplicationRecord } from '@/lib/admissionUtils';

export type PublicNavKey = 'home' | 'about' | 'academics' | 'notices' | 'gallery' | 'contact';

export interface PublicNavLinkItem {
  key: PublicNavKey;
  label: string;
  href: string;
}

export interface PublicAcademicMenuItem {
  href: string;
  sectionId: string;
  label: string;
  hint: string;
  iconKey:
    | 'user-tie'
    | 'teachers'
    | 'layers'
    | 'stats'
    | 'trophy'
    | 'facilities'
    | 'committee';
  tone: 'emerald' | 'teal' | 'indigo' | 'sky' | 'amber' | 'violet' | 'rose';
}

export const PUBLIC_PRIMARY_LINKS: PublicNavLinkItem[] = [
  { key: 'home', label: 'মূল পাতা', href: '#home' },
  { key: 'about', label: 'পরিচিতি', href: '#about' },
];

export const PUBLIC_SECONDARY_LINKS: PublicNavLinkItem[] = [
  { key: 'notices', label: 'নোটিশ', href: '#notices' },
  { key: 'gallery', label: 'গ্যালারি', href: '#gallery' },
  { key: 'contact', label: 'যোগাযোগ', href: '#contact' },
];

export const PUBLIC_ACADEMIC_ITEMS: PublicAcademicMenuItem[] = [
  {
    href: '#principal',
    sectionId: 'principal',
    label: 'নেতৃবৃন্দের বাণী',
    hint: 'সভাপতি ও প্রধান শিক্ষকের বক্তব্য',
    iconKey: 'user-tie',
    tone: 'indigo',
  },
  {
    href: '#teachers',
    sectionId: 'teachers',
    label: 'শিক্ষকমণ্ডলী',
    hint: 'অভিজ্ঞ ও নিবেদিতপ্রাণ শিক্ষকবৃন্দ',
    iconKey: 'teachers',
    tone: 'violet',
  },
  {
    href: '#academic',
    sectionId: 'academic',
    label: 'শ্রেণি ও বিভাগ',
    hint: 'বিজ্ঞান, মানবিক ও ব্যবসায় শিক্ষা',
    iconKey: 'layers',
    tone: 'emerald',
  },
  {
    href: '#student-stats',
    sectionId: 'student-stats',
    label: 'শিক্ষার্থী পরিসংখ্যান',
    hint: 'এক নজরে ও শ্রেণিভিত্তিক সংখ্যা',
    iconKey: 'stats',
    tone: 'sky',
  },
  {
    href: '#best-students',
    sectionId: 'best-students',
    label: 'কৃতী শিক্ষার্থী',
    hint: 'মেধাবী ও শীর্ষস্থানীয় শিক্ষার্থীবৃন্দ',
    iconKey: 'trophy',
    tone: 'amber',
  },
  {
    href: '#facilities',
    sectionId: 'facilities',
    label: 'সুযোগ-সুবিধা',
    hint: 'আইসিটি ল্যাব, বিজ্ঞানাগার ও লাইব্রেরি',
    iconKey: 'facilities',
    tone: 'teal',
  },
  {
    href: '#committee',
    sectionId: 'committee',
    label: 'পরিচালনা পর্ষদ',
    hint: 'ম্যানেজিং কমিটির সদস্যবৃন্দ',
    iconKey: 'committee',
    tone: 'rose',
  },
];

export const PUBLIC_SECTION_TO_NAV: Record<string, PublicNavKey> = {
  home: 'home',
  services: 'home',
  about: 'about',
  principal: 'academics',
  headmaster: 'academics',
  teachers: 'academics',
  faculty: 'academics',
  'student-stats': 'academics',
  'student-info': 'academics',
  stats: 'academics',
  academic: 'academics',
  committee: 'academics',
  smc: 'academics',
  'best-students': 'academics',
  facilities: 'academics',
  notices: 'notices',
  gallery: 'gallery',
  blog: 'gallery',
  contact: 'contact',
  faq: 'contact',
  'mobile-app': 'contact',
};

/**
 * Resolves any public link cleanly based on current pathname.
 * Fixes legacy hash-routes (`#/admission`, `#/login`) and ensures `#section` links
 * navigate back to `/#section` when clicked from a subpage.
 */
export function resolvePublicHref(rawHref: string | undefined | null, pathname = '/'): string {
  const href = (rawHref || '').trim();
  if (!href) return '/';

  // Fix legacy malformed hash routes like "#/admission" or "#/login"
  if (href.startsWith('#/')) {
    return href.slice(1);
  }

  // Protect public visitors from admin-only certificate route in legacy CMS defaults
  if (href === '/dashboard/certificates' || href === '/dashboard/certificates/') {
    return '/verify-certificate';
  }

  if (href.startsWith('#')) {
    const isHome = pathname === '/' || pathname === '' || pathname === '/index.html';
    if (href === '#') return isHome ? '#home' : '/';
    return isHome ? href : `/${href}`;
  }

  return href;
}

/**
 * Known external stock URLs that fail CORS/ORB or break offline; always fallback safely.
 */
const BLOCKED_EXTERNAL_IMAGE_PATTERNS = [
  'photo-1523050854058-8df90110c9f1',
];

export function sanitizePublicImageUrl(
  url: string | null | undefined,
  fallback = '/school-campus.jpg'
): string {
  const clean = (url || '').trim();
  if (!clean || clean === '#' || clean === 'null' || clean === 'undefined') {
    return fallback;
  }
  if (BLOCKED_EXTERNAL_IMAGE_PATTERNS.some((pattern) => clean.includes(pattern))) {
    return fallback;
  }
  return clean;
}

/**
 * Normalized public notice item shared across Notice Ticker & Notice Board.
 */
export interface PublicNoticeViewItem {
  id: string;
  title: string;
  date: string;
  category: string;
  description: string;
  isUrgent: boolean;
  refNo?: string;
}

const CATEGORY_LABEL_MAP: Record<string, string> = {
  Exam: 'পরীক্ষা',
  exam: 'পরীক্ষা',
  Routine: 'রুটিন',
  routine: 'রুটিন',
  Holiday: 'ছুটি',
  holiday: 'ছুটি',
  Academic: 'একাডেমিক',
  academic: 'একাডেমিক',
  Admission: 'ভর্তি',
  admission: 'ভর্তি',
  General: 'সাধারণ',
  general: 'সাধারণ',
  Urgent: 'জরুরি',
  urgent: 'জরুরি',
  Notice: 'সাধারণ',
};

export const DEFAULT_PUBLIC_NOTICES: PublicNoticeViewItem[] = [
  {
    id: 'NTC-001',
    title: '২০২৬ সালের এসএসসি পরীক্ষার ফরম পূরণ ও ফি জমাদান সংক্রান্ত জরুরি বিজ্ঞপ্তি',
    date: '১৯ অক্টোবর ২০২৬',
    category: 'পরীক্ষা',
    isUrgent: true,
    refNo: 'ব.উ.বি/নোটিশ/২০২৬/০১',
    description:
      'এতদ্বারা অত্র বিদ্যালয়ের ২০২৬ সালের এসএসসি পরীক্ষার্থী ও তাদের অভিভাবকদের অবগতির জন্য জানানো যাচ্ছে যে, নির্ধারিত সময়ের মধ্যে বোর্ড নির্ধারিত ফরম পূরণ ও যাবতীয় বকেয়া ফি পরিশোধ করতে হবে। বিস্তারিত ফি বিবরণী অফিস কক্ষে ও অনলাইন পোর্টালে পাওয়া যাবে।',
  },
  {
    id: 'NTC-002',
    title: 'সাময়িক পরীক্ষার সময়সূচি (রুটিন) প্রকাশ ও প্রবেশপত্র বিতরণ প্রসঙ্গে',
    date: '১৫ অক্টোবর ২০২৬',
    category: 'রুটিন',
    isUrgent: false,
    refNo: 'ব.উ.বি/নোটিশ/২০২৬/০২',
    description:
      'অত্র বিদ্যালয়ের ৬ষ্ঠ থেকে ১০ম শ্রেণির সকল শিক্ষার্থীদের জানানো যাচ্ছে যে, আসন্ন সাময়িক পরীক্ষার পূর্ণাঙ্গ সময়সূচি প্রকাশিত হয়েছে। সকল শিক্ষার্থীকে নির্ধারিত তারিখের মধ্যে হিসাব শাখা থেকে প্রবেশপত্র (Admit Card) সংগ্রহের নির্দেশ দেওয়া হলো।',
  },
  {
    id: 'NTC-003',
    title: '২০২৬ শিক্ষাবর্ষে ৬ষ্ঠ থেকে ৯ম শ্রেণিতে অনলাইন ভর্তি আবেদন গ্রহণ শুরু',
    date: '১২ অক্টোবর ২০২৬',
    category: 'ভর্তি',
    isUrgent: true,
    refNo: 'ব.উ.বি/ভর্তি/২০২৬/০৩',
    description:
      'আগ্রহী শিক্ষার্থী ও অভিভাবকগণ বিদ্যালয়ের ওয়েবসাইটের "অনলাইন ভর্তি" পোর্টালের মাধ্যমে ঘরে বসেই আবেদনপত্র পূরণ করে স্বয়ংক্রিয় SMS নিশ্চিতকরণ এবং A4 প্রিন্ট স্লিপ সংগ্রহ করতে পারবেন।',
  },
  {
    id: 'NTC-004',
    title: 'অভিভাবক সমাবেশ ও ৬ষ্ঠ–১০ম শ্রেণির প্রগতিপত্র (রিপোর্ট কার্ড) বিতরণ',
    date: '০৫ অক্টোবর ২০২৬',
    category: 'সাধারণ',
    isUrgent: false,
    refNo: 'ব.উ.বি/নোটিশ/২০২৬/০৪',
    description:
      'শিক্ষার্থীদের পরীক্ষার ফলাফল মূল্যায়ন ও সার্বিক অগ্রগতি পর্যালোচনা উপলক্ষে বিদ্যালয় অডিটোরিয়ামে অভিভাবক সমাবেশের আয়োজন করা হয়েছে। সকল সম্মানিত অভিভাবককে যথাসময়ে উপস্থিত থাকার জন্য বিনীত অনুরোধ করা হচ্ছে।',
  },
  {
    id: 'NTC-005',
    title: 'বার্ষিক ক্রীড়া, বিজ্ঞান মেলা ও সাংস্কৃতিক প্রতিযোগিতা ২০২৬-এর রেজিস্ট্রেশন',
    date: '২৮ সেপ্টেম্বর ২০২৬',
    category: 'সহশিক্ষা',
    isUrgent: false,
    refNo: 'ব.উ.বি/সহশিক্ষা/২০২৬/০৫',
    description:
      'শিক্ষার্থীদের সৃজনশীল ও মানসিক বিকাশের লক্ষ্যে বার্ষিক ক্রীড়া, বিতর্ক ও বিজ্ঞান মেলা অনুষ্ঠিত হবে। আগ্রহী শিক্ষার্থীদের নিজ নিজ শ্রেণি শিক্ষকের নিকট নাম তালিকাভুক্ত করার নির্দেশ দেওয়া হলো।',
  },
];

function formatNoticeDateBn(raw?: string): string {
  if (!raw || !raw.trim()) return 'সদ্য প্রকাশিত';
  // Already contains Bangla characters
  if (/[\u0980-\u09FF]/.test(raw)) return raw;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return toBanglaDigits(raw);
  try {
    return parsed.toLocaleDateString('bn-BD', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return toBanglaDigits(raw);
  }
}

export function normalizeNoticeCategory(raw?: string): string {
  const key = (raw || '').trim();
  if (!key) return 'সাধারণ';
  return CATEGORY_LABEL_MAP[key] || key;
}

export function resolvePublicNotices(liveNotices?: Notice[] | null): PublicNoticeViewItem[] {
  const validLive = (liveNotices || []).filter(
    (n) => n && typeof n.title === 'string' && n.title.trim().length > 0
  );

  if (validLive.length === 0) {
    return DEFAULT_PUBLIC_NOTICES;
  }

  return validLive.map((n, idx) => {
    const anyNotice = n as Notice & {
      date?: string;
      description?: string;
      priority?: string;
      isPinned?: boolean;
      isUrgent?: boolean;
      refNo?: string;
    };
    const cat = normalizeNoticeCategory(anyNotice.category);
    const priorityLow = String(anyNotice.priority || '').toLowerCase();
    const isUrgent = Boolean(
      anyNotice.isUrgent ||
        anyNotice.isPinned ||
        priorityLow === 'urgent' ||
        priorityLow === 'high' ||
        priorityLow === 'important' ||
        cat === 'জরুরি'
    );
    return {
      id: anyNotice.id || `LIVE-NTC-${idx + 1}`,
      title: anyNotice.title.trim(),
      date: formatNoticeDateBn(anyNotice.publishedAt || anyNotice.date),
      category: cat,
      description:
        (anyNotice.content || anyNotice.description || '').trim() ||
        'বিস্তারিত তথ্যের জন্য বিদ্যালয় অফিস কক্ষে যোগাযোগ করুন।',
      isUrgent,
      refNo: anyNotice.refNo || `ব.উ.বি/নোটিশ/${toBanglaDigits(new Date().getFullYear())}/${toBanglaDigits(idx + 1)}`,
    };
  });
}

/**
 * Public E-Services card resolver (honors CMS servicesConfig while fixing legacy admin links).
 */
export interface PublicServiceViewCard {
  id: string;
  title: string;
  subtitleEn: string;
  description: string;
  href: string;
  ctaText: string;
  badge: string;
  iconKey: string;
  accent: 'emerald' | 'indigo' | 'amber' | 'sky' | 'violet' | 'teal';
}

export const DEFAULT_PUBLIC_SERVICE_CARDS: PublicServiceViewCard[] = [
  {
    id: 'srv-admission',
    title: 'অনলাইন ভর্তি আবেদন',
    subtitleEn: 'Online Admission Portal',
    description:
      '৬ষ্ঠ থেকে ১০ম শ্রেণিতে ঘরে বসেই অনলাইন ভর্তি ফরম পূরণ, স্বয়ংক্রিয় SMS নিশ্চিতকরণ এবং A4 প্রিন্ট স্লিপ সংগ্রহ করুন।',
    href: '/admission',
    ctaText: 'ভর্তি আবেদন করুন',
    badge: 'ভর্তি চলছে',
    iconKey: 'UserPlus',
    accent: 'emerald',
  },
  {
    id: 'srv-result',
    title: 'পরীক্ষার ফলাফল ও মার্কশিট',
    subtitleEn: 'Online Result & Transcript',
    description:
      'পরীক্ষা, শ্রেণি ও রোল নম্বর দিয়ে তাৎক্ষণিক ফলাফল, বিষয়ভিত্তিক গ্রেড বিশ্লেষণ ও অফিশিয়াল A4 মার্কশিট ডাউনলোড করুন।',
    href: '/result',
    ctaText: 'ফলাফল দেখুন',
    badge: 'অফিশিয়াল মার্কশিট',
    iconKey: 'GraduationCap',
    accent: 'indigo',
  },
  {
    id: 'srv-verify',
    title: 'সনদ ও মানি রিসিপ্ট যাচাই',
    subtitleEn: 'QR Certificate Verification',
    description:
      'প্রশংসাপত্র, টিসি, প্রত্যয়নপত্র ও ফি জমার ডিজিটাল রসিদের সত্যতা QR কোড বা রেফারেন্স নম্বর দিয়ে তাৎক্ষণিক যাচাই করুন।',
    href: '/verify-certificate',
    ctaText: 'সনদ যাচাই করুন',
    badge: 'তাৎক্ষণিক QR যাচাই',
    iconKey: 'ShieldCheck',
    accent: 'amber',
  },
  {
    id: 'srv-teacher',
    title: 'শিক্ষক পোর্টাল লগইন',
    subtitleEn: 'Teacher Workspace & Marks',
    description:
      'শিক্ষকদের জন্য ডিজিটাল হাজিরা, পরীক্ষার নম্বর এন্ট্রি, ক্লাস রুটিন, ছুটির আবেদন ও SMS OTP পাসওয়ার্ড রিকভারি।',
    href: '/login?role=teacher',
    ctaText: 'শিক্ষক লগইন',
    badge: 'শিক্ষক কর্নার',
    iconKey: 'Users',
    accent: 'violet',
  },
  {
    id: 'srv-mobile',
    title: 'অভিভাবক ও মোবাইল অ্যাপ',
    subtitleEn: 'Smart Campus Mobile App',
    description:
      'অভিভাবক ও শিক্ষকদের জন্য রিয়েল-টাইম হাজিরা, পরীক্ষার আপডেট, রুটিন, হোমওয়ার্ক ও বকেয়া ফি দেখার স্মার্ট মোবাইল অ্যাপ।',
    href: '/mobile-app',
    ctaText: 'মোবাইল অ্যাপ খুলুন',
    badge: 'Android ও ওয়েব',
    iconKey: 'Smartphone',
    accent: 'sky',
  },
  {
    id: 'srv-admin',
    title: 'সেন্ট্রাল অ্যাডমিন ড্যাশবোর্ড',
    subtitleEn: 'Principal & Office Control',
    description:
      'প্রধান শিক্ষক ও অফিস প্রশাসনের জন্য শিক্ষার্থী ব্যবস্থাপনা, ফলাফল প্রকাশ, হিসাবরক্ষণ ও সনদ ইস্যুর পূর্ণাঙ্গ নিয়ন্ত্রণ।',
    href: '/login',
    ctaText: 'অ্যাডমিন লগইন',
    badge: 'প্রশাসনিক প্যানেল',
    iconKey: 'LayoutDashboard',
    accent: 'teal',
  },
];

const ACCENT_ROTATION: PublicServiceViewCard['accent'][] = [
  'emerald',
  'indigo',
  'amber',
  'violet',
  'sky',
  'teal',
];

function inferCtaLabel(href: string): string {
  if (href.startsWith('/admission')) return 'ভর্তি আবেদন করুন';
  if (href.startsWith('/result')) return 'ফলাফল দেখুন';
  if (href.startsWith('/verify')) return 'যাচাই করুন';
  if (href.includes('role=teacher')) return 'শিক্ষক লগইন';
  if (href.startsWith('/mobile-app')) return 'অ্যাপ ওপেন করুন';
  if (href.startsWith('/login')) return 'পোর্টালে প্রবেশ';
  return 'বিস্তারিত দেখুন';
}

function mapBadgeAccent(
  badgeColor: string | undefined,
  idx: number
): PublicServiceViewCard['accent'] {
  switch (badgeColor) {
    case 'emerald':
      return 'emerald';
    case 'blue':
    case 'indigo':
      return 'indigo';
    case 'amber':
      return 'amber';
    case 'purple':
    case 'violet':
      return 'violet';
    case 'sky':
    case 'cyan':
      return 'sky';
    default:
      return ACCENT_ROTATION[idx % ACCENT_ROTATION.length];
  }
}

export function resolvePublicServices(
  servicesConfig?: ServicesConfig | null
): PublicServiceViewCard[] {
  const cmsCards = (servicesConfig?.cards || []).filter((c: ServiceCard) => c && c.visible !== false);
  if (cmsCards.length === 0) {
    return DEFAULT_PUBLIC_SERVICE_CARDS;
  }

  // Detect stock unmodified 4-card default so we show the richer 6-card balanced bento layout
  const isUnmodifiedLegacyDefaults =
    cmsCards.length === 4 &&
    cmsCards.every((c, i) => c.id === `srv-${i + 1}`) &&
    cmsCards[2]?.link === '/dashboard/certificates';

  if (isUnmodifiedLegacyDefaults) {
    return DEFAULT_PUBLIC_SERVICE_CARDS;
  }

  return cmsCards.map((c, idx) => {
    const safeHref = resolvePublicHref(c.link, '/');
    return {
      id: c.id || `cms-srv-${idx}`,
      title: c.title,
      subtitleEn: '',
      description: c.description,
      href: safeHref,
      ctaText: inferCtaLabel(safeHref),
      badge: c.badge || 'অনলাইন সেবা',
      iconKey: c.icon || 'Sparkles',
      accent: mapBadgeAccent(c.badgeColor, idx),
    };
  });
}

/**
 * Consistent contact & institutional metadata shared by PublicContactSection and PublicFooter.
 */
export interface ResolvedPublicContactInfo {
  schoolName: string;
  address: string;
  phone1: string;
  phone2: string;
  email1: string;
  email2: string;
  officeHours: string;
  eiin: string;
  schoolCode: string;
  regNo: string;
  mapEmbedUrl: string;
  socialLinks: {
    facebook: string;
    youtube: string;
    twitter: string;
    linkedin: string;
  };
  copyrightText: string;
}

function isPlaceholderContact(val?: string | null): boolean {
  if (!val || !val.trim()) return true;
  const trimmed = val.trim();
  return /x{3,}/i.test(trimmed) || trimmed === '#' || trimmed === '-';
}

function normalizeDistrictSpelling(text: string): string {
  return text.replace(/চকোরিয়া/g, 'চকরিয়া').replace(/চকোরিয়া/g, 'চকরিয়া');
}

export function resolvePublicContactInfo(
  settings?: SchoolSettings | null,
  contactConfig?: ContactConfig | null,
  footerConfig?: FooterConfig | null
): ResolvedPublicContactInfo {
  const schoolName = (settings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়').trim();
  const rawAddress =
    settings?.address?.trim() ||
    contactConfig?.address?.trim() ||
    footerConfig?.address?.trim() ||
    'বরইতলী, চকরিয়া, কক্সবাজার।';

  const phone1Candidate = !isPlaceholderContact(settings?.phone)
    ? settings!.phone.trim()
    : !isPlaceholderContact(contactConfig?.phone1)
    ? contactConfig!.phone1.trim()
    : !isPlaceholderContact(footerConfig?.phone1)
    ? footerConfig!.phone1.trim()
    : '+৮৮০ ১৮১২-৩৪৫৬৭৮';

  const phone2Candidate = !isPlaceholderContact(contactConfig?.phone2)
    ? contactConfig!.phone2.trim()
    : !isPlaceholderContact(footerConfig?.phone2)
    ? footerConfig!.phone2.trim()
    : '';

  const email1Candidate = !isPlaceholderContact(settings?.email)
    ? settings!.email.trim()
    : !isPlaceholderContact(contactConfig?.email1)
    ? contactConfig!.email1.trim()
    : !isPlaceholderContact(footerConfig?.email1)
    ? footerConfig!.email1.trim()
    : 'info@baraitolihs.edu.bd';

  const email2Candidate = !isPlaceholderContact(contactConfig?.email2)
    ? contactConfig!.email2.trim()
    : !isPlaceholderContact(footerConfig?.email2)
    ? footerConfig!.email2.trim()
    : '';

  const officeHours =
    contactConfig?.officeHours?.trim() || 'রবিবার – বৃহস্পতিবার: সকাল ৯:০০ টা – বিকাল ৪:০০ টা';

  const eiin = toBanglaDigits(settings?.eiin?.trim() || footerConfig?.eiin?.trim() || '106184');
  const schoolCode = toBanglaDigits(footerConfig?.schoolCode?.trim() || '৩২০১');
  const regNo = footerConfig?.regNo?.trim() || 'সি-১৯৬৯/চক';

  const cleanSocial = (url?: string) => {
    const u = (url || '').trim();
    if (!u || u === '#' || u === 'https://#' || u === 'http://#') return '';
    return u;
  };

  const currentYearBn = toBanglaDigits(new Date().getFullYear());

  return {
    schoolName,
    address: normalizeDistrictSpelling(rawAddress),
    phone1: phone1Candidate,
    phone2: phone2Candidate && phone2Candidate !== phone1Candidate ? phone2Candidate : '',
    email1: email1Candidate,
    email2: email2Candidate && email2Candidate !== email1Candidate ? email2Candidate : '',
    officeHours,
    eiin,
    schoolCode,
    regNo,
    mapEmbedUrl: (contactConfig?.mapEmbedUrl || '').trim(),
    socialLinks: {
      facebook: cleanSocial(footerConfig?.socialLinks?.facebook),
      youtube: cleanSocial(footerConfig?.socialLinks?.youtube),
      twitter: cleanSocial(footerConfig?.socialLinks?.twitter),
      linkedin: cleanSocial(footerConfig?.socialLinks?.linkedin),
    },
    copyrightText:
      footerConfig?.copyrightText?.trim() || `© ${currentYearBn} ${schoolName}। সর্বস্বত্ব সংরক্ষিত।`,
  };
}

/**
 * Extracts unique gallery categories and filters items cleanly.
 */
export function getGalleryCategories(items: GalleryMediaItem[]): string[] {
  const seen = new Set<string>();
  items.forEach((item) => {
    const cat = (item.category || '').trim();
    if (cat) seen.add(cat);
  });
  return ['সকল', ...Array.from(seen)];
}

export function filterGalleryItems(
  items: GalleryMediaItem[],
  category: string
): GalleryMediaItem[] {
  if (!category || category === 'সকল') return items;
  return items.filter((item) => (item.category || '').trim() === category);
}

/**
 * Searches submitted online admission applications by APP-ID, phone (Bangla/English digits),
 * or birth registration number for the /admission "Track Application" tab.
 */
export function findSubmittedAdmissionApplications(
  apps: OnlineApplicationRecord[],
  rawQuery: string
): OnlineApplicationRecord[] {
  const trimmed = (rawQuery || '').trim();
  if (!trimmed) return [];

  const lower = trimmed.toLowerCase();
  const digits = normalizeRollDigits(trimmed).replace(/\D/g, '');

  return apps
    .filter((app) => {
      if (!app) return false;
      const appId = (app.appId || app.id || '').toLowerCase();
      if (appId && (appId === lower || appId.includes(lower))) {
        return true;
      }

      if (digits.length >= 6) {
        const appPhone = normalizeRollDigits(app.mobile || '').replace(/\D/g, '');
        const appBirthReg = normalizeRollDigits(app.birthRegNo || '').replace(/\D/g, '');
        if (appPhone && (appPhone === digits || appPhone.endsWith(digits) || appPhone.includes(digits))) {
          return true;
        }
        if (appBirthReg && (appBirthReg === digits || appBirthReg.includes(digits))) {
          return true;
        }
      }

      return false;
    })
    .sort((a, b) => {
      const ta = a.appliedAt ? new Date(a.appliedAt).getTime() : 0;
      const tb = b.appliedAt ? new Date(b.appliedAt).getTime() : 0;
      return tb - ta;
    });
}
