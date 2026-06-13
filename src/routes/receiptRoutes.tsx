/**
 * @file Receipt review routes for the finance team. Spread `receiptRoutes`
 * into the canonical `appRoutes` array. Three routes surface in navigation;
 * the detail route is reached by row click.
 */
import type { ReactNode } from 'react';
import { IconFileInvoice, IconCircleCheck, IconCircleX } from '@tabler/icons-react';
import type { ReviewStatus } from '../services/receiptTypes';
import { ReceiptListPage } from '../pages/ReceiptListPage';
import { ReceiptReviewPage } from '../pages/ReceiptReviewPage';

/** Navigation metadata for a route (shape mirrors the framework `NavMeta`). */
interface NavMeta {
  label: string;
  icon: ReactNode;
  order: number;
}

/** Framework route shape (mirrors `AppRoute` in the canonical routes module). */
interface AppRoute {
  path: string;
  element: ReactNode;
  nav?: NavMeta;
}

/** Status buckets driving the three list routes. */
export const RECEIPT_STATUS_GROUPS = {
  inProcess: ['pending', 'in_review', 'on_hold'] as ReviewStatus[],
  complete: ['entered_in_sage'] as ReviewStatus[],
  rejected: ['rejected'] as ReviewStatus[],
  all: ['pending', 'in_review', 'on_hold', 'entered_in_sage', 'rejected'] as ReviewStatus[],
} as const;

/** Identifier for a list group. */
export type ReceiptGroup = keyof typeof RECEIPT_STATUS_GROUPS;

/** Receipt review routes to merge into the app's canonical `appRoutes`. */
export const receiptRoutes: AppRoute[] = [
  {
    path: '/receipts/in-process',
    element: <ReceiptListPage group="inProcess" title="In Process" />,
    nav: { label: 'In Process', icon: <IconFileInvoice />, order: 10 },
  },
  {
    path: '/receipts/complete',
    element: <ReceiptListPage group="complete" title="Complete" />,
    nav: { label: 'Complete', icon: <IconCircleCheck />, order: 20 },
  },
  {
    path: '/receipts/rejected',
    element: <ReceiptListPage group="rejected" title="Rejected" />,
    nav: { label: 'Rejected', icon: <IconCircleX />, order: 30 },
  },
    {
    path: '/receipts/all',
    element: <ReceiptListPage group="all" title="All" />,
    nav: { label: 'All', icon: <IconFileInvoice />, order: 10 },
  },
  // Detail/review — no `nav` so it stays out of the menu.
  { path: '/receipts/:receiptId', element: <ReceiptReviewPage /> },
];