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
  schoolNameEn?: string;
  schoolLogo: string;
  schoolPhoto?: string;
  customBorderPng?: string;
  customBorders?: CustomPngBorder[];
  selectedBorderId?: string;
  address: string;
  addressEn?: string;
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
  schoolLogo: '',  // ← Empty by default; dynamically falls back to institutional crest or uploaded logo
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
const STORAGE_KEY_LOGO = 'sms_school_logo_master';
const IDB_NAME = 'sms_persistent_vault';
const IDB_STORE = 'app_state';

// ─── INDEXEDDB PERSISTENCE VAULT (SURVIVES BROWSER CACHE CLEAR) ───
const openIdb = (): Promise<IDBDatabase | null> => {
  if (typeof window === 'undefined' || !window.indexedDB) return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(IDB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
};

const idbGet = async (key: string): Promise<any> => {
  const db = await openIdb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
};

const idbSet = async (key: string, val: any): Promise<void> => {
  const db = await openIdb();
  if (!db) return;
  try {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    store.put(val, key);
  } catch {}
};

const getInitialSettings = (): SchoolSettings => {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const storedMasterLogo = localStorage.getItem(STORAGE_KEY_LOGO);
    if (stored) {
      const parsed = JSON.parse(stored);
      const margins = parsed.padMargins || {};
      const isLegacy = !margins.top || margins.top < 3.0 || (margins.top === 1.2 && margins.left === 1.4) || margins.top === 2.0;
      const effectiveLogo = parsed.schoolLogo || storedMasterLogo || '';
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        schoolLogo: effectiveLogo,
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
    } else if (storedMasterLogo) {
      return {
        ...DEFAULT_SETTINGS,
        schoolLogo: storedMasterLogo,
      };
    }
  } catch (e) {
    console.error('Failed to load settings from localStorage', e);
  }
  return DEFAULT_SETTINGS;
};

let currentSettings: SchoolSettings = getInitialSettings();
const listeners: ((settings: SchoolSettings) => void)[] = [];

// Re-hydrate from persistent IndexedDB vault if localStorage was wiped or missing
if (typeof window !== 'undefined') {
  Promise.all([idbGet(STORAGE_KEY), idbGet(STORAGE_KEY_LOGO)]).then(([idbSettings, idbLogo]) => {
    let changed = false;
    if (idbSettings && (!currentSettings.schoolName || !currentSettings.schoolLogo)) {
      currentSettings = {
        ...DEFAULT_SETTINGS,
        ...currentSettings,
        ...idbSettings,
      };
      changed = true;
    }
    if (idbLogo && !currentSettings.schoolLogo) {
      currentSettings.schoolLogo = idbLogo;
      changed = true;
    }
    if (changed) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentSettings));
        if (currentSettings.schoolLogo) {
          localStorage.setItem(STORAGE_KEY_LOGO, currentSettings.schoolLogo);
        }
      } catch {}
      listeners.forEach((fn) => fn(currentSettings));
    }
  }).catch(() => {});

  // ☁️ Auto-hydrate and Real-Time Listen from Google Cloud Firestore (Cross-PC Instant Sync)
  import('./firebaseSyncService').then(({ firebaseSyncService }) => {
    // 1. Fetch latest settings from Cloud Firestore on startup
    firebaseSyncService.fetchLandingPageCloudData().then((cloudData) => {
      if (cloudData.settings && (cloudData.settings.schoolLogo || cloudData.settings.schoolName)) {
        currentSettings = {
          ...DEFAULT_SETTINGS,
          ...currentSettings,
          ...cloudData.settings,
        };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(currentSettings));
          if (currentSettings.schoolLogo) {
            localStorage.setItem(STORAGE_KEY_LOGO, currentSettings.schoolLogo);
            idbSet(STORAGE_KEY_LOGO, currentSettings.schoolLogo);
          }
          idbSet(STORAGE_KEY, currentSettings);
        } catch {}
        listeners.forEach((fn) => fn(currentSettings));
      } else if (currentSettings.schoolLogo) {
        // 🚀 Local browser has the updated logo but Cloud Firestore doesn't have it yet!
        // Auto-upload local logo to Cloud Firestore so all other PCs receive it immediately!
        firebaseSyncService.syncSettingsToCloud(currentSettings).catch((err) => {
          console.warn('[SettingsService] Cloud logo seed warning:', err);
        });
      }
    }).catch(() => {});

    // 2. Real-time onSnapshot subscription for live multi-PC syncing
    firebaseSyncService.subscribeLandingPageCloud((cloudUpdate) => {
      if (cloudUpdate.settings && (cloudUpdate.settings.schoolLogo || cloudUpdate.settings.schoolName)) {
        const nextSettings: SchoolSettings = {
          ...DEFAULT_SETTINGS,
          ...currentSettings,
          ...cloudUpdate.settings,
        };
        const prevSerialized = JSON.stringify({ ...currentSettings, updatedAt: undefined });
        const nextSerialized = JSON.stringify({ ...nextSettings, updatedAt: undefined });
        if (prevSerialized === nextSerialized) return;
        currentSettings = nextSettings;
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(currentSettings));
          if (currentSettings.schoolLogo) {
            localStorage.setItem(STORAGE_KEY_LOGO, currentSettings.schoolLogo);
            idbSet(STORAGE_KEY_LOGO, currentSettings.schoolLogo);
          }
          idbSet(STORAGE_KEY, currentSettings);
        } catch {}
        listeners.forEach((fn) => fn(currentSettings));
      }
    });
  }).catch(() => {});
}

