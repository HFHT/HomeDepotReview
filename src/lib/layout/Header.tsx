// import { Avatar, Group, Menu, Text, ThemeIcon, UnstyledButton } from "@mantine/core";
// import { IconHomeHeart, IconLogout } from "@tabler/icons-react";
// import { useCurrentAccount } from "../auth/components/MicrosoftAuth";
// import { useMsal } from "@azure/msal-react";
// import { NetworkStatusBadge } from "./NetworkStatusBadge";

// /**
//  * Application header bar for the Habitat Tucson "Home Depot Receipts" app.
//  *
//  * @remarks
//  * This component is part of a mobile-first layout. On small viewports the
//  * primary navigation is rendered as buttons along the bottom of the screen,
//  * while on desktop a traditional left-side navigation is used. The `Header`
//  * sits at the top of the layout in both cases, providing branding on the left
//  * and an authenticated-user menu on the right.
//  *
//  * Behavior:
//  * - Displays the Habitat home/heart brand icon and the app title/subtitle.
//  * - Renders an avatar derived from the signed-in user's name (falling back to
//  *   `'U'` when unavailable). The user's full name is shown alongside the avatar
//  *   only on viewports `sm` and larger (hidden on mobile to conserve space).
//  * - Provides a dropdown menu showing the account username and a "Sign out"
//  *   action that triggers an MSAL logout redirect back to the app origin.
//  *
//  * Data sources:
//  * - {@link useCurrentAccount} supplies the current Microsoft (MSAL) account.
//  * - {@link useMsal} provides the MSAL instance used to perform logout.
//  *
//  * @returns The rendered header bar element.
//  *
//  * @example
//  * ```tsx
//  * import { AppShell } from "@mantine/core";
//  * import { Header } from "./components/Header";
//  *
//  * function App() {
//  *   return (
//  *     <AppShell header={{ height: 60 }}>
//  *       <AppShell.Header bg="#00457c">
//  *         <Header />
//  *       </AppShell.Header>
//  *     </AppShell>
//  *   );
//  * }
//  * ```
//  */
// export function Header() {
//     const account = useCurrentAccount();
//     const { instance } = useMsal();

//     return (
//         <Group h="100%" px="md" justify="space-between" wrap="nowrap">
//             {/* Branding: home/heart icon with app title and subtitle */}
//             <Group gap="xs" wrap="nowrap">
//                 <ThemeIcon size="lg" radius="md" variant="white">
//                     <IconHomeHeart color="#00457c" />
//                 </ThemeIcon>
//                 <div>
//                     <Text c="white" fw={700} size="md" lh={1}>
//                         Habitat Tucson
//                     </Text>
//                     <Text c="white" size="xs" opacity={0.9}>
//                         Home Depot Receipts
//                     </Text>
//                 </div>
//             </Group>

//             {/* Right-hand cluster: network status + authenticated user menu */}
//             <Group gap="sm" wrap="nowrap">
//                 <NetworkStatusBadge />

//                 <Menu position="bottom-end">
//                     <Menu.Target>
//                         <UnstyledButton>
//                             <Group gap="xs" wrap="nowrap">
//                                 <Avatar color="white" radius="xl" size="sm">
//                                     {account?.name?.[0] || 'U'}
//                                 </Avatar>
//                                 {/* Full name shown on sm+ screens only (hidden on mobile) */}
//                                 <Text c="white" size="sm" visibleFrom="sm">
//                                     {account?.name}
//                                 </Text>
//                             </Group>
//                         </UnstyledButton>
//                     </Menu.Target>
//                     <Menu.Dropdown>
//                         <Menu.Label>{account?.username}</Menu.Label>
//                         <Menu.Item
//                             leftSection={<IconLogout size={14} />}
//                             onClick={() =>
//                                 instance.logoutRedirect({
//                                     postLogoutRedirectUri: window.location.origin
//                                 })
//                             }
//                         >
//                             Sign out
//                         </Menu.Item>
//                     </Menu.Dropdown>
//                 </Menu>
//             </Group>
//         </Group>
//     );
// }

import { Avatar, Group, Menu, Text, ThemeIcon, UnstyledButton } from "@mantine/core";
import { IconHomeHeart, IconLogout } from "@tabler/icons-react";
import { useCurrentAccount } from "../auth/components/MicrosoftAuth";
import { useMsal } from "@azure/msal-react";
import { useAuthStore } from "../auth/stores/authStore";
import { NetworkStatusBadge } from "./NetworkStatusBadge";

