/**
 * Which caption modes a title offers.
 *
 * The rule worth guarding: never offer a mode that does nothing. A viewer who
 * cycles onto "Simplified" and sees no change concludes the captions are
 * broken, not that the track is absent — and on a TV there is no other place
 * to look for an explanation.
 */
import { availableModes } from '../src/screens/CaptionMenu';
import { cycle } from '../src/state/preferences';
import type { Caption } from '../src/stm/types';

const track = (kind: 'verbatim' | 'simplified'): Caption => ({
  kind,
  language: 'en',
  url: `https://example.test/${kind}.vtt`,
  format: 'webvtt',
});

describe('modes a title can offer', () => {
  it('always offers off, even with no tracks at all', () => {
    expect(availableModes([])).toEqual(['off']);
  });

  it('offers verbatim when a verbatim track exists', () => {
    expect(availableModes([track('verbatim')])).toEqual(['off', 'verbatim']);
  });

  it('offers both when both exist, in a stable order', () => {
    expect(availableModes([track('simplified'), track('verbatim')])).toEqual([
      'off',
      'verbatim',
      'simplified',
    ]);
  });

  it('does not offer simplified merely because verbatim exists', () => {
    expect(availableModes([track('verbatim')])).not.toContain('simplified');
  });
});

describe('cycling stays inside what the title offers', () => {
  it('wraps between off and verbatim when that is all there is', () => {
    const modes = availableModes([track('verbatim')]);
    expect(cycle(modes, 'off', 1)).toBe('verbatim');
    expect(cycle(modes, 'verbatim', 1)).toBe('off');
  });

  it('never lands on simplified when no simplified track exists', () => {
    const modes = availableModes([track('verbatim')]);
    let mode = modes[0];
    for (let i = 0; i < 12; i += 1) {
      mode = cycle(modes, mode, 1);
      expect(mode).not.toBe('simplified');
    }
  });

  it('goes backwards as well, since Left and Right both change the value', () => {
    const modes = availableModes([track('verbatim'), track('simplified')]);
    expect(cycle(modes, 'off', -1)).toBe('simplified');
  });

  it('stays on off when the title has no captions, rather than going undefined', () => {
    const modes = availableModes([]);
    expect(cycle(modes, 'off', 1)).toBe('off');
    expect(cycle(modes, 'off', -1)).toBe('off');
  });
});
