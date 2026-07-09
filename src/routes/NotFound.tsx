import { Button, Center, Stack, Text, Title } from '@mantine/core';
import { useNavigate } from 'react-router-dom';

/** Fallback page rendered for unmatched routes. */
export function NotFound() {
  const navigate = useNavigate();
  return (
    <Center h="60vh">
      <Stack align="center" gap="sm">
        <Title order={2}>404</Title>
        <Text c="dimmed">The page you&apos;re looking for doesn&apos;t exist.</Text>
        <Button onClick={() => navigate('/')}>Go Home</Button>
      </Stack>
    </Center>
  );
}
