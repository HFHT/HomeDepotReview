import { useCallback, useState } from 'react';

/**
 * Bridges errors thrown inside async code (effects, promises, event
 * handlers) to React's render phase, where an Error Boundary can catch
 * them.
 *
 * @remarks
 * React Error Boundaries only catch errors thrown during rendering — an
 * error thrown inside a `useEffect`'s async callback or a `.catch()`
 * handler is otherwise invisible to them. This hook works around that by
 * scheduling the error via a state-setter *function*: React invokes that
 * function during the component's next render, and the `throw` inside it
 * happens synchronously in the render phase, where a parent
 * `<ErrorBoundary>` can catch it.
 *
 * Use this only for failures that should be treated as fatal to the
 * surrounding UI. Recoverable failures that already have a sensible
 * fallback (e.g. "show initials instead of an avatar") should just be
 * logged via {@link logError}, not routed through this hook.
 *
 * @returns A stable callback that accepts an `Error` and schedules it to be
 * re-thrown on the calling component's next render.
 *
 * @example
 * ```tsx
 * function useTokenAcquisition() {
 *   const throwAsyncError = useThrowAsyncError();
 *
 *   useEffect(() => {
 *     acquireToken().catch((err) => {
 *       logError('useTokenAcquisition', err);
 *       throwAsyncError(toError(err));
 *     });
 *   }, [throwAsyncError]);
 * }
 * ```
 */
export function useThrowAsyncError(): (error: Error) => void {
  const [, setState] = useState();

  return useCallback((error: Error) => {
    setState(() => {
      throw error;
    });
  }, []);
}