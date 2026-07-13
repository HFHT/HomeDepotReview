import { ActionIcon, Button, Card, Group, NumberInput, SimpleGrid, Stack, Table, Textarea, TextInput } from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { UseFormReturnType } from '@mantine/form';
import { ReceiptAnalysisResponse, ReceiptAnalysisResponseItems } from '../../../types/ReceiptAnalysis';
import { FieldLabel } from './FieldLabel';

interface ReceiptLineItemsSectionProps {
  form: UseFormReturnType<ReceiptAnalysisResponse>;
  readOnly?: boolean;
  isLineItemFieldEdited: (id: string, field: keyof ReceiptAnalysisResponseItems) => boolean;
}

function emptyLineItem(): ReceiptAnalysisResponseItems {
  return {
    id: crypto.randomUUID(),
    sku_or_upc: null,
    model: null,
    title: null,
    unit_price: null,
    quantity: null,
    discount: null,
    total_price: null,
  };
}

/**
 * Renders the editable (or read-only) line-item table, with add/remove
 * support and per-field "Edited" indicators.
 *
 * A dense multi-column table doesn't fit on a phone screen, so below the
 * `sm` breakpoint each line item instead renders as a stacked card. Both
 * layouts bind to the same form state, so editing works identically either
 * way.
 */
