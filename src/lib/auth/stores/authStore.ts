import { create } from 'zustand';
import type { AccountInfo } from '@azure/msal-browser';
import { AzureADMember } from '../config/msalConfig';

/**
 * Represents the shape of the authentication store state and its associated actions.
 *
 * This store manages the authenticated user's account information, the Microsoft Graph
 * access token, and the collection of organization members retrieved via Microsoft Graph.
 *
 * @interface AuthState
 */
interface AuthState {
  /**
   * The currently authenticated user's account information provided by MSAL.
   * Will be `null` when no user is signed in.
   *
   * @type {AccountInfo | null}
   */
  account: AccountInfo | null;

  /**
   * The OAuth 2.0 access token used to authorize requests to Microsoft Graph.
   * Will be `null` when no token has been acquired or the user is signed out.
   *
   * @type {string | null}
   */
  accessToken: string | null;

  /**
   * The list of Azure AD organization members retrieved from Microsoft Graph.
   * Will be `null` until members have been fetched.
   *
   * @type {AzureADMember[] | null}
   */
  members: AzureADMember[] | null;

  selectedMember: AzureADMember | null;

  /** 
   * Object URL pointing to the signed-in user's cached avatar photo blob.
   * 'null' when the user has no photo, or none has been resolved yet.
   */
  avatarUrl: string | null;

  /**
   * 'true' while the avatar phot is being resolved (IndexedDB lookup or
   * Graph fetch). Used by {@link Header} to render an initials placeholder.
   */
  avatarLoading: boolean;

  /**
   * Updates the authenticated user's account information in the store.
   *
   * @param {AccountInfo | null} account - The MSAL account info to set, or `null` to clear it.
   * @returns {void}
   */
  setAccount: (account: AccountInfo | null) => void;

  /**
   * Updates the Microsoft Graph access token in the store.
   *
   * @param {string | null} token - The access token to set, or `null` to clear it.
   * @returns {void}
   */
  setAccessToken: (token: string | null) => void;

  /**
   * Updates the collection of Azure AD organization members in the store.
   *
   * @param {AzureADMember[] | null} members - The array of organization members to set, or `null` to clear it.
   * @returns {void}
   */
  setMembers: (members: AzureADMember[] | null) => void;
  setSelectedMember: (member: AzureADMember | null) => void;

  setAvatarUrl: (avatarUrl: string | null) => void;
  setAvatarLoading: (avatarLoading: boolean) => void;

   /** Resets all authentication-related state (used on sign-out). */
   resetAuth: () => void;
}

/**
 * Zustand store hook for managing Microsoft authentication state.
 *
 * Provides centralized, reactive access to the authenticated user's account,
 * the Microsoft Graph access token, and the organization members fetched via
 * Microsoft Graph. Components can subscribe to slices of this state and trigger
 * updates through the provided setter actions.
 *
 * @example
 * ```tsx
 * // Read state
 * const account = useAuthStore((state) => state.account);
 * const members = useAuthStore((state) => state.members);
 *
 * // Update state
 * const setAccount = useAuthStore((state) => state.setAccount);
 * setAccount(msalAccount);
 * ```
 *
 * @returns {AuthState} The authentication store state and actions.
 */
export const useAuthStore = create<AuthState>((set) => ({
  account: null,
  accessToken: null,
  members: null,
  selectedMember: null,
  avatarUrl: null,
  avatarLoading: false,
  /**
   * @inheritdoc
   */
  setAccount: (account) => set({ account }),

  /**
   * @inheritdoc
   */
  setAccessToken: (accessToken) => set({ accessToken }),

  /**
   * @inheritdoc
   */
  setMembers: (members: AzureADMember[] | null) => set({ members }),
  setSelectedMember: (selectedMember: AzureADMember | null) => set({ selectedMember }),
  setAvatarUrl: (avatarUrl) => set({ avatarUrl }),
  setAvatarLoading: (avatarLoading) => set({ avatarLoading }),

  resetAuth: ()=> 
  set({
    account:null,
    accessToken: null,
    members: null,
    selectedMember: null,
    avatarUrl: null,
    avatarLoading: false,
  }),
}));