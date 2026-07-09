import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Center, Grid, Loader, Stack, Text } from '@mantine/core';

import { useReceiptStore } from '../lib/stores/receiptStore';
import type { ReceiptSubmissionRequest } from '../types/ReceiptSubmission';
import { todayISO } from '../utils/dateUtils';
import { ReceiptActions } from './receipts/ReceiptActions';
import { ReceiptDetailsEdit } from './receipts/ReceiptDetailsEdit';
import { ReceiptImages } from './receipts/ReceiptImages';
import { ReceiptReviewHeader } from './receipts/ReceiptReviewHeader';
import { ReceiptFormProvider, useReceiptForm } from './receipts/receiptFormContext';

/**
 * Backfills fields introduced after some records were created (`meta.sage`,
 * `history`, `review`) so the form always has a well-defined shape to bind
 * inputs against, even for legacy submissions.
 */
function withDefaults(receipt: ReceiptSubmissionRequest): ReceiptSubmissionRequest {
  return {
    ...receipt,
    history: receipt.history ?? [],
    review: receipt.review ?? [],
    meta: {
      ...receipt.meta,
      sage: receipt.meta.sage ?? { reference_no: '', post_date: todayISO(), note: '' },
    },
  };
}

/**
 * Finance review/edit page for a single receipt, identified by the Mongo
 * `_id` route param. Reads from the shared `receiptStore` (populated once at
 * app startup) rather than fetching independently.
 */
export function ReceiptReviewPage() {
  const { id } = useParams<{ id: string }>();
  const receipts = useReceiptStore((s) => s.receipts);
  const loading = useReceiptStore((s) => s.loading);

  const receipt = useMemo(() => receipts.find((r) => r._id === id), [receipts, id]);

  // Captures the record exactly as first loaded for this `_id`. Because the
  // dependency is `receipt?._id` (not `receipt` itself), this reference stays
  // fixed even after `receiptStore` is refreshed post-save, giving the
  // editors a stable "AI original value" baseline for change-chain tooltips.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const original = useMemo(() => receipt, [receipt?._id]);

  if (!receipt && loading) {
    return (
      <Center h={400}>
        <Loader color="habitatGreen" />
      </Center>
    );
  }

  if (!receipt || !original) {
    return (
      <Stack align="center" mt="xl">
        <Text c="dimmed">Receipt not found.</Text>
      </Stack>
    );
  }

  // Keyed by `_id` so navigating between two different receipts (without a
  // full route remount) still re-initializes the form/baseline correctly.
  return <ReceiptReviewForm key={receipt._id} receipt={receipt} original={original} />;
}

interface ReceiptReviewFormProps {
  receipt: ReceiptSubmissionRequest;
  original: ReceiptSubmissionRequest;
}

function ReceiptReviewForm({ receipt, original }: ReceiptReviewFormProps) {
  const form = useReceiptForm({ initialValues: withDefaults(receipt) });

  return (
    <ReceiptFormProvider form={form}>
      <Stack gap="md">
        <ReceiptReviewHeader />
        <ReceiptActions />
        <Grid gap="md">
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Box h={{ base: 400, md: 650 }}>
              <ReceiptImages />
            </Box>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <ReceiptDetailsEdit original={original} />
          </Grid.Col>
        </Grid>
      </Stack>
    </ReceiptFormProvider>
  );
}