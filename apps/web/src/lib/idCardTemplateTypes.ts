/**
 * Student ID Card Studio — Design Template Types, 6 Built-in Modern Presets & Strict Language Helpers
 */

export type IdCardOrientation = 'portrait' | 'landscape';
export type IdCardDocLang = 'bn' | 'en';
export type IdCardSideMode = 'front' | 'back' | 'both_side_by_side' | 'duplex_mirrored';
export type IdCardBuiltInStyle =
  | 'modern_wave'
  | 'smart_geometric'
  | 'classic_royal'
  | 'minimal_clean'
  | 'midnight_prestige'
  | 'custom_artwork';

export type IdCardPhotoShape = 'rounded' | 'circle' | 'square';
export type IdCardHeaderStyle = 'wave' | 'angled' | 'classic' | 'minimal';

export interface IdCardTemplateConfig {
  id: string;
  name: string;
  description?: string;
  isBuiltIn: boolean;
  baseStyle: IdCardBuiltInStyle;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  surfaceBg: string;
  textColor: string;
  photoShape: IdCardPhotoShape;
  headerStyle: IdCardHeaderStyle;
  showWatermark: boolean;
  showQrCode: boolean;
  showBloodGroup: boolean;
  showGuardian: boolean;
  showEmergencyPhone: boolean;
  showDob: boolean;
  showAddress: boolean;
  showValidity: boolean;
  validityTextBn: string;
  validityTextEn: string;
  backNoticeBn: string;
  backNoticeEn: string;
  /** Optional locally-stored compressed artwork for front card background (0 server bytes) */
  customFrontBgDataUrl?: string;
  /** Optional locally-stored compressed artwork for back card background (0 server bytes) */
  customBackBgDataUrl?: string;
  /** Readability veil opacity (0..0.85) over custom artwork */
  artworkOverlayOpacity?: number;
  /** Optional locally-stored transparent principal signature PNG */
  principalSignatureDataUrl?: string;
  updatedAt?: number;
}

const DEFAULT_BACK_NOTICE_BN =
  'এই পরিচয়পত্রটি প্রতিষ্ঠানের সম্পত্তি। হারিয়ে গেলে অথবা কুড়িয়ে পেলে অনুগ্রহ করে বিদ্যালয় অফিসে জমা দিন।';
const DEFAULT_BACK_NOTICE_EN =
  'This identity card is the property of the institution. If found, please return it to the school office.';

