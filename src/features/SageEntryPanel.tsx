/**
 * @file Full-width Sage 100 Cloud entry panel. Captures Sage Reference #,
 * posting date, and notes, writing through the receipt store.
 */
import { Grid, Paper, Textarea, TextInput, Title } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import type { Receipt } from '../services/receiptTypes';
import { useReceiptStore } from '../stores/receiptStore';
import { JSX } from 'react/jsx-runtime';

/** Props for {@link SageEntryPanel}. */
interface SageEntryPanelProps {
  /** Receipt draft being edited. */
  receipt: Receipt;
}

/**
 * Renders the Sage entry capture panel.
 * @param props - {@link SageEntryPanelProps}.
 */
export function SageEntryPanel({ receipt }: SageEntryPanelProps): JSX.Element {
  const setSage = useReceiptStore((s) => s.setSage);
  const meta = receipt.sageEntryMetadata;

  return (
    <Paper withBorder radius="md" p="md">
      <Title order={4} mb="sm">
        Sage 100 Cloud Entry
      </Title>
      <Grid gap="md" align="flex-end">
        <Grid.Col span={4}>
          <TextInput
            label="Sage Reference #"
            value={meta.sageReference ?? ''}
            onChange={(e) => setSage({ ...meta, sageReference: e.currentTarget.value || null })}
          />
        </Grid.Col>
        <Grid.Col span={4}>
          <DateInput
            label="Posting Date"
            valueFormat="MM/DD/YYYY"
            value={meta.postingDate ? new Date(meta.postingDate) : null}
            onChange={(d) => setSage({ ...meta, postingDate: d ? d : null })}
          />
        </Grid.Col>
        <Grid.Col span={12}>
          <Textarea
            label="Notes"
            autosize
            minRows={2}
            value={meta.notes ?? ''}
            onChange={(e) => setSage({ ...meta, notes: e.currentTarget.value || null })}
          />
        </Grid.Col>
      </Grid>
    </Paper>
  );
}