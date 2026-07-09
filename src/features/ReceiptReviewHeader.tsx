// /**
//  * @file Top banner for the review screen: back link, receipt #, created-by,
//  * and current status pill.
//  */
// import { Anchor, Badge, Group, Title } from '@mantine/core';
// import { IconArrowLeft } from '@tabler/icons-react';
// import { useNavigate } from 'react-router-dom';
// import type { Receipt, ReviewStatus } from '../services/receiptTypes';
// import { JSX } from 'react/jsx-runtime';

// /** Theme color per status. */
// const STATUS_COLOR: Record<ReviewStatus, string> = {
//   pending: 'gray',
//   in_review: 'habitatBlue',
//   on_hold: 'yellow',
//   entered_in_sage: 'habitatGreen',
//   rejected: 'red',
// };

// /** Props for {@link ReceiptReviewHeader}. */
// interface ReceiptReviewHeaderProps {
//   /** Receipt being reviewed. */
//   receipt: Receipt;
// }

// /**
//  * Renders the review-screen header banner.
//  * @param props - {@link ReceiptReviewHeaderProps}.
//  */
// export function ReceiptReviewHeader({ receipt }: ReceiptReviewHeaderProps): JSX.Element {
//   const navigate = useNavigate();
//   return (
//     <Group justify="space-between">
//       <Group gap="md">
//         <Anchor onClick={() => navigate(-1)} c="dimmed">
//           <Group gap={4}>
//             <IconArrowLeft size={16} /> Back
//           </Group>
//         </Anchor>
//         <Title order={3}>
//           Receipt {receipt.receiptNumber} · Created by {receipt.created.by} · {new Date(receipt.created.date).toLocaleDateString()}
//         </Title>
//       </Group>
//       <Badge size="lg" color={STATUS_COLOR[receipt.reviewStatus]} variant="light">
//         {receipt.reviewStatus.replace(/_/g, ' ')}
//       </Badge>
//     </Group>
//   );
// }