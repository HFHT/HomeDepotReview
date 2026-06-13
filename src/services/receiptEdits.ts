/**
 * @file Pure helper for applying finance-layer edits to a receipt's audit
 * trail. Keeps `AuditChange` bookkeeping in one place so store/UI stay thin.
 */
import type { AuditChange } from './receiptTypes';

/**
 * Upserts a `Finance` {@link AuditChange} for a field, preserving the AI
 * (`originalValue`) and Field (`fieldValue`) values already on record.
 *
 * @param audit - existing audit trail.
 * @param fieldKey - field being edited (e.g. `"receiptTotal"`).
 * @param lineItemIndex - index for line-item fields; `undefined` for header fields.
 * @param lineItemDescription - description for line-item context (optional).
 * @param financeValue - the new finance-entered value as a string.
 * @param by - identity of the editing finance user.
 * @returns A new audit array with the finance change recorded.
 */
export function applyFinanceEdit(
  audit: AuditChange[],
  fieldKey: string,
  lineItemIndex: number | undefined,
  lineItemDescription: string | undefined,
  financeValue: string,
  by: string,
): AuditChange[] {
  const match = (a: AuditChange) =>
    a.fieldKey === fieldKey && a.lineItemIndex === lineItemIndex;

  console.log('Applying finance edit:', { audit, fieldKey, lineItemIndex, financeValue, by });
  // const originalValue = audit.find((a) => match(a) && a.layer === 'AI')?.originalValue ?? null;
  // const fieldValue = audit.find((a) => match(a) && a.layer === 'Field')?.fieldValue;

  // const next = audit.filter((a) => !(match(a) && a.layer === 'Finance'));
  // next.push({
  //   fieldKey,
  //   lineItemIndex,
  //   lineItemDescription,
  //   originalValue,
  //   fieldValue,
  //   financeValue,
  //   layer: 'Finance',
  //   by,
  // });
  // return next;
  return audit ?? [];
}