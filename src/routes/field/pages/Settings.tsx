import { Container, Text, Title } from '@mantine/core';

/**
 * Placeholder Settings page. Content/functionality to be defined in a future
 * release.
 */
export function Settings() {
  return (
    <Container>
      <Title order={2} mb="sm">
        Settings
      </Title>
      <Text c="dimmed">Application settings will be available here in a future release.</Text>
    </Container>
  );
}