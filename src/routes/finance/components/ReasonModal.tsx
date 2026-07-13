import { useEffect, useState } from 'react';
import { Button, Group, Modal, Stack, Textarea } from '@mantine/core';

export interface ReasonModalProps {
  opened: boolean;
  title: string;
  confirmLabel: string;
  confirmColor: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}

/**
 * Shared "reason required" confirmation dialog used by the Reject, Review,
 * and Put On Hold actions in `ReceiptActions`.
 */
export function ReasonModal({
  opened,
  title,
  confirmLabel,
  confirmColor,
  loading = false,
  onCancel,
  onConfirm,
}: ReasonModalProps) {
  const [reason, setReason] = useState('');

  // Reset the textarea each time the modal is (re)opened.
  useEffect(() => {
    if (opened) setReason('');
  }, [opened]);

  return (
    <Modal opened={opened} onClose={onCancel} title={title} centered>
      <Stack gap="md">
        <Textarea
          label="Reason"
          placeholder="Enter a reason for this action…"
          required
          minRows={3}
          autosize
          value={reason}
          onChange={(e) => setReason(e.currentTarget.value)}
        />
        <Group justify="flex-end">
          <Button variant="default" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button
            color={confirmColor}
            loading={loading}
            disabled={!reason.trim()}
            onClick={() => onConfirm(reason.trim())}
          >
            {confirmLabel}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}