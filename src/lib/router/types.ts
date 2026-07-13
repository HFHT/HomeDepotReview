
import { Icon } from "@tabler/icons-react";
import { ReactNode } from "react";

/**
 * Navigation metadata attached to a route when it should appear in the
 * primary navigation (desktop sidebar / mobile bottom bar).
 *
 * @typedef {Object} NavMeta
 * @property {string} label - Human-readable text shown in the nav.
 * @property {Icon} icon - Tabler icon component rendered for the item.
 * @property {number} [order] - Optional sort order within the nav.
 */
export interface NavMeta {
  label: string;
  icon: Icon;
  order?: number;
  baseRoute?: string;
}

/**
 * Single source of truth describing an application route: its absolute path,
 * the element to render, and optional navigation metadata.
 *
 * @typedef {Object} AppRoute
 * @property {string} path - Absolute React Router path (e.g. `'/settings'`).
 * @property {ReactNode} element - Element rendered when the route is active.
 * @property {NavMeta} [nav] - Present only if the route appears in the nav.
 */
export interface AppRoute {
  path: string;
  element: ReactNode;
  nav?: NavMeta;
}