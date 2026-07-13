import { useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../config/msalConfig';
import { useAuthStore } from '../stores/authStore';
import { logError, toError } from '../../utils/errorLogger';
import { useThrowAsyncError } from '../../hooks/useThrowAsyncError';

/**
 * Acquires a Microsoft Graph access token for the active MSAL account and
 * stores both the account and the token in {@link useAuthStore}.
 *
 * @remarks
 * Runs whenever the active MSAL account changes (in practice, once, right
 * after sign-in). It first attempts a silent token acquisition; if that
 * fails (e.g. the cached token expired and needs interactive consent), it
 * falls back to a redirect-based acquisition.
 *
 * If the redirect fallback *also* throws — meaning the user cannot be
 * authenticated at all — the error is logged and re-thrown on the next
 * render via {@link useThrowAsyncError}, so a parent Error Boundary can
 * present a recovery UI. This is treated as fatal because every downstream
 * hook ({@link useOrgMembers}, {@link useProjectSelects},
 * {@link useUserAvatar}) depends on `accessToken` being populated.
 */
export function useTokenAcquisition(): void {
  const { instance, accounts } = useMsal();
  const setAccount = useAuthStore((s) => s.setAccount);
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const throwAsyncError = useThrowAsyncError();

  useEffect(() => {
    const account = accounts[0];
    if (!account) return;

    setAccount(account);
    let cancelled = false;

    async function acquireToken() {
      try {
        const result = await instance.acquireTokenSilent({ ...loginRequest, account });
        if (!cancelled) setAccessToken(result.accessToken);
      } catch (silentError) {
        logError('useTokenAcquisition:silent', silentError);
        try {
          // Navigates away; nothing to set on success here — the app
          // reloads once the redirect flow completes.
          await instance.acquireTokenRedirect(loginRequest);
        } catch (redirectError) {
          logError('useTokenAcquisition:redirect', redirectError);
          throwAsyncError(toError(redirectError));
        }
      }
    }

    acquireToken();

    return () => {
      cancelled = true;
    };
  }, [accounts, instance, setAccount, setAccessToken, throwAsyncError]);
}