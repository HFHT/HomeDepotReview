import { useCallback, useEffect, useRef } from 'react';
import { useMsal } from '@azure/msal-react';
import { EventType, type AccountInfo, type EventMessage } from '@azure/msal-browser';
import { fetchUserPhoto } from '../services/graph';
import { getAvatarRecord, saveAvatarRecord, clearAllAvatarRecords } from '../services/avatarStorage';
import { useAuthStore } from '../stores/authStore';
import { logError } from '../../utils/errorLogger';

/**
 * Resolves, caches, and tears down the signed-in user's avatar photo.
 *
 * @remarks
 * Owns the full lifecycle of the avatar's `object URL`:
 *
 * 1. **Resolve** — whenever the token/account become available, checks
 *    IndexedDB ({@link getAvatarRecord}) for a cached photo before falling
 *    back to a Microsoft Graph fetch ({@link fetchUserPhoto}), persisting
 *    any freshly-fetched photo for next time ({@link saveAvatarRecord}).
 * 2. **Clean up on sign-out** — listens for MSAL's `LOGOUT_SUCCESS` event
 *    and clears both the cached IndexedDB record and the in-memory object
 *    URL, so the next signed-in user never sees a stale photo.
 * 3. **Clean up on unmount** — revokes any outstanding object URL.
 *
 * Failures here are treated as recoverable: {@link Header} falls back to
 * an initials avatar whenever `avatarUrl` is `null`, so errors are logged
 * via {@link logError} and swallowed rather than surfaced to an Error
 * Boundary.
 *
 * @param accessToken - The current Microsoft Graph access token, or `null`.
 * @param account - The active MSAL account, or `null` if signed out.
 */
export function useUserAvatar(accessToken: string | null, account: AccountInfo | null): void {
  const { instance } = useMsal();
  const setAvatarUrl = useAuthStore((s) => s.setAvatarUrl);
  const setAvatarLoading = useAuthStore((s) => s.setAvatarLoading);

  // Tracks the most recently created object URL so it can be revoked when a
  // new avatar is resolved, on sign-out, or on unmount — preventing leaks.
  const objectUrlRef = useRef<string | null>(null);

  const revokeObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  // 1. Resolve the avatar, preferring the IndexedDB cache.
  useEffect(() => {
    if (!accessToken || !account) return;

    let cancelled = false;
    const accountId = account.homeAccountId;

    async function resolveAvatar() {
      setAvatarLoading(true);
      try {
        const existing = await getAvatarRecord(accountId);
        let blob: Blob | null = existing?.blob ?? null;

        if (!blob) {
          blob = await fetchUserPhoto(accessToken);
          if (blob) {
            await saveAvatarRecord({ id: accountId, blob, mediaType: blob.type });
          }
        }

        if (cancelled) return;

        revokeObjectUrl();
        if (blob) {
          objectUrlRef.current = URL.createObjectURL(blob);
          setAvatarUrl(objectUrlRef.current);
        } else {
          setAvatarUrl(null);
        }
      } catch (err) {
        logError('useUserAvatar:resolve', err);
        if (!cancelled) setAvatarUrl(null);
      } finally {
        if (!cancelled) setAvatarLoading(false);
      }
    }

    resolveAvatar();

    return () => {
      cancelled = true;
    };
  }, [accessToken, account, revokeObjectUrl, setAvatarUrl, setAvatarLoading]);

  // 2. Clear the persisted + in-memory avatar on sign-out.
  useEffect(() => {
    const callbackId = instance.addEventCallback((event: EventMessage) => {
      if (event.eventType !== EventType.LOGOUT_SUCCESS) return;

      revokeObjectUrl();
      setAvatarUrl(null);
      clearAllAvatarRecords().catch((err) => logError('useUserAvatar:logoutCleanup', err));
    });

    return () => {
      if (callbackId) instance.removeEventCallback(callbackId);
    };
  }, [instance, revokeObjectUrl, setAvatarUrl]);

  // 3. Revoke any outstanding object URL when the hook's owner unmounts.
  useEffect(() => revokeObjectUrl, [revokeObjectUrl]);
}