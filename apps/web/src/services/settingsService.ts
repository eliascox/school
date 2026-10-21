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

export const DEFAULT_COMMITTEE_MEMBERS: CommitteeMember[] = [
  {
    id: 'CM-1',
    name: 'আলহাজ্ব মোস্তফা কামাল',
    role: 'সভাপতি',
    joiningDate: '০১ জানুয়ারি ২০২৪',
    tenure: '২০২৪ – ২০২৬ খ্রিঃ (৩ বছর)',
    phone: '+880 1712-345678',
    email: 'president@school.edu.bd',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=500&auto=format&fit=crop',
    badgeColor: 'bg-emerald-100 text-[#0B5D3B] border-emerald-300',
    facebook: '#',
    linkedin: '#',
    bio: 'বিদ্যালয়ের অবকাঠামোগত উন্নয়ন ও মানসম্মত শিক্ষা নিশ্চিত করতে পরিচালনা পর্ষদ অভিভাবক ও শিক্ষকদের সাথে নিরলসভাবে কাজ করে যাচ্ছে।'
  },
  {
    id: 'CM-2',
    name: 'বেগম রোকসানা চৌধুরী',
    role: 'সহ-সভাপতি',
    joiningDate: '১৫ জানুয়ারি ২০২৪',
    tenure: '২০২৪ – ২০২৬ খ্রিঃ (৩ বছর)',
    phone: '+880 1813-456789',
    email: 'vicepresident@school.edu.bd',
    photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=500&auto=format&fit=crop',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    facebook: '#',
    linkedin: '#',
    bio: 'নারী শিক্ষার প্রসার, সহশিক্ষা কার্যক্রমের ব্যাপ্তি এবং শিক্ষার্থীদের সুনাগরিক হিসেবে গড়ে তুলতে আমরা সবসময় সচেষ্ট।'
  },
  {
    id: 'CM-3',
    name: 'জনাব মোখলেসুর রহমান ভূঁইয়া',
    role: 'ক্যাশিয়ার (অর্থ সম্পাদক)',
    joiningDate: '২০ জানুয়ারি ২০২৪',
    tenure: '২০২৪ – ২০২৬ খ্রিঃ (৩ বছর)',
    phone: '+880 1914-567890',
    email: 'cashier@school.edu.bd',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=500&auto=format&fit=crop',
    badgeColor: 'bg-sky-100 text-sky-800 border-sky-300',
    facebook: '#',
    linkedin: '#',
    bio: 'বিদ্যালয়ের যাবতীয় আর্থিক ব্যবস্থাপনা, উন্নয়ন তহবিল এবং বাজেট ব্যবহারে স্বচ্ছতা ও জবাবদিহিতা নিশ্চিত করাই আমাদের অঙ্গীকার।'
  },
  {
    id: 'CM-4',
    name: 'মোহাম্মদ রফিকুল ইসলাম',
    role: 'সেক্রেটারী (সদস্য সচিব)',
    joiningDate: '০১ জানুয়ারি ২০২৪',
    tenure: 'পদাধিকারবলে অব্যাহত (প্রধান শিক্ষক)',
    phone: '+880 1615-678901',
    email: 'headmaster@school.edu.bd',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=500&auto=format&fit=crop',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
    facebook: '#',
    linkedin: '#',
    bio: 'কমিটির বিজ্ঞ দিকনির্দেশনা ও সার্বিক সমন্বয়ে বিদ্যালয়ের একাডেমিক ও প্রশাসনিক কার্যক্রম সর্বোচ্চ শৃঙ্খলার সাথে বাস্তবায়িত হচ্ছে।'
  }
];

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

  // 👥 Managing Committee Members
  committeeMembers?: CommitteeMember[];
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
  schoolPhoto: '/school-campus.jpg',
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
      const isLegacy = margins.top === 1.2 && margins.left === 1.4;
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
