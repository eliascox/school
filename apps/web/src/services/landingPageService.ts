/**
 * 🌐 Landing Page Management Service (CMS)
 * 
 * Complete production-ready service managing draft & published configurations,
 * section ordering, visual design tokens, media library, audit log, version snapshots,
 * and rollback functionality for the public landing page.
 */

export interface NavMenuItem {
  id: string;
  label: string;
  href: string;
  isExternal?: boolean;
  isButton?: boolean;
  buttonStyle?: 'primary' | 'secondary' | 'outline';
  visible: boolean;
  order: number;
}

export interface HeaderConfig {
  schoolName: string;
  schoolSlogan: string;
  logoUrl: string;
  showLogo: boolean;
  showTopbar: boolean;
  topbarPhone: string;
  topbarEmail: string;
  topbarAddress: string;
  topbarNotice: string;
  showNoticeTicker: boolean;
  sticky: boolean;
  navLinks: NavMenuItem[];
}

export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  ctaText?: string;
  ctaLink?: string;
}

export interface HeroConfig {
  enabled: boolean;
  badgeText: string;
  title: string;
  subtitle: string;
  description: string;
  bgType: 'gradient' | 'image' | 'solid';
  bgImage: string;
  bgGradientFrom: string;
  bgGradientTo: string;
  bgOverlayOpacity: number;
  primaryCta: {
    text: string;
    href: string;
    visible: boolean;
    openNewTab: boolean;
    style: string;
  };
  secondaryCta: {
    text: string;
    href: string;
    visible: boolean;
    openNewTab: boolean;
    style: string;
  };
  slides: HeroSlide[];
  enableSlider: boolean;
}

export interface SectionItem {
  id: string;
  key: string;
  nameBn: string;
  nameEn: string;
  type: 'builtin' | 'custom' | 'template';
  enabled: boolean;
  order: number;
  icon: string;
  description: string;
  customData?: any;
}

export interface ClassStatItem {
  id: string;
  className: string;
  count: number;
  icon: string;
  visible: boolean;
}

export interface StatsConfig {
  enabled: boolean;
  title: string;
  subtitle: string;
  bgColor: string;
  textColor: string;
  animatedCounter: boolean;
  classStats: ClassStatItem[];
  totalStudentsOverride?: number;
  totalTeachersOverride?: number;
  passingRate: string;
}

export interface ServiceCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  link: string;
  badge?: string;
  badgeColor?: string;
  visible: boolean;
}

export interface ServicesConfig {
  enabled: boolean;
  title: string;
  subtitle: string;
  cards: ServiceCard[];
}

export interface AchieverStudent {
  id: string;
  name: string;
  class: string;
  roll: string;
  year: string;
  gpa?: string;
  photo: string;
  awardBadge: string;
  visible: boolean;
}

export interface AchieversConfig {
  enabled: boolean;
  title: string;
  subtitle: string;
  viewAllLink: string;
  students: AchieverStudent[];
}

export interface AboutConfig {
  enabled: boolean;
  title: string;
  subtitle: string;
  historyText: string;
  missionText: string;
  visionText: string;
  foundingYear: string;
  eiin: string;
  campusPhoto: string;
  headmaster: {
    name: string;
    title: string;
    photo: string;
    message: string;
    visible: boolean;
  };
  president?: {
    name: string;
    title: string;
    photo: string;
    message: string;
    visible: boolean;
  };
  assistantHeadmaster?: {
    name: string;
    title: string;
    photo: string;
    message: string;
    visible: boolean;
  };
}

export interface FacilityItem {
  id: string;
  title: string;
  titleEn?: string;
  description: string;
  icon: string;
  badge?: string;
  color?: string;
  photo?: string;
  visible: boolean;
}

export interface AcademicProgramItem {
  id: string;
  grade: string;
  gradeEn?: string;
  focus: string;
  features: string[];
  icon?: string;
  color?: string;
  visible?: boolean;
}

export interface AcademicStreamItem {
  id: string;
  name: string;
  nameEn?: string;
  badge?: string;
  subjects: string;
  desc: string;
  icon?: string;
  color?: string;
  visible?: boolean;
}

export interface AcademicConfig {
  enabled: boolean;
  eyebrow: string;
  title: string;
  subtitle: string;
  departmentsTitle: string;
  programs: AcademicProgramItem[];
  streams: AcademicStreamItem[];
}

export interface FacilitiesConfig {
  enabled: boolean;
  title: string;
  subtitle: string;
  eyebrow?: string;
  items: FacilityItem[];
}

export interface GalleryMediaItem {
  id: string;
  type: 'image' | 'video';
  title: string;
  category: string;
  thumbnail: string;
  date: string;
  videoUrl?: string;
  caption: string;
  visible?: boolean;
}

export interface GalleryConfig {
  enabled: boolean;
  eyebrow?: string;
  title: string;
  subtitle: string;
  items: GalleryMediaItem[];
}

export interface BlogPostItem {
  id: string;
  title: string;
  date: string;
  author: string;
  summary: string;
  imageUrl: string;
  link: string;
  visible: boolean;
}

export interface BlogConfig {
  enabled: boolean;
  title: string;
  subtitle: string;
  viewAllLink: string;
  posts: BlogPostItem[];
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  visible: boolean;
}

export interface FAQConfig {
  enabled: boolean;
  title: string;
  subtitle: string;
  items: FAQItem[];
}

export interface MobileAppFeature {
  id: string;
  title: string;
  desc: string;
  icon: string;
  color?: string;
}

export interface MobileAppConfig {
  enabled: boolean;
  eyebrow: string;
  title: string;
  subtitle: string;
  description: string;
  apkDownloadUrl: string;
  playStoreUrl: string;
  appStoreUrl: string;
  version: string;
  fileSize: string;
  releaseDate: string;
  rating: string;
  downloadCount: string;
  qrCodeUrl?: string;
  features: MobileAppFeature[];
}

export const DEFAULT_MOBILE_APP_CONFIG: MobileAppConfig = {
  enabled: true,
  eyebrow: '📱 অফিসিয়াল মোবাইল অ্যাপ',
  title: 'আমাদের স্কুলের মোবাইল অ্যাপ ডাউনলোড করুন',
  subtitle: 'শিক্ষার্থী, অভিভাবক ও শিক্ষকদের জন্য স্মার্ট হাজিরা, নোটিফিকেশন, পরীক্ষার ফলাফল ও ফি পরিশোধের সমন্বিত প্ল্যাটফর্ম।',
  description: 'স্মার্টফোন থেকেই পেয়ে যান সন্তানের প্রতিদিনের উপস্থিতি, পরীক্ষার গ্রেডশিট, ক্লাস রুটিন, ডায়েরি এবং জরুরি নোটিশ। এছাড়াও ঘরে বসেই বিকাশ বা নগদের মাধ্যমে স্কুলের যাবতীয় ফি নিরাপদে পরিশোধ করুন।',
  apkDownloadUrl: '/downloads/baraitoli-school.apk',
  playStoreUrl: 'https://play.google.com/store',
  appStoreUrl: 'https://www.apple.com/app-store/',
  version: '১.২.০ (v1.2.0)',
  fileSize: '১৮.৪ মেগাবাইট (18.4 MB)',
  releaseDate: 'অক্টোবর ২০২৬',
  rating: '৪.৯',
  downloadCount: '১,২০০+',
  features: [
    {
      id: 'feat-1',
      title: 'ইনস্ট্যান্ট নোটিফিকেশন ও পুশ অ্যালার্ট',
      desc: 'পরীক্ষার সময়সূচি, জরুরি নোটিশ ও ছুটির বার্তা সাথে সাথে মোবাইলে পেয়ে যান।',
      icon: 'Bell',
      color: 'emerald',
    },
    {
      id: 'feat-2',
      title: 'স্মার্ট ডিজিটাল হাজিরা ও ট্র্যাকিং',
      desc: 'প্রতিদিনের প্রবেশ ও প্রস্থানের সময়সহ রিয়েল-টাইম উপস্থিতি এবং অনুপস্থিতির এসএমএস।',
      icon: 'CheckCircle2',
      color: 'blue',
    },
    {
      id: 'feat-3',
      title: 'পরীক্ষার ফলাফল ও গ্রেডশিট',
      desc: 'সাময়িক ও বার্ষিক পরীক্ষার বিস্তারিত মার্কশিট এবং একাডেমিক প্রগ্রেস রিপোর্ট।',
      icon: 'FileText',
      color: 'violet',
    },
    {
      id: 'feat-4',
      title: 'অনলাইন ফি ও বেতন পরিশোধ',
      desc: 'বিকাশ, নগদ বা রকেটের মাধ্যমে সরাসরি টিউশন ফি পরিশোধ ও ডিজিটাল রসিদ সংগ্রহ।',
      icon: 'CreditCard',
      color: 'amber',
    },
    {
      id: 'feat-5',
      title: 'ক্লাস রুটিন ও শিক্ষকের ডায়েরি',
      desc: 'দৈনিক ক্লাসের রুটিন, বাড়ির কাজ (Home Work) এবং ক্লাস টিচারের বিশেষ নির্দেশনা।',
      icon: 'Calendar',
      color: 'rose',
    },
    {
      id: 'feat-6',
      title: 'অফলাইন সিঙ্ক ও দ্রুত গতি',
      desc: 'ইন্টারনেট না থাকলেও রুটিন, নোটিশ ও প্রোফাইল ডাটা অফলাইনে দেখার সুবিধা।',
      icon: 'Smartphone',
      color: 'indigo',
    },
  ],
};

export interface ContactConfig {
  enabled: boolean;
  title: string;
  subtitle: string;
  address: string;
  phone1: string;
  phone2: string;
  email1: string;
  email2: string;
  mapEmbedUrl: string;
  officeHours: string;
}

export interface FooterColumnLink {
  id: string;
  label: string;
  href: string;
  isExternal: boolean;
}

