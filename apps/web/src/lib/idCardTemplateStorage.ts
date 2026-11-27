/**
 * Local-Only Custom ID Card Template Storage (IndexedDB + localStorage fallback) & JSON Import/Export.
 *
 * ZERO SERVER / CLOUD STORAGE GUARANTEE:
 * Custom templates and user-uploaded background artwork NEVER touch Firebase Storage or Firestore.
 * Images are compressed client-side to crisp 300-DPI CR80 bounds so local storage stays compact.
 */

import {
  BUILT_IN_ID_CARD_TEMPLATES,
  type IdCardBuiltInStyle,
  type IdCardHeaderStyle,
  type IdCardPhotoShape,
  type IdCardTemplateConfig,
} from './idCardTemplateTypes';

const IDB_NAME = 'sms_id_card_templates_db';
const IDB_VERSION = 1;
const IDB_STORE = 'templates';
const LS_FALLBACK_KEY = 'sms_id_card_custom_templates_v1';
const LS_ACTIVE_TPL_KEY = 'sms_id_card_active_template_id_v1';

const VALID_STYLES: IdCardBuiltInStyle[] = [
  'modern_wave',
  'smart_geometric',
  'classic_royal',
  'minimal_clean',
  'midnight_prestige',
  'custom_artwork',
];
const VALID_SHAPES: IdCardPhotoShape[] = ['rounded', 'circle', 'square'];
const VALID_HEADERS: IdCardHeaderStyle[] = ['wave', 'angled', 'classic', 'minimal'];

