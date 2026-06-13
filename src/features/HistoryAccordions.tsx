// /**
//  * @file Collapsible audit trail and review history panels (full width).
//  */
// import { Accordion, Table, Text } from '@mantine/core';
// import type { Receipt } from '../../../services/receiptTypes';
// import { JSX } from 'react/jsx-runtime';

// /** Props for {@link HistoryAccordions}. */
// interface HistoryAccordionsProps {
//   /** Receipt being reviewed. */
//   receipt: Receipt;
// }

// /**
//  * Renders collapsible audit + review-history tables.
//  * @param props - {@link HistoryAccordionsProps}.
//  */
// export function HistoryAccordions({ receipt }: HistoryAccordionsProps): JSX.Element {
//   return (
//     <Accordion variant="separated" multiple>
//       <Accordion.Item value="audit">
//         <Accordion.Control>Audit Trail ({receipt.auditTrail.length})</Accordion.Control>
//         <Accordion.Panel>
//           <Table>
//             <Table.Thead>
//               <Table.Tr>
//                 <Table.Th>Field</Table.Th>
//                 <Table.Th>Line</Table.Th>
//                 <Table.Th>Layer</Table.Th>
//                 <Table.Th>AI</Table.Th>
//                 <Table.Th>Field</Table.Th>
//                 <Table.Th>Finance</Table.Th>
//                 <Table.Th>By</Table.Th>
//               </Table.Tr>
//             </Table.Thead>
//             <Table.Tbody>
//               {receipt.auditTrail.map((a, i) => (
//                 <Table.Tr key={i}>
//                   <Table.Td>{a.fieldKey}</Table.Td>
//                   <Table.Td>{a.lineItemDescription ?? '—'}</Table.Td>
//                   <Table.Td>{a.layer}</Table.Td>
//                   <Table.Td>{a.originalValue ?? '—'}</Table.Td>
//                   <Table.Td>{a.fieldValue ?? '—'}</Table.Td>
//                   <Table.Td>{a.financeValue ?? '—'}</Table.Td>
//                   <Table.Td>{a.by}</Table.Td>
//                 </Table.Tr>
//               ))}
//             </Table.Tbody>
//           </Table>
//         </Accordion.Panel>
//       </Accordion.Item>

//       <Accordion.Item value="history">
//         <Accordion.Control>Review History ({receipt.reviewHistory.length})</Accordion.Control>
//         <Accordion.Panel>
//           <Table>
//             <Table.Thead>
//               <Table.Tr>
//                 <Table.Th>Status</Table.Th>
//                 <Table.Th>When</Table.Th>
//                 <Table.Th>By</Table.Th>
//                 <Table.Th>Reason</Table.Th>
//               </Table.Tr>
//             </Table.Thead>
//             <Table.Tbody>
//               {receipt.reviewHistory.map((h, i) => (
//                 <Table.Tr key={i}>
//                   <Table.Td>{h.status.replace(/_/g, ' ')}</Table.Td>
//                   <Table.Td>{new Date(h.changedAt).toLocaleString()}</Table.Td>
//                   <Table.Td>{h.changedBy}</Table.Td>
//                   <Table.Td>{h.reason ?? <Text c="dimmed">—</Text>}</Table.Td>
//                 </Table.Tr>
//               ))}
//             </Table.Tbody>
//           </Table>
//         </Accordion.Panel>
//       </Accordion.Item>
//     </Accordion>
//   );
// }

/**
 * @file Collapsible audit trail and review history panels (full width).
 */
import { Accordion, Table, Text } from '@mantine/core';
import type { Receipt } from '../services/receiptTypes';
import { JSX } from 'react/jsx-runtime';

/** Props for {@link HistoryAccordions}. */
interface HistoryAccordionsProps {
  /** Receipt being reviewed. */
  receipt: Receipt;
}

/** Formats an ISO timestamp for display. */
function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString();
}

/**
 * Renders collapsible audit + review-history tables.
 * @param props - {@link HistoryAccordionsProps}.
 */
export function HistoryAccordions({ receipt }: HistoryAccordionsProps): JSX.Element {
  // Oldest → newest so the trail reads as a progression of changes.
  const auditTrail = [...receipt.auditTrail].sort(
    (a, b) => Date.parse(a.changedAt) - Date.parse(b.changedAt),
  );

  return (
    <Accordion variant="separated" multiple>
      <Accordion.Item value="audit">
        <Accordion.Control>Audit Trail ({auditTrail.length})</Accordion.Control>
        <Accordion.Panel>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Field</Table.Th>
                <Table.Th>Line</Table.Th>
                <Table.Th>Layer</Table.Th>
                <Table.Th>Original</Table.Th>
                <Table.Th>Changed</Table.Th>
                <Table.Th>When</Table.Th>
                <Table.Th>By</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {auditTrail.map((a, i) => (
                <Table.Tr key={`${a.fieldKey}-${a.changedAt}-${i}`}>
                  <Table.Td>{a.fieldKey}</Table.Td>
                  <Table.Td>{a.lineItemDescription ?? '—'}</Table.Td>
                  <Table.Td>{a.layer}</Table.Td>
                  <Table.Td>{a.originalValue ?? '—'}</Table.Td>
                  <Table.Td>{a.changedValue ?? '—'}</Table.Td>
                  <Table.Td>{formatTimestamp(a.changedAt)}</Table.Td>
                  <Table.Td>{a.changedBy}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Accordion.Panel>
      </Accordion.Item>

      <Accordion.Item value="history">
        <Accordion.Control>Review History ({receipt.reviewHistory.length})</Accordion.Control>
        <Accordion.Panel>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Status</Table.Th>
                <Table.Th>When</Table.Th>
                <Table.Th>By</Table.Th>
                <Table.Th>Reason</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {receipt.reviewHistory.map((h, i) => (
                <Table.Tr key={i}>
                  <Table.Td>{h.status.replace(/_/g, ' ')}</Table.Td>
                  <Table.Td>{formatTimestamp(h.changedAt)}</Table.Td>
                  <Table.Td>{h.changedBy}</Table.Td>
                  <Table.Td>{h.reason ?? <Text c="dimmed">—</Text>}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  );
}