export interface FooterConfig {
  col1Title: string;
  col1Links: FooterColumnLink[];
  col2Title: string;
  col2Links: FooterColumnLink[];
  col3Title: string;
  address: string;
  phone1: string;
  phone2: string;
  email1: string;
  email2: string;
  col4Title: string;
  eiin: string;
  schoolCode: string;
  regNo: string;
  socialLinks: {
    facebook: string;
    youtube: string;
    twitter: string;
    linkedin: string;
  };
  copyrightText: string;
}

export interface ThemeConfig {
  primaryColor: string;
  primaryHover: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  cardBgColor: string;
  textColor: string;
  fontFamily: 'SolaimanLipi' | 'Hind Siliguri' | 'Noto Sans Bengali' | 'Inter' | 'system-ui';
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  containerWidth: 'boxed' | 'wide' | 'full';
  sectionSpacing: 'compact' | 'normal' | 'relaxed';
  darkMode: boolean;
}

export interface SEOConfig {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  favicon: string;
  canonicalUrl: string;
  robotsIndex: boolean;
  robotsFollow: boolean;
}

export interface MediaItem {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  dimensions?: string;
  uploadedAt: string;
  altText: string;
  category: 'logo' | 'banner' | 'student' | 'teacher' | 'gallery' | 'facility' | 'other';
}

export interface LandingPageConfig {
  version: number;
  lastUpdatedAt: string;
  updatedBy: string;
  header: HeaderConfig;
  hero: HeroConfig;
  sections: SectionItem[];
  stats: StatsConfig;
  services: ServicesConfig;
  about: AboutConfig;
  achievers: AchieversConfig;
  facilities: FacilitiesConfig;
  gallery?: GalleryConfig;
  academic?: AcademicConfig;
  blog: BlogConfig;
  faq: FAQConfig;
  contact: ContactConfig;
  mobileApp?: MobileAppConfig;
  footer: FooterConfig;
  theme: ThemeConfig;
  seo: SEOConfig;
}

export interface VersionSnapshot {
  id: string;
  version: number;
  timestamp: string;
  author: string;
  summary: string;
  config: LandingPageConfig;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  details: string;
}

export const DEFAULT_ACADEMIC_CONFIG: AcademicConfig = {
  enabled: true,
  eyebrow: 'একাডেমিক কার্যক্রম ও পাঠ্যক্রম',
  title: 'শ্রেণিভিত্তিক শিক্ষা কার্যক্রম ও শাখা বিভাগ',
  subtitle: 'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB) এবং মাধ্যমিক ও উচ্চ মাধ্যমিক শিক্ষা বোর্ড (BISE) চট্টগ্রাম অনুমোদিত শিক্ষাক্রম অনুসরণে পরিচালিত।',
  departmentsTitle: '৯ম ও ১০ম শ্রেণির বিশেষায়িত বিভাগসমূহ (এসএসসি পর্যায়)',
  programs: [
    {
      id: 'prog-1',
      grade: '৬ষ্ঠ ও ৭ম শ্রেণি (ভিত্তি স্তর)',
      gradeEn: 'Class 6 & 7 (Foundation Stage)',
      focus: 'নতুন জাতীয় শিক্ষাক্রম অনুযায়ী অভিজ্ঞতা ও যোগ্যতাভিত্তিক পাঠদান',
      features: [
        'সৃজনশীল মেধা ও মননশীলতার নান্দনিক বিকাশ',
        'প্রাথমিক আইসিটি ও ব্যবহারিক সাধারণ বিজ্ঞান শিক্ষা',
        'নৈতিক মূল্যবোধ, জীবনাচার ও শারীরিক সুস্থতা চর্চা'
      ],
      icon: 'Sparkles',
      color: 'emerald',
      visible: true
    },
    {
      id: 'prog-2',
      grade: '৮ম শ্রেণি (জুনিয়র সেকেন্ডারি)',
      gradeEn: 'Class 8 (Junior Secondary)',
      focus: 'শাখা নির্বাচনের পূর্বপ্রস্তুতি ও বিশ্লেষণধর্মী মৌলিক দক্ষতা অর্জন',
      features: [
        'গণিত ও ইংরেজি বিষয়ে বিশেষ নিবিড় তত্ত্বাবধান',
        'ব্যবহারিক কম্পিউটার সাক্ষরতা ও বাস্তব প্রয়োগ',
        'ধারাবাহিক শিখনকালীন মূল্যায়ন ও অগ্রগতির ট্র্যাকিং'
      ],
      icon: 'BookOpen',
      color: 'amber',
      visible: true
    },
    {
      id: 'prog-3',
      grade: '৯ম ও ১০ম শ্রেণি (এসএসসি পর্যায়)',
      gradeEn: 'Class 9 & 10 (Secondary SSC Track)',
      focus: 'বিজ্ঞান, মানবিক ও ব্যবসায় শিক্ষা শাখায় লক্ষ্যভিত্তিক পাঠদান',
      features: [
        'আধুনিক বিজ্ঞানাগারে হাতে-কলমে ল্যাব পরীক্ষণ',
        'এসএসসি বোর্ড পরীক্ষার চূড়ান্ত প্রস্তুতি ও সাজেশন',
        'নিয়মিত মডেল টেস্ট ও বিশেষ ফিডব্যাক মূল্যায়ন'
      ],
      icon: 'GraduationCap',
      color: 'indigo',
      visible: true
    }
  ],
  streams: [
    {
      id: 'stream-science',
      name: 'বিজ্ঞান বিভাগ (Science)',
      nameEn: 'Science Department',
      badge: 'গবেষণা ও উদ্ভাবন',
      subjects: 'পদার্থবিজ্ঞান, রসায়ন, জীববিজ্ঞান, উচ্চতর গণিত ও আইসিটি',
      desc: 'আধুনিক গবেষণাগারে ব্যবহারিক পরীক্ষণ ও বৈজ্ঞানিক অনুসন্ধিৎসা জাগ্রত করার মাধ্যমে ভবিষ্যতের প্রকৌশলী ও চিকিৎসা বিজ্ঞানী গড়ার ক্ষেত্রে নির্ভরযোগ্য দিকনির্দেশনা।',
      icon: 'FlaskConical',
      color: 'emerald',
      visible: true
    },
    {
      id: 'stream-humanities',
      name: 'মানবিক বিভাগ (Humanities)',
      nameEn: 'Humanities Department',
      badge: 'সমাজ ও সংস্কৃতি',
      subjects: 'বাংলাদেশের ইতিহাস ও বিশ্বসভ্যতা, পৌরনীতি, ভূগোল, অর্থনীতি ও সমাজবিজ্ঞান',
      desc: 'মানবিক ও সামাজিক মূল্যবোধ, যুক্তিভিত্তিক চিন্তা ও সমাজসচেতনতা বিকাশের মাধ্যমে আদর্শ নাগরিক এবং প্রশাসনিক নেতৃত্ব গঠনের অনন্য ক্ষেত্র।',
      icon: 'Landmark',
      color: 'amber',
      visible: true
    },
    {
      id: 'stream-business',
      name: 'ব্যবসায় শিক্ষা বিভাগ (Business Studies)',
      nameEn: 'Business Studies Department',
      badge: 'বাণিজ্য ও উদ্যোক্তা',
      subjects: 'হিসাববিজ্ঞান, ফিন্যান্স ও ব্যাংকিং, ব্যবসায় উদ্যোগ ও বিপণন',
      desc: 'বাণিজ্যিক নেতৃত্ব, আধুনিক হিসাবরক্ষণ এবং অর্থ ব্যবস্থাপনায় দক্ষ জনবল তৈরির লক্ষ্যে বাস্তবমুখী উদ্যোক্তা প্রশিক্ষণ ও কেস-স্টাডি পাঠদান।',
      icon: 'TrendingUp',
      color: 'indigo',
      visible: true
    }
  ]
};

export const DEFAULT_GALLERY_CONFIG: GalleryConfig = {
  enabled: true,
  eyebrow: 'ক্যাম্পাস লাইফ ও স্মৃতি',
  title: 'ছবি এবং ভিডিও গ্যালারী',
  subtitle: 'বিদ্যালয়ের প্রাণবন্ত পাঠদান, ক্রীড়া ও সাংস্কৃতিক উৎসব এবং বিজ্ঞান প্রদর্শনীর স্মরণীয় মুহূর্তসমূহ।',
  items: [
    {
      id: 'gal-1',
      type: 'image',
      title: 'স্মার্ট মাল্টিমিডিয়া ক্লাসরুমে আনন্দময় পাঠদান',
      category: 'অ্যাকাডেমিক',
      thumbnail: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=800&auto=format&fit=crop',
      date: '১২ অক্টোবর ২০২৬',
      caption: 'শিক্ষার্থীদের ডিজিটাল কনটেন্ট ও ইন্টারেক্টিভ স্মার্টবোর্ডের মাধ্যমে পাঠদান কার্যক্রম।',
      visible: true
    },
    {
      id: 'gal-2',
      type: 'video',
      title: 'বার্ষিক ক্রীড়া ও সাংস্কৃতিক প্রতিযোগিতা ২০২৬',
      category: 'ভিডিও হাইলাইটস',
      thumbnail: 'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=800&auto=format&fit=crop',
      date: '০৫ অক্টোবর ২০২৬',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      caption: 'বিদ্যালয়ের বার্ষিক ক্রীড়া প্রতিযোগিতা ও মনোজ্ঞ সাংস্কৃতিক অনুষ্ঠানের সেরা মুহূর্তসমূহ।',
      visible: true
    },
    {
      id: 'gal-3',
      type: 'image',
      title: 'বিজ্ঞান মেলা ও শিক্ষার্থীদের রোবটিক্স প্রজেক্ট প্রদর্শনী',
      category: 'বিজ্ঞান ও প্রযুক্তি',
      thumbnail: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?q=80&w=800&auto=format&fit=crop',
      date: '২৮ সেপ্টেম্বর ২০২৬',
      caption: 'শেখ রাসেল ডিজিটাল ল্যাবে খুদে বিজ্ঞানীদের উদ্ভাবনী রোবটিক্স এবং বিজ্ঞান প্রজেক্ট প্রদর্শনী।',
      visible: true
    }
  ]
};