function isSafeColor(val: unknown, fallback: string): string {
  const s = String(val || '').trim();
  if (/^#[0-9a-fA-F]{3,8}$/.test(s)) return s;
  return fallback;
}

function isSafeImageDataUrl(val: unknown): string | undefined {
  if (typeof val !== 'string') return undefined;
  const trimmed = val.trim();
  if (!trimmed) return undefined;
  if (/^data:image\/(png|jpeg|jpg|webp|svg\+xml);base64,/i.test(trimmed)) {
    // Reject absurdly large payloads (> 3.5 MB) to keep local storage healthy
    if (trimmed.length > 3_500_000) return undefined;
    return trimmed;
  }
  return undefined;
}

export function sanitizeTemplateConfig(raw: Partial<IdCardTemplateConfig>): IdCardTemplateConfig {
  const fallback = BUILT_IN_ID_CARD_TEMPLATES[0];
  const baseStyle = VALID_STYLES.includes(raw.baseStyle as IdCardBuiltInStyle)
    ? (raw.baseStyle as IdCardBuiltInStyle)
    : fallback.baseStyle;
  const photoShape = VALID_SHAPES.includes(raw.photoShape as IdCardPhotoShape)
    ? (raw.photoShape as IdCardPhotoShape)
    : fallback.photoShape;
  const headerStyle = VALID_HEADERS.includes(raw.headerStyle as IdCardHeaderStyle)
    ? (raw.headerStyle as IdCardHeaderStyle)
    : fallback.headerStyle;

  const opacityRaw = Number(raw.artworkOverlayOpacity);
  const artworkOverlayOpacity = Number.isFinite(opacityRaw)
    ? Math.max(0, Math.min(0.85, opacityRaw))
    : 0.14;

  return {
    id:
      typeof raw.id === 'string' && raw.id.trim().length > 0
        ? raw.id.trim().slice(0, 80)
        : `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name:
      typeof raw.name === 'string' && raw.name.trim().length > 0
        ? raw.name.trim().slice(0, 80)
        : 'কাস্টম আইডি টেম্পলেট',
    description:
      typeof raw.description === 'string' ? raw.description.trim().slice(0, 180) : undefined,
    isBuiltIn: false,
    baseStyle,
    primaryColor: isSafeColor(raw.primaryColor, fallback.primaryColor),
    secondaryColor: isSafeColor(raw.secondaryColor, fallback.secondaryColor),
    accentColor: isSafeColor(raw.accentColor, fallback.accentColor),
    surfaceBg: isSafeColor(raw.surfaceBg, fallback.surfaceBg),
    textColor: isSafeColor(raw.textColor, fallback.textColor),
    photoShape,
    headerStyle,
    showWatermark: raw.showWatermark !== undefined ? Boolean(raw.showWatermark) : true,
    showQrCode: raw.showQrCode !== undefined ? Boolean(raw.showQrCode) : true,
    showBloodGroup: raw.showBloodGroup !== undefined ? Boolean(raw.showBloodGroup) : true,
    showGuardian: raw.showGuardian !== undefined ? Boolean(raw.showGuardian) : true,
    showEmergencyPhone: raw.showEmergencyPhone !== undefined ? Boolean(raw.showEmergencyPhone) : true,
    showDob: raw.showDob !== undefined ? Boolean(raw.showDob) : false,
    showAddress: raw.showAddress !== undefined ? Boolean(raw.showAddress) : true,
    showValidity: raw.showValidity !== undefined ? Boolean(raw.showValidity) : true,
    validityTextBn:
      typeof raw.validityTextBn === 'string' && raw.validityTextBn.trim()
        ? raw.validityTextBn.trim().slice(0, 60)
        : fallback.validityTextBn,
    validityTextEn:
      typeof raw.validityTextEn === 'string' && raw.validityTextEn.trim()
        ? raw.validityTextEn.trim().slice(0, 60)
        : fallback.validityTextEn,
    backNoticeBn:
      typeof raw.backNoticeBn === 'string' && raw.backNoticeBn.trim()
        ? raw.backNoticeBn.trim().slice(0, 260)
        : fallback.backNoticeBn,
    backNoticeEn:
      typeof raw.backNoticeEn === 'string' && raw.backNoticeEn.trim()
        ? raw.backNoticeEn.trim().slice(0, 260)
        : fallback.backNoticeEn,
    customFrontBgDataUrl: isSafeImageDataUrl(raw.customFrontBgDataUrl),
    customBackBgDataUrl: isSafeImageDataUrl(raw.customBackBgDataUrl),
    artworkOverlayOpacity,
    principalSignatureDataUrl: isSafeImageDataUrl(raw.principalSignatureDataUrl),
    updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : Date.now(),
  };
}

function openTemplatesDb(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const req = window.indexedDB.open(IDB_NAME, IDB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

function readLsFallback(): IdCardTemplateConfig[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(LS_FALLBACK_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => sanitizeTemplateConfig(item));
  } catch {
    return [];
  }
}

function writeLsFallback(list: IdCardTemplateConfig[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LS_FALLBACK_KEY, JSON.stringify(list));
  } catch {
    // Quota exceeded — IndexedDB remains primary storage
  }
}

export async function listCustomTemplates(): Promise<IdCardTemplateConfig[]> {
  const db = await openTemplatesDb();
  if (!db) return readLsFallback();
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.getAll();
      req.onsuccess = () => {
        const rows = Array.isArray(req.result) ? req.result : [];
        db.close();
        const sanitized = rows
          .map((item) => sanitizeTemplateConfig(item))
          .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        resolve(sanitized);
      };
      req.onerror = () => {
        db.close();
        resolve(readLsFallback());
      };
    } catch {
      db.close();
      resolve(readLsFallback());
    }
  });
}

export async function saveCustomTemplate(
  template: Partial<IdCardTemplateConfig>,
): Promise<IdCardTemplateConfig> {
  const clean = sanitizeTemplateConfig({ ...template, isBuiltIn: false, updatedAt: Date.now() });
  const db = await openTemplatesDb();
  if (!db) {
    const existing = readLsFallback().filter((t) => t.id !== clean.id);
    writeLsFallback([clean, ...existing]);
    return clean;
  }
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(clean);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        const existing = readLsFallback().filter((t) => t.id !== clean.id);
        writeLsFallback([clean, ...existing]);
        resolve();
      };
    } catch {
      db.close();
      resolve();
    }
  });
  return clean;
}

export async function deleteCustomTemplate(id: string): Promise<void> {
  const db = await openTemplatesDb();
  if (!db) {
    writeLsFallback(readLsFallback().filter((t) => t.id !== id));
    return;
  }
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).delete(id);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        resolve();
      };
    } catch {
      db.close();
      resolve();
    }
  });
}

export async function clearAllCustomTemplates(): Promise<void> {
  const db = await openTemplatesDb();
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(LS_FALLBACK_KEY);
  }
  if (!db) return;
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).clear();
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        resolve();
      };
    } catch {
      db.close();
      resolve();
    }
  });
}

export function estimateTemplatesByteSize(templates: IdCardTemplateConfig[]): number {
  try {
    return new TextEncoder().encode(JSON.stringify(templates)).length;
  } catch {
    return JSON.stringify(templates).length;
  }
}

export function getSavedActiveTemplateId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(LS_ACTIVE_TPL_KEY);
  } catch {
    return null;
  }
}

export function setSavedActiveTemplateId(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LS_ACTIVE_TPL_KEY, id);
  } catch {
    // ignore
  }
}

export function serializeTemplateToJson(tpl: IdCardTemplateConfig): string {
  const payload = {
    schema: 'schoolpro.idcard.template.v1',
    exportedAt: new Date().toISOString(),
    template: sanitizeTemplateConfig(tpl),
  };
  return JSON.stringify(payload, null, 2);
}

export function parseAndValidateTemplateJson(rawJson: string): IdCardTemplateConfig {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    throw new Error('অবৈধ JSON ফাইল — সঠিক টেম্পলেট JSON নির্বাচন করুন।');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('টেম্পলেট ডাটা পাওয়া যায়নি।');
  }

  const record = parsed as Record<string, unknown>;
  const inner =
    record.template && typeof record.template === 'object'
      ? (record.template as Partial<IdCardTemplateConfig>)
      : (record as Partial<IdCardTemplateConfig>);

  if (!inner.name && !inner.primaryColor && !inner.baseStyle) {
    throw new Error('এই JSON ফাইলে বৈধ আইডি কার্ড টেম্পলেট তথ্য নেই।');
  }

  // Always assign a fresh local ID on import so existing templates are never accidentally overwritten
  return sanitizeTemplateConfig({
    ...inner,
    id: `custom_imp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    isBuiltIn: false,
    updatedAt: Date.now(),
  });
}

