import { Badge, Group } from '@mantine/core';

interface FieldLabelProps {
  /** Field name to display. Omit (or pass `undefined`) for label-less inputs (e.g. table cells) where only the "Edited" badge should render. */
  label?: React.ReactNode;
  edited: boolean;
}

/**
 * Shared field label used across receipt editing forms. Renders the given
 * label text followed by an "Edited" badge when the field's value differs
 * from the original AI response.
 *
 * When no `label` is supplied, only the badge renders (if `edited`) — used
 * in dense table layouts where a column header already conveys the field
 * name, and returns `null` entirely when there's nothing to show so
 * non-edited inputs don't grow to make room for an empty label.
 */
export function FieldLabel({ label, edited }: FieldLabelProps) {
  if (!label && !edited) return null;

  return (
    <Group gap={6} wrap="wrap">
      {label && <span>{label}</span>}
      {edited && (
        <Badge size="xs" color="habitatGreen">
          Edited
        </Badge>
      )}
    </Group>
  );
}