export const BUILT_IN_ID_CARD_TEMPLATES: IdCardTemplateConfig[] = [
  {
    id: 'tpl_modern_wave_emerald',
    name: 'মডার্ন ওয়েভ (এমারেল্ড)',
    description: 'আধুনিক কার্ভড ওয়েভ হেডার, সার্কেল ফটো হ্যালো ও গোল্ড অ্যাক্সেন্ট',
    isBuiltIn: true,
    baseStyle: 'modern_wave',
    primaryColor: '#0B5D3B',
    secondaryColor: '#0F766E',
    accentColor: '#F59E0B',
    surfaceBg: '#FFFFFF',
    textColor: '#0F172A',
    photoShape: 'circle',
    headerStyle: 'wave',
    showWatermark: true,
    showQrCode: true,
    showBloodGroup: true,
    showGuardian: true,
    showEmergencyPhone: true,
    showDob: false,
    showAddress: true,
    showValidity: true,
    validityTextBn: 'মেয়াদ: ডিসেম্বর ২০২৬',
    validityTextEn: 'Valid Thru: Dec 2026',
    backNoticeBn: DEFAULT_BACK_NOTICE_BN,
    backNoticeEn: DEFAULT_BACK_NOTICE_EN,
  },
  {
    id: 'tpl_smart_geometric_navy',
    name: 'স্মার্ট জিওমেট্রিক (নেভি)',
    description: 'অ্যাঙ্গেল্ড রিবন হেডার ও প্রিমিয়াম রয়্যাল ব্লু প্রোফাইল ব্যাজ',
    isBuiltIn: true,
    baseStyle: 'smart_geometric',
    primaryColor: '#1E3A8A',
    secondaryColor: '#2563EB',
    accentColor: '#38BDF8',
    surfaceBg: '#FFFFFF',
    textColor: '#0F172A',
    photoShape: 'rounded',
    headerStyle: 'angled',
    showWatermark: true,
    showQrCode: true,
    showBloodGroup: true,
    showGuardian: true,
    showEmergencyPhone: true,
    showDob: true,
    showAddress: true,
    showValidity: true,
    validityTextBn: 'মেয়াদ: ডিসেম্বর ২০২৬',
    validityTextEn: 'Valid Thru: Dec 2026',
    backNoticeBn: DEFAULT_BACK_NOTICE_BN,
    backNoticeEn: DEFAULT_BACK_NOTICE_EN,
  },
  {
    id: 'tpl_classic_royal_crimson',
    name: 'ক্লাসিক রয়্যাল বোর্ড',
    description: 'ঐতিহ্যবাহী দ্বৈত বর্ডার ফ্রেম ও ক্রিমসন-গোল্ড একাডেমিক লেআউট',
    isBuiltIn: true,
    baseStyle: 'classic_royal',
    primaryColor: '#881337',
    secondaryColor: '#BE123C',
    accentColor: '#D97706',
    surfaceBg: '#FFFDF9',
    textColor: '#1E293B',
    photoShape: 'square',
    headerStyle: 'classic',
    showWatermark: true,
    showQrCode: true,
    showBloodGroup: true,
    showGuardian: true,
    showEmergencyPhone: true,
    showDob: false,
    showAddress: true,
    showValidity: true,
    validityTextBn: 'মেয়াদ: ডিসেম্বর ২০২৬',
    validityTextEn: 'Valid Thru: Dec 2026',
    backNoticeBn: DEFAULT_BACK_NOTICE_BN,
    backNoticeEn: DEFAULT_BACK_NOTICE_EN,
  },
  {
    id: 'tpl_minimal_clean_slate',
    name: 'মিনিমালিস্ট ক্লিন (ইঙ্ক-সেভার)',
    description: 'পরিষ্কার সাদা ক্যানভাস ও শার্প টপ বার — দ্রুত লেজার প্রিন্টের জন্য আদর্শ',
    isBuiltIn: true,
    baseStyle: 'minimal_clean',
    primaryColor: '#0F172A',
    secondaryColor: '#334155',
    accentColor: '#059669',
    surfaceBg: '#FFFFFF',
    textColor: '#0F172A',
    photoShape: 'rounded',
    headerStyle: 'minimal',
    showWatermark: false,
    showQrCode: true,
    showBloodGroup: true,
    showGuardian: true,
    showEmergencyPhone: true,
    showDob: false,
    showAddress: true,
    showValidity: true,
    validityTextBn: 'মেয়াদ: ডিসেম্বর ২০২৬',
    validityTextEn: 'Valid Thru: Dec 2026',
    backNoticeBn: DEFAULT_BACK_NOTICE_BN,
    backNoticeEn: DEFAULT_BACK_NOTICE_EN,
  },
  {
    id: 'tpl_midnight_prestige',
    name: 'মিডনাইট প্রেস্টিজ (গোল্ড)',
    description: 'গাঢ় অবসিডিয়ান হেডার ও মেটালিক গোল্ড হাইলাইটসহ প্রিমিয়াম PVC কার্ড',
    isBuiltIn: true,
    baseStyle: 'midnight_prestige',
    primaryColor: '#0F172A',
    secondaryColor: '#1E293B',
    accentColor: '#EAB308',
    surfaceBg: '#FFFFFF',
    textColor: '#0F172A',
    photoShape: 'circle',
    headerStyle: 'angled',
    showWatermark: true,
    showQrCode: true,
    showBloodGroup: true,
    showGuardian: true,
    showEmergencyPhone: true,
    showDob: true,
    showAddress: true,
    showValidity: true,
    validityTextBn: 'মেয়াদ: ডিসেম্বর ২০২৬',
    validityTextEn: 'Valid Thru: Dec 2026',
    backNoticeBn: DEFAULT_BACK_NOTICE_BN,
    backNoticeEn: DEFAULT_BACK_NOTICE_EN,
  },
  {
    id: 'tpl_custom_artwork_canvas',
    name: 'কাস্টম গ্রাফিক / ব্যাকগ্রাউন্ড',
    description: 'নিজস্ব আপলোড করা PNG/JPG ফ্রেম বা Canva/Photoshop ডিজাইনের ওপর লাইভ ডাটা',
    isBuiltIn: true,
    baseStyle: 'custom_artwork',
    primaryColor: '#0B5D3B',
    secondaryColor: '#1E293B',
    accentColor: '#F59E0B',
    surfaceBg: '#FFFFFF',
    textColor: '#0F172A',
    photoShape: 'rounded',
    headerStyle: 'minimal',
    showWatermark: false,
    showQrCode: true,
    showBloodGroup: true,
    showGuardian: true,
    showEmergencyPhone: true,
    showDob: false,
    showAddress: true,
    showValidity: true,
    validityTextBn: 'মেয়াদ: ডিসেম্বর ২০২৬',
    validityTextEn: 'Valid Thru: Dec 2026',
    backNoticeBn: DEFAULT_BACK_NOTICE_BN,
    backNoticeEn: DEFAULT_BACK_NOTICE_EN,
    artworkOverlayOpacity: 0.14,
  },
];

