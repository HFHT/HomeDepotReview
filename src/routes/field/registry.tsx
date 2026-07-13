import { IconHistory, IconReceipt, IconSettings } from '@tabler/icons-react';
import { History } from './pages/History'
import { Settings } from './pages/Settings'

import { AppRoute, NavMeta } from '../../lib/router/types';
import { NewReceipt } from './pages/NewReceipt';

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
    element: <NewReceipt />,
    nav: { label: 'New Receipt', icon: IconReceipt, order: 5, baseRoute: 'field' },
  },
  {
    path: 'history',
    element: <History />,
    nav: { label: 'History', icon: IconHistory, order: 10, baseRoute: 'field' },
  },
  {
    path: 'settings',
    element: <Settings />,
    nav: { label: 'Settings', icon: IconSettings, order: 50, baseRoute: 'field' },
  },
];

/**
 * Routes that should be rendered in the primary navigation, in display order.
 *
 * @type {(AppRoute & { nav: NavMeta })[]}
 */
export const navRoutes = appRoutes
  .filter((r): r is AppRoute & { nav: NavMeta } => Boolean(r.nav))
  .sort((a, b) => (a.nav.order ?? 0) - (b.nav.order ?? 0));