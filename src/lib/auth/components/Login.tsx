import { Button, Card, Center, Stack, Text, Title, ThemeIcon } from '@mantine/core';
import { IconBrandWindows, IconHomeHeart } from '@tabler/icons-react';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../config/msalConfig';

/**
 * Login page component for the Habitat IT Inventory application.
 *
 * Renders a centered, branded sign-in card that initiates Microsoft
 * authentication via MSAL (Microsoft Authentication Library). When the user
 * clicks "Sign in with Microsoft", a redirect-based login flow is triggered
 * using the configured {@link loginRequest} scopes. These scopes grant the
 * application access to Microsoft Graph, which is subsequently used to
 * retrieve organization members.
 *
 * @remarks
 * - Uses the {@link https://learn.microsoft.com/javascript/api/@azure/msal-react/ | @azure/msal-react}
 *   `useMsal` hook to access the active {@link https://learn.microsoft.com/javascript/api/@azure/msal-browser/publicclientapplication | PublicClientApplication} instance.
 * - Authentication is performed via `instance.loginRedirect`, which navigates
 *   the browser to the Microsoft identity platform and returns to the app on success.
 * - Styled with Mantine components and the Habitat for Humanity theme
 *   (e.g., the `habitatBlue` color and brand gradient background).
 * - Access is restricted to authorized Habitat for Humanity personnel.
 *
 * @returns The rendered login screen as a React element.
 *
 * @example
 * ```tsx
 * import { Login } from './components/Login';
 *
 * function App() {
 *   return (
 *     <UnauthenticatedTemplate>
 *       <Login title='title' desc='description' />
 *     </UnauthenticatedTemplate>
 *   );
 * }
 * ```
 */
interface LoginInterface {
  title: string,
  desc: string
}
export function Login({ title, desc }: LoginInterface) {
  /**
   * The MSAL instance used to initiate the Microsoft authentication flow.
   * @see {@link useMsal}
   */
  const { instance } = useMsal();

  return (
    <Center
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #00457c 0%, #76bc21 100%)'
      }}
    >
      <Card w={420} p="xl" shadow="xl">
        <Stack align="center" gap="md">
          <ThemeIcon size={80} radius="xl" color="habitatBlue" variant="light">
            <IconHomeHeart size={48} />
          </ThemeIcon>
          <Title order={2} ta="center" c="habitatBlue">
            {title}
          </Title>
          <Text c="dimmed" ta="center" size="sm">
            {desc}
          </Text>
          <Button
            fullWidth
            size="md"
            leftSection={<IconBrandWindows size={18} />}
            color="habitatBlue"
            onClick={() => instance.loginRedirect(loginRequest)}
          >
            Sign in with Microsoft
          </Button>
          <Text c="dimmed" size="xs" ta="center">
            Authorized Habitat for Humanity Tucson personnel only
          </Text>
        </Stack>
      </Card>
    </Center>
  );
}