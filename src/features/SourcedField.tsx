
// import type { JSX, ReactNode } from 'react';
// import { Flex, Group, Stack, Text } from '@mantine/core';
// import { IconLock } from '@tabler/icons-react';
// import type { Receipt } from '../services/receiptTypes';
// import { SourceBadge } from './ChainTooltip';

// interface SourcedFieldProps {
//   label: string;
//   fieldKey?: string;
//   receipt?: Receipt;
//   lineItemKey?: string;
//   locked?: boolean;
//   children: ReactNode;
// }

// export function SourcedField({
//   label,
//   fieldKey,
//   receipt,
//   lineItemKey,
//   locked,
//   children,
// }: SourcedFieldProps): JSX.Element {
//   return (
//     <Stack gap={2}>
//       <Flex>
//         <Group gap={4} align="center">
//           <Text size="sm" fw={500}>
//             {label}
//           </Text>
//           {locked && <IconLock size={12} />}
//         </Group>
//         {!locked && fieldKey && receipt && (
//           <Group gap={4}>
//             <SourceBadge receipt={receipt} fieldKey={fieldKey} lineItemKey={lineItemKey} />
//           </Group>
//         )}
//       </Flex>
//       {children}
//     </Stack>
//   );
// }