
// /**
//  * @file Editable line-item table backed by a Mantine `useForm` list
//  * (uncontrolled). Keystrokes buffer in the form; text/number cells commit to
//  * the store on blur, a 500ms debounce, or route-unload. The Category `Select`
//  * commits immediately on change. Add/remove maintain stable `lineItemKey`s and
//  * the audit trail.
//  */
// import { useEffect, useRef } from 'react';
// import type { JSX } from 'react';
// import { ActionIcon, Button, Group, NumberInput, Paper, Select, Table, Text, TextInput } from '@mantine/core';
// import { useForm } from '@mantine/form';
// import { IconPlus, IconTrash } from '@tabler/icons-react';
// import type { LineItem, Receipt } from '../services/receiptTypes';
// import { useReceiptStore, createLineItem, type LineFieldKey } from '../stores/receiptStore';
// import { useCurrentUser } from './useCurrentUser';
// import { useDebouncedFlush } from './useDebouncedFlush';
// import { currency } from '../services/format';
// import { ChangeMarker } from './ChainTooltip';

// /** Controlled category options (replace with a Sage-mapped list when available). */
// const CATEGORY_OPTIONS = ['Materials', 'Hardware', 'Tools', 'Rental', 'Other'].map((c) => ({ value: c, label: c }));

// /** Cells committed on blur (Category is handled immediately via onChange). */
// const BLUR_KEYS: LineFieldKey[] = ['description', 'quantity', 'unitPrice', 'total', 'sku_or_upc'];

// /** Props for {@link LineItemsEditor}. */
// interface LineItemsEditorProps {
//   /** Receipt draft being edited. */
//   receipt: Receipt;
// }

// /** Local (buffered) line-items form shape. */
// interface LineItemsFormValues {
//   lineItems: LineItem[];
// }

// /** Hard-validation gate for the action bar. */
// const computeValid = (lines: LineItem[]): boolean =>
//   lines.every((li) => li.description.trim().length > 0 && li.total > 0);

// /**
//  * Renders the editable line-items table beneath the receipt detail grid.
//  * @param props - {@link LineItemsEditorProps}.
//  */
// export function LineItemsEditor({ receipt }: LineItemsEditorProps): JSX.Element {
//   const by = useCurrentUser();
//   const editLineItemField = useReceiptStore((s) => s.editLineItemField);
//   const addLineItem = useReceiptStore((s) => s.addLineItem);
//   const removeLineItem = useReceiptStore((s) => s.removeLineItem);
//   const setSectionValidity = useReceiptStore((s) => s.setSectionValidity);

//   // Last values committed to the store, keyed by lineItemKey.
//   const committed = useRef<Map<string, LineItem>>(
//     new Map(receipt.lineItems.map((li) => [li.lineItemKey, { ...li }])),
//   );

//   const flushAllRef = useRef<() => void>(() => { });
//   const { schedule, flushNow } = useDebouncedFlush(() => flushAllRef.current());

//   const form = useForm<LineItemsFormValues>({
//     mode: 'uncontrolled',
//     initialValues: { lineItems: receipt.lineItems.map((li) => ({ ...li })) },
//     validate: {
//       lineItems: {
//         description: (v: string) => (v && v.trim() ? null : 'Required'),
//         total: (v: number) => (v > 0 ? null : 'Must be > 0'),
//       },
//     },
//     onValuesChange: (values) => {
//       setSectionValidity('lineItems', computeValid(values.lineItems));
//       schedule();
//     },
//   });

//   /** Commits all dirty + valid blur-cells to the store. */
//   const flushAll = () => {
//     const lines = form.getValues().lineItems;
//     lines.forEach((line, index) => {
//       const prev = committed.current.get(line.lineItemKey);
//       BLUR_KEYS.forEach((key) => {
//         if (prev && prev[key] === line[key]) return;
//         const { hasError } = form.validateField(`lineItems.${index}.${key}`);
//         if (hasError) return; // do not persist invalid cells
//         editLineItemField(line.lineItemKey, key, line[key] as string | number | null, by);
//       });
//       committed.current.set(line.lineItemKey, { ...line });
//     });
//   };
//   flushAllRef.current = flushAll;

//   // Reset the buffer when navigating to a different receipt.
//   useEffect(() => {
//     const next = receipt.lineItems.map((li) => ({ ...li }));
//     form.setValues({ lineItems: next });
//     form.resetDirty({ lineItems: next });
//     committed.current = new Map(next.map((li) => [li.lineItemKey, { ...li }]));
//     setSectionValidity('lineItems', computeValid(next));
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [receipt._id]);

//   /** Commits Category immediately (Select is discrete, no per-keystroke concern). */
//   const handleCategory = (index: number, value: string | null) => {
//     form.setFieldValue(`lineItems.${index}.category`, value);
//     const line = form.getValues().lineItems[index];
//     editLineItemField(line.lineItemKey, 'category', value, by);
//     committed.current.set(line.lineItemKey, { ...line, category: value });
//   };

