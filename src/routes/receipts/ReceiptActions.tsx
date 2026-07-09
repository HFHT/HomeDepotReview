import { useState } from 'react';
import { Button, Group } from '@mantine/core';
import { notifications } from '@mantine/notifications';

import { useCurrentAccount } from '../../lib/auth/components/MicrosoftAuth';
import { useAuthStore } from '../../lib/auth/stores/authStore';
import { useReceiptStore } from '../../lib/stores/receiptStore';
import { saveReceipt } from '../../services/receiptService';
import { todayISO } from '../../utils/dateUtils';
import type { ReceiptSubmissionRequest } from '../../types/ReceiptSubmission';
import type { ReviewHistory } from '../../types/ReviewHistory';
import type { ReviewStatus } from '../../types/ReviewStatus';
import { ReasonModal } from './ReasonModal';
import { useReceiptFormContext } from './receiptFormContext';

type PendingAction = 'reject' | 'review' | 'on_hold' | null;
type LoadingKey = 'draft' | 'entered' | 'reject' | 'review' | 'on_hold' | null;

/**
 * Action bar for `ReceiptReviewPage`. Every action appends a `ReviewHistory`
 * entry (empty `reason` for the two non-popup actions), then immediately
 * persists the full form via `saveReceipt` and refreshes the shared
 * `receiptStore` from the server's returned history — the page stays put and
 * simply re-syncs the form with the freshly-saved record.
 */
export function ReceiptActions() {
  const form = useReceiptFormContext();
  const account = useCurrentAccount();
  const accessToken = useAuthStore((s) => s.accessToken);
  const setReceipts = useReceiptStore((s) => s.setReceipts);

  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [loadingKey, setLoadingKey] = useState<LoadingKey>(null);

  const sage = form.values.meta.sage;
  const markEnteredDisabled = !sage?.reference_no?.trim() || !sage?.post_date;

  async function commit(statusToSet: ReviewStatus | undefined, reason: string, key: LoadingKey) {
    const finalStatus: ReviewStatus = statusToSet ?? (form.values.status as ReviewStatus);

    const reviewEntry: ReviewHistory = {
      status: finalStatus,
      date: todayISO(),
      user: account?.name ?? 'Unknown',
      reason,
    };

    const payload: ReceiptSubmissionRequest = {
      ...form.values,
      status: finalStatus,
      review: [...(form.values.review ?? []), reviewEntry],
    };

    // Optimistically reflect the pending status/review entry in the UI.
    form.setValues(payload);

    if (!accessToken) {
      notifications.show({ color: 'red', title: 'Not signed in', message: 'Missing access token.' });
      return;
    }

    setLoadingKey(key);
    const { data, error } = await saveReceipt(payload, accessToken);
    setLoadingKey(null);

    if (error || !data) {
      notifications.show({ color: 'red', title: 'Save failed', message: error?.message ?? 'Unknown error' });
      return;
    }

    setReceipts(data.history);
    const fresh = data.history.find((r) => r._id === payload._id) ?? payload;
    form.setValues(fresh);
    form.resetDirty(fresh);
    setPendingAction(null);

    notifications.show({ color: 'green', title: 'Saved', message: 'Receipt updated successfully.' });
  }

  return (
    <Group justify="space-between" wrap="wrap">
      <Group gap="xs">
        <Button color="red" variant="outline" onClick={() => setPendingAction('reject')}>
          Reject
        </Button>
        <Button color="habitatBlue" variant="outline" onClick={() => setPendingAction('review')}>
          Review
        </Button>
        <Button color="orange" variant="outline" onClick={() => setPendingAction('on_hold')}>
          Put On Hold
        </Button>
      </Group>

      <Group gap="xs">
        <Button variant="default" loading={loadingKey === 'draft'} onClick={() => commit(undefined, '', 'draft')}>
          Save Draft
        </Button>
        <Button
          color="habitatGreen"
          loading={loadingKey === 'entered'}
          disabled={markEnteredDisabled}
          onClick={() => commit('entered_in_sage', '', 'entered')}
        >
          Mark Entered
        </Button>
      </Group>

      <ReasonModal
        opened={pendingAction === 'reject'}
        title="Reject Receipt"
        confirmLabel="Confirm Reject"
        confirmColor="red"
        loading={loadingKey === 'reject'}
        onCancel={() => setPendingAction(null)}
        onConfirm={(reason) => commit('rejected', reason, 'reject')}
      />
      <ReasonModal
        opened={pendingAction === 'review'}
        title="Send To Review"
        confirmLabel="Confirm Review"
        confirmColor="habitatBlue"
        loading={loadingKey === 'review'}
        onCancel={() => setPendingAction(null)}
        onConfirm={(reason) => commit('in_review', reason, 'review')}
      />
      <ReasonModal
        opened={pendingAction === 'on_hold'}
        title="Put Receipt On Hold"
        confirmLabel="Confirm Hold"
        confirmColor="orange"
        loading={loadingKey === 'on_hold'}
        onCancel={() => setPendingAction(null)}
        onConfirm={(reason) => commit('on_hold', reason, 'on_hold')}
      />
    </Group>
  );
}