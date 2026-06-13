// /**
//  * @file Resolves the AI → Field → Finance change chain for a single field,
//  * used to drive source badges, tooltips, and "edited" markers.
//  */
// import type { AuditChange } from './receiptTypes';

// /** Resolved change chain for a field, newest-winning layer flagged. */
// export interface FieldChangeChain {
//   /** Layer that produced the value now displayed. */
//   currentLayer: AuditChange['layer'];
//   /** Ordered AI → Field → Finance values (nulls preserved). */
//   chain: { layer: AuditChange['layer']; value: string | null | undefined }[];
//   /** True if any layer beyond AI altered the value (drives the `*` marker). */
//   edited: boolean;
// }

// /**
//  * Builds the display chain for a receipt or line-item field from the audit trail.
//  *
//  * @param audit - the receipt's full `auditTrail`.
//  * @param fieldKey - the field to resolve (e.g. `"receiptTotal"`, `"unitPrice"`).
//  * @param lineItemIndex - index for a line-item field; omit for header fields.
//  * @returns The current layer, ordered value chain, and whether it was edited.
//  * @example buildFieldChain(receipt.auditTrail, 'receiptTotal').currentLayer // 'Finance'
//  */
// export function buildFieldChain(
//   audit: AuditChange[],
//   fieldKey: string,
//   lineItemIndex?: number,
// ): FieldChangeChain {
//   const order: AuditChange['layer'][] = ['AI', 'Field', 'Finance'];
//   const relevant = audit.filter(
//     (a) => a.fieldKey === fieldKey && a.lineItemIndex === lineItemIndex,
//   );

//   const chain = order.map((layer) => {
//     const entry = relevant.find((a) => a.layer === layer);
//     return {
//       layer,
//       value:
//         layer === 'AI'
//           ? entry?.originalValue
//           : layer === 'Field'
//             ? entry?.fieldValue
//             : entry?.financeValue,
//     };
//   });

//   const present = order.filter((l) => relevant.some((a) => a.layer === l));
//   const currentLayer = present.length ? present[present.length - 1] : 'AI';

//   return { currentLayer, chain, edited: currentLayer !== 'AI' };
// }

/**
 * @file Resolves the AI → Field → Finance change chain for a single field by
 * sequencing audit entries by layer + changedAt. Drives source badges,
 * tooltips, and "edited" markers. Pure logic — no UI.
 */
import type { AuditChange, Receipt } from './receiptTypes';

/** Conceptual layer order. AI is virtual (never present in the audit trail). */
export type ChainLayer = 'AI' | AuditChange['layer']; // 'AI' | 'Field' | 'Finance'

/** The minimal value triple requested: Field/Finance null when never edited. */
export interface FieldChainValues {
  aiValue: string | null;
  fieldValue: string | null;
  financeValue: string | null;
}

/** Full resolution used by the UI. */
export interface ResolvedFieldChain extends FieldChainValues {
  /** Highest layer that produced a change (AI when untouched). */
  currentLayer: ChainLayer;
  /** Value currently shown to the user. */
  currentValue: string | null;
  /** True when any layer beyond AI altered the value. */
  edited: boolean;
  /** Ordered chain for tooltip rendering (only present layers + AI). */
  chain: { layer: ChainLayer; value: string | null }[];
}

/**
 * Maps a header audit `fieldKey` to its `Receipt` property when they differ.
 * Keys not listed are assumed to match the property name 1:1.
 */
const HEADER_FIELD_KEY_TO_PROP: Record<string, keyof Receipt> = {
  storeNumber: 'storeNumber',
  receiptNumber: 'receiptNumber',
  receiptDate: 'receiptDate',
  receiptPO: 'receiptPO',
  receiptSubtotal: 'receiptSubtotal',
  receiptTax: 'receiptTax',
  receiptDiscount: 'receiptDiscount',
  receiptTotal: 'receiptTotal',
  receiptBalanceDue: 'receiptBalanceDue',
};

/**
 * Reads the live value off the receipt for a given fieldKey so the AI value can
 * fall back to it when there are no audit entries.
 *
 * Line-item fieldKeys match their `LineItem` property names 1:1; header keys go
 * through {@link HEADER_FIELD_KEY_TO_PROP} (only `"store"` differs today).
 */
