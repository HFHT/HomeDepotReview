/**
 * @file Receipt image slide with simple click-to-zoom toggling between
 * fit-to-container and 1.75x scaled views.
 */
import { JSX, useState } from 'react';
import { Image, ScrollArea } from '@mantine/core';

/** Props for {@link ZoomableImage}. */
interface ZoomableImageProps {
  /** Image URL. */
  src: string;
}

/**
 * Renders a single zoomable receipt image inside a carousel slide.
 * @param props - {@link ZoomableImageProps}.
 */
export function ZoomableImage({ src }: ZoomableImageProps): JSX.Element {
  const [zoomed, setZoomed] = useState(false);
  return (
    <ScrollArea h="70vh" type="auto">
      <Image
        src={src}
        fit="contain"
        onClick={() => setZoomed((z) => !z)}
        style={{ cursor: zoomed ? 'zoom-out' : 'zoom-in', transform: zoomed ? 'scale(1.75)' : 'none', transformOrigin: 'top center', transition: 'transform 150ms ease' }}
        alt="Receipt"
      />
    </ScrollArea>
  );
}