export type CustomPngBorder = {
  id: string;
  name: string;
  url: string;
};

export type PadHeaderStyle = 'classic' | 'modern' | 'minimal' | 'dual_logo' | 'simple_clean';

export type PadMargins = {
  top: number;    // inches, e.g. 1.2
  left: number;   // inches, default 1.4
  right: number;  // inches, default 0.5
  bottom: number; // inches, default 0.5
};

export type SchoolSettings = {
  schoolName: string;
  schoolLogo: string;
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
  padHeaderStyle?: PadHeaderStyle;
  padMargins?: PadMargins;
  showPadWatermark?: boolean;
  padWatermarkText?: string;
  padWatermarkOpacity?: number;
  padSecondaryLogo?: string;
  padFooterText?: string;
  padRefPrefix?: string;
  showPadHeaderLine?: boolean;
  showPadFooter?: boolean;
  showPadDateRef?: boolean;
  padSlogan?: string;
};

export const DEFAULT_PAD_MARGINS: PadMargins = {
  top: 0.5,
  left: 0.5,
  right: 0.5,
  bottom: 0.5,
};

const DEFAULT_SETTINGS: SchoolSettings = {
  schoolName: 'বরইতলী উচ্চ বিদ্যালয়',
  schoolLogo: '/logo.png',
  customBorderPng: '',
  customBorders: [],
  selectedBorderId: '',
  address: 'বরইতলী, চকরিয়া, কক্সবাজার।',
  eiin: '106184',
  estdYear: '1969',
  principalName: 'মোহাম্মদ রফিকুল ইসলাম',
  principalTitle: 'প্রধান শিক্ষক',
  classTeacherTitle: 'শ্রেণি শিক্ষকের স্বাক্ষর',
  guardianTitle: 'অভিভাবকের স্বাক্ষর',
  showWatermark: true,
  watermarkText: 'বরইতলী উচ্চ বিদ্যালয়',
  watermarkOpacity: 0.03,
  phone: '01819-000000',
  email: 'boroitoli.high.school@gmail.com',
  website: 'www.boroitolihs.edu.bd',
  showClassSelection: true,
  showSectionSelection: true,
  showRollInput: true,
  language: 'bn',
  onlineAdmissionEnabled: true,

  // 📜 Default School Pad Values
  uploadedPadTemplateUrl: '',
  uploadedPadType: 'image',
  padHeaderStyle: 'classic',
  padMargins: DEFAULT_PAD_MARGINS,
  showPadWatermark: true,
  padWatermarkText: 'বরইতলী উচ্চ বিদ্যালয়',
  padWatermarkOpacity: 0.04,
  padSecondaryLogo: '',
  padFooterText: 'বরইতলী, চকরিয়া, কক্সবাজার | ফোন: 01819-000000 | ইমেইল: boroitoli.high.school@gmail.com | www.boroitolihs.edu.bd',
  padRefPrefix: 'স্মারক নং: ব.উ.বি/',
  showPadHeaderLine: true,
  showPadFooter: true,
  showPadDateRef: true,
  padSlogan: 'শিক্ষাই জাতির মেরুদণ্ড — জ্ঞানই আলো, শিক্ষাই শক্তি',
};

const STORAGE_KEY = 'sms_school_settings';

const getInitialSettings = (): SchoolSettings => {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const margins = parsed.padMargins || {};
      const isLegacy = margins.top === 1.2 && margins.left === 1.4;
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
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
