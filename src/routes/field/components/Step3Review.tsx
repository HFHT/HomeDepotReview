import { useState } from 'react';
import { Badge, Button, Flex, Grid, Modal, Stack, Text } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useAuthStore } from '../../../lib/auth/stores/authStore';
import { saveReceipt } from '../../../services/receiptService';
import { ReceiptReviewForm } from './ReceiptReviewForm';
import { buildReceiptHistory } from './receiptHistoryDiff';
import { ReceiptAnalysisResponse } from '../../../types/ReceiptAnalysis';
import { ReceiptSubmissionRequest } from '../../../types/ReceiptSubmission';
import { StoredImage } from '../../../types/ReceiptImage';
import { ImageUploadPlan, uploadImagesToBlob } from '../../../lib/auth/services/blobUploadService';
import { useReceiptStore } from '../stores/receiptStore';
import { buildImageFileName, getBaseFileName } from '../../../utils/fileNaming';

const STATUS_LABEL: Record<string, string> = {
  success: 'Success',
  needs_review: 'Needs Review',
  failed: 'Failed',
};

const STATUS_COLOR: Record<string, string> = {
  success: 'green',
  needs_review: 'yellow',
  failed: 'red',
};

/**
 * Builds the per-image blob upload plan (id/order/mediaType/derived file
 * name), using a single base file name (derived from the receipt number, or
 * a UUID fallback) shared across all images in the submission.
 */
function buildImageUploadPlans(receipt: ReceiptAnalysisResponse, images: StoredImage[]): ImageUploadPlan[] {
  const baseFileName = getBaseFileName(receipt.receipt_number);
  return images.map((img) => ({
    id: img.id,
    order: img.order,
    mediaType: img.mediaType,
    fileName: buildImageFileName(baseFileName, img.order, img.mediaType),
  }));
}

/**
 * Returns a copy of `receipt` with `image_results.imageResults[].fileName`
 * populated from the upload plans, correlating by array position (the same
 * convention used in Step 2 when mapping `imageIndex` to sorted images).
 */
function attachFileNamesToReceipt(
  receipt: ReceiptAnalysisResponse,
  sortedImages: StoredImage[],
  plans: ImageUploadPlan[]
): ReceiptAnalysisResponse {
  const planById = new Map(plans.map((p) => [p.id, p.fileName]));
  const fileNameByIndex = new Map(sortedImages.map((img, idx) => [idx, planById.get(img.id) ?? null]));

  return {
    ...receipt,
    image_results: {
      ...receipt.image_results,
      imageResults: receipt.image_results.imageResults!.map((result) => ({
        ...result,
        fileName: fileNameByIndex.get(result.imageIndex) ?? null,
      })),
    },
  };
}

/**
 * Step 3 of the New Receipt flow — review and edit the AI-extracted receipt
 * data, then submit for processing.
 */
