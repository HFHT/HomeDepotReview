import { Badge, Text, Tooltip } from '@mantine/core';

import type { ReceiptSubmissionHistory } from '../../../types/ReceiptSubmission';
import { getChangeChain, getFieldSource, type FieldSource } from '../../../utils/receiptHistory';

const SOURCE_LABEL: Record<FieldSource, string> = {
  ai: 'AI',
  field: 'Field',
  finance: 'Finance',
};

const SOURCE_COLOR: Record<FieldSource, string> = {
  ai: 'gray',
  field: 'habitatBlue',
  finance: 'habitatGreen',
};

export interface FieldSourceIndicatorProps {
  history: ReceiptSubmissionHistory[];
  field: string;
  /** `null` for receipt-level fields; the line item id for line-item fields. */
  lineItemId?: string | null;
  aiValue: string | number | null;
  currentValue: string | number | null;
  /**
   * - `'badge'` (default): small AI/Field/Finance Badge — used next to field
   *   labels in `ReceiptCommonEditor`.
   * - `'asterisk'`: red asterisk shown only once a field has been edited
   *   (source !== 'ai') — used inline in `ReceiptLineItemsEditor`.
   */
  variant?: 'badge' | 'asterisk';
}

/** Displays a field's AI/Field/Finance provenance, with a tooltip showing the full change chain. */
export function FieldSourceIndicator({
  history,
  field,
  lineItemId = null,
  aiValue,
  currentValue,
  variant = 'badge',
}: FieldSourceIndicatorProps) {
  const source = getFieldSource(history, field, lineItemId);
  const chain = getChangeChain(history, field, lineItemId, aiValue, currentValue);

  if (variant === 'asterisk') {
    if (source === 'ai') return null;
    return (
      <Tooltip label={chain} multiline maw={280} withArrow>
        <Text component="span" c="red" fw={700} style={{ cursor: 'default' }}>
          *
        </Text>
      </Tooltip>
    );
  }

  return (
    <Tooltip label={chain} multiline maw={280} withArrow>
      <Badge size="xs" color={SOURCE_COLOR[source]} variant="light" style={{ cursor: 'default' }}>
        {SOURCE_LABEL[source]}
      </Badge>
    </Tooltip>
  );
}