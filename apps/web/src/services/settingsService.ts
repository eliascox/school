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
  uploadedPadUpdatedAt?: number;
  activePadMode?: 'uploaded' | 'preprinted';
  padMargins?: PadMargins;
  padHeaderFields?: PadHeaderFieldsConfig;
  padFontSize?: number;
  padLineHeight?: number;
  padSignatureGap?: number;
  padRefPrefix?: string;

  // 👥 Managing Committee Members
  committeeMembers?: CommitteeMember[];
};

export interface PadHeaderFieldsConfig {
  placement: 'pad_header_boxes' | 'inline_below' | 'hide_ref_date';
  refTopMm: number;
  refLeftMm: number;
  dateTopMm: number;
  dateLeftMm: number;
  dayWidthMm: number;
  monthWidthMm: number;
  yearWidthMm: number;
  boxHeightMm: number;
  boxGapMm: number;
  fontSizePx: number;
}

export const DEFAULT_PAD_HEADER_FIELDS: PadHeaderFieldsConfig = {
  placement: 'pad_header_boxes',
  refTopMm: 46.8,
  refLeftMm: 46.5,
  dateTopMm: 46.7,
  dateLeftMm: 171.0,
  dayWidthMm: 9.3,
  monthWidthMm: 9.5,
  yearWidthMm: 14.0,
  boxHeightMm: 7.2,
  boxGapMm: 0.2,
  fontSizePx: 12.5,
};

export const DEFAULT_PAD_MARGINS: PadMargins = {
  top: 2.4,     // Starts cleanly below the pad's সূত্র: & তারিখ: [][][] header bar
  left: 0.75,   // 0.75 inches left margin
  right: 0.75,  // 0.75 inches right margin
  bottom: 0.9,  // 0.9 inches bottom space for footer
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
  padHeaderFields: DEFAULT_PAD_HEADER_FIELDS,
  padFontSize: 14,
  padLineHeight: 2.1,
  padSignatureGap: 2.5,
  padRefPrefix: 'স্মারক নং: ব.উ.বি/',
  committeeMembers: DEFAULT_COMMITTEE_MEMBERS,
};

const STORAGE_KEY = 'sms_school_settings';
const STORAGE_KEY_LOGO = 'sms_school_logo_master';
const STORAGE_KEY_PAD = 'sms_school_pad_master';
const IDB_NAME = 'sms_persistent_vault';
const IDB_STORE = 'app_state';

type PadVaultEntry = {
  url: string;
  padType?: 'image' | 'pdf';
  fileName?: string;
  fileSize?: number;
  updatedAt?: number;
};

let inMemoryPadVault: PadVaultEntry | null = null;

function persistSettingsSafely(next: SchoolSettings): void {
  if (typeof window === 'undefined') return;

  // Always persist to IndexedDB vault first (survives localStorage quota limits)
  if (next.uploadedPadTemplateUrl) {
    inMemoryPadVault = {
      url: next.uploadedPadTemplateUrl,
      padType: next.uploadedPadType,
      fileName: next.uploadedPadFileName,
      fileSize: next.uploadedPadFileSize,
      updatedAt: next.uploadedPadUpdatedAt,
    };
    idbSet(STORAGE_KEY_PAD, inMemoryPadVault);
  } else {
    inMemoryPadVault = null;
    idbSet(STORAGE_KEY_PAD, null);
  }
  if (next.schoolLogo) {
    idbSet(STORAGE_KEY_LOGO, next.schoolLogo);
  }
  idbSet(STORAGE_KEY, next);

  // Save to localStorage; if the large pad base64 hits QuotaExceededError, keep the pad in IDB
  // and persist all remaining settings + pad metadata cleanly in localStorage.
  try {
    const serialized = JSON.stringify(next);
    localStorage.setItem(STORAGE_KEY, serialized);
    cachedSettingsRaw = serialized;
  } catch (quotaErr) {
    try {
      const compact: SchoolSettings & { _padStoredInIdb?: boolean } = {
        ...next,
        uploadedPadTemplateUrl: '',
        _padStoredInIdb: Boolean(next.uploadedPadTemplateUrl),
      };
      const compactSerialized = JSON.stringify(compact);
      localStorage.setItem(STORAGE_KEY, compactSerialized);
      cachedSettingsRaw = compactSerialized;
    } catch (e) {
      console.error('Failed to save settings to localStorage (kept in IndexedDB vault)', quotaErr, e);
    }
  }

  if (next.schoolLogo) {
    try {
      localStorage.setItem(STORAGE_KEY_LOGO, next.schoolLogo);
      cachedMasterLogoRaw = next.schoolLogo;
    } catch {}
  }
}

