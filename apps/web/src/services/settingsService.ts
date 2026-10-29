export type CustomPngBorder = {
  id: string;
  name: string;
  url: string;
};

export type PadHeaderStyle = 'classic' | 'modern' | 'minimal' | 'dual_logo' | 'simple_clean';

export interface CommitteeMember {
  id: string;
  name: string;
  role: string;
  joiningDate?: string;
  tenure?: string;
  phone?: string;
  email?: string;
  photo?: string;
  badgeColor?: string;
  facebook?: string;
  linkedin?: string;
  bio?: string;
  order?: number;
}

// ─── NO HARDCODED COMMITTEE MEMBERS ────────────────────────────────────────
// All committee members must be added via Settings → Managing Committee panel.
export const DEFAULT_COMMITTEE_MEMBERS: CommitteeMember[] = [];

export type PadMargins = {
  top: number;    // inches, e.g. 1.2
  left: number;   // inches, default 1.4
  right: number;  // inches, default 0.5
  bottom: number; // inches, default 0.5
};

export type SchoolSettings = {
  schoolName: string;
  schoolLogo: string;
  schoolPhoto?: string;
  customBorderPng?: string;
  customBorders?: CustomPngBorder[];
  selectedBorderId?: string;
  address: string;
  eiin: string;
  estdYear: string;
  principalName: string;
  principalTitle: string;
  classTeacherTitle: string;
  guardianTitle: string;
  showWatermark: boolean;
  watermarkText: string;
  watermarkOpacity: number;
  phone: string;
  email: string;
  website: string;
  showClassSelection: boolean;
  showSectionSelection: boolean;
  showRollInput: boolean;
  language?: 'bn' | 'en';
  theme?: 'light' | 'dark';
  onlineAdmissionEnabled?: boolean;

  // 📜 Official School Pad Template (Uploaded PDF or Image)
  uploadedPadTemplateUrl?: string;
  uploadedPadType?: 'image' | 'pdf';
  uploadedPadFileName?: string;
  uploadedPadFileSize?: number;
  activePadMode?: 'uploaded' | 'preprinted';
  padMargins?: PadMargins;
  padFontSize?: number;
  padLineHeight?: number;
  padSignatureGap?: number;
  padRefPrefix?: string;

  // 👥 Managing Committee Members
  committeeMembers?: CommitteeMember[];
};

export const DEFAULT_PAD_MARGINS: PadMargins = {
  top: 3.0,    // 3.0 inches clear space for official school letterhead header (উপর থেকে ৩ ইঞ্চি নিচ থেকে লিখা শুরু হবে)
  left: 0.8,   // 0.8 inches left margin
  right: 0.8,  // 0.8 inches right margin
  bottom: 1.0, // 1.0 inch bottom space for footer
};

const DEFAULT_SETTINGS: SchoolSettings = {
  schoolName: '',  // ← Set in Settings → এখানে প্রতিষ্ঠানের নাম দিন
  schoolLogo: '/logo.png',
  schoolPhoto: '/school-campus.jpg',
  customBorderPng: '',
  customBorders: [],
  selectedBorderId: '',
  address: '',  // ← Set in Settings
  eiin: '',  // ← Set in Settings
  estdYear: '1969',
  principalName: '',  // ← Set in Settings
  principalTitle: 'প্রধান শিক্ষক',
  classTeacherTitle: 'শ্রেণি শিক্ষকের স্বাক্ষর',
  guardianTitle: 'অভিভাবকের স্বাক্ষর',
  showWatermark: true,
  watermarkText: '',  // ← Synced from schoolName
  watermarkOpacity: 0.03,
  phone: '',  // ← Set in Settings
  email: '',  // ← Set in Settings
  website: '',  // ← Set in Settings
  showClassSelection: true,
  showSectionSelection: true,
  showRollInput: true,
  language: 'bn',
  onlineAdmissionEnabled: true,

  // 📜 Default School Pad Values
  uploadedPadTemplateUrl: '',
  uploadedPadType: 'image',
  uploadedPadFileName: '',
  uploadedPadFileSize: 0,
  activePadMode: 'uploaded',
  padMargins: DEFAULT_PAD_MARGINS,
  padFontSize: 14,
  padLineHeight: 2.1,
  padSignatureGap: 2.5,
  padRefPrefix: 'স্মারক নং: ব.উ.বি/',
  committeeMembers: DEFAULT_COMMITTEE_MEMBERS,
};

const STORAGE_KEY = 'sms_school_settings';

const getInitialSettings = (): SchoolSettings => {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const margins = parsed.padMargins || {};
      const isLegacy = !margins.top || margins.top < 3.0 || (margins.top === 1.2 && margins.left === 1.4) || margins.top === 2.0;
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        committeeMembers: parsed.committeeMembers && parsed.committeeMembers.length > 0
          ? parsed.committeeMembers
          : DEFAULT_COMMITTEE_MEMBERS,
        padMargins: isLegacy
          ? { ...DEFAULT_PAD_MARGINS }
          : {
              ...DEFAULT_PAD_MARGINS,
              ...margins
            }
      };
    }
  } catch (e) {
    console.error('Failed to load settings from localStorage', e);
  }
  return DEFAULT_SETTINGS;
};

let currentSettings: SchoolSettings = getInitialSettings();
const listeners: ((settings: SchoolSettings) => void)[] = [];

export const settingsService = {
  getSettings: (): SchoolSettings => {
    if (typeof window !== 'undefined') {
      currentSettings = getInitialSettings();
    }
    return currentSettings;
  },
  updateSettings: (newSettings: Partial<SchoolSettings>) => {
    currentSettings = {
      ...currentSettings,
      ...newSettings,
      padMargins: {
        ...DEFAULT_PAD_MARGINS,
        ...(currentSettings.padMargins || {}),
        ...(newSettings.padMargins || {})
      }
    };
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentSettings));
      } catch (e) {
        console.error('Failed to save settings to localStorage', e);
      }
    }
    listeners.forEach((fn) => fn(currentSettings));
  },
  subscribe: (fn: (settings: SchoolSettings) => void) => {
    listeners.push(fn);
    fn(currentSettings);
    return () => {
      const idx = listeners.indexOf(fn);
      if (idx > -1) listeners.splice(idx, 1);
    };
  },
};
