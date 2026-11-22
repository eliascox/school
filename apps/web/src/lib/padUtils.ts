import { toBanglaDigits, toEnglishDigits } from '@/lib/certificateEngine';

export interface ParsedPadDateBoxes {
  day: string;
  month: string;
  year: string;
}

const MONTH_NAME_MAP: Record<string, number> = {
  // Bengali months
  'জানুয়ারি': 1,
  'জানুয়ারি': 1,
  'ফেব্রুয়ারি': 2,
  'ফেব্রুয়ারি': 2,
  'মার্চ': 3,
  'এপ্রিল': 4,
  'মে': 5,
  'জুন': 6,
  'জুলাই': 7,
  'আগস্ট': 8,
  'সেপ্টেম্বর': 9,
  'অক্টোবর': 10,
  'নভেম্বর': 11,
  'ডিসেম্বর': 12,
  // English months (full & short)
  january: 1,
  jan: 1,
  february: 2,
  feb: 2,
  march: 3,
  mar: 3,
  april: 4,
  apr: 4,
  may: 5,
  june: 6,
  jun: 6,
  july: 7,
  jul: 7,
  august: 8,
  aug: 8,
  september: 9,
  sep: 9,
  sept: 9,
  october: 10,
  oct: 10,
  november: 11,
  nov: 11,
  december: 12,
  dec: 12,
};

/**
 * Remove leading "স্মারক নং:", "সূত্র:", or "Ref No:" prefixes when placing the
 * reference code right next to a pre-printed "সূত্র:" label on an official pad.
 */
export function cleanRefNoForPad(rawRef?: string): string {
  if (!rawRef) return '';
  return rawRef
    .replace(/^(?:স্মারক\s*নং|সূত্র|নং|ref\.?\s*no\.?|sl\.?\s*no\.?|memo\s*no\.?)\s*[:ঃ._-]*\s*/i, '')
    .trim();
}

/**
 * Parse ISO dates, DD/MM/YYYY, or localized strings ("১১ নভেম্বর ২০২৬ খ্রি.", "19 Nov 2026")
 * into discrete 2-digit day, 2-digit month, and 4-digit year values for boxed date headers.
 */
export function parsePadDateBoxes(
  rawDate?: string,
  lang: 'bn' | 'en' = 'bn',
): ParsedPadDateBoxes {
  const formatOut = (d: number, m: number, y: number): ParsedPadDateBoxes => {
    const dd = String(Math.max(1, Math.min(31, d))).padStart(2, '0');
    const mm = String(Math.max(1, Math.min(12, m))).padStart(2, '0');
    const yyyy = String(y).padStart(4, '0');
    return lang === 'en'
      ? { day: dd, month: mm, year: yyyy }
      : {
          day: toBanglaDigits(dd),
          month: toBanglaDigits(mm),
          year: toBanglaDigits(yyyy),
        };
  };

  if (rawDate && rawDate.trim()) {
    const cleaned = toEnglishDigits(rawDate)
      .replace(/খ্রি\.?|xri\.?/gi, '')
      .replace(/,/g, ' ')
      .trim();

    // 1. ISO YYYY-MM-DD or YYYY/MM/DD
    const isoMatch = cleaned.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (isoMatch) {
      return formatOut(Number(isoMatch[3]), Number(isoMatch[2]), Number(isoMatch[1]));
    }

    // 2. Numeric DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
    const dmyMatch = cleaned.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
    if (dmyMatch) {
      const yNum = Number(dmyMatch[3]);
      const fullYear = yNum < 100 ? 2000 + yNum : yNum;
      return formatOut(Number(dmyMatch[1]), Number(dmyMatch[2]), fullYear);
    }

    // 3. Localized strings like "11 নভেম্বর 2026" or "19 Nov 2026"
    const tokens = cleaned.split(/\s+/).filter(Boolean);
    let foundMonth: number | undefined;
    let foundDay: number | undefined;
    let foundYear: number | undefined;

    for (const token of tokens) {
      const low = token.toLowerCase();
      if (MONTH_NAME_MAP[token]) {
        foundMonth = MONTH_NAME_MAP[token];
        continue;
      }
      if (MONTH_NAME_MAP[low]) {
        foundMonth = MONTH_NAME_MAP[low];
        continue;
      }
      const digitsOnly = token.replace(/\D/g, '');
      if (!digitsOnly) continue;
      const num = Number(digitsOnly);
      if (digitsOnly.length === 4 && num >= 1900 && num <= 2199) {
        foundYear = num;
      } else if (foundDay === undefined && num >= 1 && num <= 31) {
        foundDay = num;
      }
    }

    if (foundDay && foundMonth && foundYear) {
      return formatOut(foundDay, foundMonth, foundYear);
    }

    const nativeParsed = new Date(cleaned);
    if (!Number.isNaN(nativeParsed.getTime())) {
      return formatOut(
        nativeParsed.getDate(),
        nativeParsed.getMonth() + 1,
        nativeParsed.getFullYear(),
      );
    }
  }

  const now = new Date();
  return formatOut(now.getDate(), now.getMonth() + 1, now.getFullYear());
}

const ORDINAL_MONTHS_EN = [
  '',
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function getOrdinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) return 'th';
  const mod = day % 10;
  if (mod === 1) return 'st';
  if (mod === 2) return 'nd';
  if (mod === 3) return 'rd';
  return 'th';
}

/**
 * Format DOB cleanly in classic testimonial ordinal style: e.g. "25th September 2009".
 */
export function formatDobOrdinalEn(dobStr?: string): string {
  if (!dobStr || !dobStr.trim()) return '';
  const cleaned = toEnglishDigits(dobStr).trim();
  let day = 0;
  let month = 0;
  let year = 0;

  const iso = cleaned.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (iso) {
    year = Number(iso[1]);
    month = Number(iso[2]);
    day = Number(iso[3]);
  } else {
    const dmy = cleaned.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
    if (dmy) {
      day = Number(dmy[1]);
      month = Number(dmy[2]);
      year = Number(dmy[3]);
    }
  }

  if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900) {
    return `${day}${getOrdinalSuffix(day)} ${ORDINAL_MONTHS_EN[month]} ${year}`;
  }
  return cleaned;
}
