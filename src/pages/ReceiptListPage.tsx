// /**
//  * @file Filtered receipt list surface shared by the In Process / Complete /
//  * Rejected routes. Columns: Date, Receipt #, Created By, Total, Status, Age.
//  */
// import { JSX, useEffect, useMemo, useState } from 'react';
// import { useNavigate, useSearchParams } from 'react-router-dom';
// import {
//   Badge,
//   Chip,
//   Group,
//   Loader,
//   Pagination,
//   Paper,
//   Select,
//   Stack,
//   Table,
//   Text,
//   TextInput,
//   Title,
// } from '@mantine/core';
// import { IconSearch } from '@tabler/icons-react';
// import type { Receipt, ReviewStatus } from '../services/receiptTypes';
// import { receiptService } from '../services/receiptService';
// import { RECEIPT_STATUS_GROUPS, type ReceiptGroup } from './receiptRoutes';
// import { ageFromNow, currency } from '../services/format';

// /** Theme-driven color per review status. */
// const STATUS_COLOR: Record<ReviewStatus, string> = {
//   pending: 'gray',
//   in_review: 'habitatBlue',
//   on_hold: 'yellow',
//   entered_in_sage: 'habitatGreen',
//   rejected: 'red',
// };

// /** Human label per review status. */
// const STATUS_LABEL: Record<ReviewStatus, string> = {
//   pending: 'Pending',
//   in_review: 'In Review',
//   on_hold: 'On Hold',
//   entered_in_sage: 'Entered in Sage',
//   rejected: 'Rejected',
// };

// /** Selectable page sizes for the list. */
// const PAGE_SIZE_OPTIONS = ['10', '25', '50', '100'] as const;

// /** Default rows shown per page. */
// const DEFAULT_PAGE_SIZE = 25;

// /** Props for {@link ReceiptListPage}. */
// interface ReceiptListPageProps {
//   /** Which status bucket to display. */
//   group: ReceiptGroup;
//   /** Page heading. */
//   title: string;
// }

// /**
//  * Renders a searchable, status-filterable, paginated table of receipts for one group.
//  *
//  * Pagination state (page + page size) is mirrored to the URL query string so
//  * navigating into a receipt detail and back restores the same page.
//  *
//  * @param props - {@link ReceiptListPageProps}.
//  * @returns The list page element.
//  * @example <ReceiptListPage group="inProcess" title="In Process" />
//  */
// export function ReceiptListPage({ group, title }: ReceiptListPageProps): JSX.Element {
//   const navigate = useNavigate();
//   const statuses = RECEIPT_STATUS_GROUPS[group];

//   const [rows, setRows] = useState<Receipt[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [query, setQuery] = useState('');
//   const [statusFilter, setStatusFilter] = useState<ReviewStatus | 'all'>('all');

//   // Page + page size live in the URL so returning from detail preserves them.
//   const [searchParams, setSearchParams] = useSearchParams();
//   const page = Math.max(1, Number(searchParams.get('page')) || 1);
//   const pageSize = (() => {
//     const fromUrl = Number(searchParams.get('pageSize'));
//     return PAGE_SIZE_OPTIONS.includes(String(fromUrl) as (typeof PAGE_SIZE_OPTIONS)[number])
//       ? fromUrl
//       : DEFAULT_PAGE_SIZE;
//   })();

//   /** Update one or more URL params while preserving the rest. */
//   const updateParams = (next: Record<string, string | null>): void => {
//     setSearchParams(
//       (prev) => {
//         const params = new URLSearchParams(prev);
//         for (const [key, value] of Object.entries(next)) {
//           if (value === null) params.delete(key);
//           else params.set(key, value);
//         }
//         return params;
//       },
//       { replace: true },
//     );
//   };

//   const setPage = (next: number): void => updateParams({ page: String(next) });
//   const setPageSize = (next: number): void => updateParams({ pageSize: String(next), page: '1' });

//   useEffect(() => {
//     let active = true;
//     setLoading(true);
//     receiptService.list(statuses).then((data) => {
//       if (active) {
//         setRows(data);
//         setLoading(false);
//       }
//     });
//     return () => {
//       active = false;
//     };
//   }, [group]); // eslint-disable-line react-hooks/exhaustive-deps

