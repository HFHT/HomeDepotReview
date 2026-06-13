/**
 * @file Receipt review/detail screen. Layout: 50% image carousel | 50%
 * receipt detail (3-col) + line items on top; Sage entry, history, and the
 * action bar full-width below.
 */
import classes from './../features/carousel.module.css';

import { JSX, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Carousel } from '@mantine/carousel';
import { Center, Grid, Image, Loader, SimpleGrid, Stack } from '@mantine/core';
import { useShallow } from 'zustand/react/shallow';
import { receiptService } from '../services/receiptService';
import { useReceiptStore } from '../stores/receiptStore';
import { HistoryAccordions, LineItemsEditor, ReceiptActionBar, ReceiptDetailFields, ReceiptReviewHeader, SageEntryPanel } from '../features';
/**
 * Loads the receipt by route param into the store and renders the review UI.
 * @returns The review page element.
 */
export function ReceiptReviewPage(): JSX.Element {
  const { receiptId } = useParams<{ receiptId: string }>();
  const [loading, setLoading] = useState(true);

  const { draft, loadReceipt, reset } = useReceiptStore(
    useShallow((s) => ({ draft: s.draft, loadReceipt: s.loadReceipt, reset: s.reset })),
  );

  // Reserve space for header, footer, page padding, and the review header row.
  const imageBoxHeight =
    'calc(100vh - var(--app-shell-header-height) - var(--app-shell-footer-height) - 10px)';

  useEffect(() => {
    let active = true;
    setLoading(true);
    if (receiptId) {
      receiptService.get(receiptId).then((r) => {
        if (active) {
          loadReceipt(r);
          setLoading(false);
        }
      });
    }
    return () => {
      active = false;
      reset();
    };
  }, [receiptId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading || !draft) {
    return (
      <Center h={400}>
        <Loader />
      </Center>
    );
  }

  return (
    <Stack gap="md">
      <ReceiptReviewHeader receipt={draft} />
      <ReceiptActionBar receipt={draft} />
      <Grid gap="md" align="stretch">
        {/* image carousel */}
        <Grid.Col span={7}>
          <Carousel withIndicators slideGap="sm" controlsOffset="sm"
            classNames={{
              indicators: classes.indicators,
              indicator: classes.indicator,
              control: classes.control,
            }}
            styles={{
              indicators: {
                top: 16,
                bottom: 'unset',
              },
            }}
          >
            {draft.images.map((src) => (
              <Carousel.Slide key={src}>
                <Image src={'https://hfhtreceipts.blob.core.windows.net/receipts/416098499854-20250714_104331.jpg'} fit="contain" alt="Receipt" h="100%" w="100%" />
                {/* <ZoomableImage src={'https://hfhtreceipts.blob.core.windows.net/receipts/416098499854-20250714_104331.jpg'} /> */}
              </Carousel.Slide>
            ))}
          </Carousel>
        </Grid.Col>

        {/* receipt detail (3-col) + line items */}
        <Grid.Col span={5}>
          <Stack gap="md">
            <ReceiptDetailFields receipt={draft} />

            <LineItemsEditor receipt={draft} />
            <SageEntryPanel receipt={draft} />
            <HistoryAccordions receipt={draft} />

          </Stack>
        </Grid.Col>
      </Grid>

      {/* 100% — Sage entry */}
      {/* <SageEntryPanel receipt={draft} /> */}

      {/* 100% — collapsible history */}
      {/* <HistoryAccordions receipt={draft} /> */}

      {/* 100% — actions */}
      {/* <ReceiptActionBar receipt={draft} /> */}
    </Stack>
  );
}