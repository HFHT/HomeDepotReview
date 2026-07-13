import { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Center,
  Drawer,
  Group,
  Loader,
  Modal,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useDebouncedValue, useMediaQuery } from '@mantine/hooks';
import { IconChevronDown, IconChevronUp, IconSearch } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useAuthStore } from '../../../lib/auth/stores/authStore';
import { getReceipts } from '../../../services/receiptService';
import { ReceiptHistoryResponse } from '../../../types/ReceiptHistory';
import { ReceiptReviewForm } from '../components/ReceiptReviewForm';

type HistoryEntry = ReceiptHistoryResponse['history'][number];
type SortField = 'status' | 'receipt_number' | 'date' | 'total' | 'projectOrSubdivision' | 'lotOrProjectNumbers';

const MOBILE_PAGE_SIZE = 10;
const DESKTOP_PAGE_SIZE = 20;

const COLUMNS: { field: SortField; label: string }[] = [
  { field: 'status', label: 'Status' },
  { field: 'receipt_number', label: 'Receipt #' },
  { field: 'date', label: 'Date' },
  { field: 'total', label: 'Total' },
  { field: 'projectOrSubdivision', label: 'Project / Subdivision' },
  { field: 'lotOrProjectNumbers', label: 'Lots / Project #s' },
];

function getSortValue(entry: HistoryEntry, field: SortField): string | number {
  switch (field) {
    case 'status':
      return entry.status;
    case 'receipt_number':
      return entry.receipt.receipt_number ?? '';
    case 'date':
      return entry.receipt.date ?? '';
    case 'total':
      return entry.receipt.total ?? 0;
    case 'projectOrSubdivision':
      return entry.meta.projectOrSubdivision;
    case 'lotOrProjectNumbers':
      return entry.meta.lotOrProjectNumbers;
    default:
      return '';
  }
}

/** Stringified representation of the fields shown on a card, used for filtering. */
function getFilterFields(entry: HistoryEntry): string[] {
  return [
    entry.status,
    entry.receipt.receipt_number ?? '',
    entry.receipt.date ?? '',
    entry.receipt.total != null ? String(entry.receipt.total) : '',
    entry.meta.projectOrSubdivision,
    entry.meta.lotOrProjectNumbers,
  ];
}

function matchesFilter(entry: HistoryEntry, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  return getFilterFields(entry).some((f) => f.toLowerCase().includes(q));
}

interface HistoryCardProps {
  entry: HistoryEntry;
  onClick: () => void;
}

function HistoryCard({ entry, onClick }: HistoryCardProps) {
  return (
    <Card withBorder radius="md" padding="md" style={{ cursor: 'pointer' }} onClick={onClick}>
      <Stack gap={6}>
        <Group justify="space-between" wrap="nowrap">
          <Badge>{entry.status}</Badge>
          <Text fw={600}>{entry.receipt.total != null ? `$${entry.receipt.total.toFixed(2)}` : '—'}</Text>
        </Group>
        <Group justify="space-between" wrap="nowrap">
          <Text size="sm" c="dimmed">
            Receipt #
          </Text>
          <Text size="sm">{entry.receipt.receipt_number ?? '—'}</Text>
        </Group>
        <Group justify="space-between" wrap="nowrap">
          <Text size="sm" c="dimmed">
            Date
          </Text>
          <Text size="sm">{entry.receipt.date ?? '—'}</Text>
        </Group>
        <Group justify="space-between" wrap="nowrap">
          <Text size="sm" c="dimmed">
            Project / Subdivision
          </Text>
          <Text size="sm" ta="right">
            {entry.meta.projectOrSubdivision || '—'}
          </Text>
        </Group>
        <Group justify="space-between" wrap="nowrap">
          <Text size="sm" c="dimmed">
            Lots / Project #s
          </Text>
          <Text size="sm" ta="right">
            {entry.meta.lotOrProjectNumbers || '—'}
          </Text>
        </Group>
      </Stack>
    </Card>
  );
}

