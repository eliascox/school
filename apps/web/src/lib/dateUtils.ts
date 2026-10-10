/**
 * Date utility functions for local-timezone calendar operations.
 *
 * Avoids the UTC-shift bug caused by `new Date().toISOString().split('T')[0]`,
 * which gives yesterday's date in Bangladesh (UTC+6) between 12:00 AM and 5:59 AM.
 */

export function localDateKey(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}
