/**
 * Certificate metadata catalog, explicit hex color palettes, and 12 ornamental frame presets.
 * Explicit hex colors prevent Tailwind v4 oklch() issues during print and PNG canvas rendering.
 */

import type { CertificateType, CertificateLayoutStyle } from '@/services/certificateService';

export interface CertTypeMeta {
  id: CertificateType;
  titleBn: string;
  shortLabelBn: string;
  titleEn: string;
  descBn: string;
  category: 'প্রত্যয়ন' | 'প্রশংসাপত্র' | 'স্বীকৃতি';
  featured?: boolean;
  defaultLayout: CertificateLayoutStyle;
  defaultLang: 'bn' | 'en';
  defaultOrientation: 'portrait' | 'landscape';
  badgeHex: string;
}

export const ALL_CERTIFICATE_TYPES: CertTypeMeta[] = [
  {
    id: 'current_student',
    titleBn: 'অধ্যয়নরত প্রত্যয়ন পত্র',
    shortLabelBn: 'প্রত্যয়ন পত্র',
    titleEn: 'Studentship Certificate',
    descBn: 'বর্তমান ও নিয়মিত শিক্ষার্থীর অধ্যয়ন ও পরিচয় প্রত্যয়ন',
    category: 'প্রত্যয়ন',
    featured: true,
    defaultLayout: 'pad',
    defaultLang: 'bn',
    defaultOrientation: 'portrait',
    badgeHex: '#059669',
  },
  {
    id: 'character_certificate',
    titleBn: 'চারিত্রিক সনদ পত্র',
    shortLabelBn: 'চারিত্রিক সনদ',
    titleEn: 'Character Certificate',
    descBn: 'নৈতিক চরিত্র, শৃঙ্খলা ও আচার-আচরণ সংক্রান্ত প্রত্যয়ন',
    category: 'প্রত্যয়ন',
    featured: true,
    defaultLayout: 'pad',
    defaultLang: 'bn',
    defaultOrientation: 'portrait',
    badgeHex: '#0284c7',
  },
  {
    id: 'transfer_certificate',
    titleBn: 'বিদ্যালয় ছাড়পত্র / টিসি (TC)',
    shortLabelBn: 'ছাড়পত্র / টিসি',
    titleEn: 'Transfer Certificate (TC)',
    descBn: 'বকেয়া পরিশোধ ও বিদ্যালয় পরিবর্তনের আনুষ্ঠানিক ছাড়পত্র',
    category: 'প্রত্যয়ন',
    featured: true,
    defaultLayout: 'pad',
    defaultLang: 'bn',
    defaultOrientation: 'portrait',
    badgeHex: '#e11d48',
  },
  {
    id: 'ssc_testimonial',
    titleBn: 'প্রশংসাপত্র (Testimonial)',
    shortLabelBn: 'প্রশংসাপত্র',
    titleEn: 'SSC / Institutional Testimonial',
    descBn: 'বোর্ড পরীক্ষা বা বিদ্যালয় সমাপ্তির দ্বিভাষিক প্রশংসাপত্র',
    category: 'প্রশংসাপত্র',
    featured: true,
    defaultLayout: 'pad',
    defaultLang: 'bn',
    defaultOrientation: 'portrait',
    badgeHex: '#4338ca',
  },
  {
    id: 'student_verification',
    titleBn: 'শিক্ষার্থী তথ্য যাচাইকরণ',
    shortLabelBn: 'তথ্য যাচাইকরণ',
    titleEn: 'Student Verification',
    descBn: 'পাসপোর্ট, ব্যাংক, উপবৃত্তি বা সরকারি কাজে পরিচয় যাচাই',
    category: 'প্রত্যয়ন',
    defaultLayout: 'pad',
    defaultLang: 'bn',
    defaultOrientation: 'portrait',
    badgeHex: '#0d9488',
  },
  {
    id: 'merit_certificate',
    titleBn: 'মেধা সনদ পত্র',
    shortLabelBn: 'মেধা সনদ',
    titleEn: 'Certificate of Merit',
    descBn: 'পরীক্ষায় কৃতিত্বপূর্ণ ফলাফল ও মেধাতালিকার স্বীকৃতি সনদ',
    category: 'স্বীকৃতি',
    defaultLayout: 'pad',
    defaultLang: 'bn',
    defaultOrientation: 'portrait',
    badgeHex: '#b45309',
  },
  {
    id: 'appreciation',
    titleBn: 'কৃতিত্ব ও প্রশংসা সনদ',
    shortLabelBn: 'কৃতিত্ব সনদ',
    titleEn: 'Certificate of Appreciation',
    descBn: 'বিশেষ অবদান, নেতৃত্ব ও সৃজনশীল অর্জনের সম্মাননা সনদ',
    category: 'স্বীকৃতি',
    defaultLayout: 'pad',
    defaultLang: 'bn',
    defaultOrientation: 'portrait',
    badgeHex: '#7c3aed',
  },
  {
    id: 'participation',
    titleBn: 'অংশগ্রহণ সনদ পত্র',
    shortLabelBn: 'অংশগ্রহণ সনদ',
    titleEn: 'Certificate of Participation',
    descBn: 'ক্রীড়া, বিতর্ক, সাংস্কৃতিক বা বিজ্ঞান মেলায় অংশগ্রহণ সনদ',
    category: 'স্বীকৃতি',
    defaultLayout: 'pad',
    defaultLang: 'bn',
    defaultOrientation: 'portrait',
    badgeHex: '#2563eb',
  },
  {
    id: 'activity_certificate',
    titleBn: 'সহশিক্ষা ও অভিজ্ঞতা সনদ',
    shortLabelBn: 'সহশিক্ষা সনদ',
    titleEn: 'Experience & Activity',
    descBn: 'স্কাউট, গার্ল গাইড, বিএনসিসি বা ক্লাব অভিজ্ঞতার প্রত্যয়ন',
    category: 'স্বীকৃতি',
    defaultLayout: 'pad',
    defaultLang: 'bn',
    defaultOrientation: 'portrait',
    badgeHex: '#0f766e',
  },
  {
    id: 'custom_certificate',
    titleBn: 'বিশেষ কাস্টম সনদ / প্রত্যয়ন',
    shortLabelBn: 'কাস্টম সনদ',
    titleEn: 'Custom Certificate',
    descBn: 'প্রতিষ্ঠানের যেকোনো বিশেষ দাপ্তরিক প্রয়োজনের মুক্ত ফরম্যাট',
    category: 'প্রত্যয়ন',
    featured: true,
    defaultLayout: 'pad',
    defaultLang: 'bn',
    defaultOrientation: 'portrait',
    badgeHex: '#334155',
  },
];

