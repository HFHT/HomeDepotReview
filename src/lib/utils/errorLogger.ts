/**
 * @file Centralized error logging utility.
 *
 * @remarks
 * All effect-level `catch` blocks in this codebase should funnel through
 * {@link logError} instead of calling `console.error` directly. This gives
 * us a single seam to:
 *   - prefix log output with a consistent, greppable `[scope]` tag,
 *   - swap in a remote logging/telemetry provider (e.g. Sentry, Application
 *     Insights) later without touching call sites, and
 *   - normalize `unknown` thrown values into `Error` instances via
 *     {@link toError}, which is what {@link useThrowAsyncError} needs to
 *     hand an error to a future Error Boundary.
 */

/** Arbitrary, serializable metadata attached to a logged error. */
export type ErrorLogContext = Record<string, unknown>;

/**
 * Logs an error to the console with a consistent, greppable format.
 *
 * @param scope - A short identifier for where the error occurred, typically
 * the name of the hook/function it came from (e.g. `'useOrgMembers'`).
 * @param error - The caught error. Typed as `unknown` since JS/TS does not
 * guarantee thrown values are `Error` instances.
 * @param context - Optional additional metadata to log alongside the error
 * (e.g. relevant ids, request params).
 *
 * @example
 * ```ts
 * try {
 *   await fetchMembers(token);
 * } catch (err) {
 *   logError('useOrgMembers', err, { hasToken: !!token });
 * }
 * ```
 */
export function logError(scope: string, error: unknown, context?: ErrorLogContext): void {
  const message = toErrorMessage(error);
  if (context) {
    console.error(`[${scope}] ${message}`, { error, ...context });
  } else {
    console.error(`[${scope}] ${message}`, error);
  }
}

/**
 * Normalizes an unknown thrown value into an `Error` instance.
 *
 * @remarks
 * Useful when an error needs to be handed off to something that requires a
 * real `Error` (e.g. {@link useThrowAsyncError}), since not everything that
 * gets `throw`n in JS is one.
 */
export function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(toErrorMessage(error));
}

/** Normalizes an unknown thrown value into a human-readable message. */
function toErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  try {
    return JSON.stringify(error);
  } catch {
    return 'An unknown error occurred.';
  }
}