import { ReceiptAnalysisRequest, ReceiptAnalysisResponse } from '../types/ReceiptAnalysis';
import { ReceiptSubmissionRequest, ReceiptSubmissionResponse } from '../types/ReceiptSubmission';
import { ReceiptHistoryRequest, ReceiptHistoryResponse } from '../types/ReceiptHistory';
import { SelectsValue } from '../lib/stores/types/SelectsValue';

/**
 * Base URL for all receipt-related HTTP calls.
 *
 * @remarks
 * Configurable via `VITE_API_BASE_URL` (Vite env var); defaults to `/api` so
 * the app works behind a same-origin Azure Static Web Apps `api` route by
 * default.
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

/**
 * Low-level authenticated fetch wrapper. Throws on non-2xx responses so the
 * services layer can normalize failures into a consistent shape.
 */
async function request<TResponse>(path: string, token: string, init?: RequestInit): Promise<TResponse> {
  console.log(API_BASE_URL)
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Request failed with status ${res.status}`);
  }

  return (await res.json()) as TResponse;
}

/** POST the captured receipt images for AI analysis. */
export function analyzeReceiptApi(body: ReceiptAnalysisRequest, token: string): Promise<ReceiptAnalysisResponse> {
  return request<ReceiptAnalysisResponse>('/analyzeReceipt', token, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/** POST the finalized receipt submission for processing. */
export function saveReceiptApi(body: ReceiptSubmissionRequest, token: string): Promise<ReceiptSubmissionResponse> {
  return request<ReceiptSubmissionResponse>('/saveReceipt', token, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/** GET the list of available projects/subdivisions and phases. */
export function getProjectsApi(token: string): Promise<SelectsValue> {
  return request<SelectsValue>('/getProjects', token, { method: 'GET' });
}

/** GET the receipt submission history for a given user. */
export function getReceiptApi(body: ReceiptHistoryRequest, token: string): Promise<ReceiptHistoryResponse> {
  return request<ReceiptHistoryResponse>(`/getReceipts?user=${encodeURIComponent(body.user)}`, token, {
    method: 'GET',
  });
}

/** GET the receipt submission history for a given user. */
export function getReceiptsApi(token: string): Promise<ReceiptHistoryResponse> {
  return request<ReceiptHistoryResponse>('/getReceipts', token, {
    method: 'GET',
  });
}