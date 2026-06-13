/**
 * @file Full-width action bar: Reject / Put On Hold (reason modal),
 * Save Draft, and Mark Entered (requires Sage reference + posting date).
 */
import { JSX, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Group, Modal, Textarea } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import type { Receipt, ReviewStatus } from '../services/receiptTypes';
import { receiptService } from '../services/receiptService';
import { useReceiptStore } from '../stores/receiptStore';
import { useCurrentUser } from './useCurrentUser';

/** Props for {@link ReceiptActionBar}. */
interface ReceiptActionBarProps {
  /** Receipt draft being edited. */
  receipt: Receipt;
}

/**
 * Renders the bottom action bar for the review screen.
 * @param props - {@link ReceiptActionBarProps}.
 */
export function ReceiptActionBar({ receipt }: ReceiptActionBarProps): JSX.Element {
  const by = useCurrentUser();
  const navigate = useNavigate();
  const loadReceipt = useReceiptStore((s) => s.loadReceipt);

  const [busy, setBusy] = useState(false);
  const [reasonFor, setReasonFor] = useState<ReviewStatus | null>(null);
  const [reason, setReason] = useState('');

  const canEnterSage = Boolean(receipt.sageEntryMetadata.sageReference && receipt.sageEntryMetadata.postingDate);

  /** Persists the current draft. */
  const handleSave = async () => {
    setBusy(true);
    try {
      const saved = await receiptService.save(receipt);
      loadReceipt(saved);
      notifications.show({ message: 'Draft saved', color: 'habitatGreen' });
    } finally {
      setBusy(false);
    }
  };

  /** Records a reason-bearing status transition and returns to the queue. */
  const handleReasonStatus = async () => {
    if (!reasonFor) return;
    setBusy(true);
    try {
      await receiptService.save(receipt);
      await receiptService.setStatus(receipt._id, reasonFor, by, reason || null);
      notifications.show({ message: `Receipt ${reasonFor.replace(/_/g, ' ')}`, color: 'habitatBlue' });
      navigate('/receipts/in-process');
    } finally {
      setBusy(false);
      setReasonFor(null);
      setReason('');
    }
  };

  /** Saves Sage metadata and marks the receipt entered. */
  const handleEnterSage = async () => {
    setBusy(true);
    try {
      await receiptService.save(receipt);
      await receiptService.enterInSage(receipt._id, receipt.sageEntryMetadata, by);
      notifications.show({ message: 'Marked entered in Sage', color: 'habitatGreen' });
      navigate('/receipts/complete');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Group justify="space-between">
        <Group>
          <Button color="red" variant="light" loading={busy} onClick={() => setReasonFor('rejected')}>
            Reject
          </Button>
          <Button color="yellow" variant="light" loading={busy} onClick={() => setReasonFor('on_hold')}>
            Put On Hold
          </Button>
        </Group>
        <Group>
          <Button variant="default" loading={busy} onClick={handleSave}>
            Save Draft
          </Button>
          <Button color="habitatGreen" loading={busy} disabled={!canEnterSage} onClick={handleEnterSage}>
            Mark Entered ►
          </Button>
        </Group>
      </Group>

      <Modal
        opened={reasonFor !== null}
        onClose={() => setReasonFor(null)}
        title={reasonFor === 'rejected' ? 'Reject receipt' : 'Put receipt on hold'}
      >
        <Textarea
          label="Reason (required)"
          autosize
          minRows={3}
          value={reason}
          onChange={(e) => setReason(e.currentTarget.value)}
        />
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={() => setReasonFor(null)}>
            Cancel
          </Button>
          <Button color={reasonFor === 'rejected' ? 'red' : 'yellow'} disabled={!reason.trim()} loading={busy} onClick={handleReasonStatus}>
            Confirm
          </Button>
        </Group>
      </Modal>
    </>
  );
}