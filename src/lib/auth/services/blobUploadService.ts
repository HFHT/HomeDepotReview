import { getImageBlob } from './imageStorage';
import { getUploadSas } from './storageService';

/** A single image's planned upload target, computed before uploading. */
export interface ImageUploadPlan {
  /** IndexedDB record id / `StoredImage.id`. */
  id: string;
  /** `StoredImage.order` — used in the derived file name and for correlating to `imageIndex`. */
  order: number;
  /** MIME type of the source image, sent as the blob's `Content-Type`. */
  mediaType: string;
  /** Fully derived blob file name, e.g. `ABC123-0.jpg`. */
  fileName: string;
}

/** Outcome of attempting to upload a single image. */
export interface ImageUploadResult {
  id: string;
  fileName: string;
  success: boolean;
  error?: string;
}

/** Inserts a blob name into a SAS container URL, preserving the query string. */
function buildBlobUrl(containerUrl: string, fileName: string): string {
  const queryIndex = containerUrl.indexOf('?');
  const base = queryIndex === -1 ? containerUrl : containerUrl.slice(0, queryIndex);
  const query = queryIndex === -1 ? '' : containerUrl.slice(queryIndex); // includes leading '?'
  const trimmedBase = base.endsWith('/') ? base.slice(0, -1) : base;
  return `${trimmedBase}/${encodeURIComponent(fileName)}${query}`;
}

/**
 * Uploads all planned images to Azure Blob Storage via a SAS-secured
 * container URL (obtained from the `getUploadSas` endpoint), using a raw
 * `fetch` PUT per image (`x-ms-blob-type: BlockBlob`).
 *
 * @remarks
 * Never throws — individual (or total) failures are reflected in the
 * returned per-image results so the caller can notify the user without
 * needing try/catch.
 */
export async function uploadImagesToBlob(
  plans: ImageUploadPlan[],
  token: string
): Promise<ImageUploadResult[]> {
  if (plans.length === 0) return [];

  const { data, error } = await getUploadSas(token);

  if (error || !data) {
    const message = error?.message ?? 'Unable to obtain upload authorization.';
    return plans.map((p) => ({ id: p.id, fileName: p.fileName, success: false, error: message }));
  }

  const { containerUrl } = data;

  return Promise.all(
    plans.map(async (plan): Promise<ImageUploadResult> => {
      try {
        const blob = await getImageBlob(plan.id);
        if (!blob) {
          return { id: plan.id, fileName: plan.fileName, success: false, error: 'Image not found locally.' };
        }

        const uploadUrl = buildBlobUrl(containerUrl, plan.fileName);
        const res = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'x-ms-blob-type': 'BlockBlob',
            'Content-Type': plan.mediaType || 'application/octet-stream',
          },
          body: blob,
        });

        if (!res.ok) {
          const text = await res.text().catch(() => '');
          return {
            id: plan.id,
            fileName: plan.fileName,
            success: false,
            error: text || `Upload failed with status ${res.status}`,
          };
        }

        return { id: plan.id, fileName: plan.fileName, success: true };
      } catch (err) {
        return {
          id: plan.id,
          fileName: plan.fileName,
          success: false,
          error: err instanceof Error ? err.message : 'Unexpected upload error.',
        };
      }
    })
  );
}