/* =====================================================================
 * DEFAULT CONFIGURATION (Clean, Matching Real Baraitali High School)
 * ===================================================================== */
export const DEFAULT_LANDING_CONFIG: LandingPageConfig = {
  version: 1,
  lastUpdatedAt: new Date().toISOString(),
  updatedBy: 'সিস্টেম অ্যাডমিন',
  header: {
    schoolName: 'বরইতলী উচ্চ বিদ্যালয়',
    schoolSlogan: 'জ্ঞানে ও আলোয় আলোকিত ভবিষ্যৎ',
    logoUrl: '/logo.png',
    showLogo: true,
    showTopbar: true,
    topbarPhone: '+৮৮০১৭১২৩৪৫৬৭৮',
    topbarEmail: 'baraitalihighschool@gmail.com',
    topbarAddress: 'বরইতলী, চকরিয়া, কক্সবাজার',
    topbarNotice: '২০২৬ শিক্ষাবর্ষে ৬ষ্ঠ থেকে ৯ম শ্রেণিতে ভর্তি চলছে! অনলাইন বা সরাসরি যোগাযোগ করুন।',
    showNoticeTicker: true,
    sticky: true,
    navLinks: [
      { id: 'nav-1', label: 'মূল পাতা', href: '#', visible: true, order: 1 },
      { id: 'nav-2', label: 'পরিচিতি', href: '#about', visible: true, order: 2 },
      { id: 'nav-3', label: 'নোটিশ', href: '#notices', visible: true, order: 3 },
      { id: 'nav-4', label: 'একাডেমিক', href: '#academic', visible: true, order: 4 },
      { id: 'nav-5', label: 'শিক্ষকমণ্ডলী', href: '#teachers', visible: true, order: 5 },
      { id: 'nav-6', label: 'কমিটি', href: '#committee', visible: true, order: 6 },
      { id: 'nav-7', label: 'কৃতী শিক্ষার্থী', href: '#achievers', visible: true, order: 7 },
      { id: 'nav-8', label: 'সুবিধাসমূহ', href: '#facilities', visible: true, order: 8 },
      { id: 'nav-9', label: 'গ্যালারি', href: '#gallery', visible: true, order: 9 },
      { id: 'nav-10', label: 'সংবাদ/ব্লগ', href: '#blog', visible: true, order: 10 },
      { id: 'nav-11', label: 'যোগাযোগ', href: '#contact', visible: true, order: 11 },
      { id: 'nav-12', label: 'অনলাইন ভর্তি', href: '/admission', visible: true, order: 12, isButton: true, buttonStyle: 'secondary' },
      { id: 'nav-13', label: 'লগইন', href: '/login', visible: true, order: 13, isButton: true, buttonStyle: 'primary' },
    ],
  },
  hero: {
    enabled: true,
    badgeText: '🏛️ ঐতিহ্যের ৫৫ বছর | স্থাপিত ১৯৬৯',
    title: 'বরইতলী উচ্চ বিদ্যালয়',
    subtitle: '📍 Baritali, Chakaria, Cox\'s Bazar.',
    description: 'আধুনিক বিজ্ঞানাগার, সমৃদ্ধ লাইব্রেরি ও দক্ষ শিক্ষকমণ্ডলীর সমন্বয়ে গড়ে ওঠা চকরিয়ার অন্যতম শীর্ষস্থানীয় বিদ্যাপীঠ।',
    bgType: 'gradient',
    bgImage: '/school-campus.jpg',
    bgGradientFrom: '#0f172a',
    bgGradientTo: '#1e1b4b',
    bgOverlayOpacity: 25,
    primaryCta: {
      text: 'ভর্তি আবেদন করুন',
      href: '/admission',
      visible: true,
      openNewTab: false,
      style: 'primary',
    },
    secondaryCta: {
      text: 'ফলাফল অনুসন্ধান',
      href: '/result',
      visible: true,
      openNewTab: false,
      style: 'outline',
    },
    slides: [
      {
        id: 'slide-1',
        title: 'বরইতলী উচ্চ বিদ্যালয়',
        subtitle: 'ঐতিহ্যের ৫৫ বছর | জ্ঞান, প্রজ্ঞা ও মূল্যবোধের অনন্য বিদ্যাপীঠ',
        imageUrl: '/school-campus.jpg',
        ctaText: 'ভর্তি আবেদন করুন',
        ctaLink: '/admission',
      },
      {
        id: 'slide-2',
        title: 'নান্দনিক ক্যাম্পাস ও সুপরিকল্পিত অবকাঠামো',
        subtitle: 'মনোরম প্রাকৃতিক ও কোলাহলমুক্ত পরিবেশে শিক্ষার্থীদের সৃষ্টিশীল মেধা বিকাশ',
        imageUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=2000&q=85',
        ctaText: 'ক্যাম্পাস পরিচিতি',
        ctaLink: '#about',
      },
      {
        id: 'slide-3',
        title: 'শেখ রাসেল ডিজিটাল ল্যাব ও আধুনিক বিজ্ঞানাগার',
        subtitle: 'হাতে-কলমে আধুনিক বিজ্ঞান শিক্ষা ও ডিজিটাল তথ্যপ্রযুক্তির সমন্বিত প্রশিক্ষণ',
        imageUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=2000&q=85',
        ctaText: 'সুবিধাসমূহ দেখুন',
        ctaLink: '#facilities',
      },
      {
        id: 'slide-4',
        title: 'ক্রীড়া, বিতর্ক ও সুস্থ সাংস্কৃতিক চর্চা',
        subtitle: 'পড়াশোনার পাশাপাশি শারীরিক ও মানসিক উৎকর্ষ সাধনে সক্রিয় সহশিক্ষা কার্যক্রম',
        imageUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=2000&q=85',
        ctaText: 'ফলাফল অনুসন্ধান',
        ctaLink: '/result',
      },
      {
        id: 'slide-5',
        title: 'সমৃদ্ধ লাইব্রেরি ও নিরবচ্ছিন্ন পাঠচর্চা',
        subtitle: '৫০০০+ মূল্যবান বই, গবেষণা সাময়িকী ও নিয়মিত জাতীয় দৈনিক পত্রিকা সমৃদ্ধ পাঠাগার',
        imageUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=2000&q=85',
        ctaText: 'অনলাইন ভর্তি',
        ctaLink: '/admission',
      },
    ],
    enableSlider: true,
  },
  sections: [
    { id: 'sec-stats', key: 'stats', nameBn: 'ছাত্র/ছাত্রীদের পরিসংখ্যান', nameEn: 'Student Statistics', type: 'builtin', enabled: true, order: 1, icon: 'BarChart3', description: 'শ্রেণিভিত্তিক ছাত্র-ছাত্রীর সংখ্যা ও কাউন্টার অ্যানিমেশন' },
    { id: 'sec-services', key: 'services', nameBn: 'অনলাইন সেবা ও পোর্টাল', nameEn: 'Services & Portals', type: 'builtin', enabled: true, order: 2, icon: 'LayoutGrid', description: 'ভর্তি, রেজাল্ট, রুটিন ও সনদপত্র সম্পর্কিত কুইক লিংক' },
    { id: 'sec-headmaster', key: 'headmaster_message', nameBn: 'প্রধান শিক্ষকের বাণী', nameEn: 'Principal Speech', type: 'builtin', enabled: true, order: 3, icon: 'UserCheck', description: 'প্রধান শিক্ষক মহোদয়ের দিকনির্দেশনামূলক বাণী' },
    { id: 'sec-about', key: 'about', nameBn: 'প্রতিষ্ঠান পরিচিতি ও ইতিহাস', nameEn: 'About & History', type: 'builtin', enabled: true, order: 4, icon: 'School', description: 'ইতিহাস, লক্ষ্য, উদ্দেশ্য ও ক্যাম্পাস বিবরণী' },
    { id: 'sec-notices', key: 'notices', nameBn: 'ডিজিটাল নোটিশ বোর্ড', nameEn: 'Notice Board', type: 'builtin', enabled: true, order: 5, icon: 'Bell', description: 'সর্বশেষ পরীক্ষার নোটিশ ও সরকারি প্রজ্ঞাপন' },
    { id: 'sec-academic', key: 'academic', nameBn: 'একাডেমিক কার্যক্রম ও বিভাগ', nameEn: 'Academic & Streams', type: 'builtin', enabled: true, order: 6, icon: 'GraduationCap', description: 'বিজ্ঞান, মানবিক ও ব্যবসায় শিক্ষা শাখার তথ্য' },
    { id: 'sec-teachers', key: 'teachers', nameBn: 'সম্মানিত শিক্ষকমণ্ডলী', nameEn: 'Teachers Directory', type: 'builtin', enabled: true, order: 7, icon: 'Users', description: 'শিক্ষক ও স্টাফদের ছবি, পদবি ও পরিচয়' },
    { id: 'sec-committee', key: 'committee', nameBn: 'ম্যানেজিং কমিটি', nameEn: 'Managing Committee', type: 'builtin', enabled: true, order: 8, icon: 'Award', description: 'বিদ্যালয় পরিচালনা পর্ষদের সদস্যবৃন্দ' },
    { id: 'sec-achievers', key: 'achievers', nameBn: 'সেরা ছাত্র/ছাত্রী', nameEn: 'Best Students', type: 'builtin', enabled: true, order: 9, icon: 'Trophy', description: 'মেধাবী ছাত্র-ছাত্রীদের তালিকা, রোল ও সাল' },
    { id: 'sec-facilities', key: 'facilities', nameBn: 'ক্যাম্পাস সুবিধাসমূহ', nameEn: 'Campus Facilities', type: 'builtin', enabled: true, order: 10, icon: 'Building2', description: 'আইসিটি ল্যাব, বিজ্ঞানাগার, লাইব্রেরি ও খেলার মাঠ' },
    { id: 'sec-gallery', key: 'gallery', nameBn: 'ফটো গ্যালারি', nameEn: 'Photo Gallery', type: 'builtin', enabled: true, order: 11, icon: 'Image', description: 'স্কুল ক্যাম্পাসের গুরুত্বপূর্ণ মুহূর্ত ও অনুষ্ঠানের ছবি' },
    { id: 'sec-blog', key: 'blog', nameBn: 'সংবাদ ও ব্লগ', nameEn: 'News & Blog', type: 'builtin', enabled: true, order: 12, icon: 'FileText', description: 'বিদ্যালয়ের সাম্প্রতিক অর্জন ও কার্যক্রম বিষয়ক ব্লগ' },
    { id: 'sec-faq', key: 'faq', nameBn: 'সাধারণ প্রশ্নোত্তর (FAQ)', nameEn: 'FAQ', type: 'builtin', enabled: true, order: 13, icon: 'HelpCircle', description: 'ভর্তি ও স্কুল বিষয়ক বহুল জিজ্ঞাসিত প্রশ্ন ও উত্তর' },
    { id: 'sec-contact', key: 'contact', nameBn: 'যোগাযোগ ও মেসেজ ফর্ম', nameEn: 'Contact Section', type: 'builtin', enabled: true, order: 14, icon: 'Mail', description: 'ঠিকানা, ফোন নম্বর, গুগল ম্যাপ ও অনুসন্ধান বার্তা' },
    { id: 'sec-app', key: 'mobile_app', nameBn: 'মোবাইল অ্যাপ ডাউনলোড', nameEn: 'Mobile App Download', type: 'builtin', enabled: true, order: 15, icon: 'Smartphone', description: 'স্মার্ট স্কুল অভিভাবক ও শিক্ষক মোবাইল অ্যাপ' },
  ],
  stats: {
    enabled: true,
    title: 'পরিসংখ্যানে বরইতলী উচ্চ বিদ্যালয়',
    subtitle: 'ঐতিহ্যবাহী বিদ্যাপীঠের গৌরবময় অগ্রযাত্রা, শ্রেণিকক্ষ ও সামগ্রিক অর্জনের সুবিন্যস্ত খতিয়ান',
    bgColor: '#081c36',
    textColor: '#ffffff',
    animatedCounter: true,
    passingRate: '১০০%',
    totalTeachersOverride: 25,
    totalStudentsOverride: 565,
    classStats: [
      { id: 'stat-10', className: 'দশম শ্রেণি', count: 120, icon: 'GraduationCap', visible: true },
      { id: 'stat-9', className: 'নবম শ্রেণি', count: 95, icon: 'BookOpen', visible: true },
      { id: 'stat-8', className: 'অষ্টম শ্রেণি', count: 80, icon: 'Award', visible: true },
      { id: 'stat-7', className: 'সপ্তম শ্রেণি', count: 160, icon: 'Users', visible: true },
      { id: 'stat-6', className: 'ষষ্ঠ শ্রেণি', count: 110, icon: 'School', visible: true },
    ],
  },
  services: {
    enabled: true,
    title: 'অনলাইন সেবা ও ছাত্রছাত্রী পোর্টাল',
    subtitle: 'সহজ ও দ্রুত সেবা নিশ্চিত করতে আমাদের সমন্বিত ডিজিটাল প্ল্যাটফর্ম',
    cards: [
      { id: 'srv-1', title: 'অনলাইন ভর্তি আবেদন', description: 'ঘরে বসেই ষষ্ঠ থেকে দশম শ্রেণিতে নতুন ভর্তির আবেদনপত্র পূরণ করুন।', icon: 'UserPlus', link: '/admission', badge: 'ভর্তি চলছে', badgeColor: 'emerald', visible: true },
      { id: 'srv-2', title: 'পরীক্ষার ফলাফল', description: 'রোল ও রেজিস্ট্রেশন নম্বর দিয়ে দ্রুত মার্কশীট ও ফলাফল দেখুন।', icon: 'Search', link: '/result', badge: 'ফলাফল', badgeColor: 'blue', visible: true },
      { id: 'srv-3', title: 'অনলাইন প্রশংসাপত্র', description: 'পাসকৃত শিক্ষার্থীরা ঘরে বসেই সনদ ও প্রশংসাপত্রের আবেদন করুন।', icon: 'FileCheck', link: '/dashboard/certificates', badge: 'ডিজিটাল', badgeColor: 'amber', visible: true },
      { id: 'srv-4', title: 'শিক্ষার্থী পোর্টাল', description: 'উপস্থিতি, বকেয়া ফি ও ক্লাস রুটিনের যাবতীয় আপডেট তথ্য।', icon: 'LayoutDashboard', link: '/login', badge: 'লগইন', badgeColor: 'purple', visible: true },
    ],
  },
  about: {
    enabled: true,
    title: 'আমাদের ঐতিহ্য, গৌরব ও পথচলা',
    subtitle: 'প্রতিষ্ঠান পরিচিতি ও ইতিহাস',
    historyText: 'কক্সবাজার জেলার চকরিয়া উপজেলার অন্তর্গত ঐতিহ্যবাহী বরইতলী ইউনিয়নের প্রাণকেন্দ্রে ১৯৬৯ খ্রিষ্টাব্দে প্রতিষ্ঠিত হয় ‘বরইতলী উচ্চ বিদ্যালয়’। তৎকালীন স্থানীয় শিক্ষানুরাগী, সমাজসেবক ও বিদ্যোৎসাহী ব্যক্তিবর্গের ঐকান্তিক প্রচেষ্টা ও ত্যাগের বিনিময়ে এই অঞ্চলে শিক্ষার আলো ছড়িয়ে দিতে বিদ্যালয়টির যাত্রা শুরু হয়েছিল। প্রতিষ্ঠালগ্ন থেকেই অত্র অঞ্চলের শিক্ষার্থীদের মানবিক গুণাবলি, শৃঙ্খলাবোধ এবং আধুনিক জ্ঞান-বিজ্ঞানে সমৃদ্ধ করে গড়ে তোলাই ছিল মূল ব্রত। দীর্ঘ পাঁচ দশকেরও বেশি সময় ধরে চট্টগ্রাম শিক্ষাবোর্ডের অধীনে বিদ্যালয়টি শতভাগ মেধা ও কৃতিত্বপূর্ণ ফলাফলের ধারাবাহিকতা অক্ষুণ্ণ রেখেছে। বর্তমান ডিজিটাল যুগে যুগোপযোগী বিজ্ঞান ও কম্পিউটার শিক্ষার সমন্বয়ে বিদ্যালয়টি আগামীর একবিংশ শতাব্দীর যোগ্য নাগরিক তৈরিতে অবিচল ও প্রতিশ্রুতিবদ্ধ।',
    missionText: 'আধুনিক প্রযুক্তিনির্ভর ও নৈতিক শিক্ষায় প্রতিটি শিক্ষার্থীকে সুনাগরিক ও দক্ষ মানবসম্পদ হিসেবে গড়ে তোলা।',
    visionText: 'দক্ষিণ চট্টগ্রামের একটি মডেল শিক্ষা প্রতিষ্ঠান হিসেবে আত্মপ্রকাশ করা।',
    foundingYear: '১৯৬৯',
    eiin: '106184',
    campusPhoto: '/school-campus.jpg',
    president: {
      name: 'আলহাজ্ব মোস্তফা কামাল',
      title: 'সভাপতি, ম্যানেজিং কমিটি',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop',
      message: 'শিক্ষার আলো ছড়িয়ে দিতে এবং আদর্শ মানবিক গুণাবলিসম্পন্ন ভবিষ্যৎ প্রজন্ম গড়ে তুলতে বরইতলী উচ্চ বিদ্যালয় বদ্ধপরিকর। পরিচালনা পর্ষদ, শিক্ষক এবং অভিভাবকদের সম্মিলিত প্রচেষ্টায় আমরা প্রতিষ্ঠানটিকে একটি আদর্শ মডেল বিদ্যাপীঠ হিসেবে গড়ে তুলছি। আধুনিক শ্রেণিকক্ষ, বিজ্ঞানাগার ও সহশিক্ষা কার্যক্রমের সুষ্ঠু বিকাশে আমরা নিরলস কাজ করছি।',
      visible: true,
    },
    headmaster: {
      name: 'মোহাম্মদ রফিকুল ইসলাম',
      title: 'প্রধান শিক্ষক (অধ্যক্ষ)',
      photo: 'https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=400&auto=format&fit=crop',
      message: 'জ্ঞান, শৃঙ্খলা ও নৈতিকতাই একটি আদর্শ শিক্ষাপ্রতিষ্ঠানের মূল চালিকাশক্তি। বরইতলী উচ্চ বিদ্যালয় দীর্ঘ পাঁচ দশকেরও বেশি সময় ধরে এই অঞ্চলের শিক্ষার্থীদের মাঝে শিক্ষার আলো ছড়িয়ে আসছে। আমরা প্রতিটি শিক্ষার্থীকে শুধু পরীক্ষায় ভালো ফলাফলের জন্য নয়, বরং মানবিক মূল্যবোধ ও দেশপ্রেমের আদর্শে উদ্বুদ্ধ করে গড়ে তুলতে প্রতিশ্রুতিবদ্ধ।',
      visible: true,
    },
    assistantHeadmaster: {
      name: 'আব্দুল কাদের',
      title: 'সহকারী প্রধান শিক্ষক',
      photo: '',
      message: 'শৃঙ্খলা, সময়ানুবর্তিতা এবং নিয়মিত পাঠচর্চাই সফলতার মূল চাবিকাঠি। আমরা শিক্ষার্থীদের ক্লাসরুম ও কো-কারিকুলার উভয় ক্ষেত্রে শ্রেষ্ঠত্ব অর্জনে প্রস্তুত করি।',
      visible: true,
    },
  },
  achievers: {
    enabled: true,
    title: 'সেরা ছাত্র/ছাত্রী',
    subtitle: 'আমাদের বিদ্যালয়ের গর্ব — বোর্ড পরীক্ষা ও মেধা অন্বেষণে শীর্ষস্থান অর্জনকারী শিক্ষার্থীবৃন্দ',
    viewAllLink: '#',
    students: [
      { id: 'ach-1', name: 'মারিয়া সুলতানা', class: 'দশম শ্রেণি', roll: '০১', year: '২০২৫', gpa: '৫.০০', photo: '', awardBadge: '🏆 গোল্ডেন জিপিএ-৫', visible: true },
      { id: 'ach-2', name: 'তানভীর আহমেদ', class: 'দশম শ্রেণি', roll: '০২', year: '২০২৫', gpa: '৫.০০', photo: '', awardBadge: '⭐ সেরা বিতার্কিক', visible: true },
      { id: 'ach-3', name: 'নুসরাত জাহান', class: 'নবম শ্রেণি', roll: '০১', year: '২০২৫', gpa: '৫.০০', photo: '', awardBadge: '🎖️ বিজ্ঞান মেলা চ্যাম্পিয়ন', visible: true },
      { id: 'ach-4', name: 'রাকিবুল হাসান', class: 'নবম শ্রেণি', roll: '০৩', year: '২০২৫', gpa: '৪.৯৪', photo: '', awardBadge: '🏅 গণিত অলিম্পিয়াড', visible: true },
    ],
  },
  facilities: {
    enabled: true,
    title: 'শিক্ষার্থীদের সার্বিক বিকাশে আধুনিক সুযোগ-সুবিধা',
    subtitle: 'সুপরিকল্পিত ও মনোরম ক্যাম্পাস পরিবেশ, যা শিক্ষার্থীদের সুস্থ, সৃজনশীল ও বাস্তবমুখী জ্ঞানার্জনে অনুপ্রাণিত করে।',
    eyebrow: 'ক্যাম্পাস অবকাঠামো ও সুবিধাসমূহ',
    items: [
      {
        id: 'fac-1',
        title: 'শেখ রাসেল ডিজিটাল ল্যাব',
        titleEn: 'Sheikh Russel Digital Lab',
        description: 'উচ্চগতির ব্রডব্যান্ড ইন্টারনেট ও আধুনিক কম্পিউটার সমৃদ্ধ ল্যাব, যেখানে শিক্ষার্থীরা আইসিটি, কোডিং ও ডিজিটাল লিটারেসি হাতে-কলমে শেখে।',
        icon: 'Monitor',
        badge: 'আইসিটি ও কম্পিউটার',
        color: 'indigo',
        visible: true,
      },
      {
        id: 'fac-2',
        title: 'আধুনিক বিজ্ঞানাগার (ল্যাব)',
        titleEn: 'Science Laboratories',
        description: 'পদার্থবিজ্ঞান, রসায়ন ও জীববিজ্ঞানের সকল প্রয়োজনীয় আধুনিক যন্ত্রপাতি ও গবেষণাসামগ্রী সমৃদ্ধ সার্বক্ষণিক ব্যবহারিক ল্যাবরেটরি।',
        icon: 'FlaskConical',
        badge: 'ব্যবহারিক বিজ্ঞান',
        color: 'emerald',
        visible: true,
      },
      {
        id: 'fac-3',
        title: 'কেন্দ্রীয় লাইব্রেরি ও পাঠকক্ষ',
        titleEn: 'Central Library & Reading Room',
        description: 'পাঠ্যপুস্তক, সৃজনশীল সাহিত্য, দেশি-বিদেশি রেফারেন্স বই, বিজ্ঞান সাময়িকী ও দৈনিক সংবাদপত্রে সমৃদ্ধ একটি শান্ত ও সুশৃঙ্খল পাঠাগার।',
        icon: 'BookOpen',
        badge: '৫,০০০+ বই সংগ্রহ',
        color: 'amber',
        visible: true,
      },
      {
        id: 'fac-4',
        title: 'প্রশস্ত খেলার মাঠ ও ক্রীড়া',
        titleEn: 'Expansive Sports Ground',
        description: 'ফুটবল, ক্রিকেট, ভলিবল ও বার্ষিক ক্রীড়া প্রতিযোগিতার জন্য উন্মুক্ত ও সবুজ ঘাসে ঘেরা সুবিশাল খেলাধুলার মাঠ।',
        icon: 'Trophy',
        badge: 'খেলাধুলা ও শরীরচর্চা',
        color: 'rose',
        visible: true,
      },
      {
        id: 'fac-5',
        title: 'স্কাউটিং ও সহশিক্ষা কার্যক্রম',
        titleEn: 'Scouting & Co-Curricular',
        description: 'বাংলাদেশ স্কাউটস ও গার্ল গাইডসের সক্রিয় ইউনিট, বিতর্ক ও বিজ্ঞান ক্লাব যা শিক্ষার্থীদের নেতৃত্বগুণ ও শৃঙ্খলাবোধ গড়ে তোলে।',
        icon: 'Compass',
        badge: 'নেতৃত্ব ও শৃঙ্খলা',
        color: 'cyan',
        visible: true,
      },
      {
        id: 'fac-6',
        title: 'বিশুদ্ধ পানি ও আধুনিক স্যানিটেশন',
        titleEn: 'Purified Water & Hygiene',
        description: 'আধুনিক ডিপ-ফিল্টারযুক্ত নিরাপদ বিশুদ্ধ খাবার পানির ব্যবস্থা এবং ছাত্র ও ছাত্রীদের জন্য সম্পূর্ণ পৃথক পরিচ্ছন্ন স্যানিটেশন ব্লক।',
        icon: 'Droplet',
        badge: 'স্বাস্থ্য ও সুরক্ষা',
        color: 'blue',
        visible: true,
      },
    ],
  },
  academic: DEFAULT_ACADEMIC_CONFIG,
  gallery: DEFAULT_GALLERY_CONFIG,
  blog: {
    enabled: true,
    title: 'সংবাদ ও ব্লগ',
    subtitle: 'বিদ্যালয়ের সাম্প্রতিক কার্যক্রম, অর্জন ও শিক্ষামূলক প্রতিবেদন',
    viewAllLink: '#',
    posts: [
      {
        id: 'post-1',
        title: 'বার্ষিক ক্রীড়া ও সাংস্কৃতিক প্রতিযোগিতা ২০২৬ সফলভাবে সম্পন্ন',
        date: '২০ ফেব্রুয়ারি ২০২৬',
        author: 'Admin',
        summary: 'উৎসবমুখর পরিবেশে তিন দিনব্যাপী অনুষ্ঠিত হলো বিদ্যালয়ের বার্ষিক ক্রীড়া ও পুরস্কার বিতরণী অনুষ্ঠান। শিক্ষার্থীদের স্বতঃস্ফূর্ত অংশগ্রহণে মুখরিত ছিল মাঠ।',
        imageUrl: '/school-campus.jpg',
        link: '#',
        visible: true,
      },
      {
        id: 'post-2',
        title: 'এসএসসি পরীক্ষার ফরম পূরণ ও বিশেষ মডেল টেস্ট সংক্রান্ত নির্দেশনা',
        date: '১৫ ফেব্রুয়ারি ২০২৬',
        author: 'Admin',
        summary: '২০২৬ সালের মাধ্যমিক স্কুল সার্টিফিকেট পরীক্ষার সকল পরীক্ষার্থীদের ফরম পূরণ আগামী ২৫ ফেব্রুয়ারির মধ্যে সম্পন্ন করার জন্য অনুরোধ করা যাচ্ছে।',
        imageUrl: '/school-campus.jpg',
        link: '#',
        visible: true,
      },
      {
        id: 'post-3',
        title: 'বিজ্ঞান মেলায় বরইতলী উচ্চ বিদ্যালয়ের শিক্ষার্থীরা জেলা পর্যায়ে প্রথম',
        date: '১০ ফেব্রুয়ারি ২০২৬',
        author: 'Admin',
        summary: 'জাতীয় বিজ্ঞান ও প্রযুক্তি সপ্তাহ উপলক্ষে আয়োজিত জেলাভিত্তিক বিজ্ঞান অলিম্পিয়াড ও মেলায় স্মার্ট রোবোটিক্স প্রজেক্ট প্রদর্শন করে আমাদের দল চ্যাম্পিয়ন হয়েছে।',
        imageUrl: '/school-campus.jpg',
        link: '#',
        visible: true,
      },
    ],
  },
  faq: {
    enabled: true,
    title: 'সাধারণ প্রশ্নোত্তর (FAQ)',
    subtitle: 'ভর্তি ও একাডেমিক তথ্য সম্পর্কিত প্রয়োজনীয় প্রশ্নাবলীর উত্তর',
    items: [
      { id: 'faq-1', question: 'কীভাবে অনলাইনে ভর্তির আবেদন করা যাবে?', answer: 'আমাদের ওয়েবসাইটের "অনলাইন ভর্তি আবেদন" লিংকে ক্লিক করে প্রয়োজনীয় তথ্য ও পূর্ববর্তী ক্লাসের মার্কশীটের কপি আপলোড করে সহজে আবেদন সম্পন্ন করা যায়।', visible: true },
      { id: 'faq-2', question: 'বিদ্যালয়ের পাঠদানের সময়সূচি কী?', answer: 'বিদ্যালয়ের একাডেমিক কার্যক্রম রবিবার থেকে বৃহস্পতিবার সকাল ৯:৩০ টা থেকে বিকাল ৪:০০ টা পর্যন্ত পরিচালিত হয়।', visible: true },
      { id: 'faq-3', question: 'কোন কোন গ্রুপ বা বিভাগ চালু আছে?', answer: 'নবম ও দশম শ্রেণিতে বিজ্ঞান, ব্যবসায় শিক্ষা ও মানবিক — তিনটি বিভাগেই অভিজ্ঞ শিক্ষকদের দ্বারা পাঠদান করানো হয়।', visible: true },
      { id: 'faq-4', question: 'উপবৃত্তি ও মেধা বৃত্তির সুযোগ কেমন?', answer: 'সরকারের নির্ধারিত উপবৃত্তি সুবিধার পাশাপাশি বিদ্যালয় পরিচালনা পর্ষদের পক্ষ থেকে দরিদ্র ও মেধাবী শিক্ষার্থীদের মাসিক বেতন মওকুফ ও বিশেষ বৃত্তি প্রদান করা হয়।', visible: true },
    ],
  },
  contact: {
    enabled: true,
    title: 'যোগাযোগ ও অবস্থান',
    subtitle: 'যেকোনো অনুসন্ধান বা তথ্যের জন্য আমাদের সাথে সরাসরি যোগাযোগ করুন',
    address: 'ডাকঘর: বরইতলী, উপজেলা: চকরিয়া, জেলা: কক্সবাজার।',
    phone1: '+৮৮০১৭১২-৩৪৫৬৭৮',
    phone2: '+৮৮০১৮১৯-৮৭৬৫৪৩',
    email1: 'baraitalihighschool@gmail.com',
    email2: 'info@baraitalihs.edu.bd',
    mapEmbedUrl: '',
    officeHours: 'রবিবার - বৃহস্পতিবার: সকাল ৯:০০ টা - বিকাল ৪:০০ টা',
  },
  mobileApp: DEFAULT_MOBILE_APP_CONFIG,
  footer: {
    col1Title: 'অন্যান্য লিঙ্ক',
    col1Links: [
      { id: 'fl-1', label: 'ওয়েব মেইল', href: 'https://mail.google.com', isExternal: true },
      { id: 'fl-2', label: 'শিক্ষক বাতায়ন (PDS)', href: 'https://teachers.gov.bd', isExternal: true },
      { id: 'fl-3', label: 'ই-স্কুল প্ল্যাটফর্ম', href: 'https://moedu.gov.bd', isExternal: true },
      { id: 'fl-4', label: 'শিক্ষা মন্ত্রণালয়', href: 'https://moedu.gov.bd', isExternal: true },
      { id: 'fl-5', label: 'ব্যানবেইস (BANBEIS)', href: 'https://banbeis.gov.bd', isExternal: true },
      { id: 'fl-6', label: 'নায়েম (NAEM)', href: 'https://naem.gov.bd', isExternal: true },
      { id: 'fl-7', label: 'এনসিটিবি (NCTB)', href: 'https://nctb.gov.bd', isExternal: true },
    ],
    col2Title: 'গুরুত্বপূর্ণ লিঙ্ক',
    col2Links: [
      { id: 'fl-8', label: 'যোগাযোগ', href: '#contact', isExternal: false },
      { id: 'fl-9', label: 'প্রতিষ্ঠান পরিচিতি', href: '#about', isExternal: false },
      { id: 'fl-10', label: 'শিক্ষকমণ্ডলী', href: '#teachers', isExternal: false },
      { id: 'fl-11', label: 'ম্যানেজিং কমিটি', href: '#committee', isExternal: false },
      { id: 'fl-12', label: 'ফটো গ্যালারি', href: '#gallery', isExternal: false },
      { id: 'fl-13', label: 'সংবাদ ও নোটিশ', href: '#notices', isExternal: false },
    ],
    col3Title: 'যোগাযোগ',
    address: 'বরইতলী, চকরিয়া, কক্সবাজার।',
    phone1: '+৮৮০১৭১২-৩৪৫৬৭৮',
    phone2: '+৮৮০১৮১৯-৮৭৬৫৪৩',
    email1: 'baraitalihighschool@gmail.com',
    email2: 'info@baraitalihs.edu.bd',
    col4Title: 'প্রাতিষ্ঠানিক তথ্য',
    eiin: '১০৬১৮৪',
    schoolCode: '৩২০১',
    regNo: 'সি-১৯৬৯/চক',
    socialLinks: {
      facebook: 'https://facebook.com/baraitalihighschool',
      youtube: 'https://youtube.com',
      twitter: '',
      linkedin: '',
    },
    copyrightText: '© ২০২৬ বরইতলী উচ্চ বিদ্যালয়। সর্বস্বত্ব সংরক্ষিত।',
  },
  theme: {
    primaryColor: '#1e3a8a',
    primaryHover: '#1d4ed8',
    secondaryColor: '#047857',
    accentColor: '#f59e0b',
    backgroundColor: '#ffffff',
    cardBgColor: '#ffffff',
    textColor: '#0f172a',
    fontFamily: 'SolaimanLipi',
    borderRadius: 'lg',
    containerWidth: 'wide',
    sectionSpacing: 'normal',
    darkMode: true,
  },
  seo: {
    metaTitle: 'বরইতলী উচ্চ বিদ্যালয় | Baraitali High School - Chakaria, Cox\'s Bazar',
    metaDescription: 'বরইতলী উচ্চ বিদ্যালয়ের অফিশিয়াল ওয়েব পোর্টাল। ভর্তি তথ্য, পরীক্ষার ফলাফল, নোটিশ ও একাডেমিক কার্যক্রমের যাবতীয় ডিজিটাল সেবা।',
    metaKeywords: 'বরইতলী উচ্চ বিদ্যালয়, Baraitali High School, চকরিয়া স্কুল, কক্সবাজার বিদ্যালয়, EIIN 106184, রেজাল্ট, ভর্তি',
    ogTitle: 'বরইতলী উচ্চ বিদ্যালয় - ঐতিহ্যের ৫৫ বছর',
    ogDescription: 'মানসম্মত শিক্ষা ও আধুনিক মূল্যবোধে আলোকিত ভবিষ্যৎ গড়ার প্রত্যয়।',
    ogImage: '/school-campus.jpg',
    favicon: '/logo.png',
    canonicalUrl: 'https://baraitalihs.edu.bd',
    robotsIndex: true,
    robotsFollow: true,
  },
};

