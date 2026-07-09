
// /**
//  * @file Tooltip + marker primitives that render the AI → Field → Finance
//  * change chain for a field. Reused by header fields and line-item cells.
//  */
// import { Badge, Text, Tooltip } from '@mantine/core';
// import { IconAsterisk } from '@tabler/icons-react';
// import type { JSX, ReactNode } from 'react';
// import type { Receipt } from '../services/receiptTypes';
// import { resolveFieldChain, type ResolvedFieldChain } from '../services/auditChain';

// function chainLabel(chain: ResolvedFieldChain): ReactNode {
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

// interface ChainProps {
//   receipt: Receipt;
//   fieldKey: string;
//   lineItemKey?: string;
// }

// export function SourceBadge({ receipt, fieldKey, lineItemKey }: ChainProps): JSX.Element {
//   const chain = resolveFieldChain(receipt, fieldKey, lineItemKey);
//   const color =
//     chain.currentLayer === 'Finance' ? 'habitatGreen' : chain.currentLayer === 'Field' ? 'habitatBlue' : 'gray';
//   return (
//     <Tooltip label={chainLabel(chain)} multiline withArrow position="top-start">
//       <Badge color={color} variant="light" size="xs">
//         {chain.currentLayer}
//       </Badge>
//     </Tooltip>
//   );
// }

// export function ChangeMarker({ receipt, fieldKey, lineItemKey }: ChainProps): JSX.Element | null {
//   const chain = resolveFieldChain(receipt, fieldKey, lineItemKey);
//   if (!chain.edited) return null;
//   return (
//     <Tooltip label={chainLabel(chain)} multiline withArrow position="top-start">
//       <Text component="span" c="red" fw={700} ml={2} style={{ cursor: 'help' }}>
//         <IconAsterisk size={10} />
//       </Text>
//     </Tooltip>
//   );
// }