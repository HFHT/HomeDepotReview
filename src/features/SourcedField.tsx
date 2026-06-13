// /**
//  * @file Wraps a header-field input with a label, optional lock icon, and a
//  * source badge/tooltip describing its change chain.
//  */
// import type { JSX, ReactNode } from 'react';
// import { Flex, Group, Stack, Text } from '@mantine/core';
// import { IconLock } from '@tabler/icons-react';
// import type { AuditChange } from '../../../services/receiptTypes';
// import { SourceBadge } from './ChainTooltip';

// /** Props for {@link SourcedField}. */
// interface SourcedFieldProps {
//   /** Field label. */
//   label: string;
//   /** Field key for chain resolution (omit when locked/non-audited). */
//   fieldKey?: string;
//   /** Receipt audit trail. */
//   audit?: AuditChange[];
//   /** When true, renders a lock icon and no source badge. */
//   locked?: boolean;
//   /** The input control. */
//   children: ReactNode;
// }

// /**
//  * Renders `label + lock/badge` above an input control.
//  * @param props - {@link SourcedFieldProps}.
//  * @example <SourcedField label="Total" fieldKey="receiptTotal" audit={r.auditTrail}><NumberInput .../></SourcedField>
//  */
// export function SourcedField({ label, fieldKey, audit, locked, children }: SourcedFieldProps): JSX.Element {
//   return (
//     <Stack gap={2}>
//       <Flex>
//         <Group gap={4} align="center">
//           <Text size="sm" fw={500}>
//             {label}
//           </Text>
//           {locked && <IconLock size={12} />}
//         </Group>
//         {!locked && fieldKey && audit && (
//           <Group gap={4}>
//             <SourceBadge audit={audit} fieldKey={fieldKey} />
//           </Group>
//         )}
//       </Flex>
//       {children}

//     </Stack>
//   );
// }

import type { JSX, ReactNode } from 'react';
import { Flex, Group, Stack, Text } from '@mantine/core';
import { IconLock } from '@tabler/icons-react';
import type { Receipt } from '../services/receiptTypes';
import { SourceBadge } from './ChainTooltip';

interface SourcedFieldProps {
  label: string;
  fieldKey?: string;
  receipt?: Receipt;
  lineItemIndex?: number;
  locked?: boolean;
  children: ReactNode;
}

export function SourcedField({
  label,
  fieldKey,
  receipt,
  lineItemIndex,
  locked,
  children,
}: SourcedFieldProps): JSX.Element {
  return (
    <Stack gap={2}>
      <Flex>
        <Group gap={4} align="center">
          <Text size="sm" fw={500}>
            {label}
          </Text>
          {locked && <IconLock size={12} />}
        </Group>
        {!locked && fieldKey && receipt && (
          <Group gap={4}>
            <SourceBadge receipt={receipt} fieldKey={fieldKey} lineItemIndex={lineItemIndex} />
          </Group>
        )}
      </Flex>
      {children}
    </Stack>
  );
}