import { useState } from 'react';
import { Button, FileButton, Group, SimpleGrid, Stack, Text } from '@mantine/core';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable';
import { IconCamera, IconUpload } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useAuthStore } from '../../../lib/auth/stores/authStore';
import { analyzeReceipt } from '../../../services/receiptService';
import { getImageBlob, blobToBase64 } from '../../../lib/auth/services/imageStorage';
import { resizeImageForAnalysis } from '../../../lib/services/resizeImageForAnalysis';
import { SortableImageCard } from './SortableImageCard';
import { useReceiptStore } from '../stores/receiptStore';

/**
 * Step 2 of the New Receipt flow — capture/upload one or more receipt images,
 * reorder them via drag-and-drop, and invoke AI analysis.
 */
export function Step2Capture() {
  const { accessToken } = useAuthStore();
  const {
    images,
    setStep,
    addImageFiles,
    removeImage,
    replaceImage,
    reorderImages,
    setReceipt,
    setOriginalReceipt,
    overallStatus,
    setOverallStatus,
    setImageAnalysisResults,
    lastAnalyzedImageIds,
    setLastAnalyzedImageIds,
  } = useReceiptStore();

  const [loading, setLoading] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const sortedImages = [...images].sort((a, b) => a.order - b.order);
  const currentIdSignature = sortedImages.map((i) => i.id).join(',');
  const alreadyAnalyzedCurrentSet = overallStatus !== null && lastAnalyzedImageIds === currentIdSignature;

  // "failed" overall status locks the button until images change (delete/re-upload).
  const isFailedLocked = overallStatus === 'failed' && alreadyAnalyzedCurrentSet;
  const canAnalyze = sortedImages.length > 0 && !isFailedLocked;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sortedImages.findIndex((i) => i.id === active.id);
    const newIndex = sortedImages.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(sortedImages, oldIndex, newIndex);
    reorderImages(reordered.map((i) => i.id));
  };

  const handleFilesSelected = async (files: File[] | null) => {
    if (!files || files.length === 0) return;
    await addImageFiles(files);
  };

  /**
   * Builds the analyze payload for a single stored image: fetches its blob,
   * resizes/re-encodes it to satisfy Claude's vision constraints, and falls
   * back to the original unresized bytes if anything goes wrong. Errors are
   * caught locally so one bad image can never prevent the rest of the batch
   * from being analyzed.
   */
  const buildAnalyzeImagePayload = async (img: (typeof sortedImages)[number]) => {
    try {
      const blob = await getImageBlob(img.id);
      if (!blob) return { imageBase64: '', mediaType: img.mediaType };

      const { base64, mediaType } = await resizeImageForAnalysis(blob, img.mediaType);
      return { imageBase64: base64, mediaType };
    } catch (err) {
      console.warn(`Failed to prepare image ${img.id} for analysis; using original.`, err);
      try {
        const blob = await getImageBlob(img.id);
        const imageBase64 = blob ? await blobToBase64(blob) : '';
        return { imageBase64, mediaType: img.mediaType };
      } catch {
        return { imageBase64: '', mediaType: img.mediaType };
      }
    }
  };

  const handleAnalyzeAndContinue = async () => {
    // Same image set already produced "needs_review" — just proceed.
    if (overallStatus === 'needs_review' && alreadyAnalyzedCurrentSet) {
      setStep(2);
      return;
    }

    if (!accessToken) return;

    setLoading(true);
    try {
      const requestBody = await Promise.all(sortedImages.map(buildAnalyzeImagePayload));

      const { data, error } = await analyzeReceipt(requestBody, accessToken);

      if (error || !data) {
        notifications.show({
          color: 'red',
          title: 'Analysis failed',
          message: error?.message ?? 'Unable to analyze the receipt images.',
        });
        return;
      }

      setReceipt(data);
      setOriginalReceipt(data);
      setOverallStatus(data.image_results.overallStatus);
      setLastAnalyzedImageIds(currentIdSignature);

      const updates = sortedImages.map((img, idx) => ({
        id: img.id,
        result: data.image_results.imageResults!.find((r) => r.imageIndex === idx) ?? null,
      }));
      setImageAnalysisResults(updates);

      if (data.image_results.overallStatus === 'success') {
        setStep(2);
      }
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'Analysis failed',
        message: err instanceof Error ? err.message : 'Unexpected error analyzing receipt.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Button variant="default" onClick={() => setStep(0)}>
          Back
        </Button>
        <Button onClick={handleAnalyzeAndContinue} loading={loading} disabled={!canAnalyze}>
          Analyze & Continue
        </Button>
      </Group>

      <Group>
        {/* capture="environment" forces the rear camera on mobile devices */}
        <FileButton onChange={handleFilesSelected} accept="image/*" multiple capture='environment'>
          {(props) => (
            <Button {...props} leftSection={<IconCamera size={16} />} variant="outline">
              Take Photo
            </Button>
          )}
        </FileButton>
        <FileButton onChange={handleFilesSelected} accept="image/*,application/pdf" multiple>
          {(props) => (
            <Button {...props} leftSection={<IconUpload size={16} />} variant="outline">
              Upload Image(s)
            </Button>
          )}
        </FileButton>
      </Group>

      {sortedImages.length === 0 && (
        <Text c="dimmed" size="sm">
          No images uploaded yet. Take a photo or upload an image to begin.
        </Text>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sortedImages.map((i) => i.id)} strategy={rectSortingStrategy}>
          <SimpleGrid cols={{ base: 1, xs: 2, sm: 3 }} spacing="md">
            {sortedImages.map((img, idx) => (
              <SortableImageCard
                key={img.id}
                image={img}
                sequence={idx + 1}
                onRemove={() => removeImage(img.id)}
                onReplace={(file) => replaceImage(img.id, file)}
              />
            ))}
          </SimpleGrid>
        </SortableContext>
      </DndContext>
    </Stack>
  );
}