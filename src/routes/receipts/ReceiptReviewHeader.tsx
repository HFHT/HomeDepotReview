import { Anchor, Badge, Group, Title } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

import type { ReviewStatus } from '../../types/ReviewStatus';
import { STATUS_COLOR, STATUS_LABEL } from '../../utils/receiptStatus';
import { useReceiptFormContext } from './receiptFormContext';

/** Back-nav + identity/status summary strip at the top of `ReceiptReviewPage`. */
export function ReceiptReviewHeader() {
  const navigate = useNavigate();
  const form = useReceiptFormContext();
  const { receipt, user, status } = form.values;

  return (
    <Group justify="space-between" wrap="wrap">
      <Group gap="md">
        <Anchor onClick={() => navigate(-1)} c="dimmed" underline="never">
          <Group gap={4}>
            <IconArrowLeft size={16} /> Back
          </Group>
        </Anchor>
        <Title order={3}>
          Receipt {receipt.receipt_number ?? '—'} · Created by {user} ·{' '}
          {receipt.date ? new Date(receipt.date).toLocaleDateString() : '—'}
        </Title>
      </Group>
      <Badge size="lg" color={STATUS_COLOR[status as ReviewStatus]} variant="light">
        {STATUS_LABEL[status as ReviewStatus]}
      </Badge>
    </Group>
  );
}