/**
 * @file Small display formatting helpers shared across receipt UI.
 */

/**
 * Formats a number as USD currency.
 * @param value - numeric amount.
 * @returns A `$#,###.##` string.
 * @example currency(214.5) // "$214.50"
 */
export const currency = (value: number): string =>
  value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

/**
 * Renders a short, human-friendly relative age from an ISO timestamp.
 * @param iso - ISO date string.
 * @returns e.g. `"2d"`, `"5h"`, `"just now"`.
 */
export const ageFromNow = (iso: string): string => {
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / 86_400_000);
  if (days >= 1) return `${days}d`;
  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 1) return `${hours}h`;
  return 'just now';
};