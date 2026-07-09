// src/routes/receipts/ZoomableImage.tsx
import { ActionIcon, Group } from '@mantine/core';
import { IconRefresh, IconZoomIn, IconZoomOut } from '@tabler/icons-react';
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';

interface ZoomableImageProps {
  src: string;
  alt: string;
}

/**
 * Renders an image at its largest possible size (no upscaling distortion,
 * fit="contain" behavior) inside its parent, with pinch/wheel/double-click
 * zoom and drag-to-pan for inspecting detail at native resolution.
 */
export function ZoomableImage({ src, alt }: ZoomableImageProps) {
  return (
    <TransformWrapper
      initialScale={1}
      minScale={1}
      maxScale={6}
      centerOnInit
      limitToBounds
      wheel={{ step: 0.15 }}
      doubleClick={{ step: 1.6, mode: 'toggle' }}
      pinch={{ step: 5 }}
      panning={{ velocityDisabled: true }}
    >
      {({ zoomIn, zoomOut, resetTransform }) => (
        <div style={{ position: 'relative', height: '100%', width: '100%' }}>
          <Group
            gap={4}
            style={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}
          >
            <ActionIcon variant="filled" color="habitatBlue.4" onClick={() => zoomIn()}>
              <IconZoomIn size={18} />
            </ActionIcon>
            <ActionIcon variant="filled" color="habitatBlue.4" onClick={() => zoomOut()}>
              <IconZoomOut size={18} />
            </ActionIcon>
            <ActionIcon variant="filled" color="habitatBlue.4" onClick={() => resetTransform()}>
              <IconRefresh size={18} />
            </ActionIcon>
          </Group>

          <TransformComponent
            wrapperStyle={{ width: '100%', height: '100%' }}
            contentStyle={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src={src}
              alt={alt}
              draggable={false}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
                userSelect: 'none',
              }}
            />
          </TransformComponent>
        </div>
      )}
    </TransformWrapper>
  );
}