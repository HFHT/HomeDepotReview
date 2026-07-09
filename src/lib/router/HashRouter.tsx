/** @deprecated - migrated to React Router */
import {
  type ReactNode,
  useEffect,
  useState,
  createContext,
  useContext,
  useMemo,
} from 'react';

/**
 * Bag of dynamic path parameters extracted from a matched route.
 *
 * Keys correspond to the `:name` segments in a {@link RouteConfig.path}.
 *
 * @example
 * // For pattern "/projects/:projectId" matching "/projects/42":
 * { projectId: '42' }
 */
export type RouteParams = Record<string, string>;

/**
 * Route definition: a hash path pattern and the element to render.
 *
 * Paths may contain dynamic segments prefixed with a colon, e.g.
 * `"/projects/:projectId/tasks/:taskId"`. Matched values are exposed via
 * {@link useParams}.
 */
export interface RouteConfig {
  path: string;
  element: ReactNode;
}

interface RouterContextValue {
  path: string;
  params: RouteParams;
}

/**
 * Null default lets {@link useCurrentPath} detect when it is used outside a
 * {@link RouterProvider}, instead of silently returning a fake `'/'`.
 */
const RouterContext = createContext<RouterContextValue | null>(null);

/**
 * Reads the current hash path (without the leading "#").
 * Defaults to "/" when no hash is set.
 */
function getCurrentHashPath(): string {
  const hash = window.location.hash.replace(/^#/, '');
  return hash || '/';
}

/**
 * Splits a path into its non-empty segments.
 *
 * @param path - A path such as `"/projects/42"`.
 * @returns The segment list, e.g. `['projects', '42']`.
 */
function toSegments(path: string): string[] {
  return path.split('/').filter(Boolean);
}

/**
 * Attempts to match a concrete path against a route pattern, extracting any
 * dynamic `:param` segments.
 *
 * @param pattern - The route pattern, e.g. `"/projects/:projectId"`.
 * @param path - The active concrete path, e.g. `"/projects/42"`.
 * @returns The extracted params when the path matches, otherwise `null`.
 *
 * @example
 * matchPath('/projects/:id', '/projects/42'); // { id: '42' }
 * matchPath('/projects/:id', '/settings');    // null
 */
export function matchPath(pattern: string, path: string): RouteParams | null {
  const patternSegments = toSegments(pattern);
  const pathSegments = toSegments(path);

  if (patternSegments.length !== pathSegments.length) {
    return null;
  }

  const params: RouteParams = {};

  for (let i = 0; i < patternSegments.length; i += 1) {
    const patternSeg = patternSegments[i];
    const pathSeg = pathSegments[i];

    if (patternSeg.startsWith(':')) {
      // Dynamic segment: capture the decoded value under its param name.
      params[patternSeg.slice(1)] = decodeURIComponent(pathSeg);
    } else if (patternSeg !== pathSeg) {
      // Static segment mismatch: this route does not match.
      return null;
    }
  }

  return params;
}

/**
 * Programmatically navigates to a hash-based route.
 *
 * @param path - The target path, e.g. "/settings" or "/projects/42".
 */
export function navigate(path: string): void {
  window.location.hash = path;
}

/**
 * Hook returning the current hash path.
 *
 * @throws If called outside a {@link RouterProvider}.
 */
export function useCurrentPath(): string {
  const ctx = useContext(RouterContext);
  if (!ctx) {
    throw new Error('useCurrentPath must be used within a <RouterProvider>');
  }
  return ctx.path;
}

/**
 * Hook returning the dynamic params for the currently matched route.
 *
 * Returns an empty object when the active route has no params (or no route
 * matched).
 *
 * @throws If called outside a {@link RouterProvider}.
 *
 * @example
 * // Route pattern: "/projects/:projectId"
 * const { projectId } = useParams();
 */
export function useParams(): RouteParams {
  const ctx = useContext(RouterContext);
  if (!ctx) {
    throw new Error('useParams must be used within a <RouterProvider>');
  }
  return ctx.params;
}

/**
 * Owns the hash-based routing state and exposes it via context.
 *
 * Must wrap **everything** that needs to know the current route — including
 * navigation chrome (sidebars, bottom bars) and the {@link Routes} renderer —
 * so they all share a single source of truth.
 *
 * Param extraction is performed by {@link Routes} (which knows the route
 * table) and injected back into context, so {@link useParams} works anywhere
 * beneath the provider.
 *
 * @param props.children - The subtree that can read the current path.
 *
 * @example
 * <RouterProvider>
 *   <AppLayout>
 *     <Routes routes={appRoutes} notFound={<NotFound />} />
 *   </AppLayout>
 * </RouterProvider>
 */
export function RouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState<string>(getCurrentHashPath());
  const [params, setParams] = useState<RouteParams>({});

  useEffect(() => {
    const handler = () => setPath(getCurrentHashPath());
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const value = useMemo<RouterContextValue & { setParams: typeof setParams }>(
    () => ({ path, params, setParams }),
    [path, params],
  );

  return (
    <RouterContext.Provider value={value}>{children}</RouterContext.Provider>
  );
}

/**
 * Internal context accessor that also exposes the param setter, so {@link Routes}
 * can publish the params it extracts during matching.
 */
function useRouterInternal(): RouterContextValue & {
  setParams: (params: RouteParams) => void;
} {
  const ctx = useContext(RouterContext) as
    | (RouterContextValue & { setParams: (params: RouteParams) => void })
    | null;
  if (!ctx) {
    throw new Error('Routes must be used within a <RouterProvider>');
  }
  return ctx;
}

/**
 * Renders the first matching route element, or `notFound` when none match.
 * Reads the active path from the surrounding {@link RouterProvider} and
 * publishes any extracted path params back into context for {@link useParams}.
 *
 * Routes are evaluated in array order, so place more specific patterns before
 * broader ones.
 *
 * @param props.routes - Candidate routes to match against the active path.
 * @param props.notFound - Fallback element when no route matches.
 */
export function Routes({
  routes,
  notFound,
}: {
  routes: RouteConfig[];
  notFound?: ReactNode;
}) {
  const { path, params, setParams } = useRouterInternal();

  // Resolve the matching route and its params for the current path.
  const matched = useMemo(() => {
    for (const route of routes) {
      const extracted = matchPath(route.path, path);
      if (extracted) {
        return { element: route.element, params: extracted };
      }
    }
    return null;
  }, [routes, path]);

  const nextParams = matched?.params ?? {};

  // Keep context params in sync without causing an extra render when unchanged.
  useEffect(() => {
    const changed =
      Object.keys(nextParams).length !== Object.keys(params).length ||
      Object.keys(nextParams).some((k) => nextParams[k] !== params[k]);
    if (changed) {
      setParams(nextParams);
    }
  }, [nextParams, params, setParams]);

  return <>{matched ? matched.element : notFound ?? null}</>;
}