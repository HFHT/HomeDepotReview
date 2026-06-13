// /**
//  * @file Zustand store backing the receipt review (detail) screen. Holds the
//  * editable draft and exposes finance-edit actions that maintain the audit trail.
//  */
// import { create } from 'zustand';
// import type { LineItem, Receipt, ReviewStatus, SageEntryMetadata } from '../services/receiptTypes';
// import { applyFinanceEdit } from '../services/applyFInanceEdit';

// /** Editable header field keys (everything except created.*). */
// export type HeaderFieldKey = 'receiptDate' | 'receiptNumber' | 'vendor' | 'storeNumber' | 'paymentMethod' | 'receiptTax' | 'receiptTotal'| 'receiptSubtotal' | 'receiptDiscount' | 'receiptBalanceDue' | 'receiptPO';
// /** Editable line-item field keys. */
// export type LineFieldKey = keyof Pick<LineItem, 'description' | 'quantity' | 'unitPrice' | 'total' | 'sku_or_upc' | 'category'>;

// /** Receipt review session state. */
// interface ReceiptState {
//   /** Receipt currently open for review, or null. */
//   draft: Receipt | null;
//   /** True when unsaved edits exist. */
//   isDirty: boolean;

//   /** @inheritdoc */
//   loadReceipt: (receipt: Receipt) => void;
//   /** @inheritdoc */
//   editHeaderField: (fieldKey: HeaderFieldKey, value: string | number, by: string) => void;
//   /** @inheritdoc */
//   editLineItemField: (index: number, fieldKey: LineFieldKey, value: string | number | null, by: string) => void;
//   /** @inheritdoc */
//   addLineItem: () => void;
//   /** @inheritdoc */
//   removeLineItem: (index: number) => void;
//   /** @inheritdoc */
//   setStatus: (status: ReviewStatus) => void;
//   /** @inheritdoc */
//   setSage: (metadata: SageEntryMetadata) => void;
//   /** @inheritdoc */
//   reset: () => void;
// }

// /** Empty line item used by {@link ReceiptState.addLineItem}. */
// const EMPTY_LINE: LineItem = { description: '', quantity: 1, unitPrice: 0, total: 0, sku_or_upc: null, category: null };

// /**
//  * Store for the receipt review screen.
//  * @example const draft = useReceiptStore((s) => s.draft);
//  */
// export const useReceiptStore = create<ReceiptState>((set) => ({
//   draft: null,
//   isDirty: false,

//   /** @inheritdoc Loads a receipt and clears the dirty flag. */
//   loadReceipt: (receipt) => set({ draft: structuredClone(receipt), isDirty: false }),

//   /** @inheritdoc Applies a finance edit to a header field + audit trail. */
//   editHeaderField: (fieldKey, value, by) =>
//     set((state) => {
//       if (!state.draft) return {};
//       const draft = { ...state.draft, [fieldKey]: value } as Receipt;
//       draft.auditTrail = applyFinanceEdit(draft.auditTrail, fieldKey, undefined, undefined, String(value), by);
//       return { draft, isDirty: true };
//     }),

//   /** @inheritdoc Applies a finance edit to a line-item field + audit trail. */
//   editLineItemField: (index, fieldKey, value, by) =>
//     set((state) => {
//       if (!state.draft) return {};
//       const lineItems = state.draft.lineItems.map((li, i) =>
//         i === index ? { ...li, [fieldKey]: value } : li,
//       );
//       const draft = { ...state.draft, lineItems } as Receipt;
//       draft.auditTrail = applyFinanceEdit(
//         draft.auditTrail,
//         fieldKey,
//         index,
//         lineItems[index].description,
//         value === null ? '' : String(value),
//         by,
//       );
//       return { draft, isDirty: true };
//     }),

//   /** @inheritdoc Appends a blank line item. */
//   addLineItem: () =>
//     set((state) =>
//       state.draft
//         ? { draft: { ...state.draft, lineItems: [...state.draft.lineItems, { ...EMPTY_LINE }] }, isDirty: true }
//         : {},
//     ),

//   /** @inheritdoc Removes a line item by index. */
//   removeLineItem: (index) =>
//     set((state) =>
//       state.draft
//         ? { draft: { ...state.draft, lineItems: state.draft.lineItems.filter((_, i) => i !== index) }, isDirty: true }
//         : {},
//     ),

//   /** @inheritdoc Sets the working review status. */
//   setStatus: (status) =>
//     set((state) => (state.draft ? { draft: { ...state.draft, reviewStatus: status }, isDirty: true } : {})),

//   /** @inheritdoc Sets Sage entry metadata. */
//   setSage: (metadata) =>
//     set((state) => (state.draft ? { draft: { ...state.draft, sageEntryMetadata: metadata }, isDirty: true } : {})),

//   /** @inheritdoc Clears the session. */
//   reset: () => set({ draft: null, isDirty: false }),
// }));

/**
 * @file Zustand store backing the receipt review (detail) screen. Holds the
 * editable draft plus a pristine snapshot, and exposes finance-edit actions
 * that maintain the audit trail.
 */
import { create } from 'zustand';
import type { LineItem, Receipt, ReviewStatus, SageEntryMetadata } from '../services/receiptTypes';
import { applyFinanceEdit } from '../services/applyFInanceEdit';

