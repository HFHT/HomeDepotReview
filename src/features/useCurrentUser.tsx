/**
 * @file Resolves the current finance user's identity for audit stamping,
 * reading from the framework auth store.
 */

import { useAuthStore } from "../lib/auth/stores/authStore";

/**
 * Returns the signed-in user's identifier for use as `AuditChange.by` /
 * `reviewHistory.changedBy`.
 *
 * @returns The account username/email, or `'unknown'` when unauthenticated.
 * @example const by = useCurrentUser();
 */
export function useCurrentUser(): string {
  const account = useAuthStore((s) => s.account);
  return account?.username ?? 'unknown';
}