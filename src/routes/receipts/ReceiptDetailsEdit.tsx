import { Stack } from '@mantine/core';

import type { ReceiptSubmissionRequest } from '../../types/ReceiptSubmission';
import { HistoryAccordions } from './HistoryAccordions';
import { ReceiptCommonEditor } from './ReceiptCommonEditor';
import { ReceiptLineItemsEditor } from './ReceiptLineItemsEditor';
import { SageEntryPanel } from './SageEntryPanel';

export interface ReceiptDetailsEditProps {
  original: ReceiptSubmissionRequest;
}

/** Right-column stack: common fields, line items, Sage entry, and history. */
export function ReceiptDetailsEdit({ original }: ReceiptDetailsEditProps) {
  return (
    <Stack gap="md">
      <ReceiptCommonEditor original={original} />
      <ReceiptLineItemsEditor original={original} />
      <SageEntryPanel />
      <HistoryAccordions />
    </Stack>
  );
}