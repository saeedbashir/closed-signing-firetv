/**
 * The signer and caption placement arithmetic.
 *
 * Worth testing properly: captions colliding with the interpreter is the
 * failure that would make both layers useless at once, and it is invisible
 * until someone picks the one corner combination that breaks.
 */
import { captionPlacement, signerBox, SCREEN } from '../src/design/geometry';
import { safeArea, signerSize } from '../src/design/tokens';
import {
  DEFAULT_PREFERENCES,
  cycle,
  rememberPosition,
  resumePosition,
} from '../src/state/preferences';
import { signerCorners } from '../src/design/tokens';
import { currentRoute, initialNav, navReduce } from '../src/navigation/routes';
import { formatDuration, humanSignTracks, isLowConfidence } from '../src/stm/types';
import type { SignTrack, TitleManifest } from '../src/stm/types';

describe('signer placement', () => {
  it.each(signerCorners)('keeps the %s corner inside the safe area', (corner) => {
    const box = signerBox(corner, 'large', 1.1);
    expect(box.left).toBeGreaterThanOrEqual(safeArea.horizontal);
    expect(box.top).toBeGreaterThanOrEqual(safeArea.vertical);
    expect(box.left + box.width).toBeLessThanOrEqual(SCREEN.width - safeArea.horizontal);
    expect(box.top + box.height).toBeLessThanOrEqual(SCREEN.height - safeArea.vertical);
  });

  it('sizes to the fraction of screen width the spec gives', () => {
    expect(signerBox('bottom-right', 'small', 1).width).toBe(
      Math.round(SCREEN.width * signerSize.small),
    );
    expect(signerBox('bottom-right', 'large', 1).width).toBe(
      Math.round(SCREEN.width * signerSize.large),
    );
  });

  it('takes its height from the crop, not a fixed ratio', () => {
    const wide = signerBox('bottom-right', 'medium', 2);
    const tall = signerBox('bottom-right', 'medium', 0.5);
    expect(wide.height).toBeLessThan(wide.width);
    expect(tall.height).toBeGreaterThan(tall.width);
  });
});

describe('caption placement', () => {
  it('sits bottom-centre when there is no signer', () => {
    const p = captionPlacement(null);
    expect(p.bottom).toBe(safeArea.vertical);
    expect(p.left).toBe(safeArea.horizontal);
    expect(p.right).toBe(safeArea.horizontal);
  });

  it('is unaffected by a signer in a top corner', () => {
    const p = captionPlacement(signerBox('top-right', 'large', 1));
    expect(p).toEqual(captionPlacement(null));
  });

  it.each(['bottom-left', 'bottom-right'] as const)(
    'never overlaps a signer in the %s corner',
    (corner) => {
      const box = signerBox(corner, 'medium', 1.1);
      const p = captionPlacement(box);
      const captionLeft = p.left;
      const captionRight = SCREEN.width - p.right;
      const captionTop = SCREEN.height - p.bottom - 60;
      const horizontallyClear = captionRight <= box.left || captionLeft >= box.left + box.width;
      const verticallyClear = captionTop + 60 <= box.top;
      expect(horizontallyClear || verticallyClear).toBe(true);
    },
  );

  it('moves above the signer when shifting sideways leaves too little room', () => {
    const huge = { left: 200, top: 700, width: 1500, height: 300 };
    const p = captionPlacement(huge);
    expect(p.bottom).toBeGreaterThan(SCREEN.height - huge.top - 1);
  });
});

describe('preferences', () => {
  it('cycles a control both ways and wraps', () => {
    expect(cycle(signerCorners, 'top-left', 1)).toBe('top-right');
    expect(cycle(signerCorners, 'top-left', -1)).toBe('bottom-left');
  });

  it('remembers a position mid-title', () => {
    const p = rememberPosition(DEFAULT_PREFERENCES, 'a', 60000, 600000);
    expect(resumePosition(p, 'a')).toBe(60000);
  });

  it('forgets a position near the end, so Resume never lands on the credits', () => {
    const p = rememberPosition(DEFAULT_PREFERENCES, 'a', 595000, 600000);
    expect(resumePosition(p, 'a')).toBe(0);
  });

  it('forgets a position in the first few seconds', () => {
    const p = rememberPosition(DEFAULT_PREFERENCES, 'a', 2000, 600000);
    expect(resumePosition(p, 'a')).toBe(0);
  });
});

describe('navigation', () => {
  it('pushes and pops', () => {
    let s = navReduce(initialNav, { type: 'replace', route: { name: 'home' } });
    s = navReduce(s, { type: 'push', route: { name: 'detail', titleId: 'x' } });
    expect(currentRoute(s)).toEqual({ name: 'detail', titleId: 'x' });
    s = navReduce(s, { type: 'back' });
    expect(currentRoute(s)).toEqual({ name: 'home' });
  });

  it('refuses to pop the last route, so Back at the root is the screen to handle', () => {
    const s = navReduce(initialNav, { type: 'back' });
    expect(s.stack).toHaveLength(1);
  });
});

describe('manifest reading', () => {
  const track = (provenance: SignTrack['provenance']): SignTrack => ({
    language: 'ase',
    languageLabel: 'American Sign Language',
    provenance,
    ...(provenance === 'synthesised' ? { generatedBy: 'an avatar' } : {}),
    track: { url: 's.mp4', width: 400, height: 360, codec: 'h264', syncOffsetMs: 0 },
  });

  it('never surfaces a synthesised track', () => {
    const m = { signLanguage: [track('human-interpreter'), track('synthesised')] } as TitleManifest;
    const shown = humanSignTracks(m);
    expect(shown).toHaveLength(1);
    expect(shown[0]?.provenance).toBe('human-interpreter');
  });

  it('flags low confidence at the documented threshold', () => {
    expect(isLowConfidence({ confidence: 0.69 })).toBe(true);
    expect(isLowConfidence({ confidence: 0.7 })).toBe(false);
    expect(isLowConfidence({})).toBe(false);
  });

  it('formats durations for a TV audience', () => {
    expect(formatDuration(65000)).toBe('1:05');
    expect(formatDuration(3_900_000)).toBe('1h 05m');
  });
});
