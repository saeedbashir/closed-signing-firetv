/**
 * The bridge between the design and the screen.
 *
 * The design is drawn against a 1080p television, because that is how
 * televisions are specified and how anyone discussing this work will describe
 * it. React Native lays out in *logical* pixels, which are not the same thing:
 * the Vega Virtual Device reports a 960x540 window at scale 2 for a 1920x1080
 * panel, so a token written as 96 became 192 real pixels and every layout came
 * out at double size. Measured on device 2026-09-22 — the walkthrough overflowed
 * the screen and clipped its own buttons, and no test could have caught it
 * because the tests check the arithmetic against the same wrong constant.
 *
 * So: keep writing tokens in 1080p reference pixels, and pass every absolute
 * one through `px`. Values expressed as a *fraction* of the screen need no
 * conversion — a fraction of the logical width is already correct.
 *
 * Read once at module load. A television does not resize.
 */
import { Dimensions } from 'react-native';

/** The television the design is drawn against. */
export const REFERENCE = { width: 1920, height: 1080 } as const;

/**
 * React Native's logical window.
 *
 * Falls back to the reference when the platform reports nothing useful, which
 * is what happens under Jest. That makes the test factor exactly 1, so tests
 * read in the same units the design is written in.
 */
export const SCREEN: { width: number; height: number } = (() => {
  const { width, height } = Dimensions.get('window');
  return width > 0 && height > 0 ? { width, height } : { ...REFERENCE };
})();

/** Logical pixels per reference pixel. 1 on a true 1080p surface, 0.5 at scale 2. */
export const FACTOR = SCREEN.width / REFERENCE.width;

/**
 * A reference-design pixel, in logical pixels for this screen.
 *
 * Rounded, because half-pixel borders and hairline gaps between adjacent
 * filled rectangles are visible on a television at two metres.
 */
export const px = (reference: number): number => Math.round(reference * FACTOR);