//   const filtered = useMemo(
//     () =>
//       rows
//         .filter((r) => (statusFilter === 'all' ? true : r.reviewStatus === statusFilter))
//         .filter((r) => {
//           const q = query.trim().toLowerCase();
//           return !q || r.receiptNumber.toLowerCase().includes(q) || r.created.by.toLowerCase().includes(q);
//         }),
//     [rows, statusFilter, query],
//   );

//   const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

//   // Clamp the page if the filtered set shrinks below the current page.
//   useEffect(() => {
//     if (page > totalPages) setPage(totalPages);
//   }, [page, totalPages]); // eslint-disable-line react-hooks/exhaustive-deps

//   const paged = useMemo(
//     () => filtered.slice((page - 1) * pageSize, page * pageSize),
//     [filtered, page, pageSize],
//   );

//   /** Reset to the first page whenever the result set changes via filters/search. */
//   const onSearch = (value: string): void => {
//     setQuery(value);
//     if (page !== 1) setPage(1);
//   };
//   const onStatusChange = (value: ReviewStatus | 'all'): void => {
//     setStatusFilter(value);
//     if (page !== 1) setPage(1);
//   };

//   return (
//     <Stack gap="md">
//       <Group justify="space-between" align="flex-end">
//         <Title order={2}>Receipts — {title}</Title>
//         <TextInput
//           leftSection={<IconSearch size={16} />}
//           placeholder="Search receipt # or created by"
//           value={query}
//           onChange={(e) => onSearch(e.currentTarget.value)}
//           w={320}
//         />
//       </Group>

//       {/* In-Process gets status filter chips (incl. On Hold). */}
//       {group === 'inProcess' && (
//         <Chip.Group
//           multiple={false}
//           value={statusFilter}
//           onChange={(v) => onStatusChange(v as ReviewStatus | 'all')}
//         >
//           <Group gap="xs">
//             <Chip value="all">All</Chip>
//             {statuses.map((s) => (
//               <Chip key={s} value={s} color={STATUS_COLOR[s]}>
//                 {STATUS_LABEL[s]} ({rows.filter((r) => r.reviewStatus === s).length})
//               </Chip>
//             ))}
//           </Group>
//         </Chip.Group>
//       )}

//       <Paper withBorder radius="md">
//         <Table highlightOnHover striped stickyHeader>
//           <Table.Thead>
//             <Table.Tr>
//               <Table.Th>Date</Table.Th>
//               <Table.Th>Receipt #</Table.Th>
//               <Table.Th>Created By</Table.Th>
//               <Table.Th ta="right">Total</Table.Th>
//               <Table.Th>Status</Table.Th>
//               <Table.Th>Age</Table.Th>
//             </Table.Tr>
//           </Table.Thead>
//           <Table.Tbody>
//             {loading && (
//               <Table.Tr>
//                 <Table.Td colSpan={6}>
//                   <Group justify="center" py="xl">
//                     <Loader size="sm" />
//                   </Group>
//                 </Table.Td>
//               </Table.Tr>
//             )}
//             {!loading && filtered.length === 0 && (
//               <Table.Tr>
//                 <Table.Td colSpan={6}>
//                   <Text c="dimmed" ta="center" py="xl">
//                     No receipts.
//                   </Text>
//                 </Table.Td>
//               </Table.Tr>
//             )}
//             {!loading &&
//               paged.map((r) => (
//                 <Table.Tr key={r._id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/receipts/${r._id}`)}>
//                   <Table.Td>{r.receiptDate}</Table.Td>
//                   <Table.Td>{r.receiptNumber}</Table.Td>
//                   <Table.Td>{r.created.by}</Table.Td>
//                   <Table.Td ta="right">{currency(r.receiptTotal)}</Table.Td>
//                   <Table.Td>
//                     <Badge color={STATUS_COLOR[r.reviewStatus]} variant="light">
//                       {STATUS_LABEL[r.reviewStatus]}
//                     </Badge>
//                   </Table.Td>
//                   <Table.Td>{ageFromNow(r.created.date)}</Table.Td>
//                 </Table.Tr>
//               ))}
//           </Table.Tbody>
//         </Table>
//       </Paper>

