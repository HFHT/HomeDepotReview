import { useEffect } from 'react';
import { useSelectsStore } from '../../stores/selectsStore';
import { getProjects } from '../../../services/receiptService';
import { logError } from '../../utils/errorLogger';

/**
 * Loads the `subdivisions` and `phases` select-list options used by the
 * New Receipt "Details" step, once an access token is available.
 *
 * @remarks
 * `getProjects` normalizes network/parsing failures into a
 * `{ data: null, error }` result (see `ServiceResult`) rather than
 * throwing, so the inner `try/catch` here is a defensive guard against
 * unexpected failures — either path is logged via {@link logError} and the
 * select store is simply left with its previous (likely empty) value.
 *
 * @param accessToken - The current API access token, or `null` if one
 * hasn't been acquired yet.
 */
export function useProjectSelects(accessToken: string | null): void {
    const setSelects = useSelectsStore((s) => s.setSelects);

    useEffect(() => {
        if (!accessToken) return;
        const token = accessToken;
        let cancelled = false;

        async function loadSelects() {
            try {
                const { data, error } = await getProjects(token);
                if (cancelled) return;

                if (error || !data) {
                    logError('useProjectSelects', error ?? new Error('No data returned.'));
                    return;
                }

                setSelects(data);
            } catch (err) {
                if (!cancelled) logError('useProjectSelects', err);
            }
        }

        loadSelects();

        return () => {
            cancelled = true;
        };
    }, [accessToken, setSelects]);
}