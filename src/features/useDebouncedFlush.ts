// /**
//  * @file Flush coordinator for form → store commits. Provides a 500ms debounce
//  * fallback (for users who navigate away without blurring), an immediate
//  * `flushNow` (blur), and an automatic flush on unmount (route unload).
//  */
// import { useCallback, useEffect, useRef } from 'react';

// /** Default debounce window before an idle keystroke buffer is flushed. */
// const DEFAULT_DELAY_MS = 500;

// /**
//  * Wraps a `flush` callback with debounce + immediate + unmount semantics.
//  *
//  * @param flush - Commits buffered form values to the store.
//  * @param delay - Debounce window in ms (defaults to 500).
//  * @returns `schedule` (debounced), `flushNow` (immediate), `cancel`.
//  */
// export function useDebouncedFlush(flush: () => void, delay = DEFAULT_DELAY_MS) {
//   // Keep the latest closure so timers always run current logic.
//   const flushRef = useRef(flush);
//   flushRef.current = flush;

//   const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

//   const cancel = useCallback(() => {
//     if (timer.current) {
//       clearTimeout(timer.current);
//       timer.current = null;
//     }
//   }, []);

//   const schedule = useCallback(() => {
//     cancel();
//     timer.current = setTimeout(() => {
//       timer.current = null;
//       flushRef.current();
//     }, delay);
//   }, [cancel, delay]);

//   const flushNow = useCallback(() => {
//     cancel();
//     flushRef.current();
//   }, [cancel]);

//   // Route unload: flush anything still pending.
//   useEffect(
//     () => () => {
//       if (timer.current) {
//         clearTimeout(timer.current);
//         flushRef.current();
//       }
//     },
//     [],
//   );

//   return { schedule, flushNow, cancel };
// }