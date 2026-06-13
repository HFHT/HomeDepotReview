/**
 * @file Editable 3-column receipt header grid. Created By / Created Date are
 * locked; every other field is editable and shows a source badge + chain.
 */
import { Alert, Grid, NumberInput, Paper, Select, TextInput } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { IconAlertTriangle } from '@tabler/icons-react';
import type { Receipt, ReviewStatus } from '../services/receiptTypes';
import { useReceiptStore } from '../stores/receiptStore';
import { useCurrentUser } from './useCurrentUser';
import { SourcedField } from './SourcedField';
import { currency } from '../services/format';
import { JSX } from 'react/jsx-runtime';

/** Selectable review statuses for the inline status field. */
const STATUS_OPTIONS: { value: ReviewStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_review', label: 'In Review' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'entered_in_sage', label: 'Entered in Sage' },
  { value: 'rejected', label: 'Rejected' },
];

/** Props for {@link ReceiptDetailFields}. */
interface ReceiptDetailFieldsProps {
  /** Receipt draft being edited. */
  receipt: Receipt;
}

/**
 * Renders the editable 3-column receipt header block + totals mismatch alert.
 * @param props - {@link ReceiptDetailFieldsProps}.
 */
export function ReceiptDetailFields({ receipt }: ReceiptDetailFieldsProps): JSX.Element {
  const by = useCurrentUser();
  const editHeaderField = useReceiptStore((s) => s.editHeaderField);
  const setStatus = useReceiptStore((s) => s.setStatus);

  const lineSum = receipt.lineItems.reduce((acc, li) => acc + (li.total || 0), 0);
  const subtotal = receipt.receiptTotal - receipt.receiptTax + receipt.receiptDiscount;
  const mismatch = Math.abs(lineSum - subtotal) > 0.01;

  return (
    <Paper withBorder radius="md" p="md">
      <Grid gap="sm">
        <Grid.Col span={3}>
          <SourcedField label="Store #" fieldKey="store" receipt={receipt}>
            <TextInput value={receipt.storeNumber} onChange={(e) => editHeaderField('storeNumber', e.currentTarget.value, by)} />
          </SourcedField>
        </Grid.Col>
        <Grid.Col span={3}>
          <SourcedField label="Receipt #" fieldKey="receiptNumber" receipt={receipt}>
            <TextInput value={receipt.receiptNumber} onChange={(e) => editHeaderField('receiptNumber', e.currentTarget.value, by)} />
          </SourcedField>
        </Grid.Col>
        <Grid.Col span={3}>
          <SourcedField label="Receipt Date" fieldKey="receiptDate" receipt={receipt}>
            <DateInput
              value={receipt.receiptDate ? new Date(receipt.receiptDate) : null}
              onChange={(d) => editHeaderField('receiptDate', d ? d : '', by)}
              valueFormat="MM/DD/YYYY"
            />
          </SourcedField>
        </Grid.Col>
        <Grid.Col span={3}>
          <SourcedField label="PO/Job #" fieldKey="receiptPO" receipt={receipt}>
            <TextInput value={receipt.receiptPO || ''} onChange={(e) => editHeaderField('receiptPO', e.currentTarget.value, by)} />
          </SourcedField>
        </Grid.Col>


        <Grid.Col span={3}>
          {/* <SourcedField label="Subtotal (computed)" locked>
            <TextInput value={currency(subtotal)} disabled />
          </SourcedField> */}
          <SourcedField label="Subtotal" fieldKey="receiptSubtotal" receipt={receipt}>
            <NumberInput
              value={receipt.receiptSubtotal}
              onChange={(v) => editHeaderField('receiptSubtotal', Number(v) || 0, by)}
              prefix="$"
              decimalScale={2}
              fixedDecimalScale
            />
          </SourcedField>
        </Grid.Col>
        <Grid.Col span={3}>
          <SourcedField label="Tax" fieldKey="receiptTax" receipt={receipt}>
            <NumberInput
              value={receipt.receiptTax}
              onChange={(v) => editHeaderField('receiptTax', Number(v) || 0, by)}
              prefix="$"
              decimalScale={2}
              fixedDecimalScale
            />
          </SourcedField>
        </Grid.Col>
        <Grid.Col span={3}>
          <SourcedField label="Discount" fieldKey="receiptDiscount" receipt={receipt}>
            <NumberInput
              value={receipt.receiptDiscount}
              onChange={(v) => editHeaderField('receiptDiscount', Number(v) || 0, by)}
              prefix="$"
              decimalScale={2}
              fixedDecimalScale
            />
          </SourcedField>
        </Grid.Col>
        <Grid.Col span={3}>
          <SourcedField label="Total" fieldKey="receiptTotal" receipt={receipt}>
            <NumberInput
              value={receipt.receiptTotal}
              onChange={(v) => editHeaderField('receiptTotal', Number(v) || 0, by)}
              prefix="$"
              decimalScale={2}
              fixedDecimalScale
            />
          </SourcedField>
        </Grid.Col>
      </Grid>

      {receipt.receiptBalanceDue > 0 && (
        <Alert mt="sm" color="yellow" icon={<IconAlertTriangle size={16} />} variant="light">
          <SourcedField label="Balance Due" fieldKey="receiptBalanceDue" receipt={receipt}>
            <NumberInput
              value={receipt.receiptBalanceDue}
              onChange={(v) => editHeaderField('receiptBalanceDue', Number(v) || 0, by)}
              prefix="$"
              decimalScale={2}
              fixedDecimalScale
            />
          </SourcedField>
        </Alert>
      )}

      {mismatch && (
        <Alert mt="sm" color="yellow" icon={<IconAlertTriangle size={16} />} variant="light">
          Total {currency(receipt.receiptSubtotal)} ≠ Σ line items {currency(lineSum)}.
        </Alert>
      )}
    </Paper>
  );
}