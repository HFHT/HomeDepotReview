import { AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from '@azure/msal-react';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/carousel/styles.css';

import { useAuthStore } from './lib/auth/stores/authStore';
import { Login } from './lib/auth/components/Login';
import { AppRoutes, AuthLoadingScreen } from './routes';
import { useTokenAcquisition, useOrgMembers, useProjectSelects, useUserAvatar } from './lib/auth/hooks';

/**
 * Top-level application component.
 *
 * @remarks
 * Deliberately kept to two jobs:
 *
 * 1. Kick off the auth-bootstrap hooks — {@link useTokenAcquisition},
 *    {@link useOrgMembers}, {@link useProjectSelects}, and
 *    {@link useUserAvatar} — which populate `useAuthStore` /
 *    `useSelectsStore` as a signed-in session becomes available. Each hook
 *    owns its own side effects and error handling; see their individual
 *    docs for what's recoverable vs. fatal.
 * 2. Render either the {@link Login} screen or the authenticated
 *    {@link AppRoutes} route table, based on MSAL's current auth state.
 *
 * Routing itself is provided by
 * {@link https://reactrouter.com | React Router}; the surrounding
 * `<BrowserRouter>` lives in `main.tsx`. See {@link AppRoutes} for the
 * actual route table.
 *
 * @todo Wrap `<AuthenticatedTemplate>` (or this whole component) in an
 * Error Boundary. `useTokenAcquisition` already re-throws unrecoverable
 * auth failures on render via `useThrowAsyncError` so a boundary placed
 * here will catch them.
 */
export function App() {
  const { inProgress, accounts } = useMsal();
  const accessToken = useAuthStore((s) => s.accessToken);

  useTokenAcquisition();
  useOrgMembers(accessToken);
  useProjectSelects(accessToken);
  useUserAvatar(accessToken, accounts[0] ?? null);

  if (inProgress === 'startup' || inProgress === 'handleRedirect') {
    return <AuthLoadingScreen />;
  }

  return (
    <>
      <UnauthenticatedTemplate>
        <Login
          title="Habitat Home Depot Receipt"
          desc=">> Tracking Today, Building Tomorrow. <<"
        />
      </UnauthenticatedTemplate>

      <AuthenticatedTemplate>
        <AppRoutes />
      </AuthenticatedTemplate>
    </>
  );
}