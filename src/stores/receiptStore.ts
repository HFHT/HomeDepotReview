
// /**
//  * @file Zustand store backing the receipt review (detail) screen. Holds the
//  * editable draft plus a pristine snapshot, exposes finance-edit actions that
//  * maintain the audit trail, and tracks per-section form validity.
//  *
//  * @remarks
//  * Edit actions are invoked once per *completed* field change (blur / debounce /
//  * route-unload), never per keystroke. The owning forms (Mantine `useForm`)
//  * buffer keystrokes and flush here.
//  */
// import { create } from 'zustand';
// import type { AuditChange, LineItem, Receipt, ReviewStatus, SageEntryMetadata } from '../services/receiptTypes';
// import { applyFinanceEdit } from '../services/applyFInanceEdit';

// /** Editable header field keys (everything except created.*). */
// export type HeaderFieldKey =
//   | 'receiptDate'
//   | 'receiptNumber'
//   | 'vendor'
//   | 'storeNumber'
//   | 'paymentMethod'
//   | 'receiptTax'
//   | 'receiptTotal'
//   | 'receiptSubtotal'
//   | 'receiptDiscount'
//   | 'receiptBalanceDue'
//   | 'receiptPO';

// /** Editable line-item field keys. */
// export type LineFieldKey = keyof Pick<
//   LineItem,
//   'description' | 'quantity' | 'unitPrice' | 'total' | 'sku_or_upc' | 'category'
// >;

// /** Form sections that report validity into the store. */
// export type ValiditySection = 'details' | 'lineItems' | 'sage';

// /** Per-section validity flags consumed by the action bar. */
// export interface SectionValidity {
//   details: boolean;
//   lineItems: boolean;
//   sage: boolean;
// }

// /** Receipt review session state. */
// interface ReceiptState {
//   /** Receipt currently open for review, or null. */
//   draft: Receipt | null;
//   /** Pristine copy of the receipt as loaded (AI baseline). Never mutated. */
//   original: Receipt | null;
//   /** True when unsaved edits exist. */
//   isDirty: boolean;
//   /** Cross-component form validity. Soft fails (e.g. subtotal mismatch) excluded. */
//   validity: SectionValidity;

//   /** @inheritdoc */
//   loadReceipt: (receipt: Receipt) => void;
//   /** @inheritdoc */
//   editHeaderField: (fieldKey: HeaderFieldKey, value: string | number, by: string) => void;
//   /** @inheritdoc */
//   editLineItemField: (
//     lineItemKey: string,
//     fieldKey: LineFieldKey,
//     value: string | number | null,
//     by: string,
//   ) => void;
//   /** @inheritdoc */
//   addLineItem: (line: LineItem) => void;
//   /** @inheritdoc */
//   removeLineItem: (lineItemKey: string, by: string) => void;
//   /** @inheritdoc */
//   setStatus: (status: ReviewStatus) => void;
//   /** @inheritdoc */
//   setSage: (metadata: SageEntryMetadata) => void;
//   /** @inheritdoc */
//   setSectionValidity: (section: ValiditySection, valid: boolean) => void;
//   /** @inheritdoc */
//   reset: () => void;
// }

// /** Factory for a fresh, locally-created line item. */
// export const createLineItem = (): LineItem => ({
//   lineItemKey: crypto.randomUUID(),
//   description: '',
//   quantity: 1,
//   unitPrice: 0,
//   total: 0,
//   sku_or_upc: null,
//   category: null,
// });

// /** Normalizes a field value to the audit trail's `string | null` shape. */
// const toAuditValue = (value: string | number | null | undefined): string | null =>
//   value === null || value === undefined ? null : String(value);

// /** Optimistic default: assume valid until a form reports otherwise. */
// const ALL_VALID: SectionValidity = { details: true, lineItems: true, sage: true };

// /**
//  * Store for the receipt review screen.
//  * @example const draft = useReceiptStore((s) => s.draft);
//  */
// export const useReceiptStore = create<ReceiptState>((set) => ({
//   draft: null,
//   original: null,
//   isDirty: false,
//   validity: { ...ALL_VALID },