export function ReceiptLineItemsSection({
  form,
  readOnly,
  isLineItemFieldEdited,
}: ReceiptLineItemsSectionProps) {
  const items = form.values.line_items;

  const removeItem = (index: number) => form.removeListItem('line_items', index);
  const addItem = () => form.insertListItem('line_items', emptyLineItem());

  // Define column widths
  const columnWidths = [
    '19%', // SKU/UPC
    '38%', // Title
    '10%', // Qty
    '15%', // Unit Price
    '15%', // Discount
    '17%', // Total
  ];
  return (
    <Stack gap="sm">
      <Group justify="space-between">
        <strong>Line Items</strong>
        {!readOnly && (
          <Button size="xs" variant="light" leftSection={<IconPlus size={14} />} onClick={addItem}>
            Add line item
          </Button>
        )}
      </Group>

      {/* --- Phone layout: one card per line item --- */}
      <Stack gap="sm" hiddenFrom="sm">
        {items.map((item, index) => (
          <Card key={item.id} withBorder padding="sm" radius="md">
            <Stack gap="xs">
              <Group justify="space-between" align="flex-start" wrap="nowrap">
                <Textarea
                  readOnly={readOnly}
                  size="sm"
                  label={<FieldLabel label="Title" edited={isLineItemFieldEdited(item.id, 'title')} />}
                  style={{ flex: 1 }}
                  autosize
                  minRows={1}
                  {...form.getInputProps(`line_items.${index}.title` as never)}
                />
                {!readOnly && (
                  <ActionIcon
                    color="red"
                    variant="subtle"
                    mt={24}
                    onClick={() => removeItem(index)}
                    aria-label="Delete line item"
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                )}
              </Group>

              <TextInput
                readOnly={readOnly}
                size="sm"
                label={<FieldLabel label="SKU/UPC" edited={isLineItemFieldEdited(item.id, 'sku_or_upc')} />}
                {...form.getInputProps(`line_items.${index}.sku_or_upc` as never)}
              />

              <SimpleGrid cols={2} spacing="xs">
                <NumberInput
                  readOnly={readOnly}
                  size="sm"
                  label={<FieldLabel label="Qty" edited={isLineItemFieldEdited(item.id, 'quantity')} />}
                  min={0}
                  {...form.getInputProps(`line_items.${index}.quantity` as never)}
                />
                <NumberInput
                  readOnly={readOnly}
                  size="sm"
                  label={<FieldLabel label="Unit Price" edited={isLineItemFieldEdited(item.id, 'unit_price')} />}
                  prefix="$"
                  decimalScale={2}
                  {...form.getInputProps(`line_items.${index}.unit_price` as never)}
                />
                <NumberInput
                  readOnly={readOnly}
                  size="sm"
                  label={<FieldLabel label="Discount" edited={isLineItemFieldEdited(item.id, 'discount')} />}
                  prefix="$"
                  decimalScale={2}
                  {...form.getInputProps(`line_items.${index}.discount` as never)}
                />
                <NumberInput
                  readOnly={readOnly}
                  size="sm"
                  label={<FieldLabel label="Total" edited={isLineItemFieldEdited(item.id, 'total_price')} />}
                  prefix="$"
                  decimalScale={2}
                  {...form.getInputProps(`line_items.${index}.total_price` as never)}
                />
              </SimpleGrid>
            </Stack>
          </Card>
        ))}
      </Stack>

      {/* --- Tablet/desktop layout: table --- */}
      <Table striped withTableBorder verticalSpacing="xs" visibleFrom="sm">
        <colgroup>
          {columnWidths.map((width, index) => (
            <col key={index} style={{ width }} />
          ))}
          {!readOnly && <col style={{ width: '5%' }} />}
        </colgroup>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>SKU/UPC</Table.Th>
            <Table.Th>Title</Table.Th>
            <Table.Th>Qty</Table.Th>
            <Table.Th>Unit Price</Table.Th>
            <Table.Th>Discount</Table.Th>
            <Table.Th>Total</Table.Th>
            {!readOnly && <Table.Th />}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {items.map((item, index) => (
            <Table.Tr key={item.id}>
              <Table.Td>
                <TextInput
                  readOnly={readOnly}
                  size="xs"
                  label={<FieldLabel edited={isLineItemFieldEdited(item.id, 'sku_or_upc')} />}
                  {...form.getInputProps(`line_items.${index}.sku_or_upc` as never)}
                />
              </Table.Td>
              <Table.Td>
                {/* <TextInput
                  readOnly={readOnly}
                  size="xs"
                  label={<FieldLabel edited={isLineItemFieldEdited(item.id, 'title')} />}
                  {...form.getInputProps(`line_items.${index}.title` as never)}
                /> */}
                <Textarea
                  readOnly={readOnly}
                  size="xs"
                  label={<FieldLabel label="Title" edited={isLineItemFieldEdited(item.id, 'title')} />}
                  style={{ flex: 1 }}
                  autosize
                  minRows={1}
                  {...form.getInputProps(`line_items.${index}.title` as never)}
                />
              </Table.Td>
              <Table.Td>
                <NumberInput
                  readOnly={readOnly}
                  size="xs"
                  label={<FieldLabel edited={isLineItemFieldEdited(item.id, 'quantity')} />}
                  min={0}
                  w={90}
                  {...form.getInputProps(`line_items.${index}.quantity` as never)}
                />
              </Table.Td>
              <Table.Td>
                <NumberInput
                  readOnly={readOnly}
                  size="xs"
                  label={<FieldLabel edited={isLineItemFieldEdited(item.id, 'unit_price')} />}
                  prefix="$"
                  decimalScale={2}
                  w={100}
                  {...form.getInputProps(`line_items.${index}.unit_price` as never)}
                />
              </Table.Td>
              <Table.Td>
                <NumberInput
                  readOnly={readOnly}
                  size="xs"
                  label={<FieldLabel edited={isLineItemFieldEdited(item.id, 'discount')} />}
                  prefix="$"
                  decimalScale={2}
                  w={100}
                  {...form.getInputProps(`line_items.${index}.discount` as never)}
                />
              </Table.Td>
              <Table.Td>
                <NumberInput
                  readOnly={readOnly}
                  size="xs"
                  label={<FieldLabel edited={isLineItemFieldEdited(item.id, 'total_price')} />}
                  prefix="$"
                  decimalScale={2}
                  w={100}
                  {...form.getInputProps(`line_items.${index}.total_price` as never)}
                />
              </Table.Td>
              {!readOnly && (
                <Table.Td>
                  <ActionIcon
                    color="red"
                    variant="subtle"
                    onClick={() => removeItem(index)}
                    aria-label="Delete line item"
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Table.Td>
              )}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Stack>
  );
}