//       {!loading && filtered.length > 0 && (
//         <Group justify="space-between" align="center">
//           <Group gap="xs" align="center">
//             <Text size="sm" c="dimmed">
//               Rows per page
//             </Text>
//             <Select
//               data={[...PAGE_SIZE_OPTIONS]}
//               value={String(pageSize)}
//               onChange={(v) => v && setPageSize(Number(v))}
//               w={90}
//               allowDeselect={false}
//               comboboxProps={{ withinPortal: true }}
//             />
//             <Text size="sm" c="dimmed">
//               {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
//             </Text>
//           </Group>
//           <Pagination total={totalPages} value={page} onChange={setPage} withEdges />
//         </Group>
//       )}
//     </Stack>
//   );
// }

/**
 * @file Filtered receipt list surface shared by the In Process / Complete /
 * Rejected routes. Columns: Date, Receipt #, Created By, Total, Status, Age.
 */
import { JSX, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Badge,
  Center,
  Chip,
  Group,
  Loader,
  Pagination,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { IconChevronDown, IconChevronUp, IconSearch, IconSelector } from '@tabler/icons-react';
import type { Receipt, ReviewStatus } from '../services/receiptTypes';
import { receiptService } from '../services/receiptService';
import { RECEIPT_STATUS_GROUPS, type ReceiptGroup } from '../routes/receiptRoutes';
import { ageFromNow, currency } from '../services/format';

/** Theme-driven color per review status. */
const STATUS_COLOR: Record<ReviewStatus, string> = {
  pending: 'gray',
  in_review: 'habitatBlue',
  on_hold: 'yellow',
  entered_in_sage: 'habitatGreen',
  rejected: 'red',
};

/** Human label per review status. */
const STATUS_LABEL: Record<ReviewStatus, string> = {
  pending: 'Pending',
  in_review: 'In Review',
  on_hold: 'On Hold',
  entered_in_sage: 'Entered in Sage',
  rejected: 'Rejected',
};

/** Meaningful workflow ordering for status sorts (low = earliest in workflow). */
const STATUS_ORDER: Record<ReviewStatus, number> = {
  pending: 0,
  in_review: 1,
  on_hold: 2,
  entered_in_sage: 3,
  rejected: 4,
};

/** Selectable page sizes for the list. */
const PAGE_SIZE_OPTIONS = ['10', '25', '50', '100'] as const;

/** Default rows shown per page. */
const DEFAULT_PAGE_SIZE = 25;

/** Sortable column keys. */
type SortKey = 'date' | 'receiptNumber' | 'createdBy' | 'total' | 'status' | 'age';

/** Sort direction. */
type SortDir = 'asc' | 'desc';

/** Valid sort keys for runtime validation of URL params. */
const SORT_KEYS: readonly SortKey[] = ['date', 'receiptNumber', 'createdBy', 'total', 'status', 'age'];

/** Default sort applied when the URL has no (valid) sort params. */
const DEFAULT_SORT: SortKey = 'date';
const DEFAULT_DIR: SortDir = 'desc';

/** Props for {@link ReceiptListPage}. */
interface ReceiptListPageProps {
  /** Which status bucket to display. */
  group: ReceiptGroup;
  /** Page heading. */
  title: string;
}

/** Props for an interactive sortable table header cell. */
interface SortableThProps {
  /** Column this header controls. */
  column: SortKey;
  /** Currently active sort column. */
  sort: SortKey;
  /** Currently active sort direction. */
  dir: SortDir;
  /** Visible label. */
  children: React.ReactNode;
  /** Right-align contents (e.g. numeric columns). */
  right?: boolean;
  /** Click handler toggling/activating this column's sort. */
  onSort: (column: SortKey) => void;
}

/**
 * Renders a clickable table header with a directional sort indicator.
 *
 * @param props - {@link SortableThProps}.
 * @returns The header cell element.
 */
function SortableTh({ column, sort, dir, children, right, onSort }: SortableThProps): JSX.Element {
  const active = sort === column;
  const Icon = active ? (dir === 'asc' ? IconChevronUp : IconChevronDown) : IconSelector;

  return (
    <Table.Th>
      <UnstyledButton onClick={() => onSort(column)} style={{ width: '100%' }}>
        <Group gap={4} justify={right ? 'flex-end' : 'flex-start'} wrap="nowrap">
          <Text fw={600} size="sm">
            {children}
          </Text>
          <Center>
            <Icon size={14} color={active ? undefined : 'var(--mantine-color-dimmed)'} />
          </Center>
        </Group>
      </UnstyledButton>
    </Table.Th>
  );
}

/**
 * Renders a searchable, status-filterable, sortable, paginated table of receipts.
 *
 * Sort (column + direction), page, and page size all live in the URL query
 * string so navigating into a receipt detail and back restores the full view.
 * Sorting is applied across the entire result set (all pages); changing the
 * sort resets to page 1.
 *
 * @param props - {@link ReceiptListPageProps}.
 * @returns The list page element.
 * @example <ReceiptListPage group="inProcess" title="In Process" />
 */
export function ReceiptListPage({ group, title }: ReceiptListPageProps): JSX.Element {
  const navigate = useNavigate();
  const statuses = RECEIPT_STATUS_GROUPS[group];

  const [rows, setRows] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | 'all'>('all');

  // Page, page size, and sort all live in the URL so the view is restorable.
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const pageSize = (() => {
    const fromUrl = Number(searchParams.get('pageSize'));
    return PAGE_SIZE_OPTIONS.includes(String(fromUrl) as (typeof PAGE_SIZE_OPTIONS)[number])
      ? fromUrl
      : DEFAULT_PAGE_SIZE;
  })();
  const sort = ((): SortKey => {
    const fromUrl = searchParams.get('sort') as SortKey | null;
    return fromUrl && SORT_KEYS.includes(fromUrl) ? fromUrl : DEFAULT_SORT;
  })();
  const dir: SortDir = searchParams.get('dir') === 'asc' ? 'asc' : 'desc';

  /** Update one or more URL params while preserving the rest. */
  const updateParams = (next: Record<string, string | null>): void => {
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(next)) {
          if (value === null) params.delete(key);
          else params.set(key, value);
        }
        return params;
      },
      { replace: true },
    );
  };

  const setPage = (next: number): void => updateParams({ page: String(next) });
  const setPageSize = (next: number): void => updateParams({ pageSize: String(next), page: '1' });

  /** Toggle direction on the active column, or activate a new column; resets to page 1. */
  const onSort = (column: SortKey): void => {
    const nextDir: SortDir = sort === column ? (dir === 'asc' ? 'desc' : 'asc') : 'asc';
    updateParams({ sort: column, dir: nextDir, page: '1' });
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    receiptService.list(statuses).then((data) => {
      if (active) {
        setRows(data);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [group]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(
    () =>
      rows
        .filter((r) => (statusFilter === 'all' ? true : r.reviewStatus === statusFilter))
        .filter((r) => {
          const q = query.trim().toLowerCase();
          return !q || r.receiptNumber.toLowerCase().includes(q) || r.created.by.toLowerCase().includes(q);
        }),
    [rows, statusFilter, query],
  );

  const sorted = useMemo(() => {
    /** Comparable primitive for a row given the active sort column. */
    const valueFor = (r: Receipt): number | string => {
      switch (sort) {
        case 'date':
          return new Date(r.receiptDate).getTime();
        case 'receiptNumber':
          return r.receiptNumber.toLowerCase();
        case 'createdBy':
          return r.created.by.toLowerCase();
        case 'total':
          return r.receiptTotal;
        case 'status':
          return STATUS_ORDER[r.reviewStatus];
        case 'age':
          // Age derives from creation time: an earlier created date == older.
          // asc => oldest-to-newest, desc => newest-to-oldest.
          return new Date(r.created.date).getTime();
      }
    };

    const factor = dir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const va = valueFor(a);
      const vb = valueFor(b);
      if (va < vb) return -1 * factor;
      if (va > vb) return 1 * factor;
      return 0;
    });
  }, [filtered, sort, dir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));

  // Clamp the page if the filtered set shrinks below the current page.
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]); // eslint-disable-line react-hooks/exhaustive-deps

  const paged = useMemo(
    () => sorted.slice((page - 1) * pageSize, page * pageSize),
    [sorted, page, pageSize],
  );

  /** Reset to the first page whenever the result set changes via filters/search. */
  const onSearch = (value: string): void => {
    setQuery(value);
    if (page !== 1) setPage(1);
  };
  const onStatusChange = (value: ReviewStatus | 'all'): void => {
    setStatusFilter(value);
    if (page !== 1) setPage(1);
  };

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-end">
        <Title order={2}>Receipts — {title}</Title>
        <TextInput
          leftSection={<IconSearch size={16} />}
          placeholder="Search receipt # or created by"
          value={query}
          onChange={(e) => onSearch(e.currentTarget.value)}
          w={320}
        />
      </Group>

      {/* In-Process gets status filter chips (incl. On Hold). */}
      {group === 'inProcess' && (
        <Chip.Group
          multiple={false}
          value={statusFilter}
          onChange={(v) => onStatusChange(v as ReviewStatus | 'all')}
        >
          <Group gap="xs">
            <Chip value="all">All</Chip>
            {statuses.map((s) => (
              <Chip key={s} value={s} color={STATUS_COLOR[s]}>
                {STATUS_LABEL[s]} ({rows.filter((r) => r.reviewStatus === s).length})
              </Chip>
            ))}
          </Group>
        </Chip.Group>
      )}

      <Paper withBorder radius="md">
        <Table highlightOnHover striped stickyHeader>
          <Table.Thead>
            <Table.Tr>
              <SortableTh column="date" sort={sort} dir={dir} onSort={onSort}>
                Date
              </SortableTh>
              <SortableTh column="receiptNumber" sort={sort} dir={dir} onSort={onSort}>
                Receipt #
              </SortableTh>
              <SortableTh column="createdBy" sort={sort} dir={dir} onSort={onSort}>
                Created By
              </SortableTh>
              <SortableTh column="total" sort={sort} dir={dir} onSort={onSort} right>
                Total
              </SortableTh>
              <SortableTh column="status" sort={sort} dir={dir} onSort={onSort}>
                Status
              </SortableTh>
              <SortableTh column="age" sort={sort} dir={dir} onSort={onSort}>
                Age
              </SortableTh>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {loading && (
              <Table.Tr>
                <Table.Td colSpan={6}>
                  <Group justify="center" py="xl">
                    <Loader size="sm" />
                  </Group>
                </Table.Td>
              </Table.Tr>
            )}
            {!loading && sorted.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={6}>
                  <Text c="dimmed" ta="center" py="xl">
                    No receipts.
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
            {!loading &&
              paged.map((r) => (
                <Table.Tr key={r._id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/receipts/${r._id}`)}>
                  <Table.Td>{r.receiptDate}</Table.Td>
                  <Table.Td>{r.receiptNumber}</Table.Td>
                  <Table.Td>{r.created.by}</Table.Td>
                  <Table.Td ta="right">{currency(r.receiptTotal)}</Table.Td>
                  <Table.Td>
                    <Badge color={STATUS_COLOR[r.reviewStatus]} variant="light">
                      {STATUS_LABEL[r.reviewStatus]}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{ageFromNow(r.created.date)}</Table.Td>
                </Table.Tr>
              ))}
          </Table.Tbody>
        </Table>
      </Paper>

      {!loading && sorted.length > 0 && (
        <Group justify="space-between" align="center">
          <Group gap="xs" align="center">
            <Text size="sm" c="dimmed">
              Rows per page
            </Text>
            <Select
              data={[...PAGE_SIZE_OPTIONS]}
              value={String(pageSize)}
              onChange={(v) => v && setPageSize(Number(v))}
              w={90}
              allowDeselect={false}
              comboboxProps={{ withinPortal: true }}
            />
            <Text size="sm" c="dimmed">
              {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, sorted.length)} of {sorted.length}
            </Text>
          </Group>
          <Pagination total={totalPages} value={page} onChange={setPage} withEdges />
        </Group>
      )}
    </Stack>
  );
}