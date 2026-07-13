import { Card, SimpleGrid, Stack, Text, Textarea, TextInput } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import dayjs from 'dayjs';

import { useReceiptFormContext } from '../context/receiptFormContext';

/**
 * Captures the manual Sage 100 Cloud entry data (reference #, posting date,
 * notes). Both `reference_no` and `post_date` are required — `ReceiptActions`
 * disables "Mark Entered" until both are populated.
 */
export function SageEntryPanel() {
  const form = useReceiptFormContext();
  const sage = form.values.meta.sage;

  return (
    <Card>
      <Stack gap="md">
        <Text fw={600}>Sage 100 Cloud Entry</Text>
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <TextInput label="Sage Reference #" required {...form.getInputProps('meta.sage.reference_no')} />
          <DateInput
            label="Posting Date"
            required
            value={sage.post_date ? dayjs(sage.post_date).toDate() : null}
            onChange={(v) => form.setFieldValue('meta.sage.post_date', v ? dayjs(v).format('YYYY-MM-DD') : '')}
          />
        </SimpleGrid>
        <Textarea label="Notes" minRows={3} autosize {...form.getInputProps('meta.sage.note')} />
      </Stack>
    </Card>
  );
}