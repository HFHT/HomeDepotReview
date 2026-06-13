/**
 * @file Editable line-item table. Each cell is an input; edited cells show a
 * `*` marker (hover for the change chain). Supports add/remove.
 */
import { ActionIcon, Button, Group, NumberInput, Paper, Select, Table, Text, TextInput } from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import type { Receipt } from '../services/receiptTypes';
import { useReceiptStore, type LineFieldKey } from '../stores/receiptStore';
import { useCurrentUser } from './useCurrentUser';
import { currency } from '../services/format';
import { JSX } from 'react/jsx-runtime';
import { ChangeMarker } from './ChainTooltip';

/** Controlled category options (replace with a Sage-mapped list when available). */
const CATEGORY_OPTIONS = ['Materials', 'Hardware', 'Tools', 'Rental', 'Other'].map((c) => ({ value: c, label: c }));

/** Props for {@link LineItemsEditor}. */
interface LineItemsEditorProps {
  /** Receipt draft being edited. */
  receipt: Receipt;
}

/**
 * Renders the editable line-items table beneath the receipt detail grid.
 * @param props - {@link LineItemsEditorProps}.
 */
export function LineItemsEditor({ receipt }: LineItemsEditorProps): JSX.Element {
  const by = useCurrentUser();
  const editLineItemField = useReceiptStore((s) => s.editLineItemField);
  const addLineItem = useReceiptStore((s) => s.addLineItem);
  const removeLineItem = useReceiptStore((s) => s.removeLineItem);

  const edit = (i: number, key: LineFieldKey, value: string | number | null) => editLineItemField(i, key, value, by);
  const lineSum = receipt.lineItems.reduce((acc, li) => acc + (li.total || 0), 0);

  return (
    <Paper withBorder radius="md" p="md">
      <Group justify="space-between" mb="xs">
        <Text fw={600}>Line Items</Text>
        <Group gap="xs">
          <Text size="xs" c="dimmed">
            * = edited · hover for change chain
          </Text>
          <Button size="xs" variant="light" leftSection={<IconPlus size={14} />} onClick={addLineItem}>
            Add line
          </Button>
        </Group>
      </Group>

      <Table withColumnBorders verticalSpacing={4} horizontalSpacing={6}>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Description</Table.Th>
            <Table.Th w={70}>Qty</Table.Th>
            <Table.Th w={100}>Unit $</Table.Th>
            <Table.Th w={100}>Total</Table.Th>
            <Table.Th w={110}>SKU/UPC</Table.Th>
            <Table.Th w={130}>Category</Table.Th>
            <Table.Th w={40} />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {receipt.lineItems.map((li, i) => (
            <Table.Tr key={i}>
              <Table.Td>
                <Group gap={0} wrap="nowrap">
                  <TextInput variant="unstyled" value={li.description} onChange={(e) => edit(i, 'description', e.currentTarget.value)} />
                  <ChangeMarker receipt={receipt} fieldKey="description" lineItemIndex={i} />
                </Group>
              </Table.Td>
              <Table.Td>
                <Group gap={0} wrap="nowrap">
                  <NumberInput variant="unstyled" value={li.quantity} onChange={(v) => edit(i, 'quantity', Number(v) || 0)} min={0} hideControls />
                  <ChangeMarker receipt={receipt} fieldKey="quantity" lineItemIndex={i} />
                </Group>
              </Table.Td>
              <Table.Td>
                <Group gap={0} wrap="nowrap">
                  <NumberInput variant="unstyled" value={li.unitPrice} onChange={(v) => edit(i, 'unitPrice', Number(v) || 0)} prefix="$" decimalScale={2} hideControls />
                  <ChangeMarker receipt={receipt} fieldKey="unitPrice" lineItemIndex={i} />
                </Group>
              </Table.Td>
              <Table.Td>
                <Group gap={0} wrap="nowrap">
                  <NumberInput variant="unstyled" value={li.total} onChange={(v) => edit(i, 'total', Number(v) || 0)} prefix="$" decimalScale={2} hideControls />
                  <ChangeMarker receipt={receipt} fieldKey="total" lineItemIndex={i} />
                </Group>
              </Table.Td>
              <Table.Td>
                <Group gap={0} wrap="nowrap">
                  <TextInput variant="unstyled" value={li.sku_or_upc ?? ''} onChange={(e) => edit(i, 'sku_or_upc', e.currentTarget.value || null)} />
                  <ChangeMarker receipt={receipt} fieldKey="sku_or_upc" lineItemIndex={i} />
                </Group>
              </Table.Td>
              <Table.Td>
                <Group gap={0} wrap="nowrap">
                  <Select variant="unstyled" data={CATEGORY_OPTIONS} value={li.category} onChange={(v) => edit(i, 'category', v)} placeholder="—" />
                  <ChangeMarker receipt={receipt} fieldKey="category" lineItemIndex={i} />
                </Group>
              </Table.Td>
              <Table.Td>
                <ActionIcon variant="subtle" color="red" onClick={() => removeLineItem(i)} aria-label="Remove line">
                  <IconTrash size={14} />
                </ActionIcon>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <Group justify="flex-end" mt="xs">
        <Text fw={600}>Σ line items: {currency(lineSum)}</Text>
      </Group>
    </Paper>
  );
}