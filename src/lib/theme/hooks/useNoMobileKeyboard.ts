import { useMediaQuery } from '@mantine/hooks';

/**
 * Returns input props that suppress the on-screen virtual keyboard on touch
 * devices while leaving desktop (physical-keyboard) behavior untouched.
 *
 * Detection is based on `(pointer: coarse)`, which matches touch-primary
 * devices (phones/tablets) rather than viewport width, so a narrow desktop
 * window is unaffected.
 *
 * Spread the result onto Mantine `Select`, `MultiSelect`, `TextInput`, or a
 * `Combobox` target's `InputBase`.
 *
 * @returns `{ inputMode: 'none' }` on touch devices, otherwise an empty object.
 *
 * @example
 * const kbProps = useNoMobileKeyboard();
 * <Select label="Project" data={projects} {...kbProps} />;
 */
export function useNoMobileKeyboard(): { inputMode?: 'none' } {
  const isTouch = useMediaQuery('(pointer: coarse)');
  return isTouch ? { inputMode: 'none' } : {};
}