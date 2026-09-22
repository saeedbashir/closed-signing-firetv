/**
 * The end of the programme.
 *
 * Tested because the first version of this shipped nothing at all: `ended` was
 * read straight off the player, the player never set it, and the symptom was a
 * viewer sitting in front of a frozen last frame. Nothing threw.
 */
import { END_EPSILON_S, hasFinished, playbackDuration } from '../src/playback';

describe('which duration to measure against', () => {
  it('prefers the player, which describes the file actually playing', () => {
    expect(playbackDuration(118.5, 120_000)).toBe(118.5);
  });

  it('falls back to the manifest before metadata arrives', () => {
    expect(playbackDuration(NaN, 120_000)).toBe(120);
  });

  it('falls back for a stream of unknown length', () => {
    expect(playbackDuration(Infinity, 120_000)).toBe(120);
    expect(playbackDuration(0, 120_000)).toBe(120);
  });

  it('reports nothing rather than guessing when neither is known', () => {
    expect(playbackDuration(NaN, 0)).toBe(0);
  });
});

describe('whether the programme has finished', () => {
  const at = (currentTime: number, endedFlag = false) =>
    hasFinished({ currentTime, duration: 120, endedFlag });

  it('is not finished in the middle', () => {
    expect(at(60)).toBe(false);
  });

  it('is finished at the declared duration', () => {
    expect(at(120)).toBe(true);
  });

  it('is finished a little short of it, because the last sample usually is', () => {
    expect(at(120 - END_EPSILON_S / 2)).toBe(true);
  });

  it('is not finished a second short of it', () => {
    expect(at(119)).toBe(false);
  });

  it('believes the flag even when the position disagrees', () => {
    // A stream whose declared duration is longer than what actually arrived.
    expect(at(90, true)).toBe(true);
  });

  it('does not guess with no duration to compare against', () => {
    // Before metadata arrives, currentTime is 0 and so is duration. Saying
    // "finished" here would put the end panel over a title that never started.
    expect(hasFinished({ currentTime: 0, duration: 0, endedFlag: false })).toBe(false);
  });

  it('is not finished at the start of a title the viewer is resuming', () => {
    expect(at(0)).toBe(false);
  });
});
