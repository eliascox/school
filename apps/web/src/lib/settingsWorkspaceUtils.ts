import type { SchoolSettings } from '@/services/settingsService';
import type { SettingsTab } from '@/components/settings/settingsShared';

export type SettingsNavItemId = Exclude<SettingsTab, 'bulk-student'>;

export interface SettingsNavItem {
  id: SettingsNavItemId;
  labelBn: string;
  descBn: string;
  categoryId: 'institution' | 'branding' | 'academic_comm' | 'security_data';
}

export interface SettingsCategoryGroup {
  id: 'institution' | 'branding' | 'academic_comm' | 'security_data';
  titleBn: string;
  items: SettingsNavItem[];
}

export const SETTINGS_CATEGORY_GROUPS: SettingsCategoryGroup[] = [
  {
    id: 'institution',
    titleBn: 'প্রতিষ্ঠান ও পরিচয়',
    items: [
      {
        id: 'identity',
        labelBn: 'প্রতিষ্ঠানের তথ্য',
        descBn: 'নাম, EIIN, ঠিকানা ও প্রধান শিক্ষক',
        categoryId: 'institution',
      },
      {
        id: 'committee',
        labelBn: 'ম্যানেজিং কমিটি',
        descBn: 'সভাপতি ও পরিচালনা পর্ষদের তালিকা',
        categoryId: 'institution',
      },
      {
        id: 'facilities',
        labelBn: 'ক্যাম্পাস সুবিধাসমূহ',
        descBn: 'ল্যাব, লাইব্রেরি ও ওয়েবসাইট সেকশন',
        categoryId: 'institution',
      },
    ],
  },
  {
    id: 'branding',
    titleBn: 'প্রিন্ট ও ব্র্যান্ডিং',
    items: [
      {
        id: 'pad',
        labelBn: 'স্কুল প্যাড ও মার্জিন',
        descBn: 'অফিশিয়াল প্যাড আপলোড ও A4 ক্যালিব্রেশন',
        categoryId: 'branding',
      },
      {
        id: 'appearance',
        labelBn: 'ডিজাইন ও লোগো',
        descBn: 'লোগো, লাইট/নাইট থিম ও জলছাপ',
        categoryId: 'branding',
      },
    ],
  },
  {
    id: 'academic_comm',
    titleBn: 'শিক্ষা ও যোগাযোগ',
    items: [
      {
        id: 'academic',
        labelBn: 'একাডেমিক ও সেশন',
        descBn: 'শিক্ষাবর্ষ, পরীক্ষার নাম ও ভর্তি মোড',
        categoryId: 'academic_comm',
      },
      {
        id: 'sms',
        labelBn: 'এসএমএস গেটওয়ে',
        descBn: 'SMS API, সেন্ডার আইডি ও পেমেন্ট',
        categoryId: 'academic_comm',
      },
    ],
  },
  {
    id: 'security_data',
    titleBn: 'নিরাপত্তা ও ডাটা',
    items: [
      {
        id: 'security',
        labelBn: 'নিরাপত্তা ও পাসওয়ার্ড',
        descBn: 'অ্যাডমিন ও শিক্ষকদের লগইন নিয়ন্ত্রণ',
        categoryId: 'security_data',
      },
      {
        id: 'data',
        labelBn: 'ডাটা ও ব্যাকআপ',
        descBn: 'ক্লাউড সিংক, JSON ব্যাকআপ ও রিস্টোর',
        categoryId: 'security_data',
      },
      {
        id: 'system',
        labelBn: 'সিস্টেম ও ভাষা',
        descBn: 'বাংলা/English ভাষা, স্ট্যাটাস ও রিসেট',
        categoryId: 'security_data',
      },
    ],
  },
];

export const ALL_SETTINGS_NAV_ITEMS: SettingsNavItem[] = SETTINGS_CATEGORY_GROUPS.flatMap(
  (g) => g.items,
);

export const TABS_WITH_MARKSHEET_PREVIEW = new Set<SettingsTab>([
  'identity',
  'appearance',
  'academic',
]);

export interface SettingsSearchEntry {
  id: string;
  tab: SettingsNavItemId;
  anchorId?: string;
  titleBn: string;
  subtitleBn: string;
  categoryBn: string;
  keywords: string[];
}

