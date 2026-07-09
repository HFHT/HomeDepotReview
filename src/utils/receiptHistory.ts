import type { ReceiptSubmissionHistory } from '../types/ReceiptSubmission';

/** Which "level" currently owns a field's displayed value. */
export type FieldSource = 'ai' | 'field' | 'finance';

interface FinanceFieldChange {
  field: string;
  lineItemId: string | null;
  originalValue: string | number | null;
  newValue: string | number | null;
}

/**
 * Inserts, updates, or removes a `by: 'finance'` history entry for a given
 * field, per the change-tracking rules:
 * - No existing finance entry + value differs from the original -> insert.
 * - Existing finance entry + value still differs -> update `new_value` only
 *   (never overwrite `old_value`, which always reflects the original baseline).
 * - Value reverted back to `originalValue` -> remove the finance entry.
 */
export function upsertFinanceHistory(
  history: ReceiptSubmissionHistory[],
  change: FinanceFieldChange
): ReceiptSubmissionHistory[] {
  const { field, lineItemId, originalValue, newValue } = change;
  const idx = history.findIndex(
    (h) => h.by === 'finance' && h.field === field && h.line_item_id === lineItemId
  );

  const reverted = newValue === originalValue;

  if (reverted) {
    if (idx === -1) return history;
    return history.filter((_, i) => i !== idx);
  }

  if (idx === -1) {
    return [
      ...history,
      { field, line_item_id: lineItemId, by: 'finance', old_value: originalValue, new_value: newValue },
    ];
  }

  const updated = [...history];
  updated[idx] = { ...updated[idx], new_value: newValue };
  return updated;
}

/** AI < Field < Finance precedence rule for a given field/line-item. */
export function getFieldSource(
  history: ReceiptSubmissionHistory[],
  field: string,
  lineItemId: string | null
): FieldSource {
  const matches = history.filter((h) => h.field === field && h.line_item_id === lineItemId);
  if (matches.some((h) => h.by === 'finance')) return 'finance';
  if (matches.some((h) => h.by === 'field')) return 'field';
  return 'ai';
}

function formatChainValue(value: string | number | null): string {
  return value === null || value === undefined || value === '' ? '—' : String(value);
}

/**
 * Builds the "AI:x -> Field:y -> Finance:z" tooltip string, including only
 * the levels that actually exist in history.
 *
 * - AI value: `history[0].old_value` if any history exists for the field,
 *   otherwise the raw `aiValue` passed in (the value at initial page load).
 * - Field value: the most recent `by: 'field'` entry's `new_value`.
 * - Finance value: the live `currentValue`, shown only if a finance entry exists.
 */
export function getChangeChain(
  history: ReceiptSubmissionHistory[],
  field: string,
  lineItemId: string | null,
  aiValue: string | number | null,
  currentValue: string | number | null
): string {
  const matches = history.filter((h) => h.field === field && h.line_item_id === lineItemId);
  const segments: string[] = [];

  const resolvedAi = matches.length > 0 ? matches[0].old_value : aiValue;
  segments.push(`AI:${formatChainValue(resolvedAi)}`);

  const fieldEntry = [...matches].reverse().find((h) => h.by === 'field');
  if (fieldEntry) {
    segments.push(`Field:${formatChainValue(fieldEntry.new_value)}`);
  }

  if (matches.some((h) => h.by === 'finance')) {
    segments.push(`Finance:${formatChainValue(currentValue)}`);
  }

  return segments.join(' -> ');
}