export function mergeCloudSettingsPreservingLocalPad(
  local: SchoolSettings,
  cloud: Partial<SchoolSettings>,
): SchoolSettings {
  const cloudHasPad = Boolean(cloud.uploadedPadTemplateUrl && cloud.uploadedPadTemplateUrl.trim());
  const localHasPad = Boolean(local.uploadedPadTemplateUrl && local.uploadedPadTemplateUrl.trim());
  const localPadTs = Number(local.uploadedPadUpdatedAt || 0);
  const cloudPadTs = Number(cloud.uploadedPadUpdatedAt || 0);
  const keepLocalPad = localHasPad && (!cloudHasPad || localPadTs > cloudPadTs);

  return {
    ...DEFAULT_SETTINGS,
    ...local,
    ...cloud,
    ...(keepLocalPad
      ? {
          uploadedPadTemplateUrl: local.uploadedPadTemplateUrl,
          uploadedPadType: local.uploadedPadType,
          uploadedPadFileName: local.uploadedPadFileName,
          uploadedPadFileSize: local.uploadedPadFileSize,
          uploadedPadUpdatedAt: local.uploadedPadUpdatedAt,
          activePadMode: local.activePadMode || 'uploaded',
        }
      : {}),
  };
}

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
      const isLegacyUnconfiguredDefault =
        !margins.top ||
        (margins.top === 1.2 && margins.left === 1.4) ||
        (margins.top === 3.0 &&
          margins.left === 0.8 &&
          margins.right === 0.8 &&
          margins.bottom === 1.0 &&
          !parsed.padHeaderFields);
      const effectiveLogo = parsed.schoolLogo || storedMasterLogo || '';
      const effectivePadUrl =
        parsed.uploadedPadTemplateUrl ||
        (parsed._padStoredInIdb && inMemoryPadVault?.url ? inMemoryPadVault.url : '') ||
        '';
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        schoolLogo: effectiveLogo,
        uploadedPadTemplateUrl: effectivePadUrl,
        uploadedPadType: parsed.uploadedPadType || inMemoryPadVault?.padType || 'image',
        uploadedPadFileName: parsed.uploadedPadFileName || inMemoryPadVault?.fileName || '',
        uploadedPadFileSize: parsed.uploadedPadFileSize || inMemoryPadVault?.fileSize || 0,
        committeeMembers: parsed.committeeMembers && parsed.committeeMembers.length > 0
          ? parsed.committeeMembers
          : DEFAULT_COMMITTEE_MEMBERS,
        padMargins: isLegacyUnconfiguredDefault
          ? { ...DEFAULT_PAD_MARGINS }
          : {
              ...DEFAULT_PAD_MARGINS,
              ...margins
            },
        padHeaderFields: {
          ...DEFAULT_PAD_HEADER_FIELDS,
          ...(parsed.padHeaderFields || {}),
        },
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

let cachedSettingsRaw: string | null | undefined = undefined;
let cachedMasterLogoRaw: string | null | undefined = undefined;
let currentSettings: SchoolSettings = getInitialSettings();
const listeners: ((settings: SchoolSettings) => void)[] = [];

if (typeof window !== 'undefined') {
  try {
    cachedSettingsRaw = localStorage.getItem(STORAGE_KEY);
    cachedMasterLogoRaw = localStorage.getItem(STORAGE_KEY_LOGO);
  } catch {}
}

