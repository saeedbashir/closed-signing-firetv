/**
 * Choosing a caption track, and labelling it honestly.
 *
 * The provenance rule is the one worth guarding with tests: the project's
 * standing constraint is that no configuration may make machine-simplified
 * text look human-reviewed, and a silent regression here would be invisible
 * on screen precisely when it mattered.
 */
import { isUnreviewed, trackForMode } from '../src/stm/useCaptions';
import type { Caption } from '../src/stm/types';

const verbatim: Caption = {
  kind: 'verbatim',
  language: 'en',
  url: 'https://example.test/v.vtt',
  format: 'webvtt',
};

const simplified: Caption = {
  kind: 'simplified',
  language: 'en',
  url: 'https://example.test/s.vtt',
  format: 'webvtt',
  generatedBy: 'anthropic.claude-opus-5',
  reviewed: false,
};

describe('choosing a track', () => {
  it('returns nothing when captions are off', () => {
    expect(trackForMode([verbatim, simplified], 'off')).toBeNull();
  });

  it('returns the track matching the mode', () => {
    expect(trackForMode([verbatim, simplified], 'verbatim')).toBe(verbatim);
    expect(trackForMode([verbatim, simplified], 'simplified')).toBe(simplified);
  });

  it('falls back to verbatim when simplified was asked for and does not exist', () => {
    // Some text beats none, and the caller can tell from the track's own kind.
    expect(trackForMode([verbatim], 'simplified')).toBe(verbatim);
  });

  it('returns nothing when the title has no captions at all', () => {
    expect(trackForMode([], 'verbatim')).toBeNull();
  });
});

describe('labelling machine-generated text', () => {
  it('marks a generated, unreviewed track', () => {
    expect(isUnreviewed(simplified)).toBe(true);
  });

  it('does not mark human captions', () => {
    expect(isUnreviewed(verbatim)).toBe(false);
    expect(isUnreviewed(null)).toBe(false);
  });

  it('marks a generated track whose reviewed flag is missing entirely', () => {
    // Absence is not review. A manifest that omits the field must not read as
    // checked.
    const withoutFlag: Caption = {
      kind: 'simplified',
      language: 'en',
      url: 'https://example.test/s.vtt',
      format: 'webvtt',
      generatedBy: 'anthropic.claude-opus-5',
    };
    expect(isUnreviewed(withoutFlag)).toBe(true);
  });

  it('stops marking only when a track is explicitly reviewed', () => {
    expect(isUnreviewed({ ...simplified, reviewed: true, reviewedBy: 'A. Person' })).toBe(false);
  });

  it('does not treat a truthy-but-not-true reviewed value as reviewed', () => {
    // Guards the loose-equality mistake: only `true` counts.
    expect(isUnreviewed({ ...simplified, reviewed: 1 as unknown as boolean })).toBe(true);
  });
});
