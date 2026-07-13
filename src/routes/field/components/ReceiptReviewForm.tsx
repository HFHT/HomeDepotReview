import { useEffect } from 'react';
import { Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { ReceiptAnalysisResponse } from '../../../types/ReceiptAnalysis';
import { ReceiptCommonFields, CommonField } from './ReceiptCommonFields';
import { ReceiptLineItemsSection } from './ReceiptLineItemsSection';

export interface ReceiptReviewFormProps {
  /** The receipt data to display/edit. */
  receipt: ReceiptAnalysisResponse;
  /** Immutable AI-response snapshot used for "Edited" diffing; defaults to `receipt` (no edits shown) when omitted, as in the read-only History view. */
  originalReceipt?: ReceiptAnalysisResponse | null;
  /** When true, all inputs render as read-only (used by the History detail modal). */
  readOnly?: boolean;
  /** Fired on every value change so the parent can mirror current form state. */
  onChange?: (receipt: ReceiptAnalysisResponse) => void;
}

/**
 * Shared, form-driven view of a `ReceiptAnalysisResponse`, used both for the
 * editable New Receipt "Review" step and the read-only History detail modal.
 *
 * Note: submission history (old vs. new values) is no longer tracked here on
 * blur. It's computed once, at submit time, by diffing `originalReceipt`
 * against the final form values — see `receiptHistoryDiff.ts`.
 */
export function ReceiptReviewForm({
  receipt,
  originalReceipt,
  readOnly,
  onChange,
}: ReceiptReviewFormProps) {
  const form = useForm<ReceiptAnalysisResponse>({ initialValues: receipt });

  useEffect(() => {
    onChange?.(form.values);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.values]);

  const original = originalReceipt ?? receipt;

  const isFieldEdited = (field: CommonField) => form.values[field] !== original[field];

  const isLineItemFieldEdited = (id: string, field: keyof ReceiptAnalysisResponse['line_items'][number]) => {
    const current = form.values.line_items.find((li) => li.id === id);
    const originalItem = original.line_items.find((li) => li.id === id);
    if (!current) return false;
    if (!originalItem) return true; // newly added line item
    return current[field] !== originalItem[field];
  };

  const lineItemsSum = form.values.line_items.reduce((sum, li) => sum + (li.total_price ?? 0), 0);
  const subtotalMismatch = form.values.subtotal !== null && Math.abs((form.values.subtotal ?? 0) - lineItemsSum) > 0.01;
  const totalMismmatch = form.values.total !== null && Math.abs((form.values.total ?? 0) - lineItemsSum) > 0.01;

  return (
    <Stack gap={'md'}>
      <ReceiptCommonFields
        form={form}
        readOnly={readOnly}
        isFieldEdited={isFieldEdited}
        subtotalMismatch={subtotalMismatch && totalMismmatch}
      />
      <ReceiptLineItemsSection
        form={form}
        readOnly={readOnly}
        isLineItemFieldEdited={isLineItemFieldEdited}
      />
    </Stack>
  );
}