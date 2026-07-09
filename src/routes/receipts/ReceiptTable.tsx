import { Group, Table, Text } from '@mantine/core';
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

import type { ReceiptSubmissionRequest } from '../../types/ReceiptSubmission';
import type { ReviewStatus } from '../../types/ReviewStatus';
import { daysSince } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/formatters';
import { STATUS_COLOR, STATUS_LABEL } from '../../utils/receiptStatus';
import { Badge } from '@mantine/core';

export type SortColumn = 'date' | 'receipt_number' | 'user' | 'total' | 'status' | 'age';
export type SortDirection = 'asc' | 'desc';

export interface ReceiptTableProps {
  receipts: ReceiptSubmissionRequest[];
  sortBy: SortColumn;
  sortDir: SortDirection;
  onSort: (col: SortColumn) => void;
}

/** Sortable, click-to-review receipts table. Pagination is handled by the caller (`ReceiptListPage`). */
export function ReceiptTable({ receipts, sortBy, sortDir, onSort }: ReceiptTableProps) {
  const navigate = useNavigate();

  function sortIcon(col: SortColumn) {
    if (sortBy !== col) return null;
    return sortDir === 'asc' ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />;
  }

  function Th({ col, label }: { col: SortColumn; label: string }) {
    return (
      <Table.Th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => onSort(col)}>
        <Group gap={4} wrap="nowrap">
          <Text size="sm" fw={600}>
            {label}
          </Text>
          {sortIcon(col)}
        </Group>
      </Table.Th>
    );
  }

  return (
    <Table striped highlightOnHover verticalSpacing="sm">
      <Table.Thead>
        <Table.Tr>
          <Th col="date" label="Date" />
          <Th col="receipt_number" label="Receipt #" />
          <Th col="user" label="Created By" />
          <Th col="total" label="Total" />
          <Th col="status" label="Status" />
          <Th col="age" label="Age" />
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {receipts.length === 0 ? (
          <Table.Tr>
            <Table.Td colSpan={6}>
              <Text ta="center" c="dimmed" py="md">
                No receipts found.
              </Text>
            </Table.Td>
          </Table.Tr>
        ) : (
          receipts.map((r) => {
            const age = daysSince(r.receipt.date);
            return (
              <Table.Tr key={r._id} onClick={() => navigate(`/receipts/review/${r._id}`)} style={{ cursor: 'pointer' }}>
                <Table.Td>{r.receipt.date ? new Date(r.receipt.date).toLocaleDateString() : '—'}</Table.Td>
                <Table.Td>{r.receipt.receipt_number ?? '—'}</Table.Td>
                <Table.Td>{r.user}</Table.Td>
                <Table.Td>{formatCurrency(r.receipt.total)}</Table.Td>
                <Table.Td>
                  <Badge color={STATUS_COLOR[r.status as ReviewStatus]} variant="light">
                    {STATUS_LABEL[r.status as ReviewStatus]}
                  </Badge>
                </Table.Td>
                <Table.Td>{age ?? '—'}</Table.Td>
              </Table.Tr>
            );
          })
        )}
      </Table.Tbody>
    </Table>
  );
}