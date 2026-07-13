import { useEffect } from 'react';
import { fetchMembers } from '../services/graph';
import { useAuthStore } from '../stores/authStore';
import { logError } from '../../utils/errorLogger';

/**
 * Loads the Azure AD group members (via Microsoft Graph) once an access
 * token is available, and stores the result in {@link useAuthStore}.
 *
 * @remarks
 * Treated as a recoverable failure: if the fetch fails, the error is
 * logged and `members` is simply left at its previous value (`null` on
 * first load). Consumers of `useAuthStore().members` should already handle
 * the "not loaded yet / unavailable" case.
 *
 * @param accessToken - The current Microsoft Graph access token, or `null`
 * if one hasn't been acquired yet. Typically sourced from
 * `useAuthStore((s) => s.accessToken)`.
 */
export function useOrgMembers(accessToken: string | null): void {
    const setMembers = useAuthStore((s) => s.setMembers);

    useEffect(() => {
        if (!accessToken) return;
        const token = accessToken;
        let cancelled = false;

        async function loadMembers() {
            try {
                const members = await fetchMembers(token);
                if (!cancelled) setMembers(members);
            } catch (err) {
                logError('useOrgMembers', err);
            }
        }

        loadMembers();

        return () => {
            cancelled = true;
        };
    }, [accessToken, setMembers]);
}