/**
 * Design tokens for a 1920x1080 canvas, viewed from about three metres and
 * operated with a five-button remote.
 *
 * Scale proportionally for 4K. Every value here is from the implementation
 * spec's design system; nothing is invented at the component level.
 */

/**
 * Colour.
 *
 * Amber on near-black gives roughly 11:1 contrast and stays distinguishable
 * across the common colour vision deficiencies. It is chosen deliberately over
 * the blue accent TV apps default to, because blue-on-dark is the worst case
 * for both contrast and deuteranopia — and this app is used by people who may
 * be relying on it for access rather than convenience.
 */
export const colour = {
  bgBase: '#0B0F14',
  bgSurface: '#151C24',
  bgRaised: '#1F2933',
  borderSubtle: '#2E3A47',
  textPrimary: '#F2F5F7',
  textSecondary: '#A3B1BF',
  accent: '#FFB020',
  accentPressed: '#E09400',
  onAccent: '#0B0F14',
  stateGood: '#3DDC97',
  stateWarn: '#FF8A5B',
  stateError: '#FF6B6B',
  captionBg: 'rgba(0, 0, 0, 0.75)',
  captionText: '#FFFFFF',
} as const;

/**
 * Typography. 24px is the floor and nothing smaller ships.
 *
 * Inter is bundled rather than relying on the system font being Amazon Ember.
 * It is under the SIL Open Font License, so it is safe to ship.
 */
import { px } from './scale';

export const type = {
  screenTitle: { fontSize: px(48), fontWeight: '700', lineHeight: px(58) },
  sectionHeading: { fontSize: px(34), fontWeight: '600', lineHeight: px(44) },
  cardTitle: { fontSize: px(26), fontWeight: '500', lineHeight: px(35) },
  body: { fontSize: px(24), fontWeight: '400', lineHeight: px(35) },
  metadata: { fontSize: px(20), fontWeight: '400', lineHeight: px(28) },
  caption: { fontSize: px(40), fontWeight: '500', lineHeight: px(54) },
} as const;

/** Viewer-adjustable caption sizes. */
export const captionSize = { small: px(32), medium: px(40), large: px(52) } as const;
export type CaptionSize = keyof typeof captionSize;

/** 8px base unit. All spacing is a multiple of it. */
export const space = (n: number): number => px(n * 8);

/** Nothing interactive or legible sits outside the safe area. */
export const safeArea = { horizontal: px(96), vertical: px(54) } as const;

export const layout = {
  card: { width: px(320), height: px(180) },
  railGutter: px(32),
  railTitleGap: px(24),
  overlayPanelWidth: px(480),
  overlayPadding: px(32),
  overlayRadius: px(24),
} as const;

/**
 * Focus. The single most important visual system in a TV app.
 *
 * A focused element changes in four ways at once, deliberately: a viewer with
 * reduced colour perception must still see the scale and brightness change
 * when the amber ring means nothing to them. Never signal with colour alone.
 */
export const focus = {
  ringWidth: px(4),
  ringOffset: px(4),
  scale: 1.06,
  durationMs: 150,
} as const;

/** All transitions 150–250ms, ease-out. Reduce-motion makes them instant. */
export const motion = {
  fast: 150,
  standard: 220,
  slow: 250,
  /** The signer animates between corners rather than jumping, so the eye can follow. */
  signerMove: 220,
  /** Transport controls fade after this much inactivity. */
  chromeIdleMs: 4000,
} as const;

/** Signer layer geometry, as a fraction of screen width. */
export const signerSize = { small: 0.12, medium: 0.2, large: 0.28 } as const;
export type SignerSize = keyof typeof signerSize;

export const signerOpacity = { full: 1, high: 0.85, medium: 0.7 } as const;
export type SignerOpacity = keyof typeof signerOpacity;

export type SignerCorner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
export const signerCorners: readonly SignerCorner[] = [
  'top-left',
  'top-right',
  'bottom-right',
  'bottom-left',
] as const;

/** Inset from the safe area edge, in the chosen corner. */
export const signerInset = px(48);
