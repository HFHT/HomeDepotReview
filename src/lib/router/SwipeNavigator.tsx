import { ReactNode, TouchEvent, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMediaQuery } from '@mantine/hooks';
import { navRoutes } from '../../routes/registry';
import classes from './SwipeNavigator.module.css';

/**
 * Minimum horizontal travel (in px) required for a swipe to commit to a
 * navigation. Shorter drags snap back to the current page.
 */
const SWIPE_THRESHOLD = 60;

/**
 * Mobile-only horizontal swipe navigator for the primary destinations.
 *
 * @remarks
 * Wraps the routed page content and, **only on small viewports**
 * (`max-width: 48em`, matching the AppShell `sm` breakpoint), enables
 * left/right swipe gestures to move between the ordered {@link navRoutes}
 * (e.g. New Receipt → History → Settings).
 *
 * Behavior:
 * - Tracks touch drag and translates the current page live for tactile feedback.
 * - Ignores predominantly-vertical gestures so normal scrolling is unaffected
 *   (reinforced by `touch-action: pan-y` in the stylesheet).
 * - On release past {@link SWIPE_THRESHOLD}, navigates to the adjacent route;
 *   otherwise the page snaps back.
 * - Plays a directional slide-in animation on every route change. Direction is
 *   derived from the route's position within {@link navRoutes}, so taps on the
 *   bottom navigation animate correctly too.
 * - On desktop (and for routes not present in {@link navRoutes}) it renders its
 *   children untouched.
 *
 * @param props - Component props.
 * @param props.children - The routed content (typically the `<Routes>` element).
 * @returns The swipe-enabled wrapper on mobile, or the children unchanged otherwise.
 *
 * @example
 * ```tsx
 * <SwipeNavigator>
 *   <Routes>{/* ... *\/}</Routes>
 * </SwipeNavigator>
 * ```
 */
export function SwipeNavigator({ children }: { children: ReactNode }) {
  const isMobile = useMediaQuery('(max-width: 48em)');
  const { pathname } = useLocation();
  const navigate = useNavigate();

  /** Starting touch coordinates for the in-progress gesture, if any. */
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  /** Whether the active gesture has been classified as horizontal. */
  const isHorizontal = useRef(false);

  /** Live horizontal drag offset used for finger-follow feedback. */
  const [drag, setDrag] = useState(0);

  /** Index of the current route within the ordered nav destinations. */
  const currentIndex = navRoutes.findIndex((r) => r.path === pathname);

  /** Previous route index, used to derive slide direction on change. */
  const prevIndexRef = useRef(currentIndex);

  // Derive the enter animation direction from index movement (covers both
  // swipes and bottom-nav taps). Defaults to "forward" for first paint.
  let direction: 'forward' | 'backward' = 'forward';
  if (currentIndex !== -1 && prevIndexRef.current !== -1) {
    direction = currentIndex >= prevIndexRef.current ? 'forward' : 'backward';
  }

  useEffect(() => {
    prevIndexRef.current = currentIndex;
  }, [currentIndex]);

  // Desktop or off-nav routes: render content as-is, no gestures or animation.
  if (!isMobile) {
    return <>{children}</>;
  }

  /**
   * Records the gesture origin.
   *
   * @param e - The touch start event.
   */
  const handleTouchStart = (e: TouchEvent<HTMLDivElement>): void => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
    isHorizontal.current = false;
  };

  /**
   * Classifies the gesture and updates the live drag offset for horizontal
   * swipes. Vertical-dominant gestures are ignored to preserve scrolling.
   *
   * @param e - The touch move event.
   */
  const handleTouchMove = (e: TouchEvent<HTMLDivElement>): void => {
    if (!touchStart.current) return;
    const t = e.touches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;

    if (!isHorizontal.current) {
      // Wait for a small commitment before locking the gesture axis.
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      isHorizontal.current = Math.abs(dx) > Math.abs(dy);
    }

    if (isHorizontal.current) {
      setDrag(dx);
    }
  };

  /**
   * Commits or cancels the gesture: navigates to the adjacent route when the
   * drag exceeds {@link SWIPE_THRESHOLD} and an adjacent route exists.
   */
  const handleTouchEnd = (): void => {
    const dx = drag;
    setDrag(0);
    touchStart.current = null;
    isHorizontal.current = false;

    if (currentIndex === -1) return;

    if (dx <= -SWIPE_THRESHOLD && currentIndex < navRoutes.length - 1) {
      navigate(navRoutes[currentIndex + 1].path);
    } else if (dx >= SWIPE_THRESHOLD && currentIndex > 0) {
      navigate(navRoutes[currentIndex - 1].path);
    }
  };

  return (
    <div
      className={classes.viewport}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        // Keying on pathname remounts the page so the enter animation replays.
        key={pathname}
        className={`${classes.page} ${
          direction === 'forward' ? classes.enterForward : classes.enterBackward
        }`}
        // While dragging, follow the finger; cleared on navigation/snap-back.
        style={drag ? { transform: `translateX(${drag}px)`, animation: 'none' } : undefined}
      >
        {children}
      </div>
    </div>
  );
}