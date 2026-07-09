/**
 * @fileoverview Low-level HTTP calls for Azure Blob Storage upload
 * authorization (SAS token retrieval).
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

/** Response shape from the `getUploadSas` Azure Function. */
export interface UploadSasResponse {
  /** Full container URL with an appended SAS query string (create+write permissions). */
  containerUrl: string;
}

/** GET a short-lived SAS-secured container URL for uploading receipt images. */
export async function getUploadSasApi(token: string): Promise<UploadSasResponse> {
  const res = await fetch(`${API_BASE_URL}/getUploadSas`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Request failed with status ${res.status}`);
  }

  return (await res.json()) as UploadSasResponse;
}