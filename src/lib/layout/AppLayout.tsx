import { type ReactNode } from 'react';
import {
  AppShell,
  Group,
  LoadingOverlay
} from '@mantine/core';
import { useNetwork } from '@mantine/hooks';

import { DesktopNavigation, MobileNavigation } from './Navigation';
import { Header } from './Header';

/**
 * Supported placements for the primary (desktop) navigation.
 */
export type NavPosition = 'left' | 'top';

/**
 * Props for the {@link AppLayout} component.
 *
 * @interface AppLayoutProps
 */
interface AppLayoutProps {
  /**
   * The page content rendered within the layout's main content area.
   */
  children: ReactNode;

  /**
   * Placement of the primary desktop navigation.
   *
   * - `'left'` (default): traditional left sidebar via `AppShell.Navbar`.
   * - `'top'`: horizontal navigation bar rendered beneath the brand header.
   *
   * On mobile viewports the navigation is always shown as a bottom button bar
   * regardless of this value.
   *
   * @defaultValue 'left'
   */
  navPosition?: NavPosition;

  /**
   * When `true` (the default), the main content area is covered by a
   * {@link https://mantine.dev/core/loading-overlay/ | LoadingOverlay} and
   * effectively "locked" whenever the browser reports that it is offline
   * (per Mantine's {@link https://mantine.dev/hooks/use-network/ | use-network}
   * hook).
   *
   * @remarks
   * Set this to `false` to opt out of the automatic lock behavior, e.g. for
   * pages that need to remain interactive while offline (such as pages that
   * rely on local/cached state).
   *
   * @defaultValue true
   */
  disableOnNetworkOffline?: boolean;
}

/**
 * Top-level application shell that provides a responsive, mobile-first layout
 * for the Habitat for Humanity SPA.
 *
 * @remarks
 * This component wraps Mantine's {@link https://mantine.dev/core/app-shell/ | AppShell}
 * to deliver an adaptive navigation experience that changes based on viewport size:
 *
 * - **Mobile (below the `sm` breakpoint):** Navigation is presented as a fixed
 *   bottom button bar via {@link MobileNavigation}, rendered in the footer.
 *   The left-hand navbar is collapsed and hidden.
 * - **Desktop (`sm` breakpoint and above):** Navigation switches to a traditional
 *   260px-wide left sidebar via {@link DesktopNavigation}, while the bottom
 *   button bar is hidden.
 *
 * The {@link Header} is always visible at the top and styled with the Habitat for
 * Humanity brand gradient (deep blue `#00457c` to green `#76bc21`), and includes
 * a network status badge that warns of offline/slow connectivity.
 *
 * The main content area reserves bottom padding equal to the footer height so that
 * content is never obscured by the mobile bottom navigation bar. It is also
 * network-aware: by default, if the browser goes offline, a
 * {@link https://mantine.dev/core/loading-overlay/ | LoadingOverlay} is shown
 * over the main content to "lock" the page and prevent user interaction until
 * connectivity is restored. This can be disabled via `disableOnNetworkOffline`.
 *
 * @example
 * ```tsx
 * <AppLayout>
 *   <DashboardPage />
 * </AppLayout>
 * ```
 *
 * @example
 * Opt out of the automatic offline lock behavior:
 * ```tsx
 * <AppLayout disableOnNetworkOffline={false}>
 *   <DashboardPage />
 * </AppLayout>
 * ```
 *
 * @param props - The component props.
 * @param props.children - The page content to display in the main region.
 * @param props.disableOnNetworkOffline - Whether to lock the main content
 * area with a loading overlay when the network is offline. Defaults to `true`.
 * @returns The responsive application shell wrapping the provided content.
 */
export function AppLayout({ children, navPosition, disableOnNetworkOffline = true }: AppLayoutProps) {
  const isTop = navPosition === 'top';
  const { online } = useNetwork();

  const isLocked = disableOnNetworkOffline && online === false;

  return (

    <AppShell
      // When the nav is on top, the header is taller on desktop to fit the
      // brand row (60) + nav row (50). Mobile stays at 60 since the nav row is
      // hidden (mobile uses the bottom bar instead).
      header={{ height: { base: 60, sm: isTop ? 110 : 60 } }}
      // Only configure a navbar when using the left layout.
      navbar={
        isTop
          ? undefined
          : {
            width: 260,
            breakpoint: 'sm',
            collapsed: { mobile: true, desktop: false },
          }
      }
      footer={{ height: 64, collapsed: false }}
      padding={{ base: 'xs', sm: 'md' }}
    >
      <AppShell.Header
        style={{
          background: 'linear-gradient(90deg, #00457c 0%, #76bc21 100%)',
          border: 'none'
        }}
      >
        <Header />
        {/* Horizontal nav row — desktop only, top layout only */}
        {isTop && (
          <Group
            h={50}
            px="md"
            gap="xs"
            wrap="nowrap"
            visibleFrom="sm"
            style={{
              background: 'white',
              borderTop: '1px solid #e9ecef',
            }}
          >
            <DesktopNavigation orientation="horizontal" />
          </Group>
        )}
      </AppShell.Header>

      {/* LEFT SIDEBAR NAV (left layout only) */}
      {!isTop && (
        <AppShell.Navbar p="md" visibleFrom="sm">
          <DesktopNavigation />
        </AppShell.Navbar>
      )}

      <AppShell.Main
        style={{
          background: '#f8f9fa',
          paddingBottom: 'calc(64px + var(--app-shell-padding))'
        }}
      >
        <div style={{ position: 'relative' }}>
          <LoadingOverlay
            visible={isLocked}
            zIndex={1000}
            overlayProps={{ radius: 'sm', blur: 2 }}
          />
          {children}
        </div>
      </AppShell.Main>
      {/* MOBILE BOTTOM NAV */}
      <AppShell.Footer
        hiddenFrom="sm"
        style={{
          background: 'white',
          borderTop: '1px solid #e9ecef'
        }}
      >
        <MobileNavigation />
      </AppShell.Footer>
    </AppShell>
  );
}