const STORAGE_KEYS = {
  DRAFT: 'sms_landing_draft',
  PUBLISHED: 'sms_landing_published',
  VERSIONS: 'sms_landing_versions',
  MEDIA: 'sms_landing_media',
  AUDIT_LOG: 'sms_landing_audit_log',
};

/**
 * 🛡️ Safe LocalStorage Setter with automatic self-healing quota recovery
 * Prevents QuotaExceededError from breaking draft saves or publishing
 */
function safeStorageSet(key: string, value: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err: any) {
    console.warn(`[LandingPageService] Storage full when writing "${key}". Initiating aggressive auto-cleanup...`, err);
    try {
      // 1. Remove version snapshots and audit logs
      localStorage.removeItem(STORAGE_KEYS.VERSIONS);
      localStorage.removeItem(STORAGE_KEYS.AUDIT_LOG);

      // 2. Clean up non-essential temporary/cache keys in localStorage
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('sms_backup_') || k.includes('snapshot') || k.includes('temp') || k.includes('cache'))) {
          localStorage.removeItem(k);
        }
      }

      // 3. When saving PUBLISHED, temporarily remove DRAFT to immediately free up 1-3MB!
      if (key === STORAGE_KEYS.PUBLISHED) {
        localStorage.removeItem(STORAGE_KEYS.DRAFT);
      }

      // 4. Prune media items if needed
      const mediaRaw = localStorage.getItem(STORAGE_KEYS.MEDIA);
      if (mediaRaw) {
        try {
          const media = JSON.parse(mediaRaw);
          if (Array.isArray(media) && media.length > 3) {
            localStorage.setItem(STORAGE_KEYS.MEDIA, JSON.stringify(media.slice(0, 3)));
          }
        } catch {
          localStorage.removeItem(STORAGE_KEYS.MEDIA);
        }
      }

      // 5. Retry saving
      try {
        localStorage.setItem(key, value);
        console.log(`[LandingPageService] Successfully saved "${key}" after cleanup.`);
        return true;
      } catch (innerErr) {
        // If still failing, aggressively prune media to 1 item or clear media
        localStorage.removeItem(STORAGE_KEYS.MEDIA);
        localStorage.setItem(key, value);
        console.log(`[LandingPageService] Successfully saved "${key}" after media clearance.`);
        return true;
      }
    } catch (retryErr) {
      console.error(`[LandingPageService] Storage quota still exceeded after full cleanup for "${key}":`, retryErr);
      // As ultimate fallback: try storing a compacted version if it's a JSON config
      try {
        const parsed = JSON.parse(value);
        if (parsed?.hero?.slides && Array.isArray(parsed.hero.slides)) {
          parsed.hero.slides = parsed.hero.slides.slice(-4);
        }
        localStorage.setItem(key, JSON.stringify(parsed));
        return true;
      } catch (fallbackErr) {
        console.error(`[LandingPageService] Ultimate fallback save failed for "${key}":`, fallbackErr);
        return false;
      }
    }
  }
}

