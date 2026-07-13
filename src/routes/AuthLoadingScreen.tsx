import { Center, Loader } from '@mantine/core';

/**
 * Full-viewport loading indicator shown while MSAL is still determining
 * the current auth state (`inProgress === 'startup' | 'handleRedirect'`).
 *
 * @remarks
 * Extracted as its own component so this "waiting on MSAL" state can be
 * reused or tested without duplicating markup inside {@link App}.
 */
export function AuthLoadingScreen() {
  return (
    <Center h="100vh">
      <Loader color="habitatGreen" />
    </Center>
  );
}