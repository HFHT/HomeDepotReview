import dayjs from 'dayjs';

/** Returns today's date as an ISO `YYYY-MM-DD` string. */
export function todayISO(): string {
  return dayjs().format('YYYY-MM-DD');
}

/**
 * Returns the number of whole days between the given date string and today,
 * or `null` when the date is missing/unparseable. Used for the "Age" column
 * on `ReceiptListPage`.
 */
export function daysSince(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const d = dayjs(dateStr);
  if (!d.isValid()) return null;
  return dayjs().startOf('day').diff(d.startOf('day'), 'day');
}