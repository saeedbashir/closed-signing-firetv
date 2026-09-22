/**
 * Whether to animate at all.
 *
 * `reduceMotion` was a setting that did nothing: Settings toggled it, the
 * preference persisted, `Focusable` even declared the prop — and nothing ever
 * passed it and nothing ever read it. An accessibility control that silently
 * has no effect is worse than not offering one, because the viewer who needed
 * it believes they have already dealt with the problem.
 *
 * Held as module state rather than threaded through every screen as a prop.
 * It is a device-wide setting that changes once in a blue moon, and passing it
 * down through five layers of components to reach a focus ring is how it came
 * to be forgotten in the first place.
 */
let reduced = false;

/** Set from the viewer's preferences, once, at the top of the app. */
export function setReduceMotion(value: boolean): void {
  reduced = value;
}

/** True when animation should be skipped entirely rather than shortened. */
export function prefersReducedMotion(): boolean {
  return reduced;
}
