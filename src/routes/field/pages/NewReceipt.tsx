import { useEffect } from 'react';
import { Box, Stepper } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconReceipt, IconCamera, IconCloudUp } from '@tabler/icons-react';
import { useReceiptStore } from '../stores/receiptStore';
import { Step1Details } from '../components/Step1Details';
import { Step2Capture } from '../components/Step2Capture';
import { Step3Review } from '../components/Step3Review';


/**
 * Three-step "New Receipt" workflow: Details → Capture → Review.
 *
 * @remarks
 * Step state is persisted in {@link useReceiptStore} (backed by `localStorage`)
 * so an in-progress receipt survives a page reload. Step navigation is
 * controlled exclusively by the Back/Next/Submit buttons within each step;
 * the {@link Stepper} itself is presentational only.
 */
export function NewReceipt() {
  const isSmall = useMediaQuery('(max-width: 48em)');
  const { step, loadImagesFromDB } = useReceiptStore();

  // Rehydrate image previews from IndexedDB on mount (metadata/receipt data
  // is already restored synchronously by the persist middleware).
  useEffect(() => {
    loadImagesFromDB();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box>
      <Stepper active={step} mb="md">
        <Stepper.Step label={!isSmall ? 'Details' : undefined} icon={<IconReceipt stroke={2} />} />
        <Stepper.Step label={!isSmall ? 'Capture' : undefined} icon={<IconCamera stroke={2} />} />
        <Stepper.Step label={!isSmall ? 'Review' : undefined} icon={<IconCloudUp stroke={2} />} />
      </Stepper>

      {step === 0 && <Step1Details />}
      {step === 1 && <Step2Capture />}
      {step === 2 && <Step3Review />}
    </Box>
  );
}