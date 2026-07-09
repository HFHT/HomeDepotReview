import { Card, Group, MultiSelect, NumberInput, Select, SimpleGrid, Stack, Text, TextInput } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import dayjs from 'dayjs';

import { useSelectsStore } from '../../lib/stores/selectsStore';
import type { ReceiptSubmissionHistory, ReceiptSubmissionRequest } from '../../types/ReceiptSubmission';
import { upsertFinanceHistory } from '../../utils/receiptHistory';
import { FieldSourceIndicator } from './FieldSourceIndicator';
import { useReceiptFormContext } from './receiptFormContext';

export interface ReceiptCommonEditorProps {
  /** Snapshot of the record as it existed when the review page was opened; used as the AI baseline. */
  original: ReceiptSubmissionRequest;
}

/** Small label composed of static text + the AI/Field/Finance provenance badge. */
function FieldLabel({
  label,
  history,
  field,
  aiValue,
  currentValue,
}: {
  label: string;
  history: ReceiptSubmissionHistory[];
  field: string;
  aiValue: string | number | null;
  currentValue: string | number | null;
}) {
  return (
    <Group gap={6} wrap="nowrap" mb={2}>
      <Text size="sm" fw={500}>
        {label}
      </Text>
      <FieldSourceIndicator history={history} field={field} aiValue={aiValue} currentValue={currentValue} />
    </Group>
  );
}

/**
 * Mantine v7's `NumberInput.onChange` is typed as `(value: number | string) => void`
 * (it can emit an intermediate/raw string, not just `number | ''`), so this
 * coerces any of those shapes down to `number | null` for the form/history.
 */
function toNumOrNull(v: number | string): number | null {
  if (v === '' || v === undefined || v === null) return null;
  const num = typeof v === 'number' ? v : Number(v);
  return Number.isNaN(num) ? null : num;
}

/**
 * Editable card for the receipt-level fields (`ReceiptAnalysisResponse`) plus
 * the `meta` project/lot/phases selects. `onBlur` handlers record finance
 * edits into `form.values.history` per the change-tracking rules.
 *
 * @remarks
 * Row 1 uses `payment_method` in place of a second `projectOrSubdivision`
 * field (per the resolved spec ambiguity), since the editable Select for
 * `projectOrSubdivision` already lives in the second grid below.
 */
export function ReceiptCommonEditor({ original }: ReceiptCommonEditorProps) {
  const form = useReceiptFormContext();
  const subdivisions = useSelectsStore((s) => s.subdivisions);
  const phases = useSelectsStore((s) => s.phases);

  const { receipt, meta, history } = form.values;

  const track = (field: string, originalValue: string | number | null, newValue: string | number | null) => {
    form.setFieldValue('history', upsertFinanceHistory(history, { field, lineItemId: null, originalValue, newValue }));
  };

  return (
    <Card>
      <Stack gap="md">
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
          <TextInput
            label={
              <FieldLabel
                label="Receipt #"
                history={history}
                field="receipt_number"
                aiValue={original.receipt.receipt_number}
                currentValue={receipt.receipt_number}
              />
            }
            value={receipt.receipt_number ?? ''}
            onChange={(e) => form.setFieldValue('receipt.receipt_number', e.currentTarget.value || null)}
            onBlur={(e) => track('receipt_number', original.receipt.receipt_number, e.currentTarget.value || null)}
          />
          <TextInput
            label={
              <FieldLabel
                label="Supplier"
                history={history}
                field="supplier"
                aiValue={original.receipt.supplier}
                currentValue={receipt.supplier}
              />
            }
            value={receipt.supplier ?? ''}
            onChange={(e) => form.setFieldValue('receipt.supplier', e.currentTarget.value || null)}
            onBlur={(e) => track('supplier', original.receipt.supplier, e.currentTarget.value || null)}
          />
          <DateInput
            label={
              <FieldLabel
                label="Date"
                history={history}
                field="date"
                aiValue={original.receipt.date}
                currentValue={receipt.date}
              />
            }
            value={receipt.date ? dayjs(receipt.date).toDate() : null}
            onChange={(value) => {
              const iso = value ? dayjs(value).format('YYYY-MM-DD') : null;
              form.setFieldValue('receipt.date', iso);
              track('date', original.receipt.date, iso);
            }}
          />
          <TextInput
            label={
              <FieldLabel
                label="Payment Method"
                history={history}
                field="payment_method"
                aiValue={original.receipt.payment_method}
                currentValue={receipt.payment_method}
              />
            }
            value={receipt.payment_method ?? ''}
            onChange={(e) => form.setFieldValue('receipt.payment_method', e.currentTarget.value || null)}
            onBlur={(e) => track('payment_method', original.receipt.payment_method, e.currentTarget.value || null)}
          />
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
          <NumberInput
            label={
              <FieldLabel
                label="Subtotal"
                history={history}
                field="subtotal"
                aiValue={original.receipt.subtotal}
                currentValue={receipt.subtotal}
              />
            }
            decimalScale={2}
            fixedDecimalScale
            prefix="$"
            value={receipt.subtotal ?? undefined}
            onChange={(v) => form.setFieldValue('receipt.subtotal', toNumOrNull(v))}
            onBlur={() => track('subtotal', original.receipt.subtotal, receipt.subtotal)}
          />
          <NumberInput
            label={
              <FieldLabel
                label="Total Tax"
                history={history}
                field="total_tax"
                aiValue={original.receipt.total_tax}
                currentValue={receipt.total_tax}
              />
            }
            decimalScale={2}
            fixedDecimalScale
            prefix="$"
            value={receipt.total_tax ?? undefined}
            onChange={(v) => form.setFieldValue('receipt.total_tax', toNumOrNull(v))}
            onBlur={() => track('total_tax', original.receipt.total_tax, receipt.total_tax)}
          />
          <NumberInput
            label={
              <FieldLabel
                label="Total Discount"
                history={history}
                field="total_discount"
                aiValue={original.receipt.total_discount}
                currentValue={receipt.total_discount}
              />
            }
            decimalScale={2}
            fixedDecimalScale
            prefix="$"
            value={receipt.total_discount ?? undefined}
            onChange={(v) => form.setFieldValue('receipt.total_discount', toNumOrNull(v))}
            onBlur={() => track('total_discount', original.receipt.total_discount, receipt.total_discount)}
          />
          <NumberInput
            label={
              <FieldLabel
                label="Total"
                history={history}
                field="total"
                aiValue={original.receipt.total}
                currentValue={receipt.total}
              />
            }
            decimalScale={2}
            fixedDecimalScale
            prefix="$"
            value={receipt.total ?? undefined}
            onChange={(v) => form.setFieldValue('receipt.total', toNumOrNull(v))}
            onBlur={() => track('total', original.receipt.total, receipt.total)}
          />
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, sm: 3 }}>
          <Select
            label="Project / Subdivision"
            data={subdivisions}
            searchable
            clearable
            value={meta.projectOrSubdivision || null}
            onChange={(v) => form.setFieldValue('meta.projectOrSubdivision', v ?? '')}
          />
          <TextInput label="Lot / Project Numbers" {...form.getInputProps('meta.lotOrProjectNumbers')} />
          <MultiSelect
            label="Phases"
            data={phases}
            searchable
            clearable
            value={meta.phases}
            onChange={(v) => form.setFieldValue('meta.phases', v)}
          />
        </SimpleGrid>

        {/* Reserved for a future "Balance Due" summary field. */}
        <div />
      </Stack>
    </Card>
  );
}