import { describe, it, expect } from 'vitest';
import {
  extractVerificationCode,
  isReceiptCode,
  getCertificateTypeLabel,
  buildVerificationShareUrl,
} from '@/lib/certificateVerifyUtils';

describe('certificateVerifyUtils', () => {
  it('extracts and normalizes verification codes from raw input, Bangla digits, and full URLs', () => {
    expect(extractVerificationCode(' CERT-2026-10293 ')).toBe('CERT-2026-10293');
    expect(extractVerificationCode('CERT-২০২৬-১০২৯৩')).toBe('CERT-2026-10293');
    expect(
      extractVerificationCode('https://school.edu.bd/verify-certificate/?id=CERT-2026-55421&ref=ignore')
    ).toBe('CERT-2026-55421');
    expect(
      extractVerificationCode('/verify-certificate?code=REC-2026-0091')
    ).toBe('REC-2026-0091');
  });

  it('detects payment receipt and transaction prefixes accurately', () => {
    expect(isReceiptCode('REC-2026-0012')).toBe(true);
    expect(isReceiptCode('BKS-983122')).toBe(true);
    expect(isReceiptCode('NGD-112233')).toBe(true);
    expect(isReceiptCode('CERT-2026-10293', 'receipt')).toBe(true);
    expect(isReceiptCode('CERT-2026-10293')).toBe(false);
  });

  it('formats certificate types bilingually and builds clean share URLs', () => {
    expect(getCertificateTypeLabel('ssc_testimonial', 'en')).toBe('SSC Testimonial');
    expect(getCertificateTypeLabel('transfer_certificate', 'bn')).toContain('ছাড়পত্র');
    expect(buildVerificationShareUrl('https://school.edu.bd/', 'CERT-২০২৬-991')).toBe(
      'https://school.edu.bd/verify-certificate/?id=CERT-2026-991'
    );
    expect(buildVerificationShareUrl('https://school.edu.bd', 'REC-101', true)).toBe(
      'https://school.edu.bd/verify-certificate/?id=REC-101&type=receipt'
    );
  });
});
