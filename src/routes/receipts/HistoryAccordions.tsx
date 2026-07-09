import { Accordion, Badge, Table, Text } from '@mantine/core';

import type { ReviewStatus } from '../../types/ReviewStatus';
import { STATUS_LABEL } from '../../utils/receiptStatus';
import { useReceiptFormContext } from './receiptFormContext';

/** Two accordions showing the field-level Audit Trail and the status Review History. */
export function HistoryAccordions() {
  const form = useReceiptFormContext();
  const history = form.values.history ?? [];
  const review = form.values.review ?? [];

  return (
    <Accordion multiple defaultValue={[]}>
      <Accordion.Item value="audit">
        <Accordion.Control>Audit Trail ({history.length})</Accordion.Control>
        <Accordion.Panel>
          {history.length === 0 ? (
            <Text c="dimmed" size="sm">
              No field edits recorded.
            </Text>
          ) : (
            <Table striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Field</Table.Th>
                  {/* <Table.Th>Line Item</Table.Th> */}
                  <Table.Th>By</Table.Th>
                  <Table.Th>Old Value</Table.Th>
                  <Table.Th>New Value</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {history.map((h, i) => (
                  <Table.Tr key={i}>
                    <Table.Td>{h.field}</Table.Td>
                    {/* <Table.Td>{h.line_item_id ?? '—'}</Table.Td> */}
                    <Table.Td>
                      <Badge size="xs" variant="light">
                        {h.by}
                      </Badge>
                    </Table.Td>
                    <Table.Td>{h.old_value ?? '—'}</Table.Td>
                    <Table.Td>{h.new_value ?? '—'}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Accordion.Panel>
      </Accordion.Item>

      <Accordion.Item value="review">
        <Accordion.Control>Review History ({review.length})</Accordion.Control>
        <Accordion.Panel>
          {review.length === 0 ? (
            <Text c="dimmed" size="sm">
              No review actions recorded.
            </Text>
          ) : (
            <Table striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Date</Table.Th>
                  <Table.Th>User</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Reason</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {review.map((r, i) => (
                  <Table.Tr key={i}>
                    <Table.Td>{r.date}</Table.Td>
                    <Table.Td>{r.user}</Table.Td>
                    <Table.Td>{STATUS_LABEL[r.status as ReviewStatus] ?? r.status}</Table.Td>
                    <Table.Td>{r.reason || '—'}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  );
}