class LandingPageService {
  private draftListeners: Array<(config: LandingPageConfig) => void> = [];
  private publishedListeners: Array<(config: LandingPageConfig) => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEYS.DRAFT) {
          const draft = this.getDraftConfig();
          this.draftListeners.forEach(fn => fn(draft));
        } else if (e.key === STORAGE_KEYS.PUBLISHED) {
          const published = this.getPublishedConfig();
          this.publishedListeners.forEach(fn => fn(published));
        }
      });
    }
  }

  // --- AUTO SYNC WITH SCHOOL SETTINGS ---
  public syncWithSchoolSettings(settings: any, autoPublish: boolean = true): void {
    if (!settings || typeof window === 'undefined') return;
    try {
      const draft = this.getDraftConfig();
      let changed = false;

      if (settings.schoolName && draft.header.schoolName !== settings.schoolName) {
        draft.header.schoolName = settings.schoolName;
        draft.hero.title = settings.schoolName;
        changed = true;
      }
      if (settings.schoolLogo && draft.header.logoUrl !== settings.schoolLogo) {
        draft.header.logoUrl = settings.schoolLogo;
        changed = true;
      }
      if (settings.schoolPhoto && draft.hero.bgImage !== settings.schoolPhoto) {
        draft.hero.bgImage = settings.schoolPhoto;
        changed = true;
      }
      if (settings.address && draft.header.topbarAddress !== settings.address) {
        draft.header.topbarAddress = settings.address;
        draft.hero.subtitle = `📍 ${settings.address}`;
        draft.footer.address = settings.address;
        changed = true;
      }
      if (settings.phone && draft.header.topbarPhone !== settings.phone) {
        draft.header.topbarPhone = settings.phone;
        draft.footer.phone1 = settings.phone;
        changed = true;
      }
      if (settings.email && draft.header.topbarEmail !== settings.email) {
        draft.header.topbarEmail = settings.email;
        draft.footer.email1 = settings.email;
        changed = true;
      }
      if (settings.eiin && draft.footer.eiin !== settings.eiin) {
        draft.footer.eiin = settings.eiin;
        draft.about.eiin = settings.eiin;
        changed = true;
      }
      if (settings.estdYear && draft.about.foundingYear !== settings.estdYear) {
        draft.about.foundingYear = settings.estdYear;
        draft.hero.badgeText = `🏛️ ঐতিহ্যের ৫৫ বছর | স্থাপিত ${settings.estdYear}`;
        changed = true;
      }
      if (settings.principalName && draft.about.headmaster.name !== settings.principalName) {
        draft.about.headmaster.name = settings.principalName;
        changed = true;
      }

      // Sync online admission toggle → hero CTA visibility + nav admission link
      if (typeof settings.onlineAdmissionEnabled !== 'undefined') {
        const admEnabled = settings.onlineAdmissionEnabled !== false;
        if (draft.hero.primaryCta.visible !== admEnabled) {
          draft.hero.primaryCta.visible = admEnabled;
          changed = true;
        }
        // Also hide/show admission nav link
        const admNavIdx = draft.header.navLinks.findIndex(
          (l: any) => l.href === '/admission' || (l.label && (l.label.includes('ভর্তি') || l.label.toLowerCase().includes('admission')))
        );
        if (admNavIdx !== -1 && draft.header.navLinks[admNavIdx].visible !== admEnabled) {
          draft.header.navLinks[admNavIdx] = { ...draft.header.navLinks[admNavIdx], visible: admEnabled };
          changed = true;
        }
      }

      if (changed) {
        this.saveDraftConfig(draft, 'সিস্টেম অটো-সিংক');
        if (autoPublish) {
          this.publish('সিস্টেম অটো-সিংক', 'স্কুল সেটিংস থেকে তথ্য স্বয়ংক্রিয় সিংক');
        }
      }
    } catch (e) {
      console.error('[LandingPageService] Error syncing with settings:', e);
    }
  }

  private normalizeLoadedConfig(parsed: any): LandingPageConfig {
    if (!parsed) return DEFAULT_LANDING_CONFIG;
    if (!parsed.gallery) {
      parsed.gallery = DEFAULT_GALLERY_CONFIG;
    }
    if (!parsed.mobileApp) {
      parsed.mobileApp = DEFAULT_MOBILE_APP_CONFIG;
    }
    // Only initialize default slides if slides property is completely missing (not if user intentionally deleted them)
    if (!parsed.hero) {
      parsed.hero = { ...DEFAULT_LANDING_CONFIG.hero };
    } else if (!Array.isArray(parsed.hero.slides)) {
      parsed.hero.slides = DEFAULT_LANDING_CONFIG.hero.slides;
    }
    // Normalize opacity: replace old heavy dark washes (70% or 45%) with soft, vibrant 25% if not set
    if (parsed.hero && typeof parsed.hero.bgOverlayOpacity !== 'number') {
      parsed.hero.bgOverlayOpacity = 25;
    }
    if (!parsed.sections || !Array.isArray(parsed.sections)) {
      parsed.sections = DEFAULT_LANDING_CONFIG.sections;
    } else {
      // Ensure any missing builtin sections are appended
      DEFAULT_LANDING_CONFIG.sections.forEach(defSec => {
        const existing = parsed.sections.find((s: any) => s.id === defSec.id || s.key === defSec.key);
        if (!existing) {
          parsed.sections.push({ ...defSec, order: parsed.sections.length + 1 });
        }
      });
    }
    return parsed;
  }

  // --- DRAFT CONFIG ---
  public getDraftConfig(): LandingPageConfig {
    if (typeof window === 'undefined') return DEFAULT_LANDING_CONFIG;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DRAFT);
      if (data) {
        const parsed = JSON.parse(data);
        return this.normalizeLoadedConfig(parsed);
      }
      // If no draft exists, initialize with published or default
      const published = this.getPublishedConfig();
      safeStorageSet(STORAGE_KEYS.DRAFT, JSON.stringify(published));
      return published;
    } catch (e) {
      console.error('[LandingPageService] Error reading draft:', e);
      return DEFAULT_LANDING_CONFIG;
    }
  }

  public saveDraftConfig(config: LandingPageConfig, user: string = 'অ্যাডমিন'): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const updatedConfig = {
        ...config,
        lastUpdatedAt: new Date().toISOString(),
        updatedBy: user,
      };
      const ok = safeStorageSet(STORAGE_KEYS.DRAFT, JSON.stringify(updatedConfig));
      if (!ok) {
        console.error('[LandingPageService] Failed to save draft to storage');
        return false;
      }
      this.addAuditLog('SAVE_DRAFT', user, 'খসড়া কনফিগারেশন আপডেট করা হয়েছে');
      this.draftListeners.forEach(fn => fn(updatedConfig));
      window.dispatchEvent(new Event('storage'));
      return true;
    } catch (e) {
      console.error('[LandingPageService] Error saving draft:', e);
      return false;
    }
  }

  // --- PUBLISHED CONFIG ---
  public getPublishedConfig(): LandingPageConfig {
    if (typeof window === 'undefined') return DEFAULT_LANDING_CONFIG;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PUBLISHED);
      if (data) {
        const parsed = JSON.parse(data);
        return this.normalizeLoadedConfig(parsed);
      }
      // First run: seed with DEFAULT_LANDING_CONFIG
      safeStorageSet(STORAGE_KEYS.PUBLISHED, JSON.stringify(DEFAULT_LANDING_CONFIG));
      return DEFAULT_LANDING_CONFIG;
    } catch (e) {
      console.error('[LandingPageService] Error reading published:', e);
      return DEFAULT_LANDING_CONFIG;
    }
  }

  public getGalleryConfig(): GalleryConfig {
    const published = this.getPublishedConfig();
    return published.gallery || DEFAULT_GALLERY_CONFIG;
  }

  public updateGallery(gallery: GalleryConfig, user: string = 'অ্যাডমিন', autoPublish: boolean = true): boolean {
    const draft = this.getDraftConfig();
    const updated: LandingPageConfig = {
      ...draft,
      gallery,
    };
    this.saveDraftConfig(updated, user);
    if (autoPublish) {
      return this.publish(user, 'গ্যালারি ছবি ও ভিডিও আপডেট করা হয়েছে');
    }
    return true;
  }

  public getFacilitiesConfig(): FacilitiesConfig {
    const published = this.getPublishedConfig();
    return published.facilities || DEFAULT_LANDING_CONFIG.facilities;
  }

  public updateFacilities(facilities: FacilitiesConfig, user: string = 'অ্যাডমিন', autoPublish: boolean = true): boolean {
    const draft = this.getDraftConfig();
    const updated: LandingPageConfig = {
      ...draft,
      facilities,
    };
    this.saveDraftConfig(updated, user);
    if (autoPublish) {
      return this.publish(user, 'ক্যাম্পাস সুবিধাসমূহ (Facilities) আপডেট করা হয়েছে');
    }
    return true;
  }

  public updateLogo(logoUrl: string, user: string = 'অ্যাডমিন', autoPublish: boolean = false): boolean {
    const draft = this.getDraftConfig();
    const updated: LandingPageConfig = {
      ...draft,
      header: {
        ...draft.header,
        logoUrl,
        showLogo: true,
      },
      seo: {
        ...draft.seo,
        favicon: draft.seo?.favicon || logoUrl,
      },
    };
    this.saveDraftConfig(updated, user);
    if (autoPublish) {
      return this.publish(user, 'বিদ্যালয়ের লোগো পরিবর্তন ও লাইভ প্রকাশ');
    }
    return true;
  }

  public publish(user: string = 'অ্যাডমিন', summary: string = 'নতুন পরিবর্তন লাইভ করা হয়েছে', configOverride?: LandingPageConfig): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const draft = configOverride || this.getDraftConfig();
      const newVersion = (draft.version || 1) + 1;
      const publishedConfig: LandingPageConfig = {
        ...draft,
        version: newVersion,
        lastUpdatedAt: new Date().toISOString(),
        updatedBy: user,
      };

      // 1. Save to Published (using safeStorageSet)
      const pubOk = safeStorageSet(STORAGE_KEYS.PUBLISHED, JSON.stringify(publishedConfig));
      if (!pubOk) {
        console.error('[LandingPageService] Failed to write published config to localStorage');
        return false;
      }

      // 2. Sync draft with published
      safeStorageSet(STORAGE_KEYS.DRAFT, JSON.stringify(publishedConfig));

      // 3. Create Version Snapshot (non-fatal)
      try {
        this.createVersionSnapshot(publishedConfig, user, summary);
      } catch (snapErr) {
        console.warn('[LandingPageService] Version snapshot skipped due to storage limit');
      }

      // 4. Record Audit Log (non-fatal)
      try {
        this.addAuditLog('PUBLISH', user, `সংস্করণ ${newVersion} সফলভাবে লাইভে প্রকাশ করা হয়েছে: ${summary}`);
      } catch (logErr) {
        // ignore
      }

      // 5. Notify listeners
      this.publishedListeners.forEach(fn => fn(publishedConfig));
      this.draftListeners.forEach(fn => fn(publishedConfig));
      window.dispatchEvent(new Event('storage'));
      return true;
    } catch (e) {
      console.error('[LandingPageService] Error publishing:', e);
      return false;
    }
  }

  public discardDraft(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const published = this.getPublishedConfig();
      localStorage.setItem(STORAGE_KEYS.DRAFT, JSON.stringify(published));
      this.addAuditLog('DISCARD_DRAFT', 'অ্যাডমিন', 'অপ্রকাশিত খসড়া পরিবর্তন বাতিল করা হয়েছে');
      this.draftListeners.forEach(fn => fn(published));
      window.dispatchEvent(new Event('storage'));
      return true;
    } catch (e) {
      console.error('[LandingPageService] Error discarding draft:', e);
      return false;
    }
  }

  public hasDraftChanges(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const draft = localStorage.getItem(STORAGE_KEYS.DRAFT);
      const published = localStorage.getItem(STORAGE_KEYS.PUBLISHED);
      if (!draft && !published) return false;
      if (!draft || !published) return true;
      const d = JSON.parse(draft);
      const p = JSON.parse(published);
      // Compare data ignoring lastUpdatedAt
      const dCopy = { ...d, lastUpdatedAt: '' };
      const pCopy = { ...p, lastUpdatedAt: '' };
      return JSON.stringify(dCopy) !== JSON.stringify(pCopy);
    } catch {
      return false;
    }
  }

  // --- VERSION HISTORY & ROLLBACK ---
  public getVersions(): VersionSnapshot[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.VERSIONS);
      if (data) return JSON.parse(data);
      // Seed initial version
      const initial: VersionSnapshot[] = [
        {
          id: 'ver-initial',
          version: 1,
          timestamp: new Date().toISOString(),
          author: 'সিস্টেম অ্যাডমিন',
          summary: 'প্রাথমিক ডিফল্ট কনফিগারেশন সংস্করণ',
          config: DEFAULT_LANDING_CONFIG,
        },
      ];
      localStorage.setItem(STORAGE_KEYS.VERSIONS, JSON.stringify(initial));
      return initial;
    } catch {
      return [];
    }
  }

  private createVersionSnapshot(config: LandingPageConfig, author: string, summary: string): void {
    try {
      const versions = this.getVersions();
      // To keep snapshots ultra-light (~2KB) and prevent quota exhaustion, strip heavy base64 images from historical snapshots
      const slimConfig: LandingPageConfig = JSON.parse(JSON.stringify(config));
      if (slimConfig.hero?.slides) {
        slimConfig.hero.slides = slimConfig.hero.slides.map(s => ({
          ...s,
          imageUrl: s.imageUrl && s.imageUrl.length > 500 ? '[photo-preserved]' : s.imageUrl
        }));
      }
      if (slimConfig.gallery?.items) {
        slimConfig.gallery.items = slimConfig.gallery.items.slice(0, 6).map(item => ({
          ...item,
          thumbnail: item.thumbnail && item.thumbnail.length > 500 ? '[photo-preserved]' : item.thumbnail
        }));
      }

      const snapshot: VersionSnapshot = {
        id: `ver-${Date.now()}`,
        version: config.version,
        timestamp: new Date().toISOString(),
        author,
        summary,
        config: slimConfig,
      };
      // Keep only 3 snapshots
      const updated = [snapshot, ...versions].slice(0, 3);
      safeStorageSet(STORAGE_KEYS.VERSIONS, JSON.stringify(updated));
    } catch (e) {
      console.warn('[LandingPageService] Error creating version snapshot:', e);
    }
  }

  public restoreVersion(versionId: string, user: string = 'অ্যাডমিন'): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const versions = this.getVersions();
      const target = versions.find(v => v.id === versionId);
      if (!target) return false;

      const restoredConfig: LandingPageConfig = {
        ...JSON.parse(JSON.stringify(target.config)),
        lastUpdatedAt: new Date().toISOString(),
        updatedBy: `${user} (রিস্টোর: সংস্করণ ${target.version})`,
      };

      // Set as draft so user can review and publish
      this.saveDraftConfig(restoredConfig, user);
      this.addAuditLog('RESTORE_VERSION', user, `সংস্করণ ${target.version} খসড়ায় রিস্টোর করা হয়েছে`);
      return true;
    } catch (e) {
      console.error('[LandingPageService] Error restoring version:', e);
      return false;
    }
  }

  // --- MEDIA LIBRARY ---
  public getMediaList(): MediaItem[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MEDIA);
      if (data) return JSON.parse(data);
      // Seed default school media
      const defaults: MediaItem[] = [
        {
          id: 'media-1',
          name: 'school-logo.png',
          url: '/logo.png',
          size: 45000,
          type: 'image/png',
          dimensions: '192x192',
          uploadedAt: new Date().toISOString(),
          altText: 'বরইতলী উচ্চ বিদ্যালয় লোগো',
          category: 'logo',
        },
        {
          id: 'media-2',
          name: 'school-campus.jpg',
          url: '/school-campus.jpg',
          size: 154000,
          type: 'image/jpeg',
          dimensions: '1200x675',
          uploadedAt: new Date().toISOString(),
          altText: 'স্কুল ক্যাম্পাস ও একাডেমিক ভবন',
          category: 'banner',
        },
      ];
      localStorage.setItem(STORAGE_KEYS.MEDIA, JSON.stringify(defaults));
      return defaults;
    } catch {
      return [];
    }
  }

  public addMediaItem(item: Omit<MediaItem, 'id' | 'uploadedAt'>): MediaItem {
    const list = this.getMediaList();
    const newItem: MediaItem = {
      ...item,
      id: `media-${Date.now()}`,
      uploadedAt: new Date().toISOString(),
    };
    // Keep max 15 media items to protect localStorage quota
    const updated = [newItem, ...list].slice(0, 15);
    safeStorageSet(STORAGE_KEYS.MEDIA, JSON.stringify(updated));
    this.addAuditLog('UPLOAD_MEDIA', 'অ্যাডমিন', `মিডিয়া আপলোড: ${item.name}`);
    return newItem;
  }

  public updateMediaItem(id: string, updates: Partial<MediaItem>): boolean {
    const list = this.getMediaList();
    const index = list.findIndex(m => m.id === id);
    if (index === -1) return false;
    list[index] = { ...list[index], ...updates };
    safeStorageSet(STORAGE_KEYS.MEDIA, JSON.stringify(list));
    return true;
  }

  public deleteMediaItem(id: string): boolean {
    const list = this.getMediaList();
    const item = list.find(m => m.id === id);
    const updated = list.filter(m => m.id !== id);
    safeStorageSet(STORAGE_KEYS.MEDIA, JSON.stringify(updated));
    if (item) {
      this.addAuditLog('DELETE_MEDIA', 'অ্যাডমিন', `মিডিয়া মুছে ফেলা হয়েছে: ${item.name}`);
    }
    return true;
  }

  // --- AUDIT LOG ---
  public getAuditLogs(): AuditLogEntry[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUDIT_LOG);
      if (data) return JSON.parse(data);
      return [];
    } catch {
      return [];
    }
  }

  private addAuditLog(action: string, user: string, details: string): void {
    if (typeof window === 'undefined') return;
    try {
      const logs = this.getAuditLogs();
      const entry: AuditLogEntry = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action,
        user,
        details,
      };
      const updated = [entry, ...logs].slice(0, 30);
      safeStorageSet(STORAGE_KEYS.AUDIT_LOG, JSON.stringify(updated));
    } catch (e) {
      console.error('[LandingPageService] Error adding audit log:', e);
    }
  }

  // --- SECTIONS REORDER & TOGGLE ---
  public reorderSections(sectionIds: string[], user: string = 'অ্যাডমিন'): boolean {
    const draft = this.getDraftConfig();
    const sectionMap = new Map(draft.sections.map(s => [s.id, s]));
    const reordered: SectionItem[] = [];

    sectionIds.forEach((id, index) => {
      const sec = sectionMap.get(id);
      if (sec) {
        reordered.push({ ...sec, order: index + 1 });
        sectionMap.delete(id);
      }
    });

    // Append any missing sections at the end
    sectionMap.forEach(sec => {
      reordered.push({ ...sec, order: reordered.length + 1 });
    });

    draft.sections = reordered;
    return this.saveDraftConfig(draft, user);
  }

  public toggleSection(sectionId: string, enabled: boolean, user: string = 'অ্যাডমিন', autoPublish: boolean = true): boolean {
    const draft = this.getDraftConfig();
    const sec = draft.sections.find(s => s.id === sectionId);
    if (!sec) return false;
    sec.enabled = enabled;

    // Also sync sub-config enabled flag if one exists (e.g. stats, services, academic, etc.)
    const normalizedKey = (sec.key === 'mobile_app' ? 'mobileApp' : sec.key) as keyof LandingPageConfig;
    const key = normalizedKey;
    if (draft[key] && typeof (draft[key] as any).enabled === 'boolean') {
      (draft[key] as any).enabled = enabled;
    }

    this.saveDraftConfig(draft, user);
    if (autoPublish) {
      this.publish(user, `সেকশন "${sec.nameBn}" ${enabled ? 'দৃশ্যমান' : 'লুকানো'} করা হয়েছে`, draft);
    }
    return true;
  }

  public duplicateSection(sectionId: string, user: string = 'অ্যাডমিন'): boolean {
    const draft = this.getDraftConfig();
    const sec = draft.sections.find(s => s.id === sectionId);
    if (!sec) return false;

    const newId = `sec-copy-${Date.now()}`;
    const duplicated: SectionItem = {
      ...JSON.parse(JSON.stringify(sec)),
      id: newId,
      nameBn: `${sec.nameBn} (কপি)`,
      nameEn: `${sec.nameEn} (Copy)`,
      order: draft.sections.length + 1,
      type: 'custom',
    };

    draft.sections.push(duplicated);
    return this.saveDraftConfig(draft, user);
  }

  public deleteSection(sectionId: string, user: string = 'অ্যাডমিন'): boolean {
    const draft = this.getDraftConfig();
    // Do not delete builtin sections, only allow hiding them
    const sec = draft.sections.find(s => s.id === sectionId);
    if (!sec) return false;
    if (sec.type === 'builtin') {
      sec.enabled = false;
    } else {
      draft.sections = draft.sections.filter(s => s.id !== sectionId);
    }
    return this.saveDraftConfig(draft, user);
  }

  // --- LISTENERS ---
  public subscribeDraft(fn: (config: LandingPageConfig) => void): () => void {
    this.draftListeners.push(fn);
    return () => {
      this.draftListeners = this.draftListeners.filter(l => l !== fn);
    };
  }

  public subscribePublished(fn: (config: LandingPageConfig) => void): () => void {
    this.publishedListeners.push(fn);
    return () => {
      this.publishedListeners = this.publishedListeners.filter(l => l !== fn);
    };
  }
}

export const landingPageService = new LandingPageService();