export interface CertificateColorTheme {
  id: string;
  nameBn: string;
  primary: string;
  secondary: string;
  softTint: string;
  titleTextOnRibbon: string;
}

export const CERTIFICATE_COLOR_THEMES: CertificateColorTheme[] = [
  {
    id: 'royal_indigo',
    nameBn: 'রয়্যাল ইন্ডিগো',
    primary: '#1e1b4b',
    secondary: '#d97706',
    softTint: '#eef2ff',
    titleTextOnRibbon: '#ffffff',
  },
  {
    id: 'emerald_crest',
    nameBn: 'পান্না সবুজ',
    primary: '#064e3b',
    secondary: '#b45309',
    softTint: '#ecfdf5',
    titleTextOnRibbon: '#ffffff',
  },
  {
    id: 'imperial_gold',
    nameBn: 'সোনালী ঐতিহ্য',
    primary: '#78350f',
    secondary: '#ca8a04',
    softTint: '#fffbeb',
    titleTextOnRibbon: '#ffffff',
  },
  {
    id: 'crimson_maroon',
    nameBn: 'রাজকীয় মেরুন',
    primary: '#881337',
    secondary: '#be123c',
    softTint: '#fff1f2',
    titleTextOnRibbon: '#ffffff',
  },
  {
    id: 'teal_heritage',
    nameBn: 'টিল হেরিটেজ',
    primary: '#134e4a',
    secondary: '#0d9488',
    softTint: '#f0fdfa',
    titleTextOnRibbon: '#ffffff',
  },
  {
    id: 'sapphire_blue',
    nameBn: 'নভোনীল সাফায়ার',
    primary: '#1e3a8a',
    secondary: '#0284c7',
    softTint: '#eff6ff',
    titleTextOnRibbon: '#ffffff',
  },
  {
    id: 'classic_ink',
    nameBn: 'ক্ল্যাসিক কালি',
    primary: '#0f172a',
    secondary: '#475569',
    softTint: '#f8fafc',
    titleTextOnRibbon: '#ffffff',
  },
];

