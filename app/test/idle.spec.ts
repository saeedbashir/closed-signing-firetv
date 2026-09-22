/**
 * The idle rule. Tested hard because both failure modes are silent on device:
 * a layer that flickers at the threshold, and one that stays dim while someone
 * is signing. Every case here is a sequence of playhead positions and the
 * answer the layer should give at each.
 */
import { DEFAULT_IDLE_RULE, IdleDetector, SEEK_JUMP_MS, activityAt } from '../src/playback/idle';
import type { Activity } from '../src/stm/types';

const track = (values: number[], intervalMs = 1000): Activity => ({
  intervalMs,
  scale: 'title-p95',
  values,
});

/** Feed positions at a 500 ms poll and collect the answers. */
const run = (d: IdleDetector, fromMs: number, toMs: number, step = 500): boolean[] => {
  const out: boolean[] = [];
  for (let t = fromMs; t <= toMs; t += step) out.push(d.update(t));
  return out;
};

describe('activityAt', () => {
  const a = track([10, 20, 30]);
  it('reads the value covering the position', () => {
    expect(activityAt(a, 0)).toBe(10);
    expect(activityAt(a, 999)).toBe(10);
    expect(activityAt(a, 1000)).toBe(20);
  });
  it('is 0 before the start and holds the last value past the end', () => {
    expect(activityAt(a, -1)).toBe(0);
    expect(activityAt(a, 2500)).toBe(30);
    expect(activityAt(a, 99_000)).toBe(30);
  });
  it('honours the interval', () => {
    expect(activityAt(track([5, 90], 5000), 4999)).toBe(5);
    expect(activityAt(track([5, 90], 5000), 5000)).toBe(90);
  });
  it('is 0 for an empty track', () => {
    expect(activityAt(track([]), 0)).toBe(0);
  });
});

describe('going idle', () => {
  it('starts active and dims only after two seconds under the threshold', () => {
    const d = new IdleDetector(track([0, 0, 0, 0, 0]));
    // 0, 500, 1000, 1500 are under two seconds of evidence; 2000 is not.
    expect(run(d, 0, 2000)).toEqual([false, false, false, false, true]);
  });

  it('does not dim for a pause between phrases', () => {
    // 1.5 s under the threshold, then signing again.
    const d = new IdleDetector(track([90, 5, 90, 90]));
    expect(run(d, 0, 3500)).toEqual([false, false, false, false, false, false, false, false]);
  });

  it('treats the threshold itself as active', () => {
    const d = new IdleDetector(track([20, 20, 20, 20]));
    expect(run(d, 0, 3000).some(Boolean)).toBe(false);
  });
});

describe('coming back', () => {
  it('restores after half a second of motion, faster than it dims', () => {
    const d = new IdleDetector(track([0, 0, 0, 90, 90]));
    run(d, 0, 2500);
    expect(d.isIdle).toBe(true);
    expect(d.update(3000)).toBe(true); // first active sample: not yet
    expect(d.update(3500)).toBe(false); // half a second: back
  });

  it('a single active blip does not restore', () => {
    // One 500 ms sample over the threshold inside a long idle stretch.
    const d = new IdleDetector(track([0, 0, 0, 0, 0, 0], 500));
    run(d, 0, 2500);
    expect(d.isIdle).toBe(true);
    const spiky = new IdleDetector(track([0, 0, 0, 0, 0, 90, 0, 0], 500));
    run(spiky, 0, 2000);
    expect(spiky.isIdle).toBe(true);
    expect(spiky.update(2500)).toBe(true); // the blip: run starts
    expect(spiky.update(3000)).toBe(true); // 500 ms later the sample is under again: run abandoned
    expect(spiky.isIdle).toBe(true);
  });

  it(`the asymmetry is the rule: ${DEFAULT_IDLE_RULE.idleAfterMs} in, ${DEFAULT_IDLE_RULE.activeAfterMs} out`, () => {
    expect(DEFAULT_IDLE_RULE.idleAfterMs).toBeGreaterThan(DEFAULT_IDLE_RULE.activeAfterMs);
  });
});

describe('seeking', () => {
  it('a jump into signing restores immediately', () => {
    const values = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 90, 90, 90];
    const d = new IdleDetector(track(values));
    run(d, 0, 3000);
    expect(d.isIdle).toBe(true);
    expect(d.update(3000 + SEEK_JUMP_MS + 7500)).toBe(false); // landed at 13.5 s: active
  });

  it('a jump into stillness starts the two seconds again', () => {
    const values = [90, 90, 0, 0, 0, 0, 0, 0, 0, 0];
    const d = new IdleDetector(track(values));
    run(d, 0, 1000);
    expect(d.isIdle).toBe(false);
    // Seek to 6 s (still). Not idle yet; needs its own two seconds.
    expect(run(d, 6000, 7500)).toEqual([false, false, false, false]);
    expect(d.update(8000)).toBe(true);
  });

  it('a backwards jump is a seek too', () => {
    const d = new IdleDetector(track([90, 90, 90, 0, 0, 0, 0]));
    run(d, 0, 2500);
    expect(d.isIdle).toBe(false);
    run(d, 3000, 5000); // 3.0..5.0 under: dims at 5.0
    expect(d.isIdle).toBe(true);
    expect(d.update(500)).toBe(false); // back to the start, where they are signing
  });

  it('pausing (no position change) neither dims nor restores', () => {
    const d = new IdleDetector(track([0, 0, 0, 0]));
    expect(d.update(1000)).toBe(false);
    for (let i = 0; i < 20; i += 1) expect(d.update(1000)).toBe(false);
  });
});

describe('reset', () => {
  it('forgets the state for a replay', () => {
    const d = new IdleDetector(track([0, 0, 0, 0]));
    run(d, 0, 2000);
    expect(d.isIdle).toBe(true);
    d.reset();
    expect(d.isIdle).toBe(false);
    expect(d.update(0)).toBe(false);
  });
});

describe('the shape of what ships', () => {
  it('the default rule is what the plan and the spec say', () => {
    expect(DEFAULT_IDLE_RULE).toEqual({ threshold: 20, idleAfterMs: 2000, activeAfterMs: 500 });
  });
});