export const SETTINGS_SEARCH_ITEMS: SettingsSearchEntry[] = [
  {
    id: 'school-name',
    tab: 'identity',
    anchorId: 'field-schoolName',
    titleBn: 'প্রতিষ্ঠানের নাম ও ঠিকানা (বাংলা ও English)',
    subtitleBn: 'স্কুলের বাংলা ও ইংরেজি নাম, ঠিকানা ও স্থাপিত সাল',
    categoryBn: 'প্রতিষ্ঠান ও পরিচয়',
    keywords: ['প্রতিষ্ঠান', 'নাম', 'স্কুল', 'ঠিকানা', 'স্থাপিত', 'ইংরেজি', 'school', 'name', 'address', 'identity', 'english', 'schoolNameEn', 'addressEn'],
  },
  {
    id: 'school-eiin',
    tab: 'identity',
    anchorId: 'field-eiin',
    titleBn: 'EIIN নম্বর ও স্থাপিত সাল',
    subtitleBn: 'বোর্ড কোড / EIIN নম্বর সেট করুন',
    categoryBn: 'প্রতিষ্ঠান ও পরিচয়',
    keywords: ['eiin', 'ইআইআইএন', 'কোড', 'স্থাপিত', 'estd'],
  },
  {
    id: 'principal-signature',
    tab: 'identity',
    anchorId: 'field-principalName',
    titleBn: 'প্রধান শিক্ষক ও স্বাক্ষর লেবেল (বাংলা ও English)',
    subtitleBn: 'প্রধান শিক্ষকের বাংলা ও ইংরেজি নাম, পদবি ও মার্কশিট ফুটার',
    categoryBn: 'প্রতিষ্ঠান ও পরিচয়',
    keywords: ['প্রধান শিক্ষক', 'অধ্যক্ষ', 'স্বাক্ষর', 'পদবি', 'ইংরেজি', 'principal', 'headmaster', 'signature', 'english', 'principalNameEn', 'principalTitleEn'],
  },
  {
    id: 'school-contact',
    tab: 'identity',
    anchorId: 'section-contact',
    titleBn: 'যোগাযোগের তথ্য (ফোন, ইমেইল, ওয়েবসাইট)',
    subtitleBn: 'অফিশিয়াল মোবাইল, ইমেইল ও ওয়েবসাইট URL',
    categoryBn: 'প্রতিষ্ঠান ও পরিচয়',
    keywords: ['ফোন', 'মোবাইল', 'ইমেইল', 'ওয়েবসাইট', 'যোগাযোগ', 'phone', 'email', 'website', 'contact'],
  },
  {
    id: 'managing-committee',
    tab: 'committee',
    titleBn: 'ম্যানেজিং কমিটি ও পরিচালনা পর্ষদ',
    subtitleBn: 'সভাপতি ও কমিটির সদস্য যুক্ত/সম্পাদনা করুন',
    categoryBn: 'প্রতিষ্ঠান ও পরিচয়',
    keywords: ['কমিটি', 'ম্যানেজিং', 'সভাপতি', 'সদস্য', 'পর্ষদ', 'committee', 'chairman', 'member'],
  },
  {
    id: 'campus-facilities',
    tab: 'facilities',
    titleBn: 'ক্যাম্পাস সুবিধাসমূহ',
    subtitleBn: 'বিজ্ঞান ল্যাব, লাইব্রেরি, খেলার মাঠ ও গ্যালারি',
    categoryBn: 'প্রতিষ্ঠান ও পরিচয়',
    keywords: ['ক্যাম্পাস', 'সুবিধা', 'ল্যাব', 'লাইব্রেরি', 'মাঠ', 'facilities', 'campus', 'lab'],
  },
  {
    id: 'school-pad',
    tab: 'pad',
    titleBn: 'স্কুল প্যাড আপলোড ও মার্জিন ক্যালিব্রেশন',
    subtitleBn: 'অফিশিয়াল PDF/ছবির প্যাড, মার্জিন এবং সূত্র/তারিখ বক্স',
    categoryBn: 'প্রিন্ট ও ব্র্যান্ডিং',
    keywords: ['প্যাড', 'লেটারহেড', 'মার্জিন', 'সূত্র', 'তারিখ', 'ক্যালিব্রেশন', 'প্রিন্ট', 'pad', 'letterhead', 'margin', 'pdf'],
  },
  {
    id: 'school-logo',
    tab: 'appearance',
    anchorId: 'section-logo',
    titleBn: 'প্রতিষ্ঠানের লোগো আপলোড',
    subtitleBn: 'মার্কশিট, সনদ ও ওয়েবসাইটের লোগো পরিবর্তন',
    categoryBn: 'প্রিন্ট ও ব্র্যান্ডিং',
    keywords: ['লোগো', 'ছবি', 'ব্র্যান্ডিং', 'logo', 'brand', 'crest', 'upload'],
  },
  {
    id: 'theme-mode',
    tab: 'appearance',
    anchorId: 'section-theme',
    titleBn: 'লাইট ও নাইট (ডার্ক) থিম মোড',
    subtitleBn: 'অ্যাপের উজ্জ্বল বা ডার্ক থিম পরিবর্তন করুন',
    categoryBn: 'প্রিন্ট ও ব্র্যান্ডিং',
    keywords: ['থিম', 'ডার্ক', 'নাইট', 'লাইট', 'রঙ', 'ডিজাইন', 'theme', 'dark', 'light', 'mode', 'appearance'],
  },
  {
    id: 'watermark',
    tab: 'appearance',
    anchorId: 'section-watermark',
    titleBn: 'জলছাপ / ওয়াটারমার্ক ও প্রিন্ট অপশন',
    subtitleBn: 'নম্বরপত্রের ব্যাকগ্রাউন্ড জলছাপের ঘনত্ব নিয়ন্ত্রণ',
    categoryBn: 'প্রিন্ট ও ব্র্যান্ডিং',
    keywords: ['জলছাপ', 'ওয়াটারমার্ক', 'ওয়াটারমার্ক', 'watermark', 'opacity', 'print'],
  },
  {
    id: 'academic-session',
    tab: 'academic',
    titleBn: 'একাডেমিক সেশন ও পরীক্ষার নাম',
    subtitleBn: 'বর্তমান শিক্ষাবর্ষ, পরীক্ষার তালিকা ও অনলাইন ভর্তি',
    categoryBn: 'শিক্ষা ও যোগাযোগ',
    keywords: ['সেশন', 'শিক্ষাবর্ষ', 'পরীক্ষা', 'একাডেমিক', 'ভর্তি', 'session', 'exam', 'academic', 'admission'],
  },
  {
    id: 'sms-gateway',
    tab: 'sms',
    titleBn: 'এসএমএস গেটওয়ে ও পেমেন্ট সেটিংস',
    subtitleBn: 'SMS API কী, সেন্ডার আইডি এবং অনলাইন পেমেন্ট',
    categoryBn: 'শিক্ষা ও যোগাযোগ',
    keywords: ['এসএমএস', 'মেসেজ', 'গেটওয়ে', 'পেমেন্ট', 'বিকাশ', 'নগদ', 'sms', 'api', 'gateway', 'payment', 'bkash'],
  },
  {
    id: 'admin-password',
    tab: 'security',
    anchorId: 'section-admin-password',
    titleBn: 'অ্যাডমিন ইউজার আইডি ও পাসওয়ার্ড',
    subtitleBn: 'প্রধান শিক্ষকের লগইন পাসওয়ার্ড পরিবর্তন',
    categoryBn: 'নিরাপত্তা ও ডাটা',
    keywords: ['পাসওয়ার্ড', 'পাসওয়ার্ড', 'অ্যাডমিন', 'লগইন', 'নিরাপত্তা', 'password', 'admin', 'login', 'security'],
  },
  {
    id: 'teacher-passwords',
    tab: 'security',
    anchorId: 'section-teacher-passwords',
    titleBn: 'শিক্ষকদের পাসওয়ার্ড ও আইডি ব্যবস্থাপনা',
    subtitleBn: 'শিক্ষকদের লগইন পাসওয়ার্ড রিসেট ও নিয়ন্ত্রণ',
    categoryBn: 'নিরাপত্তা ও ডাটা',
    keywords: ['শিক্ষক', 'পাসওয়ার্ড', 'পাসওয়ার্ড', 'টিচার', 'teacher', 'password', 'id'],
  },
  {
    id: 'cloud-backup',
    tab: 'data',
    anchorId: 'section-backup',
    titleBn: 'ক্লাউড সিংক ও JSON ব্যাকআপ / রিস্টোর',
    subtitleBn: 'Firebase সিংক, অফলাইন ব্যাকআপ ডাউনলোড ও রিস্টোর',
    categoryBn: 'নিরাপত্তা ও ডাটা',
    keywords: ['ব্যাকআপ', 'রিস্টোর', 'ডাটা', 'ক্লাউড', 'সিংক', 'json', 'backup', 'restore', 'cloud', 'firebase', 'sync'],
  },
  {
    id: 'fresh-start-danger',
    tab: 'data',
    anchorId: 'section-data-danger',
    titleBn: 'ডেঞ্জার জোন: সমস্ত ডেটা মুছে ফ্রেশ স্টার্ট',
    subtitleBn: 'সব ডেমো ডাটা স্থায়ীভাবে মুছে নতুন শুরু করুন',
    categoryBn: 'নিরাপত্তা ও ডাটা',
    keywords: ['মুছে', 'ফ্রেশ', 'ডেঞ্জার', 'রিসেট', 'purge', 'delete', 'danger', 'fresh'],
  },
  {
    id: 'system-language',
    tab: 'system',
    anchorId: 'section-language',
    titleBn: 'সিস্টেমের ভাষা (বাংলা / English)',
    subtitleBn: 'সম্পূর্ণ ড্যাশবোর্ডের ডিফল্ট ভাষা নির্ধারণ',
    categoryBn: 'নিরাপত্তা ও ডাটা',
    keywords: ['ভাষা', 'বাংলা', 'ইংরেজি', 'সিস্টেম', 'language', 'bangla', 'english', 'system'],
  },
  {
    id: 'settings-reset-danger',
    tab: 'system',
    anchorId: 'section-system-danger',
    titleBn: 'ডেঞ্জার জোন: ডিফল্ট সেটিংস রিসেট',
    subtitleBn: 'সকল কনফিগারেশন ফ্যাক্টরি ডিফল্টে ফিরিয়ে নিন',
    categoryBn: 'নিরাপত্তা ও ডাটা',
    keywords: ['রিসেট', 'ডিফল্ট', 'ডেঞ্জার', 'reset', 'default', 'factory', 'danger'],
  },
];

