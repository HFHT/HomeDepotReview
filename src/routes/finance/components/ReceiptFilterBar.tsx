import { Button, Group } from '@mantine/core';

import type { ReviewStatus } from '../../../types/ReviewStatus';

export interface ReceiptFilterBarProps {
  active: ReviewStatus | 'all';
  counts: Record<ReviewStatus, number>;
  onChange: (value: ReviewStatus | 'all') => void;
}

/** "All / Pending (qty) / In Review (qty) / On Hold (qty)" filter row shown only on the "In Process" list. */
export function ReceiptFilterBar({ active, counts, onChange }: ReceiptFilterBarProps) {
  const items: { value: ReviewStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: `Pending (${counts.pending ?? 0})` },
    { value: 'in_review', label: `In Review (${counts.in_review ?? 0})` },
    { value: 'on_hold', label: `On Hold (${counts.on_hold ?? 0})` },
  ];

  return (
    <Group gap="xs" mb="md">
      {items.map((item) => (
        <Button
          key={item.value}
          size="xs"
          variant={active === item.value ? 'filled' : 'light'}
          color="habitatGreen"
          onClick={() => onChange(item.value)}
        >
          {item.label}
        </Button>
      ))}
    </Group>
  );
}