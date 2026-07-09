import { useMemo } from 'react';
import { ActionIcon, Button, Card, Group, NumberInput, Table, Text, Textarea, TextInput, Tooltip } from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';

import type { ReceiptAnalysisResponseItems } from '../../types/ReceiptAnalysis';
import type { ReceiptSubmissionRequest } from '../../types/ReceiptSubmission';
import { formatCurrency } from '../../utils/formatters';
import { upsertFinanceHistory } from '../../utils/receiptHistory';
import { FieldSourceIndicator } from './FieldSourceIndicator';
import { useReceiptFormContext } from './receiptFormContext';

export interface ReceiptLineItemsEditorProps {
  original: ReceiptSubmissionRequest;
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

/** Editable line-items table with per-cell change-tracking asterisks. */
export function ReceiptLineItemsEditor({ original }: ReceiptLineItemsEditorProps) {
  const form = useReceiptFormContext();
  const items = form.values.receipt.line_items;
  const history = form.values.history;


  // Define column widths
  const columnWidths = [
    '19%', // SKU/UPC
    '38%', // Title
    '10%', // Qty
    '15%', // Unit Price
    '15%', // Discount
    '17%', // Total
  ];

  const originalById = useMemo(() => {
    const map = new Map<string, ReceiptAnalysisResponseItems>();
    original.receipt.line_items.forEach((i) => map.set(i.id, i));
    return map;
  }, [original]);

  const track = (
    itemId: string,
    field: string,
    originalValue: string | number | null,
    newValue: string | number | null
  ) => {
    form.setFieldValue('history', upsertFinanceHistory(history, { field, lineItemId: itemId, originalValue, newValue }));
  };

  const addLine = () => {
    // Insert at the top of the table, seeded with a fresh id and null fields.
    form.insertListItem(
      'receipt.line_items',
      { id: crypto.randomUUID(), sku_or_upc: null, title: null, unit_price: null, quantity: null, discount: null, total_price: null },
      0
    );
  };

  const removeLine = (index: number) => form.removeListItem('receipt.line_items', index);

  const total = items.reduce((sum, item) => sum + (item.total_price ?? 0), 0);

  return (
    <Card>
      <Group justify="space-between" mb="sm" wrap="wrap">
        <Text fw={600}>Line Items</Text>
        <Tooltip label="Fields marked with * have been edited — hover the asterisk to see the change history" multiline maw={280}>
          <Text size="xs" c="dimmed" style={{ cursor: 'help' }}>
            * edited (hover for change chain)
          </Text>
        </Tooltip>
        <Button size="xs" leftSection={<IconPlus size={14} />} onClick={addLine}>
          Add line
        </Button>
      </Group>

      <Table striped highlightOnHover verticalSpacing="xs">
        <colgroup>
          {columnWidths.map((width, index) => (
            <col key={index} style={{ width }} />
          ))}
          {<col style={{ width: '5%' }} />}
        </colgroup>
        <Table.Thead>
          <Table.Tr>
            <Table.Th >SKU / UPC</Table.Th>
            <Table.Th>Title</Table.Th>
            <Table.Th >Quantity</Table.Th>
            <Table.Th >Unit Price</Table.Th>
            <Table.Th >Total Price</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {items.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={6}>
                <Text ta="center" c="dimmed" py="sm">
                  No line items.
                </Text>
              </Table.Td>
            </Table.Tr>
          ) : (
            items.map((item, index) => {
              const orig = originalById.get(item.id);
              return (
                <Table.Tr key={item.id}>
                  <Table.Td>
                    <Group gap={4} wrap="nowrap">
                      <TextInput
                        value={item.sku_or_upc ?? ''}
                        onChange={(e) =>
                          form.setFieldValue(`receipt.line_items.${index}.sku_or_upc`, e.currentTarget.value || null)
                        }
                        onBlur={(e) =>
                          track(item.id, 'sku_or_upc', orig?.sku_or_upc ?? null, e.currentTarget.value || null)
                        }
                      />
                      <FieldSourceIndicator
                        variant="asterisk"
                        history={history}
                        field="sku_or_upc"
                        lineItemId={item.id}
                        aiValue={orig?.sku_or_upc ?? null}
                        currentValue={item.sku_or_upc}
                      />
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4} wrap="nowrap">
                      <Textarea
                        value={item.title ?? ''}
                        style={{ flex: 1 }}
                        autosize
                        minRows={1}
                        onChange={(e) => form.setFieldValue(`receipt.line_items.${index}.title`, e.currentTarget.value || null)}
                        onBlur={(e) => track(item.id, 'title', orig?.title ?? null, e.currentTarget.value || null)}
                      />
                      <FieldSourceIndicator
                        variant="asterisk"
                        history={history}
                        field="title"
                        lineItemId={item.id}
                        aiValue={orig?.title ?? null}
                        currentValue={item.title}
                      />
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4} wrap="nowrap">
                      <NumberInput
                        value={item.quantity ?? undefined}
                        onChange={(v) => form.setFieldValue(`receipt.line_items.${index}.quantity`, toNumOrNull(v))}
                        onBlur={() => track(item.id, 'quantity', orig?.quantity ?? null, item.quantity)}
                      />
                      <FieldSourceIndicator
                        variant="asterisk"
                        history={history}
                        field="quantity"
                        lineItemId={item.id}
                        aiValue={orig?.quantity ?? null}
                        currentValue={item.quantity}
                      />
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4} wrap="nowrap">
                      <NumberInput
                        decimalScale={2}
                        fixedDecimalScale
                        prefix="$"
                        value={item.unit_price ?? undefined}
                        onChange={(v) => form.setFieldValue(`receipt.line_items.${index}.unit_price`, toNumOrNull(v))}
                        onBlur={() => track(item.id, 'unit_price', orig?.unit_price ?? null, item.unit_price)}
                      />
                      <FieldSourceIndicator
                        variant="asterisk"
                        history={history}
                        field="unit_price"
                        lineItemId={item.id}
                        aiValue={orig?.unit_price ?? null}
                        currentValue={item.unit_price}
                      />
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4} wrap="nowrap">
                      <NumberInput
                        decimalScale={2}
                        fixedDecimalScale
                        prefix="$"
                        value={item.total_price ?? undefined}
                        onChange={(v) => form.setFieldValue(`receipt.line_items.${index}.total_price`, toNumOrNull(v))}
                        onBlur={() => track(item.id, 'total_price', orig?.total_price ?? null, item.total_price)}
                      />
                      <FieldSourceIndicator
                        variant="asterisk"
                        history={history}
                        field="total_price"
                        lineItemId={item.id}
                        aiValue={orig?.total_price ?? null}
                        currentValue={item.total_price}
                      />
                    </Group>
                  </Table.Td>

                  <Table.Td>
                    <ActionIcon
                      color="red"
                      variant="subtle"
                      onClick={() => removeLine(index)}
                      aria-label="Remove line item"
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              );
            })
          )}
        </Table.Tbody>
      </Table>

      <Group justify="flex-end" mt="sm">
        <Text fw={600}>Σ line items: {formatCurrency(total)}</Text>
      </Group>
    </Card>
  );
}