
// /**
//  * @file Editable 3-column receipt header grid backed by a Mantine `useForm`
//  * (uncontrolled). Keystrokes buffer in the form; the store is updated on blur,
//  * a 500ms debounce, or route-unload. Validation gates persistence + the
//  * action-bar buttons; the subtotal/line-sum mismatch is a soft (non-blocking) fail.
//  */
// import { useEffect, useRef } from 'react';
// import type { JSX } from 'react';
// import { Alert, Grid, NumberInput, Paper, TextInput } from '@mantine/core';
// import { DateInput } from '@mantine/dates';
// import { useForm } from '@mantine/form';
// import { IconAlertTriangle } from '@tabler/icons-react';
// import type { Receipt } from '../services/receiptTypes';
// import { useReceiptStore, type HeaderFieldKey } from '../stores/receiptStore';
// import { useCurrentUser } from './useCurrentUser';
// import { useDebouncedFlush } from './useDebouncedFlush';
// import { SourcedField } from './SourcedField';
// import { currency } from '../services/format';

// /** Props for {@link ReceiptDetailFields}. */
// interface ReceiptDetailFieldsProps {
//   /** Receipt draft being edited. */
//   receipt: Receipt;
// }

// /** Local (buffered) header form shape. */
// interface HeaderFormValues {
//   storeNumber: string;
//   receiptNumber: string;
//   receiptDate: string; // full ISO string
//   receiptPO: string;
//   receiptSubtotal: number;
//   receiptTax: number;
//   receiptDiscount: number;
//   receiptTotal: number;
//   receiptBalanceDue: number;
// }

// /** Builds initial form values from a receipt. */
// const buildValues = (r: Receipt): HeaderFormValues => ({
//   storeNumber: r.storeNumber ?? '',
//   receiptNumber: r.receiptNumber ?? '',
//   receiptDate: r.receiptDate ?? '',
//   receiptPO: r.receiptPO ?? '',
//   receiptSubtotal: r.receiptSubtotal ?? 0,
//   receiptTax: r.receiptTax ?? 0,
//   receiptDiscount: r.receiptDiscount ?? 0,
//   receiptTotal: r.receiptTotal ?? 0,
//   receiptBalanceDue: r.receiptBalanceDue ?? 0,
// });

// /** Hard-validation gate for the action bar. */
// const computeValid = (v: HeaderFormValues): boolean =>
//   v.receiptNumber.trim().length >= 2 && Boolean(v.receiptDate) && v.receiptTotal > 0;

// /**
//  * Renders the editable 3-column receipt header block + soft totals mismatch alert.
//  * @param props - {@link ReceiptDetailFieldsProps}.
//  */
// export function ReceiptDetailFields({ receipt }: ReceiptDetailFieldsProps): JSX.Element {
//   const by = useCurrentUser();
//   const editHeaderField = useReceiptStore((s) => s.editHeaderField);
//   const setSectionValidity = useReceiptStore((s) => s.setSectionValidity);

//   // Last values committed to the store, so we only emit real changes.
//   const committed = useRef<HeaderFormValues>(buildValues(receipt));

//   // Indirection ref avoids use-before-declare between schedule and flushAll.
//   const flushAllRef = useRef<() => void>(() => { });
//   const { schedule, flushNow } = useDebouncedFlush(() => flushAllRef.current());

//   const form = useForm<HeaderFormValues>({
//     mode: 'uncontrolled',
//     initialValues: buildValues(receipt),
//     validate: {
//       receiptNumber: (v) => (v.trim().length >= 2 ? null : 'Receipt # must be at least 2 characters'),
//       receiptDate: (v) => (v ? null : 'Receipt date is required'),
//       receiptTotal: (v) => (v > 0 ? null : 'Total must be greater than 0'),
//     },
//     onValuesChange: (values) => {
//       setSectionValidity('details', computeValid(values));
//       schedule();
//     },
//   });

//   /** Commits all dirty + valid header fields to the store. */
//   const flushAll = () => {
//     const values = form.getValues();
//     (Object.keys(values) as (keyof HeaderFormValues)[]).forEach((key) => {
//       if (values[key] === committed.current[key]) return;
//       const { hasError } = form.validateField(key);
//       if (hasError) return; // do not persist invalid fields
//       editHeaderField(key as HeaderFieldKey, values[key], by);
//       committed.current = { ...committed.current, [key]: values[key] };
//     });
//   };
//   flushAllRef.current = flushAll;

