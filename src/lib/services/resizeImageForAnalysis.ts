/**
 * Client-side image resizing to satisfy Claude vision's ideal image
 * constraints before an image is sent for analysis:
 *   - longest edge ≤ 1568px
 *   - total pixel count ≤ 1.15 megapixels
 *
 * EXIF orientation is corrected automatically via `createImageBitmap`'s
 * `imageOrientation: 'from-image'` option (supported in all modern
 * evergreen browsers), so the resulting canvas is always right-side-up
 * regardless of how the source file was rotated by the capturing device.
 *
 * HEIC/unsupported formats are out of scope — `createImageBitmap` will
 * reject for those, which is handled by the fallback path below.
 */

import { blobToBase64 } from '../auth/services/imageStorage';

const MAX_LONGEST_EDGE = 1568;
const MAX_MEGAPIXELS = 1.15;
const MAX_PIXELS = MAX_MEGAPIXELS * 1_000_000;
const JPEG_QUALITY = 0.92;

export interface ResizedImage {
  base64: string;
  mediaType: string;
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob returned null'));
      },
      type,
      quality
    );
  });
}

/**
 * Resizes (and orientation-corrects) an image so it fits within Claude's
 * ideal vision constraints. Resizing is skipped entirely if the image is
 * already within both the longest-edge and megapixel limits.
 *
 * PNG inputs are preserved as PNG when resized; every other format is
 * re-encoded as JPEG at 0.92 quality. The returned `mediaType` always
 * reflects the actual encoding of the returned `base64` payload.
 *
 * On any decode/resize failure (corrupt data, unsupported format, canvas
 * errors, etc.) this falls back to resolving with the original, unresized
 * base64 and original mediaType — it never rejects, so a bad image can't
 * block sibling images from being processed.
 */
export async function resizeImageForAnalysis(blob: Blob, mediaType: string): Promise<ResizedImage> {
  try {
    const bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' });

    try {
      const { width, height } = bitmap;
      const longestEdge = Math.max(width, height);
      const pixelCount = width * height;

      if (longestEdge <= MAX_LONGEST_EDGE && pixelCount <= MAX_PIXELS) {
        // Already within limits — send the original bytes unchanged.
        const base64 = await blobToBase64(blob);
        return { base64, mediaType };
      }

      const edgeScale = MAX_LONGEST_EDGE / longestEdge;
      const pixelScale = Math.sqrt(MAX_PIXELS / pixelCount);
      const scale = Math.min(edgeScale, pixelScale, 1);

      const targetWidth = Math.max(1, Math.round(width * scale));
      const targetHeight = Math.max(1, Math.round(height * scale));

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Unable to acquire 2D canvas context');

      ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);

      const isPng = mediaType === 'image/png';
      const outputType = isPng ? 'image/png' : 'image/jpeg';
      const outputBlob = isPng
        ? await canvasToBlob(canvas, outputType)
        : await canvasToBlob(canvas, outputType, JPEG_QUALITY);

      const base64 = await blobToBase64(outputBlob);
      return { base64, mediaType: outputType };
    } finally {
      bitmap.close();
    }
  } catch (err) {
    // Decoding/resizing failed — fall back to the original image so
    // analysis can still proceed with the unresized payload.
    console.warn('Image resize failed; falling back to original image.', err);
    const base64 = await blobToBase64(blob);
    return { base64, mediaType };
  }
}