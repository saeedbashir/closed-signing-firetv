/**
 * Preferences coming back from storage.
 *
 * Tested because this is the boundary the product's premise crosses. The
 * layout is "remembered" only if what storage hands back is turned into a
 * usable preferences object every time — including after an update that added
 * a field, and including when the stored value is garbage.
 */
import { DEFAULT_PREFERENCES, fromStored } from '../src/state/preferences';

describe('nothing stored yet', () => {
  it.each([null, undefined, 'x', 42, [], true])('gives the defaults for %p', (raw) => {
    expect(fromStored(raw)).toEqual(DEFAULT_PREFERENCES);
  });

  it('never shares the default watchPositions object', () => {
    const a = fromStored(null);
    a.watchPositions['t'] = 5;
    expect(DEFAULT_PREFERENCES.watchPositions).toEqual({});
  });
});

describe('a value this build wrote', () => {
  it('round-trips every field', () => {
    const stored = {
      signerVisible: false,
      signerCorner: 'top-left',
      signerSize: 'large',
      signerOpacity: 'medium',
      signerAutoDim: true,
      captionMode: 'simplified',
      captionSize: 'small',
      reduceMotion: true,
      walkthroughSeen: true,
      watchPositions: { a: 60000, b: 1234 },
    };
    expect(fromStored(stored)).toEqual(stored);
  });
});

describe('a value an older build wrote', () => {
  it('starts missing fields at their defaults and keeps the rest', () => {
    const p = fromStored({ signerCorner: 'top-right', walkthroughSeen: true });
    expect(p.signerCorner).toBe('top-right');
    expect(p.walkthroughSeen).toBe(true);
    expect(p.signerSize).toBe(DEFAULT_PREFERENCES.signerSize);
    expect(p.captionMode).toBe(DEFAULT_PREFERENCES.captionMode);
  });
});

describe('a value that is wrong', () => {
  it('replaces one bad field without touching the good ones', () => {
    const p = fromStored({ signerCorner: 'middle', signerSize: 'large', reduceMotion: 'yes' });
    expect(p.signerCorner).toBe(DEFAULT_PREFERENCES.signerCorner);
    expect(p.signerSize).toBe('large');
    expect(p.reduceMotion).toBe(DEFAULT_PREFERENCES.reduceMotion);
  });

  it('drops watch positions that are not non-negative numbers, as a whole', () => {
    // One poisoned entry would otherwise make every resume computation NaN.
    expect(fromStored({ watchPositions: { a: 5, b: 'x' } }).watchPositions).toEqual({});
    expect(fromStored({ watchPositions: { a: -1 } }).watchPositions).toEqual({});
    expect(fromStored({ watchPositions: [1, 2] }).watchPositions).toEqual({});
  });

  it('ignores fields it does not know', () => {
    const p = fromStored({ ...DEFAULT_PREFERENCES, future: 'thing' });
    expect(p).toEqual(DEFAULT_PREFERENCES);
    expect('future' in p).toBe(false);
  });
});
