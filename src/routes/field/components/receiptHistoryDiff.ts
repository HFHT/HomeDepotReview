import { ReceiptAnalysisResponse, ReceiptAnalysisResponseItems } from '../../../types/ReceiptAnalysis';
import { ReceiptSubmissionHistory } from '../../../types/ReceiptSubmission';
import { CommonField } from './ReceiptCommonFields';

const COMMON_FIELDS: CommonField[] = [
  'supplier',
  'receipt_number',
  'date',
  'payment_method',
  'subtotal',
  'total_tax',
  'total_discount',
  'total',
];

const LINE_ITEM_FIELDS: (keyof ReceiptAnalysisResponseItems)[] = [
  'sku_or_upc',
  'title',
  'unit_price',
  'quantity',
  'discount',
  'total_price',
];

/**
 * Diffs the original AI-extracted receipt against the current (possibly
 * user-edited) receipt, producing exactly one history entry per changed
 * field — including added/removed line items 
 */
export function buildReceiptHistory(
  original: ReceiptAnalysisResponse,
  current: ReceiptAnalysisResponse
): ReceiptSubmissionHistory[] {
  const entries: ReceiptSubmissionHistory[] = [];

  for (const field of COMMON_FIELDS) {
    if (original[field] !== current[field]) {
      entries.push({
        field,
        line_item_id: null,
        by: 'field',
        old_value: original[field] as string | number | null,
        new_value: current[field] as string | number | null,
      });
    }
  }

  const originalById = new Map(original.line_items.map((li) => [li.id, li]));
  const currentById = new Map(current.line_items.map((li) => [li.id, li]));

  // Added or edited line items.
  for (const item of current.line_items) {
    const orig = originalById.get(item.id);
    if (!orig) {
      entries.push({
        field: 'line_item',
        line_item_id: item.id,
        by: 'field',
        old_value: null,
        new_value: item.title ?? item.sku_or_upc ?? item.id,
      });
      continue;
    }
    for (const field of LINE_ITEM_FIELDS) {
      if (orig[field] !== item[field]) {
        entries.push({
          field,
          line_item_id: item.id,
          by: 'field',
          old_value: orig[field] as string | number | null,
          new_value: item[field] as string | number | null,
        });
      }
    }
  }

  // Removed line items.
  for (const [id, orig] of originalById) {
    if (!currentById.has(id)) {
      entries.push({
        field: 'line_item',
        line_item_id: id,
        by: 'field',
        old_value: orig.title ?? orig.sku_or_upc ?? id,
        new_value: null,
      });
    }
  }

  return entries;
}