//   // Reset the buffer when navigating to a different receipt.
//   useEffect(() => {
//     const next = buildValues(receipt);
//     form.setValues(next);
//     form.resetDirty(next);
//     committed.current = next;
//     setSectionValidity('details', computeValid(next));
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [receipt._id]);

//   const lineSum = receipt.lineItems.reduce((acc, li) => acc + (li.total || 0), 0);
//   const subtotal = receipt.receiptTotal - receipt.receiptTax + receipt.receiptDiscount;
//   const mismatch = Math.abs(lineSum - subtotal) > 0.01;

//   /** Spread props (no key) + flush on blur. Pass `key` separately in JSX. */
//   const field = (key: HeaderFieldKey) => ({
//     ...form.getInputProps(key),
//     onBlur: () => flushNow(),
//   });

//   return (
//     <Paper withBorder radius="md" p="md">
//       <Grid gap="sm">
//         <Grid.Col span={3}>
//           <SourcedField label="Store #" fieldKey="storeNumber" receipt={receipt}>
//             <TextInput key={form.key('storeNumber')} {...field('storeNumber')} />
//           </SourcedField>
//         </Grid.Col>
//         <Grid.Col span={3}>
//           <SourcedField label="Receipt #" fieldKey="receiptNumber" receipt={receipt}>
//             <TextInput key={form.key('receiptNumber')} {...field('receiptNumber')} />
//           </SourcedField>
//         </Grid.Col>
//         <Grid.Col span={3}>
//           <SourcedField label="Receipt Date" fieldKey="receiptDate" receipt={receipt}>
//             <DateInput
//               key={form.key('receiptDate')}
//               defaultValue={receipt.receiptDate || null}
//               valueFormat="MM/DD/YYYY"
//               error={form.errors.receiptDate}
//               // DateInput is a discrete control: persist immediately, as full ISO.
//               onDateChange={(date) => {
//                 form.setFieldValue('receiptDate', date ? new Date(date).toISOString() : '');
//                 flushNow();
//               }}
//             />
//           </SourcedField>
//         </Grid.Col>
//         <Grid.Col span={3}>
//           <SourcedField label="PO/Job #" fieldKey="receiptPO" receipt={receipt}>
//             <TextInput key={form.key('receiptPO')} {...field('receiptPO')} />
//           </SourcedField>
//         </Grid.Col>

//         <Grid.Col span={3}>
//           <SourcedField label="Subtotal" fieldKey="receiptSubtotal" receipt={receipt}>
//             <NumberInput key={form.key('receiptSubtotal')} {...field('receiptSubtotal')} prefix="$" decimalScale={2} fixedDecimalScale />
//           </SourcedField>
//         </Grid.Col>
//         <Grid.Col span={3}>
//           <SourcedField label="Tax" fieldKey="receiptTax" receipt={receipt}>
//             <NumberInput key={form.key('receiptTax')} {...field('receiptTax')} prefix="$" decimalScale={2} fixedDecimalScale />
//           </SourcedField>
//         </Grid.Col>
//         <Grid.Col span={3}>
//           <SourcedField label="Discount" fieldKey="receiptDiscount" receipt={receipt}>
//             <NumberInput key={form.key('receiptDiscount')} {...field('receiptDiscount')} prefix="$" decimalScale={2} fixedDecimalScale />
//           </SourcedField>
//         </Grid.Col>
//         <Grid.Col span={3}>
//           <SourcedField label="Total" fieldKey="receiptTotal" receipt={receipt}>
//             <NumberInput key={form.key('receiptTotal')} {...field('receiptTotal')} prefix="$" decimalScale={2} fixedDecimalScale />
//           </SourcedField>
//         </Grid.Col>
//       </Grid>

//       {receipt.receiptBalanceDue > 0 && (
//         <Alert mt="sm" color="yellow" icon={<IconAlertTriangle size={16} />} variant="light">
//           <SourcedField label="Balance Due" fieldKey="receiptBalanceDue" receipt={receipt}>
//             <NumberInput key={form.key('receiptBalanceDue')} {...field('receiptBalanceDue')} prefix="$" decimalScale={2} fixedDecimalScale />          </SourcedField>
//         </Alert>
//       )}

//       {mismatch && (
//         <Alert mt="sm" color="yellow" icon={<IconAlertTriangle size={16} />} variant="light">
//           Total {currency(receipt.receiptSubtotal)} ≠ Σ line items {currency(lineSum)}.
//         </Alert>
//       )}
//     </Paper>
//   );
// }