//   /** Adds a new (web-created) line with a fresh UUID key. */
//   const handleAdd = () => {
//     const line = createLineItem();
//     form.insertListItem('lineItems', line);
//     addLineItem(line);
//     committed.current.set(line.lineItemKey, { ...line });
//   };

//   /** Removes a line by key; the store records a "line item removed" audit entry. */
//   const handleRemove = (index: number) => {
//     const line = form.getValues().lineItems[index];
//     form.removeListItem('lineItems', index);
//     removeLineItem(line.lineItemKey, by);
//     committed.current.delete(line.lineItemKey);
//   };

//   /** Spread props (no key) + flush on blur. Pass `key` separately in JSX. */
//   const cell = (index: number, key: LineFieldKey) => ({
//     ...form.getInputProps(`lineItems.${index}.${key}`),
//     onBlur: () => flushNow(),
//   });

//   const lines = form.getValues().lineItems;
//   const lineSum = receipt.lineItems.reduce((acc, li) => acc + (li.total || 0), 0);

//   return (
//     <Paper withBorder radius="md" p="md">
//       <Group justify="space-between" mb="xs">
//         <Text fw={600}>Line Items</Text>
//         <Group gap="xs">
//           <Text size="xs" c="dimmed">
//             * = edited · hover for change chain
//           </Text>
//           <Button size="xs" variant="light" leftSection={<IconPlus size={14} />} onClick={handleAdd}>
//             Add line
//           </Button>
//         </Group>
//       </Group>

//       <Table withColumnBorders verticalSpacing={4} horizontalSpacing={6}>
//         <Table.Thead>
//           <Table.Tr>
//             <Table.Th>Description</Table.Th>
//             <Table.Th w={70}>Qty</Table.Th>
//             <Table.Th w={100}>Unit $</Table.Th>
//             <Table.Th w={100}>Total</Table.Th>
//             <Table.Th w={110}>SKU/UPC</Table.Th>
//             <Table.Th w={130}>Category</Table.Th>
//             <Table.Th w={40} />
//           </Table.Tr>
//         </Table.Thead>
//         <Table.Tbody>
//           {lines.map((li, i) => (
//             <Table.Tr key={li.lineItemKey}>
//               <Table.Td>
//                 <Group gap={0} wrap="nowrap">
//                   <TextInput variant="unstyled" key={form.key(`lineItems.${i}.description`)} {...cell(i, 'description')} />                  <ChangeMarker receipt={receipt} fieldKey="description" lineItemKey={li.lineItemKey} />
//                 </Group>
//               </Table.Td>
//               <Table.Td>
//                 <Group gap={0} wrap="nowrap">
//                   <NumberInput variant="unstyled" key={form.key(`lineItems.${i}.quantity`)} {...cell(i, 'quantity')} min={0} hideControls />                  <ChangeMarker receipt={receipt} fieldKey="quantity" lineItemKey={li.lineItemKey} />
//                 </Group>
//               </Table.Td>
//               <Table.Td>
//                 <Group gap={0} wrap="nowrap">
//                   <NumberInput variant="unstyled" key={form.key(`lineItems.${i}.unitPrice`)} {...cell(i, 'unitPrice')} prefix="$" decimalScale={2} hideControls />                  <ChangeMarker receipt={receipt} fieldKey="unitPrice" lineItemKey={li.lineItemKey} />
//                 </Group>
//               </Table.Td>
//               <Table.Td>
//                 <Group gap={0} wrap="nowrap">
//                   <NumberInput variant="unstyled" key={form.key(`lineItems.${i}.total`)} {...cell(i, 'total')} prefix="$" decimalScale={2} hideControls />                  <ChangeMarker receipt={receipt} fieldKey="total" lineItemKey={li.lineItemKey} />
//                 </Group>
//               </Table.Td>
//               <Table.Td>
//                 <Group gap={0} wrap="nowrap">
//                   <TextInput variant="unstyled" key={form.key(`lineItems.${i}.sku_or_upc`)} {...cell(i, 'sku_or_upc')} />                  <ChangeMarker receipt={receipt} fieldKey="sku_or_upc" lineItemKey={li.lineItemKey} />
//                 </Group>
//               </Table.Td>
//               <Table.Td>
//                 <Group gap={0} wrap="nowrap">
//                   <Select
//                     variant="unstyled"
//                     data={CATEGORY_OPTIONS}
//                     key={form.key(`lineItems.${i}.category`)}
//                     defaultValue={li.category}
//                     onChange={(v) => handleCategory(i, v)}
//                     placeholder="—"
//                   />
//                   <ChangeMarker receipt={receipt} fieldKey="category" lineItemKey={li.lineItemKey} />
//                 </Group>
//               </Table.Td>
//               <Table.Td>
//                 <ActionIcon variant="subtle" color="red" onClick={() => handleRemove(i)} aria-label="Remove line">
//                   <IconTrash size={14} />
//                 </ActionIcon>
//               </Table.Td>
//             </Table.Tr>
//           ))}
//         </Table.Tbody>
//       </Table>

//       <Group justify="flex-end" mt="xs">
//         <Text fw={600}>Σ line items: {currency(lineSum)}</Text>
//       </Group>
//     </Paper>
//   );
// }