/**
 * Compresses an uploaded template background or signature image strictly client-side
 * so high-resolution print quality (300 DPI CR80) is preserved while keeping local storage tiny.
 */
export async function compressTemplateImageFile(
  file: File,
  options: { maxWidth?: number; maxHeight?: number; quality?: number; preserveAlpha?: boolean } = {},
): Promise<{ dataUrl: string; byteSize: number; width: number; height: number }> {
  if (file.size > 15 * 1024 * 1024) {
    throw new Error('ছবির সাইজ ১৫ MB-এর কম হতে হবে।');
  }
  const maxWidth = options.maxWidth ?? 1050;
  const maxHeight = options.maxHeight ?? 1050;
  const quality = options.quality ?? 0.88;
  const preserveAlpha = Boolean(options.preserveAlpha);

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('ছবিটি লোড করা যায়নি। PNG, JPG বা WebP ফাইল ব্যবহার করুন।'));
      el.src = objectUrl;
    });

    const scale = Math.min(1, maxWidth / Math.max(1, img.naturalWidth), maxHeight / Math.max(1, img.naturalHeight));
    const width = Math.max(1, Math.round(img.naturalWidth * scale));
    const height = Math.max(1, Math.round(img.naturalHeight * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('ক্যানভাস রেন্ডারার পাওয়া যায়নি।');

    if (!preserveAlpha) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);

    const mime = preserveAlpha ? 'image/png' : 'image/webp';
    let dataUrl = canvas.toDataURL(mime, quality);
    // Fallback to JPEG if browser does not support WebP encoding
    if (!preserveAlpha && !dataUrl.startsWith('data:image/webp')) {
      dataUrl = canvas.toDataURL('image/jpeg', quality);
    }

    // Immediately release offscreen canvas pixels
    canvas.width = 0;
    canvas.height = 0;

    return {
      dataUrl,
      byteSize: Math.round((dataUrl.length * 3) / 4),
      width,
      height,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function formatBytesReadable(bytes: number): string {
  if (bytes <= 0) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