/**
 * Application header bar for the Habitat Tucson "Home Depot Receipts" app.
 *
 * @remarks
 * This component is part of a mobile-first layout. On small viewports the
 * primary navigation is rendered as buttons along the bottom of the screen,
 * while on desktop a traditional left-side navigation is used. The `Header`
 * sits at the top of the layout in both cases, providing branding on the left
 * and an authenticated-user menu on the right.
 *
 * Behavior:
 * - Displays the Habitat home/heart brand icon and the app title/subtitle.
 * - Renders the signed-in user's avatar photo (persisted in IndexedDB and
 *   resolved once in {@link App}). While the photo is being resolved, or when
 *   the user has no photo configured in Azure AD, a Mantine initials-based
 *   avatar is shown instead (derived from the account's display name, falling
 *   back to `'U'`). The user's full name is shown alongside the avatar only
 *   on viewports `sm` and larger (hidden on mobile to conserve space).
 * - Provides a dropdown menu showing the account username and a "Sign out"
 *   action that triggers an MSAL logout redirect back to the app origin.
 *
 * Data sources:
 * - {@link useCurrentAccount} supplies the current Microsoft (MSAL) account.
 * - {@link useMsal} provides the MSAL instance used to perform logout.
 * - {@link useAuthStore} supplies the resolved `avatarUrl` / `avatarLoading`
 *   state populated by {@link App}.
 *
 * @returns The rendered header bar element.
 *
 * @example
 * ```tsx
 * import { AppShell } from "@mantine/core";
 * import { Header } from "./components/Header";
 *
 * function App() {
 *   return (
 *     <AppShell header={{ height: 60 }}>
 *       <AppShell.Header bg="#00457c">
 *         <Header />
 *       </AppShell.Header>
 *     </AppShell>
 *   );
 * }
 * ```
 */
export function Header() {
    const account = useCurrentAccount();
    const { instance } = useMsal();
    const avatarUrl = useAuthStore((s) => s.avatarUrl);
    const avatarLoading = useAuthStore((s) => s.avatarLoading);

    const initials = account?.name?.[0] || 'U';
    // While loading, or when no photo is available, fall back to the
    // initials-based Avatar by omitting `src` (Mantine renders `children`).
    const avatarSrc = avatarLoading ? undefined : avatarUrl ?? undefined;

    return (
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
            {/* Branding: home/heart icon with app title and subtitle */}
            <Group gap="xs" wrap="nowrap">
                <ThemeIcon size="lg" radius="md" variant="white">
                    <IconHomeHeart color="#00457c" />
                </ThemeIcon>
                <div>
                    <Text c="white" fw={700} size="md" lh={1}>
                        Habitat Tucson
                    </Text>
                    <Text c="white" size="xs" opacity={0.9}>
                        Home Depot Receipts
                    </Text>
                </div>
            </Group>

            {/* Right-hand cluster: network status + authenticated user menu */}
            <Group gap="sm" wrap="nowrap">
                <NetworkStatusBadge />

                <Menu position="bottom-end">
                    <Menu.Target>
                        <UnstyledButton>
                            <Group gap="xs" wrap="nowrap">
                                <Avatar
                                    color="white"
                                    radius="xl"
                                    size="sm"
                                    src={avatarSrc}
                                    alt={account?.name || 'User avatar'}
                                >
                                    {initials}
                                </Avatar>
                                {/* Full name shown on sm+ screens only (hidden on mobile) */}
                                <Text c="white" size="sm" visibleFrom="sm">
                                    {account?.name}
                                </Text>
                            </Group>
                        </UnstyledButton>
                    </Menu.Target>
                    <Menu.Dropdown>
                        <Menu.Label>{account?.username}</Menu.Label>
                        <Menu.Item
                            leftSection={<IconLogout size={14} />}
                            onClick={() =>
                                instance.logoutRedirect({
                                    postLogoutRedirectUri: window.location.origin
                                })
                            }
                        >
                            Sign out
                        </Menu.Item>
                    </Menu.Dropdown>
                </Menu>
            </Group>
        </Group>
    );
}