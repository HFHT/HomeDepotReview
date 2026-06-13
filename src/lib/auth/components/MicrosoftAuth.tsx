/**
 * @file MicrosoftAuthProvider.tsx
 * @module services/MicrosoftAuthProvider
 *
 * @description
 * Microsoft authentication service for the Habitat for Humanity application.
 * Wraps the MSAL (Microsoft Authentication Library) browser client to provide
 * sign-in/sign-out state, access-token acquisition, and React context to the
 * front-end SPA. Tokens acquired here are used to call Microsoft Graph for
 * retrieving organization members.
 *
 * @remarks
 * This module exposes a singleton {@link msalInstance}, a context provider
 * ({@link MicrosoftAuthProvider}), helper hooks/functions
 * ({@link useCurrentAccount}, {@link acquireAccessToken}), and re-exports the
 * MSAL `AuthenticatedTemplate` / `UnauthenticatedTemplate` components for
 * conditional rendering.
 *
 * @see {@link https://learn.microsoft.com/azure/active-directory/develop/msal-overview|MSAL Overview}
 * @see {@link https://learn.microsoft.com/graph/overview|Microsoft Graph}
 */

import { type ReactNode } from 'react';
import {
  MsalProvider,
  useMsal,
  AuthenticatedTemplate,
  UnauthenticatedTemplate
} from '@azure/msal-react';
import {
  PublicClientApplication,
  type IPublicClientApplication,
  type AccountInfo,
} from '@azure/msal-browser';
import { msalConfig, loginRequest } from '../config/msalConfig';

/**
 * Singleton MSAL instance shared across the entire application.
 *
 * @remarks
 * A single {@link PublicClientApplication} should exist per app to ensure a
 * consistent token cache and account state. It is constructed from
 * {@link msalConfig} and consumed by both the {@link MicrosoftAuthProvider}
 * context and the standalone {@link acquireAccessToken} helper.
 *
 * @constant
 * @type {IPublicClientApplication}
 */
export const msalInstance: IPublicClientApplication = new PublicClientApplication(
  msalConfig
);

/**
 * Props for the {@link MicrosoftAuthProvider} wrapper component.
 *
 * @interface MicrosoftAuthProviderProps
 */
interface MicrosoftAuthProviderProps {
  /**
   * The application subtree that should have access to the MSAL context.
   *
   * @type {ReactNode}
   */
  children: ReactNode;
}

/**
 * Top-level provider that exposes the MSAL authentication context to all
 * descendant components.
 *
 * @remarks
 * Wrap your application root with this component so that hooks such as
 * {@link useCurrentAccount} and MSAL React templates function correctly.
 *
 * @param {MicrosoftAuthProviderProps} props - The component props.
 * @param {ReactNode} props.children - The subtree to render within the MSAL context.
 * @returns {JSX.Element} The provider-wrapped children.
 *
 * @example
 * ```tsx
 * <MicrosoftAuthProvider>
 *   <App />
 * </MicrosoftAuthProvider>
 * ```
 */
export function MicrosoftAuthProvider({ children }: MicrosoftAuthProviderProps) {
  return <MsalProvider instance={msalInstance}>{children}</MsalProvider>;
}

/**
 * React hook that returns the currently signed-in account.
 *
 * @remarks
 * If multiple accounts are present in the MSAL cache, the first account is
 * returned. Must be called from within a {@link MicrosoftAuthProvider}.
 *
 * @returns {AccountInfo | null} The active account, or `null` if no user is signed in.
 *
 * @example
 * ```tsx
 * const account = useCurrentAccount();
 * if (account) {
 *   console.log(`Signed in as ${account.username}`);
 * }
 * ```
 */
export function useCurrentAccount(): AccountInfo | null {
  const { accounts } = useMsal();
  return accounts[0] ?? null;
}

/**
 * Acquires a fresh access token for the scopes configured in
 * {@link loginRequest}.
 *
 * @remarks
 * Attempts a silent token acquisition first using the cached account. If the
 * silent request fails (e.g. the cache is stale or interaction is required),
 * it falls back to an interactive popup flow. The returned token is intended
 * to authorize Microsoft Graph requests, such as fetching organization members.
 *
 * @async
 * @returns {Promise<string | null>} A promise that resolves to the access token
 * string, or `null` if no user is signed in.
 *
 * @throws {Error} Propagates any error thrown by the interactive popup fallback
 * (e.g. the user closes the popup or consent is denied).
 *
 * @example
 * ```ts
 * const token = await acquireAccessToken();
 * if (token) {
 *   const res = await fetch('https://graph.microsoft.com/v1.0/me/memberOf', {
 *     headers: { Authorization: `Bearer ${token}` }
 *   });
 * }
 * ```
 */
export async function acquireAccessToken(): Promise<string | null> {
  const account = msalInstance.getAllAccounts()[0];
  if (!account) return null;

  try {
    const result = await msalInstance.acquireTokenSilent({
      ...loginRequest,
      account
    });
    return result.accessToken;
  } catch (err) {
    console.warn('Silent token acquisition failed; falling back to popup.', err);
    const result = await msalInstance.acquireTokenPopup(loginRequest);
    return result.accessToken;
  }
}

/**
 * Re-exported MSAL React templates for conditional, auth-aware rendering.
 *
 * @remarks
 * Re-exporting these from this module allows callers to import all
 * authentication primitives from a single location, e.g.
 * `<AuthenticatedTemplate>…</AuthenticatedTemplate>`.
 *
 * @see {@link AuthenticatedTemplate}
 * @see {@link UnauthenticatedTemplate}
 */
export { AuthenticatedTemplate, UnauthenticatedTemplate };