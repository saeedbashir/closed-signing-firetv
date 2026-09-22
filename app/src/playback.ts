/**
 * When is the programme over?
 *
 * Extracted from the player because the answer turned out not to be the
 * obvious one, and because it is the only part of the end-of-programme state
 * that can be checked without a television.
 *
 * The obvious answer is the media element's `ended` flag. On Vega it is not
 * enough: measured on device 2026-09-22, the transport bar read 2:00 of 2:00
 * with the progress bar full and the flag stayed false, so the panel never
 * appeared and the viewer was left on a frozen frame. The position is
 * therefore the primary signal and the flag corroborates it — whichever of the
 * two says the programme is over wins.
 */

/**
 * How close to the end counts as the end, in seconds.
 *
 * Generous on purpose. A frame is 40ms, but the last sample of a stream is
 * routinely a little short of the declared duration, and being a quarter of a
 * second early costs the viewer nothing — the picture is over either way.
 */
export const END_EPSILON_S = 0.4;

/**
 * The duration to measure against.
 *
 * The player's own figure is preferred because it describes the file actually
 * playing. It is NaN before metadata arrives and 0 or Infinity for a stream
 * whose length is not yet known, so the manifest is the fallback rather than
 * the other way round.
 */
export function playbackDuration(playerDuration: number, manifestDurationMs: number): number {
  if (Number.isFinite(playerDuration) && playerDuration > 0) return playerDuration;
  return manifestDurationMs > 0 ? manifestDurationMs / 1000 : 0;
}

/** Has playback reached the end of the programme? */
export function hasFinished(args: {
  currentTime: number;
  duration: number;
  endedFlag: boolean;
}): boolean {
  const { currentTime, duration, endedFlag } = args;
  if (endedFlag) return true;
  // With no duration there is nothing to compare against, and guessing would
  // put the panel over a programme that is still running.
  if (!(duration > 0)) return false;
  return currentTime >= duration - END_EPSILON_S;
}
