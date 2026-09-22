/**
 * Viewer preferences: the signer layout, caption mode, and where they got to.
 *
 * The premise of the product is that a viewer sets their layout once and it
 * stays set, so this is the store that matters most. If someone has to place
 * the interpreter again every time they press play, we have built a demo.
 */
import { captionSize, signerCorners, signerOpacity, signerSize } from '../design/tokens';
import type { CaptionSize, SignerCorner, SignerOpacity, SignerSize } from '../design/tokens';

export type CaptionMode = 'off' | 'verbatim' | 'simplified';

export type Preferences = {
  signerVisible: boolean;
  signerCorner: SignerCorner;
  signerSize: SignerSize;
  signerOpacity: SignerOpacity;
  /**
   * Fade the interpreter while they are not signing, from the manifest's
   * activity track. Opt-in and off by default: an untested assumption about
   * what signing viewers want, and the submission says so.
   */
  signerAutoDim: boolean;
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
  signerAutoDim: false,
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

/** The key the whole preferences object is stored under. */
export const PREFERENCES_KEY = 'preferences';

const CAPTION_MODES: readonly CaptionMode[] = ['off', 'verbatim', 'simplified'];

const oneOf =
  <T extends string>(values: readonly T[]) =>
  (v: unknown): v is T =>
    typeof v === 'string' && (values as readonly string[]).includes(v);

const isBoolean = (v: unknown): v is boolean => typeof v === 'boolean';

const isPositions = (v: unknown): v is Record<string, number> =>
  typeof v === 'object' &&
  v !== null &&
  !Array.isArray(v) &&
  Object.values(v).every((n) => typeof n === 'number' && Number.isFinite(n) && n >= 0);

/**
 * Preferences from whatever storage handed back.
 *
 * Storage is untrusted: the value may be missing, may have been written by an
 * older build with fewer fields, may have been written by a newer one with a
 * value this build does not know, or may be plain garbage. Every field is
 * checked on its own and falls back to its default on its own, so one bad
 * field costs one preference rather than all of them — and a preference added
 * in a later build simply starts at its default for a viewer who upgraded.
 *
 * This is the boundary that makes "your layout is remembered" survive an
 * update, which is the moment it is most likely to be quietly lost.
 */
export function fromStored(raw: unknown): Preferences {
  const d = DEFAULT_PREFERENCES;
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { ...d, watchPositions: {} };
  }
  const r = raw as Record<string, unknown>;
  const pick = <K extends keyof Preferences>(
    key: K,
    ok: (v: unknown) => v is Preferences[K],
  ): Preferences[K] => {
    const v = r[key];
    return ok(v) ? v : d[key];
  };
  return {
    signerVisible: pick('signerVisible', isBoolean),
    signerCorner: pick('signerCorner', oneOf<SignerCorner>(signerCorners)),
    signerSize: pick('signerSize', oneOf(Object.keys(signerSize) as SignerSize[])),
    signerOpacity: pick('signerOpacity', oneOf(Object.keys(signerOpacity) as SignerOpacity[])),
    signerAutoDim: pick('signerAutoDim', isBoolean),
    captionMode: pick('captionMode', oneOf(CAPTION_MODES)),
    captionSize: pick('captionSize', oneOf(Object.keys(captionSize) as CaptionSize[])),
    reduceMotion: pick('reduceMotion', isBoolean),
    walkthroughSeen: pick('walkthroughSeen', isBoolean),
    watchPositions: isPositions(r.watchPositions) ? { ...r.watchPositions } : {},
  };
}
