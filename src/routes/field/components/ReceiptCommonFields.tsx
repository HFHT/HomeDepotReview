import { Badge, NumberInput, SimpleGrid, Stack, TextInput } from '@mantine/core';
import { UseFormReturnType } from '@mantine/form';
import { ReceiptAnalysisResponse } from '../../../types/ReceiptAnalysis';
import { FieldLabel } from './FieldLabel';

/** Receipt-level (non-line-item) fields tracked for edit/history diffing. */
export type CommonField =
  | 'supplier'
  | 'receipt_number'
  | 'date'
  | 'payment_method'
  | 'subtotal'
  | 'total_tax'
  | 'total_discount'
  | 'total';

interface ReceiptCommonFieldsProps {
  form: UseFormReturnType<ReceiptAnalysisResponse>;
  readOnly?: boolean;
  isFieldEdited: (field: CommonField) => boolean;
  subtotalMismatch: boolean;
}

/**
 * Renders the receipt-level summary fields (supplier, totals, etc.) shared by
 * the New Receipt Review step and the read-only History detail modal.
 *
 * Uses a responsive grid (1 column on phones, up to 4 on larger screens)
 * instead of `Group grow`, which squeezed every field into an unreadable
 * sliver on narrow viewports.
 */
export function ReceiptCommonFields({
  form,
  readOnly,
  isFieldEdited,
  subtotalMismatch,
}: ReceiptCommonFieldsProps) {
  const moneyProps = { decimalScale: 2, fixedDecimalScale: true, prefix: '$' } as const;

  return (
    <Stack>
      <SimpleGrid cols={{ base: 2, xs: 2, md: 4 }} spacing="md" verticalSpacing="md">
        <TextInput
          label={<FieldLabel label="Supplier" edited={isFieldEdited('supplier')} />}
          readOnly={readOnly}
          {...form.getInputProps('supplier')}
        />

        <NumberInput
          label={<FieldLabel label="Subtotal" edited={isFieldEdited('subtotal')} />}
          readOnly={readOnly}
          {...moneyProps}
          {...form.getInputProps('subtotal')}
        />
        <TextInput
          label={<FieldLabel label="Receipt Number" edited={isFieldEdited('receipt_number')} />}
          readOnly={readOnly}
          {...form.getInputProps('receipt_number')}
        />

        <NumberInput
          label={<FieldLabel label="Total Tax" edited={isFieldEdited('total_tax')} />}
          readOnly={readOnly}
          {...moneyProps}
          {...form.getInputProps('total_tax')}
        />
        <TextInput
          label={<FieldLabel label="Date" edited={isFieldEdited('date')} />}
          readOnly={readOnly}
          {...form.getInputProps('date')}
        />

        <NumberInput
          label={<FieldLabel label="Total Discount" edited={isFieldEdited('total_discount')} />}
          readOnly={readOnly}
          {...moneyProps}
          {...form.getInputProps('total_discount')}
        />
        <TextInput
          label={<FieldLabel label="Payment Method" edited={isFieldEdited('payment_method')} />}
          readOnly={readOnly}
          {...form.getInputProps('payment_method')}
        />
        <NumberInput
          label={<FieldLabel label="Total" edited={isFieldEdited('total')} />}
          readOnly={readOnly}
          {...moneyProps}
          {...form.getInputProps('total')}
        />
      </SimpleGrid>
      {subtotalMismatch && (
        <Badge size="xs" color="red">
          The sum of the line items is not equal to subtotal or total
        </Badge>
      )}
    </Stack>
  );
}