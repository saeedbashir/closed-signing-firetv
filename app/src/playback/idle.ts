/**
 * Is the interpreter idle right now?
 *
 * The manifest says how much they moved, second by second; this decides what
 * to do about it. Kept as arithmetic on media positions, separate from the
 * player, because the two things that would make this feature unusable — a
 * layer that flickers at the threshold, and one that stays dim while someone
 * is signing — are both timing rules, and timing rules are testable only when
 * nothing else is in the room.
 *
 * The rule is asymmetric on purpose. Going idle takes two seconds under the
 * threshold: a pause between phrases is not idleness. Coming back takes half a
 * second over it: a missed sign is the failure that matters, so the layer
 * returns the moment there is real motion and not before. Both are measured in
 * media time, so a paused programme neither dims nor restores, and a seek
 * starts the count again where the viewer landed.
 *
 * The producer publishes the number; the threshold is ours. The same
 * principle as `confidence`, and for the same reason: no fixed motion scale
 * means the same thing across two broadcasters, and whether viewers want this
 * at all is an open question the format should not have to answer.
 */
import type { Activity } from '../stm/types';

export type IdleRule = {
  /** Under this (of 100) counts as idle. */
  threshold: number;
  /** Media time under the threshold before the layer dims. */
  idleAfterMs: number;
  /** Media time at or over the threshold before it restores. */
  activeAfterMs: number;
};

export const DEFAULT_IDLE_RULE: IdleRule = { threshold: 20, idleAfterMs: 2000, activeAfterMs: 500 };

/**
 * A position jump larger than this is a seek, not playback. The transport
 * skips ten seconds; the poll is half a second; three seconds tells them apart
 * with room for a stall.
 */
export const SEEK_JUMP_MS = 3000;

/** The activity value covering a position. 0 before the start; the last value past the end. */
export function activityAt(activity: Activity, positionMs: number): number {
  if (positionMs < 0 || activity.values.length === 0) return 0;
  const i = Math.floor(positionMs / activity.intervalMs);
  return activity.values[Math.min(i, activity.values.length - 1)] ?? 0;
}

export class IdleDetector {
  private idle = false;
  /** Where the current run of samples disagreeing with `idle` began, or null. */
  private runStart: number | null = null;
  private last: number | null = null;

  constructor(
    private readonly activity: Activity,
    private readonly rule: IdleRule = DEFAULT_IDLE_RULE,
  ) {}

  /** Whether the layer is currently dimmed. */
  get isIdle(): boolean {
    return this.idle;
  }

  /** Feed the playhead. Returns whether the layer should be dimmed now. */
  update(positionMs: number): boolean {
    const under = activityAt(this.activity, positionMs) < this.rule.threshold;
    const jumped =
      this.last !== null &&
      (positionMs < this.last || positionMs - this.last > SEEK_JUMP_MS);
    this.last = positionMs;

    if (jumped) {
      // Wherever the viewer landed, judge it fresh. Restoring is immediate —
      // the viewer chose this moment and may have chosen it to watch the
      // signer — while dimming still has to earn its two seconds.
      this.runStart = null;
      if (this.idle && !under) this.idle = false;
    }

    if (under === this.idle) {
      this.runStart = null;
      return this.idle;
    }
    if (this.runStart === null) this.runStart = positionMs;
    const needed = this.idle ? this.rule.activeAfterMs : this.rule.idleAfterMs;
    if (positionMs - this.runStart >= needed) {
      this.idle = under;
      this.runStart = null;
    }
    return this.idle;
  }

  /** Forget everything, as when a title is replayed from the start. */
  reset(): void {
    this.idle = false;
    this.runStart = null;
    this.last = null;
  }
}
