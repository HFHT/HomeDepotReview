import { AzureADMember, graphConfig } from "../config/msalConfig";
import { useAuthStore } from "../stores/authStore";

/**
 * Fetches the members of the configured Azure AD organization group via the
 * Microsoft Graph API.
 *
 * This service authenticates each request with a bearer token (either supplied
 * explicitly or pulled from the Zustand auth store) and queries the Graph group
 * members endpoint defined in {@link graphConfig}. The raw Graph user objects
 * are normalized into the application's {@link AzureADMember} shape.
 *
 * @remarks
 * - The `ConsistencyLevel: 'eventual'` header is required by Microsoft Graph
 *   when using advanced query capabilities such as `$filter` or `$count` on
 *   properties like `userType`.
 * - This function accesses the auth store imperatively via
 *   {@link useAuthStore.getState}, so it can be safely called outside of React
 *   components (e.g. in loaders, effects, or non-hook contexts).
 *
 * @param token - Optional Microsoft Graph access token. When omitted, the token
 *   is retrieved from the auth store's current state.
 *
 * @returns A promise that resolves to an array of {@link AzureADMember} objects
 *   representing the organization's group members.
 *
 * @throws {Error} If no access token is available (neither passed nor present
 *   in the store).
 * @throws {Error} If the Microsoft Graph request fails (non-2xx response). The
 *   error message includes the HTTP status code and the response body text.
 *
 * @example
 * ```ts
 * // Using the token from the auth store
 * const members = await fetchMembers();
 *
 * // Providing an explicit token
 * const members = await fetchMembers(myAccessToken);
 * ```
 */
export async function fetchMembers(token?: string): Promise<AzureADMember[]> {
  // Prefer explicit token, fall back to store (non-hook access)
  const accessToken = token ?? useAuthStore.getState().accessToken;
  if (!accessToken) throw new Error('No access token available');

  const res = await fetch(graphConfig.graphGroupMembersEndpoint, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ConsistencyLevel: 'eventual', // required for $filter / $count on userType
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Graph error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.value.map((u: any) => ({
    id: u.id,
    displayName: u.displayName,
    mail: u.mail || u.userPrincipalName,
    userPrincipalName: u.userPrincipalName,
  }));
}