//   /** @inheritdoc Loads a receipt, snapshots the AI baseline, clears dirty + validity. */
//   loadReceipt: (receipt) =>
//     set({
//       draft: structuredClone(receipt),
//       original: structuredClone(receipt),
//       isDirty: false,
//       validity: { ...ALL_VALID },
//     }),

//   /** @inheritdoc Applies a completed finance edit to a header field + audit trail. */
//   editHeaderField: (fieldKey, value, by) =>
//     set((state) => {
//       if (!state.draft || !state.original) return {};
//       const draft = { ...state.draft, [fieldKey]: value } as Receipt;
//       draft.auditTrail = applyFinanceEdit(draft.auditTrail, {
//         fieldKey,
//         lineItemKey: undefined,
//         lineItemDescription: undefined,
//         originalValue: toAuditValue(state.original[fieldKey] as string | number | null | undefined),
//         changedValue: toAuditValue(value),
//         by,
//         now: new Date().toISOString(),
//       });
//       return { draft, isDirty: true };
//     }),

//   /** @inheritdoc Applies a completed finance edit to a line-item field + audit trail. */
//   editLineItemField: (lineItemKey, fieldKey, value, by) =>
//     set((state) => {
//       if (!state.draft || !state.original) return {};
//       const lineItems = state.draft.lineItems.map((li) =>
//         li.lineItemKey === lineItemKey ? { ...li, [fieldKey]: value } : li,
//       );
//       const draft = { ...state.draft, lineItems } as Receipt;
//       const baseLine = state.original.lineItems.find((li) => li.lineItemKey === lineItemKey);
//       const current = lineItems.find((li) => li.lineItemKey === lineItemKey);
//       draft.auditTrail = applyFinanceEdit(draft.auditTrail, {
//         fieldKey,
//         lineItemKey,
//         lineItemDescription: current?.description,
//         originalValue: toAuditValue(baseLine ? baseLine[fieldKey] : null),
//         changedValue: toAuditValue(value),
//         by,
//         now: new Date().toISOString(),
//       });
//       return { draft, isDirty: true };
//     }),

//   /** @inheritdoc Appends a (mobile- or web-created) line item. */
//   addLineItem: (line) =>
//     set((state) =>
//       state.draft
//         ? { draft: { ...state.draft, lineItems: [...state.draft.lineItems, line] }, isDirty: true }
//         : {},
//     ),

//   /** @inheritdoc Removes a line item by key and records a "line item removed" audit entry. */
//   removeLineItem: (lineItemKey, by) =>
//     set((state) => {
//       if (!state.draft) return {};
//       const removed = state.draft.lineItems.find((li) => li.lineItemKey === lineItemKey);
//       const lineItems = state.draft.lineItems.filter((li) => li.lineItemKey !== lineItemKey);
//       const draft = { ...state.draft, lineItems } as Receipt;
//       if (removed) {
//         const entry: AuditChange = {
//           fieldKey: 'lineItem',
//           lineItemKey,
//           lineItemDescription: removed.description,
//           originalValue: removed.description,
//           changedValue: 'line item removed',
//           layer: 'Finance',
//           changedAt: new Date().toISOString(),
//           changedBy: by,
//         };
//         draft.auditTrail = [...draft.auditTrail, entry];
//       }
//       return { draft, isDirty: true };
//     }),

//   /** @inheritdoc Sets the working review status. */
//   setStatus: (status) =>
//     set((state) => (state.draft ? { draft: { ...state.draft, reviewStatus: status }, isDirty: true } : {})),

//   /** @inheritdoc Sets Sage entry metadata (no audit trail kept for these fields). */
//   setSage: (metadata) =>
//     set((state) => (state.draft ? { draft: { ...state.draft, sageEntryMetadata: metadata }, isDirty: true } : {})),

//   /** @inheritdoc Reports a section's hard-validation state. */
//   setSectionValidity: (section, valid) =>
//     set((state) =>
//       state.validity[section] === valid ? {} : { validity: { ...state.validity, [section]: valid } },
//     ),

//   /** @inheritdoc Clears the session. */
//   reset: () => set({ draft: null, original: null, isDirty: false, validity: { ...ALL_VALID } }),
// }));