export function Step3Review() {
  const { accessToken, selectedMember } = useAuthStore();
  const {
    receipt,
    originalReceipt,
    overallStatus,
    projectOrSubdivision,
    lotOrProjectNumbers,
    phases,
    images,
    setStep,
    setReceipt,
    resetDraft,
  } = useReceiptStore();

  const [currentReceipt, setCurrentReceipt] = useState<ReceiptAnalysisResponse | null>(receipt);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 48em)');

  if (!currentReceipt) {
    return <Text c="dimmed">No receipt data available. Please go back and capture a receipt.</Text>;
  }

  const lineItemsSum = currentReceipt.line_items.reduce((sum, li) => sum + (li.total_price ?? 0), 0);
  const subtotalMismatch =
    currentReceipt.subtotal !== null && Math.abs((currentReceipt.subtotal ?? 0) - lineItemsSum) > 0.01;
  const totalMismatch =
    currentReceipt.total !== null && Math.abs((currentReceipt.total ?? 0) - lineItemsSum) > 0.01;

  const buildSubmissionRequest = (receiptForSubmission: ReceiptAnalysisResponse): ReceiptSubmissionRequest => {
    const original = originalReceipt ?? currentReceipt;
    return {
      _id: '',
      receipt: receiptForSubmission,
      user: selectedMember?.userPrincipalName ?? selectedMember?.mail ?? '',
      status: 'pending',
      meta: {
        submitDate: new Date().toISOString(),
        projectOrSubdivision,
        lotOrProjectNumbers,
        phases,
        sage: {reference_no: '', post_date: '', note: ''}
      },
      history: buildReceiptHistory(original, receiptForSubmission),
      review: undefined
    };
  };

  const doSubmit = async () => {
    if (!accessToken) return;
    setSubmitting(true);
    try {
      const sortedImages = [...images].sort((a, b) => a.order - b.order);
      const plans = buildImageUploadPlans(currentReceipt, sortedImages);
      const receiptWithFileNames = attachFileNamesToReceipt(currentReceipt, sortedImages, plans);
      const submissionRequest = buildSubmissionRequest(receiptWithFileNames);

      // Submit the Mongo payload and upload the images to blob storage in parallel.
      const [mongoResult, uploadResults] = await Promise.all([
        saveReceipt(submissionRequest, accessToken),
        uploadImagesToBlob(plans, accessToken),
      ]);

      const mongoFailed = !!mongoResult.error || !mongoResult.data;
      const failedUploads = uploadResults.filter((u) => !u.success);

      if (mongoFailed) {
        notifications.show({
          color: 'red',
          title: 'Submission failed',
          message: mongoResult.error?.message ?? 'Unknown error submitting receipt.',
        });
      }

      if (failedUploads.length > 0) {
        notifications.show({
          color: 'red',
          title: 'Image upload failed',
          message: `${failedUploads.length} of ${uploadResults.length} image(s) failed to upload${
            failedUploads[0]?.error ? `: ${failedUploads[0].error}` : ''
          }`,
        });
      }

      if (mongoFailed || failedUploads.length > 0) {
        // Keep the draft intact so the user can retry.
        return;
      }

      // Keep the review form's local receipt copy in sync in case of a retry path in the future.
      setCurrentReceipt(receiptWithFileNames);
      setReceipt(receiptWithFileNames);

      notifications.show({
        color: 'green',
        title: 'Receipt submitted',
        message: 'Thank you! Starting a new receipt.',
      });
      await resetDraft();
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'Submission failed',
        message: err instanceof Error ? err.message : 'Unexpected error submitting receipt.',
      });
    } finally {
      setSubmitting(false);
      setConfirmOpen(false);
    }
  };

  const handleSubmitClick = () => {
    if (subtotalMismatch && totalMismatch) {
      setConfirmOpen(true);
      return;
    }
    doSubmit();
  };

  return (
    <Stack gap="md">
      <Grid>
        <Grid.Col span={4}>
          <Button variant="default" onClick={() => setStep(1)} w={{ base: '100%', xs: 'auto' }}>
            Back
          </Button>
        </Grid.Col>
        <Grid.Col span={4}>
          {overallStatus && (
            <Badge size="lg" color={STATUS_COLOR[overallStatus] ?? 'gray'} >
              {STATUS_LABEL[overallStatus] ?? overallStatus}
            </Badge>
          )}
        </Grid.Col>
        <Grid.Col span={4}>
          <Button
            onClick={handleSubmitClick}
            loading={submitting}
            w={{ base: '100%', xs: 'auto' }}
          >
            Submit
          </Button>
        </Grid.Col>
      </Grid>

      <ReceiptReviewForm
        receipt={currentReceipt}
        originalReceipt={originalReceipt}
        onChange={(updated) => {
          setCurrentReceipt(updated);
          setReceipt(updated);
        }}
      />

      <Modal
        opened={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Subtotal mismatch"
        centered
        fullScreen={isMobile}
        size="md"
      >
        <Stack gap="md">
          <Text size="sm">
            The subtotal does not match the sum of the line item totals. Do you want to proceed anyway?
          </Text>
          <Flex direction={{ base: 'column', xs: 'row' }} justify="flex-end" gap="sm">
            <Button
              variant="default"
              onClick={() => setConfirmOpen(false)}
              disabled={submitting}
              w={{ base: '100%', xs: 'auto' }}
            >
              Cancel
            </Button>
            <Button color="red" onClick={doSubmit} loading={submitting} w={{ base: '100%', xs: 'auto' }}>
              Proceed Anyway
            </Button>
          </Flex>
        </Stack>
      </Modal>
    </Stack>
  );
}