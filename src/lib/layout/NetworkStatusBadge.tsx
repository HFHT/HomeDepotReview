import { Badge } from '@mantine/core';
import { useNetwork } from '@mantine/hooks';

/**
 * Slow-network effective connection types, as reported by the
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation/effectiveType | NetworkInformation.effectiveType}
 * API, that should be surfaced to the user as a "Slow" connection warning.
 */
const SLOW_EFFECTIVE_TYPES = new Set(['2g', 'slow-2g']);

/**
 * Displays a small status {@link Badge} that informs the user of network
 * connectivity bottlenecks, backed by Mantine's
 * {@link https://mantine.dev/hooks/use-network/ | use-network} hook.
 *
 * @remarks
 * Renders one of three states:
 *
 * - **Offline** — `online` is `false`. Renders a red "Offline" badge.
 * - **Slow** — `online` is `true` but `effectiveType` is `'2g'` or `'slow-2g'`.
 *   Renders a yellow "Slow" badge.
 * - **Nominal** — Anything else (online with a decent connection, or
 *   `effectiveType` unsupported/unknown in the current browser). Renders
 *   nothing (`null`).
 *
 * This component is intentionally silent when the network is healthy so it
 * can be dropped into a layout (e.g. the app {@link Header}) without adding
 * visual noise during normal operation.
 *
 * @returns The status badge, or `null` when the network is nominal.
 *
 * @example
 * ```tsx
 * <Group>
 *   <NetworkStatusBadge />
 *   <Menu>...</Menu>
 * </Group>
 * ```
 */
export function NetworkStatusBadge() {
  const { online, effectiveType } = useNetwork();

  if (online === false) {
    return (
      <Badge color="red" variant="filled" radius="sm">
        Offline
      </Badge>
    );
  }

  if (online === true && effectiveType && SLOW_EFFECTIVE_TYPES.has(effectiveType)) {
    return (
      <Badge color="yellow" variant="filled" radius="sm">
        Slow
      </Badge>
    );
  }

  return null;
}