export interface BorderPresetMeta {
  id: string;
  nameBn: string;
  outerWidth: number;
  innerWidth: number;
  outerStyle: 'solid' | 'double' | 'dashed' | 'ridge' | 'groove';
  innerStyle: 'solid' | 'double' | 'dotted' | 'dashed';
  cornerOrnament: 'crest' | 'bracket' | 'diamond' | 'floral' | 'none';
}

export const CERTIFICATE_BORDER_PRESETS: BorderPresetMeta[] = [
  { id: 'royal_crest', nameBn: '১. রয়্যাল ক্রেস্ট', outerWidth: 6, innerWidth: 1.5, outerStyle: 'double', innerStyle: 'solid', cornerOrnament: 'crest' },
  { id: 'imperial_double', nameBn: '২. ডাবল গোল্ড', outerWidth: 5, innerWidth: 2, outerStyle: 'solid', innerStyle: 'double', cornerOrnament: 'diamond' },
  { id: 'academic_pillar', nameBn: '৩. একাডেমিক পিলার', outerWidth: 4, innerWidth: 1.5, outerStyle: 'ridge', innerStyle: 'dotted', cornerOrnament: 'bracket' },
  { id: 'heritage_floral', nameBn: '৪. হেরিটেজ লতা', outerWidth: 5, innerWidth: 1.5, outerStyle: 'double', innerStyle: 'dashed', cornerOrnament: 'floral' },
  { id: 'executive_clean', nameBn: '৫. এক্সিকিউটিভ স্লিম', outerWidth: 2.5, innerWidth: 1, outerStyle: 'solid', innerStyle: 'solid', cornerOrnament: 'bracket' },
  { id: 'crimson_seal', nameBn: '৬. গাঢ় মেরুন ফ্রেম', outerWidth: 6, innerWidth: 2, outerStyle: 'groove', innerStyle: 'solid', cornerOrnament: 'crest' },
  { id: 'minimal_single', nameBn: '৭. মিনিমাল লাইন', outerWidth: 1.5, innerWidth: 0, outerStyle: 'solid', innerStyle: 'solid', cornerOrnament: 'none' },
  { id: 'dotted_vintage', nameBn: '৮. ভিন্টেজ ডটেড', outerWidth: 4, innerWidth: 2, outerStyle: 'solid', innerStyle: 'dotted', cornerOrnament: 'diamond' },
  { id: 'ribbon_classic', nameBn: '৯. কনভোকেশন ফ্রেম', outerWidth: 7, innerWidth: 1.5, outerStyle: 'double', innerStyle: 'solid', cornerOrnament: 'floral' },
  { id: 'modern_hairline', nameBn: '১০. মডার্ন হেয়ারলাইন', outerWidth: 2, innerWidth: 1, outerStyle: 'solid', innerStyle: 'dotted', cornerOrnament: 'none' },
  { id: 'custom_png', nameBn: '১১. কাস্টম PNG বর্ডার', outerWidth: 0, innerWidth: 0, outerStyle: 'solid', innerStyle: 'solid', cornerOrnament: 'none' },
  { id: 'no_border_pad', nameBn: '১২. বর্ডারহীন (প্যাডের জন্য)', outerWidth: 0, innerWidth: 0, outerStyle: 'solid', innerStyle: 'solid', cornerOrnament: 'none' },
];

export function resolveThemePalette(themeId?: string, customHex?: string): CertificateColorTheme {
  const found = CERTIFICATE_COLOR_THEMES.find((t) => t.id === themeId) || CERTIFICATE_COLOR_THEMES[0];
  if (customHex && /^#[0-9a-fA-F]{6}$/.test(customHex.trim())) {
    return {
      ...found,
      primary: customHex.trim(),
      secondary: '#b45309',
      softTint: `${customHex.trim()}12`,
    };
  }
  return found;
}
