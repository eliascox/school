import { normalizeRollDigits, PortalLang } from '@/lib/resultPortalUtils';

/**
 * Extracts a clean certificate/receipt verification code from either:
 * - A raw code (e.g. "CERT-2026-10293", "REC-2026-0041")
 * - Bangla-digit input (e.g. "CERT-২০২৬-১০২৯৩")
 * - A full pasted QR verification URL (e.g. "https://example.com/verify-certificate?id=CERT-2026-10293")
 */
export function extractVerificationCode(rawInput: string): string {
  const trimmed = String(rawInput || '').trim();
  if (!trimmed) return '';

  if (/^https?:\/\//i.test(trimmed) || trimmed.includes('?')) {
    try {
      const urlObj = new URL(
        /^https?:\/\//i.test(trimmed) ? trimmed : `https://verify.local/${trimmed.replace(/^\/+/, '')}`
      );
      const extracted =
        urlObj.searchParams.get('id') ||
        urlObj.searchParams.get('ref') ||
        urlObj.searchParams.get('cert') ||
        urlObj.searchParams.get('code') ||
        '';
      if (extracted.trim()) {
        return normalizeRollDigits(extracted.trim());
      }
    } catch {
      // Fall through to raw normalization
    }
  }

  return normalizeRollDigits(trimmed);
}

export function isReceiptCode(code: string, typeParam?: string | null): boolean {
  if (typeParam === 'receipt') return true;
  const clean = code.trim();
  return /^REC-/i.test(clean) || /^(BKS|NGD|SSL|TRX)-/i.test(clean);
}

const CERT_TYPE_LABELS: Record<string, { bn: string; en: string }> = {
  ssc_testimonial: {
    bn: 'এসএসসি প্রশংসাপত্র (Testimonial)',
    en: 'SSC Testimonial',
  },
  character_certificate: {
    bn: 'চারিত্রিক সনদপত্র (Character Certificate)',
    en: 'Character Certificate',
  },
  transfer_certificate: {
    bn: 'ছাড়পত্র / টিসি (Transfer Certificate)',
    en: 'Transfer Certificate (TC)',
  },
  current_student: {
    bn: 'অধ্যয়নরত প্রত্যয়নপত্র (Bonafide / Study Certificate)',
    en: 'Bonafide / Current Student Certificate',
  },
  appreciation: {
    bn: 'কৃতিত্ব ও প্রশংসা সনদ (Appreciation Certificate)',
    en: 'Certificate of Appreciation',
  },
  merit_certificate: {
    bn: 'মেধা সনদপত্র (Certificate of Merit)',
    en: 'Certificate of Merit',
  },
  student_verification: {
    bn: 'শিক্ষার্থী যাচাইকরণ প্রত্যয়ন (Verification Certificate)',
    en: 'Student Verification Certificate',
  },
  participation: {
    bn: 'অংশগ্রহণ সনদ (Participation Certificate)',
    en: 'Certificate of Participation',
  },
  activity_certificate: {
    bn: 'সহশিক্ষা কার্যক্রম ও অভিজ্ঞতা সনদ',
    en: 'Co-Curricular & Activity Certificate',
  },
  custom_certificate: {
    bn: 'বিশেষ প্রাতিষ্ঠানিক প্রত্যয়নপত্র',
    en: 'Official Institutional Certificate',
  },
};

export function getCertificateTypeLabel(type: string, lang: PortalLang): string {
  const entry = CERT_TYPE_LABELS[type];
  if (entry) return lang === 'bn' ? entry.bn : entry.en;
  return type || (lang === 'bn' ? 'অফিশিয়াল সনদপত্র' : 'Official Certificate');
}

export function buildVerificationShareUrl(
  origin: string,
  code: string,
  isReceipt = false
): string {
  const cleanOrigin = origin.replace(/\/+$/, '');
  const qs = new URLSearchParams();
  qs.set('id', extractVerificationCode(code));
  if (isReceipt) qs.set('type', 'receipt');
  return `${cleanOrigin}/verify-certificate/?${qs.toString()}`;
}
