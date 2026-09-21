/**
 * Viewer preferences: the signer layout, caption mode, and where they got to.
 *
 * The premise of the product is that a viewer sets their layout once and it
 * stays set, so this is the store that matters most. If someone has to place
 * the interpreter again every time they press play, we have built a demo.
 */
import type { CaptionSize } from '../design/tokens';
import type { SignerCorner, SignerOpacity, SignerSize } from '../design/tokens';

export type CaptionMode = 'off' | 'verbatim' | 'simplified';

export type Preferences = {
  signerVisible: boolean;
  signerCorner: SignerCorner;
  signerSize: SignerSize;
  signerOpacity: SignerOpacity;
  captionMode: CaptionMode;
  captionSize: CaptionSize;
  /** Makes every transition instant. An accessibility setting, not a toggle for taste. */
  reduceMotion: boolean;
  /** Shown once; re-openable from Settings. */
  walkthroughSeen: boolean;
  /** Title id to playback position in ms. */
  watchPositions: Record<string, number>;
};

export const DEFAULT_PREFERENCES: Preferences = {
  signerVisible: true,
  signerCorner: 'bottom-right',
  signerSize: 'medium',
  signerOpacity: 'full',
  captionMode: 'off',
  captionSize: 'medium',
  reduceMotion: false,
  walkthroughSeen: false,
  watchPositions: {},
};

/**
 * Defaults worth stating plainly, because they are assumptions we have not
 * tested with deaf viewers and the submission should say so:
 * bottom-right, medium, fully opaque, captions off. Whether anyone wants
 * captions and signing simultaneously is genuinely unknown to us.
 */

export type PreferencesPatch = Partial<Omit<Preferences, 'watchPositions'>>;

export function applyPatch(prefs: Preferences, patch: PreferencesPatch): Preferences {
  return { ...prefs, ...patch };
}

export function rememberPosition(
  prefs: Preferences,
  titleId: string,
  positionMs: number,
  durationMs: number,
): Preferences {
  // Near the end counts as finished: resuming into the last few seconds is
  // worse than starting over.
  const finished = durationMs > 0 && positionMs > durationMs - 15000;
  const next = { ...prefs.watchPositions };
  if (finished || positionMs < 5000) {
    delete next[titleId];
  } else {
    next[titleId] = Math.round(positionMs);
  }
  return { ...prefs, watchPositions: next };
}

export function resumePosition(prefs: Preferences, titleId: string): number {
  return prefs.watchPositions[titleId] ?? 0;
}

/** Cycle a value through an ordered list, for Left/Right on a control row. */
export function cycle<T>(values: readonly T[], current: T, delta: number): T {
  const i = values.indexOf(current);
  const at = i < 0 ? 0 : i;
  const next = (at + delta + values.length) % values.length;
  return values[next] as T;
}
