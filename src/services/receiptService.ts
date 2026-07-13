import { ReceiptAnalysisRequest, ReceiptAnalysisResponse } from '../types/ReceiptAnalysis';
import { ReceiptSubmissionRequest, ReceiptSubmissionResponse } from '../types/ReceiptSubmission';
import { ReceiptHistoryRequest, ReceiptHistoryResponse } from '../types/ReceiptHistory';
import { SelectsValue } from '../lib/stores/types/SelectsValue';
import { ApiResponseError } from '../lib/auth/types/ApiResonse';
import { analyzeReceiptApi, getProjectsApi, getReceiptsApi, saveReceiptApi } from '../api/receiptApi';

/**
 * Uniform result wrapper for service-layer calls. Unlike the raw `api` layer
 * (which throws on failure), services normalize failures into an `error`
 * object so components can branch on a single shape without try/catch.
 */
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

/** Submits captured images for AI analysis. */
export function analyzeReceipt(
  body: ReceiptAnalysisRequest,
  token: string
): Promise<ServiceResult<ReceiptAnalysisResponse>> {
  return safeCall(() => analyzeReceiptApi(body, token));
}

/** Submits a finalized receipt for processing. */
export function saveReceipt(
  body: ReceiptSubmissionRequest,
  token: string
): Promise<ServiceResult<ReceiptSubmissionResponse>> {
  return safeCall(() => saveReceiptApi(body, token));
}

/** Retrieves the list of available projects/subdivisions and phases. */
export function getProjects(token: string): Promise<ServiceResult<SelectsValue>> {
  return safeCall(() => getProjectsApi(token));
}

/** Retrieves a user's receipt submission history. */
export function getReceipts(
  body: ReceiptHistoryRequest | null,
  token: string
): Promise<ServiceResult<ReceiptHistoryResponse>> {
  return safeCall(() => getReceiptsApi(body, token));
}