import { ReceiptAnalysisImageResult } from './ReceiptAnalysis';

/**
 * Metadata describing a single receipt image captured or uploaded by the user,
 * independent of the underlying binary data (which is persisted in IndexedDB
 * rather than in the Zustand/localStorage-backed `receiptStore`).
 */
export interface ReceiptImageMeta {
  /** Unique identifier; also used as the IndexedDB record key. */
  id: string;
  /** Original file name shown to the user. */
  fileName: string;
  /** MIME type of the image (e.g. "image/jpeg"). */
  mediaType: string;
  /** Zero-based display/drag order among the current set of images. */
  order: number;
  /** Per-image analysis result once a receipt analysis has been run, or `null`. */
  analysisResult?: ReceiptAnalysisImageResult | null;
}

/**
 * In-memory representation of a receipt image, including a browser object URL
 * used for `<Image />` preview rendering.
 *
 * @remarks
 * `previewUrl` is generated at runtime via `URL.createObjectURL` from the blob
 * stored in IndexedDB. It is never persisted and must be revoked when the
 * image is removed/replaced to avoid memory leaks.
 */
export interface StoredImage extends ReceiptImageMeta {
  previewUrl: string;
}