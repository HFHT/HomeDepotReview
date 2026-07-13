/**
 * @file Barrel export for authentication-bootstrap hooks.
 *
 * @remarks
 * These hooks encapsulate the side effects that run once a user is signed
 * in: acquiring a Graph token, loading org members, loading select-list
 * data, and resolving/cleaning up the user's avatar. They're consumed
 * together by {@link App}, but kept independent so each can be tested,
 * reused, or removed in isolation.
 */
export * from './useTokenAcquisition';
export * from './useOrgMembers';
export * from './useProjectSelects';
export * from './useUserAvatar';