// Re-hydrate from persistent IndexedDB vault (recovers logo AND large uploaded school pads)
if (typeof window !== 'undefined') {
  Promise.all([idbGet(STORAGE_KEY), idbGet(STORAGE_KEY_LOGO), idbGet(STORAGE_KEY_PAD)]).then(
    ([idbSettings, idbLogo, idbPad]) => {
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
        currentSettings = { ...currentSettings, schoolLogo: idbLogo };
        changed = true;
      }

      const idbPadEntry: PadVaultEntry | null =
        idbPad && typeof idbPad === 'object' && idbPad.url
          ? (idbPad as PadVaultEntry)
          : idbSettings?.uploadedPadTemplateUrl
          ? {
              url: idbSettings.uploadedPadTemplateUrl,
              padType: idbSettings.uploadedPadType,
              fileName: idbSettings.uploadedPadFileName,
              fileSize: idbSettings.uploadedPadFileSize,
            }
          : null;

      if (idbPadEntry?.url && !currentSettings.uploadedPadTemplateUrl) {
        inMemoryPadVault = idbPadEntry;
        currentSettings = {
          ...currentSettings,
          uploadedPadTemplateUrl: idbPadEntry.url,
          uploadedPadType: idbPadEntry.padType || currentSettings.uploadedPadType || 'image',
          uploadedPadFileName: idbPadEntry.fileName || currentSettings.uploadedPadFileName || '',
          uploadedPadFileSize: idbPadEntry.fileSize || currentSettings.uploadedPadFileSize || 0,
          uploadedPadUpdatedAt: idbPadEntry.updatedAt || currentSettings.uploadedPadUpdatedAt,
          activePadMode: currentSettings.activePadMode || 'uploaded',
        };
        changed = true;
      }

      if (changed) {
        persistSettingsSafely(currentSettings);
        listeners.forEach((fn) => fn(currentSettings));
      }
    },
  ).catch(() => {});

  // ☁️ Deferred Cloud Firestore Sync (never blocks initial route hydration or /login pages)
  const pathnameNow = typeof window.location !== 'undefined' ? window.location.pathname || '' : '';
  const isAuthPage = pathnameNow.startsWith('/login') || pathnameNow.startsWith('/teacher-login');
  if (!isAuthPage) {
    setTimeout(() => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) return;
      import('./firebaseSyncService').then(({ firebaseSyncService }) => {
        // 1. Fetch latest settings from Cloud Firestore (no 403 student count aggregation)
        firebaseSyncService.fetchLandingPageCloudData({ includeStudentCount: false }).then((cloudData) => {
          if (cloudData.settings && (cloudData.settings.schoolLogo || cloudData.settings.schoolName)) {
            const nextMerged = mergeCloudSettingsPreservingLocalPad(currentSettings, cloudData.settings);
            const prevClean = JSON.stringify({ ...(currentSettings as any), updatedAt: undefined });
            const nextClean = JSON.stringify({ ...(nextMerged as any), updatedAt: undefined });
            if (prevClean !== nextClean) {
              currentSettings = nextMerged;
              persistSettingsSafely(currentSettings);
              listeners.forEach((fn) => fn(currentSettings));
            }
          } else if (currentSettings.schoolLogo) {
            // Local browser has the logo but Cloud Firestore doesn't yet
            firebaseSyncService.syncSettingsToCloud(currentSettings).catch((err) => {
              console.warn('[SettingsService] Cloud logo seed warning:', err);
            });
          }
        }).catch(() => {});

        // 2. Real-time onSnapshot subscription for live multi-PC syncing
        firebaseSyncService.subscribeLandingPageCloud((cloudUpdate) => {
          if (cloudUpdate.settings && (cloudUpdate.settings.schoolLogo || cloudUpdate.settings.schoolName)) {
            const nextSettings = mergeCloudSettingsPreservingLocalPad(currentSettings, cloudUpdate.settings);
            const prevSerialized = JSON.stringify({ ...(currentSettings as any), updatedAt: undefined });
            const nextSerialized = JSON.stringify({ ...(nextSettings as any), updatedAt: undefined });
            if (prevSerialized === nextSerialized) return;
            currentSettings = nextSettings;
            persistSettingsSafely(currentSettings);
            listeners.forEach((fn) => fn(currentSettings));
          }
        });
      }).catch(() => {});
    }, 1500);
  }
}

export const settingsService = {
  getSettings: (): SchoolSettings => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const rawLogo = localStorage.getItem(STORAGE_KEY_LOGO);
        if (raw !== cachedSettingsRaw || rawLogo !== cachedMasterLogoRaw) {
          currentSettings = getInitialSettings();
          cachedSettingsRaw = raw;
          cachedMasterLogoRaw = rawLogo;
        }
      } catch {
        currentSettings = getInitialSettings();
      }
    }
    return currentSettings;
  },
  updateSettings: (
    newSettings: Partial<SchoolSettings>,
    options?: { skipCloudSync?: boolean },
  ) => {
    const padChanged =
      newSettings.uploadedPadTemplateUrl !== undefined &&
      newSettings.uploadedPadTemplateUrl !== currentSettings.uploadedPadTemplateUrl;
    const nextSettings: SchoolSettings = {
      ...currentSettings,
      ...newSettings,
      ...(padChanged
        ? {
            uploadedPadUpdatedAt:
              newSettings.uploadedPadUpdatedAt ?? Date.now(),
          }
        : {}),
      padMargins: {
        ...DEFAULT_PAD_MARGINS,
        ...(currentSettings.padMargins || {}),
        ...(newSettings.padMargins || {})
      },
      padHeaderFields: {
        ...DEFAULT_PAD_HEADER_FIELDS,
        ...(currentSettings.padHeaderFields || {}),
        ...(newSettings.padHeaderFields || {})
      }
    };
    const prevClean = JSON.stringify({ ...(currentSettings as any), updatedAt: undefined });
    const nextClean = JSON.stringify({ ...(nextSettings as any), updatedAt: undefined });
    if (prevClean === nextClean) {
      return;
    }
    currentSettings = nextSettings;
    if (typeof window !== 'undefined') {
      persistSettingsSafely(currentSettings);

      // ⚡ Auto-sync with Google Cloud Firestore (skipped when hydrating from cloud to prevent echo loops)
      if (!options?.skipCloudSync) {
        try {
          import('./firebaseSyncService').then(({ firebaseSyncService }) => {
            firebaseSyncService.syncSettingsToCloud(currentSettings).catch(() => {});
          }).catch(() => {});
        } catch (e) {}
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
