/**
 * @file Staging copy of the receipt domain types produced by the mobile
 * Claude-extraction pipeline and stored in MongoDB.
 *
 * @remarks
 * These mirror the documents written by the mobile app. They live here so the
 * web app can compile today; please promote them into `src/api` and have the
 * web app import from there once reviewed.
 */

/** A single parsed line on a Home Depot receipt. */
export type LineItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  sku_or_upc: string | null;
  category: string | null;
};

/** One recorded change to a field across the Field → Finance layers.
 * There may be multiple entries for a given field if it was edited multiple times; 
 * these represent the history of changes. 
*/
export type AuditChange = {
  fieldKey: string;
  lineItemIndex: number | undefined;
  lineItemDescription: string | undefined;
  originalValue: string | null;
  changedValue: string | null;
  layer: 'Field' | 'Finance';
  changedAt: string;                // ISO timestamp
  changedBy: string;
};

/** Manual Sage 100 Cloud entry metadata captured by finance. */
export type SageEntryMetadata = {
  sageReference: string | null;
  postingDate: string | null;
  notes: string | null;
};

/** Review lifecycle status for a receipt. */
export type ReviewStatus =
  | 'pending'
  | 'in_review'
  | 'entered_in_sage'
  | 'on_hold'
  | 'rejected';

/** A persisted receipt document. */
export type Receipt = {
  _id: string;
  created: { date: string; by: string };
  receiptDate: string;
  receiptNumber: string;
  receiptPO: string | null;
  receiptTotal: number;
  receiptSubtotal: number;
  receiptDiscount: number;
  receiptTax: number;
  receiptBalanceDue: number;
  vendor: string;
  storeNumber: string;
  paymentMethod?: string;
  images: string[];
  lineItems: LineItem[];
  auditTrail: AuditChange[];
  reviewStatus: ReviewStatus;
  reviewHistory: {
    status: ReviewStatus;
    changedAt: string;
    changedBy: string;
    reason: string | null;
  }[];
  sageEntryMetadata: SageEntryMetadata;
};