/** Editable header field keys (everything except created.*). */
export type HeaderFieldKey =
  | 'receiptDate'
  | 'receiptNumber'
  | 'vendor'
  | 'storeNumber'
  | 'paymentMethod'
  | 'receiptTax'
  | 'receiptTotal'
  | 'receiptSubtotal'
  | 'receiptDiscount'
  | 'receiptBalanceDue'
  | 'receiptPO';
/** Editable line-item field keys. */
export type LineFieldKey = keyof Pick<
  LineItem,
  'description' | 'quantity' | 'unitPrice' | 'total' | 'sku_or_upc' | 'category'
>;

/** Receipt review session state. */
interface ReceiptState {
  /** Receipt currently open for review, or null. */
  draft: Receipt | null;
  /** Pristine copy of the receipt as loaded (AI baseline). Never mutated. */
  original: Receipt | null;
  /** True when unsaved edits exist. */
  isDirty: boolean;

  /** @inheritdoc */
  loadReceipt: (receipt: Receipt) => void;
  /** @inheritdoc */
  editHeaderField: (fieldKey: HeaderFieldKey, value: string | number, by: string) => void;
  /** @inheritdoc */
  editLineItemField: (index: number, fieldKey: LineFieldKey, value: string | number | null, by: string) => void;
  /** @inheritdoc */
  addLineItem: () => void;
  /** @inheritdoc */
  removeLineItem: (index: number) => void;
  /** @inheritdoc */
  setStatus: (status: ReviewStatus) => void;
  /** @inheritdoc */
  setSage: (metadata: SageEntryMetadata) => void;
  /** @inheritdoc */
  reset: () => void;
}

/** Empty line item used by {@link ReceiptState.addLineItem}. */
const EMPTY_LINE: LineItem = {
  description: '',
  quantity: 1,
  unitPrice: 0,
  total: 0,
  sku_or_upc: null,
  category: null,
};

/** Normalizes a field value to the audit trail's `string | null` shape. */
const toAuditValue = (value: string | number | null | undefined): string | null =>
  value === null || value === undefined ? null : String(value);

/**
 * Store for the receipt review screen.
 * @example const draft = useReceiptStore((s) => s.draft);
 */
export const useReceiptStore = create<ReceiptState>((set) => ({
  draft: null,
  original: null,
  isDirty: false,

  /** @inheritdoc Loads a receipt, snapshots the AI baseline, clears dirty. */
  loadReceipt: (receipt) =>
    set({
      draft: structuredClone(receipt),
      original: structuredClone(receipt),
      isDirty: false,
    }),

  /** @inheritdoc Applies a completed finance edit to a header field + audit trail. */
  editHeaderField: (fieldKey, value, by) =>
    set((state) => {
      if (!state.draft || !state.original) return {};
      const draft = { ...state.draft, [fieldKey]: value } as Receipt;
      draft.auditTrail = applyFinanceEdit(draft.auditTrail, {
        fieldKey,
        lineItemIndex: undefined,
        lineItemDescription: undefined,
        originalValue: toAuditValue(state.original[fieldKey] as string | number | null | undefined),
        changedValue: toAuditValue(value),
        by,
        now: new Date().toISOString(),
      });
      return { draft, isDirty: true };
    }),

  /** @inheritdoc Applies a completed finance edit to a line-item field + audit trail. */
  editLineItemField: (index, fieldKey, value, by) =>
    set((state) => {
      if (!state.draft || !state.original) return {};
      const lineItems = state.draft.lineItems.map((li, i) =>
        i === index ? { ...li, [fieldKey]: value } : li,
      );
      const draft = { ...state.draft, lineItems } as Receipt;
      const baseLine = state.original.lineItems[index]; // index assumed stable
      draft.auditTrail = applyFinanceEdit(draft.auditTrail, {
        fieldKey,
        lineItemIndex: index,
        lineItemDescription: lineItems[index].description,
        originalValue: toAuditValue(baseLine ? baseLine[fieldKey] : null),
        changedValue: toAuditValue(value),
        by,
        now: new Date().toISOString(),
      });
      return { draft, isDirty: true };
    }),

  /** @inheritdoc Appends a blank line item. */
  addLineItem: () =>
    set((state) =>
      state.draft
        ? {
            draft: { ...state.draft, lineItems: [...state.draft.lineItems, { ...EMPTY_LINE }] },
            isDirty: true,
          }
        : {},
    ),

  /** @inheritdoc Removes a line item by index. */
  removeLineItem: (index) =>
    set((state) =>
      state.draft
        ? {
            draft: { ...state.draft, lineItems: state.draft.lineItems.filter((_, i) => i !== index) },
            isDirty: true,
          }
        : {},
    ),

  /** @inheritdoc Sets the working review status. */
  setStatus: (status) =>
    set((state) => (state.draft ? { draft: { ...state.draft, reviewStatus: status }, isDirty: true } : {})),

  /** @inheritdoc Sets Sage entry metadata. */
  setSage: (metadata) =>
    set((state) => (state.draft ? { draft: { ...state.draft, sageEntryMetadata: metadata }, isDirty: true } : {})),

  /** @inheritdoc Clears the session. */
  reset: () => set({ draft: null, original: null, isDirty: false }),
}));