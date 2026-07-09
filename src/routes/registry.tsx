// import { IconCircleCheck, IconCircleX, IconFileInvoice, IconInfinity } from '@tabler/icons-react';

// import { AppRoute, NavMeta } from '../lib/router/types';
// import { ReceiptListPage } from './ReceiptListPage';
// import { ReceiptReviewPage } from './ReceiptReviewPage';
// /**
//  * The canonical list of application routes. Both the router (for rendering)
//  * and the navigation components (for menu items) are derived from this array,
//  * so route information lives in exactly one place.
//  *
//  * @remarks
//  * Paths are absolute (leading `/`) for React Router and are compared directly
//  * against `location.pathname` for active-link styling.
//  *
//  * @type {AppRoute[]}
//  */
// export const appRoutes: AppRoute[] = [
//   {
//     path: '/receipts/in-process',
//     element: <ReceiptListPage group="inProcess" title="In Process" />,
//     nav: { label: 'In Process', icon: IconFileInvoice, order: 10 },
//   },
//   {
//     path: '/receipts/complete',
//     element: <ReceiptListPage group="complete" title="Complete" />,
//     nav: { label: 'Complete', icon: IconCircleCheck, order: 20 },
//   },
//   {
//     path: '/receipts/rejected',
//     element: <ReceiptListPage group="rejected" title="Rejected" />,
//     nav: { label: 'Rejected', icon: IconCircleX, order: 30 },
//   },
//   {
//     path: '/receipts/all',
//     element: <ReceiptListPage group="all" title="All" />,
//     nav: { label: 'All', icon: IconInfinity, order: 40 },
//   },
//   {
//     path: '/receipts/review/:id',
//     element: <ReceiptReviewPage />
//   }
// ];

// /**
//  * Routes that should be rendered in the primary navigation, in display order.
//  *
//  * @type {(AppRoute & { nav: NavMeta })[]}
//  */
// export const navRoutes = appRoutes
//   .filter((r): r is AppRoute & { nav: NavMeta } => Boolean(r.nav))
//   .sort((a, b) => (a.nav.order ?? 0) - (b.nav.order ?? 0));

import { IconCircleCheck, IconCircleX, IconFileInvoice, IconInfinity } from '@tabler/icons-react';

import { AppRoute, NavMeta } from '../lib/router/types';
import { ReceiptListPage } from './ReceiptListPage';
import { ReceiptReviewPage } from './ReceiptReviewPage';
/**
 * The canonical list of application routes. Both the router (for rendering)
 * and the navigation components (for menu items) are derived from this array,
 * so route information lives in exactly one place.
 *
 * @remarks
 * Paths are absolute (leading `/`) for React Router and are compared directly
 * against `location.pathname` for active-link styling.
 *
 * @type {AppRoute[]}
 */
export const appRoutes: AppRoute[] = [
  {
    path: '/',
    element: <ReceiptListPage group="inProcess" title="In Process" />,
    nav: { label: 'In Process', icon: IconFileInvoice, order: 10 },
  },
  {
    path: '/receipts/complete',
    element: <ReceiptListPage group="complete" title="Complete" />,
    nav: { label: 'Complete', icon: IconCircleCheck, order: 20 },
  },
  {
    path: '/receipts/rejected',
    element: <ReceiptListPage group="rejected" title="Rejected" />,
    nav: { label: 'Rejected', icon: IconCircleX, order: 30 },
  },
  {
    path: '/receipts/all',
    element: <ReceiptListPage group="all" title="All" />,
    nav: { label: 'All', icon: IconInfinity, order: 40 },
  },
  {
    path: '/receipts/review/:id',
    element: <ReceiptReviewPage />
  }
];

/**
 * Routes that should be rendered in the primary navigation, in display order.
 *
 * @type {(AppRoute & { nav: NavMeta })[]}
 */
export const navRoutes = appRoutes
  .filter((r): r is AppRoute & { nav: NavMeta } => Boolean(r.nav))
  .sort((a, b) => (a.nav.order ?? 0) - (b.nav.order ?? 0));