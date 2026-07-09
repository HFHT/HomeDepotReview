
// /**
//  * @file Full-width Sage 100 Cloud entry panel. No audit history is kept for
//  * these fields, so values write straight through to the store. A Mantine
//  * `useForm` provides validation only, reporting the `sage` validity flag used to
//  * gate "Mark Entered".
//  */
// import { useEffect } from 'react';
// import type { JSX } from 'react';
// import { Grid, Paper, Textarea, TextInput, Title } from '@mantine/core';
// import { DateInput } from '@mantine/dates';
// import { useForm } from '@mantine/form';
// import type { Receipt } from '../services/receiptTypes';
// import { useReceiptStore } from '../stores/receiptStore';

// /** Props for {@link SageEntryPanel}. */
// interface SageEntryPanelProps {
//   /** Receipt draft being edited. */
//   receipt: Receipt;
// }

// /** Local Sage form shape. */
// interface SageFormValues {
//   sageReference: string;
//   postingDate: string; // full ISO string
//   notes: string;
// }

// /** Builds initial Sage form values from the receipt. */
// const buildValues = (r: Receipt): SageFormValues => ({
//   sageReference: r.sageEntryMetadata.sageReference ?? '',
//   postingDate: r.sageEntryMetadata.postingDate ?? '',
//   notes: r.sageEntryMetadata.notes ?? '',
// });

// /** Hard-validation gate to allow "Mark Entered". */
// const computeValid = (v: SageFormValues): boolean =>
//   Boolean(v.sageReference.trim()) && Boolean(v.postingDate);

// /**
//  * Renders the Sage entry capture panel.
//  * @param props - {@link SageEntryPanelProps}.
//  */
// export function SageEntryPanel({ receipt }: SageEntryPanelProps): JSX.Element {
//   const setSage = useReceiptStore((s) => s.setSage);
//   const setSectionValidity = useReceiptStore((s) => s.setSectionValidity);

//   const form = useForm<SageFormValues>({
//     mode: 'uncontrolled',
//     initialValues: buildValues(receipt),
//     validateInputOnBlur: true,
//     validate: {
//       sageReference: (v) => (v.trim() ? null : 'Sage reference is required'),
//       postingDate: (v) => (v ? null : 'Posting date is required'),
//     },
//     // No audit trail for Sage fields → safe to write through on every change.
//     onValuesChange: (values) => {
//       setSage({
//         sageReference: values.sageReference || null,
//         postingDate: values.postingDate || null,
//         notes: values.notes || null,
//       });
//       setSectionValidity('sage', computeValid(values));
//     },
//   });

//   // Reset when navigating to a different receipt.
//   useEffect(() => {
//     const next = buildValues(receipt);
//     form.setValues(next);
//     form.resetDirty(next);
//     setSectionValidity('sage', computeValid(next));
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [receipt._id]);

//   return (
//     <Paper withBorder radius="md" p="md">
//       <Title order={4} mb="sm">
//         Sage 100 Cloud Entry
//       </Title>
//       <Grid gap="md" align="flex-end">
//         <Grid.Col span={4}>
//           <TextInput label="Sage Reference #" {...form.getInputProps('sageReference')} key={form.key('sageReference')} />
//         </Grid.Col>
//         <Grid.Col span={4}>
//           <DateInput
//             label="Posting Date"
//             valueFormat="MM/DD/YYYY"
//             key={form.key('postingDate')}
//             defaultValue={receipt.sageEntryMetadata.postingDate || null}
//             error={form.errors.postingDate}
//             onDateChange={(date) =>
//               form.setFieldValue('postingDate', date ? new Date(date).toISOString() : '')
//             }
//           />
//         </Grid.Col>
//         <Grid.Col span={12}>
//           <Textarea label="Notes" autosize minRows={2} {...form.getInputProps('notes')} key={form.key('notes')} />
//         </Grid.Col>
//       </Grid>
//     </Paper>
//   );
// }