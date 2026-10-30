/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🛡️ SECURITY UTILS: ANTI-HACKING, ANTI-MALWARE & INPUT SANITIZATION
 * ═══════════════════════════════════════════════════════════════════════════════
 * Provides enterprise-grade client-side defense mechanisms:
 * 1. File Upload Antivirus & Anti-Exploit Sanitization (SVG XSS & Polyglot protection)
 * 2. Canvas Re-encoding for all raster uploads (neutralizes steganography & embedded scripts)
 * 3. CSV Formula / DDE Injection Protection (for Excel/CSV imports & exports)
 * 4. LocalStorage Backup Integrity & Anti-Tampering Whitelisting
 * 5. Text & Name Sanitization against XSS
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/** Disallowed dangerous executable / script extensions */
export const DANGEROUS_EXTENSIONS = new Set([
  'exe', 'bat', 'cmd', 'sh', 'vbs', 'js', 'mjs', 'cjs', 'ts',
  'php', 'phtml', 'py', 'pl', 'cgi', 'asp', 'aspx', 'jsp',
  'dll', 'so', 'dylib', 'scr', 'jar', 'bin', 'com', 'msi',
  'html', 'htm', 'xhtml', 'svg', 'xml', 'hta', 'ps1', 'vbe'
]);

/** Allowed Image MIME Types (SVGs strictly prohibited due to embedded XSS risk) */
export const SAFE_IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/pjpeg',
  'image/png',
  'image/webp'
]);

export interface ImageValidationOptions {
  maxSizeMB?: number;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  preserveTransparency?: boolean;
}

export interface SecurityValidationResult {
  valid: boolean;
  sanitizedDataUrl?: string;
  error?: string;
}

/**
 * 1. Validate & Sanitize Uploaded Image
 * Enforces strict MIME checks, rejects SVG/executables, and re-encodes via Canvas
 * so that any polyglot malware payload or malicious script is completely stripped.
 */
export async function validateAndSanitizeImage(
  file: File,
  options: ImageValidationOptions = {}
): Promise<SecurityValidationResult> {
  const maxSizeMB = options.maxSizeMB || 2;
  const maxWidth = options.maxWidth || 800;
  const maxHeight = options.maxHeight || 800;
  const quality = options.quality || 0.85;

  // 1. File size enforcement
  if (file.size > maxSizeMB * 1024 * 1024) {
    return {
      valid: false,
      error: `নিরাপত্তা সতর্কতা: ফাইলের আকার সর্বোচ্চ ${maxSizeMB}MB হতে পারবে।`,
    };
  }

  // 2. Extension check
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (DANGEROUS_EXTENSIONS.has(ext)) {
    return {
      valid: false,
      error: `নিরাপত্তা সতর্কতা: ".${ext}" ধরনের ফাইল বা স্ক্রিপ্ট আপলোড করা সম্পূর্ণ নিষিদ্ধ।`,
    };
  }

  // 3. MIME type check
  if (!SAFE_IMAGE_MIMES.has(file.type.toLowerCase())) {
    return {
      valid: false,
      error: 'নিরাপত্তা সতর্কতা: শুধুমাত্র বৈধ ছবি (JPG, PNG, WebP) গ্রহণযোগ্য। SVG বা স্ক্রিপ্ট ফাইল গ্রহণযোগ্য নয়।',
    };
  }

  if (typeof window === 'undefined') {
    return { valid: false, error: 'ব্রাউজার এনভায়রনমেন্ট অনুপস্থিত।' };
  }

  // 4. Content Verification & Canvas Re-encoding
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (!src || !src.startsWith('data:image/')) {
        return resolve({
          valid: false,
          error: 'নিরাপত্তা সতর্কতা: ফাইলটি বৈধ ইমেজ ডাটা ধারণ করে না।',
        });
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width <= 0 || height <= 0) {
          return resolve({
            valid: false,
            error: 'নিরাপত্তা সতর্কতা: ইমেজের ডাইমেনশন ত্রুটিপূর্ণ বা ফাইলটি ক্ষতিগ্রস্ত।',
          });
        }

        // Maintain aspect ratio within safe limits
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.max(1, Math.round(width * ratio));
          height = Math.max(1, Math.round(height * ratio));
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          return resolve({
            valid: false,
            error: 'ইমেজ প্রসেসিং ইঞ্জিন শুরু করা যায়নি।',
          });
        }

        const format = options.preserveTransparency && file.type === 'image/png' ? 'image/png' : 'image/jpeg';

        if (format === 'image/jpeg') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        try {
          const pristineDataUrl = canvas.toDataURL(format, quality);
          resolve({
            valid: true,
            sanitizedDataUrl: pristineDataUrl,
          });
        } catch (err: any) {
          resolve({
            valid: false,
            error: 'ইমেজ স্যানিটাইজেশন ব্যর্থ: ' + (err.message || 'ত্রুটি'),
          });
        }
      };

      img.onerror = () => {
        resolve({
          valid: false,
          error: 'নিরাপত্তা সতর্কতা: ছবিটি পড়া সম্ভব হয়নি। এটি কোনো ভাইরাস, ম্যালওয়্যার বা ক্ষতিগ্রস্ত ফাইল হতে পারে।',
        });
      };

      img.src = src;
    };

    reader.onerror = () => {
      resolve({
        valid: false,
        error: 'ফাইল রিড করতে ব্যর্থ হয়েছে।',
      });
    };

    reader.readAsDataURL(file);
  });
}

/**
 * 2. Sanitize Text Input against XSS & HTML Tag Injection
 */
export function sanitizeInputText(input: unknown): string {
  if (input === null || input === undefined) return '';
  let str = String(input).trim();
  // Strip HTML tags
  str = str.replace(/<[^>]*>?/gm, '');
  // Strip control characters except newline and tab
  str = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  return str;
}

/**
 * 3. Sanitize CSV / Excel Values against Formula / DDE Injection
 * Excel and Sheets execute cells starting with '=', '+', '-', '@', '\t', '\r'
 * which can execute external commands or exfiltrate data.
 */
export function sanitizeCsvField(value: unknown): string {
  if (value === null || value === undefined) return '';
  let str = String(value).trim();
  // Strip HTML / script tags
  str = str.replace(/<[^>]*>?/gm, '');

  // Neutralize formula injection
  const dangerousPrefixes = ['=', '+', '-', '@', '\t', '\r'];
  if (dangerousPrefixes.some((p) => str.startsWith(p))) {
    // Escape by prefixing single quote
    str = `'${str}`;
  }
  return str;
}

/**
 * 4. Allowed LocalStorage Keys for Database Restores
 * Protects against Prototype Pollution and Unauthorized Key Overwriting.
 */
export const ALLOWED_RESTORE_KEY_PREFIXES = [
  'sms_',
  'students',
  'school_settings',
  'theme',
];

export const FORBIDDEN_RESTORE_KEYS = new Set([
  '__proto__',
  'constructor',
  'prototype',
  'sms_admin_password', // Admin password cannot be silently replaced via normal restore
  'sms_current_session', // Sessions cannot be injected via restore
]);

/**
 * Validates a key for database restore
 */
export function isSafeRestoreKey(key: string): boolean {
  if (!key || typeof key !== 'string') return false;
  if (FORBIDDEN_RESTORE_KEYS.has(key)) return false;
  return ALLOWED_RESTORE_KEY_PREFIXES.some((prefix) => key.startsWith(prefix));
}
