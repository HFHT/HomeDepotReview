import type { ReviewStatus } from '../types/ReviewStatus';

/** The four top-level receipt list groupings driven by the route registry. */
export type ReceiptGroup = 'inProcess' | 'complete' | 'rejected' | 'all';

/** Human-readable label for each lifecycle status. */
export const STATUS_LABEL: Record<ReviewStatus, string> = {
  pending: 'Pending',
  in_review: 'In Review',
  on_hold: 'On Hold',
  entered_in_sage: 'Entered in Sage',
  rejected: 'Rejected',
};

/** Badge color for each lifecycle status (per the ReceiptReviewHeader spec). */
export const STATUS_COLOR: Record<ReviewStatus, string> = {
  pending: 'gray',
  in_review: 'habitatBlue',
  on_hold: 'yellow',
  entered_in_sage: 'habitatGreen',
  rejected: 'red',
};

/** Maps each list route/group to the set of statuses it should display. */
export const GROUP_STATUSES: Record<ReceiptGroup, ReviewStatus[] | 'all'> = {
  inProcess: ['pending', 'in_review', 'on_hold'],
  complete: ['entered_in_sage'],
  rejected: ['rejected'],
  all: 'all',
};