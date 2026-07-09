import { createFormContext } from '@mantine/form';
import type { ReceiptSubmissionRequest } from '../../types/ReceiptSubmission';

/**
 * The form's value tree is the entire submission record (not just the
 * `receipt` sub-object), so `ReceiptActions` can mutate `status`/`review` and
 * submit `form.values` directly as the `saveReceipt` payload.
 */
export type ReceiptFormValues = ReceiptSubmissionRequest;

export const [ReceiptFormProvider, useReceiptFormContext, useReceiptForm] =
  createFormContext<ReceiptFormValues>();