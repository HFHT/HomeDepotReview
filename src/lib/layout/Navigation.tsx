import { ActionIcon, Group, NavLink, Stack, Text, UnstyledButton } from "@mantine/core";
import { useLocation, useNavigate } from "react-router-dom";
import { navRoutes } from "../../routes/registry";

/**
 * Orientation options for {@link DesktopNavigation}.
 */
type NavOrientation = 'vertical' | 'horizontal';

interface DesktopNavigationProps {
  /**
   * Layout direction of the nav links.
   *
   * - `'vertical'` (default): stacked links for a left sidebar.
   * - `'horizontal'`: inline links for a top navigation bar.
   *
   * @defaultValue 'vertical'
   */
  orientation?: NavOrientation;
}

/**
 * Desktop navigation menu rendered with Mantine {@link NavLink} components.
 *
 * Supports both a vertical (left sidebar) and horizontal (top bar) layout via
 * the {@link DesktopNavigationProps.orientation | orientation} prop.
 *
 * @example
 * // Left sidebar
 * <DesktopNavigation />
 *
 * // Top bar
 * <DesktopNavigation orientation="horizontal" />
 */
export function DesktopNavigation({ orientation = 'vertical' }: DesktopNavigationProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const links = navRoutes.map(({ path: to, nav }) => (
    <NavLink
      key={to}
      label={nav.label}
      leftSection={<nav.icon size={18} />}
      active={pathname === to}
      onClick={() => navigate(to)}
      // Let horizontal links size to their content instead of full width.
      style={orientation === 'horizontal' ? { width: 'auto', borderRadius: 'var(--mantine-radius-md)' } : undefined}
    />
  ));

  if (orientation === 'horizontal') {
    return (
      <Group gap="xs" wrap="nowrap" h="100%" align="center">
        {links}
      </Group>
    );
  }

  return <Stack gap="xs">{links}</Stack>;
}

/**
 * Mobile navigation bar rendered as a horizontal row of icon + label buttons,
 * designed to sit along the bottom of the screen (mobile-first design).
 *
 * Each entry in {@link navRoutes} is rendered as an {@link UnstyledButton} that
 * fills an equal share of the available width. The active item is emphasized
 * with a filled `habitatGreen` icon and bold green label, while inactive items
 * use a subtle gray treatment. Selecting an item performs a client-side
 * navigation via {@link useNavigate}.
 *
 * @component
 * @returns {JSX.Element} A full-width horizontal bar of navigation buttons.
 *
 * @example
 * // Inside a fixed bottom app bar on mobile layouts
 * <MobileNavigation />
 */
export function MobileNavigation() {
    const { pathname } = useLocation();
    const navigate = useNavigate();

    return (
        <Group h="100%" justify="space-around" align="center" gap={0}>
            {navRoutes.map(({ path: to, nav }) => (
                <UnstyledButton
                    key={to}
                    onClick={() => navigate(to)}
                    style={{
                        flex: 1,
                        textAlign: 'center',
                        padding: '8px 4px',
                        height: '100%'
                    }}
                >
                    <ActionIcon
                        size="lg"
                        variant={pathname === to ? 'filled' : 'subtle'}
                        color={pathname === to ? 'habitatGreen' : 'gray'}
                        component="div"
                        mx="auto"
                    >
                        <nav.icon size={20} />
                    </ActionIcon>
                    <Text
                        size="xs"
                        fw={pathname === to ? 700 : 400}
                        c={pathname === to ? 'habitatGreen' : 'dimmed'}
                        mt={2}
                    >
                        {nav.label}
                    </Text>
                </UnstyledButton>
            ))}
        </Group>
    );
}