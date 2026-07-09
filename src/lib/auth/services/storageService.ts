import { getUploadSasApi, UploadSasResponse } from '../api/storageApi';
import { ApiResponseError } from '../types/ApiResonse';

/** Uniform result wrapper, consistent with `receiptService`'s `ServiceResult`. */
export interface ServiceResult<T> {
  data: T | null;
  error: ApiResponseError | null;
}

async function safeCall<T>(fn: () => Promise<T>): Promise<ServiceResult<T>> {
  try {
    const data = await fn();
    return { data, error: null };
  } catch (err) {
    return {
      data: null,
      error: {
        message: err instanceof Error ? err.message : 'An unknown error occurred.',
        code: null,
      },
    };
  }
}

/** Retrieves a short-lived SAS-secured container URL for uploading receipt images. */
export function getUploadSas(token: string): Promise<ServiceResult<UploadSasResponse>> {
  return safeCall(() => getUploadSasApi(token));
}