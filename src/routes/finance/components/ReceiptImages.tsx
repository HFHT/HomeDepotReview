// src/routes/receipts/ReceiptImages.tsx
import classes from '../styles/carousel.module.css';
import { Carousel } from '@mantine/carousel';
import { Center, Text } from '@mantine/core';

import { useReceiptFormContext } from '../context/receiptFormContext';
import { ZoomableImage } from '../../shared/components/ZoomableImage';

const BLOB_BASE_URL = import.meta.env.VITE_BLOB_STORAGE_URL ?? '';

/** Full-height Mantine Carousel of the receipt's captured images (no SAS token required). */
export function ReceiptImages() {
  const form = useReceiptFormContext();
  const results = form.values.receipt.image_results?.imageResults ?? [];
  const withFiles = results.filter((r) => !!r.fileName);

  return (
    <div className={classes.wrapper}>
      {withFiles.length === 0 ? (
        <Center h="100%">
          <Text c="dimmed">No images available</Text>
        </Center>
      ) : (
        <Carousel
          withIndicators
          slideGap="md"
          controlsOffset="sm"
          classNames={{
            indicator: classes.indicator,
            indicators: classes.indicators,
            control: classes.control,
            viewport: classes.viewport,
            slide: classes.slide,
          }}
        >
          {withFiles.map((r) => (
            <Carousel.Slide key={r.imageIndex} className={classes.slide}>
              <ZoomableImage
                src={`${BLOB_BASE_URL}${r.fileName}`}
                alt={`Receipt image ${r.imageIndex + 1}`}
              />
            </Carousel.Slide>
          ))}
        </Carousel>
      )}
    </div>
  );
}