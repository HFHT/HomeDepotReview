import { useEffect, useMemo, useState } from 'react';
import { Group, LoadingOverlay, Pagination, Stack, Title } from '@mantine/core';

import { useReceiptStore } from '../lib/stores/receiptStore';
import type { ReviewStatus } from '../types/ReviewStatus';
import { daysSince } from '../utils/dateUtils';
import { GROUP_STATUSES, type ReceiptGroup } from '../utils/receiptStatus';
import { ReceiptFilterBar } from './receipts/ReceiptFilterBar';
import { ReceiptTable, type SortColumn, type SortDirection } from './receipts/ReceiptTable';

export interface ReceiptListPageProps {
  group: ReceiptGroup;
  title: string;
}

const PAGE_SIZE = 25;

/**
 * Paginated, sortable, status-filtered receipt list. Reused for all four
 * `/receipts/*` list routes via the `group` prop; the "In Process" group also
 * renders the additional `ReceiptFilterBar`.
 */
export function ReceiptListPage({ group, title }: ReceiptListPageProps) {
  const receipts = useReceiptStore((s) => s.receipts);
  const loading = useReceiptStore((s) => s.loading);

  const [statusFilter, setStatusFilter] = useState<ReviewStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortColumn>('date');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [page, setPage] = useState(1);

  // Reset to page 1 whenever the group or the in-page filter changes.
  useEffect(() => {
    setPage(1);
  }, [group, statusFilter]);

  const groupStatuses = GROUP_STATUSES[group];

  const groupReceipts = useMemo(() => {
    if (groupStatuses === 'all') return receipts;
    return receipts.filter((r) => groupStatuses.includes(r.status as ReviewStatus));
  }, [receipts, groupStatuses]);

  const counts = useMemo(() => {
    const c: Record<ReviewStatus, number> = {
      pending: 0,
      in_review: 0,
      on_hold: 0,
      entered_in_sage: 0,
      rejected: 0,
    };
    groupReceipts.forEach((r) => {
      const s = r.status as ReviewStatus;
      c[s] = (c[s] ?? 0) + 1;
    });
    return c;
  }, [groupReceipts]);

  const filtered = useMemo(() => {
    if (group !== 'inProcess' || statusFilter === 'all') return groupReceipts;
    return groupReceipts.filter((r) => r.status === statusFilter);
  }, [groupReceipts, group, statusFilter]);

  // Client-side sort. The API already returns receipts ordered by
  // `meta.submitDate`, but the table's sortable columns operate on whatever
  // the user has selected (date, receipt #, user, total, status, or age).
  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'date':
          cmp = (a.receipt.date ?? '').localeCompare(b.receipt.date ?? '');
          break;
        case 'receipt_number':
          cmp = (a.receipt.receipt_number ?? '').localeCompare(b.receipt.receipt_number ?? '');
          break;
        case 'user':
          cmp = a.user.localeCompare(b.user);
          break;
        case 'total':
          cmp = (a.receipt.total ?? 0) - (b.receipt.total ?? 0);
          break;
        case 'status':
          cmp = a.status.localeCompare(b.status);
          break;
        case 'age':
          cmp = (daysSince(a.receipt.date) ?? 0) - (daysSince(b.receipt.date) ?? 0);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [filtered, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageItems = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSort(col: SortColumn) {
    if (sortBy === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(col);
      setSortDir('asc');
    }
  }

  return (
    <Stack gap="md">
      <Title order={2}>{title}</Title>

      {group === 'inProcess' && <ReceiptFilterBar active={statusFilter} counts={counts} onChange={setStatusFilter} />}

      <div style={{ position: 'relative', minHeight: 200 }}>
        <LoadingOverlay visible={loading} overlayProps={{ radius: 'sm', blur: 2 }} />
        <ReceiptTable receipts={pageItems} sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
      </div>

      {totalPages > 1 && (
        <Group justify="center">
          <Pagination total={totalPages} value={page} onChange={setPage} color="habitatGreen" />
        </Group>
      )}
    </Stack>
  );
}