export const settingsService = {
  getSettings: (): SchoolSettings => {
    if (typeof window !== 'undefined') {
      currentSettings = getInitialSettings();
    }
    return currentSettings;
  },
  updateSettings: (newSettings: Partial<SchoolSettings>) => {
    const nextSettings: SchoolSettings = {
      ...currentSettings,
      ...newSettings,
      padMargins: {
        ...DEFAULT_PAD_MARGINS,
        ...(currentSettings.padMargins || {}),
        ...(newSettings.padMargins || {})
      }
    };
    const prevClean = JSON.stringify({ ...(currentSettings as any), updatedAt: undefined });
    const nextClean = JSON.stringify({ ...(nextSettings as any), updatedAt: undefined });
    if (prevClean === nextClean) {
      return;
    }
    currentSettings = nextSettings;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentSettings));
        if (currentSettings.schoolLogo) {
          localStorage.setItem(STORAGE_KEY_LOGO, currentSettings.schoolLogo);
          idbSet(STORAGE_KEY_LOGO, currentSettings.schoolLogo);
        }
        idbSet(STORAGE_KEY, currentSettings);
      } catch (e) {
        console.error('Failed to save settings to localStorage/IndexedDB vault', e);
      }

      // ⚡ Auto-sync with Google Cloud Firestore
      try {
        import('./firebaseSyncService').then(({ firebaseSyncService }) => {
          firebaseSyncService.syncSettingsToCloud(currentSettings).catch(() => {});
        }).catch(() => {});
      } catch (e) {}
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

/**
 * Resolves the English display name of the school from settings without assuming a single hardcoded school.
 */
export const getEnglishSchoolName = (
  settings?: Partial<SchoolSettings> | null,
  fallback: string = 'Smart School Management'
): string => {
  if (settings?.schoolNameEn?.trim()) return settings.schoolNameEn.trim();
  const bn = settings?.schoolName?.trim() || '';
  if (!bn) return fallback;
  if (bn.includes('বরইতলী') || bn.includes('বড়াইতলী')) return 'Baraitali High School';
  if (/[\u0980-\u09FF]/.test(bn)) {
    return bn
      .replace(/উচ্চ\s*বিদ্যালয়|উচ্চ\s*বিদ্যালয়/g, 'High School')
      .replace(/মাধ্যমিক\s*বিদ্যালয়|মাধ্যমিক\s*বিদ্যালয়/g, 'Secondary School')
      .replace(/মডেল\s*স্কুল/g, 'Model School')
      .replace(/কলেজ/g, 'College')
      .replace(/মাদ্রাসা|মাদরাসা/g, 'Madrasah')
      .replace(/সরকারি/g, 'Govt.')
      .trim();
  }
  return bn;
};

/**
 * Resolves the English display address of the school from settings.
 */
export const getEnglishAddress = (
  settings?: Partial<SchoolSettings> | null,
  fallback: string = 'Bangladesh'
): string => {
  if (settings?.addressEn?.trim()) return settings.addressEn.trim();
  const bn = settings?.address?.trim() || '';
  if (!bn) return fallback;
  if (bn.includes('বরইতলী') && (bn.includes('চকরিয়া') || bn.includes('চকরিয়া') || bn.includes('কক্সবাজার'))) {
    return "Baraitoli, Chakaria, Cox's Bazar";
  }
  return bn;
};

/**
 * Derives short institutional crest initials dynamically from configured school name.
 */
export const getSchoolInitials = (
  settings?: Partial<SchoolSettings> | null,
  fallback: string = 'SMS'
): string => {
  const en = getEnglishSchoolName(settings, '');
  if (!en) return fallback;
  const words = en.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return words.map((w) => w[0]).join('').slice(0, 4).toUpperCase();
  }
  return en.slice(0, 3).toUpperCase();
};