export function mapLegacyThemeToTemplateId(theme?: string): string {
  if (theme === 'emerald') return 'tpl_modern_wave_emerald';
  if (theme === 'crimson') return 'tpl_classic_royal_crimson';
  if (theme === 'indigo') return 'tpl_smart_geometric_navy';
  return BUILT_IN_ID_CARD_TEMPLATES[0].id;
}

export function createBlankCustomTemplate(
  base?: IdCardTemplateConfig,
  customName = 'আমার কাস্টম আইডি টেম্পলেট',
): IdCardTemplateConfig {
  const source = base || BUILT_IN_ID_CARD_TEMPLATES[0];
  return {
    ...source,
    id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: customName,
    description: 'কাস্টম সংরক্ষিত ডিজাইন টেম্পলেট',
    isBuiltIn: false,
    updatedAt: Date.now(),
  };
}

export function getIdCardGradeLabel(grade: string, lang: IdCardDocLang): string {
  const g = String(grade || '').toLowerCase();
  if (lang === 'en') {
    if (g.includes('10') || g.includes('১০')) return 'Class 10';
    if (g.includes('9') || g.includes('৯')) return 'Class 9';
    if (g.includes('8') || g.includes('৮')) return 'Class 8';
    if (g.includes('7') || g.includes('৭')) return 'Class 7';
    if (g.includes('6') || g.includes('৬')) return 'Class 6';
    return grade || 'Class';
  }
  if (g.includes('10') || g.includes('১০')) return '১০ম শ্রেণি';
  if (g.includes('9') || g.includes('৯')) return '৯ম শ্রেণি';
  if (g.includes('8') || g.includes('৮')) return '৮ম শ্রেণি';
  if (g.includes('7') || g.includes('৭')) return '৭ম শ্রেণি';
  if (g.includes('6') || g.includes('৬')) return '৬ষ্ঠ শ্রেণি';
  return grade || 'শ্রেণি';
}

export function getIdCardGroupLabel(group: string | undefined, lang: IdCardDocLang): string {
  const raw = String(group || '').toLowerCase();
  if (lang === 'en') {
    if (raw.includes('বিজ্ঞান') || raw.includes('science')) return 'Science';
    if (raw.includes('মানবিক') || raw.includes('humanities')) return 'Humanities';
    if (raw.includes('ব্যবসা') || raw.includes('commerce') || raw.includes('business')) {
      return 'Business Studies';
    }
    return 'General';
  }
  if (raw.includes('বিজ্ঞান') || raw.includes('science')) return 'বিজ্ঞান';
  if (raw.includes('মানবিক') || raw.includes('humanities')) return 'মানবিক';
  if (raw.includes('ব্যবসা') || raw.includes('commerce') || raw.includes('business')) {
    return 'ব্যবসায় শিক্ষা';
  }
  return 'সাধারণ';
}

export function getIdCardScopeLabel(
  grade: string,
  section: string | undefined,
  group: string | undefined,
  lang: IdCardDocLang,
): string {
  const g = String(grade || '').toLowerCase();
  const is9or10 = g.includes('9') || g.includes('10') || g.includes('৯') || g.includes('১০');
  if (is9or10 && group && group !== 'সাধারণ' && group.toLowerCase() !== 'general') {
    return getIdCardGroupLabel(group, lang);
  }
  const sec = (section || 'A').trim();
  return lang === 'en' ? `Sec ${sec}` : `শাখা ${sec}`;
}
