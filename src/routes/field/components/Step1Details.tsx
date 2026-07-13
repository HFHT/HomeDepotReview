import { useEffect } from 'react';
import { Button, Group, MultiSelect, Select, Stack, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useAuthStore } from '../../../lib/auth/stores/authStore';
import { useSelectsStore } from '../../../lib/stores/selectsStore';
import { MemberList } from '../../../lib/auth/components/MemberList';
import { useNoMobileKeyboard } from '../../../lib/theme/hooks/useNoMobileKeyboard';
import { useReceiptStore } from '../stores/receiptStore';

interface Step1FormValues {
  projectOrSubdivision: string;
  lotOrProjectNumbers: string;
  phases: string[];
}

/**
 * Step 1 of the New Receipt flow — collects the receipt owner (Member),
 * project/subdivision, lot/project numbers, and phases.
 *
 * The "Next" button (top-right) is disabled until a member is selected and
 * all form fields pass validation.
 */
export function Step1Details() {
  const kbProps = useNoMobileKeyboard();
  const { selectedMember } = useAuthStore();
  const { subdivisions, phases: phaseOptions } = useSelectsStore();
  const { projectOrSubdivision, lotOrProjectNumbers, phases, setDetails, setStep } = useReceiptStore();

  const form = useForm<Step1FormValues>({
    initialValues: { projectOrSubdivision, lotOrProjectNumbers, phases },
    validate: {
      projectOrSubdivision: (v) => (v ? null : 'Required'),
      lotOrProjectNumbers: (v) => (v.trim() ? null : 'Required'),
      phases: (v) => (v.length > 0 ? null : 'Select at least one phase'),
    },
  });

  // Keep the shared receipt draft in sync with every keystroke so the data
  // survives navigation/reload even before the user presses "Next".
  useEffect(() => {
    setDetails(form.values);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.values]);

  const canProceed = Boolean(selectedMember) && form.isValid();

  const handleNext = form.onSubmit(() => setStep(1));

  return (
    <form onSubmit={handleNext}>
      <Stack gap="md">
        <Group justify="flex-end">
          <Button type="submit" disabled={!canProceed}>
            Next
          </Button>
        </Group>

        <MemberList />

        <Select
          label="Project / Subdivision"
          placeholder="Select a project or subdivision"
          data={subdivisions}
          searchable
          {...kbProps}
          {...form.getInputProps('projectOrSubdivision')}
        />

        <Textarea
          label="Lots / Project Numbers"
          placeholder="Enter lot or project numbers"
          minRows={3}
          autosize
          {...form.getInputProps('lotOrProjectNumbers')}
        />

        <MultiSelect
          label="Phases"
          placeholder="Select phases"
          data={phaseOptions}
          searchable
          {...kbProps}
          {...form.getInputProps('phases')}
        />
      </Stack>
    </form>
  );
}