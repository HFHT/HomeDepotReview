import { ActionIcon, Badge, Button, Card, FileButton, Group, Image, Stack, Text } from '@mantine/core';
import { IconGripVertical, IconTrash } from '@tabler/icons-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { StoredImage } from '../../../types/ReceiptImage';

interface SortableImageCardProps {
  image: StoredImage;
  sequence: number;
  onRemove: () => void;
  onReplace: (file: File) => void;
}

const STATUS_COLOR: Record<string, string> = {
  success: 'green',
  needs_review: 'yellow',
  failed: 'red',
};

/**
 * Drag-and-drop enabled card representing a single captured/uploaded receipt
 * image, including its sequence badge, drag handle, and (once analyzed) the
 * per-image quality/status result with a re-upload action.
 */
export function SortableImageCard({ image, sequence, onRemove, onReplace }: SortableImageCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  const result = image.analysisResult;

  return (
    <Card ref={setNodeRef} style={style} withBorder padding="sm">
      <Card.Section pos="relative">
        <Badge pos="absolute" top={8} left={8} style={{ zIndex: 1 }} color="habitatBlue">
          {sequence}
        </Badge>
        <ActionIcon
          pos="absolute"
          top={8}
          right={8}
          style={{ zIndex: 1, cursor: 'grab' }}
          variant="white"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <IconGripVertical size={16} />
        </ActionIcon>
        <Image src={image.previewUrl} alt={image.fileName} height={160} fit="cover" />
      </Card.Section>

      <Group justify="space-between" mt="sm" wrap="nowrap">
        <Text size="sm" truncate style={{ flex: 1 }}>
          {image.fileName}
        </Text>
        <ActionIcon color="red" variant="subtle" onClick={onRemove} aria-label="Remove image">
          <IconTrash size={16} />
        </ActionIcon>
      </Group>

      {result && (
        <Stack gap={4} mt="xs">
          <Group gap="xs">
            <Badge color={STATUS_COLOR[result.status] ?? 'gray'}>{result.status}</Badge>
            {result.confidence && <Badge variant="outline">{result.confidence} confidence</Badge>}
          </Group>
          {result.message && (
            <Text size="xs" c="dimmed">
              {result.message}
            </Text>
          )}
          <FileButton onChange={(file) => file && onReplace(file)} accept="image/*">
            {(props) => (
              <Button {...props} size="xs" variant="light">
                Re-upload Image
              </Button>
            )}
          </FileButton>
        </Stack>
      )}
    </Card>
  );
}