export function searchSettingsItems(query: string): SettingsSearchEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return SETTINGS_SEARCH_ITEMS.filter(
    (item) =>
      item.titleBn.toLowerCase().includes(q) ||
      item.subtitleBn.toLowerCase().includes(q) ||
      item.categoryBn.toLowerCase().includes(q) ||
      item.keywords.some((kw) => kw.toLowerCase().includes(q)),
  ).slice(0, 8);
}

export interface SetupChecklistItem {
  id: 'schoolName' | 'schoolLogo' | 'eiin' | 'principalName' | 'uploadedPadTemplateUrl';
  labelBn: string;
  done: boolean;
  tab: SettingsNavItemId;
  anchorId?: string;
}

export interface SetupChecklistSummary {
  items: SetupChecklistItem[];
  missingItems: SetupChecklistItem[];
  completedCount: number;
  totalCount: number;
  percent: number;
  isComplete: boolean;
}

export function computeSettingsChecklist(settings: Partial<SchoolSettings>): SetupChecklistSummary {
  const items: SetupChecklistItem[] = [
    {
      id: 'schoolName',
      labelBn: 'প্রতিষ্ঠানের নাম',
      done: Boolean(settings.schoolName?.trim()),
      tab: 'identity',
      anchorId: 'field-schoolName',
    },
    {
      id: 'eiin',
      labelBn: 'EIIN নম্বর',
      done: Boolean(settings.eiin?.trim()),
      tab: 'identity',
      anchorId: 'field-eiin',
    },
    {
      id: 'principalName',
      labelBn: 'প্রধান শিক্ষকের নাম',
      done: Boolean(settings.principalName?.trim()),
      tab: 'identity',
      anchorId: 'field-principalName',
    },
    {
      id: 'schoolLogo',
      labelBn: 'প্রতিষ্ঠানের লোগো',
      done: Boolean(settings.schoolLogo?.trim()),
      tab: 'appearance',
      anchorId: 'section-logo',
    },
    {
      id: 'uploadedPadTemplateUrl',
      labelBn: 'স্কুল প্যাড',
      done: Boolean(settings.uploadedPadTemplateUrl?.trim()),
      tab: 'pad',
    },
  ];

  const completedCount = items.filter((i) => i.done).length;
  const totalCount = items.length;
  const missingItems = items.filter((i) => !i.done);

  return {
    items,
    missingItems,
    completedCount,
    totalCount,
    percent: Math.round((completedCount / totalCount) * 100),
    isComplete: completedCount === totalCount,
  };
}

export interface SettingsDirtySnapshot {
  formData: SchoolSettings;
  adminPhoneInput: string;
  adminPassInput: string;
  currentSession: string;
  examNames: string[];
}

function serializeSettingsBaseline(snap: SettingsDirtySnapshot): string {
  const cleanForm = {
    ...(snap.formData as SchoolSettings & { updatedAt?: unknown; uploadedPadUpdatedAt?: unknown }),
    updatedAt: undefined,
    uploadedPadUpdatedAt: undefined,
  };
  return JSON.stringify({
    formData: cleanForm,
    adminPhoneInput: snap.adminPhoneInput.trim(),
    adminPassInput: snap.adminPassInput.trim(),
    currentSession: snap.currentSession.trim(),
    examNames: snap.examNames,
  });
}

export function hasUnsavedSettingsDiff(
  current: SettingsDirtySnapshot,
  baseline: SettingsDirtySnapshot | null,
): boolean {
  if (!baseline) return false;
  return serializeSettingsBaseline(current) !== serializeSettingsBaseline(baseline);
}