/**
 * Displays the signed-in user's submitted receipt history as a responsive
 * card layout (stacked on mobile, grid on desktop) with a "Sort by" select,
 * debounced filter input, and "Load more" pagination. Selecting a card opens
 * a read-only detail view (fullscreen modal on mobile, right drawer on
 * desktop) reusing {@link ReceiptReviewForm}.
 */
export function History() {
  const isMobile = useMediaQuery('(max-width: 48em)');
  const PAGE_SIZE = isMobile ? MOBILE_PAGE_SIZE : DESKTOP_PAGE_SIZE;

  const { account, accessToken } = useAuthStore();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [filterInput, setFilterInput] = useState('');
  const [debouncedFilter] = useDebouncedValue(filterInput, 500);
  const [loadedCount, setLoadedCount] = useState(PAGE_SIZE);
  const [selected, setSelected] = useState<HistoryEntry | null>(null);

  useEffect(() => {
    if (!accessToken || !account?.username) return;
    let cancelled = false;
    setLoading(true);

    getReceipts({ user: account.username }, accessToken)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) {
          notifications.show({
            color: 'red',
            title: 'Failed to load history',
            message: error?.message ?? 'Unknown error loading receipt history.',
          });
          return;
        }
        setEntries(data.history);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken, account?.username]);

  const sorted = useMemo(() => {
    const copy = [...entries];
    copy.sort((a, b) => {
      const av = getSortValue(a, sortField);
      const bv = getSortValue(b, sortField);
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return copy;
  }, [entries, sortField, sortDir]);

  const filtered = useMemo(
    () => sorted.filter((entry) => matchesFilter(entry, debouncedFilter)),
    [sorted, debouncedFilter],
  );

  // Reset pagination whenever filtering, sorting, or the responsive page size changes.
  useEffect(() => {
    setLoadedCount(PAGE_SIZE);
  }, [debouncedFilter, sortField, sortDir, PAGE_SIZE]);

  const visible = filtered.slice(0, loadedCount);
  const hasMore = loadedCount < filtered.length;

  const handleSortChange = (value: string | null) => {
    if (!value) return;
    const field = value as SortField;
    if (field === sortField) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  if (loading) {
    return (
      <Center h={200}>
        <Loader color="habitatGreen" />
      </Center>
    );
  }

  return (
    <Stack gap="md">
      <Group grow={isMobile} align="flex-end" wrap="wrap">
        <TextInput
          label="Filter"
          placeholder="Search receipts..."
          leftSection={<IconSearch size={16} />}
          value={filterInput}
          onChange={(e) => setFilterInput(e.currentTarget.value)}
        />
        <Select
          label="Sort by"
          data={COLUMNS.map((c) => ({ value: c.field, label: c.label }))}
          value={sortField}
          onChange={handleSortChange}
          allowDeselect={false}
          rightSection={sortDir === 'asc' ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
        />
      </Group>

      {visible.length === 0 ? (
        <Text c="dimmed" ta="center" py="md">
          No receipts found.
        </Text>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: isMobile ? 1 : 2, lg: isMobile ? 1 : 3 }} spacing="md">
          {visible.map((entry, idx) => (
            <HistoryCard key={idx} entry={entry} onClick={() => setSelected(entry)} />
          ))}
        </SimpleGrid>
      )}

      {hasMore && (
        <Group justify="center">
          <Button variant="light" color="habitatGreen" onClick={() => setLoadedCount((c) => c + PAGE_SIZE)}>
            Load more
          </Button>
        </Group>
      )}

      {isMobile ? (
        <Modal
          opened={!!selected}
          onClose={() => setSelected(null)}
          title="Receipt Details"
          fullScreen
        >
          {selected && <ReceiptReviewForm receipt={selected.receipt} readOnly />}
        </Modal>
      ) : (
        <Drawer
          opened={!!selected}
          onClose={() => setSelected(null)}
          title="Receipt Details"
          position="right"
          size="xl"
        >
          {selected && <ReceiptReviewForm receipt={selected.receipt} readOnly />}
        </Drawer>
      )}
    </Stack>
  );
}