function readReceiptValue(
  receipt: Receipt,
  fieldKey: string,
  lineItemIndex?: number,
): string | null {
  if (lineItemIndex !== undefined) {
    const li = receipt.lineItems[lineItemIndex] as Record<string, unknown> | undefined;
    const v = li?.[fieldKey];
    return v == null ? null : String(v);
  }

  const prop = HEADER_FIELD_KEY_TO_PROP[fieldKey] ?? (fieldKey as keyof Receipt);
  const v = receipt[prop];
  return v == null ? null : String(v);
}

// /**
//  * Reads the live value off the receipt for a given fieldKey so the AI value can
//  * fall back to it when there are no audit entries.
//  *
//  * NOTE: this mapping is the one open question — see message below.
//  */
// function readReceiptValue(
//   receipt: Receipt,
//   fieldKey: string,
//   lineItemIndex?: number,
// ): string | null {
//   if (lineItemIndex !== undefined) {
//     const li = receipt.lineItems[lineItemIndex] as Record<string, unknown> | undefined;
//     const v = li?.[fieldKey];
//     return v == null ? null : String(v);
//   }

//   const map: Record<string, unknown> = {
//     store: receipt.storeNumber,
//     storeNumber: receipt.storeNumber,
//     receiptNumber: receipt.receiptNumber,
//     receiptDate: receipt.receiptDate,
//     receiptPO: receipt.receiptPO,
//     receiptSubtotal: receipt.receiptSubtotal,
//     receiptTax: receipt.receiptTax,
//     receiptDiscount: receipt.receiptDiscount,
//     receiptTotal: receipt.receiptTotal,
//     receiptBalanceDue: receipt.receiptBalanceDue,
//   };

//   const v = map[fieldKey];
//   return v == null ? null : String(v);
// }

/** Most recent (by changedAt) changedValue for a layer, or null if absent. */
function latestValueForLayer(
  sortedAsc: AuditChange[],
  layer: AuditChange['layer'],
): string | null {
  const entries = sortedAsc.filter((a) => a.layer === layer);
  return entries.length ? entries[entries.length - 1].changedValue : null;
}

/**
 * Builds the AI → Field → Finance chain for a header or line-item field.
 *
 * @param receipt - the full receipt.
 * @param fieldKey - the field to resolve (e.g. `"receiptTotal"`, `"unitPrice"`).
 * @param lineItemIndex - index for a line-item field; omit for header fields.
 */
export function resolveFieldChain(
  receipt: Receipt,
  fieldKey: string,
  lineItemIndex?: number,
): ResolvedFieldChain {
  const relevant = receipt.auditTrail
    .filter((a) => a.fieldKey === fieldKey && a.lineItemIndex === lineItemIndex)
    .slice()
    .sort((a, b) => Date.parse(a.changedAt) - Date.parse(b.changedAt));

  const hasField = relevant.some((a) => a.layer === 'Field');
  const hasFinance = relevant.some((a) => a.layer === 'Finance');

  // AI value: earliest entry's originalValue, else the live receipt value.
  const aiValue = relevant.length
    ? relevant[0].originalValue
    : readReceiptValue(receipt, fieldKey, lineItemIndex);

  const fieldValue = hasField ? latestValueForLayer(relevant, 'Field') : null;
  const financeValue = hasFinance ? latestValueForLayer(relevant, 'Finance') : null;

  const currentLayer: ChainLayer = hasFinance ? 'Finance' : hasField ? 'Field' : 'AI';
  const currentValue =
    currentLayer === 'Finance' ? financeValue : currentLayer === 'Field' ? fieldValue : aiValue;

  const chain: { layer: ChainLayer; value: string | null }[] = [{ layer: 'AI', value: aiValue }];
  if (hasField) chain.push({ layer: 'Field', value: fieldValue });
  if (hasFinance) chain.push({ layer: 'Finance', value: financeValue });

  return { aiValue, fieldValue, financeValue, currentLayer, currentValue, edited: currentLayer !== 'AI', chain };
}

/** Convenience wrapper returning only the requested value triple. */
export function getFieldChainValues(
  receipt: Receipt,
  fieldKey: string,
  lineItemIndex?: number,
): FieldChainValues {
  const { aiValue, fieldValue, financeValue } = resolveFieldChain(receipt, fieldKey, lineItemIndex);
  return { aiValue, fieldValue, financeValue };
}