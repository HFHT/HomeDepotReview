/**
 * @fileoverview Helpers for deriving the blob storage file name used for
 * receipt images, based on the AI-extracted `receipt_number` (sanitized) or
 * a generated UUID fallback.
 */

/** Characters allowed in a sanitized receipt-number-derived file name segment. */
const VALID_SEGMENT_RE = /^[A-Za-z0-9._-]+$/;

/** Maximum length allowed for the base file name segment (before `-{order}.{ext}` is appended). */
const MAX_BASE_LENGTH = 80;

/**
 * Sanitizes a raw receipt number into a value safe to use as a file name
 * segment, or returns `null` if no safe/non-empty value can be derived.
 *
 * @remarks
 * - Whitespace is collapsed to underscores.
 * - Any character outside `[A-Za-z0-9._-]` is stripped.
 * - Reserved values (`.`, `..`, empty string) are rejected.
 */
export function sanitizeReceiptNumber(receiptNumber: string | null | undefined): string | null {
  if (!receiptNumber) return null;

  const trimmed = receiptNumber.trim();
  if (!trimmed) return null;

  const sanitized = trimmed
    .replace(/\s+/g, '_')
    .replace(/[^A-Za-z0-9._-]/g, '')
    .slice(0, MAX_BASE_LENGTH);

  if (!isValidFileNameSegment(sanitized)) return null;

  return sanitized;
}

function isValidFileNameSegment(name: string): boolean {
  if (!name) return false;
  if (name === '.' || name === '..') return false;
  return VALID_SEGMENT_RE.test(name);
}

/**
 * Derives the base file name (without the `-{order}.{ext}` suffix) used for
 * all images belonging to a single receipt submission.
 *
 * @returns the sanitized receipt number, or a `U`-prefixed UUID if the
 * receipt number is `null`/empty/not a valid file name segment.
 */
export function getBaseFileName(receiptNumber: string | null | undefined): string {
  const sanitized = sanitizeReceiptNumber(receiptNumber);
  if (sanitized) return sanitized;
  return `U${crypto.randomUUID()}`;
}

/** Maps a MIME media type to a file extension suitable for a blob name. */
const MEDIA_TYPE_EXT_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/gif': 'gif',
  'image/bmp': 'bmp',
  'image/tiff': 'tiff',
};

/** Derives a file extension (no leading dot) from an image MIME type. */
export function extFromMediaType(mediaType: string): string {
  const normalized = (mediaType || '').toLowerCase().split(';')[0].trim();
  return MEDIA_TYPE_EXT_MAP[normalized] ?? normalized.split('/')[1] ?? 'bin';
}

/** Builds the full blob file name for a given image order/media type. */
export function buildImageFileName(baseFileName: string, order: number, mediaType: string): string {
  return `${baseFileName}-${order}.${extFromMediaType(mediaType)}`;
}