import { create } from 'zustand';
import type { ReceiptSubmissionRequest } from '../../types/ReceiptSubmission';

/**
 * Holds the full set of receipt submissions loaded from `getReceipts`, plus a
 * `loading` flag surfaced to `ReceiptListPage` while the initial fetch (or a
 * post-save refresh) is in flight.
 *
 * Populated once at app startup via `App.tsx`, and refreshed wholesale after
 * every `saveReceipt` call using the response's `history` array — there is no
 * per-record update reducer since the server always returns the full list.
 *
 * Follows the same flat-slice pattern as `selectsStore.ts`.
 */
interface ReceiptState {
  receipts: ReceiptSubmissionRequest[];
  loading: boolean;
  setReceipts: (receipts: ReceiptSubmissionRequest[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useReceiptStore = create<ReceiptState>((set) => ({
  receipts: [],
  loading: false,
  setReceipts: (receipts) => set({ receipts }),
  setLoading: (loading) => set({ loading }),
}));