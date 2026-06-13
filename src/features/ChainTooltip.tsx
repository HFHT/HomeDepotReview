// /**
//  * @file Tooltip + marker primitives that render the AI → Field → Finance
//  * change chain for a field. Reused by header fields and line-item cells.
//  */
// import { Badge, Text, Tooltip } from '@mantine/core';
// import { IconAsterisk, IconInfoCircle } from '@tabler/icons-react';
// import type { JSX, ReactNode } from 'react';
// import type { AuditChange } from '../../../services/receiptTypes';
// import { buildFieldChain, type FieldChangeChain } from '../../../services/auditChain';

// /** Builds the tooltip body for a resolved change chain. */
// function chainLabel(chain: FieldChangeChain): ReactNode {
//   return (
//     <div>
//       {chain.chain.map((c) => (
//         <Text key={c.layer} size="xs" fw={c.layer === chain.currentLayer ? 700 : 400}>
//           {c.layer}: {c.value ?? '—'}
//           {c.layer === chain.currentLayer ? '  ← current' : ''}
//         </Text>
//       ))}
//     </div>
//   );
// }

// /** Props shared by the chain display components. */
// interface ChainProps {
//   /** Receipt audit trail. */
//   audit: AuditChange[];
//   /** Field key being described. */
//   fieldKey: string;
//   /** Line-item index, when describing a line-item field. */
//   lineItemIndex?: number;
// }

// /**
//  * Source badge (AI / Field / Finance) with an info tooltip showing the chain.
//  * For use beneath header field inputs.
//  * @param props - {@link ChainProps}.
//  */
// export function SourceBadge({ audit, fieldKey, lineItemIndex }: ChainProps): JSX.Element {
//   const chain = buildFieldChain(audit, fieldKey, lineItemIndex);
//   const color = chain.currentLayer === 'Finance' ? 'habitatGreen' : chain.currentLayer === 'Field' ? 'habitatBlue' : 'gray';
//   return (
//     <Tooltip label={chainLabel(chain)} multiline withArrow position="bottom-start">
//       <Badge color={color} variant="light" size="xs">
//         {chain.currentLayer}
//       </Badge>
//     </Tooltip>
//   );
// }

// /**
//  * Inline `*` marker for edited line-item cells; hover reveals the chain.
//  * Renders nothing when the field was never changed past the AI layer.
//  * @param props - {@link ChainProps}.
//  */
// export function ChangeMarker({ audit, fieldKey, lineItemIndex }: ChainProps): JSX.Element | null {
//   const chain = buildFieldChain(audit, fieldKey, lineItemIndex);
//   if (!chain.edited) return null;
//   return (
//     <Tooltip label={chainLabel(chain)} multiline withArrow position="top">
//       <Text component="span" c="red" fw={700} ml={2} style={{ cursor: 'help' }}>
//         <IconAsterisk size={10} />
//       </Text>
//     </Tooltip>
//   );
// }

/**
 * @file Tooltip + marker primitives that render the AI → Field → Finance
 * change chain for a field. Reused by header fields and line-item cells.
 */
import { Badge, Text, Tooltip } from '@mantine/core';
import { IconAsterisk } from '@tabler/icons-react';
import type { JSX, ReactNode } from 'react';
import type { Receipt } from '../services/receiptTypes';
import { resolveFieldChain, type ResolvedFieldChain } from '../services/auditChain';

function chainLabel(chain: ResolvedFieldChain): ReactNode {
  return (
    <div>
      {chain.chain.map((c) => (
        <Text key={c.layer} size="xs" fw={c.layer === chain.currentLayer ? 700 : 400}>
          {c.layer}: {c.value ?? '—'}
          {c.layer === chain.currentLayer ? '  ← current' : ''}
        </Text>
      ))}
    </div>
  );
}

interface ChainProps {
  receipt: Receipt;
  fieldKey: string;
  lineItemIndex?: number;
}

export function SourceBadge({ receipt, fieldKey, lineItemIndex }: ChainProps): JSX.Element {
  const chain = resolveFieldChain(receipt, fieldKey, lineItemIndex);
  const color =
    chain.currentLayer === 'Finance' ? 'habitatGreen' : chain.currentLayer === 'Field' ? 'habitatBlue' : 'gray';
  return (
    <Tooltip label={chainLabel(chain)} multiline withArrow position="bottom-start">
      <Badge color={color} variant="light" size="xs">
        {chain.currentLayer}
      </Badge>
    </Tooltip>
  );
}

export function ChangeMarker({ receipt, fieldKey, lineItemIndex }: ChainProps): JSX.Element | null {
  const chain = resolveFieldChain(receipt, fieldKey, lineItemIndex);
  if (!chain.edited) return null;
  return (
    <Tooltip label={chainLabel(chain)} multiline withArrow position="top">
      <Text component="span" c="red" fw={700} ml={2} style={{ cursor: 'help' }}>
        <IconAsterisk size={10} />
      </Text>
    </Tooltip>
  );
}